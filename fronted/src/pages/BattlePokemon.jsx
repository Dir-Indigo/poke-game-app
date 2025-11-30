import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRandomPokemonService, postSavePokemonService, deletePokemonService, postRegisterHealUseService, postResetHealsService, postWinBattleService, getMyPokemonTeamService } from '../services/pokemonService';
import HealthBar from '../components/reutilizables/HealthBar';
import { useAuth } from '../context/AuthContext';
import RegularButton from '../components/reutilizables/RegularButton';

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
  const [battleResult, setBattleResult] = useState(null);
  const [statIncreases, setStatIncreases] = useState(null);
  const [damageInfo, setDamageInfo] = useState({ player: null, opponent: null });

  const healsUsed = useRef(0);
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
        special2: Math.max(0, prev.special2 - 1)
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

  // END BATTLE
  useEffect(() => {
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
          for (let i = 0; i < healsUsed.current; i++) {
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

  }, [isBattleOver, battleResult]);

  // HEAL
  const handleHeal = () => {
    const canHeal = (user.curas_restantes - healsUsed.current) > 0;
    if (canHeal && playerCurrentHp > 0 && !isBattleOver) {
      setPlayerCurrentHp(Math.min(playerPokemon.hp, playerCurrentHp + 50));
      setHeals(heals - 1);
      healsUsed.current += 1;
      setBattleLog(`¡Usaste una poción en ${playerPokemon.name}!`);
    }
  };

  // ATTACK LOGIC
  const handleAttack = (type) => {
    if (isBattleOver) return;

    let power = 0;
    let name = "Ataque";

    if (type === "normal") {
      if (cooldown.normal > 0) return;
      power = playerPokemon.attack;
      name = "Ataque Normal";
      setCooldown(prev => ({ ...prev, normal: 1 }));
    }

    if (type === "special1") {
      if (cooldown.special1 > 0) return;
      power = playerPokemon.special1_power;
      name = playerPokemon.special1_name;
      setCooldown(prev => ({ ...prev, special1: 5 }));
    }

    if (type === "special2") {
      if (cooldown.special2 > 0) return;
      power = playerPokemon.special2_power;
      name = playerPokemon.special2_name;
      setCooldown(prev => ({ ...prev, special2: 8 }));
    }

    // DAMAGE TO OPPONENT
    const newOpponentHp = Math.max(0, opponentCurrentHp - power);
    setBattleLog(`¡${playerPokemon.name} usó ${name}!`);
    setOpponentCurrentHp(newOpponentHp);

    if (newOpponentHp === 0) {
      setIsBattleOver(true);
      setBattleResult("win");
      return;
    }

    // ENEMY COUNTER
    const enemyDamage = opponentPokemon.attack;
    const newPlayerHp = Math.max(0, playerCurrentHp - enemyDamage);

    setTimeout(() => {
      setBattleLog(`¡${opponentPokemon.name} contraatacó!`);
      setPlayerCurrentHp(newPlayerHp);

      if (newPlayerHp === 0) {
        setIsBattleOver(true);
        setBattleResult("lose");
      }
    }, 700);
  };

  const handleCapture = async () => {
    try {
      await postSavePokemonService(opponentPokemon.poke_id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message + " No puedes tener más de 10 pokemones :c");
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
  if (!playerPokemon || !opponentPokemon) return <p>Cargando batalla...</p>;

  return (
    <div
      className="
        bg-cover bg-center p-4 rounded-lg border-4 border-gray-900 shadow-2xl relative 
        max-w-3xl mx-auto             /* PC normal */
        md:max-w-2xl lg:max-w-3xl
        sm:p-3                        /* MOBILE FIX */
      "
      style={{
        backgroundImage: `url('https://fiverr-res.cloudinary.com/images/t_main1,q_auto,f_auto,q_auto,f_auto/v1/attachments/delivery/asset/0032398f86ea753194c5eeba97eccda2-1627249600/ExportBackgroundnomoveclound/draw-a-pixel-pokemon-battle-background.gif')`
      }}
    >

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
              <h2 className="text-3xl md:text-4xl font-bold text-poke-red mb-4">
                DERROTA...
              </h2>
              <p className="text-lg text-white mb-6">
                Tu Pokémon, {playerPokemon.name}, ha sido derrotado.
              </p>
              <RegularButton onClick={handleDefeat}>Volver al Dashboard</RegularButton>
            </>
          )}
        </div>
      )}

      {showHit.opponent && (
        <img src="https://img.itch.zone/aW1nLzk3OTkzMDYuZ2lm/original/p78Kg1.gif"
          className="absolute top-16 md:top-20 left-1/2 ml-6 md:ml-10 h-20 w-20 md:h-32 md:w-32 z-20" />
      )}

      {showHit.player && (
        <img src="https://img.itch.zone/aW1nLzk3OTkzMDYuZ2lm/original/p78Kg1.gif"
          className="absolute bottom-20 md:bottom-24 right-1/2 mr-6 md:mr-10 h-20 w-20 md:h-32 md:w-32 z-20 transform -scale-x-100" />
      )}

      <div className="flex justify-between items-end h-64 md:h-80 relative">

        <div className="flex flex-col items-end w-1/2 pr-4 md:pr-10">
          <img
            src={playerPokemon.back_sprite_url || playerPokemon.sprite_url}
            className="h-32 w-32 md:h-48 md:w-48" />

          <div className="bg-gray-200 p-2 rounded-lg border-4 border-gray-900 w-40 md:w-64 text-left -mt-6 md:-mt-8">
            <div className="flex justify-between items-center">
              <h3 className="text-sm md:text-lg font-bold text-gray-800">
                {playerPokemon.nickname || playerPokemon.name} LV{playerPokemon.level}
              </h3>
              <p className="text-gray-600 font-semibold">HP</p>
            </div>
            <HealthBar currentHp={playerCurrentHp} maxHp={playerPokemon.hp} />
            <p className="text-right text-gray-800 font-bold text-sm md:text-base">{playerCurrentHp}/{playerPokemon.hp}</p>
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
            <p className="text-right text-gray-800 font-bold text-sm md:text-base">{opponentCurrentHp}/{opponentPokemon.hp}</p>
          </div>

          <img src={opponentPokemon.sprite_url} className="h-24 w-24 md:h-40 md:w-40" />
        </div>

      </div>
      
      <div className=" bg-gray-200 border-4 border-gray-900 rounded-lg mt-4 p-3 md:p-4 flex flex-col justify-between max-w-full mx-auto">
        <p className="text-gray-800 text-lg md:text-2xl font-bold mb-3 text-center">
          {battleLog}
        </p>

        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 w-full max-w-xl mx-auto">

          <RegularButton
            onClick={() => handleAttack("normal")}
            disabled={cooldown.normal > 0 || isBattleOver}
            className="w-full"
          >
            Ataque Normal {cooldown.normal > 0 && `(${cooldown.normal}s)`}
          </RegularButton>

          <RegularButton
            onClick={() => handleAttack("special1")}
            disabled={cooldown.special1 > 0 || isBattleOver}
            className="w-full"
          >
            {playerPokemon.special1_name} {cooldown.special1 > 0 && `(${cooldown.special1}s)`}
          </RegularButton>

          <RegularButton
            onClick={() => handleAttack("special2")}
            disabled={cooldown.special2 > 0 || isBattleOver}
            className="w-full"
          >
            {playerPokemon.special2_name} {cooldown.special2 > 0 && `(${cooldown.special2}s)`}
          </RegularButton>

          <RegularButton
            onClick={handleHeal}
            disabled={heals === 0 || playerCurrentHp === playerPokemon.hp || isBattleOver}
            className="w-full"
          >
            Curar ({heals})
          </RegularButton>

        </div>
      </div>


    </div>
  );
}

export default BattlePokemon;
