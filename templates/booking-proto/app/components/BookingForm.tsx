'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

const randomConfirmation = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export function BookingForm({ vehicleId }: { vehicleId: string | null }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

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
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn btn-primary">
        Confirm reservation
      </button>
    </form>
  );
}
