/* =========================================================
   YOGI GROWING TOGETHER LLP
   FUND ALLOCATION DASHBOARD
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

    const iso =
        text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

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

    if (item && typeof item === "object") {

        return {
            name: String(
                item.name ?? "Item"
            ),

            percent: Number(
                item.percent ??
                item.allocation ??
                0
            ) || 0,

            weekROI: Number(
                item.weekROI ??
                item.lastWeekROI ??
                0
            ) || 0,

            monthROI: Number(
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
   LOAD DATA
========================================================= */

async function loadDashboard() {

    try {

        const response = await fetch(
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

        const loading =
            $("loading");

        const dashboard =
            $("dashboard");

        if (loading) {
            loading.classList.add("hidden");
        }

        if (dashboard) {
            dashboard.classList.remove("hidden");
        }

    } catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

        const loading =
            $("loading");

        if (loading) {
            loading.textContent =
                "Unable to load dashboard. Please refresh the page.";
        }
    }
}

/* =========================================================
   MAIN RENDER
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

    /* HEADER */

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

    /* TOTAL ALLOCATION */

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

    renderAllocationCards(
        data,
        totalCapital
    );

    renderDonut(
        data
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

    } else if (difference > 0) {

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
            name: "TRADING"
        },
        {
            key: "investment",
            name: "INVESTMENT"
        },
        {
            key: "reserve",
            name: "RESERVE"
        },
        {
            key: "rnd",
            name: "R&D"
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
                document.createElement("div");

            card.className =
                `allocation-card ${department.key}`;

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

function renderDonut(data) {

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

    departments.forEach(
        (department, index) => {

            const value =
                values[index];

            if (
                value <= 0 ||
                total <= 0
            ) {
                return;
            }

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

    departments.forEach(
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
   FULLY DYNAMIC
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

    const values =
        departments.map(
            department => {

                const percent =
                    Number(
                        data?.verticals?.[
                            department.key
                        ]?.percent
                    ) || 0;

                return {
                    key: department.key,
                    name: department.name,
                    percent: percent,
                    capital:
                        totalCapital *
                        percent /
                        100
                };
            }
        );

    /* Highest value */

    const highest =
        Math.max(
            ...values.map(
                item =>
                    item.capital
            ),
            1
        );

    /*
       Dynamic maximum.

       Example:
       ₹40L highest
       => graph max = ₹40L

       ₹70L highest
       => graph max = ₹70L

       ₹1Cr highest
       => graph max = ₹1Cr
    */

    let maxValue;

    if (highest <= 100000) {

        maxValue =
            Math.ceil(
                highest / 20000
            ) * 20000;

    } else if (highest <= 1000000) {

        maxValue =
            Math.ceil(
                highest / 100000
            ) * 100000;

    } else if (highest <= 10000000) {

        maxValue =
            Math.ceil(
                highest / 1000000
            ) * 1000000;

    } else {

        maxValue =
            Math.ceil(
                highest / 10000000
            ) * 10000000;
    }

    if (maxValue <= 0) {
        maxValue = 1;
    }

    /* Find chart wrapper */

    const wrapper =
        container.parentElement;

    /*
       Create dynamic Y-axis
       if y-axis exists.
    */

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

                const value =
                    maxValue *
                    i /
                    5;

                const label =
                    document.createElement(
                        "span"
                    );

                label.textContent =
                    formatLakh(value);

                yAxis.appendChild(
                    label
                );
            }
        }
    }

    /* Create bars */

    values.forEach(
        item => {

            const group =
                document.createElement(
                    "div"
                );

            group.className =
                "bar-group";

            const valueLabel =
                document.createElement(
                    "div"
                );

            valueLabel.className =
                "bar-value";

            valueLabel.textContent =
                formatINR(
                    item.capital
                );

            const bar =
                document.createElement(
                    "div"
                );

            bar.className =
                "bar";

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

            group.appendChild(
                valueLabel
            );

            group.appendChild(
                bar
            );

            group.appendChild(
                label
            );

            container.appendChild(
                group
            );
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

            const items =
                Array.isArray(
                    vertical.items
                )
                    ? vertical.items
                    : [];

            const section =
                document.createElement(
                    "div"
                );

            section.className =
                `department ${department.className}`;

            /* TITLE */

            const heading =
                document.createElement(
                    "h2"
                );

            heading.textContent =
                department.name;

            section.appendChild(
                heading
            );

            /* ALLOCATION TABLE */

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

                    const x =
                        normalizeItem(
                            item
                        );

                    const capital =
                        totalCapital *
                        x.percent /
                        100;

                    allocationTotal +=
                        x.percent;

                    const row =
                        document.createElement(
                            "tr"
                        );

                    row.innerHTML = `
                        <td>
                            ${escapeHTML(
                                x.name
                            )}
                        </td>

                        <td>
                            ${formatNumber(
                                x.percent
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

            /* TOTAL */

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

            /* STATUS */

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
                        totalCapital *
                        Math.abs(
                            difference
                        ) /
                        100
                    )}
                </td>
            `;

            tbody.appendChild(
                statusRow
            );

            section.appendChild(
                table
            );

            /* ITEM GRAPH */

            section.appendChild(
                createItemChart(
                    department,
                    items
                )
            );

            /* ROI */

            section.appendChild(
                createROITable(
                    items,
                    totalCapital
                )
            );

            /* PURPOSE */

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

            section.appendChild(
                purpose
            );

            container.appendChild(
                section
            );
        }
    );
}

/* =========================================================
   ITEM ALLOCATION GRAPH
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

    const normalized =
        items.map(
            normalizeItem
        );

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
                    item.percent /
                    highest *
                    100,
                    item.percent > 0
                        ? 3
                        : 0
                );

            bar.style.height =
                `${height}%`;

            bar.style.background =
                getDepartmentColor(
                    department.key
                );

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

            const x =
                normalizeItem(
                    item
                );

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
                document.createElement(
                    "tr"
                );

            row.innerHTML = `
                <td>
                    ${escapeHTML(
                        x.name
                    )}
                </td>

                <td>
                    ${formatINR(
                        capital
                    )}
                </td>

                <td>
                    ${formatNumber(
                        x.weekROI
                    )}%
                </td>

                <td>
                    ${formatINR(
                        weekROI
                    )}
                </td>

                <td>
                    ${formatNumber(
                        x.monthROI
                    )}%
                </td>

                <td>
                    ${formatINR(
                        monthROI
                    )}
                </td>
            `;

            tbody.appendChild(
                row
            );
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
                weekPercent
            )}%
        </td>

        <td>
            ${formatINR(
                totalWeekROI
            )}
        </td>

        <td>
            ${formatNumber(
                monthPercent
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
   START
========================================================= */

loadDashboard();

/*
   Automatically refresh every 30 seconds.
   Admin changes will appear automatically.
*/

setInterval(
    loadDashboard,
    30000
);
