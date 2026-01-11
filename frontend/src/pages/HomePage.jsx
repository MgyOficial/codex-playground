import ApiStatus from '../components/ApiStatus.jsx';

const HomePage = () => (
  <main className="page">
    <header className="page__header">
      <h1>Gestión de Eventos</h1>
      <p>Frontend listo para consumir la API REST del backend.</p>
    </header>
    <section className="page__section">
      <h2>Estado de la API</h2>
      <ApiStatus />
    </section>
  </main>
);

export default HomePage;
