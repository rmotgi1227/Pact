'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { getVehicle } from '../../data/vehicles';

const randomConfirmation = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export function BookingForm({ vehicleId }: { vehicleId: string | null }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const vehicle = getVehicle(vehicleId);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required to complete the reservation.');
      return;
    }
    const params = new URLSearchParams({ confirmation: randomConfirmation() });
    if (vehicleId) params.set('vehicle', vehicleId);
    router.push(`/confirm?${params.toString()}`);
  };

  return (
    <form className="card" data-testid="booking-form" onSubmit={onSubmit}>
      {vehicle && (
        <div className="booking-summary">
          <div className="booking-summary-name">{vehicle.name}</div>
          <div className="booking-summary-price">
            ${vehicle.dailyPrice}<span className="result-card-price-unit">/day</span>
          </div>
        </div>
      )}
      <div className="field-group">
        <label className="field-label" htmlFor="booking-name">
          Full name
        </label>
        <input
          id="booking-name"
          className="field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'booking-form-error' : undefined}
        />
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="booking-email">
          Email
        </label>
        <input
          id="booking-email"
          className="field-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'booking-form-error' : undefined}
        />
      </div>
      {error && (
        <p className="error-text" id="booking-form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary">
        Confirm reservation
      </button>
    </form>
  );
}
