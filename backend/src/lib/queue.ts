import { DataSource, In, Repository, LessThan } from "typeorm";
import { Task, TaskStatus, TaskType } from "../entity/Task";

export class QueueService {
  private taskRepo: Repository<Task>;
  private locks: Map<string, Date>;

  constructor(dataSource: DataSource) {
    this.taskRepo = dataSource.getRepository(Task);
    this.locks = new Map();
  }

  async publish(task: Task) {
    task.options = this.validateTaskOptions(task.type, task.options);
    await this.publishSql("VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)", [
      task.type,
      task.site ? task.site.id : task.siteId,
      task.measurementDate,
      task.product ? task.product.id : task.productId,
      task.instrumentInfo ? task.instrumentInfo.uuid : task.instrumentInfoUuid,
      task.model ? task.model.id : task.modelId,
      TaskStatus.CREATED,
      task.priority,
      task.scheduledAt.toISOString(),
      task.batchId || null,
      task.options,
    ]);
  }

  async publishSql(valuesSql: string, parameters?: any[]) {
    return this.taskRepo.query(
      `INSERT INTO task (
         "type",
         "siteId",
         "measurementDate",
         "productId",
         "instrumentInfoUuid",
         "modelId",
         "status",
         "priority",
         "scheduledAt",
         "batchId",
         "options"
       )
       ${valuesSql}
       ON CONFLICT (
         "type",
         "siteId",
         "measurementDate",
         "productId",
         "instrumentInfoUuid",
         "modelId",
         "options"
       )
       DO UPDATE SET
         priority = LEAST(task.priority, EXCLUDED.priority),
         status = CASE
           WHEN task.status = '${TaskStatus.CREATED}' THEN '${TaskStatus.CREATED}'::task_status_enum
           WHEN task.status = '${TaskStatus.RUNNING}' THEN '${TaskStatus.RESTART}'::task_status_enum
           WHEN task.status = '${TaskStatus.RESTART}' THEN '${TaskStatus.RESTART}'::task_status_enum
           WHEN task.status = '${TaskStatus.FAILED}'  THEN '${TaskStatus.CREATED}'::task_status_enum
           WHEN task.status = '${TaskStatus.DONE}'    THEN '${TaskStatus.CREATED}'::task_status_enum
         END,
         "scheduledAt" = CASE
           WHEN task.status = '${TaskStatus.DONE}'   THEN EXCLUDED."scheduledAt"
           WHEN task.status = '${TaskStatus.FAILED}' THEN EXCLUDED."scheduledAt"
           ELSE LEAST(task."scheduledAt", EXCLUDED."scheduledAt")
         END,
         "doneAt" = NULL`,
      parameters,
    );
  }

  async receive(options?: { now?: Date }): Promise<Task | null> {
    const now = (options && options.now) || new Date();
    const entity = this.taskRepo.metadata.target;
    const query = this.taskRepo
      .createQueryBuilder()
      .update()
      .set({ status: TaskStatus.RUNNING })
      .where((qb) => {
        const subQuery = qb
          .select()
          .subQuery()
          .select("t.id")
          .from(entity, "t")
          .where(`t.status = '${TaskStatus.CREATED}'`)
          .andWhere("t.scheduledAt <= :now")
          .orderBy("t.priority - 100 * EXTRACT(MINUTE FROM :now - t.scheduledAt) / 1440", "ASC")
          .limit(1)
          .setLock("pessimistic_write")
          .setOnLocked("skip_locked")
          .getQuery();
        return `task.id = ${subQuery}`;
      })
      .setParameter("now", now.toISOString())
      .returning(`task.*`);
    const result = await query.execute();
    if (result.raw.length === 0) {
      return null;
    }
    const task: Task = result.raw[0];
    if (this.isLocked(task)) {
      const postponedTo = new Date(now.getTime() + 5 * 60 * 1000);
      await this.taskRepo.update({ id: task.id }, { scheduledAt: postponedTo, status: TaskStatus.CREATED });
      return null;
    }
    this.acquireLock(task, now);
    return { ...(task as any), measurementDate: task.measurementDate.toISOString().slice(0, 10) };
  }

  async complete(id: Task["id"], options?: { now?: Date }) {
    const now = (options && options.now) || new Date();
    const task = await this.taskRepo.findOneByOrFail({ id });
    const result = await this.taskRepo.update(
      { id, status: TaskStatus.RUNNING },
      { status: TaskStatus.DONE, doneAt: now },
    );
    if (result.affected === 0) {
      await this.taskRepo.update({ id }, { status: TaskStatus.CREATED, scheduledAt: now });
    }
    this.releaseLock(task);
  }

  async fail(id: Task["id"], options?: { now?: Date }) {
    const now = (options && options.now) || new Date();
    const task = await this.taskRepo.findOneByOrFail({ id });
    const result = await this.taskRepo.update({ id, status: TaskStatus.RUNNING }, { status: TaskStatus.FAILED });
    if (result.affected === 0) {
      await this.taskRepo.update({ id }, { status: TaskStatus.CREATED, scheduledAt: now });
    }
    this.releaseLock(task);
  }

  count(status?: TaskStatus) {
    return this.taskRepo.count({ where: { status } });
  }

  async cancelBatch(batchId: string) {
    await this.taskRepo.delete({ status: TaskStatus.CREATED, batchId });
  }

  async clear() {
    await this.taskRepo.delete({});
    this.locks.clear();
  }

  async getQueue(options: { batchId?: string; status?: TaskStatus[]; limit?: number; doneAfter?: Date } = {}) {
    const qb = this.taskRepo
      .createQueryBuilder("task")
      .leftJoinAndSelect("task.instrumentInfo", "instrumentInfo")
      .leftJoinAndSelect("task.model", "model")
      .orderBy("task.status", "DESC")
      .addOrderBy("task.scheduledAt", "ASC");
    if (typeof options.batchId !== "undefined") {
      qb.andWhere("task.batchId = :batchId", options);
    }
    if (typeof options.status !== "undefined") {
      qb.andWhere("task.status IN (:...status)", options);
    }
    if (typeof options.doneAfter !== "undefined") {
      qb.andWhere("task.doneAt >= :doneAfter", options);
    }
    const total = qb.getCount();
    if (typeof options.limit !== "undefined") {
      qb.take(options.limit);
    }
    const tasks = qb.getMany();
    return Promise.all([tasks, total]);
  }

  private taskToLock(task: Task) {
    const date =
      task.measurementDate instanceof Date ? task.measurementDate.toISOString().slice(0, 10) : task.measurementDate;
    return [task.siteId, date, task.productId, task.instrumentInfoUuid].join(":");
  }

  private isLocked(task: Task) {
    return this.locks.has(this.taskToLock(task));
  }

  private acquireLock(task: Task, now?: Date) {
    const time = now || new Date();
    this.locks.set(this.taskToLock(task), time);
  }

  private releaseLock(task: Task) {
    this.locks.delete(this.taskToLock(task));
  }

  /// Initialize locks from database.
  async initializeLocks() {
    const tasks = await this.taskRepo.findBy({ status: In([TaskStatus.RUNNING, TaskStatus.RESTART]) });
    for (const task of tasks) {
      this.acquireLock(task);
    }
  }

  /// Release locks that have been acquired for a long time.
  breakLocks(now?: Date) {
    const time = now || new Date();
    this.locks.forEach((lockedAt, lock) => {
      if (time.getTime() - lockedAt.getTime() > 24 * 60 * 60 * 1000) {
        console.warn("Broke lock", lock, "locked at", lockedAt);
        this.locks.delete(lock);
      }
    });
  }

  /// Delete old done tasks.
  async cleanOldTasks(now?: Date) {
    const time = now || new Date();
    const limit = new Date(time.getTime() - 60 * 60 * 1000);
    await this.taskRepo.delete({ status: TaskStatus.DONE, doneAt: LessThan(limit) });
  }

  validateTaskOptions(type: TaskType, options: any): any {
    if (type != TaskType.PROCESS) {
      if (options != null) {
        throw new Error(`Options are not supported for ${type}`);
      }
      return;
    }
    if (options != null && options.constructor !== Object) {
      throw new Error(`Options should be null or object`);
    }
    const output = options || {};
    const allowedKeys = ["derivedProducts"];
    for (const key in output) {
      if (!allowedKeys.includes(key)) {
        throw new Error(`Unknown key ${key}`);
      }
    }
    if (typeof output.derivedProducts !== "undefined") {
      if (typeof output.derivedProducts !== "boolean") {
        throw new Error("derivedProducts should be boolean");
      }
    } else {
      output.derivedProducts = true;
    }
    return output;
  }
}
