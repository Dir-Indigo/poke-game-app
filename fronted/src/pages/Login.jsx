import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login, register } from '../services/authService'; // Importamos el servicio de autenticación
import TextInput from '../components/reutilizables/TextInput';

function Login() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLoginView) {
        const loggedInUser = await login(username, password);
        console.log('Login exitoso, datos recibidos:', loggedInUser);
        const userData = {
          ...loggedInUser,
          curas_restantes: loggedInUser.heals,
        };
        setUser(userData);
        navigate('/dashboard');
      } else {
        if (password.length < 8) {
          setError('La contraseña debe tener letras, numeros y al menos 8 caracteres.');
          return;
        }
        await register(username, password);
        alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
        setIsLoginView(true);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h1>{isLoginView ? 'Iniciar Sesión' : 'Crear Cuenta'}</h1>
      <p>
        {isLoginView
          ? '¡Bienvenido de nuevo, entrenador!'
          : '¡Prepárate para tu aventura!'}
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4 items-center">
        <TextInput
          type="text"
          placeholder="Nombre de usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="p-3"
        />
        <TextInput
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-3"
        />
        {error && <p className="text-poke-red">{error}</p>}
        <button type="submit">{isLoginView ? 'Entrar' : 'Registrarse'}</button>
      </form>

      <p className="mt-4">
        {isLoginView ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
        <button
          onClick={() => {
            setIsLoginView(!isLoginView);
            setError('');
          }}
          className="bg-transparent border-none text-poke-yellow underline cursor-pointer font-inherit text-base p-2 hover:text-yellow-300"
        >
          {isLoginView ? 'Regístrate' : 'Inicia Sesión'}
        </button>
      </p>
    </div>
  );
}

export default Login;