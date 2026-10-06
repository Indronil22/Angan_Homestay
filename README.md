# Angan MVP

A simple Angan homestay marketplace using:
- HTML/CSS/Vanilla JavaScript
- Node.js + Express
- Session authentication
- bcrypt password hashing
- JSON files for persistence (no database)
- Multer for image/video uploads

## Run

Install Node.js 18+.

```bash
npm install
npm start
```

Open http://localhost:3000

## Accounts

Admin:
- Email: admin@angan.com
- Password: ChangeMe123!

Change the admin password and SESSION_SECRET before production.

## Public URLs

- / — traveler homepage
- /register.html — traveler/host registration
- /login.html — normal login
- /host.html — host property submission
- /host-dashboard.html — host dashboard
- /admin-login.html — private admin login
- /admin-dashboard.html — admin dashboard

## Current workflow

Host registers → logs in → uploads property → property is pending → admin logs in → approves → property becomes public.

Traveler registers → views approved listing → requests booking/live tour → host sees request → host accepts/declines.

## Important prototype limitations

This intentionally has no database. Users/properties/requests are stored in JSON files under /data. Uploaded media is stored under /uploads.

For production, replace JSON persistence with a real database, use object storage for media, use HTTPS, a production session store, CSRF protection, rate limiting, email/WhatsApp notifications, and proper legal/privacy/cancellation flows.
