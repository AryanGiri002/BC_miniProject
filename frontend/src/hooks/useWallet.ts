import { useState, useEffect, useCallback } from 'react';
import { connectWallet, ensureGanacheNetwork } from '../lib/web3';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chainOk, setChainOk] = useState(false);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await ensureGanacheNetwork();
      const addr = await connectWallet();
      setAddress(addr.toLowerCase());
      setChainOk(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    // Restore session
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
      if (accounts[0]) setAddress(accounts[0].toLowerCase());
    });

    const handleAccounts = (accounts: string[]) =>
      setAddress(accounts[0]?.toLowerCase() ?? null);
    const handleChain = () =>
      ensureGanacheNetwork().then(() => setChainOk(true)).catch(() => {});

    window.ethereum.on('accountsChanged', handleAccounts);
    window.ethereum.on('chainChanged', handleChain);
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccounts);
      window.ethereum.removeListener('chainChanged', handleChain);
    };
  }, []);

  return { address, connect, isConnecting, error, isConnected: !!address, chainOk };
}
