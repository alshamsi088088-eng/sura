import { Request, Response, NextFunction } from 'express';
import { sendContactEmail } from '../services/emailService.js';

export async function submitContact(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    await sendContactEmail(name, email, message);
    res.json({ success: true, message: 'Your message has been sent. We will reply shortly.' });
  } catch (error) {
    next(error);
  }
}
