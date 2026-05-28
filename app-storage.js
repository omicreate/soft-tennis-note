if (!globalThis.SOFT_TENNIS_CONFIG) {
  throw new Error("app-config.js must be loaded before app-storage.js");
}

const {
  ARCHIVE_STORAGE_KEY: storageArchiveKey,
  MAX_ARCHIVED_MATCHES: storageMaxArchivedMatches
} = globalThis.SOFT_TENNIS_CONFIG;

function storageReadJson(key, fallbackValue) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return parsed ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function storageWriteJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadArchiveEntries() {
  const archived = storageReadJson(storageArchiveKey, []);
  return Array.isArray(archived) ? archived : [];
}

function saveArchiveEntries(matches) {
  storageWriteJson(storageArchiveKey, matches.slice(0, storageMaxArchivedMatches));
}

function estimateStoredTextBytes(text) {
  try {
    return encodeURIComponent(String(text || "")).replace(/%[0-9A-F]{2}/g, "x").length;
  } catch {
    return String(text || "").length;
  }
}

function formatStoredByteSize(bytes) {
  const safeBytes = Math.max(0, Number(bytes) || 0);
  if (safeBytes < 1024) return `${safeBytes}B`;
  if (safeBytes < 1024 * 1024) return `${(safeBytes / 1024).toFixed(safeBytes < 10 * 1024 ? 1 : 0)}KB`;
  return `${(safeBytes / 1024 / 1024).toFixed(1)}MB`;
}

globalThis.SOFT_TENNIS_STORAGE = {
  storageReadJson,
  storageWriteJson,
  loadArchiveEntries,
  saveArchiveEntries,
  estimateStoredTextBytes,
  formatStoredByteSize
};
