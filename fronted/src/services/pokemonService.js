import djangoApi from './djangoApi';

/**
 * Obtiene la lista de Pokémon del usuario autenticado.
 * @returns {Promise<Array>} Una lista de los Pokémon del usuario.
 */
export const getUserPokemonsService = async () => {
  try {
    const response = await djangoApi.get('/pokemon/');
    return response.data;
  } catch (error) {
    console.error("Error al obtener los Pokémon del usuario:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudieron cargar tus Pokémon.');
  }
};

/**
 * Obtiene un Pokémon aleatorio y lo asigna al usuario.
 * @returns {Promise<Object>} El Pokémon aleatorio generado.
 */
export const getRandomPokemon = async () => {
  try {
    const response = await djangoApi.get('/pokemon/random/');
    return response.data;
  } catch (error) {
    console.error("Error al generar un Pokémon aleatorio:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo generar un Pokémon aleatorio.');
  }
};

/**
 * Guarda un nuevo Pokémon para el usuario con un apodo.
 * @param {number} poke_id - El ID del Pokémon de la Pokédex.
 * @returns {Promise<Object>} El Pokémon guardado.
 */
export const savePokemon = async (poke_id) => {
  try {
    const response = await djangoApi.post('/pokemon/', { poke_id });
    return response.data;
  } catch (error) {
    console.error("Error al guardar el Pokémon:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo guardar el Pokémon.');
  }
};

/**
 * Actualiza el apodo de un Pokémon específico.
 * @param {number} pokemonId - El ID del Pokémon del usuario.
 * @param {string} nickname - El nuevo apodo para el Pokémon.
 * @returns {Promise<Object>} El Pokémon con el apodo actualizado.
 */
export const updatePokemonNickname = async (pokemonId, nickname) => {
  try {
    const response = await djangoApi.patch(`/pokemon/${pokemonId}/nickname/`, { nickname });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar el apodo del Pokémon:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo actualizar el apodo.');
  }
};

/**
 * Elimina un Pokémon del equipo del usuario.
 * @param {number} pokemonId - El ID del Pokémon a eliminar.
 * @returns {Promise<void>}
 */
export const deletePokemon = async (pokemonId) => {
  try {
    await djangoApi.delete(`/pokemon/${pokemonId}/`);
  } catch (error) {
    console.error("Error al eliminar el Pokémon:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo eliminar el Pokémon.');
  }
};

/**
 * Registra el uso de curaciones para el jugador.
 * (Asume que el backend decrementa 1 cura por llamada, sin necesidad de un parámetro 'count' en el payload)
 * @returns {Promise<Object>} La información actualizada del jugador.
 */
export const registerHealUse = async () => {
  try {
    // Enviamos un objeto vacío para cumplir con el Content-Type: application/json que Axios envía por defecto.
    const response = await djangoApi.post('/players/use-heal/', {});
    return response.data;
  } catch (error) {
    console.error("Error al registrar el uso de curaciones:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo actualizar el número de curaciones.');
  }
};