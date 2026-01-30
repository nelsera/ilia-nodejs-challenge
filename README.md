# ilia-nodejs-challenge

This repository contains a technical challenge designed to assess back-end development skills using Node.js in a production-oriented scenario.

The project focuses on microservices architecture, secure authentication, asynchronous communication, clear service boundaries, automated testing, and overall code quality.

In addition to the required back-end services, a simple front-end application was implemented to demonstrate end-to-end integration and real consumption of the APIs.

---

## Live Project Links

Central portal with all deliverables:

- Project Portal  
  https://ilia-nodejs-challenge.vercel.app/portal

Individual links:

- Frontend (Web App)  
  https://ilia-nodejs-challenge.vercel.app/

- Users Service – Swagger  
  https://ilia-user-service.onrender.com/docs

- Wallet Service – Swagger  
  https://ilia-wallet-service.onrender.com/docs

- Test Coverage Report  
  https://ilia-nodejs-challenge.vercel.app/coverage/index.html

- GitHub Repository  
  https://github.com/nelsera/ilia-nodejs-challenge

---

## Project Overview

The system is composed of three independent applications:

### Users Service

Responsible for:

- User registration
- User authentication
- Issuing JWT tokens for external consumers
- Publishing user lifecycle events via RabbitMQ

### Wallet Service

Responsible for:

- Managing user wallets
- Handling balances and transactions
- Consuming user-related events asynchronously

### Web (Front-end)

A React-based application that:

- Consumes the Users and Wallet APIs
- Demonstrates real authentication and wallet usage
- Validates the complete end-to-end flow

Each application is isolated, owns its responsibilities, and communicates through well-defined contracts.

---

## Repository Structure

```text
apps/
├── user-service    # Users microservice (NestJS)
├── wallet-service  # Wallet microservice (NestJS)
└── web             # Front-end application (React + Vite)
```

---

## Architecture Diagram

```text
                        +--------------------+
                        |    Web Client      |
                        |  (React + Vite)    |
                        +----------+---------+
                                   |
                      REST + External JWT
                                   |
          +------------------------+------------------------+
          |                                                 |
+---------v----------+                          +-----------v-----------+
|    Users Service   |                          |     Wallet Service    |
|     (NestJS)       |                          |        (NestJS)       |
|--------------------|                          |-----------------------|
| - Auth (JWT)       |                          | - Wallet management   |
| - User creation   |                          | - Transactions        |
| - Event publisher |                          | - Event consumer      |
+---------+----------+                          +-----------+-----------+
          |                                                             |
          | publish user.created + internal JWT                          |
          |                                                             |
          v                                                             v
    +------------------+                                   +------------------+
    |     RabbitMQ     |---------------------------------->|   Wallet Logic   |
    | (Event Broker)   |        async event delivery       |  (event handler) |
    +------------------+                                   +------------------+

          |                                                             |
          v                                                             v
+---------------------+                                 +---------------------+
|   Users Database    |                                 |  Wallet Database    |
| (PostgreSQL + ORM)  |                                 | (PostgreSQL + ORM)  |
+---------------------+                                 +---------------------+
```

---

## Architecture Overview

- Node.js (LTS)
- NestJS framework
- React + Vite for front-end
- REST-based communication (client-facing)
- Asynchronous messaging with RabbitMQ (service-to-service)
- JWT authentication
  - External JWTs for client access
  - Internal JWTs embedded in events
- Relational database (PostgreSQL via Prisma)
- Automated testing with Jest and Supertest
- Docker and Docker Compose support

---

## Communication Flow

```text
(1) Login / Signup
Web Client --(REST + external JWT)--> Users Service

(2) Wallet Operations
Web Client --(REST + external JWT)--> Wallet Service

(3) Wallet Provisioning (async)
Users Service --(emit user.created + internal JWT)--> RabbitMQ
RabbitMQ --(deliver event)--> Wallet Service
```

---

## Technology Stack and Design Decisions

### Node.js (LTS)

Chosen for performance, scalability, and ecosystem maturity.

### NestJS

Provides modular architecture, dependency injection, and enterprise-grade patterns suitable for microservices.

### React + Vite

Used for fast development and to validate real-world API consumption in an end-to-end scenario.

### JWT Authentication

Two authentication strategies are used:

- **External JWTs**  
  Issued by the Users Service and used by the Web Client.

- **Internal JWTs**  
  Generated by the Users Service and embedded in RabbitMQ event payloads.
  Validated by the Wallet Service before processing events.

This enforces strict boundaries between external consumers and internal services.

### REST Communication (Client-facing)

REST is used for client-facing APIs to ensure:

- Simplicity
- Clear contracts
- Easy debugging
- Front-end compatibility

### RabbitMQ (Asynchronous Messaging)

RabbitMQ is used for asynchronous, event-driven communication.

When a user is created, the Users Service publishes a `user.created` event containing:

- User ID
- User email
- Internal JWT
- Timestamp

The Wallet Service consumes this event and validates the internal token before executing wallet provisioning logic.

This approach:

- Decouples services
- Improves resilience
- Enables scalability
- Avoids tight synchronous dependencies

### Prisma + Relational Database

Relational databases ensure consistency and integrity, especially for financial data.
Prisma provides type-safe access and clear schema evolution.

### Docker and Docker Compose

Standardizes development and simulates production-like environments.

---

## Authentication and Security

### External Authentication

- External JWT issued after login/signup
- Required for all user-facing Wallet endpoints

### Internal Authentication

- Internal JWT embedded in RabbitMQ events
- Validated before event processing

### Security Considerations

- Separate secrets for internal and external tokens
- Explicit trust boundaries
- Predictable and consistent HTTP responses

---

## Automated Testing

- Unit tests
- Integration tests
- Authentication and authorization coverage

Tools:

- Jest
- Supertest

Commands:

```bash
npm test
npm run test:cov
```

---

## Running with Docker

```bash
docker compose up
```

---

## Running Locally

```bash
npm install
npm run start:user
npm run start:wallet

cd apps/web
npm install
npm run dev
```

---

## Possible Future Improvements

Although the current solution fully addresses the proposed challenge, there are several improvements that could be implemented in a real-world or long-term scenario:

- Add distributed tracing (e.g. OpenTelemetry) to improve observability across services
- Introduce a centralized API Gateway for routing, rate limiting and security policies
- Improve resiliency with retries, circuit breakers and dead-letter queues for RabbitMQ
- Add contract testing between services to prevent breaking changes
- Implement refresh tokens and token rotation strategies
- Expand domain events and asynchronous workflows for better scalability
- Introduce CI/CD pipelines with automated quality gates and coverage thresholds
