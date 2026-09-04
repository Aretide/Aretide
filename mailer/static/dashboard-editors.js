    function openVarHelp(name) {
      const h = VAR_HELP[name];
      if (!h) return;
      document.getElementById("var-help-title").textContent = h.label;
      const becomes = h.becomes
        .map(b => `<span class="var-help-example">${esc(b)}</span>`).join("");
      const usage = h.usage
        .map(u => `<span class="var-help-example">${esc(u)}</span>`).join("");
      document.getElementById("var-help-body").innerHTML = `
        <p>${esc(h.what)}</p>
        <div class="var-help-block">
          <h3>What it becomes for a real patient</h3>
          ${becomes}
        </div>
        <div class="var-help-block">
          <h3>Using it in email copy</h3>
          ${usage}
        </div>
        <p class="muted">Type the token exactly, with the braces, anywhere in a subject,
          greeting, body paragraph, or closing.</p>`;
      openSheet("sheet-var-help");
    }

    function campaignPlaceholdersTabHtml(c) {
      const placeholders = c.placeholders || {};
      const phRows = Object.entries(placeholders)
        .filter(([k]) => !BUILTIN_VARS.includes(k))
        .map(([k, v]) => placeholderRowHtml(k, v)).join("");
      const builtinRows = BUILTIN_VARS.map(name => {
        const h = VAR_HELP[name];
        return `
            <tr>
              <td><code>${esc(h.label)}</code>
                <button type="button" class="var-help-btn" data-var="${esc(name)}"
                  title="More examples" aria-label="More examples for ${esc(h.label)}">?</button></td>
              <td>${esc(h.what)}</td>
              <td class="var-example">${esc(h.usage[0])}</td>
            </tr>`;
      }).join("");
      return `
        <p class="var-section-title">Built-in variables</p>
        <p class="muted">Always available in any subject, greeting, body paragraph, or closing -
          no setup needed. Type them exactly, including the braces. Tap <strong>?</strong> for more examples.</p>
        <table class="var-table">
          <thead><tr><th>Variable</th><th>Who / what it is</th><th>Example in an email</th></tr></thead>
          <tbody>${builtinRows}</tbody>
        </table>
        <p class="var-section-title">Custom variables for this campaign</p>
        <p class="muted">Extra <code>{name}</code> tokens only this campaign needs (for example
          <code>{coupon_amount}</code> = <em>$100</em>). Name on the left, the exact text it should
          become on the right. These do not exist until you add them here.</p>
        <div class="placeholders-list">${phRows}</div>
        <div class="row"><button type="button" class="secondary add-placeholder">Add custom variable</button></div>`;
    }

    function campaignStepsTabHtml(c) {
      const stepRows = (c.steps || [])
        .map(step => stepEditHtml(step, c.cta_label, c.cta_url || "")).join("");
      return `
        <p class="muted">Preview and Send to one use the last saved version - save first
          if you just edited this step.</p>
        <div class="steps-list">${stepRows}</div>
        <div class="row"><button type="button" class="secondary add-step">Add step</button></div>`;
    }

    function campaignHistoryTabHtml() {
      return `<div class="history-list">
        <p class="muted">Loading history…</p>
      </div>`;
    }

    const SCH_DAYS = [
      ["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"],
      ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"],
    ];

    function campaignAutomationTabHtml(c) {
      const s = c.schedule || {};
      const enabled = !!s.enabled;
      const kind = s.kind === "weekly" ? "weekly" : "interval";
      const everyMinutes = Number(s.every_minutes || 60);
      const useHours = everyMinutes % 60 === 0 && everyMinutes >= 60;
      const everyValue = useHours ? everyMinutes / 60 : everyMinutes;
      const everyUnit = useHours ? "hours" : "minutes";
      const days = s.days || [];
      const time = s.time || "09:00";
      const dayChecks = SCH_DAYS.map(([key, label]) =>
        `<label class="sch-day"><input type="checkbox" class="sch-day-box" value="${key}"
          ${days.includes(key) ? "checked" : ""}> ${label}</label>`).join("");
      return `
        <p class="muted">When this runs, it does the same thing as <strong>Send due emails</strong>:
          for every enrolled patient whose next step is due, it sends that one step. It only runs
          while <code>./mailer.sh</code> is open and this laptop is awake - on wake it catches up the
          next check. All times are <strong>America/Denver</strong>.</p>
        <label class="sch-toggle"><input type="checkbox" class="sch-enabled" ${enabled ? "checked" : ""}>
          Run this campaign automatically</label>
        <fieldset class="sch-fieldset">
          <label class="sch-radio"><input type="radio" name="sch-kind" value="interval"
            ${kind === "interval" ? "checked" : ""}> Every</label>
          <div class="row sch-interval-row">
            <input type="number" min="1" class="sch-every-value" value="${esc(everyValue)}" style="max-width:6rem;">
            <select class="sch-every-unit">
              <option value="minutes" ${everyUnit === "minutes" ? "selected" : ""}>minutes</option>
              <option value="hours" ${everyUnit === "hours" ? "selected" : ""}>hours</option>
            </select>
            <span class="muted">(e.g. every 1 hour to check for due abandoned-checkout steps)</span>
          </div>
          <label class="sch-radio"><input type="radio" name="sch-kind" value="weekly"
            ${kind === "weekly" ? "checked" : ""}> Weekly on set days at a time</label>
          <div class="sch-weekly-row">
            <div class="sch-days">${dayChecks}</div>
            <label>Time <input type="time" class="sch-time" value="${esc(time)}"></label>
          </div>
        </fieldset>
        <p class="muted">Schedule changes save when you hit <strong>Save campaign</strong>.</p>
        <div class="automation-status"><p class="muted">Loading status…</p></div>
        <div class="row">
          <button type="button" class="secondary run-campaign-now">Run now</button>
          <button type="button" class="secondary refresh-automation-status">Refresh status</button>
        </div>`;
    }

    function renderCampaignEditorBody(c) {
      return `
        <div class="tab-panel" data-tab-panel="details">${campaignDetailsTabHtml(c)}</div>
        <div class="tab-panel" data-tab-panel="placeholders" hidden>${campaignPlaceholdersTabHtml(c)}</div>
        <div class="tab-panel" data-tab-panel="steps" hidden>${campaignStepsTabHtml(c)}</div>
        <div class="tab-panel" data-tab-panel="automation" hidden>${campaignAutomationTabHtml(c)}</div>
        <div class="tab-panel" data-tab-panel="history" hidden>${campaignHistoryTabHtml()}</div>`;
    }

    function switchCampaignTab(tab) {
      document.querySelectorAll("#campaign-editor-tabs .tab-button").forEach(button => {
        button.classList.toggle("active", button.dataset.tab === tab);
      });
      document.querySelectorAll("#campaign-editor-body .tab-panel").forEach(panel => {
        panel.hidden = panel.dataset.tabPanel !== tab;
      });
      if (tab === "history") loadCampaignHistoryTab();
      if (tab === "automation") {
        syncScheduleFields();
        loadAutomationStatus();
      }
    }

    function fillCampaignEditor(campaign, { isNew = false, keepTab = "details" } = {}) {
      const body = document.getElementById("campaign-editor-body");
      body.innerHTML = renderCampaignEditorBody(campaign);
      body.dataset.originalId = campaign.id;
      body.dataset.isNew = isNew ? "true" : "false";
      document.getElementById("campaign-editor-title").textContent = campaign.label || campaign.id;
      body.querySelectorAll(".body-editor").forEach(normalizeBodyEditor);
      switchCampaignTab(keepTab);
    }

    function openCampaignEditor(campaign, { isNew = false } = {}) {
      fillCampaignEditor(campaign, { isNew });
      closeSheet("sheet-campaigns-list");
      openSheet("sheet-campaign-editor");
    }

    function campaignRowHtml(c) {
      return `<div class="campaign-row" data-campaign-id="${esc(c.id)}">
        <div>
          <strong>${esc(c.label)}</strong>
          <span class="version-chip">v${c.version || 1}</span>
          ${c.ready ? '<span class="version-chip">ready</span>' : ""}
          ${c.schedule && c.schedule.enabled ? '<span class="version-chip">&#9200; scheduled</span>' : ""}
          <p class="muted" style="margin:0.25rem 0 0;">${esc(c.description || "")}</p>
        </div>
        <div class="row">
          <button type="button" class="secondary edit-campaign-row">Edit</button>
          <button type="button" class="danger delete-campaign-row">Delete</button>
        </div>
      </div>`;
    }

    function renderCampaignsList() {
      const container = document.getElementById("campaigns-list");
      if (!container) return;
      const campaigns = state.all_campaigns || [];
      container.innerHTML = campaigns.map(campaignRowHtml).join("")
        || "<p class='muted'>No campaigns yet.</p>";
    }

    function moveSibling(el, direction) {
      if (!el) return;
      if (direction === "up" && el.previousElementSibling) {
        el.parentNode.insertBefore(el, el.previousElementSibling);
      } else if (direction === "down" && el.nextElementSibling) {
        el.parentNode.insertBefore(el.nextElementSibling, el);
      }
    }

    function addStepTo(root) {
      const list = root.querySelector(".steps-list");
      const ctaLabel = root.querySelector(".c-cta-label").value.trim() || "Continue";
      const wrap = document.createElement("div");
      wrap.innerHTML = stepEditHtml({ id: "", delay: "0m", subject: "", body: [] }, ctaLabel);
      const added = wrap.firstElementChild;
      list.appendChild(added);
      added.querySelectorAll(".body-editor").forEach(normalizeBodyEditor);
      added.open = true;
    }

    function addPlaceholderTo(root) {
      const list = root.querySelector(".placeholders-list");
      const wrap = document.createElement("div");
      wrap.innerHTML = placeholderRowHtml("", "");
      list.appendChild(wrap.firstElementChild);
    }

    function insertLink() {
      const url = window.prompt("Link URL (https://... or mailto:...)", "https://");
      if (!url) return;
      document.execCommand("createLink", false, url);
    }

    function buttonBlockElement(button) {
      const wrap = document.createElement("div");
      wrap.innerHTML = emailButtonBlockHtml(button);
      return wrap.firstElementChild;
    }

    const isButtonEl = (el) =>
      !!el && el.nodeType === 1 && el.dataset && el.dataset.emailButton === "true";

    const blankParagraph = () => {
      const p = document.createElement("p");
      p.innerHTML = "<br>";
      return p;
    };

    // Insert `node` (a button block) as a direct child of the body editor, right
    // after whatever top-level block the caret was in. Never nests it inside a
    // <p> (that breaks the [[button:N]] round-trip), and always leaves an
    // editable paragraph directly before and after it so the caret can get past
    // the block to add text above or below.
    function insertButtonBlock(node, editor, range) {
      editor.focus();
      let anchor = null;
      if (range) {
        let el = range.startContainer;
        if (el.nodeType !== 1) el = el.parentElement;
        while (el && el.parentElement && el.parentElement !== editor) {
          el = el.parentElement;
        }
        if (el && el.parentElement === editor) anchor = el;
      }
      if (anchor) {
        anchor.after(node);
      } else {
        editor.appendChild(node);
      }
      // Editable paragraph before the button (reuse one if it is already there).
      if (!node.previousElementSibling || isButtonEl(node.previousElementSibling)) {
        node.before(blankParagraph());
      }
      // Editable landing paragraph after the button - reuse the next block if it
      // is already an editable paragraph, otherwise add a fresh empty one.
      let landing = node.nextElementSibling;
      if (!landing || isButtonEl(landing)) {
        landing = blankParagraph();
        node.after(landing);
      }
      const caret = document.createRange();
      caret.selectNodeContents(landing);
      caret.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(caret);
    }

    // Guarantee the body editor never starts or ends with a non-editable button
    // block, and that two button blocks are never adjacent - so there is always
    // somewhere for the caret to land. Empty spacers are stripped on save.
    function normalizeBodyEditor(editor) {
      if (!editor) return;
      if (isButtonEl(editor.firstElementChild)) {
        editor.insertBefore(blankParagraph(), editor.firstElementChild);
      }
      if (isButtonEl(editor.lastElementChild)) {
        editor.appendChild(blankParagraph());
      }
      [...editor.querySelectorAll('[data-email-button="true"]')].forEach(btn => {
        if (isButtonEl(btn.nextElementSibling)) {
          btn.after(blankParagraph());
        }
      });
    }

    function applyButtonDialog() {
      const label = document.getElementById("insert-button-label").value.trim() || "Button";
      const url = document.getElementById("insert-button-url").value.trim();
      const align = document.getElementById("insert-button-align").value;
      const bg = document.getElementById("insert-button-bg").value;
      const color = document.getElementById("insert-button-color").value;
      // Blank URL is allowed: the button rides the step's CTA link + utm_content.
      const button = { label, url, align, bg, color };
      // Capture state before closeSheet() clears it.
      const editing = editingButtonBlock;
      const range = savedButtonRange;
      const editor = savedButtonEditor;
      closeSheet("sheet-insert-button");
      if (editing) {
        editing.replaceWith(buttonBlockElement(button));
        return;
      }
      if (editor) {
        insertButtonBlock(buttonBlockElement(button), editor, range);
      } else {
        popup("Click inside the body text where you want the button, then try again.");
      }
    }

    function openButtonDialog({ label, url, align, bg, color }, editing) {
      editingButtonBlock = editing || null;
      document.getElementById("insert-button-title").textContent =
        editing ? "Edit button" : "Insert button";
      document.getElementById("insert-button-confirm").textContent =
        editing ? "Save button" : "Insert";
      document.getElementById("insert-button-label").value = label || "";
      document.getElementById("insert-button-url").value = url || "";
      document.getElementById("insert-button-align").value = align || "center";
      document.getElementById("insert-button-bg").value = bg || "#e5b01a";
      document.getElementById("insert-button-color").value = color || "#1a1a1a";
      openSheet("sheet-insert-button");
    }

    // Walk a step's contenteditable body and split it into paragraph strings
    // plus an ordered list of button descriptors. Each email-button block, no
    // matter how the browser nested it, becomes a standalone [[button:N]]
    // paragraph so render_html/render_plain can place it inline.
    function collectStepBody(bodyEditor) {
      const buttons = [];
      const body = [];
      if (!bodyEditor) return { body, buttons };
      const clone = bodyEditor.cloneNode(true);
      clone.querySelectorAll('[data-email-button="true"]').forEach(el => {
        buttons.push({
          label: el.dataset.label || "",
          url: el.dataset.url || "",
          align: el.dataset.align || "center",
          bg: el.dataset.bg || "#e5b01a",
          color: el.dataset.color || "#1a1a1a",
        });
        const marker = document.createElement("p");
        marker.textContent = `[[button:${buttons.length - 1}]]`;
        el.replaceWith(marker);
      });
      // Drop the Edit/Remove controls that lived inside the button blocks.
      clone.querySelectorAll("button").forEach(b => b.remove());
      const rawParts = [];
      // Collapse whitespace (incl. non-breaking spaces) so a <p><br></p> or
      // <p>&nbsp;</p> spacer reads as empty and gets dropped on save.
      const meaningfulText = (node) =>
        (node.textContent || "").replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
      const hasContent = (el) => meaningfulText(el) !== "" || !!el.querySelector("img");
      const children = [...clone.children];
      if (children.length) {
        children.forEach(el => { if (hasContent(el)) rawParts.push(el.innerHTML.trim()); });
      } else if (meaningfulText(clone)) {
        rawParts.push(clone.innerHTML.trim());
      }
      // A button token may have landed inside a paragraph (inserted mid-line).
      // Split every paragraph around its tokens so each [[button:N]] ends up on
      // its own line - that exact shape is what the server matches on.
      rawParts.forEach(part => {
        part.split(/(\[\[button:\d+\]\])/).forEach(piece => {
          const trimmed = piece.trim();
          if (trimmed) body.push(trimmed);
        });
      });
      return { body, buttons };
    }

    function collectCampaignPayload(root) {
      const placeholders = {};
      root.querySelectorAll(".placeholder-row").forEach(row => {
        const key = row.querySelector(".ph-key").value.trim();
        const value = row.querySelector(".ph-value").value;
        if (key) placeholders[key] = value;
      });
      const ctaLabel = root.querySelector(".c-cta-label").value.trim() || "Continue";
      const steps = [...root.querySelectorAll(".step-block")].map(block => {
        const bodyEditor = block.querySelector(".body-editor");
        const { body, buttons } = collectStepBody(bodyEditor);
        const delayValue = block.querySelector(".step-delay-value").value || "0";
        const delayUnit = block.querySelector(".step-delay-unit").value;
        const step = {
          id: block.querySelector(".step-id").value.trim(),
          delay: `${delayValue}${delayUnit}`,
          subject: block.querySelector(".step-subject").value.trim(),
          body,
          greeting: block.querySelector(".step-greeting").value.trim() || "Hey {first_name},",
        };
        const closing = block.querySelector(".step-closing").value.trim();
        if (closing) step.closing = closing;
        const override = block.querySelector(".step-cta-label").value.trim();
        if (override) step.cta_label = override;
        const ctaUrlOverride = block.querySelector(".step-cta-url").value.trim();
        if (ctaUrlOverride) step.cta_url = ctaUrlOverride;
        if (buttons.length) step.buttons = buttons;
        return step;
      });
      return {
        id: root.querySelector(".c-id").value.trim(),
        label: root.querySelector(".c-label").value.trim(),
        description: root.querySelector(".c-description").value.trim(),
        anchor: root.querySelector(".c-anchor").value,
        cta_url: root.querySelector(".c-cta-url").value.trim(),
        cta_label: ctaLabel,
        ready: root.querySelector(".c-ready").checked,
        show_header: root.querySelector(".c-show-header").checked,
        show_footer: root.querySelector(".c-show-footer").checked,
        schedule: collectSchedule(root),
        placeholders,
        steps,
      };
    }

    async function saveCampaignEditor() {
      const root = document.getElementById("campaign-editor-body");
      const activeTab = document.querySelector("#campaign-editor-tabs .tab-button.active")?.dataset.tab
        || "details";
      const payload = collectCampaignPayload(root);
      const originalId = root.dataset.originalId;
      const isNew = root.dataset.isNew === "true";
      const body = Object.assign({}, payload);
      if (!isNew && originalId && originalId !== payload.id) {
        body.previous_id = originalId;
      }
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await popup(data.message || data.error || "Save failed");
        return;
      }
      await load();
      const saved = data.campaign || payload;
      fillCampaignEditor(saved, { isNew: false, keepTab: activeTab });
      await popup("Campaign saved as v" + (saved.version || "?") + ".");
    }

    async function deleteCampaignById(id, label) {
      const ok = await popup(
        `Delete campaign "${label}"? Version history is kept, but the live campaign `
        + "stops sending. This cannot be undone.",
        { confirm: true }
      );
      if (!ok) return;
      const res = await fetch("/api/campaigns/" + encodeURIComponent(id), { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await popup(data.message || data.error || "Delete failed");
        return;
      }
      await load();
      renderCampaignsList();
      await popup("Campaign deleted.");
    }

    async function deleteCampaignEditor() {
      const root = document.getElementById("campaign-editor-body");
      const id = root.dataset.originalId;
      const labelInput = root.querySelector(".c-label");
      const label = (labelInput && labelInput.value) || id;
      const ok = await popup(
        `Delete campaign "${label}"? Version history is kept, but the live campaign `
        + "stops sending. This cannot be undone.",
        { confirm: true }
      );
      if (!ok) return;
      const res = await fetch("/api/campaigns/" + encodeURIComponent(id), { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await popup(data.message || data.error || "Delete failed");
        return;
      }
      closeSheet("sheet-campaign-editor");
      await load();
      openSheet("sheet-campaigns-list");
      await popup("Campaign deleted.");
    }

    // Picks "<base>-copy", "-copy-2", "-copy-3"... skipping ids already in use.
    function uniqueDuplicateId(baseId) {
      const existing = new Set((state.all_campaigns || []).map(c => c.id));
      let candidate = `${baseId}-copy`;
      let n = 2;
      while (existing.has(candidate)) {
        candidate = `${baseId}-copy-${n}`;
        n += 1;
      }
      return candidate;
    }

    // Clones whatever is currently in the editor (including any unsaved
    // edits) into a new, not-yet-saved campaign - a fresh id, "(copy)" label,
    // and Ready-for-prod / automation both forced off so a duplicate can never
    // go live before it's been reviewed. Nothing touches disk until Save.
    function duplicateCampaignEditor() {
      const root = document.getElementById("campaign-editor-body");
      const payload = collectCampaignPayload(root);
      const sourceId = payload.id || root.dataset.originalId || "campaign";
      const sourceLabel = payload.label || sourceId;
      payload.id = uniqueDuplicateId(sourceId);
      payload.label = sourceLabel + " (copy)";
      payload.ready = false;
      if (payload.schedule) payload.schedule.enabled = false;
      fillCampaignEditor(payload, { isNew: true, keepTab: "details" });
      popup(
        `Duplicated "${sourceLabel}" as "${payload.label}" (id ${payload.id}). `
        + "Nothing is saved yet - review it, then hit Save campaign."
      );
    }

    function historyEntryHtml(entry, index) {
      if (entry.deleted_at) {
        return `<div class="history-entry">`
          + `<span>${esc(formatWhen(entry.deleted_at))} · deleted (was v${entry.last_version})</span>`
          + "</div>";
      }
      if (entry.renamed_at) {
        return `<div class="history-entry">`
          + `<span>${esc(formatWhen(entry.renamed_at))} · renamed to `
          + `${esc(entry.renamed_to)} (was v${entry.last_version})</span></div>`;
      }
      return `<div class="history-entry">
        <span>${esc(formatWhen(entry.saved_at))} · v${entry.version}</span>
        <button type="button" class="secondary restore-history" data-index="${index}">Restore into editor</button>
      </div>`;
    }

    async function loadCampaignHistoryTab() {
      const root = document.getElementById("campaign-editor-body");
      const panel = root.querySelector('.tab-panel[data-tab-panel="history"] .history-list');
      if (!panel) return;
      const id = root.dataset.originalId;
      const res = await fetch("/api/campaigns/" + encodeURIComponent(id) + "/history");
      const data = await res.json().catch(() => ({ history: [] }));
      const entries = data.history || [];
      panel._entries = entries;
      panel.innerHTML = entries.length
        ? entries.map(historyEntryHtml).join("")
        : "<p class='muted'>No saved versions yet.</p>";
    }

    function restoreCampaignHistoryEntry(payload) {
      const root = document.getElementById("campaign-editor-body");
      const isNew = root.dataset.isNew === "true";
      fillCampaignEditor(payload, { isNew, keepTab: "details" });
    }

    function syncScheduleFields() {
      const root = document.getElementById("campaign-editor-body");
      const kind = root.querySelector('input[name="sch-kind"]:checked')?.value || "interval";
      const intervalRow = root.querySelector(".sch-interval-row");
      const weeklyRow = root.querySelector(".sch-weekly-row");
      if (intervalRow) intervalRow.style.opacity = kind === "interval" ? "1" : "0.4";
      if (weeklyRow) weeklyRow.style.opacity = kind === "weekly" ? "1" : "0.4";
      root.querySelectorAll(".sch-every-value, .sch-every-unit").forEach(el => {
        el.disabled = kind !== "interval";
      });
      root.querySelectorAll(".sch-day-box, .sch-time").forEach(el => {
        el.disabled = kind !== "weekly";
      });
    }

    function collectSchedule(root) {
      const kind = root.querySelector('input[name="sch-kind"]:checked')?.value || "interval";
      const enabled = !!root.querySelector(".sch-enabled")?.checked;
      const everyValue = Math.max(1, Number(root.querySelector(".sch-every-value")?.value || 60));
      const everyUnit = root.querySelector(".sch-every-unit")?.value || "minutes";
      const everyMinutes = everyUnit === "hours" ? everyValue * 60 : everyValue;
      const days = [...root.querySelectorAll(".sch-day-box:checked")].map(b => b.value);
      const time = root.querySelector(".sch-time")?.value || "09:00";
      // Nothing configured and off: don't write a schedule block at all.
      if (!enabled && kind === "interval" && everyMinutes === 60 && !days.length && time === "09:00") {
        return null;
      }
      const schedule = { enabled, kind };
      if (kind === "interval") {
        schedule.every_minutes = everyMinutes;
      } else {
        schedule.days = days;
        schedule.time = time;
      }
      return schedule;
    }

    function automationStatusHtml(st, campaignStatus) {
      if (!campaignStatus) return "<p class='muted'>Save the campaign to see automation status.</p>";
      const warnings = [];
      if (!st.running) warnings.push("Scheduler thread is not running.");
      if (st.pii_locked) warnings.push("PII is locked - unlock names/emails or scheduled runs are skipped.");
      if (st.mode === "prod" && !campaignStatus.ready) {
        warnings.push("Prod mode + this campaign is not marked ready, so nothing will send.");
      }
      const line = (label, value) => value
        ? `<p style="margin:0.15rem 0;"><strong>${label}:</strong> ${esc(value)}</p>` : "";
      return `
        ${warnings.map(w => `<p class="automation-warn">${esc(w)}</p>`).join("")}
        ${line("Mode", st.mode)}
        ${line("Schedule", campaignStatus.summary)}
        ${line("Next check", formatWhen(campaignStatus.next_run) || (campaignStatus.enabled ? "soon" : "-"))}
        ${line("Last run", formatWhen(campaignStatus.last_run))}
        ${line("Last result", campaignStatus.last_result)}
        ${campaignStatus.last_error
          ? `<p class="automation-warn">Last error: ${esc(campaignStatus.last_error)}</p>` : ""}`;
    }

    // Down to the second, e.g. "1h 4m 12s" / "4m 12s" / "12s". Days keep
    // whole-minute precision - seconds do not matter at that scale.
    function humanDurationPrecise(secs) {
      if (secs == null) return "";
      if (secs <= 0) return "now";
      secs = Math.floor(secs);
      const d = Math.floor(secs / 86400);
      const h = Math.floor((secs % 86400) / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      if (d) return `${d}d ${h}h ${m}m`;
      if (h) return `${h}h ${m}m ${s}s`;
      if (m) return `${m}m ${s}s`;
      return `${s}s`;
    }

    // Patients-tab ambient countdown - "how long until automation next checks
    // this campaign" without opening the campaign editor. Respects whatever
    // campaign the patient list is currently filtered to. Ticks live every
    // second between the 30s /api/scheduler polls, using the clock offset
    // captured at the last poll rather than that poll's now-stale "now".
    function renderAutomationCountdown() {
      const el = document.getElementById("automation-countdown");
      const toggleBtn = document.getElementById("toggle-automation");
      if (!el) return;
      const st = state.schedulerStatus;
      if (!st) {
        el.textContent = "Automation: loading...";
        if (toggleBtn) toggleBtn.hidden = true;
        return;
      }
      if (toggleBtn) {
        // Nothing to pause/resume if the scheduler thread itself is not up.
        toggleBtn.hidden = !st.running;
        toggleBtn.textContent = st.paused ? "Resume automation" : "Pause automation";
      }
      if (!st.running) {
        el.textContent = "Automation: not running - start ./mailer.sh to enable scheduled sends.";
        return;
      }
      if (st.paused) {
        el.textContent = "Automation: paused - nothing will send until you resume.";
        return;
      }
      const entries = Object.entries(st.campaigns || {})
        .filter(([id]) => !patientCampaignFilter || id === patientCampaignFilter)
        .map(([id, c]) => ({ id, ...c }))
        .filter(c => c.enabled && c.next_run);
      if (!entries.length) {
        el.textContent = patientCampaignFilter
          ? "Automation: running, but this campaign has no schedule enabled."
          : "Automation: running, but no campaign has a schedule enabled.";
        return;
      }
      entries.sort((a, b) => new Date(a.next_run) - new Date(b.next_run));
      const nowMs = Date.now() + (state.schedulerClockOffsetMs || 0);
      if (patientCampaignFilter) {
        const c = entries[0];
        const secs = (new Date(c.next_run).getTime() - nowMs) / 1000;
        el.textContent = "Automation: next check for this campaign in " + humanDurationPrecise(secs)
          + (st.mode === "prod" && !c.ready ? " (not ready for prod - will not send)" : "");
        return;
      }
      const soonest = entries[0];
      const soonestLabel = (state.all_campaigns || []).find(c => c.id === soonest.id)?.label || soonest.id;
      const secs = (new Date(soonest.next_run).getTime() - nowMs) / 1000;
      el.textContent = `Automation: ${entries.length} campaign${entries.length === 1 ? "" : "s"} scheduled - `
        + `next check is ${soonestLabel} in ${humanDurationPrecise(secs)}`;
    }

    async function loadSchedulerStatus() {
      try {
        const res = await fetch("/api/scheduler");
        state.schedulerStatus = await res.json();
        state.schedulerClockOffsetMs = new Date(state.schedulerStatus.now).getTime() - Date.now();
      } catch (err) {
        state.schedulerStatus = null;
      }
      renderAutomationCountdown();
    }

    // One button, both directions - pause stops every campaign immediately;
    // resume resets every enabled campaign's timer to a fresh full interval
    // (see set_paused() in mailer/scheduler.py) rather than firing a backlog.
    async function toggleAutomation() {
      const paused = !!(state.schedulerStatus && state.schedulerStatus.paused);
      const ok = await popup(
        paused
          ? "Resume all campaign automation? Every enabled campaign's timer restarts fresh from right now - it will not immediately fire a backlog from while it was paused."
          : "Pause all campaign automation? No scheduled campaign will send until you resume.",
        { confirm: true }
      );
      if (!ok) return;
      await fetch(paused ? "/api/scheduler/resume" : "/api/scheduler/pause", { method: "POST" });
      await loadSchedulerStatus();
    }

    function automationPreviewRowHtml(item) {
      return `<tr>
        <td>${esc(item.campaign_label)}</td>
        <td>${esc(item.name)}</td>
        <td>${esc(item.email)}</td>
        <td>${esc(item.step)}</td>
      </tr>`;
    }

    function automationPreviewBodyHtml(data, { showRunButton }) {
      const items = data.items || [];
      const skipped = data.skipped || [];
      const pausedNote = data.paused
        ? "<p class='automation-warn'>Automation is currently paused"
          + (showRunButton ? " - running now still sends, this is a manual override." : " - nothing here will actually send until you resume.")
          + "</p>"
        : "";
      const skippedNote = skipped.length
        ? `<p class="muted">Not previewed (not ready for prod): ${skipped.map(s => esc(s.label)).join(", ")}</p>`
        : "";
      if (!items.length) {
        return pausedNote + skippedNote + "<p class='muted'>Nobody is due right now.</p>";
      }
      const runButton = showRunButton
        ? `<div class="row" style="justify-content:flex-end;">
            <button type="button" id="confirm-run-automation">Send these ${items.length} email(s) now</button>
          </div>`
        : "";
      return pausedNote + skippedNote + runButton + `
        <table>
          <thead><tr><th>Campaign</th><th>Name</th><th>Email</th><th>Step</th></tr></thead>
          <tbody>${items.map(automationPreviewRowHtml).join("")}</tbody>
        </table>`;
    }

    // "What would the next tick send if it ran right now" - a dry run across
    // every automation-enabled campaign, changes nothing. Shared by both the
    // read-only "Preview automation" button and "Run automation now", which
    // shows the same list plus a confirm button to actually send it.
    async function loadAutomationPreview({ showRunButton }) {
      const body = document.getElementById("automation-preview-body");
      body.innerHTML = "<p class='muted'>Loading...</p>";
      openSheet("sheet-automation-preview");
      try {
        const res = await fetch("/api/scheduler/preview");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          body.innerHTML = "<p class='muted'>" + esc(data.message || data.error || "Could not load preview.") + "</p>";
          return;
        }
        body.innerHTML = automationPreviewBodyHtml(data, { showRunButton });
        const confirmBtn = document.getElementById("confirm-run-automation");
        if (confirmBtn) confirmBtn.onclick = runAutomationNow;
      } catch (err) {
        body.innerHTML = "<p class='muted'>Could not load preview. Check the mailer is running.</p>";
      }
    }

    function previewAutomation() {
      return loadAutomationPreview({ showRunButton: false });
    }

    function openRunAutomation() {
      return loadAutomationPreview({ showRunButton: true });
    }

    // Actually fires every automation-enabled campaign's due sends, right
    // now - real emails in whatever mode is currently active. Shows the
    // per-campaign result in the same sheet the preview was in.
    async function runAutomationNow() {
      const body = document.getElementById("automation-preview-body");
      const ok = await popup(
        "Send all due automation emails right now? This uses real SMTP in the current mode.",
        { confirm: true }
      );
      if (!ok) return;
      body.innerHTML = "<p class='muted'>Sending...</p>";
      try {
        const res = await fetch("/api/scheduler/run-all", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          body.innerHTML = "<p class='muted'>" + esc(data.message || data.error || "Run failed.") + "</p>";
          return;
        }
        const results = data.results || [];
        const skipped = data.skipped || [];
        const skippedNote = skipped.length
          ? `<p class="muted">Not run (not ready for prod): ${skipped.map(s => esc(s.label)).join(", ")}</p>`
          : "";
        const rows = results.map(r => `<tr>
          <td>${esc(r.campaign_label)}</td>
          <td>${r.error ? "Error" : "Sent"}</td>
          <td>${esc(r.error || r.sent || "")}</td>
        </tr>`).join("");
        body.innerHTML = skippedNote + (results.length
          ? `<table><thead><tr><th>Campaign</th><th>Result</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table>`
          : "<p class='muted'>Nothing was due.</p>");
        await load();
        await loadSchedulerStatus();
      } catch (err) {
        body.innerHTML = "<p class='muted'>Run failed. Check the mailer is running.</p>";
      }
    }

    async function loadAutomationStatus() {
      const root = document.getElementById("campaign-editor-body");
      const box = root.querySelector('.tab-panel[data-tab-panel="automation"] .automation-status');
      if (!box) return;
      const id = root.dataset.originalId;
      try {
        const res = await fetch("/api/scheduler");
        const st = await res.json();
        box.innerHTML = automationStatusHtml(st, (st.campaigns || {})[id]);
      } catch (err) {
        box.innerHTML = "<p class='automation-warn'>Could not load scheduler status.</p>";
      }
    }

    async function runCampaignNow() {
      const root = document.getElementById("campaign-editor-body");
      const id = root.dataset.originalId;
      if (root.dataset.isNew === "true") {
        await popup("Save the campaign first, then Run now.");
        return;
      }
      const ok = await popup(
        "Run this campaign now? It will send due emails to real recipients in the current mode.",
        { confirm: true }
      );
      if (!ok) return;
      const res = await fetch("/api/campaigns/" + encodeURIComponent(id) + "/run-now", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      await popup(data.message || data.error || "Done.");
      loadAutomationStatus();
      load();
    }

    // Renders the given step for the given patient (or a dummy patient if
    // patientId is blank) and opens it in a new tab. Shared by the campaign
    // editor's per-step Preview button and the Patients tab's inline preview.
    async function openStepPreview(campaignId, stepId, patientId, notFoundMessage) {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step_id: stepId, patient_id: patientId || "" })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await popup(data.message || data.error || notFoundMessage || "Preview failed.");
        return;
      }
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(data.html || "<p>No preview.</p>");
        win.document.close();
      }
    }

    async function previewStepFromBlock(root, stepBlock) {
      const cid = root.dataset.originalId;
      const stepId = stepBlock.querySelector(".step-id").value.trim();
      if (!stepId) {
        await popup("Give the step an id first.");
        return;
      }
      await openStepPreview(cid, stepId, selected, "Preview failed. Save the campaign first.");
    }

    function sendStepFromBlock(root, stepBlock) {
      const stepId = stepBlock.querySelector(".step-id").value.trim();
      openPatientPicker(async (patientId) => {
        const cid = root.dataset.originalId;
        const patient = state.patients.find(p => p.id === patientId);
        const label = patient ? `${patient.first_name} (${patient.email})` : "this patient";
        const ok = await popup(
          `Force-send step "${stepId}" to ${label} right now? This uses the last saved `
          + "version - save first if you just edited it.",
          { confirm: true }
        );
        if (!ok) return;
        const res = await fetch(`/api/campaigns/${encodeURIComponent(cid)}/send-one`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patient_id: patientId, step_id: stepId, dry_run: false })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          await popup(data.message || data.error || "Send failed");
          return;
        }
        await load();
        await popup(data.message || "Sent.");
      });
    }

    async function createNewCampaign() {
      const res = await fetch("/api/campaigns/new");
      const data = await res.json().catch(() => ({}));
      const campaign = data.campaign;
      if (!campaign) {
        await popup("Could not create a new campaign.");
        return;
      }
      openCampaignEditor(campaign, { isNew: true });
    }

    async function clearSendHistory() {
      const ok = await popup(
        "Clear all send history and reset every patient's last step on every campaign? "
        + "This cannot be undone.",
        { confirm: true }
      );
      if (!ok) return;
      const res = await fetch("/api/clear-history", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await popup(data.message || data.error || "Could not clear history.");
        return;
      }
      await load();
      await popup("Send history cleared. Drips can fire again from the first step.");
    }

    function bindCampaignsListEvents() {
      const container = document.getElementById("campaigns-list");
      if (!container) return;
      container.addEventListener("click", (event) => {
        const row = event.target.closest(".campaign-row");
        if (!row) return;
        const id = row.dataset.campaignId;
        const campaign = (state.all_campaigns || []).find(c => c.id === id);
        if (!campaign) return;
        if (event.target.closest(".edit-campaign-row")) {
          openCampaignEditor(campaign);
        } else if (event.target.closest(".delete-campaign-row")) {
          deleteCampaignById(campaign.id, campaign.label);
        }
      });
    }

    function bindCampaignEditorEvents() {
      const sheet = document.getElementById("sheet-campaign-editor");
      if (!sheet) return;

      document.execCommand("defaultParagraphSeparator", false, "p");

      document.querySelectorAll("#campaign-editor-tabs .tab-button").forEach(button => {
        button.onclick = () => switchCampaignTab(button.dataset.tab);
      });
      document.getElementById("campaign-editor-back").onclick = () => {
        closeSheet("sheet-campaign-editor");
        openSheet("sheet-campaigns-list");
      };
      document.getElementById("campaign-editor-save").onclick = saveCampaignEditor;
      document.getElementById("campaign-editor-duplicate").onclick = duplicateCampaignEditor;
      document.getElementById("campaign-editor-delete").onclick = deleteCampaignEditor;

      sheet.addEventListener("mousedown", (event) => {
        if (event.target.closest(".rte-bold, .rte-italic, .rte-underline, .rte-strike, "
          + ".rte-ul, .rte-ol, .rte-link, .rte-clear, .rte-button-insert")) {
          event.preventDefault();
        }
      });

      // If editing removes the editable paragraph next to a button block, put it
      // back so the caret can never get trapped against the button.
      sheet.addEventListener("keyup", (event) => {
        const editor = event.target.closest && event.target.closest(".body-editor");
        if (editor) normalizeBodyEditor(editor);
      });

      sheet.addEventListener("click", async (event) => {
        const target = event.target;
        const root = document.getElementById("campaign-editor-body");

        if (target.closest(".rte-bold")) { document.execCommand("bold"); return; }
        if (target.closest(".rte-italic")) { document.execCommand("italic"); return; }
        if (target.closest(".rte-underline")) { document.execCommand("underline"); return; }
        if (target.closest(".rte-strike")) { document.execCommand("strikeThrough"); return; }
        if (target.closest(".rte-ul")) { document.execCommand("insertUnorderedList"); return; }
        if (target.closest(".rte-ol")) { document.execCommand("insertOrderedList"); return; }
        if (target.closest(".rte-link")) { insertLink(); return; }
        if (target.closest(".rte-clear")) {
          document.execCommand("removeFormat");
          document.execCommand("unlink");
          return;
        }
        if (target.closest(".rte-button-insert")) {
          const sel = window.getSelection();
          savedButtonRange = null;
          savedButtonEditor = null;
          if (sel.rangeCount) {
            const range = sel.getRangeAt(0);
            const anchor = range.commonAncestorContainer;
            const anchorEl = anchor.nodeType === 1 ? anchor : anchor.parentElement;
            const editor = anchorEl && anchorEl.closest(".body-editor");
            if (editor) {
              savedButtonRange = range.cloneRange();
              savedButtonEditor = editor;
            }
          }
          if (!savedButtonEditor) {
            const firstEditor = target.closest(".step-block")?.querySelector(".body-editor");
            if (firstEditor) savedButtonEditor = firstEditor;
          }
          openButtonDialog({}, null);
          return;
        }
        if (target.classList.contains("edit-step-button")) {
          const block = target.closest(".email-button-block");
          if (!block) return;
          openButtonDialog({
            label: block.dataset.label,
            url: block.dataset.url,
            align: block.dataset.align,
            bg: block.dataset.bg,
            color: block.dataset.color,
          }, block);
          return;
        }
        if (target.classList.contains("remove-step-button")) {
          const ok = await popup("Remove this button? Are you sure?", { confirm: true });
          if (!ok) return;
          target.closest(".email-button-block").remove();
          return;
        }
        if (target.classList.contains("add-step")) {
          addStepTo(root);
          return;
        }
        if (target.classList.contains("remove-step")) {
          event.preventDefault();
          const block = target.closest(".step-block");
          const stepId = block.querySelector(".step-id").value.trim() || "this step";
          const first = await popup(
            "Delete step \"" + stepId + "\"? It takes effect when you Save the campaign.",
            { confirm: true }
          );
          if (!first) return;
          const second = await popup(
            "Really delete step \"" + stepId + "\"? This cannot be undone once you Save.",
            { confirm: true }
          );
          if (!second) return;
          block.remove();
          return;
        }
        if (target.classList.contains("move-step-up")) {
          moveSibling(target.closest(".step-block"), "up");
          return;
        }
        if (target.classList.contains("move-step-down")) {
          moveSibling(target.closest(".step-block"), "down");
          return;
        }
        if (target.classList.contains("var-help-btn")) {
          openVarHelp(target.dataset.var);
          return;
        }
        if (target.classList.contains("add-placeholder")) {
          addPlaceholderTo(root);
          return;
        }
        if (target.classList.contains("remove-placeholder")) {
          const ok = await popup("Remove this placeholder? Are you sure?", { confirm: true });
          if (!ok) return;
          target.closest(".placeholder-row").remove();
          return;
        }
        if (target.classList.contains("restore-history")) {
          const historyPanel = target.closest(".history-list");
          const index = Number(target.dataset.index);
          const entry = historyPanel && historyPanel._entries && historyPanel._entries[index];
          if (entry && entry.payload) {
            restoreCampaignHistoryEntry(entry.payload);
          }
          return;
        }
        if (target.classList.contains("preview-step")) {
          await previewStepFromBlock(root, target.closest(".step-block"));
          return;
        }
        if (target.closest(".send-step")) {
          event.preventDefault();
          sendStepFromBlock(root, target.closest(".step-block"));
          return;
        }
        if (target.classList.contains("run-campaign-now")) {
          runCampaignNow();
          return;
        }
        if (target.classList.contains("refresh-automation-status")) {
          loadAutomationStatus();
          return;
        }
      });

      sheet.addEventListener("change", (event) => {
        if (event.target.name === "sch-kind") syncScheduleFields();
      });
    }

    document.getElementById("mode-select").onchange = async () => {
      const mode = document.getElementById("mode-select").value;
      if (mode === "prod") {
        const ok = await popup(
          "Switch to Prod? This uses the real patient list. Dev test patients stay in data/dev.",
          { confirm: true }
        );
        if (!ok) {
          document.getElementById("mode-select").value = state.mode || "dev";
          return;
        }
        // Newly entering Prod: always show the banner again.
        setProdBannerDismissed(false);
      }
      await fetch("/api/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode })
      });
      selected = null;
      await load();
    };

    try {
      bindSheetShell();
      bindBoardTabs();
      bindSendBox();
      bindCampaignsListEvents();
      bindCampaignEditorEvents();
      document.getElementById("insert-button-confirm").onclick = applyButtonDialog;
      document.getElementById("clear-send-history").onclick = clearSendHistory;
      document.getElementById("clear-data").onclick = clearBoardData;
      document.getElementById("refresh").onclick = load;
      document.getElementById("patient-filter-campaign").onchange = (event) => {
        patientCampaignFilter = event.target.value;
        renderRows();
        renderAutomationCountdown();
      };
      document.getElementById("toggle-automation").onclick = toggleAutomation;
      document.getElementById("preview-automation").onclick = previewAutomation;
      document.getElementById("run-automation").onclick = openRunAutomation;
      document.getElementById("open-send").onclick = () => openSheet("sheet-send");
      document.getElementById("open-campaigns").onclick = () => {
        renderCampaignsList();
        openSheet("sheet-campaigns-list");
      };
      document.getElementById("open-ready").onclick = () => openSheet("sheet-ready");
      document.getElementById("save-ready").onclick = saveReadyChanges;
      document.getElementById("open-add").onclick = () => openSheet("sheet-add-patient");
      document.getElementById("new-campaign").onclick = createNewCampaign;
      document.getElementById("save-patient").onclick = async () => {
        const campaign_ids = [...document.querySelectorAll("#add-campaigns input:checked")].map(i => i.value);
        await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: document.getElementById("first").value,
            email: document.getElementById("email").value,
            interest: document.getElementById("interest").value,
            product: document.getElementById("product").value,
            status: document.getElementById("status").value,
            abandoned_at: document.getElementById("abandoned").value,
            cta_url: document.getElementById("cta").value,
            campaign_ids
          })
        });
        closeSheet("sheet-add-patient");
        await load();
      };
      load();
      loadSchedulerStatus();
      setInterval(loadSchedulerStatus, 30000);
      setInterval(renderAutomationCountdown, 1000);
    } catch (err) {
      showLoadError(err);
    }
