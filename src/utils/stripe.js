import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { createPaymentIntent_stripe, createOrder_stripe } from "./Constant";

// Totara Health Stripe publishable key — must match the panel backend secret key account
export const STRIPE_PUBLISHABLE_KEY =
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
  "pk_test_51TpxvkI0BKWIc34RVJHDlR6TUXa480id19ZyJ9nFLe77EIP8sLkuZnRRnof7TMht0aMA5OLTdsNPtwpsdmAiygYq00aCYM2DtU";

let _stripePromise = null;
export const getStripePromise = () => {
  if (!_stripePromise) {
    _stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return _stripePromise;
};

export const stripeAppearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#8B9467",
    colorBackground: "#ffffff",
    colorText: "#111111",
    colorDanger: "#ef4444",
    fontFamily: "system-ui, sans-serif",
    borderRadius: "8px",
  },
  rules: {
    ".Input": {
      border: "1px solid #e2e8f0",
      padding: "12px 16px",
    },
    ".Input:focus": {
      border: "1px solid #8B9467",
      boxShadow: "0 0 0 3px rgba(139, 148, 103, 0.2)",
    },
  },
};

export const buildStripeBillingDefaults = ({
  email,
  firstName,
  lastName,
  phone,
  sameAsShipping = true,
  firstName2,
  lastName2,
  phoneNumber2,
  address,
  aptSuite,
  city,
  stateCode,
  postalCode,
  address2,
  city2,
  billingStateCode,
  postalCode2,
}) => {
  const shipName = [firstName, lastName]
    .map((part) => (part || "").trim())
    .filter(Boolean)
    .join(" ");
  const phoneDigits = (sameAsShipping ? phone : phoneNumber2 || phone || "").replace(
    /\D/g,
    ""
  );

  if (sameAsShipping) {
    return {
      email: (email || "").trim() || undefined,
      name: shipName || undefined,
      phone: phoneDigits || undefined,
      addressLine1: (address || "").trim() || undefined,
      addressLine2: (aptSuite || "").trim() || undefined,
      city: (city || "").trim() || undefined,
      state: (stateCode || "").trim() || undefined,
      postalCode: (postalCode || "").trim() || undefined,
    };
  }

  const billName =
    [firstName2, lastName2]
      .map((part) => (part || "").trim())
      .filter(Boolean)
      .join(" ") || shipName;

  return {
    email: (email || "").trim() || undefined,
    name: billName || undefined,
    phone: phoneDigits || undefined,
    addressLine1: (address2 || "").trim() || undefined,
    addressLine2: "",
    city: (city2 || "").trim() || undefined,
    state: (billingStateCode || "").trim() || undefined,
    postalCode: (postalCode2 || "").trim() || undefined,
  };
};

export const buildPaymentIntentPayload = ({
  email,
  firstName,
  lastName,
  phone,
  addressLine1,
  addressLine2,
  city,
  state,
  zip,
  sameAsShipping = true,
  billingAddressLine1,
  billingAddressLine2,
  billingCity,
  billingState,
  billingZip,
  billingFirstName,
  billingLastName,
  productName,
  sku,
  amount,
  currency = "usd",
  productId,
  coupon,
  referralId,
  commissionType,
  commissionAmount,
  commissionCurrency,
  productFamily,
  planMonths,
  orderValue,
}) => {
  const customerName = [firstName, lastName]
    .map((part) => (part || "").trim())
    .filter(Boolean)
    .join(" ");
  const shipLine1 = (addressLine1 || "").trim();
  const shipCity = (city || "").trim();
  const shipState = (state || "").trim();
  const shipZip = (zip || "").trim();
  const phoneDigits = (phone || "").replace(/\D/g, "");

  if (!customerName || !shipLine1 || !shipCity || !shipState || !shipZip) {
    throw new Error(
      "Complete shipping name and address are required before payment."
    );
  }

  const shippingAddress = {
    line1: shipLine1,
    ...(addressLine2?.trim() ? { line2: addressLine2.trim() } : {}),
    city: shipCity,
    state: shipState,
    postal_code: shipZip,
    country: "US",
  };

  const billingName = sameAsShipping
    ? customerName
    : [billingFirstName, billingLastName]
        .map((part) => (part || "").trim())
        .filter(Boolean)
        .join(" ") || customerName;

  const billingAddress = sameAsShipping
    ? shippingAddress
    : {
        line1: (billingAddressLine1 || "").trim(),
        ...(billingAddressLine2?.trim()
          ? { line2: billingAddressLine2.trim() }
          : {}),
        city: (billingCity || "").trim(),
        state: (billingState || "").trim(),
        postal_code: (billingZip || "").trim(),
        country: "US",
      };

  const resolvedProductName = productName || "Medication";
  const amountCents = Math.max(50, Math.floor(Number(amount)));

  const body = {
    email: (email || "").trim(),
    firstName: (firstName || "").trim(),
    lastName: (lastName || "").trim(),
    name: customerName,
    productName: resolvedProductName,
    sku: sku || "",
    amount: amountCents,
    currency: String(currency).toLowerCase(),
    productId: String(productId || ""),
    phone: phoneDigits,
    address: shipLine1,
    city: shipCity,
    state: shipState,
    zip: shipZip,
    country: "US",
    shipping: {
      name: customerName,
      address: shippingAddress,
    },
    shipping_name: customerName,
    shipping_address_line1: shipLine1,
    shipping_city: shipCity,
    shipping_state: shipState,
    shipping_zip: shipZip,
    shipping_country: "US",
    billing_details: {
      name: billingName,
      email: (email || "").trim(),
      phone: phoneDigits,
      address: billingAddress,
    },
    amount_details: {
      line_items: [
        {
          product_name: resolvedProductName,
          unit_cost: amountCents,
          quantity: 1,
        },
      ],
    },
    payment_method_options: {
      klarna: {
        preferred_locale: "en-US",
      },
    },
    setup_future_usage: null,
    excluded_payment_method_types: ["link"],
    payment_method_types: ["card", "klarna", "affirm", "amazon_pay"],
    automatic_payment_methods: { enabled: false },
  };

  const promoCode = coupon ? String(coupon).trim() : "";
  if (promoCode) {
    body.coupon = promoCode;
    body.promo_codes = promoCode;
    body.metadata = {
      promo_code: promoCode,
      coupon: promoCode,
    };
  }

  const resolvedReferralId = referralId ? String(referralId).trim() : "";
  if (resolvedReferralId) {
    body.referralId = resolvedReferralId;
    body.metadata = {
      ...(body.metadata || {}),
      referralId: resolvedReferralId,
    };
  }

  if (commissionType) {
    body.commissionType = commissionType;
    body.productFamily = productFamily || "";
    body.planMonths = planMonths;
    if (commissionAmount != null && commissionAmount !== "") {
      body.commissionAmount = commissionAmount;
    }
    if (commissionCurrency) body.commissionCurrency = commissionCurrency;
    if (orderValue != null && orderValue !== "") body.orderValue = orderValue;
    body.metadata = {
      ...(body.metadata || {}),
      commissionType: String(commissionType),
      commissionCurrency: String(commissionCurrency || "usd"),
      productFamily: String(productFamily || ""),
      planMonths: String(planMonths ?? ""),
      sku: String(sku || ""),
      orderValue: String(orderValue ?? ""),
      ...(commissionAmount != null && commissionAmount !== ""
        ? { commissionAmount: String(commissionAmount) }
        : {}),
    };
  }

  return body;
};

/**
 * POST .../totara/api/stripe/create-payment-intent
 */
export const createStripePaymentIntent = async (payload) => {
  const body = buildPaymentIntentPayload(payload);

  console.log("[stripe] create-payment-intent →", createPaymentIntent_stripe, body);

  try {
    const response = await axios.post(createPaymentIntent_stripe, body, {
      headers: { "Content-Type": "application/json" },
    });

    const raw = response.data;
    const clientSecret =
      raw?.clientSecret ??
      raw?.client_secret ??
      raw?.data?.clientSecret ??
      raw?.data?.client_secret ??
      raw?.result?.clientSecret ??
      raw?.result?.client_secret;

    if (!clientSecret) {
      const apiMessage =
        raw?.message || raw?.error || raw?.data?.message || raw?.data?.error;
      throw new Error(
        apiMessage ||
          "Failed to create payment intent — no clientSecret returned."
      );
    }

    return clientSecret;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const data = err.response?.data;
      const apiMessage =
        (typeof data === "string" ? null : data?.message || data?.error) ||
        (typeof data === "string" && !data.includes("<!DOCTYPE")
          ? data
          : null);

      if (status === 404) {
        throw new Error(
          "Payment service is not available yet. The backend endpoint POST /totara/api/stripe/create-payment-intent has not been deployed. Please ask your backend team to add it."
        );
      }

      throw new Error(
        apiMessage ||
          err.message ||
          `Payment initialization failed (${status || "network error"})`
      );
    }

    throw err;
  }
};

export const verifyStripePaymentSucceeded = async (
  paymentIntentId,
  clientSecret
) => {
  if (!clientSecret) {
    throw new Error("Missing payment verification secret");
  }

  const stripe = await getStripePromise();
  if (!stripe) {
    throw new Error("Stripe is not loaded");
  }

  const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret);

  if (error) {
    throw new Error(error.message || "Could not verify payment");
  }

  if (!paymentIntent || paymentIntent.status !== "succeeded") {
    throw new Error(
      paymentIntent?.status
        ? `Payment not completed (status: ${paymentIntent.status})`
        : "Payment verification failed"
    );
  }

  if (paymentIntentId && paymentIntent.id !== paymentIntentId) {
    throw new Error("Payment intent ID mismatch");
  }

  return paymentIntent;
};

export { createOrder_stripe };
