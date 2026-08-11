import type { GlobalProvider } from '@ladle/react';

import '../app/globals.css';

export const Provider: GlobalProvider = ({ children }) => {
  return <>{children}</>;
};
