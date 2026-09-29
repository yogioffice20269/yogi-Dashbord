const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const DEPTS=[
 {key:"trading",name:"Trading",color:"#2f75b5",tag:"blue",className:"blue"},
 {key:"investment",name:"Investment",color:"#0a9a5b",tag:"green",className:"green"},
 {key:"reserve",name:"Reserve",color:"#e4a915",tag:"yellow",className:"yellow"},
 {key:"rnd",name:"R&D",color:"#7042a0",tag:"purple",className:"purple"}
];
let DATA=null, currentPage="overview";

const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(n)||0);
const pct=n=>`${Number(n||0).toFixed(2)}%`;
const num=n=>Number(n)||0;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function dateDisplay(v){
 if(!v)return "—"; const d=new Date(v); if(!Number.isNaN(d.getTime())) return d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
 const m=String(v).match(/^(\d{1,2})[-\/]([A-Za-z]+|\d{1,2})[-\/](\d{2,4})$/); if(m)return `${m[1]}-${m[2]}-${m[3]}`;
 return v;
}
function totalAllocated(){
 return DEPTS.reduce((s,d)=>s+num(DATA.verticals?.[d.key]?.percent),0)*num(DATA.capital?.total)/100;
}
function deptCapital(k){return num(DATA.capital?.total)*num(DATA.verticals?.[k]?.percent)/100}
function itemRows(k){return Array.isArray(DATA.verticals?.[k]?.items)?DATA.verticals[k].items:[]}
function itemCapital(k,item){return deptCapital(k)*num(item?.[1])/100}
function roiValue(k,item,idx){return itemCapital(k,item)*num(item?.[idx])/100}
function monthPnl(k){return itemRows(k).reduce((s,x)=>s+roiValue(k,x,3),0)}
function weekPnl(k){return itemRows(k).reduce((s,x)=>s+roiValue(k,x,2),0)}
function allMonthPnl(){return DEPTS.reduce((s,d)=>s+monthPnl(d.key),0)}
function allWeekPnl(){return DEPTS.reduce((s,d)=>s+weekPnl(d.key),0)}
function renderShell(){
 $("#orgName").textContent=DATA.meta?.organization||"YOGI GROWING TOGETHER LLP";
 const dt=dateDisplay(DATA.meta?.date); $("#topDate").textContent=dt; $("#sideDate").textContent=dt;
}
function card(cls,label,value,delta=""){
 return `<div class="card kpi ${cls||""}"><div class="label">${label}</div><div class="value">${value}</div><div class="delta">${delta}</div></div>`;
}
function deptCards(){
 return `<div class="alloc-row">${DEPTS.map(d=>`<div class="alloc-card ${d.key}">
 <div class="alloc-title">${d.name.toUpperCase()}</div><div class="alloc-pct">${pct(DATA.verticals?.[d.key]?.percent)}</div>
 <div class="alloc-money">${money(deptCapital(d.key))}</div><div class="progress ${d.className}" style="margin-top:10px"><i style="width:${Math.min(100,num(DATA.verticals?.[d.key]?.percent))}%"></i></div>
 </div>`).join("")}</div>`;
}
function donut(){
 const parts=DEPTS.map(d=>num(DATA.verticals?.[d.key]?.percent)); const sum=parts.reduce((a,b)=>a+b,0)||1;
 let start=0, stops=[]; DEPTS.forEach((d,i)=>{const end=start+parts[i]/sum*360;stops.push(`${d.color} ${start}deg ${end}deg`);start=end});
 return `<div class="donut-area"><div class="donut" style="background:conic-gradient(${stops.join(",")})"><div class="donut-center"><div><b>${pct(sum)}</b><small>allocated target</small></div></div></div>
 <div class="legend">${DEPTS.map(d=>`<div class="legend-row"><i class="dot" style="background:${d.color}"></i><span>${d.name}</span><b>${pct(DATA.verticals?.[d.key]?.percent)}</b></div>`).join("")}</div></div>`;
}
function lineChart(){
 const vals=DEPTS.map(d=>monthPnl(d.key)); const max=Math.max(1,...vals.map(Math.abs)); const w=760,h=220,p=24;
 const pts=vals.map((v,i)=>`${p+i*((w-2*p)/(Math.max(1,vals.length-1)))} ${h-p-(v/max*(h-2*p)*.75)}`).join(" ");
 return `<div class="chart"><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><line x1="${p}" y1="${h-p}" x2="${w-p}" y2="${h-p}" stroke="#e6ecef"/><polyline points="${pts}" fill="none" stroke="#0a7544" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${vals.map((v,i)=>{const x=p+i*((w-2*p)/(Math.max(1,vals.length-1)));const y=h-p-(v/max*(h-2*p)*.75);return `<circle cx="${x}" cy="${y}" r="5" fill="#fff" stroke="#0a7544" stroke-width="3"/><text x="${x}" y="${h-5}" text-anchor="middle" font-size="10" fill="#71808c">${DEPTS[i].name}</text>`}).join("")}</svg></div>`;
}
function allocationTable(){
 const total=num(DATA.capital?.total);
 return `<div class="table-wrap"><table class="table"><thead><tr><th>Vertical</th><th class="num">Target</th><th class="num">Capital</th><th class="num">Week ROI</th><th class="num">Month ROI</th><th>Status</th></tr></thead><tbody>
 ${DEPTS.map(d=>{const p=num(DATA.verticals?.[d.key]?.percent),c=deptCapital(d.key),r=c?monthPnl(d.key)/c*100:0;return `<tr><td><b>${d.name}</b></td><td class="num">${pct(p)}</td><td class="num">${money(c)}</td><td class="num">${pct(c?weekPnl(d.key)/c*100:0)}</td><td class="num">${pct(r)}</td><td><span class="tag ${d.tag}">${p>0?"Allocated":"Not Allocated"}</span></td></tr>`}).join("")}
 <tr><td><b>Total</b></td><td class="num"><b>${pct(DEPTS.reduce((s,d)=>s+num(DATA.verticals?.[d.key]?.percent),0))}</b></td><td class="num"><b>${money(totalAllocated())}</b></td><td class="num"><b>${pct(totalAllocated()?allWeekPnl()/totalAllocated()*100:0)}</b></td><td class="num"><b>${pct(totalAllocated()?allMonthPnl()/totalAllocated()*100:0)}</b></td><td><span class="tag green">Live</span></td></tr>
 </tbody></table></div>`;
}
function attribution(){
 return `<div class="bar-list">${DEPTS.map(d=>{const v=monthPnl(d.key),m=Math.min(100,Math.abs(v)/(Math.max(1,...DEPTS.map(x=>Math.abs(monthPnl(x)))))*100);return `<div class="bar-line"><span>${d.name}</span><div class="bar-track"><i style="width:${m}%;background:${d.color}"></i></div><b>${money(v)}</b></div>`}).join("")}</div>`;
}
function renderOverview(){
 const total=num(DATA.capital?.total),alloc=totalAllocated(),avail=total-alloc,roi=total?allMonthPnl()/total*100:0;
 $("#page-overview").innerHTML=`
 <div class="grid kpis">${card("green-top","TOTAL FUND CAPITAL",money(total),"Core fund capital")}
 ${card("blue-top","CAPITAL DEPLOYED",money(alloc),"Based on current allocation")}
 ${card("yellow-top","AVAILABLE CAPITAL",money(avail),avail>=0?"Unallocated balance":"Over allocation")}
 ${card("green-top","MTD P&L",money(allMonthPnl()),allMonthPnl()>=0?"Positive contribution":"Negative contribution")}
 ${card("blue-top","MTD ROI",pct(roi),"Calculated from month ROI inputs")}
 ${card("red-top","MAX DRAWDOWN","—","Not stored in current data model")}</div>
 ${deptCards()}
 <div class="grid two mt"><div class="card"><div class="card-head"><h3>Allocation vs Target</h3><span>Current vertical allocation</span></div>${allocationTable()}</div>
 <div class="card"><div class="card-head"><h3>Capital Utilization</h3><span>${money(alloc)} / ${money(total)}</span></div>${donut()}</div></div>
 <div class="grid two mt"><div class="card"><div class="card-head"><h3>Fund Performance</h3><span>Month ROI contribution by vertical</span></div>${lineChart()}</div>
 <div class="card"><div class="card-head"><h3>MTD P&amp;L Attribution</h3><span>Calculated from item ROI</span></div><div class="card-body">${attribution()}</div></div></div>
 <div class="grid three mt"><div class="card"><div class="card-head"><h3>Key Metrics</h3></div><div class="card-body metric-list">
 <div class="metric-line"><span>Allocation Coverage</span><b>${pct(total?alloc/total*100:0)}</b></div><div class="metric-line"><span>Week P&amp;L</span><b>${money(allWeekPnl())}</b></div><div class="metric-line"><span>Month P&amp;L</span><b>${money(allMonthPnl())}</b></div></div></div>
 <div class="card"><div class="card-head"><h3>Control Status</h3></div><div class="card-body"><div class="callout">${Math.abs(alloc-total)<1?"Fund is fully allocated.":alloc<total?"Capital remains available for allocation.":"Allocation exceeds available capital."}</div><p class="page-note">Public view is read-only. Use Settings → Admin Panel to edit.</p></div></div>
 <div class="card"><div class="card-head"><h3>Data Source</h3></div><div class="card-body"><div class="metric-line"><span>Organization</span><b>${esc(DATA.meta?.organization)}</b></div><div class="metric-line"><span>Prepared By</span><b>${esc(DATA.meta?.preparedBy)}</b></div><div class="metric-line"><span>Last Date</span><b>${esc(dateDisplay(DATA.meta?.date))}</b></div></div></div></div>`;
}
function renderAllocation(){
 $("#page-allocation").innerHTML=`<div class="subnav"><button class="active">Overview</button><button>Vertical Allocation</button><button>Sub Allocation</button></div>
 <div class="grid kpis">${card("green-top","TOTAL CAPITAL",money(DATA.capital?.total),"Fund size")}${card("blue-top","ALLOCATED",money(totalAllocated()),"Target allocation")}${card("yellow-top","AVAILABLE",money(num(DATA.capital?.total)-totalAllocated()),"Remaining")}${card("purple-top","VERTICALS",DEPTS.length,"Controlled buckets")}${card("green-top","WEEK P&L",money(allWeekPnl()),"From item ROI")}${card("blue-top","MONTH P&L",money(allMonthPnl()),"From item ROI")}</div>
 <div class="grid two mt"><div class="card"><div class="card-head"><h3>Vertical Allocation</h3><span>Target / capital / performance</span></div>${allocationTable()}</div><div class="card"><div class="card-head"><h3>Allocation Visualization</h3></div>${donut()}</div></div>
 <div class="card mt"><div class="card-head"><h3>Sub Allocation by Department</h3><span>All items from admin data</span></div><div class="card-body">${DEPTS.map(d=>`<div class="dept-head"><h3>${d.name}</h3><span class="tag ${d.tag}">${pct(DATA.verticals?.[d.key]?.percent)} • ${money(deptCapital(d.key))}</span></div>${itemTable(d.key)}<div style="height:16px"></div>`).join("")}</div></div>`;
}
function itemTable(k){
 const rows=itemRows(k),cap=deptCapital(k); return `<div class="table-wrap"><table class="table"><thead><tr><th>Particular</th><th class="num">Allocation</th><th class="num">Capital</th><th class="num">Week ROI</th><th class="num">Month ROI</th><th class="num">Month P&L</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x[0])}</b></td><td class="num">${pct(x[1])}</td><td class="num">${money(cap*num(x[1])/100)}</td><td class="num">${pct(x[2])}</td><td class="num">${pct(x[3])}</td><td class="num">${money(roiValue(k,x,3))}</td></tr>`).join("")}${rows.length?`<tr><td><b>Total</b></td><td class="num"><b>${pct(rows.reduce((s,x)=>s+num(x[1]),0))}</b></td><td class="num"><b>${money(rows.reduce((s,x)=>s+itemCapital(k,x),0))}</b></td><td colspan="3"></td></tr>`:"<tr><td colspan=6>No items configured.</td></tr>"}</tbody></table></div>`;
}
function renderDept(k){
 const d=DEPTS.find(x=>x.key===k), capital=deptCapital(k),week=weekPnl(k),month=monthPnl(k),roi=capital?month/capital*100:0, rows=itemRows(k);
 let extra="";
 if(k==="trading") extra=`<div class="grid two mt"><div class="card"><div class="card-head"><h3>Book-wise Allocation</h3></div><div class="card-body">${barBooks(k)}</div></div><div class="card"><div class="card-head"><h3>Trading Control</h3></div><div class="card-body metric-list"><div class="metric-line"><span>Trades</span><b>Not stored</b></div><div class="metric-line"><span>Win Rate</span><b>Not stored</b></div><div class="metric-line"><span>Profit Factor</span><b>Not stored</b></div></div></div></div>`;
 if(k==="investment") extra=`<div class="grid two mt"><div class="card"><div class="card-head"><h3>Portfolio Allocation</h3></div><div class="card-body">${barBooks(k)}</div></div><div class="card"><div class="card-head"><h3>Portfolio Metrics</h3></div><div class="card-body metric-list"><div class="metric-line"><span>Invested Capital</span><b>${money(capital)}</b></div><div class="metric-line"><span>Current Value</span><b>Not stored</b></div><div class="metric-line"><span>Unrealized P&L</span><b>Not stored</b></div></div></div></div>`;
 if(k==="reserve") extra=`<div class="grid two mt"><div class="card"><div class="card-head"><h3>Reserve Composition</h3></div><div class="card-body">${barBooks(k)}</div></div><div class="card"><div class="card-head"><h3>Liquidity Controls</h3></div><div class="card-body metric-list"><div class="metric-line"><span>Required Minimum</span><b>Not stored</b></div><div class="metric-line"><span>Months of Expenses</span><b>Not stored</b></div><div class="metric-line"><span>Emergency Cover</span><b>Not stored</b></div></div></div></div>`;
 if(k==="rnd") extra=`<div class="grid two mt"><div class="card"><div class="card-head"><h3>R&amp;D Pipeline</h3></div><div class="card-body">${barBooks(k)}</div></div><div class="card"><div class="card-head"><h3>Project Controls</h3></div><div class="card-body metric-list"><div class="metric-line"><span>Active Projects</span><b>Not stored</b></div><div class="metric-line"><span>Testing / Approved</span><b>Not stored</b></div><div class="metric-line"><span>Success Rate</span><b>Not stored</b></div></div></div></div>`;
 $("#page-"+k).innerHTML=`<div class="grid kpis">${card(d.key==="trading"?"blue-top":d.key==="investment"?"green-top":d.key==="reserve"?"yellow-top":"purple-top","ALLOCATED CAPITAL",money(capital),pct(DATA.verticals?.[k]?.percent)+" target")}${card("green-top","WEEK P&L",money(week),"Calculated")}${card("green-top","MONTH P&L",money(month),"Calculated")}${card("blue-top","MONTH ROI",pct(roi),"Calculated")}${card("yellow-top","AVAILABLE","—","Not stored")}${card("red-top","RISK","—","Not stored")}</div>
 <div class="card mt"><div class="card-head"><h3>${d.name} — Allocation &amp; Performance</h3><span>${esc(DATA.verticals?.[k]?.purpose||"")}</span></div>${itemTable(k)}</div>${extra}
 <div class="card mt"><div class="card-head"><h3>Purpose / Mandate</h3></div><div class="card-body"><div class="callout">${esc(DATA.verticals?.[k]?.purpose||"No purpose configured.")}</div></div></div>`;
}
function barBooks(k){const rows=itemRows(k),mx=Math.max(1,...rows.map(x=>num(x[1])));return `<div class="bar-list">${rows.map(x=>`<div class="bar-line"><span>${esc(x[0])}</span><div class="bar-track"><i style="width:${num(x[1])/mx*100}%;background:${DEPTS.find(d=>d.key===k).color}"></i></div><b>${pct(x[1])}</b></div>`).join("")||"<div class=empty-state>No allocation items.</div>"}</div>`}
function renderPerformance(){
 $("#page-performance").innerHTML=`<div class="grid kpis">${card("green-top","MONTH P&L",money(allMonthPnl()),"Calculated from item ROI")}${card("blue-top","WEEK P&L",money(allWeekPnl()),"Calculated from item ROI")}${card("green-top","MONTH ROI",pct(num(DATA.capital?.total)?allMonthPnl()/num(DATA.capital.total)*100:0),"Fund-level")}${card("yellow-top","WEEK ROI",pct(num(DATA.capital?.total)?allWeekPnl()/num(DATA.capital.total)*100:0),"Fund-level")}${card("red-top","MAX DRAWDOWN","—","Not stored")}${card("purple-top","BENCHMARK","—","Not stored")}</div>
 <div class="grid two mt"><div class="card"><div class="card-head"><h3>ROI by Vertical</h3></div>${allocationTable()}</div><div class="card"><div class="card-head"><h3>P&amp;L Contribution</h3></div><div class="card-body">${attribution()}</div></div></div>
 <div class="card mt"><div class="card-head"><h3>Detailed ROI Performance</h3><span>${DATA.settings?.overallROIEnabled===false?"Overall ROI section disabled by admin":"Enabled"}</span></div><div class="card-body">${DATA.settings?.overallROIEnabled===false?'<div class="empty-state"><div><strong>Overall ROI Performance is OFF</strong><span>Enable it from the Admin Panel.</span></div></div>':itemTable("trading")+itemTable("investment")+itemTable("reserve")+itemTable("rnd")}</div></div>`;
}
function renderRisk(){
 $("#page-risk").innerHTML=`<div class="grid kpis">${card("red-top","MAX DRAWDOWN","—","Not stored in current schema")}${card("yellow-top","RISK LIMIT","—","Not stored")}${card("blue-top","CONCENTRATION","—","Not stored")}${card("green-top","LIQUIDITY","—","Reserve metrics not stored")}${card("purple-top","EXPOSURE","—","Not stored")}${card("red-top","STATUS","DATA GAP","Risk module requires extra fields")}</div>
 <div class="grid two mt"><div class="card"><div class="card-head"><h3>Risk Register</h3></div><div class="card-body"><div class="empty-state"><div><strong>Risk metrics are not part of the existing data model.</strong><span>The current backend stores capital, vertical allocation, item allocation and ROI only.</span></div></div></div></div>
 <div class="card"><div class="card-head"><h3>Available Controls</h3></div><div class="card-body metric-list"><div class="metric-line"><span>Vertical allocation cap</span><b>100%</b></div><div class="metric-line"><span>Input validation</span><b class="positive">Server-side</b></div><div class="metric-line"><span>Admin write access</span><b class="positive">Authenticated</b></div><div class="metric-line"><span>Public write access</span><b class="negative">Blocked</b></div></div></div></div>`;
}
function renderMovements(){
 $("#page-movements").innerHTML=`<div class="grid kpis">${card("green-top","TOTAL CAPITAL",money(DATA.capital?.total),"Current")}${card("blue-top","ALLOCATED",money(totalAllocated()),"Current")}${card("yellow-top","AVAILABLE",money(num(DATA.capital?.total)-totalAllocated()),"Current")}${card("purple-top","LAST UPDATE",dateDisplay(DATA.meta?.date),"Admin date")}</div>
 <div class="card mt"><div class="card-head"><h3>Capital Movement Register</h3><span>Historical transactions are not stored</span></div><div class="card-body"><div class="empty-state"><div><strong>No capital movement records</strong><span>Add a transaction/history data model if you want deposits, withdrawals or transfers tracked.</span></div></div></div></div>`;
}
function renderReports(){
 $("#page-reports").innerHTML=`<div class="grid three"><div class="card report-card"><h3>Capital Allocation Report</h3><p>Vertical and item-level allocation with capital values.</p><button onclick="window.print()">Print / Save PDF</button></div><div class="card report-card"><h3>Performance Report</h3><p>Week and month ROI/P&amp;L calculated from the current dashboard inputs.</p><button onclick="window.print()">Print / Save PDF</button></div><div class="card report-card"><h3>Management Snapshot</h3><p>Executive dashboard view with current fund totals and controls.</p><button onclick="window.print()">Print / Save PDF</button></div></div>
 <div class="card mt"><div class="card-head"><h3>Report Summary</h3></div>${allocationTable()}<div class="footer-note">Generated from live server data • ${esc(dateDisplay(DATA.meta?.date))}</div></div>`;
}
function renderSettings(){
 $("#page-settings").innerHTML=`<div class="grid settings-grid"><div class="card"><div class="card-head"><h3>System Settings</h3></div><div class="card-body metric-list"><div class="metric-line"><span>Organization</span><b>${esc(DATA.meta?.organization)}</b></div><div class="metric-line"><span>Prepared By</span><b>${esc(DATA.meta?.preparedBy)}</b></div><div class="metric-line"><span>Dashboard Date</span><b>${esc(dateDisplay(DATA.meta?.date))}</b></div><div class="metric-line"><span>Overall ROI</span><b>${DATA.settings?.overallROIEnabled===false?"OFF":"ON"}</b></div></div></div>
 <div class="card"><div class="card-head"><h3>Administration</h3></div><div class="card-body"><p style="font-size:11px;color:#71808c;line-height:1.6">Public dashboard is view-only. The secure editor is protected by the existing server-side admin session.</p><a class="admin-link" href="/admin">Open Admin Panel</a></div></div></div>
 <div class="card mt"><div class="card-head"><h3>Current Data Model</h3></div><div class="card-body"><div class="callout">The existing backend stores total fund capital, four verticals, allocation percentages, purpose text, item allocation percentages and week/month ROI percentages. Advanced Risk, Trade History, Holdings and Capital Movement metrics are intentionally shown as unavailable until those fields are added to the backend.</div></div></div>`;
}
function renderAll(){
 renderShell();renderOverview();renderAllocation();DEPTS.forEach(d=>renderDept(d.key));renderPerformance();renderRisk();renderMovements();renderReports();renderSettings();
}
function showPage(page){
 currentPage=page; $$(".page").forEach(x=>x.classList.remove("active")); $("#page-"+page)?.classList.add("active");
 $$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
 const titles={overview:["Overview","Executive view of fund capital, allocation and performance."],allocation:["Allocation","Vertical and sub-allocation control."],trading:["Trading","Trading capital, books and ROI performance."],investment:["Investment","Investment allocation and portfolio controls."],reserve:["Reserve","Liquidity reserve and expense protection."],rnd:["R&D","Research, innovation and strategy development."],performance:["Performance","Fund and vertical performance analysis."],risk:["Risk","Risk and control framework."],movements:["Capital Movements","Capital movement register and current balances."],reports:["Reports","Management reporting and printable snapshots."],settings:["Settings","System information and administration."]};
 $("#pageTitle").textContent=titles[page][0];$("#pageSub").textContent=titles[page][1];
}
async function load(){
 try{
  const r=await fetch("/api/data",{cache:"no-store"}); if(!r.ok)throw new Error("Unable to load data");
  DATA=await r.json(); renderAll(); showPage("overview"); $("#loading").classList.add("hidden");$("#app").classList.remove("hidden");
 }catch(e){console.error(e);$("#loading").innerHTML="<b>Unable to load dashboard.</b><span>Please refresh the page.</span>";}
}
$$(".nav-item").forEach(b=>b.addEventListener("click",()=>{showPage(b.dataset.page);$("#sidebar").classList.remove("open")}));
$("#menuBtn")?.addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$$(".period").forEach(b=>b.addEventListener("click",()=>{$$(".period").forEach(x=>x.classList.remove("active"));b.classList.add("active")}));
load();
