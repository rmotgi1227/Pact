import Link from 'next/link';
import { CarSilhouette } from './CarSilhouette';
import { vehicles } from '../../data/vehicles';

const classLabel: Record<(typeof vehicles)[number]['carClass'], string> = {
  economy: 'Economy',
  midsize: 'Midsize',
  suv: 'SUV',
  luxury: 'Luxury',
};

// One pick per class so the home page shows real variety without pulling in the full fleet —
// the full, filterable list lives on /results after a search.
const popular = vehicles.filter((v) => ['v1', 'v7', 'v12', 'v16'].includes(v.id));

export function PopularCars() {
  return (
    <section id="popular" className="section">
      <h2 className="section-heading">Popular cars</h2>
      <div className="popular-grid">
        {popular.map((vehicle) => (
          <Link key={vehicle.id} href={`/book?vehicle=${vehicle.id}`} className="popular-card">
            <div className="popular-card-art">
              <CarSilhouette carClass={vehicle.carClass} />
            </div>
            <div className="popular-card-body">
              <div className="popular-card-top">
                <span className="popular-card-name">{vehicle.name}</span>
                <span className="badge">{classLabel[vehicle.carClass]}</span>
              </div>
              <span className="popular-card-price">
                ${vehicle.dailyPrice}
                <span className="result-card-price-unit">/day</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
