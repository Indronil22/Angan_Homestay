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

                                ${actualIndex === 4 && remaining > 0
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
                        <h1>
    ${esc(property.propertyName || property.name)}
</h1>
                    </h1>

                    <h2>
                        ₹${esc(property.price)}
                        <small>/ night</small>
                    </h2>

                    <p>
                        ${esc(property.description)}
                    </p>

                    <p>
                        <p>
    ★ ${esc(property.rating || "New")}
</p>
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
        window.openRequest = function (type) {

            document.getElementById("requestForm").innerHTML =
                type === "booking"
                    ? `
                <form id="req">

                    <label>
                        Your Name
                        <input
                            name="name"
                            type="text"
                            required
                        >
                    </label>

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
                        <textarea
                            name="message"
                            placeholder="Optional message"
                        ></textarea>
                    </label>

                    <button class="btn" type="submit">
                        Send Request
                    </button>

                </form>
            `
                    : `
                <form id="req">

                    <label>
                        Your Name
                        <input
                            name="name"
                            type="text"
                            required
                        >
                    </label>

                    <label>
                        Preferred Date
                        <input
                            name="preferredDate"
                            type="date"
                            required
                        >
                    </label>

                    <label>
                        Preferred Time
                        <input
                            name="preferredTime"
                            type="time"
                            required
                        >
                    </label>

                    <label>
                        Message
                        <textarea
                            name="message"
                            placeholder="Optional message"
                        ></textarea>
                    </label>

                    <button class="btn" type="submit">
                        Send Request
                    </button>

                </form>
            `;


            document.getElementById("req").onsubmit = function (e) {

                e.preventDefault();

                const body = Object.fromEntries(
                    new FormData(e.target)
                );


                let message;


                if (type === "booking") {

                    message =
                        `Hi, I found your property "${property.propertyName || property.name}" on Angan.

I'd like to request a booking.

Name: ${body.name}
Check-in: ${body.checkIn}
Check-out: ${body.checkOut}
Guests: ${body.guests}
Message: ${body.message || "Looking forward to staying here."}`;


                } else {

                    message =
                        `Hi, I found your property "${property.propertyName || property.name}" on Angan.

I'd like to request a live tour.

Name: ${body.name}
Preferred date: ${body.preferredDate}
Preferred time: ${body.preferredTime}
Message: ${body.message || "I'd like to see the property."}`;

                }


                const whatsapp =
                    property.whatsapp ||
                    property.phone;


                if (!whatsapp) {

                    alert(
                        "This property does not have a WhatsApp number available."
                    );

                    return;

                }


                const phoneNumber =
                    String(whatsapp).replace(/\D/g, "");


                const whatsappUrl =
                    `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;


                window.open(
                    whatsappUrl,
                    "_blank"
                );

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