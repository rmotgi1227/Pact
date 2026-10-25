# dashboard/ (goal R2, Rishab)
A local Next.js app on the GB10 (:3000) with three screens: /deals (CRM board), /console and /portal (Dana). It never imports the bus. It reads `GET http://localhost:4000/state`, listens to `/stream`, and calls `POST /actions/<name>`. See build-plan.md, Phase G. Light and purple look, following the mockup.
