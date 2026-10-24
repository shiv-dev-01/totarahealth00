/**
 * Totara Health affiliate commission rules (GLP-1 fixed $ by drug + duration).
 *
 * Other products stay on Endorsely campaign rates (commissionType = endorsely_default).
 * Flat GLP-1 amounts apply even when a coupon changes the customer price.
 */

export const COMMISSION_CURRENCY = "usd";

export const SEMAGLUTIDE_COMMISSION_USD = {
  1: 50,
  3: 100,
  6: 200,
  12: 300,
};

export const TIRZEPATIDE_COMMISSION_USD = {
  1: 55,
  3: 105,
  6: 230,
  12: 330,
};

const PLAN_MONTHS = [12, 6, 3, 1];

export const getProductSku = (product = {}) => {
  const sku =
    product.sku ||
    product.product_sku ||
    product.product_sku ||
    product.product_id;
  return sku != null && String(sku).trim() !== "" ? String(sku) : "";
};

export const getMedicationFamily = (productName = "") => {
  const name = String(productName).toLowerCase();
  if (name.includes("tirz") || name.includes("trizep")) return "tirzepatide";
  if (name.includes("sema")) return "semaglutide";
  return "other";
};

const parseMonthsFromName = (productName = "") => {
  const name = String(productName);
  if (/12\s*-?\s*month/i.test(name) || name.includes("12 Month")) return 12;
  if (/6\s*-?\s*month/i.test(name) || name.includes("6 Month")) return 6;
  if (/3\s*-?\s*month/i.test(name) || name.includes("3 Month")) return 3;
  if (/1\s*-?\s*month/i.test(name) || name.includes("1 Month")) return 1;
  return null;
};

export const getPlanMonths = (product = {}) => {
  const fromName = parseMonthsFromName(
    product.product_name || product.product_title || ""
  );
  if (fromName) return fromName;

  const shippable = Number(
    product.product_is_shippable ?? product.product_is_shippable
  );
  if (PLAN_MONTHS.includes(shippable)) return shippable;

  return 1;
};

export const getLineCommission = (product = {}) => {
  const productName = product.product_name || product.product_title || "";
  const productFamily = getMedicationFamily(productName);
  const planMonths = getPlanMonths(product);
  const sku = getProductSku(product);
  const quantity = Math.max(1, Number(product.quantity) || 1);

  const table =
    productFamily === "semaglutide"
      ? SEMAGLUTIDE_COMMISSION_USD
      : productFamily === "tirzepatide"
        ? TIRZEPATIDE_COMMISSION_USD
        : null;

  if (!table) {
    return {
      type: "endorsely_default",
      amountUsd: null,
      productFamily,
      planMonths,
      sku,
      productName,
      quantity,
    };
  }

  const unitAmount = table[planMonths] ?? table[1];
  return {
    type: "fixed",
    amountUsd: unitAmount * quantity,
    unitAmountUsd: unitAmount,
    productFamily,
    planMonths,
    sku,
    productName,
    quantity,
  };
};

export const getOrderCommission = (products = [], orderValue = 0) => {
  const list = Array.isArray(products) ? products.filter(Boolean) : [];
  const lines = list.map(getLineCommission);
  const fixedLines = lines.filter((line) => line.type === "fixed");
  const defaultLines = lines.filter((line) => line.type === "endorsely_default");

  let commissionType = "endorsely_default";
  if (fixedLines.length && defaultLines.length) commissionType = "mixed";
  else if (fixedLines.length) commissionType = "fixed";

  const commissionAmount =
    commissionType === "endorsely_default"
      ? null
      : fixedLines.reduce((sum, line) => sum + (Number(line.amountUsd) || 0), 0);

  const primary = lines[0] || {
    productFamily: "other",
    planMonths: 1,
    sku: "",
    productName: "",
  };

  return {
    commissionType,
    commissionAmount,
    commissionCurrency: COMMISSION_CURRENCY,
    productFamily:
      lines.length <= 1
        ? primary.productFamily
        : lines.every((line) => line.productFamily === primary.productFamily)
          ? primary.productFamily
          : "mixed",
    planMonths: primary.planMonths,
    sku: lines.map((line) => line.sku).filter(Boolean).join(",") || primary.sku,
    productName: lines.map((line) => line.productName).filter(Boolean).join(" | "),
    orderValue: Number(orderValue) || 0,
    lines,
  };
};

/** Flat fields for JSON order/payment-intent bodies. */
export const toCommissionApiFields = (commission) => {
  if (!commission) return {};
  const fields = {
    commissionType: commission.commissionType,
    commissionCurrency: COMMISSION_CURRENCY,
    productFamily: commission.productFamily,
    planMonths: commission.planMonths,
    sku: commission.sku || "",
    productName: commission.productName || "",
    orderValue: commission.orderValue,
  };
  if (
    commission.commissionType === "fixed" ||
    commission.commissionType === "mixed"
  ) {
    fields.commissionAmount = commission.commissionAmount;
  }
  if (commission.lines?.length) {
    fields.commissionLines = commission.lines;
  }
  return fields;
};

/** Stripe metadata values must be strings. */
export const toCommissionMetadata = (commission) => {
  if (!commission) return {};
  const metadata = {
    commissionType: String(commission.commissionType || ""),
    commissionCurrency: COMMISSION_CURRENCY,
    productFamily: String(commission.productFamily || ""),
    planMonths: String(commission.planMonths ?? ""),
    sku: String(commission.sku || ""),
    orderValue: String(commission.orderValue ?? ""),
  };
  if (commission.commissionAmount != null) {
    metadata.commissionAmount = String(commission.commissionAmount);
  }
  return metadata;
};

export const appendCommissionFormData = (formData, commission) => {
  if (!formData || !commission) return;
  const fields = toCommissionApiFields(commission);
  Object.entries(fields).forEach(([key, value]) => {
    if (value == null || value === "") return;
    formData.append(
      key,
      typeof value === "object" ? JSON.stringify(value) : String(value)
    );
  });
};
