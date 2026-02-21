"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { ConflictError } from "@/lib/errors/types";
import { handleServerActionError, success } from "@/lib/errors/handlers";

const signUpSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6).max(100),
});

export async function signUpAction(input: z.infer<typeof signUpSchema>) {
  try {
    const validated = signUpSchema.parse(input);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictError("Un compte existe deja avec cet email.");
    }

    const hashedPassword = await hash(validated.password, 12);

    await prisma.user.create({
      data: {
        email: validated.email,
        name: validated.name || null,
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });

    revalidatePath("/");

    return success({ email: validated.email });
  } catch (error) {
    return handleServerActionError(error);
  }
}
