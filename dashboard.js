const fmt=n=>new Intl.NumberFormat("en-IN",{maximumFractionDigits:0}).format(Math.round(Number(n)||0));
const money=n=>"₹ "+fmt(n), pct=n=>`${Number(n)||0}%`;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function render(data){
 const total=Number(data.capital.total)||0, vs=data.verticals;
 document.getElementById("orgName").textContent=data.meta.organization;
 document.getElementById("metaDate").textContent=data.meta.date;
 document.getElementById("metaVersion").textContent=data.meta.version;
 document.getElementById("metaPrepared").textContent=data.meta.preparedBy;
 const keys=["trading","investment","reserve","rnd"], names={trading:"TRADING",investment:"INVESTMENT",reserve:"RESERVE",rnd:"RESEARCH & DEVELOPMENT"};
 const colors=["#438ddd","#67bd72","#f1d65d","#a184d6"];
 const allocated=keys.reduce((s,k)=>s+total*(Number(vs[k].percent)||0)/100,0);
 document.getElementById("totalCapital").textContent=money(total);
 document.getElementById("allocatedCapital").textContent=money(allocated);
 document.getElementById("unallocatedCapital").textContent=money(total-allocated);
const difference = total - allocated;

document.getElementById("status").innerHTML =
    Math.abs(difference) < 0.01
        ? '<span>✓</span> Fully Allocated'
        : difference > 0
            ? '<span style="color:#d99000;">↑</span> Surplus ₹ ' + fmt(difference)
            : '<span class="warning">↓</span> Deficit ₹ ' + fmt(Math.abs(difference));
 document.getElementById("allocationCards").innerHTML=keys.map((k,i)=>`<div class="allocation-card ${k}"><div class="card-head" style="background:${colors[i]};color:${k==="reserve"?"#111":"#fff"}">${names[k]}</div><div class="percent">${pct(vs[k].percent)}</div><div class="amount">${money(total*vs[k].percent/100)}</div></div>`).join("");
 let start=0,stops=[];keys.forEach((k,i)=>{let end=start+Number(vs[k].percent||0);stops.push(`${colors[i]} ${start}% ${end}%`);start=end});
 document.getElementById("donut").style.background=`conic-gradient(${stops.join(",")})`;
 document.getElementById("legend").innerHTML=keys.map((k,i)=>`<div><i class="dot" style="background:${colors[i]}"></i>${k==="rnd"?"R&D":k[0].toUpperCase()+k.slice(1)} <b>${pct(vs[k].percent)}</b></div>`).join("");
 const max=Math.max(1,...keys.map(k=>total*vs[k].percent/100));
 document.getElementById("bars").innerHTML=keys.map((k,i)=>{let val=total*vs[k].percent/100;return `<div class="bar-group"><div class="bar" style="height:${val/max*80}%;background:${colors[i]}"><span>${fmt(val/100000)}L</span></div><small>${k==="rnd"?"R&D":k[0].toUpperCase()+k.slice(1)}</small></div>`}).join("");
 document.getElementById("tablesGrid").innerHTML=keys.map(k=>{let v=vs[k], rows=v.items.map((it,i)=>`<tr><td>${i+1}</td><td>${esc(it[0])}</td><td>${pct(it[1])}</td><td>${money(total*it[1]/100)}</td></tr>`).join(""), sum=v.items.reduce((s,x)=>s+Number(x[1]||0),0);return `<div class="department ${k}-box"><h2>${names[k]} <span>${k==="reserve"||k==="rnd"?"(5–10%)":"("+v.percent+"%)"}</span></h2><table><thead><tr><th>Sr. No.</th><th>Particular</th><th>Target %</th><th>Allocation (₹)</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><th colspan="2">TOTAL</th><th>${pct(sum)}</th><th>${money(total*sum/100)}</th></tr></tfoot></table><div class="purpose"><b>PURPOSE</b><p>${esc(v.purpose)}</p></div></div>`}).join("");
 document.getElementById("loading").classList.add("hidden");document.getElementById("dashboard").classList.remove("hidden");
}
fetch("/api/data",{credentials:"same-origin"}).then(r=>r.json()).then(render).catch(()=>document.getElementById("loading").textContent="Unable to load dashboard.");
