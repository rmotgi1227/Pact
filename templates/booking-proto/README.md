# templates/booking-proto/ (goal R4, Rishab)
The booking-flow template that `generate-prototype` fills in, and the base for Aryan's booking-site repo.
- Routes: `/`, `/results`, `/book`, `/confirm`, `/health`.
- Required data-testids: search-form, field-<key>, search-submit, results-grid, result-card, book-cta, booking-form, confirmation-banner, brand-switcher.
- Tablet rule: at 768x1024 and 1024x768, results-grid must not overflow and must show at least 2 cards per row.

Its own lockfile; it builds in Docker.
