import { getPortalConfig } from './common.js';

const PER_API_SEARCH_REQUEST_COUNT = 10000;

function getApiSearchHeaders(token) {
  const headers = new Headers();
  headers.append('Content-type', 'application/json');
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  return headers;
}

function getApiSearchBody(from, size, query, fields) {
  const bodyObj = {
    version: true,
    from,
    size,
    stored_fields: ['*'],
    script_fields: {},
    docvalue_fields: [],
    query,
    _source: {
      includes: fields,
    },
  };
  return JSON.stringify(bodyObj);
}

async function doSearchRequest(url, init) {
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    const validResponse = res.ok || text.startsWith('https');
    if (validResponse) {
      if (text.startsWith('https')) {
        return await fetch(text).then((r) => r.json());
      } else {
        return JSON.parse(text);
      }
    }
    console.log(init, res);
    return undefined;
  } catch (_error) {
    console.log(_error);
    return undefined;
  }
}

export async function doApiSearchWork(endpoint, token, query, fields) {
  const perReqCount = PER_API_SEARCH_REQUEST_COUNT;
  const headers = getApiSearchHeaders(token);
  const body = getApiSearchBody(0, perReqCount, query, fields);
  const firstResult = await doSearchRequest(endpoint, { method: 'POST', headers, body });
  if (!firstResult) {
    return undefined;
  }
  const totalCount = firstResult.hits.total.value;
  if (totalCount <= perReqCount) {
    return firstResult;
  }
  const requests = [];
  for (let from = perReqCount; from < totalCount; from += perReqCount) {
    requests.push(
      doSearchRequest(endpoint, {
        method: 'POST',
        headers,
        body: getApiSearchBody(from, perReqCount, query),
      })
    );
  }
  const results = await Promise.all(requests);
  if (results.some((res) => !res)) {
    return undefined;
  }
  const items = results.map((res) => res.hits.hits);
  return {
    ...firstResult,
    hits: {
      ...firstResult.hits,
      hits: firstResult.hits.hits.concat(...items),
    },
  };
}

export async function doApiSearch(endpoint, token, query, fields) {
  const response = await doApiSearchWork(endpoint, token, query, fields);
  const entries = (response?.hits?.hits ?? [])
    .map((e) => e?._source ?? {})
    .map((e) => ({ ...e, portal: getPortalConfig(e) }))
    .filter((e) => e.portal)
    .sort((a, b) => a['uuid'].localeCompare(b['uuid']));
  return entries;
}
