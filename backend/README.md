# UniView Backend

This backend is intentionally simple for a capstone project.

## Stack

- FastAPI
- PostgreSQL
- SQLAlchemy
- uvicorn

## Simple Structure

- `backend/main.py`: FastAPI app and routes
- `backend/db.py`: database connection, SQLAlchemy models, and seed data
- `backend/init_db.py`: create tables and insert seed data
- `backend/node.py`: runs the server
- `render.yaml`: simple Render deployment config

## API Endpoints

- `GET /health`
- `GET /api/universities`
- `GET /api/campuses`
- `GET /api/campuses?university_id=rutgers`
- `GET /api/lots`
- `GET /api/lots?campus_id=livingston`
- `GET /api/lots/{lot_id}`
- `GET /api/lots/{lot_id}/spots`
- `POST /api/ingest/parent-update`

## Local Setup

1. Create a `.env` file in the project root.
2. Add:

```env
DATABASE_URL=your_database_url_here
FRONTEND_ORIGIN=http://localhost:5173
```

3. Initialize the database:

```bash
.venv/bin/python -m backend.init_db
```

4. Start the API:

```bash
.venv/bin/python -m backend.node
```

5. Open the docs:

`http://127.0.0.1:8000/docs`

## Render Deployment

This repo now includes a simple [render.yaml](/Users/adamderbala/Downloads/UniView-4/render.yaml) so you can deploy the backend on Render.

1. Push the repo to GitHub.
2. In Render, create a new `Blueprint` deployment from the repo.
3. Set these env vars in Render:
   - `DATABASE_URL`
   - `FRONTEND_ORIGIN`
4. For `FRONTEND_ORIGIN`, use your Vercel URL.
   Example:

```env
FRONTEND_ORIGIN=https://your-vercel-site.vercel.app
```

Notes:
- The backend auto-runs `init_database()` on startup, so tables and seed data are created if missing.
- `render.yaml` already sets `HOST=0.0.0.0` and turns off reload mode for deployment.
- After deploy, update your Vercel frontend env var:

```env
VITE_API_BASE_URL=https://your-render-backend.onrender.com
```

## Example Ingest Payload

```json
{
  "parent_node_id": "parent-rutgers-liv-01",
  "collected_at": "2026-03-22T12:00:00Z",
  "reports": [
    {
      "device_id": "edge-jerseymikes-01",
      "lot_id": "jerseymikes",
      "observed_at": "2026-03-22T11:59:50Z",
      "spots": [
        { "spot_id": "jerseymikes_spot_1", "is_occupied": true },
        { "spot_id": "jerseymikes_spot_2", "is_occupied": false }
      ]
    }
  ]
}
```

## Notes

- Everything important is now in two main files: `backend/main.py` and `backend/db.py`.
- The database is intentionally minimal right now.
- Lots store only basic metadata.
- Spot occupancy is stored in `parking_spots`.
- `available_spaces` and `occupied_spaces` are calculated from the spots for each lot.
- The ingest logic is simple on purpose: one report updates spot statuses for one lot.
