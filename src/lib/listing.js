import { isThroughDate } from './dates.js';

const BADGES = {
  tested:      { label: 'Tested working', cls: 'b-tested', hint: 'A read-only test passed on a real account in the last 8 days.' },
  online_open: { label: 'Online', cls: 'b-online', hint: 'The server answered our MCP handshake.' },
  online_auth: { label: 'Online (sign-in required)', cls: 'b-online', hint: 'The server answered and asked for sign-in, which is what a healthy private connector does. Not yet tested with a real account.' },
  untested:    { label: 'Not yet tested', cls: 'b-untested', hint: 'Self-hosted or built-in. The project is active, but we have not run it on a real account yet.' },
  stale:       { label: 'Stale', cls: 'b-stale', hint: 'No commits in 180+ days, or archived. It may still work, but expect rough edges.' },
  down:        { label: 'Down', cls: 'b-down', hint: 'The endpoint or repository did not answer, or no longer exists.' },
  unchecked:   { label: 'Not checked yet', cls: 'b-untested', hint: 'Our checker has not reached this one yet.' },
};

const CATEGORIES = {
  Car: {
    slug: 'car',
    title: 'Car AI connectors',
    description: 'AI connectors for Tesla and other cars, hosted and self-hosted, with live status badges for Claude, ChatGPT, Gemini, and Grok.',
  },
  Home: {
    slug: 'home',
    title: 'Home AI connectors',
    description: 'AI connectors for Home Assistant, lights, locks, thermostats, and the rest of the house, with live status badges.',
  },
};

function assistantKeys(list) {
  const s = list.join(' ').toLowerCase(), k = [];
  for (const [key, re] of [['claude', /claude/], ['chatgpt', /chatgpt/], ['gemini', /gemini/], ['grok', /grok/], ['codex', /codex/], ['local', /any mcp client|any remote-mcp/]]) if (re.test(s)) k.push(key);
  return k;
}

function slugify(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function categoryMeta(name) {
  if (CATEGORIES[name]) return CATEGORIES[name];
  const slug = slugify(name);
  return {
    slug,
    title: `${name} AI connectors`,
    description: `AI connectors for ${name}, with live status badges.`,
  };
}

export function isFeatured(connector, now = new Date()) {
  if (!connector || connector.featured !== true) return false;
  return isThroughDate(connector.featuredUntil ?? connector.featured_until, now);
}

export function prepare(db, now = new Date()) {
  const order = { tested: 0, online_open: 1, online_auth: 1, untested: 2, unchecked: 3, stale: 4, down: 5 };
  for (const c of db.connectors) {
    const affiliate = String(c.affiliateUrl || c.affiliate_url || '').trim();
    c.affiliateUrl = affiliate || null;
    c.featuredUntil = c.featuredUntil || c.featured_until || null;
    if (c.featuredUntil === '') c.featuredUntil = null;
    c.isFeatured = isFeatured(c, now);
    c.badge = BADGES[c.status] || BADGES.unchecked;
    c.akeys = assistantKeys(c.assistants || []);
    c.statusGroup = c.status === 'online_open' ? 'online_auth' : c.status;
    c.categorySlug = categoryMeta(c.category).slug;
  }
  db.connectors.sort((a, b) =>
    (Number(b.isFeatured) - Number(a.isFeatured))
    || ((order[a.status] ?? 9) - (order[b.status] ?? 9))
    || ((b.maker_type === 'official' || b.maker_type === 'vendor') - (a.maker_type === 'official' || a.maker_type === 'vendor'))
    || ((b.github?.stars || 0) - (a.github?.stars || 0)));
  const grouped = new Map();
  for (const c of db.connectors) {
    if (!grouped.has(c.category)) grouped.set(c.category, []);
    grouped.get(c.category).push(c);
  }
  const preferred = ['Car', 'Home'];
  db.categories = [...grouped.entries()]
    .map(([name, connectors]) => ({ ...categoryMeta(name), name, connectors }))
    .sort((a, b) => {
      const ai = preferred.indexOf(a.name);
      const bi = preferred.indexOf(b.name);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.name.localeCompare(b.name);
    });
  db.badges = BADGES;
  db.counts = db.connectors.reduce((a, c) => (a[c.statusGroup] = (a[c.statusGroup] || 0) + 1, a), {});
  db.total = db.connectors.length;
  return db;
}
