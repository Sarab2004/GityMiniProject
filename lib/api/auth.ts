import { apiGet } from "./_client";

export interface MeProfile {
  username: string;
  display_name?: string | null;
  is_staff: boolean;
  is_superuser: boolean;
}

export function getMyProfile(): Promise<MeProfile> {
  return apiGet<MeProfile>("/auth/me/profile/");
}
