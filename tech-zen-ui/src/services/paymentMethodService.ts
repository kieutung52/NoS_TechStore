import { CreatePaymentRequest, PaymentMethodResponse } from "@/types";
import { apiCall } from "./api";

export const getAllPaymentMethods = async () => {
    return apiCall<PaymentMethodResponse[]>("GET", "/payment-methods");
};

export const getPaymentMethodById = async (id: number) => {
    return apiCall<PaymentMethodResponse>("GET", `/payment-methods/${id}`);
};

export const createPaymentMethod = async (request: CreatePaymentRequest) => {
    return apiCall<PaymentMethodResponse>("POST", "/payment-methods", request);
};

export const updatePaymentMethod = async (id: number, request: CreatePaymentRequest) => {
    return apiCall<PaymentMethodResponse>("PUT", `/payment-methods/${id}`, request);
};

export const deletePaymentMethod = async (id: number) => {
    return apiCall<void>("DELETE", `/payment-methods/${id}`);
};

export const togglePayment = async (id: number) => {
    return apiCall<PaymentMethodResponse>("PUT", `/payment-methods/${id}/toggle`);
};

export const getActivePayments = async () => {
    return apiCall<PaymentMethodResponse[]>("GET", "/payment-methods/active");
};
