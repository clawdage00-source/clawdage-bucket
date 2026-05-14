/**
 * Browser stub for Node built-ins (`fs`, `path`, `url`) when bundling `@xenova/transformers`.
 * The library's `env.js` does `Object.keys(fs)` at import time; a missing `fs` default export throws
 * "Cannot convert undefined or null to object" in the client bundle.
 */
const empty = {};
export default empty;
