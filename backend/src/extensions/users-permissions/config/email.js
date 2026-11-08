// /src/extensions/users-permissions/config/email.js
module.exports = ({ env }) => ({
    email_confirmation: {
      subject: 'Confirm your Faneqo account',
      // Text version of the email
      text: (data) => `
  Hi ${data.user.username || data.user.email},

  Welcome to Faneqo! Please confirm your email address by clicking the link below:
  https://qrserver-production.up.railway.app/api/auth/confirm-email?token=${data.confirmationToken}

  Thank you,
  The Faneqo Team
      `,
      // HTML version of the email
      html: (data) => `
        <div style="font-family:ui-sans-serif,system-ui,Arial;line-height:1.5;">
          <h2>Welcome to Faneqo!</h2>
          <p>Hi ${data.user.username || data.user.email},</p>
          <p>Please confirm your email address to activate your account:</p>
          <p>
            <a href="https://qrserver-production.up.railway.app/api/auth/confirm-email?token=${data.confirmationToken}"
               style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;">
              Confirm Email
            </a>
          </p>
          <p style="margin-top:16px;color:#6b7280;font-size:13px;">
            Or paste this link into your browser:<br>
            https://qrserver-production.up.railway.app/api/auth/confirm-email?token=${data.confirmationToken}
          </p>
          <p>Thank you,<br>The Faneqo Team</p>
        </div>
      `,
    },
  });