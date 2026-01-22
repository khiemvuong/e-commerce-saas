/**
 * Get Admin Query
 */

export type GetAdmin = (admin: any) => { success: true; admin: any };

export const makeGetAdmin = (): GetAdmin => {
    return (admin) => {
        return { success: true, admin };
    };
};
