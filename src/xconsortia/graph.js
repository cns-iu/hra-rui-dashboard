import { getBlocks, updateBlockDescription } from './entities/blocks.js';
import { getDatasets } from './entities/datasets.js';
import { getSections } from './entities/sections.js';

export async function getDatasetGraph(endpoint, token, primaryOnly = false) {
  const [blocks, sections, datasets] = await Promise.all([
    getBlocks(endpoint, token),
    getSections(endpoint, token),
    getDatasets(endpoint, token, primaryOnly),
  ]);

  const donors = {};
  const blockLookup = {};
  for (const block of blocks) {
    const donor = (donors[block.donor.uuid] = donors[block.donor.uuid] ?? block.donor);
    blockLookup[block.uuid] = block;
    donor.samples.push(block);
    delete donor.uuid;
    delete block.donor;
    delete block.uuid;
  }

  const sectionLookup = {};
  for (const section of sections) {
    for (const uuid of section.__ancestors) {
      if (blockLookup[uuid]) {
        blockLookup[uuid].sections.push(section);
        sectionLookup[section.uuid] = section;
      }
    }
    delete section.__ancestors;
    delete section.uuid;
  }

  for (const block of blocks) {
    updateBlockDescription(block);
  }

  for (const dataset of datasets) {
    for (const uuid of dataset.__ancestors) {
      if (sectionLookup[uuid]) {
        sectionLookup[uuid].datasets.push(dataset);
      }
      if (blockLookup[uuid]) {
        blockLookup[uuid].datasets.push(dataset);
      }
    }
    delete dataset.__ancestors;
    delete dataset.uuid;
  }

  return {
    '@context': 'https://hubmapconsortium.github.io/ccf-ontology/ccf-context.jsonld',
    '@graph': Object.values(donors),
  };
}
