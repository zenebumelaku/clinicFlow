# ClinicFlow - Backend Foundation & Authentication

**ClinicFlow** is an enterprise-grade electronic medical and clinic management system backend built with [NestJS](https://nestjs.com/), [TypeScript](https://www.typescriptlang.org/), [Prisma ORM](https://www.prisma.io/), and [PostgreSQL](https://www.postgresql.org/).

---

## Architecture Overview

```
clinic_project/
├── .env.example                     # Sample environment variables
├── .env                             # Active environment configuration
├── docker-compose.yml               # PostgreSQL 16 container definition
├── nest-cli.json                    # Nest CLI configuration (Swagger plugin enabled)
├── package.json                     # Project dependencies and scripts
├── tsconfig.json                    # Strict TypeScript compiler options
├── tsconfig.build.json              # Production build options
├── prisma/
│   └── schema.prisma                # Database models (User, Role enum, Otp, RefreshToken, AuditLog)
├── test/
│   ├── auth.spec.ts                 # Automated test suite (17 comprehensive tests)
│   └── mock-prisma.service.ts       # In-memory mock database for unit/integration tests
└── src/
    ├── app.controller.ts            # Health check endpoint (/api/v1/health)
    ├── app.module.ts                # Application root module
    ├── main.ts                      # App bootstrap (Helmet, CORS, Validation, Swagger)
    ├── common/                      # Reusable cross-cutting concerns
    │   ├── common.module.ts         # Common module registering global middleware
    │   ├── config/
    │   │   ├── configuration.ts     # Typed configuration factory
    │   │   └── env.validation.ts    # Class-validator powered env validation
    │   ├── constants/
    │   │   └── index.ts             # Metadata keys and header constants
    │   ├── decorators/
    │   │   ├── current-user.decorator.ts  # Extracts req.user or specific user properties
    │   │   ├── public.decorator.ts        # Bypasses JWT authentication
    │   │   └── roles.decorator.ts         # Enforces RBAC permissions
    │   ├── dto/
    │   │   ├── api-response.dto.ts        # Unified JSON response & error wrappers
    │   │   └── pagination.dto.ts          # Pagination query & metadata DTOs
    │   ├── enums/
    │   │   ├── environment.enum.ts        # Environment tiers (development, production, etc.)
    │   │   └── role.enum.ts               # User roles (ADMIN, RECEPTIONIST, DOCTOR, PATIENT)
    │   ├── filters/
    │   │   ├── all-exceptions.filter.ts   # Catches HttpExceptions & Prisma errors
    │   │   └── http-exception.filter.ts   # Standard HTTP error formatter
    │   ├── interceptors/
    │   │   ├── logging.interceptor.ts     # HTTP latency, status & agent logger
    │   │   └── transform.interceptor.ts   # Envelopes successful data ({ success: true, ... })
    │   └── middleware/
    │       └── correlation-id.middleware.ts # Generates/propagates x-correlation-id
    ├── prisma/
    │   ├── prisma.module.ts         # Global database provider module
    │   └── prisma.service.ts        # PrismaClient lifecycle & connection management
    └── auth/                        # Authentication & Authorization module
        ├── auth.controller.ts       # Endpoints: send-otp, verify-otp, login, refresh, logout, me, RBAC
        ├── auth.module.ts           # Configures Passport, JwtModule, and providers
        ├── auth.service.ts          # Authentication business logic
        ├── token.service.ts         # Access token & refresh token rotation/revocation
        ├── otp/
        │   ├── otp-delivery.interface.ts     # Abstraction interface for SMS/Email providers
        │   ├── console-otp-delivery.service.ts # Development/test provider implementation
        │   └── otp.service.ts                # OTP generation, hashing, rate limiting, and verification
        ├── dto/
        │   ├── auth-response.dto.ts # Swagger and response schemas
        │   ├── login.dto.ts         # Phone/email + password login
        │   ├── logout.dto.ts        # Token revocation payload
        │   ├── refresh-token.dto.ts # Refresh token rotation payload
        │   ├── register.dto.ts      # Staff onboarding payload
        │   ├── send-otp.dto.ts      # OTP request payload
        │   └── verify-otp.dto.ts    # OTP verification payload
        ├── guards/
        │   ├── jwt-auth.guard.ts    # Enforces JWT unless @Public()
        │   └── roles.guard.ts       # Enforces @Roles(...)
        └── strategies/
            └── jwt.strategy.ts      # Passport JWT verification strategy
```

---

## Authentication Endpoints

| Endpoint                              | Method | Auth                    | Description                                                |
| :------------------------------------ | :----- | :---------------------- | :--------------------------------------------------------- |
| `/api/v1/auth/send-otp`               | `POST` | Public                  | Send 6-digit OTP code with 60s cooldown rate limit         |
| `/api/v1/auth/verify-otp`             | `POST` | Public                  | Verify OTP, auto-create patient, issue JWT & refresh token |
| `/api/v1/auth/login`                  | `POST` | Public                  | Authenticate with phone/email and password                 |
| `/api/v1/auth/refresh`                | `POST` | Public                  | Rotate refresh token and issue new token pair              |
| `/api/v1/auth/logout`                 | `POST` | Public / Bearer         | Revoke refresh token and terminate session                 |
| `/api/v1/auth/me`                     | `GET`  | Bearer                  | Get current user profile                                   |
| `/api/v1/auth/test/admin-only`        | `GET`  | Bearer (`ADMIN`)        | RBAC test: accessible only to ADMIN role                   |
| `/api/v1/auth/test/doctor-only`       | `GET`  | Bearer (`DOCTOR`)       | RBAC test: accessible only to DOCTOR role                  |
| `/api/v1/auth/test/receptionist-only` | `GET`  | Bearer (`RECEPTIONIST`) | RBAC test: accessible only to RECEPTIONIST role            |
| `/api/v1/auth/test/patient-only`      | `GET`  | Bearer (`PATIENT`)      | RBAC test: accessible only to PATIENT role                 |

---

## Patients & Appointments

All patient and appointment requests require a bearer token and an active membership in the clinic identified by `clinicId`. Create requests provide `clinicId` in the JSON body; list, detail, and update requests provide it as a query parameter. Patient and appointment records are scoped to that clinic.

| Endpoint                                                    | Method  | Access                            | Description                                             |
| :---------------------------------------------------------- | :------ | :-------------------------------- | :------------------------------------------------------ |
| `/api/v1/patients`                                          | `POST`  | `ADMIN`, `RECEPTIONIST`           | Register an existing PATIENT user in a clinic           |
| `/api/v1/patients?clinicId=...`                             | `GET`   | `ADMIN`, `RECEPTIONIST`, `DOCTOR` | Search, paginate, and sort clinic patients              |
| `/api/v1/patients/:patientId?clinicId=...`                  | `GET`   | `ADMIN`, `RECEPTIONIST`, `DOCTOR` | Get a patient in the clinic                             |
| `/api/v1/patients/:patientId?clinicId=...`                  | `PATCH` | `ADMIN`, `RECEPTIONIST`           | Update clinic patient details                           |
| `/api/v1/appointments`                                      | `POST`  | `ADMIN`, `RECEPTIONIST`           | Schedule an appointment with clinic patient and doctor  |
| `/api/v1/appointments?clinicId=...`                         | `GET`   | `ADMIN`, `RECEPTIONIST`, `DOCTOR` | List clinic appointments with pagination and filters    |
| `/api/v1/appointments/:appointmentId?clinicId=...`          | `GET`   | `ADMIN`, `RECEPTIONIST`, `DOCTOR` | Get an appointment in the clinic                        |
| `/api/v1/appointments/:appointmentId?clinicId=...`          | `PATCH` | `ADMIN`, `RECEPTIONIST`           | Update scheduling details or advance appointment status |
| `/api/v1/appointments/:appointmentId/cancel?clinicId=...`   | `POST`  | `ADMIN`, `RECEPTIONIST`           | Cancel an appointment                                   |
| `/api/v1/appointments/:appointmentId/check-in?clinicId=...` | `POST`  | `ADMIN`, `RECEPTIONIST`           | Check in a confirmed appointment                        |

Appointment status transitions are enforced by the API. Doctor schedules reject overlapping non-cancelled appointments, including concurrent booking requests. Patient and doctor references must both belong to the selected clinic.

---

## Real-Time Clinic Queue

Queue endpoints require a bearer token and active membership in the `clinicId` supplied in the check-in body or as a query parameter for other routes. Daily numbering resets by Ethiopia local date (`Africa/Addis_Ababa`). Tickets receive their number at check-in; live listings order emergency, urgent, then normal priority, preserving each ticket's number.

| Endpoint                                        | Method | Access                            | Description                                                                   |
| :---------------------------------------------- | :----- | :-------------------------------- | :---------------------------------------------------------------------------- |
| `/api/v1/queue?clinicId=...`                    | `GET`  | `ADMIN`, `RECEPTIONIST`, `DOCTOR` | List today's queue, filterable by date, doctor, and status                    |
| `/api/v1/queue/check-in`                        | `POST` | `ADMIN`, `RECEPTIONIST`           | Check in a clinic patient; optionally assign priority, doctor, or appointment |
| `/api/v1/queue/:ticketId/call?clinicId=...`     | `POST` | `ADMIN`, `RECEPTIONIST`           | Move a waiting ticket to called                                               |
| `/api/v1/queue/:ticketId/start?clinicId=...`    | `POST` | `ADMIN`, `RECEPTIONIST`, `DOCTOR` | Start consultation for a called ticket                                        |
| `/api/v1/queue/:ticketId/complete?clinicId=...` | `POST` | `ADMIN`, `RECEPTIONIST`, `DOCTOR` | Complete an in-consultation ticket                                            |
| `/api/v1/queue/:ticketId/skip?clinicId=...`     | `POST` | `ADMIN`, `RECEPTIONIST`           | Skip a waiting or called ticket                                               |

Queue states advance `WAITING -> CALLED -> IN_CONSULTATION -> COMPLETED`; `WAITING` and `CALLED` tickets may also become `SKIPPED`. Check-in numbers are allocated transactionally, and status actions use conditional transactional updates. Responses include check-in/action timestamps plus waiting and consultation durations in seconds.

---

## Payments & Notifications

Payments are records only: creating one stores its amount, currency, method, status, patient, and optional appointment. No payment provider, transfer, charge, or refund operation is performed. Payment endpoints require active clinic membership.

| Endpoint                                                  | Method  | Access                  | Description                                                                        |
| :-------------------------------------------------------- | :------ | :---------------------- | :--------------------------------------------------------------------------------- |
| `/api/v1/payments`                                        | `POST`  | `ADMIN`, `RECEPTIONIST` | Record a clinic payment (`CASH`, `TELEBIRR`, `MPESA`, `BANK_TRANSFER`, or `OTHER`) |
| `/api/v1/payments?clinicId=...`                           | `GET`   | `ADMIN`, `RECEPTIONIST` | Paginate and filter records by status, patient, or appointment                     |
| `/api/v1/notifications?clinicId=...`                      | `GET`   | Authenticated user      | List only the current user's clinic notifications; optionally filter unread        |
| `/api/v1/notifications/:notificationId/read?clinicId=...` | `PATCH` | Authenticated user      | Mark only the current user's notification as read                                  |

Notification events support appointment reminders, queue updates, appointment cancellations, doctor delays, and system messages. Internal services create notifications; each notification is bound to one user and clinic, and patients can access their own notifications through their clinic patient profile.

---

## Reporting & Analytics

All report endpoints require an authenticated `ADMIN` or `RECEPTIONIST` with active membership in the requested `clinicId`. Use `range=today`, `range=7d`, `range=30d`, or `range=custom&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`; custom dates are inclusive and report days use `Africa/Addis_Ababa`.

| Endpoint                                                                           | Method | Description                                                                                                                                      |
| :--------------------------------------------------------------------------------- | :----- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/v1/reports/dashboard?clinicId=...`                                           | `GET`  | Return appointments, waiting patients, completed visits, completed-payment revenue, average waiting/consultation minutes, and no-show percentage |
| `/api/v1/reports/revenue?clinicId=...&range=7d`                                    | `GET`  | Daily completed-payment totals and payment counts                                                                                                |
| `/api/v1/reports/appointments?clinicId=...&range=30d`                              | `GET`  | Daily appointment, completed, cancelled, and no-show counts                                                                                      |
| `/api/v1/reports/waiting-time?clinicId=...&range=custom&startDate=...&endDate=...` | `GET`  | Daily average waiting and completed-consultation durations in minutes                                                                            |

Chart endpoints return ordered daily `data` rows with a `date` field and numeric series fields, including zero-valued days with no activity. Dashboard aggregates exclude cancelled appointments from the no-show denominator; averages are calculated from queue timestamps. Queries are parameterized and aggregate in SQL.

---

## Security Features

1. **OTP Expiration**: Enforces strict 5-minute time-to-live (TTL).
2. **OTP Single-Use**: Instantly marked as `isUsed: true` upon successful verification.
3. **Rate Limiting & Cooldown**:
   - 60-second cooldown between consecutive OTP requests for the same recipient.
   - Max 3 verification attempts per OTP; automatically invalidated on 3 consecutive wrong attempts.
4. **Credential Hashing**:
   - Passwords hashed using `bcryptjs` (salt rounds: 10).
   - OTP codes and refresh tokens hashed with SHA-256 before database storage.
5. **Token Rotation & Revocation**:
   - Access tokens expire in 15 minutes.
   - Refresh tokens are single-use; `/auth/refresh` issues a new refresh token and revokes the previous one.
   - Reuse of revoked refresh tokens triggers instant revocation of all user sessions.
6. **Role-Based Access Control**:
   - Granular RBAC supporting `ADMIN`, `RECEPTIONIST`, `DOCTOR`, `PATIENT`.

---

## Testing & Quality Checks

```bash
# Run the automated test suite (82 tests covering auth, RBAC/tenancy, workflows, and production hardening)
npm run test

# Type check strictly (no emitted files)
npm run typecheck

# Lint without modifying files
npm run lint

# Compile production bundle
npm run build
```

---

## Installation

Requirements: Node.js 20 or newer, npm, and PostgreSQL 16 (Docker Compose is provided for local development).

```bash
npm ci
```

## Environment Setup

Create the local environment file:

```bash
cp .env.example .env
```

For development, the example values target the bundled PostgreSQL container and the console OTP adapter. Replace `JWT_SECRET`, `OTP_PEPPER`, and `SEED_PASSWORD` with private values before use. Generate cryptographic values with:

```bash
openssl rand -hex 32
```

Production requires a unique 32-character-or-longer `JWT_SECRET` and `OTP_PEPPER`, an explicit non-wildcard `CORS_ORIGIN`, and an HTTPS `OTP_DELIVERY_URL` plus `OTP_DELIVERY_TOKEN`. The production adapter POSTs `{ "recipient": "...", "code": "...", "purpose": "..." }` as JSON with a Bearer token. The console adapter is development-only. Set `SWAGGER_ENABLED=false` in production unless the documentation route is intentionally exposed. Set `TRUST_PROXY_HOPS` only to the exact number of trusted reverse proxies in front of the app; leave it at `0` when directly exposed.

## Database Setup

Start the local database, then generate Prisma Client:

```bash
docker compose up -d postgres
npm run prisma:generate
```

## Migration Commands

Create and apply the initial development migration:

```bash
npx prisma migrate dev --name init
```

Apply committed migrations in production:

```bash
npm run prisma:migrate:deploy
```

Use `npx prisma migrate dev --name <migration_name>` for subsequent development schema changes. Do not use `prisma db push` as the production migration process.

## Seed Commands

Set `SEED_PASSWORD` in `.env` to a development-only password of at least 12 characters, then run:

```bash
npm run db:seed
```

The seed is idempotent and refuses to run when `NODE_ENV=production`. It creates demo admin, receptionist, doctor, and patient accounts; a clinic and branch; appointments, queue tickets, a payment record, and a notification. Seeded accounts share `SEED_PASSWORD`.

## Development Commands

```bash
npm run start:dev
```

The API is at `http://localhost:3000/api/v1`; health check is `http://localhost:3000/api/v1/health`. OTP codes are printed by the console adapter only in development.

## Testing Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

The integration suites use an in-memory Prisma test double; they do not require the development PostgreSQL container.

## Production Commands

Configure production environment variables and provision PostgreSQL before deployment. Then run:

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build
npm run start:prod
```

The built server listens on `PORT` (default `3000`). Rate limiting currently uses the Nest throttler's per-process store; deployments with multiple replicas must also apply a shared rate limit at the ingress/API gateway. Configure the trusted proxy hop count so the in-process limiter sees the actual client IP.

Swagger URL in development (when `SWAGGER_ENABLED` is not false): `http://localhost:3000/api/docs`.
