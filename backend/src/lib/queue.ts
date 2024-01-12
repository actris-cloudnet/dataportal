import { DataSource, Not, Repository } from "typeorm";
import { ModelTask, ProductTask, Status, UploadTask } from "../entity/Task";

export type TaskRequest = { siteId: string; measurementDate: string } & (
  | { type: "upload"; instrumentId: string; instrumentPid: string }
  | { type: "product"; productId: string }
  | { type: "model"; modelId: string }
);
export type TaskResponse = TaskRequest & { id: number; status: string; scheduledAt: Date };

type TaskId = TaskResponse["id"];
type TaskType = TaskResponse["type"];

export class QueueService {
  private uploadTaskRepo: Repository<UploadTask>;
  private productTaskRepo: Repository<ProductTask>;
  private modelTaskRepo: Repository<ModelTask>;

  constructor(dataSource: DataSource) {
    this.uploadTaskRepo = dataSource.getRepository(UploadTask);
    this.productTaskRepo = dataSource.getRepository(ProductTask);
    this.modelTaskRepo = dataSource.getRepository(ModelTask);
  }

  async publish(task: TaskRequest, options?: { delayMinutes?: number; now?: Date }) {
    const now = (options && options.now) || new Date();
    const delayMinutes = (options && options.delayMinutes) || 0;
    const scheduledAt = new Date(now.getTime() + delayMinutes * 60 * 1000);
    const insertData: Record<any, any> = {
      siteId: task.siteId,
      measurementDate: task.measurementDate,
      status: Status.CREATED,
      scheduledAt: scheduledAt.toISOString(),
    };
    const index = ["siteId", "measurementDate"];
    const repo = this.getRepository(task.type);
    if (task.type === "upload") {
      insertData.instrumentId = task.instrumentId;
      insertData.instrumentPid = task.instrumentPid;
      index.push("instrumentId", "instrumentPid");
    } else if (task.type == "product") {
      insertData.productId = task.productId;
      index.push("productId");
    } else {
      insertData.modelId = task.modelId;
      index.push("modelId");
    }
    const table = repo.metadata.tableName;
    const columns = '"' + Object.keys(insertData).join('", "') + '"';
    const values = Array.from({ length: Object.keys(insertData).length }, (v, i) => `$${i + 1}`).join(", ");
    const indexColumns = '"' + index.join('", "') + '"';
    await this.uploadTaskRepo.query(
      `INSERT INTO ${table} (${columns}) VALUES (${values})
       ON CONFLICT (${indexColumns}) DO UPDATE SET status = CASE
         WHEN ${table}.status = '${Status.CREATED}' THEN '${Status.CREATED}'::${table}_status_enum
         WHEN ${table}.status = '${Status.RUNNING}' THEN '${Status.RESTART}'::${table}_status_enum
         WHEN ${table}.status = '${Status.RESTART}' THEN '${Status.RESTART}'::${table}_status_enum
         WHEN ${table}.status = '${Status.FAILED}'  THEN '${Status.CREATED}'::${table}_status_enum
       END
       RETURNING id`,
      Object.values(insertData),
    );
  }

  async receive(type: TaskType, options?: { now?: Date }): Promise<TaskResponse | null> {
    const now = (options && options.now) || new Date();
    const repo = this.getRepository(type);
    const entity = repo.metadata.target;
    const table = repo.metadata.tableName;
    const query = repo
      .createQueryBuilder()
      .update()
      .set({ status: Status.RUNNING })
      .where((qb) => {
        const subQuery = qb
          .select()
          .subQuery()
          .select("t.id")
          .from(entity, "t")
          .where(`t.status = '${Status.CREATED}' AND t.scheduledAt <= :now`)
          .orderBy("scheduledAt", "ASC")
          .limit(1)
          .setLock("pessimistic_write")
          .setOnLocked("skip_locked")
          .getQuery();
        return `${table}.id = ${subQuery}`;
      })
      .setParameter("now", now.toISOString())
      .returning(`${table}.*`);
    const result = await query.execute();
    return result.raw.length > 0
      ? { type, ...result.raw[0], measurementDate: result.raw[0].measurementDate.toISOString().slice(0, 10) }
      : null;
  }

  async complete(type: TaskType, id: TaskId, options?: { now: Date }) {
    const now = (options && options.now) || new Date();
    const repository = this.getRepository(type);
    const result = await repository.delete({ id, status: Status.RUNNING });
    if (result.affected === 0) {
      await repository.update({ id }, { status: Status.CREATED, scheduledAt: now });
    }
  }

  async fail(type: TaskType, id: TaskId, options?: { now: Date }) {
    const now = (options && options.now) || new Date();
    const repository = this.getRepository(type);
    const result = await repository.update({ id, status: Status.RUNNING }, { status: Status.FAILED });
    if (result.affected === 0) {
      await repository.update({ id }, { status: Status.CREATED, scheduledAt: now });
    }
  }

  count(type: TaskType) {
    return this.getRepository(type).count({ where: { status: Not(Status.FAILED) } });
  }

  async clear(type: TaskType) {
    await this.getRepository(type).delete({});
  }

  private getRepository(type: TaskType) {
    return { upload: this.uploadTaskRepo, product: this.productTaskRepo, model: this.modelTaskRepo }[type];
  }
}
