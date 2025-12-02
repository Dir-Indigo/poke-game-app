import djangoApi from "./djangoApi";

export const getUserPokemonsService = async () => {
  const res = await djangoApi.get("/pokemon/");
  return res.data;
};

export const getRandomPokemonService = async () => {
  const res = await djangoApi.get("/pokemon/random/");
  return res.data;
};

export const postSavePokemonService = async (poke_id, nickname = null) => {
  const res = await djangoApi.post("/pokemon/", { poke_id, nickname });
  return res.data;
};

export const patchUpdatePokemonNicknameService = async (pokemonId, nickname) => {
  const res = await djangoApi.patch(`/pokemon/${pokemonId}/nickname/`, {
    nickname,
  });
  return res.data;
};

export const deletePokemonService = async (pokemonId) => {
  await djangoApi.delete(`/pokemon/${pokemonId}/`);
};


export const postRegisterHealUseService = async () => {
  const res = await djangoApi.post("/players/use-heal/");
  return res.data;
};

export const postResetHealsService = async () => {
  const res = await djangoApi.post("/players/reset-heals/");
  return res.data;
};

export const postBattleResultService = async (pokemonId, result) => {
  const res = await djangoApi.post(`/pokemon/${pokemonId}/battle-result/`, {
    result,
  });
  return res.data;
};


export const getMyPokemonTeamService = async () => {
  const res = await djangoApi.get("/players/list-my-team/");
  return res.data;
};

export const postSetPokemonTeamService = async (teamIdList) => {
  const res = await djangoApi.post("/players/my-team/", {
    pokemon_ids: teamIdList,
  });
  return res.data;
};


export const getRandomOpponentsService = async () => {
  const res = await djangoApi.get("/pokemon/random-group/");
  return res.data.pokemons;
};


export const getMySummary = () =>
  djangoApi.get("/reports/player/");

export const getGlobalMostWins = () =>
  djangoApi.get("/reports/pokemon/top-wins/");

export const getGlobalMostUsed = () =>
  djangoApi.get("/reports/pokemon/top-used/");

export const getMyMostWins = () =>
  djangoApi.get("/reports/me/top-wins/");

export const getMyMostUsed = () =>
  djangoApi.get("/reports/me/top-used/");

export const getArcadeOpponentsService = async () => {
  const res = await djangoApi.get("/pokemon/arcade-match/");
  return res.data.pokemons;
};
