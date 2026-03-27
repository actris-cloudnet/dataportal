import { RequestHandler } from "express";
import { DataSource, Repository } from "typeorm";
import { NewsItem } from "../entity/NewsItem";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export class NewsRoutes {
  constructor(dataSource: DataSource) {
    this.newsRepo = dataSource.getRepository(NewsItem);
  }

  readonly newsRepo: Repository<NewsItem>;

  postNews: RequestHandler = async (req, res, next) => {
    const { title, content, date } = req.body;
    if (typeof title !== "string" || typeof content !== "string" || typeof date !== "string") {
      return next({ status: 400, error: "title, content, and date are required" });
    }
    const news = new NewsItem();
    news.title = title;
    news.content = content;
    news.date = new Date(date);
    news.slug = generateSlug(title);
    await this.newsRepo.save(news);
    res.sendStatus(201);
  };

  getNews: RequestHandler = async (req, res) => {
    const parsed = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : NaN;
    const limit = Number.isFinite(parsed) ? parsed : 10;
    const news = await this.newsRepo.find({
      order: { date: "DESC" },
      take: limit,
    });
    res.send(news);
  };

  getNewsItemBySlug: RequestHandler = async (req, res, next) => {
    const news = await this.findBySlug(req.params.slug as string, next);
    if (!news) return;
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

    const { title, content, date } = req.body;
    if (typeof title !== "string" || typeof content !== "string" || typeof date !== "string") {
      return next({ status: 400, error: "title, content, and date are required" });
    }

    news.title = title;
    news.content = content;
    news.date = new Date(date);
    news.slug = generateSlug(title);

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
