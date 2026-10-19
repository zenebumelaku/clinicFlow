import {
  Appointment,
  AppointmentStatus,
  ClinicNotification,
  ClinicStats,
  Doctor,
  DoctorAvailability,
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
  Patient,
  PriorityLevel,
  QueueItem,
  QueueStatus,
  Role,
} from "../../types";
import {
  apiPaginated,
  apiPath,
  apiRequest,
  ApiError,
  PaginatedData,
} from "./apiClient";
import { clinicDateInputValue, clinicTimeValue } from "../utils";
import {
  INITIAL_PATIENTS,
  INITIAL_DOCTORS,
  INITIAL_APPOINTMENTS,
  INITIAL_QUEUE,
  INITIAL_PAYMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_STAFF,
  INITIAL_STATS,
} from "../mockData";

export function getStoredMockData() {
  return {
    patients: INITIAL_PATIENTS,
    doctors: INITIAL_DOCTORS,
    appointments: INITIAL_APPOINTMENTS,
    queue: INITIAL_QUEUE,
    payments: INITIAL_PAYMENTS,
    notifications: INITIAL_NOTIFICATIONS,
    staff: INITIAL_STAFF,
    stats: INITIAL_STATS,
  };
}

const CLINIC_ID_KEY = "ClinicFlow_clinic_id";
const PAGE_SIZE = 100;

export interface ClinicProfile {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  region?: string | null;
  licenseNumber?: string | null;
}

interface ApiDoctor {
  id: string;
  clinicId: string;
  userId: string;
  specialization: string;
  consultationFee?: number | null;
  availabilityStatus: string;
  user?: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
  };
  staffMember?: { department?: string | null; jobTitle?: string | null };
}

interface ApiPatient {
  id: string;
  clinicId: string;
  medicalRecordNumber: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
  };
}

interface ApiAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  startsAt: string;
  endsAt: string;
  status: string;
  reason?: string | null;
  notes?: string | null;
  createdAt: string;
  patient?: { user?: { firstName: string; lastName: string } };
  doctor?: {
    specialization: string;
    user?: { firstName: string; lastName: string };
  };
}

interface ApiQueueTicket {
  id: string;
  patientId: string;
  doctorId: string | null;
  appointmentId: string | null;
  queueNumber: number;
  position?: number;
  priority: string;
  status: string;
  checkedInAt: string;
  calledAt: string | null;
  consultationStartedAt: string | null;
  completedAt: string | null;
  patient?: { user?: { firstName: string; lastName: string; phone: string } };
  doctor?: {
    specialization: string;
    user?: { firstName: string; lastName: string };
  } | null;
}

interface ApiPayment {
  id: string;
  patientId: string;
  appointmentId: string | null;
  amount: number;
  method: string;
  status: string;
  note?: string | null;
  createdAt: string;
}

interface ApiNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  appointmentId?: string | null;
}

interface ApiReport {
  appointments: number;
  patientsWaiting: number;
  completedVisits: number;
  revenue: number;
  averageWaitingTimeMinutes: number | null;
}

export type ReportRange = "today" | "7d" | "30d";

export interface ClinicReportSeries {
  appointments: Array<{
    date: string;
    appointments: number;
    completedVisits: number;
    cancellations: number;
    noShows: number;
  }>;
  revenue: Array<{ date: string; revenue: number; payments: number }>;
  waitingTime: Array<{
    date: string;
    patients: number;
    averageWaitingTimeMinutes: number | null;
    averageConsultationTimeMinutes: number | null;
  }>;
}

function lowerEnum(value: string): string {
  return value.toLowerCase();
}

function fromApiStatus(value: string): AppointmentStatus {
  return lowerEnum(value) as AppointmentStatus;
}

function fromApiQueueStatus(value: string): QueueStatus {
  return lowerEnum(value) as QueueStatus;
}

function toApiAvailability(value: DoctorAvailability): string {
  if (value === "off_duty") return "UNAVAILABLE";
  return value.toUpperCase();
}

function fromApiAvailability(value: string): DoctorAvailability {
  if (value === "AVAILABLE" || value === "BUSY")
    return lowerEnum(value) as DoctorAvailability;
  return "off_duty";
}

function ageFromBirthDate(value?: string | null): number {
  if (!value) return 0;
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return Math.max(0, age);
}

function toDoctor(record: ApiDoctor): Doctor {
  const name = [record.user?.firstName, record.user?.lastName]
    .filter(Boolean)
    .join(" ");
  return {
    id: record.id,
    userId: record.userId,
    name: name ? `Dr. ${name}` : "Doctor",
    email: record.user?.email || "",
    phone: record.user?.phone || "",
    specialization: record.specialization,
    department: record.staffMember?.department || record.specialization,
    roomNumber: "",
    availability: fromApiAvailability(record.availabilityStatus),
    consultationFeeETB: Number(record.consultationFee || 0),
    todayAppointmentsCount: 0,
    averageConsultationMinutes: 0,
    workingHours: { start: "", end: "" },
  };
}

function toPatient(record: ApiPatient): Patient {
  return {
    id: record.id,
    mrn: record.medicalRecordNumber,
    name: [record.user.firstName, record.user.lastName]
      .filter(Boolean)
      .join(" "),
    phone: record.user.phone,
    email: record.user.email || undefined,
    gender: record.gender?.toLowerCase() === "female" ? "female" : "male",
    age: ageFromBirthDate(record.dateOfBirth),
    emergencyContact: {
      name: record.emergencyContactName || "",
      phone: record.emergencyContactPhone || "",
      relation: "",
    },
    registeredDate: clinicDateInputValue(new Date(record.createdAt)),
  };
}

function toAppointment(
  record: ApiAppointment,
  patients: Patient[],
  doctors: Doctor[],
): Appointment {
  const patient = patients.find((item) => item.id === record.patientId);
  const doctor = doctors.find((item) => item.id === record.doctorId);
  const startsAt = new Date(record.startsAt);
  const endsAt = new Date(record.endsAt);
  const patientName =
    [record.patient?.user?.firstName, record.patient?.user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    patient?.name ||
    "Patient";
  const doctorName =
    [record.doctor?.user?.firstName, record.doctor?.user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    doctor?.name ||
    "Doctor";
  return {
    id: record.id,
    patientId: record.patientId,
    patientName,
    patientPhone: patient?.phone || "",
    doctorId: record.doctorId,
    doctorName,
    department: record.doctor?.specialization || doctor?.department || "",
    date: clinicDateInputValue(startsAt),
    time: clinicTimeValue(startsAt),
    durationMinutes: Math.max(
      0,
      Math.round((endsAt.getTime() - startsAt.getTime()) / 60000),
    ),
    status: fromApiStatus(record.status),
    type: "general_consultation",
    reason: record.reason || "",
    notes: record.notes || undefined,
    createdAt: record.createdAt,
  };
}

function toQueueItem(record: ApiQueueTicket, index: number): QueueItem {
  const patientName =
    [record.patient?.user?.firstName, record.patient?.user?.lastName]
      .filter(Boolean)
      .join(" ") || "Patient";
  const doctorName =
    [record.doctor?.user?.firstName, record.doctor?.user?.lastName]
      .filter(Boolean)
      .join(" ") || "Unassigned";
  const prefix = record.doctor?.specialization.toLowerCase().includes("ped")
    ? "P"
    : "A";
  return {
    id: record.id,
    ticketNumber: `#${prefix}${String(record.queueNumber).padStart(3, "0")}`,
    appointmentId: record.appointmentId || undefined,
    patientId: record.patientId,
    patientName,
    patientPhone: record.patient?.user?.phone || "",
    doctorId: record.doctorId || "",
    doctorName,
    department: record.doctor?.specialization || "",
    checkInTime: record.checkedInAt,
    calledTime: record.calledAt || undefined,
    startTime: record.consultationStartedAt || undefined,
    completedTime: record.completedAt || undefined,
    status: fromApiQueueStatus(record.status),
    priority: lowerEnum(record.priority) === "urgent" ? "urgent" : "normal",
    estimatedWaitMinutes: 0,
    position: record.position ?? (record.status === "WAITING" ? index + 1 : 0),
    roomNumber: "",
  };
}

function fromPaymentMethod(value: string): PaymentMethod {
  const normalized = lowerEnum(value);
  if (["chapa", "cash", "mpesa", "bank_transfer"].includes(normalized)) {
    return normalized as PaymentMethod;
  }
  if (normalized === "other") return "other";
  return "card";
}

function fromPaymentStatus(value: string): PaymentStatus {
  if (value === "COMPLETED") return "confirmed";
  if (value === "PENDING") return "pending";
  if (value === "REFUNDED") return "refunded";
  return "cancelled";
}

function toPaymentMethod(value: PaymentMethod): string {
  if (value === "chapa") return "CHAPA";
  if (value === "cbe_birr" || value === "card" || value === "other")
    return "OTHER";
  return value.toUpperCase();
}

function toApiPaymentStatus(value: PaymentStatus): string {
  if (value === "confirmed") return "COMPLETED";
  if (value === "cancelled") return "FAILED";
  return value.toUpperCase();
}

function toPayment(record: ApiPayment, patients: Patient[]): PaymentRecord {
  const patient = patients.find((item) => item.id === record.patientId);
  const reference = record.note?.match(/(?:^| · )Reference: (.+)$/)?.[1] || "";
  return {
    id: record.id,
    receiptNumber: record.id,
    patientId: record.patientId,
    patientName: patient?.name || "Patient",
    patientPhone: patient?.phone || "",
    appointmentId: record.appointmentId || undefined,
    amountETB: Number(record.amount),
    paymentMethod: fromPaymentMethod(record.method),
    referenceNumber: reference,
    status: fromPaymentStatus(record.status),
    date: record.createdAt,
    description: (record.note || "").replace(/(?:^| · )Reference: .+$/, ""),
    cashierName: "",
  };
}

function toNotification(record: ApiNotification): ClinicNotification {
  const kind = record.type.toLowerCase();
  const type: ClinicNotification["type"] = kind.includes("queue")
    ? "queue"
    : kind.includes("appointment")
      ? "appointment"
      : kind.includes("delay")
        ? "delay"
        : "system";
  return {
    id: record.id,
    title: record.title,
    message: record.message,
    timestamp: record.createdAt,
    read: Boolean(record.readAt),
    type,
  };
}

async function getClinicId(): Promise<string> {
  const cached = localStorage.getItem(CLINIC_ID_KEY);
  if (cached) return cached;
  try {
    if (clinicService.getActiveRole() === "patient") {
      const patient = await apiRequest<ApiPatient>("/patients/me");
      localStorage.setItem(CLINIC_ID_KEY, patient.clinicId);
      return patient.clinicId;
    }
    const clinics = await apiPaginated<ClinicProfile>("/clinics", {
      page: 1,
      limit: PAGE_SIZE,
    });
    if (clinics.data.length > 0) {
      localStorage.setItem(CLINIC_ID_KEY, clinics.data[0].id);
      return clinics.data[0].id;
    }
  } catch {
    // Graceful offline/demo fallback
  }
  const fallbackId = "cln-bole-001";
  localStorage.setItem(CLINIC_ID_KEY, fallbackId);
  return fallbackId;
}

async function getPatientsPage(
  search?: string,
  page = 1,
  limit = PAGE_SIZE,
  gender?: string,
): Promise<PaginatedData<ApiPatient>> {
  try {
    if (clinicService.getActiveRole() === "patient") {
      const patient = await apiRequest<ApiPatient>("/patients/me");
      return {
        data: [patient],
        meta: {
          total: 1,
          page,
          limit,
          gender,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }
    const clinicId = await getClinicId();
    return await apiPaginated<ApiPatient>("/patients", {
      clinicId,
      page,
      limit,
      search: search?.trim() || undefined,
    });
  } catch {
    const mockPatients = getStoredMockData().patients;
    let filtered = mockPatients;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          p.phone.includes(q),
      );
    }
    return {
      data: filtered.map((p) => ({
        id: p.id,
        clinicId: "cln-bole-001",
        medicalRecordNumber: p.mrn,
        gender: p.gender,
        createdAt: p.registeredDate,
        user: {
          firstName: p.name.split(" ")[0] || "",
          lastName: p.name.split(" ").slice(1).join(" ") || "",
          phone: p.phone,
          email: p.email || null,
        },
      })),
      meta: {
        total: filtered.length,
        page,
        limit,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }
}

export const clinicService = {
  getActiveRole(): Role {
    const serialized = localStorage.getItem("ClinicFlow_user");
    if (!serialized) return "patient";
    try {
      const { role } = JSON.parse(serialized) as { role?: string };
      return (role || "PATIENT").toLowerCase() as Role;
    } catch {
      return "patient";
    }
  },

  async getClinicProfile(): Promise<ClinicProfile> {
    try {
      const clinicId = await getClinicId();
      return await apiRequest<ClinicProfile>(`/clinics/${clinicId}`);
    } catch {
      return {
        id: "cln-bole-001",
        name: "Bole Specialty & Primary Care Clinic",
        phone: "+251911223344",
        email: "info@boletwentythree.et",
        address: "Bole Medhanealem Road, Suite 402",
        city: "Addis Ababa",
        region: "Addis Ababa",
        licenseNumber: "MOH-ET-2024-9981",
      };
    }
  },

  async updateClinicProfile(
    data: Partial<ClinicProfile>,
  ): Promise<ClinicProfile> {
    const clinicId = await getClinicId();
    return apiRequest<ClinicProfile>(`/clinics/${clinicId}`, {
      method: "PATCH",
      body: data,
    });
  },

  async getDoctors(search?: string): Promise<Doctor[]> {
    try {
      const clinicId = await getClinicId();
      const page = await apiPaginated<ApiDoctor>(
        `/clinics/${clinicId}/doctors`,
        {
          page: 1,
          limit: PAGE_SIZE,
          isActive: true,
          search: search?.trim() || undefined,
        },
      );
      return page.data.map(toDoctor);
    } catch {
      const stored = getStoredMockData().doctors;
      if (!search) return stored;
      const q = search.toLowerCase();
      return stored.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q),
      );
    }
  },

  async createDoctor(data: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    password: string;
    specialization: string;
    licenseNumber: string;
    consultationFee?: number;
  }): Promise<Doctor> {
    const clinicId = await getClinicId();
    const doctor = await apiRequest<ApiDoctor>(`/clinics/${clinicId}/doctors`, {
      method: "POST",
      body: data,
    });
    return toDoctor(doctor);
  },

  async updateDoctorAvailability(
    id: string,
    availability: DoctorAvailability,
  ): Promise<Doctor> {
    const clinicId = await getClinicId();
    const doctor = await apiRequest<ApiDoctor>(
      `/clinics/${clinicId}/doctors/${id}/availability`,
      {
        method: "PATCH",
        body: { availabilityStatus: toApiAvailability(availability) },
      },
    );
    return toDoctor(doctor);
  },

  async getPatients(search?: string): Promise<Patient[]> {
    const page = await getPatientsPage(search);
    return page.data.map(toPatient);
  },

  async getPatientsPage(
    search: string | undefined,
    page: number,
    gender?: string,
    limit = 25,
  ): Promise<PaginatedData<Patient>> {
    const result = await getPatientsPage(search, page, limit, gender);
    return { data: result.data.map(toPatient), meta: result.meta };
  },

  async createPatient(
    data: Omit<Patient, "id" | "mrn" | "registeredDate" | "totalVisits">,
  ): Promise<Patient> {
    const clinicId = await getClinicId();
    const [firstName = "Patient", ...lastNameParts] = data.name
      .trim()
      .split(/\s+/);
    const lastName = lastNameParts.join(" ") || "Patient";
    const clinicToday = clinicDateInputValue();
    const [year, month, day] = clinicToday.split("-").map(Number);
    const dateOfBirth = `${year - data.age}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const created = await apiRequest<ApiPatient>("/patients", {
      method: "POST",
      body: {
        clinicId,
        phone: data.phone,
        email: data.email || undefined,
        firstName,
        lastName,
        dateOfBirth,
        gender: data.gender,
        emergencyContactName: data.emergencyContact.name || undefined,
        emergencyContactPhone: data.emergencyContact.phone || undefined,
      },
    });
    return toPatient(created);
  },

  async getAppointments(filters?: {
    patientId?: string;
    doctorId?: string;
    search?: string;
  }): Promise<Appointment[]> {
    try {
      const clinicId = await getClinicId();
      const patientId =
        this.getActiveRole() === "patient"
          ? (await apiRequest<ApiPatient>("/patients/me")).id
          : filters?.patientId;
      const [appointments, patients, doctors] = await Promise.all([
        apiPaginated<ApiAppointment>("/appointments", {
          clinicId,
          page: 1,
          limit: PAGE_SIZE,
          patientId,
          doctorId: filters?.doctorId,
          search: filters?.search?.trim() || undefined,
        }),
        getPatientsPage(),
        this.getDoctors(),
      ]);
      return appointments.data.map((record) =>
        toAppointment(record, patients.data.map(toPatient), doctors),
      );
    } catch {
      let appointments = getStoredMockData().appointments;
      if (filters?.doctorId) {
        appointments = appointments.filter(
          (a) => a.doctorId === filters.doctorId,
        );
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        appointments = appointments.filter(
          (a) =>
            a.patientName.toLowerCase().includes(q) ||
            a.doctorName.toLowerCase().includes(q),
        );
      }
      return appointments;
    }
  },

  async getAppointmentsPage(
    filters: { doctorId?: string; status?: string; search?: string },
    page: number,
    limit = 25,
  ): Promise<PaginatedData<Appointment>> {
    const clinicId = await getClinicId();
    const patientId =
      this.getActiveRole() === "patient"
        ? (await apiRequest<ApiPatient>("/patients/me")).id
        : undefined;
    const [pageResult, patients, doctors] = await Promise.all([
      apiPaginated<ApiAppointment>("/appointments", {
        clinicId,
        page,
        limit,
        patientId,
        doctorId: filters.doctorId,
        status: filters.status?.toUpperCase(),
        search: filters.search?.trim() || undefined,
      }),
      getPatientsPage(),
      this.getDoctors(),
    ]);
    return {
      data: pageResult.data.map((record) =>
        toAppointment(record, patients.data.map(toPatient), doctors),
      ),
      meta: pageResult.meta,
    };
  },

  async createAppointment(
    data: Omit<Appointment, "id" | "createdAt">,
  ): Promise<Appointment> {
    const clinicId = await getClinicId();
    const startsAt = new Date(`${data.date}T${data.time}:00+03:00`);
    const endsAt = new Date(startsAt.getTime() + data.durationMinutes * 60_000);
    const result = await apiRequest<ApiAppointment>("/appointments", {
      method: "POST",
      body: {
        clinicId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        reason: data.reason || undefined,
        notes: data.notes || undefined,
      },
    });
    const [patients, doctors] = await Promise.all([
      getPatientsPage(),
      this.getDoctors(),
    ]);
    return toAppointment(result, patients.data.map(toPatient), doctors);
  },

  async updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
  ): Promise<Appointment> {
    const clinicId = await getClinicId();
    const result =
      status === "cancelled"
        ? await apiRequest<ApiAppointment>(
            `/appointments/${id}/cancel?clinicId=${clinicId}`,
            {
              method: "POST",
            },
          )
        : await apiRequest<ApiAppointment>(
            `/appointments/${id}?clinicId=${clinicId}`,
            {
              method: "PATCH",
              body: { status: status.toUpperCase() },
            },
          );
    const [patients, doctors] = await Promise.all([
      getPatientsPage(),
      this.getDoctors(),
    ]);
    return toAppointment(result, patients.data.map(toPatient), doctors);
  },

  async getQueue(): Promise<QueueItem[]> {
    try {
      const clinicId = await getClinicId();
      const patientId =
        this.getActiveRole() === "patient"
          ? (await apiRequest<ApiPatient>("/patients/me")).id
          : undefined;
      const page = await apiPaginated<ApiQueueTicket>("/queue", {
        clinicId,
        page: 1,
        limit: PAGE_SIZE,
        patientId,
      });
      return page.data.map(toQueueItem);
    } catch {
      return getStoredMockData().queue;
    }
  },

  async checkInPatient(params: {
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    priority?: PriorityLevel;
  }): Promise<QueueItem> {
    const clinicId = await getClinicId();
    const ticket = await apiRequest<ApiQueueTicket>("/queue/check-in", {
      method: "POST",
      body: {
        clinicId,
        patientId: params.patientId,
        doctorId: params.doctorId,
        appointmentId: params.appointmentId,
        priority: params.priority === "urgent" ? "URGENT" : "NORMAL",
      },
    });
    return toQueueItem(ticket, 0);
  },

  async updateQueueStatus(id: string, status: QueueStatus): Promise<QueueItem> {
    const clinicId = await getClinicId();
    const actions: Record<QueueStatus, string> = {
      waiting: "",
      called: "call",
      in_consultation: "start",
      completed: "complete",
      skipped: "skip",
    };
    const action = actions[status];
    if (!action)
      throw new ApiError("Queue tickets cannot be moved back to waiting.", 400);
    const ticket = await apiRequest<ApiQueueTicket>(
      `/queue/${id}/${action}?clinicId=${clinicId}`,
      {
        method: "POST",
      },
    );
    return toQueueItem(ticket, 0);
  },

  async callNextPatient(doctorId?: string): Promise<QueueItem | null> {
    const clinicId = await getClinicId();
    const queue = await apiPaginated<ApiQueueTicket>("/queue", {
      clinicId,
      page: 1,
      limit: PAGE_SIZE,
      status: "WAITING",
      doctorId,
    });
    const next = queue.data[0];
    if (!next) return null;
    const ticket = await apiRequest<ApiQueueTicket>(
      `/queue/${next.id}/call?clinicId=${clinicId}`,
      { method: "POST" },
    );
    return toQueueItem(ticket, 0);
  },

  async getPayments(): Promise<PaymentRecord[]> {
    if (this.getActiveRole() === "patient") {
      return getStoredMockData().payments;
    }
    try {
      const clinicId = await getClinicId();
      const [payments, patients] = await Promise.all([
        apiPaginated<ApiPayment>("/payments", {
          clinicId,
          page: 1,
          limit: PAGE_SIZE,
        }),
        getPatientsPage(),
      ]);
      return payments.data.map((payment) =>
        toPayment(payment, patients.data.map(toPatient)),
      );
    } catch {
      return getStoredMockData().payments;
    }
  },

  async recordPayment(
    data: Omit<PaymentRecord, "id" | "receiptNumber" | "date">,
  ): Promise<PaymentRecord> {
    const clinicId = await getClinicId();
    const result = await apiRequest<ApiPayment>("/payments", {
      method: "POST",
      body: {
        clinicId,
        patientId: data.patientId,
        appointmentId: data.appointmentId,
        amount: data.amountETB,
        method: toPaymentMethod(data.paymentMethod),
        status: toApiPaymentStatus(data.status),
        note: [
          data.description,
          data.referenceNumber && `Reference: ${data.referenceNumber}`,
        ]
          .filter(Boolean)
          .join(" · "),
      },
    });
    const patients = await getPatientsPage();
    return toPayment(result, patients.data.map(toPatient));
  },

  async initializeChapaPayment(params: {
    patientId: string;
    amount: number;
    appointmentId?: string;
    returnUrl?: string;
    callbackUrl?: string;
    description?: string;
  }): Promise<{
    checkoutUrl: string;
    txRef: string;
    paymentId: string;
    amount: number;
    currency: string;
  }> {
    const clinicId = await getClinicId();
    return await apiRequest("/payments/chapa/initialize", {
      method: "POST",
      body: {
        clinicId,
        patientId: params.patientId,
        amount: params.amount,
        appointmentId: params.appointmentId,
        returnUrl:
          params.returnUrl || `${window.location.origin}/patient/payments`,
        callbackUrl: params.callbackUrl,
        description: params.description || "Clinical Consultation Fee Payment",
      },
    });
  },

  async verifyChapaPayment(txRef: string): Promise<PaymentRecord> {
    const clinicId = await getClinicId();
    const result = await apiRequest<ApiPayment>(
      `/payments/chapa/verify/${encodeURIComponent(txRef)}?clinicId=${clinicId}`,
    );
    const patients = await getPatientsPage();
    return toPayment(result, patients.data.map(toPatient));
  },

  async updatePaymentStatus(
    _id: string,
    _status: PaymentStatus,
  ): Promise<PaymentRecord[]> {
    throw new ApiError(
      "The payment API does not support changing a recorded payment status.",
      405,
    );
  },

  async getNotifications(): Promise<ClinicNotification[]> {
    const clinicId = await getClinicId();
    const page = await apiPaginated<ApiNotification>("/notifications", {
      clinicId,
      page: 1,
      limit: PAGE_SIZE,
    });
    return page.data.map(toNotification);
  },

  async markNotificationAsRead(id: string): Promise<ClinicNotification[]> {
    const clinicId = await getClinicId();
    await apiRequest(`/notifications/${id}/read?clinicId=${clinicId}`, {
      method: "PATCH",
    });
    return this.getNotifications();
  },

  async markAllNotificationsAsRead(): Promise<ClinicNotification[]> {
    const unread = (await this.getNotifications()).filter(
      (notification) => !notification.read,
    );
    for (const notification of unread) {
      await this.markNotificationAsRead(notification.id);
    }
    return this.getNotifications();
  },

  async getStats(): Promise<ClinicStats> {
    const clinicId = await getClinicId();
    const report = await apiRequest<ApiReport>(
      apiPath("/reports/dashboard", { clinicId, range: "today" }),
    );
    const appointments = await this.getAppointments();
    return {
      appointmentsToday: report.appointments,
      appointmentsDiffPercent: 0,
      patientsWaiting: report.patientsWaiting,
      urgentWaiting: 0,
      completedVisits: report.completedVisits,
      completedPercent: Math.round(
        (report.completedVisits / Math.max(1, report.appointments)) * 100,
      ),
      todayRevenueETB: report.revenue,
      revenueDiffPercent: 0,
      averageWaitMinutes: Math.round(report.averageWaitingTimeMinutes || 0),
      digitalPaymentSharePercent: 0,
    };
  },

  async getReportSeries(range: ReportRange): Promise<ClinicReportSeries> {
    const clinicId = await getClinicId();
    const params = { clinicId, range };
    const [appointments, revenue, waitingTime] = await Promise.all([
      apiRequest<{ data: ClinicReportSeries["appointments"] }>(
        apiPath("/reports/appointments", params),
      ),
      apiRequest<{ data: ClinicReportSeries["revenue"] }>(
        apiPath("/reports/revenue", params),
      ),
      apiRequest<{ data: ClinicReportSeries["waitingTime"] }>(
        apiPath("/reports/waiting-time", params),
      ),
    ]);
    return {
      appointments: appointments.data,
      revenue: revenue.data,
      waitingTime: waitingTime.data,
    };
  },
};
