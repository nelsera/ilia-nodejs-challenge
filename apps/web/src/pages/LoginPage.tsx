import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { setToken, usersApi } from '../services/api';

type LocationState = { from?: string };

export default function LoginPage() {
  const navigate = useNavigate();

  const location = useLocation();

  const from = (location.state as LocationState | null)?.from ?? '/wallet';

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0 && !submitting;
  }, [email, password, submitting]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    setError(null);
    setSubmitting(true);

    try {
      const res = await usersApi.login(email.trim(), password);

      setToken(res.accessToken);

      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h1>Login</h1>

      <form className="card form" onSubmit={onSubmit}>
        <label className="field">
          <span>Email</span>

          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="maria@email.com"
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="123456"
            required
          />
        </label>

        {error ? <div className="error">{error}</div> : null}

        <button className="primary" type="submit" disabled={!canSubmit}>
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
