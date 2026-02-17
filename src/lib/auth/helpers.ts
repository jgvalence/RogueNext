import { auth } from "./config";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors/types";
import { UserRole } from "@prisma/client";
import { cache } from "react";

/**
 * Get the current session (cached)
 * Use this in Server Components and Server Actions
 */
export const getSession = cache(async () => {
  return await auth();
});

/**
 * Get the current user or throw an error if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session?.user) {
    throw new UnauthorizedError(
      "You must be signed in to access this resource"
    );
  }

  return session.user;
}

/**
 * Require specific role(s) to access a resource
 */
export async function requireRole(...roles: UserRole[]) {
  const user = await requireAuth();

  if (!roles.includes(user.role)) {
    throw new ForbiddenError(
      `This resource requires one of the following roles: ${roles.join(", ")}`
    );
  }

  return user;
}

/**
 * Require admin role
 */
export async function requireAdmin() {
  return await requireRole(UserRole.ADMIN);
}

/**
 * Check if user has a specific role (doesn't throw)
 */
export async function hasRole(...roles: UserRole[]): Promise<boolean> {
  const session = await getSession();

  if (!session?.user) {
    return false;
  }

  return roles.includes(session.user.role);
}

/**
 * Check if user is admin (doesn't throw)
 */
export async function isAdmin(): Promise<boolean> {
  return await hasRole(UserRole.ADMIN);
}

/**
 * Check if user owns a resource (for authorization)
 */
export async function requireOwnership(resourceUserId: string) {
  const user = await requireAuth();

  // Admins can access everything
  if (user.role === UserRole.ADMIN) {
    return user;
  }

  // Check ownership
  if (user.id !== resourceUserId) {
    throw new ForbiddenError(
      "You don't have permission to access this resource"
    );
  }

  return user;
}

/**
 * Check if current user can perform an action
 * This is a simple RBAC helper - you can extend this for ABAC
 */
export async function can(
  _action: string,
  _resource?: string
): Promise<boolean> {
  const session = await getSession();

  if (!session?.user) {
    return false;
  }

  // Admin can do everything
  if (session.user.role === UserRole.ADMIN) {
    return true;
  }

  // Add your custom permission logic here
  // For example:
  // if (_action === "delete" && _resource === "post") {
  //   return session.user.role === UserRole.MODERATOR;
  // }

  return false;
}
