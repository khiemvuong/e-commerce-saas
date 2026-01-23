/**
 * Verify Change Password OTP Use Case
 * 
 * Verifies the OTP before allowing password change.
 */

import { UserRepository } from '../../domain/UserRepository';
import { OtpService } from '../../../_shared/services/OtpService';
import { AuthError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface VerifyChangePasswordOtpDeps {
    userRepository: UserRepository;
}

export interface VerifyChangePasswordOtpInput {
    userId: string;
    otp: string;
}

export interface VerifyChangePasswordOtpResult {
    success: boolean;
    message: string;
    verified: boolean;
}

export type VerifyChangePasswordOtp = (input: VerifyChangePasswordOtpInput) => Promise<VerifyChangePasswordOtpResult>;

export const makeVerifyChangePasswordOtp = ({ userRepository }: VerifyChangePasswordOtpDeps): VerifyChangePasswordOtp => {
    return async (input) => {
        const user = await userRepository.findById(input.userId);
        if (!user) {
            throw new AuthError('User not found');
        }

        // Verify OTP
        await OtpService.verify(user.email, input.otp);

        await sendLog({
            type: 'success',
            message: `Change password OTP verified for user: ${user.email}`,
            source: 'auth-service',
        });

        return {
            success: true,
            message: 'OTP verified successfully',
            verified: true,
        };
    };
};
