"use server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { back, firstError, str } from "@/lib/forms";

const contactSchema = z.object({
  name: z.string().min(2, "Indica tu nombre").max(120),
  email: z.string().email("Correo electrónico no válido").max(160),
  phone: z.string().max(30),
  tracking: z.string().max(40),
  body: z.string().min(10, "Cuéntanos un poco más (mínimo 10 caracteres)").max(2000),
});

export async function sendContactMessage(fd: FormData) {
  const returnTo = str(fd, "return_to") === "/cuenta/soporte" ? "/cuenta/soporte" : "/";
  const anchor = returnTo === "/" ? "#contacto" : "";
  if (str(fd, "website")) back(returnTo, "ok", "Mensaje enviado."); // honeypot anti-spam
  const parsed = contactSchema.safeParse({
    name: str(fd, "name"), email: str(fd, "email"), phone: str(fd, "phone"), tracking: str(fd, "tracking").toUpperCase(), body: str(fd, "body"),
  });
  if (!parsed.success) back(returnTo + anchor, "error", firstError(parsed.error));
  const user = await getCurrentUser();
  await getDb().table("messages").insert({
    id: randomUUID(), ...parsed.data, customer_id: user?.customer?.id ?? null, status: "nuevo", created_at: new Date().toISOString(),
  });
  back(returnTo + anchor, "ok", "Recibimos tu mensaje. Nuestro equipo te contactará pronto.");
}
