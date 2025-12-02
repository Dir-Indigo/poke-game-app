import djangoApi from "./djangoApi";

// Función auxiliar
const handle = async (fn, msg) => {
  try {
    const res = await fn();
    return res.data;
  } catch (err) {
    console.error(msg, err.response?.data || err.message);
    throw new Error(err.response?.data?.detail || msg);
  }
};

export const getPlayerReportsService = () =>
  handle(
    () => djangoApi.get("/reports/player/"),
    "Error al obtener reportes del jugador."
  );

export const getGlobalReportsService = () =>
  handle(
    () => djangoApi.get("/reports/global/"),
    "Error al obtener reportes globales."
  );

export const getTopPokemonsUsedService = () =>
  handle(
    () => djangoApi.get("/reports/pokemon/top-used/"),
    "Error al obtener Pokémon más usados."
  );

export const getTopPokemonsWinsService = () =>
  handle(
    () => djangoApi.get("/reports/pokemon/top-wins/"),
    "Error al obtener Pokémon con más victorias."
  );


export const getTopPlayersWinsService = () =>
  handle(
    () => djangoApi.get("/reports/players/top-wins/"),
    "Error al obtener ranking de jugadores con más victorias."
  );

export const getTopPlayersUsedService = () =>
  handle(
    () => djangoApi.get("/reports/players/top-used/"),
    "Error al obtener jugadores más activos."
  );
