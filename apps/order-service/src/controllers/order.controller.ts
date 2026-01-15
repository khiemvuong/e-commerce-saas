import { ValidationError } from "@packages/error-handler";
import prisma from "@packages/libs/prisma";
import redis from "@packages/libs/redis";
import { Prisma } from "@prisma/client";
import { Request,NextFunction,Response } from "express";
import { Stripe } from "stripe";
import { sendEmail } from "../utils/send-email";
import { sendLog } from '@packages/utils/kafka';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
//Create payment intent
export const createPaymentIntent = async (req:any,res:Response,next:NextFunction) => {
    const {amount, sellerStripeAccountId, sessionId} = req.body;

    const customerAmount = Math.round(amount * 100); // Convert to cents
    const platformFee = Math.round(customerAmount * 0.1); // 10% platform fee

    try {
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: customerAmount,
            currency: 'usd',
            payment_method_types: ['card'],
            application_fee_amount: platformFee,
            transfer_data: {
                destination: sellerStripeAccountId,
            },
            on_behalf_of: sellerStripeAccountId,
            metadata: {
                sessionId: sessionId,
                userId: req.user.id,
            },
        });
        await sendLog({
            type: 'info',
            message: `Payment intent created for user: ${req.user.id}, amount: ${amount}`,
            source: 'order-service'
        });
        res.send({
            clientSecret: paymentIntent.client_secret,
        })
    } catch (error) {
        next(error);
    }
}

//Create payment session
export const createPaymentSession = async (req:any,res:Response,next:NextFunction) => {
    try {
        const {cart,selectedAddressId,coupon} = req.body;
        const userId = req.user.id;

        if(!cart || cart.length===0 || !Array.isArray(cart)){
            return next(new ValidationError("Cart is empty or invalid"));
        }

        const normalizedCart = JSON.stringify(
        cart
            .map((item:any) => ({
                id: item.id,
                quantity: item.quantity,
                sale_price: item.sale_price,
                shopId: item.shopId,
                selectedOptions: item.selectedOptions || {},
            }))
            .sort((a:any,b:any) => a.id.localeCompare(b.id))
        );      

        const keys = await redis.keys(`payment-session:*`);
        for(const key of keys) {
            const data = await redis.get(key);
            if (data && typeof data === 'string'){
                const session = JSON.parse(data);
                if(session.userId === userId){
                    const existingCart = JSON.stringify(
                        session.cart
                        .map((item:any) => ({
                            id: item.id,
                            quantity: item.quantity,
                            sale_price: item.sale_price,
                            shopId: item.shopId,
                            selectedOptions: item.selectedOptions || {},
                        }))
                        .sort((a:any,b:any) => a.id.localeCompare(b.id))
                    );
                    if(existingCart === normalizedCart){
                        return res.status(200).json({sessionId: key.split(':')[1]});
                    } else {
                        await redis.del(key);
                    }
                }
            }
        }

        const uniqueShopIds = [...new Set(cart.map((item:any) => item.shopId))];

        const shops = await prisma.shops.findMany({
            where: {
                id: {
                    in: uniqueShopIds,
                },
            },
            select: {
                id: true,
                sellerId: true,
                sellers:{
                    select: {
                        stripeId: true,
                    }
                }
            }
        });

        const sellerData = shops.map((shop) => ({
            shopId: shop.id,
            sellerId: shop.sellerId,
            stripeAccountId: shop?.sellers?.stripeId,
        }));

        //Calculate total amount
        const totalAmount = cart.reduce((total:number,item:any) => {
            return total + (item.sale_price * item.quantity);
        },0);
        //Create session payload
        const sessionId = crypto.randomUUID();
        const sessionData = {
            userId,
            cart,
            sellers: sellerData,
            totalAmount,
            shippingAddressId: selectedAddressId,
            coupon: coupon || null,
        }
        await redis.setex(
            `payment-session:${sessionId}`, 
            600, // 10 minutes expiration
            JSON.stringify(sessionData)
        );
        await sendLog({
            type: 'info',
            message: `Payment session created: ${sessionId} for user: ${userId}`,
            source: 'order-service'
        });
        res.status(201).json({ sessionId });
    } catch (error) {
        next(error);
    }
};

//Verify payment session
export const verifyPaymentSession = async (req:Request,res:Response,next:NextFunction) => {
    try {
        const sessionId = req.query.sessionId as string;
        if(!sessionId){
            return res.status(400).json({valid: false, message: "Session ID is required"});
        }
        //Fetch session from redis
        const sessionKey = `payment-session:${sessionId}`;
        const sessionData = await redis.get(sessionKey);

        if(!sessionData){
            return res.status(404).json({valid: false, message: "Payment session not found or expired"});
        }

        //Parse and return session
        // const session = JSON.parse(sessionData);
        const session = sessionData;

        return res.status(200).json({success: true, session});
    } catch (error) {
        return next(error);
    }
};

// Create order
export const createOrder = async (req:Request,res:Response,next:NextFunction) => {
    try {
        const stripeSignature = req.headers['stripe-signature'];
        if(!stripeSignature){
            return res.status(400).send("Missing Stripe signature");
        }

        const rawBody = (req as any).rawBody;
        let event;
        try {
            event = stripe.webhooks.constructEvent(
                rawBody,
                stripeSignature,
                process.env.STRIPE_WEBHOOK_SECRET!
            );
        } catch (err:any) {
            console.error("Stripe webhook signature verification failed:", err.message);
            await sendLog({
                type: 'error',
                message: `Stripe webhook signature verification failed: ${err.message}`,
                source: 'order-service'
            });
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        if(event.type === 'payment_intent.succeeded'){
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const sessionId = paymentIntent.metadata.sessionId;
            const userId = paymentIntent.metadata.userId;

            const sessionKey = `payment-session:${sessionId}`;
            const sessionData = await redis.get(sessionKey);

            if(!sessionData){
                console.warn("Payment session not found or expired for sessionId:", sessionId);
                await sendLog({
                    type: 'warning',
                    message: `Payment session not found or expired for sessionId: ${sessionId}`,
                    source: 'order-service'
                });
                return res
                .status(404)
                .send("Payment session not found or expired");
            }
            let session;
            if (typeof sessionData === 'string') {
                session = JSON.parse(sessionData);
            } else {
                session = sessionData;
            }
            const {cart,totalAmount,shippingAddressId,coupon} = session;
            const user = await prisma.users.findUnique({
                where: {id: userId},
            });
            const name = user?.email || "Customer";
            const email = user?.email || "no-reply@example.com";

            const shopGrouped = cart.reduce((acc:any, item:any) => {
                if(!acc[item.shopId]){
                    acc[item.shopId] = [];
                }
                acc[item.shopId].push(item);
                return acc;
            }, {});

            for(const shopId in shopGrouped){
                const orderItems =shopGrouped[shopId];

                let orderTotal = orderItems.reduce(
                    (sum:number, p:any) => sum + (p.sale_price * p.quantity),0
                );
                if(coupon && coupon.discountedProductId && orderItems.some((item:any) => item.id === coupon.discountedProductId)
                ){
                    const discountedItem = orderItems.find((item:any) => item.id === coupon.discountedProductId);
                    if(discountedItem) {
                        const discount = coupon.discountPercent > 0
                        ? (discountedItem.sale_price * discountedItem.quantity) * (coupon.discountPercent / 100)
                        : coupon.discountAmount;
                        orderTotal -= discount;
                    }
                }

                //Create order in DB
                const order = await prisma.orders.create({
                    data: {
                        userId,
                        shopId,
                        total: orderTotal,
                        status: "Paid",
                        shippingAddressId: shippingAddressId || null,
                        couponCode: coupon ? coupon.code : null,
                        discountAmount: coupon?.discountAmount || 0,
                        items:{
                            create : orderItems.map((item:any) => ({
                                productId: item.id,
                                quantity: item.quantity,
                                price: item.sale_price,
                                selectedOptions: item.selectedOptions || {},
                                title: item.title,
                            })),
                        },
                    },
                });
                await sendLog({
                    type: 'success',
                    message: `Order created: ${order.id} for user: ${userId}, shop: ${shopId}`,
                    source: 'order-service'
                });
                //Update product & analystics
                for(const item of orderItems){
                    const {id: productId, quantity} = item;

                    await prisma.products.update({
                        where: {id: productId},
                        data: {
                            stock: {decrement: quantity},
                            totalSales: {increment: quantity},
                        },
                    });

                    await prisma.productAnalytics.upsert({
                        where: { productId },
                        create:{
                            productId,
                            shopId,
                            purchases: quantity,
                            lastViewedAt: new Date(),
                        },
                        update:{
                            purchases: {increment: quantity},
                        },
                    });

                    const existingAnalystics = await prisma.userAnalytics.findUnique({
                        where: {userId},
                    });

                    const newAction = {
                        productId,
                        shopId,
                        action: 'purchase',
                        timestamp: Date.now(),
                    };
                    const currentActions = Array.isArray(existingAnalystics?.actions)
                    ? (existingAnalystics?.actions as Prisma.JsonArray)
                    : [];

                    if (existingAnalystics) {
                        await prisma.userAnalytics.update({
                            where: {userId},
                            data: {
                                lastVisited: new Date(),
                                actions: [...currentActions, newAction],
                            },
                        });
                    } else {
                        await prisma.userAnalytics.create({
                            data: {
                                userId,
                                lastVisited: new Date(),
                                actions: [newAction],
                            },
                        });
                    }
                }

                try {
                    await sendEmail(
                        email,
                        'Order Confirmation',
                        "order-confirmation",
                        {
                            name,
                            cart,
                            totalAmount: coupon?.discountAmount
                                ? (totalAmount - coupon.discountAmount)
                                : totalAmount,
                            trackingUrl :`https://ilan.com/order/${sessionId}`,
                        }
                    )
                } catch (error: any) {
                    console.error("Failed to send order confirmation email:", error);
                    await sendLog({
                        type: 'error',
                        message: `Failed to send email for order ${sessionId}: ${error.message}`,
                        source: 'order-service'
                    });
                    // Không throw error ở đây để tránh Stripe retry webhook gây trùng đơn hàng
                }

                //Create notifications for sellers
                const createdShopIds = Object.keys(shopGrouped);
                const sellerShops = await prisma.shops.findMany({
                    where: {
                        id: { in : createdShopIds },
                    },
                    select: {
                        id: true,
                        sellerId: true,
                        name:true
                    }
                });

                //Notification for sellers
                for(const shop of sellerShops){
                    const firstProduct = shopGrouped[shop.id][0];
                    const productTitle = firstProduct?.title || "new item";
                    try {
                        await prisma.notifications.create({
                            data: {
                                type:"Order",
                                title:"New Order Received",
                                message:`You have a new order for ${productTitle} in your shop - ${shop.name}.`,
                                creatorId: userId,
                                receiverId: shop.sellerId,
                                redirect_link:`https://ilan.com/order/${sessionId}`,
                            },
                        });
                    } catch (err) {
                        console.error("Seller notification error:", err);
                    }
                }

                // Get all admin users and send notifications to them
                try {
                    const adminUsers = await prisma.users.findMany({
                        where: { role: "admin" },
                        select: { id: true },
                    });

                    // Create notification for each admin user
                    for (const admin of adminUsers) {
                        try {
                            await prisma.notifications.create({
                                data: {
                                    type: "Order",
                                    title: "Platform Order Alert",
                                    message: `A new order has been placed. Order ID: ${sessionId}.`,
                                    creatorId: userId,
                                    receiverId: admin.id,
                                    redirect_link: `https://ilan.com/orders/${sessionId}`,
                                },
                            });
                        } catch (err) {
                            console.error(`Failed to create notification for admin ${admin.id}:`, err);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching admin users for notifications:", err);
                }
            }
        }
        res.status(200).json({received: true});
    } catch (error: any) {
        console.error("Error processing order creation:", error);
        await sendLog({
            type: 'error',
            message: `Error processing order creation: ${error.message}`,
            source: 'order-service'
        });
        return next(error);
    }
}



//Verify coupon code
export const verifyCouponCode = async (req:any,res:Response,next:NextFunction) => {
    try {
        const {couponCode, cart} = req.body;
        if(!couponCode || !cart || !Array.isArray(cart) || cart.length===0){
            return next(new ValidationError("Coupon code and valid cart are required"));
        }

        //Fetch the discount code
        const discount = await prisma.discount_codes.findUnique({
            where: {discountCode: couponCode},
        });

        if(!discount){
            await sendLog({
                type: 'info',
                message: `Invalid coupon code attempt: ${couponCode}`,
                source: 'order-service'
            });
            return next(new ValidationError("Invalid coupon code"));
        }

        //Find matching product that includes the coupon
        const matchingProduct = cart.find((item:any) => 
            item.discount_codes?.some((d:any) => d === discount.id)
        );

        if(!matchingProduct){
            return res.status(200).json({
                valid: false,
                discount: 0,
                discountAmount: 0,
                message: "Coupon code does not apply to any products in the cart",
            });
        }

        let discountAmount = 0;
        const price = matchingProduct.sale_price * matchingProduct.quantity;
        if(discount.discountType === "percentage"){
            discountAmount = (price * discount.discountValue) / 100;
        } else if(discount.discountType === "flat"){
            discountAmount = discount.discountValue;
        }

        //Prevent discount from being more than total price
        discountAmount = Math.min(discountAmount, price);

        await sendLog({
            type: 'info',
            message: `Coupon code verified: ${couponCode}`,
            source: 'order-service'
        });
        res.status(200).json({
            valid:true,
            discount: discount.discountValue,
            discountAmount:discountAmount.toFixed(2),
            discountedProductId: matchingProduct.id,
            discountType: discount.discountType,
            message: "Coupon code applied successfully",
        });
    } catch (error) {
        next(error);
    }
}

// Get user orders
export const getUserOrders = async (req:any,res:Response,next:NextFunction) => {
    try {
        const userId = req.user.id;
        const orders = await prisma.orders.findMany({
            where: {userId},
            orderBy: {createdAt: 'desc'},
            include: {
                items: true,
                shop: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        });

        res.status(200).json({success: true, orders});
    } catch (error) {
        next(error);
    }
}

// Get admin orders
export const getAdminOrders = async (req:any,res:Response,next:NextFunction) => {
    try {
        const orders = await prisma.orders.findMany({
            orderBy: {createdAt: 'desc'},
            include: {
                user: true,
                shop: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        });

        res.status(200).json({success: true, orders});
    } catch (error) {
        next(error);
    }
}

// Create COD (Cash on Delivery) Order
export const createCODOrder = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { sessionId, guestEmail } = req.body;
        const userId = req.user?.id;

        if (!sessionId) {
            return next(new ValidationError("Session ID is required"));
        }

        // Get session from Redis
        const sessionKey = `payment-session:${sessionId}`;
        const sessionData = await redis.get(sessionKey);

        if (!sessionData) {
            return next(new ValidationError("Payment session not found or expired"));
        }

        let session;
        if (typeof sessionData === 'string') {
            session = JSON.parse(sessionData);
        } else {
            session = sessionData;
        }

        const { cart, totalAmount, shippingAddressId, coupon } = session;

        // Validate all products support COD
        const productIds = cart.map((item: any) => item.id);
        const products = await prisma.products.findMany({
            where: { id: { in: productIds } },
            select: { id: true, title: true, cash_on_delivery: true, stock: true }
        });

        const nonCODProducts = products.filter(p => p.cash_on_delivery !== "yes");
        if (nonCODProducts.length > 0) {
            return next(new ValidationError(
                `The following products do not support COD: ${nonCODProducts.map(p => p.title).join(', ')}`
            ));
        }

        // Check stock availability
        for (const item of cart) {
            const product = products.find(p => p.id === item.id);
            if (!product || product.stock < item.quantity) {
                return next(new ValidationError(`${product?.title || 'Product'} is out of stock`));
            }
        }

        // Get user info
        let userEmail = guestEmail;
        let userName = "Customer";
        
        if (userId) {
            const user = await prisma.users.findUnique({
                where: { id: userId },
                select: { email: true, name: true }
            });
            userEmail = user?.email || guestEmail;
            userName = user?.name || "Customer";
        }

        if (!userEmail) {
            return next(new ValidationError("Email is required for COD orders"));
        }

        // Group cart items by shop
        const shopGrouped = cart.reduce((acc: any, item: any) => {
            if (!acc[item.shopId]) {
                acc[item.shopId] = [];
            }
            acc[item.shopId].push(item);
            return acc;
        }, {});

        const createdOrders: any[] = [];

        // Create orders for each shop
        for (const shopId in shopGrouped) {
            const orderItems = shopGrouped[shopId];

            let orderTotal = orderItems.reduce(
                (sum: number, p: any) => sum + (p.sale_price * p.quantity), 0
            );

            // Apply coupon if applicable
            if (coupon && coupon.discountedProductId && 
                orderItems.some((item: any) => item.id === coupon.discountedProductId)) {
                const discountedItem = orderItems.find((item: any) => item.id === coupon.discountedProductId);
                if (discountedItem) {
                    const discount = coupon.discountPercent > 0
                        ? (discountedItem.sale_price * discountedItem.quantity) * (coupon.discountPercent / 100)
                        : coupon.discountAmount;
                    orderTotal -= discount;
                }
            }

            // Create order with COD status
            const order = await prisma.orders.create({
                data: {
                    userId: userId || undefined,
                    shopId,
                    total: orderTotal,
                    status: "COD",
                    paymentMethod: "cod",
                    shippingAddressId: shippingAddressId || null,
                    couponCode: coupon ? coupon.code : null,
                    discountAmount: coupon?.discountAmount || 0,
                    guestEmail: !userId ? guestEmail : null,
                    items: {
                        create: orderItems.map((item: any) => ({
                            productId: item.id,
                            quantity: item.quantity,
                            price: item.sale_price,
                            selectedOptions: item.selectedOptions || {},
                            title: item.title,
                        })),
                    },
                },
            });

            createdOrders.push(order);

            await sendLog({
                type: 'success',
                message: `COD Order created: ${order.id} for ${userId ? `user: ${userId}` : `guest: ${guestEmail}`}, shop: ${shopId}`,
                source: 'order-service'
            });

            // Update product stock & analytics
            for (const item of orderItems) {
                const { id: productId, quantity } = item;

                await prisma.products.update({
                    where: { id: productId },
                    data: {
                        stock: { decrement: quantity },
                        totalSales: { increment: quantity },
                    },
                });

                await prisma.productAnalytics.upsert({
                    where: { productId },
                    create: {
                        productId,
                        shopId,
                        purchases: quantity,
                        lastViewedAt: new Date(),
                    },
                    update: {
                        purchases: { increment: quantity },
                    },
                });

                // Update user analytics if logged in
                if (userId) {
                    const existingAnalytics = await prisma.userAnalytics.findUnique({
                        where: { userId },
                    });

                    const newAction = {
                        productId,
                        shopId,
                        action: 'purchase',
                        paymentMethod: 'cod',
                        timestamp: Date.now(),
                    };

                    const currentActions = Array.isArray(existingAnalytics?.actions)
                        ? (existingAnalytics?.actions as Prisma.JsonArray)
                        : [];

                    if (existingAnalytics) {
                        await prisma.userAnalytics.update({
                            where: { userId },
                            data: {
                                lastVisited: new Date(),
                                actions: [...currentActions, newAction],
                            },
                        });
                    } else {
                        await prisma.userAnalytics.create({
                            data: {
                                userId,
                                lastVisited: new Date(),
                                actions: [newAction],
                            },
                        });
                    }
                }
            }
        }

        // Send COD confirmation email
        try {
            const finalAmount = coupon?.discountAmount
                ? (totalAmount - coupon.discountAmount)
                : totalAmount;

            await sendEmail(
                userEmail,
                'Xác nhận đơn hàng COD',
                "order-confirmation",
                {
                    name: userName,
                    cart,
                    totalAmount: finalAmount,
                    paymentMethod: 'cod',
                    trackingUrl: `${process.env.USER_UI_URL || 'https://ilan.com'}/order/${createdOrders[0]?.id}`,
                    codNote: `Vui lòng chuẩn bị ${finalAmount.toLocaleString('vi-VN')}đ khi nhận hàng.`,
                }
            );
        } catch (error: any) {
            console.error("Failed to send COD confirmation email:", error);
            await sendLog({
                type: 'error',
                message: `Failed to send COD email for order ${sessionId}: ${error.message}`,
                source: 'order-service'
            });
        }

        // Create notifications for sellers
        const createdShopIds = Object.keys(shopGrouped);
        const sellerShops = await prisma.shops.findMany({
            where: { id: { in: createdShopIds } },
            select: { id: true, sellerId: true, name: true }
        });

        for (const shop of sellerShops) {
            const firstProduct = shopGrouped[shop.id][0];
            const productTitle = firstProduct?.title || "new item";
            try {
                await prisma.notifications.create({
                    data: {
                        type: "Order",
                        title: "Đơn hàng COD mới",
                        message: `Bạn có đơn hàng COD mới cho ${productTitle} tại shop ${shop.name}.`,
                        creatorId: userId || undefined,
                        receiverId: shop.sellerId,
                        redirect_link: `/dashboard/orders`,
                    },
                });
            } catch (err) {
                console.error("Seller notification error:", err);
            }
        }

        // Create notifications for admins  
        try {
            const adminUsers = await prisma.users.findMany({
                where: { role: "admin" },
                select: { id: true },
            });

            for (const admin of adminUsers) {
                await prisma.notifications.create({
                    data: {
                        type: "Order",
                        title: "Đơn hàng COD mới trên platform",
                        message: `Đơn hàng COD mới. Order ID: ${createdOrders[0]?.id}.`,
                        creatorId: userId || undefined,
                        receiverId: admin.id,
                        redirect_link: `/dashboard/orders`,
                    },
                });
            }
        } catch (err) {
            console.error("Admin notification error:", err);
        }

        // Delete payment session from Redis
        await redis.del(sessionKey);

        return res.status(201).json({
            success: true,
            message: "COD order created successfully",
            orders: createdOrders,
            orderId: createdOrders[0]?.id,
        });

    } catch (error: any) {
        console.error("Error creating COD order:", error);
        await sendLog({
            type: 'error',
            message: `Error creating COD order: ${error.message}`,
            source: 'order-service'
        });
        return next(error);
    }
};
