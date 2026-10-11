# ClinicFlow

ClinicFlow is a modern electronic healthcare and clinic management platform designed to streamline patient care, queue flow, appointments, billing, and operational reporting for clinics and healthcare teams.

Built by Zenebu Melaku, a Fullstack Developer, this project combines a secure NestJS backend with a polished React + Vite frontend to deliver a complete digital clinic experience for administrators, receptionists, doctors, and patients.

## Why this project?

Healthcare operations need speed, clarity, and trust. ClinicFlow helps clinics manage:

- patient registration and records
- appointment scheduling and tracking
- real-time clinic queue workflows
- staff and doctor access control
- payment and billing records
- reporting and clinic analytics
- secure authentication and authorization

The goal is to make clinical operations more organized, more transparent, and easier to manage across roles.

## Core features

### For clinic administrators and receptionists

- manage clinic profiles and branches
- onboard staff and patient records
- track appointment flow and check-in status
- handle queue operations and patient movement
- manage payments and billing information
- view operational performance reports

### For doctors

- access patient records within clinic scope
- monitor scheduled appointments
- manage queue priorities and consultation flow
- review clinic dashboard insights

### For patients

- access appointment and queue information
- view personal portal details
- stay informed about visit status and payments

### Platform capabilities

- JWT-based authentication and role-based access control
- Prisma ORM with PostgreSQL
- validation, logging, and structured API responses
- Swagger API documentation
- tenant-aware clinic access patterns
- responsive modern UI for desktop and browser-based workflows

## Tech stack

### Frontend

- React
- Vite
- TypeScript
- Tailwind-style UI system
- TanStack React Query
- Recharts for data visualization

### Backend

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Swagger/OpenAPI
- JWT + Passport
- Helmet for HTTP hardening

## Project structure

```text
clinic/
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── test/
│   ├── .env.example
│   ├── docker-compose.yml
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
├── README.md
└── .git/
```

## Role-based workflow

The system is structured around clinic roles:

- Admin: overall clinic operations and configuration
- Receptionist: patients, appointments, check-in, queue management
- Doctor: queue, patient data, appointments
- Patient: personal dashboard and visit status

This role-based separation helps keep each user experience focused and secure.

## Getting started

### Prerequisites

Before you run the project locally, make sure you have the following installed:

- Node.js 18+ or newer
- npm
- PostgreSQL 16 or a compatible local instance
- Git

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run start:dev
```

The backend starts on:

- http://localhost:3000
- Swagger docs: http://localhost:3000/api/docs

### Backend environment variables

The backend uses a `.env` file. A sample configuration is included in `backend/.env.example`.

Key variables include:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/mediflow_db?schema=public
JWT_SECRET=your-secure-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_DAYS=7
OTP_PEPPER=your-otp-pepper
CORS_ORIGIN=http://localhost:5173
API_PREFIX=api/v1
SWAGGER_PATH=api/docs
SWAGGER_ENABLED=true
```

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

By default the frontend runs on:

- http://localhost:5173

Ensure the frontend API URL points to the backend API base, for example:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Common scripts

### Backend

```bash
npm run build
npm run start
npm run start:dev
npm run test
npm run lint
npm run typecheck
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
```

## API documentation

The backend exposes Swagger documentation for interactive testing of endpoints.

Open:

```text
http://localhost:3000/api/docs
```

The API includes modules for:

- authentication and authorization
- clinics and branches
- staff and doctors
- patients and appointments
- queue management
- payments
- notifications
- reporting

## Notes on architecture

This application is designed with a clear separation of concerns:

- backend handles business logic, validation, security, and persistence
- frontend handles user experience, role-specific dashboards, and interactions
- Prisma manages the data layer and database schema
- Swagger documents the API contract for team collaboration and testing

## Future roadmap

Possible improvements for the platform include:

- real SMS/OTP provider integration
- advanced reporting dashboards and export features
- patient portal notifications and reminders
- audit and compliance enhancements
- improved scheduling and resource availability
- deployment automation for production environments

## Author

Zenebu Melaku  
Fullstack Developer

I enjoy building modern, reliable, and user-centered digital systems that solve real-world problems and improve day-to-day operations.

## License

This project is currently maintained for development and internal use. Please contact the project owner before reusing or commercializing the codebase.

---

If you want, I can also turn this into a more premium README with badges, architecture diagram sections, screenshots placeholders, and a portfolio-style "About the developer" section.
