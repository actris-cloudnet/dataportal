import { describe, expect, it } from "vitest";
import { parseSiteDescription } from "../src/lib/siteDescription";

describe("parseSiteDescription", () => {
  it("splits intro, sections and links", () => {
    const result = parseSiteDescription(
      "Intro *text*.\n\nSecond paragraph.\n\n## History\n\nSome history.\n\n## Links\n\n- [Home](https://example.com)\n",
    );
    expect(result.intro).toBe("<p>Intro <em>text</em>.</p>\n<p>Second paragraph.</p>");
    expect(result.sections).toBe("<h2>History</h2>\n<p>Some history.</p>");
    expect(result.links).toEqual(['<a href="https://example.com" target="_blank">Home</a>']);
  });

  it("returns empty parts for empty input", () => {
    expect(parseSiteDescription("")).toEqual({ intro: "", sections: "", links: [] });
  });

  it("keeps links with titles and inline formatting", () => {
    const result = parseSiteDescription(
      '## Links\n\n- [**Home** page](https://example.com "Site home")\n- Data at [portal](https://data.example.com)\n',
    );
    expect(result.intro).toBe("");
    expect(result.links).toEqual([
      '<a href="https://example.com" title="Site home" target="_blank"><strong>Home</strong> page</a>',
      '<a href="https://data.example.com" target="_blank">portal</a>',
    ]);
  });

  it("keeps sections that come after Links", () => {
    const result = parseSiteDescription(
      "Intro.\n\n## Links\n\n- [Home](https://example.com)\n\n## References\n\n- Author (2020). [doi](https://doi.org/1)\n",
    );
    expect(result.links).toEqual(['<a href="https://example.com" target="_blank">Home</a>']);
    expect(result.sections).toBe(
      '<h2>References</h2>\n<ul class="references">\n<li>Author (2020). <a href="https://doi.org/1">doi</a></li>\n</ul>',
    );
  });

  it("marks the first list after References even when text precedes it", () => {
    const result = parseSiteDescription(
      "## References\n\nKey papers:\n\n1. Author (2020).\n\n## Other\n\n- Not a reference\n",
    );
    expect(result.sections).toBe(
      '<h2>References</h2>\n<p>Key papers:</p>\n<ol class="references">\n<li>Author (2020).</li>\n</ol>\n<h2>Other</h2>\n<ul>\n<li>Not a reference</li>\n</ul>',
    );
  });

  it("keeps raw HTML", () => {
    const result = parseSiteDescription('Hello <b>bold</b>\n\n## Links\n\n- <a href="https://example.com">raw</a>\n');
    expect(result.intro).toBe("<p>Hello <b>bold</b></p>");
    expect(result.links).toEqual(['<a href="https://example.com" target="_blank">raw</a>']);
  });
});
