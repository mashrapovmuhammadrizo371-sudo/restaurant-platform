// Kept only for backward compatibility. The canonical file is ./ApiError.js
// (capitalized), which matches every `require('../utils/ApiError')` call
// site in this codebase. On case-sensitive filesystems (Linux/Docker/most
// hosts) a lowercase-only file would make those requires fail at boot with
// MODULE_NOT_FOUND, so this file now just re-exports the same class —
// both spellings resolve to the exact same constructor, keeping any
// `err instanceof ApiError` check valid no matter which casing was used.
module.exports = require('./ApiError');
