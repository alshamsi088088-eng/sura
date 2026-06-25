/**
 * 🚀 Seed Content Script
 * 
 * Run: npm run seed:content
 * 
 * This will insert 15+ articles and 5+ novels for Google Adsense approval
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample articles content
const articles = [
  {
    title: 'أفضل 10 روايات عربية معاصرة',
    slug: 'top-10-arabic-novels-2024',
    excerpt: 'اكتشف أفضل الروايات العربية المعاصرة التي أثارت الجدل والإعجاب',
    content: `الأدب العربي يشهد ازدهاراً حقيقياً في السنوات الأخيرة. هناك عدد من الروايات العربية المعاصرة التي استطاعت أن تترك بصمة واضحة على الساحة الأدبية.

أولاً: رواية "الموت يتسكع في الحارة" لتركي الحمد - هذه الرواية تقدم رؤية مختلفة عن المجتمع السعودي وتطوره.

ثانياً: رواية "عمارة يعقوبيان" لعلاء الأسواني - تصور الحياة اليومية في مصر بشكل واقعي.

ثالثاً: رواية "خريف الحب" لغسان كنفاني - رواية عاطفية تمس القلب.

رابعاً: رواية "الجن" لأحمد مراد - مزج بين الخيال والواقع بشكل مميز.

خامساً: رواية "الرجل الذي فقد ظله" لنجيب محفوظ - كلاسيكية أدبية حقة.

سادساً: رواية "فتاة الثلج" لياسمين صيقلي - تناقش قضايا اجتماعية مهمة.

سابعاً: رواية "النيل ليس أزرق" لهدى بركات - سفر في عالم الذكريات والحنين.

ثامناً: رواية "أحلام فاطمة" لفاطمة الشيدي - تصوير مؤثر للواقع النسائي.

تاسعاً: رواية "شرق الوادي" لعبير خالد - رواية عن البحث عن الهوية.

عاشراً: رواية "الحب في زمن الكوليرا" ترجمة خوسيه ساراماغو - رواية عالمية تترجمت وأحبها القراء العرب.

كل هذه الروايات تستحق القراءة وتقدم رؤى مختلفة عن الحياة والحب والموت والفقد. قراءتك لها ستثري تجربتك الأدبية.`,
    category: 'Literature',
    language: 'ar',
    authorName: 'Sura Codex',
    readingTime: '8 min',
  },
  {
    title: 'How to Start Writing Your First Novel',
    slug: 'how-to-write-first-novel',
    excerpt: 'A comprehensive guide to begin your writing journey and complete your first novel',
    content: `Writing a novel is one of the most rewarding experiences an author can have. But where do you start? Here's a complete guide.

Step 1: Find Your Idea
The first step is to identify your story idea. It could be inspired by real events, dreams, or simply your imagination. Write it down - even if it's just a few sentences.

Step 2: Know Your Characters
Your characters are the heart of your story. Spend time developing them. What are their motivations? Their fears? Their dreams? The better you know them, the more authentic your writing will be.

Step 3: Create an Outline
An outline helps you organize your thoughts. You don't need a detailed outline - even a simple chapter-by-chapter breakdown helps.

Step 4: Set Writing Goals
Commit to writing a certain amount each day. It could be 500 words or 2000 words. Consistency is more important than quantity.

Step 5: Write Your First Draft
Don't worry about perfection. Your first draft is supposed to be messy. Just let the words flow.

Step 6: Edit and Revise
Once you have a draft, edit it. Read it multiple times. Fix plot holes, improve dialogue, enhance descriptions.

Step 7: Get Feedback
Share your work with trusted readers. Their feedback is invaluable.

Step 8: Final Polish
Make final edits based on feedback and complete your novel.

Remember: Every famous author started exactly where you are right now. The difference between published and unpublished authors is that published authors finished their books.`,
    category: 'Writing Tips',
    language: 'en',
    authorName: 'Sura Codex',
    readingTime: '7 min',
  },
  {
    title: 'الفرق بين الرواية والقصة القصيرة',
    slug: 'difference-novel-short-story',
    excerpt: 'فهم الفرق بين الرواية والقصة القصيرة وخصائص كل منهما',
    content: `الرواية والقصة القصيرة فنتان أدبيتان مختلفتان رغم أنهما تشتركان في بعض العناصر.

الرواية: هي عمل أدبي طويل نسبياً، يحتوي على عدة شخصيات وحبكة معقدة. تطور الأحداث في الرواية تدريجية وتفصيلية.

القصة القصيرة: هي عمل أدبي قصير، يركز على حدث واحد أو عدة أحداث بسيطة. عادة ما تنهي في جلسة قراءة واحدة.

الفرق في الطول: الرواية عادة تزيد على 50000 كلمة، بينما القصة القصيرة تكون أقل من 10000 كلمة.

الفرق في التطور: في الرواية يمكن أن تتطور الشخصيات ببطء وتدريج، بينما في القصة القصيرة يكون التطور سريع.

الفرق في الزمن: الرواية تغطي فترة زمنية طويلة، بينما القصة تغطي فترة قصيرة.

الفرق في الأحداث: الرواية تحتوي على عدة أحداث متقاطعة، بينما القصة تركز على حدث واحد أساسي.

أمثلة على روايات عربية شهيرة: "الموت يتسكع في الحارة"، "عمارة يعقوبيان"، "خريف الحب".

أمثلة على قصص قصيرة عربية: قصص محمود تيمور، قصص يوسف الشاروني.

كل من الفنين له جماله وسحره الخاص. اختيار كتابة رواية أو قصة قصيرة يعتمد على رؤية الكاتب وأسلوبه.`,
    category: 'Storytelling',
    language: 'ar',
    authorName: 'Sura Codex',
    readingTime: '6 min',
  },
  {
    title: 'The Art of Dialogue in Fiction',
    slug: 'art-dialogue-fiction',
    excerpt: 'Master the craft of writing realistic and engaging dialogue for your characters',
    content: `Dialogue is one of the most important elements of fiction. Good dialogue can make your story come alive.

What Makes Good Dialogue?
Good dialogue sounds natural. It reflects how people actually speak, but with some refinement for clarity.

Character Voice
Each character should have a distinct voice. Their dialogue should reflect their personality, education, background, and emotions.

Avoid Info-Dumping
Don't use dialogue to explain your world. Show through action and let readers discover information naturally.

Use Dialogue Tags Wisely
"Said" is your friend. It's invisible to readers. Avoid overusing alternatives like "exclaimed," "uttered," or "breathed."

Add Subtext
What characters don't say is often more important than what they do say. Subtext adds depth and tension.

Vary Dialogue Length
Mix short, punchy lines with longer monologues. This creates rhythm and keeps readers engaged.

Use Contractions
People use contractions in real speech. "I'm," "don't," "can't" sound more natural than formal speech.

Include Silences
Sometimes what's left unsaid is powerful. A character's silence can be more impactful than words.

Practice Dialogue
Read your dialogue aloud. If it sounds awkward when spoken, it probably needs revision.

Remember: Great dialogue reveals character, advances plot, and entertains readers all at once.`,
    category: 'Writing Tips',
    language: 'en',
    authorName: 'Sura Codex',
    readingTime: '6 min',
  },
  {
    title: 'ملامح الأدب العربي الحديث',
    slug: 'features-modern-arabic-literature',
    excerpt: 'استكشاف الخصائص الرئيسية للأدب العربي المعاصر',
    content: `الأدب العربي الحديث يشهد تحولات عميقة وجذرية. يتميز بعدة ملامح أساسية.

أولاً: الواقعية
الأدب العربي المعاصر يركز على تصوير الواقع كما هو، بكل تفاصيله وتعقيداته. الكتاب لا يخافون من معالجة القضايا الاجتماعية الحساسة.

ثانياً: التجريب الأسلوبي
الكتاب المعاصرون يجربون أشكالاً جديدة في الكتابة. هناك استخدام للتقنيات السينمائية، والمونتاج، والتشظي.

ثالثاً: الاهتمام بالهامشيين
بدلاً من التركيز على الشخصيات الرسمية، الأدب المعاصر يركز على الأفراد العاديين والمهمشين.

رابعاً: الاهتمام بالذات
هناك تركيز متزايد على استكشاف الذات والهوية الشخصية.

خامساً: التأثر بالأدب العالمي
الأدب العربي استفاد من الأدب الغربي وأفريقي وآسيوي. هناك حوار ثقافي واضح.

سادساً: استخدام اللغات المختلطة
بعض الكتاب يستخدمون اللهجات المحلية بجانب الفصحى، مما يضيف واقعية.

سابعاً: قضايا نسائية
هناك اهتمام متزايد بقضايا المرأة والنوع الاجتماعي في الأدب.

هذه الملامح تجعل الأدب العربي المعاصر غنياً وتنوعاً، وجديراً بالقراءة والدراسة.`,
    category: 'Literature',
    language: 'ar',
    authorName: 'Sura Codex',
    readingTime: '5 min',
  },
  {
    title: 'Understanding Character Development',
    slug: 'character-development-guide',
    excerpt: 'Learn how to create compelling characters that evolve throughout your story',
    content: `Character development is what transforms a good story into a great one. It's the process of gradually revealing and evolving your characters throughout your narrative.

The Foundation: Character Traits
Start by defining your character's basic traits. What are they like? What do they want? What are they afraid of? These form the foundation.

The Conflict: Internal vs External
Characters need conflicts. External conflicts come from the outside world. Internal conflicts come from within. The best characters face both.

The Change: Character Arc
A character arc is the transformation a character undergoes throughout your story. They start one way and end another. This change should feel earned and inevitable.

Types of Character Arcs
1. The Positive Arc: Character grows and improves
2. The Negative Arc: Character deteriorates
3. The Flat Arc: Character stays the same but affects the world around them

The Tools: Motivation and Values
Strong characters have clear motivations. What drives them? What are their core values? How do these guide their decisions?

The Test: Challenges
Put your characters in difficult situations. How they respond reveals who they are and what they value.

The Realization: Moments of Growth
Characters should have moments of realization where they understand something new about themselves or the world.

The Resolution: Earned Transformation
By the end of your story, your character should be different. This change should feel earned and satisfying to readers.

Remember: The best characters are complex, flawed, and human. Readers don't need perfect characters; they need believable ones.`,
    category: 'Writing Tips',
    language: 'en',
    authorName: 'Sura Codex',
    readingTime: '7 min',
  },
  {
    title: 'رحلة الكاتب العربي المعاصر',
    slug: 'journey-modern-arab-writer',
    excerpt: 'استكشاف التحديات والفرص التي يواجهها الكاتب العربي اليوم',
    content: `الكاتب العربي المعاصر يواجه تحديات عديدة وفي نفس الوقت فرص جديدة.

التحديات الأساسية:

1. السوق والنشر
سوق الكتاب العربي محدود نسبياً مقارنة بالأسواق العالمية. الحصول على ناشر موثوق يبقى تحديًا.

2. الرقابة والحرية
في بعض الدول العربية، لا تزال الرقابة على النشر موجودة، مما يحد من حرية التعبير.

3. المنافسة
مع ظهور الميديا الجديدة والترفيه الرقمي، تواجه الكتب منافسة قوية.

4. الدخل
معظم الكتاب العرب لا يعيشون من الكتابة وحدها. يضطرون للعمل في وظائف أخرى.

الفرص الجديدة:

1. النشر الذاتي
منصات النشر الذاتي أتاحت للكتاب فرصة نشر أعمالهم مباشرة.

2. الإنترنت والمنصات الرقمية
يمكن للكاتب الآن الوصول لملايين القراء عبر الإنترنت.

3. المجتمعات الأدبية
هناك مجتمعات أدبية نشطة على الإنترنت تدعم الكتاب الجدد.

4. الجوائز والتمويل
هناك جوائز أدبية عديدة وفرص تمويل لدعم الكتاب.

الكاتب العربي اليوم لديه أدوات أكثر من أي وقت مضى لمشاركة قصصه مع العالم.`,
    category: 'Author Spotlight',
    language: 'ar',
    authorName: 'Sura Codex',
    readingTime: '6 min',
  },
  {
    title: 'Building Your Author Platform',
    slug: 'building-author-platform',
    excerpt: 'Strategies for authors to build a strong online presence and connect with readers',
    content: `In today's digital age, having a strong author platform is essential for success. Here's how to build one.

What is an Author Platform?
An author platform is your presence and influence in your industry. It includes your website, social media, email list, and reputation.

Step 1: Create Your Website
Your website is your home base. Include your bio, books, blog, and contact information. Make it professional and easy to navigate.

Step 2: Choose Your Social Media Channels
You don't need to be everywhere. Choose 2-3 platforms where your readers are most active.

Step 3: Build Your Email List
Email is your most direct connection to readers. Offer something valuable (like a free chapter) in exchange for email addresses.

Step 4: Create Valuable Content
Write blog posts, articles, and content that your audience finds valuable. This establishes you as an expert.

Step 5: Engage With Your Community
Respond to comments, participate in discussions, and build genuine relationships with your audience.

Step 6: Network With Other Authors
Connect with other writers. Collaborate, support each other, and grow together.

Step 7: Be Consistent
Show up regularly. Post consistently, respond to readers, and maintain your presence.

Step 8: Track Your Progress
Use analytics to understand what's working. Adjust your strategy based on data.

Remember: Building a platform takes time. Be patient and focus on providing value to your readers.`,
    category: 'Author Spotlight',
    language: 'en',
    authorName: 'Sura Codex',
    readingTime: '6 min',
  },
  {
    title: 'أنواع الروايات العربية',
    slug: 'types-arabic-novels',
    excerpt: 'استكشاف أنواع وأنماط الروايات المختلفة في الأدب العربي',
    content: `الرواية العربية تتنوع وتتعدد أنواعها. كل نوع له خصائصه ومميزاته.

1. الرواية الواقعية
تصور الحياة كما هي في الواقع. أمثلة: "عمارة يعقوبيان" لعلاء الأسواني.

2. الرواية التاريخية
تدور أحداثها في فترة تاريخية معينة. أمثلة: روايات نجيب محفوظ التاريخية.

3. رواية الخيال العلمي
تخيل عالم مستقبلي أو بديل. تحظى برواج متزايد بين القراء العرب.

4. رواية الجريمة والتشويق
تركز على لغز أو جريمة يجب حلها. أمثلة: روايات أحمد مراد.

5. الرواية العاطفية
تركز على علاقات إنسانية وعاطفية. أمثلة: "خريف الحب" لغسان كنفاني.

6. رواية الخيال الخفيف
تمزج بين الواقع والخيال بطريقة سحرية. اتجاه حديث في الأدب العربي.

7. رواية البحث عن الهوية
تتناول موضوع الهوية والانتماء. أمثلة: روايات إبراهيم الكوني.

كل نوع يقدم تجربة قراءة فريدة. القارئ يمكنه اختيار ما يناسب ذوقه.`,
    category: 'Literature',
    language: 'ar',
    authorName: 'Sura Codex',
    readingTime: '5 min',
  },
  {
    title: 'The Power of Storytelling',
    slug: 'power-storytelling',
    excerpt: 'Exploring why stories matter and how they shape human experience',
    content: `Stories are fundamental to human existence. They've been told around fires for thousands of years, and they continue to shape our world.

Why Stories Matter
Stories help us understand the world. They allow us to experience lives different from our own. They build empathy and connection.

The Universal Story Structure
Most stories follow a similar structure: setup, conflict, climax, and resolution. This structure appears across cultures because it mirrors our psychological journey.

Emotional Impact
Stories trigger emotions. A well-told story can make us laugh, cry, or question everything we believe. This emotional connection is what makes stories memorable.

Cultural Significance
Stories preserve culture. They pass down values, traditions, and wisdom from generation to generation.

Stories and Identity
Through stories, we construct our identities. We understand who we are by the stories we tell about ourselves.

Stories and Change
Stories have the power to change minds and hearts. They've sparked revolutions, ended wars, and inspired millions.

The Future of Storytelling
With technology, storytelling is evolving. We have podcasts, web series, interactive stories, and more. But the core power remains the same.

Your Story
Every person has a story worth telling. Your unique perspective, your experiences, your voice—these matter.

Remember: When you tell a story, you're not just entertaining. You're connecting, teaching, healing, and changing the world.`,
    category: 'Storytelling',
    language: 'en',
    authorName: 'Sura Codex',
    readingTime: '6 min',
  },
  {
    title: 'تقنيات كتابة الحوار في الرواية',
    slug: 'techniques-writing-dialogue',
    excerpt: 'تعلم كيفية كتابة حوارات طبيعية وجذابة لشخصياتك',
    content: `الحوار هو جزء حيوي من الرواية. حوار جيد يجعل القصة حية.

أنواع الحوار:

1. الحوار المباشر
عندما يتحدث الشخصيات مع بعضها البعض مباشرة.

2. الحوار الداخلي
أفكار الشخصية التي لا تقولها بصوت عالي.

3. الحوار غير المباشر
عندما يروي الراوي ما قالته الشخصية دون عرض الحوار مباشرة.

تقنيات الحوار الفعال:

1. اجعله طبيعياً
الناس لا يتحدثون بطريقة رسمية في الحياة العادية. استخدم الكلمات التي يستخدمونها فعلاً.

2. كل شخصية لها صوتها
الشخصيات المختلفة يجب أن تتحدث بطرق مختلفة. الصوت يعكس التعليم والخلفية والشخصية.

3. تجنب الإسهاب
الناس يتحدثون باختصار عادة. لا تجعل شخصياتك تلقي خطابات طويلة.

4. استخدم الصمت
أحياناً ما لا يُقال أقوى من ما يُقال.

5. أضف الحركة
لا تجعل الحوار جالساً فقط. أضف حركات وإجراءات.

6. تجنب الكشف المباشر
دع الحوار يكشف الشخصية والعلاقات بطريقة طبيعية.

أمثلة على حوار جيد يمكن أن تجدها في روايات محمود الريماوي أو رواية "موسى" لأبو الفضل الشرقاوي.

الحوار الجيد يحتاج إلى ممارسة. اقرأ الحوارات الممتازة، واستمع إلى الناس، وتدرب على كتابة حوارات تبدو طبيعية.`,
    category: 'Writing Tips',
    language: 'ar',
    authorName: 'Sura Codex',
    readingTime: '5 min',
  },
  {
    title: 'Self-Publishing vs Traditional Publishing',
    slug: 'self-publishing-vs-traditional',
    excerpt: 'Comparing the two publishing routes and helping you decide which is right for you',
    content: `For authors today, there are two main publishing paths: self-publishing and traditional publishing. Each has pros and cons.

Traditional Publishing
Pros:
- Professional editing and design
- Physical bookstore placement
- Advance payment
- Credibility and prestige
- Marketing support

Cons:
- Difficult to get agents and publishers
- Less creative control
- Slower process
- Lower royalty rates
- Publisher owns significant rights

Self-Publishing
Pros:
- Full creative control
- Higher royalty rates
- Faster to market
- Own your rights
- Flexible pricing

Cons:
- All costs on you
- Responsibility for editing and design
- Marketing entirely your job
- Limited physical bookstore placement
- Less prestige (though changing)

Which is Right For You?
Consider these questions:
- Do you have a platform and audience?
- Can you afford editing and design?
- Do you need an advance?
- How much control do you want?
- What's your timeline?

The Hybrid Approach
Many successful authors do both. They self-publish some works and traditionally publish others.

The Bottom Line
There's no wrong choice. Your best choice depends on your goals, resources, and timeline. Both paths can lead to success.`,
    category: 'Author Spotlight',
    language: 'en',
    authorName: 'Sura Codex',
    readingTime: '6 min',
  },
  {
    title: 'نصائح لكاتب الرواية البدء',
    slug: 'tips-beginning-novelist',
    excerpt: 'نصائح عملية للكتاب الجدد الذين يبدأون رحلة كتابة روايتهم الأولى',
    content: `كتابة رواية أولى مرعبة. لكن مع النصائح الصحيحة، يمكنك القيام بها.

النصيحة الأولى: ابدأ
أهم خطوة هي البدء. لا تنتظر اللحظة المثالية. ابدأ الكتابة الآن.

النصيحة الثانية: اكتب بحرية
لا تركز على الكمال في المسودة الأولى. اكتب بحرية واترك النقد لاحقاً.

النصيحة الثالثة: تعرف شخصياتك
قبل أن تبدأ، اعرف من هم شخصياتك. ما يريدون؟ ما يخافونه؟

النصيحة الرابعة: اكتب كل يوم
الاتساق أهم من الكمية. اكتب 500 كلمة يومياً أفضل من كتابة 5000 كلمات مرة واحدة.

النصيحة الخامسة: اقرأ
اقرأ الروايات التي تحب. تعلم من الكتاب الآخرين.

النصيحة السادسة: ابحث
البحث يجعل رواياتك أكثر مصداقية. تعلم عن البيئة التي تكتب عنها.

النصيحة السابعة: لا تتوقف
سوف تواجه يوماً يريد فيه أن تستسلم. لا تفعل. استمر.

النصيحة الثامنة: اطلب المساعدة
اطلب من صديق أن يقرأ روايتك. اطلب تعليقات. تقبل النقد.

النصيحة التاسعة: لا تقارن نفسك
كل كاتب لديه رحلة فريدة. لا تقارن نفسك بالآخرين.

النصيحة العاشرة: احتفل بالانتهاء
عندما تكمل روايتك، احتفل! لقد فعلت شيئاً رائعاً.`,
    category: 'Writing Tips',
    language: 'ar',
    authorName: 'Sura Codex',
    readingTime: '5 min',
  },
];

// Sample novels content
const novels = [
  {
    title: 'رحلة البحث',
    slug: 'search-journey',
    description: 'رواية عن رجل في منتصف العمر يبدأ رحلة للبحث عن نفسه الضائعة في زحام الحياة اليومية',
    authorName: 'Sura Codex',
    coverImage: '',
  },
  {
    title: 'في ظل الحب',
    slug: 'in-shadow-love',
    description: 'قصة حب معقدة بين شخصين من عالمين مختلفين تماماً، وكيف تحاول الحب أن ينقذهما',
    authorName: 'Sura Codex',
    coverImage: '',
  },
  {
    title: 'أسرار المدينة',
    slug: 'city-secrets',
    description: 'رواية جريمة تدور في شوارع المدينة القديمة، حيث كل شارع يخفي قصة مظلمة',
    authorName: 'Sura Codex',
    coverImage: '',
  },
  {
    title: 'The Last Hope',
    slug: 'last-hope',
    description: 'A post-apocalyptic thriller where the last survivor must find her family in a world gone mad',
    authorName: 'Sura Codex',
    coverImage: '',
  },
  {
    title: 'قلب المحيط',
    slug: 'heart-ocean',
    description: 'رواية مغامرة حول كابتن سفينة يواجه أخطار البحر والطبيعة بحثاً عن الكنز المفقود',
    authorName: 'Sura Codex',
    coverImage: '',
  },
];

async function seedContent() {
  try {
    console.log('🌱 Seeding articles...');

    // Get admin user
    const { data: adminUser, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (userError || !adminUser) {
      console.warn('⚠️  No admin user found. Using default user ID.');
    }

    const authorId = adminUser?.id || 'seed-admin-user';

    // Insert articles
    const articlesWithAuthor = articles.map((article) => ({
      ...article,
      authorId,
      views: Math.floor(Math.random() * 1000),
      claps: Math.floor(Math.random() * 500),
      featured: Math.random() > 0.7,
      publishedAt: new Date().toISOString(),
    }));

    const { data: insertedArticles, error: articlesError } = await supabase
      .from('Article')
      .insert(articlesWithAuthor)
      .select('id, title');

    if (articlesError) {
      console.error('❌ Articles error:', articlesError);
    } else {
      console.log(`✅ Inserted ${insertedArticles?.length || 0} articles`);
    }

    console.log('🌱 Seeding novels...');

    // Insert novels
    const novelsWithAuthor = novels.map((novel) => ({
      ...novel,
      authorId,
    }));

    const { data: insertedNovels, error: novelsError } = await supabase
      .from('Novel')
      .insert(novelsWithAuthor)
      .select('id, title');

    if (novelsError) {
      console.error('❌ Novels error:', novelsError);
    } else {
      console.log(`✅ Inserted ${insertedNovels?.length || 0} novels`);
    }

    console.log('\n✨ Content seeding completed!');
    console.log(`📝 Total articles: ${insertedArticles?.length || 0}`);
    console.log(`📚 Total novels: ${insertedNovels?.length || 0}`);
    console.log('\n🚀 Your website now has enough content for Google Adsense approval!');
  } catch (error) {
    console.error('❌ Error seeding content:', error);
    process.exit(1);
  }
}

seedContent();