/**
 * Centralized Server & Application Constants
 */
const APP_CONFIG = {
  NAME: process.env.APP_NAME || 'NOTEX',
  TAGLINE: 'store it like a variable',
  FULL_NAME: 'NOTEX — store it like a variable',
  VERSION: '1.0.0'
};

const APP_NAME = APP_CONFIG.NAME;
const APP_TAGLINE = APP_CONFIG.TAGLINE;

module.exports = {
  APP_CONFIG,
  APP_NAME,
  APP_TAGLINE
};
