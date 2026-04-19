import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const getProvider = () => new ethers.BrowserProvider(window.ethereum);

export const getSigner = async () => {
  const provider = getProvider();
  return provider.getSigner();
};

export const getContract = async (withSigner = false) => {
  // Dynamically import so it doesn't crash before deployment
  const contractData = await import('./contract.json').catch(() => null);
  if (!contractData) throw new Error('Contract not deployed yet. Run truffle migrate first.');
  const provider = getProvider();
  const runner = withSigner ? await provider.getSigner() : provider;
  return new ethers.Contract(contractData.address, contractData.abi, runner);
};

export const connectWallet = async (): Promise<string> => {
  if (!window.ethereum) throw new Error('MetaMask not found. Please install it.');
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return (accounts as string[])[0];
};

export const ensureGanacheNetwork = async () => {
  if (!window.ethereum) return;
  const provider = getProvider();
  const network = await provider.getNetwork();
  if (network.chainId !== 1337n) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x539' }],
      });
    } catch (e: any) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x539',
            chainName: 'Ganache Local',
            rpcUrls: ['http://127.0.0.1:7545'],
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          }],
        });
      }
    }
  }
};

export const formatEth = (wei: bigint) => ethers.formatEther(wei);
export const parseEth = (eth: string) => ethers.parseEther(eth);
export const truncateAddress = (addr: string) =>
  `${addr.slice(0, 6)}...${addr.slice(-4)}`;
