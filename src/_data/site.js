import fs from 'node:fs';
import { buildSite } from '../lib/site-config.js';

const config = JSON.parse(fs.readFileSync(new URL('../../data/site.json', import.meta.url), 'utf8'));

export default function () {
  return buildSite(config);
}
