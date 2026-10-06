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

        // Support both the old "image" field
        // and the new "images" array
        const images = property.images?.length
            ? property.images
            : [property.image];

        // Show maximum 5 photos in the main gallery
        const visibleImages = images.slice(0, 5);

        root.innerHTML = `
            <div class="property-gallery">

                <div class="gallery-main">
                    <img
                        src="${visibleImages[0]}"
                        alt="${esc(property.name)}"
                    >
                </div>

                <div class="gallery-side">

                    ${visibleImages.slice(1).map((image, index) => {

                        const actualIndex = index + 1;
                        const remaining = images.length - 5;

                        return `
                            <div class="gallery-small">

                                <img
                                    src="${image}"
                                    alt="${esc(property.name)}"
                                >

                                ${
                                    actualIndex === 4 && remaining > 0
                                        ? `
                                            <button
                                                class="see-more-btn"
                                                onclick="openGallery()"
                                            >
                                                see more
                                            </button>
                                        `
                                        : ""
                                }

                            </div>
                        `;

                    }).join("")}

                </div>

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

            <!-- Full gallery modal -->

            <div id="galleryModal" class="gallery-modal">

                <button
                    class="gallery-close"
                    onclick="closeGallery()"
                >
                    ×
                </button>

                <div class="gallery-modal-content">

                    ${images.map(image => `
                        <img
                            src="${image}"
                            alt="${esc(property.name)}"
                        >
                    `).join("")}

                </div>

            </div>
        `;

        // Open full gallery
        window.openGallery = function () {

            document
                .getElementById("galleryModal")
                .classList.add("active");

            document.body.style.overflow = "hidden";
        };

        // Close full gallery
        window.closeGallery = function () {

            document
                .getElementById("galleryModal")
                .classList.remove("active");

            document.body.style.overflow = "";
        };


        // Booking / tour request
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