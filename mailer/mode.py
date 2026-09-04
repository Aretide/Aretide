"""Local Dev vs Prod patient lists. Campaign copy stays shared."""

from __future__ import annotations

import shutil
from pathlib import Path

from mailer.crypto import ROOT

DATA_DIR = ROOT / "data"
LEGACY_PATIENTS = ROOT / "patients.json"
MODES = ("dev", "prod")


def normalize_mode(value: str | None) -> str:
    text = (value or "").strip().lower()
    if text in {"prod", "production"}:
        return "prod"
    return "dev"


def mode_file(data_dir: Path = DATA_DIR) -> Path:
    return data_dir / "mode.txt"


def patients_path(mode: str, data_dir: Path = DATA_DIR) -> Path:
    path = data_dir / normalize_mode(mode) / "patients.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def read_mode(data_dir: Path = DATA_DIR) -> str:
    path = mode_file(data_dir)
    if path.is_file():
        return normalize_mode(path.read_text(encoding="utf-8"))
    return "dev"


def write_mode(mode: str, data_dir: Path = DATA_DIR) -> str:
    mode = normalize_mode(mode)
    path = mode_file(data_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(mode + "\n", encoding="utf-8")
    return mode


def migrate_legacy_patients(
    data_dir: Path = DATA_DIR,
    legacy: Path = LEGACY_PATIENTS,
) -> None:
    """If only the old root patients.json exists, copy it into Dev so current work keeps going."""
    (data_dir / "dev").mkdir(parents=True, exist_ok=True)
    (data_dir / "prod").mkdir(parents=True, exist_ok=True)
    dev = data_dir / "dev" / "patients.json"
    prod = data_dir / "prod" / "patients.json"
    if legacy.is_file() and not dev.is_file() and not prod.is_file():
        shutil.copy2(legacy, dev)
