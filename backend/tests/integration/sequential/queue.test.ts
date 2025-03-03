import { DataSource, IsNull, Repository } from "typeorm";
import { AppDataSource } from "../../../src/data-source";
import { QueueService } from "../../../src/lib/queue";
import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { Task, TaskStatus, TaskType } from "../../../src/entity/Task";
import { backendPublicUrl } from "../../lib";
import { promises as fsp } from "node:fs";
import axios from "axios";
import { InstrumentUpload, ModelUpload } from "../../../src/entity/Upload";
import { Permission } from "../../../src/entity/Permission";
import { UserAccount } from "../../../src/entity/UserAccount";

let dataSource: DataSource;
let queueService: QueueService;

describe("QueueService", () => {
  const now = new Date();

  function advanceMinutes(minutes: number) {
    now.setMinutes(now.getMinutes() + minutes);
  }

  function makeTask(params: {
    type?: TaskType;
    siteId: string;
    productId: string;
    measurementDate: Date | string;
    instrumentInfoUuid?: string;
    modelId?: string;
    priority?: number;
    delayMinutes?: number;
    batchId?: string;
    options?: object;
  }) {
    const { type = TaskType.PROCESS, priority = 0, delayMinutes = 0 } = params;
    const task = new Task();
    task.type = type;
    task.status = TaskStatus.CREATED;
    task.siteId = params.siteId;
    task.productId = params.productId;
    if (params.instrumentInfoUuid) {
      task.instrumentInfoUuid = params.instrumentInfoUuid;
    }
    if (params.modelId) {
      task.modelId = params.modelId;
    }
    task.measurementDate = new Date(params.measurementDate);
    task.scheduledAt = new Date(now.getTime() + delayMinutes * 60 * 1000);
    task.priority = priority;
    task.batchId = params.batchId || null;
    task.options = params.options;
    return task;
  }

  beforeAll(async () => {
    dataSource = await AppDataSource.initialize();
    queueService = new QueueService(dataSource);
  });

  beforeEach(async () => {
    await queueService.clear();
    now.setTime(new Date().getTime());
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it("schedules and completes a task successfully", async () => {
    const task = makeTask({
      siteId: "hyytiala",
      productId: "lidar",
      instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
      measurementDate: "2024-01-10",
      delayMinutes: 5,
    });

    // Add task.
    await queueService.publish(task);
    expect(await queueService.count()).toBe(1);

    // Not scheduled to run right now.
    expect(await queueService.receive({ now })).toBeNull();

    // Not scheduled yet.
    advanceMinutes(3);
    expect(await queueService.receive({ now })).toBeNull();

    // Now scheduled.
    advanceMinutes(3);
    const taskRes = await queueService.receive({ now });
    expect(taskRes).toMatchObject({
      siteId: "hyytiala",
      productId: "lidar",
      instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
      measurementDate: "2024-01-10",
    });
    const taskId = taskRes!.id;

    // No scheduled tasks.
    advanceMinutes(1);
    expect(await queueService.receive({ now })).toBeNull();

    // No tasks left after completion.
    advanceMinutes(1);
    await queueService.complete(taskId, { now });
    expect(await queueService.count()).toBe(1);
    expect(await queueService.count(TaskStatus.DONE)).toBe(1);
  });

  it("schedules multiple tasks", async () => {
    // Upload task.
    await queueService.publish(
      makeTask({
        siteId: "hyytiala",
        productId: "lidar",
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        measurementDate: "2024-01-10",
      }),
    );
    // Different instrument.
    await queueService.publish(
      makeTask({
        siteId: "hyytiala",
        productId: "radar",
        instrumentInfoUuid: "0b3a7fa0-4812-4964-af23-1162e8b3a665",
        measurementDate: "2024-01-10",
      }),
    );
    // Different date.
    await queueService.publish(
      makeTask({
        siteId: "hyytiala",
        productId: "lidar",
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        measurementDate: "2024-01-11",
      }),
    );
    // Different site.
    await queueService.publish(
      makeTask({
        siteId: "mace-head",
        productId: "lidar",
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        measurementDate: "2024-01-10",
      }),
    );
    // Product task.
    await queueService.publish(
      makeTask({
        siteId: "hyytiala",
        productId: "categorize",
        measurementDate: "2024-01-10",
      }),
    );
    // Different date.
    await queueService.publish(
      makeTask({
        siteId: "hyytiala",
        productId: "categorize",
        measurementDate: "2024-01-11",
      }),
    );
    // Different site.
    await queueService.publish(
      makeTask({
        siteId: "mace-head",
        productId: "categorize",
        measurementDate: "2024-01-10",
      }),
    );
    expect(await queueService.count()).toBe(7);
  });

  it("doesn't schedule duplicate tasks", async () => {
    for (let i = 0; i < 10; i++) {
      await queueService.publish(
        makeTask({
          siteId: "hyytiala",
          productId: "lidar",
          instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
          measurementDate: "2024-01-10",
        }),
      );
      await queueService.publish(
        makeTask({
          siteId: "hyytiala",
          productId: "categorize",
          measurementDate: "2024-01-10",
        }),
      );
    }
    expect(await queueService.count()).toBe(2);
  });

  it("restarts a task", async () => {
    const task = makeTask({
      siteId: "hyytiala",
      productId: "lidar",
      instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
      measurementDate: "2024-01-10",
      delayMinutes: 5,
    });

    // Add task.
    await queueService.publish(task);
    expect(await queueService.count()).toBe(1);

    // Start running the task.
    advanceMinutes(6);
    let taskRes = await queueService.receive({ now });
    expect(taskRes).toMatchObject({
      siteId: "hyytiala",
      productId: "lidar",
      instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
      measurementDate: "2024-01-10",
    });
    const taskId = taskRes!.id;

    // Push duplicate tasks so that the running task is restarted.
    advanceMinutes(1);
    for (let i = 0; i < 10; i++) {
      await queueService.publish(task);
    }

    // Task should be restarted after completion.
    advanceMinutes(1);
    await queueService.complete(taskId, { now });
    expect(await queueService.count()).toBe(1);
    advanceMinutes(1);
    taskRes = await queueService.receive({ now });
    expect(taskRes).toMatchObject({ id: taskId });

    // No tasks left after completion.
    advanceMinutes(1);
    await queueService.complete(taskId, { now });
    expect(await queueService.count()).toBe(1);
    expect(await queueService.count(TaskStatus.DONE)).toBe(1);
  });

  it("schedules, completes and reschedules a task", async () => {
    const task = makeTask({
      siteId: "hyytiala",
      productId: "lidar",
      instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
      measurementDate: "2024-01-10",
      delayMinutes: 5,
    });

    // Add task.
    await queueService.publish(task);
    expect(await queueService.count()).toBe(1);

    // Not scheduled yet.
    advanceMinutes(1);
    expect(await queueService.receive({ now })).toBeNull();

    // Now scheduled.
    advanceMinutes(6);
    const taskRes = await queueService.receive({ now });
    expect(taskRes).toMatchObject({
      siteId: "hyytiala",
      productId: "lidar",
      instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
      measurementDate: "2024-01-10",
    });
    const taskId = taskRes!.id;

    // No tasks left after completion.
    await queueService.complete(taskId, { now });
    expect(await queueService.count()).toBe(1);
    expect(await queueService.count(TaskStatus.DONE)).toBe(1);

    // Try the same task again.
    const task2 = makeTask({
      siteId: "hyytiala",
      productId: "lidar",
      instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
      measurementDate: "2024-01-10",
      delayMinutes: 5,
    });
    await queueService.publish(task2);
    expect(await queueService.count()).toBe(1);
    expect(await queueService.count(TaskStatus.CREATED)).toBe(1);

    // Not schuduled yet.
    advanceMinutes(1);
    expect(await queueService.receive({ now })).toBeNull();

    // Now scheduled.
    advanceMinutes(6);
    const taskRes2 = await queueService.receive({ now });
    expect(taskRes2).toMatchObject({
      siteId: "hyytiala",
      productId: "lidar",
      instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
      measurementDate: "2024-01-10",
      doneAt: null,
    });
  });

  it("schedules, fails and reschedules a task", async () => {
    const task = makeTask({
      siteId: "hyytiala",
      productId: "lidar",
      instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
      measurementDate: "2024-01-10",
      delayMinutes: 5,
    });

    // Add task.
    await queueService.publish(task);
    expect(await queueService.count()).toBe(1);

    // Now scheduled.
    advanceMinutes(6);
    const taskRes = await queueService.receive({ now });
    expect(taskRes).toMatchObject({
      siteId: "hyytiala",
      productId: "lidar",
      instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
      measurementDate: "2024-01-10",
    });
    const taskId = taskRes!.id;

    // No tasks left after fail.
    await queueService.fail(taskId, { now });
    expect(await queueService.count()).toBe(1);
    expect(await queueService.count(TaskStatus.FAILED)).toBe(1);

    // Try the same task again.
    const task2 = makeTask({
      siteId: "hyytiala",
      productId: "lidar",
      instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
      measurementDate: "2024-01-10",
      delayMinutes: 5,
    });
    await queueService.publish(task2);
    expect(await queueService.count()).toBe(1);
    expect(await queueService.count(TaskStatus.CREATED)).toBe(1);

    // Not schuduled yet.
    advanceMinutes(1);
    expect(await queueService.receive({ now })).toBeNull();

    // Now scheduled.
    advanceMinutes(6);
    const taskRes2 = await queueService.receive({ now });
    expect(taskRes2).toMatchObject({
      siteId: "hyytiala",
      productId: "lidar",
      instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
      measurementDate: "2024-01-10",
    });
  });

  it("schedules based on priority", async () => {
    // Add tasks.
    await queueService.publish(
      makeTask({
        siteId: "hyytiala",
        productId: "lidar",
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        measurementDate: "2024-01-10",
        priority: 10,
      }),
    );
    await queueService.publish(
      makeTask({
        siteId: "hyytiala",
        productId: "radar",
        instrumentInfoUuid: "0b3a7fa0-4812-4964-af23-1162e8b3a665",
        measurementDate: "2024-01-10",
        priority: 9,
      }),
    );
    expect(await queueService.count()).toBe(2);

    // First with higher priority.
    const taskRes = await queueService.receive({ now });
    expect(taskRes).toMatchObject({ productId: "radar" });

    // Then with lower priority.
    const taskRes2 = await queueService.receive({ now });
    expect(taskRes2).toMatchObject({ productId: "lidar" });
  });

  it("schedules lower priority task which has waited for a long time", async () => {
    // Add tasks.
    await queueService.publish(
      makeTask({
        siteId: "hyytiala",
        productId: "lidar",
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        measurementDate: "2024-01-10",
        priority: 10,
        delayMinutes: -999999,
      }),
    );
    await queueService.publish(
      makeTask({
        siteId: "hyytiala",
        productId: "radar",
        instrumentInfoUuid: "0b3a7fa0-4812-4964-af23-1162e8b3a665",
        measurementDate: "2024-01-10",
        priority: 9,
      }),
    );
    expect(await queueService.count()).toBe(2);

    // First older task.
    const taskRes = await queueService.receive({ now });
    expect(taskRes).toMatchObject({ productId: "lidar" });

    // Then newer task.
    const taskRes2 = await queueService.receive({ now });
    expect(taskRes2).toMatchObject({ productId: "radar" });
  });

  it("postpones task once", async () => {
    // Add tasks.
    await queueService.publish(
      makeTask({
        type: TaskType.PROCESS,
        siteId: "hyytiala",
        productId: "lidar",
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        measurementDate: "2024-01-10",
        priority: 0,
      }),
    );
    await queueService.publish(
      makeTask({
        type: TaskType.FREEZE,
        siteId: "hyytiala",
        productId: "lidar",
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        measurementDate: "2024-01-10",
        priority: 1,
      }),
    );
    expect(await queueService.count()).toBe(2);

    // Start process task.
    const taskRes = await queueService.receive({ now });
    expect(taskRes).toMatchObject({ type: "process" });

    // Freeze task is postponed.
    const taskRes2 = await queueService.receive({ now });
    expect(taskRes2).toBeNull();
    expect(await queueService.count()).toBe(2);

    // Finish process task.
    await queueService.complete(taskRes!["id"]);
    expect(await queueService.count()).toBe(2);
    expect(await queueService.count(TaskStatus.DONE)).toBe(1);

    // Freeze task is not postponed anymore.
    advanceMinutes(10);
    const taskRes3 = await queueService.receive({ now });
    expect(taskRes3).toMatchObject({ type: "freeze" });
  });

  it("postpones task multiple times", async () => {
    // Add tasks.
    await queueService.publish(
      makeTask({
        type: TaskType.PROCESS,
        siteId: "hyytiala",
        productId: "lidar",
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        measurementDate: "2024-01-10",
        priority: 0,
      }),
    );
    await queueService.publish(
      makeTask({
        type: TaskType.FREEZE,
        siteId: "hyytiala",
        productId: "lidar",
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        measurementDate: "2024-01-10",
        priority: 1,
      }),
    );
    expect(await queueService.count()).toBe(2);

    // Start process task.
    const taskRes = await queueService.receive({ now });
    expect(taskRes).toMatchObject({ type: "process" });

    // Freeze task is postponed.
    const taskRes2 = await queueService.receive({ now });
    expect(taskRes2).toBeNull();
    expect(await queueService.count()).toBe(2);

    // Freeze task is postponed again.
    advanceMinutes(10);
    const taskRes3 = await queueService.receive({ now });
    expect(taskRes3).toBeNull();
    expect(await queueService.count()).toBe(2);

    // Finish process task.
    await queueService.complete(taskRes!["id"]);
    expect(await queueService.count()).toBe(2);
    expect(await queueService.count(TaskStatus.DONE)).toBe(1);

    // Freeze task is not postponed anymore.
    advanceMinutes(10);
    const taskRes4 = await queueService.receive({ now });
    expect(taskRes4).toMatchObject({ type: "freeze" });
  });

  it("doesn't allow simultaneous model tasks", async () => {
    // Add tasks which cannot be safely processed at the same time because they
    // both update search_file table.
    await queueService.publish(
      makeTask({
        type: TaskType.PROCESS,
        siteId: "hyytiala",
        productId: "model",
        modelId: "icon-iglo-12-23",
        measurementDate: "2024-01-10",
        priority: 0,
      }),
    );
    await queueService.publish(
      makeTask({
        type: TaskType.PROCESS,
        siteId: "hyytiala",
        productId: "model",
        modelId: "icon-iglo-24-35",
        measurementDate: "2024-01-10",
        priority: 1,
      }),
    );
    expect(await queueService.count()).toBe(2);

    // Start process task.
    const taskRes = await queueService.receive({ now });
    expect(taskRes).toMatchObject({ modelId: "icon-iglo-12-23" });

    // Other task is postponed.
    const taskRes2 = await queueService.receive({ now });
    expect(taskRes2).toBeNull();
    expect(await queueService.count()).toBe(2);

    // Finish process task.
    await queueService.complete(taskRes!["id"]);
    expect(await queueService.count()).toBe(2);
    expect(await queueService.count(TaskStatus.DONE)).toBe(1);

    // Other task is not postponed anymore.
    advanceMinutes(10);
    const taskRes3 = await queueService.receive({ now });
    expect(taskRes3).toMatchObject({ modelId: "icon-iglo-24-35" });
  });

  it("submits and cancels batches", async () => {
    // Submit two batches.
    for (const measurementDate of ["2024-01-01", "2024-01-02", "2024-01-03"]) {
      const task = makeTask({
        siteId: "hyytiala",
        productId: "lidar",
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        measurementDate,
        batchId: "lidar-batch",
      });
      await queueService.publish(task);
    }
    for (const measurementDate of ["2024-01-01", "2024-01-02"]) {
      const task = makeTask({
        siteId: "hyytiala",
        productId: "radar",
        instrumentInfoUuid: "0b3a7fa0-4812-4964-af23-1162e8b3a665",
        measurementDate,
        batchId: "radar-batch",
      });
      await queueService.publish(task);
    }
    expect(await queueService.count()).toBe(5);

    // Cancel one batch.
    expect(await queueService.cancelBatch("lidar-batch"));
    expect(await queueService.count()).toBe(2);

    // Cancel other batch.
    expect(await queueService.cancelBatch("radar-batch"));
    expect(await queueService.count()).toBe(0);
  });

  it("doesn't cancel running tasks", async () => {
    // Submit batch.
    for (const measurementDate of ["2024-01-01", "2024-01-02", "2024-01-03"]) {
      const task = makeTask({
        siteId: "hyytiala",
        productId: "lidar",
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        measurementDate,
        batchId: "lidar-batch",
      });
      await queueService.publish(task);
    }
    expect(await queueService.count()).toBe(3);

    // Start a task.
    const taskRes = await queueService.receive({ now });

    // Cancel batch.
    expect(await queueService.cancelBatch("lidar-batch"));
    expect(await queueService.count()).toBe(1);

    // Finish task.
    await queueService.complete(taskRes!["id"]);
    expect(await queueService.count()).toBe(1);
    expect(await queueService.count(TaskStatus.DONE)).toBe(1);
  });

  it("cleans up old tasks", async () => {
    // Upload task.
    await queueService.publish(
      makeTask({
        siteId: "hyytiala",
        productId: "lidar",
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        measurementDate: "2024-01-10",
      }),
    );
    expect(await queueService.count()).toBe(1);
    expect(await queueService.count(TaskStatus.DONE)).toBe(0);

    // Process a task.
    const taskRes = await queueService.receive({ now });
    await queueService.complete(taskRes!["id"]);
    expect(await queueService.count()).toBe(1);
    expect(await queueService.count(TaskStatus.DONE)).toBe(1);

    // Tasks remain after a while.
    advanceMinutes(10);
    await queueService.cleanOldTasks(now);
    expect(await queueService.count()).toBe(1);
    expect(await queueService.count(TaskStatus.DONE)).toBe(1);

    // Tasks are now cleaned up in the future.
    advanceMinutes(99999);
    await queueService.cleanOldTasks(now);
    expect(await queueService.count()).toBe(0);
  });

  it("defaults to derivedProducts: true", async () => {
    await queueService.publish(
      makeTask({
        siteId: "hyytiala",
        productId: "lidar",
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        measurementDate: "2024-01-10",
      }),
    );
    expect(await queueService.count()).toBe(1);
    const taskRes = await queueService.receive({ now });
    expect(taskRes).not.toBeNull();
    expect(taskRes!.options).toEqual({ derivedProducts: true });
  });

  it("published two tasks with different options", async () => {
    await queueService.publish(
      makeTask({
        siteId: "hyytiala",
        productId: "lidar",
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        measurementDate: "2024-01-10",
        options: { derivedProducts: true },
      }),
    );
    await queueService.publish(
      makeTask({
        siteId: "hyytiala",
        productId: "lidar",
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        measurementDate: "2024-01-10",
        options: { derivedProducts: false },
      }),
    );
    expect(await queueService.count()).toBe(2);
  });
});

describe("/api/queue/batch", () => {
  let dataSource: DataSource;
  let permissionRepo: Repository<Permission>;
  let userAccountRepo: Repository<UserAccount>;
  let instrumentUploadRepo: Repository<InstrumentUpload>;
  let modelUploadRepo: Repository<ModelUpload>;
  let taskRepo: Repository<Task>;
  const batchUrl = `${backendPublicUrl}queue/batch`;
  const auth = { username: "admin", password: "admin" };
  const submitterAuth = { username: "submitter", password: "submitter" };

  beforeAll(async () => {
    dataSource = await AppDataSource.initialize();
    permissionRepo = dataSource.getRepository(Permission);
    userAccountRepo = dataSource.getRepository(UserAccount);
    instrumentUploadRepo = dataSource.getRepository(InstrumentUpload);
    modelUploadRepo = dataSource.getRepository(ModelUpload);
    taskRepo = dataSource.getRepository(Task);
    await permissionRepo.save(JSON.parse((await fsp.readFile("fixtures/2-permission.json")).toString()));
    await userAccountRepo.delete({});
    await userAccountRepo.save(JSON.parse((await fsp.readFile("fixtures/5-user_account.json")).toString()));
    await instrumentUploadRepo.save(JSON.parse((await fsp.readFile("fixtures/4-instrument_upload.json")).toString()));
    await modelUploadRepo.save(JSON.parse((await fsp.readFile("fixtures/4-model_upload.json")).toString()));
  });

  beforeEach(async () => {
    await cleanRepos();
  });

  afterAll(async () => {
    await cleanRepos();
    await dataSource.destroy();
  });

  async function cleanRepos() {
    await taskRepo.delete({});
  }

  it("requires authentication", async () => {
    await expect(axios.post(batchUrl, { type: "process", productIds: ["lidar"] })).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("requires admin permissions", async () => {
    await expect(
      axios.post(batchUrl, { type: "process", productIds: ["lidar"] }, { auth: submitterAuth }),
    ).rejects.toMatchObject({ response: { status: 401 } });
  });

  it("returns task count on dry run", async () => {
    const res = await axios.post(batchUrl, { type: "process", productIds: ["lidar"], dryRun: true }, { auth });
    expect(res.data).toEqual({ taskCount: 1 });
  });

  it("returns batch identifier on non-dry run", async () => {
    const res = await axios.post(batchUrl, { type: "process", productIds: ["lidar"], dryRun: false }, { auth });
    expect(res.data).toHaveProperty("batchId");
    expect(typeof res.data.batchId).toBe("string");
    expect(res.data.batchId).toBeTruthy();
  });

  it("creates lidar tasks", async () => {
    await axios.post(batchUrl, { type: "process", productIds: ["lidar"], dryRun: false }, { auth });
    expect(await taskRepo.count()).toBe(1);
    expect(
      await taskRepo.existsBy({
        measurementDate: new Date("2020-08-12"),
        siteId: "bucharest",
        productId: "lidar",
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        options: { derivedProducts: true },
      }),
    ).toBeTruthy();
  });

  it("creates radar tasks", async () => {
    await axios.post(batchUrl, { type: "process", productIds: ["radar"], dryRun: false }, { auth });
    expect(await taskRepo.count()).toBe(2);
    expect(
      await taskRepo.existsBy({
        measurementDate: new Date("2020-08-11"),
        siteId: "granada",
        productId: "radar",
        instrumentInfoUuid: "9e0f4b27-d5f3-40ad-8b73-2ae5dabbf81f",
        options: { derivedProducts: true },
      }),
    ).toBeTruthy();
    expect(
      await taskRepo.existsBy({
        measurementDate: new Date("2020-08-13"),
        siteId: "bucharest",
        productId: "radar",
        instrumentInfoUuid: "0b3a7fa0-4812-4964-af23-1162e8b3a665",
        options: { derivedProducts: true },
      }),
    ).toBeTruthy();
  });

  it("creates Doppler lidar tasks", async () => {
    await axios.post(batchUrl, { type: "process", instrumentIds: ["halo-doppler-lidar"], dryRun: false }, { auth });
    expect(await taskRepo.count()).toBe(2);
    const task = {
      measurementDate: new Date("2022-12-05"),
      siteId: "warsaw",
      instrumentInfoUuid: "eb4b39e5-6bc8-40f0-92d2-43d31f224de6",
    };
    expect(await taskRepo.existsBy({ ...task, productId: "doppler-lidar" })).toBeTruthy();
    expect(await taskRepo.existsBy({ ...task, productId: "doppler-lidar-wind" })).toBeTruthy();
  });

  it("creates model tasks", async () => {
    await axios.post(batchUrl, { type: "process", dryRun: false }, { auth });
    expect(await taskRepo.count()).toBe(5);
  });

  it("creates ECMWF model tasks", async () => {
    await axios.post(batchUrl, { type: "process", modelIds: ["ecmwf"], dryRun: false }, { auth });
    expect(await taskRepo.count()).toBe(3);
  });

  it("creates ICON model tasks", async () => {
    await axios.post(batchUrl, { type: "process", modelIds: ["icon-iglo-12-23"], dryRun: false }, { auth });
    expect(await taskRepo.count()).toBe(2);
  });

  it("creates categorize tasks", async () => {
    await axios.post(batchUrl, { type: "process", productIds: ["categorize"], dryRun: false }, { auth });
    expect(await taskRepo.count()).toBe(4);
    expect(await taskRepo.countBy({ siteId: "granada", productId: "categorize", instrumentInfoUuid: IsNull() })).toBe(
      1,
    );
    expect(await taskRepo.countBy({ siteId: "bucharest", productId: "categorize", instrumentInfoUuid: IsNull() })).toBe(
      2,
    );
    expect(await taskRepo.countBy({ siteId: "warsaw", productId: "categorize", instrumentInfoUuid: IsNull() })).toBe(1);
  });

  it("creates edr tasks", async () => {
    await axios.post(batchUrl, { type: "process", productIds: ["edr"], dryRun: false }, { auth });
    expect(await taskRepo.count()).toBe(2);
    expect(
      await taskRepo.existsBy({
        siteId: "granada",
        productId: "edr",
        measurementDate: new Date("2020-08-11"),
        instrumentInfoUuid: "9e0f4b27-d5f3-40ad-8b73-2ae5dabbf81f",
      }),
    ).toBeTruthy();
    expect(
      await taskRepo.existsBy({
        siteId: "bucharest",
        productId: "edr",
        measurementDate: new Date("2020-08-13"),
        instrumentInfoUuid: "0b3a7fa0-4812-4964-af23-1162e8b3a665",
      }),
    ).toBeTruthy();
  });

  it("filters by date", async () => {
    await axios.post(batchUrl, { type: "process", productIds: ["radar"], date: "2020-08-11", dryRun: false }, { auth });
    expect(await taskRepo.count()).toBe(1);
    expect(
      await taskRepo.existsBy({
        measurementDate: new Date("2020-08-11"),
        siteId: "granada",
        productId: "radar",
        instrumentInfoUuid: "9e0f4b27-d5f3-40ad-8b73-2ae5dabbf81f",
      }),
    ).toBeTruthy();
  });

  it("filters by site", async () => {
    await axios.post(
      batchUrl,
      { type: "process", productIds: ["radar"], siteIds: ["bucharest"], dryRun: false },
      { auth },
    );
    expect(await taskRepo.count()).toBe(1);
    expect(
      await taskRepo.existsBy({
        measurementDate: new Date("2020-08-13"),
        siteId: "bucharest",
        productId: "radar",
        instrumentInfoUuid: "0b3a7fa0-4812-4964-af23-1162e8b3a665",
      }),
    ).toBeTruthy();
  });

  it("filters by instrument UUID", async () => {
    await axios.post(
      batchUrl,
      { type: "process", instrumentUuids: ["eb4b39e5-6bc8-40f0-92d2-43d31f224de6"], dryRun: false },
      { auth },
    );
    expect(await taskRepo.count()).toBe(2);
    const task = {
      measurementDate: new Date("2022-12-05"),
      siteId: "warsaw",
      instrumentInfoUuid: "eb4b39e5-6bc8-40f0-92d2-43d31f224de6",
    };
    expect(await taskRepo.existsBy({ ...task, productId: "doppler-lidar" })).toBeTruthy();
    expect(await taskRepo.existsBy({ ...task, productId: "doppler-lidar-wind" })).toBeTruthy();
  });

  it("cannot cancel all tasks", async () => {
    await expect(axios.delete(batchUrl, { auth })).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("cancels tasks", async () => {
    const res = await axios.post(batchUrl, { type: "process", productIds: ["categorize"], dryRun: false }, { auth });
    expect(await taskRepo.count()).toBe(4);
    await axios.delete(`${batchUrl}/${res.data.batchId}`, { auth });
    expect(await taskRepo.count()).toBe(0);
  });

  it("creates tasks with options", async () => {
    await axios.post(
      batchUrl,
      { type: "process", productIds: ["lidar"], dryRun: false, options: { derivedProducts: false } },
      { auth },
    );
    expect(await taskRepo.count()).toBe(1);
    expect(
      await taskRepo.existsBy({
        measurementDate: new Date("2020-08-12"),
        siteId: "bucharest",
        productId: "lidar",
        instrumentInfoUuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0",
        options: { derivedProducts: false },
      }),
    ).toBeTruthy();
  });
});
