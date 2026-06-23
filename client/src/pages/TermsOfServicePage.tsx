import { useLocale } from '../context/LocaleContext';

export function TermsOfServicePage() {
  const { locale } = useLocale();

  return (
    <div className="mx-auto max-w-5xl space-y-6 rounded-3xl border border-sura-line bg-sura-canvas p-8">
      <h1 className="text-4xl font-semibold">
        {locale === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
      </h1>

      <p className="text-sm leading-7 text-sura-navy/80">
        {locale === 'ar'
          ? 'مرحبًا بك في Sura Codex. تحدد شروط الخدمة والقواعد والالتزامات التي تحكم استخدامك للموقع.'
          : 'Welcome to Sura Codex. These terms and conditions outline the rules and regulations for the use of Sura Codex’s Website.'}
      </p>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">
            {locale === 'ar' ? 'حقوق الملكية الفكرية' : 'Intellectual Property Rights'}
          </h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'ما لم يُنص على خلاف ذلك، تمتلك Sura Codex و/أو المرخصون لديها حقوق الملكية الفكرية لجميع المواد الموجودة على Sura Codex.'
              : 'Unless otherwise stated, Sura Codex and/or its licensors own the intellectual property rights for all material on Sura Codex. This includes technical articles, source codes, original literary works, novels, essays, and photographic content. All intellectual property rights are reserved. You may access this from Sura Codex for your own personal use subjected to restrictions set in these terms and conditions.'}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">
            {locale === 'ar' ? 'ما لا يجوز لك القيام به' : 'You must not'}
          </h2>
          <ul className="mt-2 list-disc pl-5 text-sm leading-7 text-sura-navy/80 space-y-1">
            <li>
              {locale === 'ar'
                ? 'إعادة نشر المواد أو الروايات أو المقالات من Sura Codex دون إشارة/اعتماد كتابي واضح.'
                : 'Republish material, novels, or articles from Sura Codex without explicit written credit.'}
            </li>
            <li>
              {locale === 'ar' ? 'بيع أو تأجير أو ترخيص فرعي للمواد من Sura Codex.' : 'Sell, rent, or sub-license material from Sura Codex.'}
            </li>
            <li>
              {locale === 'ar'
                ? 'نسخ أو تكرار أو استغلال المواد من Sura Codex لأغراض تجارية.'
                : 'Reproduce, duplicate, or copy material from Sura Codex for commercial purposes.'}
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">
            {locale === 'ar' ? 'المسؤولية عن المحتوى وبيان عدم الضمان' : 'Content Liability & Disclaimer'}
          </h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'يتم تقديم المعلومات والأعمال والإرشادات التقنية على أساس “كما هي”. وعلى الرغم من أننا نحرص على الدقة، لا نقدم أي ضمانات صريحة أو ضمنية بخصوص اكتمال أو موثوقية أو دقة المعلومات.'
              : 'The information, creative works, and technical guides on this website are provided on an “as is” basis. While we strive for absolute accuracy in our technical content and depth in our literary work, Sura Codex makes no warranties, expressed or implied, regarding the completeness, reliability, or accuracy of the information provided.'}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">
            {locale === 'ar' ? 'تعديل الشروط' : 'Variation of Terms'}
          </h2>
          <p className="mt-2 text-sm leading-7 text-sura-navy/80">
            {locale === 'ar'
              ? 'يجوز لـ Sura Codex مراجعة هذه الشروط في أي وقت، ومن خلال استخدام الموقع يُتوقع منك مراجعتها بانتظام.'
              : 'Sura Codex is permitted to revise these terms at any time as it sees fit, and by using this website you are expected to review these terms on a regular basis.'}
          </p>
        </div>
      </section>
    </div>
  );
}
