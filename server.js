const express=require("express");
const crypto=require("crypto");
const fs=require("fs");
const path=require("path");
const bcrypt=require("bcryptjs");

const app=express();
const PORT=process.env.PORT||3000;
const DATA_DIR=process.env.DATA_DIR||path.join(__dirname,"data");
const DATA_FILE=path.join(DATA_DIR,"dashboard.json");
const SESSION_TTL=8*60*60*1000;
const sessions=new Map();

if(!fs.existsSync(DATA_DIR))fs.mkdirSync(DATA_DIR,{recursive:true});

const defaultData={
 meta:{organization:"YOGI GROWING TOGETHER LLP",date:"24-Sep-2024",version:"V1.0",preparedBy:"Team Yogi"},
 capital:{total:10000000},
 verticals:{
  trading:{percent:40,purpose:"Short to Medium Term Trading Opportunities",items:[["Index",5],["Equity F&O",15],["Equity (Intraday)",10],["Commodity",5],["Forex",5]]},
  investment:{percent:40,purpose:"Long Term Wealth Creation & Diversification",items:[["Equity (CNC)",20],["Mutual Fund",10],["Gold, Silver",10]]},
  reserve:{percent:10,purpose:"Maintain Liquidity & Handle Unplanned Expenses",items:[["Liquidity Buffer",5],["Fixed Expenses",5]]},
  rnd:{percent:10,purpose:"Research, Innovation & Trading Edge Development",items:[["Algo Development",2],["Strategy Testing",2],["Model Development",2],["Data/Software",2],["Backtesting",2]]}
 }
};

function readData(){try{return JSON.parse(fs.readFileSync(DATA_FILE,"utf8"))}catch{return defaultData}}
function writeData(d){fs.writeFileSync(DATA_FILE,JSON.stringify(d,null,2))}
if(!fs.existsSync(DATA_FILE))writeData(defaultData);

const adminUser=process.env.ADMIN_USERNAME||"admin";
const adminPassword=process.env.ADMIN_PASSWORD;
if(!adminPassword){console.warn("WARNING: Set ADMIN_PASSWORD in the environment before production use.");}

app.disable("x-powered-by");
app.use(express.json({limit:"100kb"}));

function cleanData(d){
 if(!d||typeof d!=="object")throw Error("Invalid data");
 const allowed={meta:{},capital:{},verticals:{}};
 for(const k of ["organization","date","version","preparedBy"])allowed.meta[k]=String(d.meta?.[k]??"").slice(0,200);
 allowed.capital.total=Math.max(0,Number(d.capital?.total)||0);
 for(const k of ["trading","investment","reserve","rnd"]){
  const v=d.verticals?.[k]||{};
  allowed.verticals[k]={percent:Math.max(0,Math.min(100,Number(v.percent)||0)),purpose:String(v.purpose??"").slice(0,500),items:Array.isArray(v.items)?v.items.slice(0,50).map(x=>[String(x?.[0]??"").slice(0,100),Math.max(0,Math.min(100,Number(x?.[1])||0))]):[]};
 }
 return allowed;
}
function auth(req,res,next){
 const token=req.headers.cookie?.match(/(?:^|;\s*)yogi_admin=([^;]+)/)?.[1];
 const s=token&&sessions.get(token);
 if(!s||s.expires<Date.now()){if(token)sessions.delete(token);return res.status(401).json({error:"Unauthorized"})}
 req.admin=true;next();
}
function setCookie(res,token){res.setHeader("Set-Cookie",`yogi_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL/1000}`)}
app.post("/api/login",async(req,res)=>{
 const {username,password}=req.body||{};
 if(!adminPassword||username!==adminUser||!password||password!==adminPassword)return res.status(401).json({error:"Invalid credentials"});
 const token=crypto.randomBytes(32).toString("hex");sessions.set(token,{expires:Date.now()+SESSION_TTL});setCookie(res,token);res.json({ok:true});
});
app.post("/api/logout",auth,(req,res)=>{const token=req.headers.cookie?.match(/(?:^|;\s*)yogi_admin=([^;]+)/)?.[1];if(token)sessions.delete(token);res.setHeader("Set-Cookie","yogi_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");res.json({ok:true})});
app.get("/api/me",(req,res)=>{const token=req.headers.cookie?.match(/(?:^|;\s*)yogi_admin=([^;]+)/)?.[1];const s=token&&sessions.get(token);res.json({authenticated:!!(s&&s.expires>Date.now())})});
app.get("/api/data",(req,res)=>res.json(readData()));
app.put("/api/data",auth,(req,res)=>{try{writeData(cleanData(req.body));res.json({ok:true})}catch(e){res.status(400).json({error:e.message})}});

app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"public.html")));
app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"admin.html")));
app.use(express.static(__dirname,{index:false}));
app.listen(PORT,()=>console.log(`Fund Allocation System running on port ${PORT}`));
