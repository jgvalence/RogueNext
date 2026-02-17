import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError, ErrorCode, InternalError, ValidationError } from "./types";
import { env } from "@/lib/env";

/**
 * Error Handler for API Routes
 *
 * Converts errors into standardized HTTP responses
 */
export function handleApiError(error: unknown): NextResponse {
  // Log error for monitoring (Sentry will capture this)
  console.error("API Error:", error);

  // App errors (business logic)
  if (error instanceof AppError) {
    return NextResponse.json(error.toJSON(), {
      status: error.statusCode,
    });
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    const validationError = new ValidationError(
      "Validation failed",
      undefined,
      { issues: error.issues }
    );
    return NextResponse.json(validationError.toJSON(), {
      status: validationError.statusCode,
    });
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  // Unknown errors (should be caught by Sentry)
  const internalError = new InternalError(
    env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : error instanceof Error
        ? error.message
        : "Unknown error"
  );

  return NextResponse.json(internalError.toJSON(), {
    status: internalError.statusCode,
  });
}

/**
 * Error Handler for Server Actions
 *
 * Server Actions should return errors as data, not throw
 * Use this to format errors consistently
 */
export function handleServerActionError(error: unknown) {
  console.error("Server Action Error:", error);

  if (error instanceof AppError) {
    return {
      success: false as const,
      error: {
        code: error.code,
        message: error.message,
        field: error.field,
        metadata: error.metadata,
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      success: false as const,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: "Validation failed",
        issues: error.issues,
      },
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = convertPrismaError(error);
    return {
      success: false as const,
      error: {
        code: prismaError.code,
        message: prismaError.message,
      },
    };
  }

  return {
    success: false as const,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message:
        env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : error instanceof Error
            ? error.message
            : "Unknown error",
    },
  };
}

/**
 * Convert Prisma errors to AppErrors
 */
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError
): NextResponse {
  const appError = convertPrismaError(error);
  return NextResponse.json(appError.toJSON(), {
    status: appError.statusCode,
  });
}

function convertPrismaError(
  error: Prisma.PrismaClientKnownRequestError
): AppError {
  switch (error.code) {
    case "P2002": {
      // Unique constraint violation
      const field = error.meta?.target as string | undefined;
      return new AppError({
        code: ErrorCode.CONFLICT,
        message: `A record with this ${field || "value"} already exists`,
        statusCode: 409,
        field: field,
        metadata: { prismaCode: error.code },
      });
    }
    case "P2025": {
      // Record not found
      return new AppError({
        code: ErrorCode.NOT_FOUND,
        message: "Record not found",
        statusCode: 404,
        metadata: { prismaCode: error.code },
      });
    }
    case "P2003": {
      // Foreign key constraint violation
      return new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Invalid reference to related record",
        statusCode: 400,
        metadata: { prismaCode: error.code },
      });
    }
    default: {
      return new InternalError("Database error", {
        prismaCode: error.code,
        message: error.message,
      });
    }
  }
}

/**
 * Type guard to check if an error is operational
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Success response helper for Server Actions
 */
export function success<T>(data: T) {
  return {
    success: true as const,
    data,
  };
}

/**
 * Type for Server Action results
 */
export type ActionResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code: ErrorCode;
        message: string;
        field?: string;
        metadata?: Record<string, unknown>;
        issues?: unknown;
      };
    };
