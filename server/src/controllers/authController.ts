export async function AuthCallback(req: Request, res: Response) {
  try {
    const accessToken = req.body.access_token;
    if (!accessToken) return res.status(400).json({ message: 'Missing access_token' });

    const { email, user_metadata } = req.body;
    if (!email) return res.status(400).json({ message: 'Token does not contain an email' });

    // --- هنا التعديل: تحديد الدور بناءً على الإيميل ---
    const myAdminEmail = 'thesuracodex@gmail.com'; // ضعي إيميلك هنا بدقة
    const role = email === myAdminEmail ? 'admin' : 'member';
    // --------------------------------------------------

    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: user_metadata?.full_name || user_metadata?.name || 'Reader',
          email,
          role: role, // استخدام الدور الذي حددناه بالأعلى
          locale: 'en',
          theme: 'dark',
          verified: true,
          avatar: user_metadata?.avatar_url || null
        }
      });
    } else {
      // اختياري: إذا كان المستخدم موجوداً، يمكنك تحديث دوره أيضاً إذا لزم الأمر
      if (user.role !== role) {
        user = await prisma.user.update({
          where: { email },
          data: { role: role }
        });
      }
    }

    if (!user) return res.status(500).json({ message: 'Failed to resolve user after auth' });

    const tokens = createTokenPair(user.id);
    sendAuthCookies(res, tokens);
    res.json({ user: sanitize(user) });
  } catch (error: any) {
    console.error('AuthCallback error', error);
    res.status(500).json({ message: 'Auth processing failed' });
  }
}