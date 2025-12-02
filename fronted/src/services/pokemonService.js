import djangoApi from './djangoApi';

/* ============================================================
   OBTENER TODOS LOS POKÉMON DEL USUARIO
   ============================================================ */
export const getUserPokemonsService = async () => {
  try {
    const response = await djangoApi.get('/pokemon/');
    return response.data;
  } catch (error) {
    console.error("Error al obtener los Pokémon del usuario:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudieron cargar tus Pokémon.');
  }
};

/* ============================================================
   GENERAR POKÉMON ALEATORIO (1 VS 1)
   ============================================================ */
export const getRandomPokemonService = async () => {
  try {
    const response = await djangoApi.get('/pokemon/random/');
    return response.data;
  } catch (error) {
    console.error("Error al generar un Pokémon aleatorio:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo generar un Pokémon aleatorio.');
  }
};

/* ============================================================
   GENERAR GRUPO ALEATORIO (2–4 POKÉMON) - OPCIONAL
   ============================================================ */
export const getRandomGroupPokemonService = async () => {
  try {
    const response = await djangoApi.get('/pokemon/random-group/');
    return response.data;
  } catch (error) {
    console.error("Error al generar un grupo de Pokémon aleatorios:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo generar el grupo de Pokémon.');
  }
};

/* ============================================================
   GUARDAR POKÉMON CAPTURADO
   ============================================================ */
export const postSavePokemonService = async (poke_id) => {
  try {
    const response = await djangoApi.post('/pokemon/', { poke_id });
    return response.data;
  } catch (error) {
    console.error("Error al guardar el Pokémon:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo guardar el Pokémon.');
  }
};

/* ============================================================
   ACTUALIZAR NICKNAME
   ============================================================ */
export const patchUpdatePokemonNicknameService = async (pokemonId, nickname) => {
  try {
    const response = await djangoApi.patch(`/pokemon/${pokemonId}/nickname/`, { nickname });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar el apodo del Pokémon:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo actualizar el apodo.');
  }
};

/* ============================================================
   ELIMINAR POKÉMON (SIGUE SIRVIENDO PARA ADMIN)
   ============================================================ */
export const deletePokemonService = async (pokemonId) => {
  try {
    await djangoApi.delete(`/pokemon/${pokemonId}/`);
  } catch (error) {
    console.error("Error al eliminar el Pokémon:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo eliminar el Pokémon.');
  }
};

/* ============================================================
   CURACIONES (NO SE TOCAN)
   ============================================================ */
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

/* ============================================================
   RESULTADO DE BATALLA (NUEVO ENDPOINT OFICIAL)
   ============================================================ */
export const postBattleResultService = async (pokemonId, result) => {
  try {
    const response = await djangoApi.post(`/pokemon/${pokemonId}/battle-result/`, { result });
    return response.data;
  } catch (error) {
    console.error("Error al registrar resultado de batalla:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo registrar el resultado de batalla.');
  }
};

/* ============================================================
   OBTENER MI EQUIPO DE BATALLA
   ============================================================ */
export const getMyPokemonTeamService = async () => {
  try {
    const response = await djangoApi.get('/players/list-my-team/');
    return response.data;
  } catch (error) {
    console.error("Error al obtener el equipo del usuario:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo cargar tu equipo de Pokémon.');
  }
};

/* ============================================================
   DEFINIR MI EQUIPO (HASTA 4 POKÉMON)
   ============================================================ */
export const postSetPokemonTeamService = async (teamIdList) => {
  try {
    const response = await djangoApi.post('/players/my-team/', { pokemon_ids: teamIdList });
    return response.data;
  } catch (error) {
    console.error("Error al establecer equipo:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'No se pudo establecer tu equipo.');
  }
};
