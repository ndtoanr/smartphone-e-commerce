const nodemailer = require('nodemailer');

// Tạo transporter với Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Tạo mã OTP 6 chữ số
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Gửi OTP qua email
const sendOTP = async (email, otp, type = 'register') => {
  const transporter = createTransporter();

  const subjects = {
    register: '🔐 Mã xác thực đăng ký tài khoản - Smartshop',
    forgot: '🔑 Mã xác thực đặt lại mật khẩu - Smartshop'
  };

  const titles = {
    register: 'Xác thực đăng ký tài khoản',
    forgot: 'Đặt lại mật khẩu'
  };

  const descriptions = {
    register: 'Bạn đang đăng ký tài khoản tại <b>Smartshop</b>. Vui lòng sử dụng mã OTP bên dưới để hoàn tất đăng ký.',
    forgot: 'Bạn đã yêu cầu đặt lại mật khẩu tại <b>Smartshop</b>. Vui lòng sử dụng mã OTP bên dưới để xác nhận.'
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
    </head>
    <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #e31e24 0%, #c41017 100%);padding:32px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">
                    🛒 Smartshop
                  </h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:20px;font-weight:600;">
                    ${titles[type]}
                  </h2>
                  <p style="color:#4a4a68;font-size:15px;line-height:1.6;margin:0 0 28px;">
                    ${descriptions[type]}
                  </p>
                  
                  <!-- OTP Box -->
                  <div style="background:linear-gradient(135deg,#fff5f5 0%,#fee2e2 100%);border:2px dashed #e31e24;border-radius:12px;padding:24px;text-align:center;margin:0 0 28px;">
                    <p style="color:#6b7280;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">
                      Mã xác thực của bạn
                    </p>
                    <p style="color:#e31e24;font-size:36px;font-weight:800;margin:0;letter-spacing:8px;font-family:'Courier New',monospace;">
                      ${otp}
                    </p>
                  </div>

                  <div style="background-color:#fef3cd;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;margin:0 0 24px;">
                    <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">
                      ⏰ Mã OTP có hiệu lực trong <b>5 phút</b>. Không chia sẻ mã này với bất kỳ ai.
                    </p>
                  </div>

                  <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:0;">
                    Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;">
                    © 2026 Smartshop. All rights reserved.
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

  const mailOptions = {
    from: `"Smartshop" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subjects[type],
    html: htmlContent
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { generateOTP, sendOTP };
