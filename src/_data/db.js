import fs from 'node:fs';
import { prepare } from '../lib/listing.js';

export default function () {
  const db = JSON.parse(fs.readFileSync(new URL('../../data/connectors.json', import.meta.url), 'utf8'));
  return prepare(db);
}
