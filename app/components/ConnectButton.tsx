"use client";

interface ConnectButtonProps {
  isInstalled: boolean;
  isConnected: boolean;
  loading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectButton({
  isInstalled,
  isConnected,
  loading,
  onConnect,
  onDisconnect,
}: ConnectButtonProps) {
  if (!isInstalled) {
    return (
      <a
        href="https://freighter.app"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Install Freighter
      </a>
    );
  }

  if (isConnected) {
    return (
      <button
        onClick={onDisconnect}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/30 hover:bg-red-500/10 text-red-400 font-medium transition-colors"
      >
        Disconnect
      </button>
    );
  }

  return (
    <button
      onClick={onConnect}
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium transition-colors"
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Connecting...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Connect Freighter
        </>
      )}
    </button>
  );
}
