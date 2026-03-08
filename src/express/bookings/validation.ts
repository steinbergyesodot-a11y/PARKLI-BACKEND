import { z } from "zod";
import mongoose from "mongoose";

export const bookingSchemaZod = z.object({
  ownerId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), {
    message: "Invalid ownerId",
  }),
  drivewayId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), {
    message: "Invalid drivewayId",
  }),
  renterId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), {
    message: "Invalid renterId",
  }),
  address: z.string().min(1).max(200).trim(),
  price: z.number().positive(),
  gameDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "gameDate must be YYYY-MM-DD",
  }),
  parkingBegins: z.string().regex(/^\d{1,2}:\d{2}$/, {
    message: "parkingBegins must be HH:mm",
  }),
  paymentIntentId: z.string().min(1),
  visiting_team: z.string().min(1).trim(),
}).strict();


export const paymentIntentSchemaZod = z.object({
  ownerId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), {
    message: "Invalid ownerId",
  }),
  drivewayId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), {
    message: "Invalid drivewayId",
  }),
  renterId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), {
    message: "Invalid renterId",
  }),
  address: z.string().min(1).max(200).trim(),
  price: z.number().positive(),
  gameDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "gameDate must be YYYY-MM-DD",
  }),

  // UPDATED FIELD
  parkingBegins: z.preprocess((val) => {
    if (typeof val !== "string") return val;

    // Match "12:20 PM" or "7:05 AM"
    const ampm = val.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
    if (ampm) {
      let [_, hour, minute, period] = ampm;
      let h = Number(hour);

      if (period.toUpperCase() === "PM" && h !== 12) h += 12;
      if (period.toUpperCase() === "AM" && h === 12) h = 0;

      return `${String(h).padStart(2, "0")}:${minute}`;
    }

    // Otherwise return unchanged (for 24-hour format)
    return val;
  }, z.string().regex(/^\d{2}:\d{2}$/, {
    message: "parkingBegins must be HH:mm (24-hour format)",
  })),

  visiting_team: z.string().min(1).trim(),
}).strict();
