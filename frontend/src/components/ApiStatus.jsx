import { useEffect, useState } from 'react';
import { getHealthStatus } from '../services/api.js';

const ApiStatus = () => {
  const [status, setStatus] = useState('cargando');
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    getHealthStatus()
      .then((data) => {
        if (isMounted) {
          setStatus(data?.status ?? 'desconocido');
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('No se pudo conectar con la API');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="status-card">
      {error ? (
        <p className="status-card__error">{error}</p>
      ) : (
        <p className="status-card__value">Estado: {status}</p>
      )}
    </div>
  );
};

export default ApiStatus;
