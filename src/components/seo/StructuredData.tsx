import React from 'react';

interface StructuredDataProps {
  type: 'quiz' | 'faq' | 'breadcrumb' | 'webpage' | 'course' | 'organization';
  data?: Record<string, any>;
}

const OrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "EduContest",
  "alternateName": "EduContest.uz",
  "url": "https://educontest.uz",
  "logo": "https://educontest.uz/logo.png",
  "description": "EduContest.uz — Milliy Sertifikat imtihonlariga tayyorlanish uchun Matematika mock testlari hamda barcha fanlar bo‘yicha online mock testlar, diagnostik tahlil va AI yordamidagi tayyorgarlik platformasi.",
  "founder": { "@type": "Person", "name": "Ilyos Xudayberganov" },
  "address": { "@type": "PostalAddress", "addressCountry": "UZ" },
  "areaServed": { "@type": "Country", "name": "Uzbekistan" },
  "knowsAbout": [
    "Milliy Sertifikat Matematika", "Milliy Sertifikat Ona Tili",
    "Milliy Sertifikat Adabiyot", "Milliy Sertifikat Tarix",
    "Milliy Sertifikat Biologiya", "Matematika testlari",
    "Biologiya testlari", "Tarix testlari", "Ona Tili testlari",
    "Adabiyot testlari", "Online testlar", "AI tahlil",
    "SAT", "IELTS", "CEFR"
  ]
});

const QuizSchema = ({ folder, questionCount }: { folder: any; questionCount: number }) => ({
  "@context": "https://schema.org",
  "@type": "Quiz",
  "name": folder?.name || "Test",
  "description": folder?.description || folder?.meta_description || `${folder?.subject} fanidan "${folder?.name}" mavzulashtirilgan test.`,
  "url": `https://educontest.uz/tests/folder/${folder?.id}`,
  "educationalLevel": "Milliy Sertifikat",
  "timeRequired": `PT${folder?.duration_minutes || 60}M`,
  "numberOfQuestions": questionCount,
  "about": {
    "@type": "Thing",
    "name": folder?.subject || "Umumiy"
  },
  "provider": {
    "@type": "EducationalOrganization",
    "name": "EduContest",
    "url": "https://educontest.uz"
  },
  "inLanguage": "uz",
  "isAccessibleForFree": (folder?.price || 0) === 0,
  "hasAssessment": {
    "@type": "Assessment",
    "name": `${folder?.name} — Baholash`,
    "assessmentType": "https://schema.org/PerformanceTask"
  }
});

const FAQSchema = ({ items }: { items: Array<{ question: string; answer: string }> }) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": items.map(item => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer
    }
  }))
});

const BreadcrumbSchema = ({ items }: { items: Array<{ name: string; url: string }> }) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

const WebPageSchema = ({ title, description, url }: { title: string; description: string; url: string }) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": title,
  "description": description,
  "url": url,
  "publisher": {
    "@type": "EducationalOrganization",
    "name": "EduContest",
    "logo": { "@type": "ImageObject", "url": "https://educontest.uz/logo.png" }
  },
  "inLanguage": "uz",
  "dateModified": new Date().toISOString()
});

const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  let schema: any = null;

  switch (type) {
    case 'organization':
      schema = OrganizationSchema();
      break;
    case 'quiz':
      schema = QuizSchema({ folder: data?.folder, questionCount: data?.questionCount || 0 });
      break;
    case 'faq':
      schema = FAQSchema({ items: data?.items || [] });
      break;
    case 'breadcrumb':
      schema = BreadcrumbSchema({ items: data?.items || [] });
      break;
    case 'webpage':
      schema = WebPageSchema({
        title: data?.title || '',
        description: data?.description || '',
        url: data?.url || window.location.href
      });
      break;
  }

  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default StructuredData;
export { OrganizationSchema, QuizSchema, FAQSchema, BreadcrumbSchema, WebPageSchema };
