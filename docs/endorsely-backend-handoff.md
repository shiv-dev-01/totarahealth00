# Endorsely + GLP-1 commission handoff (WhiteLabelMD)

This checkout **does not** call Endorsely. After a paid order, the Totara/WhiteLabelMD backend must post the conversion **once**.

Checkout now sends these extra fields on:

- `POST /totara/api/createOrder_test`
- `POST /totara/api/createOrder_stripe`
- `POST /totara/api/stripe/create-payment-intent` (also copied into Stripe `metadata`)

## Fields from checkout

| Field | When | Meaning |
|---|---|---|
| `referralId` | If the Endorsely script set a cookie | Affiliate click id (`window.endorsely_referral`) |
| `commissionType` | Always when products are known | `fixed` (all GLP-1), `endorsely_default` (no GLP-1), or `mixed` |
| `commissionAmount` | `fixed` or `mixed` | USD dollars to pay (sum of GLP-1 lines) |
| `commissionCurrency` | Always | `usd` |
| `productFamily` | Always | `semaglutide` \| `tirzepatide` \| `other` \| `mixed` |
| `planMonths` | Always | `1` \| `3` \| `6` \| `12` (primary line) |
| `sku` | If known | Catalog SKU, else `product_id` |
| `productName` | Always | Product title(s) |
| `orderValue` | Always | Amount the customer **paid** (after coupon) |
| `commissionLines` | Always | Per-line breakdown (JSON on `createOrder_test`) |
| `sku[]` | `createOrder_test` | One SKU per product row |

### Fixed GLP-1 table (already calculated on the frontend)

**Semaglutide** (name contains `sema`): 1 mo **$50**, 3 mo **$100**, 6 mo **$200**, 12 mo **$300**.

**Tirzepatide** (name contains `tirz` or `trizep`): 1 mo **$55**, 3 mo **$105**, 6 mo **$230**, 12 mo **$330**.

These amounts are **flat** even if a coupon changes `orderValue`.

**Any other product:** `commissionType=endorsely_default`. Do **not** use `commissionAmount`. Post the **paid total** so the existing Endorsely campaign rate applies.

## When to post

Call Endorsely only if:

1. Payment succeeded, and
2. `referralId` is present, and
3. This `order_id` has **not** been posted before.

Endorsely **adds** amounts when the same `referralId` is sent again. Store `endorsely_posted_at` (or conversion id) on the order.

## Endpoint

```http
POST https://app.endorsely.com/api/public/refer
Authorization: Bearer <ENDORSELY_API_SECRET>
Content-Type: application/json
```

Documented body: `referralId`, `organizationId`, `email`, `amount` (cents), `name`, `customerId`.

Organization id used by this checkout script: `eeb3eb48-cb52-47f4-b34b-00294d5ba747`.

### 1. Fixed / mixed GLP-1

```json
{
  "referralId": "<referralId from order>",
  "organizationId": "eeb3eb48-cb52-47f4-b34b-00294d5ba747",
  "email": "customer@example.com",
  "amount": 10000,
  "customerId": "<order_id>",
  "name": "Jane Doe | Semaglutide 3 Month"
}
```

`amount` is **commission dollars × 100** (`commissionAmount * 100`). Example: $100 commission → `10000`.

For `mixed` carts, still post `commissionAmount * 100` for the GLP-1 portion. If you also need campaign-% on the other lines, post a **second** conversion only if Endorsely support confirms that is safe; otherwise keep one post (GLP-1 fixed $) and document the non-GLP-1 remainder internally.

### 2. Other products (`endorsely_default`)

```json
{
  "referralId": "<referralId from order>",
  "organizationId": "eeb3eb48-cb52-47f4-b34b-00294d5ba747",
  "email": "customer@example.com",
  "amount": 24900,
  "customerId": "<order_id>",
  "name": "Jane Doe | Other Product"
}
```

`amount` is **paid total in cents** (`orderValue * 100`). Endorsely applies the **existing** campaign percent/flat rate.

## Campaign setup (required)

The public API has **no** SKU or custom-rate field. Commission in the dashboard is `f(amount, campaign)`.

If one campaign is **10% of `amount`**:

- Posting `$50` for 1-month Semaglutide pays **$5**, not $50.

**Use `commissionType` to choose `amount`:**

| `commissionType` | Send as `amount` (cents) | Campaign that should apply |
|---|---|---|
| `fixed` / `mixed` | `commissionAmount * 100` | A **100%** campaign so $50 posted → $50 commission **or** post `commission / campaignPercent` (10% and $50 commission → post $500). Sale value in Endorsely will not match product price. |
| `endorsely_default` | `orderValue * 100` | The **current** % / flat campaign |

Stripe metadata on the PaymentIntent uses `referralId`, not `endorsely_referral`. Map `referralId` → Endorsely. Do not rely on Stripe auto-tracking until metadata is `endorsely_referral`.

## Dashboard (Endorsely)

After a successful post, the client will see:

- Affiliate / referral
- Commission **dollar amount**
- Customer email / `name`
- Conversion status

They will **not** get native columns for SKU, duration, or product price. Put those in `name`, e.g. `Jane Doe | Semaglutide 3 Month | SKU xyz`.

## Refunds and cancels

The public refer API has **no** refund field. Reverse or void the conversion in Endorsely admin (or via whatever refund API Endorsely provides to you). Do not POST `/refer` again for a refund (that would **increase** commission).

## Recurring rebills

Out of scope for this checkout. If Sticky/Stripe rebills later, the backend must post again with a **new** idempotency key (e.g. `order_id-rebill-N`).

## Idempotency checklist

- Key: WhiteLabelMD `order_id` (and payment intent id as backup)
- Skip if already posted
- Never post from the React app
- Never put the Endorsely API secret in the frontend
