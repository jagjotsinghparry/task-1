import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import axios from "axios";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { env } from "~/env";

export const validateRouter = createTRPCRouter({
  validateUpload: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch upload & related user
      const cvUpload = await ctx.db.cVUpload.findUnique({
        where: { id: input.id },
        include: { user: true },
      });
      if (!cvUpload) throw new Error("CV upload not found");

      // 2. Read PDF & convert to base64
      const filePath = path.resolve(cvUpload.filePath);
      const fileBuffer = await fs.readFile(filePath);
      const base64File = fileBuffer.toString("base64");


      // 3. Send request to n8n webhook
      const response = await axios.post(`${env.CV_COMPARISON_URL}/webhook/cv-comparison`, {
        file: base64File,
        fullName: cvUpload.user.fullName,
        email: cvUpload.user.email,
        phone: cvUpload.user.phone,
        skills: cvUpload.user.skills,
        experience: cvUpload.user.experience,
      });

      const { status, mismatches } = response.data;

      // 4. Save result back to DB
      await ctx.db.cVUpload.update({
        where: { id: cvUpload.id },
        data: {
          validationStatus: status,
          mismatchedFields: mismatches ? JSON.stringify(mismatches) : {},
        },
      });

      // 5. Return result to frontend
      return { status };
    })
});
