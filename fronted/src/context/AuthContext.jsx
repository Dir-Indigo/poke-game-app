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

  // Creamos una función para actualizar el usuario que también actualiza localStorage
  const updateUser = (newUserData) => {
    // Actualizamos el estado de React
    setUser(newUserData);

    // Actualizamos también el localStorage para que los datos persistan
    const storedUser = JSON.parse(localStorage.getItem('user')) || {};
    const updatedStoredUser = { ...storedUser, ...newUserData, heals: newUserData.curas_restantes };
    localStorage.setItem('user', JSON.stringify(updatedStoredUser));
  };

  // Exponemos la nueva función 'updateUser' en lugar de 'setUser' directamente.
  // Mantenemos setUser por si se necesita en algún otro lugar, pero es mejor usar updateUser.
  const value = { user, setUser: updateUser, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}