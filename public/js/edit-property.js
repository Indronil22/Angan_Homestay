let propertyId = null;
(async function () {
    const meResponse = await fetch("/api/me");
    const me = await meResponse.json();

    if (!me.user || me.user.role !== "host") {
        location.href = "/login.html";
        return;
    }

    const params = new URLSearchParams(window.location.search);
    propertyId = params.get("id");

    if (!propertyId) {
        location.href = "/host-dashboard.html";
        return;
    }

    try {
        const response = await fetch("/api/host/properties");

        if (!response.ok) {
            throw new Error("Could not load your properties.");
        }

        const properties = await response.json();
        console.log("Edit property ID:", propertyId);
console.log("Host properties:", properties);

        const property = properties.find(
            p => String(p.id) === String(propertyId)
        );

        if (!property) {
            alert("Property not found.");
            location.href = "/host-dashboard.html";
            return;
        }

        document.querySelector('[name="propertyName"]').value =
            property.propertyName || "";

        document.querySelector('[name="location"]').value =
            property.location || "";

        document.querySelector('[name="price"]').value =
            property.price || "";

        document.querySelector('[name="rooms"]').value =
            property.rooms || "";

        document.querySelector('[name="description"]').value =
            property.description || "";

        document.querySelector('[name="phone"]').value =
            property.phone || "";

        document.querySelector('[name="whatsapp"]').value =
            property.whatsapp || "";

        document.querySelector('[name="instagram"]').value =
            property.instagram || "";

        const offerEnabled =
            document.getElementById("offerEnabled");

        const offerFields =
            document.getElementById("offerFields");

        if (property.offerEnabled && offerEnabled) {
            offerEnabled.checked = true;

            if (offerFields) {
                offerFields.style.display = "block";
            }
        }

        document.querySelector('[name="offerTitle"]').value =
            property.offerTitle || "";

        document.querySelector('[name="offerValue"]').value =
            property.offerValue || "";

        document.querySelector('[name="offerStartDate"]').value =
            property.offerStartDate || "";

        document.querySelector('[name="offerEndDate"]').value =
            property.offerEndDate || "";

    } catch (error) {
        console.error(error);
        alert("Unable to load property.");
    }
})();

const propertyForm = document.getElementById("propertyForm");

propertyForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const message = document.getElementById("message");
    const formData = new FormData(propertyForm);

    try {
        const response = await fetch(`/api/properties/${propertyId}`, {
            method: "PUT",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to update property.");
        }

        message.className = "success";
        message.textContent =
            "Changes submitted successfully. Your property is now waiting for admin approval.";

        setTimeout(() => {
            window.location.href = "/host-dashboard.html";
        }, 1500);

    } catch (error) {
        console.error(error);

        message.className = "error";
        message.textContent = error.message;
    }
});