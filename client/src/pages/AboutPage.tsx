
import { useLocale } from '../context/LocaleContext';

export function AboutPage() {
  const { locale } = useLocale();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'حول' : 'About Sura Codex'}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-sura-navy/80">{locale === 'ar' ? 'سرد قصة المنصة، مهمتها، وفريقها الملتزم بالقراءة العميقة.' : 'Discover the platform story, mission, and team behind the quiet literary space.'}</p>
      </header>
      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
          <h2 className="text-3xl font-semibold">{locale === 'ar' ? 'الرؤية' : 'Our vision'}</h2>
          <p className="mt-4 text-sm leading-7 text-sura-navy/80">{locale === 'ar' ? 'خلق مساحة للنشر الهادف والقراءة المترفة في العالم العربي والإنجليزي.' : 'A refined destination for writers and readers to meet in calm, focused spaces.'}</p>
        </article>
        <article className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
          <h2 className="text-3xl font-semibold">{locale === 'ar' ? 'المهمة' : 'Our mission'}</h2>
          <p className="mt-4 text-sm leading-7 text-sura-navy/80">{locale === 'ar' ? 'دعم المحتوى الأدبي والتقني والدراسات بواجهة بسيطة ومتناغمة.' : 'To support editorial work, digital culture, and knowledge through elegant design.'}</p>
        </article>
      </section>
      <section className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {(Array.isArray(['Craft', 'Quiet', 'Detail']) ? ['Craft', 'Quiet', 'Detail'] : []).map((word) => (
            <div key={word} className="rounded-3xl bg-sura-canvas p-6">
              <h3 className="text-2xl font-semibold">{word}</h3>
              <p className="mt-3 text-sm leading-7 text-sura-navy/80">{locale === 'ar' ? 'تفاصيل دقيقة وسرد ممتع لكل رحلة قراءة.' : 'A calm, intentional experience with every interaction.'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
