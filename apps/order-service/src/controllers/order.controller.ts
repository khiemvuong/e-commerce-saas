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
        console.log("[DEBUG] createPaymentSession called");
        const {cart,selectedAddressId,coupon} = req.body;
        const userId = req.user.id;
        console.log("[DEBUG] userId:", userId, "cart items:", cart?.length);

        if(!cart || cart.length===0 || !Array.isArray(cart)){
            console.log("[DEBUG] Cart validation failed");
            return next(new ValidationError("Cart is empty or invalid"));
        }

        const normalizedCart = JSON.stringify(
        cart
            .map((item:any) => ({
                id: item.id,
                quantity: item.quantity,
                sale_price: item.sale_price ?? item.price,
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
                            sale_price: item.sale_price ?? item.price,
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

        // Filter out undefined/null shopIds to prevent Prisma error
        const uniqueShopIds = [...new Set(
            cart.map((item:any) => item.shopId).filter((id: any) => id !== undefined && id !== null)
        )] as string[];
        console.log("[DEBUG] uniqueShopIds:", uniqueShopIds);

        if (uniqueShopIds.length === 0) {
            console.log("[DEBUG] No valid shopIds found in cart");
            return next(new ValidationError("Cart contains products without shop information"));
        }

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
            return total + ((item.sale_price ?? item.price ?? 0) * item.quantity);
        },0);
        //Create session payload
        const sessionId = crypto.randomUUID();
        console.log("[DEBUG] Generated sessionId:", sessionId);
        const sessionData = {
            userId,
            cart,
            sellers: sellerData,
            totalAmount,
            shippingAddressId: selectedAddressId,
            coupon: coupon || null,
        }
        console.log("[DEBUG] About to save to Redis...");
        try {
            await redis.setex(
                `payment-session:${sessionId}`, 
                600, // 10 minutes expiration
                JSON.stringify(sessionData)
            );
            console.log("[DEBUG] Redis setex succeeded");
        } catch (redisError) {
            console.error("[DEBUG] Redis setex FAILED:", redisError);
            throw redisError;
        }
        sendLog({
            type: 'info',
            message: `Payment session created: ${sessionId} for user: ${userId}`,
            source: 'order-service'
        }).catch(() => {});
        console.log("[DEBUG] Returning sessionId to client:", sessionId);
        res.status(201).json({ sessionId });
    } catch (error) {
        console.error("[DEBUG] createPaymentSession error:", error);
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
                    (sum:number, p:any) => sum + ((p.sale_price ?? p.price ?? 0) * p.quantity),0
                );
                if(coupon && coupon.discountedProductId && orderItems.some((item:any) => item.id === coupon.discountedProductId)
                ){
                    const discountedItem = orderItems.find((item:any) => item.id === coupon.discountedProductId);
                    if(discountedItem) {
                        const discount = coupon.discountPercent > 0
                        ? ((discountedItem.sale_price ?? discountedItem.price ?? 0) * discountedItem.quantity) * (coupon.discountPercent / 100)
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
                                price: item.sale_price ?? item.price ?? 0,
                                selectedOptions: item.selectedOptions || {},
                                title: item.title,
                            })),
                        },
                    },
                });
                // Update stock immediately (critical — prevents oversell)
                for(const item of orderItems){
                    await prisma.products.update({
                        where: {id: item.id},
                        data: {
                            stock: {decrement: item.quantity},
                            totalSales: {increment: item.quantity},
                        },
                    });
                }
            }

            // Respond to Stripe FIRST (must be fast to avoid webhook retry)
            res.status(200).json({received: true});

            // ── Fire-and-forget: analytics, email, notifications, logs ──
            const sideEffects = async () => {
                try {
                    await Promise.allSettled([
                        // Log
                        sendLog({
                            type: 'success',
                            message: `Stripe order created for user: ${userId}, session: ${sessionId}`,
                            source: 'order-service'
                        }),

                        // Email
                        sendEmail(
                            email,
                            'Order Confirmation',
                            "order-confirmation",
                            {
                                name,
                                cart,
                                totalAmount: coupon?.discountAmount
                                    ? (totalAmount - coupon.discountAmount)
                                    : totalAmount,
                                trackingUrl: `https://ilan.com/order/${sessionId}`,
                            }
                        ),

                        // Product analytics (parallel per item)
                        ...Object.entries(shopGrouped).flatMap(([shopId, items]: [string, any]) =>
                            items.map((item: any) =>
                                prisma.productAnalytics.upsert({
                                    where: { productId: item.id },
                                    create: { productId: item.id, shopId, purchases: item.quantity, lastViewedAt: new Date() },
                                    update: { purchases: { increment: item.quantity } },
                                })
                            )
                        ),

                        // User analytics (single update with all purchase actions)
                        (async () => {
                            const existingAnalytics = await prisma.userAnalytics.findUnique({ where: { userId } });
                            const newActions = cart.map((item: any) => ({
                                productId: item.id,
                                shopId: item.shopId,
                                action: 'purchase',
                                timestamp: Date.now(),
                            }));
                            const currentActions = Array.isArray(existingAnalytics?.actions)
                                ? (existingAnalytics?.actions as Prisma.JsonArray)
                                : [];
                            if (existingAnalytics) {
                                await prisma.userAnalytics.update({
                                    where: { userId },
                                    data: { lastVisited: new Date(), actions: [...currentActions, ...newActions] },
                                });
                            } else {
                                await prisma.userAnalytics.create({
                                    data: { userId, lastVisited: new Date(), actions: newActions },
                                });
                            }
                        })(),

                        // Seller notifications
                        (async () => {
                            const createdShopIds = Object.keys(shopGrouped);
                            const sellerShops = await prisma.shops.findMany({
                                where: { id: { in: createdShopIds } },
                                select: { id: true, sellerId: true, name: true }
                            });
                            await Promise.allSettled(
                                sellerShops.map(shop => {
                                    const firstProduct = shopGrouped[shop.id]?.[0];
                                    return prisma.notifications.create({
                                        data: {
                                            type: "Order",
                                            title: "New Order Received",
                                            message: `You have a new order for ${firstProduct?.title || 'new item'} in your shop - ${shop.name}.`,
                                            creatorId: userId,
                                            receiverId: shop.sellerId,
                                            redirect_link: `/dashboard/orders`,
                                        },
                                    });
                                })
                            );
                        })(),
                    ]);
                } catch (err) {
                    console.error("Side-effect error (non-blocking):", err);
                }
            };
            sideEffects();
        }
        // If not payment_intent.succeeded, just acknowledge
        if (!res.headersSent) {
            res.status(200).json({received: true});
        }
    } catch (error: any) {
        console.error("Error processing order creation:", error);
        sendLog({
            type: 'error',
            message: `Error processing order creation: ${error.message}`,
            source: 'order-service'
        }).catch(() => {});
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
        const price = (matchingProduct.sale_price ?? matchingProduct.price ?? 0) * matchingProduct.quantity;
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
            take: 50,
            select: {
                id: true,
                total: true,
                status: true,
                paymentMethod: true,
                deliveryStatus: true,
                createdAt: true,
                items: {
                    select: {
                        id: true,
                        productId: true,
                        quantity: true,
                        price: true,
                        title: true,
                        selectedOptions: true,
                    }
                },
                shop: { select: { id: true, name: true } },
            }
        });

        res.status(200).json({success: true, orders});
    } catch (error) {
        next(error);
    }
}

/**
 * GET /get-order-stats
 * Returns ONLY order counts (total, processing, completed) for the profile stat cards.
 * Much lighter than get-user-orders — no joins, no item data, just 3 counts.
 */
export const getUserOrderStats = async (req:any, res:Response, next:NextFunction) => {
    try {
        const userId = req.user.id;
        const [total, processing, completed] = await Promise.all([
            prisma.orders.count({ where: { userId } }),
            prisma.orders.count({
                where: {
                    userId,
                    deliveryStatus: { notIn: ['Delivered', 'Cancelled'] },
                },
            }),
            prisma.orders.count({ where: { userId, deliveryStatus: 'Delivered' } }),
        ]);
        res.status(200).json({ success: true, stats: { total, processing, completed } });
    } catch (error) {
        next(error);
    }
}


// Get admin orders
export const getAdminOrders = async (req:any,res:Response,next:NextFunction) => {
    try {
        const page = parseInt((req.query.page as string) || "1", 10);
        const limit = parseInt((req.query.limit as string) || "20", 10);
        const skip = Math.max(0, (page - 1) * limit);

        const [orders, total] = await Promise.all([
            prisma.orders.findMany({
                skip,
                take: limit,
                orderBy: {createdAt: 'desc'},
                select: {
                    id: true,
                    total: true,
                    status: true,
                    paymentMethod: true,
                    deliveryStatus: true,
                    guestEmail: true,
                    createdAt: true,
                    user: { select: { id: true, name: true, email: true } },
                    shop: { select: { id: true, name: true } },
                }
            }),
            prisma.orders.count()
        ]);

        res.status(200).json({
            success: true,
            orders,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
        });
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
                (sum: number, p: any) => sum + ((p.sale_price ?? p.price ?? 0) * p.quantity), 0
            );

            // Apply coupon if applicable
            if (coupon && coupon.discountedProductId && 
                orderItems.some((item: any) => item.id === coupon.discountedProductId)) {
                const discountedItem = orderItems.find((item: any) => item.id === coupon.discountedProductId);
                if (discountedItem) {
                    const discount = coupon.discountPercent > 0
                        ? ((discountedItem.sale_price ?? discountedItem.price ?? 0) * discountedItem.quantity) * (coupon.discountPercent / 100)
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
                            price: item.sale_price ?? item.price ?? 0,
                            selectedOptions: item.selectedOptions || {},
                            title: item.title,
                        })),
                    },
                },
            });

            createdOrders.push(order);

            // Update stock immediately (critical — prevents oversell)
            for (const item of orderItems) {
                await prisma.products.update({
                    where: { id: item.id },
                    data: {
                        stock: { decrement: item.quantity },
                        totalSales: { increment: item.quantity },
                    },
                });
            }
        }

        // ── Response FIRST, side-effects AFTER (fire-and-forget) ──
        // Delete session + respond immediately
        redis.del(sessionKey).catch(() => {});

        res.status(201).json({
            success: true,
            message: "COD order created successfully",
            orders: createdOrders,
            orderId: createdOrders[0]?.id,
        });

        // ── Fire-and-forget: analytics, email, notifications, logs ──
        const sideEffects = async () => {
            try {
                const finalAmount = coupon?.discountAmount
                    ? (totalAmount - coupon.discountAmount)
                    : totalAmount;

                // All side-effects run in parallel
                await Promise.allSettled([
                    // Log
                    sendLog({
                        type: 'success',
                        message: `COD Order created: ${createdOrders.map(o => o.id).join(', ')} for ${userId ? `user: ${userId}` : `guest: ${guestEmail}`}`,
                        source: 'order-service'
                    }),

                    // Email
                    sendEmail(
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
                    ),

                    // Product & User analytics (parallel per item)
                    ...Object.entries(shopGrouped).flatMap(([shopId, items]: [string, any]) =>
                        items.map((item: any) =>
                            prisma.productAnalytics.upsert({
                                where: { productId: item.id },
                                create: { productId: item.id, shopId, purchases: item.quantity, lastViewedAt: new Date() },
                                update: { purchases: { increment: item.quantity } },
                            })
                        )
                    ),

                    // User analytics (single update with all purchase actions)
                    ...(userId ? [
                        (async () => {
                            const existingAnalytics = await prisma.userAnalytics.findUnique({ where: { userId } });
                            const newActions = cart.map((item: any) => ({
                                productId: item.id,
                                shopId: item.shopId,
                                action: 'purchase',
                                paymentMethod: 'cod',
                                timestamp: Date.now(),
                            }));
                            const currentActions = Array.isArray(existingAnalytics?.actions)
                                ? (existingAnalytics?.actions as Prisma.JsonArray)
                                : [];
                            if (existingAnalytics) {
                                await prisma.userAnalytics.update({
                                    where: { userId },
                                    data: { lastVisited: new Date(), actions: [...currentActions, ...newActions] },
                                });
                            } else {
                                await prisma.userAnalytics.create({
                                    data: { userId, lastVisited: new Date(), actions: newActions },
                                });
                            }
                        })()
                    ] : []),

                    // Seller notifications
                    (async () => {
                        const createdShopIds = Object.keys(shopGrouped);
                        const sellerShops = await prisma.shops.findMany({
                            where: { id: { in: createdShopIds } },
                            select: { id: true, sellerId: true, name: true }
                        });
                        await Promise.allSettled(
                            sellerShops.map(shop => {
                                const firstProduct = shopGrouped[shop.id]?.[0];
                                return prisma.notifications.create({
                                    data: {
                                        type: "Order",
                                        title: "Đơn hàng COD mới",
                                        message: `Bạn có đơn hàng COD mới cho ${firstProduct?.title || 'new item'} tại shop ${shop.name}.`,
                                        creatorId: userId || undefined,
                                        receiverId: shop.sellerId,
                                        redirect_link: `/dashboard/orders`,
                                    },
                                });
                            })
                        );
                    })(),
                ]);
            } catch (err) {
                console.error("Side-effect error (non-blocking):", err);
            }
        };
        sideEffects();

    } catch (error: any) {
        console.error("Error creating COD order:", error);
        sendLog({
            type: 'error',
            message: `Error creating COD order: ${error.message}`,
            source: 'order-service'
        }).catch(() => {});
        return next(error);
    }
};
