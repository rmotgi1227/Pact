import { Header } from '../components/Header';
import { BookingForm } from '../components/BookingForm';
import { getSlots } from '../../lib/slots';

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string }>;
}) {
  const slots = getSlots();
  const { vehicle } = await searchParams;

  return (
    <main className="page">
      <Header title={slots.title} />
      <h1>{slots.screens.book.heading}</h1>
      <BookingForm vehicleId={vehicle ?? null} />
    </main>
  );
}
