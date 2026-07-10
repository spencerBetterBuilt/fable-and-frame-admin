import nodemailer from "nodemailer";

const globalForEmail = globalThis as unknown as { emailTransporter?: nodemailer.Transporter };

function createTransporter() {
  const user = process.env.EMAIL_FROM;
  const pass = process.env.EMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("EMAIL_FROM/EMAIL_APP_PASSWORD environment variables are not set");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

const transporter = globalForEmail.emailTransporter ?? createTransporter();

if (process.env.NODE_ENV !== "production") {
  globalForEmail.emailTransporter = transporter;
}

export async function sendEmail(to: string, subject: string, text: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
  });
}
