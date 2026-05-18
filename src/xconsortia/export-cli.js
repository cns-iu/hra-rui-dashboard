import { writeFileSync } from 'fs';
import Papa from 'papaparse';
import { getBlocks, getUnregisteredBlocks } from './entities/blocks.js';
import { getDatasets, getUnregisteredDatasets } from './entities/datasets.js';

const HUBMAP_SEARCH_API_ENDPOINT = 'https://search.api.hubmapconsortium.org/v3/entities/search';
const HUBMAP_TOKEN = process.env['HUBMAP_TOKEN'] ?? undefined;
const SENNET_SEARCH_API_ENDPOINT = 'https://search.api.sennetconsortium.org/entities/search';
const SENNET_TOKEN = process.env['SENNET_TOKEN'] ?? undefined;

async function generateReport(data_source, basePath, endpoint, token) {
  const [registeredBlocks, registeredDatasets, unregisteredBlocks, unregisteredDatasets] = await Promise.all([
    getBlocks(endpoint, token),
    getDatasets(endpoint, token, true),
    getUnregisteredBlocks(endpoint, token),
    getUnregisteredDatasets(endpoint, token, true),
  ]);

  const registeredBlocksSet = new Set(registeredBlocks.map((b) => b.uuid));
  const registeredFilteredDatasets = registeredDatasets;
  //.filter((d) => d.__ancestors.some((a) => registeredBlocksSet.has(a)));

  const exemptBlocks = unregisteredBlocks.filter((b) => b.rui_exemption);
  const exemptBlocksSet = new Set(exemptBlocks.map((b) => b.uuid));
  const exemptDatasets = unregisteredDatasets.filter((d) => d.__ancestors.some((a) => exemptBlocksSet.has(a)));

  const unregisteredFilteredBlocks = unregisteredBlocks.filter((b) => !b.rui_exemption);
  const unregisteredBlocksSet = new Set(unregisteredFilteredBlocks.map((b) => b.uuid));
  const unregisteredFilteredDatasets = unregisteredDatasets;
  // .filter((d) => d.__ancestors.some((a) => unregisteredBlocksSet.has(a)));
  const noBlockDatasets = unregisteredDatasets.filter(
    (d) =>
      !d.__ancestors.some((a) => registeredBlocksSet.has(a) || unregisteredBlocksSet.has(a) || exemptBlocksSet.has(a)),
  );

  console.log(basePath, {
    blocks: {
      registered: registeredBlocks.length,
      exempt: exemptBlocks.length,
      unregistered: unregisteredFilteredBlocks.length,
    },
    datasets: {
      registered: registeredFilteredDatasets.length,
      exempt: exemptDatasets.length,
      unregistered: unregisteredFilteredDatasets.length,
    },
    unfiltered: {
      registeredDatasets: registeredDatasets.length,
      unregisteredDatasets: unregisteredDatasets.length,
      noBlockDatasets: noBlockDatasets.length,
    },
  });
  writeFileSync(
    basePath + '.data.json',
    JSON.stringify(
      {
        registeredBlocks,
        exemptBlocks,
        unregisteredBlocks,

        registeredFilteredDatasets,
        exemptDatasets,
        unregisteredFilteredDatasets,

        registeredDatasets,
        unregisteredDatasets,
        noBlockDatasets,
      },
      null,
      2,
    ),
  );

  const blocksCsv = Papa.unparse(
    [...registeredBlocks, ...exemptBlocks, ...unregisteredFilteredBlocks].map((b) => ({
      status: b.rui_exemption ? 'Exempt' : !!b.rui_location ? 'Registered' : 'Unregistered',
      identifier: b.hubmap_id || b.sennet_id,
      link: b.link,
    })),
    { header: true },
  );
  writeFileSync(basePath + '.blocks.csv', blocksCsv);

  const blocksLookup = [...registeredBlocks, ...exemptBlocks, ...unregisteredFilteredBlocks].reduce((acc, b) => {
    acc[b.uuid] = b;
    return acc;
  }, {});
  const getBlock = (d) => blocksLookup[d.__ancestors.find((uuid) => blocksLookup[uuid])] ?? {};

  const datasetsCsv = Papa.unparse(
    [...registeredDatasets, ...exemptDatasets, ...unregisteredFilteredDatasets].map((d) => ({
      status: getBlock(d).rui_exemption ? 'Exempt' : !!getBlock(d).rui_location ? 'Registered' : 'Unregistered',
      identifier: d.hubmap_id || d.sennet_id,
      link: d.link,
    })),
    { header: true },
  );
  writeFileSync(basePath + '.datasets.csv', datasetsCsv);
}

await Promise.all([
  generateReport('HuBMAP', 'docs/raw-data/hubmap', HUBMAP_SEARCH_API_ENDPOINT, HUBMAP_TOKEN),
  generateReport('SenNet', 'docs/raw-data/sennet', SENNET_SEARCH_API_ENDPOINT, SENNET_TOKEN),
]);
