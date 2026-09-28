let dashboardData = null;

const VERTICALS = [
    {
        key: "trading",
        name: "Trading",
        color: "#438ddd",
        barClass: "b-blue",
        boxClass: "trading-box"
    },
    {
        key: "investment",
        name: "Investment",
        color: "#67bd72",
        barClass: "b-green",
        boxClass: "investment-box"
    },
    {
        key: "reserve",
        name: "Reserve",
        color: "#f1d65d",
        barClass: "b-yellow",
        boxClass: "reserve-box"
    },
    {
        key: "rnd",
        name: "Research & Development",
        color: "#a184d6",
        barClass: "b-purple",
        boxClass: "rnd-box"
    }
];


/* =========================================================
   HELPERS
========================================================= */

function money(value) {

    const number = Number(value) || 0;

    return "₹" + number.toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 2
        }
    );
}


function number(value) {

    const n = Number(value);

    return Number.isFinite(n)
        ? n
        : 0;
}


function percent(value) {

    return number(value)
        .toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        ) + "%";
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadDashboard() {

    try {

        const response =
            await fetch("/api/data", {
                cache: "no-store"
            });


        if (!response.ok) {
            throw new Error(
                "Unable to load dashboard data"
            );
        }


        dashboardData =
            await response.json();


        renderDashboard();


    } catch (error) {

        console.error(error);

        const loading =
            document.getElementById("loading");

        if (loading) {

            loading.textContent =
                "Unable to load dashboard.";
        }
    }
}


/* =========================================================
   MAIN RENDER
========================================================= */

function renderDashboard() {

    if (!dashboardData) {
        return;
    }


    document
        .getElementById("loading")
        ?.classList
        .add("hidden");


    document
        .getElementById("dashboard")
        ?.classList
        .remove("hidden");


    renderMeta();

    renderSummary();

    renderAllocationCards();

    renderMainCharts();

    renderDepartmentTables();
}


/* =========================================================
   META
========================================================= */

function renderMeta() {

    setText(
        "orgName",
        dashboardData.meta?.organization
    );

    setText(
        "metaDate",
        dashboardData.meta?.date
    );

    setText(
        "metaVersion",
        dashboardData.meta?.version
    );

    setText(
        "metaPrepared",
        dashboardData.meta?.preparedBy
    );
}


/* =========================================================
   SUMMARY
========================================================= */

function renderSummary() {

    const totalCapital =
        number(
            dashboardData.capital?.total
        );


    let allocatedCapital = 0;


    VERTICALS.forEach(vertical => {

        const data =
            dashboardData.verticals?.[
                vertical.key
            ] || {};

        allocatedCapital +=
            totalCapital *
            number(data.percent) /
            100;
    });


    const unallocated =
        totalCapital -
        allocatedCapital;


    setText(
        "totalCapital",
        money(totalCapital)
    );


    setText(
        "allocatedCapital",
        money(allocatedCapital)
    );


    setText(
        "unallocatedCapital",
        money(
            Math.abs(unallocated)
        )
    );


    const status =
        document.getElementById("status");


    if (!status) {
        return;
    }


    if (Math.abs(unallocated) < 0.01) {

        status.innerHTML =
            `<span>✓</span> Fully Allocated`;

        status.style.color =
            "#238c43";

    } else if (unallocated > 0) {

        status.innerHTML =
            `<span>+</span> Surplus ${money(unallocated)}`;

        status.style.color =
            "#238c43";

    } else {

        status.innerHTML =
            `<span>!</span> Deficit ${money(Math.abs(unallocated))}`;

        status.style.color =
            "#c62828";
    }
}


/* =========================================================
   ALLOCATION CARDS
========================================================= */

function renderAllocationCards() {

    const container =
        document.getElementById(
            "allocationCards"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const totalCapital =
        number(
            dashboardData.capital?.total
        );


    VERTICALS.forEach(vertical => {

        const data =
            dashboardData.verticals?.[
                vertical.key
            ] || {};


        const allocationPercent =
            number(data.percent);


        const capital =
            totalCapital *
            allocationPercent /
            100;


        const card =
            document.createElement("div");


        card.className =
            `allocation-card ${vertical.key}`;


        card.innerHTML = `

            <div class="card-head">
                ${escapeHTML(vertical.name)}
            </div>

            <div class="percent">
                ${percent(allocationPercent)}
            </div>

            <div class="amount">
                ${money(capital)}
            </div>
        `;


        container.appendChild(card);
    });
}


/* =========================================================
   MAIN CHARTS
========================================================= */

function renderMainCharts() {

    renderDonut();

    renderCapitalBars();
}


/* =========================================================
   DONUT
========================================================= */

function renderDonut() {

    const donut =
        document.getElementById("donut");

    const legend =
        document.getElementById("legend");


    if (!donut || !legend) {
        return;
    }


    let start = 0;

    const parts = [];


    VERTICALS.forEach(vertical => {

        const value =
            number(
                dashboardData
                    .verticals?.[
                        vertical.key
                    ]?.percent
            );


        const end =
            start + value;


        parts.push(
            `${vertical.color} ${start}% ${end}%`
        );


        start = end;
    });


    donut.style.background =
        parts.length
            ? `conic-gradient(${parts.join(",")})`
            : "#ddd";


    legend.innerHTML = "";


    VERTICALS.forEach(vertical => {

        const data =
            dashboardData
                .verticals?.[
                    vertical.key
                ] || {};


        const row =
            document.createElement("div");


        row.innerHTML = `

            <span
                class="dot"
                style="background:${vertical.color}"
            ></span>

            <span>
                ${escapeHTML(vertical.name)}
            </span>

            <b>
                ${percent(data.percent)}
            </b>
        `;


        legend.appendChild(row);
    });
}


/* =========================================================
   MAIN CAPITAL BAR CHART
========================================================= */

function renderCapitalBars() {

    const bars =
        document.getElementById("bars");


    if (!bars) {
        return;
    }


    bars.innerHTML = "";


    const totalCapital =
        number(
            dashboardData.capital?.total
        );


    const maxCapital =
        Math.max(
            totalCapital,
            ...VERTICALS.map(
                vertical =>
                    totalCapital *
                    number(
                        dashboardData
                            .verticals?.[
                                vertical.key
                            ]?.percent
                    ) /
                    100
            ),
            1
        );


    VERTICALS.forEach(vertical => {

        const data =
            dashboardData
                .verticals?.[
                    vertical.key
                ] || {};


        const capital =
            totalCapital *
            number(data.percent) /
            100;


        const height =
            capital /
            maxCapital *
            100;


        const group =
            document.createElement("div");


        group.className =
            "bar-group";


        group.innerHTML = `

            <div
                class="bar ${vertical.barClass}"
                style="height:${Math.max(height, 2)}%"
            >
                <span>
                    ${formatShortMoney(capital)}
                </span>
            </div>

            <small>
                ${escapeHTML(
                    vertical.name
                )}
            </small>
        `;


        bars.appendChild(group);
    });
}


/* =========================================================
   DEPARTMENT TABLES
========================================================= */

function renderDepartmentTables() {

    const container =
        document.getElementById(
            "tablesGrid"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    VERTICALS.forEach(vertical => {

        const data =
            dashboardData
                .verticals?.[
                    vertical.key
                ] || {};


        const department =
            createDepartment(
                vertical,
                data
            );


        container.appendChild(
            department
        );
    });
}


/* =========================================================
   CREATE DEPARTMENT
========================================================= */

function createDepartment(
    vertical,
    data
) {

    const department =
        document.createElement("div");


    department.className =
        `department ${vertical.boxClass}`;


    const totalCapital =
        number(
            dashboardData
                .capital?.total
        );


    const departmentCapital =
        totalCapital *
        number(data.percent) /
        100;


    const items =
        Array.isArray(data.items)
            ? data.items
            : [];


    department.innerHTML = `

        <h2>
            ${escapeHTML(vertical.name)}

            <span>
                (${percent(data.percent)})
            </span>
        </h2>

        <table>

            <thead>
                <tr>
                    <th>Particular</th>
                    <th>Allocation %</th>
                    <th>Capital (₹)</th>
                </tr>
            </thead>

            <tbody class="allocation-body"></tbody>

            <tfoot>
                <tr class="total-row">
                    <th>TOTAL</th>
                    <th class="total-percent"></th>
                    <th class="total-capital"></th>
                </tr>

                <tr class="department-status">
                    <th>STATUS</th>
                    <th class="department-status-percent"></th>
                    <th class="department-status-capital"></th>
                </tr>
            </tfoot>

        </table>

        <div class="item-chart">

            <div class="item-chart-title">
                ${escapeHTML(vertical.name)}
                Allocation
            </div>

            <div class="item-bars"></div>

        </div>

        <div class="roi-table-wrap">

            <table class="roi-table">

                <thead>

                    <tr>

                        <th>Particular</th>

                        <th>Capital (₹)</th>

                        <th>
                            Last Week<br>
                            ROI %
                        </th>

                        <th>
                            Last Week<br>
                            ROI (₹)
                        </th>

                        <th>
                            Last Month<br>
                            ROI %
                        </th>

                        <th>
                            Last Month<br>
                            ROI (₹)
                        </th>

                    </tr>

                </thead>

                <tbody class="roi-body"></tbody>

                <tfoot>

                    <tr class="roi-total">

                        <th>TOTAL</th>

                        <th class="roi-total-capital"></th>

                        <th class="roi-total-week-percent"></th>

                        <th class="roi-total-week-amount"></th>

                        <th class="roi-total-month-percent"></th>

                        <th class="roi-total-month-amount"></th>

                    </tr>

                </tfoot>

            </table>

        </div>

        <div class="purpose">

            <b>Purpose</b>

            <p>
                ${escapeHTML(
                    data.purpose || ""
                )}
            </p>

        </div>
    `;


    renderAllocationTable(
        department,
        items,
        departmentCapital
    );


    renderItemChart(
        department,
        items
    );


    renderROITable(
        department,
        items,
        totalCapital
    );


    return department;
}


/* =========================================================
   ALLOCATION TABLE
========================================================= */

function renderAllocationTable(
    department,
    items,
    departmentCapital
) {

    const body =
        department.querySelector(
            ".allocation-body"
        );


    let totalPercent = 0;

    let totalCapital = 0;


    items.forEach(item => {

        const name =
            String(item?.[0] ?? "");


        const allocation =
            number(item?.[1]);


        const capital =
            departmentCapital *
            allocation /
            100;


        totalPercent +=
            allocation;


        totalCapital +=
            capital;


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHTML(name)}
            </td>

            <td>
                ${percent(allocation)}
            </td>

            <td>
                ${money(capital)}
            </td>
        `;


        body.appendChild(row);
    });


    department.querySelector(
        ".total-percent"
    ).textContent =
        percent(totalPercent);


    department.querySelector(
        ".total-capital"
    ).textContent =
        money(totalCapital);


    const targetPercent =
        getDepartmentPercent(
            department
        );


    const difference =
        totalPercent -
        targetPercent;


    const statusRow =
        department.querySelector(
            ".department-status"
        );


    const statusPercent =
        department.querySelector(
            ".department-status-percent"
        );


    const statusCapital =
        department.querySelector(
            ".department-status-capital"
        );


    if (Math.abs(difference) < 0.001) {

        statusRow.className =
            "department-status fully-allocated";


        statusPercent.textContent =
            "0%";


        statusCapital.textContent =
            "₹0";


        statusRow.firstElementChild
            .textContent =
            "FULLY ALLOCATED";


    } else if (difference > 0) {

        const surplusCapital =
            departmentCapital *
            difference /
            100;


        statusRow.className =
            "department-status surplus";


        statusRow.firstElementChild
            .textContent =
            "SURPLUS";


        statusPercent.textContent =
            "+" + percent(difference);


        statusCapital.textContent =
            "+" + money(surplusCapital);


    } else {

        const deficit =
            Math.abs(difference);


        const deficitCapital =
            departmentCapital *
            deficit /
            100;


        statusRow.className =
            "department-status deficit";


        statusRow.firstElementChild
            .textContent =
            "DEFICIT";


        statusPercent.textContent =
            "-" + percent(deficit);


        statusCapital.textContent =
            "-" + money(deficitCapital);
    }
}


/* =========================================================
   GET DEPARTMENT TARGET
========================================================= */

function getDepartmentPercent(
    department
) {

    const key =
        VERTICALS.find(
            vertical =>
                department.classList.contains(
                    vertical.boxClass
                )
        )?.key;


    return key
        ? number(
            dashboardData
                .verticals?.[
                    key
                ]?.percent
        )
        : 0;
}


/* =========================================================
   ITEM BAR CHART
========================================================= */

function renderItemChart(
    department,
    items
) {

    const bars =
        department.querySelector(
            ".item-bars"
        );


    if (!bars) {
        return;
    }


    bars.innerHTML = "";


    if (!items.length) {

        bars.innerHTML =
            `<div style="
                width:100%;
                text-align:center;
                padding:80px 10px;
                color:#777;
            ">
                No items added
            </div>`;

        return;
    }


    const max =
        Math.max(
            ...items.map(
                item =>
                    number(item?.[1])
            ),
            1
        );


    items.forEach(item => {

        const name =
            String(item?.[0] ?? "");


        const allocation =
            number(item?.[1]);


        const height =
            allocation /
            max *
            100;


        const group =
            document.createElement("div");


        group.className =
            "item-bar-group";


        group.innerHTML = `

            <div class="item-bar-value">
                ${percent(allocation)}
            </div>

            <div
                class="item-bar"
                style="
                    height:${Math.max(height, 3)}%;
                    background:${getDepartmentColor(department)};
                "
            ></div>

            <div class="item-bar-label">
                ${escapeHTML(name)}
            </div>
        `;


        bars.appendChild(group);
    });
}


/* =========================================================
   DEPARTMENT COLOR
========================================================= */

function getDepartmentColor(
    department
) {

    for (const vertical of VERTICALS) {

        if (
            department.classList.contains(
                vertical.boxClass
            )
        ) {

            return vertical.color;
        }
    }


    return "#438ddd";
}


/* =========================================================
   ROI TABLE
========================================================= */

function renderROITable(
    department,
    items,
    totalCapital
) {

    const body =
        department.querySelector(
            ".roi-body"
        );


    let totalItemCapital = 0;

    let totalWeekAmount = 0;

    let totalMonthAmount = 0;


    items.forEach(item => {

        const name =
            String(item?.[0] ?? "");


        const allocation =
            number(item?.[1]);


        const weekROI =
            number(item?.[2]);


        const monthROI =
            number(item?.[3]);


        /*
           Capital is calculated from
           TOTAL FUND CAPITAL.

           Example:

           Total = ₹1 crore
           Allocation = 5%

           Capital = ₹5 lakh
        */

        const capital =
            totalCapital *
            allocation /
            100;


        const weekAmount =
            capital *
            weekROI /
            100;


        const monthAmount =
            capital *
            monthROI /
            100;


        totalItemCapital +=
            capital;


        totalWeekAmount +=
            weekAmount;


        totalMonthAmount +=
            monthAmount;


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHTML(name)}
            </td>

            <td>
                ${money(capital)}
            </td>

            <td class="${roiClass(weekROI)}">
                ${formatROI(weekROI)}
            </td>

            <td class="${roiClass(weekAmount)}">
                ${moneyWithSign(weekAmount)}
            </td>

            <td class="${roiClass(monthROI)}">
                ${formatROI(monthROI)}
            </td>

            <td class="${roiClass(monthAmount)}">
                ${moneyWithSign(monthAmount)}
            </td>
        `;


        body.appendChild(row);
    });


    const totalAllocationPercent =
        items.reduce(
            (
                total,
                item
            ) =>
                total +
                number(item?.[1]),
            0
        );


    /*
       Weighted average ROI
    */

    const totalWeekPercent =
        totalItemCapital
            ? totalWeekAmount /
              totalItemCapital *
              100
            : 0;


    const totalMonthPercent =
        totalItemCapital
            ? totalMonthAmount /
              totalItemCapital *
              100
            : 0;


    const capitalCell =
        department.querySelector(
            ".roi-total-capital"
        );


    const weekPercentCell =
        department.querySelector(
            ".roi-total-week-percent"
        );


    const weekAmountCell =
        department.querySelector(
            ".roi-total-week-amount"
        );


    const monthPercentCell =
        department.querySelector(
            ".roi-total-month-percent"
        );


    const monthAmountCell =
        department.querySelector(
            ".roi-total-month-amount"
        );


    capitalCell.textContent =
        money(totalItemCapital);


    weekPercentCell.textContent =
        formatROI(totalWeekPercent);


    weekAmountCell.textContent =
        moneyWithSign(totalWeekAmount);


    monthPercentCell.textContent =
        formatROI(totalMonthPercent);


    monthAmountCell.textContent =
        moneyWithSign(totalMonthAmount);
}


/* =========================================================
   ROI FORMAT
========================================================= */

function formatROI(value) {

    const n =
        number(value);


    if (n > 0) {

        return "+" +
            n.toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 2
                }
            ) +
            "%";
    }


    if (n < 0) {

        return n.toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        ) + "%";
    }


    return "0%";
}


/* =========================================================
   MONEY WITH SIGN
========================================================= */

function moneyWithSign(value) {

    const n =
        number(value);


    if (n > 0) {

        return "+" +
            money(n);
    }


    if (n < 0) {

        return "-" +
            money(Math.abs(n));
    }


    return "₹0";
}


/* =========================================================
   ROI CLASS
========================================================= */

function roiClass(value) {

    const n =
        number(value);


    if (n > 0) {
        return "roi-positive";
    }


    if (n < 0) {
        return "roi-negative";
    }


    return "";
}


/* =========================================================
   SHORT MONEY
========================================================= */

function formatShortMoney(value) {

    const n =
        number(value);


    if (n >= 10000000) {

        return "₹" +
            (n / 10000000)
                .toFixed(1)
                .replace(".0", "") +
            "Cr";
    }


    if (n >= 100000) {

        return "₹" +
            (n / 100000)
                .toFixed(1)
                .replace(".0", "") +
            "L";
    }


    if (n >= 1000) {

        return "₹" +
            (n / 1000)
                .toFixed(1)
                .replace(".0", "") +
            "K";
    }


    return money(n);
}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value ?? "";
    }
}


/* =========================================================
   START
========================================================= */

loadDashboard();


/* =========================================================
   AUTO REFRESH
========================================================= */

setInterval(
    loadDashboard,
    30000
);
