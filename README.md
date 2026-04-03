# StelarBIM

An AI-powered Building Information Modeling (BIM) platform with Claude integration for intelligent project planning, compliance management, and structural analysis.

## Features

- AI-Powered Planning Lane using Claude Sonnet
- Compliance & Approval Gates with human-in-the-loop workflows
- Cockpit Dashboard for project management and monitoring
- Real-time task execution tracking and cost analysis
- PostgreSQL backend with full audit trails

## Setup

### Prerequisites

- Node.js 22+
- PostgreSQL 13+
- Anthropic API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (copy from .env.example):
   ```bash
   cp .env.example .env
   ```

4. Configure your database and API keys in `.env`

5. Initialize the database:
   ```bash
   psql -U postgres -d stelarbim -f server/schema.sql
   ```

### Development

Start both the server and Vite frontend:
```bash
npm run dev
```

The frontend will be available at http://localhost:3001
The API server will run on http://localhost:3000

### Production

Build and start the production server:
```bash
npm run build
npm run start
```

## Project Structure

```
stelarbim/
├── server/
│   ├── index.ts          # Express server
│   ├── db.ts             # PostgreSQL connection
│   ├── claude.ts         # Claude AI integration
│   ├── schema.sql        # Database schema
│   └── routes/           # API endpoints
├── src/
│   ├── pages/            # React pages
│   ├── components/       # React components
│   ├── App.tsx          # Main app routing
│   └── index.css        # Global styles
├── public/              # Static assets
└── package.json         # Dependencies
```

## API Endpoints

- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `POST /api/runs` - Start Claude task run (SSE streaming)
- `GET /api/runs` - List task runs
- `POST /api/approvals` - Submit approval decision

## License

Proprietary - StelarBIM 2026
