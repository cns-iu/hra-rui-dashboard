import { writeFileSync } from 'fs';
import Papa from 'papaparse';

const SOURCES_URL =
  'https://docs.google.com/spreadsheets/d/1c5ZIO8-C5t59_l17BTyx8ANuNj4cuSifDkwIaW8Ogjw/export?format=csv';
const OUTPUT_CSV = 'docs/rui-registration-growth.csv';

function decumulate(sortedData, countField) {
  const results = [];
  let lastCount = 0;
  for (const row of sortedData) {
    results.push({
      ...row,
      [countField]: row[countField] - lastCount,
    });
    lastCount = row[countField];
  }
  return results;
}

function dedupSumarries(summaries) {
  return Object.values(
    summaries.reduce((acc, item) => {
      acc[item.Date] = item;
      return acc;
    }, {}),
  ).sort((a, b) => a.Date - b.Date);
}

function fetchCsv(url) {
  return fetch(url)
    .then((r) => r.text())
    .then((csvText) => Papa.parse(csvText, { header: true, skipEmptyLines: true }).data);
}

const sources = await fetchCsv(SOURCES_URL);
const combinedSources = [];
for (const { data_source, type, csv_url } of sources) {
  let data = dedupSumarries(await fetchCsv(csv_url));
  // for (const field of ['Exempt', 'Registered', 'Unregistered']) {
  //   data = decumulate(data, field);
  // }
  data = data.reduce((acc, row) => {
    acc.push(
      { data_source, type, date: row.Date, group: 'Unregistered', count: row.Unregistered },
      { data_source, type, date: row.Date, group: 'Exempt', count: row.Exempt },
      { data_source, type, date: row.Date, group: 'Registered', count: row.Registered },
    );
    return acc;
  }, []);
  combinedSources.push(...data);
}

const csvText = Papa.unparse(combinedSources, { header: true });
writeFileSync(OUTPUT_CSV, csvText);
