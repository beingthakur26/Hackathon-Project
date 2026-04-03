import React, { useEffect } from 'react';
import { useAuthStore } from '../features/auth/useAuthStore';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const { init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  return <>{children}</>;
};
