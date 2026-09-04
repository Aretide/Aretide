"""Tests for mailer/static/index.html - static markup assertions (no browser)."""

from __future__ import annotations

import unittest
from datetime import datetime, timedelta

from mailer.campaigns import load_campaigns
from mailer.store import campaign_summary
from mailer.testing_support import dashboard_html, make_patient


class DashboardHtmlTests(unittest.TestCase):
    def html(self) -> str:
        return dashboard_html()

    def test_static_js_ids_exist_in_markup(self) -> None:
        html = self.html()
        markup, _, script = html.partition("<script>")
        ids = set(__import__("re").findall(r'id="([^"]+)"', markup))
        needed = set(
            __import__("re").findall(r'getElementById\("([^"]+)"\)', script)
        )
        dynamic = {
            "save-patient-edit-top",
            "save-patient-edit-bottom",
            "delete-patient",
            "dup-to-prod",
            "edit-first",
            "edit-email",
            "edit-interest",
            "edit-product",
            "edit-status",
            "edit-abandoned",
            "edit-cta",
            "confirm-run-automation",
        }
        missing = needed - ids - dynamic
        self.assertFalse(missing, f"JS looks up missing ids: {missing}")

    def test_load_catches_errors(self) -> None:
        html = self.html()
        chunk = html.split("async function load()", 1)[1].split(
            "function renderRows()", 1
        )[0]
        self.assertIn("try {", chunk)
        self.assertIn("catch (err)", chunk)
        self.assertIn("showLoadError", chunk)

    def test_render_ready_returns_from_map(self) -> None:
        html = self.html()
        chunk = html.split("function renderReady()", 1)[1].split(
            "document.getElementById(\"mode-select\")", 1
        )[0]
        self.assertIn("return `<label class=\"ready-row\">", chunk)

    def test_sheets_exist_and_fullscreen_editors_are_marked(self) -> None:
        import re

        markup = self.html().split("<script>", 1)[0]
        sheet_ids = {
            "sheet-send",
            "sheet-patient",
            "sheet-campaigns-list",
            "sheet-campaign-editor",
            "sheet-ready",
            "sheet-add-patient",
        }
        for sheet_id in sheet_ids:
            self.assertIn(f'id="{sheet_id}"', markup, f"missing sheet {sheet_id}")
        fullscreen = {"sheet-patient", "sheet-campaign-editor"}
        for sheet_id in sheet_ids:
            match = re.search(
                rf'<div class="sheet-overlay" id="{sheet_id}"[^>]*>\s*'
                rf'<div class="sheet([^"]*)"',
                markup,
            )
            self.assertIsNotNone(match, f"could not find sheet card for {sheet_id}")
            has_fullscreen = "sheet-fullscreen" in match.group(1)
            self.assertEqual(
                has_fullscreen,
                sheet_id in fullscreen,
                f"{sheet_id} fullscreen class mismatch",
            )
        self.assertIn('data-board-tab="patients"', markup)
        self.assertIn('data-board-tab="sends"', markup)

    def test_no_em_dash(self) -> None:
        self.assertNotIn("\u2014", self.html())

    def test_prod_banner_exists_and_is_toggled(self) -> None:
        markup, _, script = self.html().partition("<script>")
        self.assertIn('id="prod-banner"', markup)
        self.assertIn("prod-banner", script)

    def test_campaign_summary_uses_enrolled(self) -> None:
        from mailer.store import DENVER

        now = datetime(2026, 8, 26, 9, 0, tzinfo=DENVER)
        patient = make_patient()
        summary = campaign_summary(
            patient, load_campaigns()["abandoned"], now
        )
        self.assertIn("enrolled", summary)
        self.assertIn("due_now", summary)
        self.assertIn("plan", summary)
        self.assertIn("seconds_until", summary)

    def test_campaign_summary_seconds_until_counts_down(self) -> None:
        from mailer.campaigns import campaign_from_payload
        from mailer.store import DENVER

        campaign = campaign_from_payload(
            {
                "id": "abandoned",
                "label": "Abandoned",
                "anchor": "abandoned_at",
                "cta_url": "https://hive.beemahealth.com",
                "steps": [
                    {"id": "1h", "delay": "1h", "subject": "Hi", "body": ["x"]},
                ],
            }
        )
        start = datetime(2026, 8, 26, 9, 0, tzinfo=DENVER)
        patient = make_patient(abandoned_at=start)
        patient.campaigns["abandoned"].enrolled_at = start
        # 20 minutes in: first step (1h delay) is ~40 min away.
        s = campaign_summary(patient, campaign, start + timedelta(minutes=20))
        self.assertEqual(s["seconds_until"], 40 * 60)
        self.assertFalse(s["due_now"])
        # Past due: clamped to 0.
        s2 = campaign_summary(patient, campaign, start + timedelta(hours=2))
        self.assertEqual(s2["seconds_until"], 0)
        self.assertTrue(s2["due_now"])

    def test_next_step_hint_present(self) -> None:
        html = self.html()
        self.assertIn("next-step-hint", html)
        self.assertIn("nextStepAfter", html)
        self.assertIn("updateNextStepHint", html)

    def test_patients_table_has_time_to_next_step_column(self) -> None:
        html = self.html()
        self.assertIn("<th>Time to next step</th>", html)
        self.assertIn("function nextStepCellHtml", html)
        self.assertIn("function humanDuration", html)
        self.assertIn("seconds_until", html)

    def test_patients_table_has_campaign_filter(self) -> None:
        html = self.html()
        script = html.split("<script>", 1)[1]
        self.assertIn('id="patient-filter-campaign"', html)
        self.assertIn('<option value="">All campaigns</option>', html)
        self.assertIn("function fillPatientCampaignFilter", script)
        self.assertIn("patientCampaignFilter", script)
        # Works the same in Dev and Prod: built from every known campaign, not
        # just the mode-visible (ready) ones.
        self.assertIn("state.all_campaigns || []", script)
        self.assertIn('c.id === filter && c.enrolled', script)

    def test_patients_table_shows_total_signed_up_count(self) -> None:
        html = self.html()
        script = html.split("<script>", 1)[1]
        self.assertIn('id="patient-total-count"', html)
        self.assertIn("patient-total-count", script)
        self.assertIn("signed up", script)
        # Reflects the whole list, not just what the campaign filter shows.
        self.assertIn("state.patients.length", script)

    def test_patients_table_has_automation_countdown(self) -> None:
        html = self.html()
        script = html.split("<script>", 1)[1]
        self.assertIn('id="automation-countdown"', html)
        self.assertIn("function renderAutomationCountdown", script)
        self.assertIn("function loadSchedulerStatus", script)
        self.assertIn("/api/scheduler", script)
        # Not running at all is called out explicitly, distinct from
        # "running but nothing scheduled".
        self.assertIn("not running", script)
        # Refreshed on load, on filter change, and on a timer - not just once.
        self.assertIn("loadSchedulerStatus()", script)
        self.assertIn("setInterval(loadSchedulerStatus", script)
        self.assertIn("patientCampaignFilter = event.target.value", script)
        # Ticks down to the second between polls, not just whole minutes.
        self.assertIn("function humanDurationPrecise", script)
        self.assertIn("setInterval(renderAutomationCountdown, 1000)", script)
        # load() and loadSchedulerStatus() run concurrently and both write to
        # `state` - load() must merge, not wholesale-replace, or it wipes out
        # schedulerStatus and the countdown gets stuck on "loading...".
        self.assertIn("Object.assign(state, payload)", script)
        self.assertNotIn("state = payload", script)

    def test_patient_row_has_inline_preview_and_send(self) -> None:
        html = self.html()
        script = html.split("<script>", 1)[1]
        self.assertIn("preview-patient-step", script)
        self.assertIn("send-patient-step", script)
        self.assertIn("function openStepPreview", script)
        # Preview/Send inside a row must not also open the patient editor.
        self.assertIn('event.target.closest(".next-step-actions")', script)
        self.assertIn("event.stopPropagation()", script)
        # Send reuses the shared send() flow with the row's own patient/campaign.
        self.assertIn("patient_ids: [button.dataset.patientId]", script)

    def test_campaign_editor_has_duplicate_button(self) -> None:
        html = self.html()
        script = html.split("<script>", 1)[1]
        self.assertIn('id="campaign-editor-duplicate"', html)
        self.assertIn("function duplicateCampaignEditor", script)
        self.assertIn("function uniqueDuplicateId", script)
        # Reuses the current (possibly unsaved) form state, not a server round trip.
        self.assertIn("collectCampaignPayload(root)", script)
        self.assertIn('{ isNew: true, keepTab: "details" }', script)
        # A duplicate can never go live before review.
        self.assertIn("payload.ready = false", script)
        self.assertIn("payload.schedule.enabled = false", script)

    def test_prod_banner_has_dismiss_button(self) -> None:
        html = self.html()
        self.assertIn('id="prod-banner-close"', html)
        self.assertIn("function applyProdBanner", html)
        self.assertIn("prodBannerDismissed", html)
        # Re-entering prod always re-shows it.
        self.assertIn("setProdBannerDismissed(false)", html)

    def test_dev_bulk_send_offers_due_only_choice(self) -> None:
        html = self.html()
        # The modal supports a third middle button.
        self.assertIn('id="modal-alt"', html)
        self.assertIn("altLabel", html)
        # Bulk send in Dev: due-only is the primary choice, force-everyone the alt.
        self.assertIn('okLabel: "Send to due only"', html)
        self.assertIn('altLabel: "Force-send everyone"', html)
        self.assertIn('ignore_due = choice === "alt"', html)

    def test_automation_can_be_paused_and_resumed_from_patients_tab(self) -> None:
        html = self.html()
        script = html.split("<script>", 1)[1]
        self.assertIn('id="toggle-automation" hidden', html)
        self.assertIn("function toggleAutomation", script)
        self.assertIn('"/api/scheduler/pause"', script)
        self.assertIn('"/api/scheduler/resume"', script)
        # Hidden unless the scheduler thread is actually up - nothing to
        # pause/resume otherwise.
        self.assertIn("toggleBtn.hidden = !st.running", script)
        self.assertIn('toggleBtn.textContent = st.paused ? "Resume automation" : "Pause automation"', script)
        # Resuming is framed as a fresh restart, not a catch-up, in the
        # confirmation copy shown before the request fires.
        self.assertIn("restarts fresh from right now", script)

    def test_preview_automation_button_shows_whats_due(self) -> None:
        html = self.html()
        script = html.split("<script>", 1)[1]
        self.assertIn('id="preview-automation"', html)
        self.assertIn('id="sheet-automation-preview"', html)
        self.assertIn('id="automation-preview-body"', html)
        self.assertIn("function previewAutomation", script)
        self.assertIn('fetch("/api/scheduler/preview")', script)
        self.assertIn("Nobody is due right now", script)
        self.assertIn("function automationPreviewRowHtml", script)
        self.assertIn("item.campaign_label", script)
        self.assertIn("item.name", script)
        self.assertIn("item.email", script)
        self.assertIn("item.step", script)

    def test_run_automation_button_previews_then_confirms_before_sending(self) -> None:
        html = self.html()
        script = html.split("<script>", 1)[1]
        self.assertIn('id="run-automation">Run automation now<', html)
        self.assertIn("function openRunAutomation", script)
        self.assertIn("function runAutomationNow", script)
        # Same sheet as Preview, just with a run action attached - it does
        # not fire on a single click without showing the list first.
        self.assertIn("showRunButton", script)
        self.assertIn("openSheet(\"sheet-automation-preview\")", script)
        self.assertIn('fetch("/api/scheduler/run-all"', script)
        self.assertIn('{ confirm: true }', script)

    def test_body_editor_replaces_per_paragraph_ui(self) -> None:
        html = self.html()
        self.assertIn('class="rte-paragraph body-editor" contenteditable="true"', html)
        self.assertNotIn("paragraphs-list", html)
        self.assertNotIn("add-paragraph", html)
        self.assertNotIn("paragraphRowHtml", html)
        self.assertNotIn("addParagraphTo", html)

    def test_step_button_block_is_editable(self) -> None:
        html = self.html()
        script = html.split("<script>", 1)[1]
        # Both an Edit and a Remove control live on each inline button block.
        self.assertIn("edit-step-button", script)
        self.assertIn("remove-step-button", script)
        # The dialog is reused for edit as well as insert.
        self.assertIn("openButtonDialog", script)
        self.assertIn("applyButtonDialog", script)
        self.assertIn("editingButtonBlock", script)
        self.assertIn('id="insert-button-title"', html)
        # Save-time collection splits any paragraph around embedded tokens.
        self.assertIn(r"split(/(\[\[button:\d+\]\])/)", script)
        # Insertion places the block as a direct child, never via insertHTML.
        self.assertNotIn('execCommand("insertHTML"', script)
        # The caret can always get past a button: an editable paragraph is kept
        # before/after every block, and empty spacers are dropped on save.
        self.assertIn("normalizeBodyEditor", script)
        self.assertIn("body.querySelectorAll(\".body-editor\").forEach(normalizeBodyEditor)", script)
        self.assertIn('addEventListener("keyup"', script)

    def test_step_editor_shows_campaign_cta_link_inheritance(self) -> None:
        html = self.html()
        script = html.split("<script>", 1)[1]
        self.assertIn("function withUtmContent", script)
        self.assertIn('class="step-cta-url"', script)
        self.assertIn("step-cta-preview", script)
        self.assertIn("ctaUrlOverride", script)
        # The button dialog no longer forces a URL.
        self.assertNotIn('"A button needs a URL."', script)
        # Details tab explains the per-step utm_content behaviour.
        self.assertIn("utm_content=&lt;step id&gt;", html)

    def test_patient_picker_sheet_exists(self) -> None:
        html = self.html()
        self.assertIn('id="sheet-pick-patient"', html)
        self.assertIn('id="pick-patient-list"', html)
        self.assertIn('id="pick-patient-continue"', html)
        self.assertIn("openPatientPicker", html)

    def test_delete_buttons_confirm_before_removing(self) -> None:
        html = self.html()
        script = html.split("<script>", 1)[1]

        step_chunk = script.split('classList.contains("remove-step")', 1)[1].split(
            'classList.contains("move-step-up")', 1
        )[0]
        # Deleting a step is a double confirm.
        self.assertEqual(step_chunk.count("{ confirm: true }"), 2)
        self.assertIn("event.preventDefault()", step_chunk)

        placeholder_chunk = script.split('classList.contains("remove-placeholder")', 1)[1].split(
            'classList.contains("restore-history")', 1
        )[0]
        self.assertIn("{ confirm: true }", placeholder_chunk)

        button_chunk = script.split('classList.contains("remove-step-button")', 1)[1].split(
            'classList.contains("add-step")', 1
        )[0]
        self.assertIn("{ confirm: true }", button_chunk)



class DashboardStepCollapseTests(unittest.TestCase):
    def test_step_block_is_collapsible_details(self) -> None:
        html = dashboard_html()
        self.assertIn('<details class="step-block', html)
        self.assertIn("details.step-block > summary", html)

    def test_step_summary_has_inline_icon_actions(self) -> None:
        html = dashboard_html()
        markup = html.split("stepEditHtml", 1)[1]
        summary = markup.split("<summary>", 1)[1].split("</summary>", 1)[0]
        # Send-to-one and delete are both icon buttons in the step title row.
        self.assertIn("step-icon-btn send-step", summary)
        self.assertIn("step-trash remove-step", summary)
        self.assertEqual(summary.count("<svg"), 2)
        self.assertIn(".step-icon-btn", html)
        # The old row-level "Remove step" / "Send to one" buttons are gone.
        self.assertNotIn("Remove step</button>", html)
        self.assertNotIn(">Send to one</button>", html)


if __name__ == "__main__":
    unittest.main()
