import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AppointmentStatus,
  DoctorAvailability,
  PaymentStatus,
  QueueItem,
  QueueStatus,
  Role,
} from '../../types';
import { authService } from '../services/authService';
import { clinicService } from '../services/clinicService';
import { ReportRange } from '../services/clinicService';

interface ClinicDataFilters {
  patientSearch?: string;
  appointmentSearch?: string;
  includePatientList?: boolean;
  includeAppointmentList?: boolean;
}

const emptyStats = {
  appointmentsToday: 0,
  appointmentsDiffPercent: 0,
  patientsWaiting: 0,
  urgentWaiting: 0,
  completedVisits: 0,
  completedPercent: 0,
  todayRevenueETB: 0,
  revenueDiffPercent: 0,
  averageWaitMinutes: 0,
  digitalPaymentSharePercent: 0,
};

export function useAuth() {
  const [user, setUser] = useState(() => authService.getUser());
  const [isLoading, setIsLoading] = useState(() => Boolean(
    localStorage.getItem('mediflow_access_token') || localStorage.getItem('mediflow_refresh_token'),
  ));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isActive = true;
    const restore = async () => {
      try {
        const restoredUser = await authService.restoreSession();
        if (isActive) setUser(restoredUser);
      } catch (restoreError) {
        if (isActive) setError(restoreError instanceof Error ? restoreError : new Error('Session restore failed'));
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void restore();
    const sync = () => setUser(authService.getUser());
    window.addEventListener('mediflow-auth-change', sync);
    return () => {
      isActive = false;
      window.removeEventListener('mediflow-auth-change', sync);
    };
  }, []);

  return { user, isLoading, error };
}

export function useActiveRole() {
  const [role, setRole] = useState<Role>(() => clinicService.getActiveRole());

  useEffect(() => {
    const sync = () => setRole(clinicService.getActiveRole());
    window.addEventListener('mediflow-auth-change', sync);
    return () => window.removeEventListener('mediflow-auth-change', sync);
  }, []);

  return role;
}

export function useClinicData(filters: ClinicDataFilters = {}) {
  const queryClient = useQueryClient();
  const patientSearch = filters.patientSearch?.trim() || undefined;
  const appointmentSearch = filters.appointmentSearch?.trim() || undefined;
  const role = clinicService.getActiveRole();
  const isPatient = role === 'patient';
  const canViewPayments = role === 'admin' || role === 'receptionist';
  const canViewReports = canViewPayments;

  const doctorsQuery = useQuery({
    queryKey: ['clinic', 'doctors'],
    queryFn: () => clinicService.getDoctors(),
    enabled: !isPatient,
  });
  const patientsQuery = useQuery({
    queryKey: ['clinic', 'patients', patientSearch || ''],
    queryFn: () => clinicService.getPatients(patientSearch),
    enabled: filters.includePatientList !== false,
  });
  const appointmentsQuery = useQuery({
    queryKey: ['clinic', 'appointments', appointmentSearch || ''],
    queryFn: () => clinicService.getAppointments({ search: appointmentSearch }),
    enabled: filters.includeAppointmentList !== false,
  });
  const queueQuery = useQuery({
    queryKey: ['clinic', 'queue'],
    queryFn: () => clinicService.getQueue(),
    enabled: true,
    refetchInterval: 30_000,
  });
  const paymentsQuery = useQuery({
    queryKey: ['clinic', 'payments'],
    queryFn: () => clinicService.getPayments(),
    enabled: canViewPayments,
  });
  const notificationsQuery = useQuery({
    queryKey: ['clinic', 'notifications'],
    queryFn: () => clinicService.getNotifications(),
    refetchInterval: 30_000,
  });
  const statsQuery = useQuery({
    queryKey: ['clinic', 'stats'],
    queryFn: () => clinicService.getStats(),
    enabled: canViewReports,
    refetchInterval: 30_000,
  });
  const clinicProfileQuery = useQuery({
    queryKey: ['clinic', 'profile'],
    queryFn: () => clinicService.getClinicProfile(),
    enabled: !isPatient,
  });

  const invalidateClinic = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: ['clinic'] });
  }, [queryClient]);

  const updateDoctorAvailabilityMutation = useMutation({
    mutationFn: ({ id, availability }: { id: string; availability: DoctorAvailability }) =>
      clinicService.updateDoctorAvailability(id, availability),
    onSuccess: invalidateClinic,
  });
  const checkInMutation = useMutation({
    mutationFn: (params: {
      patientId: string;
      doctorId: string;
      appointmentId?: string;
      priority?: QueueItem['priority'];
    }) => clinicService.checkInPatient(params),
    onSuccess: invalidateClinic,
  });
  const updateQueueStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: QueueStatus }) =>
      clinicService.updateQueueStatus(id, status),
    onSuccess: invalidateClinic,
  });
  const callNextMutation = useMutation({
    mutationFn: (doctorId?: string) => clinicService.callNextPatient(doctorId),
    onSuccess: invalidateClinic,
  });
  const createAppointmentMutation = useMutation({
    mutationFn: (data: Parameters<typeof clinicService.createAppointment>[0]) =>
      clinicService.createAppointment(data),
    onSuccess: invalidateClinic,
  });
  const updateAppointmentStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      clinicService.updateAppointmentStatus(id, status),
    onSuccess: invalidateClinic,
  });
  const createPatientMutation = useMutation({
    mutationFn: (data: Parameters<typeof clinicService.createPatient>[0]) =>
      clinicService.createPatient(data),
    onSuccess: invalidateClinic,
  });
  const recordPaymentMutation = useMutation({
    mutationFn: (data: Parameters<typeof clinicService.recordPayment>[0]) =>
      clinicService.recordPayment(data),
    onSuccess: invalidateClinic,
  });
  const updatePaymentStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) =>
      clinicService.updatePaymentStatus(id, status),
    onSuccess: invalidateClinic,
  });
  const markNotificationReadMutation = useMutation({
    mutationFn: (id: string) => clinicService.markNotificationAsRead(id),
    onSuccess: invalidateClinic,
  });
  const markAllNotificationsReadMutation = useMutation({
    mutationFn: () => clinicService.markAllNotificationsAsRead(),
    onSuccess: invalidateClinic,
  });
  const updateClinicProfileMutation = useMutation({
    mutationFn: (data: Parameters<typeof clinicService.updateClinicProfile>[0]) =>
      clinicService.updateClinicProfile(data),
    onSuccess: invalidateClinic,
  });

  const activeQueries = [
    doctorsQuery,
    patientsQuery,
    appointmentsQuery,
    queueQuery,
    paymentsQuery,
    notificationsQuery,
    statsQuery,
    clinicProfileQuery,
  ].filter(query => query.isEnabled);

  return {
    doctors: doctorsQuery.data || [],
    patients: patientsQuery.data || [],
    appointments: appointmentsQuery.data || [],
    queue: queueQuery.data || [],
    payments: paymentsQuery.data || [],
    notifications: notificationsQuery.data || [],
    stats: statsQuery.data || emptyStats,
    clinicProfile: clinicProfileQuery.data,
    isLoading: activeQueries.some(query => query.isLoading),
    errors: activeQueries
      .filter(query => query.isError)
      .map(query => query.error instanceof Error ? query.error.message : 'Unable to load clinic data'),
    refetch: invalidateClinic,
    updateDoctorAvailability: updateDoctorAvailabilityMutation.mutateAsync,
    createDoctor: (data: Parameters<typeof clinicService.createDoctor>[0]) =>
      clinicService.createDoctor(data).then(async result => {
        await invalidateClinic();
        return result;
      }),
    checkInPatient: checkInMutation.mutateAsync,
    updateQueueStatus: updateQueueStatusMutation.mutateAsync,
    callNextPatient: callNextMutation.mutateAsync,
    createAppointment: createAppointmentMutation.mutateAsync,
    updateAppointmentStatus: updateAppointmentStatusMutation.mutateAsync,
    createPatient: createPatientMutation.mutateAsync,
    recordPayment: recordPaymentMutation.mutateAsync,
    updatePaymentStatus: updatePaymentStatusMutation.mutateAsync,
    markNotificationAsRead: markNotificationReadMutation.mutateAsync,
    markAllNotificationsAsRead: markAllNotificationsReadMutation.mutateAsync,
    updateClinicProfile: updateClinicProfileMutation.mutateAsync,
  };
}

export function useClinicReports(range: ReportRange) {
  const enabled = ['admin', 'receptionist'].includes(clinicService.getActiveRole());
  return useQuery({
    queryKey: ['clinic', 'reports', range],
    queryFn: () => clinicService.getReportSeries(range),
    enabled,
  });
}

export function usePatientsPage(search: string, page: number, gender: string) {
  return useQuery({
    queryKey: ['clinic', 'patients', 'page', search.trim(), gender, page],
    queryFn: () => clinicService.getPatientsPage(search.trim() || undefined, page, gender === 'all' ? undefined : gender),
  });
}

export function useAppointmentsPage(
  filters: { doctorId?: string; status?: string; search?: string },
  page: number,
) {
  return useQuery({
    queryKey: ['clinic', 'appointments', 'page', filters, page],
    queryFn: () => clinicService.getAppointmentsPage(filters, page),
  });
}
