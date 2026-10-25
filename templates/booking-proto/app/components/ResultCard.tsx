import Link from 'next/link';
import { CarSilhouette } from './CarSilhouette';
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
      <div className="result-card-art">
        <CarSilhouette carClass={vehicle.carClass} />
      </div>
      <div className="result-card-top">
        <div className="result-card-name">{vehicle.name}</div>
        <span className="badge">{classLabel[vehicle.carClass]}</span>
      </div>
      <ul className="spec-chips">
        <li className="spec-chip">
          <span className="spec-chip-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
              <path d="M8 1a5 5 0 0 0-5 5v1.6a2 2 0 0 0-1 1.74V12a1 1 0 0 0 1 1h1.2l.3 1h1.1l-.3-1h5.4l-.3 1h1.1l.3-1H14a1 1 0 0 0 1-1V9.34a2 2 0 0 0-1-1.74V6a5 5 0 0 0-5-5H8Zm-3.5 6V6a3.5 3.5 0 0 1 7 0v1h-7Zm-1 3a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm9 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
            </svg>
          </span>
          {vehicle.seats} seats
        </li>
        <li className="spec-chip">
          <span className="spec-chip-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
              <path d="M8 1a7 7 0 1 0 7 7 7 7 0 0 0-7-7Zm0 12.5A5.5 5.5 0 1 1 13.5 8 5.5 5.5 0 0 1 8 13.5ZM7.25 4.5h1.5v4.1l3 1.73-.75 1.3-3.75-2.16Z" />
            </svg>
          </span>
          {transmissionLabel[vehicle.transmission]}
        </li>
      </ul>
      <div className="result-card-footer">
        <div className="result-card-price">
          ${vehicle.dailyPrice}
          <span className="result-card-price-unit">/day</span>
        </div>
        <Link href={`/book?vehicle=${vehicle.id}`} className="btn btn-primary result-card-cta" data-testid="book-cta">
          {bookCta}
        </Link>
      </div>
    </article>
  );
}
