import { z } from "zod";

export const GenerateCertificateSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type GenerateCertificatePayload = z.infer<
  typeof GenerateCertificateSchema
>;
