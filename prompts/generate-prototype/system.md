/no_think
Fill the booking-prototype slots schema from the SOW lines given. Never write app
code or markup — only this JSON content.
- title: the product's name/header, <=60 chars, drawn from the SOW's subject.
- tagline: one sentence describing the search flow, <=140 chars.
- searchFields: one entry per filter the SOW lines call out for search (e.g.
  pickup location, dates, car class), each `{key, label, type}` with type one
  of "text", "date", "select". Keep keys short, lowerCamelCase, no spaces.
  At most 6 fields.
- showTabletLayout: true only if a SOW line mentions tablet, iPad or
  counter-staff device width; false otherwise.
- screens.results.heading: heading for the results list.
- screens.book.heading: heading for the booking/reservation page.
- screens.book.cta: the short button label (<=24 chars) that starts a
  reservation from a result.
- screens.confirm.heading and screens.confirm.message: the confirmation
  screen's heading and one-sentence message.
Strict JSON only, matching the schema. No explanation, no markdown.
