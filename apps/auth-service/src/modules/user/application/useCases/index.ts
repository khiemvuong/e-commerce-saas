/**
 * User Use Cases Index
 */

export { makeRegisterUser } from './registerUser';
export type { RegisterUser } from './registerUser';

export { makeVerifyUser } from './verifyUser';
export type { VerifyUser } from './verifyUser';

export { makeLoginUser } from './loginUser';
export type { LoginUser } from './loginUser';

export { makeLogoutUser } from './logoutUser';
export type { LogoutUser } from './logoutUser';

export { makeForgotPassword } from './forgotPassword';
export type { ForgotPassword } from './forgotPassword';

export { makeVerifyForgotPassword } from './verifyForgotPassword';
export type { VerifyForgotPassword } from './verifyForgotPassword';

export { makeResetPassword } from './resetPassword';
export type { ResetPassword } from './resetPassword';

export { makeUpdateProfile } from './updateProfile';
export type { UpdateProfile } from './updateProfile';

export { makeUpdatePassword } from './updatePassword';
export type { UpdatePassword } from './updatePassword';

export { makeUploadAvatar } from './uploadAvatar';
export type { UploadAvatar } from './uploadAvatar';

export { makeRefreshToken } from './refreshToken';
export type { RefreshToken } from './refreshToken';

// 2FA Use Cases
export { makeEnable2FA } from './enable2FA';
export type { Enable2FA } from './enable2FA';

export { makeVerify2FA } from './verify2FA';
export type { Verify2FA } from './verify2FA';

export { makeDisable2FA } from './disable2FA';
export type { Disable2FA } from './disable2FA';

export { makeVerifyLoginWith2FA } from './verifyLoginWith2FA';
export type { VerifyLoginWith2FA } from './verifyLoginWith2FA';

export { makeGet2FAStatus } from './get2FAStatus';
export type { Get2FAStatus } from './get2FAStatus';

// Change Password OTP Use Cases
export { makeRequestChangePasswordOtp } from './requestChangePasswordOtp';
export type { RequestChangePasswordOtp } from './requestChangePasswordOtp';

export { makeVerifyChangePasswordOtp } from './verifyChangePasswordOtp';
export type { VerifyChangePasswordOtp } from './verifyChangePasswordOtp';
