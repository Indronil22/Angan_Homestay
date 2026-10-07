async function loadBlogs() {

    const container = document.getElementById("blogList");

    try {

        const response = await fetch("/api/blogs");

        if (!response.ok) {
            throw new Error("Unable to load blogs.");
        }

        const blogs = await response.json();

        if (!blogs.length) {

            container.innerHTML = `
                <p>No blog posts available yet.</p>
            `;

            return;
        }

        container.innerHTML = `
            <div class="blog-grid">

                ${blogs
                    .slice()
                    .reverse()
                    .map((blog, index) => `

                        <article class="blog-card">

                            <div class="blog-card-number">
                                Blog ${blogs.length - index}
                            </div>

                            ${
                                blog.coverImage
                                    ? `
                                        <img
                                            src="${blog.coverImage}"
                                            alt="${escapeBlogText(blog.title)}"
                                            class="blog-card-image"
                                        >
                                      `
                                    : `
                                        <div class="blog-card-image blog-card-placeholder">
                                            HomeStay Gallery
                                        </div>
                                      `
                            }

                            <div class="blog-card-content">

                                <p class="blog-category">
                                    ${escapeBlogText(
                                        blog.category || "Travel"
                                    )}
                                </p>

                                <h2>
                                    ${escapeBlogText(blog.title)}
                                </h2>

                                <p class="blog-date">
                                    ${new Date(
                                        blog.createdAt
                                    ).toLocaleDateString()}
                                </p>

                                <p class="blog-summary">
                                    ${escapeBlogText(
                                        blog.summary || ""
                                    )}
                                </p>

                                <a
                                    href="/blog-post.html?id=${encodeURIComponent(blog.id)}"
                                    class="btn"
                                >
                                    Read More
                                </a>

                            </div>

                        </article>

                    `)
                    .join("")}

            </div>
        `;

    } catch (error) {

        console.error("Blog loading error:", error);

        container.innerHTML = `
            <p>Unable to load blog posts.</p>
        `;
    }
}


function escapeBlogText(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


document.addEventListener("DOMContentLoaded", () => {
    loadBlogs();
});