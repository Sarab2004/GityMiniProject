import { usePermissions } from "../hooks/usePermissions";
import type { Resource } from "../types/admin";

function _probe() {
  const { can } = usePermissions(); // فقط تایپ‌چک؛ فراخوانی واقعی انجام نمی‌دهیم
  const ok: boolean = can("forms" as Resource, "create");
  return ok ? "OK" : "NO";
}
