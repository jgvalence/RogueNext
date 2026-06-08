"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { ConflictError } from "@/lib/errors/types";
import { handleServerActionError, success } from "@/lib/errors/handlers";

const signUpSchema = z.object({
  username: z.string().trim().min(3).max(30),
  password: z.string().min(6).max(100),
});

export async function signUpAction(input: z.infer<typeof signUpSchema>) {
  try {
    const validated = signUpSchema.parse(input);

    const existingUser = await prisma.user.findUnique({
      where: { username: validated.username },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictError("Ce pseudo est déjà utilisé.");
    }

    const hashedPassword = await hash(validated.password, 12);

    await prisma.user.create({
      data: {
        username: validated.username,
        name: validated.username,
        password: hashedPassword,
      },
    });

    revalidatePath("/");

    return success({ username: validated.username });
  } catch (error) {
    return handleServerActionError(error);
  }
}
