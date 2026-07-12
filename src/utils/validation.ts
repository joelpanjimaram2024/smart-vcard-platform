/**
 * Validation utilities for Smart vCard Platform
 */

export interface ValidationResult {
 valid: boolean;
 errors: string[];
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 return emailRegex.test(email);
}

/**
 * Validate password strength (minimum 8 characters)
 */
export function isValidPassword(password: string): ValidationResult {
 const errors: string[] = [];

 if (!password) {
 errors.push('Password is required');
 return { valid: false, errors };
 }

 if (password.length < 8) {
 errors.push('Password must be at least 8 characters long');
 }

 if (!/[A-Z]/.test(password)) {
 errors.push('Password must contain at least one uppercase letter');
 }

 if (!/[a-z]/.test(password)) {
 errors.push('Password must contain at least one lowercase letter');
 }

 if (!/\d/.test(password)) {
 errors.push('Password must contain at least one number');
 }

 return {
 valid: errors.length === 0,
 errors
 };
}

/**
 * Validate name (must be 2+ characters, no special chars except spaces and hyphens)
 */
export function isValidName(name: string): boolean {
 if (!name) return false;
 const nameRegex = /^[a-zA-Z\s\-']{2,}$/;
 return nameRegex.test(name.trim());
}

/**
 * Validate user registration data
 */
export function validateUserRegistration(data: {
 name: string;
 email: string;
 password: string;
 role?: string;
 companyName?: string;
}): ValidationResult {
 const errors: string[] = [];

 if (!data.name || !isValidName(data.name)) {
 errors.push('Please provide a valid name (minimum 2 characters)');
 }

 if (!data.email || !isValidEmail(data.email)) {
 errors.push('Please provide a valid email address');
 }

 const passwordValidation = isValidPassword(data.password);
 if (!passwordValidation.valid) {
 errors.push(...passwordValidation.errors);
 }

 if (data.role === 'company_admin' && !data.companyName) {
 errors.push('Company name is required for company admin registration');
 }

 return {
 valid: errors.length === 0,
 errors
 };
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
 if (!input) return '';
 return input
 .replace(/&/g, '&amp;')
 .replace(/</g, '&lt;')
 .replace(/>/g, '&gt;')
 .replace(/"/g, '&quot;')
 .replace(/'/g, '&#x27;');
}

/**
 * Sanitize object keys to prevent prototype pollution
 */
export function sanitizeObject<T extends object>(obj: T): T {
 const sanitized: any = {};
 const disallowed = ['__proto__', 'constructor', 'prototype'];

 for (const [key, value] of Object.entries(obj)) {
 if (!disallowed.includes(key)) {
 sanitized[key] = typeof value === 'object' && value !== null ? sanitizeObject(value) : value;
 }
 }

 return sanitized;
}
