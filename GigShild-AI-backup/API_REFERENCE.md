# GigShield AI - API Reference

Complete REST API documentation for GigShield AI backend.

**Base URL:** `http://localhost:5000/api`

---

## Authentication API

### Register User
```
POST /auth/register
```

**Request Body:**
```json
{
  "phone": "9876543210",
  "password": "securePassword123",
  "city": "Delhi",
  "avgWeeklyIncome": 15000
}
```

**Response Success (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "9876543210",
    "city": "Delhi",
    "avgWeeklyIncome": 15000,
    "riskScore": 30
  }
}
```

**Response Error (409):**
```json
{
  "message": "User already exists"
}
```

---

### Login User
```
POST /auth/login
```

**Request Body:**
```json
{
  "phone": "9876543210",
  "password": "securePassword123"
}
```

**Response Success (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "9876543210",
    "city": "Delhi",
    "avgWeeklyIncome": 15000,
    "riskScore": 30,
    "walletBalance": 150
  }
}
```

**Response Error (401):**
```json
{
  "message": "Invalid credentials"
}
```

---

### Get User Profile
```
GET /auth/profile
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "9876543210",
    "city": "Delhi",
    "avgWeeklyIncome": 15000,
    "riskScore": 30,
    "walletBalance": 150,
    "createdAt": "2024-04-01T10:00:00.000Z"
  }
}
```

---

## Policy API

### Create Policy
```
POST /policy/create
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** (Empty - uses user's profile)

**Response Success (201):**
```json
{
  "message": "Policy created successfully",
  "policy": {
    "_id": "507f1f77bcf86cd799439012",
    "premium": 49,
    "startDate": "2024-04-02T15:00:00.000Z",
    "endDate": "2024-04-09T15:00:00.000Z",
    "isActive": true,
    "waitingPeriodEnds": "2024-04-03T15:00:00.000Z"
  }
}
```

**Response Error (400):**
```json
{
  "message": "User already has an active policy"
}
```

---

### Get Active Policy
```
GET /policy/me
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```json
{
  "policy": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "premium": 49,
    "startDate": "2024-04-02T15:00:00.000Z",
    "endDate": "2024-04-09T15:00:00.000Z",
    "isActive": true,
    "weeklyPayoutUsed": 150,
    "waitingPeriodEnds": "2024-04-03T15:00:00.000Z"
  },
  "remainingWeeklyPayout": 150
}
```

**Response Error (404):**
```json
{
  "message": "No active policy found"
}
```

---

### Get All Policies
```
GET /policy/all
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```json
{
  "policies": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "userId": "507f1f77bcf86cd799439011",
      "premium": 49,
      "startDate": "2024-04-02T15:00:00.000Z",
      "endDate": "2024-04-09T15:00:00.000Z",
      "isActive": true
    }
  ]
}
```

---

## Claims API

### Get User Claims
```
GET /claims/my
```

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): APPROVED, FLAGGED, PAID, REJECTED

**Response Success (200):**
```json
{
  "claims": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "507f1f77bcf86cd799439011",
      "policyId": "507f1f77bcf86cd799439012",
      "triggerId": "507f1f77bcf86cd799439014",
      "amount": 50,
      "fraudScore": 15,
      "status": "APPROVED",
      "fraudReasons": [],
      "paidAt": "2024-04-02T15:30:00.000Z",
      "createdAt": "2024-04-02T15:30:00.000Z"
    }
  ]
}
```

---

## Admin API

### Get Dashboard Stats
```
GET /admin/stats
```

**Headers:**
```
X-Admin-Key: <admin_key>
```

**Response Success (200):**
```json
{
  "claimStats": {
    "totalUsers": 150,
    "totalClaims": 450,
    "approvedClaims": 390,
    "flaggedClaims": 45,
    "rejectedClaims": 15,
    "totalPayouts": 195000
  },
  "payoutStats": {
    "totalInWallets": 45000,
    "avgWallet": 300,
    "userCount": 150,
    "maxWeeklyCapPerUser": 300,
    "eventBudgets": {
      "RAIN": 5000,
      "AQI": 3000
    }
  },
  "recentTriggers": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "type": "RAIN",
      "city": "Delhi",
      "value": 45.2,
      "severity": "high",
      "processed": true,
      "createdAt": "2024-04-02T15:00:00.000Z"
    }
  ]
}
```

---

### Get All Users
```
GET /admin/users
```

**Headers:**
```
X-Admin-Key: <admin_key>
```

**Response Success (200):**
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "9876543210",
      "city": "Delhi",
      "avgWeeklyIncome": 15000,
      "riskScore": 30,
      "walletBalance": 150,
      "createdAt": "2024-04-01T10:00:00.000Z"
    }
  ]
}
```

---

### Get Triggers
```
GET /admin/triggers
```

**Headers:**
```
X-Admin-Key: <admin_key>
```

**Query Parameters:**
- `city` (optional): Filter by city

**Response Success (200):**
```json
{
  "triggers": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "type": "RAIN",
      "city": "Delhi",
      "value": 45.2,
      "severity": "high",
      "processed": true,
      "createdAt": "2024-04-02T15:00:00.000Z"
    }
  ]
}
```

---

## Health Check

### System Health
```
GET /health
```

**Response Success (200):**
```json
{
  "status": "OK",
  "timestamp": "2024-04-02T15:00:00.000Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "All fields are required"
}
```

### 401 Unauthorized
```json
{
  "message": "No authentication token, access denied"
}
```

### 403 Forbidden
```json
{
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "message": "User not found"
}
```

### 409 Conflict
```json
{
  "message": "User already exists"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error",
  "error": "Error details..."
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200  | OK - Request succeeded |
| 201  | Created - Resource created successfully |
| 400  | Bad Request - Invalid input |
| 401  | Unauthorized - Authentication failed |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource not found |
| 409  | Conflict - Resource already exists |
| 500  | Server Error - Internal error |

---

## Authentication

**JWT Token Format:**
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJwaG9uZSI6Ijk4NzY1NDMyMTAiLCJpYXQiOjE2ODA0MjAwMDAsImV4cCI6MTY4MzAxMjAwMH0.signature
```

**Token Expiration:** 30 days

**Refresh:** Re-login to get new token

---

## Rate Limiting

Recommended for production:
- Auth endpoints: 5 requests/minute per IP
- API endpoints: 100 requests/minute per user
- Admin endpoints: 10 requests/minute per key

---

## CORS

**Allowed Origins:** http://localhost:3000
**Allowed Methods:** GET, POST, PUT, DELETE
**Allowed Headers:** Authorization, Content-Type

---

## Example Workflows

### Workflow 1: Register and Create Policy

```bash
# Register
TOKEN=$(curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone":"9876543210",
    "password":"test123",
    "city":"Delhi",
    "avgWeeklyIncome":15000
  }' | jq -r '.token')

# Create Policy
curl -X POST http://localhost:5000/api/policy/create \
  -H "Authorization: Bearer $TOKEN"

# Get Active Policy
curl -X GET http://localhost:5000/api/policy/me \
  -H "Authorization: Bearer $TOKEN"
```

### Workflow 2: Get Claims After Trigger

```bash
# Get Claims
curl -X GET http://localhost:5000/api/claims/my \
  -H "Authorization: Bearer $TOKEN"
```

### Workflow 3: Admin Monitoring

```bash
# Get Dashboard Stats
curl -X GET http://localhost:5000/api/admin/stats \
  -H "X-Admin-Key: demo-admin-key"

# Get Recent Triggers
curl -X GET http://localhost:5000/api/admin/triggers \
  -H "X-Admin-Key: demo-admin-key"
```

---

**Last Updated:** 2024-04-02
**API Version:** 1.0.0

