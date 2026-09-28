/* =========================================================
   YOGI GROWING TOGETHER LLP
   FUND ALLOCATION SYSTEM
   COMPLETE DASHBOARD.JS
========================================================= */

const $ = (id) => document.getElementById(id);

/* =========================================================
   FORMATTERS
========================================================= */

function formatINR(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function formatNumber(value) {
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2
    }).format(Number(value) || 0);
}

function formatLakh(value) {

    value = Number(value) || 0;

    if (value >= 10000000) {
        return (
            (value / 10000000)
                .toFixed(1)
                .replace(".0", "") + "Cr"
        );
    }

    if (value >= 100000) {
        return (
            (value / 100000)
                .toFixed(1)
                .replace(".0", "") + "L"
        );
    }

    if (value >= 1000) {
        return (
            (value / 1000)
                .toFixed(0) + "K"
        );
    }

    return String(value);
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
   DATE
========================================================= */

function formatDisplayDate(value) {

    if (!value) return "";

    const text = String(value).trim();

    const iso = text.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (iso) {
        return `${iso[3]}-${iso[2]}-${iso[1]}`;
    }

    return text;
}

/* =========================================================
   COLORS
========================================================= */

const DEPARTMENT_COLORS = {

    trading: "#2f75b5",

    investment: "#70ad47",

    reserve: "#ffc000",

    rnd: "#7030a0"
};

function getDepartmentColor(key) {

    return (
        DEPARTMENT_COLORS[key] ||
        "#777777"
    );
}

/* =========================================================
   DEPARTMENTS
========================================================= */

const DEPARTMENTS = [

    {
        key: "trading",
        name: "Trading"
    },

    {
        key: "investment",
        name: "Investment"
    },

    {
        key: "reserve",
        name: "Reserve"
    },

    {
        key: "rnd",
        name: "R&D"
    }
];

/* =========================================================
   NORMALIZE ITEM
========================================================= */

function normalizeItem(item) {

    if (Array.isArray(item)) {

        return {

            name: String(
                item[0] ?? "Item"
            ),

            percent:
                Number(item[1]) || 0,

            weekROI:
                Number(item[2]) || 0,

            monthROI:
                Number(item[3]) || 0
        };
    }

    if (
        item &&
        typeof item === "object"
    ) {

        return {

            name: String(
                item.name ?? "Item"
            ),

            percent:
                Number(
                    item.percent ??
                    item.allocation ??
                    0
                ) || 0,

            weekROI:
                Number(
                    item.weekROI ??
                    item.lastWeekROI ??
                    0
                ) || 0,

            monthROI:
                Number(
                    item.monthROI ??
                    item.lastMonthROI ??
                    0
                ) || 0
        };
    }

    return {

        name: "Item",

        percent: 0,

        weekROI: 0,

        monthROI: 0
    };
}

/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

    try {

        const response =
            await fetch(
                "/api/data",
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                "Unable to load dashboard data"
            );
        }

        const data =
            await response.json();

        renderDashboard(data);

        if ($("loading")) {
            $("loading")
                .classList
                .add("hidden");
        }

        if ($("dashboard")) {
            $("dashboard")
                .classList
                .remove("hidden");
        }

    } catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

        if ($("loading")) {

            $("loading").textContent =
                "Unable to load dashboard. Please refresh the page.";
        }
    }
}

/* =========================================================
   MAIN DASHBOARD
========================================================= */

function renderDashboard(data) {

    const totalCapital =
        Number(
            data?.capital?.total
        ) || 0;

    const verticals =
        data?.verticals || {};

    let allocatedCapital = 0;

    DEPARTMENTS.forEach(
        department => {

            const percent =
                Number(
                    verticals?.[
                        department.key
                    ]?.percent
                ) || 0;

            allocatedCapital +=
                totalCapital *
                percent /
                100;
        }
    );

    const difference =
        totalCapital -
        allocatedCapital;

    /* =====================================================
       HEADER
    ===================================================== */

    if ($("orgName")) {

        $("orgName").textContent =
            data?.meta?.organization || "";
    }

    if ($("metaDate")) {

        $("metaDate").textContent =
            formatDisplayDate(
                data?.meta?.date
            );
    }

    if ($("metaPrepared")) {

        $("metaPrepared").textContent =
            data?.meta?.preparedBy || "";
    }

    /* =====================================================
       SUMMARY
    ===================================================== */

    if ($("totalCapital")) {

        $("totalCapital").textContent =
            formatINR(totalCapital);
    }

    if ($("allocatedCapital")) {

        $("allocatedCapital").textContent =
            formatINR(allocatedCapital);
    }

    if ($("unallocatedCapital")) {

        $("unallocatedCapital").textContent =
            formatINR(
                Math.abs(difference)
            );
    }

    renderOverallStatus(
        totalCapital,
        allocatedCapital
    );

    /* =====================================================
       ALLOCATION CARDS
    ===================================================== */

    renderAllocationCards(
        data,
        totalCapital
    );

    /* =====================================================
       DONUT
    ===================================================== */

    renderDonut(data);

    /* =====================================================
       CAPITAL BARS
    ===================================================== */

    renderCapitalBars(
        data,
        totalCapital
    );

    /* =====================================================
       OVERALL ROI
       ADMIN ON/OFF CONTROL
    ===================================================== */

    if (
        data?.settings?.overallROIEnabled !== false
    ) {

        renderOverallROI(
            data,
            totalCapital
        );

    } else {

        const existing =
            document.getElementById(
                "overallROISection"
            );

        if (existing) {
            existing.remove();
        }
    }

    /* =====================================================
       DEPARTMENT TABLES
    ===================================================== */

    renderDepartmentTables(
        data,
        totalCapital
    );
}

/* =========================================================
   OVERALL STATUS
========================================================= */

function renderOverallStatus(
    totalCapital,
    allocatedCapital
) {

    const element = $("status");

    if (!element) return;

    const difference =
        totalCapital -
        allocatedCapital;

    if (
        Math.abs(difference) < 0.01
    ) {

        element.innerHTML = `
            <span class="status-full">
                FULLY ALLOCATED
            </span>
        `;

    } else if (
        difference > 0
    ) {

        element.innerHTML = `
            <span class="status-surplus">
                SURPLUS ${formatINR(difference)}
            </span>
        `;

    } else {

        element.innerHTML = `
            <span class="status-deficit">
                DEFICIT ${formatINR(
                    Math.abs(difference)
                )}
            </span>
        `;
    }
}

/* =========================================================
   ALLOCATION CARDS
========================================================= */

function renderAllocationCards(
    data,
    totalCapital
) {

    const container =
        $("allocationCards");

    if (!container) return;

    container.innerHTML = "";

    DEPARTMENTS.forEach(
        department => {

            const percent =
                Number(
                    data?.verticals?.[
                        department.key
                    ]?.percent
                ) || 0;

            const capital =
                totalCapital *
                percent /
                100;

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                `allocation-card ${department.key}`;

            card.innerHTML = `

                <div class="allocation-title">
                    ${department.name}
                </div>

                <div class="allocation-percent">
                    ${formatNumber(percent)}%
                </div>

                <div class="allocation-capital">
                    ${formatINR(capital)}
                </div>

            `;

            container.appendChild(card);
        }
    );
}

/* =========================================================
   FUND ALLOCATION DONUT
========================================================= */

function renderDonut(data) {

    const donut = $("donut");

    const legend = $("legend");

    if (!donut || !legend) return;

    const values =
        DEPARTMENTS.map(
            department =>
                Math.max(
                    0,
                    Number(
                        data?.verticals?.[
                            department.key
                        ]?.percent
                    ) || 0
                )
        );

    const total =
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        );

    let current = 0;

    const segments = [];

    DEPARTMENTS.forEach(
        (department, index) => {

            const value =
                values[index];

            if (
                value <= 0 ||
                total <= 0
            ) return;

            const start =
                current /
                total *
                360;

            current += value;

            const end =
                current /
                total *
                360;

            segments.push(
                `${getDepartmentColor(
                    department.key
                )} ${start}deg ${end}deg`
            );
        }
    );

    if (segments.length) {

        donut.style.background =
            `conic-gradient(
                ${segments.join(",")}
            )`;

    } else {

        donut.style.background =
            "#e5e5e5";
    }

    legend.innerHTML = "";

    DEPARTMENTS.forEach(
        (department, index) => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "legend-item";

            row.innerHTML = `

                <span
                    class="legend-dot"
                    style="
                        width:10px;
                        height:10px;
                        border-radius:50%;
                        display:inline-block;
                        background:${getDepartmentColor(
                            department.key
                        )};
                    "
                ></span>

                <span>
                    ${department.name}
                </span>

                <b>
                    ${formatNumber(
                        values[index]
                    )}%
                </b>
            `;

            legend.appendChild(row);
        }
    );
}

/* =========================================================
   CAPITAL BAR CHART
========================================================= */

function renderCapitalBars(
    data,
    totalCapital
) {

    const container =
        $("bars");

    if (!container) return;

    container.innerHTML = "";

    const values =
        DEPARTMENTS.map(
            department => {

                const percent =
                    Number(
                        data?.verticals?.[
                            department.key
                        ]?.percent
                    ) || 0;

                return {

                    key:
                        department.key,

                    name:
                        department.name,

                    capital:
                        totalCapital *
                        percent /
                        100
                };
            }
        );

    const highest =
        Math.max(
            ...values.map(
                item =>
                    item.capital
            ),
            1
        );

    let maxValue;

    if (
        highest <= 1000000
    ) {

        maxValue =
            Math.ceil(
                highest /
                100000
            ) *
            100000;

    } else if (
        highest <= 10000000
    ) {

        maxValue =
            Math.ceil(
                highest /
                1000000
            ) *
            1000000;

    } else {

        maxValue =
            Math.ceil(
                highest /
                10000000
            ) *
            10000000;
    }

    if (maxValue <= 0) {
        maxValue = 1;
    }

    const wrapper =
        container.parentElement;

    if (wrapper) {

        const yAxis =
            wrapper.querySelector(
                ".y-axis"
            );

        if (yAxis) {

            yAxis.innerHTML = "";

            for (
                let i = 5;
                i >= 0;
                i--
            ) {

                const label =
                    document.createElement(
                        "span"
                    );

                label.textContent =
                    formatLakh(
                        maxValue *
                        i /
                        5
                    );

                yAxis.appendChild(label);
            }
        }
    }

    values.forEach(
        item => {

            const group =
                document.createElement(
                    "div"
                );

            group.className =
                "bar-group";

            const value =
                document.createElement(
                    "div"
                );

            value.className =
                "bar-value";

            value.textContent =
                formatINR(
                    item.capital
                );

            const bar =
                document.createElement(
                    "div"
                );

            bar.className = "bar";

            let height =
                item.capital /
                maxValue *
                100;

            if (
                item.capital > 0 &&
                height < 2
            ) {
                height = 2;
            }

            bar.style.height =
                `${height}%`;

            bar.style.background =
                getDepartmentColor(
                    item.key
                );

            bar.title =
                `${item.name}: ${formatINR(
                    item.capital
                )}`;

            const label =
                document.createElement(
                    "div"
                );

            label.className =
                "bar-label";

            label.textContent =
                item.name;

            group.appendChild(value);

            group.appendChild(bar);

            group.appendChild(label);

            container.appendChild(group);
        }
    );
}

/* =========================================================
   CALCULATE OVERALL ROI
========================================================= */

function calculateOverallROI(
    data,
    totalCapital
) {

    return DEPARTMENTS.map(
        department => {

            const vertical =
                data?.verticals?.[
                    department.key
                ] || {};

            const departmentPercent =
                Number(
                    vertical.percent
                ) || 0;

            const departmentCapital =
                totalCapital *
                departmentPercent /
                100;

            const items =
                Array.isArray(
                    vertical.items
                )
                    ? vertical.items
                    : [];

            let weekAmount = 0;

            let monthAmount = 0;

            items.forEach(
                item => {

                    const x =
                        normalizeItem(item);

                    const capital =
                        totalCapital *
                        x.percent /
                        100;

                    weekAmount +=
                        capital *
                        x.weekROI /
                        100;

                    monthAmount +=
                        capital *
                        x.monthROI /
                        100;
                }
            );

            const weekPercent =
                departmentCapital > 0
                    ? weekAmount /
                      departmentCapital *
                      100
                    : 0;

            const monthPercent =
                departmentCapital > 0
                    ? monthAmount /
                      departmentCapital *
                      100
                    : 0;

            return {

                key:
                    department.key,

                name:
                    department.name,

                capital:
                    departmentCapital,

                weekPercent:
                    weekPercent,

                weekAmount:
                    weekAmount,

                monthPercent:
                    monthPercent,

                monthAmount:
                    monthAmount
            };
        }
    );
}

/* =========================================================
   OVERALL ROI PERFORMANCE
========================================================= */

function renderOverallROI(
    data,
    totalCapital
) {

    const oldSection =
        document.getElementById(
            "overallROISection"
        );

    if (oldSection) {
        oldSection.remove();
    }

    const tablesGrid =
        $("tablesGrid");

    if (!tablesGrid) return;

    const results =
        calculateOverallROI(
            data,
            totalCapital
        );

    const totalCapitalAllocated =
        results.reduce(
            (sum, item) =>
                sum + item.capital,
            0
        );

    const totalWeekROI =
        results.reduce(
            (sum, item) =>
                sum + item.weekAmount,
            0
        );

    const totalMonthROI =
        results.reduce(
            (sum, item) =>
                sum + item.monthAmount,
            0
        );

    const overallWeekPercent =
        totalCapitalAllocated > 0
            ? totalWeekROI /
              totalCapitalAllocated *
              100
            : 0;

    const overallMonthPercent =
        totalCapitalAllocated > 0
            ? totalMonthROI /
              totalCapitalAllocated *
              100
            : 0;

    /* =====================================================
       SECTION
    ===================================================== */

    const section =
        document.createElement("section");

    section.id =
        "overallROISection";

    section.style.cssText = `
        width:100%;
        margin:30px 0;
        background:#ffffff;
        border:1px solid #d7d7d7;
        border-radius:10px;
        overflow:hidden;
        box-shadow:0 3px 12px rgba(0,0,0,.08);
    `;

    /* =====================================================
       HEADER
    ===================================================== */

    const header =
        document.createElement("div");

    header.style.cssText = `
        background:#075c32;
        color:#ffffff;
        padding:18px 22px;
        text-align:center;
        font-size:20px;
        font-weight:800;
        letter-spacing:.5px;
    `;

    header.textContent =
        "OVERALL ROI PERFORMANCE";

    section.appendChild(header);

    const content =
        document.createElement("div");

    content.style.cssText = `
        padding:24px;
    `;

    /* =====================================================
       TABLE TITLE
    ===================================================== */

    const tableTitle =
        document.createElement("div");

    tableTitle.style.cssText = `
        font-size:17px;
        font-weight:800;
        margin-bottom:14px;
        color:#075c32;
    `;

    tableTitle.textContent =
        "Department Wise ROI";

    content.appendChild(tableTitle);

    /* =====================================================
       TABLE
    ===================================================== */

    const tableWrap =
        document.createElement("div");

    tableWrap.style.cssText = `
        width:100%;
        overflow-x:auto;
    `;

    const table =
        document.createElement("table");

    table.style.cssText = `
        width:100%;
        border-collapse:collapse;
        min-width:850px;
        font-size:14px;
    `;

    table.innerHTML = `

        <thead>

            <tr style="
                background:#f1f5f3;
            ">

                <th style="
                    padding:13px;
                    border:1px solid #ddd;
                    text-align:left;
                ">
                    DEPARTMENT
                </th>

                <th style="
                    padding:13px;
                    border:1px solid #ddd;
                    text-align:right;
                ">
                    CAPITAL
                </th>

                <th style="
                    padding:13px;
                    border:1px solid #ddd;
                    text-align:right;
                ">
                    LAST WEEK ROI %
                </th>

                <th style="
                    padding:13px;
                    border:1px solid #ddd;
                    text-align:right;
                ">
                    LAST WEEK ROI (₹)
                </th>

                <th style="
                    padding:13px;
                    border:1px solid #ddd;
                    text-align:right;
                ">
                    LAST MONTH ROI %
                </th>

                <th style="
                    padding:13px;
                    border:1px solid #ddd;
                    text-align:right;
                ">
                    LAST MONTH ROI (₹)
                </th>

            </tr>

        </thead>

        <tbody></tbody>
    `;

    const tbody =
        table.querySelector("tbody");

    results.forEach(
        item => {

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td style="
                    padding:13px;
                    border:1px solid #ddd;
                    font-weight:700;
                ">

                    <span style="
                        display:inline-block;
                        width:10px;
                        height:10px;
                        border-radius:50%;
                        background:${getDepartmentColor(
                            item.key
                        )};
                        margin-right:7px;
                    "></span>

                    ${escapeHTML(item.name)}

                </td>

                <td style="
                    padding:13px;
                    border:1px solid #ddd;
                    text-align:right;
                ">
                    ${formatINR(item.capital)}
                </td>

                <td style="
                    padding:13px;
                    border:1px solid #ddd;
                    text-align:right;
                    font-weight:700;
                ">
                    ${formatNumber(
                        item.weekPercent
                    )}%
                </td>

                <td style="
                    padding:13px;
                    border:1px solid #ddd;
                    text-align:right;
                    font-weight:700;
                ">
                    ${formatINR(
                        item.weekAmount
                    )}
                </td>

                <td style="
                    padding:13px;
                    border:1px solid #ddd;
                    text-align:right;
                    font-weight:700;
                ">
                    ${formatNumber(
                        item.monthPercent
                    )}%
                </td>

                <td style="
                    padding:13px;
                    border:1px solid #ddd;
                    text-align:right;
                    font-weight:700;
                ">
                    ${formatINR(
                        item.monthAmount
                    )}
                </td>

            `;

            tbody.appendChild(row);
        }
    );

    /* =====================================================
       TOTAL ROW
    ===================================================== */

    const totalRow =
        document.createElement("tr");

    totalRow.style.cssText = `
        background:#eaf4ee;
        font-weight:800;
    `;

    totalRow.innerHTML = `

        <td style="
            padding:14px;
            border:1px solid #ddd;
        ">
            TOTAL OVERALL ROI
        </td>

        <td style="
            padding:14px;
            border:1px solid #ddd;
            text-align:right;
        ">
            ${formatINR(
                totalCapitalAllocated
            )}
        </td>

        <td style="
            padding:14px;
            border:1px solid #ddd;
            text-align:right;
        ">
            ${formatNumber(
                overallWeekPercent
            )}%
        </td>

        <td style="
            padding:14px;
            border:1px solid #ddd;
            text-align:right;
        ">
            ${formatINR(totalWeekROI)}
        </td>

        <td style="
            padding:14px;
            border:1px solid #ddd;
            text-align:right;
        ">
            ${formatNumber(
                overallMonthPercent
            )}%
        </td>

        <td style="
            padding:14px;
            border:1px solid #ddd;
            text-align:right;
        ">
            ${formatINR(totalMonthROI)}
        </td>

    `;

    tbody.appendChild(totalRow);

    tableWrap.appendChild(table);

    content.appendChild(tableWrap);

    /* =====================================================
       PIE CHART AREA
    ===================================================== */

    const pieArea =
        document.createElement("div");

    pieArea.style.cssText = `
        margin-top:30px;
        display:flex;
        flex-wrap:wrap;
        align-items:center;
        justify-content:center;
        gap:40px;
        padding:20px 10px;
        border-top:1px solid #ddd;
    `;

    /* =====================================================
       PIE
    ===================================================== */

    const pie =
        document.createElement("div");

    pie.style.cssText = `
        width:300px;
        height:300px;
        border-radius:50%;
        position:relative;
        flex-shrink:0;
        box-shadow:
            0 5px 15px rgba(0,0,0,.15);
    `;

    let pieCurrent = 0;

    const pieSegments = [];

    results.forEach(
        item => {

            const value =
                Math.max(
                    0,
                    item.monthAmount
                );

            if (
                value <= 0 ||
                totalMonthROI <= 0
            ) {
                return;
            }

            const start =
                pieCurrent /
                totalMonthROI *
                360;

            pieCurrent += value;

            const end =
                pieCurrent /
                totalMonthROI *
                360;

            pieSegments.push(
                `${getDepartmentColor(
                    item.key
                )} ${start}deg ${end}deg`
            );
        }
    );

    if (pieSegments.length > 0) {

        pie.style.background =
            `conic-gradient(
                ${pieSegments.join(",")}
            )`;

    } else {

        pie.style.background =
            "#dddddd";
    }

    /* =====================================================
       PIE CENTER
    ===================================================== */

    const center =
        document.createElement("div");

    center.style.cssText = `
        position:absolute;
        width:135px;
        height:135px;
        border-radius:50%;
        background:#ffffff;
        left:50%;
        top:50%;
        transform:translate(-50%,-50%);
        display:flex;
        flex-direction:column;
        justify-content:center;
        align-items:center;
        text-align:center;
        box-shadow:0 2px 8px rgba(0,0,0,.08);
    `;

    center.innerHTML = `

        <div style="
            font-size:13px;
            color:#666;
            font-weight:700;
        ">
            LAST MONTH ROI
        </div>

        <div style="
            font-size:20px;
            color:#075c32;
            font-weight:900;
            margin-top:5px;
        ">
            ${formatINR(totalMonthROI)}
        </div>

        <div style="
            font-size:13px;
            color:#333;
            font-weight:700;
        ">
            ${formatNumber(
                overallMonthPercent
            )}%
        </div>

    `;

    pie.appendChild(center);

    pieArea.appendChild(pie);

    /* =====================================================
       PIE LEGEND
    ===================================================== */

    const pieLegend =
        document.createElement("div");

    pieLegend.style.cssText = `
        min-width:260px;
        max-width:400px;
        width:100%;
    `;

    const legendTitle =
        document.createElement("div");

    legendTitle.style.cssText = `
        font-size:17px;
        font-weight:800;
        color:#075c32;
        margin-bottom:15px;
    `;

    legendTitle.textContent =
        "Last Month ROI Contribution";

    pieLegend.appendChild(legendTitle);

    results.forEach(
        item => {

            const share =
                totalMonthROI > 0
                    ? item.monthAmount /
                      totalMonthROI *
                      100
                    : 0;

            const row =
                document.createElement("div");

            row.style.cssText = `
                display:flex;
                align-items:center;
                gap:10px;
                padding:9px 0;
                border-bottom:1px solid #eeeeee;
            `;

            row.innerHTML = `

                <span style="
                    width:13px;
                    height:13px;
                    border-radius:50%;
                    background:${getDepartmentColor(
                        item.key
                    )};
                    flex-shrink:0;
                "></span>

                <span style="
                    flex:1;
                    font-weight:700;
                ">
                    ${escapeHTML(item.name)}
                </span>

                <span style="
                    font-weight:800;
                ">
                    ${formatINR(
                        item.monthAmount
                    )}
                </span>

                <span style="
                    width:55px;
                    text-align:right;
                    color:#666;
                ">
                    ${formatNumber(share)}%
                </span>

            `;

            pieLegend.appendChild(row);
        }
    );

    pieArea.appendChild(pieLegend);

    content.appendChild(pieArea);

    section.appendChild(content);

    /* =====================================================
       INSERT BEFORE DEPARTMENT TABLES
    ===================================================== */

    tablesGrid.parentNode.insertBefore(
        section,
        tablesGrid
    );
}

/* =========================================================
   DEPARTMENT TABLES
========================================================= */

function renderDepartmentTables(
    data,
    totalCapital
) {

    const container =
        $("tablesGrid");

    if (!container) return;

    container.innerHTML = "";

    const departments = [

        {
            key: "trading",
            name: "TRADING",
            className: "trading-box"
        },

        {
            key: "investment",
            name: "INVESTMENT",
            className: "investment-box"
        },

        {
            key: "reserve",
            name: "RESERVE",
            className: "reserve-box"
        },

        {
            key: "rnd",
            name: "RESEARCH & DEVELOPMENT",
            className: "rnd-box"
        }
    ];

    departments.forEach(
        department => {

            const vertical =
                data?.verticals?.[
                    department.key
                ] || {};

            const departmentPercent =
                Number(
                    vertical.percent
                ) || 0;

            const items =
                Array.isArray(
                    vertical.items
                )
                    ? vertical.items
                    : [];

            const section =
                document.createElement("div");

            section.className =
                `department ${department.className}`;

            const heading =
                document.createElement("h2");

            heading.textContent =
                department.name;

            section.appendChild(heading);

            /* =================================================
               ALLOCATION TABLE
            ================================================= */

            const table =
                document.createElement("table");

            table.className =
                "allocation-table";

            table.innerHTML = `

                <thead>

                    <tr>

                        <th>
                            PARTICULAR
                        </th>

                        <th>
                            ALLOCATION %
                        </th>

                        <th>
                            CAPITAL
                        </th>

                    </tr>

                </thead>

                <tbody></tbody>
            `;

            const tbody =
                table.querySelector("tbody");

            let allocationTotal = 0;

            items.forEach(
                item => {

                    const x =
                        normalizeItem(item);

                    const capital =
                        totalCapital *
                        x.percent /
                        100;

                    allocationTotal +=
                        x.percent;

                    const row =
                        document.createElement("tr");

                    row.innerHTML = `

                        <td>
                            ${escapeHTML(x.name)}
                        </td>

                        <td>
                            ${formatNumber(
                                x.percent
                            )}%
                        </td>

                        <td>
                            ${formatINR(capital)}
                        </td>

                    `;

                    tbody.appendChild(row);
                }
            );

            /* =================================================
               TOTAL
            ================================================= */

            const totalRow =
                document.createElement("tr");

            totalRow.className =
                "total-row";

            totalRow.innerHTML = `

                <td>
                    TOTAL
                </td>

                <td>
                    ${formatNumber(
                        allocationTotal
                    )}%
                </td>

                <td>
                    ${formatINR(
                        totalCapital *
                        allocationTotal /
                        100
                    )}
                </td>

            `;

            tbody.appendChild(totalRow);

            /* =================================================
               STATUS
            ================================================= */

            const difference =
                departmentPercent -
                allocationTotal;

            let statusText;
            let statusClass;

            if (
                Math.abs(difference) < 0.01
            ) {

                statusText =
                    "FULLY ALLOCATED";

                statusClass =
                    "status-full";

            } else if (
                difference > 0
            ) {

                statusText =
                    `SURPLUS ${formatNumber(
                        difference
                    )}%`;

                statusClass =
                    "status-surplus";

            } else {

                statusText =
                    `DEFICIT ${formatNumber(
                        Math.abs(difference)
                    )}%`;

                statusClass =
                    "status-deficit";
            }

            const statusRow =
                document.createElement("tr");

            statusRow.className =
                "department-status-row";

            statusRow.innerHTML = `

                <td>
                    <b class="${statusClass}">
                        ${statusText}
                    </b>
                </td>

                <td>
                    ${formatNumber(
                        Math.abs(difference)
                    )}%
                </td>

                <td>
                    ${formatINR(
                        totalCapital *
                        Math.abs(difference) /
                        100
                    )}
                </td>

            `;

            tbody.appendChild(statusRow);

            section.appendChild(table);

            /* =================================================
               ITEM CHART
            ================================================= */

            section.appendChild(
                createItemChart(
                    department,
                    items
                )
            );

            /* =================================================
               ROI TABLE
            ================================================= */

            section.appendChild(
                createROITable(
                    items,
                    totalCapital
                )
            );

            /* =================================================
               PURPOSE
            ================================================= */

            const purpose =
                document.createElement("div");

            purpose.className =
                "purpose";

            purpose.innerHTML = `

                <b>
                    PURPOSE
                </b>

                <div>
                    ${escapeHTML(
                        vertical.purpose || ""
                    )}
                </div>

            `;

            section.appendChild(purpose);

            container.appendChild(section);
        }
    );
}

/* =========================================================
   ITEM ALLOCATION CHART
========================================================= */

function createItemChart(
    department,
    items
) {

    const chart =
        document.createElement("div");

    chart.className =
        "item-chart";

    const title =
        document.createElement("div");

    title.className =
        "item-chart-title";

    title.textContent =
        `${department.name} - ALLOCATION`;

    chart.appendChild(title);

    const bars =
        document.createElement("div");

    bars.className =
        "item-bars";

    const normalized =
        items.map(normalizeItem);

    const highest =
        Math.max(
            ...normalized.map(
                item =>
                    item.percent
            ),
            1
        );

    normalized.forEach(
        item => {

            const group =
                document.createElement("div");

            group.className =
                "item-bar-group";

            const value =
                document.createElement("div");

            value.className =
                "item-bar-value";

            value.textContent =
                `${formatNumber(
                    item.percent
                )}%`;

            const bar =
                document.createElement("div");

            bar.className =
                "item-bar";

            const height =
                item.percent > 0
                    ? Math.max(
                        3,
                        item.percent /
                        highest *
                        100
                    )
                    : 0;

            bar.style.height =
                `${height}%`;

            bar.style.background =
                getDepartmentColor(
                    department.key
                );

            bar.title =
                `${item.name}: ${formatNumber(
                    item.percent
                )}%`;

            const label =
                document.createElement("div");

            label.className =
                "item-bar-label";

            label.textContent =
                item.name;

            group.appendChild(value);

            group.appendChild(bar);

            group.appendChild(label);

            bars.appendChild(group);
        }
    );

    chart.appendChild(bars);

    return chart;
}

/* =========================================================
   DEPARTMENT ROI TABLE
========================================================= */

function createROITable(
    items,
    totalCapital
) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "roi-section";

    const title =
        document.createElement("div");

    title.className =
        "roi-title";

    title.textContent =
        "ROI PERFORMANCE";

    wrapper.appendChild(title);

    const tableWrap =
        document.createElement("div");

    tableWrap.className =
        "roi-table-wrap";

    const table =
        document.createElement("table");

    table.className =
        "roi-table";

    table.innerHTML = `

        <thead>

            <tr>

                <th>
                    PARTICULAR
                </th>

                <th>
                    CAPITAL (₹)
                </th>

                <th>
                    LAST WEEK ROI %
                </th>

                <th>
                    LAST WEEK ROI (₹)
                </th>

                <th>
                    LAST MONTH ROI %
                </th>

                <th>
                    LAST MONTH ROI (₹)
                </th>

            </tr>

        </thead>

        <tbody></tbody>
    `;

    const tbody =
        table.querySelector("tbody");

    let totalCapitalAllocated = 0;

    let totalWeekROI = 0;

    let totalMonthROI = 0;

    items.forEach(
        item => {

            const x =
                normalizeItem(item);

            const capital =
                totalCapital *
                x.percent /
                100;

            const weekROI =
                capital *
                x.weekROI /
                100;

            const monthROI =
                capital *
                x.monthROI /
                100;

            totalCapitalAllocated +=
                capital;

            totalWeekROI +=
                weekROI;

            totalMonthROI +=
                monthROI;

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>
                    ${escapeHTML(x.name)}
                </td>

                <td>
                    ${formatINR(capital)}
                </td>

                <td>
                    ${formatNumber(
                        x.weekROI
                    )}%
                </td>

                <td>
                    ${formatINR(weekROI)}
                </td>

                <td>
                    ${formatNumber(
                        x.monthROI
                    )}%
                </td>

                <td>
                    ${formatINR(monthROI)}
                </td>

            `;

            tbody.appendChild(row);
        }
    );

    const weekPercent =
        totalCapitalAllocated > 0
            ? totalWeekROI /
              totalCapitalAllocated *
              100
            : 0;

    const monthPercent =
        totalCapitalAllocated > 0
            ? totalMonthROI /
              totalCapitalAllocated *
              100
            : 0;

    const totalRow =
        document.createElement("tr");

    totalRow.className =
        "roi-total-row";

    totalRow.innerHTML = `

        <td>
            TOTAL
        </td>

        <td>
            ${formatINR(
                totalCapitalAllocated
            )}
        </td>

        <td>
            ${formatNumber(
                weekPercent
            )}%
        </td>

        <td>
            ${formatINR(totalWeekROI)}
        </td>

        <td>
            ${formatNumber(
                monthPercent
            )}%
        </td>

        <td>
            ${formatINR(totalMonthROI)}
        </td>

    `;

    tbody.appendChild(totalRow);

    tableWrap.appendChild(table);

    wrapper.appendChild(tableWrap);

    return wrapper;
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
