import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  keywords?: string;
  author?: string;
  ogLocale?: string;
  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage = 'https://rcxfryjvdkmtbqivbrjg.supabase.co/storage/v1/object/public/question-images/og-image.png',
  keywords,
  author = 'Ilyos Xudayberganov',
  ogLocale = 'uz_UZ',
  twitterCard = 'summary_large_image',
  twitterSite = '@educontest_uz',
  twitterCreator = '@ilyos_x',
  articlePublishedTime,
  articleModifiedTime,
  noindex = false,
  nofollow = false
}) => {
  useEffect(() => {
    const fullTitle = title.includes('| EduContest') ? title : `${title} | EduContest`;

    // Update title
    document.title = fullTitle;

    // Update or create meta description
    const updateMeta = (selector: string, attribute: string, value: string) => {
      let el = document.querySelector(selector);
      if (el) {
        el.setAttribute(attribute, value);
      } else {
        el = document.createElement('meta');
        const attrs = selector.match(/\[([^\]]+)="([^"]+)"\]/);
        if (attrs) {
          el.setAttribute(attrs[1], attrs[2]);
        }
        el.setAttribute(attribute, value);
        document.head.appendChild(el);
      }
    };

    // Basic meta
    updateMeta('meta[name="description"]', 'content', description);
    updateMeta('meta[name="author"]', 'content', author);
    updateMeta('meta[name="robots"]', 'content', noindex || nofollow
      ? `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    // Keywords
    if (keywords) {
      updateMeta('meta[name="keywords"]', 'content', keywords);
    }

    // Open Graph
    const updateOG = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (el) {
        el.setAttribute('content', content);
      } else {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        el.setAttribute('content', content);
        document.head.appendChild(el);
      }
    };

    updateOG('og:title', fullTitle);
    updateOG('og:description', description);
    updateOG('og:type', ogType);
    updateOG('og:image', ogImage);
    updateOG('og:image:width', '1200');
    updateOG('og:image:height', '630');
    updateOG('og:image:alt', title);
    updateOG('og:url', canonical || window.location.href);
    updateOG('og:site_name', 'EduContest');
    updateOG('og:locale', ogLocale);

    // Article OG (for article-type pages)
    if (articlePublishedTime) {
      updateOG('article:published_time', articlePublishedTime);
    }
    if (articleModifiedTime) {
      updateOG('article:modified_time', articleModifiedTime);
    }

    // Twitter Card
    const updateTwitter = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (el) {
        el.setAttribute('content', content);
      } else {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        el.setAttribute('content', content);
        document.head.appendChild(el);
      }
    };

    updateTwitter('twitter:card', twitterCard);
    updateTwitter('twitter:title', fullTitle);
    updateTwitter('twitter:description', description);
    updateTwitter('twitter:image', ogImage);
    updateTwitter('twitter:image:alt', title);
    updateTwitter('twitter:site', twitterSite);
    updateTwitter('twitter:creator', twitterCreator);

    // Canonical URL
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    const href = canonical || window.location.href;
    if (linkCanonical) {
      linkCanonical.setAttribute('href', href);
    } else {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      linkCanonical.setAttribute('href', href);
      document.head.appendChild(linkCanonical);
    }

    // Language alternates
    const updateLink = (rel: string, hreflang: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"][hreflang="${hreflang}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        el.setAttribute('hreflang', hreflang);
        el.setAttribute('href', href);
        document.head.appendChild(el);
      }
    };

    const baseUrl = window.location.origin;
    const path = window.location.pathname;
    updateLink('alternate', 'uz', `${baseUrl}${path}`);
    updateLink('alternate', 'ru', `${baseUrl}/ru${path}`);
    updateLink('alternate', 'en', `${baseUrl}/en${path}`);
    updateLink('alternate', 'x-default', `${baseUrl}${path}`);

  }, [title, description, canonical, ogType, ogImage, keywords, author, ogLocale, twitterCard, twitterSite, twitterCreator, articlePublishedTime, articleModifiedTime, noindex, nofollow]);

  return null;
};

export default SEO;
