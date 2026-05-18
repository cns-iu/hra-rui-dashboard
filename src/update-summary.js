import { existsSync, readFileSync } from 'fs';
import Papa from 'papaparse';

const ITEMS_CSV = process.argv[2];
const SUMMARY_CSV = process.argv[3];

const itemsCsv = ITEMS_CSV.startsWith('http')
  ? await fetch(ITEMS_CSV).then((r) => r.text())
  : readFileSync(ITEMS_CSV, 'utf-8');
const items = Papa.parse(itemsCsv, { header: true }).data;

const summaries = existsSync(SUMMARY_CSV) ? Papa.parse(readFileSync(SUMMARY_CSV, 'utf-8')) : [];

const summary = items.reduce(
  (acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  },
  { Date: new Date().toISOString().split('T')[0], Unregistered: 0, Exempt: 0, Registered: 0 },
);

console.log(Papa.unparse([summary], { header: true }));
