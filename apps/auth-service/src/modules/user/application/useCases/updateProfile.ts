/**
 * Update Profile Use Case
 * 
 * Handles user profile updates including avatar.
 */


import { UserRepository } from '../../domain/UserRepository';

export interface UpdateProfileDeps {
    userRepository: UserRepository;
}

export interface UpdateProfileInput {
    userId: string;
    name?: string;
    avatar?: {
        file_url: string;
        fileId: string;
    };
}

export type UpdateProfile = (input: UpdateProfileInput) => Promise<{ success: true; message: string }>;

export const makeUpdateProfile = ({ userRepository }: UpdateProfileDeps): UpdateProfile => {
    return async (input: UpdateProfileInput) => {
        // 1. Delete old avatars if new avatar provided
        if (input.avatar?.file_url && input.avatar?.fileId) {
            await userRepository.deleteAvatars(input.userId);
        }

        // 2. Update profile
        await userRepository.updateProfile(input.userId, {
            name: input.name,
            avatar: input.avatar,
        });

        return { success: true, message: 'Profile updated successfully' };
    };
};
