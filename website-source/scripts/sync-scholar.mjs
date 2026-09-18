import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
export const AUTHOR_ID = 'MgxFi7QAAAAJ';
export function parseScholarResponse(data, now = new Date()) {
  if (data.error || data.search_metadata?.status !== 'Success')
    throw new Error('Scholar provider did not return a successful result.');
  if (data.search_parameters?.author_id !== AUTHOR_ID)
    throw new Error('Scholar author identity does not match.');
  const table = data.cited_by?.table;
  if (!Array.isArray(table)) throw new Error('Missing citation metrics.');
  function count(key) {
    const value = table.find((row) => row[key])?.[key]?.all;
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error('Invalid citation metrics.');
    return value;
  }
  const citations = count('citations'),
    hIndex = count('h_index'),
    i10Index = count('i10_index');
  if (hIndex * hIndex > citations || i10Index * 10 > citations)
    throw new Error('Inconsistent citation metrics.');
  return {
    authorId: AUTHOR_ID,
    citations,
    hIndex,
    i10Index,
    approximate: false,
    asOf: now.toISOString().slice(0, 10),
    lastSuccessfulSync: now.toISOString(),
    source: 'Google Scholar via SerpApi',
  };
}

export function parseScholarHtml(html, now = new Date()) {
  // Require the real profile and its canonical author ID; challenge/error pages never count as data.
  const canonical = html
    .match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1]
    ?.replaceAll('&amp;', '&');
  let id;
  try {
    id = new URL(canonical).searchParams.get('user');
  } catch {
    throw new Error(
      'Scholar profile identity missing; previous data retained.',
    );
  }
  if (id !== AUTHOR_ID || !/id=["']gsc_prf_in["']/.test(html))
    throw new Error('Scholar author identity does not match.');
  const table = html.match(
    /<table\b[^>]*id=["']gsc_rsb_st["'][^>]*>([\s\S]*?)<\/table>/i,
  )?.[1];
  if (!table)
    throw new Error('Scholar metrics unavailable; previous data retained.');
  const values = {};
  for (const row of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(
      (m) =>
        m[1]
          .replace(/<[^>]*>/g, '')
          .replaceAll('&nbsp;', ' ')
          .trim(),
    );
    if (
      cells.length >= 3 &&
      ['Citations', 'h-index', 'i10-index'].includes(cells[0])
    ) {
      if (!/^\d[\d,]*$/.test(cells[1]))
        throw new Error('Invalid Scholar metric.');
      values[cells[0]] = Number(cells[1].replaceAll(',', ''));
    }
  }
  const result = parseScholarResponse(
    {
      search_metadata: { status: 'Success' },
      search_parameters: { author_id: AUTHOR_ID },
      cited_by: {
        table: [
          { citations: { all: values.Citations } },
          { h_index: { all: values['h-index'] } },
          { i10_index: { all: values['i10-index'] } },
        ],
      },
    },
    now,
  );
  return { ...result, source: 'Google Scholar public profile' };
}

export async function syncScholar({
  apiKey = process.env.SERPAPI_API_KEY,
  file = new URL('../data/scholar.json', import.meta.url),
  fetcher = fetch,
} = {}) {
  const previous = JSON.parse(await readFile(file, 'utf8'));
  const url = new URL(
    apiKey
      ? 'https://serpapi.com/search.json'
      : 'https://scholar.google.com/citations',
  );
  url.search = new URLSearchParams(
    apiKey
      ? {
          engine: 'google_scholar_author',
          author_id: AUTHOR_ID,
          hl: 'en',
          api_key: apiKey,
          num: '20',
        }
      : { user: AUTHOR_ID, hl: 'en' },
  ).toString();
  // Never log the request URL: it contains the provider credential.
  const response = await fetcher(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok)
    throw new Error(
      `Scholar provider HTTP ${response.status}; previous data retained.`,
    );
  const next = apiKey
    ? parseScholarResponse(await response.json())
    : parseScholarHtml(await response.text());
  // Large unexpected drops need review; do not silently replace valid data with an incomplete result.
  if (previous.citations > 0 && next.citations < previous.citations * 0.8)
    throw new Error(
      'Citation count dropped by more than 20%; previous data retained for review.',
    );
  const target = file instanceof URL ? fileURLToPath(file) : file;
  const temporary = target + '.tmp';
  await writeFile(temporary, JSON.stringify(next, null, 2) + '\n');
  await rename(temporary, target);
  console.log(
    `Scholar metrics updated: ${next.citations} citations, h-index ${next.hIndex}, i10-index ${next.i10Index}.`,
  );
  return next;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  syncScholar().catch((error) => {
    console.error(
      error instanceof TypeError
        ? 'Scholar connection failed; previous data retained.'
        : error.message,
    );
    process.exitCode = 1;
  });
}
