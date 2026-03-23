const dns = require('dns');

const DEFAULT_DOH_ENDPOINTS = [
  'https://dns.google/resolve',
  'https://cloudflare-dns.com/dns-query',
];

const joinQuery = (entries) =>
  entries
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

const parseTxtAnswer = (txtAnswers = []) => {
  if (!Array.isArray(txtAnswers) || txtAnswers.length === 0) return {};

  const first = txtAnswers[0]?.data || '';
  const cleaned = first.replace(/^"|"$/g, '').replace(/\"/g, '');
  return cleaned
    .split('&')
    .map(part => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const [key, value] = part.split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {});
};

const parseSrvHosts = (answers = []) =>
  answers
    .map(answer => answer?.data || '')
    .map(line => line.trim().split(/\s+/))
    .filter(parts => parts.length === 4)
    .map(parts => {
      const [, , port, host] = parts;
      return `${host.replace(/\.$/, '')}:${port}`;
    });

const fetchDohJson = async (endpoint, name, type) => {
  const url = `${endpoint}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
  const response = await fetch(url, {
    headers: endpoint.includes('cloudflare') ? { Accept: 'application/dns-json' } : {},
  });

  if (!response.ok) {
    throw new Error(`DoH request failed (${response.status}) for ${name} type ${type}`);
  }

  return response.json();
};

const resolveSrvViaDoh = async (domain) => {
  const srvName = `_mongodb._tcp.${domain}`;

  let lastError;
  for (const endpoint of DEFAULT_DOH_ENDPOINTS) {
    try {
      const [srv, txt] = await Promise.all([
        fetchDohJson(endpoint, srvName, 'SRV'),
        fetchDohJson(endpoint, domain, 'TXT').catch(() => ({ Answer: [] })),
      ]);

      const hosts = parseSrvHosts(srv.Answer || []);
      if (!hosts.length) {
        throw new Error(`No SRV hosts returned for ${srvName}`);
      }

      const txtOptions = parseTxtAnswer(txt.Answer || []);
      return { hosts, txtOptions };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`Unable to resolve SRV for ${domain}`);
};

const mergeOptions = (txtOptions, originalOptions) => ({
  ...txtOptions,
  ...originalOptions,
  tls: originalOptions.tls || originalOptions.ssl || 'true',
});

const normalizeMongoUri = (uri, defaultDbName = 'aayucare_db') => {
  const parsed = new URL(uri);
  const dbName = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname.slice(1) : defaultDbName;

  const options = {};
  parsed.searchParams.forEach((value, key) => {
    options[key] = value;
  });

  return {
    protocol: parsed.protocol,
    username: decodeURIComponent(parsed.username || ''),
    password: decodeURIComponent(parsed.password || ''),
    host: parsed.host,
    dbName,
    options,
  };
};

const buildStandardMongoUri = ({ username, password, hosts, dbName, options }) => {
  const auth = username
    ? `${encodeURIComponent(username)}:${encodeURIComponent(password || '')}@`
    : '';

  const queryString = joinQuery(Object.entries(options));
  return `mongodb://${auth}${hosts.join(',')}/${dbName}${queryString ? `?${queryString}` : ''}`;
};

const resolveMongoUriWithFallback = async (uri, defaultDbName = 'aayucare_db') => {
  const normalized = normalizeMongoUri(uri, defaultDbName);

  if (normalized.protocol !== 'mongodb+srv:') {
    return { uri, usedFallback: false };
  }

  const { hosts, txtOptions } = await resolveSrvViaDoh(normalized.host);
  const mergedOptions = mergeOptions(txtOptions, normalized.options);
  const fallbackUri = buildStandardMongoUri({
    username: normalized.username,
    password: normalized.password,
    hosts,
    dbName: normalized.dbName,
    options: mergedOptions,
  });

  return { uri: fallbackUri, usedFallback: true, hosts };
};

const applyDnsServersFromEnv = () => {
  const configured = process.env.MONGODB_DNS_SERVERS;
  if (!configured) return;

  const servers = configured
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  if (!servers.length) return;
  dns.setServers(servers);
};

module.exports = {
  resolveMongoUriWithFallback,
  applyDnsServersFromEnv,
};
