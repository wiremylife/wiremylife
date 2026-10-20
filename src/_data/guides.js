import fs from 'node:fs';

export default JSON.parse(fs.readFileSync(new URL('../../data/guides.json', import.meta.url), 'utf8'));
