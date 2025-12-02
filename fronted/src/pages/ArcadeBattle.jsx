import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  getMyPokemonTeamService,
  getArcadeOpponentsService,
  postBattleResultService,
} from "../services/pokemonService";

import {
  initTeam,
  getActive,
  applyDamageToActive,
  isAllFainted,
  findNextAliveIndexAfter,
  switchActive
} from "../utils/battleTeamLogic";

import RegularButton from "../components/reutilizables/RegularButton";
import HealthBar from "../components/reutilizables/HealthBar";

export default function ArcadeBattle() {
  const navigate = useNavigate();

  const [playerTeam, setPlayerTeam] = useState(null);
  const [opponentTeam, setOpponentTeam] = useState(null);
  const [battleLog, setBattleLog] = useState("Preparando batalla...");
  const [isBattleOver, setIsBattleOver] = useState(false);
  const [battleResult, setBattleResult] = useState(null);

  const endProcessed = useRef(false); // <-- evita que el efecto final ejecute más de una vez

  // 🔹 1. Cargar equipos una sola vez
  useEffect(() => {
    const setup = async () => {
      try {
        const myTeam = await getMyPokemonTeamService();
        const enemies = await getArcadeOpponentsService();

        const pTeam = initTeam(myTeam.slice(0, 4));
        const oTeam = initTeam(enemies.slice(0, 4));

        setPlayerTeam(pTeam);
        setOpponentTeam(oTeam);
        setBattleLog("¡Batalla Arcade Iniciada!");
      } catch (err) {
        console.error(err);
        setBattleLog("Error cargando la batalla");
      }
    };

    setup();
  }, []);

  // 🔹 2. Finalizar batalla (hook siempre en el mismo orden)
  useEffect(() => {
    if (!isBattleOver) return;
    if (endProcessed.current) return;
    endProcessed.current = true;

    const player = getActive(playerTeam);
    if (!player || !battleResult) return;

    postBattleResultService(player.id, battleResult)
      .catch(() => console.error("Error registrando resultado de batalla"));
  }, [isBattleOver, battleResult, playerTeam]);

  if (!playerTeam || !opponentTeam) return <p>Cargando...</p>;

  const player = getActive(playerTeam);
  const enemy = getActive(opponentTeam);

  // 🔹 3. ATAQUE JUGADOR
  const handleAttack = () => {
    const damage = Math.floor(player.attack * 1.1);
    const [newOppTeam, fainted] = applyDamageToActive(opponentTeam, damage);

    setOpponentTeam(newOppTeam);
    setBattleLog(`¡${player.name} atacó!`);

    if (fainted) {
      if (isAllFainted(newOppTeam)) {
        setIsBattleOver(true);
        setBattleResult("win");
      } else {
        const idx = findNextAliveIndexAfter(newOppTeam);
        setOpponentTeam(switchActive(newOppTeam, idx));
      }
    } else {
      enemyAttack(newOppTeam);
    }
  };

  // 🔹 4. ATAQUE ENEMIGO
  const enemyAttack = (currentOppTeam) => {
    const damage = Math.floor(enemy.attack * 1.1);
    const [newPTeam, fainted] = applyDamageToActive(playerTeam, damage);

    setPlayerTeam(newPTeam);
    setBattleLog(`¡${enemy.name} contraatacó!`);

    if (fainted) {
      if (isAllFainted(newPTeam)) {
        setIsBattleOver(true);
        setBattleResult("lose");
      } else {
        const idx = findNextAliveIndexAfter(newPTeam);
        setPlayerTeam(switchActive(newPTeam, idx));
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-yellow-300 text-3xl mb-4">Modo Arcade</h1>
      <p className="text-white mb-4">{battleLog}</p>

      <div className="flex justify-between">
        <div>
          <h2 className="text-white font-bold">{player.name}</h2>
          <HealthBar currentHp={player.currentHp} maxHp={player.hp} />
        </div>

        <div>
          <h2 className="text-red-400 font-bold">{enemy.name}</h2>
          <HealthBar currentHp={enemy.currentHp} maxHp={enemy.hp} />
        </div>
      </div>

      <div className="mt-6">
        {!isBattleOver ? (
          <RegularButton onClick={handleAttack}>
            Atacar
          </RegularButton>
        ) : (
          <RegularButton onClick={() => navigate("/dashboard")}>
            Volver al Dashboard
          </RegularButton>
        )}
      </div>
    </div>
  );
}
