import { AppDataSource } from "./data-source";
import { Product } from "./entity/Product";
import { Site } from "./entity/Site";
import { Task, TaskStatus, TaskType } from "./entity/Task";
import { QueueService } from "./lib/queue";

async function main() {
  const dataSource = await AppDataSource.initialize();
  const queueService = new QueueService(AppDataSource);
  const siteRepo = dataSource.getRepository(Site);
  const productRepo = dataSource.getRepository(Product);
  const taskRepo = dataSource.getRepository(Task);
  const sites = await siteRepo.find();
  const products = await productRepo.find();

  queueService.clear();
  for (let i = 0; i < 400; i++) {
    const daysAgo = Math.round(Math.random() * 10);
    const task = new Task();
    task.type = TaskType.PROCESS;
    task.site = sites[Math.floor(Math.random() * sites.length)];
    task.measurementDate = new Date(new Date().getTime() - daysAgo * 24 * 60 * 60 * 1000);
    task.status = TaskStatus.CREATED;
    task.product = products[Math.floor(Math.random() * products.length)];
    task.scheduledAt = new Date(new Date().getTime() + Math.random() * 15 * 60 * 1000);
    task.priority = daysAgo;
    await queueService.publish(task);
  }
  for (let i = 0; i < 100; i++) {
    const daysAgo = Math.round(Math.random() * 31);
    await taskRepo.insert({
      type: TaskType.PROCESS,
      site: sites[Math.floor(Math.random() * sites.length)],
      measurementDate: new Date(new Date().getTime() - daysAgo * 24 * 60 * 60 * 1000),
      status: TaskStatus.FAILED,
      product: products[Math.floor(Math.random() * products.length)],
      scheduledAt: new Date(new Date().getTime() - daysAgo * 24 * 60 * 60 * 1000),
      priority: 0,
    });
  }

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function worker() {
    while (true) {
      const task = await queueService.receive();
      if (task) {
        await sleep(30_000 * Math.random());
        await queueService.complete(task.id);
      } else {
        await sleep(5000);
      }
    }
  }

  const promises = [];
  for (let i = 0; i < 4; i++) {
    promises.push(worker());
  }
  await Promise.all(promises);
}

main().catch((err) => console.error(err));
