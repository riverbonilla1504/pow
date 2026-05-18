/**
 * API facade — mock (localStorage) o backend real.
 * Backend: NEXT_PUBLIC_USE_MOCK_API=false y proxy /api/backend en next.config.ts
 */
import * as backend from './api-backend';
import * as mock from './api-mock';

const api = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' ? mock : backend;

export const setToken = api.setToken;
export const clearToken = api.clearToken;
export const hasToken = api.hasToken;
export const login = api.login;
export const register = api.register;
export const verify2fa = api.verify2fa;
export const enroll2fa = api.enroll2fa;
export const confirm2fa = api.confirm2fa;
export const recover2fa = api.recover2fa;
export const getTokenPayload = api.getTokenPayload;
export const myOrders = api.myOrders;
export const createOrder = api.createOrder;
export const adminDashboard = api.adminDashboard;
export const adminOrders = api.adminOrders;
export const adminNotifications = api.adminNotifications;
export const adminDLQ = api.adminDLQ;
export const adminUsers = api.adminUsers;
export const updateRole = api.updateRole;
export const getMe = api.getMe;
export const isAdminHost = api.isAdminHost;
export const loginUrl = api.loginUrl;
export const postLoginPath = api.postLoginPath;
export const adminHomePath = api.adminHomePath;
