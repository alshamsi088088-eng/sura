import { useLocale } from '../context/LocaleContext';
import { useSeoTags } from '../hooks/useSeoTags';

export function TermsOfServicePage() {
  const { locale } = useLocale();

  useSeoTags({
    title: locale === 'ar' ? 'شروط الخدمة | سُرى' : 'Terms of Service | Sura Codex',
    description: locale === 'ar'
      ? 'اطّلع على شروط استخدام Sura Codex، بما في ذلك الملكية الفكرية والاستخدام المسموح وتعهدات المستخدم وإخلاء المسؤولية وحدود الالتزام.'
      : 'Review the Sura Codex Terms of Service, including intellectual property, permitted use, user responsibilities, disclaimers, and limitation of liability.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/terms-of-service`,
    locale,
    // TODO: Add a dedicated 1200×630 Open Graph image (e.g., /og-terms-of-service.png)
    //       When available, pass it via openGraph={{ image: { url: '...', alt: '...' } }}
    //       and twitter={{ image: { url: '...', alt: '...' } }}
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: locale === 'ar' ? 'شروط الخدمة | سُرى' : 'Terms of Service | Sura Codex',
        description: locale === 'ar' ? 'شروط خدمة منصة سُرى.' : 'Terms of Service for Sura Codex platform.',
        url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/terms-of-service`,
        inLanguage: locale === 'ar' ? 'ar' : 'en',
      },
    ],
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 rounded-3xl border border-sura-line bg-sura-canvas p-8">
      <header>
        <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}</h1>
        <p className="mt-3 text-sm leading-7 text-sura-navy/80">
          {locale === 'ar'
            ? 'تحدد شروط الخدمة هذه القواعد التي تحكم استخدامك لـ Sura Codex، بما في ذلك حقوقك والتزاماتك وحدود مسؤوليتنا. باستخدامك للموقع، فإنك توافق على هذه الشروط.'
            : 'These Terms of Service govern your use of Sura Codex. By accessing or using the website, you agree to comply with these terms, including your rights and obligations and our limitations.'}
        </p>
      </header>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? '1) الملكية الفكرية' : '1) Intellectual Property'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'ما لم يُنص على خلاف ذلك، تعود حقوق الملكية الفكرية لجميع المواد المنشورة على Sura Codex (بما في ذلك النصوص والمحتوى الأدبي والمواد التقنية والرسومات والصور وبيانات الكود المصدر) إلى Sura Codex و/أو المرخّصين لديها. يمنحك الموقع حق وصول شخصي وغير تجاري لاستخدام محتواه وفقًا لهذه الشروط.'
              : 'Unless otherwise stated, all intellectual property rights in the content and materials on Sura Codex (including literary works, technical articles, source code, images, and other media) belong to Sura Codex and/or its licensors. You are granted a personal, non-commercial right to access and view the content as permitted by these terms.'}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? '2) استخدام الموقع' : '2) Website Usage'}</h2>
          <ul className="mt-2 list-disc pl-5 space-y-2 text-sm leading-7 text-sura-navy/80">
            <li>
              {locale === 'ar'
                ? 'تتعهد باستخدام الموقع بشكل قانوني وعدم إساءة الاستخدام أو التحايل على الأنظمة أو تعطيل الخدمة.'
                : 'You agree to use the website lawfully and not to misuse it, bypass security measures, or disrupt service.'}
            </li>
            <li>
              {locale === 'ar'
                ? 'إذا قمت بنشر محتوى أو تفاعل مع المجتمع، فأنت مسؤول عن دقة ومشروعية ما تساهم به، وعن احترام حقوق الآخرين. يتضمن ذلك حقوق النشر والملكية الفكرية.'
                : 'If you submit content or participate in discussions, you are responsible for the accuracy and legality of what you contribute, and for respecting others’ rights. This includes copyright and intellectual property.'}
            </li>
            <li>
              {locale === 'ar'
                ? 'تحتفظ Sura Codex بالحق في إزالة أو تعديل أي محتوى أو تقييد الوصول إليه إذا تبين وجود سبب معقول للاشتباه في عدم الامتثال، أو مخالفة القوانين، أو انتهاك حقوق الآخرين.'
                : 'Sura Codex may remove or modify content, or restrict access to it, if there is reasonable cause to believe content is non-compliant, illegal, or violates the rights of others.'}
            </li>

            <li>
              {locale === 'ar'
                ? 'قد نراجع المحتوى ونتخذ إجراءً مناسبًا (مثل إزالة المحتوى أو تقييد الوصول) عند وجود سبب معقول للاشتباه في انتهاك هذه الشروط أو إساءة الاستخدام.'
                : 'We may review content and take appropriate action (including removing content or restricting access) when we have reasonable cause to believe these Terms are violated or the service is being misused.'}
            </li>
            <li>
              {locale === 'ar'
                ? 'إذا كان لديك حساب، فأنت مسؤول عن الحفاظ على بيانات الدخول الخاصة بك وعدم مشاركة كلمات المرور. أنت مسؤول عن الأنشطة التي تتم عبر حسابك.'
                : 'If you have an account, you are responsible for keeping your login credentials secure and for not sharing passwords. You are responsible for activities conducted through your account.'}
            </li>
            <li>
              {locale === 'ar'
                ? 'لا يجوز لك إعادة نشر أو نسخ المواد أو توزيعها أو تعديلها لأغراض تجارية دون إذن كتابي.'
                : 'You may not republish, copy, distribute, or create derivative works for commercial purposes without written permission.'}
            </li>
          </ul>
        </div>



        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? '3) الروابط الخارجية' : '3) External Links'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'قد يتضمن الموقع روابط إلى مواقع أو خدمات تابعة لجهات خارجية. نحن لا نتحكم في محتوى هذه الجهات ولا نتحمل مسؤولية دقتها أو سياساتها. يرجى مراجعة شروط الخصوصية واستخدام كل موقع تزوره عبر الروابط.'
              : 'The website may contain links to third-party sites or services. We do not control those sites and are not responsible for their content, accuracy, or policies. Please review the terms and privacy practices of any third-party site you visit.'}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? '4) إخلاء المسؤولية' : '4) Disclaimer'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'يتم توفير الموقع والمحتوى "كما هو" و"كما هو متاح". على الرغم من أننا نعمل على تقديم تجربة دقيقة وموثوقة، فإننا لا نضمن خلو الموقع من الأخطاء أو انقطاع الخدمة أو اكتمال المعلومات. لا يُقصد بالمحتوى تقديم نصيحة مهنية (قانونية أو استشارية أو غيرها)، ويظل استخدامك للمحتوى على مسؤوليتك الخاصة.'
              : 'The website and all content are provided on an "as is" and "as available" basis. While we aim to keep the experience accurate and dependable, we do not guarantee error-free operation, uninterrupted availability, or completeness of the information. The content is not intended as professional advice (legal, financial, or otherwise). Your use of the content is at your own risk.'}
          </p>
        </div>


        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? '5) حدود المسؤولية' : '5) Limitation of Liability'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'لن تكون Sura Codex مسؤولة عن أي أضرار مباشرة أو غير مباشرة أو عرضية أو تبعية ناتجة عن استخدام الموقع أو عدم القدرة على استخدامه، بما في ذلك فقدان الأرباح أو البيانات، إلى الحد الذي يسمح به القانون.'
              : 'To the maximum extent permitted by law, Sura Codex will not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of (or inability to use) the website, including loss of profits or data.'}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? '6) التحديثات المستقبلية' : '6) Future Updates'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'قد نحدّث شروط الخدمة من وقت لآخر. يُنصح بمراجعتها بشكل دوري. سيصبح أي تحديث نافذًا فور نشره على الموقع.'
              : 'We may update these Terms of Service from time to time. You should review them periodically. Any changes will become effective upon posting on this website.'}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">{locale === 'ar' ? '7) إشعارات حقوق النشر' : '7) Copyright notices'}</h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'إذا كنت تعتقد أن محتوى على Sura Codex ينتهك حقوق النشر، يمكنك التواصل معنا عبر صفحة التواصل لإرسال إشعار يوضح (قدر الإمكان) العمل المحمي وموضعه على الموقع، وبيانات التواصل الخاصة بك، وأسباب الاعتقاد بالانتهاك. سنراجع الطلب وفقًا للسياسات المعمول بها.'
              : 'If you believe that content on Sura Codex infringes your copyright, you can contact us via the Contact page to submit a notice. Where possible, include the protected work, the location of the content on the site, your contact details, and the reasons you believe infringement has occurred. We will review requests in accordance with applicable policies.'}
          </p>
        </div>

      </section>

    </div>
  );
}

