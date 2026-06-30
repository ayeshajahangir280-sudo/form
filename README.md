# Indoor Champions Registration Backend

Express + MongoDB backend for the registration form. It is ready for Vercel serverless deployment.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Put your real MongoDB password in `.env`:

```bash
MONGODB_URI=mongodb+srv://ayeshajahangir33344_db_user:YOUR_PASSWORD@cluster0.ibyk2xl.mongodb.net/registrations?retryWrites=true&w=majority&appName=Cluster0
```

3. Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:4000`.

## Vercel environment variables

Set these in the Vercel project settings:

```bash
MONGODB_URI=mongodb+srv://ayeshajahangir33344_db_user:YOUR_PASSWORD@cluster0.ibyk2xl.mongodb.net/registrations?retryWrites=true&w=majority&appName=Cluster0
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

Cloudinary is optional. If you add these, uploaded photos are stored in Cloudinary. If you skip them, photos are stored in MongoDB as data URLs.

```bash
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Routes

- `GET /api/health`
- `GET /api/registrations`
- `POST /api/registrations`

For the frontend, set `VITE_API_BASE_URL` to this backend's deployed Vercel URL.
