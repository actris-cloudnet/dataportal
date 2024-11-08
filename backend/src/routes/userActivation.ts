import { DataSource, Repository } from "typeorm";
import { RequestHandler } from "express";

import { UserAccount } from "../entity/UserAccount";
import { randomString } from "../lib";

const errorTemplate = `<!doctype html>
<title>Cloudnet credentials</title>
<h1>Cloudnet credentials</h1>
<p>
  Unable to view credentials!<br>
  Make sure that the link is correct and you have not viewed the credentials previously.
</p>`;

const getTemplate = `<!doctype html>
<title>Cloudnet credentials</title>
<h1>Cloudnet credentials</h1>
<p>
  Show credentials by pressing the button below.<br>
  Remember to take note of the credentials, as you cannot access them via this page afterwards.
</p>
<form action="" method="POST">
  <input type="submit" value="Show credentials">
</form>`;

const postTemplate = (username: string, password: string) => `<!doctype html>
<title>Cloudnet credentials</title>
<h1>Cloudnet credentials</h1>
<p>
  Show credentials by pressing the button below.<br>
  Remember to take note of the credentials, as you cannot access them via this page afterwards.
</p>
<p>
  <strong>Username:</strong> ${username}<br>
  <strong>Password:</strong> ${password}
</p>`;

export class UserActivationRoutes {
  private userAccountRepository: Repository<UserAccount>;

  constructor(dataSource: DataSource) {
    this.userAccountRepository = dataSource.getRepository(UserAccount);
  }

  get: RequestHandler = async (req, res) => {
    const user = await this.userAccountRepository.findOneBy({ activationToken: req.params.token });
    if (!user) {
      res.status(404).contentType("text/html; charset=utf-8").send(errorTemplate);
      return;
    }
    res.contentType("text/html; charset=utf-8").send(getTemplate);
  };

  post: RequestHandler = async (req, res) => {
    const user = await this.userAccountRepository.findOneBy({ activationToken: req.params.token });
    if (!user) {
      res.status(404).contentType("text/html; charset=utf-8").send(errorTemplate);
      return;
    }
    const password = randomString(32);
    user.setPassword(password);
    user.activationToken = null;
    await this.userAccountRepository.save(user);
    res.status(201).contentType("text/html; charset=utf-8").send(postTemplate(user.username, password));
  };
}
