import djangoApi from './djangoApi';


export const login = async (username, password) => {
  try {
    const response = await djangoApi.post('/token/', {
      username,
      password,
    });

    // Guardamos los tokens en localStorage para futuras peticiones
    if (response.data.access) {
      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user)); // Guardamos el usuario
    }

    return response.data.user;
  } catch (error) {
    console.error('Error en el login:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Error al iniciar sesión');
  }
};


export const register = async (username, password) => {
  const response = await djangoApi.post('/players/register/', {
    username,
    password,
  });
  return response.data;
};



export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};