const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const DEPTS = [
  {
    key: "trading",
    name: "Trading",
    color: "#2f75b5",
    tag: "blue",
    className: "blue"
  },
  {
    key: "investment",
    name: "Investment",
    color: "#0a9a5b",
    tag: "green",
    className: "green"
  },
  {
    key: "reserve",
    name: "Reserve",
    color: "#e4a915",
    tag: "yellow",
    className: "yellow"
  },
  {
    key: "rnd",
    name: "R&D",
    color: "#7042a0",
    tag: "purple",
    className: "purple"
  }
];

let DATA = null;
let currentPage = "overview";
let currentPeriod = "daily";

/* =========================================================
   BASIC HELPERS
========================================================= */

const money = n =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(n) || 0);

const pct = n => `${Number(n || 0).toFixed(2)}%`;

const num = n => Number(n) || 0;

const esc = s =>
  String(s ?? "").replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c])
  );

function dateDisplay(v) {
  if (!v) return "—";

  const d = new Date(v);

  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  const m = String(v).match(
    /^(\d{1,2})[-\/]([A-Za-z]+|\d{1,2})[-\/](\d{2,4})$/
  );

  if (m) {
    return `${m[1]}-${m[2]}-${m[3]}`;
  }

  return v;
}

/* =========================================================
   CAPITAL / ALLOCATION
========================================================= */

function totalAllocated() {
  return (
    DEPTS.reduce(
      (s, d) => s + num(DATA.verticals?.[d.key]?.percent),
      0
    ) *
    num(DATA.capital?.total) /
    100
  );
}

function deptCapital(k) {
  return (
    num(DATA.capital?.total) *
    num(DATA.verticals?.[k]?.percent) /
    100
  );
}

function itemRows(k) {
  return Array.isArray(DATA.verticals?.[k]?.items)
    ? DATA.verticals[k].items
    : [];
}

function itemCapital(k, item) {
  return deptCapital(k) * num(item?.[1]) / 100;
}

function roiValue(k, item, idx) {
  return itemCapital(k, item) * num(item?.[idx]) / 100;
}

function monthPnl(k) {
  return itemRows(k).reduce(
    (s, x) => s + roiValue(k, x, 3),
    0
  );
}

function weekPnl(k) {
  return itemRows(k).reduce(
    (s, x) => s + roiValue(k, x, 2),
    0
  );
}

function allMonthPnl() {
  return DEPTS.reduce(
    (s, d) => s + monthPnl(d.key),
    0
  );
}

function allWeekPnl() {
  return DEPTS.reduce(
    (s, d) => s + weekPnl(d.key),
    0
  );
}

/* =========================================================
   PERFORMANCE DATA
   Compatible with:
   performance.daily
   performance.mtd
   performance.qtd
   performance.weekly
   performance.monthly
========================================================= */

function performanceData(period = currentPeriod) {
  const performance = DATA?.performance || {};

  let p = performance[period];

  /*
     Support monthly if added later.
  */
  if (!p && period === "mtd") {
    p = performance.monthly;
  }

  /*
     If the new admin performance fields do not exist,
     safely return calculated fallback values.
  */

  if (!p || typeof p !== "object") {
    const total = num(DATA.capital?.total);
    const allocated = totalAllocated();

    if (period === "daily") {
      return {
        pnl: allWeekPnl(),
        roi: total ? allWeekPnl() / total * 100 : 0,
        deployed: allocated,
        available: total - allocated,
        maxDrawdown: 0,
        maxDrawdownAmount: 0,
        benchmark: "",
        source: "calculated"
      };
    }

    return {
      pnl: allMonthPnl(),
      roi: total ? allMonthPnl() / total * 100 : 0,
      deployed: allocated,
      available: total - allocated,
      maxDrawdown: 0,
      maxDrawdownAmount: 0,
      benchmark: "",
      source: "calculated"
    };
  }

  return {
    pnl: num(p.pnl),
    roi: num(p.roi),
    deployed: num(p.deployed),
    available: num(p.available),
    maxDrawdown: num(p.maxDrawdown),
    maxDrawdownAmount: num(p.maxDrawdownAmount),
    benchmark: p.benchmark || "",
    source: "admin"
  };
}

/* =========================================================
   PERIOD LABELS
========================================================= */

function periodLabel(period = currentPeriod) {
  const labels = {
    daily: "Today",
    mtd: "MTD",
    qtd: "QTD",
    weekly: "Weekly",
    monthly: "Monthly"
  };

  return labels[period] || "Today";
}

function periodDescription(period = currentPeriod) {
  const labels = {
    daily: "Today's performance data",
    mtd: "Month-to-date performance",
    qtd: "Quarter-to-date performance",
    weekly: "Weekly performance",
    monthly: "Monthly performance"
  };

  return labels[period] || "Selected period performance";
}

/* =========================================================
   SHELL
========================================================= */

function renderShell() {
  $("#orgName").textContent =
    DATA.meta?.organization ||
    "YOGI GROWING TOGETHER LLP";

  const dt = dateDisplay(DATA.meta?.date);

  $("#topDate").textContent = dt;
  $("#sideDate").textContent = dt;
}

/* =========================================================
   COMMON CARD
========================================================= */

function card(cls, label, value, delta = "") {
  return `
    <div class="card kpi ${cls || ""}">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
      <div class="delta">${delta}</div>
    </div>
  `;
}

/* =========================================================
   DEPARTMENT CARDS
========================================================= */

function deptCards() {
  return `
    <div class="alloc-row">
      ${DEPTS.map(d => `
        <div class="alloc-card ${d.key}">
          <div class="alloc-title">${d.name.toUpperCase()}</div>

          <div class="alloc-pct">
            ${pct(DATA.verticals?.[d.key]?.percent)}
          </div>

          <div class="alloc-money">
            ${money(deptCapital(d.key))}
          </div>

          <div
            class="progress ${d.className}"
            style="margin-top:10px"
          >
            <i
              style="
                width:${Math.min(
                  100,
                  num(DATA.verticals?.[d.key]?.percent)
                )}%
              "
            ></i>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

/* =========================================================
   DONUT
========================================================= */

function donut() {
  const parts = DEPTS.map(d =>
    num(DATA.verticals?.[d.key]?.percent)
  );

  const sum =
    parts.reduce((a, b) => a + b, 0) || 1;

  let start = 0;
  const stops = [];

  DEPTS.forEach((d, i) => {
    const end =
      start +
      parts[i] / sum * 360;

    stops.push(
      `${d.color} ${start}deg ${end}deg`
    );

    start = end;
  });

  return `
    <div class="donut-area">

      <div
        class="donut"
        style="
          background:conic-gradient(
            ${stops.join(",")}
          )
        "
      >
        <div class="donut-center">
          <div>
            <b>${pct(sum)}</b>
            <small>allocated target</small>
          </div>
        </div>
      </div>

      <div class="legend">
        ${DEPTS.map(d => `
          <div class="legend-row">
            <i
              class="dot"
              style="background:${d.color}"
            ></i>

            <span>${d.name}</span>

            <b>
              ${pct(
                DATA.verticals?.[d.key]?.percent
              )}
            </b>
          </div>
        `).join("")}
      </div>

    </div>
  `;
}

/* =========================================================
   EXISTING VERTICAL PERFORMANCE CHART
   Kept visually similar to current dashboard.
========================================================= */

function lineChart() {
  const vals = DEPTS.map(d =>
    monthPnl(d.key)
  );

  const max =
    Math.max(
      1,
      ...vals.map(Math.abs)
    );

  const w = 760;
  const h = 220;
  const p = 24;

  const pts = vals
    .map(
      (v, i) =>
        `${p +
          i *
            ((w - 2 * p) /
              Math.max(1, vals.length - 1))} ${
          h -
          p -
          (v / max) *
            (h - 2 * p) *
            0.75
        }`
    )
    .join(" ");

  return `
    <div class="chart">

      <svg
        viewBox="0 0 ${w} ${h}"
        preserveAspectRatio="none"
      >

        <line
          x1="${p}"
          y1="${h - p}"
          x2="${w - p}"
          y2="${h - p}"
          stroke="#e6ecef"
        />

        <polyline
          points="${pts}"
          fill="none"
          stroke="#0a7544"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        ${vals.map((v, i) => {

          const x =
            p +
            i *
              ((w - 2 * p) /
                Math.max(
                  1,
                  vals.length - 1
                ));

          const y =
            h -
            p -
            (v / max) *
              (h - 2 * p) *
              0.75;

          return `
            <circle
              cx="${x}"
              cy="${y}"
              r="5"
              fill="#fff"
              stroke="#0a7544"
              stroke-width="3"
            />

            <text
              x="${x}"
              y="${h - 5}"
              text-anchor="middle"
              font-size="10"
              fill="#71808c"
            >
              ${DEPTS[i].name}
            </text>
          `;
        }).join("")}

      </svg>

    </div>
  `;
}

/* =========================================================
   PERIOD PERFORMANCE VISUAL
========================================================= */
function periodPerformanceVisual() {
  const p = performanceData();

  const values = [
    {
      label: "P&L",
      formatted: money(p.pnl)
    },
    {
      label: "ROI",
      formatted: pct(p.roi)
    },
    {
      label: "Capital Deployed",
      formatted: money(p.deployed)
    },
    {
      label: "Available Capital",
      formatted: money(p.available)
    }
  ];

  return `
    <div class="bar-list fund-performance-list">
      ${values.map(x => `
        <div class="bar-line fund-performance-line">
          <span class="fund-label">${x.label}</span>

          <div class="bar-track">
            <i style="width:0%"></i>
          </div>

          <b>${x.formatted}</b>
        </div>
      `).join("")}
    </div>
  `;
}}/* =========================================================
   ALLOCATION TABLE
========================================================= */

function allocationTable() {
  const total =
    num(DATA.capital?.total);

  return `
    <div class="table-wrap">

      <table class="table">

        <thead>
          <tr>
            <th>Vertical</th>
            <th class="num">Target</th>
            <th class="num">Capital</th>
            <th class="num">Week ROI</th>
            <th class="num">Month ROI</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>

          ${DEPTS.map(d => {

            const p =
              num(
                DATA.verticals?.[d.key]?.percent
              );

            const c =
              deptCapital(d.key);

            const r =
              c
                ? monthPnl(d.key) /
                  c *
                  100
                : 0;

            return `
              <tr>

                <td>
                  <b>${d.name}</b>
                </td>

                <td class="num">
                  ${pct(p)}
                </td>

                <td class="num">
                  ${money(c)}
                </td>

                <td class="num">
                  ${pct(
                    c
                      ? weekPnl(d.key) /
                        c *
                        100
                      : 0
                  )}
                </td>

                <td class="num">
                  ${pct(r)}
                </td>

                <td>
                  <span
                    class="tag ${d.tag}"
                  >
                    ${
                      p > 0
                        ? "Allocated"
                        : "Not Allocated"
                    }
                  </span>
                </td>

              </tr>
            `;
          }).join("")}

          <tr>

            <td>
              <b>Total</b>
            </td>

            <td class="num">
              <b>
                ${pct(
                  DEPTS.reduce(
                    (s, d) =>
                      s +
                      num(
                        DATA.verticals?.[
                          d.key
                        ]?.percent
                      ),
                    0
                  )
                )}
              </b>
            </td>

            <td class="num">
              <b>
                ${money(totalAllocated())}
              </b>
            </td>

            <td class="num">
              <b>
                ${pct(
                  totalAllocated()
                    ? allWeekPnl() /
                      totalAllocated() *
                      100
                    : 0
                )}
              </b>
            </td>

            <td class="num">
              <b>
                ${pct(
                  totalAllocated()
                    ? allMonthPnl() /
                      totalAllocated() *
                      100
                    : 0
                )}
              </b>
            </td>

            <td>
              <span class="tag green">
                Live
              </span>
            </td>

          </tr>

        </tbody>

      </table>

    </div>
  `;
}

/* =========================================================
   ATTRIBUTION
========================================================= */

function attribution() {
  const values =
    DEPTS.map(d =>
      monthPnl(d.key)
    );

  const max =
    Math.max(
      1,
      ...values.map(v =>
        Math.abs(v)
      )
    );

  return `
    <div class="bar-list">

      ${DEPTS.map(d => {

        const v =
          monthPnl(d.key);

        const m =
          Math.min(
            100,
            Math.abs(v) /
              max *
              100
          );

        return `
          <div class="bar-line">

            <span>
              ${d.name}
            </span>

            <div class="bar-track">
              <i
                style="
                  width:${m}%;
                  background:${d.color}
                "
              ></i>
            </div>

            <b>
              ${money(v)}
            </b>

          </div>
        `;
      }).join("")}

    </div>
  `;
}

/* =========================================================
   OVERVIEW
========================================================= */

function renderOverview() {

  const total =
    num(DATA.capital?.total);

  const allocated =
    totalAllocated();

  const calculatedAvailable =
    total - allocated;

  const p =
    performanceData();

  /*
     Prefer Admin entered deployed/available.
     Fall back to allocation calculation.
  */

  const deployed =
    p.deployed > 0
      ? p.deployed
      : allocated;

  const available =
    p.available !== 0
      ? p.available
      : calculatedAvailable;

  const selectedPnl =
    p.pnl;

  const selectedRoi =
    p.roi;

  const drawdown =
    p.maxDrawdown;

  $("#page-overview").innerHTML = `

    <div class="grid kpis">

      ${card(
        "green-top",
        "TOTAL FUND CAPITAL",
        money(total),
        "Core fund capital"
      )}

      ${card(
        "blue-top",
        "CAPITAL DEPLOYED",
        money(deployed),
        `${periodLabel()} data`
      )}

      ${card(
        "yellow-top",
        "AVAILABLE CAPITAL",
        money(available),
        available >= 0
          ? "Available balance"
          : "Over allocation"
      )}

      ${card(
        "green-top",
        `${periodLabel().toUpperCase()} P&L`,
        money(selectedPnl),
        periodDescription()
      )}

      ${card(
        "blue-top",
        `${periodLabel().toUpperCase()} ROI`,
        pct(selectedRoi),
        p.source === "admin"
          ? "Entered by Admin"
          : "Calculated"
      )}

      ${card(
        "red-top",
        "MAX DRAWDOWN",
        p.maxDrawdown !== 0
          ? pct(drawdown)
          : "—",
        p.maxDrawdown !== 0
          ? money(
              p.maxDrawdownAmount
            )
          : "Not entered"
      )}

    </div>

    ${deptCards()}

    <div class="grid two mt">

      <div class="card">

        <div class="card-head">
          <h3>
            Allocation vs Target
          </h3>

          <span>
            Current vertical allocation
          </span>
        </div>

        ${allocationTable()}

      </div>

      <div class="card">

        <div class="card-head">
          <h3>
            Capital Utilization
          </h3>

          <span>
            ${money(deployed)}
            /
            ${money(total)}
          </span>
        </div>

        ${donut()}

      </div>

    </div>

    <div class="grid two mt">

      <div class="card">

        <div class="card-head">

          <h3>
            Fund Performance
          </h3>

          <span>
            ${periodLabel()} —
            ${periodDescription()}
          </span>

        </div>

        ${periodPerformanceVisual()}

      </div>

      <div class="card">

        <div class="card-head">

          <h3>
            ${periodLabel()}
            P&amp;L Attribution
          </h3>

          <span>
            Vertical contribution
          </span>

        </div>

        <div class="card-body">
          ${attribution()}
        </div>

      </div>

    </div>

    <div class="grid three mt">

      <div class="card">

        <div class="card-head">
          <h3>Key Metrics</h3>
        </div>

        <div class="card-body metric-list">

          <div class="metric-line">
            <span>
              Allocation Coverage
            </span>

            <b>
              ${pct(
                total
                  ? allocated /
                    total *
                    100
                  : 0
              )}
            </b>
          </div>

          <div class="metric-line">
            <span>
              ${periodLabel()} P&amp;L
            </span>

            <b>
              ${money(selectedPnl)}
            </b>
          </div>

          <div class="metric-line">
            <span>
              ${periodLabel()} ROI
            </span>

            <b>
              ${pct(selectedRoi)}
            </b>
          </div>

          <div class="metric-line">
            <span>
              Max Drawdown
            </span>

            <b>
              ${
                p.maxDrawdown !== 0
                  ? pct(
                      p.maxDrawdown
                    )
                  : "—"
              }
            </b>
          </div>

        </div>

      </div>

      <div class="card">

        <div class="card-head">
          <h3>Control Status</h3>
        </div>

        <div class="card-body">

          <div class="callout">
            ${
              Math.abs(
                allocated - total
              ) < 1
                ? "Fund is fully allocated."
                : allocated < total
                  ? "Capital remains available for allocation."
                  : "Allocation exceeds available capital."
            }
          </div>

          <p class="page-note">
            Public view is read-only.
            Use Settings → Admin Panel
            to edit.
          </p>

        </div>

      </div>

      <div class="card">

        <div class="card-head">
          <h3>Data Source</h3>
        </div>

        <div class="card-body">

          <div class="metric-line">
            <span>Organization</span>
            <b>
              ${esc(
                DATA.meta?.organization
              )}
            </b>
          </div>

          <div class="metric-line">
            <span>Prepared By</span>
            <b>
              ${esc(
                DATA.meta?.preparedBy
              )}
            </b>
          </div>

          <div class="metric-line">
            <span>Last Date</span>
            <b>
              ${esc(
                dateDisplay(
                  DATA.meta?.date
                )
              )}
            </b>
          </div>

          <div class="metric-line">
            <span>Selected Period</span>
            <b>
              ${periodLabel()}
            </b>
          </div>

        </div>

      </div>

    </div>
  `;
}

/* =========================================================
   ALLOCATION
========================================================= */

function renderAllocation() {

  $("#page-allocation").innerHTML = `

    <div class="subnav">
      <button class="active">
        Overview
      </button>

      <button>
        Vertical Allocation
      </button>

      <button>
        Sub Allocation
      </button>
    </div>

    <div class="grid kpis">

      ${card(
        "green-top",
        "TOTAL CAPITAL",
        money(DATA.capital?.total),
        "Fund size"
      )}

      ${card(
        "blue-top",
        "ALLOCATED",
        money(totalAllocated()),
        "Target allocation"
      )}

      ${card(
        "yellow-top",
        "AVAILABLE",
        money(
          num(DATA.capital?.total) -
          totalAllocated()
        ),
        "Remaining"
      )}

      ${card(
        "purple-top",
        "VERTICALS",
        DEPTS.length,
        "Controlled buckets"
      )}

      ${card(
        "green-top",
        "WEEK P&L",
        money(allWeekPnl()),
        "From item ROI"
      )}

      ${card(
        "blue-top",
        "MONTH P&L",
        money(allMonthPnl()),
        "From item ROI"
      )}

    </div>

    <div class="grid two mt">

      <div class="card">

        <div class="card-head">
          <h3>Vertical Allocation</h3>
          <span>
            Target / capital / performance
          </span>
        </div>

        ${allocationTable()}

      </div>

      <div class="card">

        <div class="card-head">
          <h3>
            Allocation Visualization
          </h3>
        </div>

        ${donut()}

      </div>

    </div>

    <div class="card mt">

      <div class="card-head">

        <h3>
          Sub Allocation by Department
        </h3>

        <span>
          All items from admin data
        </span>

      </div>

      <div class="card-body">

        ${DEPTS.map(d => `

          <div class="dept-head">

            <h3>
              ${d.name}
            </h3>

            <span
              class="tag ${d.tag}"
            >
              ${pct(
                DATA.verticals?.[
                  d.key
                ]?.percent
              )}
              •
              ${money(
                deptCapital(
                  d.key
                )
              )}
            </span>

          </div>

          ${itemTable(d.key)}

          <div style="height:16px"></div>

        `).join("")}

      </div>

    </div>
  `;
}

/* =========================================================
   ITEM TABLE
========================================================= */

function itemTable(k) {

  const rows =
    itemRows(k);

  const cap =
    deptCapital(k);

  return `
    <div class="table-wrap">

      <table class="table">

        <thead>

          <tr>
            <th>Particular</th>
            <th class="num">
              Allocation
            </th>
            <th class="num">
              Capital
            </th>
            <th class="num">
              Week ROI
            </th>
            <th class="num">
              Month ROI
            </th>
            <th class="num">
              Month P&amp;L
            </th>
          </tr>

        </thead>

        <tbody>

          ${
            rows.length
              ? rows
                  .map(
                    x => `
                      <tr>

                        <td>
                          <b>
                            ${esc(x[0])}
                          </b>
                        </td>

                        <td class="num">
                          ${pct(x[1])}
                        </td>

                        <td class="num">
                          ${money(
                            cap *
                            num(x[1]) /
                            100
                          )}
                        </td>

                        <td class="num">
                          ${pct(x[2])}
                        </td>

                        <td class="num">
                          ${pct(x[3])}
                        </td>

                        <td class="num">
                          ${money(
                            roiValue(
                              k,
                              x,
                              3
                            )
                          )}
                        </td>

                      </tr>
                    `
                  )
                  .join("")
              : `
                <tr>
                  <td colspan="6">
                    No items configured.
                  </td>
                </tr>
              `
          }

          ${
            rows.length
              ? `
                <tr>

                  <td>
                    <b>Total</b>
                  </td>

                  <td class="num">
                    <b>
                      ${pct(
                        rows.reduce(
                          (s, x) =>
                            s +
                            num(x[1]),
                          0
                        )
                      )}
                    </b>
                  </td>

                  <td class="num">
                    <b>
                      ${money(
                        rows.reduce(
                          (s, x) =>
                            s +
                            itemCapital(
                              k,
                              x
                            ),
                          0
                        )
                      )}
                    </b>
                  </td>

                  <td colspan="3"></td>

                </tr>
              `
              : ""
          }

        </tbody>

      </table>

    </div>
  `;
}

/* =========================================================
   DEPARTMENT BAR
========================================================= */

function barBooks(k) {

  const rows =
    itemRows(k);

  const mx =
    Math.max(
      1,
      ...rows.map(x =>
        num(x[1])
      )
    );

  const dept =
    DEPTS.find(
      d => d.key === k
    );

  return `
    <div class="bar-list">

      ${
        rows
          .map(
            x => `
              <div class="bar-line">

                <span>
                  ${esc(x[0])}
                </span>

                <div class="bar-track">

                  <i
                    style="
                      width:${
                        num(x[1]) /
                        mx *
                        100
                      }%;
                      background:${
                        dept?.color ||
                        "#0a7544"
                      }
                    "
                  ></i>

                </div>

                <b>
                  ${pct(x[1])}
                </b>

              </div>
            `
          )
          .join("") ||
        `
          <div class="empty-state">
            No allocation items.
          </div>
        `
      }

    </div>
  `;
}

/* =========================================================
   DEPARTMENT PAGES
========================================================= */

function renderDept(k) {

  const d =
    DEPTS.find(
      x => x.key === k
    );

  const capital =
    deptCapital(k);

  const week =
    weekPnl(k);

  const month =
    monthPnl(k);

  const roi =
    capital
      ? month /
        capital *
        100
      : 0;

  let extra = "";

  if (k === "trading") {

    extra = `
      <div class="grid two mt">

        <div class="card">

          <div class="card-head">
            <h3>
              Book-wise Allocation
            </h3>
          </div>

          <div class="card-body">
            ${barBooks(k)}
          </div>

        </div>

        <div class="card">

          <div class="card-head">
            <h3>
              Trading Control
            </h3>
          </div>

          <div class="card-body metric-list">

            <div class="metric-line">
              <span>Trades</span>
              <b>Not stored</b>
            </div>

            <div class="metric-line">
              <span>Win Rate</span>
              <b>Not stored</b>
            </div>

            <div class="metric-line">
              <span>Profit Factor</span>
              <b>Not stored</b>
            </div>

          </div>

        </div>

      </div>
    `;
  }

  if (k === "investment") {

    extra = `
      <div class="grid two mt">

        <div class="card">

          <div class="card-head">
            <h3>
              Portfolio Allocation
            </h3>
          </div>

          <div class="card-body">
            ${barBooks(k)}
          </div>

        </div>

        <div class="card">

          <div class="card-head">
            <h3>
              Portfolio Metrics
            </h3>
          </div>

          <div class="card-body metric-list">

            <div class="metric-line">
              <span>
                Invested Capital
              </span>

              <b>
                ${money(capital)}
              </b>
            </div>

            <div class="metric-line">
              <span>
                Current Value
              </span>

              <b>
                Not stored
              </b>
            </div>

            <div class="metric-line">
              <span>
                Unrealized P&amp;L
              </span>

              <b>
                Not stored
              </b>
            </div>

          </div>

        </div>

      </div>
    `;
  }

  if (k === "reserve") {

    extra = `
      <div class="grid two mt">

        <div class="card">

          <div class="card-head">
            <h3>
              Reserve Composition
            </h3>
          </div>

          <div class="card-body">
            ${barBooks(k)}
          </div>

        </div>

        <div class="card">

          <div class="card-head">
            <h3>
              Liquidity Controls
            </h3>
          </div>

          <div class="card-body metric-list">

            <div class="metric-line">
              <span>
                Required Minimum
              </span>

              <b>
                Not stored
              </b>
            </div>

            <div class="metric-line">
              <span>
                Months of Expenses
              </span>

              <b>
                Not stored
              </b>
            </div>

            <div class="metric-line">
              <span>
                Emergency Cover
              </span>

              <b>
                Not stored
              </b>
            </div>

          </div>

        </div>

      </div>
    `;
  }

  if (k === "rnd") {

    extra = `
      <div class="grid two mt">

        <div class="card">

          <div class="card-head">
            <h3>
              R&amp;D Pipeline
            </h3>
          </div>

          <div class="card-body">
            ${barBooks(k)}
          </div>

        </div>

        <div class="card">

          <div class="card-head">
            <h3>
              Project Controls
            </h3>
          </div>

          <div class="card-body metric-list">

            <div class="metric-line">
              <span>
                Active Projects
              </span>

              <b>
                Not stored
              </b>
            </div>

            <div class="metric-line">
              <span>
                Testing / Approved
              </span>

              <b>
                Not stored
              </b>
            </div>

            <div class="metric-line">
              <span>
                Success Rate
              </span>

              <b>
                Not stored
              </b>
            </div>

          </div>

        </div>

      </div>
    `;
  }

  $("#page-" + k).innerHTML = `

    <div class="grid kpis">

      ${card(
        d.key === "trading"
          ? "blue-top"
          : d.key === "investment"
            ? "green-top"
            : d.key === "reserve"
              ? "yellow-top"
              : "purple-top",
        "ALLOCATED CAPITAL",
        money(capital),
        pct(
          DATA.verticals?.[
            k
          ]?.percent
        ) + " target"
      )}

      ${card(
        "green-top",
        "WEEK P&L",
        money(week),
        "Calculated"
      )}

      ${card(
        "green-top",
        "MONTH P&L",
        money(month),
        "Calculated"
      )}

      ${card(
        "blue-top",
        "MONTH ROI",
        pct(roi),
        "Calculated"
      )}

      ${card(
        "yellow-top",
        "AVAILABLE",
        "—",
        "Not stored"
      )}

      ${card(
        "red-top",
        "RISK",
        "—",
        "Use Risk page"
      )}

    </div>

    <div class="card mt">

      <div class="card-head">

        <h3>
          ${d.name}
          — Allocation &amp; Performance
        </h3>

        <span>
          ${esc(
            DATA.verticals?.[
              k
            ]?.purpose || ""
          )}
        </span>

      </div>

      ${itemTable(k)}

    </div>

    ${extra}

    <div class="card mt">

      <div class="card-head">
        <h3>
          Purpose / Mandate
        </h3>
      </div>

      <div class="card-body">

        <div class="callout">
          ${esc(
            DATA.verticals?.[
              k
            ]?.purpose ||
            "No purpose configured."
          )}
        </div>

      </div>

    </div>
  `;
}

/* =========================================================
   PERFORMANCE PAGE
========================================================= */

function renderPerformance() {

  const p =
    performanceData();

  const total =
    num(DATA.capital?.total);

  const calculatedWeekROI =
    total
      ? allWeekPnl() /
        total *
        100
      : 0;

  const calculatedMonthROI =
    total
      ? allMonthPnl() /
        total *
        100
      : 0;

  $("#page-performance").innerHTML = `

    <div class="grid kpis">

      ${card(
        "green-top",
        `${periodLabel().toUpperCase()} P&L`,
        money(p.pnl),
        p.source === "admin"
          ? "Entered by Admin"
          : "Calculated"
      )}

      ${card(
        "blue-top",
        `${periodLabel().toUpperCase()} ROI`,
        pct(p.roi),
        p.source === "admin"
          ? "Entered by Admin"
          : "Calculated"
      )}

      ${card(
        "green-top",
        "MONTH P&L",
        money(allMonthPnl()),
        "Item ROI calculation"
      )}

      ${card(
        "blue-top",
        "MONTH ROI",
        pct(calculatedMonthROI),
        "Calculated from items"
      )}

      ${card(
        "red-top",
        "MAX DRAWDOWN",
        p.maxDrawdown !== 0
          ? pct(p.maxDrawdown)
          : "—",
        p.maxDrawdownAmount
          ? money(
              p.maxDrawdownAmount
            )
          : "Not entered"
      )}

      ${card(
        "purple-top",
        "BENCHMARK",
        p.benchmark
          ? esc(p.benchmark)
          : "—",
        p.source === "admin"
          ? "Admin data"
          : "Not stored"
      )}

    </div>

    <div class="grid two mt">

      <div class="card">

        <div class="card-head">

          <h3>
            ${periodLabel()}
            Performance
          </h3>

          <span>
            ${periodDescription()}
          </span>

        </div>

        ${periodPerformanceVisual()}

      </div>

      <div class="card">

        <div class="card-head">

          <h3>
            P&amp;L Contribution
          </h3>

          <span>
            Current vertical allocation
          </span>

        </div>

        <div class="card-body">
          ${attribution()}
        </div>

      </div>

    </div>

    <div class="grid two mt">

      <div class="card">

        <div class="card-head">
          <h3>
            ROI by Vertical
          </h3>
        </div>

        ${allocationTable()}

      </div>

      <div class="card">

        <div class="card-head">
          <h3>
            Selected Period Summary
          </h3>
        </div>

        <div class="card-body metric-list">

          <div class="metric-line">
            <span>Period</span>
            <b>
              ${periodLabel()}
            </b>
          </div>

          <div class="metric-line">
            <span>P&amp;L</span>
            <b>
              ${money(p.pnl)}
            </b>
          </div>

          <div class="metric-line">
            <span>ROI</span>
            <b>
              ${pct(p.roi)}
            </b>
          </div>

          <div class="metric-line">
            <span>Capital Deployed</span>
            <b>
              ${money(p.deployed)}
            </b>
          </div>

          <div class="metric-line">
            <span>Available Capital</span>
            <b>
              ${money(p.available)}
            </b>
          </div>

          <div class="metric-line">
            <span>Max Drawdown</span>
            <b>
              ${
                p.maxDrawdown !== 0
                  ? pct(
                      p.maxDrawdown
                    )
                  : "—"
              }
            </b>
          </div>

        </div>

      </div>

    </div>

    <div class="card mt">

      <div class="card-head">

        <h3>
          Detailed ROI Performance
        </h3>

        <span>
          ${
            DATA.settings
              ?.overallROIEnabled === false
              ? "Overall ROI OFF"
              : "Overall ROI ON"
          }
        </span>

      </div>

      <div class="card-body">

        ${
          DATA.settings
            ?.overallROIEnabled === false

            ? `
              <div class="empty-state">

                <div>

                  <strong>
                    Overall ROI Performance is OFF
                  </strong>

                  <span>
                    Enable it from the Admin Panel.
                  </span>

                </div>

              </div>
            `

            : `
              ${itemTable("trading")}
              ${itemTable("investment")}
              ${itemTable("reserve")}
              ${itemTable("rnd")}
            `
        }

      </div>

    </div>
  `;
}

/* =========================================================
   RISK PAGE
========================================================= */

function renderRisk() {

  const p =
    performanceData();

  const risk =
    DATA.risk || {};

  $("#page-risk").innerHTML = `

    <div class="grid kpis">

      ${card(
        "red-top",
        "MAX DRAWDOWN",
        p.maxDrawdown !== 0
          ? pct(p.maxDrawdown)
          : "—",
        p.maxDrawdownAmount
          ? money(
              p.maxDrawdownAmount
            )
          : "Not entered"
      )}

      ${card(
        "yellow-top",
        "RISK LIMIT",
        risk.riskLimit !== undefined &&
        risk.riskLimit !== ""
          ? pct(risk.riskLimit)
          : "—",
        "Admin setting"
      )}

      ${card(
        "blue-top",
        "CONCENTRATION",
        risk.concentration !== undefined &&
        risk.concentration !== ""
          ? pct(risk.concentration)
          : "—",
        "Admin setting"
      )}

      ${card(
        "green-top",
        "LIQUIDITY",
        risk.liquidity !== undefined &&
        risk.liquidity !== ""
          ? pct(risk.liquidity)
          : "—",
        "Admin setting"
      )}

      ${card(
        "purple-top",
        "EXPOSURE",
        risk.currentExposure !== undefined &&
        risk.currentExposure !== ""
          ? pct(risk.currentExposure)
          : "—",
        "Current exposure"
      )}

      ${card(
        "red-top",
        "PERIOD",
        periodLabel(),
        "Risk data period"
      )}

    </div>

    <div class="grid two mt">

      <div class="card">

        <div class="card-head">

          <h3>
            Risk Register
          </h3>

          <span>
            ${periodDescription()}
          </span>

        </div>

        <div class="card-body metric-list">

          <div class="metric-line">
            <span>
              Max Drawdown %
            </span>

            <b>
              ${
                p.maxDrawdown !== 0
                  ? pct(
                      p.maxDrawdown
                    )
                  : "—"
              }
            </b>
          </div>

          <div class="metric-line">
            <span>
              Max Drawdown Amount
            </span>

            <b>
              ${
                p.maxDrawdownAmount
                  ? money(
                      p.maxDrawdownAmount
                    )
                  : "—"
              }
            </b>
          </div>

          <div class="metric-line">
            <span>
              Risk Limit
            </span>

            <b>
              ${
                risk.riskLimit !== undefined &&
                risk.riskLimit !== ""
                  ? pct(
                      risk.riskLimit
                    )
                  : "—"
              }
            </b>
          </div>

          <div class="metric-line">
            <span>
              Current Exposure
            </span>

            <b>
              ${
                risk.currentExposure !== undefined &&
                risk.currentExposure !== ""
                  ? pct(
                      risk.currentExposure
                    )
                  : "—"
              }
            </b>
          </div>

          <div class="metric-line">
            <span>
              Liquidity
            </span>

            <b>
              ${
                risk.liquidity !== undefined &&
                risk.liquidity !== ""
                  ? pct(
                      risk.liquidity
                    )
                  : "—"
              }
            </b>
          </div>

          <div class="metric-line">
            <span>
              Concentration
            </span>

            <b>
              ${
                risk.concentration !== undefined &&
                risk.concentration !== ""
                  ? pct(
                      risk.concentration
                    )
                  : "—"
              }
            </b>
          </div>

        </div>

      </div>

      <div class="card">

        <div class="card-head">

          <h3>
            Risk &amp; Management
          </h3>

          <span>
            Admin entered controls
          </span>

        </div>

        <div class="card-body metric-list">

          <div class="metric-line">
            <span>
              Benchmark
            </span>

            <b>
              ${
                p.benchmark
                  ? esc(
                      p.benchmark
                    )
                  : "—"
              }
            </b>
          </div>

          <div class="metric-line">
            <span>
              Selected Period
            </span>

            <b>
              ${periodLabel()}
            </b>
          </div>

          <div class="metric-line">
            <span>
              Data Source
            </span>

            <b class="positive">
              ${
                p.source === "admin"
                  ? "Admin"
                  : "Calculated"
              }
            </b>
          </div>

          <div class="metric-line">
            <span>
              Public Write Access
            </span>

            <b class="negative">
              Blocked
            </b>
          </div>

          ${
            risk.notes
              ? `
                <div
                  class="callout"
                  style="margin-top:12px"
                >
                  ${esc(risk.notes)}
                </div>
              `
              : ""
          }

        </div>

      </div>

    </div>

  `;
}

/* =========================================================
   CAPITAL MOVEMENTS
========================================================= */

function renderMovements() {

  $("#page-movements").innerHTML = `

    <div class="grid kpis">

      ${card(
        "green-top",
        "TOTAL CAPITAL",
        money(
          DATA.capital?.total
        ),
        "Current"
      )}

      ${card(
        "blue-top",
        "ALLOCATED",
        money(
          totalAllocated()
        ),
        "Current"
      )}

      ${card(
        "yellow-top",
        "AVAILABLE",
        money(
          num(
            DATA.capital?.total
          ) -
          totalAllocated()
        ),
        "Current"
      )}

      ${card(
        "purple-top",
        "LAST UPDATE",
        dateDisplay(
          DATA.meta?.date
        ),
        "Admin date"
      )}

    </div>

    <div class="card mt">

      <div class="card-head">

        <h3>
          Capital Movement Register
        </h3>

        <span>
          Historical transactions
        </span>

      </div>

      <div class="card-body">

        <div class="empty-state">

          <div>

            <strong>
              No capital movement records
            </strong>

            <span>
              Deposits, withdrawals and
              transfers are not currently
              stored as individual transactions.
            </span>

          </div>

        </div>

      </div>

    </div>
  `;
}

/* =========================================================
   REPORTS
========================================================= */

function renderReports() {

  $("#page-reports").innerHTML = `

    <div class="grid three">

      <div class="card report-card">

        <h3>
          Capital Allocation Report
        </h3>

        <p>
          Vertical and item-level allocation
          with capital values.
        </p>

        <button onclick="window.print()">
          Print / Save PDF
        </button>

      </div>

      <div class="card report-card">

        <h3>
          Performance Report
        </h3>

        <p>
          ${periodLabel()}
          P&amp;L, ROI, deployed capital
          and drawdown.
        </p>

        <button onclick="window.print()">
          Print / Save PDF
        </button>

      </div>

      <div class="card report-card">

        <h3>
          Management Snapshot
        </h3>

        <p>
          Executive dashboard view with
          current fund totals and controls.
        </p>

        <button onclick="window.print()">
          Print / Save PDF
        </button>

      </div>

    </div>

    <div class="card mt">

      <div class="card-head">

        <h3>
          Report Summary
        </h3>

        <span>
          ${periodLabel()}
        </span>

      </div>

      ${allocationTable()}

      <div class="footer-note">
        Generated from live server data •
        ${esc(
          dateDisplay(
            DATA.meta?.date
          )
        )}
      </div>

    </div>
  `;
}

/* =========================================================
   SETTINGS
========================================================= */

function renderSettings() {

  $("#page-settings").innerHTML = `

    <div class="grid settings-grid">

      <div class="card">

        <div class="card-head">
          <h3>
            System Settings
          </h3>
        </div>

        <div class="card-body metric-list">

          <div class="metric-line">
            <span>
              Organization
            </span>

            <b>
              ${esc(
                DATA.meta?.organization
              )}
            </b>
          </div>

          <div class="metric-line">
            <span>
              Prepared By
            </span>

            <b>
              ${esc(
                DATA.meta?.preparedBy
              )}
            </b>
          </div>

          <div class="metric-line">
            <span>
              Dashboard Date
            </span>

            <b>
              ${esc(
                dateDisplay(
                  DATA.meta?.date
                )
              )}
            </b>
          </div>

          <div class="metric-line">
            <span>
              Selected Period
            </span>

            <b>
              ${periodLabel()}
            </b>
          </div>

          <div class="metric-line">
            <span>
              Overall ROI
            </span>

            <b>
              ${
                DATA.settings
                  ?.overallROIEnabled === false
                  ? "OFF"
                  : "ON"
              }
            </b>
          </div>

        </div>

      </div>

      <div class="card">

        <div class="card-head">
          <h3>
            Administration
          </h3>
        </div>

        <div class="card-body">

          <p
            style="
              font-size:11px;
              color:#71808c;
              line-height:1.6
            "
          >
            Public dashboard is view-only.
            The secure editor is protected
            by the existing server-side
            admin session.
          </p>

          <a
            class="admin-link"
            href="/admin"
          >
            Open Admin Panel
          </a>

        </div>

      </div>

    </div>

    <div class="card mt">

      <div class="card-head">
        <h3>
          Current Data Model
        </h3>
      </div>

      <div class="card-body">

        <div class="callout">

          Capital, vertical allocation,
          item allocation, ROI,
          period performance and
          risk-control fields are displayed
          from the live server data.

        </div>

      </div>

    </div>
  `;
}

/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderAll() {

  renderShell();

  renderOverview();

  renderAllocation();

  DEPTS.forEach(d =>
    renderDept(d.key)
  );

  renderPerformance();

  renderRisk();

  renderMovements();

  renderReports();

  renderSettings();
}

/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(page) {

  currentPage = page;

  $$(".page").forEach(x =>
    x.classList.remove("active")
  );

  $("#page-" + page)
    ?.classList.add("active");

  $$(".nav-item").forEach(x =>
    x.classList.toggle(
      "active",
      x.dataset.page === page
    )
  );

  const titles = {
    overview: [
      "Overview",
      "Executive view of fund capital, allocation and performance."
    ],

    allocation: [
      "Allocation",
      "Vertical and sub-allocation control."
    ],

    trading: [
      "Trading",
      "Trading capital, books and ROI performance."
    ],

    investment: [
      "Investment",
      "Investment allocation and portfolio controls."
    ],

    reserve: [
      "Reserve",
      "Liquidity reserve and expense protection."
    ],

    rnd: [
      "R&D",
      "Research, innovation and strategy development."
    ],

    performance: [
      "Performance",
      "Fund and vertical performance analysis."
    ],

    risk: [
      "Risk",
      "Risk and control framework."
    ],

    movements: [
      "Capital Movements",
      "Capital movement register and current balances."
    ],

    reports: [
      "Reports",
      "Management reporting and printable snapshots."
    ],

    settings: [
      "Settings",
      "System information and administration."
    ]
  };

  if (titles[page]) {

    $("#pageTitle").textContent =
      titles[page][0];

    $("#pageSub").textContent =
      titles[page][1];
  }
}

/* =========================================================
   PERIOD BUTTON
========================================================= */

function setPeriod(period) {

  currentPeriod = period;

  $$(".period").forEach(btn => {

    const text =
      btn.textContent
        .trim()
        .toLowerCase();

    let btnPeriod = "daily";

    if (text === "today") {
      btnPeriod = "daily";
    }

    if (text === "mtd") {
      btnPeriod = "mtd";
    }

    if (text === "qtd") {
      btnPeriod = "qtd";
    }

    if (text === "weekly") {
      btnPeriod = "weekly";
    }

    btn.classList.toggle(
      "active",
      btnPeriod === period
    );

  });

  /*
     Re-render only the data views.
     This keeps the existing visual shell.
  */

  if (DATA) {

    renderOverview();

    renderPerformance();

    renderRisk();

    renderReports();

    renderSettings();

    /*
       Allocation/departments mostly use
       allocation and item-level data,
       so they remain visually unchanged.
    */
  }
}

/* =========================================================
   LOAD DATA
========================================================= */

async function load() {

  try {

    const r =
      await fetch(
        "/api/data",
        {
          cache: "no-store"
        }
      );

    if (!r.ok) {
      throw new Error(
        "Unable to load data"
      );
    }

    DATA =
      await r.json();

    /*
       Default period:
       Today
    */

    currentPeriod = "daily";

    renderAll();

    showPage("overview");

    /*
       Restore Today button as active.
    */

    setPeriod("daily");

    $("#loading")
      .classList
      .add("hidden");

    $("#app")
      .classList
      .remove("hidden");

  } catch (e) {

    console.error(e);

    $("#loading").innerHTML = `
      <b>
        Unable to load dashboard.
      </b>

      <span>
        Please refresh the page.
      </span>
    `;
  }
}

/* =========================================================
   NAVIGATION EVENTS
========================================================= */

$$(".nav-item").forEach(
  b =>
    b.addEventListener(
      "click",
      () => {

        showPage(
          b.dataset.page
        );

        $("#sidebar")
          ?.classList
          .remove("open");
      }
    )
);

/* =========================================================
   MOBILE MENU
========================================================= */

$("#menuBtn")?.addEventListener(
  "click",
  () =>
    $("#sidebar")
      ?.classList
      .toggle("open")
);

/* =========================================================
   PERIOD EVENTS
========================================================= */

$$(".period").forEach(
  b =>
    b.addEventListener(
      "click",
      () => {

        const text =
          b.textContent
            .trim()
            .toLowerCase();

        if (text === "today") {
          setPeriod("daily");
        }

        else if (text === "mtd") {
          setPeriod("mtd");
        }

        else if (text === "qtd") {
          setPeriod("qtd");
        }

        else if (text === "weekly") {
          setPeriod("weekly");
        }

      }
    )
);

/* =========================================================
   START
========================================================= */

load();
