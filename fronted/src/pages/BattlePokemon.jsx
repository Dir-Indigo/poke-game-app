import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getRandomGroupPokemonService,
  postSavePokemonService,
  postBattleResultService,
  postRegisterHealUseService,
  postResetHealsService,
  getMyPokemonTeamService
} from '../services/pokemonService';

import HealthBar from '../components/reutilizables/HealthBar';
import { useAuth } from '../context/AuthContext';
import RegularButton from '../components/reutilizables/RegularButton';
import { calculateTurnDetails } from '../utils/BattlePokemonUtils';

function BattlePokemon() {
  const { user, setUser } = useAuth();

  const [playerPokemon, setPlayerPokemon] = useState(null);
  const [opponentPokemon, setOpponentPokemon] = useState(null);

  const [playerCurrentHp, setPlayerCurrentHp] = useState(0);
  const [opponentCurrentHp, setOpponentCurrentHp] = useState(0);

  const [heals, setHeals] = useState(0);
  const [battleLog, setBattleLog] = useState('Esperando al oponente...');
  const [isBattleOver, setIsBattleOver] = useState(false);
  const [battleResult, setBattleResult] = useState(null);

  const [damageInfo, setDamageInfo] = useState({ player: null, opponent: null });
  const [showHit, setShowHit] = useState({ player: false, opponent: false });

  const healsUsed = useRef(0);
  const hasProcessedEnd = useRef(false);

  const navigate = useNavigate();

  const [cooldown, setCooldown] = useState({
    normal: 0,
    special1: 0,
    special2: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // TIMER
  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown(prev => ({
        normal: Math.max(0, prev.normal - 1),
        special1: Math.max(0, prev.special1 - 1),
        special2: Math.max(0, prev.special2 - 1),
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // HEALS INIT
  useEffect(() => {
    if (user) {
      setHeals(user.curas_restantes);
      healsUsed.current = 0;
    }
  }, [user, playerPokemon]);

  // LOAD BATTLE
  useEffect(() => {
    const setupBattle = async () => {
      hasProcessedEnd.current = false;

      try {
        const [myTeam, group] = await Promise.all([
          getMyPokemonTeamService(),
          getRandomGroupPokemonService(),
        ]);

        if (myTeam.length === 0) {
          setError('No tienes un equipo configurado. Redirigiendo...');
          setTimeout(() => navigate('/my-team'), 2000);
          return;
        }

        const leader = myTeam[0];
        setPlayerPokemon(leader);
        setPlayerCurrentHp(leader.hp);

        const enemy = group.pokemons[0];
        setOpponentPokemon(enemy);
        setOpponentCurrentHp(enemy.hp);

        setBattleLog('¡La batalla ha comenzado!');
      } catch (err) {
        console.error(err);
        setError('No se pudo preparar la batalla.');
      } finally {
        setLoading(false);
      }
    };

    setupBattle();
  }, [navigate]);

  // END BATTLE HANDLER
  useEffect(() => {
    if (!isBattleOver || hasProcessedEnd.current) return;

    hasProcessedEnd.current = true;

    const endBattleLogic = async () => {
      try {
        if (battleResult === 'win') {
          const updatedUser = await postResetHealsService();
          await postBattleResultService(playerPokemon.id, "win");

          setUser({
            ...user,
            curas_restantes: updatedUser.heals,
          });

        } else if (battleResult === 'lose') {
          await postBattleResultService(playerPokemon.id, "lose");

          if (healsUsed.current > 0) {
            let updatedUser = null;

            for (let i = 0; i < healsUsed.current; i++) {
              updatedUser = await postRegisterHealUseService();
            }

            if (updatedUser) {
              setUser({
                ...user,
                curas_restantes: updatedUser.heals_left,
              });
            }
          }
        }
      } catch (err) {
        console.error("Error en manejo final de batalla:", err);
      }
    };

    endBattleLogic();

  }, [isBattleOver, battleResult, playerPokemon, user, setUser]);

  // HEAL
  const handleHeal = () => {
    if (!user || !playerPokemon) return;

    const canHeal = user.curas_restantes - healsUsed.current > 0;

    if (canHeal && playerCurrentHp > 0 && !isBattleOver) {
      setPlayerCurrentHp(prev => Math.min(playerPokemon.hp, prev + 50));
      setHeals(prev => prev - 1);
      healsUsed.current += 1;
      setBattleLog(`¡Usaste una poción en ${playerPokemon.name}!`);
    }
  };

  // ATTACK
  const handleAttack = (type) => {
    if (isBattleOver || !playerPokemon || !opponentPokemon) return;

    let power = playerPokemon.attack;
    let name = 'Ataque';

    if (type === 'normal') {
      if (cooldown.normal > 0) return;
      name = 'Ataque Normal';
      setCooldown(prev => ({ ...prev, normal: 1 }));
    }

    if (type === 'special1') {
      if (cooldown.special1 > 0) return;
      power = playerPokemon.special1_power || power * 1.2;
      name = playerPokemon.special1_name;
      setCooldown(prev => ({ ...prev, special1: 5 }));
    }

    if (type === 'special2') {
      if (cooldown.special2 > 0) return;
      power = playerPokemon.special2_power || power * 1.5;
      name = playerPokemon.special2_name;
      setCooldown(prev => ({ ...prev, special2: 8 }));
    }

    const playerForDamage = { ...playerPokemon, attack: power };

    const {
      finalPlayerDamage,
      finalOpponentDamage,
      playerDamageBreakdown,
      opponentDamageBreakdown
    } = calculateTurnDetails(playerForDamage, opponentPokemon);

    setDamageInfo({
      player: playerDamageBreakdown,
      opponent: opponentDamageBreakdown,
    });

    setShowHit({ player: true, opponent: true });

    setTimeout(() => {
      setShowHit({ player: false, opponent: false });
      setDamageInfo({ player: null, opponent: null });
    }, 900);

    const newEnemyHp = Math.max(0, opponentCurrentHp - finalOpponentDamage);
    const newPlayerHp = Math.max(0, playerCurrentHp - finalPlayerDamage);

    setOpponentCurrentHp(newEnemyHp);

    if (newEnemyHp === 0) {
      setIsBattleOver(true);
      setBattleResult("win");
      setBattleLog(`¡${playerPokemon.name} derrotó a ${opponentPokemon.name} con ${name}!`);
      return;
    }

    setBattleLog(`¡${playerPokemon.name} usó ${name}!`);

    setTimeout(() => {
      if (isBattleOver) return;

      setPlayerCurrentHp(newPlayerHp);

      if (newPlayerHp === 0) {
        setIsBattleOver(true);
        setBattleResult("lose");
        setBattleLog(`¡${opponentPokemon.name} contraatacó y derrotó a tu Pokémon!`);
      } else {
        setBattleLog(`¡${opponentPokemon.name} contraatacó!`);
      }
    }, 700);
  };

  // CAPTURE
  const handleCapture = async () => {
    try {
      await postSavePokemonService(opponentPokemon.poke_id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || "No puedes tener más de 10 pokémon.");
    }
  };

  if (loading) return <p>Preparando la batalla...</p>;
  if (error) return <p className="text-poke-red">{error}</p>;
  if (!playerPokemon || !opponentPokemon) return <p>Cargando batalla...</p>;

  // UI FINAL
  return (
    <div
      className="bg-cover bg-center p-6 rounded-2xl border-4 border-gray-900 shadow-2xl relative mx-auto w-full max-w-[1100px] min-h-[550px] flex flex-col justify-between"
      style={{
        backgroundImage: `url('https://fiverr-res.cloudinary.com/images/t_main1,q_auto,f_auto,q_auto,f_auto/v1/attachments/delivery/asset/0032398f86ea753194c5eeba97eccda2-1627249600/ExportBackgroundnomoveclound/draw-a-pixel-pokemon-battle-background.gif')`
      }}
    >

      {isBattleOver && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-30 p-4 text-center">

          {battleResult === 'win' ? (
            <>
              <h2 className="text-4xl font-bold text-poke-yellow mb-4">¡VICTORIA!</h2>

              <p className="text-lg text-white mb-6">
                ¿Quieres capturar a {opponentPokemon.name}?
              </p>

              <div className="flex gap-4">
                <RegularButton onClick={handleCapture} className="bg-green-600 hover:bg-green-700">
                  Capturar
                </RegularButton>

                <RegularButton onClick={() => navigate('/dashboard')} className="bg-gray-600 hover:bg-gray-700">
                  Dejarlo ir
                </RegularButton>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-bold text-poke-red mb-4">DERROTA...</h2>

              <p className="text-lg text-white mb-6">
                Tu Pokémon {playerPokemon.name} ha sido derrotado.
              </p>

              <RegularButton onClick={() => navigate('/dashboard')}>
                Volver al Dashboard
              </RegularButton>
            </>
          )}

          {error && <p className="text-poke-red mt-4">{error}</p>}
        </div>
      )}

      {/* Animación de golpes */}
      {showHit.opponent && (
        <img
          src="https://img.itch.zone/aW1nLzk3OTkzMDYuZ2lm/original/p78Kg1.gif"
          alt="Golpe"
          className="absolute top-16 left-1/2 ml-10 h-28 w-28 z-20"
        />
      )}
      {showHit.player && (
        <img
          src="https://img.itch.zone/aW1nLzk3OTkzMDYuZ2lm/original/p78Kg1.gif"
          alt="Golpe"
          className="absolute bottom-24 right-1/2 mr-10 h-28 w-28 z-20 transform -scale-x-100"
        />
      )}

      {/* Daños */}
      {damageInfo.opponent && (
        <div className="absolute top-24 left-1/2 ml-16 text-3xl font-bold text-white">
          -{damageInfo.opponent.base}
        </div>
      )}

      {damageInfo.player && (
        <div className="absolute bottom-28 right-1/2 mr-16 text-3xl font-bold text-white">
          -{damageInfo.player.base}
        </div>
      )}

      {/* Pokémon */}
      <div className="flex justify-between items-end h-80 relative">

        {/* PLAYER */}
        <div className="flex flex-col items-end w-1/2 pr-10">
          <img
            src={playerPokemon.back_sprite_url || playerPokemon.sprite_url}
            alt={playerPokemon.name}
            className="h-40 w-40"
          />

          <div className="bg-gray-200 text-black p-2 rounded-lg border-4 border-gray-900 w-64 text-left -mt-8">
            <div className="flex justify-between">
              <h3 className="font-bold text-black">
                {playerPokemon.name} LV{playerPokemon.level}
              </h3>
              <p className="text-black">HP</p>
            </div>

            <HealthBar currentHp={playerCurrentHp} maxHp={playerPokemon.hp} />

            <p className="text-right font-bold text-black">
              {playerCurrentHp}/{playerPokemon.hp}
            </p>
          </div>
        </div>

        {/* OPPONENT */}
        <div className="flex flex-col items-start w-1/2 pl-10">
          <div className="bg-gray-200 text-black p-2 rounded-lg border-4 border-gray-900 w-64 text-left mb-2">
            <div className="flex justify-between">
              <h3 className="font-bold text-black">
                {opponentPokemon.name} LV{opponentPokemon.level}
              </h3>
              <p className="text-black">HP</p>
            </div>

            <HealthBar currentHp={opponentCurrentHp} maxHp={opponentPokemon.hp} />

            <p className="text-right font-bold text-black">
              {opponentCurrentHp}/{opponentPokemon.hp}
            </p>
          </div>

          <img
            src={opponentPokemon.sprite_url}
            alt={opponentPokemon.name}
            className="h-40 w-40"
          />
        </div>
      </div>

      {/* BOTONES */}
      <div className="bg-gray-200 border-4 border-gray-900 rounded-lg mt-4 p-4">
        <p className="text-center text-2xl font-bold mb-3 text-black">{battleLog}</p>

        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          <RegularButton
            onClick={() => handleAttack('normal')}
            disabled={cooldown.normal > 0 || isBattleOver}
          >
            Ataque Normal {cooldown.normal > 0 && `(${cooldown.normal}s)`}
          </RegularButton>

          <RegularButton
            onClick={() => handleAttack('special1')}
            disabled={cooldown.special1 > 0 || isBattleOver}
          >
            {playerPokemon.special1_name} {cooldown.special1 > 0 && `(${cooldown.special1}s)`}
          </RegularButton>

          <RegularButton
            onClick={() => handleAttack('special2')}
            disabled={cooldown.special2 > 0 || isBattleOver}
          >
            {playerPokemon.special2_name} {cooldown.special2 > 0 && `(${cooldown.special2}s)`}
          </RegularButton>

          <RegularButton
            onClick={handleHeal}
            disabled={heals === 0 || playerCurrentHp === playerPokemon.hp || isBattleOver}
          >
            Curar ({heals})
          </RegularButton>
        </div>
      </div>

    </div>
  );
}

export default BattlePokemon;
