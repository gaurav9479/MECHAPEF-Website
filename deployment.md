# Deployment Guide 🚀

This document outlines the steps to deploy the MECHAPEF-Website (MERN stack with BullMQ & Redis).

## Prerequisites
1. **Frontend**: Vercel or Render.
2. **Backend**: Render (or any Node.js hosting).
3. **Database**: MongoDB Atlas.
4. **Queue / Cache**: Upstash Redis (Free Tier).
5. **Storage**: ImageKit.

## 1. Environment Variables Setup
Ensure your production `.env` files contain the following:

### Backend (`/backend/.env`)
```env
PORT=5000
NODE_ENV=production
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secure_jwt_secret
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Storage
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# Redis for BullMQ
REDIS_URL=rediss://default:your_upstash_password@your-upstash-url.upstash.io:6379
```

### Frontend (`/Client/.env`)
```env
VITE_API_URL=https://your-backend-domain.onrender.com/api
```

## 2. Deploying Backend on Render
1. Create a **Web Service** on Render.
2. Connect your GitHub repository.
3. Set the **Root Directory** to `backend`.
4. Set the **Build Command** to: `npm install`
5. Set the **Start Command** to: `npm start`
6. Add all the Environment Variables from above.
7. Click **Deploy**.

## 3. Deploying Frontend on Vercel (Recommended)
1. Go to Vercel and import your GitHub repository.
2. Set the **Root Directory** to `Client`.
3. The framework preset should automatically detect **Vite**.
4. Add the `VITE_API_URL` to the Environment Variables.
5. Click **Deploy**.

## 4. Local Development (Docker) 🐳
For local development, especially on Windows where setting up Redis can be challenging, the project is fully containerized. You do not need to install Node.js, MongoDB, or Redis locally.

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Run the following command in the root directory:
   ```bash
   docker-compose up -d --build
   ```
3. This single command will start:
   - **Frontend (Vite)** on `http://localhost:5173`
   - **Backend (Express)** on `http://localhost:5000`
   - **Redis (Alpine)** on `localhost:6379` (Automatically connected to BullMQ)
4. Hot-reloading is configured. Any changes you make to the code will reflect instantly in the containers.

## 5. Handling Traffic Spikes (Event Day)
- **Redis Connection**: The presence of `REDIS_URL` in your backend automatically shifts registrations into the BullMQ queue to prevent MongoDB crashes.
- **Render Sleep Avoidance**: The backend has a cron job that pings itself every 10 minutes, but *only* on the day of the event. Make sure you create the event in the Admin Dashboard with the correct start date!
