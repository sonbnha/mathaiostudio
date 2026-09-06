'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import RenewLicenseModal from '@/components/RenewLicenseModal';
import { computeLicenseStatus, LicenseStatusResult } from '@/lib/licenseStatus';

interface OpenRenewModalOptions {
  isNearExpiry?: boolean;
  customTitle?: string;
  customDescription?: string;
}

interface RenewModalContextType {
  isOpen: boolean;
  openRenewModal: (opts?: OpenRenewModalOptions) => void;
  closeRenewModal: () => void;
  currentUser: any | null;
  licenseInfo: LicenseStatusResult;
  refreshUser: () => Promise<void>;
}

const defaultLicenseInfo = computeLicenseStatus({});

const RenewModalContext = createContext<RenewModalContextType>({
  isOpen: false,
  openRenewModal: () => {},
  closeRenewModal: () => {},
  currentUser: null,
  licenseInfo: defaultLicenseInfo,
  refreshUser: async () => {},
});

export function RenewModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<OpenRenewModalOptions>({});
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('mathaio_cached_user');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          try {
            localStorage.setItem('mathaio_cached_user', JSON.stringify(data.user));
          } catch {}
        } else {
          setCurrentUser(null);
          try {
            localStorage.removeItem('mathaio_cached_user');
          } catch {}
        }
      } else if (res.status === 401) {
        setCurrentUser(null);
        try {
          localStorage.removeItem('mathaio_cached_user');
        } catch {}
      }
    } catch {
      // Keep optimistic cached user on transient network errors
    }
  }, []);

  useEffect(() => {
    // 1. Initial sync from cache if present
    try {
      const cached = localStorage.getItem('mathaio_cached_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          setCurrentUser(parsed);
        }
      }
    } catch {}

    // 2. Validate with server
    fetchCurrentUser();

    const handleAuthUpdated = (e?: any) => {
      if (e?.detail) {
        const userObj = e.detail?.user || (e.detail?.id ? e.detail : null);
        if (userObj) {
          setCurrentUser((prev: any) => (prev ? { ...prev, ...userObj } : userObj));
          try {
            localStorage.setItem('mathaio_cached_user', JSON.stringify(userObj));
          } catch {}
        } else if (e.detail?.user === null) {
          setCurrentUser(null);
          try {
            localStorage.removeItem('mathaio_cached_user');
          } catch {}
          return;
        }
      } else if (e?.detail === null) {
        setCurrentUser(null);
        try {
          localStorage.removeItem('mathaio_cached_user');
        } catch {}
        return;
      }
      fetchCurrentUser();
    };

    const handleOpenRenewModal = (e: Event) => {
      const customEvent = e as CustomEvent<OpenRenewModalOptions>;
      if (customEvent.detail) {
        setModalOptions(customEvent.detail);
      }
      setIsOpen(true);
    };

    window.addEventListener('auth-updated', handleAuthUpdated);
    window.addEventListener('user-updated', handleAuthUpdated);
    window.addEventListener('license-redeemed', handleAuthUpdated);
    window.addEventListener('open-renew-modal', handleOpenRenewModal);

    return () => {
      window.removeEventListener('auth-updated', handleAuthUpdated);
      window.removeEventListener('user-updated', handleAuthUpdated);
      window.removeEventListener('license-redeemed', handleAuthUpdated);
      window.removeEventListener('open-renew-modal', handleOpenRenewModal);
    };
  }, [fetchCurrentUser]);

  const openRenewModal = useCallback((opts?: OpenRenewModalOptions) => {
    if (opts) {
      setModalOptions(opts);
    }
    setIsOpen(true);
  }, []);

  const closeRenewModal = useCallback(() => {
    setIsOpen(false);
    setModalOptions({});
  }, []);

  const handleSuccess = useCallback(async (updatedUserOrKey: any) => {
    const userObj = updatedUserOrKey?.user || (updatedUserOrKey?.id ? updatedUserOrKey : null);
    if (userObj) {
      setCurrentUser((prev: any) => (prev ? { ...prev, ...userObj } : userObj));
    }
    fetchCurrentUser();
    window.dispatchEvent(new CustomEvent('auth-updated', { detail: updatedUserOrKey }));
    window.dispatchEvent(new CustomEvent('user-updated', { detail: userObj || updatedUserOrKey }));
    window.dispatchEvent(new CustomEvent('license-redeemed', { detail: updatedUserOrKey }));
  }, [fetchCurrentUser]);

  // Compute status for current logged-in user
  const licenseInfo = computeLicenseStatus({
    user: currentUser,
  });

  return (
    <RenewModalContext.Provider
      value={{
        isOpen,
        openRenewModal,
        closeRenewModal,
        currentUser,
        licenseInfo,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
      <RenewLicenseModal
        isOpen={isOpen}
        onClose={closeRenewModal}
        currentUser={currentUser}
        onSuccess={handleSuccess}
        isNearExpiry={modalOptions.isNearExpiry ?? licenseInfo.isNearExpiry}
        customTitle={modalOptions.customTitle}
        customDescription={modalOptions.customDescription}
      />
    </RenewModalContext.Provider>
  );
}

export function useRenewModal(): RenewModalContextType {
  const context = useContext(RenewModalContext);
  return context;
}
