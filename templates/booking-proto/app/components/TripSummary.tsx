import { CarSilhouette } from './CarSilhouette';
import type { Vehicle } from '../../data/vehicles';

const classLabel: Record<Vehicle['carClass'], string> = {
  economy: 'Economy',
  midsize: 'Midsize',
  suv: 'SUV',
  luxury: 'Luxury',
};

export function TripSummary({ vehicle }: { vehicle: Vehicle | null }) {
  if (!vehicle) {
    return (
      <aside className="card trip-summary">
        <h2 className="trip-summary-heading">Trip summary</h2>
        <p className="muted">Pick a car from the results to see it here.</p>
      </aside>
    );
  }

  return (
    <aside className="card trip-summary">
      <h2 className="trip-summary-heading">Trip summary</h2>
      <div className="trip-summary-art">
        <CarSilhouette carClass={vehicle.carClass} />
      </div>
      <div className="result-card-top">
        <div className="result-card-name">{vehicle.name}</div>
        <span className="badge">{classLabel[vehicle.carClass]}</span>
      </div>
      <div className="trip-summary-price">
        ${vehicle.dailyPrice}
        <span className="result-card-price-unit">/day</span>
      </div>
      <ul className="trip-summary-notes">
        <li>Free cancellation up to 24 hours before pickup</li>
        <li>No hidden fees &mdash; the daily rate is the full rate</li>
      </ul>
    </aside>
  );
}
