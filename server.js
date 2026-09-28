const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

const DATA_DIR =
    process.env.DATA_DIR || path.join(__dirname, "data");

const DATA_FILE =
    path.join(DATA_DIR, "dashboard.json");

const SESSION_TTL =
    8 * 60 * 60 * 1000;

const sessions = new Map();

/* =========================================================
   CREATE DATA DIRECTORY
========================================================= */

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/* =========================================================
   DEFAULT DATA
========================================================= */

const defaultData = {
    meta: {
        organization: "YOGI GROWING TOGETHER LLP",
        date: "24-Sep-2024",
        version: "V1.0",
        preparedBy: "Team Yogi"
    },

    capital: {
        total: 10000000
    },

    verticals: {

        trading: {
            percent: 40,
            purpose:
                "Short to Medium Term Trading Opportunities",

            items: [
                ["Index", 5, 0, 0],
                ["Equity F&O", 15, 0, 0],
                ["Equity (Intraday)", 10, 0, 0],
                ["Commodity", 5, 0, 0],
                ["Forex", 5, 0, 0]
            ]
        },

        investment: {
            percent: 40,
            purpose:
                "Long Term Wealth Creation & Diversification",

            items: [
                ["Equity (CNC)", 20, 0, 0],
                ["Mutual Fund", 10, 0, 0],
                ["Gold, Silver", 10, 0, 0]
            ]
        },

        reserve: {
            percent: 10,
            purpose:
                "Maintain Liquidity & Handle Unplanned Expenses",

            items: [
                ["Liquidity Buffer", 5, 0, 0],
                ["Fixed Expenses", 5, 0, 0]
            ]
        },

        rnd: {
            percent: 10,
            purpose:
                "Research, Innovation & Trading Edge Development",

            items: [
                ["Algo Development", 2, 0, 0],
                ["Strategy Testing", 2, 0, 0],
                ["Model Development", 2, 0, 0],
                ["Data/Software", 2, 0, 0],
                ["Backtesting", 2, 0, 0]
            ]
        }
    }
};

/* =========================================================
   READ / WRITE DATA
========================================================= */

function readData() {

    try {

        const raw =
            fs.readFileSync(DATA_FILE, "utf8");

        const parsed =
            JSON.parse(raw);

        return normalizeData(parsed);

    } catch (error) {

        return normalizeData(defaultData);
    }
}


function writeData(data) {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}


/* =========================================================
   NORMALIZE OLD + NEW DATA
========================================================= */

function normalizeItem(item) {

    /*
       Old format:

       ["Index", 5]

       New format:

       ["Index", 5, 2.5, 5]
    */

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

    const source =
        data && typeof data === "object"
            ? data
            : defaultData;

    const result = {
         settings: {
        overallROIEnabled:
            source.settings?.overallROIEnabled !== false
    },

        meta: {
            organization:
                String(
                    source.meta?.organization ??
                    defaultData.meta.organization
                ),

            date:
                String(
                    source.meta?.date ??
                    defaultData.meta.date
                ),

            version:
                String(
                    source.meta?.version ??
                    defaultData.meta.version
                ),

            preparedBy:
                String(
                    source.meta?.preparedBy ??
                    defaultData.meta.preparedBy
                )
        },

        capital: {
            total:
                Number(source.capital?.total) || 0
        },

        verticals: {}
    };

/* -----------------------------------------------------
   DASHBOARD SETTINGS
----------------------------------------------------- */

allowed.settings.overallROIEnabled =
    data.settings?.overallROIEnabled !== false;

    for (const key of [
        "trading",
        "investment",
        "reserve",
        "rnd"
    ]) {

        const vertical =
            source.verticals?.[key] || {};

        result.verticals[key] = {

            percent:
                Number(vertical.percent) || 0,

            purpose:
                String(vertical.purpose ?? ""),

            items:
                Array.isArray(vertical.items)
                    ? vertical.items.map(normalizeItem)
                    : []
        };
    }

    return result;
}


/* =========================================================
   CLEAN + VALIDATE DATA
========================================================= */

function cleanData(data) {

    if (
        !data ||
        typeof data !== "object"
    ) {
        throw new Error("Invalid data");
    }


    const allowed = {

        meta: {},

        capital: {},

        verticals: {}
    };


    /* -----------------------------------------------------
       META
    ----------------------------------------------------- */

    allowed.meta.organization =
        String(
            data.meta?.organization ?? ""
        ).slice(0, 200);


    allowed.meta.date =
        String(
            data.meta?.date ?? ""
        ).slice(0, 100);


    allowed.meta.version =
        String(
            data.meta?.version ?? ""
        ).slice(0, 100);


    allowed.meta.preparedBy =
        String(
            data.meta?.preparedBy ?? ""
        ).slice(0, 200);


    /* -----------------------------------------------------
       CAPITAL
    ----------------------------------------------------- */

    let totalCapital =
        Number(data.capital?.total);

    if (!Number.isFinite(totalCapital)) {
        totalCapital = 0;
    }

    totalCapital =
        Math.max(
            0,
            Math.min(
                1000000000000,
                totalCapital
            )
        );

    allowed.capital.total =
        totalCapital;


    /* -----------------------------------------------------
       VERTICALS
    ----------------------------------------------------- */

    for (const key of [
        "trading",
        "investment",
        "reserve",
        "rnd"
    ]) {

        const vertical =
            data.verticals?.[key] || {};


        let percent =
            Number(vertical.percent);

        if (!Number.isFinite(percent)) {
            percent = 0;
        }

        percent =
            Math.max(
                0,
                Math.min(100, percent)
            );


        const purpose =
            String(
                vertical.purpose ?? ""
            ).slice(0, 500);


        let items = [];


        if (Array.isArray(vertical.items)) {

            items =
                vertical.items
                    .slice(0, 50)
                    .map(item => {

                        const name =
                            String(
                                item?.[0] ?? ""
                            )
                            .slice(0, 100);


                        let allocation =
                            Number(item?.[1]);

                        let weekROI =
                            Number(item?.[2]);

                        let monthROI =
                            Number(item?.[3]);


                        if (
                            !Number.isFinite(
                                allocation
                            )
                        ) {
                            allocation = 0;
                        }


                        if (
                            !Number.isFinite(
                                weekROI
                            )
                        ) {
                            weekROI = 0;
                        }


                        if (
                            !Number.isFinite(
                                monthROI
                            )
                        ) {
                            monthROI = 0;
                        }


                        allocation =
                            Math.max(
                                0,
                                Math.min(
                                    100,
                                    allocation
                                )
                            );


                        /*
                           ROI can be positive
                           or negative.

                           Example:

                           5
                           -2.5
                           10
                        */

                        weekROI =
                            Math.max(
                                -100000,
                                Math.min(
                                    100000,
                                    weekROI
                                )
                            );


                        monthROI =
                            Math.max(
                                -100000,
                                Math.min(
                                    100000,
                                    monthROI
                                )
                            );


                        return [
                            name,
                            allocation,
                            weekROI,
                            monthROI
                        ];
                    });
        }


        allowed.verticals[key] = {

            percent,

            purpose,

            items
        };
    }


    return allowed;
}


/* =========================================================
   SECURITY
========================================================= */

app.disable("x-powered-by");

app.use(
    express.json({
        limit: "100kb"
    })
);


/* =========================================================
   ADMIN CREDENTIALS
========================================================= */

const adminUser =
    process.env.ADMIN_USERNAME || "admin";

const adminPassword =
    process.env.ADMIN_PASSWORD;


if (!adminPassword) {

    console.warn(
        "WARNING: Set ADMIN_PASSWORD in the environment before production use."
    );
}


/* =========================================================
   AUTHENTICATION
========================================================= */

function getSessionToken(req) {

    const cookie =
        req.headers.cookie || "";

    const match =
        cookie.match(
            /(?:^|;\s*)yogi_admin=([^;]+)/
        );

    return match
        ? match[1]
        : null;
}


function auth(req, res, next) {

    const token =
        getSessionToken(req);

    const session =
        token
            ? sessions.get(token)
            : null;


    if (
        !session ||
        session.expires < Date.now()
    ) {

        if (token) {
            sessions.delete(token);
        }

        return res
            .status(401)
            .json({
                error: "Unauthorized"
            });
    }


    req.admin = true;

    next();
}


/* =========================================================
   COOKIE
========================================================= */

function setCookie(
    res,
    token
) {

    res.setHeader(
        "Set-Cookie",

        `yogi_admin=${token}; ` +
        `HttpOnly; ` +
        `Secure; ` +
        `SameSite=Strict; ` +
        `Path=/; ` +
        `Max-Age=${SESSION_TTL / 1000}`
    );
}


/* =========================================================
   LOGIN
========================================================= */

app.post(
    "/api/login",

    async (req, res) => {

        const {
            username,
            password
        } = req.body || {};


        if (
            !adminPassword ||
            username !== adminUser ||
            !password ||
            password !== adminPassword
        ) {

            return res
                .status(401)
                .json({
                    error:
                        "Invalid credentials"
                });
        }


        const token =
            crypto.randomBytes(32)
                .toString("hex");


        sessions.set(
            token,
            {
                expires:
                    Date.now() +
                    SESSION_TTL
            }
        );


        setCookie(
            res,
            token
        );


        res.json({
            ok: true
        });
    }
);


/* =========================================================
   LOGOUT
========================================================= */

app.post(
    "/api/logout",

    auth,

    (req, res) => {

        const token =
            getSessionToken(req);


        if (token) {
            sessions.delete(token);
        }


        res.setHeader(
            "Set-Cookie",

            "yogi_admin=; " +
            "HttpOnly; " +
            "Secure; " +
            "SameSite=Strict; " +
            "Path=/; " +
            "Max-Age=0"
        );


        res.json({
            ok: true
        });
    }
);


/* =========================================================
   CHECK LOGIN
========================================================= */

app.get(
    "/api/me",

    (req, res) => {

        const token =
            getSessionToken(req);

        const session =
            token
                ? sessions.get(token)
                : null;


        res.json({

            authenticated:
                !!(
                    session &&
                    session.expires >
                    Date.now()
                )
        });
    }
);


/* =========================================================
   PUBLIC DATA
========================================================= */

app.get(
    "/api/data",

    (req, res) => {

        const data =
            readData();

        res.json(data);
    }
);


/* =========================================================
   SAVE DASHBOARD DATA
   ADMIN ONLY
========================================================= */

app.put(
    "/api/data",

    auth,

    (req, res) => {

        try {

            const cleaned =
                cleanData(req.body);


            writeData(cleaned);


            res.json({
                ok: true,
                data: cleaned
            });

        } catch (error) {

            console.error(
                "Save error:",
                error
            );


            res
                .status(400)
                .json({
                    error:
                        error.message ||
                        "Unable to save data"
                });
        }
    }
);


/* =========================================================
   PUBLIC DASHBOARD
========================================================= */

app.get(
    "/",

    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public.html"
            )
        );
    }
);


/* =========================================================
   ADMIN PANEL
========================================================= */

app.get(
    "/admin",

    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "admin.html"
            )
        );
    }
);


/* =========================================================
   STATIC FILES
========================================================= */

app.use(
    express.static(
        __dirname,
        {
            index: false
        }
    )
);


/* =========================================================
   START SERVER
========================================================= */

app.listen(
    PORT,

    () => {

        console.log(
            `Fund Allocation System running on port ${PORT}`
        );
    }
);
