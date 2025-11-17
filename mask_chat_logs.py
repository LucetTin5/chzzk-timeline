#!/usr/bin/env python3
"""
Mask sensitive information inside chat log files.

Usage:
    python scripts/mask_chat_logs.py \
        --source chat_logs \
        --dest chat_logs_deploy

All nicknames are replaced with "<>" and any e‑mail address or phone number
inside the message body is also replaced with "<>".
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Iterable


EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
# Simple phone pattern that matches common international / hyphenated numbers.
PHONE_RE = re.compile(
    r"""
    (?:
        (?<!\d)                # no digit directly before
        (?:\+?\d{1,3}[\s.-]?)? # optional country code
        (?:\d{2,4}[\s.-]?){2,3}
        \d{2,4}
        (?!\d)                 # no digit directly after
    )
    """,
    re.VERBOSE,
)
HASH_TRAILING_RE = re.compile(r"\s*\([0-9a-fA-F]{8,}\)\s*$")


def mask_personal_info(text: str) -> str:
    """Replace emails and phone numbers with '<>'."""
    masked = EMAIL_RE.sub("<>", text)
    masked = PHONE_RE.sub("<>", masked)
    return masked


def strip_trailing_hash(text: str) -> str:
    """Remove trailing hash-like tokens in parentheses."""
    return HASH_TRAILING_RE.sub("", text)


def mask_line(line: str) -> str:
    """Mask a single chat line."""
    stripped = line.rstrip("\n")
    if not stripped.startswith("["):
        return mask_personal_info(stripped).strip() + "\n"

    end_idx = stripped.find("]")
    if end_idx == -1:
        return mask_personal_info(stripped) + "\n"

    prefix = stripped[: end_idx + 1]
    remainder = stripped[end_idx + 1 :]
    if ":" not in remainder:
        masked_body = mask_personal_info(strip_trailing_hash(remainder))
        return f"{prefix} {masked_body}\n" if masked_body else f"{prefix}\n"

    _, _, after_colon = remainder.partition(":")
    message = mask_personal_info(strip_trailing_hash(after_colon))
    if message:
        return f"{prefix} {message}\n"

    return f"{prefix}\n"


def iter_log_files(root: Path) -> Iterable[Path]:
    for path in sorted(p for p in root.rglob("*") if p.is_file()):
        yield path


def process_logs(source: Path, dest: Path) -> None:
    if not source.exists() or not source.is_dir():
        raise SystemExit(f"Source directory '{source}' does not exist")

    dest.mkdir(parents=True, exist_ok=True)

    for file_path in iter_log_files(source):
        relative = file_path.relative_to(source)
        target = dest / relative
        target.parent.mkdir(parents=True, exist_ok=True)

        if target.exists():
            continue

        with (
            file_path.open("r", encoding="utf-8", errors="ignore") as src,
            target.open("w", encoding="utf-8", newline="") as dst,
        ):
            for raw_line in src:
                dst.write(mask_line(raw_line))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Mask sensitive info in chat logs.")
    parser.add_argument(
        "--source",
        type=Path,
        default=Path("chat_logs"),
        help="Directory containing original chat logs (default: chat_logs)",
    )
    parser.add_argument(
        "--dest",
        type=Path,
        default=Path("chat_logs_deploy"),
        help="Output directory for masked logs (default: chat_logs_deploy)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    process_logs(args.source, args.dest)
    print(f"Masked logs written to: {args.dest.resolve()}")


if __name__ == "__main__":
    main()
