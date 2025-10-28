import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserPokemonsService, getRandomPokemonService, savePokemonService, deletePokemonService, registerHealUseService, resetHealsService } from '../services/pokemonService';
import HealthBar from '../components/reutilizables/HealthBar';
import { useAuth } from '../context/AuthContext';
import { calculateTypeEffectiveness } from '../utils/typeEffectiveness';
import RegularButton from '../components/reutilizables/RegularButton';
import { GiPotionBall } from 'react-icons/gi';

function BattlePokemon() {
  const { user, setUser } = useAuth();
  const [userPokemons, setUserPokemons] = useState([]);
  const [playerPokemon, setPlayerPokemon] = useState(null);
  const [opponentPokemon, setOpponentPokemon] = useState(null);
  const [playerCurrentHp, setPlayerCurrentHp] = useState(0);
  const [opponentCurrentHp, setOpponentCurrentHp] = useState(0);
  const [heals, setHeals] = useState(0);
  const [battleLog, setBattleLog] = useState('Esperando al oponente...');
  const [isBattleOver, setIsBattleOver] = useState(false);
  const [showHit, setShowHit] = useState({ player: false, opponent: false });
  const [battleResult, setBattleResult] = useState(null); // 'win' o 'lose'
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
        const [pokemons, opponent] = await Promise.all([
          getUserPokemonsService(),
          getRandomPokemonService(),
        ]);

        if (pokemons.length === 0) {
          setError('No tienes Pokémon para luchar. ¡Ve a capturar algunos!');
          return;
        }

        setUserPokemons(pokemons);
        setOpponentPokemon(opponent);
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
          const updatedUser = await resetHealsService();
          setUser({ ...user, curas_restantes: updatedUser.heals });
        } else if (battleResult === 'lose' && healsUsed.current > 0) {
          let finalUpdatedUser = null;
          const healRequests = Array(healsUsed.current).fill(null);
          for (const _ of healRequests) {
            finalUpdatedUser = await registerHealUseService();
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
      console.log("--- Turno ---");
      console.log("Jugador:", playerPokemon);
      console.log("Oponente:", opponentPokemon);
      // Cálculo de daño base
      const playerBaseDamage = Math.floor(Math.max(10, playerPokemon.attack / 5 + (Math.random() * 10 - 5)));
      const opponentBaseDamage = Math.floor(Math.max(10, opponentPokemon.attack / 5 + (Math.random() * 10 - 5)));
      
      // Cálculo de efectividad de tipos
      const playerEffectiveness = calculateTypeEffectiveness(opponentPokemon.types, playerPokemon.types);
      const opponentEffectiveness = calculateTypeEffectiveness(playerPokemon.types, opponentPokemon.types);

      // Cálculo de daño final
      const finalPlayerDamage = Math.floor(opponentBaseDamage * playerEffectiveness.multiplier);
      const finalOpponentDamage = Math.floor(playerBaseDamage * opponentEffectiveness.multiplier);

      // Desglose del daño para mostrar en la UI
      const opponentDamageBreakdown = {
        base: playerBaseDamage,
        extra: finalOpponentDamage - playerBaseDamage,
      };
      const playerDamageBreakdown = {
        base: opponentBaseDamage,
        extra: finalPlayerDamage - opponentBaseDamage,
      };

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

  const handleSelectPokemon = (pokemon) => {
    setPlayerPokemon(pokemon);
    setPlayerCurrentHp(pokemon.hp);
    setOpponentCurrentHp(opponentPokemon.hp);
    setBattleLog('¡La batalla ha comenzado!');
  };

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
      await savePokemonService(opponentPokemon.poke_id);
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

  // Si el jugador aún no ha elegido un Pokémon, muestra la pantalla de selección.
  if (!playerPokemon) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Elige tu luchador</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {userPokemons.map((p) => (
            <div key={p.id} onClick={() => handleSelectPokemon(p)} className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:border-poke-yellow border-2 border-transparent transition-all">
              <img src={p.sprite_url} alt={p.name} className="mx-auto h-24 w-24" />
              <p className="text-center font-bold text-poke-yellow mt-2">{p.name}</p>
              {p.nickname && <p className="text-center text-sm italic">"{p.nickname}"</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

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
              <h3 className="text-lg font-bold text-gray-800">{playerPokemon.nickname || playerPokemon.name}</h3>
              <p className="text-gray-600 font-semibold">HP</p>
            </div>
            <HealthBar currentHp={playerCurrentHp} maxHp={playerPokemon.hp} />
            <p className="text-right text-gray-800 font-bold mt-1">{playerCurrentHp}/{playerPokemon.hp}</p>
          </div>
        </div>

        {/* Sección del Oponente (Arriba a la derecha) */}
        <div className="flex flex-col items-start w-1/2 pl-10">
          <div className="bg-gray-200 p-2 rounded-lg border-4 border-gray-900 w-64 text-left mb-2 mr-auto ">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">{opponentPokemon.name}</h3>
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