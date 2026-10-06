// =========================================================
// LOAD HEADER & FOOTER
// =========================================================

async function loadComponents() {

    const header = document.getElementById("header");
    const footer = document.getElementById("footer");


    if (header) {

        const response =
            await fetch("/components/header.html");

        header.innerHTML =
            await response.text();

    }


    if (footer) {

        const response =
            await fetch("/components/footer.html");

        footer.innerHTML =
            await response.text();

    }


    // Mobile menu
    const menuBtn =
        document.getElementById("menuBtn");

    const navbarLinks =
        document.querySelector(".navbar-links");


    if (menuBtn && navbarLinks) {

        menuBtn.addEventListener("click", () => {

            navbarLinks.classList.toggle("active");

        });

    }

}


loadComponents();

const destinationImages = [
    "/images/hero-1.jpg",
    "/images/hero-2.jpg",
    "/images/hero-3.jpg",
    "/images/hero-4.jpg",
    "/images/hero-5.jpg"
];


const hero = document.querySelector(".hero");

const indicators =
    document.querySelectorAll(".hero-indicator");


if (hero) {

    let currentImage = 0;


    function showHero(index) {

        hero.style.backgroundImage =
            `url("${destinationImages[index]}")`;


        indicators.forEach((indicator, i) => {

            indicator.classList.toggle(
                "active",
                i === index
            );

        });

    }


    showHero(0);


    setInterval(() => {

        currentImage++;

        if (currentImage >= destinationImages.length) {
            currentImage = 0;
        }

        showHero(currentImage);

    }, 4000);

}

// ================= MOBILE MENU =================

//const menuBtn = document.getElementById("menuBtn");
//const navbarLinks = document.querySelector(".navbar-links");

//if (menuBtn && navbarLinks) {
  //menuBtn.addEventListener("click", () => {
   // navbarLinks.classList.toggle("active");
  //});
//}


// ================= LOAD PROPERTIES =================

(async function () {

  const grid = document.getElementById("grid");

  // If this page doesn't have the property grid,
  // don't run the property loading code.
  if (!grid) return;

  const r = await fetch("/api/properties");
  const properties = await r.json();

  if (!properties.length) {
    grid.innerHTML =
      "<p>No approved homestays yet. Be the first host to join Angan.</p>";
    return;
  }

  grid.innerHTML = properties.map(p => `
    <a class="card" href="/property.html?id=${p.id}">

      <img
        src="${p.photos[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1000&q=80"}"
        alt="${escapeHtml(p.propertyName)}"
      >

      <div class="card-body">

        <p class="eyebrow">
          ${escapeHtml(p.location)}
        </p>

        <h3>
          ${escapeHtml(p.propertyName)}
        </h3>

        <p class="muted">
          ${escapeHtml(p.rooms)} rooms ·
          Hosted by ${escapeHtml(p.hostName)}
        </p>

        <strong>
          ₹${escapeHtml(p.price)} / night
        </strong>

      </div>

    </a>
  `).join("");

})();


// ================= ESCAPE HTML =================

function escapeHtml(s) {
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

const featuredGrid = document.getElementById("featuredGrid");

if (featuredGrid) {
    fetch("/api/properties")
        .then(response => {
            if (!response.ok) {
                throw new Error("Could not load properties");
            }

            return response.json();
        })
        .then(data => {

            const approvedProperties = data.filter(
                property => property.status === "approved"
            );

            featuredGrid.innerHTML = "";

            approvedProperties.forEach(property => {

                featuredGrid.innerHTML += `
                    <article class="stay-card" onclick="window.location.href='/property.html?id=${property.id}'">

                        <div class="stay-image">
                            <img
                                src="${property.image}"
                                alt="${property.name}"
                            >

                            <span class="stay-location">
                                ${property.location}
                            </span>
                        </div>

                        <div class="stay-content">

                            <h3>
                                ${property.name}
                            </h3>

                            <p>
                                ${property.description}
                            </p>

                            <div class="stay-bottom">
                                <span>
                                    ₹${property.price} / night
                                </span>

                                <span>
                                    ★ ${property.rating}
                                </span>
                            </div>

                        </div>

                    </article>
                `;
            });
        })
        .catch(error => {
            console.error("Featured properties error:", error);

            featuredGrid.innerHTML =
                "<p>Unable to load homestays right now.</p>";
        });
}