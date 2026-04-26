import nodemailer, { type Transporter } from "nodemailer";

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

let transporter: Transporter | null = null;

const getSmtpConfig = (): SmtpConfig | null => {
  const host = process.env.SMTP_HOST;
  const portValue = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM;

  if (!host || !portValue || !user || !pass || !from) {
    return null;
  }

  const port = Number(portValue);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("SMTP_PORT must be a valid positive integer");
  }

  return { host, port, user, pass, from };
};

const getTransporter = (config: SmtpConfig): Transporter => {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    requireTLS: config.port === 587,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return transporter;
};

const sendEmail = async (message: EmailMessage): Promise<boolean> => {
  const smtpConfig = getSmtpConfig();

  if (!smtpConfig) {
    return false;
  }

  const smtpTransporter = getTransporter(smtpConfig);

  try {
    await smtpTransporter.sendMail({
      from: smtpConfig.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};

export const sendPasswordResetEmail = async (email: string, resetLink: string): Promise<void> => {
  const wasSent = await sendEmail({
    to: email,
    subject: "Reset your PLYO password",
    text: `You requested a password reset for your PLYO account.\n\nReset your password here: ${resetLink}\n\nIf you did not request this, you can ignore this email.`,
    html: `
      <p>You requested a password reset for your PLYO account.</p>
      <p><a href="${resetLink}">Reset your password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });

  if (!wasSent) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[PASSWORD RESET] ${email}: ${resetLink}`);
    } else {
      console.error(`Failed to send password reset email to ${email}`);
    }
  }
};
