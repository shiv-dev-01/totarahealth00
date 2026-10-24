import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "./paymentgetway.css";
import "./rightside.css";
import axios from "axios";
import { FaAngleDown, FaAngleUp, FaCheck, FaLock } from "react-icons/fa";
import { IoCloseOutline } from "react-icons/io5";
import { FaArrowLeftLong } from "react-icons/fa6";
import { FaTruck } from "react-icons/fa";
import { FiChevronRight } from "react-icons/fi";
import { Elements } from "@stripe/react-stripe-js";

import useNotification from "../../utils/useNotification";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Loading, Navbar, Navbar2 } from "../../common";
import {
  add_user_check_product,
  check_coupons,
  cheke_state,
  createOrder_test,
  createOrder_test_new,
  createOrder_stripe,
  get_checkout_link_data,
  get_product_details,
  get_url_data,
  member_view,
  SITE_ID,
  get_all_product_details_2,
  get_product_details_v3,
} from "../../utils/Constant";
import images from "../../constants/images";
import { RiContactsFill, RiDiscountPercentLine } from "react-icons/ri";
import { MdOutlineCelebration, MdOutlinePayment } from "react-icons/md";
import { CiStar } from "react-icons/ci";
// import { loadGoogleTag } from "../../utils/gtag";
import { Stethoscope, Truck } from "lucide-react";
import { fireBeginCheckout, fireAddPaymentInfo } from "../../utils/ga4Tracking";
import {
  trackMetaInitiateCheckout,
  trackMetaAddPaymentInfo,
  trackMetaPurchase,
} from "../../utils/metaTracking";
import StripeCheckoutForm from "../../components/StripeCheckoutForm";
import {
  buildStripeBillingDefaults,
  createStripePaymentIntent,
  stripeAppearance,
  getStripePromise,
  verifyStripePaymentSucceeded,
} from "../../utils/stripe";
import {
  clearCheckoutSnapshot,
  cleanStripeReturnParamsFromUrl,
  getStripeReturnParams,
  isPaymentIntentProcessed,
  loadCheckoutSnapshot,
  markPaymentIntentProcessed,
  saveCheckoutSnapshot,
} from "../../utils/stripeCheckoutSession";
import { buildCreateOrderStripeBody } from "../../utils/createOrderStripe";
import { getEndorselyReferralId } from "../../utils/helpers";
import {
  getOrderCommission,
  getProductSku,
  toCommissionApiFields,
  appendCommissionFormData,
} from "../../utils/affiliateCommission";

// Drop duplicate InitiateCheckout from the same page load (Strict Mode /
// FetchProduct called twice). Window is short so a later visit still fires.
let metaInitiateCheckoutLock = { key: "", at: 0 };
const META_INITIATE_CHECKOUT_DEDUP_MS = 2500;

const getMonthsFromProductName = (productName = "") => {
  if (productName.includes("12 Month")) return 12;
  if (productName.includes("6 Month")) return 6;
  if (productName.includes("3 Month")) return 3;
  return 1;
};

const Checkout2 = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpandClick = () => {
    setIsExpanded(!isExpanded);
  };
  const navigate = useNavigate();
  const location = useLocation();
  const { ID } = useParams();

  const name_data = location.state?.name_data;

  const handleGoBack = () => {
    navigate(-1); // This will navigate to the previous page
  };

  const [isloading, setIsLoading] = useState(false);
  const [isemailLoading, setIsEmailLoading] = useState(false);
  const [iscityloading, setIsCityLoading] = useState(false);
  const [getdata, setdata] = useState({});
  const [getproducts, setProducts] = useState([]); // New state for multiple products
  const [getproductPrice, setProductPrice] = useState("");
  const [getcdata, setCdata] = useState({});
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [aptSuite, setAptSuite] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("United States");
  const [getstate, setState] = useState([]);
  const [postalCode, setPostalCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(false);
  const [shippingMethod, setShippingMethod] = useState("FREE SHIPPING");
  const [getcardid, setCardid] = useState(1);
  const [cardNumber, setCardNumber] = useState("");
  const [cardholdername, setcardholdername] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [exMonth, setExMonth] = useState("");
  const [exYear, setExYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [id, setId] = useState(null);
  const [price, setPrice] = useState(null);
  const [getcampaignID, setCampaignID] = useState("");
  const [uniqueId, setUniqueId] = useState(null);
  const [getorder_id, setorder_id] = useState(null);
  const [getskipModel, setSkipModel] = useState(false);
  const [getthankyouURL, setThankyouURL] = useState("");

  const [discount_percent, setdiscount_percent] = useState(null);
  const [discount_amount, setdiscount_amount] = useState(null);

  // section 2 conditions
  const [getsection2, setSection2] = useState(false);
  // ── Stripe payment state ──────────────────────────────────────────────────
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [stripePaymentError, setStripePaymentError] = useState(null);
  const stripeRedirectHandledRef = useRef(false);
  const [sameAsShipping, setSameAsShipping] = useState(true); // Default to same address

  //billing address start
  const [country2, setCountry2] = useState("");
  const [firstName2, setFirstName2] = useState("");
  const [lastName2, setLastName2] = useState("");
  const [address2, setAddress2] = useState("");
  const [city2, setCity2] = useState("");
  const [getselectedState2, setSelectedState2] = useState({
    name: "",
    state_code: "",
  });
  const [getselectedStateCode2, setSelectedStateCode2] = useState({
    name: "",
    state_code: "",
  });
  const [postalCode2, setPostalCode2] = useState("");
  const [phoneNumber2, setPhoneNumber2] = useState("");

  // promocode
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [error, setError] = useState("");
  
  // URL hash fragment (for affiliate tracking)
  const [urlHashFragment, setUrlHashFragment] = useState("");

  const getCouponProductId = () => {
    if (getproducts?.length > 0) {
      return getproducts
        .map((product) => product.product_id)
        .filter(Boolean)
        .join(",");
    }
    return getdata?.product_id || id;
  };

  // Helper: strip thousands-separator commas before parsing (API can return "4,595.97")
  const parseAmount = (val) => parseFloat(String(val ?? "").replace(/,/g, "")) || 0;

  const getCouponSavings = () => {
    const subtotal = parseFloat(getproductPrice);
    if (isNaN(subtotal)) return 0;
    if (
      discount_percent &&
      discount_percent !== "0.00" &&
      parseFloat(discount_percent) > 0
    ) {
      return (subtotal * (parseFloat(discount_percent) || 0)) / 100;
    }
    return parseAmount(discount_amount);
  };

  const getDiscountedTotal = () => {
    const subtotal = parseFloat(getproductPrice);
    if (isNaN(subtotal)) return "";
    return Math.max(0, subtotal - getCouponSavings()).toFixed(2);
  };

  const handleApplyDiscount = async () => {
    setError(""); // Clear previous errors

    if (!discountCode.trim()) {
      notifyError("Please enter a promo code");
      return;
    }

    if (!email || !validateEmail(email)) {
      notifyError("Please enter a valid email before applying a promo code");
      return;
    }

    const couponProductId = getCouponProductId();
    if (!couponProductId) {
      notifyError("Product information is missing. Please refresh and try again.");
      return;
    }

    setApplyLoading(true); // Start loading
    try {
      const response = await axios.post(check_coupons, {
        site_id: SITE_ID,
        promo_codes: discountCode.trim(),
        product_id: String(couponProductId),
        email: email.trim(),
      });

      // Check the API response status
      if (response.data.status == 1) {
        setApplyLoading(false);
        console.log("responce.data", response.data);
        setAppliedDiscount(response.data.data?.code || discountCode.trim()); // Store applied code
        setdiscount_percent(
          response.data.discount_percent ??
            response.data.data?.discount_percent ??
            0
        );
        setdiscount_amount(
          response.data.discount_amount ??
            response.data.data?.discount_amount ??
            0
        );
      } else {
        setApplyLoading(false);
        setAppliedDiscount(null);
        notifyError(response.data.message || "Invalid code");
      }
    } catch (err) {
      setApplyLoading(false);

      setError("Something went wrong. Please try again.");
    }
  };
  // Remove discount handler
  const handleRemoveDiscount = () => {
    setDiscountCode(""); // Clear the discount code input
    setAppliedDiscount(null); // Reset applied discount state
    setdiscount_percent(0); // Reset discount percent
    setdiscount_amount(0); // Reset discount amount
  };

  // promocode end

  // Determine if a discount is applied
  const isDiscountApplied = discount_percent > 0 || discount_amount > 0;

  // Total text logic
  const totalText = isDiscountApplied ? "Latest price" : "Your total";

  const [applyLoading, setApplyLoading] = useState(false);

  // check terms start
  const [isChecked, setIsChecked] = useState(false);
  const [isChecked2, setIsChecked2] = useState(false);

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };

    // sms consent
  const [smsTransactional, setSmsTransactional] = useState(false);
  const [smsMarketing, setSmsMarketing] = useState(false);

  // check terms end

  const validateEmail = (email) => {
    // Basic email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const { notifySuccess, notifyError } = useNotification();

  const product = location.state?.product;
  const contact_details_id = location.state?.contact_details_id;

  const fetchStates = async () => {
    try {
      const res = await axios.post(
        "https://panel.whitelabelmd.com/wlmdbackend/api/get_all_states",
        {
          country: "United States",
        }
      );
      console.log("sfsdcs---->", res.data);
      setState(res.data.data.states);
    } catch (err) {
      console.error("Error fetching states:", err);
    }
  };

  const FetchProduct = async (id) => {
    setIsLoading(true);
    console.log("FetchProduct called with id:", id);

    // Split product IDs if comma-separated
    const productIds = id.includes(",") ? id.split(",") : [id];
    console.log("Product IDs after splitting:", productIds);

    try {
      // Fetch details for each product
      const productPromises = productIds.map(async (productId) => {
        console.log("Fetching product details for ID:", productId);
        const params = {
          product_id: productId.trim(),
          // product_sku: productId.trim(),
        };

        const response = await axios.post(get_product_details, params);
        console.log("Product API response for", productId, ":", response.data);
        if (response.data.status == 1) {
          return response.data.product_data;
        } else {
          console.error(`Failed to fetch product ${productId}`);
          return null;
        }
      });

      // Wait for all product details to be fetched
      const productDetails = await Promise.all(productPromises);
      console.log("All product details:", productDetails);

      // Filter out null results and set state
      const validProducts = productDetails.filter(
        (product) => product !== null
      );
      console.log("Valid products:", validProducts);

      if (validProducts.length > 0) {
        setProducts(validProducts);
        setdata(validProducts[0]); // Set first product as main data

        // Calculate total price
        const totalPrice = validProducts.reduce((sum, product) => {
          return sum + parseFloat(product.product_price || 0);
        }, 0);
        setProductPrice(totalPrice.toString());

        console.log("Products fetched and set:", validProducts);
        console.log("Total price:", totalPrice);

        // Fire ce_begin_checkout event when products are loaded
        try {
          fireBeginCheckout({
            products: validProducts,
            totalValue: totalPrice,
            coupon: appliedDiscount || '',
            discountAmount: discount_amount || 0,
          });
          const initiateCheckoutKey = validProducts
            .map((p) => p.product_id)
            .join("_");
          const now = Date.now();
          const isDuplicateInitiateCheckout =
            metaInitiateCheckoutLock.key === initiateCheckoutKey &&
            now - metaInitiateCheckoutLock.at < META_INITIATE_CHECKOUT_DEDUP_MS;
          if (!isDuplicateInitiateCheckout) {
            metaInitiateCheckoutLock = { key: initiateCheckoutKey, at: now };
            trackMetaInitiateCheckout({
              value: totalPrice,
              products: validProducts,
            });
          }
        } catch (error) {
          console.error("Error firing ce_begin_checkout:", error);
        }
      } else {
        setdata({});
        setProducts([]);
        setProductPrice("");
        console.log("No valid products found");
        navigate("/ErrorPage");
      }

      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      console.log("FetchProduct error:", err);
    }
  };

  const FetchCdata = async (cdata) => {
    setIsLoading(true);
    await axios
      .post(get_url_data, {
        data: cdata,
      })
      .then((Response) => {
        setIsLoading(false);
        if (Response.data.status == 1) {
          setIsLoading(false);
          console.log("Response.data.decoded_data", Response.data.decoded_data);
          const data = Response.data.decoded_data;
          // console.log("data", data);

          setEmail(data?.email);
          setFirstName(data?.fname);
          setLastName(data?.lname);
          setPhoneNumber(data?.phone);
        } else {
          setIsLoading(false);
        }
      })
      .catch((error) => {
        setIsLoading(false);
        console.log("eeror------>", error);
      });
  };

  useEffect(() => {
    const currentUrl = window.location.href;

    // Parse the URL to extract query parameters
    const params = new URLSearchParams(new URL(currentUrl).search);

    // Get the 'uniqueId' parameter
    const id = params.get("uniqueId");
    const campionid = params.get("campaign_id");

    const cdata = params.get("cdata");

    console.log("campionid", campionid);
    console.log("cdata", cdata);
    // Set the extracted 'uniqueId' to state
    setUniqueId(id);
    setCampaignID(campionid);

    const urlParams = new URLSearchParams(window.location.search);
    const idValue = urlParams.get("id");
    const emailValue = urlParams.get("email");
    
    // Extract hash fragment (e.g., #a_aid=wlmd_gokul) and store exactly as-is
    const hash = window.location.hash;
    if (hash) {
      // Store the hash fragment exactly as it appears in URL (including #)
      setUrlHashFragment(hash);
      console.log("URL hash fragment:", hash);
    }

    // Set the extracted ID and email in the state
    if (idValue) {
      setId(idValue);
    }
    if (emailValue) {
      setEmail(emailValue);
    }

    console.log("idValue", idValue);
    console.log("emailValue", emailValue);
    console.log(
      "URL format check - idValue type:",
      typeof idValue,
      "emailValue type:",
      typeof emailValue
    );

    // Fetch checkout link data and prefill form fields
    if (emailValue && idValue) {
      console.log("Both email and id present - calling get_checkout_link_data");
      // If both id and email are present, send both
      axios
        .post(get_checkout_link_data, { id: idValue, email: emailValue })
        .then((res) => {
          if (
            res.data.status === 1 &&
            res.data.data &&
            res.data.data.user_data
          ) {
            const user = res.data.data.user_data;
            setEmail(user.email || "");
            setFirstName(user.first_name || "");
            setLastName(user.last_name || "");
            setPhoneNumber(user.phone || "");
            setAddress(user.address || "");
            setCity(user.city_name || "");
            setPostalCode(user.zip_code || "");
            // Set shipping state if present
            if (user.state_name) {
              // Check if states are loaded
              if (getstate.length > 0) {
                // Find the matching state in the states list
                const matchingState = getstate.find(
                  (state) =>
                    state.state_code === user.state_name ||
                    state.name === user.state_name
                );

                if (matchingState) {
                  setSelectedState({
                    name: matchingState.name,
                    state_code: matchingState.state_code,
                  });
                  setSelectedStateCode({
                    name: matchingState.name,
                    state_code: matchingState.state_code,
                  });
                  handleStateChange(matchingState.name);
                } else {
                  // Fallback if state not found in list
                  setSelectedState({
                    name: user.state_name,
                    state_code: user.state_name,
                  });
                  setSelectedStateCode({
                    name: user.state_name,
                    state_code: user.state_name,
                  });
                }
              } else {
                // If states not loaded yet, retry after a short delay
                setTimeout(() => {
                  const matchingState = getstate.find(
                    (state) =>
                      state.state_code === user.state_name ||
                      state.name === user.state_name
                  );

                  if (matchingState) {
                    setSelectedState({
                      name: matchingState.name,
                      state_code: matchingState.state_code,
                    });
                    setSelectedStateCode({
                      name: matchingState.name,
                      state_code: matchingState.state_code,
                    });
                    handleStateChange(matchingState.name);
                  }
                }, 1000);
              }
            }
            // Map card_type string to dropdown value (adjust as needed)
            let cardTypeValue = 1;
            if (user.card_type) {
              const type = user.card_type.toLowerCase();
              if (type === "visa") cardTypeValue = 1;
              else if (type === "mastercard") cardTypeValue = 2;
              else if (type === "discover") cardTypeValue = 3;
              else if (type === "american express" || type === "amex")
                cardTypeValue = 4;
            }
            setCardid(cardTypeValue);
            setCardNumber(user.card_no || "");
            setExMonth(user.ex_month || "");
            setExYear(user.ex_year || "");
            setExpiryDate(
              user.ex_month && user.ex_year
                ? `${user.ex_month}/${user.ex_year}`
                : ""
            );
            setCvv(user.cvv_no || "");
            setcardholdername(user.card_holder_name || "");
            // Products and prices
            if (user.product_id && Array.isArray(user.product_id)) {
              // Call FetchProduct to get detailed product information
              FetchProduct(user.product_id.join(","));
            }
            // Billing address (if present)
            if (user.billingSameAsShipping === "NO") {
              setSameAsShipping(false);
              // Set billing fields if you have them in your state
              setFirstName2(user.billingFirstName || "");
              setLastName2(user.billingLastName || "");
              setAddress2(user.billingAddress || "");
              setCity2(user.billingCity || "");
              setPostalCode2(user.billingZip || "");
              setPhoneNumber2(user.billingPhone || "");
              setSelectedState2({
                name: user.billingState || "",
                state_code: user.billingState || "",
              });
              setSelectedStateCode2({
                name: user.billingState || "",
                state_code: user.billingState || "",
              });
            } else {
              setSameAsShipping(true);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to fetch checkout link data", err);
        });
    } else if (emailValue) {
      console.log(
        "Only email present - calling get_checkout_link_data with email only"
      );
      // If only email is present, send only email
      axios
        .post(get_checkout_link_data, { email: emailValue })
        .then((res) => {
          if (
            res.data.status === 1 &&
            res.data.data &&
            res.data.data.user_data
          ) {
            const user = res.data.data.user_data;
            setEmail(user.email || "");
            setFirstName(user.first_name || "");
            setLastName(user.last_name || "");
            setPhoneNumber(user.phone || "");
            setAddress(user.address || "");
            setCity(user.city_name || "");
            setPostalCode(user.zip_code || "");
            // Set shipping state if present
            if (user.state_name) {
              // Check if states are loaded
              if (getstate.length > 0) {
                // Find the matching state in the states list
                const matchingState = getstate.find(
                  (state) =>
                    state.state_code === user.state_name ||
                    state.name === user.state_name
                );

                if (matchingState) {
                  setSelectedState({
                    name: matchingState.name,
                    state_code: matchingState.state_code,
                  });
                  setSelectedStateCode({
                    name: matchingState.name,
                    state_code: matchingState.state_code,
                  });
                  handleStateChange(matchingState.name);
                } else {
                  // Fallback if state not found in list
                  setSelectedState({
                    name: user.state_name,
                    state_code: user.state_name,
                  });
                  setSelectedStateCode({
                    name: user.state_name,
                    state_code: user.state_name,
                  });
                }
              } else {
                // If states not loaded yet, retry after a short delay
                setTimeout(() => {
                  const matchingState = getstate.find(
                    (state) =>
                      state.state_code === user.state_name ||
                      state.name === user.state_name
                  );

                  if (matchingState) {
                    setSelectedState({
                      name: matchingState.name,
                      state_code: matchingState.state_code,
                    });
                    setSelectedStateCode({
                      name: matchingState.name,
                      state_code: matchingState.state_code,
                    });
                    handleStateChange(matchingState.name);
                  }
                }, 1000);
              }
            }
            // Map card_type string to dropdown value (adjust as needed)
            let cardTypeValue = 1;
            if (user.card_type) {
              const type = user.card_type.toLowerCase();
              if (type === "visa") cardTypeValue = 1;
              else if (type === "mastercard") cardTypeValue = 2;
              else if (type === "discover") cardTypeValue = 3;
              else if (type === "american express" || type === "amex")
                cardTypeValue = 4;
            }
            setCardid(cardTypeValue);
            setCardNumber(user.card_no || "");
            setExMonth(user.ex_month || "");
            setExYear(user.ex_year || "");
            setExpiryDate(
              user.ex_month && user.ex_year
                ? `${user.ex_month}/${user.ex_year}`
                : ""
            );
            setCvv(user.cvv_no || "");
            setcardholdername(user.card_holder_name || "");
            // Products and prices
            if (user.product_id && Array.isArray(user.product_id)) {
              // Call FetchProduct to get detailed product information
              FetchProduct(user.product_id.join(","));
            }
            // Billing address (if present)
            if (user.billingSameAsShipping === "NO") {
              setSameAsShipping(false);
              // Set billing fields if you have them in your state
              setFirstName2(user.billingFirstName || "");
              setLastName2(user.billingLastName || "");
              setAddress2(user.billingAddress || "");
              setCity2(user.billingCity || "");
              setPostalCode2(user.billingZip || "");
              setPhoneNumber2(user.billingPhone || "");
              setSelectedState2({
                name: user.billingState || "",
                state_code: user.billingState || "",
              });
              setSelectedStateCode2({
                name: user.billingState || "",
                state_code: user.billingState || "",
              });
            } else {
              setSameAsShipping(true);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to fetch checkout link data", err);
        });
    } else if (idValue) {
      // If only id is present, call FetchProduct directly with the id
      console.log("Only ID present, calling FetchProduct with:", idValue);
      FetchProduct(idValue);
    }

    // Handle multiple product IDs if passed as comma-separated values
    const productIds = urlParams.get("product_ids");
    if (productIds) {
      // If product_ids parameter exists, use it instead of single id
      setId(productIds);
    }

    // set c data with api
    if (cdata) {
      FetchCdata(cdata);
    }

    fetchStates();

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
    console.log("location.state", location.state);
    console.log("idValue", idValue);
    // FetchProduct is now called from the API response, not here
    const currentDomain = window.location.hostname;
    console.log("12122", currentDomain);

    // Click Tracking Script
    // const script1 = document.createElement("script");
    // script1.type = "text/javascript";
    // script1.id = "pap_x2s6df8d";
    // script1.src = "https://totarahealth.postaffiliatepro.com/scripts/5ogv666ehj";
    // document.head.appendChild(script1);

    // script1.onload = () => {
    //   const script2 = document.createElement("script");
    //   script2.type = "text/javascript";
    //   script2.innerHTML = `
    //     PostAffTracker.setAccountId('default1');
    //     window.CampaignID='14e7b018';
    //     try {
    //       PostAffTracker.track();
    //     } catch (err) { }
    //   `;
    //   document.head.appendChild(script2);
    // };

    return () => {
      // Cleanup scripts when component unmounts
      const script1Element = document.getElementById("pap_x2s6df8d");
      if (script1Element) {
        script1Element.remove();
      }
    };
  }, []);

  const [getallCitys, setAllCitys] = useState([]);
  const [getselectedState, setSelectedState] = useState({
    name: "",
    state_code: "",
  });
  const [getselectedStateCode, setSelectedStateCode] = useState({
    name: "",
    state_code: "",
  });

  // google map start
  const inputRef1 = useRef(null);
  const inputRef2 = useRef(null);

  var initializeAutocomplete = () => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error("Google Maps API not available.");
      setIsLoading(false);
      return;
    }

    const parseAddressComponents = (place) => {
      let stateName = "";
      let stateCode = "";
      let city = "";
      let postalCode = "";

      if (place && place.address_components) {
        // Loop through address components to extract desired fields
        place.address_components.forEach((component) => {
          const types = component.types;
          if (types.includes("administrative_area_level_1")) {
            // State Name and Code
            stateName = component.long_name;
            stateCode = component.short_name; // Short name is usually the state code
          }
          if (types.includes("locality")) {
            // City
            city = component.long_name;
          }
          if (types.includes("postal_code")) {
            // Postal Code
            postalCode = component.long_name;
          }
        });
      }

      return { stateName, stateCode, city, postalCode };
    };

    const cleanAddress = (formattedAddress, componentsToRemove) => {
      // let cleanedAddress = formattedAddress;

      // componentsToRemove.forEach((component) => {
      //   if (component) {
      //     cleanedAddress = cleanedAddress
      //       .replace(component, "")
      //       .replace(/,\s*,/, ",")
      //       .trim();
      //   }
      // });

      // // Remove trailing commas and extra spaces
      // cleanedAddress = cleanedAddress
      //   .replace(/(^,)|(,$)/g, "")
      //   .replace(/\s{2,}/g, " ")
      //   .trim();

      // return cleanedAddress;

      // Split the address by commas and take only the first part
      const addressParts = formattedAddress.split(",");
      return addressParts[0].trim(); // Extracts only the first part (like "Tennessee")
    };

    // Initialize Autocomplete for the first input
    if (inputRef1.current) {
      const autocomplete1 = new window.google.maps.places.Autocomplete(
        inputRef1.current,
        {
          types: ["geocode"], // Restrict to address-type predictions
          componentRestrictions: { country: "us" },
        }
      );

      autocomplete1.addListener("place_changed", () => {
        const place = autocomplete1.getPlace();
        console.log("Place details (input 1):", place);

        if (place) {
          const { stateName, stateCode, city, postalCode } =
            parseAddressComponents(place);

          const cleanedAddress = cleanAddress(place.formatted_address, [
            city,
            stateName,
            postalCode,
          ]);

          console.log("stateName", stateName);
          console.log("stateCode", stateCode);
          console.log("postalCode", postalCode);
          console.log("city-->sZ", city);

          if (stateName && stateCode) {
            setSelectedState({ name: stateName, state_code: stateCode });
            setSelectedStateCode({ name: stateName, state_code: stateCode });
            // AllCitys(stateName);
          }

          if (city) {
            console.log("city---->", city);
            setCity(city); // Assuming you still need city
            setPostalCode("");
          }

          if (postalCode) {
            setPostalCode(postalCode); // Assuming you still need postal code
          }

          setAddress(cleanedAddress); // Set full address
          // setAddress(place.formatted_address); // Set full address
        }
      });
    }

    // Initialize Autocomplete for the second input
    if (inputRef2.current) {
      const autocomplete2 = new window.google.maps.places.Autocomplete(
        inputRef2.current,
        {
          types: ["geocode"], // Restrict to address-type predictions
          componentRestrictions: { country: "us" },
        }
      );

      autocomplete2.addListener("place_changed", () => {
        const place = autocomplete2.getPlace();
        console.log("Place details (input 2):", place);

        if (place) {
          const { stateName, stateCode, city, postalCode } =
            parseAddressComponents(place);

          const cleanedAddress = cleanAddress(place.formatted_address, [
            city,
            stateName,
            postalCode,
          ]);

          if (stateName && stateCode) {
            setSelectedState2({ name: stateName, state_code: stateCode });
            setSelectedStateCode2({ name: stateName, state_code: stateCode });
            // AllCitys(stateName);
          }

          if (city) {
            setCity2(city); // Assuming you need city for second input
            setPostalCode2("");
          }

          if (postalCode) {
            setPostalCode2(postalCode); // Assuming you need postal code for second input
          }

          // setAddress2(place.formatted_address); // Set full address for second input
          setAddress2(cleanedAddress);
        }
      });
    }

    setIsLoading(false);
  };

  // use Effects for checking gmap

  useEffect(() => {
    if (!getsection2 && inputRef1.current) {
      initializeAutocomplete();
    }
  }, [getsection2, inputRef1]);
  useEffect(() => {
    if (getsection2 && inputRef2.current) {
      initializeAutocomplete();
    }
  }, [getsection2, inputRef2]);
  useEffect(() => {
    if (!sameAsShipping && inputRef2.current) {
      initializeAutocomplete();
    }
  }, [sameAsShipping, inputRef2]);
  useEffect(() => {
    if (!isloading && inputRef2.current) {
      initializeAutocomplete();
    }
  }, [isloading, inputRef2]);
  useEffect(() => {
    if (!isloading && inputRef1.current) {
      initializeAutocomplete();
    }
  }, [isloading, inputRef1]);

  useEffect(() => {
    console.log("Updated state code:", getselectedStateCode);
  }, [getselectedStateCode]);

  useEffect(() => {
    const loadScript = (url, callback) => {
      const existingScript = document.querySelector(`script[src="${url}"]`);

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = url;
        script.async = true;
        script.onload = callback;
        script.onerror = () => {
          console.error("Google Maps script failed to load.");
          setIsLoading(false);
        };
        document.body.appendChild(script);
      } else {
        callback();
      }
    };

    // Load Google Maps API script
    loadScript(
      `https://maps.googleapis.com/maps/api/js?key=AIzaSyDqypMXRxstlMdPZ-LUGWb4w36I0ENsu9U&libraries=places`,
      initializeAutocomplete
    );
  }, []);
  // google map end

  useEffect(() => {
    const persistReferral = () => {
      const referralId = window.endorsely_referral;
      if (referralId) {
        localStorage.setItem("endorsely_referral", referralId);
        return true;
      }
      return false;
    };

    if (persistReferral()) return;

    const interval = setInterval(() => {
      if (persistReferral()) clearInterval(interval);
    }, 300);

    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const handleStateChange = async (value) => {
    // setIsLoading(true);
    var params = {
      state_name: value,
    };
    await axios
      .post(cheke_state, params)
      .then((res) => {
        // setIsLoading(false);
        const data = res.data;
        if (data.status === 0) {
          setSelectedState({
            name: "",
            state_code: "",
          });
          setSelectedStateCode({
            name: "",
            state_code: "",
          });
          // setAllCitys([]);
          setCity("");
          notifyError(data.message);
        }
        // else {
        //   AllCitys(value);
        // }
      })
      .catch((err) => {
        console.log("err", err);
        // setIsLoading(false);
      });
  };

  const handleStateChange2 = async (value) => {
    // setIsLoading(true);
    var params = {
      state_name: value,
    };
    await axios
      .post(cheke_state, params)
      .then((res) => {
        // setIsLoading(false);
        const data = res.data;
        if (data.status === 0) {
          setSelectedState2({
            name: "",
            state_code: "",
          });
          setSelectedStateCode2({
            name: "",
            state_code: "",
          });
          // setAllCitys([]);
          setCity2("");
          notifyError(data.message);
        }
        // else {
        //   AllCitys(value);
        // }
      })
      .catch((err) => {
        console.log("err", err);
        // setIsLoading(false);
      });
  };

  const AllCitys = async (state) => {
    setIsCityLoading(true);
    await axios
      .post("https://countriesnow.space/api/v0.1/countries/state/cities", {
        country: "United States",
        state: state,
      })
      .then((res) => {
        setIsCityLoading(false);
        const data = res.data.data;
        console.log("citys", res.data.data);
        setAllCitys(data);
      })
      .catch((err) => {
        console.log("err", err);
        setIsCityLoading(false);
      });
  };

  // ── Stripe helpers ─────────────────────────────────────────────────────────

  const calculateTotal = useCallback(() => {
    const subtotal = parseFloat(getproductPrice);
    if (isNaN(subtotal)) return 0;
    let savings = 0;
    if (
      discount_percent &&
      discount_percent !== "0.00" &&
      parseFloat(discount_percent) > 0
    ) {
      savings = (subtotal * (parseFloat(discount_percent) || 0)) / 100;
    } else if (discount_amount && parseAmount(discount_amount) > 0) {
      savings = parseAmount(discount_amount);
    }
    return Math.max(0, subtotal - savings);
  }, [getproductPrice, discount_percent, discount_amount]);

  const getCheckoutAmountCents = useCallback(() => {
    return Math.round(calculateTotal() * 100);
  }, [calculateTotal]);

  const getAffiliateCommission = useCallback(() => {
    return getOrderCommission(getproducts, calculateTotal());
  }, [getproducts, calculateTotal]);

  const hasShippingForStripe = useMemo(
    () =>
      Boolean(
        firstName?.trim() &&
          lastName?.trim() &&
          address?.trim() &&
          city?.trim() &&
          getselectedStateCode.state_code &&
          postalCode?.trim()
      ),
    [firstName, lastName, address, city, getselectedStateCode, postalCode]
  );

  const stripeBillingDefaults = useMemo(
    () =>
      buildStripeBillingDefaults({
        email,
        firstName,
        lastName,
        phone: phoneNumber,
        sameAsShipping,
        firstName2,
        lastName2,
        phoneNumber2,
        address,
        aptSuite,
        city,
        stateCode: getselectedStateCode.state_code,
        postalCode,
        address2,
        city2,
        billingStateCode: getselectedStateCode2.state_code,
        postalCode2,
      }),
    [
      email,
      firstName,
      lastName,
      phoneNumber,
      sameAsShipping,
      firstName2,
      lastName2,
      phoneNumber2,
      address,
      aptSuite,
      city,
      getselectedStateCode,
      postalCode,
      address2,
      city2,
      getselectedStateCode2,
      postalCode2,
    ]
  );

  const getStripePaymentPayload = useCallback(
    (amountCentsOverride) => {
      const primary = getproducts[0] || getdata || {};
      return {
        email,
        firstName,
        lastName,
        phone: phoneNumber,
        addressLine1: address,
        addressLine2: aptSuite,
        city,
        state: getselectedStateCode.state_code || "",
        zip: postalCode,
        sameAsShipping,
        billingAddressLine1: address2,
        billingAddressLine2: "",
        billingCity: city2,
        billingState: getselectedStateCode2.state_code || "",
        billingZip: postalCode2,
        billingFirstName: firstName2,
        billingLastName: lastName2,
        productName: primary.product_name || "Medication",
        sku: primary.sku || String(primary.product_id || ""),
        amount:
          amountCentsOverride !== undefined
            ? amountCentsOverride
            : getCheckoutAmountCents(),
        currency: "usd",
        productId: String(getCouponProductId() || primary.product_id || ""),
        coupon: appliedDiscount || null,
        referralId: getEndorselyReferralId(),
        ...toCommissionApiFields(getAffiliateCommission()),
      };
    },
    [
      getproducts,
      getdata,
      email,
      firstName,
      lastName,
      phoneNumber,
      address,
      aptSuite,
      city,
      getselectedStateCode,
      postalCode,
      sameAsShipping,
      address2,
      city2,
      getselectedStateCode2,
      postalCode2,
      firstName2,
      lastName2,
      getCheckoutAmountCents,
      appliedDiscount,
      getAffiliateCommission,
    ]
  );

  const initStripePaymentIntent = useCallback(async () => {
    if (!email || !email.includes("@") || !hasShippingForStripe) return;
    const payload = getStripePaymentPayload();
    if (!payload.amount || payload.amount < 50) return;

    try {
      setIsCreatingPaymentIntent(true);
      setStripePaymentError(null);
      const secret = await createStripePaymentIntent(payload);
      setStripeClientSecret(secret);
    } catch (err) {
      setStripeClientSecret(null);
      setStripePaymentError(
        err instanceof Error ? err.message : "Failed to initialize payment"
      );
    } finally {
      setIsCreatingPaymentIntent(false);
    }
  }, [email, hasShippingForStripe, getStripePaymentPayload]);

  useEffect(() => {
    if (
      getsection2 &&
      hasShippingForStripe &&
      email &&
      calculateTotal() >= 0.5
    ) {
      initStripePaymentIntent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    getsection2,
    hasShippingForStripe,
    email,
    discount_percent,
    discount_amount,
    appliedDiscount,
    sameAsShipping,
    address,
    city,
    postalCode,
    getselectedStateCode.state_code,
    address2,
    city2,
    postalCode2,
    getselectedStateCode2.state_code,
  ]);

  useEffect(() => {
    if (!getsection2) {
      setStripeClientSecret(null);
      setStripePaymentError(null);
    }
  }, [getsection2]);

  const getCheckoutSnapshot = useCallback(() => {
    const productMap = new Map();
    getproducts.forEach((product) => {
      const pid = product.product_id;
      if (productMap.has(pid)) {
        productMap.get(pid).quantity += 1;
      } else {
        productMap.set(pid, { ...product, quantity: 1 });
      }
    });
    const uniqueProducts = Array.from(productMap.values());
    const referralId = getEndorselyReferralId();
    const commission = getOrderCommission(uniqueProducts, calculateTotal());
    return {
      email,
      firstName,
      lastName,
      phoneNumber,
      address,
      aptSuite,
      city,
      stateCode: getselectedStateCode.state_code,
      postalCode,
      sameAsShipping,
      address2,
      city2,
      billingStateCode: getselectedStateCode2.state_code,
      postalCode2,
      appliedDiscount,
      campaignId: getcampaignID,
      contactDetailsId: contact_details_id,
      productIds: uniqueProducts.map((p) => p.product_id),
      productPrices: uniqueProducts.map((p) => p.product_price),
      originalPrices: uniqueProducts.map(
        (p) => p.original_price || p.product_price
      ),
      gatewayIds: uniqueProducts.map((p) => p.gateway_id || "1"),
      billingModelIds: uniqueProducts.map((p) => p.billing_model_id || "3"),
      promoCodes: uniqueProducts.map((p) => p.promoCode || "0"),
      quantities: uniqueProducts.map((p) => String(p.quantity)),
      smsTransactional,
      smsMarketing,
      referralId: referralId || null,
      ...toCommissionApiFields(commission),
    };
  }, [
    getproducts,
    email,
    firstName,
    lastName,
    phoneNumber,
    address,
    aptSuite,
    city,
    getselectedStateCode,
    postalCode,
    sameAsShipping,
    address2,
    city2,
    getselectedStateCode2,
    postalCode2,
    appliedDiscount,
    getcampaignID,
    contact_details_id,
    smsTransactional,
    smsMarketing,
    calculateTotal,
  ]);

  const validateBillingAddress = useCallback(() => {
    if (!sameAsShipping) {
      if (!address2) {
        notifyError("Please enter billing address.");
        return false;
      }
      if (!getselectedStateCode2.state_code) {
        notifyError("Please select billing state.");
        return false;
      }
      if (!city2) {
        notifyError("Please enter billing city.");
        return false;
      }
      if (!postalCode2) {
        notifyError("Please enter billing postal code.");
        return false;
      }
    }
    return true;
  }, [
    sameAsShipping,
    address2,
    getselectedStateCode2,
    city2,
    postalCode2,
    notifyError,
  ]);

  const submitCreateOrderStripe = useCallback(
    async (paymentToken, snapshot) => {
      const snap = snapshot || getCheckoutSnapshot();

      if (!snap.productIds || snap.productIds.length === 0) {
        notifyError("No products found. Please try again.");
        return;
      }

      const body = buildCreateOrderStripeBody({
        email: snap.email,
        firstName: snap.firstName,
        lastName: snap.lastName,
        phoneNumber: snap.phoneNumber,
        address: snap.address,
        aptSuite: snap.aptSuite,
        city: snap.city,
        stateCode: snap.stateCode,
        postalCode: snap.postalCode,
        sameAsShipping: snap.sameAsShipping,
        address2: snap.address2,
        city2: snap.city2,
        billingStateCode: snap.billingStateCode,
        postalCode2: snap.postalCode2,
        appliedDiscount: snap.appliedDiscount,
        campaignId: snap.campaignId,
        contactDetailsId: snap.contactDetailsId,
        productIds: snap.productIds,
        productPrices: snap.productPrices,
        originalPrices: snap.originalPrices,
        gatewayIds: snap.gatewayIds,
        billingModelIds: snap.billingModelIds,
        promoCodes: snap.promoCodes,
        quantities: snap.quantities,
        paymentToken,
        smsTransactional: snap.smsTransactional,
        smsMarketing: snap.smsMarketing,
        referralId: snap.referralId,
        commissionType: snap.commissionType,
        commissionAmount: snap.commissionAmount,
        commissionCurrency: snap.commissionCurrency,
        productFamily: snap.productFamily,
        planMonths: snap.planMonths,
        sku: snap.sku,
        productName: snap.productName,
        orderValue: snap.orderValue,
        commissionLines: snap.commissionLines,
      });

      console.log("[createOrder_stripe] payload:", body);

      const Response = await axios.post(createOrder_stripe, body, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("[createOrder_stripe] response:", Response.data);

      const data = Response.data;
      let orders = [];
      if (Array.isArray(data)) {
        orders = data.filter((o) => o.status === 1 || o.status === true);
      } else if (data?.status === 1 || data?.status === true) {
        orders = [data];
      } else if (data?.data && (data.data.status === 1 || data.data.order_id)) {
        orders = [data.data];
      }

      if (orders.length > 0) {
        const firstOrder = orders[0];
        const orderId =
          firstOrder.order_id ||
          firstOrder.orderId ||
          firstOrder.id ||
          firstOrder.OrderID ||
          paymentToken;
        const productTotal = calculateTotal().toFixed(2);
        const productId =
          snap.productIds?.filter(Boolean).join(",") || snap.productIds[0];
        const orderIds = orders
          .map(
            (o) =>
              o.order_id || o.orderId || o.id || o.OrderID || null
          )
          .filter(Boolean);
        if (orderIds.length === 0 && orderId) orderIds.push(orderId);

        setorder_id(orderIds[0]);

        let hashFragment = "";
        if (urlHashFragment) {
          hashFragment = urlHashFragment;
        }

        navigate(`/thankyou-page${hashFragment}`, {
          state: {
            email: snap.email,
            phoneNumber: snap.phoneNumber,
            orderId: orderIds[0],
            orderIds,
            firstName: snap.firstName,
            lastName: snap.lastName,
            stateName: getselectedStateCode.name,
            stateCode: snap.stateCode,
            city: snap.city,
            postalCode: snap.postalCode,
            country: country,
            productTotal,
            productId,
            products: getproducts,
            coupon: snap.appliedDiscount || "",
            discountAmount: getCouponSavings(),
          },
        });

        if (window.gtag) {
          window.gtag("event", "conversion", {
            send_to: "AW-11515103107",
            transaction_id: orderIds[0],
          });
        }
        trackMetaPurchase({
          orderId: orderIds[0],
          value: productTotal,
          products: getproducts,
          userData: {
            email: snap.email,
            phone: snap.phoneNumber,
            firstName: snap.firstName,
            lastName: snap.lastName,
            city: snap.city,
            state: snap.stateCode,
            postalCode: snap.postalCode,
            country: country,
          },
        });
      } else {
        const failMsg = Array.isArray(data)
          ? data[0]?.message || "Order creation failed"
          : data?.message || data?.error || "Order creation failed";
        throw new Error(failMsg);
      }
    },
    [
      getCheckoutSnapshot,
      navigate,
      notifyError,
      calculateTotal,
      getselectedStateCode,
      urlHashFragment,
      country,
      getproducts,
      discount_amount,
    ]
  );

  const finalizeStripeOrder = useCallback(
    async (paymentToken, clientSecret) => {
      if (!paymentToken || !clientSecret) {
        notifyError("Payment verification failed. Please try again.");
        return;
      }
      if (isPaymentIntentProcessed(paymentToken)) {
        console.log("[stripe] order already created for", paymentToken);
        return;
      }
      setIsLoading(true);
      try {
        await verifyStripePaymentSucceeded(paymentToken, clientSecret);
        const snapshot = loadCheckoutSnapshot() || getCheckoutSnapshot();
        await submitCreateOrderStripe(paymentToken, snapshot);
        markPaymentIntentProcessed(paymentToken);
        clearCheckoutSnapshot();
        cleanStripeReturnParamsFromUrl();
      } catch (error) {
        console.log("[stripe] finalize order error:", error);
        setIsLoading(false);
        notifyError(
          error instanceof Error
            ? error.message
            : "Payment succeeded but order creation failed. Please contact support."
        );
      }
    },
    [notifyError, getCheckoutSnapshot, submitCreateOrderStripe]
  );

  useEffect(() => {
    const handleStripeRedirectReturn = async () => {
      if (stripeRedirectHandledRef.current) return;
      const { paymentIntentId, clientSecret, redirectStatus } =
        getStripeReturnParams();
      if (!paymentIntentId || !clientSecret) return;
      stripeRedirectHandledRef.current = true;
      if (redirectStatus && redirectStatus !== "succeeded") {
        notifyError(`Payment was not completed (${redirectStatus}).`);
        cleanStripeReturnParamsFromUrl();
        return;
      }
      try {
        await finalizeStripeOrder(paymentIntentId, clientSecret);
      } catch {
        /* finalizeStripeOrder already notifies */
      }
    };
    handleStripeRedirectReturn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── End Stripe helpers ─────────────────────────────────────────────────────

  // page 1 validation

  const Page1Validate = () => {
    if (email === "" || email === null) {
      notifyError("Please enter Email Address.");
      return;
    } else if (!validateEmail(email)) {
      notifyError("Please enter a valid Email Address.");
      return;
    } else if (firstName === "" || firstName === null) {
      notifyError("Please enter First Name.");
      return;
    } else if (lastName === "" || lastName === null) {
      notifyError("Please enter Last Name.");
      return;
    } else if (address === "" || address === null) {
      notifyError("Please enter Address.");
      return;
      // } else if (address.length > 34) {
      //   notifyError("Address cannot exceed 34 characters.");
      //   return;
    } else if (
      getselectedStateCode.name === "" ||
      getselectedStateCode.name === null
    ) {
      notifyError("Please select State.");
      return;
    } else if (city === "" || city === null) {
      notifyError("Please select City.");
      return;
      // } else if (getallCitys.includes(city) == false) {
      //   notifyError("Please select City.");
      //   return;
    } else if (postalCode === "" || postalCode === null) {
      notifyError("Please enter Postal Code.");
      return;
    } else if (phoneNumber === "" || phoneNumber === null) {
      notifyError("Please enter Phone Number.");
      return;
    } else if (phoneNumber.length < 10) {
      notifyError("Please enter valid Phone Number.");
      return;
    } else {
      setSection2(true);
    }
  };

  // page 2 validations

  const Page2Validate = () => {
    if (cardNumber === "" || cardNumber === null) {
      notifyError("Please enter Card Number.");
      return;
    } else if (cardNumber.length < 15 || cardNumber.length > 16) {
      notifyError("Please enter valid Card Number.");
      return;
    } else if (cardholdername === "" || cardholdername === null) {
      notifyError("Please enter Name on Card.");
      return;
    } else if (expiryDate === "" || expiryDate === null) {
      notifyError("Please enter Expiry Date.");
      return;
    } else {
      // Split the expiry date into month and year
      const [month, year] = expiryDate.split("/");

      // Check if the month and year are valid
      if (!month || !year || month.length !== 2 || year.length !== 2) {
        notifyError(
          "Invalid format. Please enter the expiry date in MM/YY format."
        );
        return;
      }

      // Check if the month is valid (between 01 and 12)
      if (parseInt(month, 10) < 1 || parseInt(month, 10) > 12) {
        notifyError("Invalid month. Please enter a valid month (01-12).");
        return;
      }

      // Check if the year is valid (current year or future year)
      const currentYear = new Date().getFullYear() % 100; // Get last 2 digits of current year
      if (parseInt(year, 10) < currentYear) {
        notifyError("Invalid year. Please enter a valid future year.");
        return;
      }
    }
    if (cvv === "" || cvv === null) {
      notifyError("Please enter Security code.");
      return;
    } else if (cvv.length < 3) {
      notifyError("Please enter valid Security code.");
      return;
    } else if (!sameAsShipping && (firstName2 === "" || firstName2 === null)) {
      notifyError("Please enter First Name.");
      return;
    } else if (!sameAsShipping && (lastName2 === "" || lastName2 === null)) {
      notifyError("Please enter Last Name.");
      return;
    } else if (!sameAsShipping && (address2 === "" || address2 === null)) {
      notifyError("Please enter Address.");
      return;
      // } else if (!sameAsShipping && address2.length > 34) {
      //   notifyError("Address cannot exceed 34 characters.");
      //   return;
    } else if (
      !sameAsShipping &&
      (getselectedStateCode2.name === "" || getselectedStateCode2.name === null)
    ) {
      notifyError("Please select State.");
      return;
    } else if (!sameAsShipping && (city2 === "" || city2 === null)) {
      notifyError("Please select City.");
      return;
      // } else if (!sameAsShipping && getallCitys.includes(city2) == false) {
      //   notifyError("Please select City.");
      //   return;
    } else if (
      !sameAsShipping &&
      (postalCode2 === "" || postalCode2 === null)
    ) {
      notifyError("Please enter Postal Code.");
      return;
    }  else if (
        !sameAsShipping &&
        phoneNumber2 &&
        phoneNumber2.trim() !== "" &&
        phoneNumber2.length < 10
      )
    {
      notifyError("Please enter valid Phone Number.");
      return;
    } else {
      checkout_api();
      // console.log("done");
    }
  };

  const checkout_api = async () => {
    setIsLoading(true);

    // Prepare product data arrays
    const productIds = getproducts.map((product) => product.product_id);
    const productPrices = getproducts.map((product) => product.product_price);
    const originalPrices = getproducts.map((product) => product.product_price); // Using same as product_price for now
    const gatewayIds = getproducts.map(() => "1"); // Default gateway_id
    const billingModelIds = getproducts.map(() => "3"); // Default billing_model_id
    const promoCodes = getproducts.map(() => "0"); // Default promoCodes

    console.log("Product IDs before sending:", productIds);
    console.log("Product Prices before sending:", productPrices);

    // Validate product IDs
    if (!productIds || productIds.length === 0) {
      notifyError("No products found. Please try again.");
      setIsLoading(false);
      return;
    }

    // Check for empty product IDs
    const invalidProductIds = productIds.filter((id) => !id || id === "");
    if (invalidProductIds.length > 0) {
      notifyError("Invalid product data. Please refresh and try again.");
      setIsLoading(false);
      return;
    }

    // Create FormData for proper array handling
    const formData = new FormData();

    // Add basic parameters
    formData.append("billingSameAsShipping", sameAsShipping ? "YES" : "NO");
    formData.append("email", email);
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append('phone', phoneNumber || "");
    formData.append("address", address);
    formData.append("city_name", city);
    formData.append("state_name", getselectedStateCode.state_code);
    formData.append("zip_code", postalCode);
    formData.append(
      "card_type",
      getcardid === 1
        ? "visa"
        : getcardid === 2
        ? "mastercard"
        : getcardid === 3
        ? "discover"
        : "american express"
    );
    formData.append("card_no", cardNumber);
    formData.append("ex_month", exMonth);
    formData.append("ex_year", exYear);
    formData.append("cvv_no", cvv);
    formData.append("card_holder_name", cardholdername);
    formData.append("start_url", window.location.href);
    formData.append("contact_details_id", contact_details_id);
    formData.append("promo_codes", appliedDiscount);
    formData.append("campaign_id", getcampaignID);

    const referralId = getEndorselyReferralId();
    if (referralId) {
      formData.append("referralId", referralId);
    }

    appendCommissionFormData(
      formData,
      getOrderCommission(getproducts, calculateTotal())
    );

        // sms consent
    formData.append("sms_transactional", smsTransactional ? 1 : 0);
    formData.append("sms_marketing", smsMarketing ? 1 : 0);

    // Add billing address fields if different from shipping
    if (!sameAsShipping) {
      formData.append("billingFirstName", firstName2);
      formData.append("billingLastName", lastName2);
      formData.append("billingAddress", address2);
      formData.append("billingCity", city2);
      formData.append("billingState", getselectedStateCode2.state_code);
      formData.append("billingZip", postalCode2);
      formData.append("billingCountry", "US");
    }

    // Add product arrays with proper array notation
    productIds.forEach((productId, index) => {
      formData.append("product_id[]", productId);
      formData.append("product_price[]", productPrices[index]);
      formData.append("original_price[]", originalPrices[index]);
      formData.append("gateway_id[]", gatewayIds[index]);
      formData.append("billing_model_id[]", billingModelIds[index]);
      formData.append("promoCodes[]", promoCodes[index]);
      const lineSku = getProductSku(getproducts[index] || { product_id: productId });
      if (lineSku) formData.append("sku[]", lineSku);
    });

    console.log("FormData entries:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    try {
      const Response = await axios.post(createOrder_test_new, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("API Response:", Response);
      console.log("Response Status:", Response.status);
      console.log("Response Data:", Response.data);

      setIsLoading(false);
      
      // Handle both single and multiple order responses
      let orderIds = [];
      let isMultipleOrders = Array.isArray(Response.data);
      
      console.log("Response type:", isMultipleOrders ? "Array" : "Object");
      console.log("Response data:", Response.data);
      
      if (isMultipleOrders) {
        // Array response (could be single or multiple orders)
        console.log("Processing array response with", Response.data.length, "items");
        if (Response.data.every(order => order.status === 1)) {
          orderIds = Response.data.map(order => order.order_id);
          console.log("Orders created successfully:", Response.data);
          
          // Execute success tracking and navigation
          // google tag pixel //
          // window.gtag &&
          //   window.gtag("event", "conversion", {
          //     send_to: "AW-11515103107", // Replace with your conversion label
          //     value:
          //       getproductPrice != null && !isNaN(getproductPrice)
          //         ? discount_percent && discount_percent !== "0.00"
          //           ? (
          //               parseFloat(getproductPrice) -
          //               (parseFloat(getproductPrice) *
          //                 (parseFloat(discount_percent) || 0)) /
          //                 100
          //             ).toFixed(2)
          //           : (
          //               parseFloat(getproductPrice) -
          //               (parseFloat(discount_amount) || 0)
          //             ).toFixed(2)
          //         : "", // Replace with dynamic amount
          //     currency: "USD",
          //     transaction_id: orderIds[0], // Use first order ID for tracking
          //   });
          
          setorder_id(orderIds[0]); // Set first order ID for backward compatibility

          // Always use original a_aid from URL hash if exists, regardless of coupon code
          let hashFragment = "";
          if (urlHashFragment) {
            hashFragment = urlHashFragment; // Pass exactly as stored (already includes #)
          }

          navigate(`/thankyou-page${hashFragment}`, {
            state: {
              email: email,
              phoneNumber: phoneNumber,
              orderId: orderIds[0], // Keep single orderId for backward compatibility
              orderIds: orderIds, // Add array of all order IDs
              firstName: firstName,
              lastName: lastName,
              stateName: getselectedStateCode.name,
              stateCode: getselectedStateCode.state_code,
              city: city,
              postalCode: postalCode,
              country: country,
              productTotal: getDiscountedTotal(),
              productId:
                getproducts.map((p) => p.product_id).filter(Boolean).join(",") ||
                "",
              products: getproducts, // Pass full products array for purchase event
              coupon: appliedDiscount || "",
              discountAmount: getCouponSavings(),
            },
          });
          // google tag pixel start Event snippet for Purchase conversion page
          if (window.gtag) {
            window.gtag("event", "conversion", {
              send_to: "AW-11515103107",
              transaction_id: orderIds[0],
            });
          }
          // google tag pixel end
          trackMetaPurchase({
            orderId: orderIds[0],
            value: getDiscountedTotal() || 0,
            products: getproducts,
            userData: {
              email,
              phone: phoneNumber,
              firstName,
              lastName,
              city,
              state: getselectedStateCode?.state_code || getselectedStateCode?.name,
              postalCode,
              country,
            },
          });
        } else {
          console.log("Some orders failed:", Response.data);
          console.log("Failed orders:", Response.data.filter(order => order.status !== 1));
          notifyError("Some orders failed to process");
        }
      } else if (Response.data.status == 1) {
        // Single order response
        orderIds = [Response.data.order_id];
        console.log("Order created successfully:", Response.data);
        
        // Execute success tracking and navigation
        // google tag pixel //
        // window.gtag &&
        //   window.gtag("event", "conversion", {
        //     send_to: "AW-11515103107", // Replace with your conversion label
        //     value:
        //       getproductPrice != null && !isNaN(getproductPrice)
        //         ? discount_percent && discount_percent !== "0.00"
        //           ? (
        //               parseFloat(getproductPrice) -
        //               (parseFloat(getproductPrice) *
        //                 (parseFloat(discount_percent) || 0)) /
        //                 100
        //             ).toFixed(2)
        //           : (
        //               parseFloat(getproductPrice) -
        //               (parseFloat(discount_amount) || 0)
        //             ).toFixed(2)
        //         : "", // Replace with dynamic amount
        //     currency: "USD",
        //     transaction_id: orderIds[0], // Use first order ID for tracking
        //   });
        
        setorder_id(orderIds[0]); // Set first order ID for backward compatibility

        // Always use original a_aid from URL hash if exists, regardless of coupon code
        let hashFragment = "";
        if (urlHashFragment) {
          hashFragment = urlHashFragment; // Pass exactly as stored (already includes #)
        }

        navigate(`/thankyou-page${hashFragment}`, {
          state: {
            email: email,
            phoneNumber: phoneNumber,
            orderId: orderIds[0], // Keep single orderId for backward compatibility
            orderIds: orderIds, // Add array of all order IDs
            firstName: firstName,
            lastName: lastName,
            stateName: getselectedStateCode.name,
            stateCode: getselectedStateCode.state_code,
            city: city,
            postalCode: postalCode,
            country: country,
            productTotal: getDiscountedTotal(),
            productId:
              getproducts.map((p) => p.product_id).filter(Boolean).join(",") ||
              "",
            products: getproducts, // Pass full products array for purchase event
            coupon: appliedDiscount || "",
            discountAmount: getCouponSavings(),
          },
        });
        // google tag pixel start Event snippet for Purchase conversion page
        if (window.gtag) {
          window.gtag("event", "conversion", {
            send_to: "AW-11515103107",
            transaction_id: orderIds[0],
          });
        }
        // google tag pixel end

        trackMetaPurchase({
          orderId: orderIds[0],
          value: getDiscountedTotal() || 0,
          products: getproducts,
          userData: {
            email,
            phone: phoneNumber,
            firstName,
            lastName,
            city,
            state: getselectedStateCode?.state_code || getselectedStateCode?.name,
            postalCode,
            country,
          },
        });
      } else if (Response.data.status == 5) {
        console.log("Payment update required:", Response.data);
        notifyError(Response.data.message);
      } else if (Response.data.error_details) {
        console.log("API Error details:", Response.data.error_details);
        notifyError(Response.data.error_details.message);
      } else {
        console.log("API Error - Response data:", Response.data);
        console.log("API Error - Response status:", Response.data?.status);
        console.log("API Error - Response message:", Response.data?.message);
        setIsLoading(false);
        notifyError(Response.data.message || "Order creation failed");
      }
      console.log("====================================");
      console.log("createOrder_test_new res =>", Response.data);
      console.log("====================================");
    } catch (error) {
      console.log("API Call Error:", error);
      console.log("Error Response:", error.response);
      console.log("Error Message:", error.message);
      setIsLoading(false);
      notifyError("Failed to create order. Please try again.");
    }
  };

  const handleCardChange = (event) => {
    const cardValue = parseInt(event.target.value);
    setCardid(cardValue);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    // Only set the CVV if the length is 3 or less and it's numeric
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setCvv(value);
    }
  };

  const formatCardNumber = (cardNumber) => {
    // Add spaces every 4 characters
    return cardNumber.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const [validEmail, setValidEmail] = useState(true);

  const handleEmailChange = (e) => {
    const input = e.target.value;
    setEmail(input);

    // Basic email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isValid = emailRegex.test(input);

    setValidEmail(isValid);
  };

  const productChange = (id) => {
    console.log("e.targate.value", id);
    navigate(`/${id}`);
    // FetchProduct is now called from the API response, not here
  };

  const [countdown, setCountdown] = useState(3); // Timer for 3 seconds

  // Track payment info entry for ce_add_payment_info event
  const [paymentInfoFired, setPaymentInfoFired] = useState(false);

  // Fire ce_add_payment_info when Stripe payment form is ready
  useEffect(() => {
    if (
      !paymentInfoFired &&
      getsection2 &&
      stripeClientSecret &&
      getproducts.length > 0
    ) {
      try {
        fireAddPaymentInfo({
          products: getproducts,
          totalValue: calculateTotal(),
          paymentType: "Stripe",
          coupon: appliedDiscount || "",
          discountAmount: getCouponSavings(),
        });
        trackMetaAddPaymentInfo({
          value: calculateTotal(),
          products: getproducts,
          userData: {
            email,
            phone: phoneNumber,
            firstName,
            lastName,
            city,
            state: getselectedStateCode?.state_code || getselectedStateCode?.name,
            postalCode,
            country,
          },
          eventId: `AddPaymentInfo_${email || "guest"}_${Date.now()}`,
        });
        setPaymentInfoFired(true);
      } catch (error) {
        console.error("Error firing ce_add_payment_info:", error);
      }
    }
  }, [
    paymentInfoFired,
    getsection2,
    stripeClientSecret,
    getproducts,
    calculateTotal,
    appliedDiscount,
    discount_amount,
  ]);

  // useEffect for close modal after 3 secound
  useEffect(() => {
    if (getskipModel) {
      console.log("getdata?.offer_id", getdata?.offer_id);

      let timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      // const timer = setTimeout(() => {
      //   setSkipModel(false);
      //   window.location.assign(targetUrl);
      // }, 3000); // Delay to ensure the script has loaded

      const redirectTimer = setTimeout(() => {
        setSkipModel(false);
        window.location.assign(memberPortalUrl);
      }, 3000);

      return () => {
        clearInterval(timer);
        clearTimeout(redirectTimer);
      };
    }
  }, [getskipModel]);

  // memberportel redire url
  const currentDomain = window.location.hostname;

  let memberPortalUrl = "http://member.totara.health/"; // Default URL

  if (currentDomain === "checkout.totara.health") {
    memberPortalUrl = "http://member.totara.health/";
  } else if (currentDomain === "checkoutdev-totarahealth.wlmd.dev") {
    memberPortalUrl = "https://mpdev-totarahealth.wlmd.dev/";
  }

  console.log("currentDomain", currentDomain);
  console.log("memberPortalUrl", memberPortalUrl);

  // const targetUrl = getdata.is_intake === "0"
  //   ? `https://totarahealth.co/weight-loss-order-first/?order_id=${getorder_id}&unique_id=${uniqueId}&op=intake`
  //   : memberPortalUrl;
  const targetUrl = memberPortalUrl;

  // after email api

  const handleEmailBlur = async () => {
    if (validEmail && email.trim() !== "") {
      setIsEmailLoading(true); // Start loading only if email is valid

      try {
        const couponProductId = getCouponProductId();

        const response = await axios.post(member_view, {
          email: email,
          product_id: couponProductId,
          campaign_id: getcampaignID,
        });
        console.log("API Response:", response.data);
        if (response.data.status === 1) {
          const updatedPrice = response.data?.m_price;
          setProductPrice(updatedPrice);
          
          // Update getdata with the new price for checkout details footer
          if (getdata && Object.keys(getdata).length > 0) {
            setdata({
              ...getdata,
              product_price: updatedPrice
            });
          }
          
          // Also update the products array if needed
          if (getproducts.length > 0) {
            const updatedProducts = getproducts.map((product, index) => {
              if (index === 0) {
                return {
                  ...product,
                  product_price: updatedPrice
                };
              }
              return product;
            });
            setProducts(updatedProducts);
          }
        }
      } catch (error) {
        console.error("Error sending email:", error);
      } finally {
        setIsEmailLoading(false); // Ensure loading state resets even if API fails
      }
    }
  };

  if (isloading) {
    return (
      <div style={{ height: "97vh" }}>
        <Loading />
      </div>
    );
  }

  return (
    <>
      {/* <Navbar2 color="#fff" logo={images.logo} /> */}
      <div className="payment-container" style={{ position: "relative" }}>
        {/* <div className="payment-content">
          <div className="payment-header_p">
            <p className="paymen_p_tag">Checkout</p>
          </div>
        </div> */}
        <div className="payment-content2 payment-column-reverse">
          {/* onSubmit={handleSubmit} */}
          <div className="checkout-form-wrapp">
            <div className="checkout_logo_wrapp headline_for_mob2">
              <img
                src={images.logo}
                className="my_logo"
                alt=""
                style={{ marginBottom: "20px" }}
              />

              <div className="checkout_head_name_wrapp">
                <p>Shipping</p>
                <FiChevronRight size={20} style={{ display: "block" }} />
                <p>Payment</p>
              </div>
            </div>

            {!getsection2 ? (
              <div className="checkout-form">
                {/* contect info */}
                <h3>Contact</h3>
                <div className="form-group">
                  <input
                    type="email"
                    placeholder={
                      isemailLoading ? "Verifying..." : "Email Address"
                    }
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur} // Call API when moving away
                    style={{
                      border: validEmail ? "" : "1px solid red",
                      // backgroundColor: isemailLoading ? "#f5f5f5" : "white", // Light gray when verifying
                      // color: isemailLoading ? "#888" : "black",
                      cursor: isemailLoading ? "not-allowed" : "text",
                    }}
                    disabled={isemailLoading}
                  />
                  {isemailLoading && (
                    <p style={{ color: "blue", fontSize: "12px" }}>
                      Verifying...
                    </p>
                  )}
                  {!validEmail && (
                    <p style={{ color: "red", marginTop: "2px" }}>
                      Please enter a valid email address.
                    </p>
                  )}
                </div>
                <h3>Shipping Address</h3>
                {/* <div className="form-group"> */}
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option>United States</option>
                  {/* Add more country options here */}
                </select>
                {/* </div> */}
                <div className="form-group-inline">
                  <div className="form-group min-width-50">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="form-group min-width-50">
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <input
                    ref={inputRef1}
                    type="text"
                    placeholder="Address"
                    value={address}
                    // onChange={(e) => setAddress(e.target.value)}
                    onChange={(e) => {
                      if (e.target.value.length == 0) {
                        setSelectedState({
                          name: "",
                          state_code: "",
                        });
                        setSelectedStateCode({
                          name: "",
                          state_code: "",
                        });
                        setCity("");
                        setPostalCode("");
                      }
                      setAddress(e.target.value);
                    }}
                  />
                </div>
                <div className="form-group-inline">
                  <div className="inline_seond">
                    <select
                      value={JSON.stringify({
                        name: getselectedState.name,
                        state_code: getselectedState.state_code,
                      })}
                      onChange={(e) => {
                        const selectedState = JSON.parse(e.target.value);

                        console.log("getselectedStateCode1", selectedState);

                        setSelectedState({
                          name: selectedState.name,
                          state_code: selectedState.state_code,
                        });
                        setSelectedStateCode({
                          name: selectedState.name,
                          state_code: selectedState.state_code,
                        });
                        // setSelectedStateCode(selectedState.state_code);
                        handleStateChange(selectedState.name); // Optional: If you have additional logic
                        console.log(
                          "getselectedStateCode",
                          selectedState.state_code
                        );
                      }}
                    >
                      <option
                        value={JSON.stringify({ name: "", state_code: "" })}
                      >
                        Select state
                      </option>
                      {getstate.map((state) => (
                        <option
                          key={state.state_code}
                          value={JSON.stringify({
                            name: state.name,
                            state_code: state.state_code,
                          })}
                        >
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="inline_seond">
                    {iscityloading ? (
                      <div
                        style={{
                          marginTop: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "1rem",
                        }}
                      >
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            border: "3px solid #e0e0e0",
                            borderTop: "3px solid #f39322",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        ></div>
                      </div>
                    ) : (
                      // <select
                      //   value={city} // Use city directly
                      //   onChange={(e) => {
                      //     setCity(e.target.value);
                      //     setPostalCode("");
                      //   }} // Update city state on selection
                      //   disabled={iscityloading}
                      // >
                      //   <option value="">Select city</option>
                      //   {getallCitys.map((city, index) => (
                      //     <option key={index} value={city}>
                      //       {city}
                      //     </option>
                      //   ))}
                      // </select>
                      <div className="form-group" style={{ width: "100%" }}>
                        <input
                          type="text"
                          placeholder="City"
                          value={city}
                          // onChange={(e) => setFirstName(e.target.value)}
                          onChange={(e) => {
                            setCity(e.target.value);
                            setPostalCode("");
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                </div>
                {/* <br /> */}
                {/* phone number start */}
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Phone number"
                    value={phoneNumber}
                    onChange={(e) => {
                      const input = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
                      if (input.length <= 10) {
                        setPhoneNumber(input);
                      }
                    }}
                  />
                </div>
                {/* phone number end */}
                {/* <p>All transactions are secure and encrypted.</p> */}
                <br />
                {/* <div style={{ display: "flex", alignItems: "flex-start" }}>
                  <input
                    type="checkbox"
                    id="medicationConsent"
                    checked={isChecked}
                    onChange={handleCheckboxChange}
                    style={{
                      marginTop: "0px",
                      marginRight: "10px",
                      width: "25px",
                      height: "25px",
                      padding: "5px",
                      cursor: "pointer",
                      appearance: "auto",
                      accentColor: "var(--clr-main)",
                    }}
                    // className="details_of_checkbox"
                  />
                  <label
                    htmlFor="medicationConsent"
                    style={{
                      fontSize: "14px",
                      lineHeight: "1.5",
                      fontWeight: "300",
                    }}
                  >
                    <strong style={{ fontWeight: "500" }}>
                      Text me when my medication ships
                    </strong>{" "}
                    and for exclusive health and weight loss content. I agree to
                    receive marketing text messages from totarahealth at the number
                    provided above. Consent is not a condition of purchase.
                    Message frequency varies. Message & data rates may apply.
                    Reply STOP to unsubscribe, HELP for help. View our{" "}
                    <a
                      href="https://totara.health/pages/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--clr-main)", textDecoration: "underline" }}
                    >
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a
                      href="https://totara.health/pages/terms-of-use"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--clr-main)", textDecoration: "underline" }}
                    >
                      Terms & Conditions
                    </a>
                    .
                  </label>
                </div> */}
                <div className="sms-section">
                  {/* <h4 style={{ marginBottom: "10px" }}>SMS Preferences (Optional)</h4> */}

                  {/* Non-marketing / Transactional consent */}
                  <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <input
                      type="checkbox"
                      id="smsTransactional"
                      checked={smsTransactional}
                      onChange={(e) => setSmsTransactional(e.target.checked)}
                      style={{
                        marginTop: "0px",
                        marginRight: "10px",
                        width: "25px",
                        height: "25px",
                        padding: "5px",
                        cursor: "pointer",
                        appearance: "auto",
                        accentColor: "var(--clr-main)",
                        outline: "transparent",
                      }}
                    />
                    <label htmlFor="smsTransactional" className="checkbox-label" style={{ fontSize: "14px", lineHeight: "1.5", fontWeight: "300" }}>
                      I consent to receive non-marketing text messages from Totara Health regarding order updates, shipping notifications, and doctor communication. Message frequency varies. Message & data rates may apply. Reply HELP for assistance, reply STOP to opt out.
                    </label>
                  </div>

                  {/* Marketing / Promotional consent */}
                  <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <input
                      type="checkbox"
                      id="smsMarketing"
                      checked={smsMarketing}
                      onChange={(e) => setSmsMarketing(e.target.checked)}
                      style={{
                        marginTop: "0px",
                        marginRight: "10px",
                        width: "25px",
                        height: "25px",
                        padding: "5px",
                        cursor: "pointer",
                        appearance: "auto",
                        accentColor: "var(--clr-main)",
                        outline: "transparent",
                      }}
                    />
                    <label htmlFor="smsMarketing" className="checkbox-label" style={{ fontSize: "14px", lineHeight: "1.5", fontWeight: "300" }}>
                      I consent to receive marketing text messages from Totara Health regarding promotions and special offers. Message frequency varies. Message & data rates may apply. Reply HELP for assistance, reply STOP to opt out.
                    </label>
                  </div>

                  <p className="no-sharing" style={{ marginBottom: "1rem" }}>
                    Mobile information will not be sold or shared with third parties.
                  </p>
                </div>

                {/* Continue to payment button - color and name unchanged */}
                {/* promo code start*/}
                {/* <div className="payment_card">
              <div className="payment_card_titel">
                <b>
                  <RiDiscountPercentLine />
                  Promo Code
                </b>
              </div>

              <div className="form-group-inline">
                <div
                  className="inline_seond promo_input"
                >
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Enter Promo Code"
                  />
                </div>
                <div
                  className="inline_seond"
                  style={{ width: "30%", minWidth: "100px" }}
                >
                  <button className="btn" onClick={handleApplyDiscount}>
                    Apply
                  </button>
                </div>
              </div>
            </div> */}
                {/* Display error message */}

                {/* promo code end */}
                <br />
                {/* <br /> */}
                {/* payment details */}
                {/* <div className="payment_card">
              <div className="payment_card_titel">
                <b>
                  <MdOutlinePayment />
                  Payment Methods
                </b>
                <div className="card_icon_div">
                  <img
                    src={images.visa}
                    className="item_img_card"
                    alt="Headphones"
                  />
                  <img
                    src={images.master}
                    className="item_img_card"
                    alt="Headphones"
                  />
                  <img
                    src={images.jcb}
                    className="item_img_card"
                    alt="Headphones"
                  />
                  <img
                    src={images.american}
                    className="item_img_card"
                    alt="Headphones"
                  />
                </div>
              </div>
              <div className="details-card">
                <div className="form-group">
                  <select
                    className="card-dropdown"
                    onChange={handleCardChange}
                    value={getcardid}
                  >
                    <option value={1}>Visa</option>
                    <option value={2}>MasterCard</option>
                    <option value={3}>Discover</option>
                    <option value={4}>American Express</option>
                  </select>
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Card holder name"
                    className="card-number"
                    value={cardholdername}
                    onChange={(e) => setcardholdername(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Card Number"
                    className="card-number"
                    value={formatCardNumber(cardNumber)}
                    onChange={(e) => {
                      const input = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
                      if (input.length <= 16) {
                        setCardNumber(input);
                      }
                    }}
                  />
                </div>
                <div className="form-group-inline">
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="expiry-date"
                      value={expiryDate}
                      onChange={(e) => {
                        let input = e.target.value;
                        // Remove non-numeric characters except "/"
                        input = input.replace(/\D/g, "");

                        // Ensure input is limited to 4 characters (MMYY format)
                        if (input.length > 4) {
                          input = input.slice(0, 4);
                        }

                        // Extract MM and YY
                        const month = input.slice(0, 2);
                        const year = input.slice(2, 4);

                        // Update state for ex_month and ex_year
                        setExMonth(month);
                        setExYear(year);

                        // Format input to display MM/YY in the input field
                        setExpiryDate(
                          month + (year.length > 0 ? "/" + year : "")
                        );
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="CVV"
                      className="cvv"
                      value={cvv}
                      onChange={handleChange}
                      maxLength={3}
                    />
                  </div>
                </div>
                <div className="note_titel_">
                
                </div>
                <center>
                  <button className="btn-checkout" onClick={checkout_api}>
                    Complete Checkout
                  </button>
                </center>
              </div>
            </div> */}
                <button
                  className="apply-button"
                  style={{ width: "100%" }}
                  onClick={Page1Validate}
                >
                  CONTINUE TO PAYMENT
                </button>
                <p style={{ textAlign: "center", marginTop: "12px", fontSize: "14px" }}>
                  <a
                    href="https://apply.totara.health/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--clr-main)", textDecoration: "underline" }}
                  >
                    Privacy Policy
                  </a>
                  {" | "}
                  <a
                    href="https://apply.totara.health/terms-and-conditions"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--clr-main)", textDecoration: "underline" }}
                  >
                    Terms & Conditions
                  </a>
                </p>
              </div>
            ) : (
              <div className="checkout-form">
                {/* contect box start */}
                <div className="sec2_checkout_box_wrapp">
                  <div>
                    <p>Contact</p>
                    <p>{email}</p>
                    <button
                      onClick={() => {
                        setSection2(false);
                      }}
                    >
                      Change
                    </button>
                  </div>
                  <div style={{ borderBottom: "none" }}>
                    <p>Ship to</p>
                    <p>{address}</p>
                    <button
                      onClick={() => {
                        setSection2(false);
                      }}
                    >
                      Change
                    </button>
                  </div>
                  {/* <div style={{borderBottom:"none"}}>
                    <p>Shipping method</p>
                    <p>Standard</p>
                    <button
                      onClick={() => {
                        setSection2(false);
                      }}
                    >
                      Change
                    </button>
                  </div> */}
                </div>
                {/* contect box end */}
                <br />

                {/* payment (Stripe) */}
                <p className="pg2_heading">Payment</p>
                <p className="pg2_des">
                  All transactions are secure and encrypted.
                </p>

                {stripePaymentError && (
                  <div className="stripe-checkout-error">{stripePaymentError}</div>
                )}

                {isCreatingPaymentIntent && (
                  <p className="stripe-payment-loading">
                    Initializing secure payment…
                  </p>
                )}

                {stripeClientSecret && (
                  <Elements
                    key={stripeClientSecret}
                    stripe={getStripePromise()}
                    options={{
                      clientSecret: stripeClientSecret,
                      appearance: stripeAppearance,
                      locale: "en-US",
                    }}
                  >
                    <StripeCheckoutForm
                      amountInCents={getCheckoutAmountCents()}
                      billingDefaults={stripeBillingDefaults}
                      onValidateBilling={validateBillingAddress}
                      onPersistCheckoutSnapshot={() =>
                        saveCheckoutSnapshot(getCheckoutSnapshot())
                      }
                      onPaymentSuccess={(paymentToken, clientSecret) =>
                        finalizeStripeOrder(paymentToken, clientSecret)
                      }
                      onExpressPaymentSuccess={(paymentToken, clientSecret) =>
                        finalizeStripeOrder(paymentToken, clientSecret)
                      }
                      disabled={isloading}
                    />
                  </Elements>
                )}

                {!stripeClientSecret &&
                  !isCreatingPaymentIntent &&
                  !stripePaymentError && (
                    <p className="stripe-payment-loading">
                      Please complete your contact and shipping details to
                      enable payment.
                    </p>
                  )}
                {/* payment box end */}
                <br />
                {/* billing address start */}

                <p className="pg2_heading">Billing address</p>
                <p className="pg2_des">
                  Select the address that matches your card or payment method.
                </p>

                <div className="paymentbox_main_wrapp">
                  <div
                    className="addressbox_header"
                    onClick={() => setSameAsShipping(true)}
                  >
                    <input
                      type="radio"
                      name="addressOption"
                      value="same"
                      checked={sameAsShipping}
                      onChange={() => setSameAsShipping(true)}
                      className="address_box_radio"
                    />
                    <p className="pg2_heading">Same as shipping address</p>
                  </div>
                  <div
                    className="addressbox_header"
                    onClick={() => setSameAsShipping(false)}
                  >
                    <input
                      type="radio"
                      name="addressOption"
                      value="different"
                      checked={!sameAsShipping}
                      onChange={() => setSameAsShipping(false)}
                      className="address_box_radio"
                    />
                    <p className="pg2_heading">
                      Use a different billing address
                    </p>
                  </div>
                  {/* Billing Address Form (conditionally rendered) */}
                  {!sameAsShipping && (
                    <div className="same_as_shipping_form-2">
                      <select
                        value={country2}
                        onChange={(e) => setCountry2(e.target.value)}
                      >
                        <option>United States</option>
                        {/* Add more country options here */}
                      </select>
                      <div className="form-group-inline">
                        <div className="form-group min-width-50">
                          <input
                            type="text"
                            placeholder="First Name"
                            value={firstName2}
                            onChange={(e) => setFirstName2(e.target.value)}
                          />
                        </div>
                        <div className="form-group min-width-50">
                          <input
                            type="text"
                            placeholder="Last Name"
                            value={lastName2}
                            onChange={(e) => setLastName2(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <input
                          ref={inputRef2}
                          type="text"
                          placeholder="Address"
                          value={address2}
                          // onChange={(e) => setAddress2(e.target.value)}
                          onChange={(e) => {
                            if (e.target.value.length == 0) {
                              setSelectedState2({
                                name: "",
                                state_code: "",
                              });
                              setSelectedStateCode2({
                                name: "",
                                state_code: "",
                              });
                              setCity2("");
                              setPostalCode2("");
                            }
                            setAddress2(e.target.value);
                          }}
                        />
                      </div>
                      <div className="form-group-inline">
                        <div className="inline_seond">
                          <select
                            value={JSON.stringify({
                              name: getselectedState2.name,
                              state_code: getselectedState2.state_code,
                            })}
                            onChange={(e) => {
                              console.log("getselectedStateCode-----", e);
                              const selectedState = JSON.parse(e.target.value);
                              // setSelectedState2(selectedState.name);
                              // setSelectedStateCode2(selectedState.state_code);
                              setSelectedState2({
                                name: selectedState.name,
                                state_code: selectedState.state_code,
                              });
                              setSelectedStateCode2({
                                name: selectedState.name,
                                state_code: selectedState.state_code,
                              });
                              handleStateChange2(selectedState.name);
                              console.log(
                                "getselectedStateCode111",
                                getselectedStateCode
                              );
                            }}
                          >
                            <option
                              value={JSON.stringify({
                                name: "",
                                state_code: "",
                              })}
                            >
                              Select state
                            </option>{" "}
                            {getstate &&
                              getstate.map((states, index) => {
                                return (
                                  <option
                                    value={JSON.stringify({
                                      name: states.name,
                                      state_code: states.state_code,
                                    })}
                                  >
                                    {states.name}
                                  </option>
                                );
                              })}
                            {/* Add more state options here */}
                          </select>
                        </div>
                        <div className="inline_seond">
                          {iscityloading ? (
                            <div
                              style={{
                                marginTop: "10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "1rem",
                              }}
                            >
                              <div
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  border: "3px solid #e0e0e0",
                                  borderTop: "3px solid #f39322",
                                  borderRadius: "50%",
                                  animation: "spin 1s linear infinite",
                                }}
                              ></div>
                            </div>
                          ) : (
                            // <select
                            //   value={city2}
                            //   onChange={(e) => {
                            //     setCity2(e.target.value);
                            //     setPostalCode2("");
                            //   }}
                            // >
                            //   <option value={""}>Select city</option>

                            //   {getallCitys.map((city, index) => {
                            //     return <option value={city}>{city}</option>;
                            //   })}
                            //   {/* Add more state options here */}
                            // </select>
                            <div
                              className="form-group"
                              style={{ width: "100%" }}
                            >
                              <input
                                type="text"
                                placeholder="City"
                                value={city2}
                                onChange={(e) => {
                                  setCity2(e.target.value);
                                  setPostalCode2("");
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <div className="inline_seond">
                          <input
                            type="text"
                            placeholder="Postal Code"
                            value={postalCode2}
                            onChange={(e) => setPostalCode2(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <input
                          type="text"
                          placeholder="Phone number"
                          value={phoneNumber2}
                          onChange={(e) => {
                            const input = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
                            if (input.length <= 10) {
                              setPhoneNumber2(input);
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="features">
                  <ul style={{}}>
                    <li style={{ fontSize: "14px" }}>
                      Free online medical consultation.
                    </li>
                    <li style={{ fontSize: "14px" }}>
                      24/7 support via email or phone.
                    </li>
                    <li style={{ fontSize: "14px" }}>
                      100% refund if you are not prescribed.
                    </li>
                  </ul>
                </div>
                <br />

                <center>
                  <div className="ssl-secured-payment">
                    <FaLock />
                    <p
                      style={{
                        marginLeft: "5px",
                        fontSize: "16px",
                        color: "var(--clr-text)",
                        fontWeight: "400",
                      }}
                    >
                      SSL SECURED PAYMENT
                    </p>
                  </div>
                  <div>
                    <p
                      style={{
                        marginLeft: "5px",
                        fontSize: "16px",
                        color: "var(--clr-text)",
                        fontWeight: "400",
                      }}
                    >
                      {" "}
                      Your information is protected by 256-bit SSL encryption
                    </p>
                  </div>
                </center>
              </div>
            )}
          </div>
          <div className="center_line"></div>
          <div className="order-summary2">
            <div className="checkout_logo_wrapp headline_for_mob">
              <img src={images.logo} className="" alt="" />

              <div className="checkout_head_name_wrapp">
                <p>Shipping</p>
                <FiChevronRight size={20} style={{ display: "block" }} />
                <p>Payment</p>
              </div>
            </div>
            <div
              className="product-info-right mb-2 mb:mt-0"
              // style={{ marginTop: "0px", marginBottom: "10px" }}
            >
              {/* product image and name price display */}
              {getproducts.length === 1 ? (
                // Single product display
                <>
                  <div className="product-image py-2">
                    
                      <img src={images.bottel_img} alt="product-img" />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "80%",
                      alignItems: "center",
                      gap:"15px"
                    }}
                  >
                    <div className="product-details">
                      <h4>{getproducts[0]?.product_name}</h4>
                    </div>
                    <div style={{}} className="product-price">
                      <span className="discounted-price">
                        ${getproductPrice}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                // Multiple products display
                <div style={{ width: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      // marginBottom: "12px",
                      maxHeight: "130px",
                      overflow: "auto",
                    }}
                  >
                    {getproducts.map((product, index) => (
                      <div
                        key={product.product_id || index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          // backgroundColor: "#f8f9fa",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          border: "1px solid #e9ecef",
                          width: "100%",
                        }}
                      >
                        <img
                          src={
                            product?.product_img &&
                                product.product_img.length > 0
                              ? product.product_img[0]?.img_video
                              : images.bottel_img
                          }
                          alt="product"
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "contain",
                            borderRadius: "6px",
                            marginRight: "12px",
                            padding: "5px",
                            border: "0.5px solid var(--clr-border)",
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: "13px",
                              fontWeight: "500",
                              margin: 0,
                              color: "#000",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {product.product_name}
                          </p>
                          <p
                            style={{
                              fontSize: "11px",
                              margin: "2px 0 0 0",
                              color: "#000",
                              fontWeight: "600",
                            }}
                          >
                            ${product.product_price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid #e9ecef",
                      paddingTop: "8px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          margin: 0,
                          color: "#495057",
                        }}
                      >
                        {getproducts.length} items in cart
                      </p>
                    </div>
                    <div style={{}} className="product-price">
                      <span className="discounted-price">
                        ${getproductPrice}
                      </span>
                    </div>
                  </div> */}
                </div>
              )}
              {/* product image and name price display */}
            </div>
            {/* Discount Code */}
            <div className="discount-code-section">
              <input
                style={{ width: "75%" }}
                type="text"
                placeholder="Discount Code"
                className="input-field"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
              />
              <button
                style={{ width: "25%" }}
                onClick={handleApplyDiscount}
                className="apply-button"
              >
                Apply
              </button>
            </div>
            {/* Display error message */}
            {error && (
              <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
            )}
            {applyLoading && (
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    border: "3px solid #e0e0e0",
                    borderTop: "3px solid var(--clr-main)",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                ></div>
              </div>
            )}
            {/* Display discount badge on success */}
            {appliedDiscount && (
              <div
                style={{
                  marginTop: "10px",
                  backgroundColor: "#e0f7fa",
                  padding: "5px 10px",
                  display: "inline-block",
                  borderRadius: "5px",
                  width: "fit-content",
                  display: "flex",
                }}
              >
                <span style={{ color: "#00796b" }}>
                  ✅ {appliedDiscount} Applied
                </span>
                <button
                  onClick={handleRemoveDiscount}
                  style={{
                    marginLeft: "10px",
                    backgroundColor: "#230359",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                  className="remove_coupen_btn"
                >
                  <IoCloseOutline />
                </button>
              </div>
            )}

            {/* Order Summary */}
            <div
              style={{
                marginTop: "10px",
                backgroundColor: "var(--clr-card-bg)",
              }}
              className="order-summary2"
            >
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: "500",
                  marginTop: "0px",
                  color: "var(--clr-text)",
                }}
                className="order-summary-title"
              >
                Order Summary
              </p>
              <hr className="order_summery_hr" />

              {/* Render all products */}
              <>
                <>
                  {(getproducts?.length > 0 ? getproducts : [getdata]).map(
                    (product, index) => {
                      const price = parseFloat(product?.product_price);
                      const displayPrice = !isNaN(price) ? price.toFixed(2) : null;
                      const months = getMonthsFromProductName(product?.product_name);
                      const monthlyCost =
                        months > 1 && !isNaN(price)
                          ? (price / months).toFixed(2)
                          : null;

                      return(
                      <div key={product.product_id || index} className="item">
                        <div className="os-img">
                          <img
                          src={
                            product?.product_img &&
                                product.product_img.length > 0
                              ? product.product_img[0]?.img_video
                              : images.bottel_img
                          }
                          className="order_summary_img "
                          alt="your medication"
                        />
                        </div>
                        
                        <div className="div_card gap-4">
                          <p>{product?.product_name}</p>
                          <div className="product-price pro-price">
                            {/* Optional: Show original price if different */}
                            {/* {parseFloat(product.product_price) !== parseFloat(getproductPrice) && (
                            <span className="original-price" style={{ marginRight: "10px" }}>
                              ${parseFloat(product.product_price).toFixed(2)}
                            </span>
                          )} */}
                            <span className="discounted-price">
                                 {displayPrice != null ? `$${displayPrice}` : ""}
                            </span>
                            {monthlyCost != null && (
                            <span>
                                <p className="monthly-cost" style={{  color: "green" }}>
                                  ${monthlyCost}/mo
                                </p>
                            </span>
                            )}
                          </div>
                        </div>
                      </div>
                      )
                    }
                  )}
                </>
              </>
              <div className="item">
                <div
                  style={{
                    padding: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "70px",
                    
                    border: "1px solid var(--clr-border)",
                    borderRadius: "5px",
                  }}
                  className="icon-box-c"
                >
                  <img src={images.stethoscope_img} alt="stethoscope" style={{ width: "30px", height: "30px", objectFit: "contain" }} />
                </div>
                <div className="div_card">
                  <p>Doctor Support and Monitoring</p>
                  <div style={{}} className="product-price">
                    <span
                      style={{ marginRight: "10px" }}
                      className="original-price"
                    >
                      $99
                    </span>
                    <span className="discounted-price">free</span>
                  </div>
                </div>
              </div>

              <div className="item">
                <div
                  style={{
                    padding: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "70px",
                    
                    border: "1px solid var(--clr-border)",
                    borderRadius: "5px",
                  }}
                  className="icon-box-c"
                >
                  <img src={images.van_img} alt="shipping" style={{ width: "30px", height: "30px", objectFit: "contain" }} />
                </div>
                <div className="div_card">
                  <p>Overnight Shipping </p>
                  <div style={{}} className="product-price">
                    <span
                      style={{ marginRight: "10px" }}
                      className="original-price"
                    >
                      $40
                    </span>
                    <span className="discounted-price">free</span>
                  </div>
                </div>
              </div>

              {appliedDiscount && (
                <div className="savings-banner">
                  <MdOutlineCelebration size={25} />
                  <span>
                    You saved ${getCouponSavings().toFixed(2)} on your order.
                  </span>
                </div>
              )}
              <div
                className="your-total-div"
                style={{
                  borderRadius: "5px",
                  border: isExpanded ? "1px solid var(--clr-border)" : "",
                }}
              >
                <div
                  style={{
                    borderRadius: "5px",
                    border: isExpanded ? "" : "1px solid var(--clr-border)",
                  }}
                  className={`total-section ${isExpanded ? "expanded" : ""}`}
                  onClick={handleExpandClick}
                >
                  <div className="total-details">
                    <CiStar
                      size={25}
                      color="var(--clr-main)"
                      className="star_icon"
                    />
                    <span style={{ color: "var(--clr-main)" }}>
                      {totalText}{" "}
                      {getproductPrice != null && !isNaN(getproductPrice) ? (
                        isDiscountApplied ? (
                          <>
                            <span
                              style={{
                                marginRight: "10px",
                                textDecoration: "line-through",
                                color: "red",
                              }}
                            >
                              ${parseFloat(getproductPrice).toFixed(2)}
                            </span>
                            <span>${getDiscountedTotal()}</span>
                          </>
                        ) : (
                          `$${parseFloat(getproductPrice).toFixed(2)}`
                        )
                      ) : (
                        ""
                      )}
                    </span>
                    <div className="expand-button">
                      <span>
                        {isExpanded ? <FaAngleUp /> : <FaAngleDown />}
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ margin: "10px" }} className="expanded-content">
                    {/* Add your expanded content here */}
                    <div
                      style={{
                        
                        marginBottom: "20px",
                      }}
                    />
                    {appliedDiscount && (
                      <div className="div_card" style={{ width: "100%" }}>
                        <p
                          style={{
                            fontWeight: "600",
                            color: "var(--clr-text)",
                          }}
                        >
                          Your Coupon Savings
                        </p>
                        <div style={{}} className="product-price">
                          <span
                            style={{ marginRight: "10px", color: "#4caf50" }}
                            className="originsal-price"
                          >
                            ${getCouponSavings().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "10px",
                      }}
                    >
                      <p style={{ color: "var(--clr-text)", fontSize: "15px" }}>
                        Subtotal
                      </p>
                      <div style={{}} className="product-price">
                        <span
                          style={{
                            marginRight: "10px",
                            color: "var(--clr-text)",
                            fontSize: "15px",
                          }}
                          className="originsal-price"
                        >
                          {getproductPrice != null && !isNaN(getproductPrice) ? (
                            isDiscountApplied ? (
                              <>
                                <span
                                  className="original-price"
                                  style={{ marginRight: "10px" }}
                                >
                                  ${parseFloat(getproductPrice).toFixed(2)}
                                </span>
                                <span
                                  className="discounted-price"
                                  style={{ color: "var(--clr-main)" }}
                                >
                                  ${getDiscountedTotal()}
                                </span>
                              </>
                            ) : (
                              `$${parseFloat(getproductPrice).toFixed(2)}`
                            )
                          ) : (
                            ""
                          )}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "10px",
                      }}
                    >
                      <p style={{ color: "var(--clr-text)", fontSize: "15px" }}>
                        Estimated Tax
                      </p>
                      <div style={{}} className="product-price">
                        <span
                          style={{
                            marginRight: "10px",
                            color: "var(--clr-text)",
                            fontSize: "15px",
                          }}
                          className="originsal-price"
                        >
                          ---
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "10px",
                      }}
                    >
                      <p style={{ color: "var(--clr-text)", fontSize: "15px" }}>
                        Shipping
                      </p>
                      <div style={{}} className="product-price">
                        <span
                          style={{
                            marginRight: "10px",
                            color: "var(--clr-text)",
                            fontSize: "15px",
                          }}
                          className="originsal-price"
                        >
                          $0
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        borderTop: "0.5px solid var(--clr-border)",
                        marginTop: "10px",
                        marginBottom: "10px",
                        // width: "90%",
                      }}
                    />
                    <div
                      className="div_card total_p"
                      style={{ width: "100%", alignItems: "center" }}
                    >
                      <p
                        style={{
                          fontWeight: "600",
                          fontSize: "15px",
                          color: "var(--clr-text)",
                        }}
                      >
                        Total
                      </p>
                      <div style={{}} className="product-price">
                        <span
                          style={{
                            marginRight: "10px",
                            color: "var(--clr-text)",
                            fontWeight: "600",
                            fontSize: "15px",
                          }}
                          className="originsal-price"
                        >
                          {getproductPrice != null && !isNaN(getproductPrice) ? (
                            isDiscountApplied ? (
                              <>
                                <span
                                  className="original-price"
                                  style={{ marginRight: "10px" }}
                                >
                                  ${parseFloat(getproductPrice).toFixed(2)}
                                </span>
                                <span
                                  className="discounted-price"
                                  style={{ color: "var(--clr-main)" }}
                                >
                                  ${getDiscountedTotal()}
                                </span>
                              </>
                            ) : (
                              `$${parseFloat(getproductPrice).toFixed(2)}`
                            )
                          ) : (
                            ""
                          )}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: "20px",
                        borderRadius: "5px",
                        border: "1px solid var(--clr-main)",
                        padding: "20px",
                        backgroundColor: "rgba(99, 243, 255, 0.1)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "10px",
                          lineHeight: "22px",
                          color: "var(--clr-text)",
                        }}
                      >
                        {/* checkout details footer - product-specific supply & pricing */}
                        {(() => {
                          const product = getproducts[0] || getdata || {};
                          const months = getMonthsFromProductName(product?.product_name);
                          const isMultiMonth = months > 1;
                          const totalCost = parseFloat(product?.product_price ?? getproductPrice);
                          const monthlyCost =
                            !isNaN(totalCost) && months > 0
                              ? totalCost / months
                              : null;

                          if (isMultiMonth && !isNaN(totalCost)) {
                            const totalStr = `$${Number(totalCost).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            const monthlyStr =
                              monthlyCost != null
                                ? `$${Number(monthlyCost).toFixed(2)}`
                                : "";
                            return (
                              <>
                                By clicking the "Checkout Now" button above, your card will be billed {totalStr} today to reserve your {months}-month supply of your medication ({monthlyStr}/month). After you complete the order by clicking the secure "Checkout Now" button above, your information will be securely saved. You will then be asked to complete a short medical history intake and verify your identity. A totarahealth medical professional will review your information, and, if appropriate, prescribe your medication. If you are not eligible for your medication for ANY reason, you will receive a full refund of your purchase price. You have selected the {months}-month package, which includes a {months}-month supply. Your package includes your medication and detailed instructions on how to properly administer the medication. Your total cost is {totalStr} ({monthlyStr}/month). It includes your medication, unlimited doctor support, and prescription covered. If at any time you decide not to continue, simply contact us <a href="mailto:rxsupport@totara.health"> rxsupport@totara.health</a>. You will not be billed further. While you are a member, you will have access to chat with your doctor or customer support for any needed assistance.
                              </>
                            );
                          }

                          const discountedPrice = isDiscountApplied
                            ? `$${getDiscountedTotal()}`
                            : `$${parseFloat(getproductPrice || 0).toFixed(2)}`;

                          const recurringPriceDisplay =
                            "$" +
                            Number(product?.product_price ?? getproductPrice ?? 0).toFixed(2);

                          return (
                            <>
                              By clicking the "Checkout Now" button above, your card will be billed the discounted price of {discountedPrice} today to reserve your 1 month supply of your medication. After you complete the order by clicking the secure "Checkout Now" button above, your information will be securely saved. You will then be asked to complete a short medical history intake and verify your identity. A totarahealth medical professional will review your information, and, if appropriate, prescribe your medication. If you are not eligible for your medication for ANY reason, you will receive a full refund of your purchase price. You have selected the monthly package, which includes a 1 month starter kit. The starter kit includes your medication and detailed instructions on how to properly administer the medication. Each month, you will need to update your prescribing doctor on your progress and they will have the ability to adjust your dosage as needed. Your new billing will continue at {recurringPriceDisplay} per month after the first 28 days. It will include your medication, unlimited doctor support, and prescription covered. If at any time you decide not to continue, simply contact us rxsupport@totara.health. You will not be billed further. While you are a member, you will have access to chat with your doctor or customer support for any needed assistance.
                            </>
                          );
                        })()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {getskipModel && (
          <div className="skip_modal_main_wrapp">
            <div className="skip_white_part_wrapp">
              <p className="f-16 fw-500" style={{ marginBottom: "10px" }}>
                Thank you for your order
              </p>
              {/* {getdata.is_intake === "0" ?  <p className="f-16 fw-500 mb-2">
               You are now being redirected to the Medical Intake form to complete process
              </p> :
           } */}{" "}
              <p className="f-16 fw-500 mb-2">
                You are now being redirected to your Member Portal
              </p>
              <div>
                <button
                  className="btn"
                  style={{ width: "100px" }}
                  onClick={() => {
                    // SkipNextMonth();
                    setSkipModel(false);
                    window.location.assign(memberPortalUrl);
                  }}
                >
                  OK
                </button>
                {/* <p className="f-14 fw-400">Redirecting in {countdown} seconds...</p> */}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Checkout2;
