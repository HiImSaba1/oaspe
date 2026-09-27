import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Συμπληρώστε το όνομά σας.").max(100),
  email: z.email("Συμπληρώστε ένα έγκυρο email."),
  subject: z.string().trim().min(3, "Συμπληρώστε το θέμα.").max(160),
  message: z.string().trim().min(10, "Το μήνυμα πρέπει να έχει τουλάχιστον 10 χαρακτήρες.").max(5000),
  website: z.string().trim().max(250).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
