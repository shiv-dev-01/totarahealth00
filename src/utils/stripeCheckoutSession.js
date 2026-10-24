const SNAPSHOT_KEY = "totara_checkout_snapshot";
const processedKey = (paymentIntentId) =>
  `totara_pi_processed_${paymentIntentId}`;

export const saveCheckoutSnapshot = (snapshot) => {
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.warn("[stripe] could not save checkout snapshot", e);
  }
};

export const loadCheckoutSnapshot = () => {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearCheckoutSnapshot = () => {
  try {
    sessionStorage.removeItem(SNAPSHOT_KEY);
  } catch {
    /* ignore */
  }
};

export const isPaymentIntentProcessed = (paymentIntentId) =>
  sessionStorage.getItem(processedKey(paymentIntentId)) === "1";

export const markPaymentIntentProcessed = (paymentIntentId) => {
  try {
    sessionStorage.setItem(processedKey(paymentIntentId), "1");
  } catch {
    /* ignore */
  }
};

export const cleanStripeReturnParamsFromUrl = () => {
  const url = new URL(window.location.href);
  ["payment_intent", "payment_intent_client_secret", "redirect_status"].forEach(
    (key) => url.searchParams.delete(key)
  );
  window.history.replaceState({}, "", url.toString());
};

export const getStripeReturnParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    paymentIntentId: params.get("payment_intent"),
    clientSecret: params.get("payment_intent_client_secret"),
    redirectStatus: params.get("redirect_status"),
  };
};

export const buildReturnUrl = () => {
  const url = new URL(window.location.href);
  ["payment_intent", "payment_intent_client_secret", "redirect_status"].forEach(
    (key) => url.searchParams.delete(key)
  );
  return url.toString();
};
