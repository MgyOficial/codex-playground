import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

const handleApiError = (error, fallbackMessage) => {
  if (error.response) {
    return {
      status: error.response.status,
      message: error.response.data?.message || fallbackMessage,
    };
  }

  return {
    status: null,
    message: error.message || fallbackMessage,
  };
};

export const login = async ({ email, password }) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Error al iniciar sesión.');
  }
};

export const getEvents = async () => {
  try {
    const response = await apiClient.get('/events');
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Error al obtener eventos.');
  }
};

export const registerForEvent = async ({ eventId, userId }) => {
  try {
    const response = await apiClient.post(`/events/${eventId}/register`, { userId });
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Error al registrarse en el evento.');
  }
};
