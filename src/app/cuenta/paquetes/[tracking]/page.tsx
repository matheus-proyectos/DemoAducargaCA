import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireClient } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getTrackingData } from "@/lib/services/packages";
import { PackageFacts } from "@/components/PackageFacts";
import { TrackingView } from "@/components/TrackingView";
import { Flash } from "@/components/ui";

export default async function ClientPackage({ params, searchParams }: { params: { tracking: string }; searchParams: Record<string, string | string[] | undefined> }) {
  const { customer } = await requireClient();
  const data = await getTrackingData(decodeURIComponent(params.tracking));
  // Un cliente solo puede ver sus propios paquetes (404 para no revelar existencia).
  if (!data || data.pkg.customer_id !== customer.id) notFound();
  const address = data.pkg.address_id ? await getDb().table("addresses").get(data.pkg.address_id) : null;
  return (
    <div>
      <Link href="/cuenta" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand"><ArrowLeft className="h-4 w-4" /> Volver a mis envíos</Link>
      <Flash searchParams={searchParams} />
      <TrackingView data={data} isPrivate>
        <PackageFacts pkg={data.pkg} address={address} shipment={data.shipment} />
      </TrackingView>
    </div>
  );
}
