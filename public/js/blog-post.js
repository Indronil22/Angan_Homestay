async function loadBlogPost() {

    const container = document.getElementById("blogPost");

    const params = new URLSearchParams(window.location.search);
    const blogId = params.get("id");

    if (!blogId) {
        container.innerHTML = `
            <h1>Blog post not found.</h1>
            <a href="/blog.html">← Back to Blog</a>
        `;
        return;
    }

    try {

        const response = await fetch(
            `/api/blogs/${encodeURIComponent(blogId)}`
        );

        if (!response.ok) {
            throw new Error("Blog post not found.");
        }

        const blog = await response.json();

        document.title = `${blog.title} — HomeStay Gallery`;

        container.innerHTML = `

            ${
                blog.coverImage
                    ? `
                        <img
                            src="${blog.coverImage}"
                            alt="${escapeBlogText(blog.title)}"
                            class="blog-post-image"
                        >
                      `
                    : ""
            }

            <p class="blog-category">
                ${escapeBlogText(blog.category || "Travel")}
            </p>

            <h1>
                ${escapeBlogText(blog.title)}
            </h1>

            <p class="blog-date">
                ${new Date(blog.createdAt).toLocaleDateString()}
            </p>

            ${
                blog.summary
                    ? `
                        <p class="blog-summary">
                            ${escapeBlogText(blog.summary)}
                        </p>
                      `
                    : ""
            }

            <div class="blog-post-content">
                ${blog.content}
            </div>

        `;

    } catch (error) {

        console.error("Blog post error:", error);

        container.innerHTML = `
            <h1>Blog post not found.</h1>

            <p>
                This blog post may have been removed or is no longer published.
            </p>

            <a href="/blog.html">
                ← Back to Blog
            </a>
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
    loadBlogPost();
});