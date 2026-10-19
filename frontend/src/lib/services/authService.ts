import { apiRequest, ApiError, AuthUser, tokenStore } from './apiClient';

const USER_KEY = 'mediflow_user';
const AUTH_EVENT = 'mediflow-auth-change';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: AuthUser;
}


export interface ClinicRegistration {
  phone: string;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  clinicName: string;
  clinicPhone?: string;
  clinicAddress?: string;
  clinicCity?: string;
}

export interface PatientRegistration {
  phone: string;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface DoctorRegistration {
  phone: string;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  specialization: string;
  licenseNumber: string;
  consultationFee?: number;
  bio?: string;
  clinicId?: string;
}

const DEMO_USERS: Record<'admin' | 'doctor' | 'patient', AuthUser> = {
  admin: {
    id: 'usr-admin-001',
    phone: '+251911100701',
    email: 'admin@mediflow-demo.local',
    firstName: 'Demo',
    lastName: 'Admin',
    role: 'ADMIN',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  doctor: {
    id: 'usr-doc-hana',
    phone: '+251911100704',
    email: 'doctor.hana@mediflow-demo.local',
    firstName: 'Hana',
    lastName: 'Tesfaye',
    role: 'DOCTOR',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  patient: {
    id: 'usr-pat-ayalew',
    phone: '+251911100705',
    email: 'patient.ayalew@mediflow-demo.local',
    firstName: 'Abebe',
    lastName: 'Kebede',
    role: 'PATIENT',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
};

export const authService = {
  getUser(): AuthUser | null {
    const serialized = localStorage.getItem(USER_KEY);
    if (!serialized) return null;
    try {
      return JSON.parse(serialized) as AuthUser;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  async login(
    identifier: string,
    password?: string,
  ): Promise<AuthUser> {
    const cleanId = identifier.trim();
    try {
      const session = await apiRequest<AuthSession>('/auth/login', {
        method: 'POST',
        authenticated: false,
        body: { identifier: cleanId, password: password || '' },
      });
      this.saveSession(session);
      return session.user;
    } catch (apiErr) {
      // If the backend returns an explicit error (401 invalid credentials, 400, etc.), do NOT mask it!
      if (apiErr instanceof ApiError) {
        throw apiErr;
      }
      // Only for completely unreachable network with pre-set demo identifiers, allow offline demo
      const matchedDemoRole = (['admin', 'doctor', 'patient'] as const).find(
        r =>
          DEMO_USERS[r].email?.toLowerCase() === cleanId.toLowerCase() ||
          DEMO_USERS[r].phone === cleanId,
      );
      if (matchedDemoRole) {
        return this.demoLogin(matchedDemoRole);
      }
      throw apiErr;
    }
  },

  async demoLogin(role: 'admin' | 'doctor' | 'patient'): Promise<AuthUser> {
    const user = DEMO_USERS[role];
    const session: AuthSession = {
      accessToken: `demo_access_${role}_${Date.now()}`,
      refreshToken: `demo_refresh_${role}_${Date.now()}`,
      expiresIn: '7d',
      user,
    };
    this.saveSession(session);
    return user;
  },

  async registerDoctor(registration: DoctorRegistration): Promise<AuthUser> {
    try {
      const session = await apiRequest<AuthSession>('/auth/register-doctor', {
        method: 'POST',
        authenticated: false,
        body: registration,
      });
      this.saveSession(session);
      return session.user;
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      const user: AuthUser = {
        id: `usr-doc-${Date.now()}`,
        phone: registration.phone,
        email: registration.email || null,
        firstName: registration.firstName,
        lastName: registration.lastName,
        role: 'DOCTOR',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      const session: AuthSession = {
        accessToken: `demo_access_doctor_${Date.now()}`,
        refreshToken: `demo_refresh_doctor_${Date.now()}`,
        expiresIn: '7d',
        user,
      };
      this.saveSession(session);
      return user;
    }
  },

  async registerPatient(registration: PatientRegistration): Promise<AuthUser> {
    try {
      const session = await apiRequest<AuthSession>('/auth/register-patient', {
        method: 'POST',
        authenticated: false,
        body: registration,
      });
      this.saveSession(session);
      return session.user;
    } catch {
      const user: AuthUser = {
        id: `usr-pat-${Date.now()}`,
        phone: registration.phone,
        email: registration.email || null,
        firstName: registration.firstName,
        lastName: registration.lastName,
        role: 'PATIENT',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      const session: AuthSession = {
        accessToken: `demo_access_patient_${Date.now()}`,
        refreshToken: `demo_refresh_patient_${Date.now()}`,
        expiresIn: '7d',
        user,
      };
      this.saveSession(session);
      return user;
    }
  },

  async resetPassword(identifier: string, password: string): Promise<void> {
    await apiRequest('/auth/reset-password', {
      method: 'POST',
      authenticated: false,
      body: { identifier, password },
    });
  },

  async registerClinic(registration: ClinicRegistration): Promise<AuthUser> {
    const session = await apiRequest<AuthSession>('/auth/register-clinic', {
      method: 'POST',
      authenticated: false,
      body: registration,
    });
    this.saveSession(session);
    return session.user;
  },

  async getProfile(): Promise<AuthUser> {
    const user = await apiRequest<AuthUser>('/auth/me');
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  async restoreSession(): Promise<AuthUser | null> {
    if (!tokenStore.getAccessToken() && !tokenStore.getRefreshToken()) return null;
    try {
      if (tokenStore.getAccessToken()) return await this.getProfile();
      const refreshed = await apiRequest<AuthSession>('/auth/refresh', {
        method: 'POST',
        authenticated: false,
        retryUnauthorized: false,
        body: { refreshToken: tokenStore.getRefreshToken() },
      });
      this.saveSession(refreshed);
      return refreshed.user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        this.clearSession();
        return null;
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStore.getRefreshToken();
    try {
      if (refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
          retryUnauthorized: false,
        });
      }
    } finally {
      this.clearSession();
    }
  },

  clearSession() {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('mediflow_clinic_id');
    window.dispatchEvent(new Event(AUTH_EVENT));
  },

  saveSession(session: AuthSession) {
    tokenStore.setTokens(session.accessToken, session.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    window.dispatchEvent(new Event(AUTH_EVENT));
  },
};
