from __future__ import annotations

import json
from pathlib import Path


def load_channels(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)
    if not isinstance(data, list):
        raise ValueError("channels.json 데이터 형식이 리스트가 아닙니다.")
    return data


def main() -> None:
    json_path = Path(__file__).with_name("channels.json")
    channels = load_channels(json_path)
    sorted_channels = sorted(
        channels,
        key=lambda channel: channel.get("follower", 0),
        # reverse=True,
    )

    for channel in sorted_channels:
        name = channel.get("name", "")
        follower = channel.get("follower", 0)
        print(f"{name}\t{follower}")


if __name__ == "__main__":
    main()
