import {
  AppointmentStatus,
  DoctorAvailabilityStatus,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  QueuePriority,
  QueueTicketStatus,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const timeZone = 'Africa/Addis_Ababa';

function localDateOffset(offsetDays: number): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value;
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  const date = new Date(`${today}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function atLocalTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+03:00`);
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database seeding is disabled in production');
  }
  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword || seedPassword.length < 12) {
    throw new Error('Set SEED_PASSWORD to a development password of at least 12 characters');
  }
  const passwordHash = await bcrypt.hash(seedPassword, 10);

  const clinic = await prisma.clinic.upsert({
    where: { slug: 'mediflow-addis-demo' },
    update: { name: 'MediFlow Addis Demo Clinic', isActive: true },
    create: {
      slug: 'mediflow-addis-demo',
      name: 'MediFlow Addis Demo Clinic',
      phone: '+251111000701',
      email: 'contact@mediflow-demo.local',
      address: 'Bole Road',
      city: 'Addis Ababa',
      region: 'Addis Ababa',
      licenseNumber: 'DEMO-CLINIC-001',
      description: 'Development seed clinic for ClinicFlow workflows.',
    },
  });

  const branch = await prisma.branch.upsert({
    where: { clinicId_code: { clinicId: clinic.id, code: 'BOLE-MAIN' } },
    update: { name: 'Bole Main Branch', isActive: true },
    create: {
      clinicId: clinic.id,
      name: 'Bole Main Branch',
      code: 'BOLE-MAIN',
      phone: '+251111000702',
      address: 'Bole Road, Addis Ababa',
      city: 'Addis Ababa',
    },
  });

  const seedUsers = [
    {
      phone: '+251911100701',
      email: 'admin@mediflow-demo.local',
      firstName: 'Demo',
      lastName: 'Admin',
      role: Role.ADMIN,
    },
    {
      phone: '+251911100702',
      email: 'reception@mediflow-demo.local',
      firstName: 'Sara',
      lastName: 'Reception',
      role: Role.RECEPTIONIST,
    },
    {
      phone: '+251911100703',
      email: 'doctor.abebe@mediflow-demo.local',
      firstName: 'Abebe',
      lastName: 'Bekele',
      role: Role.DOCTOR,
    },
    {
      phone: '+251911100704',
      email: 'doctor.hana@mediflow-demo.local',
      firstName: 'Hana',
      lastName: 'Tadesse',
      role: Role.DOCTOR,
    },
    {
      phone: '+251911100705',
      email: 'patient.ayalew@mediflow-demo.local',
      firstName: 'Ayalew',
      lastName: 'Kebede',
      role: Role.PATIENT,
    },
    {
      phone: '+251911100706',
      email: 'patient.mekdes@mediflow-demo.local',
      firstName: 'Mekdes',
      lastName: 'Tesfaye',
      role: Role.PATIENT,
    },
    {
      phone: '+251911100707',
      email: 'patient.dawit@mediflow-demo.local',
      firstName: 'Dawit',
      lastName: 'Worku',
      role: Role.PATIENT,
    },
  ] as const;

  const users = new Map<string, { id: string }>();
  for (const user of seedUsers) {
    const saved = await prisma.user.upsert({
      where: { phone: user.phone },
      update: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        passwordHash,
        isActive: true,
      },
      create: { ...user, passwordHash, isActive: true },
      select: { id: true },
    });
    users.set(user.phone, saved);
  }

  const clinicStaff = await Promise.all(
    seedUsers.slice(0, 4).map((user) =>
      prisma.staffMember.upsert({
        where: { clinicId_userId: { clinicId: clinic.id, userId: users.get(user.phone)!.id } },
        update: { branchId: branch.id, isActive: true },
        create: {
          clinicId: clinic.id,
          userId: users.get(user.phone)!.id,
          branchId: branch.id,
          jobTitle:
            user.role === Role.ADMIN
              ? 'Clinic Administrator'
              : user.role === Role.RECEPTIONIST
                ? 'Receptionist'
                : 'Physician',
          employeeCode: `DEMO-${user.phone.slice(-3)}`,
        },
      }),
    ),
  );

  const doctorSpecs = [
    { phone: '+251911100703', specialization: 'Internal Medicine', licenseNumber: 'DEMO-DOC-701' },
    { phone: '+251911100704', specialization: 'Pediatrics', licenseNumber: 'DEMO-DOC-702' },
  ];
  const doctors = new Map<string, { id: string; userId: string }>();
  for (const [index, doctorSeed] of doctorSpecs.entries()) {
    const staffMember = clinicStaff[index + 2];
    const doctor = await prisma.doctor.upsert({
      where: { staffMemberId: staffMember.id },
      update: {
        specialization: doctorSeed.specialization,
        licenseNumber: doctorSeed.licenseNumber,
        isActive: true,
      },
      create: {
        clinicId: clinic.id,
        staffMemberId: staffMember.id,
        userId: users.get(doctorSeed.phone)!.id,
        specialization: doctorSeed.specialization,
        licenseNumber: doctorSeed.licenseNumber,
        availabilityStatus: DoctorAvailabilityStatus.AVAILABLE,
      },
    });
    doctors.set(doctorSeed.phone, doctor);
  }

  const patientSeeds = [
    { phone: '+251911100705', medicalRecordNumber: 'DEMO-MRN-701', gender: 'male' },
    { phone: '+251911100706', medicalRecordNumber: 'DEMO-MRN-702', gender: 'female' },
    { phone: '+251911100707', medicalRecordNumber: 'DEMO-MRN-703', gender: 'male' },
  ];
  const patients = new Map<string, { id: string }>();
  for (const [index, patientSeed] of patientSeeds.entries()) {
    const user = users.get(patientSeed.phone)!;
    const patient = await prisma.patient.upsert({
      where: { clinicId_userId: { clinicId: clinic.id, userId: user.id } },
      update: { medicalRecordNumber: patientSeed.medicalRecordNumber, isActive: true },
      create: {
        clinicId: clinic.id,
        userId: user.id,
        medicalRecordNumber: patientSeed.medicalRecordNumber,
        dateOfBirth: new Date(Date.UTC(1985 + index * 8, 2 + index, 12)),
        gender: patientSeed.gender,
        address: `${['Bole', 'Yeka', 'Kirkos'][index]}, Addis Ababa`,
        emergencyContactName: `Emergency Contact ${index + 1}`,
        emergencyContactPhone: `+25191110071${index}`,
      },
    });
    patients.set(patientSeed.phone, patient);
  }

  const today = localDateOffset(0);
  const yesterday = localDateOffset(-1);
  const tomorrow = localDateOffset(1);
  const appointmentSeeds = [
    {
      id: '00000000-0000-4000-8000-000000007001',
      patientPhone: '+251911100705',
      doctorPhone: '+251911100703',
      startsAt: atLocalTime(today, '08:30'),
      endsAt: atLocalTime(today, '09:00'),
      status: AppointmentStatus.COMPLETED,
      reason: 'Follow-up consultation',
    },
    {
      id: '00000000-0000-4000-8000-000000007002',
      patientPhone: '+251911100706',
      doctorPhone: '+251911100704',
      startsAt: atLocalTime(today, '10:00'),
      endsAt: atLocalTime(today, '10:30'),
      status: AppointmentStatus.CONFIRMED,
      reason: 'Pediatric wellness visit',
    },
    {
      id: '00000000-0000-4000-8000-000000007003',
      patientPhone: '+251911100707',
      doctorPhone: '+251911100703',
      startsAt: atLocalTime(yesterday, '11:00'),
      endsAt: atLocalTime(yesterday, '11:30'),
      status: AppointmentStatus.NO_SHOW,
      reason: 'General consultation',
    },
    {
      id: '00000000-0000-4000-8000-000000007004',
      patientPhone: '+251911100707',
      doctorPhone: '+251911100704',
      startsAt: atLocalTime(tomorrow, '13:00'),
      endsAt: atLocalTime(tomorrow, '13:30'),
      status: AppointmentStatus.SCHEDULED,
      reason: 'Routine check-up',
    },
  ];
  const appointments = new Map<string, { id: string }>();
  for (const appointmentSeed of appointmentSeeds) {
    const appointment = await prisma.appointment.upsert({
      where: { id: appointmentSeed.id },
      update: {
        clinicId: clinic.id,
        patientId: patients.get(appointmentSeed.patientPhone)!.id,
        doctorId: doctors.get(appointmentSeed.doctorPhone)!.id,
        startsAt: appointmentSeed.startsAt,
        endsAt: appointmentSeed.endsAt,
        status: appointmentSeed.status,
        reason: appointmentSeed.reason,
      },
      create: {
        id: appointmentSeed.id,
        clinicId: clinic.id,
        patientId: patients.get(appointmentSeed.patientPhone)!.id,
        doctorId: doctors.get(appointmentSeed.doctorPhone)!.id,
        startsAt: appointmentSeed.startsAt,
        endsAt: appointmentSeed.endsAt,
        status: appointmentSeed.status,
        reason: appointmentSeed.reason,
      },
      select: { id: true },
    });
    appointments.set(appointmentSeed.id, appointment);
  }

  const queueDate = new Date(`${today}T00:00:00.000Z`);
  const queueSeeds = [
    {
      id: '00000000-0000-4000-8000-000000007101',
      patientPhone: '+251911100705',
      doctorPhone: '+251911100703',
      appointmentId: appointmentSeeds[0].id,
      queueNumber: 1,
      priority: QueuePriority.NORMAL,
      status: QueueTicketStatus.COMPLETED,
      checkedInAt: atLocalTime(today, '08:00'),
      calledAt: atLocalTime(today, '08:10'),
      consultationStartedAt: atLocalTime(today, '08:15'),
      completedAt: atLocalTime(today, '08:45'),
    },
    {
      id: '00000000-0000-4000-8000-000000007102',
      patientPhone: '+251911100706',
      doctorPhone: '+251911100704',
      appointmentId: appointmentSeeds[1].id,
      queueNumber: 2,
      priority: QueuePriority.URGENT,
      status: QueueTicketStatus.CALLED,
      checkedInAt: atLocalTime(today, '09:00'),
      calledAt: atLocalTime(today, '09:20'),
      consultationStartedAt: null,
      completedAt: null,
    },
    {
      id: '00000000-0000-4000-8000-000000007103',
      patientPhone: '+251911100707',
      doctorPhone: '+251911100703',
      appointmentId: null,
      queueNumber: 3,
      priority: QueuePriority.NORMAL,
      status: QueueTicketStatus.WAITING,
      checkedInAt: atLocalTime(today, '09:30'),
      calledAt: null,
      consultationStartedAt: null,
      completedAt: null,
    },
  ];
  for (const queueSeed of queueSeeds) {
    await prisma.queueTicket.upsert({
      where: { id: queueSeed.id },
      update: {
        clinicId: clinic.id,
        patientId: patients.get(queueSeed.patientPhone)!.id,
        doctorId: doctors.get(queueSeed.doctorPhone)!.id,
        appointmentId: queueSeed.appointmentId,
        queueNumber: queueSeed.queueNumber,
        priority: queueSeed.priority,
        status: queueSeed.status,
        checkedInAt: queueSeed.checkedInAt,
        calledAt: queueSeed.calledAt,
        consultationStartedAt: queueSeed.consultationStartedAt,
        completedAt: queueSeed.completedAt,
        queueDate,
      },
      create: {
        id: queueSeed.id,
        clinicId: clinic.id,
        patientId: patients.get(queueSeed.patientPhone)!.id,
        doctorId: doctors.get(queueSeed.doctorPhone)!.id,
        appointmentId: queueSeed.appointmentId,
        queueNumber: queueSeed.queueNumber,
        priority: queueSeed.priority,
        status: queueSeed.status,
        checkedInAt: queueSeed.checkedInAt,
        calledAt: queueSeed.calledAt,
        consultationStartedAt: queueSeed.consultationStartedAt,
        completedAt: queueSeed.completedAt,
        queueDate,
      },
    });
  }
  await prisma.queueDailyCounter.upsert({
    where: { clinicId_queueDate: { clinicId: clinic.id, queueDate } },
    update: { lastNumber: { increment: 0 } },
    create: { clinicId: clinic.id, queueDate, lastNumber: queueSeeds.length },
  });

  await prisma.payment.upsert({
    where: { id: '00000000-0000-4000-8000-000000007201' },
    update: {
      clinicId: clinic.id,
      patientId: patients.get('+251911100705')!.id,
      appointmentId: appointmentSeeds[0].id,
      amount: 850,
      currency: 'ETB',
      method: PaymentMethod.CASH,
      status: PaymentStatus.COMPLETED,
      note: 'Seed consultation payment record',
    },
    create: {
      id: '00000000-0000-4000-8000-000000007201',
      clinicId: clinic.id,
      patientId: patients.get('+251911100705')!.id,
      appointmentId: appointmentSeeds[0].id,
      amount: 850,
      currency: 'ETB',
      method: PaymentMethod.CASH,
      status: PaymentStatus.COMPLETED,
      note: 'Seed consultation payment record',
    },
  });

  await prisma.notification.upsert({
    where: { id: '00000000-0000-4000-8000-000000007301' },
    update: {
      clinicId: clinic.id,
      userId: users.get('+251911100705')!.id,
      appointmentId: appointmentSeeds[0].id,
      type: NotificationType.APPOINTMENT_REMINDER,
      title: 'Upcoming appointment',
      message: 'Your follow-up appointment is scheduled at MediFlow Addis Demo Clinic.',
      readAt: null,
    },
    create: {
      id: '00000000-0000-4000-8000-000000007301',
      clinicId: clinic.id,
      userId: users.get('+251911100705')!.id,
      appointmentId: appointmentSeeds[0].id,
      type: NotificationType.APPOINTMENT_REMINDER,
      title: 'Upcoming appointment',
      message: 'Your follow-up appointment is scheduled at MediFlow Addis Demo Clinic.',
    },
  });

  console.log(
    `Seeded ${clinic.name} with ${seedUsers.length} users, ${appointmentSeeds.length} appointments, and ${queueSeeds.length} queue tickets.`,
  );
  console.log('Development accounts use the configured SEED_PASSWORD.');
}

main()
  .catch((error: unknown) => {
    console.error('Database seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
