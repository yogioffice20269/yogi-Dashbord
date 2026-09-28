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
    String(s ?? "").replace(
        /[&<>"']/g,
        c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c])
    );


/* =====================================================
   GET DATA
===================================================== */

function get(o, p) {

    return p
        .split(".")
        .reduce(
            (a, k) => a?.[k],
            o
        );
}


/* =====================================================
   SET DATA
===================================================== */

function set(o, p, v) {

    const a = p.split(".");

    const last = a.pop();

    const target = a.reduce(
        (x, k) => x[k],
        o
    );

    target[last] = v;
}


/* =====================================================
   BIND GENERAL INPUTS
===================================================== */

function bind() {

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
}


/* =====================================================
   BUILD ADMIN SECTIONS
===================================================== */

function buildEditors() {

    $("#editSections").innerHTML = keys
        .map(k => {

            return `

                <section>

                    <h3>
                        ${labels[k]}
                    </h3>


                    <div
                        id="${k}Rows"
                    ></div>


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

            `;

        })
        .join("");


    document
        .querySelectorAll("[data-add]")
        .forEach(button => {

            button.onclick = () => {

                const department =
                    button.dataset.add;


                /*
                 * New item structure:
                 *
                 * [Particular,
                 *  Allocation %,
                 *  Last Week ROI %,
                 *  Last Month ROI %]
                 */

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


/* =====================================================
   RENDER ADMIN ITEMS
===================================================== */

function renderEditors() {

    keys.forEach(k => {

        const box =
            $("#" + k + "Rows");


        box.innerHTML =
            data.verticals[k].items
                .map((x, i) => {

                    /*
                     * Support old items that only have:
                     *
                     * [name, percentage]
                     *
                     * by automatically creating ROI values.
                     */

                    if (
                        x[2] === undefined
                    ) {
                        x[2] = 0;
                    }


                    if (
                        x[3] === undefined
                    ) {
                        x[3] = 0;
                    }


                    return `

                        <div
                            class="item-row roi-admin-row"
                        >

                            <!-- PARTICULAR -->

                            <input
                                type="text"
                                value="${esc(x[0])}"
                                placeholder="Particular"
                                data-name="${k}"
                                data-i="${i}"
                            >


                            <!-- ALLOCATION % -->

                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value="${Number(x[1] || 0)}"
                                placeholder="Allocation %"
                                title="Allocation %"
                                data-pct="${k}"
                                data-i="${i}"
                            >


                            <!-- LAST WEEK ROI % -->

                            <input
                                type="number"
                                min="-100"
                                max="1000"
                                step="0.01"
                                value="${Number(x[2] || 0)}"
                                placeholder="Last Week ROI %"
                                title="Last Week ROI %"
                                data-week-roi="${k}"
                                data-i="${i}"
                            >


                            <!-- LAST MONTH ROI % -->

                            <input
                                type="number"
                                min="-100"
                                max="1000"
                                step="0.01"
                                value="${Number(x[3] || 0)}"
                                placeholder="Last Month ROI %"
                                title="Last Month ROI %"
                                data-month-roi="${k}"
                                data-i="${i}"
                            >


                            <!-- DELETE -->

                            <button
                                type="button"
                                data-del="${k}"
                                data-i="${i}"
                                title="Delete item"
                            >
                                ×
                            </button>

                        </div>

                    `;

                })
                .join("");

    });


    bind();


    /* =================================================
       PARTICULAR NAME
    ================================================= */

    document
        .querySelectorAll("[data-name]")
        .forEach(input => {

            input.oninput = () => {

                const k =
                    input.dataset.name;

                const i =
                    Number(input.dataset.i);

                data.verticals[k]
                    .items[i][0] =
                    input.value;

            };

        });


    /* =================================================
       ALLOCATION %
    ================================================= */

    document
        .querySelectorAll("[data-pct]")
        .forEach(input => {

            input.oninput = () => {

                const k =
                    input.dataset.pct;

                const i =
                    Number(input.dataset.i);

                data.verticals[k]
                    .items[i][1] =
                    Number(input.value);

            };

        });


    /* =================================================
       LAST WEEK ROI %
    ================================================= */

    document
        .querySelectorAll("[data-week-roi]")
        .forEach(input => {

            input.oninput = () => {

                const k =
                    input.dataset.weekRoi;

                const i =
                    Number(input.dataset.i);

                data.verticals[k]
                    .items[i][2] =
                    Number(input.value);

            };

        });


    /* =================================================
       LAST MONTH ROI %
    ================================================= */

    document
        .querySelectorAll("[data-month-roi]")
        .forEach(input => {

            input.oninput = () => {

                const k =
                    input.dataset.monthRoi;

                const i =
                    Number(input.dataset.i);

                data.verticals[k]
                    .items[i][3] =
                    Number(input.value);

            };

        });


    /* =================================================
       DELETE ITEM
    ================================================= */

    document
        .querySelectorAll("[data-del]")
        .forEach(button => {

            button.onclick = () => {

                const k =
                    button.dataset.del;

                const i =
                    Number(button.dataset.i);


                data.verticals[k]
                    .items
                    .splice(i, 1);


                renderEditors();

            };

        });
}


/* =====================================================
   LOGIN / LOAD
===================================================== */

async function load() {

    try {

        let r =
            await fetch("/api/me");

        const me =
            await r.json();


        if (!me.authenticated) {

            $("#loginScreen")
                .classList
                .remove("hidden");

            return;
        }


        r =
            await fetch("/api/data");

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

    catch (error) {

        console.error(error);

        $("#loginError").textContent =
            "Unable to load admin panel.";

    }
}


/* =====================================================
   LOGIN
===================================================== */

$("#loginForm").onsubmit =
    async e => {

        e.preventDefault();


        const r =
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

        }

        else {

            $("#loginError")
                .textContent =
                "Invalid username or password.";

        }

    };


/* =====================================================
   SAVE
===================================================== */

$("#saveBtn").onclick =
    async () => {

        const button =
            $("#saveBtn");


        button.disabled = true;

        button.textContent =
            "Saving...";


        try {

            const r =
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
                    document
                        .querySelector(
                            ".preview iframe"
                        );


                if (iframe) {

                    iframe.contentWindow
                        .location
                        .reload();

                }

            }

        }

        catch (error) {

            console.error(error);

            $("#saveMessage")
                .textContent =
                "Save failed";

        }


        button.disabled = false;

        button.textContent =
            "Save Changes";

    };


/* =====================================================
   LOGOUT
===================================================== */

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


/* =====================================================
   START
===================================================== */

load();
