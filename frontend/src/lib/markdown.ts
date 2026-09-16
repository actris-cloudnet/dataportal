import * as commonmark from "commonmark";

const parser = new commonmark.Parser();
const renderer = new commonmark.HtmlRenderer();

export function renderMarkdown(markdown: string): string {
  try {
    return renderer.render(parser.parse(markdown));
  } catch (error) {
    console.error("Markdown parsing error:", error);
    return markdown.replace(/\n/g, "<br>");
  }
}
