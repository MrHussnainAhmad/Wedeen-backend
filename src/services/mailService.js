import nodemailer from 'nodemailer';

let transporter = null;

function getMailConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    from
  };
}

function getTransporter() {
  if (transporter) return transporter;
  const cfg = getMailConfig();
  if (!cfg) return null;
  transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.auth
  });
  return transporter;
}

export async function sendEmail({ to, subject, text }) {
  const cfg = getMailConfig();
  const tx = getTransporter();
  if (!cfg || !tx) {
    console.log(`[mail disabled] to=${to} subject="${subject}"`);
    return;
  }

  await tx.sendMail({
    from: cfg.from,
    to,
    subject,
    text
  });
}

