const items = [
  { label: 'Free cancellation', detail: 'Up to 24 hours before pickup' },
  { label: 'No hidden fees', detail: 'The price you see is the price you pay' },
  { label: '24/7 roadside support', detail: 'Help is one call away, any time' },
];

export function TrustRow() {
  return (
    <ul className="trust-row">
      {items.map((item) => (
        <li key={item.label} className="trust-item">
          <span className="trust-item-check" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
              <path
                d="M4 10.5 L8 14.5 L16 5.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            <span className="trust-item-label">{item.label}</span>
            <span className="trust-item-detail">{item.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
