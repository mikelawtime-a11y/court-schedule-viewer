// GitHub Pages version (no direct API call due to CORS).
// This page reads the JSON file that GitHub Actions writes:
//   ./data/latest.json

const $ = (id) => document.getElementById(id);

function rocDateTime(dudt, dutm) {
  // dudt like "1141223" (ROC year 114 => 2025)
  // dutm like "1030"
  if (!dudt || dudt.length !== 7) return "";

  const rocYear = parseInt(dudt.slice(0, 3), 10);
  if (!Number.isFinite(rocYear)) return "";

  const year = rocYear + 1911;
  const mm = dudt.slice(3, 5);
  const dd = dudt.slice(5, 7);

  const t = (dutm || "").padStart(4, "0");
  const hh = t.slice(0, 2);
  const min = t.slice(2, 4);

  return `${year}-${mm}-${dd} ${hh}:${min} (ROC ${rocYear}/${mm}/${dd})`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTable(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return `<p>No data (maybe workflow hasn’t run yet).</p>`;
  }

  const rows = items.map(x => `
    <tr>
      <td>${escapeHtml(rocDateTime(x.dudt, x.dutm))}</td>
      <td>${escapeHtml(x.sys)}</td>
      <td>${escapeHtml(x.dpt)}</td>
      <td>${escapeHtml(`${x.crmyy ?? ""} ${x.crmid ?? ""}-${x.crmno ?? ""}`)}</td>
      <td>${escapeHtml(`${x.dunm ?? ""} / ${x.ducd ?? ""}`)}</td>
      <td>${escapeHtml(x.dukd)}</td>
    </tr>
  `).join("");

  return `
    <table>
      <thead>
        <tr>
          <th>Date & time</th>
          <th>Sys</th>
          <th>Dpt</th>
          <th>Case</th>
          <th>Courtroom</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function showError(msg) {
  $("status").textContent = "";
  $("error").textContent = msg;
}

function clearError() {
  $("error").textContent = "";
}

function showStatus(msg) {
  $("status").textContent = msg;
}

async function fetchData() {
  clearError();
  $("out").innerHTML = "";
  showStatus("Loading...");

  // Cache-bust so GitHub Pages doesn’t return an old file
  const url = `./data/latest.json?t=${Date.now()}`;

  let res;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (e) {
    showError("Failed to fetch latest.json (network error).\n\n" + String(e?.stack || e));
    return;
  }

  if (!res.ok) {
    showError(`Cannot load ${url}\nHTTP ${res.status} ${res.statusText}\n\n` +
      `Make sure you have committed data/latest.json and that GitHub Pages is deployed from the branch/root you expect.`);
    return;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    const text = await res.text().catch(() => "");
    showError(
      "latest.json is not valid JSON.\n\n" +
      String(e?.stack || e) +
      (text ? "\n\nBody preview:\n" + text.slice(0, 800) : "")
    );
    return;
  }

  const items = json?.data;
  $("out").innerHTML = renderTable(items);

  const updatedAt = json?.updatedAt ? `updatedAt: ${json.updatedAt}` : "updatedAt: (missing)";
  const count = Array.isArray(items) ? items.length : 0;

  showStatus(`OK. items: ${count}. ${updatedAt}`);
}

// Button click
$("btn").addEventListener("click", () => {
  fetchData();
});

// Optional: auto-load once when page opens
// (comment out if you want only button-click)
window.addEventListener("load", () => {
  fetchData();
});
