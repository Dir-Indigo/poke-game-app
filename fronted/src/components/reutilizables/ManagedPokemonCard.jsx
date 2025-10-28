import React, { useState } from 'react';
import { updatePokemonNicknameService } from '../../services/pokemonService';
import RegularButton from './RegularButton';
import SelectablePokemonCard from './SelectablePokemonCard';
import TextInput from './TextInput';

function ManagedPokemonCard({ pokemon, onUpdate }) {
  const [nickname, setNickname] = useState(pokemon.nickname || '');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  const handleNicknameSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const updatedPokemon = await updatePokemonNicknameService(pokemon.id, nickname);
      onUpdate(updatedPokemon);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <SelectablePokemonCard pokemon={pokemon}>
      <div className="relative min-h-[76px] w-full flex flex-col items-center justify-center">
        {isEditing ? (
          <form onSubmit={handleNicknameSubmit} className="flex flex-col items-center gap-2 w-full px-4">
            <TextInput
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Nuevo apodo"
              autoFocus
            />
            <div className="flex gap-2">
              <RegularButton type="submit" className="bg-green-600 hover:bg-green-700 text-sm py-1 px-3">Guardar</RegularButton>
              <RegularButton onClick={() => setIsEditing(false)} className="bg-gray-600 hover:bg-gray-700 text-sm py-1 px-3">Cancelar</RegularButton>
            </div>
            {error && <p className="text-poke-red text-xs mt-1">{error}</p>}
          </form>
        ) : (
          <>
            {pokemon.nickname ? (
              <p
                onClick={() => setIsEditing(true)}
                className="text-lg text-poke-light-text italic cursor-pointer hover:text-poke-yellow transition-colors"
                title="Haz clic para editar el apodo"
              >
                "{pokemon.nickname}"
              </p>
            ) : (
              <RegularButton onClick={() => setIsEditing(true)} className="text-sm py-1 px-3">Poner Apodo</RegularButton>
            )}
          </>
        )}
      </div>
    </SelectablePokemonCard>
  );
}

export default ManagedPokemonCard;