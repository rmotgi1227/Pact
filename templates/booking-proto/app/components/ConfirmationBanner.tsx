import Link from 'next/link';

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
      <h1>{heading}</h1>
      <p>{message}</p>
      {confirmation && (
        <div className="confirmation-code">
          <span className="confirmation-code-label">Confirmation number</span>
          <span className="confirmation-code-value">{confirmation}</span>
        </div>
      )}
      <Link href="/" className="btn btn-secondary">
        Book another car
      </Link>
    </section>
  );
}
