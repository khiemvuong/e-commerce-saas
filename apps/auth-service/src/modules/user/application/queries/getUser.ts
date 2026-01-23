/**
 * Get User Query
 * 
 * Retrieves the logged-in user's information.
 */

import { User } from '../../domain/User';
import { UserRepository } from '../../domain/UserRepository';
import { AuthError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface GetUserDeps {
    userRepository: UserRepository;
}

export interface GetUserInput {
    userId: string;
}

export type GetUser = (input: GetUserInput) => Promise<{ success: true; user: User.PublicType }>;

export const makeGetUser = ({ userRepository }: GetUserDeps): GetUser => {
    return async (input: GetUserInput) => {
        await sendLog({
            type: 'success',
            message: `User data fetched for user ID: ${input.userId}`,
            source: 'auth-service',
        });

        // 1. Validate input
        if (!input.userId) {
            throw new AuthError('User not authenticated');
        }

        // 2. Find user with avatar
        const user = await userRepository.findByIdWithAvatar(input.userId);
        if (!user) {
            throw new AuthError('User not found');
        }

        // 3. Return public user data
        return {
            success: true,
            user: User.toPublic(user),
        };
    };
};
