// GitHub Pages version (no direct API call due to CORS).
// Reads: ./data/latest.json (written by GitHub Actions)

const $ = (id) => document.getElementById(id);

function rocDateTime(dudt, dutm) {
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
    return `<p>No data (workflow may not have run yet, or returned empty).</p>`;
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
  console.error(msg);
}

function clearError() {
  $("error").textContent = "";
}

function showStatus(msg) {
  $("status").textContent = msg;
  console.log(msg);
}

async function fetchData() {
  clearError();
  $("out").innerHTML = "";
  showStatus("Loading ./data/latest.json ...");

  // Cache-bust so Pages doesn’t serve an old file
  const url = `./data/latest.json?t=${Date.now()}`;

  let res;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (e) {
    showError("Network error while fetching latest.json:\n\n" + String(e?.stack || e));
    return;
  }

  if (!res.ok) {
    showError(
      `Cannot load ${url}\nHTTP ${res.status} ${res.statusText}\n\n` +
      `Fix checklist:\n` +
      `- data/latest.json exists in the repo (committed)\n` +
      `- GitHub Pages is deploying the same branch where the file exists\n` +
      `- Wait for Pages deploy to finish after the workflow commits`
    );
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
$("btn").addEventListener("click", fetchData);

// Auto-load once on page open (optional)
window.addEventListener("load", fetchData);
