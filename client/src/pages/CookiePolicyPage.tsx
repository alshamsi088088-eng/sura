import { useLocale } from '../context/LocaleContext';
import { usePageMetadata } from '../hooks/usePageMetadata';

export function CookiePolicyPage() {
  const { locale } = useLocale();

  usePageMetadata(
    locale === 'ar' ? 'سياسة ملفات تعريف الارتباط | Sura Codex' : 'Cookie Policy | Sura Codex',
    locale === 'ar'
      ? 'نوضح كيفية استخدام ملفات تعريف الارتباط في Sura Codex، بما في ذلك ملفات التحليلات والإعلانات وطرق موافقتك والتحكم فيها.'
      : 'Learn how Sura Codex uses cookies, including analytics and advertising cookies, and how you can manage your consent and browser settings.',
    typeof window !== 'undefined' ? window.location.href : undefined,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 rounded-3xl border border-sura-line bg-sura-canvas p-8">
      <header>
        <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'سياسة ملفات تعريف الارتباط' : 'Cookie Policy'}</h1>
        <p className="mt-3 text-sm leading-7 text-sura-navy/80">
          {locale === 'ar'
            ? 'تشرح سياسة ملفات تعريف الارتباط هذه كيف نستخدم ملفات تعريف الارتباط (Cookies) وتقنيات مشابهة لتحسين تجربتك على Sura Codex، وتحليل الأداء، وتقديم محتوى وإعلانات ذات صلة (عندما ينطبق ذلك).'
            : 'This Cookie Policy explains how we use cookies and similar technologies to improve your experience on Sura Codex, analyze performance, and deliver relevant content and advertising (where applicable).'}
        </p>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'ما هي ملفات تعريف الارتباط؟' : 'What are cookies?'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'ملفات تعريف الارتباط هي ملفات صغيرة يتم حفظها على جهازك عند زيارتك للمواقع. تساعدنا على تذكّر تفضيلاتك، وفهم كيفية استخدام الزوار للموقع، وتمكين بعض الميزات. قد تستخدم المواقع أيضًا تقنيات مشابهة مثل التخزين المحلي (عند الحاجة).' 
              : 'Cookies are small files stored on your device when you visit a website. They help us remember your preferences, understand how visitors use the site, and enable certain features. Websites may also use similar technologies such as local storage when needed.'}
          </p>
        </div>


        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'الأنواع التي نستخدمها' : 'Types of cookies we use'}</h2>
          <ul className="mt-2 list-disc pl-5 space-y-2 text-sm leading-7 text-sura-navy/80">
            <li>
              <strong>{locale === 'ar' ? 'ضرورية (ضرورية للتشغيل)' : 'Essential (Strictly necessary)'}</strong>
              :{' '}
              {locale === 'ar'
                ? 'تمكّن هذه الملفات وظائف أساسية مثل التنقل وإدارة الجلسة.'
                : 'These cookies enable core features such as navigation and session management.'}
            </li>
            <li>
              <strong>{locale === 'ar' ? 'التحليلات' : 'Analytics'}</strong>
              :{' '}
              {locale === 'ar'
                ? 'تساعدنا على قياس الأداء وفهم ما ينجح لدى الزوار حتى نُحسّن المحتوى وتجربة الاستخدام.'
                : 'They help us measure performance and understand what works for visitors so we can improve content and usability.'}
            </li>
            <li>
              <strong>{locale === 'ar' ? 'الإعلانات' : 'Advertising'}</strong>
              :{' '}
              {locale === 'ar'
                ? 'عند تفعيل الإعلانات، قد تُستخدم هذه الملفات لعرض محتوى إعلاني أكثر ملاءمة وتحديد التفاعل مع الإعلانات.'
                : 'When ads are enabled, these cookies may be used to show more relevant advertising and understand ad interactions.'}
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'الموافقة والتحكم' : 'Consent & control'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'قد نطلب موافقتك لاستخدام ملفات تعريف الارتباط غير الضرورية. يمكنك ضبط اختيارك في أي وقت عبر إعدادات المتصفح، أو من خلال أدوات الموافقة المتاحة على الموقع (إن وُجدت). عند تعطيل بعض الأنواع، قد تقل دقة التحليلات أو قد تتغير طريقة عرض المحتوى.'
              : 'We may ask for your consent to use non-essential cookies. You can adjust your choices at any time through your browser settings or the consent tools available on the site (if provided). If you disable certain categories, analytics accuracy may decrease and the way content is delivered may change.'}
          </p>
        </div>


        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'إعدادات المتصفح' : 'Browser settings'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'يمكنك عادةً منع ملفات تعريف الارتباط أو حذفها من خلال إعدادات المتصفح. قد يؤثر تعطيل بعض الملفات على عمل ميزات الموقع.'
              : 'You can typically block or delete cookies via your browser settings. Disabling certain cookies may affect how the site functions.'}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'موفّرو الطرف الثالث' : 'Third parties'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'قد يستخدم مقدمو خدمات من أطراف ثالثة (مثل خدمات التحليلات والإعلانات) ملفات تعريف الارتباط وفقًا لسياساتهم الخاصة. في بعض الحالات قد تُحَدَّد ملفات تعريف الارتباط المرتبطة بخدمات Google أو شركائها عندما تكون الإعلانات مفعّلة. تخضع هذه الاستخدامات لسياسات الطرف الثالث.'
              : 'Third-party service providers (such as analytics and advertising partners) may use cookies according to their own policies. In some cases, cookies associated with Google services or its partners may be set when ads are enabled. These practices are governed by the relevant third-party policies.'}
          </p>
        </div>


      </section>

      <section className="rounded-3xl border border-sura-line bg-sura-canvas p-6">
        <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'مدة عمل ملفات تعريف الارتباط' : 'Cookie duration'}</h2>
        <p className="mt-2 text-sm leading-7 text-sura-navy/80">
          {locale === 'ar'
            ? 'بعض ملفات تعريف الارتباط تكون مؤقتة (جلسة) وتختفي عند إغلاق المتصفح، بينما يكون بعضها الآخر دائمًا حسب نوعه والإعدادات وسياسة الطرف الذي وضعه.'
            : 'Some cookies are session-based and are deleted when you close your browser, while others are longer-lasting depending on their type and the third-party provider’s settings.'}
        </p>

        <div className="mt-4">
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'تواصل معنا بخصوص ملفات تعريف الارتباط' : 'Questions about cookies'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'إذا كانت لديك أسئلة حول ملفات تعريف الارتباط أو طريقة معالجتها، يمكنك التواصل معنا عبر صفحة التواصل. سنساعدك قدر الإمكان ضمن حدود المعلومات المتاحة.'
              : 'If you have questions about cookies or how they are handled, you can contact us via the Contact page. We’ll help where possible based on the information available.'}
          </p>
        </div>
      </section>

    </div>
  );
}

