/**
 * Carga los DATOS DE DEMOSTRACIÓN en Supabase (opcional).
 * Requiere haber ejecutado supabase/schema.sql y definir en el entorno:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Uso:  npm run seed:supabase
 * Crea las cuentas demo en Supabase Auth y vincula sus perfiles.
 */
import { createClient } from "@supabase/supabase-js";
import { buildSeed, DEMO_ACCOUNTS } from "../src/lib/seed";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const seed = await buildSeed();

  const ins = async (table: string, rows: object[]) => {
    if (!rows.length) return;
    const { error } = await sb.from(table).upsert(rows);
    if (error) throw new Error(`${table}: ${error.message}`);
    console.log(`✔ ${table}: ${rows.length}`);
  };

  await ins("statuses", seed.statuses);
  await ins("customers", seed.customers);
  await ins("addresses", seed.addresses);
  await ins("shipments", seed.shipments);
  await ins("packages", seed.packages);
  await ins("movements", seed.movements);
  await ins("notifications", seed.notifications);

  for (const p of seed.profiles) {
    const acc = DEMO_ACCOUNTS.find((a) => a.email === p.email)!;
    const { data, error } = await sb.auth.admin.createUser({ email: acc.email, password: acc.password, email_confirm: true });
    let id = data.user?.id;
    if (error) {
      const { data: list } = await sb.auth.admin.listUsers();
      id = list.users.find((u) => u.email === acc.email)?.id;
      if (!id) throw error;
    }
    await ins("profiles", [{ ...p, id }]);
  }
  for (const [name, value] of Object.entries(seed.sequences)) await ins("sequences", [{ name, value }]);
  console.log("Datos de demostración cargados.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
