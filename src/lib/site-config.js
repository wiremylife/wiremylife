import { isThroughDate } from './dates.js';

export function kitFormAction(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[\w-]+$/.test(raw)) return `https://app.kit.com/forms/${encodeURIComponent(raw)}/subscriptions`;
  return '';
}

function buyLink(paymentLinks, contact, key, subject) {
  const raw = String(paymentLinks?.[key] ?? '').trim();
  if (/^https?:\/\//i.test(raw)) return { href: raw, isMailto: false };
  return { href: `mailto:${contact}?subject=${encodeURIComponent(subject)}`, isMailto: true };
}

function sponsor(entry, now) {
  if (!entry || !String(entry.name ?? '').trim()) return null;
  if (!isThroughDate(entry.until, now)) return null;
  const url = String(entry.url ?? '').trim();
  return { name: String(entry.name).trim(), url: /^https?:\/\//i.test(url) ? url : '' };
}

const TIERS = [
  {
    key: 'featuredListing',
    id: 'featured-listing',
    name: 'Featured listing',
    price: '$49',
    period: '/mo',
    summary: 'Pinned to the top of its category with a Featured badge.',
    points: [
      'Top of that category on the directory and the category page',
      'Featured badge on the card and the listing',
      'Status badge stays on whatever the checker last measured',
      'Comes off automatically after the end date you agree',
    ],
  },
  {
    key: 'newsletterSponsor',
    id: 'newsletter-sponsor',
    name: 'Newsletter sponsor',
    price: '$99',
    period: '/issue',
    summary: 'One labelled mention in the weekly email.',
    points: [
      'A sponsor note in a single issue',
      'Goes to everyone who gets that week’s letter',
      'Labelled as a sponsor, separate from connector status',
    ],
  },
  {
    key: 'categorySponsor',
    id: 'category-sponsor',
    name: 'Category sponsor',
    price: '$149',
    period: '/mo',
    summary: 'The sponsor slot on the Car or Home category page.',
    points: [
      'One category, Car or Home',
      'Labelled sponsor placement for the month',
      'Link can point at your site or docs',
    ],
  },
];

export function buildSite(raw, now = new Date()) {
  const contact = raw.contact;
  const paymentLinks = raw.paymentLinks || {};
  const sponsors = {};
  for (const [slug, entry] of Object.entries(raw.categorySponsors || {})) sponsors[slug] = sponsor(entry, now);
  return {
    name: raw.name,
    url: String(raw.url || '').replace(/\/$/, ''),
    tagline: raw.tagline,
    contact,
    paymentLinks,
    kitFormAction: kitFormAction(raw.kitFormAction),
    tiers: TIERS.map((tier) => {
      const subject = `${tier.name} (${tier.price}${tier.period})`;
      return { ...tier, subject, ...buyLink(paymentLinks, contact, tier.key, subject) };
    }),
    sponsors,
  };
}
