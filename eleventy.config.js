export default function (cfg) {
  cfg.addPassthroughCopy({ 'src/css': 'css', 'src/js': 'js', 'src/favicon.svg': 'favicon.svg', 'src/og.png': 'og.png' });
  cfg.addWatchTarget('data/');
  cfg.addFilter('date', (iso) => iso ? new Date(iso).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) : 'never');
  cfg.addFilter('isoDay', (value) => {
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  });
  cfg.addFilter('json', (v) => JSON.stringify(v));
  cfg.addFilter('jsonld', (v) => JSON.stringify(v ?? '').replace(/</g, '\\u003c'));
  cfg.addFilter('where', (arr, k, v) => Array.isArray(arr) ? arr.filter((x) => x[k] === v) : []);
  return { dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' }, markdownTemplateEngine: 'njk', htmlTemplateEngine: 'njk' };
}
