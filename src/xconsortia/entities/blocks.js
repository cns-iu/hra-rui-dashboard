import lodash from 'lodash';
import { BASE_FIELDS, GROUP_UUID_MAPPING } from '../common.js';
import { doApiSearch } from '../search.js';
const { get, set, toNumber } = lodash;

const FIELDS = [...BASE_FIELDS, 'donor', 'source', 'rui_location', 'sample_category', 'has_rui_information'];

const QUERY = {
  bool: {
    must: [
      {
        term: { 'entity_type.keyword': 'Sample' },
      },
      // Some hubmap samples are rui_registered which is BAD, but is what it is...
      // {
      //   term: { 'display_subtype.keyword': 'Block' },
      // },
      {
        exists: {
          field: 'rui_location',
        },
      },
    ],
  },
};

const UNREGISTERED_QUERY = {
  bool: {
    must: [
      {
        term: { 'entity_type.keyword': 'Sample' },
      },
      {
        term: { 'display_subtype.keyword': 'Block' },
      },
    ],
    must_not: [
      {
        exists: {
          field: 'rui_location',
        },
      },
    ]
  },
};

function formatDonor(donor, portal) {
  const donorDescription = (donor.description || '').toLowerCase();
  let sex;
  if (donorDescription.includes('female')) {
    sex = 'Female';
  } else if (donorDescription.includes('male')) {
    sex = 'Male';
  }
  const ageMatch = donorDescription.match(/age ([0-9]+)/) ?? donorDescription.match(/ ([0-9]+) years/);
  let age;
  if (ageMatch) {
    age = toNumber(ageMatch[1]);
  }
  let bmi;
  let race;
  const metadata = donor.mapped_metadata ?? donor.source_mapped_metadata ?? {};
  if (!sex && metadata.sex?.length > 0) {
    sex = metadata.sex[0];
  }
  if (!race && metadata.race?.length > 0) {
    race = metadata.race[0];
  }
  if (!age && metadata.age_value?.length > 0) {
    age = metadata.age_value[0];
  }
  if (!bmi && metadata.body_mass_index_value?.length > 0) {
    bmi = metadata.body_mass_index_value[0];
  }
  if (typeof donor.metadata === 'string') {
    donor.metadata = new Function('return ' + donor.metadata)();
  }
  const donor_data = donor?.metadata?.organ_donor_data ?? donor?.metadata?.living_donor_data ?? [];
  for (const md of donor_data) {
    if (md.preferred_term === 'Feminine gender' || md.preferred_term === 'Female') {
      sex = 'Female';
    } else if (md.preferred_term === 'Masculine gender' || md.preferred_term === 'Male') {
      sex = 'Male';
    } else if (md.preferred_term === 'Current chronological age' || md.preferred_term === 'Age') {
      age = toNumber(md.data_value);
    } else if (md.preferred_term === 'Body mass index') {
      bmi = toNumber(md.data_value);
    } else if (md.grouping_concept_preferred_term === 'Race') {
      race = md.preferred_term;
    }
  }
  let label = '';
  if (sex && age) {
    label += `${sex}, Age ${age}`;
    if (bmi) {
      label += `, BMI ${bmi.toFixed(1)}`;
    }
  } else if (sex) {
    label = sex;
  }
  const dateEntered = new Date(donor.last_modified_timestamp).toLocaleDateString();
  const groupName = GROUP_UUID_MAPPING[donor.group_uuid] || donor.group_name;
  const creator = donor.created_by_user_displayname;
  return {
    '@id': portal.idPrefix + donor.uuid,
    '@type': 'Donor',
    uuid: donor.uuid,
    label,
    description: `Entered ${dateEntered}, ${creator}, ${groupName}`,
    link: `${portal.portal}${portal.donorName}${portal.portalParams}${donor.uuid}`,
    age,
    sex,
    bmi,
    race,
    consortium_name: portal.consortium_name,
    provider_name: groupName,
    provider_uuid: donor.group_uuid,
    samples: [],
  };
}

function formatRuiLocation(data, donor) {
  let spatialEntity;
  let ruiLocation = data.rui_location;
  if (ruiLocation) {
    // RUI Location may come in as an unparsed string
    if (typeof ruiLocation === 'string') {
      ruiLocation = JSON.parse(ruiLocation);
    }
    if (ruiLocation.alignment_id) {
      // Detect RUI 0.5 generated JSON
      console.log('Detected a deprecated rui_location', data.uuid);
    } else if (ruiLocation['@id']) {
      // Detect RUI 1.0+ generated JSON-LD
      spatialEntity = ruiLocation;
    }
    ruiLocation['@context'] = 'https://hubmapconsortium.github.io/ccf-ontology/ccf-context.jsonld';
  }
  if (spatialEntity) {
    const target = get(spatialEntity, ['placement', 'target']) ?? '';

    // If a donor sex has not been set, determine it via the reference organ
    if (!donor.sex) {
      if (target.includes('#VHF') || target.includes('-female')) {
        donor.sex = 'Female';
        donor.label = donor.sex;
      } else if (target.includes('#VHM') || target.includes('-male')) {
        donor.sex = 'Male';
        donor.label = donor.sex;
      }
    }
    // Patch to fix RUI 0.5 Kidney and Spleen Placements
    if (target.startsWith('http://purl.org/ccf/latest/ccf.owl#VHSpleenCC')) {
      if (donor.sex === 'Male') {
        set(spatialEntity, ['placement', 'target'], target.replace('#VHSpleenCC', '#VHMSpleenCC'));
      } else {
        set(spatialEntity, ['placement', 'target'], target.replace('#VHSpleenCC', '#VHFSpleenCC'));
      }
    } else if (
      target === 'http://purl.org/ccf/latest/ccf.owl#VHLeftKidney' ||
      target === 'http://purl.org/ccf/latest/ccf.owl#VHRightKidney'
    ) {
      if (donor.sex === 'Male') {
        set(spatialEntity, ['placement', 'target'], target.replace('#VH', '#VHM') + '_Patch');
      } else {
        set(spatialEntity, ['placement', 'target'], target.replace('#VH', '#VHF') + '_Patch');
      }
    }
  }
  return spatialEntity;
}

function formatBlock(data) {
  const dateEntered = new Date(data.last_modified_timestamp).toLocaleDateString();
  const groupName = GROUP_UUID_MAPPING[data.group_uuid] || data.group_name;
  const creator = data.created_by_user_displayname;
  const donor = formatDonor(data.donor ?? data.source, data.portal);
  return {
    '@id': data.portal.idPrefix + data.uuid,
    '@type': 'Sample',
    label: `Registered ${dateEntered}, ${creator}, ${groupName}`,
    link: `${data.portal.portal}sample${data.portal.portalParams}${data.uuid}`,
    description: '',
    sample_type: 'Tissue Block',
    donor,
    rui_location: formatRuiLocation(data, donor),
    has_rui_information: data.has_rui_information,
    rui_exemption: data.has_rui_information === 'Exempt' || data.has_rui_information === 'N/A',
    sections: [],
    datasets: [],
    uuid: data.uuid,
    hubmap_id: data.hubmap_id,
    sennet_id: data.sennet_id,
  };
}

export function updateBlockDescription(block) {
  const loc = block.rui_location ?? {};
  const sections = block.sections;
  const dims = `${loc.x_dimension} x ${loc.y_dimension} x ${loc.z_dimension} ${loc.dimension_units}`;
  block.section_count = loc.slice_count || sections.length;
  const sSize = parseFloat(
    (loc.slice_thickness || (loc.z_dimension || 0) / Math.max(block.section_count, 1)).toFixed(1)
  );
  block.section_size = sSize;
  const sUnits = loc.dimension_units || 'millimeter';
  block.section_units = sUnits;
  block.description = `${dims}, ${sSize} ${sUnits}, ${block.section_count} Sections`;
  sections.forEach((section, index) => {
    section.description = `${loc.x_dimension} x ${loc.y_dimension} x ${sSize} ${sUnits}, ${sSize} ${sUnits}`;
    section.section_number = index + 1;
  });

  return block;
}

function reformatResponse(response) {
  return response.map(formatBlock);
}

export async function getBlocks(endpoint, token) {
  return reformatResponse(await doApiSearch(endpoint, token, QUERY, FIELDS));
}

export async function getUnregisteredBlocks(endpoint, token) {
  return reformatResponse(await doApiSearch(endpoint, token, UNREGISTERED_QUERY, FIELDS));
}
