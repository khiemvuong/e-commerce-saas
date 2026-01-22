/**
 * Verify Seller Use Case
 */

import { Response } from 'express';
import { Seller } from '../../domain/Seller';
import { SellerRepository } from '../../domain/SellerRepository';
import { OtpService } from '../../../_shared/services/OtpService';
import { PasswordService } from '../../../_shared/services/PasswordService';
import { TokenService } from '../../../_shared/services/TokenService';
import { ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface VerifySellerDeps {
    sellerRepository: SellerRepository;
}

export interface VerifySellerResult {
    success: true;
    message: string;
    seller: Seller.PublicType;
}

export type VerifySeller = (input: Seller.VerifyInput, res: Response) => Promise<VerifySellerResult>;

export const makeVerifySeller = ({ sellerRepository }: VerifySellerDeps): VerifySeller => {
    return async (input, res) => {
        Seller.validateVerify(input);

        const existingSeller = await sellerRepository.findByEmail(input.email);
        if (existingSeller) {
            throw new ValidationError('Seller already exists with this email');
        }

        await OtpService.verify(input.email, input.otp);

        const hashedPassword = await PasswordService.hash(input.password);

        const seller = await sellerRepository.create({
            name: input.name,
            email: input.email,
            password: hashedPassword,
            phone_number: input.phone_number,
            country: input.country,
        });

        // Generate tokens and set cookies
        const tokens = TokenService.generateTokenPair(seller.id, 'seller');
        TokenService.setSellerCookies(res, tokens);

        await sendLog({
            type: 'success',
            message: `Seller registered successfully: ${input.email}`,
            source: 'auth-service',
        });

        return {
            success: true,
            message: 'Seller registered and logged in successfully!',
            seller: Seller.toPublic(seller),
        };
    };
};
