"use client";

import { useFreighter } from "@/hooks/useFreighter";
import { ConnectButton } from "@/components/ConnectButton";
import { AccountCard } from "@/components/AccountCard";
import { SendForm } from "@/components/SendForm";
import { TransactionList } from "@/components/TransactionList";

export default function Home() {
  const {
    isInstalled,
    isConnected,
    address,
    network,
    networkPassphrase,
    balance,
    transactions,
    loading,
    balanceLoading,
    error,
    connect,
    disconnect,
    refreshBalance,
    sign,
  } = useFreighter();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-950/30 via-gray-950 to-blue-950/20 pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-lg font-bold">
              ✦
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Stellar Wallet</h1>
              <p className="text-xs text-gray-500 mt-0.5">Powered by Freighter</p>
            </div>
          </div>

          <ConnectButton
            isInstalled={isInstalled}
            isConnected={isConnected}
            loading={loading}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </header>

        {/* Global error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Not installed state */}
        {!loading && !isInstalled && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/10 flex items-center justify-center text-4xl mx-auto mb-6">
              🚀
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Freighter Required</h2>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
              Freighter is a browser extension wallet for the Stellar network. Install it to get started.
            </p>
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Get Freighter
            </a>
          </div>
        )}

        {/* Not connected state */}
        {!loading && isInstalled && !isConnected && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/10 flex items-center justify-center text-4xl mx-auto mb-6">
              🔑
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
              Connect your Freighter wallet to view your balance and send transactions on the Stellar network.
            </p>
            <button
              onClick={connect}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Connect Freighter
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-20">
            <svg className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-400 text-sm">Connecting to Freighter...</p>
          </div>
        )}

        {/* Connected state */}
        {!loading && isConnected && address && network && networkPassphrase && (
          <div className="space-y-5">
            <AccountCard
              address={address}
              network={network}
              balance={balance}
              balanceLoading={balanceLoading}
              onRefresh={refreshBalance}
            />

            <SendForm
              fromAddress={address}
              network={network}
              networkPassphrase={networkPassphrase}
              onSign={sign}
              onSuccess={refreshBalance}
            />

            <TransactionList
              transactions={transactions}
              address={address}
              network={network}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-xs text-gray-700">
            Built on the{" "}
            <a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-500">
              Stellar Network
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
