import { notFoundError, ValidationError } from "@packages/error-handler";
import { client } from "@packages/libs/imagekit";
import prisma from "@packages/libs/prisma";
import { Request, Response, NextFunction } from "express";

// Get product categories
export const getCategories = async (req:Request, res:Response, next:NextFunction) => {
    try {
        const config=await prisma.site_config.findFirst();
        if(!config){
            return res.status(404).json({message:"Categories not found"});
        }
        return res.status(200).json({
            categories: config.categories,
            subCategories: config.subCategories,
        });

    } catch (error) {
        return next(error);
    }
};

// Create discount code
export const createDiscountCodes = async (req:any, res:Response, next:NextFunction) => {
    try {
        const{public_name,discountType,discountValue,discountCode}=req.body;

        const isDiscountCodeExist=await prisma.discount_codes.findUnique({
            where:{discountCode}
        });
        if(isDiscountCodeExist){
            return next (new ValidationError("Discount code already exists"));
        }
        const discount_code=await prisma.discount_codes.create({
            data:{
                public_name,
                discountType,
                discountValue: parseFloat(discountValue),
                discountCode,
                sellerId: req.seller?.id,
            }
        });
        return res.status(201).json({success:true,discount_code});
    } catch (error) {
        
    }
};

// Get discount codes
export const getDiscountCodes = async (req:any, res:Response, next:NextFunction) => {
    try {
        const discount_codes=await prisma.discount_codes.findMany({
            where:{sellerId: req.seller?.id}
        });
        return res.status(200).json({success:true,discount_codes});
    } catch (error) {
        return next(error);
    }
};

// Delete discount code
export const deleteDiscountCode = async (req:any, res:Response, next:NextFunction) => {
    try {
        const {id}=req.params;
        const sellerId=req.seller?.id;
        const discountCode=await prisma.discount_codes.findUnique({
            where:{id},
            select:{id:true,sellerId:true}
        });
        if(!discountCode){
            return next (new notFoundError("Discount code not found"));
        }
        if(discountCode.sellerId !== sellerId){
            return next (new ValidationError("You are not authorized to delete this discount code"));
        }
        await prisma.discount_codes.delete({
            where:{id}
        });

        return res.status(200).json({success:true,message:"Discount code deleted successfully"});
    } catch (error) {
        return next(error);
    }
};

//Add product image
// export const uploadProductImage = async (req:Request, res:Response, next:NextFunction) => {
//     try {
//         const { fileName } = req.body;
//         const response = await client.upload({

//         });
//     } catch (error) {
//         throw error;
//     }
// };
