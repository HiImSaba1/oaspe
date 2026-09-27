"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { contactSchema, type ContactInput } from "@/lib/contact-schema";
import { MagneticFillButton } from "@/components/ui/magnetic-fill-button";

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactInput>({ resolver: zodResolver(contactSchema), defaultValues: { website: "" } });
  async function onSubmit(values: ContactInput) {
    setBusy(true);
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Δεν ήταν δυνατή η αποστολή.");
      reset(); toast.success("Το μήνυμά σας στάλθηκε.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Παρουσιάστηκε σφάλμα."); }
    finally { setBusy(false); }
  }
  return (
    <form className="contact-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-row"><Field label="Ονοματεπώνυμο" error={errors.name?.message}><input autoComplete="name" {...register("name")} /></Field><Field label="Email" error={errors.email?.message}><input type="email" autoComplete="email" {...register("email")} /></Field></div>
      <Field label="Θέμα" error={errors.subject?.message}><input {...register("subject")} /></Field>
      <Field label="Μήνυμα" error={errors.message?.message}><textarea rows={6} {...register("message")} /></Field>
      <div className="honey" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" {...register("website")} /></label></div>
      <div className="contact-submit-row"><MagneticFillButton className="submit-button" disabled={busy} type="submit">{busy ? "Αποστολή…" : "Αποστολή μηνύματος"}</MagneticFillButton><p>Θα χρησιμοποιήσουμε τα στοιχεία σας μόνο για να απαντήσουμε στο μήνυμά σας.</p></div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) { return <label className="field"><span>{label}</span>{children}{error ? <small role="alert">{error}</small> : null}</label>; }
