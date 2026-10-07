let editingBlogId = null;

function showBlogForm(blog = null) {

    editingBlogId = blog ? blog.id : null;

    document.getElementById("blogForm").innerHTML = `
        <div class="admin-blog-form">

            <h3>
                ${blog ? "Edit Blog Post" : "Create New Blog"}
            </h3>

            <label>
                Title
                <input
                    type="text"
                    id="blogTitle"
                    value="${blog ? escapeAttribute(blog.title) : ""}"
                    placeholder="Enter blog title"
                    required
                >
            </label>

            <label>
                Summary
                <textarea
                    id="blogSummary"
                    rows="3"
                    placeholder="Short description of the blog"
                >${blog ? escapeBlogText(blog.summary || "") : ""}</textarea>
            </label>

            <label>
                Category
                <input
                    type="text"
                    id="blogCategory"
                    value="${blog ? escapeAttribute(blog.category || "Travel") : "Travel"}"
                    placeholder="Travel"
                >
            </label>

            <label>
    Cover Image
    <input
        type="file"
        id="blogCoverImage"
        accept="image/jpeg,image/png,image/webp"
    >

    <small>
        JPG, PNG or WEBP — maximum 5 MB
    </small>

    ${blog && blog.coverImage
            ? `
                <div style="margin-top: 10px;">
                    <img
                        src="${escapeAttribute(blog.coverImage)}"
                        alt="Current cover image"
                        style="
                            width: 220px;
                            height: 130px;
                            object-fit: cover;
                            border-radius: 8px;
                        "
                    >
                </div>
              `
            : ""
        }
</label>

            <label>
                Content
                <textarea
                    id="blogContent"
                    rows="15"
                    placeholder="Write your blog content here..."
                    required
                >${blog ? escapeBlogText(blog.content || "") : ""}</textarea>
            </label>

            <label>
                Status
                <select id="blogStatus">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                </select>
            </label>

            <div class="admin-blog-actions">

                <button class="btn" onclick="saveBlog()">
                    ${blog ? "Update Blog" : "Create Blog"}
                </button>

                <button class="btn outline" onclick="cancelBlogForm()">
                    Cancel
                </button>

            </div>

        </div>
    `;

    if (blog) {
        document.getElementById("blogStatus").value = blog.status;
    }
}


async function loadAdminBlogs() {

    try {

        const response = await fetch("/api/admin/blogs");

        if (!response.ok) {
            throw new Error("Unable to load blogs.");
        }

        const blogs = await response.json();

        const container = document.getElementById("adminBlogs");

        if (!blogs.length) {
            container.innerHTML = "<p>No blog posts yet.</p>";
            return;
        }

        container.innerHTML = blogs
            .slice()
            .reverse()
            .map(blog => `
                <div class="admin-blog-card">

                    <div>
                        <h3>${escapeBlogText(blog.title)}</h3>

                        <p>
                            ${escapeBlogText(blog.summary || "No summary")}
                        </p>

                        <small>
                            ${escapeBlogText(blog.category || "Travel")}
                            •
                            ${escapeBlogText(blog.status)}
                            •
                            ${new Date(blog.createdAt).toLocaleDateString()}
                        </small>
                    </div>

                    <div class="admin-blog-actions">

                        <button
                            class="btn"
                            onclick="editBlog('${blog.id}')"
                        >
                            Edit
                        </button>

                        <button
                            class="btn outline"
                            onclick="deleteBlog('${blog.id}')"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `)
            .join("");

    } catch (error) {

        console.error("Admin blog error:", error);

        document.getElementById("adminBlogs").innerHTML =
            "<p>Unable to load blog posts.</p>";
    }
}


async function saveBlog() {

    const title =
        document.getElementById("blogTitle").value.trim();

    const summary =
        document.getElementById("blogSummary").value.trim();

    const category =
        document.getElementById("blogCategory").value.trim();

    const content =
        document.getElementById("blogContent").value.trim();

    const status =
        document.getElementById("blogStatus").value;

    const imageInput =
        document.getElementById("blogCoverImage");

    if (!title || !content) {
        alert("Title and content are required.");
        return;
    }

    try {

        let coverImage = "";

        /*
         * Upload cover image if selected
         */
        if (imageInput && imageInput.files.length > 0) {

            const formData = new FormData();

            formData.append(
                "coverImage",
                imageInput.files[0]
            );

            const uploadResponse = await fetch(
                "/api/admin/blogs/upload-image",
                {
                    method: "POST",
                    body: formData
                }
            );

            const uploadResult =
                await uploadResponse.json();

            if (!uploadResponse.ok) {
                throw new Error(
                    uploadResult.error ||
                    "Unable to upload image."
                );
            }

            coverImage =
                uploadResult.imageUrl;

        }

        /*
         * Keep existing image when editing
         */
        if (!coverImage && editingBlogId) {

            const blogsResponse =
                await fetch("/api/admin/blogs");

            const blogs =
                await blogsResponse.json();

            const existingBlog =
                blogs.find(
                    blog => blog.id === editingBlogId
                );

            if (existingBlog) {
                coverImage =
                    existingBlog.coverImage || "";
            }
        }

        const data = {
            title,
            summary,
            category,
            coverImage,
            content,
            status
        };

        const url = editingBlogId
            ? `/api/admin/blogs/${editingBlogId}`
            : "/api/admin/blogs";

        const method = editingBlogId
            ? "PUT"
            : "POST";

        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                "Unable to save blog."
            );
        }

        alert(
            editingBlogId
                ? "Blog updated successfully."
                : "Blog created successfully."
        );

        editingBlogId = null;

        document.getElementById(
            "blogForm"
        ).innerHTML = "";

        loadAdminBlogs();

    } catch (error) {

        console.error(
            "Save blog error:",
            error
        );

        alert(error.message);
    }
}


async function editBlog(id) {

    try {

        const response = await fetch("/api/admin/blogs");

        if (!response.ok) {
            throw new Error("Unable to load blogs.");
        }

        const blogs = await response.json();

        const blog = blogs.find(item => item.id === id);

        if (!blog) {
            alert("Blog post not found.");
            return;
        }

        showBlogForm(blog);

    } catch (error) {

        console.error("Edit blog error:", error);

        alert("Unable to edit blog.");
    }
}


async function deleteBlog(id) {

    if (!confirm("Are you sure you want to delete this blog post?")) {
        return;
    }

    try {

        const response = await fetch(
            `/api/admin/blogs/${id}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Unable to delete blog."
            );
        }

        alert("Blog deleted successfully.");

        loadAdminBlogs();

    } catch (error) {

        console.error("Delete blog error:", error);

        alert(error.message);
    }
}


function cancelBlogForm() {

    editingBlogId = null;

    document.getElementById("blogForm").innerHTML = "";
}


function escapeBlogText(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

    return escapeBlogText(value);
}


document.addEventListener("DOMContentLoaded", () => {

    loadAdminBlogs();

});