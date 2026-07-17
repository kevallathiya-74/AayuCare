/**
 * Simple logger stub replacing missing logger.js
 */
const logger = {
  info: () => {},
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  debug: () => {},
};

export default logger;
