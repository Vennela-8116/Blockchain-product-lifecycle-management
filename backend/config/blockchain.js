const { ethers } = require("ethers");
const fs   = require("fs");
const path = require("path");

let _provider = null;

// ── In-process nonce manager (prevents race conditions with sequential txs) ───
const _nonceMap = {};

async function getNextNonce(walletAddress) {
  const addr = walletAddress.toLowerCase();
  if (_nonceMap[addr] === undefined) {
    // Sync with chain on first use
    _nonceMap[addr] = await getProvider().getTransactionCount(walletAddress, "latest");
  }
  const nonce = _nonceMap[addr];
  _nonceMap[addr] += 1;
  return nonce;
}

// Reset nonces (call when starting fresh or after errors)
function resetNonces() {
  Object.keys(_nonceMap).forEach((k) => delete _nonceMap[k]);
}

function getProvider() {
  if (!_provider) {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
    _provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  return _provider;
}

function getAdminWallet() {
  const pk = process.env.ADMIN_PRIVATE_KEY;
  if (!pk) throw new Error("ADMIN_PRIVATE_KEY not set in environment");
  return new ethers.Wallet(pk, getProvider());
}

function getServiceSigner() {
  const pk = process.env.SERVICE_PRIVATE_KEY;
  if (!pk) throw new Error("SERVICE_PRIVATE_KEY not set in environment");
  return new ethers.Wallet(pk, getProvider());
}

function loadAbi() {
  const abiPath = path.join(__dirname, "RepairChain.json");
  if (!fs.existsSync(abiPath)) {
    throw new Error(
      "RepairChain.json ABI not found. Run: npx hardhat run scripts/deploy.js --network localhost"
    );
  }
  const artifact = JSON.parse(fs.readFileSync(abiPath, "utf8"));
  return artifact.abi;
}

function getContract(signer) {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("CONTRACT_ADDRESS not set. Run the deploy script first.");
  }
  return new ethers.Contract(contractAddress, loadAbi(), signer);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — each tx fetches the current nonce from chain to avoid collisions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register a product on-chain. Called by admin.
 */
async function registerProductOnChain(productId, serialNumber, ownerAddress) {
  const wallet = getAdminWallet();
  const nonce  = await getNextNonce(wallet.address);
  const c      = getContract(wallet);
  const tx     = await c.registerProduct(productId, serialNumber, ownerAddress, { nonce });
  const receipt = await tx.wait(1);
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * Authorize a service center on-chain. Called by admin.
 */
async function authorizeServiceCenterOnChain(walletAddress) {
  const wallet = getAdminWallet();
  const nonce  = await getNextNonce(wallet.address);
  const c      = getContract(wallet);
  const tx     = await c.addAuthorizedServiceCenter(walletAddress, { nonce });
  const receipt = await tx.wait(1);
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * Deactivate a service center on-chain. Called by admin.
 */
async function deactivateServiceCenterOnChain(walletAddress) {
  const wallet = getAdminWallet();
  const nonce  = await getNextNonce(wallet.address);
  const c      = getContract(wallet);
  const tx     = await c.removeAuthorizedServiceCenter(walletAddress, { nonce });
  const receipt = await tx.wait(1);
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * Record a lifecycle event on-chain using the service signer (Account #1).
 */
async function recordLifecycleEventOnChain(productId, canonicalJson, eventType) {
  const eventHash = ethers.keccak256(ethers.toUtf8Bytes(canonicalJson));
  const wallet    = getServiceSigner();
  const nonce     = await getNextNonce(wallet.address);
  const c         = getContract(wallet);
  const tx        = await c.recordLifecycleEvent(productId, eventHash, eventType, { nonce });
  const receipt   = await tx.wait(1);
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber, eventHash };
}

/**
 * Initiate an ownership transfer on-chain.
 */
async function initiateTransferOnChain(productId, newOwnerAddress) {
  const wallet = getAdminWallet();
  const nonce  = await getNextNonce(wallet.address);
  const c      = getContract(wallet);
  const tx     = await c.initiateOwnershipTransfer(productId, newOwnerAddress, { nonce });
  const receipt = await tx.wait(1);
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * Accept an ownership transfer on-chain (using service signer as proxy).
 */
async function acceptTransferOnChain(productId) {
  const wallet = getServiceSigner();
  const nonce  = await getNextNonce(wallet.address);
  const c      = getContract(wallet);
  const tx     = await c.acceptOwnershipTransfer(productId, { nonce });
  const receipt = await tx.wait(1);
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}


/**
 * Compute the canonical event hash (keccak256 of UTF-8 canonical JSON).
 */
function computeEventHash(canonicalJson) {
  return ethers.keccak256(ethers.toUtf8Bytes(canonicalJson));
}

/**
 * Verify an event hash against the on-chain stored hash.
 */
async function verifyEventHashOnChain(productId, index, hash) {
  try {
    const c = getContract(getProvider());
    return await c.verifyEventHash(productId, index, hash);
  } catch {
    return false;
  }
}

/**
 * Get a transaction receipt from the chain.
 */
async function getTxReceipt(txHash) {
  try {
    return await getProvider().getTransactionReceipt(txHash);
  } catch {
    return null;
  }
}

/** Get current block number. */
async function getCurrentBlock() {
  return await getProvider().getBlockNumber();
}

/** Check if the blockchain node is reachable. */
async function isBlockchainAvailable() {
  try {
    await getProvider().getBlockNumber();
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  getProvider,
  registerProductOnChain,
  authorizeServiceCenterOnChain,
  deactivateServiceCenterOnChain,
  recordLifecycleEventOnChain,
  initiateTransferOnChain,
  acceptTransferOnChain,
  computeEventHash,
  verifyEventHashOnChain,
  getTxReceipt,
  getCurrentBlock,
  isBlockchainAvailable,
  resetNonces,
};
