const $ = (id) => document.getElementById(id);

const formatINR = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);

const formatNumber = (value) =>
    new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2
    }).format(Number(value) || 0);

const escapeHTML = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");


/* =========================================================
   LOAD DATA
========================================================= */

async function loadDashboard() {
    try {
        const response = await fetch("/api/data", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Unable to load dashboard data");
        }

        const data = await response.json();

        renderDashboard(data);

        $("loading").classList.add("hidden");
        $("dashboard").classList.remove("hidden");

    } catch (error) {
        console.error(error);

        $("loading").textContent =
            "Unable to load dashboard. Please refresh the page.";
    }
}


/* =========================================================
   MAIN RENDER
========================================================= */

function renderDashboard(data) {

    const totalCapital =
        Number(data?.capital?.total) || 0;

    const verticals =
        data?.verticals || {};

    const verticalKeys = [
        "trading",
        "investment",
        "reserve",
        "rnd"
    ];

    /* -------------------------
       HEADER
    ------------------------- */

    $("orgName").textContent =
        data?.meta?.organization || "";

    $("metaDate").textContent =
        data?.meta?.date || "";

    $("metaVersion").textContent =
        data?.meta?.version || "";

    $("metaPrepared").textContent =
        data?.meta?.preparedBy || "";


    /* -------------------------
       CAPITAL CALCULATION
    ------------------------- */

    let allocatedCapital = 0;

    verticalKeys.forEach((key) => {

        const percent =
            Number(verticals?.[key]?.percent) || 0;

        allocatedCapital +=
            totalCapital * percent / 100;
    });

    const difference =
        totalCapital - allocatedCapital;

    $("totalCapital").textContent =
        formatINR(totalCapital);

    $("allocatedCapital").textContent =
        formatINR(allocatedCapital);

    $("unallocatedCapital").textContent =
        formatINR(Math.abs(difference));


    /* -------------------------
       OVERALL STATUS
    ------------------------- */

    renderOverallStatus(
        totalCapital,
        allocatedCapital
    );


    /* -------------------------
       ALLOCATION CARDS
    ------------------------- */

    renderAllocationCards(
        data,
        totalCapital
    );


    /* -------------------------
       DONUT
    ------------------------- */

    renderDonut(
        data,
        totalCapital
    );


    /* -------------------------
       CAPITAL BAR CHART
    ------------------------- */

    renderCapitalBars(
        data,
        totalCapital
    );


    /* -------------------------
       DEPARTMENT TABLES
    ------------------------- */

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

    const statusElement = $("status");

    const difference =
        totalCapital - allocatedCapital;

    if (Math.abs(difference) < 0.01) {

        statusElement.innerHTML = `
            <span class="status-full">
                FULLY ALLOCATED
            </span>
        `;

    } else if (difference > 0) {

        statusElement.innerHTML = `
            <span class="status-surplus">
                SURPLUS ${formatINR(difference)}
            </span>
        `;

    } else {

        statusElement.innerHTML = `
            <span class="status-deficit">
                DEFICIT ${formatINR(Math.abs(difference))}
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

    departments.forEach((department) => {

        const vertical =
            data?.verticals?.[department.key] || {};

        const percent =
            Number(vertical.percent) || 0;

        const capital =
            totalCapital * percent / 100;

        const card =
            document.createElement("div");

        card.className =
            `allocation-card ${department.className}`;

        card.innerHTML = `
            <div class="allocation-title">
                ${escapeHTML(department.name)}
            </div>

            <div class="allocation-percent">
                ${formatNumber(percent)}%
            </div>

            <div class="allocation-capital">
                ${formatINR(capital)}
            </div>
        `;

        container.appendChild(card);
    });
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

    const departments = [
        {
            key: "trading",
            name: "Trading",
            className: "trading"
        },
        {
            key: "investment",
            name: "Investment",
            className: "investment"
        },
        {
            key: "reserve",
            name: "Reserve",
            className: "reserve"
        },
        {
            key: "rnd",
            name: "R&D",
            className: "rnd"
        }
    ];

    let currentAngle = 0;

    const colors = [
        "#2f75b5",
        "#70ad47",
        "#ffc000",
        "#7030a0"
    ];

    const segments = [];

    departments.forEach(
        (department, index) => {

            const percent =
                Number(
                    data?.verticals?.[department.key]?.percent
                ) || 0;

            const start =
                currentAngle;

            const end =
                currentAngle + percent * 3.6;

            if (percent > 0) {

                segments.push(
                    `${colors[index]} ${start}deg ${end}deg`
                );
            }

            currentAngle = end;
        }
    );

    if (segments.length > 0) {

        donut.style.background =
            `conic-gradient(${segments.join(",")})`;

    } else {

        donut.style.background =
            "#e5e5e5";
    }


    legend.innerHTML = "";

    departments.forEach(
        (department, index) => {

            const percent =
                Number(
                    data?.verticals?.[department.key]?.percent
                ) || 0;

            const capital =
                totalCapital * percent / 100;

            const row =
                document.createElement("div");

            row.className =
                "legend-item";

            row.innerHTML = `
                <span
                    class="legend-dot"
                    style="background:${colors[index]}"
                ></span>

                <span>
                    ${escapeHTML(department.name)}
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
   CAPITAL BAR CHART
========================================================= */

function renderCapitalBars(
    data,
    totalCapital
) {

    const container =
        $("bars");

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

    const maxCapital =
        Math.max(
            totalCapital * 0.5,
            ...departments.map(
                d =>
                    totalCapital *
                    (Number(
                        data?.verticals?.[d.key]?.percent
                    ) || 0) / 100
            ),
            1
        );

    departments.forEach(
        (department) => {

            const percent =
                Number(
                    data?.verticals?.[department.key]?.percent
                ) || 0;

            const capital =
                totalCapital * percent / 100;

            const height =
                Math.max(
                    4,
                    (capital / maxCapital) * 100
                );

            const group =
                document.createElement("div");

            group.className =
                "bar-group";

            group.innerHTML = `
                <div class="bar-value">
                    ${formatINR(capital)}
                </div>

                <div
                    class="bar"
                    style="height:${height}%"
                ></div>

                <div class="bar-label">
                    ${escapeHTML(department.name)}
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
        (department) => {

            const vertical =
                data?.verticals?.[department.key] || {};

            const departmentPercent =
                Number(vertical.percent) || 0;

            const departmentCapital =
                totalCapital *
                departmentPercent / 100;

            const items =
                Array.isArray(vertical.items)
                    ? vertical.items
                    : [];

            const departmentElement =
                document.createElement("div");

            departmentElement.className =
                `department ${department.className}`;


            /* =================================================
               HEADER
            ================================================= */

            const heading =
                document.createElement("h2");

            heading.textContent =
                department.name;

            departmentElement.appendChild(
                heading
            );


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
                        <th>PARTICULAR</th>
                        <th>ALLOCATION %</th>
                        <th>CAPITAL</th>
                    </tr>
                </thead>

                <tbody></tbody>
            `;

            const tbody =
                table.querySelector("tbody");

            let allocationTotal = 0;

            items.forEach(
                (item) => {

                    const normalized =
                        normalizeItem(item);

                    const name =
                        normalized.name;

                    const percent =
                        normalized.percent;

                    const capital =
                        totalCapital *
                        percent / 100;

                    allocationTotal +=
                        percent;

                    const row =
                        document.createElement("tr");

                    row.innerHTML = `
                        <td>
                            ${escapeHTML(name)}
                        </td>

                        <td>
                            ${formatNumber(percent)}%
                        </td>

                        <td>
                            ${formatINR(capital)}
                        </td>
                    `;

                    tbody.appendChild(row);
                }
            );


            /* =================================================
               TOTAL ROW
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
                    ${formatNumber(allocationTotal)}%
                </td>

                <td>
                    ${formatINR(
                        totalCapital *
                        allocationTotal / 100
                    )}
                </td>
            `;

            tbody.appendChild(totalRow);


            /* =================================================
               STATUS ROW
            ================================================= */

            const statusDifference =
                departmentPercent -
                allocationTotal;

            const statusRow =
                document.createElement("tr");

            statusRow.className =
                "department-status-row";

            let statusText = "";
            let statusClass = "";

            if (
                Math.abs(statusDifference) < 0.01
            ) {

                statusText =
                    "FULLY ALLOCATED";

                statusClass =
                    "status-full";

            } else if (
                statusDifference > 0
            ) {

                statusText =
                    `SURPLUS ${formatNumber(
                        statusDifference
                    )}%`;

                statusClass =
                    "status-surplus";

            } else {

                statusText =
                    `DEFICIT ${formatNumber(
                        Math.abs(statusDifference)
                    )}%`;

                statusClass =
                    "status-deficit";
            }

            const statusCapital =
                totalCapital *
                Math.abs(statusDifference) / 100;

            statusRow.innerHTML = `
                <td>
                    <b class="${statusClass}">
                        ${statusText}
                    </b>
                </td>

                <td>
                    ${formatNumber(
                        Math.abs(statusDifference)
                    )}%
                </td>

                <td>
                    ${formatINR(statusCapital)}
                </td>
            `;

            tbody.appendChild(
                statusRow
            );

            departmentElement.appendChild(
                table
            );


            /* =================================================
               ITEM BAR CHART
            ================================================= */

            const chart =
                createItemChart(
                    department,
                    items,
                    totalCapital
                );

            departmentElement.appendChild(
                chart
            );


            /* =================================================
               ROI TABLE
            ================================================= */

            const roiSection =
                createROITable(
                    items,
                    totalCapital
                );

            departmentElement.appendChild(
                roiSection
            );


            /* =================================================
               PURPOSE
            ================================================= */

            const purpose =
                document.createElement("div");

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
   NORMALIZE ITEM
========================================================= */

function normalizeItem(item) {

    if (Array.isArray(item)) {

        return {
            name: item[0] ?? "Item",
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
            name: item.name || "Item",

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
   ITEM BAR CHART
========================================================= */

function createItemChart(
    department,
    items,
    totalCapital
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


    const normalizedItems =
        items.map(normalizeItem);

    const maxPercent =
        Math.max(
            ...normalizedItems.map(
                item => item.percent
            ),
            1
        );


    normalizedItems.forEach(
        (item) => {

            const group =
                document.createElement("div");

            group.className =
                "item-bar-group";

            const value =
                document.createElement("div");

            value.className =
                "item-bar-value";

            value.textContent =
                `${formatNumber(item.percent)}%`;


            const bar =
                document.createElement("div");

            bar.className =
                "item-bar";

            const height =
                Math.max(
                    8,
                    (item.percent /
                        maxPercent) * 100
                );

            bar.style.height =
                `${height}%`;


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
   ROI TABLE
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
        table.querySelector("tbody");


    let totalCapitalAllocated = 0;
    let totalWeekROI = 0;
    let totalMonthROI = 0;


    items.forEach(
        (item) => {

            const normalized =
                normalizeItem(item);

            const capital =
                totalCapital *
                normalized.percent / 100;

            const weekROIAmount =
                capital *
                normalized.weekROI / 100;

            const monthROIAmount =
                capital *
                normalized.monthROI / 100;

            totalCapitalAllocated +=
                capital;

            totalWeekROI +=
                weekROIAmount;

            totalMonthROI +=
                monthROIAmount;


            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>
                    ${escapeHTML(
                        normalized.name
                    )}
                </td>

                <td>
                    ${formatINR(capital)}
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

            tbody.appendChild(row);
        }
    );


    /* =================================================
       ROI TOTAL
    ================================================= */

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
