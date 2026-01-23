/**
 * Address Module Index
 */

export { makeAddAddress, makeDeleteAddress } from './application/useCases';
export { makeGetUserAddresses } from './application/queries';
export { addressController } from './interface/http/addressController';
export { addressRoutes } from './interface/http/addressRoutes';
