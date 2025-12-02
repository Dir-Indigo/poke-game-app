import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserPokemonsService, getMyPokemonTeamService, postSetPokemonTeamService } from '../services/pokemonService';
import RegularButton from '../components/reutilizables/RegularButton';

function MyPokemonTeam() {
    const [userPokemons, setUserPokemons] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const getLevelColor = (level) => {
        if (level >= 40) return 'var(--level-S)';
        if (level >= 30) return 'var(--level-A)';
        if (level >= 20) return 'var(--level-B)';
        return 'var(--level-C)';
    };

    useEffect(() => {
    const loadTeamData = async () => {
        try {
        const [allPokemons, currentTeam] = await Promise.all([
            getUserPokemonsService(),
            getMyPokemonTeamService(),
        ]);

        if (allPokemons.length === 0) {
            setError('No tienes Pokémon. ¡Ve a capturar algunos antes de armar un equipo!');
            return;
        }

        setUserPokemons(allPokemons);
        setSelectedTeam(currentTeam);
        } catch (err) {
        setError('No se pudo cargar la información de tu equipo. ' + err.message);
        } finally {
        setLoading(false);
        }
    };

    loadTeamData();
    }, []);

    const handleSelectForTeam = (pokemon) => {
    setSelectedTeam(currentTeam => {
        if (currentTeam.find(p => p.id === pokemon.id)) {
        return currentTeam.filter(p => p.id !== pokemon.id);
        }
        if (currentTeam.length < 4) {
        return [...currentTeam, pokemon];
        }
        return currentTeam;
    });
    };

    const handleSetLeader = (pokemonToLead) => {
    setSelectedTeam(currentTeam => {
        const newTeam = currentTeam.filter(p => p.id !== pokemonToLead.id);
        newTeam.unshift(pokemonToLead);
        return newTeam;
    });
    };

    const handleConfirmTeam = async () => {
    const teamIds = selectedTeam.map(p => p.id);
    await postSetPokemonTeamService(teamIds);
    navigate('/battle');
    };

    if (loading) return <p>Cargando tu equipo...</p>;
    if (error) return <p className="text-poke-red">{error}</p>;

    return (
    <div>
        <h1 className="text-3xl font-bold mb-4">Configura tu Equipo de Batalla</h1>

        {/* Sección del Equipo Actual */}
        <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-3 text-poke-yellow">
            Tu Equipo ({selectedTeam.length}/4)
        </h2>
        <p className="text-m mb-3">
            El Pokémon <span className="font-bold text-poke-yellow-dark">Líder</span> luchará. Haz clic en otro miembro del equipo para cambiar el líder.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-900 p-4 rounded-lg min-h-[180px]">
            {selectedTeam.map((p, index) => (
            <div key={p.id} onClick={() => index > 0 ? handleSetLeader(p) : handleSelectForTeam(p)} 
            className={`relative bg-gray-800 p-4 rounded-lg cursor-pointer border-2 transition-all ${index === 0 ? 'border-4 border-poke-yellow-dark shadow-lg shadow-yellow-500/50' : 'border-poke-yellow'}`}>
                {index === 0 && <h2 className="absolute top-1 left-1 bg-poke-yellow-dark text-amber-400 text-xs font-bold px-2 py-1 rounded">LÍDER</h2>}
                {p.level && (
                    <div
                        className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-gray-900`}
                        style={{ backgroundColor: getLevelColor(p.level) }}
                        title={`Nivel ${p.level}`}
                    >
                        {p.level}
                    </div>
                )}
                <img src={p.sprite_url} alt={p.name} className="mx-auto h-24 w-24" />
                <p className="text-center font-bold text-poke-yellow mt-2">{p.name}</p>
                {p.nickname && <p className="text-center text-sm italic">"{p.nickname}"</p>}
            </div>
            ))}
        </div>
        </div>

        
        {/* Botón de Confirmación */}
        <div className="mt-2 text-center">
        <RegularButton onClick={handleConfirmTeam} disabled={selectedTeam.length === 0}>
            Guardar Equipo y Luchar
        </RegularButton>
        </div>

        {/* Sección de Pokémon Disponibles */}
        <div>
        <h2 className="mt-2 text-2xl font-semibold mb-3">Tus Pokémon Disponibles</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {userPokemons
            .filter(p => !selectedTeam.some(selected => selected.id === p.id))
            .map((p) => ( 
                <div key={p.id} onClick={() => handleSelectForTeam(p)} className="relative bg-gray-800 p-4 rounded-lg cursor-pointer border-2 border-transparent hover:border-poke-blue transition-all">
                {p.level && (
                    <div
                        className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-gray-900`}
                        style={{ backgroundColor: getLevelColor(p.level) }}
                        title={`Nivel ${p.level}`}
                    >
                        {p.level}
                    </div>
                )}
                <img src={p.sprite_url} alt={p.name} className="mx-auto h-24 w-24" />
                <p className="text-center font-bold text-poke-yellow mt-2">{p.name}</p>
                {p.nickname && <p className="text-center text-sm italic">"{p.nickname}"</p>}
                </div>
            ))
            }
        </div>
        </div>
    </div>
    );
    }

export default MyPokemonTeam;