"use client";

import { Transaction, getExplorerUrl, formatAddress } from "@/lib/stellar";

interface TransactionListProps {
  transactions: Transaction[];
  address: string;
  network: string;
}

export function TransactionList({ transactions, address, network }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
        <div className="text-center py-8 text-gray-500">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">No transactions yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
      <div className="space-y-3">
        {transactions.map((tx) => {
          const isSent = tx.type === "Sent";
          const counterparty = isSent ? tx.to : tx.from;

          return (
            <a
              key={tx.id}
              href={getExplorerUrl(tx.id, network)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group"
            >
              {/* Icon */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                isSent ? "bg-red-500/15" : "bg-green-500/15"
              }`}>
                <svg
                  className={`w-4 h-4 ${isSent ? "text-red-400" : "text-green-400"}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {isSent ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  )}
                </svg>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{tx.type}</span>
                  <span className={`text-sm font-semibold ${isSent ? "text-red-400" : "text-green-400"}`}>
                    {isSent ? "-" : "+"}{parseFloat(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 7 })} {tx.asset}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-gray-500 font-mono truncate">
                    {isSent ? "To: " : "From: "}{formatAddress(counterparty)}
                  </span>
                  <span className="text-xs text-gray-600 ml-2 flex-shrink-0">
                    {new Date(tx.date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <svg
                className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          );
        })}
      </div>
    </div>
  );
}
