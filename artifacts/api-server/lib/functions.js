'use strict';
// EDWARD MD: utility shim for new-style plugins that require('../lib/functions')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getBuffer = async (url, options = {}) => {
  const { default: axios } = await import('axios');
  const res = await axios.get(url, { responseType: 'arraybuffer', ...options });
  return Buffer.from(res.data);
};

module.exports = { sleep, getBuffer };
