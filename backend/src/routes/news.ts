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
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const news = await this.newsRepo.find({
      order: { date: "DESC" },
      take: limit,
    });
    res.send(news);
  };

  getNewsItemBySlug: RequestHandler = async (req, res, next) => {
    const slug = req.params.slug;
    if (!slug || typeof slug !== "string") {
      return next({ status: 400, error: "Invalid news slug" });
    }
    const news = await this.newsRepo.findOne({ where: { slug } });
    if (!news) {
      return next({ status: 404, error: "News item not found" });
    }
    res.send(news);
  };

  deleteNewsItemBySlug: RequestHandler = async (req, res, next) => {
    const slug = req.params.slug;
    if (!slug || typeof slug !== "string") {
      return next({ status: 400, error: "Invalid news slug" });
    }

    const news = await this.newsRepo.findOne({ where: { slug } });
    if (!news) {
      return next({ status: 404, error: "News item not found" });
    }

    await this.newsRepo.delete(news.id);
    res.sendStatus(204);
  };

  updateNewsItemBySlug: RequestHandler = async (req, res, next) => {
    const slug = req.params.slug;
    if (!slug || typeof slug !== "string") {
      return next({ status: 400, error: "Invalid news slug" });
    }

    const { title, content, date } = req.body;
    if (typeof title !== "string" || typeof content !== "string" || typeof date !== "string") {
      return next({ status: 400, error: "title, content, and date are required" });
    }

    const news = await this.newsRepo.findOne({ where: { slug } });
    if (!news) {
      return next({ status: 404, error: "News item not found" });
    }

    news.title = title;
    news.content = content;
    news.date = new Date(date);
    news.slug = generateSlug(title);

    await this.newsRepo.save(news);
    res.sendStatus(200);
  };
}
