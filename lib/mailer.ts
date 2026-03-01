import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "mail.donatalk.com",
  port: 465,
  secure: true,
  auth: {
    user: "support@donatalk.com",
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const FROM_EMAIL = "support@donatalk.com";
export const BCC_EMAIL = "atxapplellc@gmail.com";
