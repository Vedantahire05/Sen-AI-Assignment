# API Documentation

Authentication

All API requests require a Bearer Token.

Headers:

Authorization: Bearer <token>

Rate Limits

Standard Plan:
- 1000 requests/minute

Enterprise Plan:
- 10000 requests/minute

Common Endpoints

GET /users
GET /tickets
POST /tickets
PUT /tickets/:id

API limit increase requests should be routed to Customer Success.