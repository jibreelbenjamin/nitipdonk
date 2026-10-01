import { cookies, headers } from "next/headers";
import { InstallAppAlertClient } from "@/components/install-app-button";
import { INSTALL_ALERT_COOKIE } from "@/lib/constants";

/**
 * Saran unduh aplikasi daripada pakai web, khusus browser HP Android yang belum menutupnya.
 * Dicek di server supaya saran sudah ada sejak halaman pertama tampil, tidak menggeser isinya.
 */
export async function InstallAppAlert({ className }: { className?: string }) {
  const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()]);
  const isAndroid = /Android/i.test(requestHeaders.get("user-agent") ?? "");
  if (!isAndroid || cookieStore.has(INSTALL_ALERT_COOKIE)) return null;
  return <InstallAppAlertClient className={className} />;
}
