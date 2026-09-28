```javascript
let data = null;

const $ = s => document.querySelector(s);

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

const esc = s =>
    String(s ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));

function get(obj, path) {
    return path
        .split(".")
        .reduce((a, k) => a?.[k], obj);
}

function set(obj, path, value) {
    const parts = path.split(".");
    const last = parts.pop();

    const target = parts.reduce(
        (x, k) => x[k],
        obj
    );

    target[last] = value;
}


/* =========================================================
   BUILD ADMIN EDITOR
========================================================= */

function buildEditors() {

    /* ---------------------------------------------
       SETTINGS
    --------------------------------------------- */

    if (!data.settings) {
        data.settings = {};
    }

    if (
        typeof data.settings.overallROIEnabled !==
        "boolean"
    ) {
        data.settings.overallROIEnabled = true;
    }


    /* ---------------------------------------------
       MAIN EDITOR HTML
    --------------------------------------------- */

    $("#editSections").innerHTML = `

        <!-- =========================================
             DASHBOARD CONTROLS
        ========================================== -->

        <section>

            <h3>Dashboard Controls</h3>

            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:20px;
                padding:18px;
                background:#f5f7f6;
                border:1px solid #ddd;
                border-radius:12px;
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
                        margin-top:6px;
                        color:#666;
                        font-size:13px;
                    ">
                        Show or hide the overall ROI table
                        and pie chart on the public dashboard.
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


        <!-- =========================================
             DEPARTMENT EDITORS
        ========================================== -->

        ${keys.map(k => `

            <section>

                <h3>
                    ${labels[k]}
                </h3>


                <!-- TABLE HEADER -->

                <div style="
                    display:grid;
                    grid-template-columns:
                        1.5fr
                        .7fr
                        .7fr
                        .7fr
                        40px;
                    gap:8px;
                    margin-bottom:8px;
                    font-size:12px;
                    font-weight:800;
                    color:#555;
                ">

                    <div>PARTICULAR</div>
                    <div>ALLOCATION %</div>
                    <div>WEEK ROI %</div>
                    <div>MONTH ROI %</div>
                    <div></div>

                </div>


                <!-- ITEMS -->

                <div id="${k}Rows"></div>


                <!-- ADD ITEM -->

                <button
                    type="button"
                    class="add-row"
                    data-add="${k}"
                    style="
                        margin-top:8px;
                    "
                >
                    + Add Item
                </button>


                <!-- PURPOSE -->

                <label style="
                    display:block;
                    margin-top:15px;
                ">

                    Purpose

                    <textarea
                        data-path="verticals.${k}.purpose"
                        rows="3"
                    ></textarea>

                </label>

            </section>

        `).join("")}

    `;


    /* =====================================================
       OVERALL ROI SWITCH
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
                box-shadow:
                    0 1px 4px rgba(0,0,0,.25);
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

                const department =
                    button.dataset.add;

                if (
                    !data.verticals[department]
                ) {
                    return;
                }


                data.verticals[
                    department
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
   RENDER DEPARTMENT ITEMS
========================================================= */

function renderEditors() {

    keys.forEach(k => {

        const box =
            $("#" + k + "Rows");

        if (!box) {
            return;
        }


        const items =
            data.verticals[k].items || [];


        box.innerHTML =
            items.map((item, index) => {

                /* -----------------------------------------
                   SUPPORT OLD DATA FORMAT
                ----------------------------------------- */

                let name = "";
                let allocation = 0;
                let weekROI = 0;
                let monthROI = 0;


                if (Array.isArray(item)) {

                    name =
                        item[0] ?? "";

                    allocation =
                        Number(item[1]) || 0;

                    weekROI =
                        Number(item[2]) || 0;

                    monthROI =
                        Number(item[3]) || 0;

                } else {

                    name =
                        item.name ||
                        "Item";

                    allocation =
                        Number(
                            item.percent ??
                            item.allocation ??
                            0
                        ) || 0;

                    weekROI =
                        Number(
                            item.weekROI ??
                            item.lastWeekROI ??
                            0
                        ) || 0;

                    monthROI =
                        Number(
                            item.monthROI ??
                            item.lastMonthROI ??
                            0
                        ) || 0;

                }


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
                                40px;
                            gap:8px;
                            align-items:center;
                            margin-bottom:8px;
                        "
                    >

                        <!-- PARTICULAR -->

                        <input
                            value="${esc(name)}"
                            data-name="${k}"
                            data-i="${index}"
                            placeholder="Particular"
                            type="text"
                        >


                        <!-- ALLOCATION % -->

                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value="${allocation}"
                            data-pct="${k}"
                            data-i="${index}"
                            placeholder="Allocation %"
                        >


                        <!-- LAST WEEK ROI % -->

                        <input
                            type="number"
                            step="0.01"
                            value="${weekROI}"
                            data-week-roi="${k}"
                            data-i="${index}"
                            placeholder="Week ROI %"
                        >


                        <!-- LAST MONTH ROI % -->

                        <input
                            type="number"
                            step="0.01"
                            value="${monthROI}"
                            data-month-roi="${k}"
                            data-i="${index}"
                            placeholder="Month ROI %"
                        >


                        <!-- DELETE -->

                        <button
                            type="button"
                            data-del="${k}"
                            data-i="${index}"
                            title="Delete item"
                            style="
                                background:#d32f2f;
                                color:white;
                                border:0;
                                border-radius:6px;
                                cursor:pointer;
                                font-size:18px;
                                height:36px;
                            "
                        >
                            ×
                        </button>

                    </div>

                `;

            }).join("");


    /* =====================================================
       NORMAL DATA-PATH INPUTS
    ===================================================== */

    document
        .querySelectorAll("[data-path]")
        .forEach(el => {

            const value =
                get(
                    data,
                    el.dataset.path
                );


            el.value =
                value ?? "";


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
        .forEach(el => {

            el.oninput = () => {

                const department =
                    el.dataset.name;

                const index =
                    Number(el.dataset.i);

                const item =
                    data.verticals[
                        department
                    ].items[index];


                if (Array.isArray(item)) {

                    item[0] =
                        el.value;

                } else {

                    item.name =
                        el.value;

                }

            };

        });


    /* =====================================================
       ALLOCATION %
    ===================================================== */

    document
        .querySelectorAll("[data-pct]")
        .forEach(el => {

            el.oninput = () => {

                const department =
                    el.dataset.pct;

                const index =
                    Number(el.dataset.i);

                const item =
                    data.verticals[
                        department
                    ].items[index];


                const value =
                    Number(el.value) || 0;


                if (Array.isArray(item)) {

                    item[1] =
                        value;

                } else {

                    item.percent =
                        value;

                }

            };

        });


    /* =====================================================
       LAST WEEK ROI %
    ===================================================== */

    document
        .querySelectorAll("[data-week-roi]")
        .forEach(el => {

            el.oninput = () => {

                const department =
                    el.dataset.weekRoi;

                const index =
                    Number(el.dataset.i);

                const item =
                    data.verticals[
                        department
                    ].items[index];


                const value =
                    Number(el.value) || 0;


                if (Array.isArray(item)) {

                    item[2] =
                        value;

                } else {

                    item.weekROI =
                        value;

                }

            };

        });


    /* =====================================================
       LAST MONTH ROI %
    ===================================================== */

    document
        .querySelectorAll("[data-month-roi]")
        .forEach(el => {

            el.oninput = () => {

                const department =
                    el.dataset.monthRoi;

                const index =
                    Number(el.dataset.i);

                const item =
                    data.verticals[
                        department
                    ].items[index];


                const value =
                    Number(el.value) || 0;


                if (Array.isArray(item)) {

                    item[3] =
                        value;

                } else {

                    item.monthROI =
                        value;

                }

            };

        });


    /* =====================================================
       DELETE ITEM
    ===================================================== */

    document
        .querySelectorAll("[data-del]")
        .forEach(button => {

            button.onclick = () => {

                const department =
                    button.dataset.del;

                const index =
                    Number(button.dataset.i);


                if (
                    !data.verticals[
                        department
                    ]
                ) {
                    return;
                }


                data.verticals[
                    department
                ].items.splice(
                    index,
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

    try {

        let response =
            await fetch(
                "/api/me",
                {
                    cache: "no-store"
                }
            );


        const me =
            await response.json();


        if (!me.authenticated) {

            $("#loginScreen")
                .classList
                .remove("hidden");

            $("#adminApp")
                .classList
                .add("hidden");

            return;

        }


        response =
            await fetch(
                "/api/data",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {
            throw new Error(
                "Unable to load dashboard data."
            );
        }


        data =
            await response.json();


        /* -----------------------------------------
           SAFETY DEFAULTS
        ----------------------------------------- */

        if (!data.settings) {
            data.settings = {};
        }

        if (
            typeof
            data.settings.overallROIEnabled
            !== "boolean"
        ) {
            data.settings.overallROIEnabled =
                true;
        }


        if (!data.verticals) {
            data.verticals = {};
        }


        keys.forEach(k => {

            if (!data.verticals[k]) {

                data.verticals[k] = {
                    percent: 0,
                    purpose: "",
                    items: []
                };

            }


            if (
                !Array.isArray(
                    data.verticals[k].items
                )
            ) {

                data.verticals[k].items = [];

            }

        });


        $("#loginScreen")
            .classList
            .add("hidden");

        $("#adminApp")
            .classList
            .remove("hidden");


        buildEditors();

    } catch (error) {

        console.error(error);

        $("#loginError").textContent =
            "Unable to load dashboard.";

    }

}


/* =========================================================
   LOGIN
========================================================= */

$("#loginForm").onsubmit =
    async event => {

        event.preventDefault();


        try {

            const response =
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


            if (response.ok) {

                $("#loginError")
                    .textContent = "";

                await load();

            } else {

                $("#loginError")
                    .textContent =
                    "Invalid username or password.";

            }

        } catch (error) {

            console.error(error);

            $("#loginError")
                .textContent =
                "Login failed. Please try again.";

        }

    };


/* =========================================================
   SAVE ALL DATA
========================================================= */

$("#saveBtn").onclick =
    async () => {

        const saveButton =
            $("#saveBtn");


        try {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "Saving...";


            const response =
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


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.error ||
                    "Save failed"
                );

            }


            /* -----------------------------------------
               USE SERVER'S CLEANED DATA
            ----------------------------------------- */

            if (result.data) {
                data = result.data;
            }


            $("#saveMessage")
                .textContent =
                "✓ Saved successfully";


            /* -----------------------------------------
               REFRESH ADMIN PREVIEW
            ----------------------------------------- */

            const iframe =
                document.querySelector(
                    ".preview iframe"
                );


            if (iframe) {

                iframe.contentWindow
                    .location
                    .reload();

            }


            /* -----------------------------------------
               REMOVE MESSAGE AFTER A FEW SECONDS
            ----------------------------------------- */

            setTimeout(() => {

                $("#saveMessage")
                    .textContent = "";

            }, 4000);


        } catch (error) {

            console.error(error);

            $("#saveMessage")
                .textContent =
                "✕ " +
                (
                    error.message ||
                    "Save failed"
                );

        } finally {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save All Changes";

        }

    };


/* =========================================================
   LOGOUT
========================================================= */

$("#logoutBtn").onclick =
    async () => {

        try {

            await fetch(
                "/api/logout",
                {
                    method: "POST"
                }
            );

        } catch (error) {

            console.error(error);

        }


        location.reload();

    };


/* =========================================================
   START
========================================================= */

load();
```
