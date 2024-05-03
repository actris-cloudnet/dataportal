import { DataSource } from "typeorm";
import { AppDataSource } from "../../../src/data-source";
import { QueueService } from "../../../src/lib/queue";
import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { Task, TaskType } from "../../../src/entity/Task";

let dataSource: DataSource;
let queueService: QueueService;

describe("QueueService", () => {
  const now = new Date();

  function advanceMinutes(minutes: number) {
    now.setMinutes(now.getMinutes() + minutes);
  }

  function makeTask(options: {
    type?: TaskType;
    siteId: string;
    productId: string;
    measurementDate: Date | string;
    instrumentInfoUuid?: string;
    priority?: number;
    delayMinutes?: number;
  }) {
    const { type = TaskType.PROCESS, priority = 0, delayMinutes = 0 } = options;
    const task = new Task();
    task.type = type;
    task.siteId = options.siteId;
    task.productId = options.productId;
    if (options.instrumentInfoUuid) {
      task.instrumentInfoUuid = options.instrumentInfoUuid;
    }
    task.measurementDate = new Date(options.measurementDate);
    task.scheduledAt = new Date(now.getTime() + delayMinutes * 60 * 1000);
    task.priority = priority;
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
    expect(await queueService.count()).toBe(0);
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
    expect(await queueService.count()).toBe(0);
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
    expect(await queueService.count()).toBe(0);

    // Try the same task again.
    await queueService.publish(task);
    expect(await queueService.count()).toBe(1);
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
});
