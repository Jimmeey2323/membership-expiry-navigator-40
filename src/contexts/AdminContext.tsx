import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminContextType {
  isAdmin: boolean;
  authenticate: (code: string) => boolean;
  logout: () => void;
  showAdminPrompt: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ADMIN_CODE = '2303';
const ADMIN_SESSION_KEY = 'admin_authenticated';

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  // Check for existing admin session on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (stored === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const authenticate = (code: string): boolean => {
    if (code === ADMIN_CODE) {
      setIsAdmin(true);
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  };

  const showAdminPrompt = () => {
    const code = prompt('Enter admin code to view sensitive data:');
    if (code && authenticate(code)) {
      // Success is handled by authenticate function
    } else if (code) {
      alert('Invalid admin code');
    }
  };

  const value = {
    isAdmin,
    authenticate,
    logout,
    showAdminPrompt
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};