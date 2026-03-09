import * as StellarSdk from "@stellar/stellar-sdk";

export type HorizonServer = StellarSdk.Horizon.Server;

const TESTNET_HORIZON = "https://horizon-testnet.stellar.org";
const MAINNET_HORIZON = "https://horizon.stellar.org";

export function getServer(network: string): HorizonServer {
  if (network === "TESTNET") {
    return new StellarSdk.Horizon.Server(TESTNET_HORIZON);
  }
  return new StellarSdk.Horizon.Server(MAINNET_HORIZON);
}

export interface AccountBalance {
  xlm: string;
  assets: { code: string; issuer: string; balance: string }[];
}

export async function getAccountBalances(address: string, network: string): Promise<AccountBalance> {
  try {
    const server = getServer(network);
    const account = await server.loadAccount(address);
    let xlm = "0";
    const assets: { code: string; issuer: string; balance: string }[] = [];

    for (const balance of account.balances) {
      if (balance.asset_type === "native") {
        xlm = balance.balance;
      } else if (balance.asset_type === "credit_alphanum4" || balance.asset_type === "credit_alphanum12") {
        assets.push({
          code: balance.asset_code,
          issuer: balance.asset_issuer,
          balance: balance.balance,
        });
      }
    }

    return { xlm, assets };
  } catch {
    return { xlm: "0", assets: [] };
  }
}

export interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: string;
  asset: string;
  from: string;
  to: string;
  memo: string;
  successful: boolean;
}

export async function getRecentTransactions(address: string, network: string): Promise<Transaction[]> {
  try {
    const server = getServer(network);
    const payments = await server
      .payments()
      .forAccount(address)
      .limit(10)
      .order("desc")
      .call();

    const txs: Transaction[] = [];
    for (const record of payments.records) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const op = record as any;
      if (op.type === "payment" || op.type === "create_account") {
        const from: string = op.from || op.funder || "";
        const to: string = op.to || op.account || "";
        const amount: string = op.amount || op.starting_balance || "0";
        const asset: string = op.asset_type === "native" ? "XLM" : (op.asset_code || "");

        txs.push({
          id: op.id,
          date: op.created_at,
          type: from === address ? "Sent" : "Received",
          amount,
          asset,
          from,
          to,
          memo: "",
          successful: true,
        });
      }
    }
    return txs;
  } catch {
    return [];
  }
}

export async function buildPaymentTransaction(
  fromAddress: string,
  toAddress: string,
  amount: string,
  asset: string,
  memo: string,
  network: string,
  networkPassphrase: string
): Promise<string> {
  const server = getServer(network);
  const account = await server.loadAccount(fromAddress);

  const fee = await server.fetchBaseFee();

  let paymentAsset: StellarSdk.Asset;
  if (asset === "XLM") {
    paymentAsset = StellarSdk.Asset.native();
  } else {
    // For simplicity, only XLM supported via UI — extend as needed
    paymentAsset = StellarSdk.Asset.native();
  }

  const builder = new StellarSdk.TransactionBuilder(account, {
    fee: fee.toString(),
    networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: toAddress,
        asset: paymentAsset,
        amount,
      })
    )
    .setTimeout(30);

  if (memo) {
    builder.addMemo(StellarSdk.Memo.text(memo));
  }

  const tx = builder.build();
  return tx.toXDR();
}

export async function submitSignedTransaction(xdr: string, network: string): Promise<{ hash: string; success: boolean }> {
  const server = getServer(network);
  const tx = StellarSdk.TransactionBuilder.fromXDR(xdr, network === "TESTNET"
    ? StellarSdk.Networks.TESTNET
    : StellarSdk.Networks.PUBLIC);

  const result = await server.submitTransaction(tx as StellarSdk.Transaction);
  return { hash: result.hash, success: true };
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export function getExplorerUrl(hash: string, network: string): string {
  const base = network === "TESTNET"
    ? "https://stellar.expert/explorer/testnet/tx/"
    : "https://stellar.expert/explorer/public/tx/";
  return `${base}${hash}`;
}
