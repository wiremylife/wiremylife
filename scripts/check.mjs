// WireMyLife checker: Level 0 MCP probe (hosted) + GitHub repo health (self-hosted) + URL resolve checks.
// Usage: node scripts/check.mjs   (set GITHUB_TOKEN to avoid the 60 req/hr unauthenticated limit)
import fs from 'node:fs';
const FILE = new URL('../data/connectors.json', import.meta.url);
const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const STALE_DAYS = 180;
const UA = 'WireMyLife-checker/0.1 (+https://wiremylife.com)';
const now = new Date();

async function timed(url, opts = {}, ms = 15000, full = false) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { ...opts, redirect: 'follow', signal: AbortSignal.timeout(ms), headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
    const body = await r.text().catch(() => '');
    return { ok: true, status: r.status, ms: Date.now() - t0, body: full ? body : body.slice(0, 400), headers: r.headers };
  } catch (e) {
    return { ok: false, error: (e.cause && e.cause.code) || e.name || String(e), ms: Date.now() - t0 };
  }
}

async function probeMcp(url) {
  const init = { jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'wiremylife-probe', version: '0.1' } } };
  const r = await timed(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, body: JSON.stringify(init) });
  if (!r.ok) return { status: 'down', detail: `No answer (${r.error})`, ms: r.ms };
  if ((r.status === 200 || r.status === 202) && /"jsonrpc"|serverInfo|protocolVersion/.test(r.body))
    return { status: 'online_open', detail: `MCP handshake answered (HTTP ${r.status})`, ms: r.ms };
  if (r.status === 401 || r.status === 403) {
    const www = r.headers.get('www-authenticate') || '';
    return { status: 'online_auth', detail: `Answered, sign-in required (HTTP ${r.status}${www ? ', advertises OAuth' : ''})`, ms: r.ms };
  }
  if (r.status >= 500) return { status: 'down', detail: `Server error (HTTP ${r.status})`, ms: r.ms };
  if (r.status === 404) return { status: 'down', detail: 'Endpoint not found (HTTP 404)', ms: r.ms };
  return { status: 'untested', detail: `Reachable but non-MCP reply (HTTP ${r.status})`, ms: r.ms };
}

async function gh(repo) {
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const r = await timed(`https://api.github.com/repos/${repo}`, { headers }, 15000, true);
  if (!r.ok) return { error: r.error };
  if (r.status === 404) return { missing: true };
  if (r.status !== 200) return { error: `HTTP ${r.status}` };
  const full = JSON.parse(r.body);
  let latest_release = null;
  if (process.env.GITHUB_TOKEN) {
    const rel = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers: { ...headers, 'User-Agent': UA } });
    if (rel.ok) { const j = await rel.json(); latest_release = { tag: j.tag_name, date: (j.published_at || '').slice(0, 10) }; }
  }
  return { stars: full.stargazers_count, pushed_at: (full.pushed_at || '').slice(0, 10), archived: !!full.archived,
           license: full.license && full.license.spdx_id, open_issues: full.open_issues_count, latest_release };
}

async function urlOk(url) {
  let r = await timed(url, { method: 'GET' });
  return r.ok ? { http: r.status, ok: r.status < 400 } : { http: null, ok: false, error: r.error };
}

const results = [];
for (const c of db.connectors) {
  const prev = c.status;
  // URL resolve checks (docs + repo page)
  c.url_checks = { docs: await urlOk(c.docs_url) };
  let status = 'untested', detail = '', ms = null;

  if (c.endpoint) {
    const p = await probeMcp(c.endpoint);
    ({ status, detail, ms } = p);
  } else if (c.repo) {
    const g = await gh(c.repo);
    if (g.error) { status = c.status || 'unchecked'; detail = `GitHub check failed (${g.error}); kept previous status`; }
    else if (g.missing) { status = 'down'; detail = 'Repository not found (deleted or private)'; c.github = null; }
    else {
      c.github = g;
      const age = Math.round((now - new Date(g.pushed_at)) / 864e5);
      if (g.archived) { status = 'stale'; detail = 'Repository archived by its owner'; }
      else if (age > STALE_DAYS) { status = 'stale'; detail = `No commits in ${age} days`; }
      else { status = 'untested'; detail = `Repo active (last commit ${age} day${age === 1 ? '' : 's'} ago); not yet tested on a real account`; }
    }
  } else {
    status = c.url_checks.docs.ok ? 'untested' : 'down';
    detail = c.url_checks.docs.ok ? 'Docs live; built-in or self-hosted, not yet tested on a real account' : 'Docs page not resolving';
  }
  // Level 2 (manual / secrets-based) results win only if recent (<= 8 days)
  if (c.tested && c.tested.passed && (now - new Date(c.tested.date)) / 864e5 <= 8) {
    status = 'tested'; detail = `Read-only test passed on ${c.tested.date}`;
  }
  if (!c.url_checks.docs.ok && status !== 'down') detail += ' · warning: docs URL not resolving';
  Object.assign(c, { status, status_detail: detail, response_ms: ms, last_checked: now.toISOString() });
  if (prev && prev !== 'unchecked' && prev !== status) (db.changes ||= []).unshift({ id: c.id, from: prev, to: status, at: now.toISOString() });
  results.push([c.id, status, detail]);
  await new Promise(r => setTimeout(r, 150));
}
db.last_run = now.toISOString();
if (db.changes) db.changes = db.changes.slice(0, 200);
fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
const tally = results.reduce((a, [, s]) => (a[s] = (a[s] || 0) + 1, a), {});
for (const r of results) console.log(r.join(' | '));
console.log('\nSUMMARY', JSON.stringify(tally));
