// ops/lib/md-to-wp.mjs
//
// Pure, dependency-free helpers to turn a DonaTalk content draft
// (docs/company/content/*.md, YAML frontmatter + Markdown body) into a
// WordPress REST payload. No network, no secrets here - the CLI
// (ops/publish-wp.mjs) wires these to the WP REST API.
//
// The Markdown subset is exactly what the in-house drafts use: headings,
// bold/italic, links, unordered/ordered lists, GFM pipe tables, blockquotes,
// horizontal rules, and paragraphs. It is intentionally small and tested
// (md-to-wp.test.mjs) rather than a general-purpose parser.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

function escapeHtml(text) {
  return text.replace(/[&<>]/g, (c) => ESCAPES[c]);
}

function stripQuotes(v) {
  const t = v.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

/**
 * Parse a leading `---` YAML frontmatter block. Supports scalar `key: value`
 * pairs and one level of `- item` lists (e.g. secondary_keywords). Returns
 * { meta, body }. With no frontmatter, meta is {} and body is the raw input.
 */
export function parseFrontmatter(raw) {
  const s = String(raw).replace(/\r\n/g, '\n');
  const m = s.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: s };
  const body = s.slice(m[0].length);
  const meta = {};
  let curKey = null;
  for (const line of m[1].split('\n')) {
    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && curKey) {
      if (!Array.isArray(meta[curKey])) meta[curKey] = [];
      meta[curKey].push(stripQuotes(listItem[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      curKey = kv[1];
      const val = kv[2].trim();
      meta[curKey] = val === '' ? [] : stripQuotes(val);
    }
  }
  return { meta, body };
}

// Inline formatting: code, links, bold, italic. Input is raw (un-escaped) text.
function renderInline(text) {
  // Protect inline code spans first so their contents aren't re-formatted.
  // NUL-delimited sentinels can't occur in Markdown source, so the restore step
  // can't collide with real text (e.g. a number like "1 in 100").
  const codes = [];
  let s = text.replace(/`([^`]+)`/g, (_, code) => {
    codes.push('<code>' + escapeHtml(code) + '</code>');
    return '\x00' + (codes.length - 1) + '\x00';
  });

  s = escapeHtml(s);

  // Links: [text](url).
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => `<a href="${url}">${label}</a>`);
  // Bold before italic so ** isn't consumed by the single-* rule.
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>');

  // Restore protected code spans.
  if (codes.length) s = s.replace(/\x00(\d+)\x00/g, (_, i) => codes[Number(i)]);
  return s;
}

function isBlank(line) {
  return /^\s*$/.test(line);
}

function isTableSeparator(line) {
  return /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)+\|?\s*$/.test(line);
}

function splitRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

function isBlockStart(line, next) {
  return (
    /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line) ||
    /^(#{1,6})\s+/.test(line) ||
    /^\s*>/.test(line) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line) ||
    (line.includes('|') && next !== undefined && isTableSeparator(next))
  );
}

// Convert the Markdown body (frontmatter already stripped) to HTML.
export function markdownToHtml(md) {
  const lines = String(md).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (isBlank(line)) { i++; continue; }

    // Horizontal rule (a line of only ---, ***, or ___).
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out.push('<hr />'); i++; continue; }

    // Heading.
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { out.push(`<h${h[1].length}>${renderInline(h[2].trim())}</h${h[1].length}>`); i++; continue; }

    // Blockquote: gather consecutive `>` lines, render their inner Markdown.
    if (/^\s*>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      out.push(`<blockquote>\n${markdownToHtml(buf.join('\n'))}\n</blockquote>`);
      continue;
    }

    // GFM pipe table: a header row followed by a separator row.
    if (line.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = splitRow(line);
      i += 2; // skip header + separator
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && !isBlank(lines[i])) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const thead = `<thead><tr>${header.map((c) => `<th>${renderInline(c)}</th>`).join('')}</tr></thead>`;
      const tbody = `<tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody>`;
      out.push(`<table>${thead}${tbody}</table>`);
      continue;
    }

    // Unordered list.
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(renderInline(lines[i].replace(/^\s*[-*+]\s+/, '').trim()));
        i++;
      }
      out.push(`<ul>\n${items.map((it) => `<li>${it}</li>`).join('\n')}\n</ul>`);
      continue;
    }

    // Ordered list.
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(renderInline(lines[i].replace(/^\s*\d+\.\s+/, '').trim()));
        i++;
      }
      out.push(`<ol>\n${items.map((it) => `<li>${it}</li>`).join('\n')}\n</ol>`);
      continue;
    }

    // Paragraph: gather consecutive lines until a blank or a block starter.
    const para = [];
    while (i < lines.length && !isBlank(lines[i]) && !isBlockStart(lines[i], lines[i + 1])) {
      para.push(lines[i].trim());
      i++;
    }
    if (para.length) out.push(`<p>${renderInline(para.join(' '))}</p>`);
  }

  return out.join('\n');
}

// Build the WordPress REST post payload. status is 'draft' unless publish=true.
export function buildWpPayload({ meta, html }, { publish = false } = {}) {
  const payload = {
    title: meta.title || '(untitled)',
    content: html,
    excerpt: meta.meta_description || '',
    status: publish ? 'publish' : 'draft',
  };
  if (meta.slug) payload.slug = meta.slug;
  return payload;
}

// Full transform: raw markdown file text -> { meta, payload }.
export function draftToWp(raw, opts = {}) {
  const { meta, body } = parseFrontmatter(raw);
  const html = markdownToHtml(body);
  return { meta, payload: buildWpPayload({ meta, html }, opts) };
}
