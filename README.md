# Women in Construction - Roommate Finder

A community platform helping women in the construction industry find compatible roommates.

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: CSS-in-JS
- **Database**: PostgreSQL (schema in `/database/schema.sql`)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Database Schema

The database schema is located in `/database/schema.sql` and includes:

- **profiles**: User profiles linked to authentication
- **listings**: Room/roommate listings with location and preferences
- **intro_requests**: Connection requests between users
- **reports**: Content moderation system

## Deployment

This project is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel for automatic deployments.
