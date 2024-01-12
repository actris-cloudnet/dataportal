import { DataSource } from "typeorm";
import { AppDataSource } from "../../../src/data-source";
import { TaskRequest, QueueService } from "../../../src/lib/queue";
import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";

let dataSource: DataSource;
let queueService: QueueService;

describe("QueueService", () => {
  const now = new Date();

  function advanceMinutes(minutes: number) {
    now.setMinutes(now.getMinutes() + minutes);
  }

  beforeAll(async () => {
    dataSource = await AppDataSource.initialize();
    queueService = new QueueService(dataSource);
  });

  beforeEach(async () => {
    await queueService.clear("upload");
    await queueService.clear("product");
    now.setTime(new Date().getTime());
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it("schedules and completes a task successfully", async () => {
    const taskReq: TaskRequest = {
      type: "upload",
      siteId: "hyytiala",
      instrumentId: "chm15k",
      instrumentPid: "lidar1",
      measurementDate: "2024-01-10",
    };

    // Add task.
    await queueService.publish(taskReq, { now, delayMinutes: 5 });
    expect(await queueService.count("upload")).toBe(1);

    // Not scheduled to run right now.
    expect(await queueService.receive("upload", { now })).toBeNull();

    // Not scheduled yet.
    advanceMinutes(3);
    expect(await queueService.receive("upload", { now })).toBeNull();

    // Now scheduled.
    advanceMinutes(3);
    const taskRes: any = await queueService.receive("upload", { now });
    expect(taskRes).toMatchObject(taskReq);

    // No scheduled tasks.
    advanceMinutes(1);
    expect(await queueService.receive("upload", { now })).toBeNull();

    // No tasks left after completion.
    advanceMinutes(1);
    await queueService.complete("upload", taskRes.id, { now });
    expect(await queueService.count("upload")).toBe(0);
  });

  it("schedules multiple tasks", async () => {
    // Upload task.
    await queueService.publish({
      type: "upload",
      siteId: "hyytiala",
      instrumentId: "chm15k",
      instrumentPid: "lidar1",
      measurementDate: "2024-01-10",
    });
    // Different instrument PID.
    await queueService.publish({
      type: "upload",
      siteId: "hyytiala",
      instrumentId: "chm15k",
      instrumentPid: "lidar2",
      measurementDate: "2024-01-10",
    });
    // Different date.
    await queueService.publish({
      type: "upload",
      siteId: "hyytiala",
      instrumentId: "chm15k",
      instrumentPid: "lidar1",
      measurementDate: "2024-01-11",
    });
    // Different site.
    await queueService.publish({
      type: "upload",
      siteId: "mace-head",
      instrumentId: "chm15k",
      instrumentPid: "lidar3",
      measurementDate: "2024-01-10",
    });
    // Product task.
    await queueService.publish({
      type: "product",
      siteId: "hyytiala",
      productId: "categorize",
      measurementDate: "2024-01-10",
    });
    // Different date.
    await queueService.publish({
      type: "product",
      siteId: "hyytiala",
      productId: "categorize",
      measurementDate: "2024-01-11",
    });
    // Different site.
    await queueService.publish({
      type: "product",
      siteId: "mace-head",
      productId: "categorize",
      measurementDate: "2024-01-10",
    });
    expect(await queueService.count("upload")).toBe(4);
    expect(await queueService.count("product")).toBe(3);
  });

  it("doesn't schedule duplicate tasks", async () => {
    for (let i = 0; i < 10; i++) {
      await queueService.publish({
        type: "upload",
        siteId: "hyytiala",
        instrumentId: "chm15k",
        instrumentPid: "lidar1",
        measurementDate: "2024-01-10",
      });
      await queueService.publish({
        type: "product",
        siteId: "hyytiala",
        productId: "categorize",
        measurementDate: "2024-01-10",
      });
    }
    expect(await queueService.count("upload")).toBe(1);
    expect(await queueService.count("product")).toBe(1);
  });

  it("restarts a task", async () => {
    const taskReq: TaskRequest = {
      type: "upload",
      siteId: "hyytiala",
      instrumentId: "chm15k",
      instrumentPid: "lidar1",
      measurementDate: "2024-01-10",
    };

    // Add task.
    await queueService.publish(taskReq, { now, delayMinutes: 5 });
    expect(await queueService.count("upload")).toBe(1);

    // Start running the task.
    advanceMinutes(6);
    let taskRes: any = await queueService.receive("upload", { now });
    expect(taskRes).toMatchObject(taskReq);

    // Push duplicate tasks so that the running task is restarted.
    advanceMinutes(1);
    for (let i = 0; i < 10; i++) {
      await queueService.publish(taskReq, { now });
    }

    // Task should be restarted after completion.
    advanceMinutes(1);
    await queueService.complete("upload", taskRes.id, { now });
    expect(await queueService.count("upload")).toBe(1);
    advanceMinutes(1);
    taskRes = await queueService.receive("upload", { now });
    expect(taskRes).toMatchObject(taskReq);

    // No tasks left after completion.
    advanceMinutes(1);
    await queueService.complete("upload", taskRes.id, { now });
    expect(await queueService.count("upload")).toBe(0);
  });

  it("schedules, fails and reschedules a task", async () => {
    const taskReq: TaskRequest = {
      type: "upload",
      siteId: "hyytiala",
      instrumentId: "chm15k",
      instrumentPid: "lidar1",
      measurementDate: "2024-01-10",
    };

    // Add task.
    await queueService.publish(taskReq, { now, delayMinutes: 5 });
    expect(await queueService.count("upload")).toBe(1);

    // Now scheduled.
    advanceMinutes(6);
    const taskRes: any = await queueService.receive("upload", { now });
    expect(taskRes).toMatchObject(taskReq);

    // No tasks left after fail.
    await queueService.fail("upload", taskRes.id, { now });
    expect(await queueService.count("upload")).toBe(0);

    // Try the same task again.
    await queueService.publish(taskReq, { now });
    expect(await queueService.count("upload")).toBe(1);
  });
});
