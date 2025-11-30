import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RegularButton from './reutilizables/RegularButton'; // Importamos el nuevo botón
import { logout } from '../services/authService'; // 1. Importar la función de logout
import logo from '../assets/logo.svg'; // 1. Importar el logo

function Header() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // 2. Limpia el localStorage
    setUser(null); // 3. Limpia el estado en el contexto
    navigate('/login'); // Redirige a la página de login
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-poke-dark-blue text-poke-light-text py-4 px-20 flex justify-between items-center shadow-lg z-50">
      <div className="flex items-center gap-8">
        {/* 2. Añadir el logo */}
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src={logo} alt="PokeGame Logo" className="h-10" />
          <span className="text-2xl font-bold text-poke-yellow" style={{ textShadow: '2px 2px 0px var(--poke-blue)' }}>PokeGame</span>
        </Link>
        <nav className="flex gap-6">
          {user && (
            <Link to="/pokemonteam" className="text-lg font-bold no-underline hover:text-poke-yellow transition-colors">
              Mis Pokémon
            </Link>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-lg">Hola, {user.username}!</span>
            <RegularButton className="bg-poke-blue hover:border-l-indigo-300" onClick={handleLogout}>Cerrar Sesión</RegularButton>
          </>
        ) : (
          <Link to="/login">
            <RegularButton >Iniciar Sesión</RegularButton>
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;