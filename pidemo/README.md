# Pi 4 Demo Flow

This folder is for the current one-node setup where the `Pi 4` does everything:

- runs the CV model
- decides which spots are occupied
- sends the update to the UniView backend

## Current Backend

- Backend URL: `https://uniview.onrender.com`
- Endpoint: `POST /api/ingest/parent-update`

## Quick Demo

Mark the first 3 spots in `jerseymikes` as occupied and send the update:

```bash
.venv/bin/python -m pidemo.pi4_update --lot-id jerseymikes --occupied-count 3
```

If your local Python/OpenSSL setup complains about certificates:

```bash
.venv/bin/python -m pidemo.pi4_update --lot-id jerseymikes --occupied-count 3 --insecure
```

Preview the payload without sending it:

```bash
.venv/bin/python -m pidemo.pi4_update --lot-id jerseymikes --occupied-count 3 --dry-run
```

## If CV Outputs a JSON File

The script can also wrap a simple CV output file.

Example file:

```json
{
  "lot_id": "jerseymikes",
  "occupied_spots": ["jerseymikes_spot_1", "jerseymikes_spot_2"],
  "observed_at": "2026-03-24T18:30:00Z"
}
```

Send it with:

```bash
.venv/bin/python -m pidemo.pi4_update --cv-report path/to/report.json
```

## What The CV Code Must Eventually Provide

At minimum, the Pi 4 CV process needs to produce:

- `lot_id`
- `occupied_spots`
- optional `observed_at`

The spot IDs must match the backend/frontend map IDs exactly.
