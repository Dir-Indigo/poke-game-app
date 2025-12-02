
export const initTeam = (pokemons = []) => {
  return {
    members: pokemons.map(p => ({ ...p, currentHp: p.hp })),
    activeIndex: 0,
  };
};

export const getActive = (team) => {
  if (!team || !team.members || team.members.length === 0) return null;
  return team.members[team.activeIndex];
};

export const applyDamageToActive = (team, damage) => {
  const members = team.members.map((m, i) => {
    if (i !== team.activeIndex) return m;
    return { ...m, currentHp: Math.max(0, (m.currentHp ?? m.hp) - damage) };
  });
  const fainted = members[team.activeIndex].currentHp === 0;
  return [{ ...team, members }, fainted];
};

export const switchActive = (team, newIndex) => {
  if (!team || newIndex < 0 || newIndex >= team.members.length) return team;
  if (team.members[newIndex].currentHp <= 0) return team; // no puede entrar si está KO
  return { ...team, activeIndex: newIndex };
};

export const findNextAliveIndexAfter = (team, exceptIndex = -1) => {
  for (let i = 0; i < team.members.length; i++) {
    if (i === exceptIndex) continue;
    if ((team.members[i].currentHp ?? team.members[i].hp) > 0) return i;
  }
  return -1;
};

export const isAllFainted = (team) => {
  return team.members.every(m => (m.currentHp ?? m.hp) <= 0);
};