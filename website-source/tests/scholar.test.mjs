import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseScholarResponse,
  syncScholar,
  AUTHOR_ID,
} from '../scripts/sync-scholar.mjs';
const result = () => ({
  search_metadata: { status: 'Success' },
  search_parameters: { author_id: AUTHOR_ID },
  cited_by: {
    table: [
      { citations: { all: 1200 } },
      { h_index: { all: 14 } },
      { i10_index: { all: 18 } },
    ],
  },
});
test('extracts verified author metrics with exact successful fetch date', () => {
  const r = parseScholarResponse(result(), new Date('2026-09-17T12:00:00Z'));
  assert.equal(r.citations, 1200);
  assert.equal(r.i10Index, 18);
  assert.equal(r.asOf, '2026-09-17');
  assert.equal(r.approximate, false);
});
test('rejects missing metrics, other authors, nonnumeric counts, and inconsistent results', () => {
  for (const mutate of [
    (d) => (d.search_parameters.author_id = 'other'),
    (d) => d.cited_by.table.pop(),
    (d) => (d.cited_by.table[0].citations.all = '1200'),
    (d) => (d.cited_by.table[1].h_index.all = 100),
    (d) => (d.error = 'quota exceeded'),
  ]) {
    const d = result();
    mutate(d);
    assert.throws(() => parseScholarResponse(d));
  }
});
test('failed fetch and suspicious drop leave last successful file unchanged', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'scholar-test-'));
  const file = join(dir, 'scholar.json');
  const original = JSON.stringify({ citations: 1200, asOf: '2026-09-16' });
  await writeFile(file, original);
  try {
    await assert.rejects(
      syncScholar({
        apiKey: 'test',
        file,
        fetcher: async () => ({ ok: false, status: 429 }),
      }),
    );
    assert.equal(await readFile(file, 'utf8'), original);
    const bad = result();
    bad.cited_by.table[0].citations.all = 900;
    await assert.rejects(
      syncScholar({
        apiKey: 'test',
        file,
        fetcher: async () => ({ ok: true, json: async () => bad }),
      }),
    );
    assert.equal(await readFile(file, 'utf8'), original);
  } finally {
    await rm(dir, { recursive: true });
  }
});
test('successful response replaces the snapshot atomically', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'scholar-test-'));
  const file = join(dir, 'scholar.json');
  await writeFile(file, JSON.stringify({ citations: 1170 }));
  try {
    await syncScholar({
      apiKey: 'test',
      file,
      fetcher: async () => ({ ok: true, json: async () => result() }),
    });
    assert.equal(JSON.parse(await readFile(file, 'utf8')).citations, 1200);
  } finally {
    await rm(dir, { recursive: true });
  }
});

const htmlProfile = (id = AUTHOR_ID) =>
  `<link rel="canonical" href="https://scholar.google.com/citations?user=${id}&amp;hl=en"><div id="gsc_prf_in">He Albert Zhang</div><table id="gsc_rsb_st"><tr><td>Citations</td><td class="gsc_rsb_std">1,203</td><td>1197</td></tr><tr><td>h-index</td><td>15</td><td>15</td></tr><tr><td>i10-index</td><td>19</td><td>19</td></tr></table>`;
test('free public-profile parser reads all-time rather than recent metrics', async () => {
  const { parseScholarHtml } = await import('../scripts/sync-scholar.mjs');
  const r = parseScholarHtml(htmlProfile(), new Date('2026-09-18T02:30:00Z'));
  assert.equal(r.citations, 1203);
  assert.equal(r.hIndex, 15);
  assert.equal(r.i10Index, 19);
  assert.equal(r.source, 'Google Scholar public profile');
  assert.equal(r.asOf, '2026-09-18');
});
test('public parser rejects challenges, wrong author, missing rows, and nonnumeric data', async () => {
  const { parseScholarHtml } = await import('../scripts/sync-scholar.mjs');
  for (const html of [
    '<html>unusual traffic</html>',
    htmlProfile('other'),
    htmlProfile().replace('<td>19</td>', '<td>unknown</td>'),
    htmlProfile().replace('gsc_rsb_st', 'error_table'),
  ])
    assert.throws(() => parseScholarHtml(html));
});
test('no API key uses the free Scholar endpoint and persists all metrics', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'scholar-free-'));
  const file = join(dir, 'scholar.json');
  await writeFile(file, JSON.stringify({ citations: 1170 }));
  try {
    await syncScholar({
      apiKey: '',
      file,
      fetcher: async (url) => {
        assert.equal(url.hostname, 'scholar.google.com');
        assert.equal(url.searchParams.get('user'), AUTHOR_ID);
        assert.equal(url.searchParams.has('api_key'), false);
        return { ok: true, text: async () => htmlProfile() };
      },
    });
    assert.equal(JSON.parse(await readFile(file, 'utf8')).citations, 1203);
  } finally {
    await rm(dir, { recursive: true });
  }
});
