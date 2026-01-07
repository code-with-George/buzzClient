# Buzz - Drone Deployment System

A map-first operational drone deployment system, inspired by Waze.

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- MapLibre GL JS
- React Query
- tRPC Client

### Backend
- Node.js
- Express
- tRPC
- Zod (validation)
- Kysely (type-safe SQL)
- SQLite (in-memory for demo)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development servers:
```bash
npm run dev
```

This will start:
- Backend server at http://localhost:3001
- Frontend at http://localhost:5173

### Login
Use any serial number to login (e.g., `X7-99-ALPHA`). The system will create a new user if it doesn't exist.

## Features

### 🗺️ Map View
- Dark mode MapLibre map centered on Israel
- User location tracking
- Controller and drone marker placement
- Operational radius visualization
- Communication zone overlay rendering

### 🚁 Drone Fleet Management
- Search drones by name/ID
- Pin favorite drones as templates
- Recently used drones list (max 7)
- Battery level and status indicators

### ⚙️ Configuration Flow
1. **Remote Controller Setup**
   - Set controller altitude
   - Pin controller location (GPS or map tap)

2. **Drone Setup**
   - Set flight altitude
   - Define operational radius
   - Pin drone location

### 📊 Calculation & Deployment
- Communication zone calculation
- Visual overlay showing signal strength
- Control center approval workflow
- Launch/Cancel actions with history logging

## Project Structure

```
buzz4/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/         # shadcn components
│   │   │   ├── bottom-sheet/
│   │   │   ├── config/
│   │   │   ├── icons/
│   │   │   └── map/
│   │   ├── lib/            # Utilities
│   │   └── store/          # App state
│   └── public/
├── server/                 # Express + tRPC backend
│   └── src/
│       ├── db/             # Kysely database
│       └── trpc/           # tRPC routers
└── package.json            # Monorepo root
```

## API Endpoints (tRPC)

### Auth
- `auth.login` - Login with serial number
- `auth.verify` - Verify token

### Drones
- `drones.search` - Search drones by name
- `drones.getAll` - Get all drones
- `drones.getPinned` - Get pinned drones
- `drones.pin` - Pin a drone
- `drones.getRecentlyUsed` - Get recently used (max 7)

### Flight
- `flight.calculate` - Calculate communication zones
- `flight.requestApproval` - Request control center approval
- `flight.saveToHistory` - Save flight to history

## License

MIT

