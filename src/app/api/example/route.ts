import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/errors/handlers";
import { requireAuth } from "@/lib/auth/helpers";
// import { prisma } from "@/lib/db/prisma"; // Uncomment when you need to use Prisma

/**
 * Example API Route Handler
 *
 * Use Route Handlers for:
 * - Webhooks (Stripe, etc.)
 * - Public API endpoints
 * - Cron jobs (Vercel Cron)
 * - File uploads
 * - OAuth callbacks
 *
 * Server Actions are preferred for internal mutations/forms
 */

// GET /api/example
export async function GET(request: NextRequest) {
  try {
    // Optional: require authentication
    const user = await requireAuth();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Example: Fetch data with pagination
    // const items = await prisma.someModel.findMany({
    //   where: { userId: user.id },
    //   take: limit,
    //   skip: (page - 1) * limit,
    //   orderBy: { createdAt: "desc" },
    // });

    const items = [
      { id: "1", name: "Item 1", userId: user.id },
      { id: "2", name: "Item 2", userId: user.id },
    ];

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        // total: await prisma.someModel.count({ where: { userId: user.id } }),
        total: 2,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/example
const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Parse and validate body
    const body = await request.json();
    const validated = createSchema.parse(body);

    // Create resource
    // const item = await prisma.someModel.create({
    //   data: {
    //     name: validated.name,
    //     description: validated.description,
    //     userId: user.id,
    //   },
    // });

    const item = {
      id: "new-id",
      ...validated,
      userId: user.id,
      createdAt: new Date(),
    };

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/example
const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const validated = updateSchema.parse(body);

    // Update resource
    // Check ownership first
    // const item = await prisma.someModel.findUnique({
    //   where: { id: validated.id },
    // });
    //
    // if (!item || item.userId !== user.id) {
    //   throw new ForbiddenError();
    // }
    //
    // const updated = await prisma.someModel.update({
    //   where: { id: validated.id },
    //   data: validated,
    // });

    const updated = { ...validated, userId: user.id };

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/example
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Delete resource
    // await prisma.someModel.delete({
    //   where: { id },
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
