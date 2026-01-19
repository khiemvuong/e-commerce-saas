/**
 * Event Domain Types
 * 
 * Events are products with starting_date and ending_date.
 * This module defines types specific to event operations.
 */

export namespace Event {
    /**
     * Event type - extends product with required date fields
     */
    export interface Type {
        id: string;
        title: string;
        slug: string;
        short_description: string;
        sale_price: number;
        regular_price: number;
        starting_date: Date;
        ending_date: Date;
        stock: number;
        rating?: number;
        totalSales?: number;
        cash_on_delivery?: string;
        shopId: string;
        colors: string[];
        sizes: string[];
        custom_properties: any[];
        images: EventImage[];
    }

    export interface EventImage {
        id?: string;
        file_url: string;
        fileId?: string;
    }

    /**
     * Input for creating an event (converting product to event)
     */
    export interface CreateInput {
        productId: string;
        shopId: string; // For authorization
        starting_date: string | Date;
        ending_date: string | Date;
        sale_price: number | string;
    }

    /**
     * Input for editing an event
     */
    export interface EditInput {
        productId: string;
        shopId: string; // For authorization
        starting_date: string | Date;
        ending_date: string | Date;
        sale_price: number | string;
    }

    /**
     * Filter options for events
     */
    export interface FilterOptions {
        categories?: string[];
        priceMin?: number;
        priceMax?: number;
        colors?: string[];
        sizes?: string[];
    }

    /**
     * Validates event dates and price
     */
    export const validate = (input: { 
        starting_date: any; 
        ending_date: any; 
        sale_price: any;
        regular_price?: number;
    }): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!input.starting_date) {
            errors.push('Starting date is required');
        }

        if (!input.ending_date) {
            errors.push('Ending date is required');
        }

        if (!input.sale_price) {
            errors.push('Sale price is required');
        }

        if (input.starting_date && input.ending_date) {
            const start = new Date(input.starting_date);
            const end = new Date(input.ending_date);
            if (start >= end) {
                errors.push('Ending date must be after starting date');
            }
        }

        if (input.regular_price && input.sale_price) {
            const salePrice = parseFloat(String(input.sale_price));
            if (salePrice >= input.regular_price) {
                errors.push('Event sale price must be lower than regular price');
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    };

    /**
     * Check if event is active (current time is between start and end)
     */
    export const isActive = (event: Type): boolean => {
        const now = new Date();
        return event.starting_date <= now && event.ending_date >= now;
    };

    /**
     * Check if event has ended
     */
    export const hasEnded = (event: Type): boolean => {
        return event.ending_date < new Date();
    };

    /**
     * Check if event is upcoming
     */
    export const isUpcoming = (event: Type): boolean => {
        return event.starting_date > new Date();
    };
}
