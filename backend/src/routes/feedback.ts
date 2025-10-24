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
    res.sendStatus(200);
    const comment = createComment(req);
    if (env.SLACK_API_TOKEN && env.SLACK_NOTIFICATION_CHANNEL) {
      sendSlackAlert(env.SLACK_API_TOKEN, env.SLACK_NOTIFICATION_CHANNEL, comment, req.body.message).catch((err) => {
        console.error(`Failed to send Slack alert: ${err}`);
      });
    }
  };
}

function createComment(req: Request): string {
  let output = "*:mailbox_with_mail: Feedback from data portal*";
  if (req.body.name) {
    output += `\n\n*Name:* ${req.body.name}`;
  }
  if (req.body.email) {
    output += `\n\n*Email:* ${req.body.email}`;
  }
  return output;
}

async function sendSlackAlert(token: string, channelId: string, comment: string, message: string) {
  const res1 = await axios.post(
    "https://slack.com/api/files.getUploadURLExternal",
    { length: message.length, filename: "message.txt" },
    {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "authorization": `Bearer ${token}`,
      },
    },
  );
  if (!res1.data.ok) {
    throw new Error(JSON.stringify(res1.data));
  }
  const { upload_url: uploadUrl, file_id: fileId } = res1.data;
  await axios.post(uploadUrl, message);
  const res2 = await axios.post(
    "https://slack.com/api/files.completeUploadExternal",
    {
      files: [{ id: fileId, title: "Message" }],
      channel_id: channelId,
      initial_comment: comment,
    },
    { headers: { authorization: `Bearer ${token}` } },
  );
  if (!res2.data.ok) {
    throw new Error(JSON.stringify(res2.data));
  }
}
