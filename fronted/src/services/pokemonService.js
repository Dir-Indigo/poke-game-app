import djangoApi from './djangoApi';

export const getUserPokemonsService = async () => {
  try {
    const response = await djangoApi.get('/pokemon/');
    return response.data;
  } catch (error) {
    console.error("Error al obtener los Pokémon del usuario:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudieron cargar tus Pokémon.');
  }
};

export const getRandomPokemonService = async () => {
  try {
    const response = await djangoApi.get('/pokemon/random/');
    return response.data;
  } catch (error) {
    console.error("Error al generar un Pokémon aleatorio:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo generar un Pokémon aleatorio.');
  }
};

export const postSavePokemonService = async (poke_id) => {
  try {
    const response = await djangoApi.post('/pokemon/', { poke_id });
    return response.data;
  } catch (error) {
    console.error("Error al guardar el Pokémon:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo guardar el Pokémon.');
  }
};

export const patchUpdatePokemonNicknameService = async (pokemonId, nickname) => {
  try {
    const response = await djangoApi.patch(`/pokemon/${pokemonId}/nickname/`, { nickname });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar el apodo del Pokémon:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo actualizar el apodo.');
  }
};

export const deletePokemonService = async (pokemonId) => {
  try {
    await djangoApi.delete(`/pokemon/${pokemonId}/`);
  } catch (error) {
    console.error("Error al eliminar el Pokémon:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo eliminar el Pokémon.');
  }
};

export const postRegisterHealUseService = async () => {
  try {
    const response = await djangoApi.post('/players/use-heal/', {});
    return response.data;
  } catch (error) {
    console.error("Error al registrar el uso de curaciones:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo actualizar el número de curaciones.');
  }
};

export const postResetHealsService = async () => {
  try {
    const response = await djangoApi.post('/players/reset-heals/', {});
    return response.data;
  } catch (error) {
    console.error("Error al resetear el uso de curaciones:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo actualizar el número de curaciones.');
  }
};

export const postWinBattleService = async (pokemonId) => {
  try {
  const response = await djangoApi.post(`/pokemon/${pokemonId}/win/`, {});
  return response.data;
  } catch (error) {
    console.error("Error al registrar la victoria en batalla:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo registrar la victoria en batalla.');
  }
};
