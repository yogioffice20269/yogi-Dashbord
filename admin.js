let data = null;

const $ = s =>
  document.querySelector(s);

const $$ = s =>
  Array.from(
    document.querySelectorAll(s)
  );

const keys = [
  "trading",
  "investment",
  "reserve",
  "rnd"
];

const labels = {
  trading: "Trading",
  investment: "Investment",
  reserve: "Reserve",
  rnd: "Research & Development"
};


/* =========================================================
   HELPERS
========================================================= */

const esc = s =>
  String(s ?? "")
    .replace(
      /[&<>"']/g,
      c =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[c])
    );


function normalize() {

  data =
    data &&
    typeof data === "object"
      ? data
      : {};

  data.settings =
    data.settings || {
      overallROIEnabled: true
    };

  if (
    typeof
      data.settings.overallROIEnabled
      !== "boolean"
  ) {

    data.settings.overallROIEnabled =
      true;

  }


  data.meta =
    data.meta || {};

  data.capital =
    data.capital || {
      total: 0
    };

  data.verticals =
    data.verticals || {};


  data.performance =
    data.performance || {};


  data.risk =
    data.risk || {};


  const periods = [
    "daily",
    "mtd",
    "qtd",
    "ytd"
  ];


  periods.forEach(
    period => {

      data.performance[period] =
        data.performance[period] ||
        {};

      const p =
        data.performance[period];

      p.pnl =
        Number(p.pnl) || 0;

      p.roi =
        Number(p.roi) || 0;

      p.deployed =
        Number(p.deployed) || 0;

      p.available =
        Number(p.available) || 0;

      p.maxDrawdown =
        Number(p.maxDrawdown) || 0;

      p.maxDrawdownAmount =
        Number(
          p.maxDrawdownAmount
        ) || 0;

    }
  );


  data.risk.riskLimit =
    Number(
      data.risk.riskLimit
    ) || 0;

  data.risk.currentExposure =
    Number(
      data.risk.currentExposure
    ) || 0;

  data.risk.liquidity =
    Number(
      data.risk.liquidity
    ) || 0;

  data.risk.concentration =
    Number(
      data.risk.concentration
    ) || 0;

  data.risk.benchmark =
    data.risk.benchmark || "";

  data.risk.notes =
    data.risk.notes || "";


  keys.forEach(
    k => {

      data.verticals[k] =
        data.verticals[k] || {
          percent: 0,
          purpose: "",
          items: []
        };


      if (
        !Array.isArray(
          data.verticals[k].items
        )
      ) {

        data.verticals[k].items =
          [];

      }


      data.verticals[k].items =
        data.verticals[k]
          .items
          .map(
            x =>
              Array.isArray(x)
                ? [
                    x[0] ?? "",
                    Number(x[1]) || 0,
                    Number(x[2]) || 0,
                    Number(x[3]) || 0
                  ]
                : [
                    x?.name ||
                      "New Item",
                    Number(
                      x?.allocation
                    ) || 0,
                    Number(
                      x?.weekROI
                    ) || 0,
                    Number(
                      x?.monthROI
                    ) || 0
                  ]
          );

    }
  );

}


/* =========================================================
   DATE
========================================================= */

function dateInputValue(v) {

  if (!v) return "";

  const d =
    new Date(v);

  if (
    !Number.isNaN(
      d.getTime()
    )
  ) {

    return d
      .toISOString()
      .slice(0, 10);

  }

  const m =
    String(v).match(
      /^(\d{1,2})-([A-Za-z]+)-(\d{2,4})$/
    );

  if (!m) return "";

  const months = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12"
  };

  return `${
    m[3].length === 2
      ? "20" + m[3]
      : m[3]
  }-${
    months[m[2]] || "01"
  }-${
    String(m[1]).padStart(
      2,
      "0"
    )
  }`;

}


function saveDate(v) {

  if (!v) return "";

  const d =
    new Date(
      v + "T00:00:00"
    );

  return d
    .toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    )
    .replaceAll(
      " ",
      "-"
    );

}


/* =========================================================
   PERFORMANCE ROW
========================================================= */

function performanceRow(
  key,
  label
) {

  const p =
    data.performance[key] || {};

  return `

    <div
      class="item-row performance-row"
      style="
        grid-template-columns:
        130px
        repeat(6, 1fr);
        min-width:900px;
      "
    >

      <div
        style="
          font-weight:800;
          display:flex;
          align-items:center;
        "
      >
        ${label}
      </div>

      <input
        type="number"
        step="0.01"
        data-performance="pnl"
        data-period="${key}"
        value="${p.pnl}"
        placeholder="P&L ₹"
      >

      <input
        type="number"
        step="0.01"
        data-performance="roi"
        data-period="${key}"
        value="${p.roi}"
        placeholder="ROI %"
      >

      <input
        type="number"
        step="1"
        data-performance="deployed"
        data-period="${key}"
        value="${p.deployed}"
        placeholder="Deployed ₹"
      >

      <input
        type="number"
        step="1"
        data-performance="available"
        data-period="${key}"
        value="${p.available}"
        placeholder="Available ₹"
      >

      <input
        type="number"
        step="0.01"
        data-performance="maxDrawdown"
        data-period="${key}"
        value="${p.maxDrawdown}"
        placeholder="Drawdown %"
      >

      <input
        type="number"
        step="1"
        data-performance="maxDrawdownAmount"
        data-period="${key}"
        value="${p.maxDrawdownAmount}"
        placeholder="Drawdown ₹"
      >

    </div>

  `;

}


/* =========================================================
   RENDER
========================================================= */

function render() {

  normalize();

  const e =
    $("#editor");

  if (!e) {

    console.error(
      "Admin editor element not found."
    );

    return;

  }


  e.innerHTML = `

    <!-- BASIC -->

    <div
      class="form-section"
      style="
        border-top:0;
        padding-top:0;
      "
    >

      <h3>
        Basic Information
      </h3>

      <div class="form-grid">

        <label class="field">

          Organization

          <input
            data-field="organization"
            value="${esc(
              data.meta.organization ||
              ""
            )}"
          >

        </label>


        <label class="field">

          Dashboard Date

          <input
            type="date"
            data-field="date"
            value="${dateInputValue(
              data.meta.date
            )}"
          >

        </label>


        <label class="field full">

          Prepared By

          <input
            data-field="preparedBy"
            value="${esc(
              data.meta.preparedBy ||
              ""
            )}"
          >

        </label>

      </div>

    </div>


    <!-- CAPITAL -->

    <div class="form-section">

      <h3>
        Capital
      </h3>

      <label class="field">

        Total Fund Capital (₹)

        <input
          type="number"
          min="0"
          step="1"
          data-capital
          value="${
            Number(
              data.capital.total
            ) || 0
          }"
        >

      </label>

    </div>


    <!-- PERIOD PERFORMANCE -->

    <div class="form-section">

      <h3>
        Performance & Risk Data
      </h3>

      <p class="muted">
        Enter the actual values for each
        reporting period. These values will
        be used by the dashboard charts
        and KPI sections.
      </p>


      <div
        class="items"
        style="
          margin-top:12px;
          overflow:auto;
        "
      >

        <div
          class="item-row muted"
          style="
            grid-template-columns:
            130px
            repeat(6,1fr);
            min-width:900px;
            font-weight:800;
          "
        >

          <span>
            PERIOD
          </span>

          <span>
            P&L ₹
          </span>

          <span>
            ROI %
          </span>

          <span>
            DEPLOYED ₹
          </span>

          <span>
            AVAILABLE ₹
          </span>

          <span>
            MAX DD %
          </span>

          <span>
            MAX DD ₹
          </span>

        </div>


        ${performanceRow(
          "daily",
          "Daily"
        )}

        ${performanceRow(
          "mtd",
          "MTD"
        )}

        ${performanceRow(
          "qtd",
          "QTD"
        )}

        ${performanceRow(
          "ytd",
          "YTD"
        )}

      </div>

    </div>


    <!-- RISK -->

    <div class="form-section">

      <h3>
        Risk & Management Metrics
      </h3>

      <div class="form-grid">

        <label class="field">

          Risk Limit %

          <input
            type="number"
            step="0.01"
            data-risk="riskLimit"
            value="${
              data.risk.riskLimit
            }"
          >

        </label>


        <label class="field">

          Current Exposure %

          <input
            type="number"
            step="0.01"
            data-risk="currentExposure"
            value="${
              data.risk.currentExposure
            }"
          >

        </label>


        <label class="field">

          Liquidity %

          <input
            type="number"
            step="0.01"
            data-risk="liquidity"
            value="${
              data.risk.liquidity
            }"
          >

        </label>


        <label class="field">

          Concentration %

          <input
            type="number"
            step="0.01"
            data-risk="concentration"
            value="${
              data.risk.concentration
            }"
          >

        </label>


        <label class="field">

          Benchmark

          <input
            data-risk="benchmark"
            value="${esc(
              data.risk.benchmark
            )}"
            placeholder="Example: NIFTY 50"
          >

        </label>


        <label class="field full">

          Management Notes

          <textarea
            rows="4"
            data-risk="notes"
            placeholder="Enter management / risk notes..."
          >${esc(
            data.risk.notes
          )}</textarea>

        </label>

      </div>

    </div>


    <!-- OVERALL ROI -->

    <div class="form-section">

      <h3>
        Overall ROI Performance
      </h3>

      <div class="toggle-row">

        <div>

          <b
            style="
              font-size:11px;
            "
          >
            Show overall ROI section
          </b>

          <div class="muted">
            Controls the public
            performance section.
          </div>

        </div>


        <label class="switch">

          <input
            id="roiToggle"
            type="checkbox"
            ${
              data.settings
                .overallROIEnabled
                ? "checked"
                : ""
            }
          >

          <span
            class="slider"
          ></span>

        </label>

      </div>

    </div>


    <!-- VERTICAL ALLOCATION -->

    <div class="form-section">

      <h3>
        Vertical Allocation
      </h3>

      <div class="form-grid">

        ${keys.map(
          k => `

            <label class="field">

              ${labels[k]} %

              <input
                type="number"
                min="0"
                max="100"
                step=".1"
                data-percent="${k}"
                value="${
                  Number(
                    data.verticals[k]
                      .percent
                  ) || 0
                }"
              >

            </label>

          `
        ).join("")}

      </div>

    </div>


    <!-- DEPARTMENTS -->

    ${keys.map(
      k => `

        <div class="dept-editor">

          <div class="dept-title">

            <b>
              ${labels[k]}
            </b>

            <span class="muted">

              ${
                Number(
                  data.verticals[k]
                    .percent
                ) || 0
              }%

            </span>

          </div>


          <label class="field">

            Purpose

            <textarea
              rows="2"
              data-purpose="${k}"
            >${esc(
              data.verticals[k]
                .purpose || ""
            )}</textarea>

          </label>


          <div
            class="items"
            style="
              margin-top:10px;
            "
          >

            <div
              class="item-row muted"
              style="
                font-weight:800;
              "
            >

              <span>
                PARTICULAR
              </span>

              <span>
                ALLOC %
              </span>

              <span>
                WEEK ROI %
              </span>

              <span>
                MONTH ROI %
              </span>

              <span></span>

            </div>


            <div
              id="items-${k}"
            >

              ${
                data.verticals[k]
                  .items
                  .map(
                    (x, i) =>
                      itemHtml(
                        k,
                        i,
                        x
                      )
                  )
                  .join("")
              }

            </div>

          </div>


          <button
            class="add-item"
            data-add="${k}"
            type="button"
          >
            + Add Item
          </button>

        </div>

      `
    ).join("")}

  `;


  bind();

}


/* =========================================================
   ITEM HTML
========================================================= */

function itemHtml(
  k,
  i,
  x
) {

  return `

    <div class="item-row">

      <input
        data-name="${k}"
        data-i="${i}"
        value="${esc(
          x[0]
        )}"
        placeholder="Particular"
      >

      <input
        type="number"
        min="0"
        max="100"
        step=".01"
        data-alloc="${k}"
        data-i="${i}"
        value="${
          Number(x[1]) || 0
        }"
      >

      <input
        type="number"
        step=".01"
        data-week="${k}"
        data-i="${i}"
        value="${
          Number(x[2]) || 0
        }"
      >

      <input
        type="number"
        step=".01"
        data-month="${k}"
        data-i="${i}"
        value="${
          Number(x[3]) || 0
        }"
      >

      <button
        class="delete"
        data-del="${k}"
        data-i="${i}"
        title="Delete"
        type="button"
      >
        ×
      </button>

    </div>

  `;

}


/* =========================================================
   BIND EVENTS
========================================================= */

function bind() {


  $$(
    "[data-field]"
  ).forEach(
    x => {

      x.addEventListener(
        "input",
        () => {

          if (
            x.dataset.field ===
            "date"
          ) {

            data.meta.date =
              saveDate(
                x.value
              );

          } else {

            data.meta[
              x.dataset.field
            ] =
              x.value;

          }

        }
      );

    }
  );


  $(
    "[data-capital]"
  )?.addEventListener(
    "input",
    e => {

      data.capital.total =
        Number(
          e.target.value
        ) || 0;

    }
  );


  /* Performance */

  $$(
    "[data-performance]"
  ).forEach(
    x => {

      x.addEventListener(
        "input",
        e => {

          const period =
            e.target
              .dataset
              .period;

          const field =
            e.target
              .dataset
              .performance;

          data.performance[
            period
          ][field] =
            Number(
              e.target.value
            ) || 0;

        }
      );

    }
  );


  /* Risk */

  $$(
    "[data-risk]"
  ).forEach(
    x => {

      x.addEventListener(
        "input",
        e => {

          const field =
            e.target
              .dataset
              .risk;

          if (
            [
              "benchmark",
              "notes"
            ].includes(field)
          ) {

            data.risk[field] =
              e.target.value;

          } else {

            data.risk[field] =
              Number(
                e.target.value
              ) || 0;

          }

        }
      );

    }
  );


  /* ROI toggle */

  $(
    "#roiToggle"
  )?.addEventListener(
    "change",
    e => {

      data.settings
        .overallROIEnabled =
        e.target.checked;

    }
  );


  /* Percent */

  $$(
    "[data-percent]"
  ).forEach(
    x => {

      x.addEventListener(
        "input",
        e => {

          const k =
            e.target
              .dataset
              .percent;

          data.verticals[k]
            .percent =
            Number(
              e.target.value
            ) || 0;

        }
      );

    }
  );


  /* Purpose */

  $$(
    "[data-purpose]"
  ).forEach(
    x => {

      x.addEventListener(
        "input",
        e => {

          const k =
            e.target
              .dataset
              .purpose;

          data.verticals[k]
            .purpose =
            e.target.value;

        }
      );

    }
  );


  /* Item name */

  $$(
    "[data-name]"
  ).forEach(
    x => {

      x.addEventListener(
        "input",
        e => {

          const k =
            e.target
              .dataset
              .name;

          const i =
            Number(
              e.target
                .dataset
                .i
            );

          data.verticals[k]
            .items[i][0] =
            e.target.value;

        }
      );

    }
  );


  /* Allocation */

  $$(
    "[data-alloc]"
  ).forEach(
    x => {

      x.addEventListener(
        "input",
        e => {

          const k =
            e.target
              .dataset
              .alloc;

          const i =
            Number(
              e.target
                .dataset
                .i
            );

          data.verticals[k]
            .items[i][1] =
            Number(
              e.target.value
            ) || 0;

        }
      );

    }
  );


  /* Week ROI */

  $$(
    "[data-week]"
  ).forEach(
    x => {

      x.addEventListener(
        "input",
        e => {

          const k =
            e.target
              .dataset
              .week;

          const i =
            Number(
              e.target
                .dataset
                .i
            );

          data.verticals[k]
            .items[i][2] =
            Number(
              e.target.value
            ) || 0;

        }
      );

    }
  );


  /* Month ROI */

  $$(
    "[data-month]"
  ).forEach(
    x => {

      x.addEventListener(
        "input",
        e => {

          const k =
            e.target
              .dataset
              .month;

          const i =
            Number(
              e.target
                .dataset
                .i
            );

          data.verticals[k]
            .items[i][3] =
            Number(
              e.target.value
            ) || 0;

        }
      );

    }
  );


  /* Delete */

  $$(
    "[data-del]"
  ).forEach(
    x => {

      x.addEventListener(
        "click",
        () => {

          const k =
            x.dataset.del;

          const i =
            Number(
              x.dataset.i
            );

          if (
            confirm(
              "Delete this item?"
            )
          ) {

            data.verticals[k]
              .items
              .splice(
                i,
                1
              );

            render();

          }

        }
      );

    }
  );


  /* Add */

  $$(
    "[data-add]"
  ).forEach(
    x => {

      x.addEventListener(
        "click",
        () => {

          const k =
            x.dataset.add;

          data.verticals[k]
            .items
            .push([
              "New Item",
              0,
              0,
              0
            ]);

          render();

        }
      );

    }
  );

}


/* =========================================================
   LOAD
========================================================= */

async function load() {

  try {

    const r =
      await fetch(
        "/api/me",
        {
          cache:
            "no-store"
        }
      );

    const me =
      await r.json();

    if (
      !me.authenticated
    ) {

      $(
        "#loginScreen"
      ).classList.remove(
        "hidden"
      );

      return;

    }


    const d =
      await fetch(
        "/api/data",
        {
          cache:
            "no-store"
        }
      );


    if (!d.ok) {

      throw new Error(
        "Unable to load data"
      );

    }


    data =
      await d.json();

    render();


    $(
      "#loginScreen"
    ).classList.add(
      "hidden"
    );

    $(
      "#adminApp"
    ).classList.remove(
      "hidden"
    );


  } catch (e) {

    console.error(e);

    $(
      "#loginError"
    ).textContent =
      e.message;

  }

}


/* =========================================================
   LOGIN
========================================================= */

$(
  "#loginForm"
).addEventListener(
  "submit",
  async e => {

    e.preventDefault();

    $(
      "#loginError"
    ).textContent =
      "";

    try {

      const r =
        await fetch(
          "/api/login",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            credentials:
              "same-origin",

            body:
              JSON.stringify({
                username:
                  $(
                    "#username"
                  ).value,

                password:
                  $(
                    "#password"
                  ).value
              })

          }
        );


      const j =
        await r.json();


      if (!r.ok) {

        throw new Error(
          j.error ||
          "Login failed"
        );

      }


      await load();


    } catch (err) {

      console.error(err);

      $(
        "#loginError"
      ).textContent =
        err.message;

    }

  }
);


/* =========================================================
   LOGOUT
========================================================= */

$(
  "#logoutBtn"
).addEventListener(
  "click",
  async () => {

    await fetch(
      "/api/logout",
      {
        method:
          "POST",

        credentials:
          "same-origin"
      }
    );

    location.reload();

  }
);


/* =========================================================
   SAVE
========================================================= */

$(
  "#saveBtn"
).addEventListener(
  "click",
  async () => {

    const btn =
      $("#saveBtn");

    btn.disabled =
      true;

    $(
      "#saveMessage"
    ).textContent =
      "Saving…";


    try {

      const r =
        await fetch(
          "/api/data",
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json"
            },

            credentials:
              "same-origin",

            body:
              JSON.stringify(
                data
              )

          }
        );


      const j =
        await r.json();


      if (!r.ok) {

        throw new Error(
          j.error ||
          "Save failed"
        );

      }


      data =
        j.data;


      render();


      $(
        "#saveMessage"
      ).textContent =
        "Saved successfully.";


      setTimeout(
        () => {

          $(
            "#saveMessage"
          ).textContent =
            "";

        },
        2500
      );


      document
        .querySelector(
          ".preview-card iframe"
        )
        ?.contentWindow
        .location
        .reload();


    } catch (e) {

      console.error(e);

      $(
        "#saveMessage"
      ).textContent =
        e.message;

    } finally {

      btn.disabled =
        false;

    }

  }
);


/* =========================================================
   START
========================================================= */

load();
