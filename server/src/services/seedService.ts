
import { prisma } from './prisma.js';
import bcrypt from 'bcryptjs';

export async function initializeSeed() {
  const existing = await prisma.user.findFirst();
  if (existing) return;
  const adminPassword = await bcrypt.hash('Admin@2025!', 12);
  const readerPassword = await bcrypt.hash('Reader@2025!', 12);
  const writerPassword = await bcrypt.hash('Writer@2025!', 12);
  const admin = await prisma.user.create({ data: { name: 'مدير سورا كودكس', email: 'admin@suracodex.com', password: adminPassword, role: 'admin', locale: 'ar', theme: 'dark', verified: true } });
  const member = await prisma.user.create({ data: { name: 'قارئ مجرب', email: 'reader@suracodex.com', password: readerPassword, role: 'member', locale: 'ar', theme: 'dark', verified: true } });
  const writer = await prisma.user.create({ data: { name: 'كاتب مجرب', email: 'writer@suracodex.com', password: writerPassword, role: 'writer', locale: 'ar', theme: 'dark', verified: true } });
  await prisma.article.createMany({ data: [
    { title: 'لأن القراءة فن', slug: 'reading-as-art', excerpt: 'رحلة نصية في لغة الكتابة وتأنق الحروف.', content: 'يحتوي المقال على رؤية جديدة حول محور القراءة.', category: 'Literature', language: 'ar', readingTime: '6 min', authorName: 'مدير سورا', views: 1400, claps: 45, featured: true },
    { title: 'Quiet design for digital publishing', slug: 'quiet-design', excerpt: 'How pause and reduction power readable experiences.', content: 'A thoughtful essay about editorial design and calm interfaces.', category: 'Design', language: 'en', readingTime: '8 min', authorName: 'Sarah Ali', views: 980, claps: 72, featured: true },
    { title: 'Arabic typography in practice', slug: 'arabic-typography', excerpt: 'Modern calligraphy and readability across screens.', content: 'Text about Arabic fonts, rhythm and digital culture.', category: 'Culture', language: 'ar', readingTime: '7 min', authorName: 'نورا جميل', views: 860, claps: 33, featured: false }
  ]});
  const novel1 = await prisma.novel.create({ data: { title: 'ظل الحبر', slug: 'ink-shadow', description: 'A reflective Arabic novella with literary depth.', coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80', authorName: 'ليلى حسين' } });
  const novel2 = await prisma.novel.create({ data: { title: 'Midnight Pages', slug: 'midnight-pages', description: 'A small novel for quiet nights of reading.', coverImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', authorName: 'Amina Parker' } });
  await prisma.chapter.createMany({ data: [
    { novelId: novel1.id, title: 'Chapter One: Opening', number: 1, content: 'An opening chapter that invites the reader into a nocturnal room.', readingTime: '9 min' },
    { novelId: novel1.id, title: 'Chapter Two: Echoes', number: 2, content: 'The companion walks through memory and ink.', readingTime: '8 min' },
    { novelId: novel1.id, title: 'Chapter Three: Light', number: 3, content: 'A quiet ending with a lamp and a page.', readingTime: '7 min' },
    { novelId: novel2.id, title: 'Chapter One: The Street', number: 1, content: 'A midnight city scene unfolds under warm light.', readingTime: '10 min' },
    { novelId: novel2.id, title: 'Chapter Two: The Letter', number: 2, content: 'A letter appears and rearranges the night.', readingTime: '9 min' },
    { novelId: novel2.id, title: 'Chapter Three: The Promise', number: 3, content: 'The reader watches the promise of morning.', readingTime: '8 min' }
  ]});
  await prisma.book.createMany({ data: [
    { title: 'The Quiet Novel', author: 'Amina Parker', price: 14.99, format: 'Digital', summary: 'A reflective new book for calm evenings.', coverImage: 'https://images.unsplash.com/photo-1496104679561-38d0d1b6a73b?auto=format&fit=crop&w=900&q=80', stock: 12 },
    { title: 'Calligraphy Stories', author: 'نورا جميل', price: 19.99, format: 'Print', summary: 'A hardcover collection of short essays and poems.', coverImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80', stock: 7 }
  ]});
  await prisma.product.createMany({ data: [
    { title: 'Editorial Template Pack', description: 'Templates for articles, reading lists, and portfolios.', price: 29.99, license: 'Personal', type: 'Template', downloadUrl: 'https://example.com/download/editorial-pack.zip' },
    { title: 'Sura Codex eBook', description: 'A digital handbook for focused publishing.', price: 12.99, license: 'Commercial', type: 'eBook', downloadUrl: 'https://example.com/download/sura-codex-ebook.pdf' }
  ]});
  await prisma.galleryImage.createMany({ data: [
    { title: 'Quiet Desk', category: 'Workspace', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80' },
    { title: 'Library Light', category: 'Interior', imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=80' },
    { title: 'Ink and Paper', category: 'Objects', imageUrl: 'https://images.unsplash.com/photo-1517705008121-5f34fdfbc380?auto=format&fit=crop&w=900&q=80' }
  ]});
  await prisma.techArticle.createMany({ data: [
    { title: 'Building calm UIs', slug: 'calm-uis', series: 'Design Systems', tags: 'UX,Accessibility', excerpt: 'A short guide for thoughtful interface design.', code: 'console.log("Design for quiet focus");' },
    { title: 'Structured content APIs', slug: 'content-apis', series: 'Developer Notes', tags: 'API,Prisma', excerpt: 'How to model editorial data for web applications.', code: 'const articles = await prisma.article.findMany();' }
  ]});
  await prisma.message.createMany({ data: [
    { author: 'admin@suracodex.com', text: 'Welcome to Sura Codex chat.', createdAt: new Date() },
    { author: 'reader@suracodex.com', text: 'I love the night reading experience.', createdAt: new Date() }
  ]});
}
