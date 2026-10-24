import { useEffect, useMemo, useRef, useState } from "react";
import {
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { buildReturnUrl } from "../utils/stripeCheckoutSession";

function buildConfirmParams(billingDefaults) {
  const address = {
    country: "US",
    ...(billingDefaults?.addressLine1
      ? { line1: billingDefaults.addressLine1 }
      : {}),
    ...(billingDefaults?.addressLine2
      ? { line2: billingDefaults.addressLine2 }
      : {}),
    ...(billingDefaults?.city ? { city: billingDefaults.city } : {}),
    ...(billingDefaults?.state ? { state: billingDefaults.state } : {}),
    ...(billingDefaults?.postalCode
      ? { postal_code: billingDefaults.postalCode }
      : {}),
  };

  return {
    return_url: buildReturnUrl(),
    payment_method_data: {
      billing_details: {
        ...(billingDefaults?.email ? { email: billingDefaults.email } : {}),
        ...(billingDefaults?.name ? { name: billingDefaults.name } : {}),
        ...(billingDefaults?.phone ? { phone: billingDefaults.phone } : {}),
        address,
      },
    },
  };
}

/**
 * Stripe payment form — card, Klarna, Affirm, Amazon Pay + express wallets.
 */
const StripeCheckoutForm = ({
  amountInCents,
  billingDefaults,
  onValidateBilling,
  onPersistCheckoutSnapshot,
  onPaymentSuccess,
  onExpressPaymentSuccess,
  disabled,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [expressAvailable, setExpressAvailable] = useState(false);
  const errorRef = useRef(null);

  const paymentElementOptions = useMemo(() => {
    const address = {
      country: "US",
      ...(billingDefaults?.addressLine1
        ? { line1: billingDefaults.addressLine1 }
        : {}),
      ...(billingDefaults?.addressLine2
        ? { line2: billingDefaults.addressLine2 }
        : {}),
      ...(billingDefaults?.city ? { city: billingDefaults.city } : {}),
      ...(billingDefaults?.state ? { state: billingDefaults.state } : {}),
      ...(billingDefaults?.postalCode
        ? { postal_code: billingDefaults.postalCode }
        : {}),
    };

    return {
      layout: {
        type: "accordion",
        defaultCollapsed: false,
        radios: true,
        spacedAccordionItems: true,
      },
      wallets: {
        applePay: "never",
        googlePay: "never",
      },
      paymentMethodOrder: ["card", "klarna", "affirm", "amazon_pay"],
      defaultValues: {
        billingDetails: {
          ...(billingDefaults?.email ? { email: billingDefaults.email } : {}),
          ...(billingDefaults?.name ? { name: billingDefaults.name } : {}),
          ...(billingDefaults?.phone ? { phone: billingDefaults.phone } : {}),
          address,
        },
      },
      fields: {
        billingDetails: {
          address: {
            country: "never",
          },
        },
      },
    };
  }, [billingDefaults]);

  useEffect(() => {
    if (errorMessage && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [errorMessage]);

  const handleExpressConfirm = async () => {
    if (!stripe || !elements || disabled) return;

    setErrorMessage(null);
    onPersistCheckoutSnapshot?.();

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: buildConfirmParams(billingDefaults),
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message || "Express payment failed.");
      return;
    }

    if (paymentIntent?.status === "succeeded" && onExpressPaymentSuccess) {
      await onExpressPaymentSuccess(
        paymentIntent.id,
        paymentIntent.client_secret
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || disabled) return;

    const billingOk = onValidateBilling?.();
    if (billingOk === false) return;

    setIsProcessing(true);
    setErrorMessage(null);

    onPersistCheckoutSnapshot?.();

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(
          submitError.message || "Please check your payment details."
        );
        setIsProcessing(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: buildConfirmParams(billingDefaults),
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Payment failed. Please try again.");
        setIsProcessing(false);
        return;
      }

      if (!paymentIntent?.id || paymentIntent.status !== "succeeded") {
        setErrorMessage(
          paymentIntent?.status
            ? `Payment status: ${paymentIntent.status}. Please try again.`
            : "Payment confirmation failed."
        );
        setIsProcessing(false);
        return;
      }

      await onPaymentSuccess(paymentIntent.id, paymentIntent.client_secret);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const displayAmount =
    amountInCents > 0 ? (amountInCents / 100).toFixed(2) : "0.00";

  return (
    <form onSubmit={handleSubmit} className="stripe-checkout-form">
      <ExpressCheckoutElement
        onConfirm={handleExpressConfirm}
        onClick={(event) => event.resolve()}
        onReady={({ availablePaymentMethods }) => {
          setExpressAvailable(
            !!availablePaymentMethods &&
              Object.values(availablePaymentMethods).some(Boolean)
          );
        }}
        options={{
          paymentMethods: {
            applePay: "always",
            googlePay: "always",
            amazonPay: "auto",
            link: "never",
            paypal: "never",
          },
          buttonType: {
            applePay: "plain",
            googlePay: "plain",
          },
          buttonTheme: {
            applePay: "black",
            googlePay: "black",
          },
        }}
      />

      {expressAvailable && (
        <div
          className="stripe-express-divider"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.25rem 0",
            margin: "0.75rem 0",
          }}
        >
          <div
            style={{ flexGrow: 1, height: "1px", backgroundColor: "#e5e7eb" }}
          />
          <span
            style={{
              fontSize: "0.75rem",
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            or pay with card / BNPL
          </span>
          <div
            style={{ flexGrow: 1, height: "1px", backgroundColor: "#e5e7eb" }}
          />
        </div>
      )}

      <PaymentElement
        key={JSON.stringify(billingDefaults ?? {})}
        options={paymentElementOptions}
      />

      {errorMessage && (
        <div ref={errorRef} className="stripe-checkout-error">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        className="btn-checkout stripe-checkout-submit apply-button"
        disabled={!stripe || isProcessing || disabled}
        style={{ width: "100%", marginTop: "16px" }}
      >
        {isProcessing
          ? "Processing..."
          : `COMPLETE CHECKOUT — $${displayAmount}`}
      </button>
    </form>
  );
};

export default StripeCheckoutForm;
