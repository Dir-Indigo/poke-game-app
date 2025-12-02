import React, { useEffect, useState } from "react";
import {
  getPlayerReportsService,
  getGlobalReportsService,
  getTopPokemonsUsedService,
  getTopPokemonsWinsService,
  getTopPlayersWinsService,
  getTopPlayersUsedService,
} from "../services/reportService";

function ReportsPage() {
  // Player stats
  const [playerSummary, setPlayerSummary] = useState(null);
  const [playerMostUsed, setPlayerMostUsed] = useState([]);
  const [playerMostWins, setPlayerMostWins] = useState([]);

  // Global stats
  const [globalSummary, setGlobalSummary] = useState(null);
  const [globalMostUsed, setGlobalMostUsed] = useState([]);
  const [globalMostWins, setGlobalMostWins] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      try {
        const [
          player,
          global,
          usedPkm,
          winPkm,
          winPlayers,
          usePlayers,
        ] = await Promise.all([
          getPlayerReportsService(),
          getGlobalReportsService(),
          getTopPokemonsUsedService(),
          getTopPokemonsWinsService(),
          getTopPlayersWinsService(),
          getTopPlayersUsedService(),
        ]);

        // Player reports
        setPlayerSummary(player.player_stats);
        setPlayerMostUsed(
          player.top_pokemon_used ? [player.top_pokemon_used] : []
        );
        setPlayerMostWins(
          player.top_pokemon_winner ? [player.top_pokemon_winner] : []
        );

        // Global reports
        setGlobalSummary(global);
        setGlobalMostUsed(usedPkm.results || []);
        setGlobalMostWins(winPkm.results || []);
      } catch (err) {
        setError(err.message || "Error cargando reportes.");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  if (loading) return <p>Cargando reportes...</p>;
  if (error) return <p className="text-poke-red">{error}</p>;

  // ------------------------------------
  //   TABLE COMPONENT
  // ------------------------------------
  const Table = ({ title, columns, data }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-md">
      <h3 className="text-xl font-bold text-poke-yellow mb-3">{title}</h3>
      <table className="w-full text-left text-gray-200">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="py-2 border-b border-gray-700">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-2 text-center">
                Sin datos
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-700/40">
                {Object.values(row).map((cell, i) => (
                  <td key={i} className="py-2 border-b border-gray-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="text-white text-left">
      <h1 className="text-4xl font-bold mb-6 text-poke-yellow text-center">
        Reportes y Estadísticas
      </h1>

      {/* ============================ */}
      {/*   PLAYER SUMMARY             */}
      {/* ============================ */}
      <section className="mb-10">
        <h2 className="text-2xl mb-4 font-bold text-poke-blue">
          Tus estadísticas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg border border-gray-700">
            <h3 className="text-xl font-bold text-poke-yellow">Victorias</h3>
            <p className="text-3xl font-bold mt-2">{playerSummary?.wins}</p>
          </div>

          <div className="bg-gray-800 p-5 rounded-lg shadow-lg border border-gray-700">
            <h3 className="text-xl font-bold text-poke-yellow">Usos</h3>
            <p className="text-3xl font-bold mt-2">{playerSummary?.uses}</p>
          </div>

          <div className="bg-gray-800 p-5 rounded-lg shadow-lg border border-gray-700">
            <h3 className="text-xl font-bold text-poke-yellow">
              Total Pokémon
            </h3>
            <p className="text-3xl font-bold mt-2">
              {playerSummary?.total_pokemon}
            </p>
          </div>
        </div>
      </section>

      {/* ============================ */}
      {/*   GLOBAL SUMMARY             */}
      {/* ============================ */}
      <section className="mb-10">
        <h2 className="text-2xl mb-4 font-bold text-poke-blue">
          Estadísticas Globales
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg border border-gray-700">
            <h3 className="text-xl font-bold text-poke-yellow">
              Pokémon Totales
            </h3>
            <p className="text-3xl font-bold mt-2">
              {globalSummary?.global_total_pokemon}
            </p>
          </div>

          <div className="bg-gray-800 p-5 rounded-lg shadow-lg border border-gray-700">
            <h3 className="text-xl font-bold text-poke-yellow">
              Total Usos
            </h3>
            <p className="text-3xl font-bold mt-2">
              {globalSummary?.global_total_uses}
            </p>
          </div>

          <div className="bg-gray-800 p-5 rounded-lg shadow-lg border border-gray-700">
            <h3 className="text-xl font-bold text-poke-yellow">
              Total Victorias
            </h3>
            <p className="text-3xl font-bold mt-2">
              {globalSummary?.global_total_wins}
            </p>
          </div>
        </div>
      </section>

      {/* ============================ */}
      {/*   TOP POKÉMON                */}
      {/* ============================ */}
      <section className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Table
            title="Top Pokémon más usados"
            columns={["Pokémon", "Usos"]}
            data={globalMostUsed.map((p) => ({
              name: p.name,
              uses: p.uses,
            }))}
          />

          <Table
            title="Top Pokémon con más victorias"
            columns={["Pokémon", "Victorias"]}
            data={globalMostWins.map((p) => ({
              name: p.name,
              wins: p.wins,
            }))}
          />
        </div>
      </section>
    </div>
  );
}

export default ReportsPage;
