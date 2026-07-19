
import { useLocale } from '../context/LocaleContext';
import { usePageMetadata } from '../hooks/usePageMetadata';

export function PrivacyPage() {
  const { locale } = useLocale();

  usePageMetadata(
    locale === 'ar' ? 'سياسة الخصوصية | Sura Codex' : 'Privacy Policy | Sura Codex',
    locale === 'ar'
      ? 'نوضح كيفية جمع واستخدام وحماية بياناتك في Sura Codex، بما في ذلك خدمات Google (Analytics وSearch Console وAdSense) واستخدام ملفات تعريف الارتباط.'
      : 'Learn how we collect, use, and protect your information on Sura Codex, including Google services (Analytics, Search Console, AdSense) and cookie usage.',
    typeof window !== 'undefined' ? window.location.href : undefined,
  );

  return (
    <main className="mx-auto max-w-5xl space-y-6 rounded-3xl border border-sura-line bg-sura-canvas p-8">
      <header>
        <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</h1>

        <p className="mt-3 text-sm leading-7 text-sura-navy/80">
          {locale === 'ar'
            ? 'نلتزم بحماية خصوصيتك. توضّح هذه السياسة كيف نجمع معلوماتك ونستخدمها ونشاركها، بما في ذلك استخدام خدمات Google مثل Google Analytics وGoogle Search Console وGoogle AdSense، وملفات تعريف الارتباط.'
            : 'We are committed to protecting your privacy. This policy explains how we collect, use, and share information, including our use of Google services such as Google Analytics, Google Search Console, and Google AdSense, and our use of cookies.'}
        </p>
      </header>

      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'من هو المسؤول عن البيانات؟' : 'Who is the data controller?'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'تُعد Sura Codex الجهة المسؤولة عن تحديد كيفية استخدام بياناتك داخل الموقع (وفقًا لما هو مذكور في هذه السياسة).'
              : 'Sura Codex is the entity responsible for determining how your information is used on this website (as described in this policy).'}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'ما البيانات التي نجمعها؟' : 'What information do we collect?'}</h2>
          <ul className="mt-2 list-disc pl-5 space-y-2 text-sm leading-7 text-sura-navy/80">
            <li>
              <strong>{locale === 'ar' ? 'المعلومات التي تقدمها لنا' : 'Information you provide'}</strong>
              :{' '}
              {locale === 'ar'
                ? 'مثل بريدك الإلكتروني وبيانات الاتصال التي ترسلها عبر نماذج الموقع.'
                : 'Such as your email address and contact details you provide through forms.'}
            </li>
            <li>
              <strong>{locale === 'ar' ? 'بيانات الاستخدام' : 'Usage data'}</strong>
              :{' '}
              {locale === 'ar'
                ? 'مثل الصفحات التي تزورها، ووقت التصفح، وطرق التفاعل بهدف تحسين التجربة.'
                : 'Pages visited, time on site, and interaction patterns to improve the experience.'}
            </li>
            <li>
              <strong>{locale === 'ar' ? 'بيانات الجهاز والاتصال' : 'Device & connectivity'}</strong>
              :{' '}
              {locale === 'ar'
                ? 'بما في ذلك معلومات تقنية عامة تُسجَّل عند زيارتك للموقع.'
                : 'General technical information recorded when you access the site.'}
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'لماذا نستخدم بياناتك؟' : 'How we use your information'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'نستخدم بياناتك لتقديم خدمات الموقع، وإدارة الحسابات، وتحسين المحتوى وتجربة القراءة، والتواصل معك عندما ترسل رسالة أو طلبًا، بالإضافة إلى ضمان أمن النظام واستقراره.'
              : 'We use your information to provide the website services, manage accounts, improve content and reading experience, communicate with you when you contact us, and help maintain system security and stability.'}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'Google Analytics وGoogle Search Console' : 'Google Analytics & Google Search Console'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'قد نستخدم Google Analytics وGoogle Search Console لفهم أداء الموقع، وتحسين المحتوى، وفهم سلوك الزوار بصورة إحصائية. تُدار هذه البيانات وفقًا لسياسات Google وشروطها.'
              : 'We may use Google Analytics and Google Search Console to understand site performance, improve content, and analyze visitor behavior in an aggregated, statistical way. Data is handled according to Google’s policies and terms.'}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'Google AdSense والإعلانات' : 'Google AdSense & advertising'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'قد نستخدم Google AdSense لعرض الإعلانات. قد تستخدم Google و/أو شركاء إعلانيون ملفات تعريف الارتباط لعرض إعلانات ملائمة وقياس أداءها. راجع سياسة الخصوصية الخاصة بـ Google AdSense للمزيد.'
              : 'We may use Google AdSense to display advertisements. Google and/or advertising partners may use cookies to serve relevant ads and measure performance. Please see Google AdSense’s privacy policy for more details.'}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'الأساس القانوني (GDPR)' : 'Legal basis (GDPR)'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'عند تطبيق اللائحة العامة لحماية البيانات (GDPR)، قد نعتمد على موافقتك أو المصلحة المشروعة أو تنفيذ التزامات تعاقدية/قانونية—حسب نوع البيانات والغرض من معالجتها.'
              : 'Where GDPR applies, we may rely on your consent, legitimate interests, or the performance of contractual/legal obligations—depending on the type of data and the purpose of processing.'}
          </p>
        </div>


        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'الاحتفاظ بالبيانات' : 'Data retention'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'نحتفظ بالبيانات فقط للمدة اللازمة لتحقيق الأغراض المذكورة في هذه السياسة، أو وفقًا لما تفرضه القوانين واللوائح المعمول بها.'
              : 'We keep information only for as long as needed to achieve the purposes described in this policy, or as required by applicable law.'}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'حقوقك' : 'Your rights'}</h2>
          <ul className="mt-2 list-disc pl-5 space-y-2 text-sm leading-7 text-sura-navy/80">
            <li>
              {locale === 'ar' ? 'طلب الوصول إلى بياناتك أو تصحيحها أو حذفها.' : 'Request access, correction, or deletion of your data.'}
            </li>
            <li>
              {locale === 'ar' ? 'الاعتراض على بعض المعالجة أو تقييدها.' : 'Object to or restrict certain processing.'}
            </li>
            <li>
              {locale === 'ar' ? 'سحب الموافقة عند تطبيقها.' : 'Withdraw consent where it applies.'}
            </li>
          </ul>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'لتمارس حقوقك، تواصل معنا عبر صفحة التواصل.'
              : 'To exercise these rights, contact us through the Contact page.'}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'مشاركة البيانات وموفّرو الطرف الثالث' : 'Data sharing & third-party providers'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'قد نتشارك البيانات مع موفّري خدمات من أطراف ثالثة يساعدوننا في تشغيل الموقع وتحليل الأداء وعرض المحتوى والإعلانات (عند توفرها)، وذلك وفقًا لعقود وبمستوى مناسب من الحماية. تظل هذه الجهات مسؤولة عن سياساتها المتعلقة بالبيانات.'
              : 'We may share information with third-party service providers who help us operate the site, analyze performance, and (where applicable) display content or advertisements. These providers act under appropriate agreements and safeguards. They remain responsible for their own data practices.'}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'ملفات تعريف الارتباط وموفّرو الطرف الثالث' : 'Cookies & third-party providers'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'قد نستخدم ملفات تعريف الارتباط لتحسين الأداء والوظائف. كما قد تضع خدمات من أطراف ثالثة ملفات تعريف الارتباط وفقًا لسياساتهم الخاصة. يُرجى مراجعة سياسة ملفات تعريف الارتباط للحصول على تفاصيل إضافية حول الأنواع وآليات الموافقة.'
              : 'We use cookies to improve performance and functionality. Third-party services may also place cookies according to their own policies. Please review our Cookie Policy for details on cookie types and consent mechanisms.'}
          </p>
        </div>


        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'الاحتفاظ بالبيانات عبر الحدود' : 'Cross-border data transfers'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'قد تتم معالجة بعض البيانات في دول أخرى غير بلد إقامتك، بما في ذلك عند استخدام خدمات Google وموفّري الطرف الثالث. سيتم ذلك وفقًا للأنظمة المعمول بها وبمستوى حماية مناسب.'
              : 'Some information may be processed in countries other than where you live, including when using Google services and third-party providers. We handle this in accordance with applicable laws and with appropriate safeguards.'}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'التغييرات على هذه السياسة' : 'Changes to this policy'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'قد نحدّث هذه السياسة من وقت لآخر. سنعرض تاريخ آخر تحديث عندما يكون ذلك مناسبًا، وستصبح التحديثات نافذة فور نشرها على الموقع.'
              : 'We may update this policy from time to time. Where appropriate, we will post the “last updated” date, and updates will become effective when published on this website.'}
          </p>
        </div>
      </section>
    </main>
  );
}


