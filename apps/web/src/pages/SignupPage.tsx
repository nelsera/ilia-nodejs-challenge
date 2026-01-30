import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { setToken, usersApi } from '../services/api';

export default function SignupPage() {
  const navigate = useNavigate();

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
      const res = await usersApi.signup(email.trim(), password);

      setToken(res.accessToken);

      navigate('/wallet', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h1>Signup</h1>

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="123456"
            required
          />
        </label>

        {error ? <div className="error">{error}</div> : null}

        <button className="primary" type="submit" disabled={!canSubmit}>
          {submitting ? 'Creating user...' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
