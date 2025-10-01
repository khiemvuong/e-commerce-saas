// Register an new user
import { Request, Response, NextFunction } from 'express';
import { checkOtpRestrictions, sendOtp, trackOtpRequest, validateRegistrationData, verifyOtp, handleForgotPassword, verifyForgotPasswordOtp } from '../utils/auth.helper';
import prisma from '@packages/libs/prisma';
import { AuthError, ValidationError } from '@packages/error-handler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { setCookie } from '../utils/cookies/setCookie';
export const userRegistetration = async (req: Request, res: Response, next: NextFunction) => {
    try {
        validateRegistrationData(req.body, "user");
        const{name,email} = req.body;
    
        const existingUser = await prisma.users.findUnique({where: {email}});

        if(existingUser){
            return next(new ValidationError("User already exists with this email"));
        }

        await checkOtpRestrictions(email,next);

        await trackOtpRequest(email,next);
        await sendOtp(name,email,"user-activation-mail");

        res.status(200).json({
            message: "OTP sent to email. Please verify your account"
        });
    }
    catch (error) {
        return next(error);
    }
};

//Verify user OTP
export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp, password, name } = req.body;
        if (!email || !otp || !password || !name) {
            return next(new ValidationError("All fields are required"));
        }
        const existingUser = await prisma.users.findUnique({where: {email}});
        if(existingUser){
            return next(new ValidationError("User already exists with this email"));
        }

        await verifyOtp(email, otp, next);
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.users.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        });
        res.status(201).json({
            success: true,
            message: "User registered successfully",
        });
    }
    catch (error) {
        return next(error);
    }
};

//Login user
export const userLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new ValidationError("Email and password are required"));
        }

        const user = await prisma.users.findUnique({where: {email}});
        if(!user){
            return next(new AuthError("User doesn't exists!"));
        }
        //Verify password
        const isMatch = await bcrypt.compare(password, user.password!);
        if (!isMatch) {
            return next(new AuthError("Invalid email or password"));
        }
        //Generate access and refresh token
        const accessToken = jwt.sign({ id: user.id, role: "user" },
            process.env.ACCESS_TOKEN_SECRET as string, {
                expiresIn: '15min'
            });
        const refreshToken = jwt.sign({ id: user.id, role: "user" },
            process.env.REFRESH_TOKEN_SECRET as string, {
                expiresIn: '7d'
            });
        // Store the refresh and access token in httpOnly secure cookies
        setCookie(res, 'refreshToken', refreshToken);
        setCookie(res, 'accessToken', accessToken);
        //Send response
        res.status(200).json({
            message: "Login successful",
            user:{ id: user.id, name: user.name, email: user.email },
        });
    } catch (error) {
        
    }
}

//User forgot password
export const userForgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    await handleForgotPassword(req, res, next, "user");
}
// Verify user OTP for forgot password
export const verifyUserForgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    await verifyForgotPasswordOtp(req, res, next);
    }

//Reset user password
export const resetUserPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return next(new ValidationError("All fields are required"));
        }
        const user = await prisma.users.findUnique({where: {email}});
        if(!user){
            return next(new ValidationError("User doesn't exists!"));
        }

        //Compare new password with old password
        const isSamePassword = await bcrypt.compare(newPassword, user.password!);
        if (isSamePassword) {
            return next(new ValidationError("New password must be different from the old password"));
        };

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.users.update({
            where: { email },
            data: { password: hashedPassword }
        });

        res.status(200).json({
            message: "Password reset successfully"
        });
    } catch (error) {
        
    }
}