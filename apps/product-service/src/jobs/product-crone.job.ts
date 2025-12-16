import prisma from "@packages/libs/prisma";
import cron from "node-cron";

cron.schedule("0 * * * *", async () => {
    try {
        const now = new Date();
        await prisma.products.deleteMany({
            where: {
                isDeleted: true,
                deletedAt: {
                    lte: now,
                },
            },
        });
    } catch (error) {
        console.error("Error deleting products:", error);
    }
});

cron.schedule("*/10 * * * *", async () => {
    try {
        const now = new Date();
        console.log("Running expired events reset job at", now.toISOString());
        const expiredEvents = await prisma.products.findMany({
            where: {
                ending_date: {
                    not: null,
                    lte: now,
                },
            },
            select: { id: true, regular_price: true },
        });

        if (expiredEvents.length > 0) {
            await Promise.all(expiredEvents.map((event) => 
                prisma.products.update({
                    where: { id: event.id },
                    data: {
                        starting_date: null,
                        ending_date: null,
                        sale_price: event.regular_price,
                    },
                })
            ));
        }
    } catch (error) {
        console.error("Error resetting expired events:", error);
    }
});