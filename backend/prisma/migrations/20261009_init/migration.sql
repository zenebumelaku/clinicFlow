-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('LOGIN', 'REGISTRATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "DoctorAvailabilityStatus" AS ENUM ('AVAILABLE', 'BUSY', 'ON_LEAVE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "QueueTicketStatus" AS ENUM ('WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "QueuePriority" AS ENUM ('EMERGENCY', 'URGENT', 'NORMAL');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TELEBIRR', 'MPESA', 'BANK_TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT_REMINDER', 'QUEUE_UPDATE', 'APPOINTMENT_CANCELLATION', 'DOCTOR_DELAY', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PATIENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'LOGIN',
    "userId" TEXT,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "clinicId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "region" TEXT,
    "licenseNumber" TEXT,
    "logoUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_members" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "branchId" TEXT,
    "userId" TEXT NOT NULL,
    "jobTitle" TEXT,
    "employeeCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "staffMemberId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "bio" TEXT,
    "consultationFee" DECIMAL(12,2),
    "availabilityStatus" "DoctorAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "medicalRecordNumber" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "address" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "reason" TEXT,
    "notes" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_daily_counters" (
    "clinicId" TEXT NOT NULL,
    "queueDate" DATE NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "queue_daily_counters_pkey" PRIMARY KEY ("clinicId","queueDate")
);

-- CreateTable
CREATE TABLE "queue_tickets" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "appointmentId" TEXT,
    "queueDate" DATE NOT NULL,
    "queueNumber" INTEGER NOT NULL,
    "priority" "QueuePriority" NOT NULL DEFAULT 'NORMAL',
    "status" "QueueTicketStatus" NOT NULL DEFAULT 'WAITING',
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calledAt" TIMESTAMP(3),
    "consultationStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "queue_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_isRevoked_idx" ON "refresh_tokens"("userId", "isRevoked");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "otps_identifier_isUsed_idx" ON "otps"("identifier", "isUsed");

-- CreateIndex
CREATE INDEX "otps_identifier_purpose_createdAt_idx" ON "otps"("identifier", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_clinicId_createdAt_idx" ON "audit_logs"("clinicId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "clinics_slug_key" ON "clinics"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "clinics_licenseNumber_key" ON "clinics"("licenseNumber");

-- CreateIndex
CREATE INDEX "clinics_name_idx" ON "clinics"("name");

-- CreateIndex
CREATE INDEX "clinics_isActive_idx" ON "clinics"("isActive");

-- CreateIndex
CREATE INDEX "branches_clinicId_idx" ON "branches"("clinicId");

-- CreateIndex
CREATE INDEX "branches_clinicId_isActive_idx" ON "branches"("clinicId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "branches_clinicId_code_key" ON "branches"("clinicId", "code");

-- CreateIndex
CREATE INDEX "staff_members_clinicId_idx" ON "staff_members"("clinicId");

-- CreateIndex
CREATE INDEX "staff_members_userId_idx" ON "staff_members"("userId");

-- CreateIndex
CREATE INDEX "staff_members_branchId_idx" ON "staff_members"("branchId");

-- CreateIndex
CREATE INDEX "staff_members_clinicId_isActive_idx" ON "staff_members"("clinicId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_clinicId_userId_key" ON "staff_members"("clinicId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_clinicId_employeeCode_key" ON "staff_members"("clinicId", "employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_staffMemberId_key" ON "doctors"("staffMemberId");

-- CreateIndex
CREATE INDEX "doctors_clinicId_idx" ON "doctors"("clinicId");

-- CreateIndex
CREATE INDEX "doctors_userId_idx" ON "doctors"("userId");

-- CreateIndex
CREATE INDEX "doctors_clinicId_specialization_idx" ON "doctors"("clinicId", "specialization");

-- CreateIndex
CREATE INDEX "doctors_clinicId_availabilityStatus_idx" ON "doctors"("clinicId", "availabilityStatus");

-- CreateIndex
CREATE INDEX "doctors_clinicId_isActive_idx" ON "doctors"("clinicId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_clinicId_licenseNumber_key" ON "doctors"("clinicId", "licenseNumber");

-- CreateIndex
CREATE INDEX "patients_clinicId_createdAt_idx" ON "patients"("clinicId", "createdAt");

-- CreateIndex
CREATE INDEX "patients_userId_idx" ON "patients"("userId");

-- CreateIndex
CREATE INDEX "patients_clinicId_isActive_idx" ON "patients"("clinicId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "patients_clinicId_userId_key" ON "patients"("clinicId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "patients_clinicId_medicalRecordNumber_key" ON "patients"("clinicId", "medicalRecordNumber");

-- CreateIndex
CREATE INDEX "appointments_clinicId_startsAt_idx" ON "appointments"("clinicId", "startsAt");

-- CreateIndex
CREATE INDEX "appointments_clinicId_doctorId_startsAt_endsAt_idx" ON "appointments"("clinicId", "doctorId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "appointments_clinicId_patientId_startsAt_idx" ON "appointments"("clinicId", "patientId", "startsAt");

-- CreateIndex
CREATE INDEX "appointments_clinicId_status_startsAt_idx" ON "appointments"("clinicId", "status", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "queue_tickets_appointmentId_key" ON "queue_tickets"("appointmentId");

-- CreateIndex
CREATE INDEX "queue_tickets_clinicId_queueDate_priority_queueNumber_idx" ON "queue_tickets"("clinicId", "queueDate", "priority", "queueNumber");

-- CreateIndex
CREATE INDEX "queue_tickets_clinicId_queueDate_status_queueNumber_idx" ON "queue_tickets"("clinicId", "queueDate", "status", "queueNumber");

-- CreateIndex
CREATE INDEX "queue_tickets_clinicId_doctorId_queueDate_status_idx" ON "queue_tickets"("clinicId", "doctorId", "queueDate", "status");

-- CreateIndex
CREATE INDEX "queue_tickets_clinicId_patientId_queueDate_idx" ON "queue_tickets"("clinicId", "patientId", "queueDate");

-- CreateIndex
CREATE UNIQUE INDEX "queue_tickets_clinicId_queueDate_queueNumber_key" ON "queue_tickets"("clinicId", "queueDate", "queueNumber");

-- CreateIndex
CREATE INDEX "payments_clinicId_status_createdAt_idx" ON "payments"("clinicId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "payments_clinicId_patientId_createdAt_idx" ON "payments"("clinicId", "patientId", "createdAt");

-- CreateIndex
CREATE INDEX "payments_clinicId_appointmentId_idx" ON "payments"("clinicId", "appointmentId");

-- CreateIndex
CREATE INDEX "notifications_userId_clinicId_readAt_createdAt_idx" ON "notifications"("userId", "clinicId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_clinicId_createdAt_idx" ON "notifications"("clinicId", "createdAt");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_daily_counters" ADD CONSTRAINT "queue_daily_counters_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_tickets" ADD CONSTRAINT "queue_tickets_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_tickets" ADD CONSTRAINT "queue_tickets_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_tickets" ADD CONSTRAINT "queue_tickets_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_tickets" ADD CONSTRAINT "queue_tickets_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
