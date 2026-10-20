export function pacificDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// Empty means no end date. A YYYY-MM-DD value is inclusive in Pacific Time.
// Anything else is treated as already ended so a bad date cannot keep a paid pin up.
export function isThroughDate(value, now = new Date()) {
  if (value == null || String(value).trim() === '') return true;
  const day = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  return day >= pacificDay(now);
}
