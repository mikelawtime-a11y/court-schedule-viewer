// 1) Put your Worker URL here after you deploy it, e.g.:
// const WORKER_URL = "https://court-proxy.<your-subdomain>.workers.dev";
const WORKER_URL = "PASTE_YOUR_WORKER_URL_HERE";

const $ = (id) => document.getElementById(id);

function rocDateTime(dudt, dutm) {
  // dudt like "1141223" (ROC year 114 => 2025)
  // dutm like "1030"
  if (!dudt || dudt.length !== 7) return "";
  const rocYear = parseInt(dudt.slice(0, 3), 10);
  const year = rocYear + 1911;
  const mm = dudt.slice(3, 5);
  const dd = dudt.slice(5, 7);
  const hh = (dutm || "").padStart(4, "0").slice(0, 2);
  const min = (dutm || "").padStart(4, "0").slice(2, 4);
  return `${year}-${mm}-${dd} ${hh}:${min} (ROC ${rocYear}/${mm}/${dd})`;
}

function renderTable(items) {
  if (!items?.length) return "<p>No data</p>";

  const rows = items.map(x => `
    <tr>
      <td>${rocDateTime(x.dudt, x.dutm)}</td>
      <td>${x.sys || ""}</td>
      <td>${x.dpt || ""}</td>
      <td>${(x.crmyy || "")} ${(x.crmid || "")}-${(x.crmno || "")}</td>
      <td>${x.dunm || ""} / ${x.ducd || ""}</td>
      <td>${x.dukd || ""}</td>
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

async function fetchData() {
  $("error").textContent = "";
  $("out").innerHTML = "";
  $("status").textContent = "Loading...";

  const crtid = $("crtid").value.trim();
  const crmyy = $("crmyy").value.trim();

  if (!WORKER_URL || WORKER_URL.includes("PASTE_YOUR_WORKER_URL_HERE")) {
    throw new Error("Set WORKER_URL in app.js first.");
  }

  // We call the Worker with GET to keep it simple.
  const url = `${WORKER_URL}?crtid=${encodeURIComponent(crtid)}&crmyy=${encodeURIComponent(crmyy)}&t=${Date.now()}`;

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

  const json = await res.json();
  $("out").innerHTML = renderTable(json.data);
  $("status").textContent = `OK. items: ${json.data?.length ?? 0}`;
}

$("btn").addEventListener("click", () => {
  fetchData().catch(err => {
    $("status").textContent = "";
    $("error").textContent = String(err?.stack || err);
  });
});
