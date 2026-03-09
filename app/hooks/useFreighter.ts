"use client";

import { useState, useEffect, useCallback } from "react";
import {
  checkFreighterInstalled,
  checkFreighterAllowed,
  connectFreighter,
  getFreighterAddress,
  getFreighterNetwork,
  signXDR,
} from "@/lib/freighter";
import { getAccountBalances, getRecentTransactions, AccountBalance, Transaction } from "@/lib/stellar";

export interface FreighterState {
  isInstalled: boolean;
  isConnected: boolean;
  address: string | null;
  network: string | null;
  networkPassphrase: string | null;
  balance: AccountBalance | null;
  transactions: Transaction[];
  loading: boolean;
  balanceLoading: boolean;
  error: string | null;
}

export function useFreighter() {
  const [state, setState] = useState<FreighterState>({
    isInstalled: false,
    isConnected: false,
    address: null,
    network: null,
    networkPassphrase: null,
    balance: null,
    transactions: [],
    loading: true,
    balanceLoading: false,
    error: null,
  });

  const loadAccountData = useCallback(async (address: string, network: string) => {
    setState((prev) => ({ ...prev, balanceLoading: true }));
    const [balance, transactions] = await Promise.all([
      getAccountBalances(address, network),
      getRecentTransactions(address, network),
    ]);
    setState((prev) => ({ ...prev, balance, transactions, balanceLoading: false }));
  }, []);

  const checkConnection = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const installed = await checkFreighterInstalled();
      if (!installed) {
        setState((prev) => ({ ...prev, isInstalled: false, loading: false }));
        return;
      }

      const allowed = await checkFreighterAllowed();
      if (!allowed) {
        setState((prev) => ({ ...prev, isInstalled: true, isConnected: false, loading: false }));
        return;
      }

      const [address, networkInfo] = await Promise.all([
        getFreighterAddress(),
        getFreighterNetwork(),
      ]);

      if (address && networkInfo) {
        setState((prev) => ({
          ...prev,
          isInstalled: true,
          isConnected: true,
          address,
          network: networkInfo.network,
          networkPassphrase: networkInfo.networkPassphrase,
          loading: false,
        }));
        await loadAccountData(address, networkInfo.network);
      } else {
        setState((prev) => ({ ...prev, isInstalled: true, isConnected: false, loading: false }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, [loadAccountData]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await connectFreighter();
      if (result) {
        setState((prev) => ({
          ...prev,
          isConnected: true,
          address: result.address,
          network: result.network,
          networkPassphrase: result.networkPassphrase,
          loading: false,
        }));
        await loadAccountData(result.address, result.network);
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to connect to Freighter. Please try again.",
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Connection failed",
      }));
    }
  }, [loadAccountData]);

  const disconnect = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isConnected: false,
      address: null,
      network: null,
      networkPassphrase: null,
      balance: null,
      transactions: [],
    }));
  }, []);

  const refreshBalance = useCallback(async () => {
    if (state.address && state.network) {
      await loadAccountData(state.address, state.network);
    }
  }, [state.address, state.network, loadAccountData]);

  const sign = useCallback(
    async (xdr: string): Promise<string | null> => {
      if (!state.networkPassphrase) return null;
      return signXDR(xdr, state.networkPassphrase);
    },
    [state.networkPassphrase]
  );

  return {
    ...state,
    connect,
    disconnect,
    refreshBalance,
    sign,
  };
}
