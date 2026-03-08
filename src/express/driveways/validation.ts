import mongoose from "mongoose";
import { z } from "zod";

export const drivewaySchemaZod = z.object({
      ownerId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), {
        message: "Invalid ownerId",
}),
  name: z.string().min(2).max(100).trim(),
  address: z.string().min(5).max(200).trim(),
  description: z.string().min(1).max(1000).trim(),
  walk: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
    message: "walk must be a numeric string",
  }),
  price: z.preprocess(
    (v) => Number(v),
    z.number().positive()
  ),
  rules: z.preprocess((v) => {
    try {
      return JSON.parse(v as string);
    } catch {
      return null;
    }
  }, z.array(z.string()).nonempty("rules must be an array of strings")),
}).strict();
