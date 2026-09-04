#!/usr/bin/env python3
"""Beema Health patient mailer.

    ./mailer.sh
    python3 email_patients.py --env .env.dev --mode prod --ui
"""

from mailer.cli import main

if __name__ == "__main__":
    raise SystemExit(main())
