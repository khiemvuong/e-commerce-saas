/**
 * Register User Use Case
 * 
 * Handles sending OTP for user registration.
 */

import { User } from '../../domain/User';
import { UserRepository } from '../../domain/UserRepository';
import { OtpService } from '../../../_shared/services/OtpService';
import { ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface RegisterUserDeps {
    userRepository: UserRepository;
}

export interface RegisterUserInput {
    name: string;
    email: string;
}

export type RegisterUser = (input: RegisterUserInput) => Promise<{ message: string }>;

export const makeRegisterUser = ({ userRepository }: RegisterUserDeps): RegisterUser => {
    return async (input: RegisterUserInput) => {
        // 1. Validate input
        User.validateRegister(input);

        // 2. Check if user already exists
        const existingUser = await userRepository.findByEmail(input.email);
        if (existingUser) {
            throw new ValidationError('User already exists with this email');
        }

        // 3. Check OTP restrictions
        await OtpService.checkRestrictions(input.email);

        // 4. Track OTP request
        await OtpService.trackRequest(input.email);

        // 5. Send OTP
        await OtpService.send(input.name, input.email, 'user-activation-mail');

        // 6. Log
        await sendLog({
            type: 'info',
            message: `OTP sent for user registration: ${input.email}`,
            source: 'auth-service',
        });

        return { message: 'OTP sent to email. Please verify your account' };
    };
};
