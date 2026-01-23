/**
 * User Module Index
 * 
 * Main entry point for the user module.
 */

// Domain
export { User } from './domain/User';
export type { UserRepository } from './domain/UserRepository';

// Use Cases
export {
    makeRegisterUser,
    makeVerifyUser,
    makeLoginUser,
    makeLogoutUser,
    makeForgotPassword,
    makeVerifyForgotPassword,
    makeResetPassword,
    makeUpdateProfile,
    makeUpdatePassword,
    makeUploadAvatar,
} from './application/useCases';

// Queries
export { makeGetUser } from './application/queries';

// Infrastructure
export { makePrismaUserRepository, getUserRepository } from './infrastructure/PrismaUserRepository';

// Interface
export { userController } from './interface/http/userController';
export { userRoutes } from './interface/http/userRoutes';
