# GigShield AI

A production-grade parametric insurance platform for gig workers that provides automated income protection based on environmental disruptions.

## 🏗️ System Architecture

### Core Principles

1. **Event-Driven**: System revolves around external environmental events (rainfall, AQI)
2. **Automated Claims**: No manual intervention - claims are automatically generated, evaluated, and processed
3. **Fraud Detection**: Every claim passes through an AI-like fraud detection engine
4. **Financial Controls**: Strict policy enforcement with weekly caps and waiting periods

### System Flow

```
1. User Registration → Risk Score Calculated
2. Policy Creation → 24-hour Waiting Period Starts
3. Cron Job → Monitors Weather & AQI APIs (Every 2-10 minutes)
4. Environmental Trigger → If threshold exceeded, Trigger Created
5. Claim Processing → Find affected users, check policies
6. Fraud Detection → Analyze claim patterns
7. Payout → If approved, credit wallet (Max ₹300/week)
```

## 🛠️ Tech Stack

**Frontend**
- React 18 with Vite
- Tailwind CSS
- React Router
- Axios
- Chart.js (for dashboards)

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- node-cron for scheduled jobs

**External APIs**
- OpenWeather (weather data)
- WAQI (air quality index)

## 📦 Project Structure

```
GigShield-AI/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── controllers/     # API handlers
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic (engines)
│   ├── middleware/      # Auth middleware
│   ├── cron/            # Scheduled jobs
│   ├── config/          # Database config
│   ├── server.js        # Express app
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── services/    # API service
│   │   ├── context/     # Auth context
│   │   ├── App.jsx      # App router
│   │   └── main.jsx     # Entry point
│   ├── vite.config.js   # Vite configuration
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

**Backend runs on:** http://localhost:5000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend runs on:** http://localhost:3000

## 📚 Core Modules

### 1. Authentication System (`backend/controllers/authController.js`)
- **POST /api/auth/register** - User registration with risk score calculation
- **POST /api/auth/login** - Login and JWT token generation
- **GET /api/auth/profile** - Get user profile (requires auth)

### 2. Policy System (`backend/services/policyService.js`)
- **POST /api/policy/create** - Create 7-day policy with 24h waiting period
- **GET /api/policy/me** - Get active policy
- **GET /api/policy/all** - Get all policies

**Key Logic:**
- Policy valid for 7 days
- Waiting period: 24 hours (user can't claim in first 24h)
- Weekly payout cap: ₹300 per user
- Premium calculated using Risk Engine

### 3. Risk Engine (`backend/services/riskEngine.js`)
Calculates risk score based on:
- Location (Delhi: +30, Mumbai: +40, etc.)
- Weekly income (>₹20K: +10)
- Max score: 100

Premium tiers:
- Score < 30: ₹49
- Score < 70: ₹69
- Score ≥ 70: ₹99

### 4. Trigger Engine (`backend/cron/triggerCron.js`)
Runs every 2 minutes (development) or 10 minutes (production):
- Fetches weather data (OpenWeather API)
- Fetches AQI data (WAQI API)
- Creates triggers when thresholds exceeded:
  - **RAIN**: > 40mm
  - **AQI**: > 300

### 5. Claim Processing Engine (`backend/services/claimProcessingService.js`)
When a trigger fires:
1. Find all users in affected city
2. Check if user has active policy
3. Check waiting period
4. Check for duplicate claims
5. Calculate payout
6. Check weekly payout cap
7. Run fraud detection
8. Approve or flag claim

### 6. Fraud Detection Engine (`backend/services/fraudEngine.js`)
Analyzes each claim for fraud patterns:
- **Location mismatch**: User not in trigger city (+40)
- **Claim frequency**: >2 claims in 7 days (+30)
- **Duplicate claim**: Same user + trigger (+60)

**Fraud decision:**
- Score ≥ 70: FLAGGED
- Score < 70: APPROVED

### 7. Payout Engine (`backend/services/payoutEngine.js`)
- Max weekly payout per user: ₹300
- Event budgets:
  - RAIN: ₹5000
  - AQI: ₹3000
- Payout scaled by risk score (higher risk = higher payout)
- Max individual payout per event: ₹150

### 8. Claims Cron Job (`backend/cron/claimProcessingCron.js`)
Runs every 1 minute (development) or 5 minutes (production):
- Processes unprocessed triggers
- Generates and evaluates claims
- Marks triggers as processed

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login user
GET    /api/auth/profile       - Get user profile (auth required)
```

### Policy
```
POST   /api/policy/create      - Create policy (auth required)
GET    /api/policy/me          - Get active policy (auth required)
GET    /api/policy/all         - Get all policies (auth required)
```

### Claims
```
GET    /api/claims/my          - Get my claims (auth required)
```

### Admin (requires X-Admin-Key header)
```
GET    /api/admin/stats        - Dashboard stats
GET    /api/admin/users        - All users
GET    /api/admin/triggers     - All triggers
```

## 🔒 Authentication

- JWT-based authentication
- Tokens stored in browser localStorage
- Tokens expire after 30 days
- Password hashed with bcrypt (salt rounds: 10)

**Header format:**
```
Authorization: Bearer <token>
```

## 💰 Financial Controls

### Waiting Period
- 24 hours after policy creation
- User cannot receive payouts during this period

### Weekly Payout Cap
- Maximum ₹300 per user per week
- Resets on Sunday
- Enforced per policy

### Event Budget
- RAIN triggers: ₹5000 max per event
- AQI triggers: ₹3000 max per event
- Prevents system from over-paying

## 🧪 Testing

### Manual Testing Flow

1. **Register User**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "phone": "9876543210",
       "password": "password123",
       "city": "Delhi",
       "avgWeeklyIncome": 15000
     }'
   ```

2. **Login**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "phone": "9876543210",
       "password": "password123"
     }'
   ```

3. **Create Policy**
   ```bash
   curl -X POST http://localhost:5000/api/policy/create \
     -H "Authorization: Bearer <token>"
   ```

4. **Wait for Trigger** (Check logs for automatic trigger generation)

5. **Get Claims**
   ```bash
   curl -X GET http://localhost:5000/api/claims/my \
     -H "Authorization: Bearer <token>"
   ```

## 🐳 Docker Deployment

```bash
# Backend
docker build -t gigshield-backend ./backend
docker run -p 5000:5000 \
  -e MONGODB_URI=mongodb://mongo:27017/gigshield-ai \
  -e JWT_SECRET=your_secret \
  gigshield-backend

# Frontend
docker build -t gigshield-frontend ./frontend
docker run -p 3000:3000 gigshield-frontend
```

## 📝 Environment Variables

**Backend (.env)**
```
MONGODB_URI=mongodb://localhost:27017/gigshield-ai
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
NODE_ENV=development
OPENWEATHER_API_KEY=your_api_key
WAQI_API_KEY=your_api_key
ADMIN_KEY=demo-admin-key
```

**Frontend (.env.local)**
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 🔐 Security

- JWT tokens for API authentication
- bcrypt password hashing
- CORS enabled for frontend
- Input validation on all endpoints
- Rate limiting recommended for production

## 📈 Monitoring

### Backend Logs
- Cron job execution
- Trigger creation
- Claim processing
- Payouts credited
- Fraud flags

Watch logs:
```bash
npm run dev
```

## 🚨 Important Rules

✅ **DO:**
- Always check policy status before payout
- Run fraud detection on every claim
- Enforce weekly payout caps
- Prevent duplicate claims with database unique index
- Keep business logic in services, not routes

❌ **DON'T:**
- Allow instant payouts after registration
- Skip fraud checks
- Create multiple claims for same trigger
- Harden code payouts without logic
- Ignore waiting period

## 🔄 Data Flow Example

```
1. User "Anuj" registers in Delhi with ₹15000/week income
   → Risk score: 30 (Delhi) + 0 (income) = 30
   → Premium: ₹49

2. Policy created, waiting period until tomorrow 3 PM

3. Next day 3 PM: Rainfall detected in Delhi (45mm)
   → Trigger created (RAIN, Delhi, 45)
   → Claim processing job triggered

4. Claim processor finds Anuj in Delhi
   → ✓ Has active policy
   → ✓ Outside waiting period
   → ✓ No duplicate claim
   → Calculate payout: ₹50 (scaled by risk)
   → ✓ Within weekly cap (50 < 300)
   → Fraud score: 0 (location matches)
   → Status: APPROVED
   → ₹50 credited to Anuj's wallet
   → Policy.weeklyPayoutUsed += 50

5. Anuj sees ₹50 in wallet on Dashboard
```
Ream

**Built with ❤️ for gig workers**