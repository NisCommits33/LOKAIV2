/**
 * khalti.ts — Khalti Payment Gateway Integration (KPG-2 / epayment)
 *
 * Handles payment initiation and verification with Khalti's epayment v2 API.
 * Uses server-side API key authorization.
 *
 * API Reference: https://docs.khalti.com/khalti-epayment/
 *
 * Test Credentials:
 *   Khalti ID: 9800000000 / 9800000001 / 9800000002 / 9800000003 / 9800000004 / 9800000005
 *   Test MPIN: 1111
 *   Test OTP: 987654
 *
 * @module lib/payments/khalti
 */

const KHALTI_CONFIG = {
  sandbox: {
    baseUrl: "https://dev.khalti.com/api/v2",
    payUrl: "https://test-pay.khalti.com",
  },
  production: {
    baseUrl: "https://khalti.com/api/v2",
    payUrl: "https://pay.khalti.com",
  },
};

function getConfig() {
  const isProduction = process.env.KHALTI_ENVIRONMENT === "production";

  if (isProduction && !process.env.KHALTI_SECRET_KEY) {
    throw new Error(
      "Khalti production credentials (KHALTI_SECRET_KEY) are not configured"
    );
  }

  return {
    ...KHALTI_CONFIG[isProduction ? "production" : "sandbox"],
    secretKey:
      process.env.KHALTI_SECRET_KEY || "05bf95cc57244045b8df5fad06748dab",
  };
}

export interface KhaltiPaymentParams {
  /** Amount in NPR (will be converted to paisa internally) */
  amount: number;
  purchaseOrderId: string;
  purchaseOrderName: string;
  returnUrl: string;
  websiteUrl: string;
}

export interface KhaltiInitiateResponse {
  pidx: string;
  payment_url: string;
  expires_at: string;
  expires_in: number;
}

export interface KhaltiCallbackParams {
  pidx: string;
  txnId?: string;
  amount?: string;
  total_amount?: string;
  status: string;
  mobile?: string;
  tidx?: string;
  purchase_order_id: string;
  purchase_order_name: string;
  transaction_id?: string;
}

export interface KhaltiLookupResponse {
  pidx: string;
  total_amount: number;
  status: string;
  transaction_id: string | null;
  fee: number;
  refunded: boolean;
}

/**
 * Initiate a Khalti payment via server-side API call.
 * Returns a payment URL to redirect the user to.
 */
export async function initiateKhaltiPayment(
  params: KhaltiPaymentParams
): Promise<{
  success: boolean;
  data?: KhaltiInitiateResponse;
  error?: string;
}> {
  const config = getConfig();

  // Khalti requires amount in paisa (1 NPR = 100 paisa)
  const amountInPaisa = Math.round(params.amount * 100);

  try {
    const response = await fetch(`${config.baseUrl}/epayment/initiate/`, {
      method: "POST",
      headers: {
        Authorization: `Key ${config.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        return_url: params.returnUrl,
        website_url: params.websiteUrl,
        amount: amountInPaisa,
        purchase_order_id: params.purchaseOrderId,
        purchase_order_name: params.purchaseOrderName,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      const errMsg =
        errData?.detail ||
        Object.values(errData || {})
          .flat()
          .join(", ") ||
        "Khalti initiation failed";
      return { success: false, error: String(errMsg) };
    }

    const data: KhaltiInitiateResponse = await response.json();
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to connect to Khalti" };
  }
}

/**
 * Verify a Khalti payment using the Lookup API.
 * Should be called after the callback redirect to confirm payment status.
 */
export async function verifyKhaltiPayment(pidx: string): Promise<{
  success: boolean;
  data?: KhaltiLookupResponse;
  error?: string;
}> {
  const config = getConfig();

  try {
    const response = await fetch(`${config.baseUrl}/epayment/lookup/`, {
      method: "POST",
      headers: {
        Authorization: `Key ${config.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pidx }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      return {
        success: false,
        error: errData?.detail || "Khalti lookup failed",
      };
    }

    const data: KhaltiLookupResponse = await response.json();

    if (data.status === "Completed") {
      return { success: true, data };
    }

    return {
      success: false,
      data,
      error: `Payment status: ${data.status}`,
    };
  } catch {
    return { success: false, error: "Failed to verify with Khalti" };
  }
}
