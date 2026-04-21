from __future__ import annotations

import argparse

from demo_integration import DEMO_API_BASE_URL, publish_demo_payload


TEST_PATTERNS: dict[str, list[int]] = {
    "all-free": [0, 0, 0, 0, 0, 0, 0, 0],
    "all-full": [1, 1, 1, 1, 1, 1, 1, 1],
    "alternate": [1, 0, 1, 0, 1, 0, 1, 0],
    "first-half": [1, 1, 1, 1, 0, 0, 0, 0],
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Send a manual 8-spot test payload to the UniView demo backend.")
    parser.add_argument(
        "--pattern",
        choices=sorted(TEST_PATTERNS.keys()),
        default="alternate",
        help="Named occupancy pattern to send.",
    )
    parser.add_argument(
        "--api-base-url",
        default=DEMO_API_BASE_URL,
        help="Backend base URL, for example http://172.20.10.6:8000",
    )
    parser.add_argument(
        "--device-id",
        default="manual-demo-test",
        help="Device ID to include in the ingest payload.",
    )
    parser.add_argument(
        "--no-local-backup",
        action="store_true",
        help="Skip writing the local JSON backup file.",
    )
    args = parser.parse_args()

    occupancy = TEST_PATTERNS[args.pattern]
    response = publish_demo_payload(
        occupancy,
        device_id=args.device_id,
        api_base_url=args.api_base_url,
        write_local_backup=not args.no_local_backup,
    )
    print(f"Posted '{args.pattern}' pattern to {args.api_base_url}")
    print(f"Occupancy: {occupancy}")
    print(f"Backend response: {response}")


if __name__ == "__main__":
    main()
