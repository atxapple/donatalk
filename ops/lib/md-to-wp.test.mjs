import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  parseFrontmatter,
  markdownToHtml,
  buildWpPayload,
  draftToWp,
} from './md-to-wp.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.resolve(here, '../../docs/company/content');

describe('parseFrontmatter', () => {
  it('parses scalars, quotes, and list values', () => {
    const raw = [
      '---',
      'title: "Hello, World"',
      'slug: hello-world',
      'status: draft',
      'secondary_keywords:',
      '  - one',
      '  - two',
      '---',
      '# Body',
      '',
      'Text.',
    ].join('\n');
    const { meta, body } = parseFrontmatter(raw);
    expect(meta.title).toBe('Hello, World');
    expect(meta.slug).toBe('hello-world');
    expect(meta.status).toBe('draft');
    expect(meta.secondary_keywords).toEqual(['one', 'two']);
    expect(body.startsWith('# Body')).toBe(true);
  });

  it('returns empty meta and raw body when no frontmatter', () => {
    const { meta, body } = parseFrontmatter('# Just a heading\n');
    expect(meta).toEqual({});
    expect(body).toBe('# Just a heading\n');
  });
});

describe('markdownToHtml', () => {
  it('renders headings h1-h6', () => {
    expect(markdownToHtml('# A')).toBe('<h1>A</h1>');
    expect(markdownToHtml('### C')).toBe('<h3>C</h3>');
    expect(markdownToHtml('###### F')).toBe('<h6>F</h6>');
  });

  it('renders inline bold, italic, and links', () => {
    expect(markdownToHtml('Say **hi** and *bye*')).toBe('<p>Say <strong>hi</strong> and <em>bye</em></p>');
    expect(markdownToHtml('See [DonaTalk](https://donatalk.com).')).toBe(
      '<p>See <a href="https://donatalk.com">DonaTalk</a>.</p>',
    );
  });

  it('does not corrupt numbers when there is no inline code', () => {
    expect(markdownToHtml('Send 1 in 100 and hear back.')).toBe('<p>Send 1 in 100 and hear back.</p>');
  });

  it('renders inline code without eating adjacent numbers', () => {
    expect(markdownToHtml('Use `x = 1` for 1 of 3 cases')).toBe(
      '<p>Use <code>x = 1</code> for 1 of 3 cases</p>',
    );
  });

  it('escapes raw HTML in text', () => {
    expect(markdownToHtml('a < b & c > d')).toBe('<p>a &lt; b &amp; c &gt; d</p>');
  });

  it('renders an unordered list', () => {
    expect(markdownToHtml('- one\n- two')).toBe('<ul>\n<li>one</li>\n<li>two</li>\n</ul>');
  });

  it('renders an ordered list', () => {
    expect(markdownToHtml('1. first\n2. second')).toBe('<ol>\n<li>first</li>\n<li>second</li>\n</ol>');
  });

  it('renders a horizontal rule', () => {
    expect(markdownToHtml('---')).toBe('<hr />');
  });

  it('renders a GFM pipe table', () => {
    const md = ['| A | B |', '| --- | --- |', '| 1 | 2 |'].join('\n');
    expect(markdownToHtml(md)).toBe(
      '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>',
    );
  });

  it('renders a blockquote with inner markdown', () => {
    expect(markdownToHtml('> **Quote** line')).toBe(
      '<blockquote>\n<p><strong>Quote</strong> line</p>\n</blockquote>',
    );
  });

  it('joins wrapped lines into one paragraph', () => {
    expect(markdownToHtml('line one\nline two')).toBe('<p>line one line two</p>');
  });

  it('separates a table that follows a paragraph', () => {
    const md = ['Intro text.', '', '| A | B |', '| --- | --- |', '| 1 | 2 |'].join('\n');
    const html = markdownToHtml(md);
    expect(html).toContain('<p>Intro text.</p>');
    expect(html).toContain('<table>');
  });
});

describe('buildWpPayload', () => {
  it('defaults to draft status', () => {
    const p = buildWpPayload({ meta: { title: 'T', slug: 's', meta_description: 'd' }, html: '<p>x</p>' });
    expect(p).toEqual({ title: 'T', content: '<p>x</p>', excerpt: 'd', status: 'draft', slug: 's' });
  });

  it('publishes only when explicitly asked', () => {
    const p = buildWpPayload({ meta: { title: 'T' }, html: '<p>x</p>' }, { publish: true });
    expect(p.status).toBe('publish');
    expect(p.slug).toBeUndefined();
  });
});

describe('real drafts', () => {
  for (const file of ['cold-email-alternatives.md', 'how-to-get-warm-introductions.md']) {
    it(`converts ${file} without leaking raw markdown or sentinels`, () => {
      const raw = readFileSync(path.join(contentDir, file), 'utf8');
      const { meta, payload } = draftToWp(raw);
      expect(meta.title).toBeTruthy();
      expect(payload.status).toBe('draft');
      expect(payload.content.length).toBeGreaterThan(500);
      // No NUL sentinels or leftover heading/emphasis markers at line starts.
      expect(payload.content).not.toContain('\x00');
      expect(payload.content).not.toMatch(/^#{1,6}\s/m);
      expect(payload.content).not.toMatch(/\*\*[^*]+\*\*/); // bold fully converted
    });
  }
});
