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

## 4. Handling Traffic Spikes (Event Day)
- **Redis Connection**: The presence of `REDIS_URL` in your backend automatically shifts registrations into the BullMQ queue to prevent MongoDB crashes.
- **Render Sleep Avoidance**: The backend has a cron job that pings itself every 10 minutes, but *only* on the day of the event. Make sure you create the event in the Admin Dashboard with the correct start date!
