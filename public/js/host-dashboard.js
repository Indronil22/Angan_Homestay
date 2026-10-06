(async function(){
 const me=await fetch("/api/me").then(r=>r.json());
 if(!me.user || me.user.role!=="host"){location.href="/login.html";return;}
 document.getElementById("welcome").textContent="Welcome, "+me.user.name;
 const ps=await fetch("/api/host/properties").then(r=>r.json());
 document.getElementById("properties").innerHTML=ps.length?ps.map(p=>`<div class="card"><img src="${p.photos[0]||""}"><div class="card-body"><span class="status ${p.status}">${p.status}</span><h3>${p.propertyName}</h3><p>${p.location}</p></div></div>`).join(""):"<p>No properties yet.</p>";
 renderRequests();
 async function renderRequests(){
  const rs=await fetch("/api/host/requests").then(r=>r.json());
  document.getElementById("requests").innerHTML=rs.length?rs.map(r=>`<div class="admin-item"><strong>${r.type.toUpperCase()}</strong> — ${r.propertyName}<p>Traveler: ${r.travelerName} (${r.travelerEmail})</p><p>Status: ${r.status}</p>${r.status==="pending"?`<div class="actions"><button class="btn" onclick="setStatus('${r.id}','accepted')">Accept</button><button class="btn danger" onclick="setStatus('${r.id}','declined')">Decline</button></div>`:""}</div>`).join(""):"<p>No requests yet.</p>";
 }
 window.setStatus=async(id,status)=>{await fetch("/api/host/requests/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});renderRequests();};
})();
async function logout(){await fetch("/api/logout",{method:"POST"});location.href="/";}
