import fs from 'node:fs';
const BADGES = {
  tested:      { label: 'Tested working', cls: 'b-tested', hint: 'A read-only test passed on a real account in the last 8 days.' },
  online_open: { label: 'Online', cls: 'b-online', hint: 'The server answered our MCP handshake.' },
  online_auth: { label: 'Online (sign-in required)', cls: 'b-online', hint: 'The server answered and asked for sign-in, which is what a healthy private connector does. Not yet tested with a real account.' },
  untested:    { label: 'Not yet tested', cls: 'b-untested', hint: 'Self-hosted or built-in. The project is active, but we have not run it on a real account yet.' },
  stale:       { label: 'Stale', cls: 'b-stale', hint: 'No commits in 180+ days, or archived. It may still work, but expect rough edges.' },
  down:        { label: 'Down', cls: 'b-down', hint: 'The endpoint or repository did not answer, or no longer exists.' },
  unchecked:   { label: 'Not checked yet', cls: 'b-untested', hint: 'Our checker has not reached this one yet.' },
};
function assistantKeys(list) {
  const s = list.join(' ').toLowerCase(), k = [];
  for (const [key, re] of [['claude', /claude/], ['chatgpt', /chatgpt/], ['gemini', /gemini/], ['grok', /grok/], ['codex', /codex/], ['local', /any mcp client|any remote-mcp/]]) if (re.test(s)) k.push(key);
  return k;
}
export default function () {
  const db = JSON.parse(fs.readFileSync(new URL('../../data/connectors.json', import.meta.url), 'utf8'));
  const order = { tested: 0, online_open: 1, online_auth: 1, untested: 2, unchecked: 3, stale: 4, down: 5 };
  for (const c of db.connectors) {
    c.badge = BADGES[c.status] || BADGES.unchecked;
    c.akeys = assistantKeys(c.assistants);
    c.statusGroup = c.status === 'online_open' ? 'online_auth' : c.status;
  }
  db.connectors.sort((a, b) => (order[a.status] - order[b.status]) || (b.maker_type === 'official' || b.maker_type === 'vendor') - (a.maker_type === 'official' || a.maker_type === 'vendor') || ((b.github?.stars || 0) - (a.github?.stars || 0)));
  db.badges = BADGES;
  db.counts = db.connectors.reduce((a, c) => (a[c.statusGroup] = (a[c.statusGroup] || 0) + 1, a), {});
  db.total = db.connectors.length;
  return db;
}
