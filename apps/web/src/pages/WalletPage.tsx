import { useEffect, useMemo, useState } from 'react';
import { type Wallet, type WalletTransactionsResponse, walletApi } from '../services/api';

function formatCents(amount: number) {
  const value = amount / 100;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);

  const [balance, setBalance] = useState<number | null>(null);

  const [transactions, setTransactions] = useState<WalletTransactionsResponse | null>(null);

  const [amount, setAmount] = useState<string>('1000');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const parsedAmount = useMemo(() => {
    const amountNumber = Number(amount);

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return null;
    }

    return Math.floor(amountNumber);
  }, [amount]);

  async function refreshAll() {
    setError(null);

    setLoading(true);

    try {
      const wallet = await walletApi.createOrGetMe();

      const [balance, transactions] = await Promise.all([
        walletApi.balance(),
        walletApi.transactions(),
      ]);

      setWallet(wallet);

      setBalance(balance.balance);

      setTransactions(transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }

  async function onCredit() {
    if (!parsedAmount) {
      setError('Amount must be a positive integer (in cents).');
      return;
    }

    setError(null);

    setLoading(true);

    try {
      await walletApi.credit(parsedAmount);

      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credit failed');
    } finally {
      setLoading(false);
    }
  }

  async function onDebit() {
    if (!parsedAmount) {
      setError('Amount must be a positive integer (in cents).');

      return;
    }

    setError(null);

    setLoading(true);

    try {
      await walletApi.debit(parsedAmount);

      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Debit failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll().catch(() => undefined);
  }, []);

  const items = transactions?.items ?? [];

  return (
    <div className="page">
      <h1>Wallet</h1>

      <p className="muted">Amounts are handled in cents. Example: 1000 = R$ 10,00.</p>

      {error ? <div className="error">{error}</div> : null}

      <div className="grid">
        <section className="card">
          <h2>Wallet</h2>

          <div className="kv">
            <div>
              <span className="k">Wallet ID</span>

              <span className="v">{wallet?.id ?? '-'}</span>
            </div>

            <div>
              <span className="k">User ID</span>

              <span className="v">{wallet?.userId ?? '-'}</span>
            </div>

            <div>
              <span className="k">Balance</span>

              <span className="v">
                {balance === null ? '-' : `${balance} (${formatCents(balance)})`}
              </span>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Operations</h2>

          <label className="field">
            <span>Amount (cents)</span>

            <input
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              disabled={loading}
            />
          </label>

          <div className="row">
            <button className="primary" type="button" onClick={onCredit} disabled={loading}>
              Credit
            </button>

            <button type="button" onClick={onDebit} disabled={loading}>
              Debit
            </button>
          </div>

          <p className="muted">
            Parsed amount: {parsedAmount ?? '-'}{' '}
            {parsedAmount ? `(${formatCents(parsedAmount)})` : ''}
          </p>
        </section>
      </div>

      <section className="card wallet-transactions">
        <h2>Transactions</h2>

        {transactions === null ? (
          <p className="muted">Loading...</p>
        ) : items.length === 0 ? (
          <p className="muted">No transactions found.</p>
        ) : (
          <>
            <p className="muted">
              Total: {transactions.total} | Showing: {items.length} | Skip: {transactions.skip} |
              Take: {transactions.take}
            </p>

            <div className="table">
              <div className="thead">
                <span>ID</span>
                <span>Type</span>
                <span>Amount</span>
                <span>Created At</span>
              </div>

              {items.map((t) => (
                <div key={t.id} className="trow">
                  <span className="mono">{t.id}</span>
                  <span>{t.type}</span>
                  <span>
                    {t.amount} ({formatCents(t.amount)})
                  </span>
                  <span className="mono">{t.createdAt}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
