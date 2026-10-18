import React from 'react';
import LegalLayout from '@/components/LegalLayout';

export default function RefundPolicy() {
  return (
    <LegalLayout title="Refund Policy" lastUpdated="October 1, 2026">
      <p>
        This Refund Policy explains the terms for refunds of SK GPT paid subscriptions. SK GPT
        provides AI-powered chat, writing, brainstorming, coding assistance, and productivity
        features. Subscription payments are processed by Paddle, our payment provider, and are
        available on monthly and yearly billing cycles.
      </p>

      <h2>1. Free Trial</h2>
      <p>
        Where offered, paid plans include a 7-day free trial. You will not be charged during the
        trial. To avoid being charged, cancel before the trial ends. If you cancel during the
        trial, no charge will occur.
      </p>

      <h2>2. When Refunds May Be Available</h2>
      <p>We may issue a refund in the following situations:</p>
      <ul>
        <li>You were charged in error, such as a duplicate charge or a charge after a cancellation request.</li>
        <li>You request a refund within 14 days of the initial charge of a new subscription, and the Service has not been significantly used (as determined by reasonable usage of AI features) beyond the trial.</li>
        <li>Required by applicable consumer law in your country of residence.</li>
      </ul>

      <h2>3. When Refunds Are Not Available</h2>
      <p>Refunds are generally not provided when:</p>
      <ul>
        <li>The subscription has been used significantly after the trial period ended.</li>
        <li>The request is made after the 14-day window described above, except where consumer law requires otherwise.</li>
        <li>The charge is for a renewal that took place after you had access to the Service for the full prior billing period.</li>
        <li>The account was terminated due to a breach of our Terms of Service.</li>
      </ul>
      <p>
        Your legal rights as a consumer are not affected by this policy. If consumer law in your
        country gives you rights that cannot be excluded, those rights apply regardless of this
        policy.
      </p>

      <h2>4. Cancellation vs. Refund</h2>
      <p>
        Cancelling a subscription stops future automatic renewals; it does not automatically
        refund the current paid period. You will continue to have access to the Service until
        the end of the period you have paid for.
      </p>

      <h2>5. How to Request a Refund</h2>
      <p>
        To request a refund, contact us through the support options available in the SK GPT app
        or via the email associated with your account. Please include your account email and the
        transaction details (such as the invoice number from Paddle) so we can review your
        request.
      </p>
      <p>
        Refund requests are reviewed individually. Approved refunds are typically processed by
        Paddle back to the original payment method within a reasonable time, which may depend on
        your bank or payment provider.
      </p>

      <h2>6. Chargebacks</h2>
      <p>
        If you believe a charge is incorrect, please contact us first so we can help resolve it
        quickly. Initiating a chargeback without contacting us may delay resolution and could
        affect your account.
      </p>

      <h2>7. Changes to This Policy</h2>
      <p>
        We may update this Refund Policy from time to time. Any changes will be posted here and,
        where appropriate, communicated to you. Changes do not affect refund rights that applied
        at the time of your original purchase.
      </p>

      <h2>8. Contact</h2>
      <p>
        For refund questions, contact us through the support options available in the SK GPT
        app or via the email associated with your account.
      </p>
    </LegalLayout>
  );
}