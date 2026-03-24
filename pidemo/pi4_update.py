from __future__ import annotations

import argparse
import json
import ssl
from datetime import datetime, timezone
from pathlib import Path
from urllib import error, request


DEFAULT_BACKEND_URL = "https://uniview.onrender.com"
LOT_SPOT_FILES = {
    "core_building": "demo-spots.geojson",
    "stadium_west": "stadium-west-spots.geojson",
    "yellow_lot": "yellowlot-spots.geojson",
    "green_lot": "greenlot-spots.geojson",
    "lot_105": "lot105-spots.geojson",
    "lot_101": "lot101-spots.geojson",
    "lot_102": "lot102-spots.geojson",
    "lot_103": "lot103-spots.geojson",
}


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def lots_dir() -> Path:
    return repo_root() / "website" / "public" / "map" / "data" / "lots"


def load_spot_ids(lot_id: str) -> list[str]:
    filename = LOT_SPOT_FILES.get(lot_id)
    if not filename:
        raise ValueError(f"Lot '{lot_id}' is not configured in pidemo.")

    path = lots_dir() / filename
    if not path.exists():
        raise FileNotFoundError(f"Missing spot geometry file for lot '{lot_id}': {path}")

    data = json.loads(path.read_text())
    spot_ids = [feature.get("properties", {}).get("spot_id") for feature in data.get("features", [])]
    spot_ids = [spot_id for spot_id in spot_ids if spot_id]

    if not spot_ids:
        raise ValueError(f"Lot '{lot_id}' does not have any mapped spots yet.")

    return spot_ids


def build_report(
    node_id: str,
    lot_id: str,
    occupied_spot_ids: list[str] | None = None,
    occupied_count: int | None = None,
    observed_at: str | None = None,
) -> dict:
    spot_ids = load_spot_ids(lot_id)
    occupied = set(occupied_spot_ids or [])

    if occupied_count is not None:
        if occupied_count < 0:
            raise ValueError("occupied_count must be 0 or greater.")
        occupied.update(spot_ids[:occupied_count])

    unknown = sorted(occupied.difference(spot_ids))
    if unknown:
        raise ValueError(f"Unknown spot IDs for lot '{lot_id}': {', '.join(unknown)}")

    return {
        "device_id": node_id,
        "lot_id": lot_id,
        "observed_at": observed_at or utc_now_iso(),
        "spots": [
            {
                "spot_id": spot_id,
                "is_occupied": spot_id in occupied,
            }
            for spot_id in spot_ids
        ],
    }


def wrap_parent_payload(node_id: str, report: dict, collected_at: str | None = None) -> dict:
    timestamp = collected_at or utc_now_iso()
    return {
        "parent_node_id": node_id,
        "collected_at": timestamp,
        "reports": [report],
    }


def load_cv_report(path: str, node_id: str) -> dict:
    data = json.loads(Path(path).expanduser().read_text())
    lot_id = data["lot_id"]
    occupied_spot_ids = data.get("occupied_spots", [])
    observed_at = data.get("observed_at")
    return build_report(
        node_id=node_id,
        lot_id=lot_id,
        occupied_spot_ids=occupied_spot_ids,
        observed_at=observed_at,
    )


def post_payload(backend_url: str, payload: dict, insecure: bool = False) -> tuple[int, str]:
    endpoint = f"{backend_url.rstrip('/')}/api/ingest/parent-update"
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        endpoint,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    context = ssl._create_unverified_context() if insecure else None
    with request.urlopen(req, data=body, timeout=15, context=context) as response:
        return response.status, response.read().decode("utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Pi 4 demo updater for UniView. Builds a lot report and posts it to the backend.",
    )
    parser.add_argument("--node-id", default="pi4-demo-1", help="Pi 4 node ID")
    parser.add_argument("--backend-url", default=DEFAULT_BACKEND_URL, help="Backend base URL")
    parser.add_argument("--lot-id", help="Backend lot ID, for example yellow_lot")
    parser.add_argument(
        "--occupied-spots",
        default="",
        help="Comma-separated occupied spot IDs, for example yellowlot_spot_1,yellowlot_spot_2",
    )
    parser.add_argument(
        "--occupied-count",
        type=int,
        default=None,
        help="Mark the first N spots as occupied for quick demos",
    )
    parser.add_argument(
        "--cv-report",
        default=None,
        help="Path to a simple JSON file from the CV process. Expected keys: lot_id, occupied_spots, observed_at(optional).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the payload without sending it",
    )
    parser.add_argument(
        "--insecure",
        action="store_true",
        help="Skip TLS verification for development-only testing",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.cv_report:
        report = load_cv_report(args.cv_report, args.node_id)
    else:
        if not args.lot_id:
            raise SystemExit("Provide --lot-id or --cv-report.")
        occupied_spot_ids = [item.strip() for item in args.occupied_spots.split(",") if item.strip()]
        report = build_report(
            node_id=args.node_id,
            lot_id=args.lot_id,
            occupied_spot_ids=occupied_spot_ids,
            occupied_count=args.occupied_count,
        )

    payload = wrap_parent_payload(args.node_id, report)

    if args.dry_run:
        print(json.dumps(payload, indent=2))
        return

    try:
        status_code, response_body = post_payload(args.backend_url, payload, insecure=args.insecure)
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"Backend returned HTTP {exc.code}: {body}") from exc
    except error.URLError as exc:
        raise SystemExit(f"Could not reach backend: {exc.reason}") from exc

    print(f"POST {args.backend_url.rstrip('/')}/api/ingest/parent-update -> {status_code}")
    print(response_body)


if __name__ == "__main__":
    main()
