let data = null;

const $ = (selector) => document.querySelector(selector);

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


/* =========================================================
   HELPERS
========================================================= */

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}


function get(obj, path) {
    return path
        .split(".")
        .reduce((current, key) => current?.[key], obj);
}


function set(obj, path, value) {
    const parts = path.split(".");
    const last = parts.pop();

    const target = parts.reduce(
        (current, key) => current[key],
        obj
    );

    target[last] = value;
}


/* =========================================================
   NORMALIZE DATA FOR ADMIN
========================================================= */

function prepareData() {

    if (!data || typeof data !== "object") {
        data = {};
    }


    if (!data.settings) {
        data.settings = {};
    }


    if (
        typeof data.settings.overallROIEnabled !==
        "boolean"
    ) {
        data.settings.overallROIEnabled = true;
    }


    if (!data.meta) {
        data.meta = {};
    }


    if (!data.capital) {
        data.capital = {
            total: 0
        };
    }


    if (!data.verticals) {
        data.verticals = {};
    }


    keys.forEach((key) => {

        if (!data.verticals[key]) {
            data.verticals[key] = {
                percent: 0,
                purpose: "",
                items: []
            };
        }


        if (
            !Array.isArray(
                data.verticals[key].items
            )
        ) {
            data.verticals[key].items = [];
        }


        data.verticals[key].items =
            data.verticals[key].items.map((item) => {

                if (!Array.isArray(item)) {
                    return [
                        item?.name || "New Item",
                        Number(
                            item?.allocation ??
                            item?.percent ??
                            0
                        ) || 0,
                        Number(
                            item?.weekROI ??
                            item?.lastWeekROI ??
                            0
                        ) || 0,
                        Number(
                            item?.monthROI ??
                            item?.lastMonthROI ??
                            0
                        ) || 0
                    ];
                }


                return [
                    item[0] ?? "",
                    Number(item[1]) || 0,
                    Number(item[2]) || 0,
                    Number(item[3]) || 0
                ];
            });

    });

}


/* =========================================================
   BUILD ADMIN EDITOR
========================================================= */

function buildEditors() {

    prepareData();


    const editSections =
        $("#editSections");


    if (!editSections) {
        return;
    }


    editSections.innerHTML = `

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
                        Show or hide the overall ROI
                        table and pie chart on the
                        public dashboard.
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

        ${keys.map((key) => `

            <section>

                <h3>
                    ${labels[key]}
                </h3>


                <div style="
                    overflow-x:auto;
                ">

                    <div style="
                        min-width:650px;
                    ">

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

                            <div>
                                PARTICULAR
                            </div>

                            <div>
                                ALLOCATION %
                            </div>

                            <div>
                                WEEK ROI %
                            </div>

                            <div>
                                MONTH ROI %
                            </div>

                            <div></div>

                        </div>


                        <div
                            id="${key}Rows"
                        ></div>


                        <button
                            type="button"
                            class="add-row"
                            data-add="${key}"
                            style="
                                margin-top:8px;
                            "
                        >
                            + Add Item
                        </button>

                    </div>

                </div>


                <label style="
                    display:block;
                    margin-top:15px;
                ">

                    Purpose

                    <textarea
                        data-path="verticals.${key}.purpose"
                        rows="3"
                    ></textarea>

                </label>

            </section>

        `).join("")}

    `;


    setupOverallROIToggle();

    setupAddButtons();

    renderEditors();

}


/* =========================================================
   OVERALL ROI TOGGLE
========================================================= */

function setupOverallROIToggle() {

    const toggle =
        $("#overallROIEnabled");

    const slider =
        $("#overallROISlider");


    if (!toggle || !slider) {
        return;
    }


    function updateToggle() {

        const enabled =
            data.settings.overallROIEnabled === true;


        toggle.checked = enabled;


        slider.style.background =
            enabled
                ? "#075c32"
                : "#999";


        slider.innerHTML = `

            <span style="
                position:absolute;
                width:24px;
                height:24px;
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


    toggle.addEventListener(
        "change",
        () => {

            data.settings.overallROIEnabled =
                toggle.checked;

            updateToggle();

        }
    );


    updateToggle();

}


/* =========================================================
   ADD ITEM BUTTONS
========================================================= */

function setupAddButtons() {

    document
        .querySelectorAll("[data-add]")
        .forEach((button) => {

            button.onclick = () => {

                const department =
                    button.dataset.add;


                if (
                    !data.verticals[
                        department
                    ]
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

}


/* =========================================================
   RENDER ITEMS
========================================================= */

function renderEditors() {

    keys.forEach((key) => {

        const box =
            $("#" + key + "Rows");


        if (!box) {
            return;
        }


        const items =
            data.verticals[key].items || [];


        box.innerHTML =
            items.map((item, index) => {

                const name =
                    item[0] ?? "";


                const allocation =
                    Number(item[1]) || 0;


                const weekROI =
                    Number(item[2]) || 0;


                const monthROI =
                    Number(item[3]) || 0;


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
                            min-width:650px;
                        "
                    >

                        <!-- PARTICULAR -->

                        <input
                            type="text"
                            value="${esc(name)}"
                            data-name="${key}"
                            data-i="${index}"
                            placeholder="Particular"
                        >


                        <!-- ALLOCATION -->

                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value="${allocation}"
                            data-pct="${key}"
                            data-i="${index}"
                            placeholder="Allocation %"
                        >


                        <!-- WEEK ROI -->

                        <input
                            type="number"
                            step="0.01"
                            value="${weekROI}"
                            data-week-roi="${key}"
                            data-i="${index}"
                            placeholder="Week ROI %"
                        >


                        <!-- MONTH ROI -->

                        <input
                            type="number"
                            step="0.01"
                            value="${monthROI}"
                            data-month-roi="${key}"
                            data-i="${index}"
                            placeholder="Month ROI %"
                        >


                        <!-- DELETE -->

                        <button
                            type="button"
                            data-delete="${key}"
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


    setupNormalInputs();

    setupItemInputs();

}


/* =========================================================
   NORMAL DATA INPUTS
========================================================= */

function setupNormalInputs() {

    document
        .querySelectorAll("[data-path]")
        .forEach((element) => {

            const path =
                element.dataset.path;


            const value =
                get(data, path);


            if (
                element.type === "date"
            ) {

                let dateValue =
                    String(value ?? "");


                if (
                    dateValue.includes("-")
                ) {

                    const match =
                        dateValue.match(
                            /^(\d{1,2})[-\/](\w+)[-\/](\d{4})$/
                        );


                    if (match) {

                        const day =
                            match[1].padStart(
                                2,
                                "0"
                            );


                        const monthNames = {
                            Jan: "01",
                            Feb: "02",
                            Mar: "03",
                            Apr: "04",
                            May: "05",
                            Jun: "06",
                            Jul: "07",
                            Aug: "08",
                            Sep: "09",
                            Oct: "10",
                            Nov: "11",
                            Dec: "12"
                        };


                        const month =
                            monthNames[
                                match[2]
                            ];


                        if (month) {

                            dateValue =
                                `${match[3]}-${month}-${day}`;

                        }

                    }

                }


                element.value =
                    /^\d{4}-\d{2}-\d{2}$/.test(
                        dateValue
                    )
                        ? dateValue
                        : "";

            } else {

                element.value =
                    value ?? "";

            }


            element.oninput = () => {

                let newValue =
                    element.value;


                if (
                    element.type === "number"
                ) {
                    newValue =
                        Number(
                            element.value
                        ) || 0;
                }


                if (
                    element.type === "date"
                ) {

                    data.meta.date =
                        newValue;

                } else {

                    set(
                        data,
                        path,
                        newValue
                    );

                }

            };

        });

}


/* =========================================================
   ITEM INPUTS
========================================================= */

function setupItemInputs() {


    /* -----------------------------------------
       NAME
    ----------------------------------------- */

    document
        .querySelectorAll("[data-name]")
        .forEach((element) => {

            element.oninput = () => {

                const key =
                    element.dataset.name;

                const index =
                    Number(
                        element.dataset.i
                    );


                const item =
                    data.verticals[key]
                        .items[index];


                item[0] =
                    element.value;

            };

        });


    /* -----------------------------------------
       ALLOCATION
    ----------------------------------------- */

    document
        .querySelectorAll("[data-pct]")
        .forEach((element) => {

            element.oninput = () => {

                const key =
                    element.dataset.pct;

                const index =
                    Number(
                        element.dataset.i
                    );


                const item =
                    data.verticals[key]
                        .items[index];


                item[1] =
                    Number(
                        element.value
                    ) || 0;

            };

        });


    /* -----------------------------------------
       WEEK ROI
    ----------------------------------------- */

    document
        .querySelectorAll("[data-week-roi]")
        .forEach((element) => {

            element.oninput = () => {

                const key =
                    element.dataset.weekRoi;

                const index =
                    Number(
                        element.dataset.i
                    );


                const item =
                    data.verticals[key]
                        .items[index];


                item[2] =
                    Number(
                        element.value
                    ) || 0;

            };

        });


    /* -----------------------------------------
       MONTH ROI
    ----------------------------------------- */

    document
        .querySelectorAll("[data-month-roi]")
        .forEach((element) => {

            element.oninput = () => {

                const key =
                    element.dataset.monthRoi;

                const index =
                    Number(
                        element.dataset.i
                    );


                const item =
                    data.verticals[key]
                        .items[index];


                item[3] =
                    Number(
                        element.value
                    ) || 0;

            };

        });


    /* -----------------------------------------
       DELETE
    ----------------------------------------- */

    document
        .querySelectorAll("[data-delete]")
        .forEach((button) => {

            button.onclick = () => {

                const key =
                    button.dataset.delete;


                const index =
                    Number(
                        button.dataset.i
                    );


                if (
                    !data.verticals[key]
                ) {
                    return;
                }


                data.verticals[key]
                    .items
                    .splice(index, 1);


                renderEditors();

            };

        });

}


/* =========================================================
   LOAD ADMIN
========================================================= */

async function loadAdmin() {

    const loginScreen =
        $("#loginScreen");

    const adminApp =
        $("#adminApp");


    try {

        const response =
            await fetch(
                "/api/me",
                {
                    method: "GET",
                    credentials: "same-origin",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Session check failed"
            );

        }


        const me =
            await response.json();


        if (!me.authenticated) {

            loginScreen
                .classList
                .remove("hidden");

            adminApp
                .classList
                .add("hidden");

            return;

        }


        await loadDashboardData();


    } catch (error) {

        console.error(
            "Admin load error:",
            error
        );


        loginScreen
            .classList
            .remove("hidden");

        adminApp
            .classList
            .add("hidden");

    }

}


/* =========================================================
   LOAD DASHBOARD DATA
========================================================= */

async function loadDashboardData() {

    const response =
        await fetch(
            "/api/data",
            {
                method: "GET",
                credentials: "same-origin",
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


    prepareData();


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

const loginForm =
    $("#loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const loginError =
                $("#loginError");


            const username =
                $("#username").value.trim();


            const password =
                $("#password").value;


            loginError.textContent =
                "Logging in...";


            try {

                const response =
                    await fetch(
                        "/api/login",
                        {
                            method: "POST",

                            credentials:
                                "same-origin",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    username,
                                    password
                                })
                        }
                    );


                let result = {};

                try {
                    result =
                        await response.json();
                } catch {
                    result = {};
                }


                if (!response.ok) {

                    loginError.textContent =
                        result.error ||
                        "Invalid username or password.";

                    return;

                }


                loginError.textContent =
                    "Login successful. Loading...";


                await loadDashboardData();


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                loginError.textContent =
                    "Login failed. Please refresh and try again.";

            }

        }
    );

}


/* =========================================================
   SAVE
========================================================= */

const saveButton =
    $("#saveBtn");


if (saveButton) {

    saveButton.addEventListener(
        "click",
        async () => {

            const saveMessage =
                $("#saveMessage");


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

                            credentials:
                                "same-origin",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(data)
                        }
                    );


                let result = {};

                try {

                    result =
                        await response.json();

                } catch {

                    result = {};

                }


                if (!response.ok) {

                    throw new Error(
                        result.error ||
                        "Save failed."
                    );

                }


                if (result.data) {

                    data =
                        result.data;

                    prepareData();

                }


                saveMessage.textContent =
                    "✓ Saved successfully";


                const iframe =
                    document.querySelector(
                        ".preview iframe"
                    );


                if (iframe) {

                    iframe.src =
                        iframe.src;

                }


                setTimeout(
                    () => {

                        saveMessage.textContent =
                            "";

                    },
                    4000
                );


            } catch (error) {

                console.error(
                    "Save error:",
                    error
                );


                saveMessage.textContent =
                    "✕ " +
                    (
                        error.message ||
                        "Save failed."
                    );


            } finally {

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    "Save All Changes";

            }

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

const logoutButton =
    $("#logoutBtn");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await fetch(
                    "/api/logout",
                    {
                        method: "POST",
                        credentials:
                            "same-origin"
                    }
                );

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }


            window.location.reload();

        }
    );

}


/* =========================================================
   START
========================================================= */

loadAdmin();
