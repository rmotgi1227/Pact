import { Header } from './components/Header';
import { SearchForm } from './components/SearchForm';
import { TrustRow } from './components/TrustRow';
import { PopularCars } from './components/PopularCars';
import { getSlots } from '../lib/slots';

export default function SearchPage() {
  const slots = getSlots();
  return (
    <main className="page">
      <Header />
      <section className="hero">
        <div className="hero-copy">
          <h1 className="hero-heading">{slots.title}</h1>
          <p className="hero-subline">{slots.tagline}</p>
        </div>
        <section className="card search-panel" id="search">
          <SearchForm fields={slots.searchFields} />
        </section>
      </section>
      <TrustRow />
      <PopularCars />
    </main>
  );
}
