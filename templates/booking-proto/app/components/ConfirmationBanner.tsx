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
        <p className="muted">
          Confirmation number: <strong>{confirmation}</strong>
        </p>
      )}
    </section>
  );
}
