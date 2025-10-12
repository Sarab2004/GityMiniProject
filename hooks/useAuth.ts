import { useCallback, useEffect, useMemo, useState } from "react";
import { getMyProfile, type MeProfile } from "@/lib/api/auth";

interface UseMeProfileState {
  data: MeProfile | null;
  loading: boolean;
  error: string | null;
}

export function useMeProfile() {
  const [state, setState] = useState<UseMeProfileState>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchProfile = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const profile = await getMyProfile();
      setState({ data: profile, loading: false, error: null });
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("[useMeProfile] isAdmin:", Boolean(profile.is_staff || profile.is_superuser));
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load profile.";
      setState({ data: null, loading: false, error: message });
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn("[useMeProfile] profile fetch failed:", message);
      }
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const isAdmin = useMemo(() => {
    return Boolean(state.data?.is_staff || state.data?.is_superuser);
  }, [state.data]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    isAdmin,
    refresh: fetchProfile,
  };
}
