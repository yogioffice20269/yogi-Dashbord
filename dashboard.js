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

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   DATE FORMAT
   Admin stores date as YYYY-MM-DD.
   Dashboard displays DD-MM-YYYY.
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
   ITEM NORMALIZATION
========================================================= */

function normalizeItem(item) {

    if (Array.isArray(item)) {

        return {
            name: String(item[0] ?? "Item"),
            percent: Number(item[1]) || 0,
            weekROI: Number(item[2]) || 0,
            monthROI: Number(item[3]) || 0
        };
    }

    if (
        item &&
        typeof item === "object"
    ) {

        return {
            name:
                String(
                    item.name ??
                    "Item"
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

        $("loading").classList.add(
            "hidden"
        );

        $("dashboard").classList.remove(
            "hidden"
        );

    } catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

        $("loading").textContent =
            "Unable to load dashboard. Please refresh the page.";
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

    const keys = [
        "trading",
        "investment",
        "reserve",
        "rnd"
    ];

    /* =====================================================
       HEADER

       IMPORTANT:
       There is NO metaVersion here.
       Version was removed from the dashboard.
    ===================================================== */

    $("orgName").textContent =
        data?.meta?.organization || "";

    $("metaDate").textContent =
        formatDisplayDate(
            data?.meta?.date
        );

    $("metaPrepared").textContent =
        data?.meta?.preparedBy || "";

    /* =====================================================
       TOTAL ALLOCATION
    ===================================================== */

    let allocatedCapital = 0;

    keys.forEach(key => {

        const percent =
            Number(
                verticals?.[key]?.percent
            ) || 0;

        allocatedCapital +=
            totalCapital *
            percent /
            100;
    });

    const difference =
        totalCapital -
        allocatedCapital;

    $("totalCapital").textContent =
        formatINR(
            totalCapital
        );

    $("allocatedCapital").textContent =
        formatINR(
            allocatedCapital
        );

    $("unallocatedCapital").textContent =
        formatINR(
            Math.abs(difference)
        );

    renderOverallStatus(
        totalCapital,
        allocatedCapital
    );

    renderAllocationCards(
        data,
        totalCapital
    );

    renderDonut(
        data,
        totalCapital
    );

    renderCapitalBars(
        data,
        totalCapital
    );

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

    const element =
        $("status");

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

    const departments = [
        {
            key: "trading",
            name: "TRADING",
            className: "trading"
        },
        {
            key: "investment",
            name: "INVESTMENT",
            className: "investment"
        },
        {
            key: "reserve",
            name: "RESERVE",
            className: "reserve"
        },
        {
            key: "rnd",
            name: "R&D",
            className: "rnd"
        }
    ];

    departments.forEach(
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
                `allocation-card ${department.className}`;

            card.innerHTML = `
                <div class="allocation-card-title">
                    ${department.name}
                </div>

                <div class="allocation-card-percent">
                    ${formatNumber(percent)}%
                </div>

                <div class="allocation-card-capital">
                    ${formatINR(capital)}
                </div>
            `;

            container.appendChild(card);
        }
    );
}

/* =========================================================
   DONUT CHART
========================================================= */

function renderDonut(
    data,
    totalCapital
) {

    const donut =
        $("donut");

    const legend =
        $("legend");

    if (!donut || !legend) return;

    const departments = [
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

    const values =
        departments.map(
            department =>
                Number(
                    data?.verticals?.[
                        department.key
                    ]?.percent
                ) || 0
        );

    const total =
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        );

    let current = 0;

    const segments =
        values.map(
            value => {

                const start =
                    total > 0
                        ? current / total * 360
                        : 0;

                current += value;

                const end =
                    total > 0
                        ? current / total * 360
                        : 0;

                return `${getDepartmentColor(
                    departments[
                        values.indexOf(value)
                    ].key
                )} ${start}deg ${end}deg`;
            }
        );

    if (total > 0) {

        donut.style.background =
            `conic-gradient(${segments.join(",")})`;

    } else {

        donut.style.background =
            "conic-gradient(#ddd 0deg 360deg)";
    }

    legend.innerHTML = "";

    departments.forEach(
        (department, index) => {

            const percent =
                values[index];

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "legend-row";

            row.innerHTML = `
                <span
                    class="legend-dot"
                    style="
                        background:${getDepartmentColor(
                            department.key
                        )}
                    "
                ></span>

                <span>
                    ${department.name}
                </span>

                <b>
                    ${formatNumber(percent)}%
                </b>
            `;

            legend.appendChild(row);
        }
    );
}

/* =========================================================
   DEPARTMENT COLORS
========================================================= */

function getDepartmentColor(
    key
) {

    const colors = {
        trading: "#2477b8",
        investment: "#4d9655",
        reserve: "#d6a900",
        rnd: "#7651a8"
    };

    return (
        colors[key] ||
        "#777"
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

    const departments = [
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

    const capitals =
        departments.map(
            department => {

                const percent =
                    Number(
                        data?.verticals?.[
                            department.key
                        ]?.percent
                    ) || 0;

                return (
                    totalCapital *
                    percent /
                    100
                );
            }
        );

    const maxCapital =
        Math.max(
            ...capitals,
            1
        );

    departments.forEach(
        (department, index) => {

            const capital =
                capitals[index];

            const height =
                Math.max(
                    5,
                    capital /
                    maxCapital *
                    100
                );

            const group =
                document.createElement(
                    "div"
                );

            group.className =
                "bar-group";

            group.innerHTML = `
                <div class="bar-value">
                    ${formatINR(capital)}
                </div>

                <div
                    class="bar"
                    style="
                        height:${height}%;
                        background:${getDepartmentColor(
                            department.key
                        )};
                    "
                ></div>

                <div class="bar-label">
                    ${department.name}
                </div>
            `;

            container.appendChild(group);
        }
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

            const departmentElement =
                document.createElement(
                    "div"
                );

            departmentElement.className =
                `department ${department.className}`;

            /* =============================================
               DEPARTMENT TITLE
            ============================================= */

            const heading =
                document.createElement(
                    "h2"
                );

            heading.textContent =
                department.name;

            departmentElement.appendChild(
                heading
            );

            /* =============================================
               ALLOCATION TABLE
            ============================================= */

            const table =
                document.createElement(
                    "table"
                );

            table.className =
                "allocation-table";

            table.innerHTML = `
                <thead>
                    <tr>
                        <th>PARTICULAR</th>
                        <th>ALLOCATION %</th>
                        <th>CAPITAL</th>
                    </tr>
                </thead>

                <tbody></tbody>
            `;

            const tbody =
                table.querySelector(
                    "tbody"
                );

            let allocationTotal = 0;

            items.forEach(
                item => {

                    const normalized =
                        normalizeItem(
                            item
                        );

                    const capital =
                        totalCapital *
                        normalized.percent /
                        100;

                    allocationTotal +=
                        normalized.percent;

                    const row =
                        document.createElement(
                            "tr"
                        );

                    row.innerHTML = `
                        <td>
                            ${escapeHTML(
                                normalized.name
                            )}
                        </td>

                        <td>
                            ${formatNumber(
                                normalized.percent
                            )}%
                        </td>

                        <td>
                            ${formatINR(
                                capital
                            )}
                        </td>
                    `;

                    tbody.appendChild(
                        row
                    );
                }
            );

            /* =============================================
               TOTAL
            ============================================= */

            const totalRow =
                document.createElement(
                    "tr"
                );

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

            tbody.appendChild(
                totalRow
            );

            /* =============================================
               STATUS
            ============================================= */

            const difference =
                departmentPercent -
                allocationTotal;

            let statusText;
            let statusClass;

            if (
                Math.abs(
                    difference
                ) < 0.01
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
                        Math.abs(
                            difference
                        )
                    )}%`;

                statusClass =
                    "status-deficit";
            }

            const statusCapital =
                totalCapital *
                Math.abs(
                    difference
                ) /
                100;

            const statusRow =
                document.createElement(
                    "tr"
                );

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
                        Math.abs(
                            difference
                        )
                    )}%
                </td>

                <td>
                    ${formatINR(
                        statusCapital
                    )}
                </td>
            `;

            tbody.appendChild(
                statusRow
            );

            departmentElement.appendChild(
                table
            );

            /* =============================================
               ITEM ALLOCATION BAR CHART
            ============================================= */

            departmentElement.appendChild(
                createItemChart(
                    department,
                    items
                )
            );

            /* =============================================
               ROI TABLE
            ============================================= */

            departmentElement.appendChild(
                createROITable(
                    items,
                    totalCapital
                )
            );

            /* =============================================
               PURPOSE
            ============================================= */

            const purpose =
                document.createElement(
                    "div"
                );

            purpose.className =
                "purpose";

            purpose.innerHTML = `
                <b>PURPOSE</b>

                <div>
                    ${escapeHTML(
                        vertical.purpose || ""
                    )}
                </div>
            `;

            departmentElement.appendChild(
                purpose
            );

            container.appendChild(
                departmentElement
            );
        }
    );
}

/* =========================================================
   ITEM BAR CHART
========================================================= */

function createItemChart(
    department,
    items
) {

    const chart =
        document.createElement(
            "div"
        );

    chart.className =
        "item-chart";

    const title =
        document.createElement(
            "div"
        );

    title.className =
        "item-chart-title";

    title.textContent =
        `${department.name} - ALLOCATION`;

    chart.appendChild(
        title
    );

    const bars =
        document.createElement(
            "div"
        );

    bars.className =
        "item-bars";

    const normalizedItems =
        items.map(
            normalizeItem
        );

    const maxPercent =
        Math.max(
            ...normalizedItems.map(
                item =>
                    item.percent
            ),
            1
        );

    normalizedItems.forEach(
        item => {

            const group =
                document.createElement(
                    "div"
                );

            group.className =
                "item-bar-group";

            const value =
                document.createElement(
                    "div"
                );

            value.className =
                "item-bar-value";

            value.textContent =
                `${formatNumber(
                    item.percent
                )}%`;

            const bar =
                document.createElement(
                    "div"
                );

            bar.className =
                "item-bar";

            const height =
                Math.max(
                    8,
                    item.percent /
                    maxPercent *
                    100
                );

            bar.style.height =
                `${height}%`;

            const label =
                document.createElement(
                    "div"
                );

            label.className =
                "item-bar-label";

            label.textContent =
                item.name;

            group.appendChild(
                value
            );

            group.appendChild(
                bar
            );

            group.appendChild(
                label
            );

            bars.appendChild(
                group
            );
        }
    );

    chart.appendChild(
        bars
    );

    return chart;
}

/* =========================================================
   ROI TABLE
========================================================= */

function createROITable(
    items,
    totalCapital
) {

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "roi-section";

    const title =
        document.createElement(
            "div"
        );

    title.className =
        "roi-title";

    title.textContent =
        "ROI PERFORMANCE";

    wrapper.appendChild(
        title
    );

    const tableWrap =
        document.createElement(
            "div"
        );

    tableWrap.className =
        "roi-table-wrap";

    const table =
        document.createElement(
            "table"
        );

    table.className =
        "roi-table";

    table.innerHTML = `
        <thead>
            <tr>
                <th>PARTICULAR</th>
                <th>CAPITAL (₹)</th>
                <th>LAST WEEK ROI %</th>
                <th>LAST WEEK ROI (₹)</th>
                <th>LAST MONTH ROI %</th>
                <th>LAST MONTH ROI (₹)</th>
            </tr>
        </thead>

        <tbody></tbody>
    `;

    const tbody =
        table.querySelector(
            "tbody"
        );

    let totalCapitalAllocated = 0;
    let totalWeekROI = 0;
    let totalMonthROI = 0;

    items.forEach(
        item => {

            const normalized =
                normalizeItem(
                    item
                );

            const capital =
                totalCapital *
                normalized.percent /
                100;

            const weekROIAmount =
                capital *
                normalized.weekROI /
                100;

            const monthROIAmount =
                capital *
                normalized.monthROI /
                100;

            totalCapitalAllocated +=
                capital;

            totalWeekROI +=
                weekROIAmount;

            totalMonthROI +=
                monthROIAmount;

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `
                <td>
                    ${escapeHTML(
                        normalized.name
                    )}
                </td>

                <td>
                    ${formatINR(
                        capital
                    )}
                </td>

                <td>
                    ${formatNumber(
                        normalized.weekROI
                    )}%
                </td>

                <td>
                    ${formatINR(
                        weekROIAmount
                    )}
                </td>

                <td>
                    ${formatNumber(
                        normalized.monthROI
                    )}%
                </td>

                <td>
                    ${formatINR(
                        monthROIAmount
                    )}
                </td>
            `;

            tbody.appendChild(
                row
            );
        }
    );

    /* =============================================
       ROI TOTAL
    ============================================= */

    const totalWeekROIPercent =
        totalCapitalAllocated > 0
            ? totalWeekROI /
              totalCapitalAllocated *
              100
            : 0;

    const totalMonthROIPercent =
        totalCapitalAllocated > 0
            ? totalMonthROI /
              totalCapitalAllocated *
              100
            : 0;

    const totalRow =
        document.createElement(
            "tr"
        );

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
                totalWeekROIPercent
            )}%
        </td>

        <td>
            ${formatINR(
                totalWeekROI
            )}
        </td>

        <td>
            ${formatNumber(
                totalMonthROIPercent
            )}%
        </td>

        <td>
            ${formatINR(
                totalMonthROI
            )}
        </td>
    `;

    tbody.appendChild(
        totalRow
    );

    tableWrap.appendChild(
        table
    );

    wrapper.appendChild(
        tableWrap
    );

    return wrapper;
}

/* =========================================================
   AUTO REFRESH
========================================================= */

loadDashboard();

setInterval(
    loadDashboard,
    30000
);
