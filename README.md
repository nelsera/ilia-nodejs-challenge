# ilia-nodejs-challenge

This repository contains a technical challenge designed to assess back-end development skills using Node.js in a production-oriented scenario.  
The focus is on microservices architecture, security, automated testing, and overall code quality.

The solution emphasizes clear service boundaries, explicit architectural decisions, and secure communication between services.

---

## Project Overview

The system is composed of two independent services:

- Users Service  
  Responsible for user registration, authentication, and issuing JWT tokens for external consumers.

- Wallet Service  
  Responsible for managing user wallets, balances, transactions, and exposing wallet-related operations.

Each service is isolated, owns its data, and communicates through well-defined APIs.

---

## Architecture Overview

- Node.js (LTS)
- NestJS framework
- REST-based inter-service communication
- JWT authentication
  - External tokens for user access
  - Internal tokens for service-to-service communication
- Relational database (PostgreSQL via Prisma, SQLite possible for local execution)
- Automated testing with Jest and Supertest
- Docker and Docker Compose support

```
Client
  |
  v
Users Service ----(internal JWT)----> Wallet Service
  |
  +----(external JWT)---------------->
```

---

## Authentication and Security

### External Authentication

- Users authenticate via the Users Service
- After signup or login, an external JWT is issued
- This token is required to access user-facing Wallet Service endpoints

### Internal Authentication

- Internal communication uses JWTs signed with a separate secret
- Wallet Service validates internal tokens only on internal routes
- External tokens are not allowed to access internal endpoints

### Security Considerations

- Distinct secrets for external and internal JWTs
- Separate authentication strategies and guards
- Clear authorization boundaries between services
- Consistent HTTP status codes for authentication and authorization errors

---

## Services

### Users Service

Responsibilities:

- User registration
- User authentication
- JWT issuance
- Triggering wallet creation via internal communication

Endpoints:

```
POST /auth/signup
```

```json
{
  "email": "maria@email.com",
  "password": "123456"
}
```

User registration triggers an internal request to the Wallet Service to create a wallet for the new user.

```
POST /auth/login
```

```json
{
  "email": "maria@email.com",
  "password": "123456"
}
```

Response:

```json
{
  "token": "external_jwt_token"
}
```

---

### Wallet Service

Responsibilities:

- Create and manage wallets
- Calculate balances
- Register credit and debit transactions
- Expose transaction history

All user-facing endpoints require an external JWT.

#### User Wallet Endpoints

Get or create the authenticated user's wallet:

```
POST /wallets/me
Authorization: Bearer <external-jwt>
```

Get the authenticated user's wallet:

```
GET /wallets/me
Authorization: Bearer <external-jwt>
```

Credit wallet (amount in cents):

```
POST /wallets/me/credit
Authorization: Bearer <external-jwt>
```

```json
{
  "amount": 10000
}
```

Debit wallet (amount in cents):

```
POST /wallets/me/debit
Authorization: Bearer <external-jwt>
```

```json
{
  "amount": 5000
}
```

Get wallet balance:

```
GET /wallets/me/balance
Authorization: Bearer <external-jwt>
```

Response:

```json
{
  "balance": 5000
}
```

List wallet transactions:

```
GET /wallets/me/transactions
Authorization: Bearer <external-jwt>
```

---

#### Internal Wallet Endpoints

Get or create a wallet for a specific user (internal only):

```
POST /internal/wallets/{userId}
Authorization: Bearer <internal-jwt>
```

This endpoint is used exclusively for service-to-service communication and is not accessible with external tokens.

---

## Inter-Service Communication

- Communication between Users Service and Wallet Service is mandatory
- Implemented using REST
- Wallet creation is automatically triggered after user registration
- Internal endpoints are protected using a dedicated authentication mechanism

---

## Automated Testing

The project includes automated tests covering:

- Unit tests for core business logic
- Integration tests for main endpoints
- Authentication and authorization flows
- User and wallet interaction scenarios

Tools used:

- Jest
- Supertest

Run all tests:

```
npm test
```

---

## Running with Docker

Requirements:

- Docker
- Docker Compose

Start all services:

```
docker compose up
```

---

## Running Locally (Without Docker)

### Install dependencies

```
npm install
```

### Start Users Service

```
npm run start:user
```

### Start Wallet Service

```
npm run start:wallet
```

Each service runs independently and must be started in a separate terminal.

---

## Code Quality and Tooling

- ESLint for linting
- Prettier for formatting
- Husky and lint-staged for pre-commit hooks
- Coverage thresholds enforced via Jest

Useful commands:

```
npm run lint
npm run lint:fix
npm run format
npm run test:cov
```

---

## API Documentation

Each service exposes Swagger/OpenAPI documentation, including:

- Available endpoints
- Authentication configuration
- Request and response examples
- Error responses

---

## Evaluation Criteria Coverage

This solution addresses the following evaluation points:

- Clear microservices separation
- Secure authentication model
- Organized and readable codebase
- Automated testing strategy
- Proper error handling
- Documentation
- Adherence to clean code and SOLID principles

---

## Strengths

- Clear distinction between external and internal APIs
- Secure service-to-service communication
- Consistent financial domain modeling
- Testable and maintainable architecture
- Strong focus on code quality and tooling
- Docker-ready development environment

---

## Possible Improvements

- Asynchronous communication using a message broker
- Idempotency handling for financial operations
- Distributed tracing and metrics
- Centralized logging
- Rate limiting
- Database migrations per service
- CI/CD pipeline integration

---

## Final Notes

The implementation focuses on architectural clarity and correctness rather than feature completeness.  
Trade-offs were made consciously to keep the solution simple while preserving realistic production concerns.
