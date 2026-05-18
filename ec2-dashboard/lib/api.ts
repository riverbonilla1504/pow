/**
 * API facade — selecciona entre implementación mock (localStorage) y backend real.
 * Si NEXT_PUBLIC_USE_MOCK_API=true, usa datos locales para desarrollo.
 * En producción, todas las llamadas van a api.freck.lat.
 */
import * as backend from './api-backend';
import * as mock from './api-mock';

// Selecciona la implementación según la variable de entorno
const api = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' ? mock : backend;

// Re-exporta todas las funciones de la implementación seleccionada
// Autenticación y gestión de token
export const setToken = api.setToken;
export const clearToken = api.clearToken;
export const hasToken = api.hasToken;
export const login = api.login;
export const register = api.register;

// 2FA (Two-Factor Authentication)
export const verify2fa = api.verify2fa;
export const enroll2fa = api.enroll2fa;
export const confirm2fa = api.confirm2fa;
export const recover2fa = api.recover2fa;
export const getTokenPayload = api.getTokenPayload;

// Órdenes del usuario
export const myOrders = api.myOrders;
export const createOrder = api.createOrder;

// Panel de administración
export const adminDashboard = api.adminDashboard;
export const adminOrders = api.adminOrders;
export const adminNotifications = api.adminNotifications;
export const adminDLQ = api.adminDLQ;
export const adminUsers = api.adminUsers;
export const updateRole = api.updateRole;

// Utilidades de usuario y navegación
export const getMe = api.getMe;
export const isAdminHost = api.isAdminHost;
export const loginUrl = api.loginUrl;
export const postLoginPath = api.postLoginPath;
export const adminHomePath = api.adminHomePath;
export const isAdminRole = api.isAdminRole;
