import React from 'react';

function RegularButton({ children, onClick, className = '', type = 'button', ...props }) {
  // Clases base para un estilo consistente
  const baseClasses =
    'py-2 px-4 bg-poke-yellow text-poke-dark-blue font-bold rounded-md shadow-md hover:bg-yellow-400 transition-all';

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default RegularButton;