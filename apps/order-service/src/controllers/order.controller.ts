import { ValidationError } from "@packages/error-handler";
import prisma from "@packages/libs/prisma";
import redis from "@packages/libs/redis";
import { Prisma } from "@prisma/client";
import { Request,NextFunction,Response } from "express";
import { Stripe } from "stripe";
import { sendEmail } from "../utils/send-email";

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
            metadata: {
                sessionId: sessionId,
                userId: req.user.id,
            },
        });
        res.send({
            clientSecret: paymentIntent.client_secret,
        })
    } catch (error) {
        next(error);
    }
}

//Create oayment session
export const createPaymentSession = async (req:any,res:Response,next:NextFunction) => {
    try {
        const {cart,selectedAdressId,coupon} = req.body;
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
            shippingAdrressId: selectedAdressId,
            coupon: coupon || null,
        }
        await redis.setex(
            `payment-session:${sessionId}`, 
            600, // 10 minutes expiration
            JSON.stringify(sessionData)
        );

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

        if(!sessionData || typeof sessionData !== 'string'){
            return res.status(404).json({valid: false, message: "Payment session not found or expired"});
        }

        //Parse and return session
        const session = JSON.parse(sessionData);

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
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        if(event.type === 'payment_intent.succeeded'){
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const sessionId = paymentIntent.metadata.sessionId;
            const userId = paymentIntent.metadata.userId;

            const sessionKey = `payment-session:${sessionId}`;
            const sessionData = await redis.get(sessionKey);

            if(!sessionData || typeof sessionData !== 'string'){
                console.warn("Payment session not found or expired for sessionId:", sessionId);
                return res
                .status(404)
                .send("Payment session not found or expired");
            }
            const {cart,totalAmount,shippingAddressId,coupon} = JSON.parse(sessionData);
            const user = await prisma.users.findUnique({
                where: {id: userId},
            });
            const name = user?.email || "Customer";
            const email = user?.email || "no-reply@example.com";

            const shopGrouped = cart.reduce((acc:any, item:any) => {
                if(!acc[item.shopId]){
                    acc[item.shopId] = [];
                }
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
                await prisma.orders.create({
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
                            })),
                        },
                    },
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

                    await prisma.notifications.create({
                        data: {
                            title:"New Order Received",
                            message: `You have a new order for ${productTitle} in your shop - ${shop.name}.`,
                            creatorId: userId,
                            receiverId: shop.sellerId,
                            redirect_link: `https://ilan.com/order/${sessionId}`,
                        },
                    });
                }
                //Notification for admin
                await prisma.notifications.create({
                    data: {
                        title: "Platform Order Alert",
                        message: `A new order has been placed on the platform. Order ID: ${sessionId}.`,
                        creatorId: userId,
                        receiverId: 'admin',
                        redirect_link: `https://ilan.com/orders/${sessionId}`,
                    },
                });
                await redis.del(sessionKey);
            }
        }
        res.status(200).json({received: true});
    } catch (error) {
        console.error("Error processing order creation:", error);
        return next(error);
    }
}
