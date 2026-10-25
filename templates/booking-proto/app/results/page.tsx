import { Header } from '../components/Header';
import { ResultCard } from '../components/ResultCard';
import { getSlots } from '../../lib/slots';
import { searchVehicles } from '../../data/vehicles';

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ carClass?: string }>;
}) {
  const slots = getSlots();
  const { carClass } = await searchParams;
  const results = [...searchVehicles(carClass)].sort((a, b) => a.dailyPrice - b.dailyPrice);

  return (
    <main className="page">
      <Header />
      <div className="results-header">
        <h1>{slots.screens.results.heading}</h1>
        {results.length > 0 && (
          <p className="results-meta">
            {results.length} {results.length === 1 ? 'car' : 'cars'} available &middot; sorted by price, low to high
          </p>
        )}
      </div>
      {results.length === 0 ? (
        <p className="empty-state">No cars match that search. Try a different class or date range.</p>
      ) : (
        <div className="results-grid" data-testid="results-grid" data-tablet-dense={slots.showTabletLayout}>
          {results.map((vehicle) => (
            <ResultCard key={vehicle.id} vehicle={vehicle} bookCta={slots.screens.book.cta} />
          ))}
        </div>
      )}
    </main>
  );
}
