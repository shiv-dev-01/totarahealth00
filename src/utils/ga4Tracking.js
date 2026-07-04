/**
 * GA4 Enhanced Ecommerce Tracking Utility
 * Handles data formatting and dataLayer event pushing for Google Tag Manager
 */

// Initialize dataLayer if it doesn't exist
if (typeof window !== 'undefined' && !window.dataLayer) {
  window.dataLayer = [];
}

/**
 * Escapes special characters in strings to prevent JavaScript errors
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
const escapeString = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
};

/**
 * Formats numeric value to remove commas and ensure proper decimal format
 * @param {number|string} value - Numeric value to format
 * @returns {number} - Formatted number
 */
const formatNumericValue = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  // Remove commas and convert to number
  const numValue = typeof value === 'string' 
    ? parseFloat(value.replace(/,/g, '')) 
    : parseFloat(value);
  return isNaN(numValue) ? 0 : numValue;
};

/**
 * Formats product items for GA4 ecommerce tracking
 * @param {Array} products - Array of product objects
 * @param {number} discountAmount - Total discount amount applied
 * @returns {Array} - Formatted items array for GA4
 */
const formatProductItems = (products, discountAmount = 0) => {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return [];
  }

  const totalPrice = products.reduce((sum, product) => {
    return sum + formatNumericValue(product.product_price || 0);
  }, 0);

  // Calculate discount per item (proportional)
  const discountPerItem = totalPrice > 0 ? (discountAmount / totalPrice) : 0;

  return products.map((product, index) => {
    const itemPrice = formatNumericValue(product.product_price || 0);
    const itemDiscount = itemPrice * discountPerItem;
    const finalPrice = Math.max(0, itemPrice - itemDiscount);

    return {
      item_id: String(product.product_id || `product_${index}`),
      item_name: escapeString(product.product_name || ''),
      item_category: escapeString(product.product_category || ''),
      item_brand: escapeString(product.product_brand || ''),
      price: finalPrice.toFixed(2),
      quantity: 1,
    };
  });
};

/**
 * Clears previous ecommerce data from dataLayer
 */
const clearEcommerceData = () => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ ecommerce: null });
  }
};

/**
 * Pushes event to dataLayer
 * @param {Object} eventData - Event data object
 */
const pushToDataLayer = (eventData) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    try {
      window.dataLayer.push(eventData);
      console.log('GA4 Event pushed:', eventData.event, eventData);
    } catch (error) {
      console.error('Error pushing to dataLayer:', error);
    }
  }
};

/**
 * Fires ce_begin_checkout event
 * @param {Object} params - Checkout parameters
 * @param {Array} params.products - Array of product objects
 * @param {number|string} params.totalValue - Total cart value
 * @param {string} params.coupon - Coupon code (optional)
 * @param {number|string} params.discountAmount - Discount amount (optional)
 */
export const fireBeginCheckout = ({ products, totalValue, coupon = '', discountAmount = 0 }) => {
  clearEcommerceData();

  const formattedItems = formatProductItems(products, discountAmount);
  const value = formatNumericValue(totalValue);

  const eventData = {
    event: 'ce_begin_checkout',
    ecommerce: {
      currency: 'USD',
      value: value.toFixed(2),
      coupon: escapeString(coupon),
      items: formattedItems,
    },
  };

  pushToDataLayer(eventData);
};

/**
 * Fires ce_add_payment_info event
 * @param {Object} params - Payment info parameters
 * @param {Array} params.products - Array of product objects
 * @param {number|string} params.totalValue - Total cart value
 * @param {string} params.paymentType - Payment type (default: "Credit Card")
 * @param {string} params.coupon - Coupon code (optional)
 * @param {number|string} params.discountAmount - Discount amount (optional)
 */
export const fireAddPaymentInfo = ({ 
  products, 
  totalValue, 
  paymentType = 'Credit Card',
  coupon = '',
  discountAmount = 0 
}) => {
  clearEcommerceData();

  const formattedItems = formatProductItems(products, discountAmount);
  const value = formatNumericValue(totalValue);

  const eventData = {
    event: 'ce_add_payment_info',
    ecommerce: {
      currency: 'USD',
      value: value.toFixed(2),
      coupon: escapeString(coupon),
      payment_type: escapeString(paymentType),
      items: formattedItems,
    },
  };

  pushToDataLayer(eventData);
};

/**
 * Fires ce_purchase event
 * @param {Object} params - Purchase parameters
 * @param {string} params.transactionId - Transaction/Order ID
 * @param {number|string} params.value - Total purchase value
 * @param {number|string} params.tax - Tax amount (optional)
 * @param {number|string} params.shipping - Shipping amount (optional)
 * @param {string} params.coupon - Coupon code (optional)
 * @param {string} params.customerType - Customer type (optional)
 * @param {Array} params.products - Array of product objects
 * @param {Object} params.userData - User data object
 * @param {number|string} params.discountAmount - Discount amount (optional)
 */
export const firePurchase = ({
  transactionId,
  value,
  tax = 0,
  shipping = 0,
  coupon = '',
  customerType = '',
  products,
  userData = {},
  discountAmount = 0,
}) => {
  clearEcommerceData();

  const formattedItems = formatProductItems(products, discountAmount);
  const purchaseValue = formatNumericValue(value);
  const taxValue = formatNumericValue(tax);
  const shippingValue = formatNumericValue(shipping);

  // Format user data with proper escaping
  const formattedUserData = {
    first_name: escapeString(userData.first_name || userData.firstName || ''),
    last_name: escapeString(userData.last_name || userData.lastName || ''),
    email: escapeString(userData.email || ''),
    phone: escapeString(userData.phone || userData.phoneNumber || ''),
    external_id: escapeString(userData.external_id || ''),
    city: escapeString(userData.city || ''),
    state: escapeString(userData.state || userData.stateName || ''),
    zip: escapeString(userData.zip || userData.postalCode || userData.zipCode || ''),
    country: escapeString(userData.country || 'United States'),
    date_of_birth: escapeString(userData.date_of_birth || userData.dateOfBirth || ''),
    gender: escapeString(userData.gender || ''),
  };

  const eventData = {
    event: 'ce_purchase',
    user_data: formattedUserData,
    ecommerce: {
      transaction_id: escapeString(transactionId),
      value: purchaseValue.toFixed(2),
      tax: taxValue.toFixed(2),
      shipping: shippingValue.toFixed(2),
      currency: 'USD',
      coupon: escapeString(coupon),
      customer_type: escapeString(customerType),
      items: formattedItems,
    },
  };

  pushToDataLayer(eventData);
};
