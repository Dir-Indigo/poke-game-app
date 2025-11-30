import React from 'react';

function SelectablePokemonCard({ pokemon, onSelect, children }) {
  const cardClasses = `relative bg-gray-800 rounded-lg p-4 flex flex-col items-center shadow-lg border-2 border-gray-700 transition-transform duration-300 ${onSelect ? 'cursor-pointer transform hover:scale-105 hover:border-poke-yellow' : ''}`;

  const getLevelColor = (level) => {
    if (level >= 40) return 'var(--level-S)';
    if (level >= 30) return 'var(--level-A)';
    if (level >= 20) return 'var(--level-B)';
    return 'var(--level-C)';
  };

  return (
    <div
      className={cardClasses}
      onClick={() => onSelect && onSelect(pokemon)}
    >
      {pokemon.level && (
        <div
          className={`absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-gray-900`}
          style={{ backgroundColor: getLevelColor(pokemon.level ) }}
          title={`Nivel ${pokemon.level}`}
        >
          {pokemon.level}
        </div>
      )}

      <h2 className="text-xl font-bold text-poke-yellow mt-2">{pokemon.name}</h2>
      {children}

      <div className="flex flex-col items-center gap-4 mt-2 w-full">

        <img
          src={pokemon.sprite_url}
          alt={pokemon.name}
          className="w-32 h-32 object-contain"
        />

        <div className="flex flex-col text-center w-full break-words">

          <div className="text-sm text-poke-light-text space-y-1">
            <p>HP: {pokemon.hp}</p>
            <p>Ataque: {pokemon.attack}</p>
            <p>Defensa: {pokemon.defense}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {pokemon.types.map((type) => (
              <span
                key={type}
                className="px-2 py-1 text-xs font-bold text-white rounded-full"
                style={{ backgroundColor: `var(--type-${type.toLowerCase()}, #718096)` }}
              >
                {type}
              </span>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}

export default SelectablePokemonCard;