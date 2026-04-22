from __future__ import annotations

import os
from datetime import datetime

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.db import Campus, ParentNode, ParkingLot, ParkingSpot, SpotReport, University, get_db, init_database


load_dotenv()


def get_allowed_origins() -> list[str]:
    configured = os.getenv(
        "FRONTEND_ORIGIN",
        "http://localhost:5173,http://127.0.0.1:5173,https://univiewparking.com,https://www.univiewparking.com",
    )
    origins = [origin.strip() for origin in configured.split(",") if origin.strip()]
    if "http://127.0.0.1:5173" not in origins:
        origins.append("http://127.0.0.1:5173")
    if "http://localhost:5173" not in origins:
        origins.append("http://localhost:5173")
    return origins


app = FastAPI(title="UniView Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def setup_database() -> None:
    init_database()


class HealthResponse(BaseModel):
    status: str
    service: str


class UniversityResponse(BaseModel):
    id: str
    name: str

    model_config = {"from_attributes": True}


class CampusResponse(BaseModel):
    id: str
    university_id: str
    name: str
    lot_count: int


class LotResponse(BaseModel):
    id: str
    campus_id: str
    name: str
    total_spaces: int
    occupied_spaces: int
    available_spaces: int
    last_updated: datetime


class SpotResponse(BaseModel):
    id: str
    lot_id: str
    is_occupied: bool
    last_updated: datetime


class SpotUpdateInput(BaseModel):
    spot_id: str
    is_occupied: bool


class LotReportInput(BaseModel):
    device_id: str
    lot_id: str
    observed_at: datetime
    spots: list[SpotUpdateInput]


class ParentUpdateInput(BaseModel):
    parent_node_id: str
    collected_at: datetime
    reports: list[LotReportInput]


class ParentUpdateResponse(BaseModel):
    status: str
    parent_node_id: str
    lots_updated: list[str]
    report_count: int


class DemoSpotInput(BaseModel):
    spotId: str
    isOccupied: bool


class DemoLotUpdate(BaseModel):
    lotId: str
    mapLotId: str = "jerseymikes"
    spots: list[DemoSpotInput]


class DemoIngestRequest(BaseModel):
    deviceId: str
    observedAt: datetime | None = None
    lot: DemoLotUpdate


DEMO_LOT_ID = "jerseymikes"
DEMO_COMPAT_LOT_IDS = {DEMO_LOT_ID}


def lot_to_response(lot: ParkingLot) -> LotResponse:
    occupied_spaces = sum(1 for spot in lot.spots if spot.is_occupied)
    return LotResponse(
        id=lot.id,
        campus_id=lot.campus_id,
        name=lot.name,
        total_spaces=lot.total_spaces,
        occupied_spaces=occupied_spaces,
        available_spaces=max(lot.total_spaces - occupied_spaces, 0),
        last_updated=lot.last_updated,
    )


@app.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service="uniview-backend")


@app.get("/api/universities", response_model=list[UniversityResponse])
def list_universities(db: Session = Depends(get_db)) -> list[University]:
    return db.scalars(select(University).order_by(University.name)).all()


@app.get("/api/campuses", response_model=list[CampusResponse])
def list_campuses(
    university_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[CampusResponse]:
    stmt = (
        select(
            Campus.id,
            Campus.university_id,
            Campus.name,
            func.count(ParkingLot.id).label("lot_count"),
        )
        .outerjoin(ParkingLot, ParkingLot.campus_id == Campus.id)
        .group_by(Campus.id)
        .order_by(Campus.name)
    )
    if university_id:
        stmt = stmt.where(Campus.university_id == university_id)
    rows = db.execute(stmt).all()
    return [CampusResponse(id=row.id, university_id=row.university_id, name=row.name, lot_count=row.lot_count) for row in rows]


@app.get("/api/lots", response_model=list[LotResponse])
def list_lots(
    campus_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[LotResponse]:
    stmt = select(ParkingLot).order_by(ParkingLot.name)
    if campus_id:
        stmt = stmt.where(ParkingLot.campus_id == campus_id)
    lots = db.scalars(stmt).all()
    return [lot_to_response(lot) for lot in lots]


@app.get("/api/lots/{lot_id}", response_model=LotResponse)
def get_lot(lot_id: str, db: Session = Depends(get_db)) -> LotResponse:
    lot = db.get(ParkingLot, lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail=f"Lot '{lot_id}' not found")
    return lot_to_response(lot)


@app.get("/api/lots/{lot_id}/spots", response_model=list[SpotResponse])
def list_lot_spots(lot_id: str, db: Session = Depends(get_db)) -> list[SpotResponse]:
    lot = db.get(ParkingLot, lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail=f"Lot '{lot_id}' not found")

    spots = db.scalars(select(ParkingSpot).where(ParkingSpot.lot_id == lot_id).order_by(ParkingSpot.id)).all()
    return [SpotResponse(id=spot.id, lot_id=spot.lot_id, is_occupied=spot.is_occupied, last_updated=spot.last_updated) for spot in spots]


@app.post("/api/ingest/parent-update", response_model=ParentUpdateResponse)
def ingest_parent_update(payload: ParentUpdateInput, db: Session = Depends(get_db)) -> ParentUpdateResponse:
    parent_node = db.scalar(select(ParentNode).where(ParentNode.parent_node_id == payload.parent_node_id))
    if not parent_node:
        parent_node = ParentNode(parent_node_id=payload.parent_node_id)
        db.add(parent_node)

    parent_node.last_seen = payload.collected_at

    updated_lot_ids: set[str] = set()
    for report in payload.reports:
        lot = db.get(ParkingLot, report.lot_id)
        if not lot:
            raise HTTPException(status_code=404, detail=f"Lot '{report.lot_id}' not found")

        lot.last_updated = report.observed_at
        for spot_update in report.spots:
            spot = db.get(ParkingSpot, spot_update.spot_id)
            if not spot or spot.lot_id != report.lot_id:
                raise HTTPException(status_code=404, detail=f"Spot '{spot_update.spot_id}' not found in lot '{report.lot_id}'")

            spot.is_occupied = spot_update.is_occupied
            spot.last_updated = report.observed_at
            db.add(
                SpotReport(
                    device_id=report.device_id,
                    parent_node_id=payload.parent_node_id,
                    spot_id=spot.id,
                    observed_at=report.observed_at,
                    is_occupied=spot_update.is_occupied,
                )
            )
        updated_lot_ids.add(lot.id)

    db.commit()
    return ParentUpdateResponse(
        status="ok",
        parent_node_id=payload.parent_node_id,
        lots_updated=sorted(updated_lot_ids),
        report_count=len(payload.reports),
    )


@app.get("/api/demo/occupancy")
def get_demo_occupancy(db: Session = Depends(get_db)) -> dict[str, object]:
    lot = db.get(ParkingLot, DEMO_LOT_ID)
    if not lot:
        raise HTTPException(status_code=404, detail=f"Lot '{DEMO_LOT_ID}' not found")

    spots = db.scalars(select(ParkingSpot).where(ParkingSpot.lot_id == DEMO_LOT_ID).order_by(ParkingSpot.id)).all()
    occupied_spaces = sum(1 for spot in spots if spot.is_occupied)

    return {
        "updatedAt": lot.last_updated.isoformat(),
        "lots": {
            DEMO_LOT_ID: {
                "mapLotId": "jerseymikes",
                "totalSpaces": lot.total_spaces,
                "availableSpaces": max(lot.total_spaces - occupied_spaces, 0),
                "spots": [
                    {
                        "spotId": spot.id,
                        "isOccupied": spot.is_occupied,
                    }
                    for spot in spots
                ],
            }
        },
    }


@app.post("/api/demo/ingest")
def ingest_demo_occupancy(payload: DemoIngestRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    if payload.lot.lotId not in DEMO_COMPAT_LOT_IDS:
        raise HTTPException(
            status_code=400,
            detail=f"Demo backend only accepts {sorted(DEMO_COMPAT_LOT_IDS)!r} right now.",
        )

    observed_at = payload.observedAt or datetime.utcnow()
    parent_payload = ParentUpdateInput(
        parent_node_id="demo-parent-node",
        collected_at=observed_at,
        reports=[
            LotReportInput(
                device_id=payload.deviceId,
                lot_id=DEMO_LOT_ID,
                observed_at=observed_at,
                spots=[
                    SpotUpdateInput(
                        spot_id=spot.spotId,
                        is_occupied=spot.isOccupied,
                    )
                    for spot in payload.lot.spots
                ],
            )
        ],
    )

    response = ingest_parent_update(parent_payload, db)
    return {
        "status": response.status,
        "availableSpaces": lot_to_response(db.get(ParkingLot, DEMO_LOT_ID)).available_spaces,
        "updatedAt": observed_at.isoformat(),
        "lotsUpdated": response.lots_updated,
    }
