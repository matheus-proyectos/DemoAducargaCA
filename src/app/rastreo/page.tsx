import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PackageSearch } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { getTrackingData, normalizeTracking } from "@/lib/services/packages";
import { DemoBanner, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { TrackingSearch } from "@/components/TrackingSearch";
import { TrackingView } from "@/components/TrackingView";
import { Card, EmptyState, sp } from "@/components/ui";

export const metadata: Metadata = { title: "Rastrear envío", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function RastreoPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const raw = sp(searchParams, "guia");
  const guia = raw ? normalizeTracking(raw).slice(0, 40) : "";
  const data = guia ? await getTrackingData(guia) : null;
  const user = await getCurrentUser();
  const owner = !!data && !!user && (isStaff(user.profile) || user.customer?.id === data.pkg.customer_id);
  const detailHref = data && user ? (isStaff(user.profile) ? `/admin/paquetes/${data.pkg.id}` : `/cuenta/paquetes/${data.pkg.tracking}`) : null;

  return (
    <>
      <DemoBanner />
      <SiteHeader />
      <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Rastrea tu envío</h1>
          <p className="mt-1 text-slate-500">Introduce tu número de guía para ver cada movimiento de tu paquete.</p>
          <div className="mt-5 max-w-3xl"><TrackingSearch defaultValue={guia} size="md" /></div>
        </div>

        {!guia && (
          <EmptyState
            icon={<PackageSearch className="h-6 w-6" />}
            title="Tu número de guía tiene el formato ADU-AAAA-000000"
            text="Lo encuentras en tu panel de cliente y en cada notificación que te enviamos."
            action={<Link href="/rastreo?guia=ADU-2026-000125" className="btn-ghost">Ver una guía de demostración</Link>}
          />
        )}

        {guia && !data && (
          <EmptyState
            icon={<PackageSearch className="h-6 w-6" />}
            title={`No encontramos la guía ${guia}`}
            text="Verifica que el número esté completo (ADU-AAAA-000000). Si acabas de prealertar tu compra, puede tardar unos minutos en aparecer."
            action={<Link href="/#contacto" className="btn-ghost">Contactar a atención al cliente</Link>}
          />
        )}

        {data && (
          <TrackingView data={data} isPrivate={owner}>
            <Card className="p-5 sm:p-6">
              {owner && detailHref ? (
                <Link href={detailHref} className="btn-brand w-full">Ver detalle completo <ArrowRight className="h-4 w-4" /></Link>
              ) : (
                <>
                  <p className="text-sm text-slate-600">¿Es tu paquete? Inicia sesión para ver fotografías, dimensiones y todos los detalles.</p>
                  <Link href={`/login?next=/cuenta/paquetes/${data.pkg.tracking}`} className="btn-brand mt-4 w-full">Iniciar sesión</Link>
                </>
              )}
            </Card>
          </TrackingView>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
