import { Request, Response, NextFunction } from 'express';
import { checkOtpRestrictions, sendOtp, trackOtpRequest, validateRegistrationData, verifyOtp, handleForgotPassword, verifyForgotPasswordOtp } from '../utils/auth.helper';
import prisma from '@packages/libs/prisma';
import { AuthError, ValidationError } from '@packages/error-handler';
import bcrypt from 'bcryptjs';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import { setCookie } from '../utils/cookies/setCookie';
import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

        res.clearCookie("seller-access-token");
        res.clearCookie("seller-refresh-token");

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
        setCookie(res, 'refresh_token', refreshToken);
        setCookie(res, 'access_token', accessToken);
        //Send response
        res.status(200).json({
            message: "Login successful",
            user:{ id: user.id, name: user.name, email: user.email },
        });
    } catch (error) {
        next(error);
    }
}

//Reresh token
export const refreshToken = async (req: any, res: Response, next: NextFunction) => {
    try {
        const refreshToken =
        req.cookies["refresh_token"] ||
        req.cookies["seller-refresh-token"] ||
        req.headers.authorization?.split(" ")[1];
        if (!refreshToken) {
            throw new ValidationError("Unauthorized! No refresh token provided");
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as { id: string, role: string };
        if (!decoded || !decoded.id || !decoded.role) {
            return new JsonWebTokenError("Forbidden! Invalid refresh token.");
        }

        let account;
        if (decoded.role === "user") {
            account = await prisma.users.findUnique({ where: { id: decoded.id } });
        } else if (decoded.role === "seller") {
            account = await prisma.sellers.findUnique({ 
                where: { id: decoded.id },
                include: { shop: true },
            });
        }
        if (!account) {
            return new AuthError("Forbidden! User not found");
        }

        const newAccessToken = jwt.sign({ id:decoded.id, role: decoded.role },
            process.env.ACCESS_TOKEN_SECRET as string, {
            expiresIn: '15min'
        });

        if(decoded.role==="user"){
            setCookie(res, 'access_token', newAccessToken);
        } else if(decoded.role==="seller"){
            setCookie(res, 'seller-access-token', newAccessToken);
        }

        req.role = decoded.role;
        return res.status(201).json({success: true, message: "Access token"})


    } catch (error) {
        return next(error);
    }
}

// get logged in user
export const getUser = async (req: any, res: Response, next: NextFunction) => {
    try {
        const user=req.user;
        res.status(201).json({success: true, user})
    } catch (error) {
        next(error);
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
        return next(error);
    }
}

//Register a new seller
export const registerSeller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        validateRegistrationData(req.body, "seller");
        const{name,email} = req.body;

        const existingSeller = await prisma.sellers.findUnique({
            where: {
                email
            }
        });
        
        if (existingSeller) {
            throw new ValidationError("Seller already exists with this email");
        }

        await checkOtpRestrictions(email,next);
        await trackOtpRequest(email,next);
        await sendOtp(name,email,"seller-activation");

        res.status(200).json({
            message: "OTP sent to email. Please verify your account"
        });
    } catch (error) {
        next(error);
    }
}

//Verify seller OTP
export const verifySeller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, otp, password,  phone_number, country } = req.body;
        if (!email || !otp || !password || !name || !phone_number || !country) {
            return next(new ValidationError("All fields are required"));
        }
        const existingSeller = await prisma.sellers.findUnique({where: {email}});

        if(existingSeller){
            return next(new ValidationError("Seller already exists with this email"));
        }

        await verifyOtp(email, otp, next);
        const hashedPassword = await bcrypt.hash(password, 10);
        const seller = await prisma.sellers.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone_number,
                country,
            }
        });
        const accessToken = jwt.sign(
            { id: seller.id, role: "seller" },
            process.env.ACCESS_TOKEN_SECRET as string,
            { expiresIn: '15min' }
        );

        const refreshToken = jwt.sign(
            { id: seller.id, role: "seller" },
            process.env.REFRESH_TOKEN_SECRET as string,
            { expiresIn: '7d' }
        );

        // 3. Set Cookies (Quan trọng để duy trì phiên đăng nhập)
        // Lưu ý: Đảm bảo hàm setCookie của bạn hỗ trợ SameSite: 'Lax' hoặc 'None' 
        // để cookie tồn tại được khi Stripe redirect về.
        setCookie(res, "seller-access-token", accessToken);
        setCookie(res, "seller-refresh-token", refreshToken);
        res.status(201).json({
            success: true,
            message: "Seller registered and logged in successfully!",
            seller: { 
                id: seller.id, 
                name: seller.name, 
                email: seller.email, 
                phone_number: seller.phone_number, 
                country: seller.country, 
                stripeId: seller.stripeId 
            },
        });
    } catch (error) {
        next(error);
    }
};

//Create a new shop
export const createShop = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, bio, address, opening_hours, website, category, sellerId } = req.body;
        if (!name || !bio || !address || !opening_hours || !website || !category || !sellerId) {
            return next(new ValidationError("All fields are required"));
        }
        const shopData: any = {
                name,
                bio,
                address,
                opening_hours,
                category,
                sellerId,
        };

        if(website && website.trim()!==""){
            shopData.website = website;
        }
        const shop = await prisma.shops.create({
            data: shopData
        });
        res.status(201).json({
            success: true,
            message: "Shop created successfully!",
            shop
        });
    } catch (error) {
        next(error);
    }
};

// Create stripe account link for seller
export const createStripeConnectLink = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sellerId = req.body.sellerId;
        if (!sellerId) {
            return next(new ValidationError("Seller ID is required"));
        }

        const seller = await prisma.sellers.findUnique({
            where: {
                id: sellerId,
            },
        });
        if (!seller) {
            return next(new ValidationError("Seller not found"));
        }

        const account = await stripe.accounts.create({
            type: "express",
            email: seller?.email,
            country: seller.country || "US",
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
        });

        await prisma.sellers.update({
            where: {
                id: sellerId
            },
            data: {
                stripeId: account.id,
            },
        });

        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: "http://localhost:3000/success",
            return_url: "http://localhost:3000/success",
            type: "account_onboarding",
        });

        res.status(200)
        .json({ url: accountLink.url });
    } catch (error:any) {
        console.error("Stripe Connect Link Error:", error);

        if (error.type === "StripeInvalidRequestError") {
            return res.status(400).json({ message: error.message });
        }

        if (error.code === "P2002") {
            return res.status(409).json({ message: "Duplicate field in DB" });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
};

//Login seller
export const loginSeller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new ValidationError("Email and password are required"));
        }

        const seller = await prisma.sellers.findUnique({where: {email}});
        
        if(!seller){
            return next(new AuthError("Seller doesn't exists!"));
        }
        //Verify password
        const isMatch = await bcrypt.compare(password, seller.password!);
        if (!isMatch) {
            return next(new ValidationError("Invalid email or password"));
        }
        res.clearCookie("access_token");
        res.clearCookie("refresh_token");

        //Generate access and refresh token
        const accessToken = jwt.sign({ id: seller.id, role: "seller" },
            process.env.ACCESS_TOKEN_SECRET as string, {
                expiresIn: '15min'
            });
        const refreshToken = jwt.sign({ id: seller.id, role: "seller" },
            process.env.REFRESH_TOKEN_SECRET as string, {
                expiresIn: '7d'
            });
        // Store the refresh and access token in httpOnly secure cookies
        setCookie(res, "seller-refresh-token", refreshToken);
        setCookie(res, "seller-access-token", accessToken);
        //Send response
        res.status(200).json({
            message: "Login successful",
            seller:{ id: seller.id, name: seller.name, email: seller.email, phone_number: seller.phone_number, country: seller.country, stripeId: seller.stripeId },
        });
    } catch (error) {
        next(error);
    }
};

//Get logged in seller
export const getSeller = async (req: any, res: Response, next: NextFunction) => {
    try {
        const seller=req.seller;
        res.status(201).json({success: true, seller})
    } catch (error) {
        next(error);
    }
};

//logout seller
export const logOutSeller = async (req: any, res: Response, next: NextFunction) => {
    res.clearCookie("seller-access-token");
    res.clearCookie("seller-refresh-token");
    res.status(200).json({message: "Logged out successfully"});
}
//logout admin
export const logOutAdmin = async (req: any, res: Response, next: NextFunction) => {
    res.clearCookie("admin-access-token");
    res.clearCookie("admin-refresh-token");
    res.status(200).json({message: "Logged out successfully"});
}

//Logout user
export const logOutUser = async (req: any, res: Response, next: NextFunction) => {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.status(200).json({message: "Logged out successfully"});
}

export const updateUserPassword = async (req: any, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (!currentPassword || !newPassword || !confirmPassword) {
            return next(new ValidationError("All fields are required"));
        }

        if(newPassword !== confirmPassword){
            return next(new ValidationError("New password and confirm password do not match"));
        }

        if(currentPassword === newPassword){
            return next(new ValidationError("New password must be different from current password"));
        }

        const user = await prisma.users.findUnique({ where: { id: userId } });
        if (!user ||!user.password) {
            return next(new AuthError("User not found or password not set"));
        }

        const isPassWordCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isPassWordCorrect) {
            return next(new ValidationError("Current password is incorrect"));
        }

        const hashedNewPassword =  await bcrypt.hash(newPassword, 12);

        await prisma.users.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });
        res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        next(error);
    }
}

//add new adress for user
export const addUserAddress = async (req: any, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const { label, name, street, city, zip, country, isDefault } = req.body;
        if (!label || !name || !street || !city || !zip || !country) {
            return next(new ValidationError("All fields are required"));
        }

        if (isDefault) {
            // Set all other addresses to non-default
            await prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }
        const newAddress = await prisma.address.create({
            data: {
                userId,
                label,
                name,
                street,
                city,
                zip,
                country,
                isDefault: !!isDefault,
            },
        });
        res.status(201).json({ success: true, address: newAddress });
    } catch (error) {
        next(error);
    }
};

//Delete user address
export const deleteUserAddress = async (req: any, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const {addressId} = req.params;

        if(!addressId){
            return next(new ValidationError("Address ID is required"));
        }

        const existingAddress = await prisma.address.findFirst({
            where: {
                id: addressId,
                userId
            }
        });
        if(!existingAddress){
            return next(new ValidationError("Address not found"));
        }

        await prisma.address.delete({
            where: {
                id: addressId
            }
        });

        res.status(200).json({success: true, message: "Address deleted successfully"});
    } catch (error) {
        next(error);
    }
};

//Get user address
export const getUserAddresses = async (req: any, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const addresses = await prisma.address.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.status(200).json({ success: true, addresses });
    } catch (error) {
        next(error);
    }
};