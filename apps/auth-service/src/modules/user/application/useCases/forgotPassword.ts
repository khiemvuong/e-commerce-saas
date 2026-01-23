/**
 * Forgot Password Use Case
 * 
 * Handles sending OTP for password reset.
 */

import { UserRepository } from '../../domain/UserRepository';
import { OtpService } from '../../../_shared/services/OtpService';
import { ValidationError } from '../../../../_lib/errors/AuthErrors';

export interface ForgotPasswordDeps {
    userRepository: UserRepository;
}

export interface ForgotPasswordInput {
    email: string;
}

export type ForgotPassword = (input: ForgotPasswordInput) => Promise<{ message: string }>;

export const makeForgotPassword = ({ userRepository }: ForgotPasswordDeps): ForgotPassword => {
    return async (input: ForgotPasswordInput) => {
        // 1. Validate input
        if (!input.email?.trim()) {
            throw new ValidationError('Email is required');
        }

        // 2. Find user
        const user = await userRepository.findByEmail(input.email);
        if (!user) {
            throw new ValidationError("User not found with this email");
        }

        // 3. Check OTP restrictions
        await OtpService.checkRestrictions(input.email);

        // 4. Track OTP request
        await OtpService.trackRequest(input.email);

        // 5. Send OTP
        await OtpService.send(user.name, input.email, 'forgot-password-user-mail');

        return { message: 'OTP sent to email. Please check your email.' };
    };
};
