const nodemailer = require("nodemailer");

const sendEmail = async ({
  email,
  subject,
  message,
  html,
}) => {
  const transporter =
    nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(
        process.env.EMAIL_PORT
      ),
      secure:
        process.env.EMAIL_SECURE === "true",

      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

  await transporter.sendMail({
    from: `"Inventory Management System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject, 
    text: message,
    html,
  });
};

module.exports = sendEmail;