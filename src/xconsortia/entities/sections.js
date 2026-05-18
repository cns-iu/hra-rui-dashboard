import { BASE_FIELDS, GROUP_UUID_MAPPING } from '../common.js';
import { doApiSearch } from '../search.js';

const FIELDS = [...BASE_FIELDS, 'sample_category', 'ancestors.uuid'];

const QUERY = {
  bool: {
    must: [
      {
        term: { 'entity_type.keyword': 'Sample' },
      },
      {
        term: { 'display_subtype.keyword': 'Section' },
      },
      {
        exists: {
          field: 'ancestors.rui_location',
        },
      },
      {
        exists: {
          field: 'descendants.dataset_type',
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
        term: { 'display_subtype.keyword': 'Section' },
      },
      {
        exists: {
          field: 'descendants.dataset_type',
        },
      },
    ],
    must_not: [
      {
        exists: {
          field: 'ancestors.rui_location',
        },
      },
    ]
  },
};

function formatSection(section) {
  const dateEntered = new Date(section.last_modified_timestamp).toLocaleDateString();
  const groupName = GROUP_UUID_MAPPING[section.group_uuid] || section.group_name;
  const creator = section.created_by_user_displayname;
  return {
    '@id': section.portal.idPrefix + section.uuid,
    '@type': 'Sample',
    label: `Registered ${dateEntered}, ${creator}, ${groupName}`,
    link: `${section.portal.portal}sample${section.portal.portalParams}${section.uuid}`,
    description: '',
    sample_type: 'Tissue Section',
    section_number: 1,
    samples: [],
    datasets: [],
    uuid: section.uuid,
    __ancestors: section.ancestors.map(a => a.uuid),
  };
}

function reformatResponse(response) {
  return response.map(formatSection);
}

export async function getSections(endpoint, token) {
  return reformatResponse(await doApiSearch(endpoint, token, QUERY, FIELDS));
}

export async function getUnregisteredSections(endpoint, token) {
  return reformatResponse(await doApiSearch(endpoint, token, UNREGISTERED_QUERY, FIELDS));
}
