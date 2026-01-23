/**
 * Password Service
 * 
 * Handles password hashing and comparison.
 */

import bcrypt from 'bcryptjs';

// Password configuration
const SALT_ROUNDS = 10;

/**
 * Hash a password
 */
export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain password with hashed password
 */
export const comparePassword = async (
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> => {
    return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Check if passwords match (for update scenarios)
 */
export const passwordsMatch = async (
    newPassword: string,
    existingHashedPassword: string
): Promise<boolean> => {
    return bcrypt.compare(newPassword, existingHashedPassword);
};

// Export as PasswordService object for convenience
export const PasswordService = {
    hash: hashPassword,
    compare: comparePassword,
    matches: passwordsMatch,
};
