import { RequestHandler } from "express";
import { DataSource, Repository } from "typeorm";
import { NewsItem } from "../entity/NewsItem";
import { PermissionType } from "../entity/Permission";
import { Authenticator } from "../lib/auth";
import env from "../lib/env";
import { Parser as CommonmarkParser, HtmlRenderer as CommonmarkHtmlRenderer } from "commonmark";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export class NewsRoutes {
  constructor(dataSource: DataSource, authenticator: Authenticator) {
    this.newsRepo = dataSource.getRepository(NewsItem);
    this.authenticator = authenticator;
  }

  readonly newsRepo: Repository<NewsItem>;
  readonly authenticator: Authenticator;

  postNews: RequestHandler = async (req, res, next) => {
    const { title, content, date, draft } = req.body;
    if (typeof title !== "string" || typeof content !== "string" || typeof date !== "string") {
      return next({ status: 400, error: "title, content, and date are required" });
    }
    const news = new NewsItem();
    news.title = title;
    news.content = content;
    news.date = new Date(date);
    news.slug = generateSlug(title);
    news.draft = draft === true;
    await this.newsRepo.save(news);
    res.sendStatus(201);
  };

  getNews: RequestHandler = async (req, res) => {
    const parsed = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : NaN;
    const limit = Number.isFinite(parsed) ? parsed : 10;

    const canManageNews = req.user
      ? await this.authenticator.hasPermission(req.user, PermissionType.canManageNews)
      : false;

    const query = this.newsRepo.createQueryBuilder("news").orderBy("news.date", "DESC").take(limit);
    if (!canManageNews) {
      query.where("news.draft = :draft", { draft: false });
    }

    const news = await query.getMany();
    res.send(news);
  };

  getNewsItemBySlug: RequestHandler = async (req, res, next) => {
    const news = await this.findBySlug(req.params.slug as string, next);
    if (!news) return;

    const canManageNews = req.user
      ? await this.authenticator.hasPermission(req.user, PermissionType.canManageNews)
      : false;
    if (news.draft && !canManageNews) {
      return next({ status: 404, error: "News item not found" });
    }

    res.send(news);
  };

  deleteNewsItemBySlug: RequestHandler = async (req, res, next) => {
    const news = await this.findBySlug(req.params.slug as string, next);
    if (!news) return;
    await this.newsRepo.delete(news.uuid);
    res.sendStatus(204);
  };

  updateNewsItemBySlug: RequestHandler = async (req, res, next) => {
    const news = await this.findBySlug(req.params.slug as string, next);
    if (!news) return;

    const { title, content, date, draft } = req.body;
    if (typeof title !== "string" || typeof content !== "string" || typeof date !== "string") {
      return next({ status: 400, error: "title, content, and date are required" });
    }

    news.title = title;
    news.content = content;
    news.date = new Date(date);
    news.slug = generateSlug(title);
    news.draft = draft === true;

    await this.newsRepo.save(news);
    res.sendStatus(200);
  };

  private htmlContent(item: NewsItem) {
    const reader = new CommonmarkParser();
    const writer = new CommonmarkHtmlRenderer();
    try {
      const parsed = reader.parse(item.content);
      return writer.render(parsed);
    } catch (error) {
      return item.content.replace(/\n/g, "<br>");
    }
  }

  getNewsAtomFeed: RequestHandler = async (req, res) => {
    const newsItems = await this.newsRepo.find({
      where: { draft: false },
      order: { date: "DESC" },
      take: 10,
    });

    const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Cloudnet news</title>
  <subtitle>Latest news from the Cloudnet data portal</subtitle>
  <link href="${env.DP_FRONTEND_URL}/news.atom" rel="self" type="application/atom+xml" />
  <link href="${env.DP_FRONTEND_URL}" rel="alternate" type="text/html" />
  <id>${env.DP_FRONTEND_URL}/news.atom</id>
  <updated>${new Date(newsItems[0].date).toISOString()}</updated>
  <author>
    <name>CLU</name>
  </author>${newsItems
    .map(
      (item) => `
  <entry>
    <title>${this.escapeXml(item.title)}</title>
    <link href="${env.DP_FRONTEND_URL}/news/${item.slug}" rel="alternate" type="text/html" />
    <id>urn:uuid:${item.uuid}</id>
    <published>${new Date(item.date).toISOString()}</published>
    <updated>${new Date(item.date).toISOString()}</updated>
    <content type="html">${this.escapeXml(this.htmlContent(item))}</content>
  </entry>`,
    )
    .join("")}
</feed>`;

    res.set("Content-Type", "application/atom+xml; charset=utf-8");
    res.send(feed);
  };

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  private async findBySlug(slug: string, next: Parameters<RequestHandler>[2]): Promise<NewsItem | null> {
    const news = await this.newsRepo.findOne({ where: { slug } });
    if (!news) {
      next({ status: 404, error: "News item not found" });
      return null;
    }
    return news;
  }
}
