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

// Hex fallbacks for the site's oklch brand palette (see ../DESIGN.md) —
// email clients don't support oklch(), and rarely load the site's actual
// webfonts, so this also falls back to the same Georgia/system-ui stack
// used in app/globals.css.
const BRAND = {
  ivory: "#F7F5F1",
  ink: "#2A2724",
  sageDeep: "#3F5A4A",
  dustyBlueDeep: "#35435A",
};

export function renderBrandedEmail({
  heading,
  bodyHtml,
  detailLines,
}: {
  heading: string;
  bodyHtml: string;
  detailLines?: string[];
}) {
  const details = detailLines?.length
    ? `<div style="margin:24px 0;padding:20px 24px;border:1px solid ${BRAND.sageDeep}40;">
        ${detailLines
          .map(
            (line) =>
              `<p style="margin:0 0 6px;font-size:14px;color:${BRAND.ink};">${line}</p>`
          )
          .join("")}
      </div>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BRAND.ivory};font-family:'Quicksand',Arial,sans-serif;color:${BRAND.ink};">
    <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:28px;margin:0 0 20px;color:${BRAND.ink};">${heading}</h1>
      <div style="font-size:15px;line-height:1.6;">${bodyHtml}</div>
      ${details}
      <hr style="border:none;border-top:1px solid ${BRAND.sageDeep}40;margin:32px 0;" />
      <p style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.sageDeep};margin:0;">
        Fable &amp; Frame Studios
      </p>
    </div>
  </body>
</html>`;
}

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}
