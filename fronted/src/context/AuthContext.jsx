import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && !user) {
      const userData = JSON.parse(storedUser);
      setUserState({
        ...userData,
        curas_restantes: userData.heals,
      });
    }
  }, [user]);

  // Función segura para actualizar usuario
  const updateUser = (newUserData) => {
    if (!newUserData) {
      // LOGOUT CASE
      setUserState(null);
      localStorage.removeItem('user');
      return;
    }

    const updatedStoredUser = {
      ...newUserData,
      heals: newUserData.curas_restantes,
    };

    setUserState(updatedStoredUser);
    localStorage.setItem('user', JSON.stringify(updatedStoredUser));
  };

  const logoutUser = () => {
    setUserState(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: updateUser,
        updateUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
