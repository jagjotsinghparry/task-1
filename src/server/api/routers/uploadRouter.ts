import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const uploadRouter = createTRPCRouter({
  uploadFormDataAndCV: publicProcedure
    .input(
      z.object({
        fullName: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        skills: z.string().optional(),
        experience: z.string().optional(),
        file: z.any(), // base64 string from frontend
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Save User in DB (or update if email already exists)
      let user = await ctx.db.user.upsert({
        where: { email: input.email },
        update: {
          fullName: input.fullName,
          phone: input.phone,
          skills: input.skills,
          experience: input.experience,
        },
        create: {
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          skills: input.skills,
          experience: input.experience,
        },
      });

      // 2. Save PDF file locally (e.g., /uploads/{id}.pdf)
      const uploadDir = path.join(process.cwd(), "uploads");
      await fs.mkdir(uploadDir, { recursive: true });

      const fileBuffer = Buffer.from(input.file, "base64");
      const filePath = path.join(uploadDir, `${user.id}-${Date.now()}.pdf`);
      await fs.writeFile(filePath, fileBuffer);

      // 3. Create CVUpload record
      const cvUpload = await ctx.db.cVUpload.create({
        data: {
          userId: user.id,
          filePath,
          validationStatus: "PENDING",
        },
      });

      return { id: cvUpload.id };
    }),
  getValidationResult: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const cvUpload = await ctx.db.cVUpload.findUnique({
        where: { id: input.id },
        include: { user: true },
      });

      if (!cvUpload) {
        throw new Error("Result not found");
      }

      return {
        status: cvUpload.validationStatus,
        mismatches: cvUpload.mismatchedFields,
        user: {
          fullName: cvUpload.user.fullName,
          email: cvUpload.user.email,
        },
      };
    }),
});
