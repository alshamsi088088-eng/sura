
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from './prisma.js';

export function initGoogleStrategy() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  if (!clientId || !clientSecret) return;

  passport.use(new GoogleStrategy({
    clientID: clientId,
    clientSecret,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`
  }, async (_accessToken, _refreshToken, profile, done) => {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('No email')); 
    const name = profile.displayName || 'Google Reader';
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { name, email, role: 'member', locale: 'en', theme: 'dark', verified: true } });
    }
    done(null, { email, name });
  }));
}
