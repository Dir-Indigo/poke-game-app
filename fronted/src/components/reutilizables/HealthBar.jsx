import React from 'react';

const HealthBar = ({ currentHp, maxHp }) => {
  // Aseguramos que el HP actual esté entre 0 y el máximo para evitar desbordamientos.
  const boundedHp = Math.max(0, Math.min(currentHp, maxHp));
  // Calculamos el porcentaje, evitando división por cero.
  const percentage = maxHp > 0 ? (boundedHp / maxHp) * 100 : 0;

  let barColor = 'bg-green-500';
  if (percentage < 50) {
    barColor = 'bg-yellow-500';
  }
  if (percentage < 20) {
    barColor = 'bg-red-500';
  }

  return (
    <div className="w-full bg-gray-700 rounded-full h-2.5 border border-black">
      <div className={`${barColor} h-full rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

export default HealthBar;