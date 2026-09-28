const loginScreen = document.getElementById("loginScreen");
const adminApp = document.getElementById("adminApp");

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");

const editSections = document.getElementById("editSections");
const saveBtn = document.getElementById("saveBtn");
const saveMessage = document.getElementById("saveMessage");
const logoutBtn = document.getElementById("logoutBtn");

let dashboardData = null;


/* =========================================================
   API
========================================================= */

async function api(url, options = {}) {

    const response = await fetch(
        url,
        {
            credentials: "same-origin",
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );


    let result = {};

    try {
        result = await response.json();
    } catch (e) {
        result = {};
    }


    if (!response.ok) {

        throw new Error(
            result.error ||
            "Request failed"
        );
    }


    return result;
}


/* =========================================================
   CHECK LOGIN
========================================================= */

async function checkLogin() {

    try {

        const result =
            await api("/api/me");


        if (result.authenticated) {

            showAdmin();

            await loadData();

        } else {

            showLogin();
        }

    } catch (error) {

        showLogin();
    }
}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {

    loginScreen.classList.remove("hidden");
    adminApp.classList.add("hidden");

    usernameInput.focus();
}


/* =========================================================
   SHOW ADMIN
========================================================= */

function showAdmin() {

    loginScreen.classList.add("hidden");
    adminApp.classList.remove("hidden");
}


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
    "submit",

    async function (event) {

        event.preventDefault();

        loginError.textContent = "";

        const username =
            usernameInput.value.trim();

        const password =
            passwordInput.value;


        try {

            await api(
                "/api/login",
                {
                    method: "POST",

                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );


            passwordInput.value = "";

            showAdmin();

            await loadData();


        } catch (error) {

            loginError.textContent =
                error.message ||
                "Login failed";
        }
    }
);


/* =========================================================
   LOAD DATA
========================================================= */

async function loadData() {

    try {

        const result =
            await api("/api/data");

        dashboardData =
            normalizeData(result);

        bindBasicFields();

        buildEditors();

    } catch (error) {

        showMessage(
            error.message ||
            "Unable to load dashboard data",
            true
        );
    }
}


/* =========================================================
   NORMALIZE DATA
========================================================= */

function normalizeItem(item) {

    if (!Array.isArray(item)) {

        return [
            "New Item",
            0,
            0,
            0
        ];
    }


    return [
        String(item[0] ?? ""),
        Number(item[1]) || 0,
        Number(item[2]) || 0,
        Number(item[3]) || 0
    ];
}


function normalizeData(data) {

    const result =
        data || {};


    if (!result.meta) {
        result.meta = {};
    }


    if (!result.capital) {
        result.capital = {};
    }


    if (!result.verticals) {
        result.verticals = {};
    }


    for (const key of [
        "trading",
        "investment",
        "reserve",
        "rnd"
    ]) {

        if (!result.verticals[key]) {

            result.verticals[key] = {
                percent: 0,
                purpose: "",
                items: []
            };
        }


        const vertical =
            result.verticals[key];


        if (!Array.isArray(vertical.items)) {
            vertical.items = [];
        }


        vertical.items =
            vertical.items.map(
                normalizeItem
            );
    }


    return result;
}


/* =========================================================
   BASIC FIELDS
========================================================= */

function bindBasicFields() {

    if (!dashboardData) {
        return;
    }


    document
        .querySelectorAll("[data-path]")
        .forEach(input => {

            const value =
                getPathValue(
                    dashboardData,
                    input.dataset.path
                );


            if (
                value !== undefined &&
                value !== null
            ) {

                input.value = value;
            }
        });
}


/* =========================================================
   GET PATH
========================================================= */

function getPathValue(
    object,
    path
) {

    return path
        .split(".")
        .reduce(
            (current, key) =>
                current == null
                    ? undefined
                    : current[key],
            object
        );
}


/* =========================================================
   SET PATH
========================================================= */

function setPathValue(
    object,
    path,
    value
) {

    const parts =
        path.split(".");

    let current =
        object;


    for (
        let i = 0;
        i < parts.length - 1;
        i++
    ) {

        if (
            !current[parts[i]] ||
            typeof current[parts[i]] !== "object"
        ) {

            current[parts[i]] = {};
        }


        current =
            current[parts[i]];
    }


    current[
        parts[parts.length - 1]
    ] = value;
}


/* =========================================================
   BUILD DEPARTMENT EDITORS
========================================================= */

function buildEditors() {

    editSections.innerHTML = "";


    const departments = [
        {
            key: "trading",
            title: "Trading",
            className: "trading-box"
        },

        {
            key: "investment",
            title: "Investment",
            className: "investment-box"
        },

        {
            key: "reserve",
            title: "Reserve",
            className: "reserve-box"
        },

        {
            key: "rnd",
            title: "Research & Development",
            className: "rnd-box"
        }
    ];


    departments.forEach(
        department => {

            const vertical =
                dashboardData.verticals[
                    department.key
                ];


            const section =
                document.createElement(
                    "section"
                );

            section.className =
                department.className;


            section.innerHTML = `
                <h3>
                    ${escapeHTML(department.title)}
                    Items
                </h3>

                <div
                    class="admin-item-header"
                    style="
                        display:grid;
                        grid-template-columns:
                            minmax(120px,1fr)
                            75px
                            75px
                            75px
                            30px;
                        gap:5px;
                        font-size:10px;
                        font-weight:bold;
                        margin-bottom:5px;
                    "
                >
                    <div>Particular</div>
                    <div>Allocation %</div>
                    <div>Last Week ROI %</div>
                    <div>Last Month ROI %</div>
                    <div></div>
                </div>

                <div
                    class="items-editor"
                    data-department="${department.key}"
                ></div>

                <button
                    type="button"
                    class="add-row"
                    data-add="${department.key}"
                >
                    + Add Item
                </button>

                <label>
                    Purpose
                    <textarea
                        rows="3"
                        data-purpose="${department.key}"
                    >${escapeHTML(vertical.purpose || "")}</textarea>
                </label>
            `;


            editSections.appendChild(
                section
            );


            renderItems(
                department.key
            );


            const purpose =
                section.querySelector(
                    `[data-purpose="${department.key}"]`
                );


            purpose.addEventListener(
                "input",
                function () {

                    dashboardData
                        .verticals[
                            department.key
                        ]
                        .purpose =
                        purpose.value;
                }
            );
        }
    );


    document
        .querySelectorAll("[data-add]")
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const key =
                        button.dataset.add;


                    dashboardData
                        .verticals[key]
                        .items
                        .push([
                            "New Item",
                            0,
                            0,
                            0
                        ]);


                    renderItems(key);
                }
            );
        });
}


/* =========================================================
   RENDER ITEMS
========================================================= */

function renderItems(key) {

    const container =
        document.querySelector(
            `.items-editor[data-department="${key}"]`
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const items =
        dashboardData
            .verticals[key]
            .items;


    items.forEach(
        (item, index) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "item-row";


            row.innerHTML = `

                <input
                    type="text"
                    placeholder="Particular"
                    value="${escapeAttribute(item[0])}"
                    data-name
                >

                <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value="${item[1]}"
                    data-allocation
                >

                <input
                    type="number"
                    step="0.01"
                    value="${item[2]}"
                    data-week-roi
                >

                <input
                    type="number"
                    step="0.01"
                    value="${item[3]}"
                    data-month-roi
                >

                <button
                    type="button"
                    title="Delete item"
                    data-delete
                >
                    ×
                </button>
            `;


            const nameInput =
                row.querySelector(
                    "[data-name]"
                );

            const allocationInput =
                row.querySelector(
                    "[data-allocation]"
                );

            const weekROIInput =
                row.querySelector(
                    "[data-week-roi]"
                );

            const monthROIInput =
                row.querySelector(
                    "[data-month-roi]"
                );

            const deleteButton =
                row.querySelector(
                    "[data-delete]"
                );


            /* ---------------------------------------------
               NAME
            --------------------------------------------- */

            nameInput.addEventListener(
                "input",
                function () {

                    items[index][0] =
                        nameInput.value;
                }
            );


            /* ---------------------------------------------
               ALLOCATION
            --------------------------------------------- */

            allocationInput.addEventListener(
                "input",
                function () {

                    items[index][1] =
                        numberValue(
                            allocationInput.value
                        );
                }
            );


            /* ---------------------------------------------
               LAST WEEK ROI
            --------------------------------------------- */

            weekROIInput.addEventListener(
                "input",
                function () {

                    items[index][2] =
                        numberValue(
                            weekROIInput.value
                        );
                }
            );


            /* ---------------------------------------------
               LAST MONTH ROI
            --------------------------------------------- */

            monthROIInput.addEventListener(
                "input",
                function () {

                    items[index][3] =
                        numberValue(
                            monthROIInput.value
                        );
                }
            );


            /* ---------------------------------------------
               DELETE
            --------------------------------------------- */

            deleteButton.addEventListener(
                "click",
                function () {

                    items.splice(
                        index,
                        1
                    );


                    renderItems(key);
                }
            );


            container.appendChild(row);
        }
    );
}


/* =========================================================
   SAVE
========================================================= */

saveBtn.addEventListener(
    "click",

    async function () {

        saveBtn.disabled = true;

        saveBtn.textContent =
            "Saving...";

        saveMessage.textContent = "";


        try {

            collectBasicFields();


            dashboardData =
                normalizeData(
                    dashboardData
                );


            await api(
                "/api/data",
                {
                    method: "PUT",

                    body:
                        JSON.stringify(
                            dashboardData
                        )
                }
            );


            showMessage(
                "✓ Changes saved successfully"
            );


            /*
               Refresh the preview iframe
               after successful save.
            */

            const iframe =
                document.querySelector(
                    ".preview iframe"
                );


            if (iframe) {

                iframe.src =
                    iframe.src;
            }


        } catch (error) {

            showMessage(
                error.message ||
                "Save failed",
                true
            );

        } finally {

            saveBtn.disabled = false;

            saveBtn.textContent =
                "Save All Changes";
        }
    }
);


/* =========================================================
   COLLECT BASIC FIELDS
========================================================= */

function collectBasicFields() {

    document
        .querySelectorAll("[data-path]")
        .forEach(input => {

            let value =
                input.value;


            if (
                input.type === "number"
            ) {

                value =
                    numberValue(value);
            }


            setPathValue(
                dashboardData,
                input.dataset.path,
                value
            );
        });
}


/* =========================================================
   LOGOUT
========================================================= */

logoutBtn.addEventListener(
    "click",

    async function () {

        try {

            await api(
                "/api/logout",
                {
                    method: "POST"
                }
            );

        } catch (error) {
            // Continue to login screen.
        }


        dashboardData = null;

        showLogin();

        usernameInput.value = "";
        passwordInput.value = "";

        loginError.textContent = "";
    }
);


/* =========================================================
   NUMBER
========================================================= */

function numberValue(value) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    message,
    isError = false
) {

    saveMessage.textContent =
        message;

    saveMessage.style.color =
        isError
            ? "#ff9d9d"
            : "#a8f0b8";


    clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        setTimeout(
            () => {

                saveMessage.textContent =
                    "";

            },
            5000
        );
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


function escapeAttribute(value) {

    return escapeHTML(value);
}


/* =========================================================
   START
========================================================= */

checkLogin();
