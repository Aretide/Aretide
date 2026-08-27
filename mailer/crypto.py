"""PII encryption and YubiKey wrapping of the data key.

Patient fields are encrypted once with a data key derived from
ABANDONED_PII_KEY. A YubiKey later wraps that data key. It does not
re-encrypt each field.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import re
import secrets
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / ".env"
ENV_DEV_PATH = ROOT / ".env.dev"
YK_CHALLENGE_PATH = ROOT / "mailer_yk_challenge.bin"
YK_WRAP_PATH = ROOT / "mailer_pii.wrap"


class ConfigError(RuntimeError):
    """Missing or invalid mailer configuration."""


def load_dotenv(path: Path) -> dict[str, str]:
    loaded: dict[str, str] = {}
    if not path.is_file():
        return loaded
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        if not key:
            continue
        loaded[key] = value
        if key not in os.environ:
            os.environ[key] = value
    return loaded


def env_get(name: str, default: str = "") -> str:
    return os.environ.get(name, "").strip() or default


def default_env_path() -> Path:
    if ENV_DEV_PATH.is_file():
        return ENV_DEV_PATH
    return ENV_PATH


def pii_secret() -> str:
    secret = env_get("ABANDONED_PII_KEY") or env_get("PATIENTS_PII_KEY")
    if not secret:
        raise ConfigError(
            "ABANDONED_PII_KEY is missing. Add it to .env.dev or run the app once."
        )
    return secret


def data_key_from_secret(secret: str) -> bytes:
    return hashlib.sha256(secret.encode("utf-8")).digest()


def yubikey_slot() -> int:
    raw = env_get("ABANDONED_YK_SLOT", "2")
    if not raw.isdigit() or int(raw) not in (1, 2):
        raise ConfigError("ABANDONED_YK_SLOT must be 1 or 2.")
    return int(raw)


def yubikey_challenge() -> bytes:
    if YK_CHALLENGE_PATH.is_file():
        data = YK_CHALLENGE_PATH.read_bytes()
        if len(data) >= 16:
            return data[:64]
    challenge = secrets.token_bytes(32)
    YK_CHALLENGE_PATH.write_bytes(challenge)
    try:
        os.chmod(YK_CHALLENGE_PATH, 0o600)
    except OSError:
        pass
    return challenge


def run_yubikey_chalresp(challenge_hex: str, slot: int) -> str:
    commands = [
        ["ykchalresp", f"-{slot}", "-x", challenge_hex],
        ["ykman", "otp", "chalresp", str(slot), challenge_hex],
    ]
    last_error = "YubiKey challenge-response tools were not found."
    for command in commands:
        if shutil.which(command[0]) is None:
            continue
        try:
            completed = subprocess.run(
                command,
                check=False,
                capture_output=True,
                text=True,
                timeout=45,
            )
        except (OSError, subprocess.TimeoutExpired) as exc:
            last_error = str(exc)
            continue
        if completed.returncode == 0:
            hex_out = "".join(completed.stdout.split()).lower()
            if re.fullmatch(r"[0-9a-f]{40}", hex_out):
                return hex_out
            last_error = "YubiKey returned an unexpected response."
            continue
        last_error = (completed.stderr or completed.stdout).strip() or "YubiKey command failed."
    raise ConfigError(
        f"{last_error} Plug in the YubiKey, then install ykman or ykchalresp."
    )


def yubikey_wrap_key() -> bytes:
    slot = yubikey_slot()
    challenge = yubikey_challenge()
    print(f"Touch YubiKey (OTP slot {slot}) to unlock patient data...")
    response_hex = run_yubikey_chalresp(challenge.hex(), slot)
    return hashlib.sha256(bytes.fromhex(response_hex)).digest()


def encrypt_text(plain: str, key: bytes) -> str:
    raw = plain.encode("utf-8")
    iv = secrets.token_bytes(16)
    stream = hashlib.sha256(key + iv).digest()
    while len(stream) < len(raw):
        stream += hashlib.sha256(stream[-32:] + key).digest()
    cipher = bytes(a ^ b for a, b in zip(raw, stream, strict=False))
    tag = hmac.new(key, iv + cipher, hashlib.sha256).digest()[:16]
    return base64.urlsafe_b64encode(iv + tag + cipher).decode("ascii")


def decrypt_text(token: str, key: bytes) -> str:
    blob = base64.urlsafe_b64decode(token.encode("ascii"))
    if len(blob) < 33:
        raise ConfigError("Stored patient field is corrupt.")
    iv, tag, cipher = blob[:16], blob[16:32], blob[32:]
    expected = hmac.new(key, iv + cipher, hashlib.sha256).digest()[:16]
    if not hmac.compare_digest(tag, expected):
        raise ConfigError("Could not decrypt patient fields. Check ABANDONED_PII_KEY.")
    stream = hashlib.sha256(key + iv).digest()
    while len(stream) < len(cipher):
        stream += hashlib.sha256(stream[-32:] + key).digest()
    raw = bytes(a ^ b for a, b in zip(cipher, stream, strict=False))
    return raw.decode("utf-8")


def email_hmac(email: str, key: bytes) -> str:
    return hmac.new(
        key, email.strip().lower().encode("utf-8"), hashlib.sha256
    ).hexdigest()


def pii_key() -> bytes:
    if YK_WRAP_PATH.is_file() or env_get("ABANDONED_PII_MODE").lower() == "yubikey":
        wrap_key = yubikey_wrap_key()
        if not YK_WRAP_PATH.is_file():
            raise ConfigError("YubiKey mode is on but mailer_pii.wrap is missing.")
        secret = decrypt_text(YK_WRAP_PATH.read_text(encoding="utf-8").strip(), wrap_key)
        return data_key_from_secret(secret)
    return data_key_from_secret(pii_secret())


def try_pii_key() -> bytes | None:
    if (
        not env_get("ABANDONED_PII_KEY")
        and not env_get("PATIENTS_PII_KEY")
        and not YK_WRAP_PATH.is_file()
    ):
        return None
    try:
        return pii_key()
    except ConfigError:
        return None


def ensure_pii_key(env_path: Path, *, interactive: bool) -> None:
    if YK_WRAP_PATH.is_file() or env_get("ABANDONED_PII_KEY") or env_get("PATIENTS_PII_KEY"):
        return
    generated = secrets.token_urlsafe(32)
    os.environ["ABANDONED_PII_KEY"] = generated
    if not interactive:
        raise ConfigError("ABANDONED_PII_KEY is missing from the env file.")
    print("No ABANDONED_PII_KEY found. Generating one and appending it to")
    print(f"  {env_path}")
    with env_path.open("a", encoding="utf-8") as handle:
        handle.write(f"\nABANDONED_PII_KEY={generated}\n")


def wrap_data_key_with_yubikey(env_path: Path) -> None:
    ensure_pii_key(env_path, interactive=True)
    secret = pii_secret()
    wrap_key = yubikey_wrap_key()
    YK_WRAP_PATH.write_text(encrypt_text(secret, wrap_key) + "\n", encoding="utf-8")
    try:
        os.chmod(YK_WRAP_PATH, 0o600)
    except OSError:
        pass
    if "ABANDONED_PII_MODE" not in os.environ:
        with env_path.open("a", encoding="utf-8") as handle:
            handle.write("\nABANDONED_PII_MODE=yubikey\n")
        os.environ["ABANDONED_PII_MODE"] = "yubikey"
    print("YubiKey now wraps the data key. Patient fields were not re-encrypted.")
    print("Keep a backup of ABANDONED_PII_KEY, then you can remove it from .env.dev.")
