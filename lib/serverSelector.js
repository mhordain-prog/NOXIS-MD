const DEFAULT_SERVERS = [
  { id: "primary", url: process.env.SERVER_PRIMARY_URL || "", enabled: true },
  { id: "secondary", url: process.env.SERVER_SECONDARY_URL || "", enabled: true },
  { id: "tertiary", url: process.env.SERVER_TERTIARY_URL || "", enabled: true }
];

const FAILURE_THRESHOLD = Math.max(1, Number(process.env.SERVER_FAILURE_THRESHOLD || 3));
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
  server.healthy = server.failures < FAILURE_THRESHOLD;
  server.lastCheck = new Date().toISOString();
  server.lastError = String(error || "unknown error");
}

function getStatus() {
  return servers.map(({ id, url, enabled, healthy, failures, successes, lastCheck, lastError }) => ({
    id,
    url: url ? url.replace(/^(https?:\\/\\/)[^/]+/, "$1***") : "",
    enabled,
    healthy,
    failures,
    successes,
    lastCheck,
    lastError
  }));
}

async function checkServer(server, timeoutMs = 5000) {
  if (!server?.url) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(server.url.replace(/\\/$/, "") + "/health", {
      method: "GET",
      signal: controller.signal,
      headers: { "user-agent": "NOXIS-MD-RoundRobin/1.0" }
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    markSuccess(server.id);
    return true;
  } catch (error) {
    markFailure(server.id, error?.message || error);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function checkAllServers() {
  const configured = configuredServers();
  const results = await Promise.all(configured.map((server) => checkServer(server)));
  return results.every(Boolean);
}

module.exports = {
  selectRoundRobin,
  markSuccess,
  markFailure,
  checkServer,
  checkAllServers,
  getStatus
};
