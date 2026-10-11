import {
  Doctor,
  Patient,
  Appointment,
  QueueItem,
  PaymentRecord,
  ClinicNotification,
  ClinicStaff,
  ClinicStats
} from '../types';

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Hana Tesfaye',
    email: 'hana.tesfaye@mediflowet.com',
    phone: '+251911234567',
    specialization: 'Internal Medicine',
    department: 'Adult Care & Chronic Diseases',
    roomNumber: 'Room 102',
    availability: 'available',
    avatarUrl: '/src/assets/images/doctor_hana_avatar_1791475818100.jpg',
    consultationFeeETB: 800,
    todayAppointmentsCount: 14,
    averageConsultationMinutes: 18,
    workingHours: {
      start: '08:30',
      end: '17:00'
    }
  },
  {
    id: 'doc-2',
    name: 'Dr. Dawit Alemu',
    email: 'dawit.alemu@mediflowet.com',
    phone: '+251911876543',
    specialization: 'Senior Physician & Pediatrics',
    department: 'Pediatrics & Family Medicine',
    roomNumber: 'Room 104',
    availability: 'busy',
    avatarUrl: '/src/assets/images/doctor_dawit_avatar_1791475828562.jpg',
    consultationFeeETB: 950,
    todayAppointmentsCount: 11,
    averageConsultationMinutes: 22,
    workingHours: {
      start: '09:00',
      end: '17:30'
    }
  },
  {
    id: 'doc-3',
    name: 'Dr. Samuel Girma',
    email: 'samuel.girma@mediflowet.com',
    phone: '+251922334455',
    specialization: 'General Practice & Urgent Care',
    department: 'Outpatient Clinic',
    roomNumber: 'Room 101',
    availability: 'available',
    avatarUrl: '/src/assets/images/doctor_samuel_avatar_1791477120159.jpg',
    consultationFeeETB: 600,
    todayAppointmentsCount: 9,
    averageConsultationMinutes: 15,
    workingHours: {
      start: '08:00',
      end: '16:00'
    }
  },
  {
    id: 'doc-4',
    name: 'Dr. Rahel Tadesse',
    email: 'rahel.tadesse@mediflowet.com',
    phone: '+251933556677',
    specialization: 'Gynecology & Women’s Health',
    department: 'Women’s Outpatient Suite',
    roomNumber: 'Room 105',
    availability: 'available',
    avatarUrl: '/src/assets/images/doctor_rahel_avatar_1791477130880.jpg',
    consultationFeeETB: 1100,
    todayAppointmentsCount: 8,
    averageConsultationMinutes: 25,
    workingHours: {
      start: '10:00',
      end: '18:00'
    }
  },
  {
    id: 'doc-5',
    name: 'Dr. Yonas Bekele',
    email: 'yonas.bekele@mediflowet.com',
    phone: '+251944778899',
    specialization: 'Dermatology & Skin Clinic',
    department: 'Specialist Clinic',
    roomNumber: 'Room 106',
    availability: 'off_duty',
    consultationFeeETB: 850,
    todayAppointmentsCount: 0,
    averageConsultationMinutes: 20,
    workingHours: {
      start: '08:30',
      end: '13:00'
    }
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    mrn: 'ET-2026-0104',
    name: 'Abebe Kebede',
    phone: '+251911456789',
    email: 'abebe.kebede@gmail.com',
    gender: 'male',
    age: 48,
    bloodType: 'O+',
    emergencyContact: {
      name: 'Tigist Kebede',
      phone: '+251911998877',
      relation: 'Spouse'
    },
    registeredDate: '2024-03-12',
    lastVisitDate: '2026-09-18',
    totalVisits: 6,
    allergies: ['Penicillin'],
    notes: 'Hypertension monitoring; patient prefers morning appointments.'
  },
  {
    id: 'pat-2',
    mrn: 'ET-2026-0182',
    name: 'Meron Bekele',
    phone: '+251922883344',
    email: 'meron.bekele@outlook.com',
    gender: 'female',
    age: 32,
    bloodType: 'A+',
    emergencyContact: {
      name: 'Bekele Desta',
      phone: '+251922776655',
      relation: 'Father'
    },
    registeredDate: '2025-01-20',
    lastVisitDate: '2026-08-30',
    totalVisits: 3,
    allergies: [],
    notes: 'Routine health screening and blood profile.'
  },
  {
    id: 'pat-3',
    mrn: 'ET-2026-0205',
    name: 'Dawit Alemu Jr.',
    phone: '+251933112233',
    gender: 'male',
    age: 7,
    bloodType: 'B+',
    emergencyContact: {
      name: 'Almaz Alemu',
      phone: '+251933112233',
      relation: 'Mother'
    },
    registeredDate: '2025-08-14',
    lastVisitDate: '2026-09-02',
    totalVisits: 4,
    allergies: ['Peanuts'],
    notes: 'Seasonal asthma assessment; check inhaler response.'
  },
  {
    id: 'pat-4',
    mrn: 'ET-2026-0311',
    name: 'Almaz Worku',
    phone: '+251911667788',
    gender: 'female',
    age: 64,
    bloodType: 'AB+',
    emergencyContact: {
      name: 'Ephrem Worku',
      phone: '+251911554433',
      relation: 'Son'
    },
    registeredDate: '2023-11-04',
    lastVisitDate: '2026-07-22',
    totalVisits: 9,
    allergies: ['Sulfa drugs'],
    notes: 'Type 2 Diabetes review and quarterly HbA1c test.'
  },
  {
    id: 'pat-5',
    mrn: 'ET-2026-0420',
    name: 'Yared Mengistu',
    phone: '+251944556677',
    gender: 'male',
    age: 29,
    bloodType: 'O-',
    emergencyContact: {
      name: 'Sara Mengistu',
      phone: '+251944112233',
      relation: 'Sister'
    },
    registeredDate: '2026-02-10',
    lastVisitDate: '2026-08-15',
    totalVisits: 2,
    allergies: [],
    notes: 'Post-sports knee strain follow-up.'
  },
  {
    id: 'pat-6',
    mrn: 'ET-2026-0518',
    name: 'Tigist Assefa',
    phone: '+251911332211',
    gender: 'female',
    age: 27,
    bloodType: 'A-',
    emergencyContact: {
      name: 'Marta Assefa',
      phone: '+251911009988',
      relation: 'Mother'
    },
    registeredDate: '2026-05-19',
    lastVisitDate: '2026-09-12',
    totalVisits: 1,
    notes: 'General wellness check.'
  },
  {
    id: 'pat-7',
    mrn: 'ET-2026-0612',
    name: 'Solomon Desta',
    phone: '+251922445566',
    gender: 'male',
    age: 53,
    bloodType: 'O+',
    emergencyContact: {
      name: 'Helen Desta',
      phone: '+251922118899',
      relation: 'Daughter'
    },
    registeredDate: '2024-09-05',
    lastVisitDate: '2026-06-18',
    totalVisits: 5,
    notes: 'Cardiovascular checkup and lipid panel discussion.'
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-101',
    patientId: 'pat-1',
    patientName: 'Abebe Kebede',
    patientPhone: '+251911456789',
    doctorId: 'doc-1',
    doctorName: 'Dr. Hana Tesfaye',
    department: 'Adult Care & Chronic Diseases',
    date: '2026-10-08',
    time: '09:00',
    durationMinutes: 20,
    status: 'in_consultation',
    type: 'follow_up',
    reason: 'Hypertension 3-month review and medication check',
    createdAt: '2026-10-02T10:15:00Z'
  },
  {
    id: 'apt-102',
    patientId: 'pat-2',
    patientName: 'Meron Bekele',
    patientPhone: '+251922883344',
    doctorId: 'doc-1',
    doctorName: 'Dr. Hana Tesfaye',
    department: 'Adult Care & Chronic Diseases',
    date: '2026-10-08',
    time: '09:30',
    durationMinutes: 20,
    status: 'checked_in',
    type: 'general_consultation',
    reason: 'Persistent migraine and sleep disturbance',
    createdAt: '2026-10-05T14:20:00Z'
  },
  {
    id: 'apt-103',
    patientId: 'pat-3',
    patientName: 'Dawit Alemu Jr.',
    patientPhone: '+251933112233',
    doctorId: 'doc-2',
    doctorName: 'Dr. Dawit Alemu',
    department: 'Pediatrics & Family Medicine',
    date: '2026-10-08',
    time: '09:45',
    durationMinutes: 30,
    status: 'checked_in',
    type: 'specialist_review',
    reason: 'Pediatric cough evaluation and allergy panel review',
    createdAt: '2026-10-04T09:00:00Z'
  },
  {
    id: 'apt-104',
    patientId: 'pat-4',
    patientName: 'Almaz Worku',
    patientPhone: '+251911667788',
    doctorId: 'doc-1',
    doctorName: 'Dr. Hana Tesfaye',
    department: 'Adult Care & Chronic Diseases',
    date: '2026-10-08',
    time: '10:15',
    durationMinutes: 25,
    status: 'confirmed',
    type: 'follow_up',
    reason: 'Diabetic foot exam and blood glucose review',
    createdAt: '2026-10-06T11:45:00Z'
  },
  {
    id: 'apt-105',
    patientId: 'pat-5',
    patientName: 'Yared Mengistu',
    patientPhone: '+251944556677',
    doctorId: 'doc-3',
    doctorName: 'Dr. Samuel Girma',
    department: 'Outpatient Clinic',
    date: '2026-10-08',
    time: '10:45',
    durationMinutes: 20,
    status: 'scheduled',
    type: 'general_consultation',
    reason: 'Right ankle discomfort after physical exercise',
    createdAt: '2026-10-07T16:10:00Z'
  },
  {
    id: 'apt-106',
    patientId: 'pat-6',
    patientName: 'Tigist Assefa',
    patientPhone: '+251911332211',
    doctorId: 'doc-4',
    doctorName: 'Dr. Rahel Tadesse',
    department: 'Women’s Outpatient Suite',
    date: '2026-10-08',
    time: '11:15',
    durationMinutes: 30,
    status: 'confirmed',
    type: 'preventive_check',
    reason: 'Annual reproductive wellness check',
    createdAt: '2026-10-06T08:30:00Z'
  },
  {
    id: 'apt-107',
    patientId: 'pat-7',
    patientName: 'Solomon Desta',
    patientPhone: '+251922445566',
    doctorId: 'doc-2',
    doctorName: 'Dr. Dawit Alemu',
    department: 'Pediatrics & Family Medicine',
    date: '2026-10-08',
    time: '08:30',
    durationMinutes: 20,
    status: 'completed',
    type: 'general_consultation',
    reason: 'Routine health certificate review',
    createdAt: '2026-10-03T15:00:00Z'
  }
];

export const INITIAL_QUEUE: QueueItem[] = [
  {
    id: 'q-101',
    ticketNumber: '#A101',
    appointmentId: 'apt-101',
    patientId: 'pat-1',
    patientName: 'Abebe Kebede',
    patientPhone: '+251911456789',
    doctorId: 'doc-1',
    doctorName: 'Dr. Hana Tesfaye',
    department: 'Adult Care',
    checkInTime: '2026-10-08T08:48:00Z',
    startTime: '2026-10-08T09:05:00Z',
    status: 'in_consultation',
    priority: 'normal',
    estimatedWaitMinutes: 0,
    position: 0,
    roomNumber: 'Room 102'
  },
  {
    id: 'q-102',
    ticketNumber: '#A102',
    appointmentId: 'apt-102',
    patientId: 'pat-2',
    patientName: 'Meron Bekele',
    patientPhone: '+251922883344',
    doctorId: 'doc-1',
    doctorName: 'Dr. Hana Tesfaye',
    department: 'Adult Care',
    checkInTime: '2026-10-08T09:12:00Z',
    calledTime: '2026-10-08T09:22:00Z',
    status: 'called',
    priority: 'normal',
    estimatedWaitMinutes: 3,
    position: 1,
    roomNumber: 'Room 102'
  },
  {
    id: 'q-103',
    ticketNumber: '#P201',
    appointmentId: 'apt-103',
    patientId: 'pat-3',
    patientName: 'Dawit Alemu Jr.',
    patientPhone: '+251933112233',
    doctorId: 'doc-2',
    doctorName: 'Dr. Dawit Alemu',
    department: 'Pediatrics',
    checkInTime: '2026-10-08T09:18:00Z',
    status: 'waiting',
    priority: 'elderly_child',
    estimatedWaitMinutes: 12,
    position: 2,
    roomNumber: 'Room 104'
  },
  {
    id: 'q-104',
    ticketNumber: '#A103',
    patientId: 'pat-4',
    patientName: 'Almaz Worku',
    patientPhone: '+251911667788',
    doctorId: 'doc-1',
    doctorName: 'Dr. Hana Tesfaye',
    department: 'Adult Care',
    checkInTime: '2026-10-08T09:25:00Z',
    status: 'waiting',
    priority: 'urgent',
    estimatedWaitMinutes: 20,
    position: 3,
    roomNumber: 'Room 102'
  },
  {
    id: 'q-105',
    ticketNumber: '#G301',
    patientId: 'pat-5',
    patientName: 'Yared Mengistu',
    patientPhone: '+251944556677',
    doctorId: 'doc-3',
    doctorName: 'Dr. Samuel Girma',
    department: 'Outpatient Clinic',
    checkInTime: '2026-10-08T09:30:00Z',
    status: 'waiting',
    priority: 'normal',
    estimatedWaitMinutes: 28,
    position: 4,
    roomNumber: 'Room 101'
  },
  {
    id: 'q-100',
    ticketNumber: '#P200',
    appointmentId: 'apt-107',
    patientId: 'pat-7',
    patientName: 'Solomon Desta',
    patientPhone: '+251922445566',
    doctorId: 'doc-2',
    doctorName: 'Dr. Dawit Alemu',
    department: 'Pediatrics',
    checkInTime: '2026-10-08T08:15:00Z',
    startTime: '2026-10-08T08:32:00Z',
    completedTime: '2026-10-08T08:52:00Z',
    status: 'completed',
    priority: 'normal',
    estimatedWaitMinutes: 0,
    position: 0,
    roomNumber: 'Room 104'
  }
];

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-501',
    receiptNumber: 'REC-2026-0481',
    patientId: 'pat-7',
    patientName: 'Solomon Desta',
    patientPhone: '+251922445566',
    appointmentId: 'apt-107',
    amountETB: 950,
    paymentMethod: 'telebirr',
    referenceNumber: 'TB-892401824',
    status: 'confirmed',
    date: '2026-10-08T08:55:00Z',
    description: 'Pediatrics & Family consultation fee',
    cashierName: 'Rahel (Front Desk)'
  },
  {
    id: 'pay-502',
    receiptNumber: 'REC-2026-0482',
    patientId: 'pat-1',
    patientName: 'Abebe Kebede',
    patientPhone: '+251911456789',
    appointmentId: 'apt-101',
    amountETB: 800,
    paymentMethod: 'cash',
    referenceNumber: 'CSH-00391',
    status: 'confirmed',
    date: '2026-10-08T08:50:00Z',
    description: 'Internal Medicine routine consultation',
    cashierName: 'Rahel (Front Desk)'
  },
  {
    id: 'pay-503',
    receiptNumber: 'REC-2026-0483',
    patientId: 'pat-2',
    patientName: 'Meron Bekele',
    patientPhone: '+251922883344',
    appointmentId: 'apt-102',
    amountETB: 800,
    paymentMethod: 'cbe_birr',
    referenceNumber: 'CBE-9912048',
    status: 'confirmed',
    date: '2026-10-08T09:14:00Z',
    description: 'Outpatient consultation fee',
    cashierName: 'Rahel (Front Desk)'
  },
  {
    id: 'pay-504',
    receiptNumber: 'REC-2026-0484',
    patientId: 'pat-3',
    patientName: 'Dawit Alemu Jr.',
    patientPhone: '+251933112233',
    appointmentId: 'apt-103',
    amountETB: 950,
    paymentMethod: 'mpesa',
    referenceNumber: 'MP-6629141',
    status: 'confirmed',
    date: '2026-10-08T09:20:00Z',
    description: 'Specialist consultation fee',
    cashierName: 'Rahel (Front Desk)'
  },
  {
    id: 'pay-505',
    receiptNumber: 'REC-2026-0485',
    patientId: 'pat-4',
    patientName: 'Almaz Worku',
    patientPhone: '+251911667788',
    amountETB: 800,
    paymentMethod: 'telebirr',
    referenceNumber: 'TB-991048291',
    status: 'pending',
    date: '2026-10-08T09:28:00Z',
    description: 'Consultation & Diabetic blood test panel',
    cashierName: 'Rahel (Front Desk)'
  }
];

export const INITIAL_NOTIFICATIONS: ClinicNotification[] = [
  {
    id: 'notif-1',
    title: 'Patient Checked In',
    message: 'Almaz Worku checked in for Internal Medicine. Assigned ticket #A103 (Urgent priority).',
    timestamp: '2026-10-08T09:25:00Z',
    read: false,
    type: 'queue'
  },
  {
    id: 'notif-2',
    title: 'Schedule Notice',
    message: 'Dr. Hana Tesfaye is currently in Room 102 with patient Abebe Kebede.',
    timestamp: '2026-10-08T09:06:00Z',
    read: false,
    type: 'appointment'
  },
  {
    id: 'notif-3',
    title: 'Digital Payment Confirmed',
    message: 'Telebirr payment of 950 ETB received from Solomon Desta (Ref: TB-892401824).',
    timestamp: '2026-10-08T08:56:00Z',
    read: true,
    type: 'payment'
  },
  {
    id: 'notif-4',
    title: 'Clinic Notice',
    message: 'Dr. Yonas Bekele (Dermatology) is off-duty today until 2:00 PM for academic symposium.',
    timestamp: '2026-10-08T08:00:00Z',
    read: true,
    type: 'delay'
  }
];

export const INITIAL_STAFF: ClinicStaff[] = [
  {
    id: 'st-1',
    name: 'Mekdes Tadesse',
    role: 'admin',
    email: 'mekdes.tadesse@mediflowet.com',
    phone: '+251911112233',
    department: 'Clinic Operations',
    active: true
  },
  {
    id: 'st-2',
    name: 'Rahel Desta',
    role: 'receptionist',
    email: 'rahel.desta@mediflowet.com',
    phone: '+251922334411',
    department: 'Front Desk & Patient Services',
    active: true
  },
  {
    id: 'st-3',
    name: 'Dr. Hana Tesfaye',
    role: 'doctor',
    email: 'hana.tesfaye@mediflowet.com',
    phone: '+251911234567',
    department: 'Adult Care & Chronic Diseases',
    active: true
  },
  {
    id: 'st-4',
    name: 'Dr. Dawit Alemu',
    role: 'doctor',
    email: 'dawit.alemu@mediflowet.com',
    phone: '+251911876543',
    department: 'Pediatrics & Family Medicine',
    active: true
  }
];

export const INITIAL_STATS: ClinicStats = {
  appointmentsToday: 32,
  appointmentsDiffPercent: 12.5,
  patientsWaiting: 4,
  urgentWaiting: 1,
  completedVisits: 21,
  completedPercent: 66,
  todayRevenueETB: 18450,
  revenueDiffPercent: 8.4,
  averageWaitMinutes: 14,
  digitalPaymentSharePercent: 78
};

export const CLINIC_PROFILE = {
  name: 'Bole Medhanealem Specialty Clinic',
  branch: 'Addis Ababa Central Branch',
  tagline: 'Smarter clinic operations. Better patient experiences.',
  tinNumber: '0039482910',
  licenseNumber: 'MOH-ET-2022-9024',
  phone: '+251 11 662 4890',
  mobile: '+251 911 200 300',
  email: 'info@boleclinic.et',
  address: 'Namibia St, Next to Edna Mall Complex, Bole Sub-City, Addis Ababa, Ethiopia',
  openingHours: 'Mon - Sat: 8:00 AM - 8:00 PM | Sun: 9:00 AM - 2:00 PM',
  acceptedPayments: ['Telebirr', 'CBE Birr', 'M-Pesa', 'Cash', 'Commercial Bank Transfers']
};
