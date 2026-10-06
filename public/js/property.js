(async function () {

    const id = new URLSearchParams(location.search).get("id");
    const root = document.getElementById("property");

    try {

        const response = await fetch("/api/properties");

        if (!response.ok) {
            throw new Error("Could not load properties");
        }

        const properties = await response.json();

        const property = properties.find(
            p => String(p.id) === String(id)
        );

        if (!property) {
            root.innerHTML = "<h1>Property not found</h1>";
            return;
        }

        root.innerHTML = `
            <div class="property-gallery">
                <img
                    src="${property.image}"
                    alt="${property.name}"
                >
            </div>

            <div class="two-col">

                <div class="property-main">

                    <p class="eyebrow">
                        ${esc(property.location)}
                    </p>

                    <h1>
                        ${esc(property.name)}
                    </h1>

                    <h2>
                        ₹${esc(property.price)}
                        <small>/ night</small>
                    </h2>

                    <p>
                        ${esc(property.description)}
                    </p>

                    <p>
                        ★ ${esc(property.rating)}
                    </p>

                </div>

                <div class="request-box">

                    <h2>Interested?</h2>

                    <p>
                        Send a request to enquire about this homestay.
                    </p>

                    <button
                        class="btn"
                        onclick="openRequest('booking')"
                    >
                        Request to Book
                    </button>

                    <button
                        class="btn outline"
                        onclick="openRequest('tour')"
                    >
                        Request Live Tour
                    </button>

                    <div id="requestForm"></div>

                </div>

            </div>
        `;

        window.openRequest = async function (type) {

            const meResponse = await fetch("/api/me");
            const me = await meResponse.json();

            if (!me.user) {
                location.href = "/login.html";
                return;
            }

            document.getElementById("requestForm").innerHTML =
                type === "booking"
                    ? `
                        <form id="req">

                            <label>
                                Check-in
                                <input
                                    name="checkIn"
                                    type="date"
                                    required
                                >
                            </label>

                            <label>
                                Check-out
                                <input
                                    name="checkOut"
                                    type="date"
                                    required
                                >
                            </label>

                            <label>
                                Guests
                                <input
                                    name="guests"
                                    type="number"
                                    min="1"
                                    required
                                >
                            </label>

                            <label>
                                Message
                                <textarea name="message"></textarea>
                            </label>

                            <button class="btn">
                                Send booking request
                            </button>

                        </form>
                    `
                    : `
                        <form id="req">

                            <label>
                                Preferred date
                                <input
                                    name="preferredDate"
                                    type="date"
                                    required
                                >
                            </label>

                            <label>
                                Preferred time
                                <input
                                    name="preferredTime"
                                    type="time"
                                    required
                                >
                            </label>

                            <label>
                                Message
                                <textarea name="message"></textarea>
                            </label>

                            <button class="btn">
                                Request tour
                            </button>

                        </form>
                    `;

            document.getElementById("req").onsubmit = async function (e) {

                e.preventDefault();

                const body = Object.fromEntries(
                    new FormData(e.target)
                );

                body.propertyId = id;
                body.type = type;

                const response = await fetch(
                    "/api/requests",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(body)
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    alert(data.error || "Something went wrong");
                    return;
                }

                document.getElementById("requestForm").innerHTML =
                    "<p class='success'>Request sent successfully.</p>";
            };
        };

        function esc(value) {

            return String(value).replace(
                /[&<>"']/g,
                function (m) {
                    return {
                        "&": "&amp;",
                        "<": "&lt;",
                        ">": "&gt;",
                        '"': "&quot;",
                        "'": "&#039;"
                    }[m];
                }
            );
        }

    } catch (error) {

        console.error("Property page error:", error);

        root.innerHTML =
            "<h1>Unable to load property</h1>";
    }

})();