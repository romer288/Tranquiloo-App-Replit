import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { storage } from '../storage';

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'patient' | 'therapist';
      };
    }
  }
}

/**
 * Authentication middleware that validates Supabase auth tokens
 * and attaches user info to the request object.
 *
 * Checks for Authorization header with Bearer token.
 * Verifies token with Supabase Auth.
 * Loads user profile from database.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[Auth] No authorization header found');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.warn('[Auth] Invalid token:', error?.message);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired authentication token'
      });
    }

    // Get user profile from database
    const profile = await storage.getProfile(user.id);

    if (!profile) {
      console.warn('[Auth] User authenticated but profile not found:', user.id);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User profile not found. Please complete registration.'
      });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email || profile.email || '',
      role: profile.role as 'patient' | 'therapist'
    };

    console.log('[Auth] Authenticated user:', req.user.email, 'Role:', req.user.role);
    next();
  } catch (error) {
    console.error('[Auth] Authentication error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
}

/**
 * Optional authentication middleware - attaches user if token is present,
 * but doesn't require authentication. Useful for routes that work differently
 * for authenticated vs unauthenticated users.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // Invalid token, continue without user
      return next();
    }

    const profile = await storage.getProfile(user.id);

    if (profile) {
      req.user = {
        id: user.id,
        email: user.email || profile.email || '',
        role: profile.role as 'patient' | 'therapist'
      };
    }

    next();
  } catch (error) {
    console.error('[Auth] Optional auth error:', error);
    next(); // Continue without user on error
  }
}

/**
 * Role-based authorization middleware.
 * Must be used AFTER requireAuth middleware.
 */
export function requireRole(...allowedRoles: Array<'patient' | 'therapist'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.warn('[Auth] Access denied. User role:', req.user.role, 'Required:', allowedRoles);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
}
