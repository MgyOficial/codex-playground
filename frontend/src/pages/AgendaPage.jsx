import { useEffect, useState } from 'react';
import { getEvents } from '../services/api.js';

const AgendaPage = () => {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('cargando');
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    getEvents()
      .then((data) => {
        if (isMounted) {
          setEvents(Array.isArray(data) ? data : []);
          setStatus('listo');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || 'No se pudo cargar la agenda.');
          setStatus('error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="page">
      <header className="page__header">
        <h1>Agenda</h1>
        <p>Eventos disponibles desde el backend.</p>
      </header>
      <section className="page__section">
        {status === 'cargando' && <p>Cargando eventos...</p>}
        {status === 'error' && <p className="status-card__error">{error}</p>}
        {status === 'listo' && (
          <ul className="agenda-list">
            {events.length === 0 ? (
              <li className="agenda-list__empty">No hay eventos disponibles.</li>
            ) : (
              events.map((event) => (
                <li key={event._id || event.id} className="agenda-list__item">
                  <div>
                    <h3>{event.nombre}</h3>
                    <p className="agenda-list__meta">
                      {new Date(event.fecha).toLocaleDateString('es-ES')} · {event.tipo}
                    </p>
                  </div>
                  <p className="agenda-list__description">{event.descripcion}</p>
                </li>
              ))
            )}
          </ul>
        )}
      </section>
    </main>
  );
};

export default AgendaPage;
