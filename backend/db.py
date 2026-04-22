from __future__ import annotations

import os
import json
from collections.abc import Generator
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker


load_dotenv()


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/uniview",
)


class Base(DeclarativeBase):
    pass


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class University(Base):
    __tablename__ = "universities"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)


class Campus(Base):
    __tablename__ = "campuses"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    university_id: Mapped[str] = mapped_column(ForeignKey("universities.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)


class ParkingLot(Base):
    __tablename__ = "parking_lots"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    campus_id: Mapped[str] = mapped_column(ForeignKey("campuses.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    total_spaces: Mapped[int] = mapped_column(Integer, nullable=False)
    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
    )

    spots: Mapped[list["ParkingSpot"]] = relationship(back_populates="lot")


class ParentNode(Base):
    __tablename__ = "parent_nodes"

    parent_node_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    last_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
    )


class ParkingSpot(Base):
    __tablename__ = "parking_spots"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    lot_id: Mapped[str] = mapped_column(ForeignKey("parking_lots.id"), nullable=False)
    is_occupied: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
    )

    lot: Mapped[ParkingLot] = relationship(back_populates="spots")
    reports: Mapped[list["SpotReport"]] = relationship(back_populates="spot")


class SpotReport(Base):
    __tablename__ = "spot_reports"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    device_id: Mapped[str] = mapped_column(String(100), nullable=False)
    parent_node_id: Mapped[str] = mapped_column(String(100), nullable=False)
    spot_id: Mapped[str] = mapped_column(ForeignKey("parking_spots.id"), nullable=False)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_occupied: Mapped[bool] = mapped_column(Boolean, nullable=False)

    spot: Mapped[ParkingSpot] = relationship(back_populates="reports")


engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


SEED_UNIVERSITIES = [
    {"id": "rutgers", "name": "Rutgers University"},
    {"id": "princeton", "name": "Princeton University"},
    {"id": "njit", "name": "New Jersey Institute of Technology"},
]

SEED_CAMPUSES = [
    {"id": "busch", "university_id": "rutgers", "name": "Busch Campus"},
    {"id": "college-ave", "university_id": "rutgers", "name": "College Avenue"},
    {"id": "livingston", "university_id": "rutgers", "name": "Livingston Campus"},
    {"id": "cook-douglass", "university_id": "rutgers", "name": "Cook/Douglass"},
]

SEED_LOTS = [
    {"id": "core_building", "campus_id": "busch", "name": "CoRE Building", "total_spaces": 8},
    {"id": "stadium_west", "campus_id": "busch", "name": "Stadium West Lot", "total_spaces": 520},
    {"id": "lot_30", "campus_id": "college-ave", "name": "Lot 30", "total_spaces": 320},
    {"id": "lot_42", "campus_id": "college-ave", "name": "Lot 42", "total_spaces": 420},
    {"id": "jerseymikes", "campus_id": "livingston", "name": "Jersey Mike's", "total_spaces": 8},
    {"id": "yellow_lot", "campus_id": "livingston", "name": "Yellow Lot", "total_spaces": 340},
    {"id": "green_lot", "campus_id": "livingston", "name": "Green Lot", "total_spaces": 280},
    {"id": "lot_105", "campus_id": "livingston", "name": "Lot 105", "total_spaces": 260},
    {"id": "lot_101", "campus_id": "livingston", "name": "Lot 101", "total_spaces": 210},
    {"id": "lot_102", "campus_id": "livingston", "name": "Lot 102", "total_spaces": 190},
    {"id": "lot_103", "campus_id": "livingston", "name": "Lot 103", "total_spaces": 230},
    {"id": "lot_11", "campus_id": "cook-douglass", "name": "Lot 11", "total_spaces": 275},
    {"id": "lot_82", "campus_id": "cook-douglass", "name": "Lot 82", "total_spaces": 195},
]

SPOT_FILES = {
    "core_building": "demo-spots.geojson",
    "stadium_west": "stadium-west-spots.geojson",
    "jerseymikes": "jerseymikes-spots.geojson",
    "yellow_lot": "yellowlot-spots.geojson",
    "green_lot": "greenlot-spots.geojson",
    "lot_105": "lot105-spots.geojson",
    "lot_101": "lot101-spots.geojson",
    "lot_102": "lot102-spots.geojson",
    "lot_103": "lot103-spots.geojson",
}


def load_seed_spots() -> list[ParkingSpot]:
    lots_dir = Path(__file__).resolve().parents[1] / "website" / "public" / "map" / "data" / "lots"
    spots: list[ParkingSpot] = []

    for lot_id, filename in SPOT_FILES.items():
        file_path = lots_dir / filename
        if not file_path.exists():
            continue

        data = json.loads(file_path.read_text())
        for feature in data.get("features", []):
            spot_id = feature.get("properties", {}).get("spot_id")
            if not spot_id:
                continue
            spots.append(ParkingSpot(id=spot_id, lot_id=lot_id))

    return spots


def seed_database(db: Session) -> None:
    existing_university_ids = set(db.scalars(select(University.id)).all())
    db.add_all(University(**item) for item in SEED_UNIVERSITIES if item["id"] not in existing_university_ids)
    db.commit()

    existing_campus_ids = set(db.scalars(select(Campus.id)).all())
    db.add_all(Campus(**item) for item in SEED_CAMPUSES if item["id"] not in existing_campus_ids)
    db.commit()

    existing_lot_ids = set(db.scalars(select(ParkingLot.id)).all())
    db.add_all(ParkingLot(**item) for item in SEED_LOTS if item["id"] not in existing_lot_ids)
    db.commit()

    existing_spot_ids = set(db.scalars(select(ParkingSpot.id)).all())
    db.add_all(spot for spot in load_seed_spots() if spot.id not in existing_spot_ids)
    db.commit()


def init_database() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
