"""Tests for mailer.richtext - inline HTML sanitization/rendering."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from mailer.testing_support import make_patient  # noqa: F401  (sets env var)


class RichTextTests(unittest.TestCase):
    def test_sanitize_keeps_only_whitelisted_tags(self) -> None:
        from mailer.richtext import sanitize_inline_html

        raw = '<script>alert(1)</script><b onclick="x()">Bold</b> & <i>ok</i>'
        safe = sanitize_inline_html(raw)
        self.assertNotIn("<script", safe)
        self.assertNotIn("onclick", safe)
        self.assertIn("<b>Bold</b>", safe)
        self.assertIn("<i>ok</i>", safe)
        self.assertIn("&amp;", safe)

    def test_strip_tags_for_plain_text(self) -> None:
        from mailer.richtext import strip_tags

        self.assertEqual(strip_tags("<b>Bold</b> and <i>italic</i>."), "Bold and italic.")
        self.assertEqual(strip_tags("Line one<br>Line two"), "Line one\nLine two")

    def test_render_html_keeps_formatting_render_plain_does_not(self) -> None:
        from mailer.campaigns import save_campaign
        from mailer.emailing import render_html, render_plain

        payload = {
            "id": "trial",
            "label": "Trial",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {
                    "id": "one",
                    "delay": "0m",
                    "subject": "Hi",
                    "body": ["Thanks for <b>choosing</b> <i>Beema</i> <u>Health</u>."],
                }
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            campaign = save_campaign(payload, Path(tmp))
            patient = make_patient(first_name="Stacy")
            step = campaign.steps[0]
            html = render_html(patient, step, campaign.cta_url, year=2026)
            self.assertIn("<b>choosing</b>", html)
            self.assertIn("<i>Beema</i>", html)
            self.assertIn("<u>Health</u>", html)
            text = render_plain(patient, step, campaign.cta_url, year=2026)
            self.assertNotIn("<b>", text)
            self.assertIn("Thanks for choosing Beema Health.", text)

    def test_sanitize_keeps_lists_and_strikethrough(self) -> None:
        from mailer.richtext import sanitize_inline_html

        safe = sanitize_inline_html("<ul><li>One</li><li>Two</li></ul><s>gone</s>")
        self.assertIn("<ul><li>One</li><li>Two</li></ul>", safe)
        self.assertIn("<s>gone</s>", safe)

    def test_sanitize_keeps_safe_link_drops_unsafe_scheme(self) -> None:
        from mailer.richtext import sanitize_inline_html

        safe = sanitize_inline_html('Go <a href="https://beemahealth.com">here</a>.')
        self.assertIn('<a href="https://beemahealth.com">here</a>', safe)

        unsafe = sanitize_inline_html('<a href="javascript:alert(1)" onclick="x()">click</a>')
        self.assertNotIn("<a", unsafe)
        self.assertNotIn("javascript:", unsafe)
        self.assertIn("click", unsafe)

    def test_strip_tags_renders_link_and_list_item_plainly(self) -> None:
        from mailer.richtext import strip_tags

        text = strip_tags('Go <a href="https://beemahealth.com">here</a>.')
        self.assertEqual(text, "Go here (https://beemahealth.com).")
        items = strip_tags("<ul><li>One</li><li>Two</li></ul>")
        self.assertEqual(items, "- One\n- Two\n")

    def test_render_html_wraps_list_in_div_and_styles_links(self) -> None:
        from mailer.campaigns import save_campaign
        from mailer.emailing import LINK_BLUE, render_html, render_plain

        payload = {
            "id": "trial-rich",
            "label": "Trial",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {
                    "id": "one",
                    "delay": "0m",
                    "subject": "Hi",
                    "body": [
                        "See <a href=\"https://beemahealth.com\">our site</a>.",
                        "<ul><li>First</li><li>Second</li></ul>",
                    ],
                }
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            campaign = save_campaign(payload, Path(tmp))
            patient = make_patient(first_name="Stacy")
            step = campaign.steps[0]
            html = render_html(patient, step, campaign.cta_url, year=2026)
            self.assertIn(f'style="color:{LINK_BLUE}', html)
            self.assertIn("<div", html)
            self.assertIn("<ul><li>First</li><li>Second</li></ul>", html)
            text = render_plain(patient, step, campaign.cta_url, year=2026)
            self.assertIn("our site (https://beemahealth.com)", text)
            self.assertIn("- First", text)


