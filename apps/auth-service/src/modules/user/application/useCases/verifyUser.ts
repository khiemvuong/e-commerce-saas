/**
 * Verify User Use Case
 * 
 * Handles OTP verification and user account creation.
 */

import { User } from '../../domain/User';
import { UserRepository } from '../../domain/UserRepository';
import { OtpService } from '../../../_shared/services/OtpService';
import { PasswordService } from '../../../_shared/services/PasswordService';
import { ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface VerifyUserDeps {
    userRepository: UserRepository;
}

export type VerifyUser = (input: User.VerifyInput) => Promise<{ success: true; message: string }>;

export const makeVerifyUser = ({ userRepository }: VerifyUserDeps): VerifyUser => {
    return async (input: User.VerifyInput) => {
        // 1. Validate input
        User.validateVerify(input);

        // 2. Check if user already exists
        const existingUser = await userRepository.findByEmail(input.email);
        if (existingUser) {
            throw new ValidationError('User already exists with this email');
        }

        // 3. Verify OTP
        await OtpService.verify(input.email, input.otp);

        // 4. Hash password
        const hashedPassword = await PasswordService.hash(input.password);

        // 5. Create user
        await userRepository.create({
            name: input.name,
            email: input.email,
            password: hashedPassword,
            role: 'user',
        });

        // 6. Log success
        await sendLog({
            type: 'success',
            message: `User registered successfully: ${input.email}`,
            source: 'auth-service',
        });

        return { success: true, message: 'User registered successfully' };
    };
};
