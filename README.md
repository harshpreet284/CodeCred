# CodeCred

CodeCred is a full-stack developer interview-readiness platform.
"Know your code. Defend your work."

## Structure

This repository uses a client/server architecture:

- `client/`: React + Vite frontend
- `server/`: Node.js + Express backend API

## Development

The frontend and backend are managed as separate directories.

### Frontend
```bash
cd client
npm install
npm run dev
```

### Backend
```bash
cd server
npm install
# Create .env from .env.example
npm run dev
```

## Documentation

- [Product Specification](docs/PRODUCT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [AI Guidelines](docs/AI_GUIDELINES.md)
