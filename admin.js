let data=null;
const $=s=>document.querySelector(s);
const keys=["trading","investment","reserve","rnd"];
const labels={trading:"Trading",investment:"Investment",reserve:"Reserve",rnd:"Research & Development"};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function get(o,p){return p.split(".").reduce((a,k)=>a?.[k],o)}
function set(o,p,v){let a=p.split("."),l=a.pop(),t=a.reduce((x,k)=>x[k],o);t[l]=v}
function bind(){document.querySelectorAll("[data-path]").forEach(el=>{el.value=get(data,el.dataset.path)??"";el.oninput=()=>set(data,el.dataset.path,el.type==="number"?Number(el.value):el.value)})}
function buildEditors(){
 $("#editSections").innerHTML=keys.map(k=>`<section><h3>${labels[k]}</h3><div id="${k}Rows"></div><button type="button" class="add-row" data-add="${k}">+ Add Item</button><label>Purpose<textarea data-path="verticals.${k}.purpose"></textarea></label></section>`).join("");
 document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>{data.verticals[b.dataset.add].items.push(["New Item",0]);renderEditors()});
 renderEditors();
}
function renderEditors(){
 keys.forEach(k=>{let box=$("#"+k+"Rows");box.innerHTML=data.verticals[k].items.map((x,i)=>`<div class="item-row"><input value="${esc(x[0])}" data-name="${k}" data-i="${i}"><input type="number" min="0" max="100" step=".1" value="${x[1]}" data-pct="${k}" data-i="${i}"><button type="button" data-del="${k}" data-i="${i}">×</button></div>`).join("")});
 bind();
 document.querySelectorAll("[data-name]").forEach(e=>e.oninput=()=>data.verticals[e.dataset.name].items[e.dataset.i][0]=e.value);
 document.querySelectorAll("[data-pct]").forEach(e=>e.oninput=()=>data.verticals[e.dataset.pct].items[e.dataset.i][1]=Number(e.value));
 document.querySelectorAll("[data-del]").forEach(e=>e.onclick=()=>{data.verticals[e.dataset.del].items.splice(Number(e.dataset.i),1);renderEditors()});
}
async function load(){
 let r=await fetch("/api/me");let me=await r.json();
 if(!me.authenticated){$("#loginScreen").classList.remove("hidden");return}
 r=await fetch("/api/data");data=await r.json();$("#loginScreen").classList.add("hidden");$("#adminApp").classList.remove("hidden");buildEditors();
}
$("#loginForm").onsubmit=async e=>{e.preventDefault();let r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:$("#username").value,password:$("#password").value})});if(r.ok)load();else $("#loginError").textContent="Invalid username or password."};
$("#saveBtn").onclick=async()=>{let r=await fetch("/api/data",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});$("#saveMessage").textContent=r.ok?"Saved successfully":"Save failed";if(r.ok){document.querySelector(".preview iframe").contentWindow.location.reload()}};
$("#logoutBtn").onclick=async()=>{await fetch("/api/logout",{method:"POST"});location.reload()};
load();
