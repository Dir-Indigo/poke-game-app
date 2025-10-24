import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    // Solo intentamos cargar desde localStorage si el usuario no está ya en el estado.
    if (!user) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser({
          ...userData,
          curas_restantes: userData.heals,
        });
      }
    }
  }, [user]); // Ahora depende de 'user' para evitar la recarga si ya existe.

  const value = { user, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}