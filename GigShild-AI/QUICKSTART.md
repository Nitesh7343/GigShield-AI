# GigShield AI - Quick Start Guide

## 🚀 Start the Project - 3 Options

### Option 1: Local Development (Recommended for Development)

**Prerequisites:** Node.js 16+, MongoDB

#### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
✅ Backend runs on http://localhost:5000

#### Frontend (in new terminal)
```bash
cd frontend
npm install
npm run dev
```
✅ Frontend runs on http://localhost:3000

---

### Option 2: Docker Compose (Recommended for Production-like setup)

**Prerequisites:** Docker, Docker Compose

```bash
# From project root
docker-compose up --build
```

✅ Frontend: http://localhost:3000
✅ Backend: http://localhost:5000
✅ MongoDB: localhost:27017

To stop:
```bash
docker-compose down
```

---

### Option 3: Manual Docker (if using custom setup)

```bash
# Start MongoDB
docker run -p 27017:27017 mongo:5.0

# Backend (in new terminal)
cd backend
docker build -t gigshield-backend .
docker run -p 5000:5000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/gigshield-ai \
  -e JWT_SECRET=demo-secret \
  gigshield-backend

# Frontend (in new terminal)
cd frontend
docker build -t gigshield-frontend .
docker run -p 3000:3000 gigshield-frontend
```

---

## 📱 Testing the Application

### 1. Open Frontend
```
http://localhost:3000
```

### 2. Register a User
- Go to `/register`
- Fill in details:
  - Phone: `9876543210`
  - City: `Delhi`
  - Weekly Income: `15000`
  - Password: `test123`

### 3. Login
- Phone: `9876543210`
- Password: `test123`

### 4. Create Policy
- Click "Create Policy"
- Wait 24 hours for waiting period OR modify backend code for instant activation

### 5. Watch Triggers
- Backend logs will show environmental monitoring every 2 minutes
- When rainfall > 40mm or AQI > 300 detected, claims are auto-generated
- Check Dashboard → Claims section to see claims

### 6. Admin Dashboard (Backend Only)
```bash
curl -X GET http://localhost:5000/api/admin/stats \
  -H "X-Admin-Key: demo-admin-key"
```

---

## 🔧 Development Tweaks

### Fast-track Testing (Skip Waiting Period)

Edit `backend/controllers/policyController.js`:
```javascript
// Line 32-33: Change waiting period to 0 for testing
const waitingPeriodEnds = new Date(startDate); // Same as start time
// waitingPeriodEnds.setHours(waitingPeriodEnds.getHours() + 24);
```

### Trigger More Often
Edit `backend/cron/triggerCron.js`:
```javascript
// Line 45: Change schedule
const schedule = '* * * * *'; // Every minute instead of every 10
```

### Enable Real Weather API
1. Get API keys:
   - OpenWeather: https://openweathermap.org/api
   - WAQI: https://waqi.info/api

2. Add to `.env`:
   ```
   OPENWEATHER_API_KEY=your_key_here
   WAQI_API_KEY=your_key_here
   ```

---

## 📊 Expected Behavior Timeline

1. **User registers** → Risk score calculated
2. **Policy created** → Loading... waiting period active
3. **24h later** → Policy active, claims eligible
4. **Every 2 minutes** → Cron job checks weather/AQI
5. **Trigger generated** → (45mm rain or AQI 300+)
6. **1 minute later** → Claims processing runs
7. **Claims created** → For all users in affected city
8. **Fraud detection** → Validates each claim
9. **Payouts approved** → If fraud score < 70
10. **Wallet updated** → User sees credit on dashboard

---

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `docker run -p 27017:27017 mongo:5.0`
- Check `MONGODB_URI` in `.env`

### Frontend Can't Connect to Backend
- Check backend is running: http://localhost:5000/api/health
- Verify CORS is enabled in backend
- Check API URL in frontend

### No Claims Being Generated
- Check backend logs for trigger creation
- Verify policy is outside waiting period
- Check weekend (claims reset on Sunday)

### Docker Build Fails
- Run `npm install` locally first
- Clear Docker cache: `docker-compose down --volumes`

---

## 📞 Support Commands

### Backend Health Check
```bash
curl http://localhost:5000/api/health
```

### Get Admin Stats
```bash
curl -X GET http://localhost:5000/api/admin/stats \
  -H "X-Admin-Key: demo-admin-key"
```

### View Backend Logs
```bash
docker-compose logs -f backend
```

### Reset Everything
```bash
docker-compose down -v
docker-compose up --build
```

---

## ✅ Checklist

- [ ] MongoDB running
- [ ] Backend started (port 5000)
- [ ] Frontend started (port 3000)
- [ ] Can register user
- [ ] Can login
- [ ] Can create policy
- [ ] See claims in dashboard (after 24h + trigger)

---

**Ready to test? Open http://localhost:3000 now!**
