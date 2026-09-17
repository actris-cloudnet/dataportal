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
      'Data at <a href="https://data.example.com" target="_blank">portal</a>',
    ]);
  });

  it("keeps sections that come after Links", () => {
    const result = parseSiteDescription(
      "Intro.\n\n## Links\n\n- [Home](https://example.com)\n\n## References\n\n- Author (2020). [doi](https://doi.org/1)\n",
    );
    expect(result.links).toEqual(['<a href="https://example.com" target="_blank">Home</a>']);
    expect(result.sections).toBe(
      '<h2>References</h2>\n<ul class="references">\n<li>Author (2020). <a href="https://doi.org/1" target="_blank">doi</a></li>\n</ul>',
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

  it("adds target=_blank to external links in intro", () => {
    const result = parseSiteDescription("Check [our site](https://example.com) for more.\n");
    expect(result.intro).toBe('<p>Check <a href="https://example.com" target="_blank">our site</a> for more.</p>');
  });

  it("adds target=_blank to external links in sections", () => {
    const result = parseSiteDescription("Intro.\n\n## History\n\nSee [details](https://example.com) here.\n");
    expect(result.sections).toBe(
      '<h2>History</h2>\n<p>See <a href="https://example.com" target="_blank">details</a> here.</p>',
    );
  });

  it("does not add target=_blank to cloudnet.fmi.fi links in intro and sections", () => {
    const result = parseSiteDescription(
      "See [internal](https://cloudnet.fmi.fi/some-page) link.\n\n## Links\n\n- [Internal](https://cloudnet.fmi.fi)\n",
    );
    expect(result.intro).toBe('<p>See <a href="https://cloudnet.fmi.fi/some-page">internal</a> link.</p>');
    expect(result.links).toEqual(['<a href="https://cloudnet.fmi.fi">Internal</a>']);
  });

  it("handles http links with target=_blank", () => {
    const result = parseSiteDescription("Visit [site](http://example.com) for info.\n");
    expect(result.intro).toBe('<p>Visit <a href="http://example.com" target="_blank">site</a> for info.</p>');
  });

  it("handles mixed internal and external links", () => {
    const result = parseSiteDescription("See [internal](https://cloudnet.fmi.fi) and [external](https://other.com).\n");
    expect(result.intro).toBe(
      '<p>See <a href="https://cloudnet.fmi.fi">internal</a> and <a href="https://other.com" target="_blank">external</a>.</p>',
    );
  });
});
