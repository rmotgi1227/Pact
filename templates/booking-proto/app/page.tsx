import { Header } from './components/Header';
import { SearchForm } from './components/SearchForm';
import { getSlots } from '../lib/slots';

export default function SearchPage() {
  const slots = getSlots();
  return (
    <main className="page">
      <Header title={slots.title} />
      <section className="card">
        <h1>{slots.title}</h1>
        <p className="muted">{slots.tagline}</p>
        <SearchForm fields={slots.searchFields} />
      </section>
    </main>
  );
}
