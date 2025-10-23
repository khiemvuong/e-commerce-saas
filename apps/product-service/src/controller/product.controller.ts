import { AuthError, notFoundError, ValidationError } from "@packages/error-handler";
import { client } from "@packages/libs/imagekit";
import { toFile } from "@imagekit/nodejs";
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
export const uploadProductImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileName } = req.body; // base64 data URL từ FE

    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ error: 'fileName (base64 data URL) is required' });
    }

    // Parse base64 data URL
    // data:image/png;base64,AAAA...
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(fileName);
    if (!match) {
      return res.status(400).json({ error: 'Invalid base64 image data URL' });
    }

    const mime = match[1]; // e.g. image/png
    const base64 = match[2];
    const buffer = Buffer.from(base64, 'base64');

    // Tạo "file" cho SDK từ Buffer
    const ext = mime.split('/')[1] || 'jpg';
    const uniqueName = `product-${Date.now()}.${ext}`;
    const fileForUpload = await toFile(buffer, uniqueName);

    // Upload
    const resp = await client.files.upload({
      file: fileForUpload,
      fileName: uniqueName,
      // Có thể bổ sung các tham số khác nếu dùng: tags, folder, etc.
      // folder: '/products',
      // tags: ['product', 'ecommerce'],
    });

    return res.status(200).json({
      success: true,
      file_url: (resp as any).url ?? (resp as any).filePath ?? null,
      fileId: (resp as any).fileId,
      thumbnailUrl: (resp as any).thumbnailUrl ?? null,
      // Có thể trả thêm các trường nếu cần: width/height/size
    });
  } catch (error: any) {
    console.error('ImageKit upload error:', error);
    return res.status(500).json({ error: 'Failed to upload image', details: error?.message });
  }
};

// Delete product image
export const deleteProductImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ error: 'fileId is required' });

    await client.files.delete(fileId);
    return res.status(200).json({ success: true, message: 'Image deleted successfully' });
  } catch (error: any) {
    console.error('ImageKit delete error:', error);
    return res.status(500).json({ error: 'Failed to delete image', details: error?.message });
  }
};

//Create product
export const createProduct = async (req:any, res:Response, next:NextFunction) => {
    try {
        const {
            title,
            short_description,
            detailed_description,
            warranty,
            custom_specifications,
            slug,
            tags,
            cash_on_delivery,
            brand,
            video_url,
            category,
            colors=[],
            sizes=[],
            discountCodes=[],
            stock,
            sale_price,
            regular_price,
            sub_category,
            customProperties={},
            images=[],
        }=req.body;
        console.log('Received data:', req.body);
        if(!title || !short_description || !detailed_description || !slug || !category || !stock || !sale_price || !regular_price||images.length===0){
            return next (new ValidationError("Please fill all required fields"));
        }
        if(!req.seller.id){
            return next (new AuthError("Only sellers can create products"));
        }

        const slugCheck=await prisma.products.findUnique({
            where:{slug}
        });
        if(slugCheck){
            return next (new ValidationError("Slug already exists. Please choose another one"));
        }
        const newProduct=await prisma.products.create({
            data:{
                title, 
                short_description, 
                detailed_description, 
                warranty, 
                slug, 
                cash_on_delivery: cash_on_delivery, 
                brand, 
                video_url, 
                category, 
                sub_category, 
                stock: parseInt(stock), 
                sale_price: parseFloat(sale_price), 
                regular_price: parseFloat(regular_price), 
                shopId: req.seller?.shop?.id,
                tags:Array.isArray(tags) ? tags : tags.split(","),
                colors:colors || [], 
                sizes: sizes || [],
                discount_codes: discountCodes.map((codeId:string) => ({ id: codeId })),
                images: {
                    create:images
                        .filter((img:any)=> img && img.file_url && img.fileId)
                        .map((img:any) =>({
                            file_url: img.file_url,
                            fileId: img.fileId,
                        })),
            },
                custom_properties: customProperties || {},
                custom_specifications: custom_specifications || {},
            },
            include:{ images:true }
        });
        return res.status(201).json({success:true,newProduct});

    } catch (error) {
        console.error("Create product error:", error);
        return next(error);
    }
}