"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";
import { handleServerActionError, success } from "@/lib/errors/handlers";
// import { prisma } from "@/lib/db/prisma"; // Uncomment when you need to use Prisma
import { revalidatePath } from "next/cache";

/**
 * Example Server Action
 *
 * Server Actions are for:
 * - Form submissions
 * - Internal mutations
 * - Actions triggered by user interactions
 *
 * Best practices:
 * 1. Always validate input with Zod
 * 2. Use try/catch and standardized error handling
 * 3. Check authentication/authorization
 * 4. Return typed results (success/error)
 * 5. Revalidate cache when needed
 */

// Input validation schema
const createItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
});

export async function createItemAction(
  input: z.infer<typeof createItemSchema>
) {
  try {
    // 1. Validate input
    const validated = createItemSchema.parse(input);

    // 2. Check authentication
    const user = await requireAuth();

    // 3. Business logic
    // Example: Create a record in the database
    // const item = await prisma.someModel.create({
    //   data: {
    //     name: validated.name,
    //     description: validated.description,
    //     userId: user.id,
    //   },
    // });

    // For demonstration, return mock data
    const item = {
      id: "mock-id",
      name: validated.name,
      description: validated.description,
      userId: user.id,
    };

    // 4. Revalidate relevant paths
    revalidatePath("/dashboard");

    // 5. Return success
    return success(item);
  } catch (error) {
    return handleServerActionError(error);
  }
}

// Another example: Update action
const updateItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

export async function updateItemAction(
  input: z.infer<typeof updateItemSchema>
) {
  try {
    const validated = updateItemSchema.parse(input);
    const user = await requireAuth();

    // Check ownership or permissions
    // const item = await prisma.someModel.findUnique({
    //   where: { id: validated.id },
    // });
    //
    // if (!item || item.userId !== user.id) {
    //   throw new ForbiddenError("You don't own this item");
    // }

    // Update the item
    // const updated = await prisma.someModel.update({
    //   where: { id: validated.id },
    //   data: {
    //     ...(validated.name && { name: validated.name }),
    //     ...(validated.description && { description: validated.description }),
    //   },
    // });

    const updated = { ...validated, userId: user.id };

    revalidatePath("/dashboard");
    revalidatePath(`/items/${validated.id}`);

    return success(updated);
  } catch (error) {
    return handleServerActionError(error);
  }
}

// Example: Delete action
export async function deleteItemAction(id: string) {
  try {
    await requireAuth();

    // Check ownership
    // const item = await prisma.someModel.findUnique({
    //   where: { id },
    // });
    //
    // if (!item || item.userId !== _user.id) {
    //   throw new ForbiddenError("You don't own this item");
    // }

    // Delete
    // await prisma.someModel.delete({
    //   where: { id },
    // });

    revalidatePath("/dashboard");

    return success({ id });
  } catch (error) {
    return handleServerActionError(error);
  }
}
