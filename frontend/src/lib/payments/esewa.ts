/**
 * esewa.ts — eSewa Payment Gateway Integration (epay v2)
 *
 * Handles payment initiation and verification with eSewa's epay v2 API.
 * Uses HMAC-SHA256 signatures for secure communication.
 *
 * API Reference: https://developer.esewa.com.np/pages/Epay
 *
 * Test Credentials:
 *   eSewa ID: 9806800001/2/3/4/5
 *   Password: Nepal@123
 *   MPIN: 1122
 *   OTP Token: 123456
 *   Merchant Code: EPAYTEST
 *   Secret Key: 8gBm/:&EnhH.1/q
 *
 * @module lib/payments/esewa
 */

import crypto from "crypto";

const ESEWA_CONFIG = {
  sandbox: {
    paymentUrl: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
    statusUrl: "https://rc.esewa.com.np/api/epay/transaction/status/",
  },
  production: {
    paymentUrl: "https://epay.esewa.com.np/api/epay/main/v2/form",
    statusUrl: "https://esewa.com.np/api/epay/transaction/status/",
  },
};

function getConfig() {
  const isProduction = process.env.ESEWA_ENVIRONMENT === "production";

  if (isProduction && (!process.env.ESEWA_MERCHANT_CODE || !process.env.ESEWA_SECRET_KEY)) {
    throw new Error("eSewa production credentials (ESEWA_MERCHANT_CODE, ESEWA_SECRET_KEY) are not configured");
  }

  return {
    ...ESEWA_CONFIG[isProduction ? "production" : "sandbox"],
    merchantCode: process.env.ESEWA_MERCHANT_CODE || "EPAYTEST",
    secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
  };
}

/**
 * Generate HMAC-SHA256 signature (base64) for eSewa payment
 */
function generateSignature(message: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(message);
  return hmac.digest("base64");
}

export interface EsewaPaymentParams {
  amount: number;
  taxAmount?: number;
  transactionUuid: string;
  productCode?: string;
  successUrl: string;
  failureUrl: string;
}

/**
 * Generate the eSewa payment form data.
 * Returns the payment URL and form fields to POST via hidden form.
 */
export function createEsewaPaymentForm(params: EsewaPaymentParams) {
  const config = getConfig();
  const totalAmount = params.amount + (params.taxAmount || 0);
  const productCode = params.productCode || config.merchantCode;

  // Signature message: must follow exact order per eSewa docs
  const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${params.transactionUuid},product_code=${productCode}`;
  const signature = generateSignature(signatureMessage, config.secretKey);

  return {
    url: config.paymentUrl,
    formData: {
      amount: String(params.amount),
      tax_amount: String(params.taxAmount || 0),
      total_amount: String(totalAmount),
      transaction_uuid: params.transactionUuid,
      product_code: productCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: params.successUrl,
      failure_url: params.failureUrl,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    },
  };
}

/**
 * eSewa success redirect response (base64-decoded JSON)
 * Matches actual eSewa epay v2 response format
 */
export interface EsewaSuccessResponse {
  transaction_code: string;
  status: string;
  total_amount: number;
  transaction_uuid: string;
  product_code: string;
  signed_field_names: string;
  signature: string;
}

/**
 * eSewa transaction status API response
 */
export interface EsewaStatusResponse {
  product_code: string;
  transaction_uuid: string;
  total_amount: number;
  status: string;
  ref_id: string | null;
}

/**
 * Verify the HMAC signature in eSewa's success redirect response.
 * Ensures the response hasn't been tampered with.
 */
function verifyResponseSignature(data: EsewaSuccessResponse): boolean {
  const config = getConfig();
  const fieldNames = data.signed_field_names.split(",");

  // Build message from signed fields in the exact order specified
  const message = fieldNames
    .map((field) => `${field}=${data[field as keyof EsewaSuccessResponse]}`)
    .join(",");

  const expectedSignature = generateSignature(message, config.secretKey);
  return expectedSignature === data.signature;
}

/**
 * Verify an eSewa payment after success redirect.
 *
 * 1. Decode base64 response from eSewa
 * 2. Verify HMAC signature integrity
 * 3. Cross-check with eSewa's transaction status API
 */
export async function verifyEsewaPayment(
  encodedData: string
): Promise<{
  success: boolean;
  data?: EsewaSuccessResponse;
  statusData?: EsewaStatusResponse;
  error?: string;
}> {
  try {
    // Step 1: Decode the base64 response
    const decodedString = Buffer.from(encodedData, "base64").toString("utf-8");
    const data: EsewaSuccessResponse = JSON.parse(decodedString);

    // Step 2: Verify signature integrity
    if (!verifyResponseSignature(data)) {
      return { success: false, error: "Invalid response signature" };
    }

    // Step 3: Check status is COMPLETE
    if (data.status !== "COMPLETE") {
      return { success: false, error: `Payment status: ${data.status}` };
    }

    // Step 4: Cross-verify with eSewa's status check API
    const config = getConfig();
    const statusUrl = new URL(config.statusUrl);
    statusUrl.searchParams.set("product_code", config.merchantCode);
    statusUrl.searchParams.set("total_amount", String(data.total_amount));
    statusUrl.searchParams.set("transaction_uuid", data.transaction_uuid);

    const statusResponse = await fetch(statusUrl.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!statusResponse.ok) {
      return { success: false, error: "Failed to verify with eSewa status API" };
    }

    const statusData: EsewaStatusResponse = await statusResponse.json();

    if (statusData.status !== "COMPLETE") {
      return {
        success: false,
        error: `Status API returned: ${statusData.status}`,
      };
    }

    return { success: true, data, statusData };
  } catch {
    return { success: false, error: "Invalid payment data" };
  }
}
