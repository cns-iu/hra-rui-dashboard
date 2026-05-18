import { existsSync, readFileSync, writeFileSync } from 'fs';
import Papa from 'papaparse';

const ITEMS_CSV = process.argv[2];
const SUMMARY_CSV = process.argv[3];

const itemsCsv = ITEMS_CSV.startsWith('http')
  ? await fetch(ITEMS_CSV).then((r) => r.text())
  : readFileSync(ITEMS_CSV, 'utf-8');
const items = Papa.parse(itemsCsv, { header: true }).data;

const summaries = existsSync(SUMMARY_CSV)
  ? Papa.parse(readFileSync(SUMMARY_CSV, 'utf-8'), { header: true, skipEmptyLines: true }).data
  : [];

summaries.push(
  items.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    { Date: new Date().toISOString().split('T')[0], Unregistered: 0, Exempt: 0, Registered: 0 },
  ),
);

const dedupedSummaries = Object.values(
  summaries.reduce((acc, item) => {
    acc[item.Date] = item;
    return acc;
  }, {}),
).sort((a, b) => a.Date - b.Date);

writeFileSync(SUMMARY_CSV, Papa.unparse(dedupedSummaries, { header: true }));
