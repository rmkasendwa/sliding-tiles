import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  async sendPasswordReset({
    email,
    expiresInMinutes,
    name,
    resetLink,
  }: {
    email: string;
    expiresInMinutes: number;
    name: string;
    resetLink: string;
  }) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from =
      process.env.RESEND_FROM_EMAIL?.trim() ||
      'Sliding Tiles <onboarding@resend.dev>';

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Password reset email could not be sent right now.',
      );
    }

    try {
      const resend = this.createClient(apiKey);
      const { error } = await resend.emails.send({
        from,
        html: this.buildPasswordResetHtml({
          expiresInMinutes,
          name,
          resetLink,
        }),
        subject: 'Reset your Sliding Tiles password',
        text: this.buildPasswordResetText({
          expiresInMinutes,
          name,
          resetLink,
        }),
        to: [email],
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('[email] Resend could not send password reset email.', error);
      throw new ServiceUnavailableException(
        'Password reset email could not be sent right now.',
      );
    }
  }

  async sendEmailVerification({
    email,
    name,
    verificationLink,
  }: {
    email: string;
    name: string;
    verificationLink: string;
  }) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from =
      process.env.RESEND_FROM_EMAIL?.trim() ||
      'Sliding Tiles <onboarding@resend.dev>';

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Verification email could not be sent right now. Please try again shortly.',
      );
    }

    try {
      const resend = this.createClient(apiKey);
      const { error } = await resend.emails.send({
        from,
        html: this.buildVerificationHtml({ name, verificationLink }),
        subject: 'Verify your Sliding Tiles email address',
        text: this.buildVerificationText({ name, verificationLink }),
        to: [email],
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('[email] Resend could not send verification email.', error);
      throw new ServiceUnavailableException(
        'Verification email could not be sent right now. Please try again shortly.',
      );
    }
  }

  private buildPasswordResetHtml({
    expiresInMinutes,
    name,
    resetLink,
  }: {
    expiresInMinutes: number;
    name: string;
    resetLink: string;
  }) {
    const safeName = this.escapeHtml(name);
    const safeLink = this.escapeHtml(resetLink);

    return `
      <div style="background:#f4f7f2;padding:32px 16px;font-family:Arial,sans-serif;color:#173126">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dce7df;border-radius:16px;padding:32px">
          <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#327a4d">SLIDING TILES</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2">Reset your password</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6">Hi ${safeName}, we received a request to reset your Sliding Tiles password.</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.6">Use the secure link below to choose a new password.</p>
          <a href="${safeLink}" style="display:inline-block;background:#327a4d;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:9px">Reset password</a>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#5f7468">This link expires in ${expiresInMinutes} minutes. If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      </div>
    `.trim();
  }

  private buildPasswordResetText({
    expiresInMinutes,
    name,
    resetLink,
  }: {
    expiresInMinutes: number;
    name: string;
    resetLink: string;
  }) {
    return [
      `Hi ${name},`,
      '',
      'We received a request to reset your Sliding Tiles password.',
      'Use this secure link to choose a new password:',
      resetLink,
      '',
      `This link expires in ${expiresInMinutes} minutes. If you did not request a password reset, you can safely ignore this email.`,
    ].join('\n');
  }

  private buildVerificationHtml({
    name,
    verificationLink,
  }: {
    name: string;
    verificationLink: string;
  }) {
    const safeName = this.escapeHtml(name);
    const safeLink = this.escapeHtml(verificationLink);

    return `
      <div style="background:#f4f7f2;padding:32px 16px;font-family:Arial,sans-serif;color:#173126">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dce7df;border-radius:16px;padding:32px">
          <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#327a4d">SLIDING TILES</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2">Verify your email address</h1>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.6">Hi ${safeName}, confirm this email address to help keep your Sliding Tiles account secure.</p>
          <a href="${safeLink}" style="display:inline-block;background:#327a4d;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:9px">Verify email address</a>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#5f7468">This link expires in 24 hours. If you did not create a Sliding Tiles account, you can ignore this email.</p>
        </div>
      </div>
    `.trim();
  }

  private buildVerificationText({
    name,
    verificationLink,
  }: {
    name: string;
    verificationLink: string;
  }) {
    return [
      `Hi ${name},`,
      '',
      'Verify your email address to help keep your Sliding Tiles account secure:',
      verificationLink,
      '',
      'This link expires in 24 hours. If you did not create a Sliding Tiles account, you can ignore this email.',
    ].join('\n');
  }

  private escapeHtml(value: string) {
    return value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
        })[character]!,
    );
  }

  private createClient(apiKey: string) {
    return new Resend(apiKey);
  }
}
