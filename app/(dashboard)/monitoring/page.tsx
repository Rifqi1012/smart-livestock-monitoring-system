import { auth } from "@/auth";
import MonitoringDetailed from "@/components/monitoring/MonitoringDetailed";
import MonitoringSimple from "@/components/monitoring/MonitoringSimple";

export default async function MonitoringPage() {
  const session = await auth();
  if (session?.user?.role === "petugas_kandang") return <MonitoringSimple />;
  return <MonitoringDetailed />;
}
