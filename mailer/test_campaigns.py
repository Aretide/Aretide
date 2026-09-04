"""Tests for mailer.campaigns - loading, saving, versioning, buttons, placeholders."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from mailer.campaigns import load_campaigns
from mailer.testing_support import make_patient  # noqa: F401  (sets env var)


class CampaignTests(unittest.TestCase):
    def test_loads_json_campaigns(self) -> None:
        campaigns = load_campaigns()
        self.assertIn("abandoned", campaigns)
        self.assertIn("marketing", campaigns)
        self.assertIn("checkin", campaigns)


    def test_step_body_joins_paragraphs(self) -> None:
        from mailer.campaigns import normalize_body, step_body

        self.assertEqual(
            step_body({"body": ["Hello.", "Second paragraph."]}),
            "Hello.\n\nSecond paragraph.",
        )
        self.assertEqual(step_body({"body": "Already a string."}), "Already a string.")
        dumped = str(["Hello {first_name}.", "Second paragraph."])
        self.assertEqual(
            normalize_body(dumped),
            "Hello {first_name}.\n\nSecond paragraph.",
        )


    def test_prod_hides_unready_campaigns(self) -> None:
        from dataclasses import replace
        from mailer.campaigns import load_campaigns, visible_campaigns

        ready = replace(load_campaigns()["abandoned"], ready=True)
        draft = replace(ready, id="draft", ready=False)
        mixed = {ready.id: ready, "draft": draft}
        prod = visible_campaigns(mixed, "prod")
        self.assertNotIn("draft", prod)
        self.assertIn(ready.id, prod)
        self.assertIn("draft", visible_campaigns(mixed, "dev"))

    def test_set_campaign_ready_writes_json(self) -> None:
        from mailer.campaigns import load_campaigns, set_campaign_ready

        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / "trial.json").write_text(
                '{"id":"trial","label":"Trial","steps":[]}\n',
                encoding="utf-8",
            )
            campaign = set_campaign_ready("trial", True, folder)
            self.assertTrue(campaign.ready)
            self.assertTrue(load_campaigns(folder)["trial"].ready)




class CampaignVersioningTests(unittest.TestCase):
    def test_save_bumps_campaign_and_step_versions(self) -> None:
        from mailer.campaigns import campaign_history, save_campaign

        payload = {
            "id": "trial",
            "label": "Trial",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {"id": "one", "delay": "0m", "subject": "Hi", "body": ["Hello."]},
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            campaign = save_campaign(payload, directory)
            self.assertEqual(campaign.version, 1)
            self.assertEqual(campaign.steps[0].version, 1)

            # No-op re-save: neither campaign nor step version moves.
            unchanged = save_campaign(payload, directory)
            self.assertEqual(unchanged.version, 2)
            self.assertEqual(unchanged.steps[0].version, 1)

            # Changing the step body bumps that step, and the campaign.
            payload["steps"][0]["body"] = ["Hello there."]
            payload["steps"].append(
                {"id": "two", "delay": "1h", "subject": "Follow up", "body": ["More."]}
            )
            changed = save_campaign(payload, directory)
            self.assertEqual(changed.version, 3)
            self.assertEqual(changed.step_by_id("one").version, 2)
            self.assertEqual(changed.step_by_id("two").version, 1)

            history = campaign_history("trial", directory)
            self.assertEqual(len(history), 3)
            self.assertEqual(history[0]["version"], 1)
            self.assertEqual(history[1]["version"], 2)
            self.assertEqual(history[2]["version"], 3)

    def test_history_is_append_only(self) -> None:
        from mailer.campaigns import history_path, save_campaign

        payload = {
            "id": "trial",
            "label": "Trial",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [{"id": "one", "delay": "0m", "subject": "Hi", "body": ["Hello."]}],
        }
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            save_campaign(payload, directory)
            path = history_path("trial", directory)
            first_line = path.read_text(encoding="utf-8").splitlines()[0]
            payload["label"] = "Trial (renamed label)"
            save_campaign(payload, directory)
            lines = path.read_text(encoding="utf-8").splitlines()
            self.assertEqual(len(lines), 2)
            self.assertEqual(lines[0], first_line)

    def test_delete_then_recreate_keeps_counting_versions(self) -> None:
        from mailer.campaigns import delete_campaign, save_campaign

        payload = {
            "id": "trial",
            "label": "Trial",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [{"id": "one", "delay": "0m", "subject": "Hi", "body": ["Hello."]}],
        }
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            save_campaign(payload, directory)
            save_campaign(payload, directory)
            delete_campaign("trial", directory)
            recreated = save_campaign(payload, directory)
            self.assertEqual(recreated.version, 3)

    def test_invalid_step_json_rejected(self) -> None:
        from mailer.campaigns import normalize_campaign

        base = {
            "id": "trial",
            "label": "Trial",
            "cta_url": "https://hive.beemahealth.com",
        }
        with self.assertRaises(ValueError):
            normalize_campaign({**base, "steps": [{"id": "one", "delay": "bogus", "subject": "Hi", "body": ["Hi."]}]})
        with self.assertRaises(ValueError):
            normalize_campaign({**base, "steps": [{"id": "one", "delay": "0m", "subject": "", "body": ["Hi."]}]})
        with self.assertRaises(ValueError):
            normalize_campaign({**base, "steps": [{"id": "one", "delay": "0m", "subject": "Hi", "body": "not a list"}]})
        with self.assertRaises(ValueError):
            normalize_campaign({**base, "steps": []})




class StepButtonTests(unittest.TestCase):
    def test_buttons_round_trip_through_save_and_load(self) -> None:
        from mailer.campaigns import load_campaigns, save_campaign

        payload = {
            "id": "trial-buttons",
            "label": "Trial",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {
                    "id": "one",
                    "delay": "0m",
                    "subject": "Hi",
                    "body": ["Intro text.", "[[button:0]]", "More text after."],
                    "buttons": [
                        {
                            "label": "Click me",
                            "url": "https://beemahealth.com",
                            "align": "right",
                            "bg": "#112233",
                            "color": "#ffffff",
                        },
                    ],
                }
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            campaign = save_campaign(payload, directory)
            step = campaign.step_by_id("one")
            self.assertEqual(len(step.buttons), 1)
            self.assertEqual(step.buttons[0]["label"], "Click me")
            self.assertEqual(step.buttons[0]["url"], "https://beemahealth.com")
            self.assertEqual(step.buttons[0]["align"], "right")
            self.assertEqual(step.buttons[0]["bg"], "#112233")
            self.assertEqual(step.buttons[0]["color"], "#ffffff")
            self.assertIn("[[button:0]]", step.body_parts)

            reloaded = load_campaigns(directory)["trial-buttons"]
            reloaded_step = reloaded.step_by_id("one")
            self.assertEqual(len(reloaded_step.buttons), 1)
            self.assertEqual(reloaded_step.buttons[0]["label"], "Click me")
            self.assertEqual(reloaded_step.buttons[0]["align"], "right")
            self.assertEqual(reloaded_step.buttons[0]["bg"], "#112233")
            self.assertEqual(reloaded_step.buttons[0]["color"], "#ffffff")
            self.assertIn("[[button:0]]", reloaded_step.body_parts)

    def test_render_html_positions_button_inline_with_its_own_colors(self) -> None:
        from mailer.campaigns import save_campaign
        from mailer.emailing import render_html

        payload = {
            "id": "trial-buttons-render",
            "label": "Trial",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {
                    "id": "one",
                    "delay": "0m",
                    "subject": "Hi",
                    "body": ["Intro text.", "[[button:0]]", "More text after."],
                    "buttons": [
                        {
                            "label": "Click me",
                            "url": "https://beemahealth.com",
                            "align": "right",
                            "bg": "#112233",
                            "color": "#ffffff",
                        },
                    ],
                }
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            campaign = save_campaign(payload, Path(tmp))
            patient = make_patient(first_name="Stacy")
            step = campaign.steps[0]
            html = render_html(patient, step, campaign.cta_url, year=2026)
            self.assertIn('bgcolor="#112233"', html)
            self.assertIn("color:#ffffff;", html)
            self.assertIn('align="right"', html)
            self.assertIn("Click me", html)

            intro_pos = html.index("Intro text.")
            button_pos = html.index('<a href="https://beemahealth.com"')
            more_pos = html.index("More text after.")
            self.assertLess(intro_pos, button_pos)
            self.assertLess(button_pos, more_pos)

    def test_render_html_button_defaults_when_unstyled(self) -> None:
        from mailer.campaigns import save_campaign
        from mailer.emailing import BRAND_YELLOW, INK, render_html

        payload = {
            "id": "trial-buttons-default",
            "label": "Trial",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {
                    "id": "one",
                    "delay": "0m",
                    "subject": "Hi",
                    "body": ["Hello.", "[[button:0]]"],
                    "buttons": [
                        {"label": "See pricing", "url": "https://beemahealth.com/pricing/"},
                    ],
                }
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            campaign = save_campaign(payload, Path(tmp))
            patient = make_patient(first_name="Stacy")
            step = campaign.steps[0]
            html = render_html(patient, step, campaign.cta_url, year=2026)
            self.assertEqual(html.count(f'bgcolor="{BRAND_YELLOW}"'), 1)
            self.assertEqual(
                html.count(f"font-weight:bold;color:{INK};text-decoration:none;"), 1
            )
            self.assertIn('align="center"', html)

    def test_button_token_embedded_in_paragraph_still_renders(self) -> None:
        from mailer.campaigns import CampaignStep, parse_delay
        from mailer.emailing import render_html, render_plain

        # A token left inline by a mid-paragraph insert, not on its own line.
        step = CampaignStep(
            id="one",
            delay=parse_delay("0m"),
            subject="Hi",
            body="Read this. [[button:0]] Then keep reading.",
            cta_label="Continue",
            buttons=({"label": "Open portal", "url": "https://hive.beemahealth.com"},),
        )
        patient = make_patient(first_name="Stacy")
        html = render_html(patient, step, "", year=2026)
        text = render_plain(patient, step, "", year=2026)
        self.assertNotIn("[[button:0]]", html)
        self.assertNotIn("[[button:0]]", text)
        self.assertIn('href="https://hive.beemahealth.com"', html)
        self.assertIn("Open portal: https://hive.beemahealth.com", text)
        self.assertIn("Read this.", html)
        self.assertIn("Then keep reading.", html)

    def test_button_token_with_no_matching_button_is_dropped(self) -> None:
        from mailer.campaigns import CampaignStep, parse_delay
        from mailer.emailing import render_html, render_plain

        step = CampaignStep(
            id="one",
            delay=parse_delay("0m"),
            subject="Hi",
            body="Hello there.\n\n[[button:3]]",
            cta_label="Continue",
            buttons=(),
        )
        patient = make_patient(first_name="Stacy")
        html = render_html(patient, step, "", year=2026)
        text = render_plain(patient, step, "", year=2026)
        self.assertNotIn("[[button:3]]", html)
        self.assertNotIn("[[button:3]]", text)
        self.assertIn("Hello there.", html)

    def test_render_plain_positions_button_between_paragraphs(self) -> None:
        from mailer.campaigns import save_campaign
        from mailer.emailing import render_plain

        payload = {
            "id": "trial-buttons-plain",
            "label": "Trial",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {
                    "id": "one",
                    "delay": "0m",
                    "subject": "Hi",
                    "body": ["Intro text.", "[[button:0]]", "More text after."],
                    "buttons": [
                        {"label": "Click me", "url": "https://beemahealth.com"},
                    ],
                }
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            campaign = save_campaign(payload, Path(tmp))
            patient = make_patient(first_name="Stacy")
            step = campaign.steps[0]
            text = render_plain(patient, step, campaign.cta_url, year=2026)
            intro_pos = text.index("Intro text.")
            button_pos = text.index("Click me: https://beemahealth.com")
            more_pos = text.index("More text after.")
            self.assertLess(intro_pos, button_pos)
            self.assertLess(button_pos, more_pos)

    def test_button_with_invalid_hex_color_is_rejected(self) -> None:
        from mailer.campaigns import save_campaign

        payload = {
            "id": "trial-bad-button-color",
            "label": "Trial",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {
                    "id": "one",
                    "delay": "0m",
                    "subject": "Hi",
                    "body": ["Hello.", "[[button:0]]"],
                    "buttons": [
                        {"label": "Click me", "url": "https://beemahealth.com", "bg": "red"},
                    ],
                }
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError):
                save_campaign(payload, Path(tmp))

    def test_button_with_invalid_align_is_rejected(self) -> None:
        from mailer.campaigns import save_campaign

        payload = {
            "id": "trial-bad-button-align",
            "label": "Trial",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {
                    "id": "one",
                    "delay": "0m",
                    "subject": "Hi",
                    "body": ["Hello.", "[[button:0]]"],
                    "buttons": [
                        {
                            "label": "Click me",
                            "url": "https://beemahealth.com",
                            "align": "middle",
                        },
                    ],
                }
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError):
                save_campaign(payload, Path(tmp))

    def test_button_with_invalid_scheme_is_rejected(self) -> None:
        from mailer.campaigns import save_campaign

        payload = {
            "id": "trial-bad-button",
            "label": "Trial",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {
                    "id": "one",
                    "delay": "0m",
                    "subject": "Hi",
                    "body": ["Hello."],
                    "buttons": [
                        {"label": "Click me", "url": "javascript:alert(1)"},
                    ],
                }
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError):
                save_campaign(payload, Path(tmp))

    def test_more_than_five_buttons_is_rejected(self) -> None:
        from mailer.campaigns import normalize_campaign

        payload = {
            "id": "trial-too-many-buttons",
            "label": "Trial",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {
                    "id": "one",
                    "delay": "0m",
                    "subject": "Hi",
                    "body": ["Hello."],
                    "buttons": [
                        {"label": f"Button {i}", "url": "https://beemahealth.com/"}
                        for i in range(6)
                    ],
                }
            ],
        }
        with self.assertRaises(ValueError):
            normalize_campaign(payload)

    def test_no_auto_cta_button_when_step_has_no_buttons(self) -> None:
        from mailer.campaigns import save_campaign
        from mailer.emailing import render_html, render_plain

        payload = {
            "id": "no-auto-cta",
            "label": "No Auto CTA",
            "cta_url": "https://hive.beemahealth.com",
            "cta_label": "Continue",
            "steps": [
                {"id": "one", "delay": "0m", "subject": "Hi", "body": ["Thanks."]}
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            campaign = save_campaign(payload, Path(tmp))
            patient = make_patient(first_name="Stacy")
            step = campaign.steps[0]
            html = render_html(patient, step, campaign.cta_url, year=2026)
            text = render_plain(patient, step, campaign.cta_url, year=2026)
            self.assertNotIn("hive.beemahealth.com", html)
            self.assertNotIn("hive.beemahealth.com", text)
            self.assertNotIn("Continue", html)
            self.assertNotIn("Continue: ", text)

    def test_with_utm_content_appends_and_replaces(self) -> None:
        from mailer.campaigns import with_utm_content

        self.assertEqual(
            with_utm_content(
                "https://hive.beemahealth.com/?utm_source=beema_email"
                "&utm_medium=email&utm_campaign=abandoned_checkout",
                "10m",
            ),
            "https://hive.beemahealth.com/?utm_source=beema_email&utm_medium=email"
            "&utm_campaign=abandoned_checkout&utm_content=10m",
        )
        self.assertEqual(
            with_utm_content("https://x.com/?utm_content=old", "1h"),
            "https://x.com/?utm_content=1h",
        )
        self.assertEqual(with_utm_content("", "10m"), "")

    def test_urlless_button_uses_campaign_cta_link_with_step_utm(self) -> None:
        from mailer.campaigns import save_campaign
        from mailer.emailing import render_html, render_plain

        payload = {
            "id": "cta-default",
            "label": "CTA default",
            "cta_url": "https://hive.beemahealth.com/?utm_source=beema_email",
            "steps": [
                {
                    "id": "10m",
                    "delay": "10m",
                    "subject": "Hi",
                    "body": ["Come back.", "[[button:0]]"],
                    "buttons": [{"label": "Continue your visit"}],
                },
                {
                    "id": "1h",
                    "delay": "1h",
                    "subject": "Hi",
                    "body": ["x", "[[button:0]]"],
                    "cta_url": "https://special.example.com/",
                    "buttons": [{"label": "Pick up"}],
                },
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            campaign = save_campaign(payload, Path(tmp))
            patient = make_patient()
            html0 = render_html(patient, campaign.steps[0], campaign.cta_url, year=2026)
            text0 = render_plain(patient, campaign.steps[0], campaign.cta_url, year=2026)
            self.assertIn(
                "https://hive.beemahealth.com/?utm_source=beema_email"
                "&amp;utm_content=10m",
                html0,
            )
            self.assertIn(
                "https://hive.beemahealth.com/?utm_source=beema_email"
                "&utm_content=10m",
                text0,
            )
            html1 = render_html(patient, campaign.steps[1], campaign.cta_url, year=2026)
            self.assertIn("https://special.example.com/?utm_content=1h", html1)

    def test_button_with_explicit_url_is_untouched(self) -> None:
        from mailer.campaigns import save_campaign
        from mailer.emailing import render_html

        payload = {
            "id": "cta-explicit",
            "label": "CTA explicit",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {
                    "id": "one",
                    "delay": "0m",
                    "subject": "Hi",
                    "body": ["x", "[[button:0]]"],
                    "buttons": [
                        {"label": "Go", "url": "https://exact.example.com/cart?keep=1"}
                    ],
                }
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            campaign = save_campaign(payload, Path(tmp))
            html = render_html(
                make_patient(), campaign.steps[0], campaign.cta_url, year=2026
            )
            self.assertIn('href="https://exact.example.com/cart?keep=1"', html)
            self.assertNotIn("utm_content", html)

    def test_urlless_button_without_a_base_link_is_rejected(self) -> None:
        from mailer.campaigns import normalize_campaign

        payload = {
            "id": "cta-missing",
            "label": "No base",
            "steps": [
                {
                    "id": "one",
                    "delay": "0m",
                    "subject": "Hi",
                    "body": ["x", "[[button:0]]"],
                    "buttons": [{"label": "Go"}],
                }
            ],
        }
        with self.assertRaises(ValueError):
            normalize_campaign(payload)

    def test_validate_url_accepts_and_rejects_schemes(self) -> None:
        from mailer.richtext import validate_url

        self.assertEqual(
            validate_url("https://beemahealth.com"), "https://beemahealth.com"
        )
        self.assertEqual(
            validate_url("mailto:support@beemahealth.com"),
            "mailto:support@beemahealth.com",
        )
        self.assertIsNone(validate_url("javascript:alert(1)"))




class PlaceholderTests(unittest.TestCase):
    def test_support_email_is_builtin_no_declaration_needed(self) -> None:
        from mailer.campaigns import save_campaign
        from mailer.emailing import fill

        payload = {
            "id": "support-builtin",
            "label": "Support builtin",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {
                    "id": "one",
                    "delay": "0m",
                    "subject": "Questions?",
                    "body": ["Email us at {support_email} any time."],
                }
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            campaign = save_campaign(payload, Path(tmp))
            self.assertEqual(campaign.extras, {})
            step = campaign.steps[0]
            filled = fill(step.body, make_patient(), campaign.extras)
            self.assertIn("support@beemahealth.com", filled)

    def test_support_email_cannot_be_overridden_by_a_campaign(self) -> None:
        from mailer.campaigns import save_campaign
        from mailer.emailing import fill

        payload = {
            "id": "support-override",
            "label": "Support override",
            "cta_url": "https://hive.beemahealth.com",
            "placeholders": {"support_email": "evil@example.com"},
            "steps": [
                {"id": "one", "delay": "0m", "subject": "Hi", "body": ["Reach {support_email}."]}
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            campaign = save_campaign(payload, Path(tmp))
            # The bogus override is stripped, not stored.
            self.assertNotIn("support_email", campaign.extras)
            filled = fill(campaign.steps[0].body, make_patient(), campaign.extras)
            self.assertIn("support@beemahealth.com", filled)
            self.assertNotIn("evil@example.com", filled)

    def test_unknown_placeholder_still_rejected(self) -> None:
        from mailer.campaigns import normalize_campaign

        payload = {
            "id": "bad-var",
            "label": "Bad var",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {"id": "one", "delay": "0m", "subject": "Hi {mystery}", "body": ["x"]}
            ],
        }
        with self.assertRaises(ValueError):
            normalize_campaign(payload)

    def test_placeholders_tab_explains_every_builtin(self) -> None:
        from mailer.testing_support import dashboard_html

        html = dashboard_html()
        start = html.index("const VAR_HELP = {")
        var_help = html[start:html.index("function campaignPlaceholdersTabHtml", start)]
        # Every built-in has help data: what it is, example values, usage examples.
        for name in ("first_name", "email", "interest", "product", "support_email"):
            self.assertIn(name + ":", var_help)
            self.assertIn("{" + name + "}", var_help)
        self.assertIn("recipient", var_help.lower())
        self.assertIn("support@beemahealth.com", var_help)
        # interest carries several distinct example values.
        self.assertIn("becomes:", var_help)
        self.assertIn("usage:", var_help)
        # The "?" popup and its opener are wired up.
        self.assertIn("function openVarHelp", html)
        self.assertIn('id="sheet-var-help"', html)
        self.assertIn('class="var-help-btn"', html)
        self.assertIn("Built-in variables", html)


