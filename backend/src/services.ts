import { PrismaService } from './prisma/prisma.service';
import { ConfigService } from './common/config/config.service';
import { AuditService } from './audit/audit.service';
import { JwtService } from './auth/jwt.service';
import { TokenService } from './auth/token.service';
import { AuthService } from './auth/auth.service';
import { BranchesService } from './branches/branches.service';
import { StaffService } from './staff/staff.service';
import { DoctorsService } from './doctors/doctors.service';
import { ClinicsService } from './clinics/clinics.service';
import { PatientsService } from './patients/patients.service';
import { AppointmentsService } from './appointments/appointments.service';
import { QueueService } from './queue/queue.service';
import { PaymentsService } from './payments/payments.service';
import { ChapaService } from './payments/chapa.service';
import { NotificationsService } from './notifications/notifications.service';
import { ReportsService } from './reports/reports.service';

export interface AppServices {
  prisma: PrismaService;
  config: ConfigService;
  audit: AuditService;
  jwt: JwtService;
  token: TokenService;
  auth: AuthService;
  branches: BranchesService;
  staff: StaffService;
  doctors: DoctorsService;
  clinics: ClinicsService;
  patients: PatientsService;
  appointments: AppointmentsService;
  queue: QueueService;
  payments: PaymentsService;
  chapa: ChapaService;
  notifications: NotificationsService;
  reports: ReportsService;
}

export function createServices(overrides?: {
  prisma?: PrismaService;
  config?: ConfigService;
}): AppServices {
  const prisma = overrides?.prisma || new PrismaService();
  const config = overrides?.config || new ConfigService();

  const audit = new AuditService(prisma);
  const jwt = new JwtService({ secret: config.get<string>('jwt.secret') });
  const token = new TokenService(jwt, prisma, config);

  const auth = new AuthService(prisma, token, audit);

  const branches = new BranchesService(prisma);
  const staff = new StaffService(prisma, branches);
  const doctors = new DoctorsService(prisma, branches, staff);
  const clinics = new ClinicsService(prisma);
  const patients = new PatientsService(prisma);
  const appointments = new AppointmentsService(prisma);
  const queue = new QueueService(prisma);
  const chapa = new ChapaService(config);
  const payments = new PaymentsService(prisma, chapa);
  const notifications = new NotificationsService(prisma);
  const reports = new ReportsService(prisma);

  return {
    prisma,
    config,
    audit,
    jwt,
    token,
    auth,
    branches,
    staff,
    doctors,
    clinics,
    patients,
    appointments,
    queue,
    payments,
    chapa,
    notifications,
    reports,
  };
}
