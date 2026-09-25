const fmt = n =>
    new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0
    }).format(Math.round(Number(n) || 0));

const money = n => "₹ " + fmt(n);

const pct = n => `${Number(n) || 0}%`;

const esc = s =>
    String(s ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));


/* =====================================================
   BAR COLORS FOR EACH DEPARTMENT
===================================================== */

const chartColors = {
    trading: [
        "#438ddd",
        "#5b9be3",
        "#73a9e8",
        "#8bb7ed",
        "#a3c5f2",
        "#bbd3f6",
        "#d3e1fa",
        "#e3ecfc"
    ],

    investment: [
        "#67bd72",
        "#78c581",
        "#89cd90",
        "#9ad59f",
        "#abdda8",
        "#bce5b1",
        "#cdeeba",
        "#def6c3"
    ],

    reserve: [
        "#f1d65d",
        "#f2da6d",
        "#f3de7d",
        "#f4e28d",
        "#f5e69d",
        "#f6eaae",
        "#f7eebe",
        "#f8f2ce"
    ],

    rnd: [
        "#a184d6",
        "#aa91db",
        "#b3a0df",
        "#bcaee4",
        "#c5bce8",
        "#cec9ed",
        "#d7d7f1",
        "#e0e3f6"
    ]
};


/* =====================================================
   MAIN RENDER
===================================================== */

function render(data) {

    const total = Number(data.capital.total) || 0;
    const vs = data.verticals;

    const keys = [
        "trading",
        "investment",
        "reserve",
        "rnd"
    ];

    const names = {
        trading: "TRADING",
        investment: "INVESTMENT",
        reserve: "RESERVE",
        rnd: "RESEARCH & DEVELOPMENT"
    };

    const colors = [
        "#438ddd",
        "#67bd72",
        "#f1d65d",
        "#a184d6"
    ];


    /* =================================================
       HEADER
    ================================================= */

    document.getElementById("orgName").textContent =
        data.meta.organization;

    document.getElementById("metaDate").textContent =
        data.meta.date;

    document.getElementById("metaVersion").textContent =
        data.meta.version;

    document.getElementById("metaPrepared").textContent =
        data.meta.preparedBy;


    /* =================================================
       TOTAL CAPITAL
    ================================================= */

    const allocated = keys.reduce(
        (sum, key) =>
            sum +
            total *
            (Number(vs[key].percent) || 0) /
            100,
        0
    );

    document.getElementById("totalCapital").textContent =
        money(total);

    document.getElementById("allocatedCapital").textContent =
        money(allocated);

    document.getElementById("unallocatedCapital").textContent =
        money(total - allocated);


    /* =================================================
       MAIN STATUS
    ================================================= */

    const difference = total - allocated;

    document.getElementById("status").innerHTML =
        Math.abs(difference) < 0.01
            ? '<span>✓</span> Fully Allocated'
            : difference > 0
                ? '<span style="color:#d99000;">↑</span> Surplus ₹ ' +
                  fmt(difference)
                : '<span class="warning">↓</span> Deficit ₹ ' +
                  fmt(Math.abs(difference));


    /* =================================================
       ALLOCATION CARDS
    ================================================= */

    document.getElementById("allocationCards").innerHTML =
        keys.map((k, i) => {

            return `
                <div class="allocation-card ${k}">

                    <div
                        class="card-head"
                        style="
                            background:${colors[i]};
                            color:${k === "reserve" ? "#111" : "#fff"}
                        "
                    >
                        ${names[k]}
                    </div>

                    <div class="percent">
                        ${pct(vs[k].percent)}
                    </div>

                    <div class="amount">
                        ${money(
                            total *
                            Number(vs[k].percent || 0) /
                            100
                        )}
                    </div>

                </div>
            `;

        }).join("");


    /* =================================================
       MAIN ROUND / DONUT CHART
    ================================================= */

    let start = 0;
    let stops = [];

    keys.forEach((k, i) => {

        const end =
            start +
            Number(vs[k].percent || 0);

        stops.push(
            `${colors[i]} ${start}% ${end}%`
        );

        start = end;

    });

    const donut =
        document.getElementById("donut");

    if (donut) {

        donut.style.background =
            `conic-gradient(${stops.join(",")})`;

    }


    /* =================================================
       DONUT LEGEND
    ================================================= */

    const legend =
        document.getElementById("legend");

    if (legend) {

        legend.innerHTML =
            keys.map((k, i) => {

                const label =
                    k === "rnd"
                        ? "R&D"
                        : k[0].toUpperCase() +
                          k.slice(1);

                return `
                    <div>

                        <i
                            class="dot"
                            style="background:${colors[i]}"
                        ></i>

                        ${label}

                        <b>
                            ${pct(vs[k].percent)}
                        </b>

                    </div>
                `;

            }).join("");
    }


    /* =================================================
       MAIN CAPITAL BAR CHART
    ================================================= */

    const bars =
        document.getElementById("bars");

    if (bars) {

        const values =
            keys.map(k =>
                total *
                Number(vs[k].percent || 0) /
                100
            );

        const max =
            Math.max(1, ...values);

        bars.innerHTML =
            keys.map((k, i) => {

                const value =
                    total *
                    Number(vs[k].percent || 0) /
                    100;

                const height =
                    (value / max) * 80;

                const label =
                    k === "rnd"
                        ? "R&D"
                        : k[0].toUpperCase() +
                          k.slice(1);

                return `
                    <div class="bar-group">

                        <div
                            class="bar"
                            style="
                                height:${height}%;
                                background:${colors[i]}
                            "
                        >
                            <span>
                                ${fmt(value / 100000)}L
                            </span>
                        </div>

                        <small>
                            ${label}
                        </small>

                    </div>
                `;

            }).join("");
    }


    /* =================================================
       DEPARTMENT TABLES + AUTOMATIC ITEM BAR CHARTS
    ================================================= */

    document.getElementById("tablesGrid").innerHTML =
        keys.map(k => {

            const v = vs[k];


            /* -----------------------------------------
               TABLE ROWS
            ----------------------------------------- */

            const rows =
                v.items.map((it, i) => {

                    return `
                        <tr>

                            <td>
                                ${i + 1}
                            </td>

                            <td>
                                ${esc(it[0])}
                            </td>

                            <td>
                                ${pct(it[1])}
                            </td>

                            <td>
                                ${money(
                                    total *
                                    Number(it[1] || 0) /
                                    100
                                )}
                            </td>

                        </tr>
                    `;

                }).join("");


            /* -----------------------------------------
               TOTAL %
            ----------------------------------------- */

            const sum =
                v.items.reduce(
                    (s, x) =>
                        s +
                        Number(x[1] || 0),
                    0
                );


            const target =
                Number(v.percent) || 0;


            const difference =
                sum - target;


            let status = "";
            let statusClass = "";
            let statusPercent = 0;
            let statusAmount = 0;


            /* -----------------------------------------
               STATUS
            ----------------------------------------- */

            if (Math.abs(difference) < 0.01) {

                status =
                    "FULLY ALLOCATED";

                statusClass =
                    "fully-allocated";

                statusPercent =
                    0;

                statusAmount =
                    0;

            }

            else if (difference > 0) {

                status =
                    "SURPLUS";

                statusClass =
                    "surplus";

                statusPercent =
                    difference;

                statusAmount =
                    total *
                    difference /
                    100;

            }

            else {

                status =
                    "DEFICIT";

                statusClass =
                    "deficit";

                statusPercent =
                    Math.abs(difference);

                statusAmount =
                    total *
                    Math.abs(difference) /
                    100;
            }


            /* =================================================
               AUTOMATIC ITEM BAR CHART
            ================================================= */

            const itemValues =
                v.items.map(it =>
                    Number(it[1] || 0)
                );

            const maxItem =
                Math.max(
                    1,
                    ...itemValues
                );


            const itemBars =
                v.items.map((it, i) => {

                    const itemPercent =
                        Number(it[1] || 0);

                    const height =
                        Math.max(
                            8,
                            (itemPercent / maxItem) * 150
                        );


                    const barColor =
                        chartColors[k][
                            i % chartColors[k].length
                        ];


                    return `
                        <div class="item-bar-group">

                            <div class="item-bar-value">
                                ${itemPercent}%
                            </div>

                            <div
                                class="item-bar"
                                style="
                                    height:${height}px;
                                    background:${barColor};
                                "
                            ></div>

                            <div class="item-bar-label">
                                ${esc(it[0])}
                            </div>

                        </div>
                    `;

                }).join("");


            /* =================================================
               COMPLETE DEPARTMENT CARD
            ================================================= */

            return `

                <div class="department ${k}-box">


                    <h2>

                        ${names[k]}

                        <span>
                            (${v.percent}%)
                        </span>

                    </h2>


                    <!-- TABLE -->

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Sr. No.
                                </th>

                                <th>
                                    Particular
                                </th>

                                <th>
                                    Target %
                                </th>

                                <th>
                                    Allocation (₹)
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            ${rows}

                        </tbody>


                        <tfoot>

                            <tr>

                                <th colspan="2">
                                    TOTAL
                                </th>

                                <th>
                                    ${pct(sum)}
                                </th>

                                <th>
                                    ${money(
                                        total *
                                        sum /
                                        100
                                    )}
                                </th>

                            </tr>


                            <tr class="${statusClass}">

                                <th colspan="2">
                                    ${status}
                                </th>

                                <th>
                                    ${pct(statusPercent)}
                                </th>

                                <th>
                                    ${money(statusAmount)}
                                </th>

                            </tr>

                        </tfoot>

                    </table>


                    <!-- AUTOMATIC ITEM BAR CHART -->

                    <div class="item-chart">

                        <div class="item-chart-title">
                            ${names[k]} ALLOCATION BREAKDOWN
                        </div>

                        <div class="item-bars">

                            ${itemBars}

                        </div>

                    </div>


                    <!-- PURPOSE -->

                    <div class="purpose">

                        <b>PURPOSE</b>

                        <p>
                            ${esc(v.purpose)}
                        </p>

                    </div>


                </div>

            `;

        }).join("");


    /* =================================================
       SHOW DASHBOARD
    ================================================= */

    document
        .getElementById("loading")
        .classList
        .add("hidden");

    document
        .getElementById("dashboard")
        .classList
        .remove("hidden");
}


/* =====================================================
   LOAD DATA
===================================================== */

fetch("/api/data", {
    credentials: "same-origin"
})
    .then(response => response.json())
    .then(render)
    .catch(() => {

        document.getElementById("loading").textContent =
            "Unable to load dashboard.";

    });
