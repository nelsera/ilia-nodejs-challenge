import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { getToken } from '../services/api';

type Props = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const token = getToken();

  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
