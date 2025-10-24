import React from 'react';

function TextInput({ className = '', ...props }) {
  const baseClasses =
    'w-full bg-gray-700 border-2 border-gray-600 rounded-md text-poke-light-text placeholder-gray-400 focus:outline-none focus:border-poke-yellow transition-all duration-300 ease-in-out focus:shadow-lg focus:shadow-poke-yellow/20';

  return (
    <input
      className={`${baseClasses} ${className}`}
      {...props}
    />
  );
}

export default TextInput;