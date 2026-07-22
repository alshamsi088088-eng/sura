
import { useLocale } from '../context/LocaleContext';
import { useSeoTags } from '../hooks/useSeoTags';

export function AboutPage() {
  const { locale } = useLocale();

  useSeoTags({
    title: locale === 'ar' ? 'من نحن | سُرى' : 'About | Sura Codex',
    description: locale === 'ar'
      ? 'تعرّف على Sura Codex: منصة ثنائية اللغة للكتب والبرمجة والذكاء الاصطناعي واللغات والتكنولوجيا—بهدف التعلم والمعرفة والكتابة المدروسة.'
      : 'Learn about Sura Codex: a bilingual platform for books, programming, AI, languages, technology, and learning—built for thoughtful writing and better discovery.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/about`,
    locale,
    // TODO: Add a dedicated 1200×630 Open Graph image (e.g., /og-about.png)
    //       When available, pass it via openGraph={{ image: { url: '...', alt: '...' } }}
    //       and twitter={{ image: { url: '...', alt: '...' } }}
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: locale === 'ar' ? 'من نحن | سُرى' : 'About | Sura Codex',
        description: locale === 'ar'
          ? 'تعرّف على Sura Codex: منصة لنشر الكتب والمقالات التقنية.'
          : 'Learn about Sura Codex: a platform for books, programming, and thoughtful writing.',
        url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/about`,
        inLanguage: locale === 'ar' ? 'ar' : 'en',
        mainEntity: {
          '@type': 'Organization',
          name: 'Sura Codex',
          url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/about`,
        },
      },
    ],
  });

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'حول سُرى كودكس' : 'About Sura Codex'}</h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-sura-navy/80">
          {locale === 'ar'
            ? 'سُرى كودكس مساحة هادئة للقراءة والاكتشاف والنشر المدروس—حيث تتقاطع الكتابة بالكود. جمعتُ هنا بين محتوى الأدب والمعرفة التقنية حتى تكون الرحلة أكثر وضوحًا، وأكثر فائدة، وأكثر إنسانية.'
            : 'Sura Codex is a quiet place for reading, discovery, and thoughtful publishing—where writing meets code. I built this space to bring literature and technical knowledge together in a way that feels natural, focused, and genuinely useful.'}
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
          <h2 className="text-3xl font-semibold">{locale === 'ar' ? 'رؤيتنا' : 'Our vision'}</h2>
          <p className="mt-4 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'أن تكون Sura Codex وجهة موثوقة للقراء والكتّاب في العالم العربي والإنجليزي—مساحة تسمح بالتعمّق بدلًا من الاستعجال.'
              : 'To be a trusted destination for readers and writers across Arabic and English—an environment that supports depth instead of speed.'}
          </p>
        </article>

        <article className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
          <h2 className="text-3xl font-semibold">{locale === 'ar' ? 'مهمتنا' : 'Our mission'}</h2>
          <p className="mt-4 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'نساعد على نشر محتوى أدبي وتقني ودراسات بواجهة بسيطة، وتصميم يركز على القراءة، وتنظيم يجعل المعرفة قابلة للاستكشاف.'
              : 'To support editorial work, digital culture, and learning through a clean reading-first design and a structure that makes knowledge easy to explore.'}
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-3xl bg-sura-canvas p-6">
            <h3 className="text-2xl font-semibold">{locale === 'ar' ? 'التحرير بعناية' : 'Craft'}</h3>
            <p className="mt-3 text-sm leading-7 text-sura-navy/80">
              {locale === 'ar'
                ? 'نؤمن بأن الجودة تُبنى بالتدقيق: محتوى واضح، أسلوب محترم، وتنظيم يساعد على الفهم.'
                : 'We believe quality is built through care: clear writing, thoughtful structure, and respect for the reader.'}
            </p>
          </div>

          <div className="rounded-3xl bg-sura-canvas p-6">
            <h3 className="text-2xl font-semibold">{locale === 'ar' ? 'هدوء القراءة' : 'Quiet'}</h3>
            <p className="mt-3 text-sm leading-7 text-sura-navy/80">
              {locale === 'ar'
                ? 'واجهة هادئة تقلل التشتت وتمنح النص مساحة للتنفس—حتى تظل التجربة مركّزة.'
                : 'A calm interface reduces distraction and gives your attention to the text—so the experience stays focused.'}
            </p>
          </div>

          <div className="rounded-3xl bg-sura-canvas p-6">
            <h3 className="text-2xl font-semibold">{locale === 'ar' ? 'تفاصيل مفيدة' : 'Detail'}</h3>
            <p className="mt-3 text-sm leading-7 text-sura-navy/80">
              {locale === 'ar'
                ? 'من الكتب إلى البرمجة والذكاء الاصطناعي واللغات، نعرض المعرفة بطريقة عملية وقابلة للمتابعة.'
                : 'From books and programming to AI, languages, and technology—Sura Codex organizes knowledge in a practical, followable way.'}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-2xl font-semibold">{locale === 'ar' ? 'ما الذي تغطيه Sura Codex؟' : 'What we cover'}</h3>
            <p className="mt-2 text-sm leading-7 text-sura-navy/80">
              {locale === 'ar'
                ? 'نركّز على مجموعة واسعة من الاهتمامات: الكتب، البرمجة، الذكاء الاصطناعي، اللغات، التكنولوجيا، والتعلّم—بنَفَسٍ واحد: فهمٌ أعمق.'
                : 'We cover books, programming, AI, languages, technology, and learning—with one shared goal: deeper understanding.'}
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold">{locale === 'ar' ? 'كيف نعمل؟' : 'How we work'}</h3>
            <p className="mt-2 text-sm leading-7 text-sura-navy/80">
              {locale === 'ar'
                ? 'نضع القراءة في المركز، ونشجع النقاش المسؤول، ونتعامل مع المحتوى على أنه معرفة تحتاج إلى سياق وترتيب—وليس مجرد صفحات.'
                : 'We place reading at the center, encourage responsible discussion, and treat content as knowledge that deserves context and structure—not just pages.'}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}


