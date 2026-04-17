# GigShield AI - Testing & Validation Guide

## 🧪 Complete System Testing

This guide walks through a full end-to-end test of the GigShield AI system.

## Pre-Test Checklist

- [ ] MongoDB running
- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:3000
- [ ] `.env` file configured correctly
- [ ] No errors in backend logs

## Phase 1: User Registration & Authentication

### Test 1.1: Register New User

**Frontend:**
1. Open http://localhost:3000/register
2. Fill form:
   - Phone: `9876543210`
   - City: `Delhi`
   - Weekly Income: `15000`
   - Password: `Test@123`
   - Confirm: `Test@123`
3. Click "Register"

**Expected Result:**
- ✓ User created in MongoDB
- ✓ Redirected to Dashboard
- ✓ JWT token stored in localStorage
- ✓ Risk score calculated (Delhi: 30, Income >20K: 0 = 30)

**Backend Verification:**
```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "user": {
    "_id": "...",
    "phone": "9876543210",
    "city": "Delhi",
    "avgWeeklyIncome": 15000,
    "riskScore": 30,
    "walletBalance": 0
  }
}
```

### Test 1.2: Register Duplicate User

**Test:**
Try registering same phone again

**Expected Result:**
- ✗ Error: "User already exists" (409)

### Test 1.3: Login with Invalid Credentials

**Frontend:**
1. Go to /login
2. Enter wrong password

**Expected Result:**
- ✗ Error: "Invalid credentials" (401)

### Test 1.4: Successful Login

**Frontend:**
1. Go to /login
2. Enter `9876543210` / `Test@123`
3. Click "Login"

**Expected Result:**
- ✓ Redirected to Dashboard
- ✓ Token stored
- ✓ User data loaded

## Phase 2: Policy System

### Test 2.1: Create First Policy

**Frontend:**
1. Go to Dashboard
2. Click "Create Policy"

**Expected Result:**
- ✓ Policy created
- ✓ Premium: ₹49 (risk 30)
- ✓ Start date: Tomorrow 3 PM
- ✓ End date: Tomorrow 3 PM + 7 days
- ✓ Status: Active
- ✓ Waiting period: 24 hours from policy start

**Backend Verification:**
```bash
curl http://localhost:5000/api/policy/me \
  -H "Authorization: Bearer <token>"
```

### Test 2.2: Cannot Create Duplicate Policy

**Test:**
Click "Create Policy" button again while policy is active

**Expected Result:**
- ✗ Error: "User already has an active policy"

### Test 2.3: Policy Waiting Period

**Test:**
1. Create policy at time T
2. Immediately try to receive claims
3. Fast-forward to T + 24h and try again

**With Test Code Change:** Edit `backend/controllers/policyController.js` line 31-33 to set waiting period to 0 for instant testing.

## Phase 3: Environmental Triggers

### Test 3.1: Monitor Trigger Generation

**Setup:**
Modify `backend/cron/triggerCron.js` to run every minute for testing:
```javascript
const schedule = '* * * * *'; // Every minute
```

**Test:**
1. Watch backend logs
2. Every 2-10 minutes, triggers should be checked
3. Mock data will randomly generate rainfall/AQI events

**Expected Logs:**
```
[Cron] Starting environment monitoring...
[Trigger] Created RAIN trigger for Delhi: 45.23 (high)
[Cron] Environment monitoring complete
```

### Test 3.2: Threshold Testing

**RAIN Trigger:** > 40mm
**AQI Trigger:** > 300

**Backend File:** `backend/services/externalApiService.js`
- Lines 42-48: Mock weather (30% chance 40-100mm rain)
- Lines 67-73: Mock AQI (15% chance 300-400 AQI)

To force triggers, modify mock functions temporarily.

## Phase 4: Claim Processing

### Test 4.1: Automatic Claim Generation

**Setup:**
1. Policy must be outside waiting period
2. Environmental trigger detected

**Expected Flow:**
1. Trigger created (e.g., RAIN in Delhi)
2. Claim cron job runs
3. Finds all users in Delhi
4. Creates claims for each user with:
   - Status: APPROVED or FLAGGED
   - Amount: ₹30-150 (based on risk)
   - Fraud score: 0-60 (based on patterns)

**Backend Logs:**
```
[Claim Processing] Processing trigger: RAIN in Delhi
[Claim Processing] Found 3 users in Delhi
[Claim] APPROVED: ₹50 to user 9876543210
[Claim] FLAGGED: Fraud score 75 for user 9876543211
```

### Test 4.2: View Claims on Frontend

**Frontend:**
1. Go to Dashboard
2. Scroll to "Recent Claims" section
3. See claims with status and details

## Phase 5: Fraud Detection

### Test 5.1: Normal Claim (Not Fraudulent)

**Conditions:**
- User in same city as trigger
- First or second claim this week
- Not duplicate

**Expected Result:**
- Fraud score: 0-40
- Status: APPROVED
- Wallet credited

### Test 5.2: Fraudulent Claim (Location Mismatch)

**Setup:**
Edit `backend/services/fraudEngine.js` to test mismatch logic

**Expected Result:**
- Fraud score: 40+
- Status: FLAGGED (if > 70)
- Wallet NOT credited

### Test 5.3: Duplicate Claim

**Setup:**
Try to claim twice for same trigger

**Expected Result:**
- ✗ Duplicate claim rejected
- No second claim created

## Phase 6: Payout System

### Test 6.1: Weekly Payout Cap

**Setup:**
1. Create policy with ₹300 cap
2. Generate claims totaling ₹350+

**Expected Result:**
- First ₹300 approved
- Remaining flagged for exceeding cap
- Policy.weeklyPayoutUsed = 300

**Verify:**
```bash
curl http://localhost:5000/api/admin/stats \
  -H "X-Admin-Key: demo-admin-key"
```

### Test 6.2: Wallet Credit

**Step 1:** Before claim
```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <token>"
# walletBalance: 0
```

**Step 2:** After approved claim
```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <token>"
# walletBalance: 50
```

### Test 6.3: Event Budget Respect

**Setup:**
Generate multiple claims in one event

**Expected Result:**
- Individual payouts scale with budget
- No single user exceeds ₹150
- Event won't exceed ₹5000 (RAIN) / ₹3000 (AQI)

## Phase 7: Admin Dashboard

### Test 7.1: Access Admin Dashboard

**URL:** http://localhost:3000/admin
**Key:** `demo-admin-key` (from .env)

**Expected Results:**
- Total users count
- Total claims count
- Approved vs Flagged split
- Total payouts sum
- Recent triggers list

### Test 7.2: API Calls

**Get Stats:**
```bash
curl -X GET http://localhost:5000/api/admin/stats \
  -H "X-Admin-Key: demo-admin-key"
```

**Get All Users:**
```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "X-Admin-Key: demo-admin-key"
```

**Get Triggers by City:**
```bash
curl -X GET "http://localhost:5000/api/admin/triggers?city=Delhi" \
  -H "X-Admin-Key: demo-admin-key"
```

## Phase 8: Edge Cases

### Test 8.1: User with No Policy

**Test:**
Register user but don't create policy, wait for trigger

**Expected Result:**
- No claims created
- Claim rejected: "No active policy"

### Test 8.2: User in Different City

**Setup:**
1. Register user in Mumbai
2. Trigger in Delhi

**Expected Result:**
- No claims for Mumbai user
- Fraud flag if somehow attempted

### Test 8.3: Multiple Users Same City

**Setup:**
Register 5 users in Delhi, 3 in Mumbai
Generate Delhi trigger

**Expected Result:**
- 5 claims created for Delhi users
- 0 claims for Mumbai users
- Payouts distributed proportionally

## 📊 Performance Tests

### Test 9.1: Response Time

**Register:**
```bash
time curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","password":"test123","city":"Delhi","avgWeeklyIncome":15000}'
```

**Expected:** < 500ms

### Test 9.2: Concurrent Requests

**Test:**
Register 10 users simultaneously

```bash
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"987654321$i\",\"password\":\"test123\",\"city\":\"Delhi\",\"avgWeeklyIncome\":15000}" &
done
wait
```

**Expected:** All succeed

## 📋 Final Validation Checklist

- [ ] User registration works
- [ ] Login/authentication works
- [ ] Policy creation works with proper dates
- [ ] Waiting period enforced
- [ ] Triggers generated automatically
- [ ] Claims created automatically
- [ ] Fraud detection applied
- [ ] Payouts credited to wallet
- [ ] Weekly cap enforced
- [ ] Duplicate claims prevented
- [ ] Admin dashboard displays correctly
- [ ] All APIs respond with proper status codes
- [ ] Errors return meaningful messages
- [ ] Frontend handles loading states
- [ ] Protected routes require authentication

## 🚀 Deployment Readiness

If all tests pass, system is ready for:
- [ ] Production deployment
- [ ] Load testing (K6, Apache JMeter)
- [ ] Security audit
- [ ] UI/UX review
- [ ] Documentation review

---

**Test Duration:** ~2-3 hours (including wait times)
**Manual Steps:** ~30
**Automated Tests Needed:** Load and security tests

