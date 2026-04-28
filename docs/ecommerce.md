# Ecommerce Convention

This file covers checkout, payment methods, orders, payments, shipments, and entitlement workflows.

## Scope

- `src/app/(guest)/checkout/*`
- `src/app/api/customer/checkout/route.ts`
- `src/app/admin/(protected)/(ecommerce)/*`
- `src/app/admin/(protected)/(system)/config/ecommerce/page.tsx`
- `src/app/admin/(protected)/(system)/config/payment-methods/*`
- `src/features/ecommerce/*`
- `src/lib/payment-methods.ts`
- `src/lib/system-settings.ts`

## Payment method settings

- `Admin > Cấu hình > Payment Methods` is the source of truth for checkout payment methods.
- The admin payment method UI should present three primary groups inspired by WooCommerce gateway settings:
  - `manual`: bank transfer, VietQR, or any method that requires staff reconciliation.
  - `offline`: cash, COD, studio handoff, or payment that happens outside an online processor.
  - `gateway`: third-party online providers such as Stripe, PayPal, MoMo, VNPAY, ZaloPay, or OnePay.
- Each group can contain multiple gateways/providers. The overview should show quick view and edit actions, while editing happens on a dedicated child page so the ecommerce settings hub stays clear.
- Payment methods are stored in `app_settings.commerce_config.paymentMethods` so admins can enable, disable, rename, describe, and order methods without a schema migration.
- Each payment method must have:
  - `code`: stable internal identifier, for example `bank_transfer`, `cod`, `stripe_card`, `paypal`, `momo`, or `vnpay`.
  - `label`: customer-facing name.
  - `description`: short checkout copy.
  - `instructions`: post-selection or post-order guidance.
  - `category`: one of `manual`, `offline`, or `gateway`.
  - `provider`: integration owner, for example `manual_bank_transfer`, `cash`, `stripe`, `paypal`, `momo`, or `vnpay`.
  - `type`: one of `manual`, `offline`, `redirect`, `embedded`, or `mock`.
  - `requiresShipping`: `true`, `false`, or `null` to restrict method visibility by order type.
- Method-specific payment instructions and account/QR details belong on the payment method itself, not in global checkout settings.
- `Admin > Cấu hình > Ecommerce` should stay limited to checkout availability, currency formatting, and shipping calculation.
- Payment method `code` values should not be renamed after real orders exist. Disable the old method and add a new method when changing an integration identity.
- Payment methods can be deleted only before they are used by `commerce_payments`. Once used by an order/payment history, disable the method instead of deleting it.
- Admin forms should stay structured. Do not require normal admin users to edit raw JSON for payment methods.

## Checkout workflow

1. Customer wishlist is synced into `shopping_cart_items`.
2. Checkout loads customer profile, cart items, and ecommerce settings.
3. Checkout loads the user's address book and defaults to the user's default address when a physical order requires shipping.
4. Checkout determines whether the cart requires shipping from product fulfillment type.
5. Checkout filters enabled payment methods by `requiresShipping`.
6. Customer submits contact, either a saved `addressId` or one-off shipping data, selected payment method, and notes.
7. The API re-loads ecommerce settings and validates that the selected method is still enabled.
8. For physical orders, the API resolves `addressId` by user ownership or validates the one-off shipping fields before creating the order snapshot.
9. `createOrderFromCart` creates:
   - `commerce_orders`
   - `commerce_order_items`
   - one initial `commerce_payments` row with the configured method and provider
   - `commerce_shipments` when physical fulfillment requires shipping
10. Inventory is decremented inside the transaction.
11. Cart rows are cleared after successful order creation.
12. Digital invitation entitlements are granted only when payment status becomes `paid`.
13. Affiliate conversion is created or updated after the order is paid.

## Payment state rules

- `manual` methods, such as bank transfer, create an order with `payment_status = unpaid` and payment row `status = pending`.
- `offline` methods, such as cash/COD, create an order with `payment_status = pending` and payment row `status = pending`.
- `mock` methods may create `paid` orders when `autoApproveMockPayments` is enabled.
- `redirect` and `embedded` methods create unpaid/pending records first, then the gateway adapter must update them after callback or webhook confirmation.
- Admin payment updates and gateway webhooks must both converge through the same order/payment state semantics:
  - successful payment sets payment row `paid`, order `payment_status = paid`, and grants entitlements.
  - failed payment sets payment row `failed` and should leave fulfillment blocked.
  - refund sets payment row/order payment status to `refunded` and should revoke or review entitlements.
- Fulfillment must not start automatically for unpaid, failed, or pending external payments.

## Gateway integration workflow

For a real gateway such as Stripe, PayPal, MoMo, or VNPAY:

1. Add or enable a payment method in admin with stable `code`, gateway `provider`, and `type`.
2. Add provider-specific credentials in a dedicated secure settings area or environment variables. Do not store secrets in customer-visible method instructions.
3. At checkout, create the local order first with pending payment state.
4. Create the provider session/order/payment intent using local `order.id` or `order.orderNumber` in provider metadata.
5. Redirect or render the provider UI depending on `type`.
6. Handle provider callback for customer navigation, but do not trust it as the only settlement signal.
7. Handle provider webhook/server notification as the source of truth for paid/failed/refunded state.
8. Make webhook processing idempotent by checking local payment `external_ref`, current status, and provider event IDs before updating.
9. Update `commerce_payments`, then sync `commerce_orders`, entitlements, affiliate conversion, and fulfillment eligibility.
10. Surface reconciliation data in admin payments: method, provider, status, external ref, amount, and timestamps.

### VNPAY setup

- Add a payment method under `Cổng thanh toán trực tuyến` with:
  - `code`: `vnpay`
  - `provider`: `vnpay`
  - `type`: `Chuyển khách sang cổng thanh toán`
- Store secrets in environment variables, not in admin payment method fields:
  - `VNPAY_TMN_CODE`
  - `VNPAY_HASH_SECRET`
  - `VNPAY_PAYMENT_URL`, optional; defaults to sandbox `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
  - `NEXT_PUBLIC_SITE_URL` or `SITE_URL`, required for VNPAY to call back to the correct public domain
- Configure VNPAY merchant URLs:
  - Return URL: `/api/payments/vnpay/return`
  - IPN URL: `/api/payments/vnpay/ipn`
- The checkout flow creates the local order first, redirects to VNPAY, then updates the payment from VNPAY Return/IPN callbacks after validating `vnp_SecureHash`.

## Admin operations

- `Admin > Orders` owns order state, fulfillment state, and vendor assignment.
- `Admin > Payments` owns payment status correction and external reference reconciliation.
- `Admin > Cấu hình > Ecommerce` owns checkout availability, currency, and shipping settings.
- `Admin > Cấu hình > Payment Methods` owns payment method availability, provider/type settings, instructions, and method-specific account/QR details.
- Manual bank transfer requires staff reconciliation before marking payment as paid.
- COD/cash can stay `pending` until handoff or delivery is confirmed.
- External gateways should be updated by webhooks first; admin edits are fallback corrections.

## External references used for this workflow

- WooCommerce separates global payment method enable/disable, ordering, title, description, and per-gateway setup screens.
- WooCommerce gateway types include redirect/form, iframe/embedded, direct, and offline methods.
- Stripe Checkout recommends creating a checkout session, redirecting or embedding checkout, and fulfilling orders through webhooks.
- PayPal Orders API requires buyer approval before capture, and PayPal recommends checkout webhooks for approval, pending, and reversal states.
