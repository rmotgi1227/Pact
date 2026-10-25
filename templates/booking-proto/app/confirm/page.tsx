import { Header } from '../components/Header';
import { ConfirmationBanner } from '../components/ConfirmationBanner';
import { getSlots } from '../../lib/slots';

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmation?: string }>;
}) {
  const slots = getSlots();
  const { confirmation } = await searchParams;

  return (
    <main className="page">
      <Header title={slots.title} />
      <ConfirmationBanner
        heading={slots.screens.confirm.heading}
        message={slots.screens.confirm.message}
        confirmation={confirmation ?? null}
      />
    </main>
  );
}
