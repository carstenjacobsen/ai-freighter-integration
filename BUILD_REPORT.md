# Stellar Freighter Wallet — Build Report

**Date:** 2026-03-09
**Project:** `stellar-freighter-wallet`
**Location:** `/Users/carsten.jacobsen/Documents/Claude Code/stellar-freighter-wallet`
**Stack:** Next.js 16 (Turbopack) · TypeScript · Tailwind CSS 4 · `@stellar/freighter-api` · `@stellar/stellar-sdk`

---

## Objective

Build a web wallet app that integrates the Freighter browser extension to:
- Detect and connect to Freighter
- Display the user's Stellar address and XLM balance
- Allow sending XLM payments (build → sign → submit)
- Show recent transaction history

---

## Architecture Designed

```
app/
  lib/freighter.ts       — Freighter API wrapper (detection, connect, sign)
  lib/stellar.ts         — Horizon server, balances, tx builder/submitter
  hooks/useFreighter.ts  — React state management hook
  components/
    ConnectButton.tsx    — Install / Connect / Disconnect button
    AccountCard.tsx      — Address, network badge, balances, refresh
    SendForm.tsx         — Build → sign → submit XLM payment flow
    TransactionList.tsx  — Last 10 payments with explorer links
  page.tsx               — Orchestrates all components
```

---

## Build Steps & Issues

### Step 1 — Project scaffolding

**Action:** `npx create-next-app@latest stellar-freighter-wallet`

**Gotcha 1 — Space in working directory path**

`npm` / `npx` cannot handle paths with spaces in the shell `cwd`. Running the scaffolder directly in `/Users/carsten.jacobsen/Documents/Claude Code` failed with:

```
npm error syscall spawn sh
npm error path /Users/carsten.jacobsen/Documents/Claude Code
npm error errno -2
npm error enoent spawn sh ENOENT
```

**Fix:** Scaffold in `/tmp`, then `cp -r` the result to the destination.

---

### Step 2 — Installing dependencies

**Action:** `npm install @stellar/freighter-api @stellar/stellar-sdk`

**Gotcha 2 — Copying `node_modules` breaks symlinks**

The initial approach was to `cp -r` node_modules from `/tmp` after installing there. This silently corrupted the `.bin/next` wrapper (a symlink whose relative target path broke after the copy), causing:

```
Error: Cannot find module '../server/require-hook'
```

**Fix:** Delete the copied `node_modules` and run `npm install` directly inside the destination project directory (using the full path workaround for the space issue).

---

### Step 3 — Writing source files

All source files written without issues. Key design decisions:

- `lib/freighter.ts` wraps every API call with error handling
- `lib/stellar.ts` uses `Horizon.Server` for account data and tx submission
- `useFreighter.ts` hook manages all async wallet state in one place
- Components are pure UI — all logic lives in the hook and lib files

---

### Step 4 — First build attempt

**Action:** `npm run build`

**Gotcha 3 — Next.js 16 uses Turbopack by default; `webpack` config rejected**

Next.js 16 enables Turbopack by default. A `webpack` config block in `next.config.ts` (added to polyfill Node.js built-ins for the browser) caused a hard build error:

```
ERROR: This build is using Turbopack, with a `webpack` config and no `turbopack` config.
```

**Fix:** Replace the webpack fallbacks with an empty `turbopack: {}` config to opt in to Turbopack explicitly. The Node.js polyfill config turned out to be unnecessary — Turbopack handles browser-targeting automatically.

```ts
// next.config.ts
const nextConfig: NextConfig = {
  turbopack: {},
};
```

---

### Step 5 — Second build attempt

**Gotcha 4 — `@/*` path alias resolves to project root, not `app/`**

The default `create-next-app` tsconfig sets:

```json
"paths": { "@/*": ["./*"] }
```

This maps `@/components/Foo` → `./components/Foo` (project root), but all source files were placed under `./app/components/Foo`. Turbopack's module resolver was strict about this, producing 5 "Module not found" errors.

**Fix:** Update `tsconfig.json`:

```json
"paths": { "@/*": ["./app/*"] }
```

---

### Step 6 — Third build attempt

**Gotcha 5 — Stellar SDK type system rejects cross-type casts**

`getRecentTransactions` iterated over `payments.records` and cast each record to `PaymentOperationRecord`, then attempted to re-cast to `CreateAccountOperationRecord` to access `funder` / `account` / `starting_balance`. TypeScript rejected this:

```
Type error: Conversion of type 'PaymentOperationRecord' to type
'CreateAccountOperationRecord' may be a mistake because neither type
sufficiently overlaps with the other.
```

**Fix:** Cast the record to `any` and access the fields duck-typed, since both operation types share the same runtime shape for the fields we need:

```ts
const op = record as any;
const from: string   = op.from   || op.funder           || "";
const to: string     = op.to     || op.account          || "";
const amount: string = op.amount || op.starting_balance || "0";
```

**Build succeeded on the fourth attempt.**

---

### Step 7 — Starting the preview server

**Action:** `preview_start("stellar-freighter-wallet")`

**Gotcha 6 — `launch.json` must live in the session root `.claude/`, not the project subfolder**

The initial `launch.json` was placed at:

```
stellar-freighter-wallet/.claude/launch.json   ← ignored
```

The `preview_start` tool reads from the Claude Code session's working directory:

```
/Users/carsten.jacobsen/Documents/Claude Code/.claude/launch.json   ← correct
```

Every attempt while the config was in the wrong place returned "Port configured is already in use" (misleading error — the port was free; the tool simply couldn't find the config).

**Fix:** Add the new server entry to the root `launch.json`, with a `cwd` pointing to the project directory:

```json
{
  "name": "stellar-freighter-wallet",
  "runtimeExecutable": "/usr/local/bin/node",
  "runtimeArgs": ["node_modules/.bin/next", "dev", "--port", "3002"],
  "port": 3002,
  "cwd": "/Users/carsten.jacobsen/Documents/Claude Code/stellar-freighter-wallet"
}
```

Note: the port must be hardcoded in both `runtimeArgs` and the `port` field; the tool does not inject `PORT` as an env var.

---

### Step 8 — App stuck on "Connecting to Freighter..."

**Gotcha 7 — `isConnected()` hangs indefinitely when Freighter is not installed**

The Freighter API communicates with the extension via a browser message channel. When the extension is not installed (as in the headless preview browser), the `isConnected()` call returns a promise that **never resolves**. The UI stayed in the loading spinner forever.

**Fix:** Wrap every Freighter API call that runs on initial page load in a `withTimeout` helper:

```ts
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), ms)
  );
  return Promise.race([promise, timeout]);
}

export async function checkFreighterInstalled(): Promise<boolean> {
  try {
    const result = await withTimeout(isConnected(), 2000);
    return !("error" in result);
  } catch {
    return false;  // timeout → treat as not installed
  }
}
```

After the fix, the app correctly resolves within 2 seconds and shows the appropriate state (Install / Connect / Connected).

---

## Final State

| Concern | Detail |
|---|---|
| Dev server | `http://localhost:3002` |
| Freighter detection | Resolves within 2s via timeout race |
| Connect flow | `requestAccess` → `getAddress` → `getNetworkDetails` |
| Send flow | Build XDR → `signTransaction` (Freighter popup) → Horizon submit |
| Networks | Testnet and Mainnet — follows Freighter's active network |
| Explorer links | `stellar.expert` for both tx history and send confirmations |

---

## Lessons Learned

| # | Lesson |
|---|---|
| 1 | `npm` / `npx` cannot operate on paths with spaces — use `/tmp` as a staging area |
| 2 | Never copy `node_modules` between directories — symlinks in `.bin/` will break |
| 3 | Next.js 16 defaults to Turbopack; webpack config blocks the build entirely |
| 4 | `create-next-app`'s default `@/*` alias points to the project root, not `app/` |
| 5 | The Stellar SDK's TypeScript unions require casting through `any` when handling union operation types |
| 6 | `preview_start` reads `launch.json` from the session root, not from subdirectories |
| 7 | Freighter API calls hang permanently with no extension installed — always race against a timeout on initial load |
