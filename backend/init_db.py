from __future__ import annotations

from backend.db import init_database


def main() -> None:
    init_database()
    print("Database initialized and seed data inserted.")


if __name__ == "__main__":
    main()
