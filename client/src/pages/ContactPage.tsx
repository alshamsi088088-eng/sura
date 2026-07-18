
import { useState, FormEvent } from 'react';
import { useLocale } from '../context/LocaleContext';
import { usePageMetadata } from '../hooks/usePageMetadata';

export function ContactPage() {
  const { locale } = useLocale();
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  usePageMetadata(
    locale === 'ar' ? 'تواصل معنا | Sura Codex' : 'Contact Us | Sura Codex',
    locale === 'ar'
      ? 'تواصل مع فريق Sura Codex لطرح الأسئلة أو اقتراح الشراكات أو الدعم. نرد عادةً خلال يوم عمل واحد.'
      : 'Contact the Sura Codex team with questions, partnership ideas, or support requests. We typically respond within one business day.',
    typeof window !== 'undefined' ? window.location.href : undefined,
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setStatus(locale === 'ar' ? 'تم إرسال رسالتك. سنعود إليك قريبًا.' : 'Message sent successfully. We will get back to you shortly.');
    setMessage('');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'تواصل معنا' : 'Contact Sura Codex'}</h1>
        <p className="mt-3 text-sm leading-7 text-sura-navy/80">
          {locale === 'ar'
            ? 'نرحب بتواصلك. سواء لديك سؤال حول المحتوى أو منصة القراءة أو ترغب بالتعاون، نقرأ رسائلك باهتمام.'
            : 'We welcome your message. Whether you have a question about the platform or would like to collaborate, we read every note with care.'}
        </p>
        <p className="mt-3 text-sm leading-7 text-sura-navy/80">
          {locale === 'ar'
            ? 'الرد عادةً خلال يوم عمل واحد. إذا كانت رسالتك تتطلب مراجعة أو تنسيق، قد نحتاج وقتًا إضافيًا لنعطيك إجابة دقيقة.'
            : 'We usually respond within one business day. If your message needs extra review or coordination, we may take a little longer to provide a precise answer.'}
        </p>
      </header>

      <section className="rounded-3xl border border-sura-line bg-sura-canvas p-8 space-y-4">
        <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'ما الذي يمكنك كتابته؟' : 'What can you contact us about?'}</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm leading-7 text-sura-navy/80">
          <li>{locale === 'ar' ? 'اقتراح شراكة أو تعاون محتوى (كتّاب، محررون، خبراء).' : 'Partnership and content collaboration (writers, editors, subject experts).'}</li>
          <li>{locale === 'ar' ? 'ملاحظات لتحسين تجربة القراءة والتصفح.' : 'Feedback to improve reading and navigation experience.'}</li>
          <li>{locale === 'ar' ? 'استفسارات حول سياسة الخصوصية أو ملفات تعريف الارتباط.' : 'Questions regarding privacy or cookie practices.'}</li>
          <li>{locale === 'ar' ? 'طلبات دعم للمشكلات الفنية أو الحساب.' : 'Support requests for technical issues or account matters.'}</li>
        </ul>
      </section>

      <form onSubmit={submit} className="grid gap-6 rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value=""
            placeholder={locale === 'ar' ? 'الاسم' : 'Name'}
            className="rounded-3xl border border-sura-line bg-sura-canvas p-4 text-sura-navy"
            required
          />
          <input
            value=""
            placeholder={locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
            type="email"
            className="rounded-3xl border border-sura-line bg-sura-canvas p-4 text-sura-navy"
            required
          />
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={locale === 'ar' ? 'اكتب رسالتك' : 'Write your message'}
          className="min-h-[220px] rounded-3xl border border-sura-line bg-sura-canvas p-4 text-sura-navy"
          required
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            className="rounded-full bg-sura-gold px-6 py-3 text-sm font-semibold text-sura-dark"
          >
            {locale === 'ar' ? 'إرسال الرسالة' : 'Send message'}
          </button>
          <span className="text-sm text-sura-navy/70">{locale === 'ar' ? 'متوسط وقت الاستجابة: 24 ساعة عمل' : 'Response expectation: within 24 business hours'}</span>
        </div>
        {status && <div className="rounded-3xl bg-sura-canvas p-4 text-sm text-sura-navy">{status}</div>}
      </form>
    </div>
  );
}

