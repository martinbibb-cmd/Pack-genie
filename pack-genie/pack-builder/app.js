// app.js - Pack-Builder Genie v0.1

const STORAGE_KEY = "packBuilder_packs_v1";

let packFile = {
  meta: {
    schemaVersion: "1.0.0",
    currency: "GBP",
  },
  packs: [],
};

let currentEditingId = null; // pack id being edited (null = new)

document.addEventListener("DOMContentLoaded", () => {
  init();
});

async function init() {
  await loadPackFile();
  bindEvents();
  renderPackList();
}

async function loadPackFile() {
  // Try localStorage first
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      packFile = JSON.parse(stored);
      if (!packFile.packs) packFile.packs = [];
      return;
    } catch (e) {
      console.warn("Failed to parse stored packs, falling back to fetch:", e);
    }
  }

  // Fallback: fetch /data/packs.json
  try {
    const res = await fetch("../data/packs.json", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      packFile = json;
      if (!packFile.packs) packFile.packs = [];
      saveToStorage();
    }
  } catch (e) {
    console.warn("No packs.json found or fetch failed. Starting empty.", e);
    packFile = {
      meta: { schemaVersion: "1.0.0", currency: "GBP" },
      packs: [],
    };
    saveToStorage();
  }
}

function saveToStorage() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(packFile));
}

function bindEvents() {
  document.getElementById("newPackBtn").addEventListener("click", () => {
    openEditor(null);
  });

  document
    .getElementById("downloadJsonBtn")
    .addEventListener("click", downloadPacks);

  document
    .getElementById("importJsonBtn")
    .addEventListener("click", () => {
      document.getElementById("importFileInput").click();
    });

  document
    .getElementById("importFileInput")
    .addEventListener("change", handleImportFile);

  document
    .getElementById("closeEditorBtn")
    .addEventListener("click", closeEditor);

  document
    .getElementById("cancelEditBtn")
    .addEventListener("click", closeEditor);

  document
    .getElementById("packForm")
    .addEventListener("input", updatePreviewJson);

  document
    .getElementById("packForm")
    .addEventListener("submit", onSavePack);

  document
    .getElementById("addMaterialBtn")
    .addEventListener("click", () => addMaterialRow());

  document
    .getElementById("addIncludeRuleBtn")
    .addEventListener("click", () =>
      addRuleRow("includeRulesBody")
    );

  document
    .getElementById("addExcludeRuleBtn")
    .addEventListener("click", () =>
      addRuleRow("excludeRulesBody")
    );

  document
    .getElementById("testPackBtn")
    .addEventListener("click", openTestModal);

  document
    .getElementById("closeTestBtn")
    .addEventListener("click", closeTestModal);

  document.getElementById("runTestBtn").addEventListener("click", runTest);

  // Bug Report event listeners
  document
    .getElementById("bugReportBtn")
    .addEventListener("click", openBugReportModal);

  document
    .getElementById("closeBugReportBtn")
    .addEventListener("click", closeBugReportModal);

  document
    .getElementById("cancelBugReportBtn")
    .addEventListener("click", closeBugReportModal);

  document
    .getElementById("bugReportForm")
    .addEventListener("submit", handleBugReportSubmit);
}

function renderPackList() {
  const tbody = document.getElementById("packTableBody");
  tbody.innerHTML = "";

  packFile.packs.forEach((pack) => {
    const tr = document.createElement("tr");

    const idTd = document.createElement("td");
    idTd.textContent = pack.id;

    const typeTd = document.createElement("td");
    typeTd.textContent = pack.type || "";

    const brandTd = document.createElement("td");
    brandTd.textContent = pack.brand || "";

    const titleTd = document.createElement("td");
    titleTd.textContent = pack.model
      ? `${pack.model} – ${pack.title}`
      : pack.title;

    const enabledTd = document.createElement("td");
    const enabledCheckbox = document.createElement("input");
    enabledCheckbox.type = "checkbox";
    enabledCheckbox.checked = !!pack.enabled;
    enabledCheckbox.addEventListener("change", () => {
      pack.enabled = enabledCheckbox.checked;
      saveToStorage();
    });
    enabledTd.appendChild(enabledCheckbox);

    const actionsTd = document.createElement("td");
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => openEditor(pack.id));

    const cloneBtn = document.createElement("button");
    cloneBtn.textContent = "Clone";
    cloneBtn.addEventListener("click", () => clonePack(pack.id));

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => deletePack(pack.id));

    actionsTd.append(editBtn, cloneBtn, delBtn);

    tr.append(idTd, typeTd, brandTd, titleTd, enabledTd, actionsTd);
    tbody.appendChild(tr);
  });
}

function openEditor(packId) {
  currentEditingId = packId;
  const modal = document.getElementById("editorModal");
  const titleEl = document.getElementById("editorTitle");

  clearForm();

  if (packId) {
    titleEl.textContent = "Edit Pack";
    const pack = packFile.packs.find((p) => p.id === packId);
    if (!pack) return;

    document.getElementById("packId").value = pack.id;
    document.getElementById("packId").readOnly = true;
    document.getElementById("packType").value = pack.type || "";
    document.getElementById("packBrand").value = pack.brand || "";
    document.getElementById("packModel").value = pack.model || "";
    document.getElementById("packTitle").value = pack.title || "";
    document.getElementById("packEnabled").checked = !!pack.enabled;

    document.getElementById("descEngineer").value =
      pack.description_engineer || "";
    document.getElementById("descCustomer").value =
      pack.description_customer || "";

    document.getElementById("labourHours").value =
      pack.labour?.hours ?? "";
    document.getElementById("labourRateRef").value =
      pack.labour?.rateRef ?? "";

    document.getElementById("subpacksInput").value = (pack.subpacks || []).join(
      ", "
    );

    // Materials
    (pack.materials || []).forEach((m) => addMaterialRow(m));

    // Rules
    (pack.rules?.include_if || []).forEach((r) =>
      addRuleRow("includeRulesBody", r)
    );
    (pack.rules?.exclude_if || []).forEach((r) =>
      addRuleRow("excludeRulesBody", r)
    );
  } else {
    titleEl.textContent = "New Pack";
    document.getElementById("packId").readOnly = false;
  }

  updatePreviewJson();
  modal.classList.remove("hidden");
}

function closeEditor() {
  const modal = document.getElementById("editorModal");
  modal.classList.add("hidden");
  currentEditingId = null;
}

function clearForm() {
  document.getElementById("packForm").reset();
  document.getElementById("packId").readOnly = false;
  document.getElementById("materialsBody").innerHTML = "";
  document.getElementById("includeRulesBody").innerHTML = "";
  document.getElementById("excludeRulesBody").innerHTML = "";
  document.getElementById("previewJson").value = "";
}

function addMaterialRow(material = {}) {
  const tbody = document.getElementById("materialsBody");
  const tr = document.createElement("tr");

  const fields = ["code", "name", "unit_cost", "unit_price", "quantity"];

  fields.forEach((field) => {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = field === "quantity" ? "number" : "text";
    if (["unit_cost", "unit_price", "quantity"].includes(field)) {
      input.setAttribute("step", "0.01");
    }
    input.dataset.field = field;
    input.value = material[field] ?? "";
    input.addEventListener("input", updatePreviewJson);
    td.appendChild(input);
    tr.appendChild(td);
  });

  const delTd = document.createElement("td");
  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.textContent = "✕";
  delBtn.addEventListener("click", () => {
    tr.remove();
    updatePreviewJson();
  });
  delTd.appendChild(delBtn);
  tr.appendChild(delTd);

  tbody.appendChild(tr);
}

function addRuleRow(tbodyId, rule = {}) {
  const tbody = document.getElementById(tbodyId);
  const tr = document.createElement("tr");

  // Field
  const fieldTd = document.createElement("td");
  const fieldInput = document.createElement("input");
  fieldInput.type = "text";
  fieldInput.dataset.field = "field";
  fieldInput.value = rule.field || "";
  fieldInput.addEventListener("input", updatePreviewJson);
  fieldTd.appendChild(fieldInput);

  // Operator
  const opTd = document.createElement("td");
  const opSelect = document.createElement("select");
  opSelect.dataset.field = "operator";
  [
    "",
    "equals",
    "not_equals",
    "greater_than",
    "less_than",
    "contains",
    "not_contains",
  ].forEach((op) => {
    const opt = document.createElement("option");
    opt.value = op;
    opt.textContent = op || "Select";
    opSelect.appendChild(opt);
  });
  opSelect.value = rule.operator || "";
  opSelect.addEventListener("change", updatePreviewJson);
  opTd.appendChild(opSelect);

  // Value
  const valTd = document.createElement("td");
  const valInput = document.createElement("input");
  valInput.type = "text";
  valInput.dataset.field = "value";
  valInput.value = rule.value ?? "";
  valInput.addEventListener("input", updatePreviewJson);
  valTd.appendChild(valInput);

  // Delete
  const delTd = document.createElement("td");
  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.textContent = "✕";
  delBtn.addEventListener("click", () => {
    tr.remove();
    updatePreviewJson();
  });
  delTd.appendChild(delBtn);

  tr.append(fieldTd, opTd, valTd, delTd);
  tbody.appendChild(tr);
}

function readPackFromForm() {
  const id = document.getElementById("packId").value.trim();
  const type = document.getElementById("packType").value;
  const brand = document.getElementById("packBrand").value.trim();
  const model = document.getElementById("packModel").value.trim();
  const title = document.getElementById("packTitle").value.trim();
  const enabled = document.getElementById("packEnabled").checked;

  const descEngineer = document.getElementById("descEngineer").value.trim();
  const descCustomer = document.getElementById("descCustomer").value.trim();

  const labourHours = parseFloat(
    document.getElementById("labourHours").value
  );
  const labourRateRef = document
    .getElementById("labourRateRef")
    .value.trim();

  const subpacksRaw = document
    .getElementById("subpacksInput")
    .value.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const materials = [];
  document
    .querySelectorAll("#materialsBody tr")
    .forEach((tr) => {
      const row = {};
      tr.querySelectorAll("input").forEach((input) => {
        const field = input.dataset.field;
        if (!field) return;
        let val = input.value;
        if (["unit_cost", "unit_price", "quantity"].includes(field)) {
          val = val === "" ? 0 : parseFloat(val);
        }
        row[field] = val;
      });
      if (row.code || row.name) {
        materials.push(row);
      }
    });

  const include_if = readRulesFromTable("includeRulesBody");
  const exclude_if = readRulesFromTable("excludeRulesBody");

  const pack = {
    id,
    type,
    brand,
    model,
    title,
    description_engineer: descEngineer || undefined,
    description_customer: descCustomer || undefined,
    labour: {
      hours: isNaN(labourHours) ? 0 : labourHours,
      rateRef: labourRateRef || "engineer_standard",
    },
    materials,
    subpacks: subpacksRaw,
    rules: {
      include_if,
      exclude_if,
    },
    enabled,
  };

  return pack;
}

function readRulesFromTable(tbodyId) {
  const rules = [];
  document.querySelectorAll(`#${tbodyId} tr`).forEach((tr) => {
    const rule = {};
    tr.querySelectorAll("input, select").forEach((el) => {
      const field = el.dataset.field;
      if (!field) return;
      let val = el.value;
      if (field === "value") {
        // Basic parsing for number / boolean
        if (val === "true") val = true;
        else if (val === "false") val = false;
        else if (!isNaN(parseFloat(val)) && val.trim() !== "") val = parseFloat(val);
      }
      rule[field] = val;
    });
    if (rule.field && rule.operator) {
      rules.push(rule);
    }
  });
  return rules;
}

function updatePreviewJson() {
  try {
    const pack = readPackFromForm();
    const json = JSON.stringify(pack, null, 2);
    document.getElementById("previewJson").value = json;
  } catch (e) {
    // swallow preview errors
  }
}

function onSavePack(event) {
  event.preventDefault();
  const pack = readPackFromForm();
  if (!pack.id || !pack.type || !pack.title) {
    alert("Pack ID, type and title are required.");
    return;
  }

  const existingIdx = packFile.packs.findIndex((p) => p.id === pack.id);
  if (existingIdx >= 0) {
    packFile.packs[existingIdx] = pack;
  } else {
    packFile.packs.push(pack);
  }

  saveToStorage();
  renderPackList();
  closeEditor();
}

function clonePack(packId) {
  const pack = packFile.packs.find((p) => p.id === packId);
  if (!pack) return;
  const copy = JSON.parse(JSON.stringify(pack));
  copy.id = `${copy.id}_copy`;
  packFile.packs.push(copy);
  saveToStorage();
  renderPackList();
}

function deletePack(packId) {
  if (!confirm(`Delete pack "${packId}"?`)) return;
  packFile.packs = packFile.packs.filter((p) => p.id !== packId);
  saveToStorage();
  renderPackList();
}

function downloadPacks() {
  const blob = new Blob([JSON.stringify(packFile, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "packs.json";
  a.click();
  URL.revokeObjectURL(url);
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target.result);
      if (!json.packs || !Array.isArray(json.packs)) {
        alert("Invalid packs file: no 'packs' array.");
        return;
      }
      // quick uniqueness check
      const ids = new Set();
      for (const p of json.packs) {
        if (!p.id) {
          alert("Every pack must have an id.");
          return;
        }
        if (ids.has(p.id)) {
          alert(`Duplicate pack id found: ${p.id}`);
          return;
        }
        ids.add(p.id);
      }
      packFile = json;
      saveToStorage();
      renderPackList();
    } catch (err) {
      alert("Failed to parse JSON: " + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = ""; // reset
}

// ------ Test / Rule evaluation ------

function openTestModal() {
  const modal = document.getElementById("testModal");
  // Seed a basic context if empty
  const textarea = document.getElementById("testInputJson");
  if (!textarea.value.trim()) {
    textarea.value = JSON.stringify(
      {
        system: { system_type: "combi" },
        boiler: { model: "wor_8000_30kw_combi" },
        site: {
          cold_main_flow_lpm: 15,
          supply_gas_pipe_diameter_mm: 22,
          bathrooms_count: 2,
        },
      },
      null,
      2
    );
  }
  document.getElementById("testResult").textContent = "";
  modal.classList.remove("hidden");
}

function closeTestModal() {
  document.getElementById("testModal").classList.add("hidden");
}

function runTest() {
  const resultEl = document.getElementById("testResult");
  let ctx;
  try {
    ctx = JSON.parse(document.getElementById("testInputJson").value);
  } catch (e) {
    resultEl.textContent = "Invalid JSON: " + e.message;
    return;
  }

  const pack = readPackFromForm();

  const evalResult = evaluatePackRules(pack, ctx);
  resultEl.textContent = JSON.stringify(evalResult, null, 2);
}

function getField(obj, path) {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function evaluateCondition(cond, ctx) {
  const actual = getField(ctx, cond.field);
  const expected = cond.value;

  switch (cond.operator) {
    case "equals":
      return actual === expected;
    case "not_equals":
      return actual !== expected;
    case "greater_than":
      return Number(actual) > Number(expected);
    case "less_than":
      return Number(actual) < Number(expected);
    case "contains":
      return Array.isArray(actual) && actual.includes(expected);
    case "not_contains":
      return Array.isArray(actual) && !actual.includes(expected);
    default:
      return false;
  }
}

function evaluatePackRules(pack, ctx) {
  const include_if = pack.rules?.include_if || [];
  const exclude_if = pack.rules?.exclude_if || [];

  const includeDetails = include_if.map((c) => ({
    condition: c,
    passed: evaluateCondition(c, ctx),
  }));

  const excludeDetails = exclude_if.map((c) => ({
    condition: c,
    passed: evaluateCondition(c, ctx),
  }));

  const includePass = includeDetails.every((d) => d.passed) || include_if.length === 0;
  const excludeAnyPass = excludeDetails.some((d) => d.passed);

  return {
    include_if: includeDetails,
    exclude_if: excludeDetails,
    shouldInclude: includePass && !excludeAnyPass,
  };
}

// ------ Bug Report functionality ------

// Initialize EmailJS with your public key
// You'll need to set this up at https://www.emailjs.com/
const EMAILJS_PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY"; // Replace with actual key
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID"; // Replace with actual service ID
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID"; // Replace with actual template ID

function openBugReportModal() {
  const modal = document.getElementById("bugReportModal");
  document.getElementById("bugReportForm").reset();
  const statusDiv = document.getElementById("bugReportStatus");
  statusDiv.className = "bug-report-status hidden";
  statusDiv.textContent = "";
  modal.classList.remove("hidden");
}

function closeBugReportModal() {
  const modal = document.getElementById("bugReportModal");
  modal.classList.add("hidden");
}

function collectDiagnosticData() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    windowSize: `${window.innerWidth}x${window.innerHeight}`,
    url: window.location.href,
    referrer: document.referrer || "none",
    cookiesEnabled: navigator.cookieEnabled,
    onlineStatus: navigator.onLine,

    // Application state
    packsCount: packFile.packs.length,
    currentPricebook: document.getElementById("pricebookSelect")?.value || "unknown",
    localStorageSize: new Blob([localStorage.getItem(STORAGE_KEY) || ""]).size,

    // Browser capabilities
    localStorage: typeof Storage !== "undefined",
    sessionStorage: typeof sessionStorage !== "undefined",
    webWorker: typeof Worker !== "undefined",

    // Performance data
    memoryUsage: performance.memory ? {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    } : "not available",

    // Recent console errors (if any were captured)
    recentErrors: window.bugReportErrors || []
  };

  return diagnostics;
}

// Capture console errors for bug reports
if (!window.bugReportErrors) {
  window.bugReportErrors = [];
  const originalError = console.error;
  console.error = function(...args) {
    window.bugReportErrors.push({
      timestamp: new Date().toISOString(),
      message: args.join(" ")
    });
    // Keep only last 10 errors
    if (window.bugReportErrors.length > 10) {
      window.bugReportErrors.shift();
    }
    originalError.apply(console, args);
  };
}

async function handleBugReportSubmit(event) {
  event.preventDefault();

  const submitBtn = document.getElementById("sendBugReportBtn");
  const statusDiv = document.getElementById("bugReportStatus");
  const bugDescription = document.getElementById("bugDescription").value;
  const screenshotsInput = document.getElementById("bugScreenshots");

  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";

  // Show processing status
  statusDiv.className = "bug-report-status info";
  statusDiv.textContent = "Preparing bug report...";

  try {
    // Collect diagnostic data
    const diagnostics = collectDiagnosticData();

    // Process screenshots
    let screenshotData = [];
    if (screenshotsInput.files.length > 0) {
      statusDiv.textContent = "Processing screenshots...";

      for (let i = 0; i < Math.min(screenshotsInput.files.length, 5); i++) {
        const file = screenshotsInput.files[i];
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          throw new Error(`Screenshot ${file.name} is too large (max 5MB)`);
        }

        try {
          const base64 = await fileToBase64(file);
          screenshotData.push({
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64
          });
        } catch (err) {
          console.error("Error processing screenshot:", err);
        }
      }
    }

    // Prepare email content
    const emailData = {
      to_email: "martinbibb@gmail.com",
      bug_description: bugDescription,
      diagnostics: JSON.stringify(diagnostics, null, 2),
      screenshots_count: screenshotData.length,
      screenshots: screenshotData.map(s => `${s.name} (${(s.size / 1024).toFixed(2)} KB)`).join(", "),
      timestamp: new Date().toLocaleString(),

      // Include pack data for debugging
      packs_data: JSON.stringify(packFile, null, 2)
    };

    statusDiv.textContent = "Sending bug report...";

    // Initialize EmailJS if not already done
    if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== "YOUR_EMAILJS_PUBLIC_KEY") {
      emailjs.init(EMAILJS_PUBLIC_KEY);

      // Send email via EmailJS
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        emailData
      );

      if (response.status === 200) {
        statusDiv.className = "bug-report-status success";
        statusDiv.textContent = "Bug report sent successfully! Thank you for your feedback.";

        // Clear form after 2 seconds and close modal
        setTimeout(() => {
          closeBugReportModal();
        }, 2000);
      } else {
        throw new Error("Failed to send email");
      }
    } else {
      // Fallback: Show the data to copy manually
      const reportData = `
BUG REPORT
==========

Description:
${bugDescription}

Diagnostics:
${JSON.stringify(diagnostics, null, 2)}

Screenshots: ${screenshotData.length} attached

Packs Data:
${JSON.stringify(packFile, null, 2)}
      `.trim();

      // Copy to clipboard
      await navigator.clipboard.writeText(reportData);

      statusDiv.className = "bug-report-status success";
      statusDiv.textContent = "Bug report copied to clipboard! Please email it to martinbibb@gmail.com";

      // Also log to console
      console.log("=== BUG REPORT ===");
      console.log("Description:", bugDescription);
      console.log("Diagnostics:", diagnostics);
      console.log("Screenshots:", screenshotData.length);
      console.log("Packs:", packFile);

      alert("Bug report data has been copied to your clipboard. Please paste it in an email to martinbibb@gmail.com\n\nThe data is also available in the browser console (F12).");
    }

  } catch (error) {
    console.error("Bug report error:", error);
    statusDiv.className = "bug-report-status error";
    statusDiv.textContent = `Error: ${error.message}. Please email martinbibb@gmail.com directly with your bug report.`;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Bug Report";
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
