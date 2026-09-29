const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

const DATA_DIR =
  process.env.DATA_DIR ||
  path.join(__dirname, "data");

const DATA_FILE =
  path.join(DATA_DIR, "dashboard.json");

const SESSION_TTL =
  8 * 60 * 60 * 1000;

const sessions = new Map();

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, {
    recursive: true
  });
}


/* =========================================================
   DEFAULT DATA
========================================================= */

const defaultPerformance = {
  daily: {
    pnl: 0,
    roi: 0,
    deployed: 0,
    available: 0,
    maxDrawdown: 0,
    maxDrawdownAmount: 0
  },

  mtd: {
    pnl: 0,
    roi: 0,
    deployed: 0,
    available: 0,
    maxDrawdown: 0,
    maxDrawdownAmount: 0
  },

  qtd: {
    pnl: 0,
    roi: 0,
    deployed: 0,
    available: 0,
    maxDrawdown: 0,
    maxDrawdownAmount: 0
  },

  ytd: {
    pnl: 0,
    roi: 0,
    deployed: 0,
    available: 0,
    maxDrawdown: 0,
    maxDrawdownAmount: 0
  }
};


const defaultRisk = {
  riskLimit: 0,
  currentExposure: 0,
  liquidity: 0,
  concentration: 0,
  benchmark: "",
  notes: ""
};


const defaultData = {

  settings: {
    overallROIEnabled: true
  },

  meta: {
    organization:
      "YOGI GROWING TOGETHER LLP",

    date:
      "24-Sep-2024",

    version:
      "V1.0",

    preparedBy:
      "Team Yogi"
  },

  capital: {
    total: 10000000
  },

  performance:
    defaultPerformance,

  risk:
    defaultRisk,

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
   NORMALIZE ITEM
========================================================= */

function normalizeItem(x) {

  if (!Array.isArray(x)) {

    return [
      "New Item",
      0,
      0,
      0
    ];

  }

  return [
    String(x[0] ?? ""),
    Number(x[1]) || 0,
    Number(x[2]) || 0,
    Number(x[3]) || 0
  ];

}


/* =========================================================
   NORMALIZE PERFORMANCE
========================================================= */

function normalizePerformance(p) {

  const source =
    p && typeof p === "object"
      ? p
      : {};

  const output = {};

  for (const period of [
    "daily",
    "mtd",
    "qtd",
    "ytd"
  ]) {

    const item =
      source[period] || {};

    output[period] = {

      pnl:
        Number(item.pnl) || 0,

      roi:
        Number(item.roi) || 0,

      deployed:
        Number(item.deployed) || 0,

      available:
        Number(item.available) || 0,

      maxDrawdown:
        Number(item.maxDrawdown) || 0,

      maxDrawdownAmount:
        Number(item.maxDrawdownAmount) || 0

    };

  }

  return output;

}


/* =========================================================
   NORMALIZE RISK
========================================================= */

function normalizeRisk(r) {

  const source =
    r && typeof r === "object"
      ? r
      : {};

  return {

    riskLimit:
      Number(source.riskLimit) || 0,

    currentExposure:
      Number(source.currentExposure) || 0,

    liquidity:
      Number(source.liquidity) || 0,

    concentration:
      Number(source.concentration) || 0,

    benchmark:
      String(
        source.benchmark ?? ""
      ),

    notes:
      String(
        source.notes ?? ""
      )

  };

}


/* =========================================================
   NORMALIZE DATA
========================================================= */

function normalizeData(data) {

  const s =
    data &&
    typeof data === "object"
      ? data
      : defaultData;

  const out = {

    settings: {

      overallROIEnabled:
        s.settings?.overallROIEnabled !== false

    },

    meta: {

      organization:
        String(
          s.meta?.organization ??
          defaultData.meta.organization
        ),

      date:
        String(
          s.meta?.date ??
          defaultData.meta.date
        ),

      version:
        String(
          s.meta?.version ??
          defaultData.meta.version
        ),

      preparedBy:
        String(
          s.meta?.preparedBy ??
          defaultData.meta.preparedBy
        )

    },

    capital: {

      total:
        Number(
          s.capital?.total
        ) || 0

    },

    performance:
      normalizePerformance(
        s.performance
      ),

    risk:
      normalizeRisk(
        s.risk
      ),

    verticals: {}

  };


  for (
    const k of [
      "trading",
      "investment",
      "reserve",
      "rnd"
    ]
  ) {

    const v =
      s.verticals?.[k] || {};

    out.verticals[k] = {

      percent:
        Number(v.percent) || 0,

      purpose:
        String(
          v.purpose ?? ""
        ),

      items:
        Array.isArray(v.items)
          ? v.items.map(
              normalizeItem
            )
          : []

    };

  }

  return out;

}


/* =========================================================
   READ / WRITE
========================================================= */

function readData() {

  try {

    return normalizeData(
      JSON.parse(
        fs.readFileSync(
          DATA_FILE,
          "utf8"
        )
      )
    );

  } catch {

    return normalizeData(
      defaultData
    );

  }

}


function writeData(d) {

  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      d,
      null,
      2
    ),
    "utf8"
  );

}


/* =========================================================
   CLEAN DATA
========================================================= */

function cleanData(data) {

  if (
    !data ||
    typeof data !== "object"
  ) {

    throw new Error(
      "Invalid data"
    );

  }

  const out =
    normalizeData(data);


  out.meta.organization =
    String(
      out.meta.organization
    ).slice(0, 200);

  out.meta.date =
    String(
      out.meta.date
    ).slice(0, 100);

  out.meta.version =
    String(
      out.meta.version
    ).slice(0, 100);

  out.meta.preparedBy =
    String(
      out.meta.preparedBy
    ).slice(0, 200);


  out.capital.total =
    Math.max(
      0,
      Math.min(
        1e12,
        Number(
          out.capital.total
        ) || 0
      )
    );


  /* Performance limits */

  for (
    const period of [
      "daily",
      "mtd",
      "qtd",
      "ytd"
    ]
  ) {

    const p =
      out.performance[
        period
      ];

    p.pnl =
      Math.max(
        -1e12,
        Math.min(
          1e12,
          Number(p.pnl) || 0
        )
      );

    p.roi =
      Math.max(
        -100000,
        Math.min(
          100000,
          Number(p.roi) || 0
        )
      );

    p.deployed =
      Math.max(
        0,
        Math.min(
          1e12,
          Number(p.deployed) || 0
        )
      );

    p.available =
      Math.max(
        0,
        Math.min(
          1e12,
          Number(p.available) || 0
        )
      );

    p.maxDrawdown =
      Math.max(
        -100000,
        Math.min(
          100000,
          Number(p.maxDrawdown) || 0
        )
      );

    p.maxDrawdownAmount =
      Math.max(
        0,
        Math.min(
          1e12,
          Number(
            p.maxDrawdownAmount
          ) || 0
        )
      );

  }


  /* Risk */

  out.risk.riskLimit =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          out.risk.riskLimit
        ) || 0
      )
    );

  out.risk.currentExposure =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          out.risk.currentExposure
        ) || 0
      )
    );

  out.risk.liquidity =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          out.risk.liquidity
        ) || 0
      )
    );

  out.risk.concentration =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          out.risk.concentration
        ) || 0
      )
    );

  out.risk.benchmark =
    String(
      out.risk.benchmark || ""
    ).slice(0, 100);

  out.risk.notes =
    String(
      out.risk.notes || ""
    ).slice(0, 2000);


  /* Verticals */

  for (
    const k of [
      "trading",
      "investment",
      "reserve",
      "rnd"
    ]
  ) {

    out.verticals[k].percent =
      Math.max(
        0,
        Math.min(
          100,
          Number(
            out.verticals[k].percent
          ) || 0
        )
      );

    out.verticals[k].purpose =
      String(
        out.verticals[k].purpose || ""
      ).slice(0, 500);

    out.verticals[k].items =
      out.verticals[k]
        .items
        .slice(0, 100)
        .map(x => [

          String(
            x[0] || ""
          ).slice(0, 200),

          Math.max(
            0,
            Math.min(
              100,
              Number(x[1]) || 0
            )
          ),

          Math.max(
            -100000,
            Math.min(
              100000,
              Number(x[2]) || 0
            )
          ),

          Math.max(
            -100000,
            Math.min(
              100000,
              Number(x[3]) || 0
            )
          )

        ]);

  }

  return out;

}


/* =========================================================
   SERVER / AUTH
========================================================= */

app.disable(
  "x-powered-by"
);

app.use(
  express.json({
    limit: "100kb"
  })
);

const adminUser =
  process.env.ADMIN_USERNAME ||
  "admin";

const adminPassword =
  process.env.ADMIN_PASSWORD;

if (!adminPassword) {

  console.warn(
    "WARNING: Set ADMIN_PASSWORD in the environment before production use."
  );

}


function token(req) {

  const m =
    (
      req.headers.cookie ||
      ""
    ).match(
      /(?:^|;\s*)yogi_admin=([^;]+)/
    );

  return m
    ? m[1]
    : null;

}


function auth(
  req,
  res,
  next
) {

  const t =
    token(req);

  const s =
    t
      ? sessions.get(t)
      : null;

  if (
    !s ||
    s.expires < Date.now()
  ) {

    if (t) {
      sessions.delete(t);
    }

    return res
      .status(401)
      .json({
        error:
          "Unauthorized"
      });

  }

  req.admin = true;

  next();

}


function setCookie(
  res,
  t
) {

  res.setHeader(
    "Set-Cookie",
    `yogi_admin=${t}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}`
  );

}


/* =========================================================
   LOGIN
========================================================= */

app.post(
  "/api/login",
  (req, res) => {

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

    const t =
      crypto.randomBytes(
        32
      ).toString("hex");

    sessions.set(
      t,
      {
        expires:
          Date.now() +
          SESSION_TTL
      }
    );

    setCookie(
      res,
      t
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

    const t =
      token(req);

    if (t) {
      sessions.delete(t);
    }

    res.setHeader(
      "Set-Cookie",
      "yogi_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
    );

    res.json({
      ok: true
    });

  }
);


/* =========================================================
   SESSION
========================================================= */

app.get(
  "/api/me",
  (req, res) => {

    const t =
      token(req);

    const s =
      t
        ? sessions.get(t)
        : null;

    res.json({
      authenticated:
        !!(
          s &&
          s.expires >
            Date.now()
        )
    });

  }
);


/* =========================================================
   GET DATA
========================================================= */

app.get(
  "/api/data",
  (req, res) => {

    res.json(
      readData()
    );

  }
);


/* =========================================================
   SAVE DATA
========================================================= */

app.put(
  "/api/data",
  auth,
  (req, res) => {

    try {

      const cleaned =
        cleanData(
          req.body
        );

      writeData(
        cleaned
      );

      res.json({
        ok: true,
        data: cleaned
      });

    } catch (e) {

      res
        .status(400)
        .json({
          error:
            e.message ||
            "Unable to save data"
        });

    }

  }
);


/* =========================================================
   STATIC
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


app.use(
  express.static(
    __dirname,
    {
      index: false
    }
  )
);


app.listen(
  PORT,
  () =>
    console.log(
      `Fund Allocation System running on port ${PORT}`
    )
);
