/**
 * Register Seller Use Case
 */

import { Seller } from '../../domain/Seller';
import { SellerRepository } from '../../domain/SellerRepository';
import { OtpService } from '../../../_shared/services/OtpService';
import { ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface RegisterSellerDeps {
    sellerRepository: SellerRepository;
}

export type RegisterSeller = (input: Seller.RegisterInput) => Promise<{ message: string }>;

export const makeRegisterSeller = ({ sellerRepository }: RegisterSellerDeps): RegisterSeller => {
    return async (input) => {
        Seller.validateRegister(input);

        const existingSeller = await sellerRepository.findByEmail(input.email);
        if (existingSeller) {
            throw new ValidationError('Seller already exists with this email');
        }

        await OtpService.checkRestrictions(input.email);
        await OtpService.trackRequest(input.email);
        await OtpService.send(input.name, input.email, 'seller-activation');

        await sendLog({
            type: 'info',
            message: `OTP sent for seller registration: ${input.email}`,
            source: 'auth-service',
        });

        return { message: 'OTP sent to email. Please verify your account' };
    };
};
