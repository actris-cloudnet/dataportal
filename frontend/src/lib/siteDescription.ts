import { renderMarkdown } from "@/lib/markdown";

export interface ParsedSiteDescription {
  /** HTML before the first level-2 heading. */
  intro: string;
  /** HTML of all level-2 sections except "Links". */
  sections: string;
  /** Anchor elements found under the "Links" heading, as HTML. */
  links: string[];
}

/**
 * Splits a site description (Markdown) into the parts shown on the site page. The "Links" section is
 * extracted as a list of anchors and the first list after a "References" heading gets a `references` class.
 */
export function parseSiteDescription(markdown: string): ParsedSiteDescription {
  const doc = new DOMParser().parseFromString(renderMarkdown(markdown), "text/html");
  const intro: string[] = [];
  const sections: string[] = [];
  const links: string[] = [];
  let part: "intro" | "sections" | "links" = "intro";
  let referencesListPending = false;
  for (const node of Array.from(doc.body.children)) {
    if (node.tagName === "H2") {
      const heading = node.textContent?.trim();
      part = heading === "Links" ? "links" : "sections";
      referencesListPending = heading === "References";
    } else if (referencesListPending && (node.tagName === "UL" || node.tagName === "OL")) {
      node.classList.add("references");
      referencesListPending = false;
    }
    for (const anchor of Array.from(node.querySelectorAll("a"))) {
      const href = anchor.getAttribute("href");
      if (href && /^https?:\/\/(?!cloudnet\.fmi\.fi)/.test(href)) {
        anchor.setAttribute("target", "_blank");
      }
    }
    if (part === "links") {
      for (const anchor of Array.from(node.querySelectorAll("li"))) {
        links.push(anchor.innerHTML);
      }
    } else {
      (part === "intro" ? intro : sections).push(node.outerHTML);
    }
  }
  return { intro: intro.join("\n"), sections: sections.join("\n"), links };
}
