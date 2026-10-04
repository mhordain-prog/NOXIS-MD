const DEFAULT_SERVERS = [
  { id: "primary", url: process.env.SERVER_PRIMARY_URL || "", enabled: true },
  { id: "secondary", url: process.env.SERVER_SECONDARY_URL || "", enabled: true },
  { id: "tertiary", url: process.env.SERVER_TERTIARY_URL || "", enabled: true }
];

const servers = DEFAULT_SERVERS.map((server) => ({
  ...server,
  healthy: true,
  failures: 0,
  successes: 0,
  lastCheck: null,
  lastError: null
}));

let cursor = -1;

function configuredServers() {
  return servers.filter((server) => server.enabled && server.url);
}

function healthyServers() {
  const configured = configuredServers();
  const healthy = configured.filter((server) => server.healthy);
  return healthy.length ? healthy : configured;
}

function selectRoundRobin() {
  const available = healthyServers();
  if (!available.length) return null;
  cursor = (cursor + 1) % available.length;
  return available[cursor];
}

function markSuccess(id) {
  const server = servers.find((item) => item.id === id);
  if (!server) return;
  server.healthy = true;
  server.failures = 0;
  server.successes += 1;
  server.lastCheck = new Date().toISOString();
  server.lastError = null;
}

function markFailure(id, error) {
  const server = servers.find((item) => item.id === id);
  if (!server) return;
  server.failures += 1;
  server.successes = 0;
  server.healthy = server.failures < 3;
  server.lastCheck = new Date().toISOString();
  server.lastError = String(error || "unknown error");
}

function getStatus() {
  return servers.map(({ id, url, enabled, healthy, failures, successes, lastCheck, lastError }) => ({
    id,
    url: url ? url.replace(/^(https?:\/\/)[^/]+/, "$1***") : "",
    enabled,
    healthy,
    failures,
    successes,
    lastCheck,
    lastError
  }));
}

module.exports = {
  selectRoundRobin,
  markSuccess,
  markFailure,
  getStatus
};
