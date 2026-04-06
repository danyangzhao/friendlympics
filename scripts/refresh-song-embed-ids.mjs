#!/usr/bin/env node
/**
 * Refreshes data/prompts.json song youtubeIds by searching YouTube and picking the first
 * video whose watch-page ytInitialPlayerResponse has playabilityStatus.playableInEmbed === true.
 *
 * Usage: node scripts/refresh-song-embed-ids.mjs
 */
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';

const PROMPTS_PATH = fileURLToPath(new URL('../data/prompts.json', import.meta.url));

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        },
        (res) => {
          let d = '';
          res.on('data', (c) => (d += c));
          res.on('end', () => resolve(d));
        }
      )
      .on('error', reject);
  });
}

function parseYtInitialPlayerResponse(html) {
  const marker = 'ytInitialPlayerResponse';
  const i = html.indexOf(marker);
  if (i < 0) return null;
  const jsonStart = html.slice(i).indexOf('{');
  const start = i + jsonStart;
  let depth = 0;
  let j = start;
  for (; j < html.length; j++) {
    const c = html[j];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        j++;
        break;
      }
    }
  }
  try {
    return JSON.parse(html.slice(start, j));
  } catch {
    return null;
  }
}

function extractVideoIdsFromSearch(html) {
  const re = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
  const seen = new Set();
  const ordered = [];
  let m;
  while ((m = re.exec(html))) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      ordered.push(m[1]);
    }
  }
  return ordered;
}

async function isEmbeddableOnWatchPage(videoId) {
  const html = await get(`https://www.youtube.com/watch?v=${videoId}`);
  const pr = parseYtInitialPlayerResponse(html);
  if (!pr?.playabilityStatus) return false;
  const ps = pr.playabilityStatus;
  return ps.status === 'OK' && ps.playableInEmbed === true;
}

async function findEmbeddableId(title, artist, previousId) {
  if (previousId && (await isEmbeddableOnWatchPage(previousId))) {
    return { id: previousId, query: null, kept: true };
  }

  const queries = [
    `${title} ${artist} karaoke instrumental`,
    `${title} ${artist} karaoke`,
    `${title} ${artist} backing track`,
  ];
  const tried = new Set();

  for (const q of queries) {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
    const searchHtml = await get(searchUrl);
    const ids = extractVideoIdsFromSearch(searchHtml).slice(0, 6);

    for (const id of ids) {
      if (tried.has(id)) continue;
      tried.add(id);
      if (await isEmbeddableOnWatchPage(id)) {
        return { id, query: q };
      }
    }
  }

  return { id: previousId, query: null, kept: false, failed: true };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const raw = fs.readFileSync(PROMPTS_PATH, 'utf8');
  const prompts = JSON.parse(raw);
  const songs = prompts.songs;
  if (!Array.isArray(songs)) {
    console.error('No songs array in prompts.json');
    process.exit(1);
  }

  console.error(`Processing ${songs.length} songs (slow; ~2 req/s to avoid rate limits)…`);

  const out = [];
  for (let i = 0; i < songs.length; i++) {
    const s = songs[i];
    const prev = s.youtubeId;
    process.stderr.write(`[${i + 1}/${songs.length}] ${s.title} — ${s.artist}… `);
    const result = await findEmbeddableId(s.title, s.artist, prev);
    await sleep(500);

    if (result.failed) {
      console.error(`FAIL (kept ${prev})`);
    } else if (result.kept) {
      console.error(`kept ${result.id} (already embeddable)`);
    } else {
      console.error(`→ ${result.id} (${result.query})`);
    }

    out.push({
      ...s,
      youtubeId: result.id,
    });
  }

  prompts.songs = out;
  fs.writeFileSync(PROMPTS_PATH, JSON.stringify(prompts, null, 2) + '\n');
  console.error('Wrote', PROMPTS_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
