(async function(){
 const id=new URLSearchParams(location.search).get("id");
 const root=document.getElementById("property");
 const r=await fetch("/api/properties/"+id);
 if(!r.ok){root.innerHTML="<h1>Property not found</h1>";return;}
 const p=await r.json();
 root.innerHTML=`
 <div class="property-gallery">${p.photos.map(x=>`<img src="${x}">`).join("")}</div>
 <div class="two-col">
 <div class="property-main">
  <p class="eyebrow">${esc(p.location)}</p><h1>${esc(p.propertyName)}</h1>
  <p>Hosted by <strong>${esc(p.hostName)}</strong></p>
  <h2>₹${esc(p.price)} <small>/ night</small></h2>
  <p>${esc(p.description)}</p>
  ${p.video?`<h2>Host Story</h2><video class="story" src="${p.video}" controls></video>`:""}
 </div>
 <div class="request-box">
  <h2>Interested?</h2><p>Send the host a request. Payment is arranged directly with the host.</p>
  <button class="btn" onclick="openRequest('booking')">Request to Book</button>
  <button class="btn outline" onclick="openRequest('tour')">Request Live Tour</button>
  ${p.whatsapp?`<a class="btn outline" target="_blank" href="https://wa.me/${p.whatsapp.replace(/\\D/g,"")}">WhatsApp Host</a>`:""}
  <div id="requestForm"></div>
 </div></div>`;
 window.openRequest=async type=>{
  const me=await fetch("/api/me").then(r=>r.json());
  if(!me.user){location.href="/login.html";return;}
  document.getElementById("requestForm").innerHTML=type==="booking"?`
   <form id="req"><label>Check-in<input name="checkIn" type="date" required></label><label>Check-out<input name="checkOut" type="date" required></label><label>Guests<input name="guests" type="number" min="1" required></label><label>Message<textarea name="message"></textarea></label><button class="btn">Send booking request</button></form>`
   :`<form id="req"><label>Preferred date<input name="preferredDate" type="date" required></label><label>Preferred time<input name="preferredTime" type="time" required></label><label>Message<textarea name="message"></textarea></label><button class="btn">Request tour</button></form>`;
  document.getElementById("req").onsubmit=async e=>{
   e.preventDefault();const body=Object.fromEntries(new FormData(e.target));body.propertyId=id;body.type=type;
   const rr=await fetch("/api/requests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const data=await rr.json(); if(!rr.ok){alert(data.error);return;}
   document.getElementById("requestForm").innerHTML="<p class='success'>Request sent successfully.</p>";
  };
 };
 function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
})();
