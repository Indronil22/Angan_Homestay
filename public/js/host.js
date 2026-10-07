(async function(){
 const me=await fetch("/api/me").then(r=>r.json());
 if(!me.user || me.user.role!=="host"){location.href="/login.html";return;}
 document.getElementById("propertyForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const message=document.getElementById("message");
  const fd=new FormData(e.target);
  try{
   const r=await fetch("/api/properties",{method:"POST",body:fd});
   const data=await r.json();
   if(!r.ok) throw new Error(data.error);
   message.className="success"; message.textContent="Submitted. Angan will review your property before it goes live.";
   e.target.reset();
  }catch(err){message.className="error";message.textContent=err.message;}
 });
})();
const offerEnabled = document.getElementById("offerEnabled");
const offerFields = document.getElementById("offerFields");

if (offerEnabled && offerFields) {
    offerFields.style.display = "none";

    offerEnabled.addEventListener("change", function () {
        offerFields.style.display = this.checked ? "block" : "none";
    });
}