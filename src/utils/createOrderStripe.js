/**
 * Build JSON body for POST /totara/api/createOrder_stripe
 *
 * Multi-product format matches Koverx: product_id is an array only.
 * Totara extras: sms_transactional, sms_marketing, referralId
 */
const normalizeProductId = (id) => {
  const n = Number(id);
  return Number.isNaN(n) ? id : n;
};

export const buildCreateOrderStripeBody = ({
  email,
  firstName,
  lastName,
  phoneNumber,
  address,
  aptSuite,
  city,
  stateCode,
  postalCode,
  sameAsShipping,
  address2,
  city2,
  billingStateCode,
  postalCode2,
  appliedDiscount,
  campaignId,
  contactDetailsId,
  checkoutLinkId,
  adminId,
  shippingId,
  newShippingId,
  newshippingCost,
  shippingCode,
  dateOfBirth,
  gender,
  requiresDOBAndGender,
  productIds,
  productPrices,
  originalPrices,
  paymentToken,
  smsTransactional,
  smsMarketing,
  referralId,
  commissionType,
  commissionAmount,
  commissionCurrency,
  productFamily,
  planMonths,
  sku,
  productName,
  orderValue,
  commissionLines,
}) => {
  const ids = Array.isArray(productIds)
    ? productIds.filter(Boolean)
    : productIds
      ? [productIds]
      : [];

  const body = {
    email,
    first_name: firstName,
    last_name: lastName,
    phone: phoneNumber,
    address,
    address2: aptSuite || "",
    city_name: city,
    state_name: stateCode,
    zip_code: postalCode,
    billingSameAsShipping: sameAsShipping ? "YES" : "NO",
    start_url: window.location.href,
    payment_token: paymentToken,
    promo_codes: appliedDiscount || null,
    sms_transactional: smsTransactional ? 1 : 0,
    sms_marketing: smsMarketing ? 1 : 0,
  };

  if (ids.length > 1) {
    body.product_id = ids.map(normalizeProductId);
  } else if (ids.length === 1) {
    body.product_id = normalizeProductId(ids[0]);
    const prices = Array.isArray(productPrices) ? productPrices : [productPrices];
    const originals = Array.isArray(originalPrices)
      ? originalPrices
      : [originalPrices];
    if (prices[0] != null) body.product_price = prices[0];
    if (originals[0] != null) body.original_price = originals[0];
  }

  if (sameAsShipping) {
    body.billing_address = address;
    body.billing_address2 = aptSuite || "";
    body.billing_city_name = city;
    body.billing_state_name = stateCode;
    body.billing_zip_code = postalCode;
  } else {
    body.billing_address = address2 || "";
    body.billing_address2 = "";
    body.billing_city_name = city2 || "";
    body.billing_state_name = billingStateCode || "";
    body.billing_zip_code = postalCode2 || "";
  }

  if (campaignId) body.campaign_id = campaignId;
  if (contactDetailsId) body.contact_details_id = contactDetailsId;
  if (checkoutLinkId != null) body.checkout_link_id = checkoutLinkId;
  if (adminId != null && adminId !== "") body.admin_id = adminId;
  if (shippingId != null) body.shipping_id = shippingId;
  if (newShippingId != null) body.new_shipping_id = newShippingId;
  if (newshippingCost && parseFloat(newshippingCost) > 0)
    body.shipping_cost = newshippingCost;
  if (shippingCode) body.shipping_code = shippingCode;
  if (requiresDOBAndGender) {
    body.date_of_birth = dateOfBirth;
    body.gender = gender;
  }
  if (referralId) {
    body.referralId = referralId;
  }
  if (commissionType) body.commissionType = commissionType;
  if (commissionAmount != null && commissionAmount !== "") {
    body.commissionAmount = commissionAmount;
  }
  if (commissionCurrency) body.commissionCurrency = commissionCurrency;
  if (productFamily) body.productFamily = productFamily;
  if (planMonths != null && planMonths !== "") body.planMonths = planMonths;
  if (sku) body.sku = sku;
  if (productName) body.productName = productName;
  if (orderValue != null && orderValue !== "") body.orderValue = orderValue;
  if (commissionLines && commissionLines.length) {
    body.commissionLines = commissionLines;
  }

  return body;
};
