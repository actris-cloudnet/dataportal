import { RequestHandler } from "express";
import { QueueService } from "../lib/queue";
import { Task } from "../entity/Task";

export class QueueRoutes {
  readonly queueService: QueueService;

  constructor(queueService: QueueService) {
    this.queueService = queueService;
  }

  publish: RequestHandler = async (req, res, next) => {
    try {
      const body = req.body;

      const task = new Task();
      task.type = body.type;
      task.siteId = body.siteId;
      task.productId = body.productId;
      task.measurementDate = body.measurementDate;
      if (body.instrumentInfoUuid) {
        task.instrumentInfoUuid = body.instrumentInfoUuid;
      }
      if (body.modelId) {
        task.modelId = body.modelId;
      }
      task.scheduledAt = new Date();
      task.priority = 50;

      await this.queueService.publish(task);
      res.send(task);
    } catch (err) {
      console.log(err);
      next({ status: 500, errors: err });
    }
  };

  receive: RequestHandler = async (req, res, next) => {
    try {
      const task = await this.queueService.receive();
      if (task) {
        res.send(task);
      } else {
        res.sendStatus(204);
      }
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };

  fail: RequestHandler = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await this.queueService.fail(id);
      res.sendStatus(204);
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };

  complete: RequestHandler = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await this.queueService.complete(id);
      res.sendStatus(204);
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };
}
