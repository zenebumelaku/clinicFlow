export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'ClinicFlow API',
    description: 'ClinicFlow - Electronic Healthcare & Clinic Management System Backend API Documentation',
    version: '1.0.0',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Health', description: 'Health status checks' },
    {
      name: 'Authentication & Authorization',
      description: 'Password authentication, JWT, and RBAC',
    },
    { name: 'Clinics', description: 'Clinic profile management with tenant isolation' },
    { name: 'Branches', description: 'Clinic branch CRUD' },
    { name: 'Staff', description: 'Clinic staff management' },
    { name: 'Doctors', description: 'Doctor profiles, specialization, and availability' },
    { name: 'Patients', description: 'Clinic patient registration and records' },
    { name: 'Appointments', description: 'Appointment scheduling and status workflow' },
    { name: 'Clinic Queue', description: 'Daily clinic queue and consultation flow' },
    { name: 'Payments', description: 'Chapa checkout, payment verification, and payment records' },
    { name: 'Notifications', description: 'User and clinic notifications' },
    { name: 'Reports', description: 'Dashboard and analytics' },
  ],
  components: {
    securitySchemes: {
      'JWT-auth': {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT access token',
        in: 'header',
      },
    },
  },
  paths: {
    '/api/v1/health': {
      get: {
        tags: ['Health'],
        summary: 'Application health and status check',
        responses: {
          '200': {
            description: 'Application and PostgreSQL are healthy and responding',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'mediflow-et-backend' },
                    database: { type: 'string', example: 'connected' },
                    version: { type: 'string', example: '1.0.0' },
                    timestamp: { type: 'string', example: '2026-10-08T19:30:00.000Z' },
                  },
                },
              },
            },
          },
          '503': { description: 'PostgreSQL is unavailable' },
        },
      },
    },
    '/api/v1/auth/register-clinic': {
      post: {
        tags: ['Authentication & Authorization'],
        summary: 'Create a clinic administrator account and sign in',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone', 'password', 'firstName', 'lastName', 'clinicName'],
                properties: {
                  phone: { type: 'string', example: '+251911234567' },
                  password: { type: 'string', minLength: 8 },
                  firstName: { type: 'string', example: 'Abebe' },
                  lastName: { type: 'string', example: 'Bekele' },
                  email: { type: 'string', format: 'email' },
                  clinicName: { type: 'string', example: 'Addis Health Center' },
                  clinicPhone: { type: 'string', example: '+251911234567' },
                  clinicAddress: { type: 'string', example: 'Bole Road' },
                  clinicCity: { type: 'string', example: 'Addis Ababa' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Clinic and administrator created; session issued' },
          '400': { description: 'Invalid registration data' },
          '409': { description: 'Phone or email is already registered' },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Authentication & Authorization'],
        summary: 'Authenticate with phone/email and password',
        responses: {
          '200': { description: 'User authenticated successfully' },
          '401': { description: 'Invalid credentials or inactive account' },
        },
      },
    },
    '/api/v1/auth/refresh': {
      post: {
        tags: ['Authentication & Authorization'],
        summary: 'Rotate refresh token and issue new token pair',
        responses: {
          '200': { description: 'Tokens successfully rotated' },
          '401': { description: 'Invalid, revoked, or expired refresh token' },
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Authentication & Authorization'],
        summary: 'Revoke refresh token and terminate session',
        responses: {
          '200': { description: 'Logged out successfully' },
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Authentication & Authorization'],
        summary: 'Get profile of current authenticated user',
        security: [{ 'JWT-auth': [] }],
        responses: {
          '200': { description: 'User profile retrieved successfully' },
          '401': { description: 'Missing or invalid access token' },
        },
      },
    },
    '/api/v1/clinics': {
      get: {
        tags: ['Clinics'],
        summary: 'List clinic profiles the authenticated user can access',
        security: [{ 'JWT-auth': [] }],
        responses: { '200': { description: 'List of clinics' } },
      },
      post: {
        tags: ['Clinics'],
        summary: 'Create a clinic profile and assign the admin as staff',
        security: [{ 'JWT-auth': [] }],
        responses: { '201': { description: 'Clinic created' } },
      },
    },
    '/api/v1/patients': {
      get: {
        tags: ['Patients'],
        summary: 'List clinic patients with pagination and search',
        security: [{ 'JWT-auth': [] }],
        responses: { '200': { description: 'List of patients' } },
      },
      post: {
        tags: ['Patients'],
        summary: 'Register a patient in a clinic',
        security: [{ 'JWT-auth': [] }],
        responses: { '201': { description: 'Patient registered' } },
      },
    },
    '/api/v1/appointments': {
      get: {
        tags: ['Appointments'],
        summary: 'List appointments',
        security: [{ 'JWT-auth': [] }],
        responses: { '200': { description: 'List of appointments' } },
      },
      post: {
        tags: ['Appointments'],
        summary: 'Schedule an appointment in a clinic',
        security: [{ 'JWT-auth': [] }],
        responses: { '201': { description: 'Appointment created' } },
      },
    },
    '/api/v1/queue': {
      get: {
        tags: ['Clinic Queue'],
        summary: 'Get a clinic queue',
        security: [{ 'JWT-auth': [] }],
        responses: { '200': { description: 'Queue tickets' } },
      },
    },
    '/api/v1/payments': {
      get: {
        tags: ['Payments'],
        summary: 'List clinic payment records',
        security: [{ 'JWT-auth': [] }],
        responses: { '200': { description: 'List of payments' } },
      },
    },
    '/api/v1/reports/dashboard': {
      get: {
        tags: ['Reports'],
        summary: 'Get clinic dashboard metrics',
        security: [{ 'JWT-auth': [] }],
        responses: { '200': { description: 'Dashboard metrics' } },
      },
    },
  },
};
