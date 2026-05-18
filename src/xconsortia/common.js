export const BASE_FIELDS = [
  'uuid',
  'entity_type',
  'hubmap_id',
  'sennet_id',
  'group_uuid',
  'group_name',
  'last_modified_timestamp',
  'created_by_user_displayname',
];

/** UUID to TMC mapping. */
export const GROUP_UUID_MAPPING = {
  '03b3d854-ed44-11e8-8bce-0e368f3075e8': 'TMC-UCSD',
  '07a29e4c-ed43-11e8-b56a-0e8017bdda58': 'TMC-Florida',
  '308f5ffc-ed43-11e8-b56a-0e8017bdda58': 'TMC-CalTech',
  '5bd084c8-edc2-11e8-802f-0e368f3075e8': 'HBM-TestingGroup',
  '73bb26e4-ed43-11e8-8f19-0a7c1eab007a': 'TMC-Vanderbilt',
  'def5fd76-ed43-11e8-b56a-0e8017bdda58': 'TMC-Stanford',
  '5c106f29-ea2d-11e9-85e8-0efb3ba9a670': 'RTI-General Electric',
  '301615f9-c870-11eb-a8dc-35ce3d8786fe': 'TMC-UConn',
};

const HUBMAP = {
  idPrefix: 'https://entity.api.hubmapconsortium.org/entities/',
  portal: 'https://portal.hubmapconsortium.org/browse/',
  consortium_name: 'HuBMAP',
  portalParams: '/',
  donorName: 'donor',
  assets: 'https://assets.hubmapconsortium.org',
};

const SENNET = {
  idPrefix: 'https://entity.api.sennetconsortium.org/entities/',
  portal: 'https://data.sennetconsortium.org/',
  consortium_name: 'SenNet',
  portalParams: '?uuid=',
  donorName: 'source',
  assets: 'https://assets.sennetconsortium.org',
};

export function getPortalConfig(data) {
  return data.hubmap_id ? HUBMAP : data.sennet_id ? SENNET : undefined;
}
