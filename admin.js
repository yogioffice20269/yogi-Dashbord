let data = null;

const $ = s => document.querySelector(s);

const keys = ["trading", "investment", "reserve", "rnd"];

const labels = {
    trading: "Trading",
    investment: "Investment",
    reserve: "Reserve",
    rnd: "Research & Development"
};

const esc = s =>
    String(s ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));

function get(o, p) {
    return p.split(".").reduce((a, k) => a?.[k], o);
}

function set(o, p, v) {
    let a = p.split(".");
    let l = a.pop();
    let t = a.reduce((x, k) => x[k], o);
    t[l] = v;
}

/* =========================================================
   BUILD ADMIN EDITOR
========================================================= */

function buildEditors() {

    /* Default ON */
    if (!data.settings) {
        data.settings = {};
    }

    if (
        typeof data.settings.overallROIEnabled !== "boolean"
    ) {
        data.settings.overallROIEnabled = true;
    }

    $("#editSections").innerHTML = `

        <!-- OVERALL ROI CONTROL -->

        <section class="overall-roi-control">

            <h3>Dashboard Controls</h3>

            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:20px;
                padding:16px;
                background:#f5f7f6;
                border:1px solid #ddd;
                border-radius:10px;
                margin-bottom:20px;
            ">

                <div>

                    <div style="
                        font-size:17px;
                        font-weight:800;
                        color:#075c32;
                    ">
                        OVERALL ROI PERFORMANCE
                    </div>

                    <div style="
                        margin-top:5px;
                        color:#666;
                        font-size:13px;
                    ">
                        Show or hide the overall ROI table and pie chart
                        on the public dashboard.
                    </div>

                </div>

                <label style="
                    position:relative;
                    display:inline-block;
                    width:58px;
                    height:32px;
                    flex-shrink:0;
                ">

                    <input
                        type="checkbox"
                        id="overallROIEnabled"
                        style="
                            opacity:0;
                            width:0;
                            height:0;
                        "
                    >

                    <span
                        id="overallROISlider"
                        style="
                            position:absolute;
                            cursor:pointer;
                            inset:0;
                            background:#999;
                            border-radius:32px;
                            transition:.25s;
                        "
                    ></span>

                </label>

            </div>

        </section>

        ${keys.map(k => `

            <section>

                <h3>${labels[k]}</h3>

                <div id="${k}Rows"></div>

                <button
                    type="button"
                    class="add-row"
                    data-add="${k}"
                >
                    + Add Item
                </button>

                <label>
                    Purpose
                    <textarea
                        data-path="verticals.${k}.purpose"
                    ></textarea>
                </label>

            </section>

        `).join("")}
    `;

    /* =====================================================
       OVERALL ROI TOGGLE
    ===================================================== */

    const toggle =
        $("#overallROIEnabled");

    const slider =
        $("#overallROISlider");

    function updateToggleUI() {

        const enabled =
            !!data.settings.overallROIEnabled;

        toggle.checked = enabled;

        slider.style.background =
            enabled
                ? "#075c32"
                : "#999";

        slider.innerHTML = `
            <span style="
                position:absolute;
                height:24px;
                width:24px;
                left:${enabled ? "30px" : "4px"};
                top:4px;
                background:white;
                border-radius:50%;
                transition:.25s;
                box-shadow:0 1px 4px rgba(0,0,0,.25);
            "></span>
        `;
    }

    toggle.onchange = () => {

        data.settings.overallROIEnabled =
            toggle.checked;

        updateToggleUI();
    };

    updateToggleUI();

    /* =====================================================
       ADD ITEM BUTTONS
    ===================================================== */

    document
        .querySelectorAll("[data-add]")
        .forEach(button => {

            button.onclick = () => {

                data.verticals[
                    button.dataset.add
                ].items.push([
                    "New Item",
                    0,
                    0,
                    0
                ]);

                renderEditors();
            };
        });

    renderEditors();
}

/* =========================================================
   RENDER ITEMS
========================================================= */

function renderEditors() {

    keys.forEach(k => {

        let box = $("#" + k + "Rows");

        box.innerHTML =
            data.verticals[k].items
                .map((x, i) => {

                    /* Support old 2-value items */
                    const name =
                        Array.isArray(x)
                            ? x[0]
                            : x.name || "Item";

                    const percent =
                        Array.isArray(x)
                            ? Number(x[1]) || 0
                            : Number(
                                x.percent ??
                                x.allocation ??
                                0
                            ) || 0;

                    const weekROI =
                        Array.isArray(x)
                            ? Number(x[2]) || 0
                            : Number(
                                x.weekROI ??
                                x.lastWeekROI ??
                                0
                            ) || 0;

                    const monthROI =
                        Array.isArray(x)
                            ? Number(x[3]) || 0
                            : Number(
                                x.monthROI ??
                                x.lastMonthROI ??
                                0
                            ) || 0;

                    return `

                        <div
                            class="item-row"
                            style="
                                display:grid;
                                grid-template-columns:
                                1.5fr
                                .7fr
                                .7fr
                                .7fr
                                auto;
                                gap:8px;
                                align-items:center;
                                margin-bottom:8px;
                            "
                        >

                            <input
                                value="${esc(name)}"
                                data-name="${k}"
                                data-i="${i}"
                                placeholder="Particular"
                            >

                            <input
                                type="number"
                                min="0"
                                max="100"
                                step=".1"
                                value="${percent}"
                                data-pct="${k}"
                                data-i="${i}"
                                placeholder="Allocation %"
                            >

                            <input
                                type="number"
                                step=".01"
                                value="${weekROI}"
                                data-week-roi="${k}"
                                data-i="${i}"
                                placeholder="Week ROI %"
                            >

                            <input
                                type="number"
                                step=".01"
                                value="${monthROI}"
                                data-month-roi="${k}"
                                data-i="${i}"
                                placeholder="Month ROI %"
                            >

                            <button
                                type="button"
                                data-del="${k}"
                                data-i="${i}"
                            >
                                ×
                            </button>

                        </div>
                    `;

                })
                .join("");
    });

    /* =====================================================
       NORMAL INPUT BINDING
    ===================================================== */

    document
        .querySelectorAll("[data-path]")
        .forEach(el => {

            el.value =
                get(
                    data,
                    el.dataset.path
                ) ?? "";

            el.oninput = () => {

                set(
                    data,
                    el.dataset.path,
                    el.type === "number"
                        ? Number(el.value)
                        : el.value
                );
            };
        });

    /* =====================================================
       ITEM NAME
    ===================================================== */

    document
        .querySelectorAll("[data-name]")
        .forEach(e => {

            e.oninput = () => {

                const item =
                    data.verticals[
                        e.dataset.name
                    ].items[
                        e.dataset.i
                    ];

                if (Array.isArray(item)) {

                    item[0] =
                        e.value;

                } else {

                    item.name =
                        e.value;
                }
            };
        });

    /* =====================================================
       ALLOCATION %
    ===================================================== */

    document
        .querySelectorAll("[data-pct]")
        .forEach(e => {

            e.oninput = () => {

                const item =
                    data.verticals[
                        e.dataset.pct
                    ].items[
                        e.dataset.i
                    ];

                if (Array.isArray(item)) {

                    item[1] =
                        Number(e.value);

                } else {

                    item.percent =
                        Number(e.value);
                }
            };
        });

    /* =====================================================
       LAST WEEK ROI %
    ===================================================== */

    document
        .querySelectorAll("[data-week-roi]")
        .forEach(e => {

            e.oninput = () => {

                const item =
                    data.verticals[
                        e.dataset.weekRoi
                    ].items[
                        e.dataset.i
                    ];

                if (Array.isArray(item)) {

                    item[2] =
                        Number(e.value);

                } else {

                    item.weekROI =
                        Number(e.value);
                }
            };
        });

    /* =====================================================
       LAST MONTH ROI %
    ===================================================== */

    document
        .querySelectorAll("[data-month-roi]")
        .forEach(e => {

            e.oninput = () => {

                const item =
                    data.verticals[
                        e.dataset.monthRoi
                    ].items[
                        e.dataset.i
                    ];

                if (Array.isArray(item)) {

                    item[3] =
                        Number(e.value);

                } else {

                    item.monthROI =
                        Number(e.value);
                }
            };
        });

    /* =====================================================
       DELETE ITEM
    ===================================================== */

    document
        .querySelectorAll("[data-del]")
        .forEach(e => {

            e.onclick = () => {

                data.verticals[
                    e.dataset.del
                ].items.splice(
                    Number(e.dataset.i),
                    1
                );

                renderEditors();
            };
        });
}

/* =========================================================
   LOGIN / LOAD
========================================================= */

async function load() {

    let r =
        await fetch("/api/me");

    let me =
        await r.json();

    if (!me.authenticated) {

        $("#loginScreen")
            .classList
            .remove("hidden");

        return;
    }

    r =
        await fetch(
            "/api/data",
            {
                cache: "no-store"
            }
        );

    data =
        await r.json();

    $("#loginScreen")
        .classList
        .add("hidden");

    $("#adminApp")
        .classList
        .remove("hidden");

    buildEditors();
}

/* =========================================================
   LOGIN
========================================================= */

$("#loginForm").onsubmit =
    async e => {

        e.preventDefault();

        let r =
            await fetch(
                "/api/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify({
                            username:
                                $("#username")
                                    .value,

                            password:
                                $("#password")
                                    .value
                        })
                }
            );

        if (r.ok) {

            load();

        } else {

            $("#loginError")
                .textContent =
                "Invalid username or password.";
        }
    };

/* =========================================================
   SAVE
========================================================= */

$("#saveBtn").onclick =
    async () => {

        let r =
            await fetch(
                "/api/data",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify(data)
                }
            );

        $("#saveMessage")
            .textContent =
            r.ok
                ? "Saved successfully"
                : "Save failed";

        if (r.ok) {

            const iframe =
                document.querySelector(
                    ".preview iframe"
                );

            if (iframe) {

                iframe.contentWindow
                    .location
                    .reload();
            }
        }
    };

/* =========================================================
   LOGOUT
========================================================= */

$("#logoutBtn").onclick =
    async () => {

        await fetch(
            "/api/logout",
            {
                method: "POST"
            }
        );

        location.reload();
    };

load();
