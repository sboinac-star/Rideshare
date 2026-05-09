import { NextRequest } from 'next/server';

// Input validation utilities
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateRequired(value: any, fieldName: string): string {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new ValidationError(`${fieldName} is required`);
  }
  return typeof value === 'string' ? value.trim() : value;
}

export function validateEmail(email: string): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleanEmail = validateRequired(email, 'Email');
  if (!emailRegex.test(cleanEmail)) {
    throw new ValidationError('Invalid email format');
  }
  return cleanEmail;
}

export function validatePhone(phone: string): string {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
  const cleanPhone = validateRequired(phone, 'Phone number');
  if (!phoneRegex.test(cleanPhone)) {
    throw new ValidationError('Invalid phone number format');
  }
  return cleanPhone;
}

export function validateStringLength(value: string, fieldName: string, min: number = 1, max: number = 255): string {
  const cleanValue = validateRequired(value, fieldName);
  if (cleanValue.length < min) {
    throw new ValidationError(`${fieldName} must be at least ${min} characters`);
  }
  if (cleanValue.length > max) {
    throw new ValidationError(`${fieldName} must be less than ${max} characters`);
  }
  return cleanValue;
}

export function validateNumber(value: any, fieldName: string, min?: number, max?: number): number {
  const num = Number(value);
  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }
  if (min !== undefined && num < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`);
  }
  if (max !== undefined && num > max) {
    throw new ValidationError(`${fieldName} must be at most ${max}`);
  }
  return num;
}

export function validateDate(dateString: string, fieldName: string = 'Date'): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new ValidationError(`Invalid ${fieldName} format`);
  }
  // Ensure date is not in the past
  const now = new Date();
  if (date < now) {
    throw new ValidationError(`${fieldName} cannot be in the past`);
  }
  return date;
}

export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .trim();
}

// Rate limiting helper (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const key = `${identifier}_${Math.floor(now / windowMs)}`;

  const current = requestCounts.get(key) || { count: 0, resetTime: now + windowMs };

  if (now > current.resetTime) {
    current.count = 1;
    current.resetTime = now + windowMs;
  } else {
    current.count++;
  }

  requestCounts.set(key, current);

  // Clean up old entries
  for (const [k, v] of requestCounts.entries()) {
    if (now > v.resetTime) {
      requestCounts.delete(k);
    }
  }

  return current.count <= maxRequests;
}

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production'
    ? 'https://your-domain.com' // Replace with your actual domain
    : 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Handle CORS preflight requests
export function handleCors(req: NextRequest): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
  return null;
}