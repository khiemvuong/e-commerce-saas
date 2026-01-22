/**
 * User Repository Interface
 * 
 * Defines the contract for user data access.
 * Infrastructure layer implements this interface.
 */

import { User } from './User';

export interface UserRepository {
    /**
     * Find user by ID
     */
    findById(id: string): Promise<User.Type | null>;

    /**
     * Find user by email
     */
    findByEmail(email: string): Promise<User.Type | null>;

    /**
     * Find user by ID with avatar
     */
    findByIdWithAvatar(id: string): Promise<(User.Type & { avatar: { file_url: string }[] }) | null>;

    /**
     * Create a new user
     */
    create(data: {
        name: string;
        email: string;
        password: string;
        role: string;
    }): Promise<User.Type>;

    /**
     * Update user by ID
     */
    update(id: string, data: Partial<{
        name: string;
        password: string;
    }>): Promise<User.Type>;

    /**
     * Update user profile with avatar
     */
    updateProfile(id: string, data: {
        name?: string;
        avatar?: {
            file_url: string;
            fileId: string;
        };
    }): Promise<User.Type>;

    /**
     * Delete old avatars for user
     */
    deleteAvatars(userId: string): Promise<void>;
}
