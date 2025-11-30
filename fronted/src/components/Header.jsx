import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RegularButton from './reutilizables/RegularButton';
import logo from '../assets/logo.svg';

function Header() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();     // 🔥 Limpia estado + localStorage sin errores
    navigate('/login');
  };

  return (
    <header
      className="
        fixed top-0 left-0 w-full 
        bg-poke-dark-blue text-poke-light-text 
        py-3 md:py-4 
        px-4 md:px-20
        flex justify-between items-center 
        shadow-lg z-50
      "
    >
      <div className="flex items-center gap-4 md:gap-8">

        <Link to="/dashboard" className="flex items-center gap-2 md:gap-3">
          <img src={logo} alt="PokeGame Logo" className="h-8 md:h-10"/>
          <span
            className="text-xl md:text-2xl font-bold text-poke-yellow"
            style={{ textShadow: '2px 2px 0px var(--poke-blue)' }}
          >
            PokeGame
          </span>
        </Link>

        <nav className="hidden sm:flex gap-3 md:gap-6">
          {user && (
            <Link
              to="/pokemonteam"
              className="text-base md:text-lg font-bold hover:text-poke-yellow transition-colors"
            >
              Mis Pokémon
            </Link>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {user ? (
          <>
            <span className="text-sm md:text-lg font-semibold">
              Hola, {user.username}!
            </span>

            <RegularButton
              className="bg-poke-blue hover:bg-poke-yellow text-sm md:text-base"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </RegularButton>
          </>
        ) : (
          <Link to="/login">
            <RegularButton className="text-sm md:text-base">
              Iniciar Sesión
            </RegularButton>
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;
