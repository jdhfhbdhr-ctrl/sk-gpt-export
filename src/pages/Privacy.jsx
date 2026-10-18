import React from 'react';
import LegalLayout from '@/components/LegalLayout';

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Notice" lastUpdated="October 1, 2026">
      <p>
        This Privacy Notice explains how SK GPT collects, uses, and protects your information
        when you use our AI-powered chat, writing, brainstorming, coding assistance, and
        productivity features (the "Service"). By using the Service, you consent to the
        practices described here.
      </p>

      <h2>1. Information We Collect</h2>
      <p>
        <strong>Account information:</strong> When you register, we collect your email address
        and any name you provide. This is needed to create and manage your account.
      </p>
      <p>
        <strong>Conversations and content:</strong> We collect the messages, prompts, and files
        you submit so we can provide responses, maintain your conversation history, and improve
        the Service.
      </p>
      <p>
        <strong>Uploaded files:</strong> Files you upload (such as PDFs or images) are stored and
        processed to generate responses. File storage is private; access follows your app
        permissions.
      </p>
      <p>
        <strong>Usage data:</strong> We collect technical and usage information such as device
        type, app interactions, and feature usage, to operate, secure, and improve the Service.
      </p>
      <p>
        <strong>Payment information:</strong> Subscription payments are handled by Paddle, our
        payment provider. SK GPT does not receive or store your full card or payment details;
        Paddle processes this securely. Paddle may collect billing information as needed to
        manage your subscription.
      </p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide, operate, and maintain the Service, including generating AI responses.</li>
        <li>To create and manage your account and subscription.</li>
        <li>To communicate with you about your account, updates, and support.</li>
        <li>To monitor and improve the quality, safety, and performance of the Service.</li>
        <li>To comply with legal obligations and enforce our Terms.</li>
      </ul>

      <h2>3. AI Processing &amp; Third Parties</h2>
      <p>
        To generate responses, your messages and any relevant file content may be sent to
        third-party AI model providers. These providers process the data on our behalf to return
        AI output. We share only what is necessary to provide the Service.
      </p>

      <h2>4. Data Retention</h2>
      <p>
        We retain your conversations and account information for as long as your account is
        active, and afterward as needed to meet legal, accounting, or reporting obligations. You
        can request deletion of your conversations, and you can close your account at any time.
        Some temporary conversations may be deleted automatically based on their type.
      </p>

      <h2>5. Sharing of Information</h2>
      <p>We may share your information with:</p>
      <ul>
        <li>AI model providers that help generate responses.</li>
        <li>Paddle, our payment provider, to process subscription payments.</li>
        <li>Hosting and infrastructure providers that operate the Service.</li>
        <li>Authorities or third parties where required by law or to protect our rights and safety.</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>6. Security</h2>
      <p>
        We use reasonable technical and organizational measures to protect your information.
        However, no system is perfectly secure, and we cannot guarantee absolute security of
        data transmitted or stored as part of the Service.
      </p>

      <h2>7. Your Privacy Rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct, export, or delete
        your personal information, or to object to or restrict certain processing. To exercise
        these rights, contact us through the support options in the SK GPT app or via the email
        associated with your account.
      </p>

      <h2>8. Children's Privacy</h2>
      <p>
        The Service is not intended for children under 13 (or the minimum age in your country).
        We do not knowingly collect personal information from children. If you believe a child
        has provided us information, contact us and we will delete it.
      </p>

      <h2>9. International Transfers</h2>
      <p>
        Your information may be processed in countries other than your own that have different
        data protection laws. We take steps to ensure appropriate safeguards are in place when
        transferring your information internationally.
      </p>

      <h2>10. Changes to This Notice</h2>
      <p>
        We may update this Privacy Notice from time to time. Material changes will be posted
        here and, where appropriate, communicated to you. Continued use after changes take effect
        means you accept the updated notice.
      </p>

      <h2>11. Contact</h2>
      <p>
        If you have questions about this Privacy Notice or your data, contact us through the
        support options available in the SK GPT app or via the email associated with your
        account.
      </p>
    </LegalLayout>
  );
}