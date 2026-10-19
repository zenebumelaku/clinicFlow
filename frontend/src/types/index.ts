export type Role = 'admin' | 'receptionist' | 'doctor' | 'patient';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type QueueStatus = 'waiting' | 'called' | 'in_consultation' | 'completed' | 'skipped';

export type PriorityLevel = 'normal' | 'urgent' | 'follow_up' | 'elderly_child';

export type DoctorAvailability = 'available' | 'busy' | 'off_duty';

export type PaymentMethod = 'chapa' | 'telebirr' | 'cash' | 'mpesa' | 'cbe_birr' | 'bank_transfer' | 'card';

export type PaymentStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded';

export interface Doctor {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  department: string;
  roomNumber: string;
  availability: DoctorAvailability;
  avatarUrl?: string;
  consultationFeeETB: number;
  todayAppointmentsCount: number;
  averageConsultationMinutes: number;
  workingHours: {
    start: string;
    end: string;
  };
}

export interface Patient {
  id: string;
  userId?: string;
  mrn: string; // Medical Record Number e.g. ET-2026-0842
  name: string;
  phone: string;
  email?: string;
  gender: 'male' | 'female';
  age: number;
  bloodType?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation?: string;
  };
  registeredDate: string;
  lastVisitDate?: string;
  totalVisits?: number;
  allergies?: string[];
  notes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  status: AppointmentStatus;
  type: 'general_consultation' | 'follow_up' | 'specialist_review' | 'preventive_check';
  reason: string;
  notes?: string;
  createdAt: string;
}

export interface QueueItem {
  id: string;
  ticketNumber: string; // e.g., #A104
  appointmentId?: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  department: string;
  checkInTime: string; // ISO
  calledTime?: string;
  startTime?: string;
  completedTime?: string;
  status: QueueStatus;
  priority: PriorityLevel;
  estimatedWaitMinutes: number;
  position: number;
  roomNumber: string;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string; // e.g. REC-2026-904
  patientId: string;
  patientName: string;
  patientPhone: string;
  appointmentId?: string;
  amountETB: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string; // e.g. Chapa Txn Ref
  status: PaymentStatus;
  date: string;
  description: string;
  cashierName: string;
}

export interface ClinicNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'queue' | 'appointment' | 'delay' | 'payment' | 'system';
  targetRole?: Role;
  patientId?: string;
  doctorId?: string;
}

export interface ClinicStaff {
  id: string;
  name: string;
  role: Role;
  email: string;
  phone: string;
  department: string;
  active: boolean;
}

export interface ClinicStats {
  appointmentsToday: number;
  appointmentsDiffPercent: number;
  patientsWaiting: number;
  urgentWaiting: number;
  completedVisits: number;
  completedPercent: number;
  todayRevenueETB: number;
  revenueDiffPercent: number;
  averageWaitMinutes: number;
  digitalPaymentSharePercent: number;
}
