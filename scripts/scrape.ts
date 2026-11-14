// npm run scrape
// Scrapes live sources with Bright Data, extracts listings with Gemini,
// upserts into Neon with last_scraped = NOW().
// Start with 2-3 sources, verify one works end-to-end before adding more.
// If a source fails or yields nothing, seeded Neon data stays as fallback —
// the demo never shows an empty screen.
import '../lib/env';
import { scrapeWithBrightData, extractListingsFromHtml, upsertResources } from '../lib/voicebridge';

const SOURCES: { url: string; type: 'food' | 'shelter' | 'clinic' }[] = [
  { url: 'https://211sandiego.org/', type: 'food' },
  { url: 'https://feedingsandiego.org/find-food/', type: 'food' },
  { url: 'https://sandiegofoodbank.org/get-help/', type: 'food' },
];

async function main() {
  let total = 0;
  for (const { url, type } of SOURCES) {
    try {
      console.log('Scraping', url);
      const html = await scrapeWithBrightData(url);
      const listings = await extractListingsFromHtml(html, url, type);
      console.log(`Extracted ${listings.length} listings from`, url);
      const n = await upsertResources(listings);
      console.log(`Upserted ${n} into Neon from`, url);
      total += n;
    } catch (e) {
      console.error('Failed', url, e);
    }
  }
  console.log(`Done. ${total} listings upserted in total.`);
}
main();
