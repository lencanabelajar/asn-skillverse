// backend/utils/ipfs.js
const { create } = require('ipfs-http-client');

const IPFS_API = process.env.IPFS_API_URL || 'http://127.0.0.1:5001';

let client = null;
function init() {
  try {
    client = create({ url: IPFS_API });
    console.log('IPFS client configured to', IPFS_API);
  } catch (err) {
    console.warn('IPFS client initialization failed (will operate in stub mode).', err.message || err);
    client = null;
  }
}
init();

async function addBuffer(buffer) {
  if (!client) throw new Error('IPFS client not available');
  const result = await client.add(buffer);
  return result.cid.toString();
}

// simple stub: if ipfs not available, return a pseudo CID (not real)
async function addBufferSafe(buffer) {
  if (client) {
    return addBuffer(buffer);
  } else {
    // pseudo cid for demo: sha256 hex prefixed
    const crypto = require('crypto');
    const fake = crypto.createHash('sha256').update(buffer).digest('hex');
    return 'demoCID_' + fake.slice(0, 20);
  }
}

module.exports = {
  addBufferSafe,
  addBuffer,
  client
};
