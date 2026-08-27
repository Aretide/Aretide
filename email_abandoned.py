#!/usr/bin/env python3
"""Compatibility entry point. Use email_patients.py going forward."""

from mailer.cli import main

if __name__ == "__main__":
    raise SystemExit(main())
