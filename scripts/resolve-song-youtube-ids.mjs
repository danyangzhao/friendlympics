#!/usr/bin/env node
/**
 * Resolves working YouTube video IDs for Guess the Song via search + oEmbed check.
 * Run: node scripts/resolve-song-youtube-ids.mjs
 * Prints JSON array of { title, artist, youtubeId, startTime, chartBucket }
 */

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchSearchVideoIds(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
  if (!res.ok) throw new Error(`search ${res.status}`);
  const html = await res.text();
  const ids = new Set();
  for (const m of html.matchAll(/watch\?v=([a-zA-Z0-9_-]{11})/g)) {
    ids.add(m[1]);
  }
  return [...ids];
}

async function oembedOk(videoId) {
  const u = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&format=json`;
  const r = await fetch(u);
  return r.ok;
}

async function resolveSong(title, artist) {
  const queries = [
    `${title} ${artist} karaoke`,
    `${title} ${artist} lyrics`,
    `${title} ${artist} instrumental`,
    `${title} ${artist}`,
  ];
  for (const q of queries) {
    let ids;
    try {
      ids = await fetchSearchVideoIds(q);
    } catch {
      continue;
    }
    for (const id of ids.slice(0, 8)) {
      try {
        if (await oembedOk(id)) {
          return { youtubeId: id, query: q };
        }
      } catch {
        /* continue */
      }
    }
    await sleep(400);
  }
  return null;
}

/** Curated: ~50 current (2022–2026 Hot 100–style), 20 Billboard 2010s decade, 20 Billboard 2000s decade */
const current = [
  { title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', chartBucket: 'current' },
  { title: 'Luther', artist: 'Kendrick Lamar & SZA', chartBucket: 'current' },
  { title: 'Birds of a Feather', artist: 'Billie Eilish', chartBucket: 'current' },
  { title: 'APT.', artist: 'ROSÉ & Bruno Mars', chartBucket: 'current' },
  { title: 'A Bar Song (Tipsy)', artist: 'Shaboozey', chartBucket: 'current' },
  { title: 'Not Like Us', artist: 'Kendrick Lamar', chartBucket: 'current' },
  { title: 'Pink Pony Club', artist: 'Chappell Roan', chartBucket: 'current' },
  { title: 'Lose Control', artist: 'Teddy Swims', chartBucket: 'current' },
  { title: 'Espresso', artist: 'Sabrina Carpenter', chartBucket: 'current' },
  { title: 'Good Luck, Babe!', artist: 'Chappell Roan', chartBucket: 'current' },
  { title: 'Beautiful Things', artist: 'Benson Boone', chartBucket: 'current' },
  { title: 'Too Sweet', artist: 'Hozier', chartBucket: 'current' },
  { title: 'Stick Season', artist: 'Noah Kahan', chartBucket: 'current' },
  { title: 'I Had Some Help', artist: 'Post Malone & Morgan Wallen', chartBucket: 'current' },
  { title: 'Fortnight', artist: 'Taylor Swift ft Post Malone', chartBucket: 'current' },
  { title: 'Please Please Please', artist: 'Sabrina Carpenter', chartBucket: 'current' },
  { title: 'Hot To Go!', artist: 'Chappell Roan', chartBucket: 'current' },
  { title: 'Anti-Hero', artist: 'Taylor Swift', chartBucket: 'current' },
  { title: 'As It Was', artist: 'Harry Styles', chartBucket: 'current' },
  { title: 'Flowers', artist: 'Miley Cyrus', chartBucket: 'current' },
  { title: 'Kill Bill', artist: 'SZA', chartBucket: 'current' },
  { title: 'Unholy', artist: 'Sam Smith & Kim Petras', chartBucket: 'current' },
  { title: 'Calm Down', artist: 'Rema & Selena Gomez', chartBucket: 'current' },
  { title: 'vampire', artist: 'Olivia Rodrigo', chartBucket: 'current' },
  { title: 'Paint The Town Red', artist: 'Doja Cat', chartBucket: 'current' },
  { title: 'Cruel Summer', artist: 'Taylor Swift', chartBucket: 'current' },
  { title: 'greedy', artist: 'Tate McRae', chartBucket: 'current' },
  { title: 'yes, and?', artist: 'Ariana Grande', chartBucket: 'current' },
  { title: 'Lovin On Me', artist: 'Jack Harlow', chartBucket: 'current' },
  { title: 'TEXAS HOLD \'EM', artist: 'Beyoncé', chartBucket: 'current' },
  { title: 'Snooze', artist: 'SZA', chartBucket: 'current' },
  { title: 'Agora Hills', artist: 'Doja Cat', chartBucket: 'current' },
  { title: 'Feather', artist: 'Sabrina Carpenter', chartBucket: 'current' },
  { title: 'MILLION DOLLAR BABY', artist: 'Tommy Richman', chartBucket: 'current' },
  { title: 'Like That', artist: 'Future & Metro Boomin', chartBucket: 'current' },
  { title: 'I Remember Everything', artist: 'Zach Bryan ft Kacey Musgraves', chartBucket: 'current' },
  { title: 'I Am Not Okay', artist: 'Jelly Roll', chartBucket: 'current' },
  { title: 'Dance The Night', artist: 'Dua Lipa', chartBucket: 'current' },
  { title: 'About Damn Time', artist: 'Lizzo', chartBucket: 'current' },
  { title: 'Heat Waves', artist: 'Glass Animals', chartBucket: 'current' },
  { title: 'Bad Habit', artist: 'Steve Lacy', chartBucket: 'current' },
  { title: 'Industry Baby', artist: 'Lil Nas X & Jack Harlow', chartBucket: 'current' },
  { title: 'Levitating', artist: 'Dua Lipa', chartBucket: 'current' },
  { title: 'Blinding Lights', artist: 'The Weeknd', chartBucket: 'current' },
  { title: 'Watermelon Sugar', artist: 'Harry Styles', chartBucket: 'current' },
  { title: 'drivers license', artist: 'Olivia Rodrigo', chartBucket: 'current' },
  { title: 'good 4 u', artist: 'Olivia Rodrigo', chartBucket: 'current' },
  { title: 'Peaches', artist: 'Justin Bieber ft Daniel Caesar & Giveon', chartBucket: 'current' },
  { title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', chartBucket: 'current' },
  { title: 'Circles', artist: 'Post Malone', chartBucket: 'current' },
  { title: 'Save Your Tears', artist: 'The Weeknd', chartBucket: 'current' },
];

const hits2010s = [
  { title: 'Uptown Funk', artist: 'Mark Ronson ft Bruno Mars', chartBucket: '2010s' },
  { title: 'Party Rock Anthem', artist: 'LMFAO ft Lauren Bennett & GoonRock', chartBucket: '2010s' },
  { title: 'Shape of You', artist: 'Ed Sheeran', chartBucket: '2010s' },
  { title: 'Closer', artist: 'The Chainsmokers ft Halsey', chartBucket: '2010s' },
  { title: 'Girls Like You', artist: 'Maroon 5 ft Cardi B', chartBucket: '2010s' },
  { title: 'We Found Love', artist: 'Rihanna ft Calvin Harris', chartBucket: '2010s' },
  { title: 'Old Town Road', artist: 'Lil Nas X ft Billy Ray Cyrus', chartBucket: '2010s' },
  { title: 'Somebody That I Used to Know', artist: 'Gotye ft Kimbra', chartBucket: '2010s' },
  { title: 'Rolling in the Deep', artist: 'Adele', chartBucket: '2010s' },
  { title: 'Call Me Maybe', artist: 'Carly Rae Jepsen', chartBucket: '2010s' },
  { title: 'Blurred Lines', artist: 'Robin Thicke ft T.I. & Pharrell', chartBucket: '2010s' },
  { title: 'Happy', artist: 'Pharrell Williams', chartBucket: '2010s' },
  { title: 'Despacito', artist: 'Luis Fonsi ft Daddy Yankee & Justin Bieber', chartBucket: '2010s' },
  { title: 'All About That Bass', artist: 'Meghan Trainor', chartBucket: '2010s' },
  { title: 'bad guy', artist: 'Billie Eilish', chartBucket: '2010s' },
  { title: 'One Dance', artist: 'Drake ft Wizkid & Kyla', chartBucket: '2010s' },
  { title: 'Shake It Off', artist: 'Taylor Swift', chartBucket: '2010s' },
  { title: 'Perfect', artist: 'Ed Sheeran', chartBucket: '2010s' },
  { title: "God's Plan", artist: 'Drake', chartBucket: '2010s' },
  { title: 'See You Again', artist: 'Wiz Khalifa ft Charlie Puth', chartBucket: '2010s' },
];

const hits2000s = [
  { title: 'We Belong Together', artist: 'Mariah Carey', chartBucket: '2000s' },
  { title: 'Yeah!', artist: 'Usher ft Lil Jon & Ludacris', chartBucket: '2000s' },
  { title: 'Low', artist: 'Flo Rida ft T-Pain', chartBucket: '2000s' },
  { title: 'I Gotta Feeling', artist: 'The Black Eyed Peas', chartBucket: '2000s' },
  { title: 'Apologize', artist: 'Timbaland ft OneRepublic', chartBucket: '2000s' },
  { title: 'Umbrella', artist: 'Rihanna ft Jay-Z', chartBucket: '2000s' },
  { title: 'Irreplaceable', artist: 'Beyoncé', chartBucket: '2000s' },
  { title: 'Whatever You Like', artist: 'T.I.', chartBucket: '2000s' },
  { title: 'Hot N Cold', artist: 'Katy Perry', chartBucket: '2000s' },
  { title: 'How You Remind Me', artist: 'Nickelback', chartBucket: '2000s' },
  { title: 'No One', artist: 'Alicia Keys', chartBucket: '2000s' },
  { title: 'I Kissed a Girl', artist: 'Katy Perry', chartBucket: '2000s' },
  { title: 'Big Girls Don\'t Cry', artist: 'Fergie', chartBucket: '2000s' },
  { title: 'Bleeding Love', artist: 'Leona Lewis', chartBucket: '2000s' },
  { title: 'Hey There Delilah', artist: 'Plain White T\'s', chartBucket: '2000s' },
  { title: 'Crank That (Soulja Boy)', artist: 'Soulja Boy', chartBucket: '2000s' },
  { title: 'Stronger', artist: 'Kanye West', chartBucket: '2000s' },
  { title: 'Hips Don\'t Lie', artist: 'Shakira ft Wyclef Jean', chartBucket: '2000s' },
  { title: 'Gold Digger', artist: 'Kanye West ft Jamie Foxx', chartBucket: '2000s' },
  { title: 'Crazy in Love', artist: 'Beyoncé ft Jay-Z', chartBucket: '2000s' },
];

function dedupe(entries) {
  const seen = new Set();
  const out = [];
  for (const e of entries) {
    const k = `${e.title}|${e.artist}`.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}

async function main() {
  const merged = dedupe([...current, ...hits2010s, ...hits2000s]);
  console.error(`Resolving ${merged.length} unique songs (target mix: ~50 current + 20 2010s + 20 2000s, deduped)...`);

  const results = [];
  const failed = [];

  for (let i = 0; i < merged.length; i++) {
    const { title, artist, chartBucket } = merged[i];
    process.stderr.write(`[${i + 1}/${merged.length}] ${title} — ${artist}... `);
    const resolved = await resolveSong(title, artist);
    if (resolved) {
      results.push({
        title,
        artist,
        youtubeId: resolved.youtubeId,
        startTime: 0,
        chartBucket,
      });
      console.error(`OK ${resolved.youtubeId}`);
    } else {
      failed.push({ title, artist });
      console.error('FAIL');
    }
    await sleep(500);
  }

  console.error(`\nDone: ${results.length} ok, ${failed.length} failed.`);
  if (failed.length) {
    console.error('Failed:', JSON.stringify(failed, null, 2));
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
