(async function () {

    const me = await fetch("/api/me").then(r => r.json());

    if (!me.user || me.user.role !== "admin") {
        location.href = "/admin-login.html";
        return;
    }

    load();


    async function load() {

        // Load properties
        const propertiesResponse =
            await fetch("/api/admin/properties");

        const properties = await propertiesResponse.json();

        document.getElementById("adminProperties").innerHTML =
            properties.length
                ? properties.map(p => `

                    <div class="admin-item">

                        <span class="status ${p.status}">
                            ${p.status}
                        </span>

                        <h2>
                            ${esc(p.propertyName || p.name)}
                        </h2>

                        <p>
                            ${esc(p.location)}
                            · ₹${esc(p.price)}/night
                            · Host: ${esc(p.hostName || "Demo Property")}
                        </p>

                        <div class="admin-photos">

                            ${(p.images || p.photos || (p.image ? [p.image] : []))
                                .map(x => `
                                    <img
                                        src="${x}"
                                        alt="${esc(p.propertyName)}"
                                    >
                                `)
                                .join("")}

                        </div>

                        ${
                            p.video
                                ? `
                                    <video
                                        class="story"
                                        src="${p.video}"
                                        controls
                                    ></video>
                                `
                                : ""
                        }

                        <p>
                            ${esc(p.description)}
                        </p>

                        ${
    p.status === "pending"
        ? `
            <div class="actions">

                <button
                    class="btn"
                    onclick="review('${p.id}', 'approved')"
                >
                    Approve
                </button>

                <button
                    class="btn danger"
                    onclick="review('${p.id}', 'rejected')"
                >
                    Reject
                </button>

            </div>
        `
        : p.status === "approved"
    ? `
        <div class="actions">

            <button
                class="btn"
                onclick="review('${p.id}', 'pending')"
            >
                Unpublish
            </button>

            <button
                class="btn danger"
                onclick="deleteProperty('${p.id}')"
            >
                Delete
            </button>

        </div>
    `
            : `
                <div class="actions">

                    <button
                        class="btn"
                        onclick="review('${p.id}', 'approved')"
                    >
                        Approve
                    </button>

                </div>
            `
}

                    </div>

                `).join("")
                : "<p>No properties submitted.</p>";


        // Load booking / tour requests
        const requestsResponse =
            await fetch("/api/admin/requests");

        const requests = await requestsResponse.json();

        document.getElementById("adminRequests").innerHTML =
            requests.length
                ? requests.map(r => `

                    <div class="admin-item">

                        ${esc(r.type)}
                        —
                        ${esc(r.propertyName)}
                        —
                        ${esc(r.travelerName)}
                        —
                        ${esc(r.status)}

                    </div>

                `).join("")
                : "<p>No requests.</p>";
    }


    // Approve / reject property
    window.review = async function (id, status) {

    const response = await fetch(
        "/api/admin/properties/" + id,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: status
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        alert(data.error || "Unable to update property.");
        return;
    }

    await load();
};


    // Escape HTML
    function esc(s) {

        return String(s).replace(
            /[&<>"']/g,
            m => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[m])
        );

    }

})();


async function logout() {

    await fetch("/api/logout", {
        method: "POST"
    });

    location.href = "/admin-login.html";

}

window.deleteProperty = async function (id) {

    const confirmed = confirm(
        "Are you sure you want to permanently delete this property?"
    );

    if (!confirmed) {
        return;
    }

    const response = await fetch(
        "/api/admin/properties/" + id,
        {
            method: "DELETE"
        }
    );

    const data = await response.json();

    if (!response.ok) {
    alert(
        "Status: " + response.status +
        "\n" +
        (data.error || JSON.stringify(data))
    );
    return;
}

    alert("Property deleted successfully.");

    await load();
};