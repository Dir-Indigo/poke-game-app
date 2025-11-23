import React from 'react';

const typeColors = {
  Poison: 'bg-purple-500',
  Flying: 'bg-indigo-400',
  Fire: 'bg-red-500',
  Water: 'bg-blue-500',
  Grass: 'bg-green-500',
  Electric: 'bg-yellow-400',
  Normal: 'bg-gray-400',
};

function SelectablePokemonCard({ pokemon, onSelect, children }) {
  const cardClasses = `bg-gray-800 rounded-lg p-4 flex flex-col items-center shadow-lg border-2 border-gray-700 transition-transform duration-300 ${onSelect ? 'cursor-pointer transform hover:scale-105 hover:border-poke-yellow' : ''}`;

  return (
    <div
      className={cardClasses}
      onClick={() => onSelect && onSelect(pokemon)}
    >
      <h2 className="text-xl font-bold text-poke-yellow mt-2">{pokemon.name}</h2>
      {children}

      <div className="flex flex-col md:flex-row items-center gap-4 mt-2 w-full">
        <img src={pokemon.sprite_url} alt={pokemon.name} className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0" />

        <div className="flex flex-col text-center md:text-left flex-grow">
          <div className="text-sm text-poke-light-text">
            <p>HP: {pokemon.hp}</p>
            <p>Ataque: {pokemon.attack}</p>
            <p>Defensa: {pokemon.defense}</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
            {pokemon.types.map((type) => (
              <span key={type} className={`px-2 py-1 text-xs font-bold text-white rounded-full ${typeColors[type] || 'bg-gray-500'}`}>{type}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectablePokemonCard;