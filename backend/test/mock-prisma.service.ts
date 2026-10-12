import {
  Role,
  OtpPurpose,
  DoctorAvailabilityStatus,
  AppointmentStatus,
  QueuePriority,
  QueueTicketStatus,
  PaymentMethod,
  PaymentStatus,
  NotificationType,
} from '@prisma/client';
import { randomUUID } from 'crypto';

export interface MockUser {
  id: string;
  phone: string;
  email: string | null;
  passwordHash: string | null;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockOtp {
  id: string;
  identifier: string;
  codeHash: string;
  purpose: OtpPurpose;
  userId?: string | null;
  isUsed: boolean;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  createdAt: Date;
}

export interface MockRefreshToken {
  id: string;
  tokenHash: string;
  userId: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface MockClinic {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string;
  address: string | null;
  city: string | null;
  region: string | null;
  licenseNumber: string | null;
  logoUrl: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockBranch {
  id: string;
  clinicId: string;
  name: string;
  code: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockStaffMember {
  id: string;
  clinicId: string;
  branchId: string | null;
  userId: string;
  jobTitle: string | null;
  employeeCode: string | null;
  isActive: boolean;
  hiredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockDoctor {
  id: string;
  clinicId: string;
  staffMemberId: string;
  userId: string;
  specialization: string;
  licenseNumber: string;
  bio: string | null;
  consultationFee: number | null;
  availabilityStatus: DoctorAvailabilityStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockPatient {
  id: string;
  clinicId: string;
  userId: string;
  medicalRecordNumber: string;
  dateOfBirth: Date | null;
  gender: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockAppointment {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  startsAt: Date;
  endsAt: Date;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  checkedInAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockQueueTicket {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string | null;
  appointmentId: string | null;
  queueDate: Date;
  queueNumber: number;
  priority: QueuePriority;
  status: QueueTicketStatus;
  checkedInAt: Date;
  calledAt: Date | null;
  consultationStartedAt: Date | null;
  completedAt: Date | null;
  skippedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockQueueDailyCounter {
  clinicId: string;
  queueDate: Date;
  lastNumber: number;
  updatedAt: Date;
}

export interface MockPayment {
  id: string;
  clinicId: string;
  patientId: string;
  appointmentId: string | null;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockAuditLog {
  id: string;
  userId: string | null;
  clinicId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
  createdAt: Date;
}

export interface MockNotification {
  id: string;
  clinicId: string;
  userId: string;
  appointmentId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
}

export interface MockAuditLog {
  id: string;
  userId: string | null;
  clinicId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
  createdAt: Date;
}

function uniqueError(target: string[]): never {
  const err = new Error(`Unique constraint failed on ${target.join(', ')}`) as Error & {
    code: string;
    meta: { target: string[] };
  };
  err.code = 'P2002';
  err.meta = { target };
  throw err;
}

function matchesWhere(record: Record<string, unknown>, where?: Record<string, unknown>): boolean {
  if (!where) return true;

  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;

    if (key === 'AND' && Array.isArray(value)) {
      if (!value.every((clause) => matchesWhere(record, clause as Record<string, unknown>))) {
        return false;
      }
      continue;
    }
    if (key === 'OR' && Array.isArray(value)) {
      if (!value.some((clause) => matchesWhere(record, clause as Record<string, unknown>))) {
        return false;
      }
      continue;
    }
    if (key === 'NOT') {
      if (matchesWhere(record, value as Record<string, unknown>)) return false;
      continue;
    }

    if (record[key] instanceof Date && value instanceof Date) {
      if (record[key].getTime() !== value.getTime()) return false;
      continue;
    }

    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      const filter = value as Record<string, unknown>;
      const fieldValue = record[key];
      const operators = new Set([
        'is',
        'equals',
        'in',
        'notIn',
        'lt',
        'lte',
        'gt',
        'gte',
        'contains',
        'not',
        'mode',
      ]);
      const nested = Object.fromEntries(
        Object.entries(filter).filter(([filterKey]) => !operators.has(filterKey)),
      );
      if (
        Object.keys(nested).length > 0 &&
        fieldValue &&
        typeof fieldValue === 'object' &&
        !matchesWhere(fieldValue as Record<string, unknown>, nested)
      ) {
        return false;
      }
      if ('is' in filter && filter.is && typeof fieldValue === 'object' && fieldValue !== null) {
        if (
          !matchesWhere(fieldValue as Record<string, unknown>, filter.is as Record<string, unknown>)
        ) {
          return false;
        }
      }
      if ('equals' in filter && fieldValue !== filter.equals) return false;
      if ('in' in filter && Array.isArray(filter.in) && !filter.in.includes(fieldValue))
        return false;
      if ('notIn' in filter && Array.isArray(filter.notIn) && filter.notIn.includes(fieldValue))
        return false;
      if (
        'lt' in filter &&
        !(fieldValue instanceof Date && filter.lt instanceof Date && fieldValue < filter.lt)
      )
        return false;
      if (
        'lte' in filter &&
        !(fieldValue instanceof Date && filter.lte instanceof Date && fieldValue <= filter.lte)
      )
        return false;
      if (
        'gt' in filter &&
        !(fieldValue instanceof Date && filter.gt instanceof Date && fieldValue > filter.gt)
      )
        return false;
      if (
        'gte' in filter &&
        !(fieldValue instanceof Date && filter.gte instanceof Date && fieldValue >= filter.gte)
      )
        return false;
      if (
        'contains' in filter &&
        typeof fieldValue === 'string' &&
        typeof filter.contains === 'string'
      ) {
        const haystack = filter.mode === 'insensitive' ? fieldValue.toLowerCase() : fieldValue;
        const needle =
          filter.mode === 'insensitive' ? filter.contains.toLowerCase() : filter.contains;
        if (!haystack.includes(needle)) return false;
      }
      if ('not' in filter && fieldValue === filter.not) return false;
      continue;
    }

    if (record[key] !== value) return false;
  }

  return true;
}

function applyUpdate<T extends { updatedAt: Date }>(record: T, data: Record<string, unknown>): T {
  const next: Record<string, unknown> = { ...record };
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    next[key] = value;
  }
  next.updatedAt = new Date();
  return next as T;
}

function paginate<T>(
  items: T[],
  params?: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>;
  },
): T[] {
  let sorted = [...items];
  if (params?.orderBy) {
    const orderRules = Array.isArray(params.orderBy) ? params.orderBy : [params.orderBy];
    sorted.sort((a, b) => {
      for (const rule of orderRules) {
        const [field, direction] = Object.entries(rule)[0] || [];
        if (!field) continue;
        const av = (a as Record<string, unknown>)[field];
        const bv = (b as Record<string, unknown>)[field];
        if (field === 'priority') {
          const priorityRank = { EMERGENCY: 0, URGENT: 1, NORMAL: 2 };
          const rankA = priorityRank[av as keyof typeof priorityRank];
          const rankB = priorityRank[bv as keyof typeof priorityRank];
          if (rankA !== rankB) return direction === 'asc' ? rankA - rankB : rankB - rankA;
          continue;
        }
        if (av instanceof Date && bv instanceof Date) {
          const result = av.getTime() - bv.getTime();
          if (result !== 0) return direction === 'asc' ? result : -result;
        }
        if (typeof av === 'string' && typeof bv === 'string') {
          const result = av.localeCompare(bv);
          if (result !== 0) return direction === 'asc' ? result : -result;
        }
        if (typeof av === 'number' && typeof bv === 'number') {
          const result = av - bv;
          if (result !== 0) return direction === 'asc' ? result : -result;
        }
      }
      return 0;
    });
  }
  if (params?.skip) {
    sorted = sorted.slice(params.skip);
  }
  if (params?.take !== undefined) {
    sorted = sorted.slice(0, params.take);
  }
  return sorted;
}

export class MockPrismaService {
  users = new Map<string, MockUser>();
  otps = new Map<string, MockOtp>();
  refreshTokens = new Map<string, MockRefreshToken>();
  clinics = new Map<string, MockClinic>();
  branches = new Map<string, MockBranch>();
  staffMembers = new Map<string, MockStaffMember>();
  doctors = new Map<string, MockDoctor>();
  patients = new Map<string, MockPatient>();
  appointments = new Map<string, MockAppointment>();
  queueTickets = new Map<string, MockQueueTicket>();
  queueDailyCounters = new Map<string, MockQueueDailyCounter>();
  payments = new Map<string, MockPayment>();
  notifications = new Map<string, MockNotification>();
  auditLogs = new Map<string, MockAuditLog>();
  rawQueryResults: unknown[] = [];
  rawQueryCalls: Array<{ sql: string; values: unknown[] }> = [];
  private transactionQueue: Promise<void> = Promise.resolve();

  async $queryRaw<T = unknown>(query: unknown): Promise<T> {
    const statement = query as { sql?: string; values?: unknown[] };
    this.rawQueryCalls.push({ sql: statement.sql || '', values: statement.values || [] });
    return (this.rawQueryResults.shift() ?? []) as T;
  }

  async $transaction<T>(operation: (transaction: this) => Promise<T>): Promise<T> {
    const result = this.transactionQueue.then(() => operation(this));
    this.transactionQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async $connect() {
    return Promise.resolve();
  }

  async $disconnect() {
    return Promise.resolve();
  }

  auditLog = {
    create: async (params: { data: Partial<MockAuditLog> }) => {
      const id = params.data.id || randomUUID();
      const log: MockAuditLog = {
        id,
        userId: params.data.userId || null,
        clinicId: params.data.clinicId || null,
        action: params.data.action!,
        entity: params.data.entity!,
        entityId: params.data.entityId || null,
        details: params.data.details || null,
        ipAddress: params.data.ipAddress || null,
        userAgent: params.data.userAgent || null,
        correlationId: params.data.correlationId || null,
        createdAt: params.data.createdAt || new Date(),
      };
      this.auditLogs.set(id, log);
      return log;
    },
  };

  user = {
    findFirst: async (params: {
      where: { OR?: Array<{ phone?: string; email?: string }>; id?: string };
    }) => {
      for (const user of this.users.values()) {
        if (params.where.id && user.id === params.where.id) return user;
        if (params.where.OR) {
          for (const condition of params.where.OR) {
            if (condition.phone && user.phone === condition.phone) return user;
            if (condition.email && user.email === condition.email) return user;
          }
        }
      }
      return null;
    },
    findUnique: async (params: { where: { id?: string; phone?: string; email?: string } }) => {
      for (const user of this.users.values()) {
        if (params.where.id && user.id === params.where.id) return user;
        if (params.where.phone && user.phone === params.where.phone) return user;
        if (params.where.email && user.email === params.where.email) return user;
      }
      return null;
    },
    create: async (params: { data: Partial<MockUser> }) => {
      const id = params.data.id || randomUUID();
      const user: MockUser = {
        id,
        phone: params.data.phone || `+2519${Date.now()}`,
        email: params.data.email || null,
        passwordHash: params.data.passwordHash || null,
        firstName: params.data.firstName || 'First',
        lastName: params.data.lastName || 'Last',
        role: params.data.role || Role.PATIENT,
        isActive: params.data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(id, user);
      return user;
    },
    update: async (params: { where: { id: string }; data: Partial<MockUser> }) => {
      const user = this.users.get(params.where.id);
      if (!user) return null;
      const updated = applyUpdate(user, params.data as Record<string, unknown>);
      this.users.set(params.where.id, updated);
      return updated;
    },
  };

  otp = {
    findFirst: async (params: {
      where: { identifier: string; purpose?: OtpPurpose; isUsed?: boolean };
      orderBy?: { createdAt: 'desc' | 'asc' };
    }) => {
      const matches: MockOtp[] = [];
      for (const otp of this.otps.values()) {
        if (otp.identifier !== params.where.identifier) continue;
        if (params.where.purpose !== undefined && otp.purpose !== params.where.purpose) continue;
        if (params.where.isUsed !== undefined && otp.isUsed !== params.where.isUsed) continue;
        matches.push(otp);
      }
      matches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return matches[0] || null;
    },
    create: async (params: { data: Partial<MockOtp> }) => {
      const id = params.data.id || randomUUID();
      const otp: MockOtp = {
        id,
        identifier: params.data.identifier!,
        codeHash: params.data.codeHash!,
        purpose: params.data.purpose || OtpPurpose.LOGIN,
        userId: params.data.userId || null,
        isUsed: params.data.isUsed ?? false,
        attempts: params.data.attempts ?? 0,
        maxAttempts: params.data.maxAttempts ?? 3,
        expiresAt: params.data.expiresAt || new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
      };
      this.otps.set(id, otp);
      return otp;
    },
    update: async (params: { where: { id: string }; data: Partial<MockOtp> }) => {
      const otp = this.otps.get(params.where.id);
      if (!otp) return null;
      const updated = { ...otp, ...params.data };
      this.otps.set(params.where.id, updated);
      return updated;
    },
    updateMany: async (params: {
      where: Record<string, unknown>;
      data: Omit<Partial<MockOtp>, 'attempts'> & {
        attempts?: number | { increment: number };
      };
    }) => {
      let count = 0;
      for (const [id, otp] of this.otps.entries()) {
        if (!matchesWhere(otp as unknown as Record<string, unknown>, params.where)) continue;
        const { attempts, ...data } = params.data;
        const updated = { ...otp, ...data };
        if (typeof attempts === 'number') updated.attempts = attempts;
        if (typeof attempts === 'object') updated.attempts = otp.attempts + attempts.increment;
        this.otps.set(id, updated);
        count++;
      }
      return { count };
    },
  };

  refreshToken = {
    create: async (params: { data: Partial<MockRefreshToken> }) => {
      const id = params.data.id || randomUUID();
      const token: MockRefreshToken = {
        id,
        tokenHash: params.data.tokenHash!,
        userId: params.data.userId!,
        isRevoked: params.data.isRevoked ?? false,
        expiresAt: params.data.expiresAt!,
        createdAt: new Date(),
      };
      this.refreshTokens.set(token.tokenHash, token);
      return token;
    },
    findUnique: async (params: { where: { tokenHash: string }; include?: { user: boolean } }) => {
      const token = this.refreshTokens.get(params.where.tokenHash);
      if (!token) return null;
      if (params.include?.user) {
        const user = this.users.get(token.userId);
        return { ...token, user };
      }
      return token;
    },
    update: async (params: { where: { id: string }; data: Partial<MockRefreshToken> }) => {
      for (const [hash, token] of this.refreshTokens.entries()) {
        if (token.id === params.where.id) {
          const updated = { ...token, ...params.data };
          this.refreshTokens.set(hash, updated);
          return updated;
        }
      }
      return null;
    },
    updateMany: async (params: {
      where: { id?: string; userId?: string; isRevoked?: boolean };
      data: Partial<MockRefreshToken>;
    }) => {
      let count = 0;
      for (const [hash, token] of this.refreshTokens.entries()) {
        if (params.where.id && token.id !== params.where.id) continue;
        if (params.where.userId && token.userId !== params.where.userId) continue;
        if (params.where.isRevoked !== undefined && token.isRevoked !== params.where.isRevoked)
          continue;
        this.refreshTokens.set(hash, { ...token, ...params.data });
        count++;
      }
      return { count };
    },
  };

  clinic = {
    findUnique: async (params: {
      where: { id?: string; slug?: string; licenseNumber?: string };
    }) => {
      for (const clinic of this.clinics.values()) {
        if (params.where.id && clinic.id === params.where.id) return clinic;
        if (params.where.slug && clinic.slug === params.where.slug) return clinic;
        if (params.where.licenseNumber && clinic.licenseNumber === params.where.licenseNumber) {
          return clinic;
        }
      }
      return null;
    },
    create: async (params: { data: Partial<MockClinic> }) => {
      if ([...this.clinics.values()].some((c) => c.slug === params.data.slug)) {
        uniqueError(['slug']);
      }
      if (
        params.data.licenseNumber &&
        [...this.clinics.values()].some((c) => c.licenseNumber === params.data.licenseNumber)
      ) {
        uniqueError(['licenseNumber']);
      }
      const id = params.data.id || randomUUID();
      const clinic: MockClinic = {
        id,
        name: params.data.name || 'Clinic',
        slug: params.data.slug || `clinic-${id.slice(0, 8)}`,
        email: params.data.email || null,
        phone: params.data.phone || '+251110000000',
        address: params.data.address || null,
        city: params.data.city || null,
        region: params.data.region || null,
        licenseNumber: params.data.licenseNumber || null,
        logoUrl: params.data.logoUrl || null,
        description: params.data.description || null,
        isActive: params.data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.clinics.set(id, clinic);
      return clinic;
    },
    update: async (params: { where: { id: string }; data: Partial<MockClinic> }) => {
      const clinic = this.clinics.get(params.where.id);
      if (!clinic) return null;
      if (
        params.data.slug &&
        [...this.clinics.values()].some((c) => c.slug === params.data.slug && c.id !== clinic.id)
      ) {
        uniqueError(['slug']);
      }
      const updated = applyUpdate(clinic, params.data as Record<string, unknown>);
      this.clinics.set(clinic.id, updated);
      return updated;
    },
  };

  branch = {
    findFirst: async (params: { where: Record<string, unknown> }) => {
      for (const branch of this.branches.values()) {
        if (matchesWhere(branch as unknown as Record<string, unknown>, params.where)) {
          return branch;
        }
      }
      return null;
    },
    findMany: async (params: {
      where?: Record<string, unknown>;
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
    }) => {
      const matches = [...this.branches.values()].filter((branch) =>
        matchesWhere(branch as unknown as Record<string, unknown>, params.where),
      );
      return paginate(matches, params);
    },
    count: async (params: { where?: Record<string, unknown> }) => {
      return [...this.branches.values()].filter((branch) =>
        matchesWhere(branch as unknown as Record<string, unknown>, params.where),
      ).length;
    },
    create: async (params: { data: Partial<MockBranch> }) => {
      if (
        [...this.branches.values()].some(
          (b) => b.clinicId === params.data.clinicId && b.code === params.data.code,
        )
      ) {
        uniqueError(['clinicId', 'code']);
      }
      const id = params.data.id || randomUUID();
      const branch: MockBranch = {
        id,
        clinicId: params.data.clinicId!,
        name: params.data.name || 'Branch',
        code: params.data.code || 'MAIN',
        phone: params.data.phone || null,
        email: params.data.email || null,
        address: params.data.address || null,
        city: params.data.city || null,
        isActive: params.data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.branches.set(id, branch);
      return branch;
    },
    update: async (params: { where: { id: string }; data: Partial<MockBranch> }) => {
      const branch = this.branches.get(params.where.id);
      if (!branch) return null;
      const updated = applyUpdate(branch, params.data as Record<string, unknown>);
      this.branches.set(branch.id, updated);
      return updated;
    },
    updateMany: async (params: { where: Record<string, unknown>; data: Partial<MockBranch> }) => {
      let count = 0;
      for (const [id, branch] of this.branches.entries()) {
        if (!matchesWhere(branch as unknown as Record<string, unknown>, params.where)) continue;
        this.branches.set(id, applyUpdate(branch, params.data as Record<string, unknown>));
        count++;
      }
      return { count };
    },
  };

  staffMember = {
    findFirst: async (params: {
      where: Record<string, unknown>;
      include?: { user?: boolean; clinic?: boolean; doctor?: boolean };
    }) => {
      for (const staff of this.staffMembers.values()) {
        if (matchesWhere(this.staffRecord(staff), params.where)) {
          return this.hydrateStaff(staff, params.include);
        }
      }
      return null;
    },
    findMany: async (params: {
      where?: Record<string, unknown>;
      include?: { user?: boolean; clinic?: boolean };
      select?: { id?: boolean };
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
    }) => {
      const matches = [...this.staffMembers.values()].filter((staff) =>
        matchesWhere(this.staffRecord(staff), params.where),
      );
      const page = paginate(matches, params);
      if (params.select?.id) {
        return page.map((staff) => ({ id: staff.id }));
      }
      return page.map((staff) => this.hydrateStaff(staff, params.include));
    },
    count: async (params: { where?: Record<string, unknown> }) => {
      return [...this.staffMembers.values()].filter((staff) =>
        matchesWhere(this.staffRecord(staff), params.where),
      ).length;
    },
    create: async (params: { data: Partial<MockStaffMember>; include?: { user?: boolean } }) => {
      if (
        [...this.staffMembers.values()].some(
          (s) => s.clinicId === params.data.clinicId && s.userId === params.data.userId,
        )
      ) {
        uniqueError(['clinicId', 'userId']);
      }
      if (
        params.data.employeeCode &&
        [...this.staffMembers.values()].some(
          (s) => s.clinicId === params.data.clinicId && s.employeeCode === params.data.employeeCode,
        )
      ) {
        uniqueError(['clinicId', 'employeeCode']);
      }
      const id = params.data.id || randomUUID();
      const staff: MockStaffMember = {
        id,
        clinicId: params.data.clinicId!,
        branchId: params.data.branchId || null,
        userId: params.data.userId!,
        jobTitle: params.data.jobTitle || null,
        employeeCode: params.data.employeeCode || null,
        isActive: params.data.isActive ?? true,
        hiredAt: params.data.hiredAt || new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.staffMembers.set(id, staff);
      return this.hydrateStaff(staff, params.include);
    },
    update: async (params: {
      where: { id: string };
      data: Partial<MockStaffMember>;
      include?: { user?: boolean };
    }) => {
      const staff = this.staffMembers.get(params.where.id);
      if (!staff) return null;
      const updated = applyUpdate(staff, params.data as Record<string, unknown>);
      this.staffMembers.set(staff.id, updated);
      return this.hydrateStaff(updated, params.include);
    },
    updateMany: async (params: {
      where: Record<string, unknown>;
      data: Partial<MockStaffMember>;
    }) => {
      let count = 0;
      for (const [id, staff] of this.staffMembers.entries()) {
        if (!matchesWhere(staff as unknown as Record<string, unknown>, params.where)) continue;
        this.staffMembers.set(id, applyUpdate(staff, params.data as Record<string, unknown>));
        count++;
      }
      return { count };
    },
  };

  doctor = {
    findFirst: async (params: {
      where: Record<string, unknown>;
      include?: { user?: boolean; staffMember?: { include?: { user?: boolean } } | boolean };
    }) => {
      for (const doctor of this.doctors.values()) {
        if (matchesWhere(this.doctorRecord(doctor), params.where)) {
          return this.hydrateDoctor(doctor, params.include);
        }
      }
      return null;
    },
    findMany: async (params: {
      where?: Record<string, unknown>;
      include?: { user?: boolean; staffMember?: { include?: { user?: boolean } } | boolean };
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
    }) => {
      const matches = [...this.doctors.values()].filter((doctor) =>
        matchesWhere(this.doctorRecord(doctor), params.where),
      );
      return paginate(matches, params).map((doctor) => this.hydrateDoctor(doctor, params.include));
    },
    count: async (params: { where?: Record<string, unknown> }) => {
      return [...this.doctors.values()].filter((doctor) =>
        matchesWhere(this.doctorRecord(doctor), params.where),
      ).length;
    },
    create: async (params: {
      data: Partial<MockDoctor>;
      include?: { user?: boolean; staffMember?: { include?: { user?: boolean } } | boolean };
    }) => {
      if ([...this.doctors.values()].some((d) => d.staffMemberId === params.data.staffMemberId)) {
        uniqueError(['staffMemberId']);
      }
      if (
        [...this.doctors.values()].some(
          (d) =>
            d.clinicId === params.data.clinicId && d.licenseNumber === params.data.licenseNumber,
        )
      ) {
        uniqueError(['clinicId', 'licenseNumber']);
      }
      const id = params.data.id || randomUUID();
      const doctor: MockDoctor = {
        id,
        clinicId: params.data.clinicId!,
        staffMemberId: params.data.staffMemberId!,
        userId: params.data.userId!,
        specialization: params.data.specialization || 'General',
        licenseNumber: params.data.licenseNumber || `LIC-${id.slice(0, 8)}`,
        bio: params.data.bio || null,
        consultationFee:
          params.data.consultationFee === undefined ? null : Number(params.data.consultationFee),
        availabilityStatus: params.data.availabilityStatus || DoctorAvailabilityStatus.AVAILABLE,
        isActive: params.data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.doctors.set(id, doctor);
      return this.hydrateDoctor(doctor, params.include);
    },
    update: async (params: {
      where: { id: string };
      data: Partial<MockDoctor>;
      include?: { user?: boolean; staffMember?: { include?: { user?: boolean } } | boolean };
    }) => {
      const doctor = this.doctors.get(params.where.id);
      if (!doctor) return null;
      const updated = applyUpdate(doctor, params.data as Record<string, unknown>);
      this.doctors.set(doctor.id, updated);
      return this.hydrateDoctor(updated, params.include);
    },
    updateMany: async (params: { where: Record<string, unknown>; data: Partial<MockDoctor> }) => {
      let count = 0;
      for (const [id, doctor] of this.doctors.entries()) {
        if (!matchesWhere(doctor as unknown as Record<string, unknown>, params.where)) continue;
        this.doctors.set(id, applyUpdate(doctor, params.data as Record<string, unknown>));
        count++;
      }
      return { count };
    },
  };

  patient = {
    findFirst: async (params: { where: Record<string, unknown>; include?: { user?: boolean } }) => {
      for (const patient of this.patients.values()) {
        if (matchesWhere(patient as unknown as Record<string, unknown>, params.where)) {
          return this.hydratePatient(patient, params.include);
        }
      }
      return null;
    },
    findMany: async (params: {
      where?: Record<string, unknown>;
      include?: { user?: boolean };
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
    }) => {
      const matches = [...this.patients.values()].filter((patient) =>
        matchesWhere(
          { ...patient, user: this.users.get(patient.userId) } as unknown as Record<
            string,
            unknown
          >,
          params.where,
        ),
      );
      return paginate(matches, params).map((patient) =>
        this.hydratePatient(patient, params.include),
      );
    },
    count: async (params: { where?: Record<string, unknown> }) =>
      [...this.patients.values()].filter((patient) =>
        matchesWhere(
          { ...patient, user: this.users.get(patient.userId) } as unknown as Record<
            string,
            unknown
          >,
          params.where,
        ),
      ).length,
    create: async (params: { data: Partial<MockPatient>; include?: { user?: boolean } }) => {
      if (
        [...this.patients.values()].some(
          (p) => p.clinicId === params.data.clinicId && p.userId === params.data.userId,
        )
      ) {
        uniqueError(['clinicId', 'userId']);
      }
      if (
        [...this.patients.values()].some(
          (p) =>
            p.clinicId === params.data.clinicId &&
            p.medicalRecordNumber === params.data.medicalRecordNumber,
        )
      ) {
        uniqueError(['clinicId', 'medicalRecordNumber']);
      }
      const id = params.data.id || randomUUID();
      const patient: MockPatient = {
        id,
        clinicId: params.data.clinicId!,
        userId: params.data.userId!,
        medicalRecordNumber: params.data.medicalRecordNumber || `MR-${id.slice(0, 8)}`,
        dateOfBirth: params.data.dateOfBirth || null,
        gender: params.data.gender || null,
        address: params.data.address || null,
        emergencyContactName: params.data.emergencyContactName || null,
        emergencyContactPhone: params.data.emergencyContactPhone || null,
        isActive: params.data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.patients.set(id, patient);
      return this.hydratePatient(patient, params.include);
    },
    update: async (params: {
      where: { id: string };
      data: Partial<MockPatient>;
      include?: { user?: boolean };
    }) => {
      const patient = this.patients.get(params.where.id);
      if (!patient) return null;
      const updated = applyUpdate(patient, params.data as Record<string, unknown>);
      this.patients.set(patient.id, updated);
      return this.hydratePatient(updated, params.include);
    },
  };

  appointment = {
    findFirst: async (params: {
      where: Record<string, unknown>;
      include?: Record<string, unknown>;
    }) => {
      for (const appointment of this.appointments.values()) {
        if (matchesWhere(appointment as unknown as Record<string, unknown>, params.where)) {
          return this.hydrateAppointment(appointment, params.include);
        }
      }
      return null;
    },
    findMany: async (params: {
      where?: Record<string, unknown>;
      include?: Record<string, unknown>;
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
    }) => {
      const matches = [...this.appointments.values()].filter((appointment) =>
        matchesWhere(appointment as unknown as Record<string, unknown>, params.where),
      );
      return paginate(matches, params).map((appointment) =>
        this.hydrateAppointment(appointment, params.include),
      );
    },
    count: async (params: { where?: Record<string, unknown> }) =>
      [...this.appointments.values()].filter((appointment) =>
        matchesWhere(appointment as unknown as Record<string, unknown>, params.where),
      ).length,
    create: async (params: {
      data: Partial<MockAppointment>;
      include?: Record<string, unknown>;
    }) => {
      const id = params.data.id || randomUUID();
      const appointment: MockAppointment = {
        id,
        clinicId: params.data.clinicId!,
        patientId: params.data.patientId!,
        doctorId: params.data.doctorId!,
        startsAt: params.data.startsAt!,
        endsAt: params.data.endsAt!,
        status: params.data.status || AppointmentStatus.SCHEDULED,
        reason: params.data.reason || null,
        notes: params.data.notes || null,
        checkedInAt: params.data.checkedInAt || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.appointments.set(id, appointment);
      return this.hydrateAppointment(appointment, params.include);
    },
    update: async (params: {
      where: { id: string };
      data: Partial<MockAppointment>;
      include?: Record<string, unknown>;
    }) => {
      const appointment = this.appointments.get(params.where.id);
      if (!appointment) return null;
      const updated = applyUpdate(appointment, params.data as Record<string, unknown>);
      this.appointments.set(appointment.id, updated);
      return this.hydrateAppointment(updated, params.include);
    },
  };

  queueDailyCounter = {
    upsert: async (params: {
      where: { clinicId_queueDate: { clinicId: string; queueDate: Date } };
      create: { clinicId: string; queueDate: Date; lastNumber: number };
      update: { lastNumber: { increment: number } };
    }) => {
      const { clinicId, queueDate } = params.where.clinicId_queueDate;
      const key = `${clinicId}:${queueDate.toISOString().slice(0, 10)}`;
      const current = this.queueDailyCounters.get(key);
      const counter: MockQueueDailyCounter = current
        ? {
            ...current,
            lastNumber: current.lastNumber + params.update.lastNumber.increment,
            updatedAt: new Date(),
          }
        : { ...params.create, updatedAt: new Date() };
      this.queueDailyCounters.set(key, counter);
      return counter;
    },
  };

  queueTicket = {
    findFirst: async (params: {
      where: Record<string, unknown>;
      include?: Record<string, unknown>;
    }) => {
      for (const ticket of this.queueTickets.values()) {
        if (matchesWhere(ticket as unknown as Record<string, unknown>, params.where)) {
          return this.hydrateQueueTicket(ticket, params.include);
        }
      }
      return null;
    },
    findMany: async (params: {
      where?: Record<string, unknown>;
      include?: Record<string, unknown>;
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
    }) => {
      const matches = [...this.queueTickets.values()].filter((ticket) =>
        matchesWhere(ticket as unknown as Record<string, unknown>, params.where),
      );
      return paginate(matches, params).map((ticket) =>
        this.hydrateQueueTicket(ticket, params.include),
      );
    },
    count: async (params: { where?: Record<string, unknown> }) =>
      [...this.queueTickets.values()].filter((ticket) =>
        matchesWhere(ticket as unknown as Record<string, unknown>, params.where),
      ).length,
    create: async (params: {
      data: Partial<MockQueueTicket>;
      include?: Record<string, unknown>;
    }) => {
      if (
        [...this.queueTickets.values()].some(
          (ticket) =>
            ticket.clinicId === params.data.clinicId &&
            ticket.queueDate.getTime() === params.data.queueDate?.getTime() &&
            ticket.queueNumber === params.data.queueNumber,
        ) ||
        (params.data.appointmentId &&
          [...this.queueTickets.values()].some(
            (ticket) => ticket.appointmentId === params.data.appointmentId,
          ))
      ) {
        uniqueError(['clinicId', 'queueDate', 'queueNumber']);
      }
      const id = params.data.id || randomUUID();
      const ticket: MockQueueTicket = {
        id,
        clinicId: params.data.clinicId!,
        patientId: params.data.patientId!,
        doctorId: params.data.doctorId || null,
        appointmentId: params.data.appointmentId || null,
        queueDate: params.data.queueDate!,
        queueNumber: params.data.queueNumber!,
        priority: params.data.priority || QueuePriority.NORMAL,
        status: params.data.status || QueueTicketStatus.WAITING,
        checkedInAt: params.data.checkedInAt || new Date(),
        calledAt: params.data.calledAt || null,
        consultationStartedAt: params.data.consultationStartedAt || null,
        completedAt: params.data.completedAt || null,
        skippedAt: params.data.skippedAt || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.queueTickets.set(id, ticket);
      return this.hydrateQueueTicket(ticket, params.include);
    },
    updateMany: async (params: {
      where: Record<string, unknown>;
      data: Partial<MockQueueTicket>;
    }) => {
      let count = 0;
      for (const [id, ticket] of this.queueTickets.entries()) {
        if (!matchesWhere(ticket as unknown as Record<string, unknown>, params.where)) continue;
        this.queueTickets.set(id, applyUpdate(ticket, params.data as Record<string, unknown>));
        count++;
      }
      return { count };
    },
  };

  payment = {
    create: async (params: { data: Partial<MockPayment> }) => {
      const id = params.data.id || randomUUID();
      const payment: MockPayment = {
        id,
        clinicId: params.data.clinicId!,
        patientId: params.data.patientId!,
        appointmentId: params.data.appointmentId || null,
        amount: Number(params.data.amount),
        currency: params.data.currency || 'ETB',
        method: params.data.method!,
        status: params.data.status || PaymentStatus.COMPLETED,
        note: params.data.note || null,
        createdAt: params.data.createdAt || new Date(),
        updatedAt: params.data.updatedAt || new Date(),
      };
      this.payments.set(id, payment);
      return payment;
    },
    findMany: async (params: {
      where?: Record<string, unknown>;
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
    }) => {
      const matches = [...this.payments.values()].filter((payment) =>
        matchesWhere(payment as unknown as Record<string, unknown>, params.where),
      );
      return paginate(matches, params);
    },
    count: async (params: { where?: Record<string, unknown> }) =>
      [...this.payments.values()].filter((payment) =>
        matchesWhere(payment as unknown as Record<string, unknown>, params.where),
      ).length,
  };

  notification = {
    create: async (params: { data: Partial<MockNotification> }) => {
      const id = params.data.id || randomUUID();
      const notification: MockNotification = {
        id,
        clinicId: params.data.clinicId!,
        userId: params.data.userId!,
        appointmentId: params.data.appointmentId || null,
        type: params.data.type!,
        title: params.data.title!,
        message: params.data.message!,
        readAt: params.data.readAt || null,
        createdAt: params.data.createdAt || new Date(),
      };
      this.notifications.set(id, notification);
      return notification;
    },
    findFirst: async (params: { where: Record<string, unknown> }) => {
      for (const notification of this.notifications.values()) {
        if (matchesWhere(notification as unknown as Record<string, unknown>, params.where)) {
          return notification;
        }
      }
      return null;
    },
    findMany: async (params: {
      where?: Record<string, unknown>;
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
    }) => {
      const matches = [...this.notifications.values()].filter((notification) =>
        matchesWhere(notification as unknown as Record<string, unknown>, params.where),
      );
      return paginate(matches, params);
    },
    count: async (params: { where?: Record<string, unknown> }) =>
      [...this.notifications.values()].filter((notification) =>
        matchesWhere(notification as unknown as Record<string, unknown>, params.where),
      ).length,
    updateMany: async (params: {
      where: Record<string, unknown>;
      data: Partial<MockNotification>;
    }) => {
      let count = 0;
      for (const [id, notification] of this.notifications.entries()) {
        if (!matchesWhere(notification as unknown as Record<string, unknown>, params.where)) {
          continue;
        }
        this.notifications.set(id, { ...notification, ...params.data });
        count++;
      }
      return { count };
    },
  };

  private hydrateStaff(
    staff: MockStaffMember,
    include?: { user?: boolean; clinic?: boolean; doctor?: boolean },
  ) {
    return {
      ...staff,
      ...(include?.user ? { user: this.users.get(staff.userId) } : {}),
      ...(include?.clinic ? { clinic: this.clinics.get(staff.clinicId) } : {}),
    };
  }

  private staffRecord(staff: MockStaffMember): Record<string, unknown> {
    const doctor = [...this.doctors.values()].find(
      (candidate) => candidate.staffMemberId === staff.id,
    );
    return {
      ...staff,
      user: this.users.get(staff.userId),
      clinic: this.clinics.get(staff.clinicId),
      doctor: doctor ? { ...doctor, user: this.users.get(doctor.userId) } : null,
    };
  }

  private doctorRecord(doctor: MockDoctor): Record<string, unknown> {
    const staffMember = this.staffMembers.get(doctor.staffMemberId);
    return {
      ...doctor,
      user: this.users.get(doctor.userId),
      staffMember: staffMember
        ? { ...staffMember, user: this.users.get(staffMember.userId) }
        : null,
    };
  }

  private hydrateDoctor(
    doctor: MockDoctor,
    include?: { user?: boolean; staffMember?: { include?: { user?: boolean } } | boolean },
  ) {
    const staff = this.staffMembers.get(doctor.staffMemberId);
    let staffMember: unknown = staff;
    if (include?.staffMember && staff) {
      const nested =
        typeof include.staffMember === 'object' ? include.staffMember.include : undefined;
      staffMember = this.hydrateStaff(staff, nested);
    }
    return {
      ...doctor,
      ...(include?.user ? { user: this.users.get(doctor.userId) } : {}),
      ...(include?.staffMember ? { staffMember } : {}),
    };
  }

  private hydratePatient(patient: MockPatient, include?: { user?: boolean }) {
    return {
      ...patient,
      ...(include?.user ? { user: this.users.get(patient.userId) } : {}),
    };
  }

  private hydrateAppointment(appointment: MockAppointment, include?: Record<string, unknown>) {
    const patient = this.patients.get(appointment.patientId);
    const doctor = this.doctors.get(appointment.doctorId);
    return {
      ...appointment,
      ...(include?.patient && patient
        ? { patient: this.hydratePatient(patient, { user: true }) }
        : {}),
      ...(include?.doctor && doctor ? { doctor: this.hydrateDoctor(doctor, { user: true }) } : {}),
    };
  }

  private hydrateQueueTicket(ticket: MockQueueTicket, include?: Record<string, unknown>) {
    const patient = this.patients.get(ticket.patientId);
    const doctor = ticket.doctorId ? this.doctors.get(ticket.doctorId) : null;
    return {
      ...ticket,
      ...(include?.patient && patient
        ? { patient: this.hydratePatient(patient, { user: true }) }
        : {}),
      ...(include?.doctor
        ? { doctor: doctor ? this.hydrateDoctor(doctor, { user: true }) : null }
        : {}),
    };
  }

  clear() {
    this.users.clear();
    this.otps.clear();
    this.refreshTokens.clear();
    this.clinics.clear();
    this.branches.clear();
    this.staffMembers.clear();
    this.doctors.clear();
    this.patients.clear();
    this.appointments.clear();
    this.queueTickets.clear();
    this.queueDailyCounters.clear();
    this.payments.clear();
    this.notifications.clear();
    this.auditLogs.clear();
  }
}
