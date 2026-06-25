import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const isEthereal = () =>
  (process.env['SMTP_HOST'] || '').includes('ethereal');

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env['SMTP_HOST'] || 'smtp.ethereal.email',
    port:   parseInt(process.env['SMTP_PORT'] || '587'),
    secure: false,
    auth: {
      user: process.env['SMTP_USER'],
      pass: process.env['SMTP_PASS'],
    },
  });
}

export const sendPasswordResetEmail = async (
  toEmail: string,
  userName: string,
  resetToken: string
): Promise<string | null> => {
  const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:5173';
  const resetLink   = `${frontendUrl}/reset-password?token=${resetToken}`;

  const transporter = createTransporter();

  const info = await transporter.sendMail({
    from:    process.env['SMTP_FROM'] || '"PrintHub3D" <noreply@printhub3d.com>',
    to:      toEmail,
    subject: 'Redefinição de senha — PrintHub3D',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="background:#111;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;max-width:560px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,rgba(0,212,255,0.15),rgba(147,51,234,0.15));padding:32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08)">
            <h1 style="margin:0;font-size:24px;font-weight:900;color:#fff">
              Print<span style="background:linear-gradient(90deg,#00d4ff,#9333ea);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Hub3D</span>
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 32px">
            <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">
              Olá, ${userName}!
            </h2>
            <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 24px">
              Recebemos uma solicitação para redefinir a senha da sua conta
              associada ao e-mail <strong style="color:#fff">${toEmail}</strong>.
            </p>
            <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 28px">
              Clique no botão abaixo para criar uma nova senha. Este link expira em
              <strong style="color:#fbbf24">1 hora</strong>.
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px">
              <tr>
                <td style="border-radius:12px;background:linear-gradient(135deg,#00d4ff,#9333ea)">
                  <a href="${resetLink}"
                    style="display:inline-block;padding:14px 36px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.3px">
                    Redefinir minha senha
                  </a>
                </td>
              </tr>
            </table>

            <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 8px">
              Se você não solicitou a redefinição de senha, ignore este e-mail.
              Sua senha permanece inalterada.
            </p>
            <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0">
              Ou copie e cole este link no navegador:<br>
              <a href="${resetLink}" style="color:#00d4ff;word-break:break-all">${resetLink}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
            <p style="color:#4b5563;font-size:12px;margin:0">
              © ${new Date().getFullYear()} PrintHub3D · Campo Mourão, PR
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  });

  // Retorna URL de preview quando usar Ethereal
  if (isEthereal()) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info({ previewUrl }, 'E-mail enviado (Ethereal preview)');
      return previewUrl as string;
    }
  } else {
    logger.info({ toEmail }, 'E-mail enviado');
  }
  return null;
};
