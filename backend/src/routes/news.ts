import { RequestHandler } from "express";
import { DataSource, Repository } from "typeorm";
import { NewsItem } from "../entity/NewsItem";
import { PermissionType } from "../entity/Permission";
import { Authenticator } from "../lib/auth";

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
    await this.newsRepo.delete(news.id);
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

  private async findBySlug(slug: string, next: Parameters<RequestHandler>[2]): Promise<NewsItem | null> {
    const news = await this.newsRepo.findOne({ where: { slug } });
    if (!news) {
      next({ status: 404, error: "News item not found" });
      return null;
    }
    return news;
  }
}
