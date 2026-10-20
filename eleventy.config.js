export default function (cfg) {
  cfg.addPassthroughCopy({ 'src/css': 'css', 'src/js': 'js', 'src/favicon.svg': 'favicon.svg' });
  cfg.addWatchTarget('data/');
  cfg.addFilter('date', (iso) => iso ? new Date(iso).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) : 'never');
  cfg.addFilter('json', (v) => JSON.stringify(v));
  cfg.addFilter('where', (arr, k, v) => arr.filter((x) => x[k] === v));
  return { dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' }, markdownTemplateEngine: 'njk', htmlTemplateEngine: 'njk' };
}
