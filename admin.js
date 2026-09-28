let data = null;

const $ = (selector) => document.querySelector(selector);

const keys = ["trading", "investment", "reserve", "rnd"];

const labels = {
    trading: "Trading",
    investment: "Investment",
    reserve: "Reserve",
    rnd: "Research & Development"
};

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
    return path.split(".").reduce(
        (current, key) => current?.[key],
        obj
    );
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
   PREPARE DATA
========================================================= */

function prepareData() {

    if (!data || typeof data !== "object") {
        data = {};
    }

    if (!data.settings) {
        data.settings = {};
    }

    if (typeof data.settings.overallROIEnabled !== "boolean") {
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

        if (!Array.isArray(data.verticals[key].items)) {
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

    const editSections = $("#editSections");

    if (!editSections) {
        console.error("editSections not found");
        return;
    }

    editSections.innerHTML = `

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
                        table and pie chart.
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


        ${keys.map((key) => `

            <section>

                <h3>${labels[key]}</h3>

                <div style="
                    overflow-x:auto;
                ">

                    <div style="
                        min-width:700px;
                    ">

                        <div style="
                            display:grid;
                            grid-template-columns:
                                1.5fr
                                .7fr
                                .8fr
                                .8fr
                                45px;
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

                        <div id="${key}Rows"></div>

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

    setupOverallToggle();
    setupAddButtons();
    renderEditors();
}


/* =========================================================
   OVERALL ROI SWITCH
========================================================= */

function setupOverallToggle() {

    const toggle = $("#overallROIEnabled");
    const slider = $("#overallROISlider");

    if (!toggle || !slider) {
        return;
    }

    function updateToggle() {

        const enabled =
            data.settings.overallROIEnabled === true;

        toggle.checked = enabled;

        slider.style.background =
            enabled ? "#075c32" : "#999";

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
                box-shadow:0 1px 4px rgba(0,0,0,.25);
            "></span>
        `;
    }

    toggle.onchange = () => {

        data.settings.overallROIEnabled =
            toggle.checked;

        updateToggle();
    };

    updateToggle();
}


/* =========================================================
   ADD ITEM
========================================================= */

function setupAddButtons() {

    document
        .querySelectorAll("[data-add]")
        .forEach((button) => {

            button.onclick = () => {

                const department =
                    button.dataset.add;

                if (!data.verticals[department]) {
                    return;
                }

                data.verticals[department]
                    .items
                    .push([
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

        const box = $("#" + key + "Rows");

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
                        style="
                            display:grid;
                            grid-template-columns:
                                1.5fr
                                .7fr
                                .8fr
                                .8fr
                                45px;
                            gap:8px;
                            align-items:center;
                            margin-bottom:8px;
                            min-width:700px;
                        "
                    >

                        <input
                            type="text"
                            value="${esc(name)}"
                            data-name="${key}"
                            data-index="${index}"
                            placeholder="Particular"
                        >

                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value="${allocation}"
                            data-allocation="${key}"
                            data-index="${index}"
                            placeholder="Allocation %"
                        >

                        <input
                            type="number"
                            step="0.01"
                            value="${weekROI}"
                            data-week="${key}"
                            data-index="${index}"
                            placeholder="Week ROI %"
                        >

                        <input
                            type="number"
                            step="0.01"
                            value="${monthROI}"
                            data-month="${key}"
                            data-index="${index}"
                            placeholder="Month ROI %"
                        >

                        <button
                            type="button"
                            data-delete="${key}"
                            data-index="${index}"
                            style="
                                background:#d32f2f;
                                color:white;
                                border:none;
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

    });

    setupNormalInputs();
    setupItemInputs();
}


/* =========================================================
   NORMAL INPUTS
========================================================= */

function setupNormalInputs() {

    document
        .querySelectorAll("[data-path]")
        .forEach((element) => {

            const path =
                element.dataset.path;

            const value =
                get(data, path);

            element.value =
                value ?? "";

            element.oninput = () => {

                let newValue =
                    element.value;

                if (element.type === "number") {
                    newValue =
                        Number(element.value) || 0;
                }

                set(
                    data,
                    path,
                    newValue
                );
            };
        });
}


/* =========================================================
   ITEM INPUTS
========================================================= */

function setupItemInputs() {

    document
        .querySelectorAll("[data-name]")
        .forEach((element) => {

            element.oninput = () => {

                const key =
                    element.dataset.name;

                const index =
                    Number(element.dataset.index);

                data.verticals[key]
                    .items[index][0] =
                    element.value;
            };
        });


    document
        .querySelectorAll("[data-allocation]")
        .forEach((element) => {

            element.oninput = () => {

                const key =
                    element.dataset.allocation;

                const index =
                    Number(element.dataset.index);

                data.verticals[key]
                    .items[index][1] =
                    Number(element.value) || 0;
            };
        });


    document
        .querySelectorAll("[data-week]")
        .forEach((element) => {

            element.oninput = () => {

                const key =
                    element.dataset.week;

                const index =
                    Number(element.dataset.index);

                data.verticals[key]
                    .items[index][2] =
                    Number(element.value) || 0;
            };
        });


    document
        .querySelectorAll("[data-month]")
        .forEach((element) => {

            element.oninput = () => {

                const key =
                    element.dataset.month;

                const index =
                    Number(element.dataset.index);

                data.verticals[key]
                    .items[index][3] =
                    Number(element.value) || 0;
            };
        });


    document
        .querySelectorAll("[data-delete]")
        .forEach((button) => {

            button.onclick = () => {

                const key =
                    button.dataset.delete;

                const index =
                    Number(button.dataset.index);

                data.verticals[key]
                    .items
                    .splice(index, 1);

                renderEditors();
            };
        });
}


/* =========================================================
   LOAD DATA
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

    const loginScreen =
        $("#loginScreen");

    const adminApp =
        $("#adminApp");

    if (loginScreen) {
        loginScreen.classList.add("hidden");
    }

    if (adminApp) {
        adminApp.classList.remove("hidden");
    }

    buildEditors();
}


/* =========================================================
   CHECK LOGIN
========================================================= */

async function checkLogin() {

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

        const result =
            await response.json();

        if (result.authenticated) {

            await loadDashboardData();

        } else {

            if (loginScreen) {
                loginScreen.classList.remove("hidden");
            }

            if (adminApp) {
                adminApp.classList.add("hidden");
            }
        }

    } catch (error) {

        console.error(
            "Session error:",
            error
        );

        if (loginScreen) {
            loginScreen.classList.remove("hidden");
        }

        if (adminApp) {
            adminApp.classList.add("hidden");
        }
    }
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

            if (loginError) {
                loginError.textContent =
                    "Logging in...";
            }

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

                    if (loginError) {
                        loginError.textContent =
                            result.error ||
                            "Invalid username or password.";
                    }

                    return;
                }

                if (loginError) {
                    loginError.textContent =
                        "Login successful...";
                }

                await loadDashboardData();

            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                if (loginError) {
                    loginError.textContent =
                        "Login failed. Please try again.";
                }
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

                if (saveMessage) {
                    saveMessage.textContent =
                        "✓ Saved successfully";
                }

                setTimeout(() => {

                    if (saveMessage) {
                        saveMessage.textContent =
                            "";
                    }

                }, 4000);

            } catch (error) {

                console.error(
                    "Save error:",
                    error
                );

                if (saveMessage) {
                    saveMessage.textContent =
                        "✕ " +
                        (
                            error.message ||
                            "Save failed."
                        );
                }

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

checkLogin();
