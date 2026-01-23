/**
 * Request Change Password OTP Use Case
 * 
 * Sends an OTP to user's email to verify identity before changing password.
 */

import { UserRepository } from '../../domain/UserRepository';
import { OtpService } from '../../../_shared/services/OtpService';
import { AuthError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

// Email templates based on user role
const EMAIL_TEMPLATES = {
    admin: 'admin-otp-mail',
    user: 'user-otp-mail',
};

export interface RequestChangePasswordOtpDeps {
    userRepository: UserRepository;
}

export interface RequestChangePasswordOtpInput {
    userId: string;
}

export interface RequestChangePasswordOtpResult {
    success: boolean;
    message: string;
}

export type RequestChangePasswordOtp = (input: RequestChangePasswordOtpInput) => Promise<RequestChangePasswordOtpResult>;

export const makeRequestChangePasswordOtp = ({ userRepository }: RequestChangePasswordOtpDeps): RequestChangePasswordOtp => {
    return async (input) => {
        const user = await userRepository.findById(input.userId);
        if (!user) {
            throw new AuthError('User not found');
        }

        // Check OTP restrictions (rate limiting)
        await OtpService.checkRestrictions(user.email);

        // Track OTP request
        await OtpService.trackRequest(user.email);

        // Select email template based on user role
        const emailTemplate = user.role === 'admin' ? EMAIL_TEMPLATES.admin : EMAIL_TEMPLATES.user;

        // Send OTP
        await OtpService.send(user.name, user.email, emailTemplate);

        await sendLog({
            type: 'info',
            message: `Change password OTP sent to user: ${user.email}`,
            source: 'auth-service',
        });

        return {
            success: true,
            message: 'Verification code sent to your email',
        };
    };
};
