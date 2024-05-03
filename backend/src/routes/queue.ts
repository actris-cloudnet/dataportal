import { RequestHandler } from "express";
import { QueueService } from "../lib/queue";

export class QueueRoutes {
  readonly queueService: QueueService;

  constructor(queueService: QueueService) {
    this.queueService = queueService;
  }

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
