import { RequestHandler } from "express";
import { QueueService } from "../lib/queue";

export class QueueRoutes {
  readonly queueService: QueueService;

  constructor(queueService: QueueService) {
    this.queueService = queueService;
  }

  receive: RequestHandler = async (req, res, next) => {
    try {
      const type = req.params.type;
      if (type !== "upload" && type !== "product" && type !== "model") {
        return next({ status: 404, errors: "Type must be upload, product or model" });
      }
      const task = await this.queueService.receive(type);
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
      const type = req.params.type;
      if (type !== "upload" && type !== "product" && type !== "model") {
        return next({ status: 404, errors: "Type must be upload, product or model" });
      }
      const id = parseInt(req.params.id);
      await this.queueService.fail(type, id);
      res.sendStatus(204);
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };

  complete: RequestHandler = async (req, res, next) => {
    try {
      const type = req.params.type;
      if (type !== "upload" && type !== "product" && type !== "model") {
        return next({ status: 404, errors: "Type must be upload, product or model" });
      }
      const id = parseInt(req.params.id);
      await this.queueService.complete(type, id);
      res.sendStatus(204);
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };
}
