(async function () {

    const propertiesGrid = document.getElementById("propertiesGrid");
    const hostName = document.getElementById("hostName");
    const logoutBtn = document.getElementById("logoutBtn");

    try {

        // Check logged-in host
        const meResponse = await fetch("/api/me");
        const me = await meResponse.json();

        if (!me.user || me.user.role !== "host") {
            window.location.href = "/login.html";
            return;
        }

        hostName.textContent = me.user.name || "Host";


        // Load host properties
        const response = await fetch("/api/host/properties");

        if (!response.ok) {
            throw new Error("Could not load properties");
        }

        const properties = await response.json();

        if (!properties.length) {
    propertiesGrid.innerHTML = `
        <div class="empty-state">
            <h3>No properties yet</h3>
            <p>You haven't submitted any property yet.</p>
            <a href="/host.html" class="btn">Add your first property</a>
        </div>`;
} else {
    propertiesGrid.innerHTML = "";

    properties.forEach(property => {

            const statusClass =
                property.status === "approved"
                    ? "status-approved"
                    : property.status === "rejected"
                        ? "status-rejected"
                        : "status-pending";


            propertiesGrid.innerHTML += `

                <article class="dashboard-card">

                    <div class="dashboard-image">

                        <img
                            src="${property.images?.[0] || "/images/hero-1.jpg"}"
                            alt="${property.propertyName}"
                        >

                    </div>


                    <div class="dashboard-content">

                        <h3>
                            ${property.propertyName}
                        </h3>

                        <p>
                            ${property.location}
                        </p>

                        <p>
                            ₹${property.price} / night
                        </p>

                        <span class="property-status ${statusClass}">
                            ${property.status}
                        </span>
                        ${property.status === "approved" ? `
    <a href="/edit-property.html?id=${property.id}" class="edit-property-btn">
        Edit Property
    </a>
` : ""}

                    </div>

                </article>

            `;

        });
    }

    } catch (error) {

        console.error("Host dashboard error:", error);

        propertiesGrid.innerHTML = `
            <p>
                Unable to load your properties right now.
            </p>
        `;

    }


    // Logout
    if (logoutBtn) {

        logoutBtn.addEventListener("click", async function (e) {

            e.preventDefault();

            await fetch("/api/logout", {
                method: "POST"
            });

            window.location.href = "/login.html";

        });

    }

})();