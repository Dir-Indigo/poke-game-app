import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div>
      <h1>404 - Página no encontrada</h1>
      <p>¡Oh, no! Parece que te has perdido en la hierba alta.</p>
      <Link to="/dashboard">
        <button>Volver al Inicio</button>
      </Link>
    </div>
  );
}

export default NotFound;