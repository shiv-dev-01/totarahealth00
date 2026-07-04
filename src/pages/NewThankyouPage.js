import React, { useState, useEffect } from "react";
import {
  LogIn,
  Mail,
  HeartHandshake,
  Shield,
  Truck,
  Star,
  CheckCircle,
  ArrowRight,
  User,
  Key,
  ExternalLink,
} from "lucide-react";
import images from "../constants/images";
import { useLocation } from "react-router-dom";
import { firePurchase } from "../utils/ga4Tracking";

function NewThankyouPage() {
  const [showContent, setShowContent] = useState(false);
  const [purchaseEventFired, setPurchaseEventFired] = useState(false);
  const location = useLocation();

  // memberportel redire url
  const currentDomain = window.location.hostname;
  const email = location.state?.email;
  const orderId = location.state?.orderId;
  const orderIds = location.state?.orderIds || [orderId].filter(Boolean); // Array of all order IDs
  const firstName = location.state?.firstName;
  const lastName = location.state?.lastName;
  const productTotal = location.state?.productTotal || 0;
  const productId = location.state?.productId || "";
  const phoneNumber = location.state?.phoneNumber || "";
  const stateName = location.state?.stateName || "";
  const stateCode = location.state?.stateCode || "";
  const city = location.state?.city || "";
  const postalCode = location.state?.postalCode || location.state?.zipCode || "";
  const country = location.state?.country || "United States";
  const products = location.state?.products || [];
  const coupon = location.state?.coupon || "";
  const discountAmount = location.state?.discountAmount || 0;

  let memberPortalUrl = "http://member.totara.health/"; // Default URL

  if (currentDomain === "checkout.totara.health") {
    memberPortalUrl = "http://member.totara.health/";
  } else if (currentDomain === "checkoutlive-totarahealth.wlmd.live") {
    memberPortalUrl = "http://mplive-totarahealth.wlmd.live/login";
  }

  useEffect(() => {
    setTimeout(() => setShowContent(true), 100);

    // Fire ce_purchase event for GA4 Enhanced Ecommerce tracking (only once)
    if (!purchaseEventFired && orderId && productTotal) {
      try {
        // Use products from state if available, otherwise create basic structure
        const purchaseProducts = products.length > 0 
          ? products 
          : (productId ? [{
              product_id: productId,
              product_name: '',
              product_price: productTotal,
            }] : []);

        // Fire purchase event
        firePurchase({
          transactionId: String(orderId),
          value: productTotal,
          tax: 0, // Tax not calculated/available
          shipping: 0, // Shipping is free (0)
          coupon: coupon || '',
          customerType: '', // Customer type not available
          products: purchaseProducts,
          userData: {
            first_name: firstName || '',
            last_name: lastName || '',
            email: email || '',
            phone: phoneNumber || '',
            external_id: '', // Not available
            city: city || '',
            state: stateName || '',
            zip: postalCode || '',
            country: country || 'United States',
            date_of_birth: '', // Not available
            gender: '', // Not available
          },
          discountAmount: discountAmount || 0,
        });
        setPurchaseEventFired(true);
      } catch (error) {
        console.error("Error firing ce_purchase:", error);
      }
    }

    // Load PostAffiliatePro tracking script dynamically
    if (orderId && productTotal && productId) {
      const executeTracking = () => {
        try {
          if (window.PostAffTracker) {
            window.PostAffTracker.setAccountId('default1');
            var sale = window.PostAffTracker.createSale();
            sale.setTotalCost(productTotal.toString());
            sale.setOrderID(orderIds[0] || orderId);
            sale.setProductID(productId);
            window.PostAffTracker.register();
          }
        } catch (err) {
          console.error("PostAffiliatePro tracking error:", err);
        }
      };

      // Check if script already exists
      let script1 = document.getElementById("pap_x2s6df8d");
      
      // if (!script1) {
      //   script1 = document.createElement("script");
      //   script1.type = "text/javascript";
      //   script1.id = "pap_x2s6df8d";
      //   script1.src = "https://totarahealth.postaffiliatepro.com/scripts/xo7fhduj";
        
      //   script1.onload = () => {
      //     executeTracking();
      //   };
        
      //   script1.onerror = () => {
      //     console.error("Failed to load PostAffiliatePro script");
      //   };
        
      //   document.head.appendChild(script1);
      // } else {
      //   // Script already loaded, execute tracking immediately
      //   executeTracking();
      // }
    }

    return () => {
      // Note: We don't remove the script on cleanup as it may be needed for tracking
      // The script ID ensures it won't be duplicated if component remounts
    };
  }, [orderId, orderIds, productTotal, productId, purchaseEventFired, products, coupon, discountAmount, firstName, lastName, email, phoneNumber, city, stateName, postalCode, country]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-2 sm:p-4"
      style={{
        background:
          "linear-gradient(to bottom right, color-mix(in srgb, var(--clr-main) 10%, white), white, color-mix(in srgb, var(--clr-main) 14%, #f8fafc))",
      }}
    >
      <div
        className={`w-full max-w-4xl bg-white rounded-xl sm:rounded-2xl shadow-2xl relative transform transition-all duration-700 mx-2 sm:mx-4 ${
          showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-xl sm:rounded-2xl pointer-events-none">
          <div
            className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-30 animate-pulse"
            style={{
              background:
                "linear-gradient(to bottom right, color-mix(in srgb, var(--clr-main) 35%, white), color-mix(in srgb, var(--clr-main) 22%, white))",
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 rounded-full translate-x-1/2 translate-y-1/2 opacity-25 animate-pulse"
            style={{
              animationDelay: "1s",
              background:
                "linear-gradient(to bottom right, color-mix(in srgb, var(--clr-main) 28%, white), color-mix(in srgb, var(--clr-main) 14%, #f1f5f9))",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-32 h-32 sm:w-48 sm:h-48 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20 animate-pulse"
            style={{
              animationDelay: "2s",
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--clr-main) 30%, white), transparent)",
            }}
          />
        </div>

        {/* Header Section */}
        <div className="relative z-10 p-4 sm:p-6 lg:p-8 border-b border-gray-100">
          {/* Logo */}
          <div className="flex justify-center mb-6 sm:mb-6">
            <a href="https://totara.health/" className="group">
              <img
                src={images.logo}
                alt="Logo"
                className="h-10 mb-2 sm:h-12 lg:h-14 transform transition-all duration-500 group-hover:scale-105 group-hover:shadow-lg"
              />
            </a>
          </div>

          {/* Success Icon with Enhanced Animation */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div
              className={`relative transition-all duration-700 ${
                showContent ? "scale-100" : "scale-0"
              }`}
            >
              <div
                className="absolute -inset-4 sm:-inset-6 rounded-full animate-pulse"
                style={{
                  background:
                    "linear-gradient(to right, color-mix(in srgb, var(--clr-main) 22%, white), color-mix(in srgb, var(--clr-main) 12%, white))",
                }}
              />
              <div
                className="absolute -inset-2 sm:-inset-3 rounded-full animate-ping opacity-25"
                style={{
                  background:
                    "linear-gradient(to right, color-mix(in srgb, var(--clr-main) 45%, white), var(--clr-main))",
                }}
              />
              <div
                className="relative z-10 p-3 sm:p-4 rounded-full shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, var(--clr-main), color-mix(in srgb, var(--clr-main) 72%, #1e4a6e))",
                }}
              >
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
              </div>
            </div>
          </div>

          {/* Title and Status */}
          <div className="text-center space-y-3 sm:space-y-4">
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:my-2 px-2"
              style={{ color: "var(--clr-text)" }}
            >
              🎉 Order Successful!
            </h1>
            <p
              className="text-sm sm:text-base max-w-md mx-auto"
              style={{ color: "var(--clr-text-secondary)" }}
            >
              Thank you for your purchase! Your order has been confirmed and a
              confirmation email has been sent to you.
            </p>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium">
              <div
                className="px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 sm:gap-2"
                style={{
                  background: "color-mix(in srgb, var(--clr-main) 16%, white)",
                  color: "var(--clr-main)",
                }}
              >
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Order Confirmed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          {/* Primary Action Section */}
          {/* <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Complete Your Consultation
                </h2>
              </div>
              <p className="text-sm sm:text-base text-gray-700 mb-4 max-w-lg mx-auto">
                To proceed with your order, please complete your medical consultation forms in your member portal.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                <button
                  className="group flex items-center justify-center gap-2 sm:gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl text-base sm:text-lg font-semibold shadow-lg"
                  onClick={() => (window.location.href = memberPortalUrl)}
                >
                  <LogIn className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-bounce" />
                  <span>Access Member Portal</span>
                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>or</span>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
                
                <a
                  href="mailto:contact@totara.health"
                  className="group flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all duration-300 text-sm sm:text-base font-medium"
                >
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Contact Support</span>
                </a>
              </div>
            </div>
          </div> */}

          {/* Steps Section */}
          <div className="mb-6 sm:mb-8">
            {/* <h3 className="text-lg sm:text-xl font-semibold text-gray-800 text-center mb-4 sm:mb-6">
              Next Steps
            </h3> */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform"
                  style={{
                    background: "color-mix(in srgb, var(--clr-main) 18%, white)",
                  }}
                >
                  <span
                    className="font-bold text-lg"
                    style={{ color: "var(--clr-main)" }}
                  >
                    1
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800 text-center mb-2">
                  Check Your Email
                </h4>
                <p className="text-sm text-gray-600 text-center">
                  Look for member portal credentials in your email inbox
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform"
                  style={{
                    background: "color-mix(in srgb, var(--clr-main) 18%, white)",
                  }}
                >
                  <span
                    className="font-bold text-lg"
                    style={{ color: "var(--clr-main)" }}
                  >
                    2
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800 text-center mb-2">
                  Login to Portal
                </h4>
                <p className="text-sm text-gray-600 text-center">
                  Use your credentials to access your member portal
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform"
                  style={{
                    background: "color-mix(in srgb, var(--clr-main) 18%, white)",
                  }}
                >
                  <span
                    className="font-bold text-lg"
                    style={{ color: "var(--clr-main)" }}
                  >
                    3
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800 text-center mb-2">
                  Complete Forms
                </h4>
                <p className="text-sm text-gray-600 text-center">
                  Fill out your medical consultation forms
                </p>
              </div>
            </div>
            <div className="flex mt-5 flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <button
                type="button"
                className="group flex items-center justify-center gap-2 sm:gap-3 px-8 sm:px-10 py-4 sm:py-5 text-white rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl text-base sm:text-lg font-semibold shadow-lg w-full sm:w-auto hover:brightness-105"
                style={{
                  background:
                    "linear-gradient(135deg, var(--clr-main), color-mix(in srgb, var(--clr-main) 75%, #1a4d73))",
                }}
                onClick={() => (window.location.href = memberPortalUrl)}
              >
                <LogIn className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-bounce" />
                <span className="text-white">Access Member Portal</span>
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Email Information */}
          <div
            className="border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8"
            style={{
              background:
                "linear-gradient(to right, color-mix(in srgb, var(--clr-main) 6%, #f9fafb), #f1f5f9)",
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div
                className="p-2 rounded-full"
                style={{
                  background: "color-mix(in srgb, var(--clr-main) 14%, white)",
                }}
              >
                <Key
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  style={{ color: "var(--clr-main)" }}
                />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                Member Portal Access
              </h3>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Your member portal credentials have been sent to:{" "}
                <span className="font-semibold text-gray-800">{email}</span>
              </p>
              <p className="text-xs text-gray-500">
                If you don't see the email, please check your spam folder or
                contact our support team.
              </p>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 text-center mb-4 sm:mb-6">
              Why Choose totarahealth?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div
                className="rounded-xl p-4 sm:p-6 text-center group hover:shadow-lg transition-all duration-300"
                style={{
                  background:
                    "linear-gradient(to right, color-mix(in srgb, var(--clr-main) 10%, white), color-mix(in srgb, var(--clr-main) 5%, white))",
                  border:
                    "1px solid color-mix(in srgb, var(--clr-main) 28%, #e5e7eb)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform"
                  style={{
                    background: "color-mix(in srgb, var(--clr-main) 16%, white)",
                  }}
                >
                  <Shield
                    className="w-6 h-6"
                    style={{ color: "var(--clr-main)" }}
                  />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  Secure & Private
                </h4>
                <p className="text-sm text-gray-600">
                  Your information is protected with bank-level security
                </p>
              </div>

              <div
                className="rounded-xl p-4 sm:p-6 text-center group hover:shadow-lg transition-all duration-300"
                style={{
                  background:
                    "linear-gradient(to right, color-mix(in srgb, var(--clr-main) 8%, white), white)",
                  border:
                    "1px solid color-mix(in srgb, var(--clr-main) 22%, #e5e7eb)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform"
                  style={{
                    background: "color-mix(in srgb, var(--clr-main) 12%, white)",
                  }}
                >
                  <Truck
                    className="w-6 h-6"
                    style={{ color: "var(--clr-main)" }}
                  />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  Fast Delivery
                </h4>
                <p className="text-sm text-gray-600">
                  Fast shipping on all orders with tracking
                </p>
              </div>

              <div
                className="rounded-xl p-4 sm:p-6 text-center group hover:shadow-lg transition-all duration-300"
                style={{
                  background:
                    "linear-gradient(to right, color-mix(in srgb, var(--clr-main) 6%, #fafafa), white)",
                  border:
                    "1px solid color-mix(in srgb, var(--clr-main) 18%, #e5e7eb)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform"
                  style={{
                    background: "color-mix(in srgb, var(--clr-main) 10%, white)",
                  }}
                >
                  <Star
                    className="w-6 h-6"
                    style={{ color: "var(--clr-main)" }}
                  />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  Premium Support
                </h4>
                <p className="text-sm text-gray-600">
                  Reliable customer support with medical consultation included
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          {/* <div className="mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-gray-50 to-slate-100 border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 text-center mb-4 sm:mb-6">
                Ready to Get Started?
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                <button
                  className="group flex items-center justify-center gap-2 sm:gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl text-base sm:text-lg font-semibold shadow-lg w-full sm:w-auto"
                  onClick={() => (window.location.href = memberPortalUrl)}
                >
                  <LogIn className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-bounce" />
                  <span>Access Member Portal</span>
                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <a
                  href="mailto:contact@totara.health"
                  className="group flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all duration-300 text-sm sm:text-base font-medium w-full sm:w-auto"
                >
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Contact Support</span>
                </a>
              </div>
            </div>
          </div> */}

          {/* Support Section */}
          <div
            className="border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center"
            style={{
              background:
                "linear-gradient(to right, color-mix(in srgb, var(--clr-main) 5%, #f9fafb), #f1f5f9)",
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <HeartHandshake
                className="w-5 h-5 sm:w-6 sm:h-6"
                style={{ color: "var(--clr-main)" }}
              />
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                Need Help?
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Our support team is here to help you with any questions or
              concerns.
            </p>
            <a
              href="mailto:support@totara.health"
              className="inline-flex items-center gap-2 font-medium transition-all duration-200 text-sm sm:text-base hover:brightness-90"
              style={{ color: "var(--clr-main)" }}
            >
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              support@totara.health
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewThankyouPage;
