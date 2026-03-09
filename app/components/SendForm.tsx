"use client";

import { useState } from "react";
import { buildPaymentTransaction, submitSignedTransaction, getExplorerUrl } from "@/lib/stellar";

interface SendFormProps {
  fromAddress: string;
  network: string;
  networkPassphrase: string;
  onSign: (xdr: string) => Promise<string | null>;
  onSuccess: () => void;
}

type Status = "idle" | "building" | "signing" | "submitting" | "success" | "error";

export function SendForm({ fromAddress, network, networkPassphrase, onSign, onSuccess }: SendFormProps) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isValid = to.trim().length > 0 && amount.trim().length > 0 && parseFloat(amount) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setError(null);
    setTxHash(null);

    try {
      setStatus("building");
      const xdr = await buildPaymentTransaction(
        fromAddress,
        to.trim(),
        amount.trim(),
        "XLM",
        memo.trim(),
        network,
        networkPassphrase
      );

      setStatus("signing");
      const signedXdr = await onSign(xdr);
      if (!signedXdr) {
        throw new Error("Transaction signing was cancelled or failed.");
      }

      setStatus("submitting");
      const result = await submitSignedTransaction(signedXdr, network);

      setTxHash(result.hash);
      setStatus("success");
      setTo("");
      setAmount("");
      setMemo("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setStatus("error");
    }
  };

  const statusLabels: Record<Status, string> = {
    idle: "Send XLM",
    building: "Building transaction...",
    signing: "Waiting for signature...",
    submitting: "Submitting...",
    success: "Send XLM",
    error: "Send XLM",
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <h2 className="text-lg font-semibold text-white mb-5">Send XLM</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Recipient Address</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="G..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/8 transition-colors font-mono"
            disabled={status === "building" || status === "signing" || status === "submitting"}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Amount (XLM)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0.0000001"
            step="0.0000001"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/8 transition-colors"
            disabled={status === "building" || status === "signing" || status === "submitting"}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Memo <span className="text-gray-600">(optional)</span></label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Add a note..."
            maxLength={28}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/8 transition-colors"
            disabled={status === "building" || status === "signing" || status === "submitting"}
          />
        </div>

        {/* Status indicator */}
        {(status === "building" || status === "signing" || status === "submitting") && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <svg className="w-4 h-4 text-purple-400 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-purple-300">{statusLabels[status]}</span>
          </div>
        )}

        {/* Error */}
        {status === "error" && error && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {/* Success */}
        {status === "success" && txHash && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-green-300 font-medium">Transaction submitted!</p>
              <a
                href={getExplorerUrl(txHash, network)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-400 hover:text-green-300 underline mt-0.5 block"
              >
                View on Stellar Expert →
              </a>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!isValid || status === "building" || status === "signing" || status === "submitting"}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
        >
          {statusLabels[status]}
        </button>
      </form>
    </div>
  );
}
