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

function render(data) {

    const total = Number(data.capital.total) || 0;
    const vs = data.verticals;

    document.getElementById("orgName").textContent =
        data.meta.organization;

    document.getElementById("metaDate").textContent =
        data.meta.date;

    document.getElementById("metaVersion").textContent =
        data.meta.version;

    document.getElementById("metaPrepared").textContent =
        data.meta.preparedBy;


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


    /* =====================================================
       OVERALL ALLOCATION
       ===================================================== */

    const allocated = keys.reduce(
        (s, k) =>
            s +
            total *
            (Number(vs[k].percent) || 0) /
            100,
        0
    );

    document.getElementById("totalCapital").textContent =
        money(total);

    document.getElementById("allocatedCapital").textContent =
        money(allocated);

    document.getElementById("unallocatedCapital").textContent =
        money(total - allocated);


    /* =====================================================
       OVERALL STATUS
       ===================================================== */

    const overallDifference = total - allocated;

    document.getElementById("status").innerHTML =
        Math.abs(overallDifference) < 0.01

            ? '<span>✓</span> Fully Allocated'

            : overallDifference > 0

                ? '<span style="color:#d99000;">↑</span> Surplus ₹ ' +
                  fmt(overallDifference)

                : '<span class="warning">↓</span> Deficit ₹ ' +
                  fmt(Math.abs(overallDifference));


    /* =====================================================
       ALLOCATION CARDS
       ===================================================== */

    document.getElementById("allocationCards").innerHTML =
        keys.map((k, i) => `

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
                    ${money(total * vs[k].percent / 100)}
                </div>

            </div>

        `).join("");


    /* =====================================================
       DONUT CHART
       ===================================================== */

    let start = 0;
    let stops = [];

    keys.forEach((k, i) => {

        let end =
            start +
            Number(vs[k].percent || 0);

        stops.push(
            `${colors[i]} ${start}% ${end}%`
        );

        start = end;

    });

    document.getElementById("donut").style.background =
        `conic-gradient(${stops.join(",")})`;


    /* =====================================================
       LEGEND
       ===================================================== */

    document.getElementById("legend").innerHTML =
        keys.map((k, i) => `

            <div>

                <i
                    class="dot"
                    style="background:${colors[i]}"
                ></i>

                ${k === "rnd"
                    ? "R&D"
                    : k[0].toUpperCase() + k.slice(1)}

                <b>
                    ${pct(vs[k].percent)}
                </b>

            </div>

        `).join("");


    /* =====================================================
       BAR CHART
       ===================================================== */

    const max = Math.max(
        1,
        ...keys.map(
            k =>
                total *
                vs[k].percent /
                100
        )
    );

    document.getElementById("bars").innerHTML =
        keys.map((k, i) => {

            let val =
                total *
                vs[k].percent /
                100;

            return `

                <div class="bar-group">

                    <div
                        class="bar"
                        style="
                            height:${val / max * 80}%;
                            background:${colors[i]}
                        "
                    >
                        <span>
                            ${fmt(val / 100000)}L
                        </span>
                    </div>

                    <small>
                        ${k === "rnd"
                            ? "R&D"
                            : k[0].toUpperCase() + k.slice(1)}
                    </small>

                </div>

            `;

        }).join("");


    /* =====================================================
       DEPARTMENT TABLES
       ===================================================== */

    document.getElementById("tablesGrid").innerHTML =
        keys.map(k => {

            const v = vs[k];


            /* ---------------------------------------------
               ITEM ROWS
               --------------------------------------------- */

            const rows =
                v.items.map((it, i) => `

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
                                it[1] /
                                100
                            )}
                        </td>

                    </tr>

                `).join("");


            /* ---------------------------------------------
               ACTUAL ITEM TOTAL
               --------------------------------------------- */

            const sum =
                v.items.reduce(
                    (s, x) =>
                        s +
                        Number(x[1] || 0),
                    0
                );


            /* ---------------------------------------------
               DEPARTMENT TARGET
               --------------------------------------------- */

            const target =
                Number(v.percent) || 0;


            /* ---------------------------------------------
               DIFFERENCE
               --------------------------------------------- */

            const difference =
                sum - target;


            let status = "";
            let statusClass = "";
            let statusPercent = 0;
            let statusAmount = 0;


            /* ---------------------------------------------
               FULLY ALLOCATED
               --------------------------------------------- */

            if (Math.abs(difference) < 0.01) {

                status = "FULLY ALLOCATED";

                statusClass = "fully-allocated";

                statusPercent = 0;

                statusAmount = 0;

            }


            /* ---------------------------------------------
               SURPLUS
               --------------------------------------------- */

            else if (difference > 0) {

                status = "SURPLUS";

                statusClass = "surplus";

                statusPercent = difference;

                statusAmount =
                    total *
                    difference /
                    100;

            }


            /* ---------------------------------------------
               DEFICIT
               --------------------------------------------- */

            else {

                status = "DEFICIT";

                statusClass = "deficit";

                statusPercent =
                    Math.abs(difference);

                statusAmount =
                    total *
                    Math.abs(difference) /
                    100;

            }


            /* ---------------------------------------------
               TABLE
               --------------------------------------------- */

            return `

                <div class="department ${k}-box">

                    <h2>

                        ${names[k]}

                        <span>
                            (${v.percent}%)
                        </span>

                    </h2>


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

                            <!-- TOTAL ROW -->

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


                            <!-- STATUS ROW -->

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


                    <div class="purpose">

                        <b>
                            PURPOSE
                        </b>

                        <p>
                            ${esc(v.purpose)}
                        </p>

                    </div>

                </div>

            `;

        }).join("");


    /* =====================================================
       SHOW DASHBOARD
       ===================================================== */

    document
        .getElementById("loading")
        .classList
        .add("hidden");

    document
        .getElementById("dashboard")
        .classList
        .remove("hidden");

}


/* =========================================================
   LOAD DATA
   ========================================================= */

fetch(
    "/api/data",
    {
        credentials: "same-origin"
    }
)
    .then(r => r.json())
    .then(render)
    .catch(() => {

        document.getElementById("loading").textContent =
            "Unable to load dashboard.";

    });
