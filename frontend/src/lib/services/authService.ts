import { apiRequest, ApiError, AuthUser, tokenStore } from './apiClient';

const USER_KEY = 'mediflow_user';
const AUTH_EVENT = 'mediflow-auth-change';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: AuthUser;
}

export interface OtpDispatch {
  success: boolean;
  message: string;
  cooldownSeconds: number;
}

export interface ClinicRegistration {
  phone: string;
  code: string;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  clinicName: string;
  clinicPhone?: string;
  clinicAddress?: string;
  clinicCity?: string;
}

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

  async login(identifier: string, password: string): Promise<AuthUser> {
    const session = await apiRequest<AuthSession>('/auth/login', {
      method: 'POST',
      authenticated: false,
      body: { identifier, password },
    });
    this.saveSession(session);
    return session.user;
  },

  async sendRegistrationOtp(phone: string): Promise<OtpDispatch> {
    return apiRequest<OtpDispatch>('/auth/send-otp', {
      method: 'POST',
      authenticated: false,
      body: { identifier: phone, purpose: 'REGISTRATION' },
    });
  },

  async sendPasswordResetOtp(identifier: string): Promise<OtpDispatch> {
    return apiRequest<OtpDispatch>('/auth/send-otp', {
      method: 'POST',
      authenticated: false,
      body: { identifier, purpose: 'PASSWORD_RESET' },
    });
  },

  async resetPassword(identifier: string, code: string, password: string): Promise<void> {
    await apiRequest('/auth/reset-password', {
      method: 'POST',
      authenticated: false,
      body: { identifier, code, password },
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
