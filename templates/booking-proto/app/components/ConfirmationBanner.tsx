import Link from 'next/link';

const nextSteps = [
  'A confirmation email with your receipt is on its way',
  'Pickup instructions will be sent 24 hours before your trip',
  'Bring your license and the card used to reserve',
];

export function ConfirmationBanner({
  heading,
  message,
  confirmation,
}: {
  heading: string;
  message: string;
  confirmation: string | null;
}) {
  return (
    <section className="banner banner-success" data-testid="confirmation-banner">
      <span className="confirmation-check" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
          <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" />
          <path d="M7 12.5 L10.5 16 L17 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h1>{heading}</h1>
      <p>{message}</p>
      {confirmation && (
        <div className="confirmation-code">
          <span className="confirmation-code-label">Confirmation number</span>
          <span className="confirmation-code-value">{confirmation}</span>
        </div>
      )}
      <div className="confirmation-next">
        <h2 className="confirmation-next-heading">What happens next</h2>
        <ul className="confirmation-next-list">
          {nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </div>
      <Link href="/" className="btn btn-secondary">
        Book another car
      </Link>
    </section>
  );
}
