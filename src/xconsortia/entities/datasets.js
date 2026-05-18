import { BASE_FIELDS, GROUP_UUID_MAPPING } from '../common.js';
import { doApiSearch } from '../search.js';

const FIELDS = [
  ...BASE_FIELDS,
  'dataset_type',
  'thumbnail_file',

  'source_samples.uuid',
  'source_samples.sample_category',
];

const QUERY = {
  bool: {
    must: [
      {
        term: { 'entity_type.keyword': 'Dataset' },
      },
      {
        exists: {
          field: 'ancestors.rui_location',
        },
      },
    ],
  },
};

const UNREGISTERED_QUERY = {
  bool: {
    must: [
      {
        term: { 'entity_type.keyword': 'Dataset' },
      },
    ],
    must_not: [
      {
        exists: {
          field: 'ancestors.rui_location',
        },
      },
    ],
  },
};

export const UFL_THUMBS = {
  'HBM558.SRZG.629': 'HBM558.SRZG.629_UFL0002-SP-3-4-1.jpg',
  'HBM562.NTMH.548': 'HBM562.NTMH.548_UFL0006-SP-1-2-1.jpg',
  'HBM685.KHRQ.684': 'HBM685.KHRQ.684_UFL0008-LY07-1-1.jpg',
  'HBM278.SFQW.627': 'HBM278.SFQW.627_UFL0008-LY09-1-1.jpg',
  'HBM427.SMGB.866': 'HBM427.SMGB.866_UFL0004-SP-1-4-1.jpg',
  'HBM432.LLCF.677': 'HBM432.LLCF.677_UFL0001-SP-2-5-1.jpg',
  'HBM586.ZSVS.996': 'HBM586.ZSVS.996_UFL0008-SP-1-1-1.jpg',
  'HBM285.XMBT.542': 'HBM285.XMBT.542_UFL0006-TH-1-3-1.jpg',
  'HBM289.BWJW.663': 'HBM289.BWJW.663_UFL0006-TH-1-2-1.jpg',
  'HBM255.SRPR.985': 'HBM255.SRPR.985_UFL0005-TH-2-2-1.jpg',
  'HBM799.WXHD.535': 'HBM799.WXHD.535_UFL0009-LY02-1-1.jpg',
  'HBM294.RZFN.624': 'HBM294.RZFN.624_UFL0005-TH-1-1-1.jpg',
  'HBM383.TRQG.424': 'HBM383.TRQG.424_UFL0006-SP-1-3-1.jpg',
  'HBM647.MFQB.496': 'HBM647.MFQB.496_UFL0001-SP-1-2-1.jpg',
  'HBM237.GGPR.739': 'HBM237.GGPR.739_UFL0006-LY01-1-1.jpg',
  'HBM288.TPBD.654': 'HBM288.TPBD.654_UFL0003-SP-2-2-1.jpg',
  'HBM974.NDXT.675': 'HBM974.NDXT.675_UFL0008-TH-2-2-1.jpg',
  'HBM589.SLVV.423': 'HBM589.SLVV.423_UFL0008-LY10-1-1.jpg',
  'HBM794.RLFN.358': 'HBM794.RLFN.358_UFL0006-LY03-1-1.jpg',
  'HBM372.BQSR.778': 'HBM372.BQSR.778_UFL0007-SP-1-1-1.jpg',
  'HBM499.TKDW.458': 'HBM499.TKDW.458_UFL0009-LY03-1-1.jpg',
  'HBM342.PRQB.739': 'HBM342.PRQB.739_UFL0003-LY06-1-1.jpg',
  'HBM633.CLVN.674': 'HBM633.CLVN.674_UFL0003-SP-3-6-1.jpg',
  'HBM343.JQKM.578': 'HBM343.JQKM.578_UFL0009-LY01-1-1.jpg',
  'HBM987.XGTH.368': 'HBM987.XGTH.368_UFL0002-SP-2-4-1.jpg',
  'HBM964.CWCP.788': 'HBM964.CWCP.788_UFL0006-LY02-2-1.jpg',
  'HBM244.TJLK.223': 'HBM244.TJLK.223_UFL0003-SP-1-4-1.jpg',
  'HBM646.FSBQ.966': 'HBM646.FSBQ.966_UFL0007-SP-2-2-1.jpg',
  'HBM572.GXSB.234': 'HBM572.GXSB.234_UFL0003-SP-3-2-1.jpg',
  'HBM772.TKGJ.794': 'HBM772.TKGJ.794_UFL0008-SP-2-1-1.jpg',
  'HBM239.CBWR.263': 'HBM239.CBWR.263_UFL0008-SP-1-2-1.jpg',
  'HBM992.NRTT.383': 'HBM992.NRTT.383_UFL0006-SP-1-1-1.jpg',
  'HBM283.DQXD.546': 'HBM283.DQXD.546_UFL0003-SP-1-2-1.jpg',
  'HBM795.JHND.856': 'HBM795.JHND.856_UFL0007-SP-1-2-1.jpg',
  'HBM267.BZKT.867': 'HBM267.BZKT.867_UFL0003-SP-2-6-1.jpg',
  'HBM838.DLMJ.782': 'HBM838.DLMJ.782_UFL0008-TH-1-1-1.jpg',
  'HBM337.FSXL.564': 'HBM337.FSXL.564_UFL0001-SP-3-8-2.jpg',
  'HBM355.JDLK.244': 'HBM355.JDLK.244_UFL0004-SP-2-4-1.jpg',
  'HBM599.PSZG.737': 'HBM599.PSZG.737_UFL0006-LY02-1-1.jpg',
};

function formatDataset(dataset, token = undefined) {
  const dateEntered = new Date(dataset.last_modified_timestamp).toLocaleDateString();
  const groupName = GROUP_UUID_MAPPING[dataset.group_uuid] || dataset.group_name;
  const creator = dataset.created_by_user_displayname;
  const types = dataset.dataset_type ?? '';
  const typesSearch = types.toLowerCase();
  let technology;
  let thumbnail = 'https://cdn.humanatlas.io/ui/ccf-eui/assets/icons/ico-unknown.svg';
  if (typesSearch.indexOf('10x') !== -1) {
    technology = '10x';
    thumbnail = 'https://cdn.humanatlas.io/ui/ccf-eui/assets/icons/ico-bulk-10x.svg';
  } else if (typesSearch.indexOf('af') !== -1 || typesSearch.indexOf('auto-fluorescence') !== -1) {
    technology = 'AF';
    thumbnail = 'https://cdn.humanatlas.io/ui/ccf-eui/assets/icons/ico-spatial-af.svg';
  } else if (typesSearch.indexOf('codex') !== -1) {
    technology = 'CODEX';
    thumbnail = 'https://cdn.humanatlas.io/ui/ccf-eui/assets/icons/ico-spatial-codex.svg';
  } else if (typesSearch.indexOf('imc') !== -1 || typesSearch.indexOf('imaging mass cytometry') !== -1) {
    technology = 'IMC';
    thumbnail = 'https://cdn.humanatlas.io/ui/ccf-eui/assets/icons/ico-spatial-imc.svg';
  } else if (typesSearch.indexOf('lc') !== -1 && typesSearch.indexOf('af') === -1) {
    technology = 'LC';
    thumbnail = 'https://cdn.humanatlas.io/ui/ccf-eui/assets/icons/ico-bulk-lc.svg';
  } else if (typesSearch.indexOf('maldi') !== -1) {
    technology = 'MALDI';
  } else if (typesSearch.indexOf('pas') !== -1) {
    technology = 'PAS';
  } else {
    technology = types.split(/ \[/)[0];
  }
  thumbnail = formatDatasetThumbnail(dataset, token) ?? thumbnail;
  return {
    '@id': dataset.portal.idPrefix + dataset.uuid,
    '@type': 'Dataset',
    label: `Registered ${dateEntered}, ${creator}, ${groupName}`,
    link: `${dataset.portal.portal}dataset${dataset.portal.portalParams}${dataset.uuid}`,
    description: `Dataset Type: ${types}`,
    technology,
    thumbnail,

    __ancestors: dataset.source_samples?.map((s) => s.uuid) ?? [],
    hubmap_id: dataset.hubmap_id,
    sennet_id: dataset.sennet_id,
  };
}

function formatDatasetThumbnail(dataset, token = undefined) {
  if (dataset.thumbnail_file) {
    const thumbnailFile = dataset.thumbnail_file;
    return (
      `${dataset.portal.assets}/${thumbnailFile.file_uuid}/${thumbnailFile.filename}` + (token ? `?token=${token}` : '')
    );
  } else if (dataset.group_uuid === '07a29e4c-ed43-11e8-b56a-0e8017bdda58') {
    // TMC-Florida
    const thumb = UFL_THUMBS[dataset.hubmap_id];
    if (thumb) {
      return `https://hubmapconsortium.github.io/ccf-ui/assets/thumbnails/TMC-Florida/${thumb}`;
    }
  }
  return undefined;
}

function reformatResponse(response, token = undefined) {
  return response.map((data) => formatDataset(data, token));
}

function getQuery(query, primaryOnly = false) {
  if (!primaryOnly) {
    return query;
  } else {
    const queryObj = JSON.parse(JSON.stringify(query));
    queryObj.bool.must.push({
      term: { 'creation_action.keyword': 'Create Dataset Activity' },
    });
    return queryObj;
  }
}

export async function getDatasets(endpoint, token = undefined, primaryOnly = false) {
  return reformatResponse(await doApiSearch(endpoint, token, getQuery(QUERY, primaryOnly), FIELDS));
}

export async function getUnregisteredDatasets(endpoint, token, primaryOnly = false) {
  return reformatResponse(await doApiSearch(endpoint, token, getQuery(UNREGISTERED_QUERY, primaryOnly), FIELDS));
}
