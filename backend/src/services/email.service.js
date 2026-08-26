/**
 * Email service powered by Brevo (formerly Sendinblue).
 * Uses the Brevo transactional email HTTP API — no extra npm packages needed.
 */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Send a transactional email via Brevo.
 * @param {object} options
 * @param {string} options.to       - Recipient email
 * @param {string} options.subject  - Email subject
 * @param {string} options.html     - HTML body
 * @param {string} [options.toName] - Recipient name (optional)
 */
async function sendEmail({ to, subject, html, toName }) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SENDER_EMAIL || "aceprepx@gmail.com";
    const senderName = process.env.SENDER_NAME || "AcePrep";

    if (!apiKey) {
        throw new Error("BREVO_API_KEY is not configured in .env");
    }

    const payload = {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to, ...(toName && { name: toName }) }],
        subject,
        htmlContent: html,
    };

    const response = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: {
            "accept": "application/json",
            "api-key": apiKey,
            "content-type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
    }

    return response.json();
}

const escapeHtml = (str) => {
    if (!str || typeof str !== "string") return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

/**
 * Send OTP verification email during signup.
 */
export const sendOtpEmail = async (toEmail, otp, name = "there") => {
    const safeName = escapeHtml(name);
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0; padding:0; background-color:#0a0f1a; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1a; padding:40px 20px;">
            <tr>
                <td align="center">
                    <table width="480" cellpadding="0" cellspacing="0" style="background:linear-gradient(145deg,#111827,#0d1420); border-radius:16px; border:1px solid rgba(0,255,180,0.15); overflow:hidden;">
                        <tr>
                            <td style="padding:32px 32px 16px; text-align:center;">
                                <div style="display:inline-block; background:linear-gradient(135deg,#00ffb4,#00d4aa); border-radius:12px; padding:10px 14px; margin-bottom:16px;">
                                    <span style="font-size:24px; font-weight:700; color:#0a0f1a;">AcePrep</span>
                                </div>
                                <h1 style="margin:12px 0 0; font-size:22px; font-weight:600; color:#e2e8f0;">Verify your email</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:8px 32px 24px;">
                                <p style="color:#94a3b8; font-size:15px; line-height:1.6; margin:0 0 24px;">
                                    Hey <strong style="color:#e2e8f0;">${safeName}</strong>,<br/>
                                    Use the code below to complete your AcePrep registration. It expires in <strong style="color:#00ffb4;">10 minutes</strong>.
                                </p>
                                <div style="text-align:center; margin:0 0 24px;">
                                    <div style="display:inline-block; background:rgba(0,255,180,0.06); border:2px dashed rgba(0,255,180,0.3); border-radius:12px; padding:18px 40px; letter-spacing:12px;">
                                        <span style="font-size:36px; font-weight:700; color:#00ffb4; font-family:'Courier New',monospace;">${otp}</span>
                                    </div>
                                </div>
                                <p style="color:#64748b; font-size:13px; line-height:1.5; margin:0;">
                                    If you didn't sign up for AcePrep, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:16px 32px 24px; border-top:1px solid rgba(255,255,255,0.06); text-align:center;">
                                <p style="color:#475569; font-size:12px; margin:0;">
                                    &copy; ${new Date().getFullYear()} AcePrep &mdash; AI-Powered Interview Preparation
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    await sendEmail({
        to: toEmail,
        toName: name,
        subject: `${otp} — Your AcePrep Verification Code`,
        html: htmlContent,
    });
};

/**
 * Send password-reset email with a clickable link.
 */
export const sendResetPasswordEmail = async (toEmail, resetLink) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0; padding:0; background-color:#0a0f1a; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1a; padding:40px 20px;">
            <tr>
                <td align="center">
                    <table width="480" cellpadding="0" cellspacing="0" style="background:linear-gradient(145deg,#111827,#0d1420); border-radius:16px; border:1px solid rgba(0,255,180,0.15); overflow:hidden;">
                        <tr>
                            <td style="padding:32px 32px 16px; text-align:center;">
                                <div style="display:inline-block; background:linear-gradient(135deg,#00ffb4,#00d4aa); border-radius:12px; padding:10px 14px; margin-bottom:16px;">
                                    <span style="font-size:24px; font-weight:700; color:#0a0f1a;">AcePrep</span>
                                </div>
                                <h1 style="margin:12px 0 0; font-size:22px; font-weight:600; color:#e2e8f0;">Reset your password</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:8px 32px 24px;">
                                <p style="color:#94a3b8; font-size:15px; line-height:1.6; margin:0 0 24px;">
                                    We received a request to reset your password. Click the button below to choose a new password. This link expires in <strong style="color:#00ffb4;">15 minutes</strong>.
                                </p>
                                <div style="text-align:center; margin:0 0 24px;">
                                    <a href="${resetLink}" style="display:inline-block; background:linear-gradient(135deg,#00ffb4,#00d4aa); color:#0a0f1a; font-size:16px; font-weight:700; text-decoration:none; padding:14px 36px; border-radius:10px;">
                                        Reset Password
                                    </a>
                                </div>
                                <p style="color:#64748b; font-size:13px; line-height:1.5; margin:0 0 16px;">
                                    If the button doesn't work, copy and paste this link into your browser:
                                </p>
                                <p style="color:#00ffb4; font-size:13px; word-break:break-all; margin:0;">
                                    ${resetLink}
                                </p>
                                <p style="color:#64748b; font-size:13px; line-height:1.5; margin:16px 0 0;">
                                    If you didn't request a password reset, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:16px 32px 24px; border-top:1px solid rgba(255,255,255,0.06); text-align:center;">
                                <p style="color:#475569; font-size:12px; margin:0;">
                                    &copy; ${new Date().getFullYear()} AcePrep &mdash; AI-Powered Interview Preparation
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    await sendEmail({
        to: toEmail,
        subject: "Reset Your AcePrep Password",
        html: htmlContent,
    });
};
