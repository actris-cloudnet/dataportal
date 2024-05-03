import { DataSource, Not, Repository } from "typeorm";
import { Task, TaskStatus } from "../entity/Task";

export class QueueService {
  private taskRepo: Repository<Task>;

  constructor(dataSource: DataSource) {
    this.taskRepo = dataSource.getRepository(Task);
  }

  async publish(task: Task) {
    await this.taskRepo.query(
      `INSERT INTO task (
         "type",
         "siteId",
         "measurementDate",
         "productId",
         "instrumentInfoUuid",
         "modelId",
         "status",
         "priority",
         "scheduledAt"
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (
         "type",
         "siteId",
         "measurementDate",
         "productId",
         "instrumentInfoUuid",
         "modelId"
       )
       DO UPDATE SET
         priority = LEAST(task.priority, EXCLUDED.priority),
         status = CASE
           WHEN task.status = '${TaskStatus.CREATED}' THEN '${TaskStatus.CREATED}'::task_status_enum
           WHEN task.status = '${TaskStatus.RUNNING}' THEN '${TaskStatus.RESTART}'::task_status_enum
           WHEN task.status = '${TaskStatus.RESTART}' THEN '${TaskStatus.RESTART}'::task_status_enum
           WHEN task.status = '${TaskStatus.FAILED}'  THEN '${TaskStatus.CREATED}'::task_status_enum
         END
       RETURNING id`,
      [
        task.type,
        task.site ? task.site.id : task.siteId,
        task.measurementDate,
        task.product ? task.product.id : task.productId,
        task.instrumentInfo ? task.instrumentInfo.uuid : task.instrumentInfoUuid,
        task.model ? task.model.id : task.modelId,
        TaskStatus.CREATED,
        task.priority,
        task.scheduledAt.toISOString(),
      ],
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
    return result.raw.length > 0
      ? { ...result.raw[0], measurementDate: result.raw[0].measurementDate.toISOString().slice(0, 10) }
      : null;
  }

  async complete(id: Task["id"], options?: { now?: Date }) {
    const now = (options && options.now) || new Date();
    const result = await this.taskRepo.delete({ id, status: TaskStatus.RUNNING });
    if (result.affected === 0) {
      await this.taskRepo.update({ id }, { status: TaskStatus.CREATED, scheduledAt: now });
    }
  }

  async fail(id: Task["id"], options?: { now?: Date }) {
    const now = (options && options.now) || new Date();
    const result = await this.taskRepo.update({ id, status: TaskStatus.RUNNING }, { status: TaskStatus.FAILED });
    if (result.affected === 0) {
      await this.taskRepo.update({ id }, { status: TaskStatus.CREATED, scheduledAt: now });
    }
  }

  count() {
    return this.taskRepo.count({ where: { status: Not(TaskStatus.FAILED) } });
  }

  async clear() {
    await this.taskRepo.delete({});
  }
}
