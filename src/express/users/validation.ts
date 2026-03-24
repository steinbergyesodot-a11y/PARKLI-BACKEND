import { z } from "zod";

export const userSchemaZod = z.object({
  firstName: z.string().min(1, "First name is required").max(50).trim(),
  lastName: z.string().min(1, "Last name is required").max(50).trim(),
  email: z.string().email().max(100).trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
}).strict();


export const loginSchemaZod = z.object({
  email: z.string().email("Invalid email format").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
}).strict();

