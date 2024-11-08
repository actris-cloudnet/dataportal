import { DataSource, Repository } from "typeorm";
import { Request, RequestHandler } from "express";
import env from "../lib/env";
import axios from "axios";
import { Feedback } from "../entity/Feedback";

export class FeedbackRoutes {
  private feedbackRepo: Repository<Feedback>;

  constructor(dataSource: DataSource) {
    this.feedbackRepo = dataSource.getRepository(Feedback);
  }

  postFeedback: RequestHandler = async (req, res) => {
    const feedback = this.feedbackRepo.create(req.body);
    await this.feedbackRepo.insert(feedback);
    const payload = createPayload(req);
    const config = {
      headers: {
        Authorization: `Bearer ${env.SLACK_API_TOKEN}`,
      },
    };
    await axios.post("https://slack.com/api/chat.postMessage", payload, config);
    res.sendStatus(200);
  };
}

function createPayload(req: Request): SlackPayload {
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: ":mailbox_with_mail: Feedback from data portal",
      },
    },
  ];

  if (req.body.name || req.body.email) {
    let nameEmailText = "";
    if (req.body.name) {
      nameEmailText += `*Name:* ${req.body.name}\n`;
    }
    if (req.body.email) {
      nameEmailText += `*Email:* ${req.body.email}`;
    }
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: nameEmailText,
      },
    });
    blocks.push({ type: "divider" });
  }
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: req.body.message,
    },
  });

  return {
    channel: env.SLACK_NOTIFICATION_CHANNEL!,
    blocks: blocks,
  };
}

interface SlackPayload {
  channel: string;
  blocks: SlackBlock[];
}

interface SlackBlock {
  type: string;
  text?: SlackText;
}

interface SlackText {
  type: string;
  text: string;
}
