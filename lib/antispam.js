const activity = new Map();

function check(groupJid, userJid, now = Date.now()) {
  const key = groupJid + ":" + userJid;
  const list = (activity.get(key) || []).filter(ts => now - ts <= 5000);
  list.push(now);
  activity.set(key, list);

  if (activity.size > 5000) {
    const first = activity.keys().next().value;
    if (first) activity.delete(first);
  }

  return list.length;
}

function clear(groupJid, userJid) {
  activity.delete(groupJid + ":" + userJid);
}

module.exports = { check, clear };