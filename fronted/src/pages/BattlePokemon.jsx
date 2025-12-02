import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {postSavePokemonService, deletePokemonService, postRegisterHealUseService, 
  postResetHealsService, postWinBattleService, getMyPokemonTeamService, getRandomOpponentsService } 
from '../services/pokemonService';
import HealthBar from '../components/reutilizables/HealthBar';
import { useAuth } from '../context/AuthContext';
import RegularButton from '../components/reutilizables/RegularButton';
import { calculateTurnDetails } from '../utils/BattlePokemonUtils';
import { initTeam, getActive, applyDamageToActive, switchActive, findNextAliveIndexAfter, isAllFainted } from '../utils/battleTeamLogic';

function BattlePokemon() {
  const { user, setUser } = useAuth();

  const [playerTeam, setPlayerTeam] = useState(null);
  const [opponentTeam, setOpponentTeam] = useState(null);

  const [heals, setHeals] = useState(0);
  const [battleLog, setBattleLog] = useState('Esperando al oponente...');
  const [isBattleOver, setIsBattleOver] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [statIncreases, setStatIncreases] = useState(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [mustSwitch, setMustSwitch] = useState(false);
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

  // TIMER COOLDOWN
  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown(prev => ({
        normal: Math.max(0, prev.normal - 1),
        special1: Math.max(0, prev.special1 - 1),
        special2: Math.max(0, prev.special2 - 1),
      }));
    }, 700);

    return () => clearInterval(timer);
  }, []);

  // HEALS INIT
  useEffect(() => {
    if (user) {
      setHeals(user.curas_restantes);
      healsUsed.current = 0;
    }
  }, [user]);

  // LOAD BATTLE
  useEffect(() => {
    const setupBattle = async () => {
      hasProcessedEnd.current = false;

      try {
        const [myTeamArray, opponentArray] = await Promise.all([
          getMyPokemonTeamService(),
          getRandomOpponentsService(),
        ]);

        if (myTeamArray.length === 0) {
          setError('No tienes un equipo configurado. Redirigiendo...');
          setTimeout(() => navigate('/my-team'), 2000);
          return;
        }

        const pTeam = initTeam(myTeamArray.slice(0, 4));
        const oTeam = initTeam(opponentArray.slice(0, 4));

        setPlayerTeam(pTeam);
        setOpponentTeam(oTeam);
        console.log("--- BATALLA INICIADA ---", { playerTeam: pTeam, opponentTeam: oTeam });
        setBattleLog('¡La batalla ha comenzado!');
      } catch (err) {
        setError('No se pudo preparar la batalla. ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    setupBattle();
  }, []);

  const playerPokemon = getActive(playerTeam);
  const opponentPokemon = getActive(opponentTeam);

  const playerCurrentHp = playerPokemon?.currentHp ?? 0;
  const opponentCurrentHp = opponentPokemon?.currentHp ?? 0;

  // END BATTLE HANDLER
  useEffect(() => {
    if (!isBattleOver) return;
    if (hasProcessedEnd.current) return;

    hasProcessedEnd.current = true;

    const handleEndBattle = async () => {
      try {
        if (battleResult === 'win') {
          const updatedUser = await postResetHealsService();
          const updatedPokemonStats = await postWinBattleService(playerPokemon.id);

          setStatIncreases({
            hp: updatedPokemonStats.hp - playerPokemon.hp,
            attack: updatedPokemonStats.attack - playerPokemon.attack,
            defense: updatedPokemonStats.defense - playerPokemon.defense,
            level: updatedPokemonStats.level,
          });

          setUser({
            ...user,
            curas_restantes: updatedUser.heals,
          });
        } else if (battleResult === 'lose' && healsUsed.current > 0) {
          let finalUpdatedUser = null;

          for (let i = 0; i < healsUsed.current; i++) {
            finalUpdatedUser = await postRegisterHealUseService();
          }

          if (finalUpdatedUser) {
            setUser({
              ...user,
              curas_restantes: finalUpdatedUser.heals_left,
            });
          }
        }
      } catch (err) {
        console.error('Error al procesar la batalla:', err);
      }
    };

    handleEndBattle();
  }, [isBattleOver, battleResult, playerPokemon, user, setUser]);

  // HEAL
  const handleHeal = () => {
    if (!user || !playerPokemon || isBattleOver || isSwitching) return;

    const canHeal = heals > 0;
    if (canHeal && playerCurrentHp > 0 && !isBattleOver) {
      const healAmount = Math.round(playerPokemon.hp * 0.20);
      const healedHp = Math.min(playerPokemon.hp, playerCurrentHp + healAmount);
      
      // Actualizamos el HP del Pokémon activo de forma segura
      const updatedMembers = playerTeam.members.map((member, index) => {
        if (index === playerTeam.activeIndex) {
          return { ...member, currentHp: healedHp };
        }
        return member;
      });
      const healedTeam = { ...playerTeam, members: updatedMembers };

      setPlayerTeam(healedTeam);
      setHeals(prev => prev - 1);
      healsUsed.current += 1;
      setBattleLog(`¡Usaste una poción en ${playerPokemon.name}!`);
      setTimeout(() => {
        opponentTurn(healedTeam, opponentTeam);
      }, 700);
    }
  };

  const handleAttack = (type) => {
    if (isBattleOver || !playerPokemon || !opponentPokemon || isSwitching) return;

    let power = playerPokemon.attack;
    let name = 'Ataque';

    if (type === 'normal') {
      if (cooldown.normal > 0) return;
      setCooldown(prev => ({ ...prev, normal: 1 }));
      name = 'Ataque Normal';
    }

    if (type === 'special1') {
      if (cooldown.special1 > 0) return;
      power = playerPokemon.special1_power || playerPokemon.attack * 1.2;
      name = playerPokemon.special1_name || 'Ataque Especial 1';
      setCooldown(prev => ({ ...prev, special1: 5 }));
    }

    if (type === 'special2') {
      if (cooldown.special2 > 0) return;
      power = playerPokemon.special2_power || playerPokemon.attack * 1.5;
      name = playerPokemon.special2_name || 'Ataque Especial 2';
      setCooldown(prev => ({ ...prev, special2: 8 }));
    }

    const playerForDamage = { ...playerPokemon, attack: power };

    const {
      finalPlayerDamage,
      finalOpponentDamage,
      playerDamageBreakdown,
      opponentDamageBreakdown,
    } = calculateTurnDetails(playerForDamage, opponentPokemon);

    setDamageInfo({
      player: playerDamageBreakdown,
      opponent: opponentDamageBreakdown,
    });
    setShowHit(prev => ({ ...prev, opponent: true }));

    setTimeout(() => {
      setShowHit(prev => ({ ...prev, opponent: false }));
    }, 900);

    console.log(`[JUGADOR] ${playerPokemon.name} usa ${name}. Daño: ${finalOpponentDamage}`);
    setBattleLog(`¡${playerPokemon.nickname || playerPokemon.name} usó ${name}!`);

    const [newOpponentTeam, opponentFainted] = applyDamageToActive(opponentTeam, finalOpponentDamage);
    setOpponentTeam(newOpponentTeam);

    if (opponentFainted) {
      console.log(`[EVENTO] ${opponentPokemon.name} del oponente fue derrotado.`);
      setBattleLog(`¡${playerPokemon.nickname || playerPokemon.name} derrotó a ${opponentPokemon.name}!`);

      if (isAllFainted(newOpponentTeam)) {
        console.log("[FIN] Victoria para el jugador.");
        setIsBattleOver(true);
        setBattleResult('win');
        return;
      } else {
        const nextOppIndex = findNextAliveIndexAfter(newOpponentTeam);
        const switchedOpponentTeam = switchActive(newOpponentTeam, nextOppIndex);
        const nextOpponent = getActive(switchedOpponentTeam);
        console.log(`[OPONENTE] Oponente cambia a ${nextOpponent.name}.`);
        setTimeout(() => {
          setOpponentTeam(switchedOpponentTeam);
          setBattleLog(`¡El oponente envía a ${nextOpponent.name}!`);
        }, 1500);
      }
    } else {
      // Usamos un callback para asegurar que opponentTurn se ejecute con el estado más reciente
      setTimeout(() => {
        // Pasamos el nuevo estado del oponente, pero obtenemos el estado más reciente del jugador
        setPlayerTeam(currentPTeam => { opponentTurn(currentPTeam, newOpponentTeam); return currentPTeam; });
      }, 700);
    }
  };

  const opponentTurn = (currentPlayerTeam, currentOpponentTeam) => {
    if (isBattleOver) return;

    const playerActive = getActive(currentPlayerTeam);
    const opponentActive = getActive(currentOpponentTeam);

    // Comprobación de seguridad para evitar errores si un Pokémon no está activo
    if (!playerActive || !opponentActive) {
      console.error("Turno del oponente omitido: no se encontró un Pokémon activo.");
      return;
    }

    const { finalPlayerDamage, playerDamageBreakdown } = calculateTurnDetails(playerActive, opponentActive);

    setDamageInfo(prev => ({ ...prev, player: playerDamageBreakdown }));
    setShowHit(prev => ({ ...prev, player: true }));

    setTimeout(() => {
      setShowHit(prev => ({ ...prev, player: false }));
      // Limpiamos la información de daño después de que ambas animaciones (jugador y oponente) hayan tenido tiempo de desaparecer.
      setTimeout(() => setDamageInfo({ player: null, opponent: null }), 500);
    }, 900);
    
    console.log(`[OPONENTE] ${opponentActive.name} contraataca. Daño: ${finalPlayerDamage}`);
    setBattleLog(`¡${opponentActive.name} contraatacó!`);

    const [newPlayerTeam, playerFainted] = applyDamageToActive(currentPlayerTeam, finalPlayerDamage);
    setPlayerTeam(newPlayerTeam);

    if (playerFainted) {
      console.log(`[EVENTO] ${playerActive.name} del jugador fue derrotado.`);
      if (isAllFainted(newPlayerTeam)) {
        console.log("[FIN] Derrota para el jugador.");
        setIsBattleOver(true);
        setBattleResult('lose');
      } else {
        setBattleLog(`Tu ${playerActive.nickname || playerActive.name} fue derrotado. ¡Elige tu siguiente Pokémon!`);
        setMustSwitch(true);
        setIsSwitching(true);
      }
    }
  };

  const handleSwitchPokemon = (newIndex) => {
    if (newIndex === playerTeam.activeIndex) {
      setIsSwitching(false);
      return;
    }

    const switchedTeam = switchActive(playerTeam, newIndex);
    setPlayerTeam(switchedTeam);
    const newActive = getActive(switchedTeam);
    console.log(`[JUGADOR] Jugador cambia a ${newActive.name}.`);

    setIsSwitching(false);
    const wasForced = mustSwitch;
    setMustSwitch(false);

    if (!wasForced) {
      setBattleLog(`¡Adelante, ${newActive.nickname || newActive.name}!`);
      setTimeout(() => opponentTurn(switchedTeam, opponentTeam), 700);
    }
  };

  const handleCapture = async (pokeId) => {
    try {
      await postSavePokemonService(pokeId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message + ' No puedes tener más de 10 pokemones :c');
    }
  };

  const handleDefeat = async () => {
    try {
      const defeatedPokemons = playerTeam.members.filter(p => p.currentHp === 0);
      for (const p of defeatedPokemons) {
        await deletePokemonService(p.id);
      }
      navigate('/dashboard');
    } catch (err) {
      setError('Error al procesar la derrota. ' + err.message);
    }
  };

  if (loading) return <p>Preparando la batalla...</p>;
  if (error) return <p className="text-poke-red">{error}</p>;
  if (!playerPokemon || !opponentPokemon) return <p>Cargando batalla...</p>;

  return (
    <div
      className="bg-cover bg-center p-6 rounded-2xl border-4 border-gray-900 shadow-2xl relative mx-auto w-full max-w-[1100px] min-h-[550px] flex flex-col justify-between"
      style={{
        backgroundImage: `url('https://fiverr-res.cloudinary.com/images/t_main1,q_auto,f_auto,q_auto,f_auto/v1/attachments/delivery/asset/0032398f86ea753194c5eeba97eccda2-1627249600/ExportBackgroundnomoveclound/draw-a-pixel-pokemon-battle-background.gif')`
      }}
    >
      {/* Indicador de Estado de Equipos */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-full max-w-xs md:max-w-sm mx-auto p-1 flex justify-between z-10 bg-black bg-opacity-20 rounded-full">
        {/* Equipo del Jugador */}
        <div className="flex gap-1">
          {playerTeam?.members.map(p => (
            <div key={`player-status-${p.id}`} className="bg-blue-900 bg-opacity-50 p-1 rounded-full border-2 border-blue-500">
              <img
                src={p.sprite_url}
                alt={p.name}
                className={`h-8 w-8 transition-all duration-500 ${p.currentHp <= 0 ? 'filter grayscale brightness-0' : ''}`}
                title={`${p.nickname || p.name} - HP: ${p.currentHp}/${p.hp}`}
              />
            </div>
          ))}
        </div>

        {/* Equipo del Oponente */}
        <div className="flex flex-row-reverse gap-1">
          {opponentTeam?.members?.map((p, index) => (
            <div key={`opponent-status-${p.id || index}`} className="bg-red-900 bg-opacity-50 p-1 rounded-full border-2 border-red-500">
              <img
                src={p?.sprite_url}
                alt={p.name}
                className={`h-8 w-8 transition-all duration-500 ${p.currentHp <= 0 ? 'filter grayscale brightness-0' : ''}`}
                title={`${p.name} - HP: ${p.currentHp}/${p.hp}`}
              />
            </div>
          ))}
        </div>
      </div>

      {isBattleOver && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-30 p-4 text-center">
          {battleResult === 'win' ? (
            <>
              <h2 className="text-3xl md:text-4xl font-bold text-poke-yellow mb-4">
                ¡VICTORIA!
              </h2>

              {statIncreases && (
                <div className="text-white mb-4 p-3 bg-black bg-opacity-50 rounded-lg text-sm md:text-base">
                  <h3 className="font-bold text-poke-yellow">¡Tu Pokémon se fortaleció!</h3>
                  {statIncreases.level > playerPokemon.level && (
                    <p className="text-lg text-green-400 font-bold animate-pulse">
                      ¡Subió al nivel {statIncreases.level}!
                    </p>
                  )}
                  <p>HP: {playerPokemon.hp} + {statIncreases.hp}</p>
                  <p>Ataque: {playerPokemon.attack} + {statIncreases.attack}</p>
                  <p>Defensa: {playerPokemon.defense} + {statIncreases.defense}</p>
                </div>
              )}

              <p className="text-lg text-white mb-4">
                ¡Elige un Pokémon rival para capturarlo!
              </p>

              <div className="justify-items-center grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

                {opponentTeam.members.map((p) => (
                  <div
                    key={`capture-${p.id}`}
                    onClick={() => handleCapture(p.poke_id)}
                    className="bg-gray-800 p-4 rounded-lg border-2 border-poke-blue hover:border-poke-yellow-dark hover:scale-105 transition-transform cursor-pointer w-fit mx-auto"

                  >
                    <img src={p.sprite_url} alt={p.name} className="mx-auto h-20 w-20" />
                    <p className="text-center font-bold text-poke-yellow mt-2">{p.name}</p>
                    <p className="text-center text-xs">Nivel {p.level}</p>
                  </div>
                ))}
              </div>

              <RegularButton onClick={() => navigate('/dashboard')} className="bg-gray-600 hover:bg-gray-700">
                No capturar y volver
              </RegularButton>
            </>
          ) : (
            <>
              <h2 className="text-3xl md:text-4xl font-bold text-poke-red mb-4">
                DERROTA...
              </h2>
              <p className="text-lg text-white mb-6">
                Tu Pokémon, {playerPokemon.name}, ha sido derrotado.
              </p>
              <RegularButton onClick={handleDefeat}>Volver al Dashboard</RegularButton>
            </>
          )}
          {error && <p className="text-poke-red mt-4">{error}</p>}
        </div>
      )}

      {isSwitching && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-40 p-4">
          <h2 className="text-2xl font-bold text-white mb-4">
            {mustSwitch ? "Tu Pokémon se debilitó. ¡Elige el siguiente!" : "¿Cambiar Pokémon?"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {playerTeam.members.map((p, index) => {
              const isFainted = p.currentHp <= 0;
              const isActive = index === playerTeam.activeIndex;
              return (
                <div
                  key={p.id}
                  onClick={() => !isFainted && !isActive && handleSwitchPokemon(index)}
                  className={`relative bg-gray-800 p-4 rounded-lg border-2 ${isFainted ? 'border-gray-600 opacity-50' : 'border-poke-blue hover:border-poke-yellow cursor-pointer'} ${isActive ? 'border-poke-yellow-dark' : ''}`}
                >
                  {isFainted && <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center text-red-500 font-bold">DEBILITADO</div>}
                  <img src={p.sprite_url} alt={p.name} className="mx-auto h-20 w-20" />
                  <p className="text-center font-bold text-poke-yellow mt-2">{p.nickname || p.name}</p>
                  <HealthBar currentHp={p.currentHp} maxHp={p.hp} />
                  <p className="text-center text-xs">{p.currentHp}/{p.hp}</p>
                </div>
              );
            })}
          </div>
          {!mustSwitch && (
            <RegularButton onClick={() => setIsSwitching(false)} className="mt-4 bg-red-600 hover:bg-red-700">
              Cancelar
            </RegularButton>
          )}
        </div>
      )}


      {showHit.opponent && (
        <img
          src="https://img.itch.zone/aW1nLzk3OTkzMDYuZ2lm/original/p78Kg1.gif"
          alt="Golpe"
          className="absolute top-32 md:top-36 left-1/2 ml-6 md:ml-10 h-20 w-20 md:h-32 md:w-32 z-20"
        />
      )}

      {showHit.player && (
        <img
          src="https://img.itch.zone/aW1nLzk3OTkzMDYuZ2lm/original/p78Kg1.gif"
          alt="Golpe"
          className="absolute bottom-50 md:bottom-80 right-1/2 mr-6 md:mr-10 h-20 w-20 md:h-32 md:w-32 z-20 transform -scale-x-100"
        />
      )}

      {damageInfo.opponent && (
        <div
          className="absolute bottom-50 md:bottom-80 left-1/2 ml-8 md:ml-16 text-2xl md:text-4xl font-bold text-white flex items-center z-20"
          style={{ textShadow: '2px 2px 4px #000000'}}
        >
          <span>-{damageInfo.opponent.base}</span>
          {damageInfo.opponent.extra !== 0 && (
            <span className={`ml-2 text-xl md:text-2xl ${damageInfo.opponent.extra > 0 ? 'text-green-400' : 'text-red-400'}`}>
              ({damageInfo.opponent.extra > 0 ? '+' : ''}{damageInfo.opponent.extra})
            </span>
          )}
        </div>
      )}

      {damageInfo.player && (
        <div
          className="absolute bottom-50 md:bottom-80 right-1/2 mr-8 md:mr-16 text-2xl md:text-4xl font-bold text-white flex items-center z-20"
          style={{ textShadow: '2px 2px 4px #000000'}}
        >
          <span>-{damageInfo.player.base}</span>
          {damageInfo.player.extra !== 0 && (
            <span className={`ml-2 text-xl md:text-2xl ${damageInfo.player.extra > 0 ? 'text-green-400' : 'text-red-400'}`}>
              ({damageInfo.player.extra > 0 ? '+' : ''}{damageInfo.player.extra})
            </span>
          )}
        </div>
      )}

      <div className="flex justify-between items-end h-64 md:h-80 relative">

        <div className="flex flex-col items-end w-1/2 pr-4 md:pr-10">
          <img
            src={playerPokemon.back_sprite_url || playerPokemon.sprite_url}
            alt={playerPokemon.name}
            className="h-32 w-32 md:h-48 md:w-48"
          />

          <div className="bg-gray-200 p-2 rounded-lg border-4 border-gray-900 w-40 md:w-64 text-left -mt-6 md:-mt-8">
            <div className="flex justify-between items-center">
              <h3 className="text-sm md:text-lg font-bold text-gray-800">
                {playerPokemon.nickname || playerPokemon.name} LV{playerPokemon.level}
              </h3>
              <p className="text-gray-600 font-semibold">HP</p>
            </div>
            <HealthBar currentHp={playerCurrentHp} maxHp={playerPokemon.hp} />
            <p className="text-right text-gray-800 font-bold text-xs md:text-base">
              {playerCurrentHp}/{playerPokemon.hp}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start w-1/2 pl-4 md:pl-10">
          <div className="bg-gray-200 p-2 rounded-lg border-4 border-gray-900 w-40 md:w-64 text-left mb-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm md:text-lg font-bold text-gray-800">
                {opponentPokemon.name} LV{opponentPokemon.level}
              </h3>
              <p className="text-gray-600 font-semibold">HP</p>
            </div>
            <HealthBar currentHp={opponentCurrentHp} maxHp={opponentPokemon.hp} />
            <p className="text-right text-gray-800 font-bold text-xs md:text-base">
              {opponentCurrentHp}/{opponentPokemon.hp}
            </p>
          </div>

          <img
            src={opponentPokemon.sprite_url}
            alt={opponentPokemon.name}
            className="h-24 w-24 md:h-40 md:w-40"
          />
        </div>

      </div>

      <div
        className="bg-gray-200 border-4 border-gray-900 rounded-lg mt-4 p-3 md:p-4 flex flex-col gap-3"
      >
        <p className="text-gray-800 text-lg md:text-2xl font-bold text-center">
          {battleLog}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-[700px] mx-auto text-xs md:text-base">
          <RegularButton
            onClick={() => handleAttack('normal')}
            disabled={cooldown.normal > 0 || isBattleOver || isSwitching}
            className="flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.632 2.58a1 1 0 00-1.264 0l-7 8a1 1 0 00.632 1.783h14a1 1 0 00.632-1.783l-7-8zM10 13a1 1 0 100 2h.01a1 1 0 100-2H10z" clipRule="evenodd" />
            </svg>
            Ataque {cooldown.normal > 0 && `(${cooldown.normal}s)`}
          </RegularButton>

          <RegularButton
            onClick={() => handleAttack('special1')}
            disabled={cooldown.special1 > 0 || isBattleOver || isSwitching}
            className="flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {playerPokemon.special1_name || 'Ataque Especial 1'} {cooldown.special1 > 0 && `(${cooldown.special1}s)`}
          </RegularButton>

          <RegularButton
            onClick={() => handleAttack('special2')}
            disabled={cooldown.special2 > 0 || isBattleOver || isSwitching}
            className="flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {playerPokemon.special2_name || 'Ataque Especial 2'} {cooldown.special2 > 0 && `(${cooldown.special2}s)`}
          </RegularButton>

          <RegularButton
            onClick={handleHeal}
            disabled={heals === 0 || playerCurrentHp === playerPokemon.hp || isBattleOver || isSwitching}
            className="flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Curar ({heals})
          </RegularButton>

          <RegularButton
            onClick={() => setIsSwitching(true)}
            disabled={isBattleOver || isSwitching || playerTeam.members.filter(p => p.currentHp > 0).length <= 1}
            className="flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Cambiar Pokémon
          </RegularButton>
        </div>
      </div>
    </div>
  );
}

export default BattlePokemon;
