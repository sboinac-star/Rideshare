# NWA Ride Share

A carpooling platform for Northwest Arkansas — Fayetteville, Bentonville, Rogers, Springdale and surrounding areas. Drivers post journeys and passengers contact them directly to arrange rides and negotiate pricing.

## Features

- **Browse journeys** — search by departure city, destination city, and date
- **City autocomplete** — type to filter from a list of cities, or enter any city manually
- **Post a journey** — drivers list routes with departure time, available seats, and contact number
- **Direct contact** — passengers call or text the driver to arrange the ride and negotiate price
- **Real-time updates** — journey listings update live via Firebase Firestore
- **Input validation** — driver name (letters/spaces only), phone number (digits only, min 10 digits)

## Tech Stack

- [Next.js](https://nextjs.org/) — React framework
- [Firebase Firestore](https://firebase.google.com/docs/firestore) — real-time database
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Vercel](https://vercel.com/) — hosting (https://nwa-rideshare.vercel.app)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` file with your Firebase project config:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Home — browse and search journeys
│   ├── driver/page.tsx   # Post a journey
│   ├── layout.tsx        # Nav and root layout
│   └── globals.css       # Global styles
└── lib/
    ├── firebase.ts       # Firebase client setup
    └── constants.ts      # Shared city list
```

## Deployment

The app is hosted on Vercel at **https://nwa-rideshare.vercel.app**.

To deploy manually:

```bash
vercel --prod
```

To deploy Firestore security rules manually:

```bash
npm run deploy:firestore
```

## Security

- HTTP security headers on all routes: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- Firestore rules: only valid journeys can be created; updates are restricted to cancellation only (status `active` → `cancelled`, no other fields)
- Form validation: driver name accepts letters and spaces only; phone requires at least 10 digits
