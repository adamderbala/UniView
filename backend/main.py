from __future__ import annotations

import json
import os
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "uniview_demo.db"

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://univiewparking.com",
    "https://www.univiewparking.com",
]

DEMO_SPOT_IDS = [f"yellowlot_spot_{index}" for index in range(1, 9)]
DEMO_LOT = {
    "lotId": "lot-liv-yellow",
    "mapLotId": "yellowlot",
    "name": "Yellow Lot",
    "campusId": "livingston",
}


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_db_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    with closing(get_db_connection()) as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS demo_lots (
                lot_id TEXT PRIMARY KEY,
                map_lot_id TEXT NOT NULL,
                name TEXT NOT NULL,
                campus_id TEXT NOT NULL,
                total_spaces INTEGER NOT NULL,
                available_spaces INTEGER NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS demo_spot_states (
                spot_id TEXT PRIMARY KEY,
                lot_id TEXT NOT NULL,
                is_occupied INTEGER NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (lot_id) REFERENCES demo_lots (lot_id)
            );

            CREATE TABLE IF NOT EXISTS demo_ingest_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                lot_id TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )

        existing_lot = connection.execute(
            "SELECT lot_id FROM demo_lots WHERE lot_id = ?",
            (DEMO_LOT["lotId"],),
        ).fetchone()
        if not existing_lot:
            now = utc_now_iso()
            connection.execute(
                """
                INSERT INTO demo_lots (lot_id, map_lot_id, name, campus_id, total_spaces, available_spaces, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    DEMO_LOT["lotId"],
                    DEMO_LOT["mapLotId"],
                    DEMO_LOT["name"],
                    DEMO_LOT["campusId"],
                    len(DEMO_SPOT_IDS),
                    len(DEMO_SPOT_IDS),
                    now,
                ),
            )

        for spot_id in DEMO_SPOT_IDS:
            connection.execute(
                """
                INSERT INTO demo_spot_states (spot_id, lot_id, is_occupied, updated_at)
                VALUES (?, ?, 0, ?)
                ON CONFLICT(spot_id) DO NOTHING
                """,
                (spot_id, DEMO_LOT["lotId"], utc_now_iso()),
            )

        connection.commit()


def read_demo_occupancy() -> dict[str, object]:
    with closing(get_db_connection()) as connection:
        lot_row = connection.execute(
            """
            SELECT lot_id, map_lot_id, total_spaces, available_spaces, updated_at
            FROM demo_lots
            WHERE lot_id = ?
            """,
            (DEMO_LOT["lotId"],),
        ).fetchone()
        if not lot_row:
            initialize_database()
            return read_demo_occupancy()

        spot_rows = connection.execute(
            """
            SELECT spot_id, is_occupied
            FROM demo_spot_states
            WHERE lot_id = ?
            ORDER BY spot_id
            """,
            (DEMO_LOT["lotId"],),
        ).fetchall()

    return {
        "updatedAt": lot_row["updated_at"],
        "lots": {
            lot_row["lot_id"]: {
                "mapLotId": lot_row["map_lot_id"],
                "totalSpaces": lot_row["total_spaces"],
                "availableSpaces": lot_row["available_spaces"],
                "spots": [
                    {
                        "spotId": row["spot_id"],
                        "isOccupied": bool(row["is_occupied"]),
                    }
                    for row in spot_rows
                ],
            }
        },
    }


class SpotInput(BaseModel):
    spotId: str
    isOccupied: bool


class DemoLotUpdate(BaseModel):
    lotId: str
    mapLotId: str = DEMO_LOT["mapLotId"]
    spots: list[SpotInput]


class DemoIngestRequest(BaseModel):
    deviceId: str
    observedAt: str | None = None
    lot: DemoLotUpdate


class HealthResponse(BaseModel):
    status: str


app = FastAPI(title="UniView Demo Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    initialize_database()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/api/demo/occupancy")
def get_demo_occupancy() -> dict[str, object]:
    return read_demo_occupancy()


@app.post("/api/demo/ingest")
def ingest_demo_occupancy(payload: DemoIngestRequest) -> dict[str, object]:
    if payload.lot.lotId != DEMO_LOT["lotId"]:
        return {
            "status": "error",
            "message": f"Demo backend only accepts '{DEMO_LOT['lotId']}' right now.",
        }

    incoming_ids = {spot.spotId for spot in payload.lot.spots}
    missing_ids = [spot_id for spot_id in DEMO_SPOT_IDS if spot_id not in incoming_ids]
    if missing_ids:
        return {
            "status": "error",
            "message": f"Missing demo spots: {', '.join(missing_ids)}",
        }

    observed_at = payload.observedAt or utc_now_iso()
    available_spaces = sum(1 for spot in payload.lot.spots if not spot.isOccupied)

    with closing(get_db_connection()) as connection:
        connection.execute(
            """
            UPDATE demo_lots
            SET map_lot_id = ?, total_spaces = ?, available_spaces = ?, updated_at = ?
            WHERE lot_id = ?
            """,
            (
                payload.lot.mapLotId,
                len(payload.lot.spots),
                available_spaces,
                observed_at,
                payload.lot.lotId,
            ),
        )

        for spot in payload.lot.spots:
            connection.execute(
                """
                UPDATE demo_spot_states
                SET is_occupied = ?, updated_at = ?
                WHERE spot_id = ? AND lot_id = ?
                """,
                (
                    int(spot.isOccupied),
                    observed_at,
                    spot.spotId,
                    payload.lot.lotId,
                ),
            )

        connection.execute(
            """
            INSERT INTO demo_ingest_events (device_id, lot_id, payload_json, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                payload.deviceId,
                payload.lot.lotId,
                payload.model_dump_json(),
                utc_now_iso(),
            ),
        )
        connection.commit()

    return {
        "status": "ok",
        "availableSpaces": available_spaces,
        "updatedAt": observed_at,
    }
