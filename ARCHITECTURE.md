# GigShield AI - Architecture & System Design

## 📐 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                     │
│         Home | Login | Register | Dashboard | Claims            │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Axios HTTP
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Backend (Node.js + Express)                    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ API Routes                                                 │ │
│  │ ├── /api/auth     (Register, Login, Profile)             │ │
│  │ ├── /api/policy   (Create, Get, List)                    │ │
│  │ ├── /api/claims   (Get My Claims)                        │ │
│  │ └── /api/admin    (Stats, Users, Triggers)               │ │
│  └────────────────────────────────────────────────────────────┘ │
│           ↓                                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Controllers (API Handlers)                                 │ │
│  │ ├── authController   (Validation, Auth)                  │ │
│  │ ├── policyController (Policy Logic)                      │ │
│  │ └── adminController  (Dashboard)                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│           ↓                                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Services (Business Logic)                                  │ │
│  │ ├── riskEngine         (Risk Scoring & Pricing)          │ │
│  │ ├── policyService      (Policy Helpers)                  │ │
│  │ ├── triggerService     (Trigger Management)              │ │
│  │ ├── fraudEngine        (Fraud Detection)                 │ │
│  │ ├── claimProcessingService (Claim Orchestration)         │ │
│  │ ├── payoutEngine       (Payout Logic & Wallet)           │ │
│  │ └── externalApiService (Weather & AQI)                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│           ↓                                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Cron Jobs (Asynchronous Triggers)                         │ │
│  │ ├── triggerCron       (Every 2-10 min)                   │ │
│  │ │   └── Fetches weather & AQI, creates triggers         │ │
│  │ └── claimProcessingCron (Every 1-5 min)                  │ │
│  │     └── Processes unprocessed triggers into claims        │ │
│  └────────────────────────────────────────────────────────────┘ │
│           ↓                                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Models (Database Schema)                                   │ │
│  │ ├── User        (Phone, Password, City, Income)          │ │
│  │ ├── Policy      (UserId, Premium, Dates)                 │ │
│  │ ├── Trigger     (Type, City, Value, Processed)           │ │
│  │ └── Claim       (UserId, TriggerId, Amount, Status)      │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────────┘
                       │ MongoDB Driver
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│              MongoDB (NoSQL Database)                           │
│         Collections: users, policies, triggers, claims          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 System Data Flow

### Flow 1: User Registration & Policy Creation

```
User Register (Phone, City, Income, Password)
    ↓
Hash Password (bcryptjs)
    ↓
Calculate Risk Score (riskEngine)
    ├─ Location: +30-40 based on city
    └─ Income: +10 if > 20K
    ↓
Create User Document
    ↓
Generate JWT Token
    ↓
Return Token to Frontend
    ↓
Frontend Stores Token (localStorage)
    ↓
User Creates Policy
    ↓
Get Risk Score from DB
    ↓
Calculate Premium (riskEngine)
    ├─ Score < 30: ₹49
    ├─ Score 30-70: ₹69
    └─ Score > 70: ₹99
    ↓
Set Start Date: Now + 24h (Waiting Period)
Set End Date: Start + 7 days
    ↓
Create Policy Document
    ↓
Response: Policy Details
```

### Flow 2: Environmental Monitoring & Trigger Generation

```
Every 2 Minutes (Cron Job: triggerCron)
    ↓
For Each City (Delhi, Mumbai, etc.)
    ├─ Fetch Weather Data
    │  └─ Random Mock: 30% chance rain (40-100mm)
    ├─ Fetch AQI Data
    │  └─ Random Mock: 15% chance poor (300-400)
    ├─ Check RAIN > 40mm → Create RAIN Trigger
    └─ Check AQI > 300 → Create AQI Trigger
    ↓
Trigger Document Created
    ├─ Type: RAIN or AQI
    ├─ City: affected city
    ├─ Value: measured value
    ├─ Severity: calculated
    └─ Processed: false
    ↓
Backend Logs: "[Trigger] Created RAIN trigger for Delhi"
```

### Flow 3: Claim Processing & Payout

```
Every 1 Minute (Cron Job: claimProcessingCron)
    ↓
Get Unprocessed Triggers
    ↓
For Each Unprocessed Trigger
    ├─ Find All Users in Trigger City
    │  └─ Query: User.find({ city: trigger.city })
    │
    ├─ For Each User
    │  ├─ Check: Has Active Policy?
    │  │  └─ No → Skip (no coverage)
    │  ├─ Check: Outside Waiting Period?
    │  │  └─ No → Skip (too new policy)
    │  ├─ Check: Already Claimed for this Trigger?
    │  │  └─ Yes → Skip (prevent duplicate)
    │  ├─ Calculate Payout Amount
    │  │  ├─ Event Budget: ₹5000 (RAIN) or ₹3000 (AQI)
    │  │  ├─ Risk Multiplier: 0.5 + (riskScore/100)*0.5
    │  │  ├─ Base Payout: EventBudget * 0.1 * Multiplier
    │  │  └─ Cap at ₹150
    │  ├─ Check: Exceeds Weekly Cap (₹300)?
    │  │  └─ Yes → Skip (financial control)
    │  ├─ Run Fraud Detection
    │  │  ├─ Location Mismatch: +40 if city != city
    │  │  ├─ Claim Frequency: +30 if >2 claims/week
    │  │  ├─ Duplicate: +60 if same trigger
    │  │  └─ Decision: APPROVED if < 70, else FLAGGED
    │  ├─ Create Claim Document
    │  │  ├─ Status: APPROVED or FLAGGED
    │  │  ├─ Amount: calculated payout
    │  │  └─ Fraud Score & Reasons
    │  │
    │  ├─ If APPROVED
    │  │  ├─ Credit User Wallet
    │  │  │  └─ User.walletBalance += amount
    │  │  ├─ Update Policy
    │  │  │  └─ Policy.weeklyPayoutUsed += amount
    │  │  └─ Mark Claim as PAID
    │  │
    │  └─ If FLAGGED
    │     └─ Log: "[Claim] FLAGGED: Fraud score X"
    │
    └─ Mark Trigger as Processed
    ↓
Backend Logs: "[Claim Processing] 5 approved, 2 flagged"
```

---

## 🎯 Key Design Patterns

### 1. Service Layer Pattern
**Location:** `backend/services/`

Business logic separated from API routes:
- `riskEngine.js` - Risk calculation
- `fraudEngine.js` - Fraud detection
- `payoutEngine.js` - Payout logic
- `claimProcessingService.js` - Claim orchestration

**Benefit:** Reusable, testable, maintainable

### 2. Middleware Pattern
**Location:** `backend/middleware/auth.js`

JWT authentication middleware:
```javascript
authMiddleware → Verify Token → Extract UserId → Pass to Route
```

### 3. Cron Job Pattern
**Location:** `backend/cron/`

Asynchronous periodic tasks:
- Trigger monitoring (every 2-10 min)
- Claim processing (every 1-5 min)
- Policy weekly reset (every Sunday)

**Benefit:** Event-driven architecture, no manual intervention

### 4. Controller-Route Pattern
**Location:** `backend/routes/` & `backend/controllers/`

Clean API routing:
```
Route: POST /api/auth/register
  → Controller: authController.register()
    → Service: riskEngine.calculateRisk()
    → Model: User.create()
```

---

## 💾 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  phone: String (unique),
  password: String (hashed),
  city: String (enum: ['Delhi', 'Mumbai', ...]),
  avgWeeklyIncome: Number,
  riskScore: Number (0-100),
  walletBalance: Number,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:
```
{ phone: 1 } // unique
```

### Policies Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  premium: Number,
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  weeklyPayoutUsed: Number (max: 300),
  waitingPeriodEnds: Date,
  createdAt: Date
}
```

Indexes:
```
{ userId: 1, isActive: 1 } // find active policy
```

### Triggers Collection
```javascript
{
  _id: ObjectId,
  type: String (enum: ['RAIN', 'AQI', 'TEMP']),
  city: String,
  value: Number,
  severity: String (enum: ['low', 'medium', 'high', 'critical']),
  processed: Boolean,
  createdAt: Date
}
```

Indexes:
```
{ city: 1, createdAt: -1 } // find recent triggers by city
```

### Claims Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  policyId: ObjectId (ref: Policy),
  triggerId: ObjectId (ref: Trigger),
  amount: Number,
  fraudScore: Number (0-100),
  status: String (enum: ['APPROVED', 'FLAGGED', 'REJECTED', 'PAID']),
  fraudReasons: [String],
  paidAt: Date (null until paid),
  createdAt: Date
}
```

Indexes:
```
{ userId: 1, triggerId: 1 } // unique: prevent duplicate claims
{ status: 1 } // filter by status
```

---

## 🔐 Security Considerations

### Authentication
- ✓ JWT tokens (30-day expiration)
- ✓ Password hashing (bcryptjs, 10 salt rounds)
- ✓ Token validation on protected routes

### Authorization
- ✓ Admin endpoints require X-Admin-Key header
- ✓ Users can only access their own data
- ✓ Policy enforcement via middleware

### Data Validation
- ✓ Input validation in controllers
- ✓ Required fields checked
- ✓ Enum validation for city, status, etc.

### Financial Safety
- ✓ Weekly payout caps enforced
- ✓ Waiting periods enforce (no instant payouts)
- ✓ Fraud detection before payouts
- ✓ Event budget limits

### Recommended Additional Security
- [ ] HTTPS/TLS encryption
- [ ] Rate limiting (express-rate-limit)
- [ ] Input sanitization (express-validator)
- [ ] CORS whitelist in production
- [ ] Environment variable secrets (.env file)
- [ ] API key rotation
- [ ] Audit logging

---

## ⚡ Performance Optimizations

### Implemented
1. **Database Indexes:**
   - Policies: userId + isActive
   - Triggers: city + createdAt
   - Claims: userId (unique count) + triggerId

2. **Query Optimization:**
   - `.lean()` for read-only queries
   - Pagination for large result sets
   - Selective field projection

3. **Cron Job Scheduling:**
   - Non-blocking async operations
   - Parallel processing for multiple cities
   - Error handling to prevent crashes

### Recommended for Scaling
1. **Caching Layer:** Redis for frequently accessed data
2. **Database Sharding:** By city or date range
3. **Load Balancing:** Multiple backend instances
4. **CDN:** Static frontend assets
5. **Message Queue:** Background job processing (Bull, RabbitMQ)
6. **Monitoring:** Error tracking (Sentry), APM (New Relic)

---

## 🧪 Testing Strategy

### Unit Tests
- Risk calculation logic
- Fraud detection scoring
- Payout calculations

### Integration Tests
- User registration → Policy creation → Claims
- Trigger generation → Claim processing
- Multi-user scenarios

### E2E Tests
- Frontend UI interactions
- API endpoint validation
- Admin dashboard

---

## 📈 Monitoring & Observability

### Logging
```
[Cron] [Trigger] [Claim] [Payout] timestamps
└─ All important events logged to console
```

### Metrics to Track
- Users registered
- Policies created
- Triggers generated
- Claims approved/flagged
- Total payouts
- Fraud detection rate
- API response times

### Recommended Tools
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Prometheus + Grafana
- Datadog
- CloudWatch (if AWS)

---

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB replica set (if HA)
- [ ] SSL certificates
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Logging setup
- [ ] Monitoring alerts
- [ ] Backup strategy
- [ ] Disaster recovery plan
- [ ] Load testing passed
- [ ] Security audit passed
- [ ] Documentation complete

---

## 🔄 Future Enhancements

1. **Real Payment Gateway**
   - Stripe/Razorpay integration
   - Bank transfer simulation

2. **Machine Learning**
   - Predictive claims model
   - Improved fraud detection

3. **Mobile App**
   - Native mobile frontend
   - Push notifications

4. **Advanced Features**
   - Multiple policies per user
   - Policy renewal automation
   - Claims dispute mechanism

5. **Analytics**
   - User behavior tracking
   - Claims trend analysis
   - Risk predictions

---

**Architecture Last Updated:** 2024-04-02
**Current Version:** 1.0.0

