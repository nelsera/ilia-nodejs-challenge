import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearToken, getToken } from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();

  const token = getToken();

  function onLogout() {
    clearToken();

    navigate('/login');
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          ilia-nodejs-challenge
        </Link>

        <nav className="nav-links">
          <NavLink to="/wallet" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Wallet
          </NavLink>

          {!token ? (
            <>
              <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                Login
              </NavLink>
              <NavLink to="/signup" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                Signup
              </NavLink>
            </>
          ) : (
            <button className="link-button" onClick={onLogout} type="button">
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
