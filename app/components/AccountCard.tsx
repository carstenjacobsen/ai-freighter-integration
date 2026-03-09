"use client";

import { useState } from "react";
import { AccountBalance } from "@/lib/stellar";
import { formatAddress } from "@/lib/stellar";

interface AccountCardProps {
  address: string;
  network: string;
  balance: AccountBalance | null;
  balanceLoading: boolean;
  onRefresh: () => void;
}

export function AccountCard({ address, network, balance, balanceLoading, onRefresh }: AccountCardProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const networkColor = network === "TESTNET" ? "text-yellow-400 bg-yellow-400/10" : "text-green-400 bg-green-400/10";

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
      {/* Network badge */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${networkColor}`}>
          {network}
        </span>
        <button
          onClick={onRefresh}
          disabled={balanceLoading}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          title="Refresh balance"
        >
          <svg
            className={`w-4 h-4 ${balanceLoading ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Address */}
      <div>
        <p className="text-xs text-gray-500 mb-1">Stellar Address</p>
        <button
          onClick={copyAddress}
          className="flex items-center gap-2 group"
        >
          <span className="font-mono text-sm text-gray-300 group-hover:text-white transition-colors break-all text-left">
            {address}
          </span>
          <svg
            className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            {copied ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            )}
          </svg>
        </button>
        {copied && <p className="text-xs text-purple-400 mt-1">Copied!</p>}
      </div>

      {/* XLM Balance */}
      <div className="pt-2 border-t border-white/10">
        <p className="text-xs text-gray-500 mb-2">Balances</p>
        {balanceLoading ? (
          <div className="h-8 bg-white/5 rounded animate-pulse w-32" />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold">
                  ✦
                </div>
                <span className="text-sm font-medium text-white">XLM</span>
              </div>
              <span className="text-sm font-semibold text-white">
                {balance ? parseFloat(balance.xlm).toLocaleString(undefined, { maximumFractionDigits: 7 }) : "0"} XLM
              </span>
            </div>

            {balance?.assets.map((asset) => (
              <div key={`${asset.code}-${asset.issuer}`} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-xs font-bold">
                    {asset.code.slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium text-white">{asset.code}</span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {parseFloat(asset.balance).toLocaleString(undefined, { maximumFractionDigits: 7 })} {asset.code}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
