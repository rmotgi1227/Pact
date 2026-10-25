import Link from 'next/link';
import type { Vehicle } from '../../data/vehicles';

const classLabel: Record<Vehicle['carClass'], string> = {
  economy: 'Economy',
  midsize: 'Midsize',
  suv: 'SUV',
  luxury: 'Luxury',
};

const transmissionLabel: Record<Vehicle['transmission'], string> = {
  automatic: 'Automatic',
  manual: 'Manual',
};

export function ResultCard({ vehicle, bookCta }: { vehicle: Vehicle; bookCta: string }) {
  return (
    <article className="result-card" data-testid="result-card">
      <div className="result-card-top">
        <div className="result-card-name">{vehicle.name}</div>
        <span className="badge">{classLabel[vehicle.carClass]}</span>
      </div>
      <div className="result-card-meta">
        {vehicle.seats} seats &middot; {transmissionLabel[vehicle.transmission]}
      </div>
      <div className="result-card-footer">
        <div className="result-card-price">
          ${vehicle.dailyPrice}<span className="result-card-price-unit">/day</span>
        </div>
        <Link href={`/book?vehicle=${vehicle.id}`} className="btn btn-primary" data-testid="book-cta">
          {bookCta}
        </Link>
      </div>
    </article>
  );
}
