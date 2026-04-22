from __future__ import annotations

import json
import os
from urllib import error, request
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


DEMO_LOT_ID = "lot-liv-yellow"
DEMO_MAP_LOT_ID = "yellowlot"
DEMO_SPOT_IDS = [f"yellowlot_spot_{index}" for index in range(1, 9)]
DEMO_OUTPUT_PATH = Path(__file__).resolve().parent / "website" / "public" / "demo" / "occupancy.json"
DEMO_API_BASE_URL = os.getenv("DEMO_API_BASE_URL", "http://127.0.0.1:8000")


def build_payload(
    occupancy: Iterable[int | bool],
    *,
    lot_id: str,
    map_lot_id: str,
    spot_ids: list[str],
) -> dict[str, object]:
    states = [bool(value) for value in occupancy]
    if len(states) != len(spot_ids):
        raise ValueError(f"Expected {len(spot_ids)} spot states, got {len(states)}")

    available_spaces = sum(1 for state in states if not state)
    updated_at = datetime.now(timezone.utc).isoformat()

    return {
        "updatedAt": updated_at,
        "lots": {
            lot_id: {
                "mapLotId": map_lot_id,
                "totalSpaces": len(spot_ids),
                "availableSpaces": available_spaces,
                "spots": [
                    {
                        "spotId": spot_id,
                        "isOccupied": is_occupied,
                    }
                    for spot_id, is_occupied in zip(spot_ids, states, strict=True)
                ],
            }
        },
    }


def build_demo_payload(occupancy: Iterable[int | bool]) -> dict[str, object]:
    return build_payload(
        occupancy,
        lot_id=DEMO_LOT_ID,
        map_lot_id=DEMO_MAP_LOT_ID,
        spot_ids=DEMO_SPOT_IDS,
    )


def write_demo_payload(occupancy: Iterable[int | bool]) -> Path:
    payload = build_demo_payload(occupancy)
    DEMO_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    DEMO_OUTPUT_PATH.write_text(json.dumps(payload, indent=2))
    return DEMO_OUTPUT_PATH


def post_payload(
    occupancy: Iterable[int | bool],
    *,
    lot_id: str,
    map_lot_id: str,
    spot_ids: list[str],
    device_id: str,
    api_base_url: str | None = None,
) -> dict[str, object]:
    payload = build_payload(
        occupancy,
        lot_id=lot_id,
        map_lot_id=map_lot_id,
        spot_ids=spot_ids,
    )
    lot_payload = payload["lots"][lot_id]
    ingest_payload = {
        "deviceId": device_id,
        "observedAt": payload["updatedAt"],
        "lot": {
            "lotId": lot_id,
            "mapLotId": lot_payload["mapLotId"],
            "spots": lot_payload["spots"],
        },
    }

    base_url = (api_base_url or DEMO_API_BASE_URL).rstrip("/")
    http_request = request.Request(
        f"{base_url}/api/demo/ingest",
        data=json.dumps(ingest_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(http_request, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))


def post_demo_payload(occupancy: Iterable[int | bool], *, device_id: str = "edge-yellow-demo-01", api_base_url: str | None = None) -> dict[str, object]:
    return post_payload(
        occupancy,
        lot_id=DEMO_LOT_ID,
        map_lot_id=DEMO_MAP_LOT_ID,
        spot_ids=DEMO_SPOT_IDS,
        device_id=device_id,
        api_base_url=api_base_url,
    )


def publish_demo_payload(
    occupancy: Iterable[int | bool],
    *,
    device_id: str = "edge-yellow-demo-01",
    api_base_url: str | None = None,
    write_local_backup: bool = True,
) -> dict[str, object]:
    if write_local_backup:
        write_demo_payload(occupancy)

    try:
        response = post_demo_payload(occupancy, device_id=device_id, api_base_url=api_base_url)
    except error.URLError as request_error:
        raise RuntimeError(f"Could not reach demo backend: {request_error}") from request_error

    if response.get("status") != "ok":
        raise RuntimeError(f"Demo backend rejected payload: {response}")

    return response


def publish_payload(
    occupancy: Iterable[int | bool],
    *,
    lot_id: str,
    map_lot_id: str,
    spot_ids: list[str],
    device_id: str,
    api_base_url: str | None = None,
) -> dict[str, object]:
    try:
        response = post_payload(
            occupancy,
            lot_id=lot_id,
            map_lot_id=map_lot_id,
            spot_ids=spot_ids,
            device_id=device_id,
            api_base_url=api_base_url,
        )
    except error.URLError as request_error:
        raise RuntimeError(f"Could not reach backend: {request_error}") from request_error

    if response.get("status") != "ok":
        raise RuntimeError(f"Backend rejected payload: {response}")

    return response
