import { ethers } from 'ethers';
import { createRequire } from 'module';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

let _contract = null;
let _provider = null;

function getAbi() {
  const artifactPath = path.resolve(__dirname, '../../build/contracts/NFTMarketplace.json');
  if (!existsSync(artifactPath)) return null;
  const artifact = require(artifactPath);
  return artifact.abi;
}

export function getProvider() {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(process.env.GANACHE_RPC || 'http://127.0.0.1:7545');
  }
  return _provider;
}

export function getContract() {
  if (_contract) return _contract;
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) return null;
  const abi = getAbi();
  if (!abi) return null;
  _contract = new ethers.Contract(address, abi, getProvider());
  return _contract;
}

export async function checkHashExists(fileHash) {
  const contract = getContract();
  if (!contract) return false;
  try {
    return await contract.hashExists(fileHash);
  } catch {
    return false;
  }
}

export async function getInscriptionsFromChain(tokenId) {
  const contract = getContract();
  if (!contract) return [];
  try {
    const filter = contract.filters.InscriptionAdded(tokenId);
    const events = await contract.queryFilter(filter);
    return events
      .map(e => ({
        author: e.args.author,
        message: e.args.message,
        timestamp: Number(e.args.timestamp),
        blockNumber: e.blockNumber,
      }))
      .sort((a, b) => b.blockNumber - a.blockNumber);
  } catch {
    return [];
  }
}
