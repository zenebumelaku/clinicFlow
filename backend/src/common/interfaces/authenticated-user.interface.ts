import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  phone: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}
