import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRandomPokemonService, postSavePokemonService, deletePokemonService, postRegisterHealUseService, postResetHealsService, postWinBattleService, getMyPokemonTeamService } from '../services/pokemonService';
import HealthBar from '../components/reutilizables/HealthBar';
import { useAuth } from '../context/AuthContext';
import { calculateTurnDetails } from '../utils/BattlePokemonUtils';
import RegularButton from '../components/reutilizables/RegularButton';
import { GiPotionBall } from 'react-icons/gi';

function BattlePokemon() {
  const { user, setUser } = useAuth();
  const [playerPokemon, setPlayerPokemon] = useState(null);
  const [opponentPokemon, setOpponentPokemon] = useState(null);
  const [playerCurrentHp, setPlayerCurrentHp] = useState(0);
  const [opponentCurrentHp, setOpponentCurrentHp] = useState(0);
  const [heals, setHeals] = useState(0);
  const [battleLog, setBattleLog] = useState('Esperando al oponente...');
  const [isBattleOver, setIsBattleOver] = useState(false);
  const [showHit, setShowHit] = useState({ player: false, opponent: false });
  const [battleResult, setBattleResult] = useState(null); // 'win' o 'lose'
  const [statIncreases, setStatIncreases] = useState(null);
  const [damageInfo, setDamageInfo] = useState({ player: null, opponent: null });
  const healsUsed = useRef(0);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Inicializamos las curaciones del usuario
  useEffect(() => {
    if (user) {
      setHeals(user.curas_restantes);
      healsUsed.current = 0;
    }
  }, [user, playerPokemon]); // Se reinicia si el usuario o el pokemon cambian

  useEffect(() => { // Preparar la batalla al cargar el componente
    const setupBattle = async () => {
      try {
        const [myTeam, opponent] = await Promise.all([
          getMyPokemonTeamService(),
          getRandomPokemonService(),
        ]);

        if (myTeam.length === 0) {
          setError('No tienes un equipo configurado. Redirigiendo...');
          setTimeout(() => navigate('/my-team'), 2000);
          return;
        }

        const leader = myTeam[0];
        setPlayerPokemon(leader);
        setPlayerCurrentHp(leader.hp);
        setOpponentPokemon(opponent);
        setOpponentCurrentHp(opponent.hp);
        setBattleLog('¡La batalla ha comenzado!');
      } catch (err) {
        setError('No se pudo preparar la batalla. ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    setupBattle();
  }, []);

  useEffect(() => { // Manejar el final de la batalla
    if (!isBattleOver) return;
    const handleEndBattle = async () => {
      try {
        if (battleResult === 'win') {
          const updatedUser = await postResetHealsService();
          const updatedPokemonStats = await postWinBattleService(playerPokemon.id);
          setStatIncreases({
            hp: updatedPokemonStats.hp - playerPokemon.hp,
            attack: updatedPokemonStats.attack - playerPokemon.attack,
            defense: updatedPokemonStats.defense - playerPokemon.defense,
            level: updatedPokemonStats.level
          });
          setUser({ ...user, curas_restantes: updatedUser.heals });
        } else if (battleResult === 'lose' && healsUsed.current > 0) {
          let finalUpdatedUser = null;
          const healRequests = Array(healsUsed.current).fill(null);
          for (const _ of healRequests) {
            finalUpdatedUser = await postRegisterHealUseService();
          }

          if (finalUpdatedUser) {
            setUser({ ...user, curas_restantes: finalUpdatedUser.heals_left });
          }
        }
      } catch (err) {
        console.error("Error al procesar el final de la batalla:", err);
      }
    };
    handleEndBattle();
  }, [isBattleOver, battleResult]); // Añadimos battleResult como dependencia


  useEffect(() => {  // Lógica del bucle de batalla
    if (!playerPokemon || !opponentPokemon || isBattleOver) return;

    const battleInterval = setInterval(() => {
      const {
        finalPlayerDamage,
        finalOpponentDamage,
        playerDamageBreakdown,
        opponentDamageBreakdown
      } = calculateTurnDetails(playerPokemon, opponentPokemon);

      // Actualizar estado para mostrar el daño y mensaje
      setDamageInfo({ player: playerDamageBreakdown, opponent: opponentDamageBreakdown });

      // Mostrar animación de golpe
      setShowHit({ player: true, opponent: true });
      setTimeout(() => {
        setShowHit({ player: false, opponent: false });
        setDamageInfo({ player: null, opponent: null }); // Ocultar números de daño
      }, 1000); // Aumentamos el tiempo para que se pueda leer el daño

      const newOpponentHp = Math.max(0, opponentCurrentHp - finalOpponentDamage);
      const newPlayerHp = Math.max(0, playerCurrentHp - finalPlayerDamage);

      setOpponentCurrentHp(newOpponentHp);
      setPlayerCurrentHp(newPlayerHp);
      setBattleLog(`¡${playerPokemon.name} y ${opponentPokemon.name} se atacan mutuamente!`);

      if (newPlayerHp === 0 || newOpponentHp === 0) {
        clearInterval(battleInterval);
        setIsBattleOver(true);
        if (newPlayerHp === 0) {
          setBattleResult('lose');
          setBattleLog(`¡${playerPokemon.nickname || playerPokemon.name} ha sido derrotado!`);
        } else {
          setBattleResult('win');
          setBattleLog(`¡Has ganado! ¡${opponentPokemon.name} ha sido derrotado!`);
        }
      }
    }, 2000); // Cada 2 segundos hay un turno

    return () => clearInterval(battleInterval);
  }, [playerPokemon, opponentPokemon, playerCurrentHp, opponentCurrentHp, isBattleOver]);

  const handleHeal = () => {
    const canHeal = (user.curas_restantes - healsUsed.current) > 0;

    if (canHeal && playerCurrentHp > 0 && !isBattleOver) {
      setPlayerCurrentHp(Math.min(playerPokemon.hp, playerCurrentHp + 50));
      setHeals(heals - 1);
      healsUsed.current += 1;
      setBattleLog(`¡Usaste una poción en ${playerPokemon.name}!`);
    }
  };

  const handleCapture = async () => {
    try {
      await postSavePokemonService(opponentPokemon.poke_id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message + " No puedes tener mas de 10 pokemones :c");
    }
  };

  const handleDefeat = async () => {
    try {
      await deletePokemonService(playerPokemon.id);
      navigate('/dashboard');
    } catch (err) {
      setError("Error al procesar la derrota. " + err.message);
    }
  };

  if (loading) return <p>Preparando la batalla...</p>;
  if (error) return <p className="text-poke-red">{error}</p>;
  if (!playerPokemon || !opponentPokemon) return <p>Cargando batalla...</p>; // Estado intermedio

  // Una vez que se elige un Pokémon, muestra la pantalla de batalla.
  return (
    <div
      className="bg-cover bg-center p-4 rounded-lg border-4 border-gray-900 shadow-2xl relative"
      style={{ backgroundImage: `url('https://fiverr-res.cloudinary.com/images/t_main1,q_auto,f_auto,q_auto,f_auto/v1/attachments/delivery/asset/0032398f86ea753194c5eeba97eccda2-1627249600/ExportBackgroundnomoveclound/draw-a-pixel-pokemon-battle-background.gif')` }}
    >
      {/* Modal de Fin de Batalla */}
      {isBattleOver && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-30">
          {battleResult === 'win' && (
            <>
              <h2 className="text-4xl font-bold text-poke-yellow mb-4">¡VICTORIA!</h2>
              {statIncreases && (
                <div className="text-white mb-4 p-3 bg-black bg-opacity-50 rounded-lg">
                  <h3 className="text-lg font-bold text-poke-yellow">¡Tu Pokémon se ha fortalecido!</h3>
                  {statIncreases.level > playerPokemon.level && (
                    <p className="text-xl text-green-400 font-bold animate-pulse">¡Subió al nivel {statIncreases.level}!</p>
                  )}
                  <p>HP: {playerPokemon.hp} + {statIncreases.hp}</p>
                  <p>Ataque: {playerPokemon.attack} + {statIncreases.attack}</p>
                  <p>Defensa: {playerPokemon.defense} + {statIncreases.defense}</p>
                </div>
              )}
              <p className="text-xl text-white mb-6">¿Quieres capturar a {opponentPokemon.name}?</p>
              <div className="flex gap-4">
                <RegularButton onClick={handleCapture} className="bg-green-600 hover:bg-green-700">Capturar</RegularButton>
                <RegularButton onClick={() => navigate('/dashboard')} className="bg-gray-600 hover:bg-gray-700">Dejarlo ir</RegularButton>
              </div>
            </>
          )}
          {battleResult === 'lose' && (
            <>
              <h2 className="text-4xl font-bold text-poke-red mb-4">DERROTA...</h2>
              <p className="text-xl text-white mb-6">Tu Pokémon, {playerPokemon.name}, ha sido derrotado y se ha ido.</p>
              <RegularButton onClick={handleDefeat}>Volver al Dashboard</RegularButton>
            </>
          )}
          {error && <p className="text-poke-red mt-4">{error}</p>}
        </div>
      )}

      {/* Contenedor para las animaciones de golpe */}
      {showHit.opponent && <img src="https://img.itch.zone/aW1nLzk3OTkzMDYuZ2lm/original/p78Kg1.gif" alt="hit" className="absolute top-20 left-1/2 ml-10 h-32 w-32 z-20" />}
      {showHit.player && <img src="https://img.itch.zone/aW1nLzk3OTkzMDYuZ2lm/original/p78Kg1.gif" alt="hit" className="absolute bottom-24 right-1/2 mr-10 h-32 w-32 z-20 transform -scale-x-100" />}

      {/* Indicadores de Daño */}
      {damageInfo.opponent && (
        <div className="absolute top-24 left-1/2 ml-16 text-4xl font-bold text-white flex items-center" style={{ textShadow: '2px 2px 4px #000000' }}>
          <span>-{damageInfo.opponent.base}</span>
          {damageInfo.opponent.extra !== 0 && (
            <span className={`ml-2 text-2xl ${damageInfo.opponent.extra > 0 ? 'text-green-400' : 'text-red-400'}`}>
              ({damageInfo.opponent.extra > 0 ? '+' : ''}{damageInfo.opponent.extra})
            </span>
          )}
        </div>
      )}
      {damageInfo.player && (
        <div className="absolute bottom-28 right-1/2 mr-16 text-4xl font-bold text-white flex items-center" style={{ textShadow: '2px 2px 4px #000000' }}>
          <span>-{damageInfo.player.base}</span>
          {damageInfo.player.extra !== 0 && (
            <span className={`ml-2 text-2xl ${damageInfo.player.extra > 0 ? 'text-green-400' : 'text-red-400'}`}>
              ({damageInfo.player.extra > 0 ? '+' : ''}{damageInfo.player.extra})
            </span>
          )}
        </div>
      )}

      <div className="flex justify-between items-end h-80 relative">
        {/* Sección del Jugador (Abajo a la izquierda) */}
        <div className="flex flex-col items-end w-1/2 pr-10">
          <img src={playerPokemon.back_sprite_url || playerPokemon.sprite_url} alt={playerPokemon.name} className="h-48 w-48" />
          <div className="bg-gray-200 p-2 rounded-lg border-4 border-gray-900 w-64 text-left -mt-8 ml-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">{playerPokemon.nickname || playerPokemon.name} LV{playerPokemon.level}</h3>
              <p className="text-gray-600 font-semibold"> HP</p>
            </div>
            <HealthBar currentHp={playerCurrentHp} maxHp={playerPokemon.hp} />
            <p className="text-right text-gray-800 font-bold mt-1">{playerCurrentHp}/{playerPokemon.hp}</p>
          </div>
        </div>

        {/* Sección del Oponente (Arriba a la derecha) */}
        <div className="flex flex-col items-start w-1/2 pl-10">
          <div className="bg-gray-200 p-2 rounded-lg border-4 border-gray-900 w-64 text-left mb-2 mr-auto ">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">{opponentPokemon.name} LV{opponentPokemon.level}</h3>
              <p className="text-gray-600 font-semibold">HP</p>
            </div>
            <HealthBar currentHp={opponentCurrentHp} maxHp={opponentPokemon.hp} />
            <p className="text-right text-gray-800 font-bold mt-1">{opponentCurrentHp}/{opponentPokemon.hp}</p>
          </div>
          <img src={opponentPokemon.sprite_url} alt={opponentPokemon.name} className="h-40 w-40" />
        </div>
      </div>

      {/* Panel de Acciones */}
      <div className="bg-gray-200 border-4 border-gray-900 rounded-lg mt-4 p-4 h-32 flex items-center">
        <div className="w-1/2 text-left text-gray-800 text-2xl font-bold">
          <p>{battleLog}</p>
        </div>
        <div className="w-1/2 grid grid-cols-2 gap-2">
          <RegularButton
            onClick={handleHeal}
            disabled={heals === 0 || isBattleOver || playerCurrentHp === 0 || playerCurrentHp === playerPokemon.hp}
            className="flex items-center justify-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            <GiPotionBall className="h-5 w-5" />
            Curar ({heals})
          </RegularButton>
          <RegularButton disabled={true} className="disabled:bg-gray-500">Huir</RegularButton>
        </div>
      </div>
    </div>
  );
}

export default BattlePokemon;