const API_URL = "https://csdi3.judicial.gov.tw/judbp/wkw/WHD1A03/QUERY.htm";

const $ = (id) => document.getElementById(id);

function rocDateTime(dudt, dutm) {
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

  const body = new URLSearchParams();
  body.set("crtid", crtid);
  body.set("crmyy", crmyy);

  console.log("[direct] POST", API_URL, "body=", body.toString());

  let res;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Accept": "application/json, text/plain, */*",
      },
      body,
      // mode: "cors" is default
    });
  } catch (e) {
    // This is where CORS often lands: "TypeError: Failed to fetch"
    $("status").textContent = "";
    $("error").textContent =
      "Fetch failed (often CORS). Open DevTools Console for the exact CORS message.\n\n" +
      String(e?.stack || e);
    throw e;
  }

  console.log("[direct] response", res.status, res.statusText);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

  const text = await res.text();
  console.log("[direct] body preview", text.slice(0, 500));

  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error("Response is not valid JSON (see Console for body preview).");
  }

  $("out").innerHTML = renderTable(json.data);
  $("status").textContent = `OK. items: ${json.data?.length ?? 0}`;
}

$("btn").addEventListener("click", () => {
  fetchData().catch(err => {
    $("status").textContent = "";
    $("error").textContent = String(err?.stack || err);
  });
});
