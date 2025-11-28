import { calculateTypeEffectiveness } from './typeEffectiveness';

export const calculateTurnDetails = (playerPokemon, opponentPokemon) => {
  // Cálculo de daño base
  const playerBaseDamage = Math.floor(Math.max(10, playerPokemon.attack / 5 + (Math.random() * 10 - 5)));
  const opponentBaseDamage = Math.floor(Math.max(10, opponentPokemon.attack / 5 + (Math.random() * 10 - 5)));

  // Cálculo de efectividad de tipos
  const playerEffectiveness = calculateTypeEffectiveness(opponentPokemon.types, playerPokemon.types);
  const opponentEffectiveness = calculateTypeEffectiveness(playerPokemon.types, opponentPokemon.types);

  // Cálculo de daño final
  const finalPlayerDamage = Math.floor(opponentBaseDamage * playerEffectiveness.multiplier);
  const finalOpponentDamage = Math.floor(playerBaseDamage * opponentEffectiveness.multiplier);

  // Desglose del daño para mostrar en la UI
  const opponentDamageBreakdown = {
    base: playerBaseDamage,
    extra: finalOpponentDamage - playerBaseDamage,
  };
  const playerDamageBreakdown = {
    base: opponentBaseDamage,
    extra: finalPlayerDamage - opponentBaseDamage,
  };

  return { finalPlayerDamage, finalOpponentDamage, playerDamageBreakdown, opponentDamageBreakdown };
};