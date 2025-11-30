import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { getUserPokemonsService, getRandomPokemonService, postSavePokemonService } from '../services/pokemonService';
import SelectablePokemonCard from '../components/reutilizables/SelectablePokemonCard';
import RegularButton from '../components/reutilizables/RegularButton';
import ManagedPokemonCard from '../components/reutilizables/ManagedPokemonCard';
import { GiPotionBall } from 'react-icons/gi'; // Importamos el icono de poción

function Dashboard() {
  const { user } = useAuth();
  const [pokemons, setPokemons] = useState([]);
  const [initialChoices, setInitialChoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasLoaded = useRef(false); // 1. Creamos la referencia

  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return; // No hacer nada si el usuario no ha cargado

      // 2. Si ya se ha cargado, no hacemos nada más.
      if (hasLoaded.current) return;
      hasLoaded.current = true; // 3. Marcamos que la carga ha comenzado.
      try {
        let userPokemons = await getUserPokemonsService();

        // Si el usuario no tiene Pokémon, le generamos 3 iniciales
        if (userPokemons.length === 0) {
          // Usamos Promise.all para hacer las 3 peticiones en paralelo
          const choices = await Promise.all([
            getRandomPokemonService(),
            getRandomPokemonService(),
            getRandomPokemonService(),
          ]);
          setInitialChoices(choices);
        } else {
          setPokemons(userPokemons);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user]); // Se ejecuta cada vez que el objeto 'user' cambia

  const handleSelectInitial = async (selectedPokemon) => {
    try {
      setLoading(true);
      // Guardamos el Pokémon elegido, usando su nombre como apodo inicial.
      const saved = await postSavePokemonService(selectedPokemon.poke_id, selectedPokemon.name);
      setPokemons([saved]); // Mostramos el Pokémon elegido
      setInitialChoices([]); // Limpiamos las opciones
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePokemon = (updatedPokemon) => {
    setPokemons((currentPokemons) =>
      currentPokemons.map((p) =>
        p.id === updatedPokemon.id ? updatedPokemon : p
      )
    );
  };

  // Función para renderizar el contenido principal (Pokémon)
  const renderPokemonContent = () => {
    if (loading) return <p>Cargando tu equipo Pokémon...</p>;
    if (error) return <p className="text-poke-red">Error: {error}</p>;

    // Si hay opciones iniciales, mostramos la pantalla de selección
    if (initialChoices.length > 0) {
      return (
        <div>
          <h1 className="text-3xl font-bold mb-2">¡Elige tu Pokémon Inicial!</h1>
          <p className="text-lg text-poke-light-text mb-6">Haz clic en el Pokémon que quieras que te acompañe en tu aventura.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialChoices.map((pokemon) => (
              <SelectablePokemonCard
                key={pokemon.poke_id}
                pokemon={pokemon}
                onSelect={handleSelectInitial}
                isSelectable={true}
              />
            ))}
          </div>
        </div>
      );
    }


    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Tu Equipo Pokémon</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pokemons.map((pokemon) => (
          <ManagedPokemonCard
            key={pokemon.id}
            pokemon={pokemon}
            onUpdate={handleUpdatePokemon}
          />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Columna Izquierda: Perfil del Jugador */}
      <aside className="w-full md:w-1/3 lg:w-1/4 bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center self-start border-2 border-gray-700">
        <img src="https://static.wikia.nocookie.net/pokemon/images/5/57/Red_FireRed_and_LeafGreen.png" alt="Entrenador" className="w-280 h-280 object-contain mb-4 transform -scale-x-100" />
        <h2 className="text-2xl font-bold text-poke-yellow">{user?.username}</h2>
        <div className="text-poke-light-text mt-2 text-lg flex items-center justify-center">
          <GiPotionBall className="h-5 w-5 text-green-500" />
          <span> : <span className="font-bold text-white">{user?.curas_restantes}</span></span>
        </div>
        <div className="mt-8 w-full">
          <Link to="/pokemonteam">
            <RegularButton>¡A Jugar!</RegularButton>
          </Link>
        </div>
      </aside>

      {/* Columna Derecha: Contenido de Pokémon */}
      <section className="w-full md:w-2/3 lg:w-3/4">
        {renderPokemonContent()}
      </section>
    </div>
  );
}

export default Dashboard;