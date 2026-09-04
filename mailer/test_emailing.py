"""Tests for mailer.emailing - HTML/plain rendering, header/footer, greeting/closing."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from mailer.campaigns import load_campaigns
from mailer.testing_support import make_patient


class EmailingTests(unittest.TestCase):
    def test_html_uses_lockup_and_name(self) -> None:
        from mailer.emailing import render_html

        patient = make_patient()
        step = load_campaigns()["abandoned"].steps[0]
        html = render_html(patient, step, "https://hive.beemahealth.com", year=2026)
        self.assertIn("Hey Alex,", html)
        self.assertIn("cid:beema-lockup", html)
        self.assertIn('<img src="cid:beema-lockup" alt="Beema Health" width="600"', html)
        self.assertIn("width:100%", html)
        self.assertNotIn("\u2014", html)

    def test_message_has_inline_mark_and_bimi_headers(self) -> None:
        from mailer.emailing import (
            BIMI_SVG_PATH,
            BIMI_TXT_VALUE,
            brand_from_header,
            build_message,
            yahoo_recipient,
        )

        patient = make_patient(email="alex@yahoo.com")
        step = load_campaigns()["abandoned"].steps[0]
        message = build_message(
            patient,
            step,
            "alex@yahoo.com",
            "https://hive.beemahealth.com",
            from_header="support@beemahealth.com",
            year=2026,
        )
        raw = message.as_string()
        self.assertTrue(yahoo_recipient("alex@yahoo.com"))
        self.assertFalse(yahoo_recipient("alex@gmail.com"))
        self.assertIn(
            "Beema Health <support@beemahealth.com>",
            brand_from_header("support@beemahealth.com"),
        )
        self.assertIn("From: Beema Health <support@beemahealth.com>", raw)
        self.assertIn("BIMI-Selector: v=BIMI1; s=default;", raw)
        self.assertIn(
            "List-ID: Beema Health <campaigns.beemahealth.com>",
            raw,
        )
        self.assertIn("Content-Disposition: inline", raw)
        self.assertIn("Content-ID: <beema-lockup>", raw)
        self.assertIn("cid:beema-lockup", raw)
        self.assertNotIn("yahoo.com/img", raw.lower())
        self.assertNotIn("s.yimg.com", raw.lower())
        self.assertTrue(BIMI_SVG_PATH.is_file())
        svg = BIMI_SVG_PATH.read_text(encoding="utf-8")
        self.assertIn('baseProfile="tiny-ps"', svg)
        self.assertIn('version="1.2"', svg)
        self.assertIn("<title>Beema Health</title>", svg)
        self.assertNotIn("<script", svg)
        self.assertNotIn("<image", svg)
        self.assertIn("l=https://beemahealth.com/bimi/logo.svg", BIMI_TXT_VALUE)
        self.assertLess(BIMI_SVG_PATH.stat().st_size, 32 * 1024)


    def test_html_uses_real_paragraphs_not_list_dump(self) -> None:
        from mailer.emailing import fill, render_html

        patient = make_patient(first_name="Inno")
        dumped = str(
            [
                "My name is Matt Aertker.",
                "If you have questions, write {support_email}.",
            ]
        )
        filled = fill(dumped, patient, {"support_email": "support@beemahealth.com"})
        self.assertEqual(
            filled,
            "My name is Matt Aertker.\n\n"
            "If you have questions, write support@beemahealth.com.",
        )
        self.assertNotIn("[", filled)
        campaign = load_campaigns()["post-purchase-thank-you"]
        html = render_html(
            patient,
            campaign.steps[0],
            campaign.cta_url,
            year=2026,
            extras=campaign.extras,
        )
        self.assertNotIn("['", html)
        self.assertNotIn('["', html)
        self.assertGreaterEqual(html.count("<p"), 6)


    def test_post_purchase_thank_you_copy(self) -> None:
        from mailer.emailing import fill, render_html

        campaigns = load_campaigns()
        self.assertIn("post-purchase-thank-you", campaigns)
        campaign = campaigns["post-purchase-thank-you"]
        patient = make_patient(first_name="Stacy")
        body = fill(campaign.steps[0].body, patient, campaign.extras)
        self.assertIn("support@beemahealth.com", body)
        self.assertIn("$100", body)
        self.assertIn("\n\n", body)
        self.assertGreaterEqual(body.count("\n\n"), 4)
        html = render_html(
            patient,
            campaign.steps[0],
            campaign.cta_url,
            year=2026,
            extras=campaign.extras,
        )
        self.assertIn("Leave a Google review", html)
        self.assertIn("g.page/r/", html)
        self.assertNotIn("['", html)
        self.assertIn("</p><p", html.replace("\n", "").replace(" ", ""))



class HeaderFooterToggleTests(unittest.TestCase):
    def test_show_header_false_omits_lockup(self) -> None:
        from mailer.campaigns import save_campaign
        from mailer.emailing import render_html

        payload = {
            "id": "no-header",
            "label": "No Header",
            "cta_url": "https://hive.beemahealth.com",
            "show_header": False,
            "steps": [
                {"id": "one", "delay": "0m", "subject": "Hi", "body": ["Thanks."]}
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            campaign = save_campaign(payload, Path(tmp))
            self.assertFalse(campaign.show_header)
            patient = make_patient()
            step = campaign.steps[0]
            html = render_html(
                patient,
                step,
                campaign.cta_url,
                year=2026,
                show_header=campaign.show_header,
                show_footer=campaign.show_footer,
            )
            self.assertNotIn("cid:beema-lockup", html)
            self.assertNotIn("<img", html)

    def test_show_header_default_keeps_lockup(self) -> None:
        from mailer.campaigns import save_campaign
        from mailer.emailing import render_html

        payload = {
            "id": "default-header",
            "label": "Default Header",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {"id": "one", "delay": "0m", "subject": "Hi", "body": ["Thanks."]}
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            campaign = save_campaign(payload, Path(tmp))
            self.assertTrue(campaign.show_header)
            patient = make_patient()
            step = campaign.steps[0]
            html = render_html(
                patient,
                step,
                campaign.cta_url,
                year=2026,
                show_header=campaign.show_header,
                show_footer=campaign.show_footer,
            )
            self.assertIn("cid:beema-lockup", html)

    def test_missing_logo_file_does_not_break_a_send(self) -> None:
        import mailer.emailing as emailing
        from mailer.campaigns import CampaignStep, parse_delay

        patient = make_patient()
        step = CampaignStep(
            id="one",
            delay=parse_delay("0m"),
            subject="Finish your Beema Health visit",
            body="Thanks.",
            cta_label="Continue",
        )
        original_dir = emailing.LOGO_DIR
        try:
            with tempfile.TemporaryDirectory() as empty:
                emailing.LOGO_DIR = Path(empty)
                self.assertEqual(emailing.resolve_logo(), (None, None))
                # The whole send must not abort just because the brand image
                # is gone - build the message, drop the header <img>.
                message = emailing.build_message(
                    patient,
                    step,
                    "alex@example.com",
                    "",
                    from_header="support@beemahealth.com",
                    year=2026,
                )
                raw = message.as_string()
                self.assertNotIn("cid:beema-lockup", raw)
                self.assertNotIn("<img", raw)
                self.assertIn("Finish your Beema Health visit", raw)
        finally:
            emailing.LOGO_DIR = original_dir

    def test_legacy_jpg_logo_still_works_as_fallback(self) -> None:
        import mailer.emailing as emailing

        original_dir = emailing.LOGO_DIR
        try:
            with tempfile.TemporaryDirectory() as folder:
                jpg = Path(folder) / "beema-lockup.jpg"
                jpg.write_bytes(b"\xff\xd8\xff\xe0 not a real jpeg but a file")
                emailing.LOGO_DIR = Path(folder)
                path, subtype = emailing.resolve_logo()
                self.assertEqual(path, jpg)
                self.assertEqual(subtype, "jpeg")
        finally:
            emailing.LOGO_DIR = original_dir

    def test_show_footer_false_omits_footer(self) -> None:
        from mailer.campaigns import save_campaign
        from mailer.emailing import DISCLAIMER, FOOTER_TAGLINE, render_html

        payload = {
            "id": "no-footer",
            "label": "No Footer",
            "cta_url": "https://hive.beemahealth.com",
            "show_footer": False,
            "steps": [
                {"id": "one", "delay": "0m", "subject": "Hi", "body": ["Thanks."]}
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            campaign = save_campaign(payload, Path(tmp))
            self.assertFalse(campaign.show_footer)
            patient = make_patient()
            step = campaign.steps[0]
            html = render_html(
                patient,
                step,
                campaign.cta_url,
                year=2026,
                show_header=campaign.show_header,
                show_footer=campaign.show_footer,
            )
            self.assertNotIn(DISCLAIMER, html)
            self.assertNotIn(FOOTER_TAGLINE, html)

    def test_show_footer_default_keeps_footer(self) -> None:
        from mailer.campaigns import save_campaign
        from mailer.emailing import DISCLAIMER, FOOTER_TAGLINE, render_html

        payload = {
            "id": "default-footer",
            "label": "Default Footer",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {"id": "one", "delay": "0m", "subject": "Hi", "body": ["Thanks."]}
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            campaign = save_campaign(payload, Path(tmp))
            self.assertTrue(campaign.show_footer)
            patient = make_patient()
            step = campaign.steps[0]
            html = render_html(
                patient,
                step,
                campaign.cta_url,
                year=2026,
                show_header=campaign.show_header,
                show_footer=campaign.show_footer,
            )
            self.assertIn(DISCLAIMER, html)
            self.assertIn(FOOTER_TAGLINE, html)

    def test_mark_icon_never_present(self) -> None:
        from mailer.emailing import render_html

        patient = make_patient()
        step = load_campaigns()["abandoned"].steps[0]
        for show_header, show_footer in (
            (True, True),
            (False, True),
            (True, False),
            (False, False),
        ):
            html = render_html(
                patient,
                step,
                "https://hive.beemahealth.com",
                year=2026,
                show_header=show_header,
                show_footer=show_footer,
            )
            self.assertNotIn("cid:beema-mark", html)



class GreetingClosingTests(unittest.TestCase):
    def test_custom_greeting_is_filled_in_html_and_plain(self) -> None:
        from mailer.campaigns import save_campaign
        from mailer.emailing import render_html, render_plain

        payload = {
            "id": "custom-greeting",
            "label": "Custom Greeting",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {
                    "id": "one",
                    "delay": "0m",
                    "subject": "Hi",
                    "greeting": "Hey {first_name}!!",
                    "body": ["Thanks."],
                }
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            campaign = save_campaign(payload, Path(tmp))
            patient = make_patient(first_name="Stacy")
            step = campaign.steps[0]
            self.assertEqual(step.greeting, "Hey {first_name}!!")

            html = render_html(patient, step, campaign.cta_url, year=2026)
            self.assertIn("Hey Stacy!!", html)
            self.assertNotIn("Hi Stacy,", html)

            text = render_plain(patient, step, campaign.cta_url, year=2026)
            self.assertIn("Hey Stacy!!", text)
            self.assertNotIn("Hi Stacy,", text)

    def test_default_greeting_is_hey_first_name(self) -> None:
        from mailer.campaigns import save_campaign
        from mailer.emailing import render_html, render_plain

        payload = {
            "id": "default-greeting",
            "label": "Default Greeting",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {"id": "one", "delay": "0m", "subject": "Hi", "body": ["Thanks."]}
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            campaign = save_campaign(payload, Path(tmp))
            patient = make_patient(first_name="Stacy")
            step = campaign.steps[0]
            self.assertEqual(step.greeting, "Hey {first_name},")

            html = render_html(patient, step, campaign.cta_url, year=2026)
            self.assertIn("Hey Stacy,", html)

            text = render_plain(patient, step, campaign.cta_url, year=2026)
            self.assertIn("Hey Stacy,", text)

    def test_closing_appears_when_present_and_absent_when_not(self) -> None:
        from mailer.campaigns import save_campaign
        from mailer.emailing import render_html, render_plain

        payload_with_closing = {
            "id": "with-closing",
            "label": "With Closing",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {
                    "id": "one",
                    "delay": "0m",
                    "subject": "Hi",
                    "body": ["Thanks."],
                    "closing": "Talk soon, {first_name}",
                }
            ],
        }
        payload_without_closing = {
            "id": "without-closing",
            "label": "Without Closing",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {"id": "one", "delay": "0m", "subject": "Hi", "body": ["Thanks."]}
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            with_closing = save_campaign(payload_with_closing, directory)
            without_closing = save_campaign(payload_without_closing, directory)
            patient = make_patient(first_name="Stacy")

            step = with_closing.steps[0]
            self.assertEqual(step.closing, "Talk soon, {first_name}")
            html = render_html(patient, step, with_closing.cta_url, year=2026)
            self.assertIn("Talk soon, Stacy", html)
            text = render_plain(patient, step, with_closing.cta_url, year=2026)
            self.assertIn("Talk soon, Stacy", text)
            # No always-on CTA line: the closing is the last thing before the footer.
            self.assertEqual(
                text.split("\n")[:5],
                ["Hey Stacy,", "", "Thanks.", "", "Talk soon, Stacy"],
            )

            no_closing_step = without_closing.steps[0]
            self.assertEqual(no_closing_step.closing, "")
            no_closing_text = render_plain(
                patient, no_closing_step, without_closing.cta_url, year=2026
            )
            self.assertEqual(
                no_closing_text.split("\n")[:3],
                ["Hey Stacy,", "", "Thanks."],
            )


