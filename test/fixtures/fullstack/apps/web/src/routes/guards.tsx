import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSessao } from '../stores/sessao';

export function RequireAuth({ children }: { children: ReactNode }) {
  const usuario = useSessao((s) => s.usuario);
  return usuario ? <>{children}</> : <Navigate to="/cadastro" />;
}
