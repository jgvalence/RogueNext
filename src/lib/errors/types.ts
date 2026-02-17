/**
 * Standard Error Types
 *
 * This provides a consistent way to handle errors across the application
 * Differentiates between business errors (expected) and technical errors (unexpected)
 */

export enum ErrorCode {
  // Authentication & Authorization (401, 403)
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  SESSION_EXPIRED = "SESSION_EXPIRED",

  // Validation (400)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",

  // Not Found (404)
  NOT_FOUND = "NOT_FOUND",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",

  // Conflict (409)
  CONFLICT = "CONFLICT",
  ALREADY_EXISTS = "ALREADY_EXISTS",

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Server Errors (500)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",

  // Business Logic Errors
  INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  INVALID_STATE = "INVALID_STATE",
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  statusCode: number;
  field?: string; // For validation errors
  metadata?: Record<string, unknown>;
}

/**
 * Base Application Error
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly field?: string;
  public readonly metadata?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(details: ErrorDetails, isOperational = true) {
    super(details.message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.code = details.code;
    this.statusCode = details.statusCode;
    this.field = details.field;
    this.metadata = details.metadata;
    this.isOperational = isOperational;

    Error.captureStackTrace(this);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.field && { field: this.field }),
      ...(this.metadata && { metadata: this.metadata }),
    };
  }
}

/**
 * Specific Error Classes
 */

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super({
      code: ErrorCode.UNAUTHORIZED,
      message,
      statusCode: 401,
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super({
      code: ErrorCode.FORBIDDEN,
      message,
      statusCode: 403,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource", message?: string) {
    super({
      code: ErrorCode.NOT_FOUND,
      message: message || `${resource} not found`,
      statusCode: 404,
    });
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    field?: string,
    metadata?: Record<string, unknown>
  ) {
    super({
      code: ErrorCode.VALIDATION_ERROR,
      message,
      statusCode: 400,
      field,
      metadata,
    });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super({
      code: ErrorCode.CONFLICT,
      message,
      statusCode: 409,
      metadata,
    });
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super({
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message,
      statusCode: 429,
    });
  }
}

export class InternalError extends AppError {
  constructor(
    message = "Internal server error",
    metadata?: Record<string, unknown>
  ) {
    super(
      {
        code: ErrorCode.INTERNAL_ERROR,
        message,
        statusCode: 500,
        metadata,
      },
      false // Not operational - unexpected error
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database error", metadata?: Record<string, unknown>) {
    super(
      {
        code: ErrorCode.DATABASE_ERROR,
        message,
        statusCode: 500,
        metadata,
      },
      false // Not operational
    );
  }
}

/**
 * Business Logic Errors (operational - expected in normal flow)
 */

export class InsufficientStockError extends AppError {
  constructor(productName: string, available: number) {
    super({
      code: ErrorCode.INSUFFICIENT_STOCK,
      message: `Insufficient stock for ${productName}`,
      statusCode: 400,
      metadata: { productName, available },
    });
  }
}

export class PaymentFailedError extends AppError {
  constructor(reason?: string) {
    super({
      code: ErrorCode.PAYMENT_FAILED,
      message: reason || "Payment failed",
      statusCode: 402,
      metadata: { reason },
    });
  }
}
