# ELV.art Website

Dynamic ELV.art website with public content sections, product detail pages, registration/login, access-level pricing, and an admin panel.

## Run

```bash
npm start
```

Open:

- Website: `http://localhost:3000`
- Admin: `http://localhost:3000/admin.html`

Default admin password:

```text
elv-admin-2026
```

For production, start the server with a stronger password:

```bash
ADMIN_TOKEN="your-secure-password" npm start
```

## Included Sections

- Solutions
- Products with categories, models, features, specifications, datasheet/manual/CAD/3D links, images, and L1/L2/L3 prices
- Case Studies
- Training video links
- Downloads
- Blogs
- About Us
- Dashboard registration and login
- Admin approval for pending users

## Remaining For Next Version

- Email verification flow
- Parts workflow completion
- Solutions main workflow completion

## Data

Content is stored in `data/db.json`. Uploaded images are stored in `public/uploads`.
