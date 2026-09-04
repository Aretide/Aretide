    let state = { unlocked: false, patients: [], campaigns: [], sends: [] };
    let selected = null;
    let patientCampaignFilter = "";
    let pickedPatientId = null;
    let savedButtonRange = null;
    let savedButtonEditor = null;
    let editingButtonBlock = null;

    // Returns true (OK), false (Cancel), or "alt" (the optional middle button).
    function popup(text, { confirm = false, loading = false, okLabel = "", altLabel = "" } = {}) {
      return new Promise((resolve) => {
        const modal = document.getElementById("modal");
        const ok = document.getElementById("modal-ok");
        const alt = document.getElementById("modal-alt");
        const cancel = document.getElementById("modal-cancel");
        const spinner = document.getElementById("modal-spinner");
        const actions = document.getElementById("modal-actions");
        document.getElementById("modal-text").textContent = text;
        spinner.hidden = !loading;
        actions.hidden = loading;
        alt.hidden = !altLabel || loading;
        cancel.hidden = (!confirm && !altLabel) || loading;
        alt.textContent = altLabel || "Alt";
        ok.textContent = okLabel || (confirm ? "Confirm" : "OK");
        modal.hidden = false;
        if (loading) {
          resolve(true);
          return;
        }
        function finish(value) {
          modal.hidden = true;
          ok.onclick = null;
          alt.onclick = null;
          cancel.onclick = null;
          resolve(value);
        }
        ok.onclick = () => finish(true);
        alt.onclick = () => finish("alt");
        cancel.onclick = () => finish(false);
      });
    }

    // Measure the fixed PRODUCTION banner and expose its height as a CSS var so
    // the header and every overlay can reserve exactly that much space. The
    // banner can wrap to two lines on a narrow window, so re-measure on resize.
    function syncProdBannerHeight() {
      const banner = document.getElementById("prod-banner");
      const height = banner && !banner.hidden ? banner.offsetHeight : 0;
      document.documentElement.style.setProperty("--prod-banner-h", height + "px");
    }
    window.addEventListener("resize", syncProdBannerHeight);

    function prodBannerDismissed() {
      try { return sessionStorage.getItem("prodBannerDismissed") === "1"; }
      catch (e) { return false; }
    }
    function setProdBannerDismissed(value) {
      try {
        if (value) sessionStorage.setItem("prodBannerDismissed", "1");
        else sessionStorage.removeItem("prodBannerDismissed");
      } catch (e) { /* private mode etc - fall back to showing it */ }
    }
    function applyProdBanner(mode) {
      const banner = document.getElementById("prod-banner");
      banner.hidden = mode !== "prod" || prodBannerDismissed();
      syncProdBannerHeight();
    }
    document.getElementById("prod-banner-close").onclick = () => {
      setProdBannerDismissed(true);
      applyProdBanner(state.mode);
    };

    // --- Sheet (pop-up / full-screen editor) shell ---

    function openSheet(id) {
      const el = document.getElementById(id);
      if (el) el.hidden = false;
    }

    function closeSheet(id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.hidden = true;
      if (id === "sheet-insert-button") {
        editingButtonBlock = null;
        savedButtonRange = null;
        savedButtonEditor = null;
      }
      if (id === "sheet-patient") {
        selected = null;
        renderRows();
      }
    }

    function topOpenSheetId() {
      const open = [...document.querySelectorAll(".sheet-overlay")].filter(el => !el.hidden);
      return open.length ? open[open.length - 1].id : null;
    }

    function bindSheetShell() {
      document.querySelectorAll(".sheet-overlay").forEach(overlay => {
        overlay.addEventListener("click", (event) => {
          if (event.target === overlay) closeSheet(overlay.id);
        });
      });
      document.querySelectorAll(".sheet-close").forEach(button => {
        button.onclick = () => closeSheet(button.dataset.close);
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          const top = topOpenSheetId();
          if (top) closeSheet(top);
        }
      });
    }

    function switchBoardTab(name) {
      document.getElementById("patients-view").hidden = name !== "patients";
      document.getElementById("sends-view").hidden = name !== "sends";
      document.querySelectorAll(".board-tabs .tab-button").forEach(button => {
        button.classList.toggle("active", button.dataset.boardTab === name);
      });
    }

    function bindBoardTabs() {
      document.querySelectorAll(".board-tabs .tab-button").forEach(button => {
        button.onclick = () => switchBoardTab(button.dataset.boardTab);
      });
    }

    function activeBoardTab() {
      return document.getElementById("sends-view").hidden ? "patients" : "sends";
    }

    async function clearBoardData() {
      const tab = activeBoardTab();
      const message = tab === "patients"
        ? "Reset every patient back to their first step on every campaign? This does not delete the send log. Cannot be undone."
        : "Clear all previously sent emails? This does not change any patient's current step. Cannot be undone.";
      const ok = await popup(message, { confirm: true });
      if (!ok) return;
      const res = await fetch("/api/clear-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: tab === "patients" ? "patients" : "sends" })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await popup(data.message || data.error || "Could not clear data.");
        return;
      }
      await load();
      await popup(tab === "patients" ? "Patient progress cleared." : "Send log cleared.");
    }

    function showLoadError(err) {
      const msg = (err && err.message) ? err.message : String(err);
      const el = document.getElementById("unlock");
      if (el) el.textContent = "Could not load: " + msg;
    }

    async function load() {
      try {
        const res = await fetch("/api/state");
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(
            payload.message || payload.error || ("HTTP " + res.status)
          );
        }
        // Merge rather than replace - a wholesale reassignment would wipe out
        // fields other pollers stash on state (e.g. schedulerStatus from
        // loadSchedulerStatus(), which runs concurrently with this on load).
        Object.assign(state, payload);
        state.campaigns = state.campaigns || [];
        state.patients = state.patients || [];
        state.sends = state.sends || [];
        state.all_campaigns = state.all_campaigns || [];
        document.getElementById("unlock").textContent = state.unlocked
          ? "PII unlocked. Names and emails are visible."
          : "PII locked. Names and emails show as ***.";
        document.body.classList.toggle("prod", state.mode === "prod");
        document.body.classList.toggle("dev", state.mode !== "prod");
        applyProdBanner(state.mode);
        document.getElementById("mode-select").value = state.mode || "dev";
        document.getElementById("mode-note").textContent = state.mode === "prod"
          ? "Prod - real patients in " + (state.patients_file || "data/prod/patients.json")
          : "Dev - test patients in " + (state.patients_file || "data/dev/patients.json");
        fillCampaignSelect();
        fillPatientCampaignFilter();
        renderReady();
        document.getElementById("clear-data").hidden = state.mode === "prod";
        renderCampaignsList();
        document.getElementById("add-campaigns").innerHTML = state.campaigns.map(c =>
          `<details class="campaign">
            <summary>${esc(c.label)}</summary>
            <label><input type="checkbox" value="${esc(c.id)}"> Enroll</label>
            <p class="muted">${esc(c.description || "")}</p>
          </details>`
        ).join("");
        const current = selected
          ? state.patients.find(p => p.id === selected) || null
          : null;
        if (!current) selected = null;
        renderRows();
        if (current) renderDetail(current);
        renderSends();
      } catch (err) {
        showLoadError(err);
      }
    }

    function humanDuration(secs) {
      if (secs == null) return "";
      if (secs <= 0) return "now";
      const d = Math.floor(secs / 86400);
      const h = Math.floor((secs % 86400) / 3600);
      const m = Math.floor((secs % 3600) / 60);
      if (d) return `${d}d ${h}h`;
      if (h) return `${h}h ${m}m`;
      if (m) return `${m}m`;
      return "<1m";
    }

    function nextStepCellHtml(campaigns, mode, patientId) {
      const lines = (campaigns || []).filter(c => c.enrolled).map(c => {
        let when, cls;
        if (mode === "prod" && !c.ready) { when = "campaign not ready"; cls = "disabled"; }
        else if (c.next_step == null) { when = "all steps sent"; cls = "wait"; }
        else if (c.due_now) { when = "can send now"; cls = "due"; }
        else if (c.seconds_until == null) { when = "no send time yet (set abandoned/enrolled)"; cls = "wait"; }
        else { when = "sends in " + humanDuration(c.seconds_until); cls = "wait"; }
        const step = c.next_step
          ? ` <span class="muted">&mdash; next step <code>${esc(c.next_step)}</code></span>`
          : "";
        const due = c.due_at ? ` title="Due ${esc(formatWhen(c.due_at))} America/Denver"` : "";
        // See exactly what this patient's own next email looks like, and send
        // it right from here - no digging through the campaign editor first.
        const actions = c.next_step
          ? ` <span class="next-step-actions">
              <button type="button" class="secondary preview-patient-step"
                data-patient-id="${esc(patientId)}" data-campaign-id="${esc(c.id)}"
                data-step-id="${esc(c.next_step)}">Preview</button>
              <button type="button" class="secondary send-patient-step"
                data-patient-id="${esc(patientId)}" data-campaign-id="${esc(c.id)}"
                data-campaign-label="${esc(c.label)}" data-already-due="${c.due_now ? "1" : ""}">Send</button>
            </span>`
          : "";
        return `<div class="next-step-line ${cls}"${due}><strong>${esc(c.label)}</strong> ${esc(when)}${step}${actions}</div>`;
      });
      return lines.join("") || "<span class='muted'>-</span>";
    }

    // Rebuilds the campaign filter <select> from every known campaign (not
    // just the mode-visible ones, so Dev can still filter by a draft
    // campaign) - without losing whatever is currently selected.
    function fillPatientCampaignFilter() {
      const select = document.getElementById("patient-filter-campaign");
      if (!select) return;
      const previous = patientCampaignFilter;
      const options = (state.all_campaigns || [])
        .map(c => `<option value="${esc(c.id)}">${esc(c.label)}</option>`).join("");
      select.innerHTML = '<option value="">All campaigns</option>' + options;
      select.value = previous;
      if (select.value !== previous) {
        // The remembered campaign no longer exists - fall back to "All".
        patientCampaignFilter = "";
        select.value = "";
      }
    }

    function renderRows() {
      const filter = patientCampaignFilter;
      const visible = filter
        ? state.patients.filter(p => (p.campaigns || []).some(c => c.id === filter && c.enrolled))
        : state.patients;
      const totalLabel = document.getElementById("patient-total-count");
      if (totalLabel) {
        const n = state.patients.length;
        totalLabel.textContent = `${n} patient${n === 1 ? "" : "s"} signed up`
          + (state.mode ? ` (${state.mode})` : "");
      }
      const countLabel = document.getElementById("patient-filter-count");
      if (countLabel) {
        countLabel.textContent = filter
          ? `${visible.length} of ${state.patients.length} enrolled`
          : "";
      }
      document.getElementById("rows").innerHTML = visible.map(p => {
        const chips = (p.campaigns || []).filter(c => c.enrolled).map(c => {
          const disabled = state.mode === "prod" && !c.ready;
          const cls = disabled ? "disabled" : (c.due_now ? "due" : "wait");
          return `<span class="chip ${cls}">${esc(c.label)}</span>`;
        }).join("") || "<span class='muted'>none</span>";
        return `<tr data-id="${p.id}" class="${p.id === selected ? "active" : ""}">
          <td>${esc(p.first_name)}</td><td>${esc(p.email)}</td><td>${esc(p.status)}</td>
          <td>${chips}</td><td>${nextStepCellHtml(p.campaigns, state.mode, p.id)}</td>
        </tr>`;
      }).join("") || `<tr><td colspan="5" class="muted">${
        filter ? "No patients enrolled in this campaign." : "No patients yet."
      }</td></tr>`;
      document.querySelectorAll("tr[data-id]").forEach(row => {
        row.addEventListener("click", (event) => {
          // Preview/Send inside the row handle themselves - don't also open the editor.
          if (event.target.closest(".next-step-actions")) return;
          openPatientEditor(row.dataset.id);
        });
      });
      document.querySelectorAll(".preview-patient-step").forEach(button => {
        button.onclick = (event) => {
          event.stopPropagation();
          openStepPreview(button.dataset.campaignId, button.dataset.stepId, button.dataset.patientId);
        };
      });
      document.querySelectorAll(".send-patient-step").forEach(button => {
        button.onclick = (event) => {
          event.stopPropagation();
          send({
            patient_ids: [button.dataset.patientId],
            campaign_id: button.dataset.campaignId,
            campaign_label: button.dataset.campaignLabel,
            alreadyDue: !!button.dataset.alreadyDue,
          });
        };
      });
    }

    function openPatientEditor(id) {
      selected = id;
      renderRows();
      renderDetail(state.patients.find(p => p.id === id));
      openSheet("sheet-patient");
    }

    function esc(value) {
      return String(value ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    }

    function formatWhen(iso) {
      return String(iso || "").replace("T", " ").slice(0, 16);
    }

    function nextStepAfter(steps, lastStepId) {
      if (!steps.length) return null;
      if (!lastStepId) return steps[0];
      const index = steps.findIndex(s => s.id === lastStepId);
      if (index === -1) return null;
      return steps[index + 1] || null;
    }

    function updateNextStepHint(campaignId, steps) {
      const select = document.querySelector(`[data-last-step="${campaignId}"]`);
      const hint = document.querySelector(`[data-next-step-hint="${campaignId}"]`);
      if (!hint) return;
      const value = select ? select.value : "";
      const next = nextStepAfter(steps, value);
      hint.innerHTML = next
        ? `Next to run: <strong>${esc(next.id)}</strong> - ${esc(next.subject)}`
        : "No more steps - this campaign is complete for this patient.";
    }

    function campaignOptions() {
      return (state.campaigns || []).map(c =>
        `<option value="${esc(c.id)}">${esc(c.label)}</option>`
      ).join("");
    }

    function fillCampaignSelect() {
      const select = document.getElementById("campaign");
      const keep = select.value;
      select.innerHTML = campaignOptions();
      if (keep && [...select.options].some(opt => opt.value === keep)) {
        select.value = keep;
      }
    }

    function bindSendBox() {
      document.getElementById("plan-all").onclick = async () => {
        const campaign_id = document.getElementById("campaign").value;
        const res = await fetch("/api/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaign_id, dry_run: true })
        });
        const data = await res.json();
        document.getElementById("plan-note").textContent = (data.preview || []).map(item =>
          `${item.name} · ${item.email} · ${item.step}`
        ).join(" | ") || "Nobody is due.";
      };
      document.getElementById("send-all").onclick = () => send({});
    }

    function renderSends() {
      const body = document.getElementById("sent-rows");
      if (!body) return;
      const rows = state.sends || [];
      if (!rows.length) {
        body.innerHTML = "<tr><td colspan='4' class='muted'>No emails sent yet.</td></tr>";
        return;
      }
      body.innerHTML = rows.map(item =>
        `<tr data-send-id="${esc(item.id)}">
          <td>${esc(item.first_name)}</td>
          <td>${esc(item.email)}</td>
          <td>${esc(item.campaign_label)} v${item.campaign_version || 1} ·
            ${esc(item.step_id)} v${item.step_version || 1}</td>
          <td>${esc(formatWhen(item.sent_at))}</td>
        </tr>`
      ).join("");
      document.querySelectorAll("tr[data-send-id]").forEach(row => {
        const item = rows.find(r => r.id === row.dataset.sendId);
        if (item) row.addEventListener("click", () => viewSentEmail(item));
      });
    }

    async function viewSentEmail(item) {
      document.getElementById("view-email-title").textContent = item.campaign_label + " - " + item.step_id;
      const body = document.getElementById("view-email-body");
      body.innerHTML = "<p class='muted'>Loading...</p>";
      openSheet("sheet-view-email");
      const res = await fetch("/api/sends/" + encodeURIComponent(item.id) + "/render");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        body.innerHTML = "<p class='muted'>" + esc(data.message || data.error || "Could not render this email.") + "</p>";
        return;
      }
      const note = data.note ? `<p class="muted">${esc(data.note)}</p>` : "";
      body.innerHTML = `
        <p><strong>Subject:</strong> ${esc(data.subject || item.subject)}</p>
        ${note}
        <iframe style="width:100%;height:70vh;border:1px solid var(--line);border-radius:8px;"
          srcdoc="${esc(data.html || "")}"></iframe>`;
    }

    function renderDetail(p) {
      const el = document.getElementById("detail");
      if (!p) {
        el.innerHTML = "<p class='muted'>Select a patient to edit fields, assign campaigns, "
          + "and send one person.</p>";
        return;
      }
      if (!state.unlocked) {
        el.innerHTML = "<p class='muted'>Unlock PII to edit this patient.</p>";
        return;
      }
      const disabledForProd = (c) => state.mode === "prod" && !c.ready;
      const boxes = (p.campaigns || []).map(c => {
        const meta = (state.campaigns || []).find(item => item.id === c.id) || {};
        const steps = meta.steps || [];
        const known = steps.some(step => step.id === c.last_step);
        const stepOptions = [
          `<option value="" ${c.last_step ? "" : "selected"}>(blank - start at first step)</option>`,
          ...steps.map(step =>
            `<option value="${esc(step.id)}" `
            + `${c.last_step === step.id ? "selected" : ""}>`
            + `${esc(step.id)} - ${esc(step.subject)}</option>`
          ),
          ...(c.last_step && !known
            ? [`<option value="${esc(c.last_step)}" selected>${esc(c.last_step)}</option>`]
            : [])
        ].join("");
        return `
        <details class="campaign" ${c.enrolled ? "open" : ""}>
          <summary>${esc(c.label)}${disabledForProd(c) ? ' <span class="version-chip">disabled for prod</span>' : ""}</summary>
          <label><input type="checkbox" data-campaign="${esc(c.id)}" ${c.enrolled ? "checked" : ""}> Enrolled</label>
          <p class="muted">${esc(c.plan)}</p>
          <label>Last step</label>
          <select data-last-step="${esc(c.id)}">${stepOptions}</select>
          <div class="next-step-hint" data-next-step-hint="${esc(c.id)}"></div>
          <label>Last sent at</label>
          <input data-last-sent="${esc(c.id)}" value="${esc(c.last_sent_at || "")}" placeholder="2026-08-26 9:37">
          <div class="row">
            <button type="button" data-send-campaign="${esc(c.id)}"
              data-send-label="${esc(c.label)}" ${disabledForProd(c) ? "disabled" : ""}>Send ${esc(c.label)}</button>
          </div>
          ${disabledForProd(c) ? "<p class=\"muted\">Not enabled for Prod - mark it ready in Campaigns first.</p>" : ""}
        </details>`;
      }).join("");
      const mine = (state.sends || []).filter(item => item.patient_id === p.id);
      const sentHtml = mine.length
        ? `<ul class="sent-list">${mine.map(item =>
            `<li>${esc(formatWhen(item.sent_at))} · ${esc(item.campaign_label)} v${item.campaign_version || 1} · `
            + `${esc(item.step_id)} v${item.step_version || 1} · ${esc(item.subject)}</li>`
          ).join("")}</ul>`
        : "<p class='muted'>No emails sent to this patient yet.</p>";
      el.innerHTML = `
        <div class="row" style="margin-top:0;justify-content:flex-end;">
          ${state.mode === "dev"
            ? '<button type="button" class="secondary" id="dup-to-prod">Duplicate to Prod</button>'
            : ""}
          <button type="button" id="save-patient-edit-top">Save</button>
        </div>
        <label>First name</label>
        <input id="edit-first" value="${esc(p.first_name)}">
        <label>Email</label>
        <input id="edit-email" type="email" value="${esc(p.email)}">
        <label>Interest</label>
        <input id="edit-interest" value="${esc(p.interest)}">
        <label>Product</label>
        <input id="edit-product" value="${esc(p.product)}">
        <label>Status</label>
        <select id="edit-status">
          <option value="abandoned" ${p.status === "abandoned" ? "selected" : ""}>Abandoned</option>
          <option value="lead" ${p.status === "lead" ? "selected" : ""}>Lead</option>
          <option value="active" ${p.status === "active" ? "selected" : ""}>Active</option>
          <option value="paused" ${p.status === "paused" ? "selected" : ""}>Paused</option>
        </select>
        <label>Abandoned at</label>
        <input id="edit-abandoned" value="${esc(p.abandoned_at || "")}">
        <label>CTA URL</label>
        <input id="edit-cta" value="${esc(p.cta_url || "")}">
        <h2 style="margin-top:1rem;">Campaigns</h2>
        <p class="muted">Send this patient a campaign step from here.</p>
        ${boxes}
        <h2 style="margin-top:1rem;">Sent to this patient</h2>
        ${sentHtml}
        <div class="row" style="justify-content:space-between;">
          <button class="danger" id="delete-patient">Delete patient</button>
          <button type="button" id="save-patient-edit-bottom">Save</button>
        </div>`;
      document.getElementById("save-patient-edit-top").onclick = savePatient;
      document.getElementById("save-patient-edit-bottom").onclick = savePatient;
      document.getElementById("delete-patient").onclick = deletePatient;
      const dupBtn = document.getElementById("dup-to-prod");
      if (dupBtn) dupBtn.onclick = () => duplicateToProd(p.id);
      document.querySelectorAll("[data-send-campaign]").forEach(button => {
        button.onclick = () => {
          const campaign = (p.campaigns || []).find(item => item.id === button.dataset.sendCampaign);
          send({
            patient_ids: [p.id],
            campaign_id: button.dataset.sendCampaign,
            campaign_label: button.dataset.sendLabel,
            alreadyDue: campaign ? campaign.due_now : false
          });
        };
      });
      (p.campaigns || []).forEach(c => {
        const meta = (state.campaigns || []).find(item => item.id === c.id) || {};
        const steps = meta.steps || [];
        updateNextStepHint(c.id, steps);
        const markUnsaved = () => {
          const sendButton = document.querySelector('[data-send-campaign="' + c.id + '"]');
          if (sendButton) {
            sendButton.textContent = "Save";
            sendButton.onclick = savePatient;
          }
        };
        const stepSelect = document.querySelector(`[data-last-step="${c.id}"]`);
        if (stepSelect) {
          stepSelect.addEventListener("change", () => {
            updateNextStepHint(c.id, steps);
            markUnsaved();
          });
        }
        const lastSentInput = document.querySelector(`[data-last-sent="${c.id}"]`);
        if (lastSentInput) lastSentInput.addEventListener("change", markUnsaved);
        const enrolledBox = document.querySelector(`[data-campaign="${c.id}"]`);
        if (enrolledBox) enrolledBox.addEventListener("change", markUnsaved);
      });
    }

    async function duplicateToProd(id) {
      const patient = state.patients.find(p => p.id === id);
      const label = patient ? `${patient.first_name} (${patient.email})` : "this patient";
      const enrolled = (patient?.campaigns || []).filter(c => c.enrolled).map(c => c.label);
      const ok = await popup(
        "Copy " + label + " into the Prod patient list? Everything comes with them - "
        + "status, abandoned/enrolled times, and each campaign's last step and last sent time"
        + (enrolled.length ? " (enrolled: " + enrolled.join(", ") + ")" : "")
        + ". They will resume Prod campaigns from wherever the Dev test left off.",
        { confirm: true }
      );
      if (!ok) return;
      const res = await fetch("/api/patients/" + id + "/duplicate-to-prod", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      await popup(data.message || data.error || (res.ok ? "Copied to Prod." : "Copy failed."));
    }

    async function deletePatient() {
      if (!selected) return;
      const patient = state.patients.find(p => p.id === selected);
      const label = patient ? `${patient.first_name} (${patient.email})` : "this patient";
      const ok = await popup("Delete " + label + " from the encrypted list? This cannot be undone.", { confirm: true });
      if (!ok) return;
      const res = await fetch("/api/patients/" + selected, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await popup(data.message || data.error || "Delete failed");
        return;
      }
      closeSheet("sheet-patient");
      await load();
      await popup("Patient deleted.");
    }

    async function savePatient() {
      const campaigns = {};
      [...document.querySelectorAll("#detail [data-campaign]")].forEach(box => {
        const id = box.dataset.campaign;
        campaigns[id] = {
          enrolled: box.checked,
          last_step: document.querySelector(`[data-last-step="${id}"]`)?.value || "",
          last_sent_at: document.querySelector(`[data-last-sent="${id}"]`)?.value || ""
        };
      });
      const res = await fetch("/api/patients/" + selected, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: document.getElementById("edit-first").value,
          email: document.getElementById("edit-email").value,
          interest: document.getElementById("edit-interest").value,
          product: document.getElementById("edit-product").value,
          status: document.getElementById("edit-status").value,
          abandoned_at: document.getElementById("edit-abandoned").value,
          cta_url: document.getElementById("edit-cta").value,
          campaigns
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await popup(data.message || data.error || "Save failed");
        return;
      }
      await load();
      await popup("Patient saved.");
    }

    async function send(extra) {
      extra = extra || {};
      const campaignSelect = document.getElementById("campaign");
      const campaign_id = extra.campaign_id || campaignSelect.value;
      const campaignLabel = extra.campaign_label
        || campaignSelect.options[campaignSelect.selectedIndex]?.text
        || campaign_id;
      const one = extra.patient_ids && extra.patient_ids.length === 1;
      const target = one
        ? ((state.patients.find(p => p.id === extra.patient_ids[0]) || {}).first_name || "this patient")
        : "everyone due";
      let ignore_due = false;
      if (!one && state.mode !== "prod") {
        // Bulk send in Dev: due-only, force-everyone, or cancel.
        const choice = await popup(
          "Send " + campaignLabel + ": to patients whose next step is due now, "
          + "or force-send the next step to everyone enrolled (ignoring the delay)? "
          + "Dev only - Prod always sends to due patients and waits for the real delay.",
          { confirm: true, okLabel: "Send to due only", altLabel: "Force-send everyone" }
        );
        if (!choice) return;
        ignore_due = choice === "alt";
      } else {
        const ok = await popup(
          one
            ? "Send this patient's due email for " + campaignLabel + "?"
            : "Send all due emails for " + campaignLabel + "?",
          { confirm: true }
        );
        if (!ok) return;
        if (state.mode !== "prod" && !extra.alreadyDue) {
          const override = await popup(
            "Overwrite the time constraint and run " + campaignLabel + " for " + target
            + " right now? It is not due yet - Cancel to not send. "
            + "(Dev only - Prod always waits for the real delay.)",
            { confirm: true }
          );
          if (!override) return;
          ignore_due = true;
        }
      }
      document.querySelectorAll("button").forEach(button => { button.disabled = true; });
      await popup("Sending " + campaignLabel + "…", { loading: true });
      const body = Object.assign({ campaign_id, dry_run: false, force_to: "", ignore_due }, extra || {});
      let message = "Send failed";
      try {
        const res = await fetch("/api/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const data = await res.json().catch(() => ({}));
        const preview = data.preview || [];
        if (!res.ok) {
          message = data.message || data.error || "Send failed";
        } else if (!preview.length) {
          message = ignore_due
            ? "Nobody has a next step to force for " + campaignLabel
              + ". Enroll " + target + " in that campaign first."
            : "Nobody is due for " + campaignLabel
              + ". Enroll the patient in that campaign and set Last step to blank"
              + " if you want the first email to send.";
        } else {
          message = data.message || (preview.length + " email(s) sent.");
        }
      } catch (err) {
        message = "Send failed. Check the mailer is running.";
      }
      document.querySelectorAll("button").forEach(button => { button.disabled = false; });
      const note = document.getElementById("plan-note");
      if (note) note.textContent = message;
      await load();
      await popup(message);
    }

    function renderReady() {
      const isProd = state.mode === "prod";
      const openButton = document.getElementById("open-ready");
      if (openButton) openButton.hidden = isProd;
      if (isProd) return;
      const el = document.getElementById("ready-list");
      if (!el) return;
      const items = state.all_campaigns || [];
      const canEdit = true;
      el.innerHTML = items.map(c => {
        return `<label class="ready-row">
          <input type="checkbox" data-ready-id="${esc(c.id)}" ${c.ready ? "checked" : ""} ${canEdit ? "" : "disabled"}>
          ${esc(c.label)} ${c.ready ? "(prod)" : "(dev only)"}
        </label>`;
      }).join("") + (canEdit
        ? "<p class='muted'>Check a campaign, then hit Save. Prod only sends ready campaigns.</p>"
        : "<p class='muted'>Prod only sends ready campaigns. Switch to Dev to change that.</p>");
    }

    async function saveReadyChanges() {
      const items = state.all_campaigns || [];
      const changes = [];
      document.querySelectorAll("#ready-list [data-ready-id]").forEach(box => {
        const id = box.dataset.readyId;
        const campaign = items.find(c => c.id === id);
        if (campaign && campaign.ready !== box.checked) {
          changes.push({ id, label: campaign.label, ready: box.checked });
        }
      });
      if (!changes.length) {
        await popup("No changes to save.");
        return;
      }
      for (const change of changes) {
        await fetch("/api/campaigns/ready", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaign_id: change.id, ready: change.ready })
        });
      }
      await load();
      const summary = changes
        .map(c => `${c.label} is now ${c.ready ? "ready for prod" : "dev only"}`)
        .join(". ");
      await popup("Saved. " + summary + ".");
    }

    function placeholderRowHtml(key, value) {
      return `<div class="row placeholder-row">
        <input class="ph-key" placeholder="name" value="${esc(key)}">
        <input class="ph-value" placeholder="value" value="${esc(value)}">
        <button type="button" class="secondary remove-placeholder">Remove</button>
      </div>`;
    }

    function emailButtonBlockHtml(button) {
      const label = button.label || "";
      const url = button.url || "";
      const align = button.align || "center";
      const bg = button.bg || "#e5b01a";
      const color = button.color || "#1a1a1a";
      return `<div class="email-button-block" contenteditable="false" data-email-button="true"
        data-label="${esc(label)}" data-url="${esc(url)}" data-align="${esc(align)}"
        data-bg="${esc(bg)}" data-color="${esc(color)}">
        <span class="email-button-preview edit-step-button"
          style="background:${esc(bg)};color:${esc(color)};">${esc(label) || "Button"}</span>
        <span class="email-button-url">${esc(url) || "uses this step's CTA link + utm_content"}</span>
        <span class="email-button-actions">
          <button type="button" class="secondary edit-step-button">Edit</button>
          <button type="button" class="secondary remove-step-button">Remove</button>
        </span>
      </div>`;
    }

    function pickPatientRowHtml(p) {
      return `<div class="campaign-row" data-pick-patient-id="${esc(p.id)}">
        <div><strong>${esc(p.first_name)}</strong><p class="muted" style="margin:0.25rem 0 0;">${esc(p.email)}</p></div>
      </div>`;
    }

    function openPatientPicker(onContinue) {
      pickedPatientId = null;
      const list = document.getElementById("pick-patient-list");
      list.innerHTML = (state.patients || []).map(pickPatientRowHtml).join("")
        || "<p class='muted'>No patients yet.</p>";
      const continueBtn = document.getElementById("pick-patient-continue");
      continueBtn.disabled = true;
      list.querySelectorAll("[data-pick-patient-id]").forEach(row => {
        row.onclick = () => {
          pickedPatientId = row.dataset.pickPatientId;
          list.querySelectorAll("[data-pick-patient-id]").forEach(r => r.classList.toggle("picked", r === row));
          continueBtn.disabled = false;
        };
      });
      continueBtn.onclick = () => {
        closeSheet("sheet-pick-patient");
        if (pickedPatientId) onContinue(pickedPatientId);
      };
      openSheet("sheet-pick-patient");
    }

    // Mirror of mailer.campaigns.with_utm_content.
    function withUtmContent(base, stepId) {
      base = String(base || "").trim();
      if (!base || !stepId) return base;
      try {
        const u = new URL(base);
        u.searchParams.delete("utm_content");
        u.searchParams.append("utm_content", stepId);
        return u.toString();
      } catch (e) {
        const sep = base.includes("?") ? "&" : "?";
        return base + sep + "utm_content=" + encodeURIComponent(stepId);
      }
    }

    function stepEditHtml(step, campaignCta, campaignCtaUrl) {
      const match = /^(\d+)([mhd])$/.exec(String(step.delay || "0m"));
      const delayValue = match ? match[1] : "0";
      const delayUnit = match ? match[2] : "m";
      const buttons = step.buttons || [];
      const usedButtonIndexes = new Set();
      // Each item is {button: n} or {text: html}. Rendered with an empty
      // editable paragraph before/after every button block (and never letting
      // the editor start or end with one) so the caret always has somewhere to
      // land - see EMPTY_PARAGRAPH handling in collectStepBody, which strips
      // those spacers back out on save.
      const items = [];
      (step.body && step.body.length ? step.body : [""]).forEach(part => {
        const buttonMatch = /^\[\[button:(\d+)\]\]$/.exec(String(part).trim());
        if (buttonMatch) {
          const index = Number(buttonMatch[1]);
          if (buttons[index]) {
            usedButtonIndexes.add(index);
            items.push({ button: index });
          }
          // Token with no matching button: drop it rather than show it raw.
          return;
        }
        items.push({ text: part });
      });
      buttons.forEach((button, index) => {
        if (!usedButtonIndexes.has(index)) items.push({ button: index });
      });
      // Render each button block with a trailing empty paragraph as a caret
      // landing spot. normalizeBodyEditor() (run right after this HTML is put in
      // the DOM) adds the leading guard and any needed between-button spacers.
      const bodyParts = [];
      items.forEach(item => {
        if (item.button === undefined) {
          bodyParts.push(`<p>${item.text}</p>`);
          return;
        }
        bodyParts.push(emailButtonBlockHtml(buttons[item.button]));
        bodyParts.push("<p><br></p>");
      });
      const bodyHtml = bodyParts.join("") || "<p><br></p>";
      const ctaOverride = step.cta_label && step.cta_label !== campaignCta ? step.cta_label : "";
      return `
      <details class="step-block panel" data-original-id="${esc(step.id || "")}">
        <summary>Step ${esc(step.id || "(new)")} <span class="version-chip">v${step.version || 1}</span>
          <span class="step-summary-actions">
            <button type="button" class="step-icon-btn send-step" title="Send this step to one patient"
              aria-label="Send this step to one patient">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
            <button type="button" class="step-icon-btn step-trash remove-step" title="Delete this step"
              aria-label="Delete this step">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                <path d="M10 11v6M14 11v6"/>
              </svg>
            </button>
          </span>
        </summary>
        <div class="row" style="justify-content:space-between;align-items:center;">
          <div class="row">
            <button type="button" class="secondary move-step-up">Up</button>
            <button type="button" class="secondary move-step-down">Down</button>
            <button type="button" class="secondary preview-step">Preview</button>
          </div>
        </div>
        <label>Step id</label>
        <input class="step-id" value="${esc(step.id || "")}">
        <label>Delay</label>
        <div class="row">
          <input type="number" min="0" class="step-delay-value" value="${esc(delayValue)}">
          <select class="step-delay-unit">
            <option value="m" ${delayUnit === "m" ? "selected" : ""}>minutes</option>
            <option value="h" ${delayUnit === "h" ? "selected" : ""}>hours</option>
            <option value="d" ${delayUnit === "d" ? "selected" : ""}>days</option>
          </select>
        </div>
        <label>Subject</label>
        <input class="step-subject" value="${esc(step.subject || "")}">
        <label>Greeting</label>
        <input class="step-greeting" value="${esc(step.greeting || "Hey {first_name},")}">
        <label>Closing (optional)</label>
        <input class="step-closing" value="${esc(step.closing || "")}" placeholder="e.g. Talk soon, Beema Health">
        <label>CTA label override (optional)</label>
        <input class="step-cta-label" value="${esc(ctaOverride)}" placeholder="${esc(campaignCta || "Continue")}">
        <label>CTA link override (optional)</label>
        <input class="step-cta-url" value="${esc(step.cta_url || "")}"
          placeholder="${esc(campaignCtaUrl || "set the campaign CTA URL on the Details tab")}">
        <p class="muted">Buttons with no link of their own point at:
          <code class="step-cta-preview">${esc(withUtmContent(step.cta_url || campaignCtaUrl || "", step.id || "(step id)"))}</code></p>
        <label>Body</label>
        <div class="rte-toolbar row">
          <button type="button" class="secondary rte-bold" title="Bold"><b>B</b></button>
          <button type="button" class="secondary rte-italic" title="Italic"><i>I</i></button>
          <button type="button" class="secondary rte-underline" title="Underline"><u>U</u></button>
          <button type="button" class="secondary rte-strike" title="Strikethrough"><s>S</s></button>
          <button type="button" class="secondary rte-ul" title="Bullet list">&bull; List</button>
          <button type="button" class="secondary rte-ol" title="Numbered list">1. List</button>
          <button type="button" class="secondary rte-link" title="Insert link">Link</button>
          <button type="button" class="secondary rte-clear" title="Remove formatting">Clear</button>
          <button type="button" class="secondary rte-button-insert" title="Insert button">Button</button>
        </div>
        <div class="rte-paragraph body-editor" contenteditable="true">${bodyHtml}</div>
      </details>`;
    }

    function campaignDetailsTabHtml(c) {
      return `
        <label>Campaign id</label>
        <input class="c-id" value="${esc(c.id)}">
        <label>Label</label>
        <input class="c-label" value="${esc(c.label || "")}">
        <label>Description</label>
        <input class="c-description" value="${esc(c.description || "")}">
        <label>Anchor</label>
        <select class="c-anchor">
          <option value="enrolled_at" ${c.anchor === "abandoned_at" ? "" : "selected"}>Enrolled at</option>
          <option value="abandoned_at" ${c.anchor === "abandoned_at" ? "selected" : ""}>Abandoned at</option>
        </select>
        <label>CTA URL (base link for every step)</label>
        <input class="c-cta-url" value="${esc(c.cta_url || "")}"
          placeholder="https://hive.beemahealth.com/?utm_source=beema_email&amp;utm_medium=email">
        <p class="muted">Every step's buttons use this link by default, with
          <code>&amp;utm_content=&lt;step id&gt;</code> added automatically
          (step <code>3h</code> &rarr; <code>&hellip;&amp;utm_content=3h</code>).
          Put shared UTMs here. A step can override the link, and any button can set its own URL.</p>
        <label>CTA label</label>
        <input class="c-cta-label" value="${esc(c.cta_label || "Continue")}">
        <label><input type="checkbox" class="c-ready" ${c.ready ? "checked" : ""}> Ready for prod</label>
        <label><input type="checkbox" class="c-show-header" ${c.show_header !== false ? "checked" : ""}> Show header</label>
        <label><input type="checkbox" class="c-show-footer" ${c.show_footer !== false ? "checked" : ""}> Show footer</label>`;
    }

    const BUILTIN_VARS = ["first_name", "email", "interest", "product", "support_email"];

    // Single source of truth for the Placeholders tab table and the "?" popup.
    const VAR_HELP = {
      first_name: {
        label: "{first_name}",
        what: "The recipient's first name - the patient this email is going to.",
        becomes: ["Alex", "Jordan", "Priya", "Sam", "Michael"],
        usage: [
          "Hey {first_name}, your Beema Health visit is still open.",
          "{first_name}, here is what happens once a clinician reviews your visit.",
          "Thanks for trusting us with your care, {first_name}.",
          "One quick question, {first_name} - are you still interested?",
          "Welcome to Beema Health, {first_name}.",
        ],
      },
      email: {
        label: "{email}",
        what: "The recipient's own email address - the inbox this message lands in.",
        becomes: ["alex@gmail.com", "j.jordan@outlook.com", "sam@yahoo.com"],
        usage: [
          "We sent this to {email}. If that is not the best address, just reply.",
          "Your Beema Health account is tied to {email}.",
          "To keep getting these updates, make sure {email} stays active.",
        ],
      },
      interest: {
        label: "{interest}",
        what: "What the recipient told us they want, pulled from their patient record. The exact wording varies from patient to patient.",
        becomes: [
          "weight-loss care",
          "GLP-1 medication",
          "hair-loss treatment",
          "TRT",
          "help with weight loss",
        ],
        usage: [
          "If you are still interested in {interest}, you can pick up where you left off.",
          "Your {interest} visit is waiting for you.",
          "A licensed clinician will review your {interest} request within one business day.",
          "It has been a week since you started your visit for {interest}.",
          "Still thinking about {interest}? No rush - your progress is saved.",
        ],
      },
      product: {
        label: "{product}",
        what: "The recipient's product line - a short slug from their record, usually lower-case with hyphens.",
        becomes: ["weight-loss", "hair-loss", "trt", "nad-plus"],
        usage: [
          "Your {product} plan starts as soon as a clinician signs off.",
          "Questions about your {product} order? Reply to this email.",
          "Here is how {product} shipping works.",
        ],
      },
      support_email: {
        label: "{support_email}",
        what: "The Beema support inbox. Always support@beemahealth.com - the same address for every campaign and every recipient, and it cannot be changed here.",
        becomes: ["support@beemahealth.com"],
        usage: [
          "Reply here or email {support_email} - a real person reads it.",
          "Something look wrong? Forward it to {support_email}.",
          "For billing questions, contact {support_email}.",
          "You can reach our care team any time at {support_email}.",
        ],
      },
    };

