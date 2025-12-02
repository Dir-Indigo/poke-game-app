
import React, { useEffect, useState } from 'react';
import {
  getGlobalMostWins,
  getGlobalMostUsed,
  getMySummary,
  getMyMostWins,
  getMyMostUsed
} from '../services/pokemonService';

import RegularButton from '../components/reutilizables/RegularButton';

// Tabla genérica reutilizable
function Table({ title, columns, data, emptyMessage }) {
  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 shadow-md">
      <h3 className="text-lg font-semibold text-yellow-300 mb-3 text-left">
        {title}
      </h3>
      {data.length === 0 ? (
        <p className="text-sm text-slate-300">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-600">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-2 py-1 font-semibold text-slate-200"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  // FIX: key siempre única aunque se repita el poke_id
                  key={`${row.id ?? row.poke_id ?? 'row'}-${idx}`}
                  className="border-b border-slate-700/60 hover:bg-slate-700/40"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-2 py-1 text-slate-100">
                      {col.render ? col.render(row, idx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function RankingPage() {
  const [loading, setLoading] = useState(true);
  const [globalMostWins, setGlobalMostWins] = useState([]);
  const [globalMostUsed, setGlobalMostUsed] = useState([]);

  const [mySummary, setMySummary] = useState(null);
  const [myMostWins, setMyMostWins] = useState([]);
  const [myMostUsed, setMyMostUsed] = useState([]);

  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [
          globalWinsRes,
          globalUsedRes,
          mySummaryRes,
          myMostWinsRes,
          myMostUsedRes,
        ] = await Promise.all([
          getGlobalMostWins(),
          getGlobalMostUsed(),
          getMySummary(),
          getMyMostWins(),
          getMyMostUsed(),
        ]);

        if (!isMounted) return;

        setGlobalMostWins(globalWinsRes.data.results || []);
        setGlobalMostUsed(globalUsedRes.data.results || []);

        setMySummary(mySummaryRes.data || null);
        setMyMostWins(myMostWinsRes.data.results || []);
        setMyMostUsed(myMostUsedRes.data.results || []);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError('No se pudieron cargar los rankings. Intenta nuevamente.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-slate-200 text-lg animate-pulse">
        Cargando ranking global...
      </p>
    );
  }

  if (error) {
    return <p className="text-red-400 text-lg">{error}</p>;
  }

  return (
    <div className="text-left space-y-8">

      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-300 drop-shadow">
          Ranking Global & Estadísticas
        </h1>
        <p className="text-slate-300 max-w-2xl">
          Consulta el top 10 de Pokémon más fuertes y más usados, y revisa tus
          estadísticas como entrenador en el modo Arcade.
        </p>
      </header>

      {/* Panel con stats personales + ranking personal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats personales */}
        <div className="lg:col-span-1 bg-slate-800/80 border border-slate-700 rounded-xl p-4 shadow-md">
          <h2 className="text-xl font-semibold text-emerald-300 mb-3">
            Tus estadísticas
          </h2>

          {mySummary ? (
            <div className="space-y-2 text-sm text-slate-200">
              <p>
                <span className="font-semibold">Total de Pokémon:</span>{' '}
                {mySummary.total_pokemon}
              </p>
              <p>
                <span className="font-semibold">Batallas jugadas:</span>{' '}
                {mySummary.total_uses}
              </p>
              <p>
                <span className="font-semibold">Victorias totales:</span>{' '}
                {mySummary.total_wins}
              </p>

              <div className="mt-4">
                <p className="font-semibold text-slate-100">
                  Pokémon más usado:
                </p>
                {mySummary.most_used?.name ? (
                  <p className="text-slate-300">
                    {mySummary.most_used.name} ({mySummary.most_used.uses} usos)
                  </p>
                ) : (
                  <p className="text-slate-400 text-xs">
                    Aún no tienes suficientes batallas.
                  </p>
                )}
              </div>

              <div className="mt-2">
                <p className="font-semibold text-slate-100">
                  Pokémon con más victorias:
                </p>
                {mySummary.most_wins?.name ? (
                  <p className="text-slate-300">
                    {mySummary.most_wins.name} ({mySummary.most_wins.wins}{' '}
                    victorias)
                  </p>
                ) : (
                  <p className="text-slate-400 text-xs">
                    Juega algunas batallas para ver tus mejores Pokémon.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-slate-300 text-sm">
              Aún no hay estadísticas para mostrar.
            </p>
          )}

          <div className="mt-4">
            <RegularButton className="w-full text-sm bg-poke-blue hover:bg-poke-yellow">
              Seguir jugando
            </RegularButton>
          </div>
        </div>

        {/* Ranking personal (por Pokémon) */}
        <div className="lg:col-span-2 space-y-4">
          <Table
            title="Tu ranking - Pokémon con más victorias"
            emptyMessage="Aún no tienes Pokémon con victorias registradas."
            columns={[
              {
                key: 'pos',
                label: '#',
                render: (_, idx) => idx + 1,
              },
              {
                key: 'name',
                label: 'Pokémon',
                render: (row) =>
                  row.nickname ? `${row.nickname} (${row.name})` : row.name,
              },
              { key: 'wins', label: 'Victorias' },
              { key: 'uses', label: 'Usos' },
            ]}
            data={myMostWins}
          />

          <Table
            title="Tu ranking - Pokémon más usados"
            emptyMessage="Aún no tienes Pokémon usados en combate."
            columns={[
              {
                key: 'pos',
                label: '#',
                render: (_, idx) => idx + 1,
              },
              {
                key: 'name',
                label: 'Pokémon',
                render: (row) =>
                  row.nickname ? `${row.nickname} (${row.name})` : row.name,
              },
              { key: 'uses', label: 'Usos' },
              { key: 'wins', label: 'Victorias' },
            ]}
            data={myMostUsed}
          />
        </div>
      </div>

      {/* Rankings globales */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Table
          title="Top 10 global - Pokémon con más victorias"
          emptyMessage="No hay datos globales aún."
          columns={[
            {
              key: 'pos',
              label: '#',
              render: (_, idx) => idx + 1,
            },
            {
              key: 'name',
              label: 'Pokémon',
              render: (row) =>
                row.nickname ? `${row.nickname} (${row.name})` : row.name,
            },
            { key: 'player', label: 'Jugador' },
            { key: 'wins', label: 'Victorias' },
            { key: 'uses', label: 'Usos' },
          ]}
          data={globalMostWins}
        />

        <Table
          title="Top 10 global - Pokémon más usados"
          emptyMessage="No hay datos globales aún."
          columns={[
            {
              key: 'pos',
              label: '#',
              render: (_, idx) => idx + 1,
            },
            {
              key: 'name',
              label: 'Pokémon',
              render: (row) =>
                row.nickname ? `${row.nickname} (${row.name})` : row.name,
            },
            { key: 'player', label: 'Jugador' },
            { key: 'uses', label: 'Usos' },
            { key: 'wins', label: 'Victorias' },
          ]}
          data={globalMostUsed}
        />
      </section>
    </div>
  );
}
