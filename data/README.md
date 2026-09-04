# Mailer patient lists

This folder is local-only. Patient JSON is gitignored.

- `dev/patients.json` - test patients
- `prod/patients.json` - real patients
- `mode.txt` - last selected mode (dev or prod)

Campaign copy lives in `campaigns/` and is shared by both modes. After a campaign looks right in Dev, set `"ready": true` (or check Ready for prod in the dashboard) so Prod will send it.
