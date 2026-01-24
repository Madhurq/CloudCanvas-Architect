# CloudCanvas-Architect API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Include JWT token in Authorization header:
```
Authorization: Bearer <your_access_token>
```

---

## Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "firstName": "John",
  "lastName": "Doe",
  "organization": "Acme Corp"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "organization": "Acme Corp"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Get Profile
```http
GET /auth/profile
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "organization": "Acme Corp",
      "role": "user",
      "created_at": "2024-01-24T10:00:00Z"
    }
  }
}
```

### Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

## Architecture Endpoints

### Create Architecture
```http
POST /architectures
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "My First Architecture",
  "description": "3-tier web application",
  "region": "us-east-1",
  "pricingModel": "on-demand",
  "nodes": [
    {
      "id": "1",
      "data": { "label": "ALB" },
      "position": { "x": 0, "y": 0 }
    },
    {
      "id": "2",
      "data": { "label": "EC2" },
      "position": { "x": 100, "y": 100 }
    }
  ],
  "edges": [
    {
      "source": "1",
      "target": "2"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "architecture": {
      "id": 5,
      "user_id": 1,
      "name": "My First Architecture",
      "description": "3-tier web application",
      "nodes": [...],
      "edges": [...],
      "region": "us-east-1",
      "pricing_model": "on-demand",
      "created_at": "2024-01-24T10:00:00Z"
    }
  }
}
```

### Get All Architectures
```http
GET /architectures
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "architectures": [
      {
        "id": 5,
        "name": "My First Architecture",
        "description": "3-tier web application",
        "region": "us-east-1",
        "estimated_monthly_cost": 1250.50,
        "created_at": "2024-01-24T10:00:00Z",
        "updated_at": "2024-01-24T10:00:00Z"
      }
    ]
  }
}
```

### Get Single Architecture
```http
GET /architectures/5
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "architecture": {
      "id": 5,
      "user_id": 1,
      "name": "My First Architecture",
      "description": "3-tier web application",
      "nodes": [...],
      "edges": [...],
      "region": "us-east-1",
      "pricing_model": "on-demand",
      "estimated_monthly_cost": 1250.50,
      "is_public": false,
      "created_at": "2024-01-24T10:00:00Z",
      "updated_at": "2024-01-24T10:00:00Z"
    }
  }
}
```

### Update Architecture
```http
PUT /architectures/5
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Architecture Name",
  "nodes": [...],
  "edges": [...],
  "estimatedMonthlyCost": 2500.00
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "architecture": {
      "id": 5,
      "name": "Updated Architecture Name",
      "updated_at": "2024-01-24T11:00:00Z"
    }
  }
}
```

### Delete Architecture
```http
DELETE /architectures/5
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Architecture deleted"
  }
}
```

---

## Pricing Endpoints

### Get Pricing Data
```http
GET /pricing?region=us-east-1&service=ec2
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "pricing": [
      {
        "serviceId": "ec2",
        "region": "us-east-1",
        "pricing": {
          "t3.micro": { "linux": 0.0104, "windows": 0.0173 },
          "t3.small": { "linux": 0.0208, "windows": 0.0347 }
        }
      }
    ]
  }
}
```

### Sync Pricing Data
```http
POST /pricing/sync
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Pricing sync in progress"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request data",
  "data": null
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "data": null
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Architecture not found",
  "data": null
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to create architecture",
  "data": null
}
```
