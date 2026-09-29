/* =========================================================
   YOGI GROWING TOGETHER LLP
   CAPITAL MANAGEMENT SYSTEM
   STEP 1
   PERIOD FILTER + HISTORY + CHARTS
========================================================= */

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
let HISTORY = [];
let CURRENT_PERIOD = "Today";
let currentPage = "overview";

const HISTORY_KEY =
    "yogi_capital_history_v1";

/* =========================================================
   FORMATTERS
========================================================= */

const money = n =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(n) || 0);

const number = n =>
    new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2
    }).format(Number(n) || 0);

const pct = n =>
    `${Number(n || 0).toFixed(2)}%`;

const num = n =>
    Number(n) || 0;

function esc(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   DATE FUNCTIONS
========================================================= */

function todayISO() {

    const d = new Date();

    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    ].join("-");
}

function parseDate(value) {

    if (!value) return null;

    const text = String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {

        const d = new Date(text + "T00:00:00");

        return Number.isNaN(d.getTime())
            ? null
            : d;
    }

    const d = new Date(text);

    if (!Number.isNaN(d.getTime())) {
        return d;
    }

    const match = text.match(
        /^(\d{1,2})[-\/]([A-Za-z]+|\d{1,2})[-\/](\d{2,4})$/
    );

    if (!match) return null;

    let month = match[2];

    const months = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11
    };

    if (isNaN(month)) {

        const key =
            month.charAt(0).toUpperCase() +
            month.slice(1, 3).toLowerCase();

        month = months[key];

    } else {

        month = Number(month) - 1;

    }

    let year = Number(match[3]);

    if (year < 100) {
        year += 2000;
    }

    return new Date(
        year,
        month,
        Number(match[1])
    );
}

function dateKey(value) {

    const d = parseDate(value);

    if (!d) return todayISO();

    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    ].join("-");
}

function dateDisplay(value) {

    const d = parseDate(value);

    if (!d) return "—";

    return d.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

/* =========================================================
   CAPITAL CALCULATIONS
========================================================= */

function totalCapital(data = DATA) {

    return num(
        data?.capital?.total
    );
}

function deptPercent(key, data = DATA) {

    return num(
        data?.verticals?.[key]?.percent
    );
}

function deptCapital(
    key,
    data = DATA
) {

    return (
        totalCapital(data) *
        deptPercent(key, data) /
        100
    );
}

function itemRows(
    key,
    data = DATA
) {

    const rows =
        data?.verticals?.[key]?.items;

    return Array.isArray(rows)
        ? rows
        : [];
}

function itemCapital(
    key,
    item,
    data = DATA
) {

    return (
        deptCapital(key, data) *
        num(item?.[1]) /
        100
    );
}

function itemROI(
    key,
    item,
    index,
    data = DATA
) {

    return (
        itemCapital(
            key,
            item,
            data
        ) *
        num(item?.[index]) /
        100
    );
}

function weekPnl(
    key,
    data = DATA
) {

    return itemRows(
        key,
        data
    ).reduce(
        (sum, item) =>
            sum +
            itemROI(
                key,
                item,
                2,
                data
            ),
        0
    );
}

function monthPnl(
    key,
    data = DATA
) {

    return itemRows(
        key,
        data
    ).reduce(
        (sum, item) =>
            sum +
            itemROI(
                key,
                item,
                3,
                data
            ),
        0
    );
}

function allWeekPnl(
    data = DATA
) {

    return DEPTS.reduce(
        (sum, dept) =>
            sum +
            weekPnl(
                dept.key,
                data
            ),
        0
    );
}

function allMonthPnl(
    data = DATA
) {

    return DEPTS.reduce(
        (sum, dept) =>
            sum +
            monthPnl(
                dept.key,
                data
            ),
        0
    );
}

function totalAllocated(
    data = DATA
) {

    return DEPTS.reduce(
        (sum, dept) =>
            sum +
            deptCapital(
                dept.key,
                data
            ),
        0
    );
}

/* =========================================================
   HISTORY STORAGE
========================================================= */

function createSnapshot(data) {

    const snapshot = {
        date: dateKey(
            data?.meta?.date
        ),

        organization:
            data?.meta?.organization || "",

        totalCapital:
            totalCapital(data),

        departments: {},

        totalAllocated:
            totalAllocated(data),

        availableCapital:
            totalCapital(data) -
            totalAllocated(data),

        weekPnl:
            allWeekPnl(data),

        monthPnl:
            allMonthPnl(data),

        monthROI:
            totalCapital(data)
                ? (
                    allMonthPnl(data) /
                    totalCapital(data)
                ) * 100
                : 0,

        weekROI:
            totalCapital(data)
                ? (
                    allWeekPnl(data) /
                    totalCapital(data)
                ) * 100
                : 0
    };

    DEPTS.forEach(
        dept => {

            snapshot.departments[
                dept.key
            ] = {

                percent:
                    deptPercent(
                        dept.key,
                        data
                    ),

                capital:
                    deptCapital(
                        dept.key,
                        data
                    ),

                weekPnl:
                    weekPnl(
                        dept.key,
                        data
                    ),

                monthPnl:
                    monthPnl(
                        dept.key,
                        data
                    ),

                monthROI:
                    deptCapital(
                        dept.key,
                        data
                    )
                        ? (
                            monthPnl(
                                dept.key,
                                data
                            ) /
                            deptCapital(
                                dept.key,
                                data
                            )
                        ) * 100
                        : 0
            };
        }
    );

    return snapshot;
}

function loadHistory() {

    try {

        const raw =
            localStorage.getItem(
                HISTORY_KEY
            );

        if (!raw) {
            HISTORY = [];
            return;
        }

        const parsed =
            JSON.parse(raw);

        HISTORY =
            Array.isArray(parsed)
                ? parsed
                : [];

    } catch (error) {

        console.error(
            "History load error:",
            error
        );

        HISTORY = [];
    }
}

function saveHistory() {

    try {

        localStorage.setItem(
            HISTORY_KEY,
            JSON.stringify(HISTORY)
        );

    } catch (error) {

        console.error(
            "History save error:",
            error
        );
    }
}

function recordSnapshot(data) {

    const snapshot =
        createSnapshot(data);

    const existing =
        HISTORY.findIndex(
            item =>
                item.date ===
                snapshot.date
        );

    if (existing >= 0) {

        HISTORY[existing] =
            snapshot;

    } else {

        HISTORY.push(snapshot);

    }

    HISTORY.sort(
        (a, b) =>
            a.date.localeCompare(
                b.date
            )
    );

    saveHistory();
}

function getPeriodStart(period) {

    const now = new Date();

    if (period === "Today") {

        return new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
    }

    if (period === "MTD") {

        return new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );
    }

    if (period === "QTD") {

        const quarter =
            Math.floor(
                now.getMonth() / 3
            );

        return new Date(
            now.getFullYear(),
            quarter * 3,
            1
        );
    }

    if (period === "YTD") {

        return new Date(
            now.getFullYear(),
            0,
            1
        );
    }

    return new Date(
        now.getFullYear(),
        0,
        1
    );
}

function getFilteredHistory() {

    const start =
        getPeriodStart(
            CURRENT_PERIOD
        );

    return HISTORY.filter(
        snapshot => {

            const d =
                parseDate(
                    snapshot.date
                );

            if (!d) return false;

            return d >= start;
        }
    );
}

function getCurrentSnapshot() {

    return createSnapshot(
        DATA
    );
}

function getDisplayHistory() {

    const rows =
        getFilteredHistory();

    const current =
        getCurrentSnapshot();

    if (!rows.length) {

        return [
            current
        ];
    }

    const last =
        rows[rows.length - 1];

    if (
        last.date !==
        current.date
    ) {

        rows.push(current);

    }

    return rows;
}

/* =========================================================
   HEADER
========================================================= */

function renderShell() {

    const org =
        DATA?.meta?.organization ||
        "YOGI GROWING TOGETHER LLP";

    if ($("#orgName")) {

        $("#orgName")
            .textContent = org;
    }

    const dt =
        dateDisplay(
            DATA?.meta?.date
        );

    if ($("#topDate")) {

        $("#topDate")
            .textContent = dt;
    }

    if ($("#sideDate")) {

        $("#sideDate")
            .textContent = dt;
    }
}

/* =========================================================
   KPI CARD
========================================================= */

function card(
    cls,
    label,
    value,
    delta = ""
) {

    return `
        <div class="card kpi ${cls || ""}">

            <div class="label">
                ${label}
            </div>

            <div class="value">
                ${value}
            </div>

            <div class="delta">
                ${delta}
            </div>

        </div>
    `;
}

/* =========================================================
   DEPARTMENT CARDS
========================================================= */

function deptCards() {

    return `
        <div class="alloc-row">

            ${DEPTS.map(
                dept => {

                    const p =
                        deptPercent(
                            dept.key
                        );

                    const capital =
                        deptCapital(
                            dept.key
                        );

                    return `
                        <div
                            class="alloc-card ${dept.key}"
                        >

                            <div class="alloc-title">
                                ${dept.name.toUpperCase()}
                            </div>

                            <div class="alloc-pct">
                                ${pct(p)}
                            </div>

                            <div class="alloc-money">
                                ${money(capital)}
                            </div>

                            <div
                                class="progress ${dept.className}"
                                style="margin-top:10px"
                            >
                                <i
                                    style="width:${Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            p
                                        )
                                    )}%"
                                ></i>
                            </div>

                        </div>
                    `;
                }
            ).join("")}

        </div>
    `;
}

/* =========================================================
   PIE CHART
========================================================= */

function allocationPie(
    snapshot = null
) {

    const values =
        DEPTS.map(
            dept =>
                snapshot
                    ? num(
                        snapshot.departments?.[
                            dept.key
                        ]?.percent
                    )
                    : deptPercent(
                        dept.key
                    )
        );

    const total =
        values.reduce(
            (a, b) =>
                a + b,
            0
        ) || 1;

    let start = 0;

    const segments = [];

    DEPTS.forEach(
        (dept, index) => {

            const end =
                start +
                (
                    values[index] /
                    total
                ) *
                360;

            segments.push(
                `${dept.color} ${start}deg ${end}deg`
            );

            start = end;
        }
    );

    return `
        <div class="donut-area">

            <div
                class="donut"
                style="
                    background:
                    conic-gradient(
                        ${segments.join(",")}
                    );
                "
            >

                <div class="donut-center">

                    <div>

                        <b>
                            ${pct(total)}
                        </b>

                        <small>
                            allocated
                        </small>

                    </div>

                </div>

            </div>

            <div class="legend">

                ${DEPTS.map(
                    (dept, index) => `
                        <div class="legend-row">

                            <i
                                class="dot"
                                style="
                                    background:
                                    ${dept.color}
                                "
                            ></i>

                            <span>
                                ${dept.name}
                            </span>

                            <b>
                                ${pct(
                                    values[index]
                                )}
                            </b>

                        </div>
                    `
                ).join("")}

            </div>

        </div>
    `;
}

/* =========================================================
   GROWTH LINE CHART
========================================================= */

function growthChart(
    rows,
    metric = "totalCapital",
    title = "Capital Growth"
) {

    if (!rows.length) {

        return `
            <div class="empty-state">
                No historical data available.
            </div>
        `;
    }

    const values =
        rows.map(
            row =>
                num(
                    row[metric]
                )
        );

    const width = 900;
    const height = 300;
    const padding = 45;

    const max =
        Math.max(
            1,
            ...values
        );

    const min =
        Math.min(
            0,
            ...values
        );

    const range =
        max - min || 1;

    const xStep =
        rows.length > 1
            ? (
                width -
                padding * 2
            ) /
            (rows.length - 1)
            : 0;

    const points =
        values.map(
            (value, index) => {

                const x =
                    padding +
                    index *
                    xStep;

                const y =
                    height -
                    padding -
                    (
                        (
                            value -
                            min
                        ) /
                        range
                    ) *
                    (
                        height -
                        padding * 2
                    );

                return {
                    x,
                    y,
                    value
                };
            }
        );

    const polyline =
        points
            .map(
                p =>
                    `${p.x},${p.y}`
            )
            .join(" ");

    return `
        <div class="growth-chart">

            <div class="chart-title">
                ${title}
            </div>

            <svg
                viewBox="
                    0 0
                    ${width}
                    ${height}
                "
                preserveAspectRatio="none"
                class="growth-svg"
            >

                <line
                    x1="${padding}"
                    y1="${padding}"
                    x2="${padding}"
                    y2="${height - padding}"
                    stroke="#dfe5e8"
                />

                <line
                    x1="${padding}"
                    y1="${height - padding}"
                    x2="${width - padding}"
                    y2="${height - padding}"
                    stroke="#dfe5e8"
                />

                <polyline
                    points="${polyline}"
                    fill="none"
                    stroke="#087443"
                    stroke-width="4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />

                ${points.map(
                    (point, index) => {

                        return `
                            <circle
                                cx="${point.x}"
                                cy="${point.y}"
                                r="5"
                                fill="#ffffff"
                                stroke="#087443"
                                stroke-width="3"
                            />

                            <text
                                x="${point.x}"
                                y="${height - 12}"
                                text-anchor="middle"
                                font-size="11"
                                fill="#71808c"
                            >
                                ${dateDisplay(
                                    rows[index].date
                                )}
                            </text>
                        `;
                    }
                ).join("")}

            </svg>

            <div class="chart-current">

                <span>
                    Latest
                </span>

                <b>
                    ${money(
                        values[
                            values.length - 1
                        ]
                    )}
                </b>

            </div>

        </div>
    `;
}

/* =========================================================
   ROI GROWTH CHART
========================================================= */

function roiGrowthChart(
    rows
) {

    return growthChart(
        rows,
        "monthROI",
        "ROI Growth"
    );
}

/* =========================================================
   HISTORICAL TABLE
========================================================= */

function historyTable(
    rows
) {

    return `
        <div class="table-wrap">

            <table class="table">

                <thead>

                    <tr>

                        <th>
                            DATE
                        </th>

                        <th class="num">
                            TOTAL CAPITAL
                        </th>

                        <th class="num">
                            TRADING
                        </th>

                        <th class="num">
                            INVESTMENT
                        </th>

                        <th class="num">
                            RESERVE
                        </th>

                        <th class="num">
                            R&D
                        </th>

                        <th class="num">
                            ROI %
                        </th>

                        <th class="num">
                            ROI ₹
                        </th>

                    </tr>

                </thead>

                <tbody>

                    ${rows.map(
                        row => {

                            const total =
                                num(
                                    row.totalCapital
                                );

                            const roi =
                                num(
                                    row.monthROI
                                );

                            const roiAmount =
                                num(
                                    row.monthPnl
                                );

                            return `
                                <tr>

                                    <td>
                                        <b>
                                            ${dateDisplay(
                                                row.date
                                            )}
                                        </b>
                                    </td>

                                    <td class="num">
                                        ${money(
                                            total
                                        )}
                                    </td>

                                    <td class="num">
                                        ${money(
                                            row.departments?.trading?.capital || 0
                                        )}
                                    </td>

                                    <td class="num">
                                        ${money(
                                            row.departments?.investment?.capital || 0
                                        )}
                                    </td>

                                    <td class="num">
                                        ${money(
                                            row.departments?.reserve?.capital || 0
                                        )}
                                    </td>

                                    <td class="num">
                                        ${money(
                                            row.departments?.rnd?.capital || 0
                                        )}
                                    </td>

                                    <td class="num">
                                        ${pct(
                                            roi
                                        )}
                                    </td>

                                    <td class="num">
                                        ${money(
                                            roiAmount
                                        )}
                                    </td>

                                </tr>
                            `;
                        }
                    ).join("")}

                </tbody>

            </table>

        </div>
    `;
}

/* =========================================================
   DEPARTMENT HISTORY TABLE
========================================================= */

function departmentHistoryTable(
    key,
    rows
) {

    const dept =
        DEPTS.find(
            d => d.key === key
        );

    if (!dept) return "";

    return `
        <div class="table-wrap">

            <table class="table">

                <thead>

                    <tr>

                        <th>
                            DATE
                        </th>

                        <th class="num">
                            ALLOCATION %
                        </th>

                        <th class="num">
                            CAPITAL
                        </th>

                        <th class="num">
                            WEEK P&L
                        </th>

                        <th class="num">
                            MONTH P&L
                        </th>

                        <th class="num">
                            MONTH ROI
                        </th>

                    </tr>

                </thead>

                <tbody>

                    ${rows.map(
                        row => {

                            const d =
                                row.departments?.[
                                    key
                                ] || {};

                            return `
                                <tr>

                                    <td>
                                        <b>
                                            ${dateDisplay(
                                                row.date
                                            )}
                                        </b>
                                    </td>

                                    <td class="num">
                                        ${pct(
                                            d.percent
                                        )}
                                    </td>

                                    <td class="num">
                                        ${money(
                                            d.capital
                                        )}
                                    </td>

                                    <td class="num">
                                        ${money(
                                            d.weekPnl
                                        )}
                                    </td>

                                    <td class="num">
                                        ${money(
                                            d.monthPnl
                                        )}
                                    </td>

                                    <td class="num">
                                        ${pct(
                                            d.monthROI
                                        )}
                                    </td>

                                </tr>
                            `;
                        }
                    ).join("")}

                </tbody>

            </table>

        </div>
    `;
}

/* =========================================================
   OVERVIEW
========================================================= */

function renderOverview() {

    const total =
        totalCapital();

    const allocated =
        totalAllocated();

    const available =
        total - allocated;

    const rows =
        getDisplayHistory();

    const latest =
        rows[
            rows.length - 1
        ];

    const roi =
        latest?.monthROI || 0;

    $("#page-overview").innerHTML = `

        <div class="grid kpis">

            ${card(
                "green-top",
                "TOTAL FUND CAPITAL",
                money(total),
                "Current fund capital"
            )}

            ${card(
                "blue-top",
                "CAPITAL DEPLOYED",
                money(allocated),
                "Current allocation"
            )}

            ${card(
                "yellow-top",
                "AVAILABLE CAPITAL",
                money(available),
                available >= 0
                    ? "Unallocated balance"
                    : "Over allocation"
            )}

            ${card(
                "green-top",
                CURRENT_PERIOD === "Today"
                    ? "TODAY P&L"
                    : `${CURRENT_PERIOD} P&L`,
                money(
                    latest?.monthPnl || 0
                ),
                "Calculated from ROI"
            )}

            ${card(
                "blue-top",
                CURRENT_PERIOD === "Today"
                    ? "TODAY ROI"
                    : `${CURRENT_PERIOD} ROI`,
                pct(roi),
                "Historical performance"
            )}

            ${card(
                "red-top",
                "MAX DRAWDOWN",
                "—",
                "Not stored"
            )}

        </div>

        ${deptCards()}

        <div class="grid two mt">

            <div class="card">

                <div class="card-head">

                    <h3>
                        Capital Growth
                    </h3>

                    <span>
                        ${CURRENT_PERIOD}
                    </span>

                </div>

                ${growthChart(
                    rows,
                    "totalCapital",
                    "Total Capital Growth"
                )}

            </div>

            <div class="card">

                <div class="card-head">

                    <h3>
                        ROI Growth
                    </h3>

                    <span>
                        ${CURRENT_PERIOD}
                    </span>

                </div>

                ${roiGrowthChart(
                    rows
                )}

            </div>

        </div>

        <div class="grid two mt">

            <div class="card">

                <div class="card-head">

                    <h3>
                        Capital Allocation
                    </h3>

                    <span>
                        ${CURRENT_PERIOD}
                    </span>

                </div>

                ${allocationPie(
                    latest
                )}

            </div>

            <div class="card">

                <div class="card-head">

                    <h3>
                        Historical Capital
                    </h3>

                    <span>
                        ${rows.length} record(s)
                    </span>

                </div>

                ${historyTable(
                    rows
                )}

            </div>

        </div>

        <div class="card mt">

            <div class="card-head">

                <h3>
                    ${CURRENT_PERIOD}
                    Department Performance
                </h3>

                <span>
                    Trading • Investment • Reserve • R&D
                </span>

            </div>

            <div class="card-body">

                ${DEPTS.map(
                    dept => `

                        <div
                            style="
                                margin-bottom:30px;
                            "
                        >

                            <h3
                                style="
                                    margin-bottom:12px;
                                    color:${dept.color};
                                "
                            >
                                ${dept.name}
                            </h3>

                            ${departmentHistoryTable(
                                dept.key,
                                rows
                            )}

                        </div>

                    `
                ).join("")}

            </div>

        </div>

    `;
}

/* =========================================================
   ALLOCATION
========================================================= */

function renderAllocation() {

    const rows =
        getDisplayHistory();

    const latest =
        rows[
            rows.length - 1
        ];

    $("#page-allocation").innerHTML = `

        <div class="grid kpis">

            ${card(
                "green-top",
                "TOTAL CAPITAL",
                money(
                    latest?.totalCapital ||
                    totalCapital()
                ),
                CURRENT_PERIOD
            )}

            ${card(
                "blue-top",
                "ALLOCATED",
                money(
                    latest?.totalAllocated ||
                    totalAllocated()
                ),
                "Capital allocated"
            )}

            ${card(
                "yellow-top",
                "AVAILABLE",
                money(
                    latest?.availableCapital ||
                    0
                ),
                "Remaining"
            )}

            ${card(
                "purple-top",
                "VERTICALS",
                DEPTS.length,
                "Controlled buckets"
            )}

        </div>

        <div class="grid two mt">

            <div class="card">

                <div class="card-head">

                    <h3>
                        Allocation Growth
                    </h3>

                    <span>
                        ${CURRENT_PERIOD}
                    </span>

                </div>

                ${growthChart(
                    rows,
                    "totalAllocated",
                    "Allocated Capital"
                )}

            </div>

            <div class="card">

                <div class="card-head">

                    <h3>
                        Allocation Distribution
                    </h3>

                </div>

                ${allocationPie(
                    latest
                )}

            </div>

        </div>

        <div class="card mt">

            <div class="card-head">

                <h3>
                    Historical Allocation
                </h3>

            </div>

            ${historyTable(
                rows
            )}

        </div>

    `;
}

/* =========================================================
   DEPARTMENT PAGE
========================================================= */

function renderDepartment(
    key
) {

    const dept =
        DEPTS.find(
            d => d.key === key
        );

    if (!dept) return;

    const rows =
        getDisplayHistory();

    const latest =
        rows[
            rows.length - 1
        ];

    const d =
        latest?.departments?.[
            key
        ] || {};

    const capital =
        num(d.capital);

    const week =
        num(d.weekPnl);

    const month =
        num(d.monthPnl);

    const roi =
        num(d.monthROI);

    $("#page-" + key).innerHTML = `

        <div class="grid kpis">

            ${card(
                dept.key === "trading"
                    ? "blue-top"
                    : dept.key === "investment"
                    ? "green-top"
                    : dept.key === "reserve"
                    ? "yellow-top"
                    : "purple-top",

                "ALLOCATED CAPITAL",

                money(capital),

                pct(
                    d.percent
                ) +
                " target"
            )}

            ${card(
                "green-top",
                "WEEK P&L",
                money(week),
                CURRENT_PERIOD
            )}

            ${card(
                "green-top",
                "MONTH P&L",
                money(month),
                CURRENT_PERIOD
            )}

            ${card(
                "blue-top",
                "MONTH ROI",
                pct(roi),
                CURRENT_PERIOD
            )}

        </div>

        <div class="grid two mt">

            <div class="card">

                <div class="card-head">

                    <h3>
                        ${dept.name}
                        Capital Growth
                    </h3>

                    <span>
                        ${CURRENT_PERIOD}
                    </span>

                </div>

                ${growthChart(
                    rows,
                    "totalCapital",
                    `${dept.name} — Fund Capital Trend`
                )}

            </div>

            <div class="card">

                <div class="card-head">

                    <h3>
                        ${dept.name}
                        Allocation
                    </h3>

                </div>

                ${allocationPie(
                    latest
                )}

            </div>

        </div>

        <div class="card mt">

            <div class="card-head">

                <h3>
                    ${dept.name}
                    Historical Performance
                </h3>

                <span>
                    ${CURRENT_PERIOD}
                </span>

            </div>

            ${departmentHistoryTable(
                key,
                rows
            )}

        </div>

        <div class="card mt">

            <div class="card-head">

                <h3>
                    Current Allocation Items
                </h3>

            </div>

            <div class="table-wrap">

                <table class="table">

                    <thead>

                        <tr>

                            <th>
                                PARTICULAR
                            </th>

                            <th class="num">
                                ALLOCATION
                            </th>

                            <th class="num">
                                CAPITAL
                            </th>

                            <th class="num">
                                WEEK ROI
                            </th>

                            <th class="num">
                                MONTH ROI
                            </th>

                            <th class="num">
                                MONTH P&L
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${itemRows(
                            key
                        ).map(
                            item => `

                                <tr>

                                    <td>
                                        <b>
                                            ${esc(
                                                item?.[0]
                                            )}
                                        </b>
                                    </td>

                                    <td class="num">
                                        ${pct(
                                            item?.[1]
                                        )}
                                    </td>

                                    <td class="num">
                                        ${money(
                                            itemCapital(
                                                key,
                                                item
                                            )
                                        )}
                                    </td>

                                    <td class="num">
                                        ${pct(
                                            item?.[2]
                                        )}
                                    </td>

                                    <td class="num">
                                        ${pct(
                                            item?.[3]
                                        )}
                                    </td>

                                    <td class="num">
                                        ${money(
                                            itemROI(
                                                key,
                                                item,
                                                3
                                            )
                                        )}
                                    </td>

                                </tr>

                            `
                        ).join("")}

                    </tbody>

                </table>

            </div>

        </div>

        <div class="card mt">

            <div class="card-head">

                <h3>
                    Purpose / Mandate
                </h3>

            </div>

            <div class="card-body">

                <div class="callout">

                    ${esc(
                        DATA?.verticals?.[
                            key
                        ]?.purpose ||
                        "No purpose configured."
                    )}

                </div>

            </div>

        </div>

    `;
}

/* =========================================================
   PERFORMANCE
========================================================= */

function renderPerformance() {

    const rows =
        getDisplayHistory();

    const latest =
        rows[
            rows.length - 1
        ];

    $("#page-performance").innerHTML = `

        <div class="grid kpis">

            ${card(
                "green-top",
                "PERIOD P&L",
                money(
                    latest?.monthPnl ||
                    0
                ),
                CURRENT_PERIOD
            )}

            ${card(
                "blue-top",
                "PERIOD ROI",
                pct(
                    latest?.monthROI ||
                    0
                ),
                CURRENT_PERIOD
            )}

            ${card(
                "green-top",
                "WEEK P&L",
                money(
                    latest?.weekPnl ||
                    0
                ),
                "Current snapshot"
            )}

            ${card(
                "yellow-top",
                "WEEK ROI",
                pct(
                    latest?.weekROI ||
                    0
                ),
                "Current snapshot"
            )}

        </div>

        <div class="grid two mt">

            <div class="card">

                <div class="card-head">

                    <h3>
                        Capital Growth
                    </h3>

                </div>

                ${growthChart(
                    rows,
                    "totalCapital",
                    "Capital Growth"
                )}

            </div>

            <div class="card">

                <div class="card-head">

                    <h3>
                        ROI Growth
                    </h3>

                </div>

                ${roiGrowthChart(
                    rows
                )}

            </div>

        </div>

        <div class="card mt">

            <div class="card-head">

                <h3>
                    Historical Performance
                </h3>

                <span>
                    ${CURRENT_PERIOD}
                </span>

            </div>

            ${historyTable(
                rows
            )}

        </div>

    `;
}

/* =========================================================
   RISK
========================================================= */

function renderRisk() {

    $("#page-risk").innerHTML = `

        <div class="grid kpis">

            ${card(
                "red-top",
                "MAX DRAWDOWN",
                "—",
                "Not stored"
            )}

            ${card(
                "yellow-top",
                "RISK LIMIT",
                "—",
                "Not stored"
            )}

            ${card(
                "blue-top",
                "CONCENTRATION",
                "—",
                "Not stored"
            )}

            ${card(
                "green-top",
                "LIQUIDITY",
                "—",
                "Not stored"
            )}

        </div>

        <div class="card mt">

            <div class="card-head">

                <h3>
                    Risk Register
                </h3>

            </div>

            <div class="card-body">

                <div class="empty-state">

                    <div>

                        <strong>
                            Risk history is not
                            stored yet.
                        </strong>

                        <span>
                            This will be added in
                            a later step.
                        </span>

                    </div>

                </div>

            </div>

        </div>

    `;
}

/* =========================================================
   CAPITAL MOVEMENTS
========================================================= */

function renderMovements() {

    const rows =
        getDisplayHistory();

    $("#page-movements").innerHTML = `

        <div class="grid kpis">

            ${card(
                "green-top",
                "TOTAL CAPITAL",
                money(
                    totalCapital()
                ),
                CURRENT_PERIOD
            )}

            ${card(
                "blue-top",
                "ALLOCATED",
                money(
                    totalAllocated()
                ),
                CURRENT_PERIOD
            )}

            ${card(
                "yellow-top",
                "AVAILABLE",
                money(
                    totalCapital() -
                    totalAllocated()
                ),
                "Current"
            )}

        </div>

        <div class="card mt">

            <div class="card-head">

                <h3>
                    Capital History
                </h3>

                <span>
                    ${CURRENT_PERIOD}
                </span>

            </div>

            ${historyTable(
                rows
            )}

        </div>

    `;
}

/* =========================================================
   REPORTS
========================================================= */

function renderReports() {

    const rows =
        getDisplayHistory();

    $("#page-reports").innerHTML = `

        <div class="grid three">

            <div class="card report-card">

                <h3>
                    Capital Report
                </h3>

                <p>
                    Historical capital and
                    allocation data.
                </p>

                <button
                    onclick="window.print()"
                >
                    Print / Save PDF
                </button>

            </div>

            <div class="card report-card">

                <h3>
                    Performance Report
                </h3>

                <p>
                    Historical ROI and P&L
                    data.
                </p>

                <button
                    onclick="window.print()"
                >
                    Print / Save PDF
                </button>

            </div>

            <div class="card report-card">

                <h3>
                    Management Snapshot
                </h3>

                <p>
                    ${CURRENT_PERIOD}
                    management view.
                </p>

                <button
                    onclick="window.print()"
                >
                    Print / Save PDF
                </button>

            </div>

        </div>

        <div class="card mt">

            <div class="card-head">

                <h3>
                    Historical Report
                </h3>

            </div>

            ${historyTable(
                rows
            )}

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
                                DATA?.meta?.organization
                            )}
                        </b>

                    </div>

                    <div class="metric-line">

                        <span>
                            Prepared By
                        </span>

                        <b>
                            ${esc(
                                DATA?.meta?.preparedBy
                            )}
                        </b>

                    </div>

                    <div class="metric-line">

                        <span>
                            Dashboard Date
                        </span>

                        <b>
                            ${dateDisplay(
                                DATA?.meta?.date
                            )}
                        </b>

                    </div>

                    <div class="metric-line">

                        <span>
                            Selected Period
                        </span>

                        <b>
                            ${CURRENT_PERIOD}
                        </b>

                    </div>

                    <div class="metric-line">

                        <span>
                            Stored History Records
                        </span>

                        <b>
                            ${HISTORY.length}
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
                            line-height:1.6;
                        "
                    >
                        Public dashboard is
                        view-only.
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
                    Historical Data
                </h3>

            </div>

            <div class="card-body">

                <div class="callout">

                    History is currently stored
                    locally in this browser.
                    Persistent server history
                    will be added in the next
                    step.

                </div>

            </div>

        </div>

    `;
}

/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

    renderShell();

    renderOverview();

    renderAllocation();

    DEPTS.forEach(
        dept =>
            renderDepartment(
                dept.key
            )
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

function showPage(
    page
) {

    currentPage =
        page;

    $$(".page").forEach(
        element =>
            element.classList.remove(
                "active"
            )
    );

    $("#page-" + page)
        ?.classList.add(
            "active"
        );

    $$(".nav-item").forEach(
        element =>
            element.classList.toggle(
                "active",
                element.dataset.page ===
                page
            )
    );

    const titles = {

        overview: [
            "Overview",
            "Executive view of fund capital, allocation and performance."
        ],

        allocation: [
            "Allocation",
            "Vertical and historical allocation control."
        ],

        trading: [
            "Trading",
            "Trading capital, allocation and historical performance."
        ],

        investment: [
            "Investment",
            "Investment allocation and historical performance."
        ],

        reserve: [
            "Reserve",
            "Reserve allocation and historical performance."
        ],

        rnd: [
            "R&D",
            "Research and development allocation and historical performance."
        ],

        performance: [
            "Performance",
            "Historical fund performance and ROI."
        ],

        risk: [
            "Risk",
            "Risk and control framework."
        ],

        movements: [
            "Capital Movements",
            "Historical capital movement view."
        ],

        reports: [
            "Reports",
            "Historical management reports."
        ],

        settings: [
            "Settings",
            "System information and administration."
        ]

    };

    if (
        $("#pageTitle") &&
        titles[page]
    ) {

        $("#pageTitle")
            .textContent =
            titles[page][0];

        $("#pageSub")
            .textContent =
            titles[page][1];
    }
}

/* =========================================================
   PERIOD SELECTOR
========================================================= */

function setupPeriods() {

    $$(".period").forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    CURRENT_PERIOD =
                        button.textContent
                            .trim();

                    $$(".period")
                        .forEach(
                            x =>
                                x.classList.remove(
                                    "active"
                                )
                        );

                    button.classList.add(
                        "active"
                    );

                    renderAll();

                    showPage(
                        currentPage
                    );

                }
            );

        }
    );
}

/* =========================================================
   LOAD DATA
========================================================= */

async function load() {

    try {

        const response =
            await fetch(
                "/api/data",
                {
                    cache:
                        "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                "Unable to load dashboard data."
            );
        }

        DATA =
            await response.json();

        loadHistory();

        /*
         * Record today's/current dashboard
         * state.
         */
        recordSnapshot(
            DATA
        );

        renderAll();

        showPage(
            "overview"
        );

        if ($("#loading")) {

            $("#loading")
                .classList
                .add("hidden");
        }

        if ($("#app")) {

            $("#app")
                .classList
                .remove("hidden");
        }

    } catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

        if ($("#loading")) {

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
}

/* =========================================================
   NAVIGATION EVENTS
========================================================= */

function setupNavigation() {

    $$(".nav-item")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        showPage(
                            button.dataset.page
                        );

                        $("#sidebar")
                            ?.classList
                            .remove(
                                "open"
                            );
                    }
                );

            }
        );

    $("#menuBtn")
        ?.addEventListener(
            "click",
            () => {

                $("#sidebar")
                    ?.classList
                    .toggle(
                        "open"
                    );

            }
        );
}

/* =========================================================
   START
========================================================= */

setupNavigation();

setupPeriods();

load();
