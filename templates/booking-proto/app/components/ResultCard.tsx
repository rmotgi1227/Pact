import Link from 'next/link';
import type { Vehicle } from '../../data/vehicles';

export function ResultCard({ vehicle, bookCta }: { vehicle: Vehicle; bookCta: string }) {
  return (
    <article className="result-card" data-testid="result-card">
      <div className="result-card-name">{vehicle.name}</div>
      <div className="result-card-meta">
        {vehicle.seats} seats &middot; {vehicle.transmission} &middot; {vehicle.carClass}
      </div>
      <div className="result-card-footer">
        <div className="result-card-price">${vehicle.dailyPrice}/day</div>
        <Link href={`/book?vehicle=${vehicle.id}`} className="btn btn-primary" data-testid="book-cta">
          {bookCta}
        </Link>
      </div>
    </article>
  );
}
