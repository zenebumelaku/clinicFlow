import { Role } from '@prisma/client';

export class PatientResponseDto {
  id!: string;
  clinicId!: string;
  userId!: string;
  medicalRecordNumber!: string;
  dateOfBirth!: Date | null;
  gender!: string | null;
  address!: string | null;
  emergencyContactName!: string | null;
  emergencyContactPhone!: string | null;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  user!: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    role: Role;
  };
}
