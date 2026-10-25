import { Header } from '../components/Header';
import { BookingForm } from '../components/BookingForm';
import { TripSummary } from '../components/TripSummary';
import { getSlots } from '../../lib/slots';
import { getVehicle } from '../../data/vehicles';

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string }>;
}) {
  const slots = getSlots();
  const { vehicle } = await searchParams;

  return (
    <main className="page">
      <Header />
      <h1>{slots.screens.book.heading}</h1>
      <div className="book-layout">
        <BookingForm vehicleId={vehicle ?? null} />
        <TripSummary vehicle={getVehicle(vehicle)} />
      </div>
    </main>
  );
}
