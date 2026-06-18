
import nodemailer from 'nodemailer';

interface EmailUser {
  name: string;
  email: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT || 587),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

export async function sendWelcomeEmail(user: EmailUser) {
  await sendMail(user.email, 'Welcome to Sura Codex', `Hello ${user.name}, welcome to Sura Codex.`);
}

export async function sendVerificationEmail(user: EmailUser, token: string) {
  await sendMail(user.email, 'Verify your email', `Hello ${user.name}, please verify your email with this link: ${process.env.CLIENT_URL}/verify?token=${token}`);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  await sendMail(email, 'Reset your password', `Use this link to reset your password: ${process.env.CLIENT_URL}/reset/${token}`);
}

export async function sendContactEmail(name: string, email: string, message: string) {
  await sendMail(process.env.CONTACT_EMAIL || process.env.FROM_EMAIL || 'support@suracodex.com', `New contact from ${name}`, `Message from ${name} <${email}>:\n\n${message}`);
}

async function sendMail(to: string, subject: string, text: string) {
  if (!process.env.SMTP_USER) {
    console.log('Email draft saved', { to, subject, text });
    return;
  }
  await transporter.sendMail({ from: process.env.FROM_EMAIL || 'no-reply@suracodex.com', to, subject, text });
}
