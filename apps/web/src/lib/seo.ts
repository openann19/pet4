import { createLogger } from '@/lib/logger';

const logger = createLogger('SEO');

export interface SEOConfig {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

function updateTitleMetaTags(title: string): void {
  document.title = title;
  updateMetaTag('property', 'og:title', title);
  updateMetaTag('name', 'twitter:title', title);
}

function updateDescriptionMetaTags(description: string): void {
  updateMetaTag('name', 'description', description);
  updateMetaTag('property', 'og:description', description);
  updateMetaTag('name', 'twitter:description', description);
}

function updateImageMetaTags(image: string): void {
  updateMetaTag('property', 'og:image', image);
  updateMetaTag('name', 'twitter:image', image);
}

function updateURLMetaTags(url: string): void {
  updateMetaTag('property', 'og:url', url);
  updateMetaTag('name', 'twitter:url', url);
  updateLinkTag('canonical', url);
}

/**
 * Update page meta tags dynamically
 */
export function updateSEO(config: SEOConfig): void {
  if (typeof document === 'undefined') return;

  const {
    title,
    description,
    image,
    url,
    type = 'website',
    keywords,
    author,
    publishedTime,
    modifiedTime,
  } = config;

  if (title) updateTitleMetaTags(title);
  if (description) updateDescriptionMetaTags(description);
  if (image) updateImageMetaTags(image);
  if (url) updateURLMetaTags(url);
  if (type) updateMetaTag('property', 'og:type', type);
  if (keywords && keywords.length > 0) updateMetaTag('name', 'keywords', keywords.join(', '));
  if (author) updateMetaTag('name', 'author', author);
  if (publishedTime) updateMetaTag('property', 'article:published_time', publishedTime);
  if (modifiedTime) updateMetaTag('property', 'article:modified_time', modifiedTime);

  logger.debug('SEO updated', { title, description, url });
}

/**
 * Update or create a meta tag
 */
function updateMetaTag(attribute: 'name' | 'property', key: string, value: string): void {
  if (typeof document === 'undefined') return;

  let meta = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }
  
  meta.content = value;
}

/**
 * Update or create a link tag
 */
function updateLinkTag(rel: string, href: string): void {
  if (typeof document === 'undefined') return;

  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  
  link.href = href;
}

/**
 * Reset SEO to default values
 */
export function resetSEO(): void {
  updateSEO({
    title: 'PawfectMatch - AI-Powered Pet Companion Matching',
    description: 'Connect with pet lovers, find perfect matches for your furry friends, and build lasting pet friendships.',
    url: 'https://pawfectmatch.com',
    image: 'https://pawfectmatch.com/og-image.jpg',
  });
}

/**
 * Set SEO for a pet profile page
 */
export function setPetProfileSEO(petName: string, petBreed: string, petImage?: string): void {
  updateSEO({
    title: `${petName} - ${petBreed} | PawfectMatch`,
    description: `Meet ${petName}, a ${petBreed} looking for friends on PawfectMatch.`,
    image: petImage ?? 'https://pawfectmatch.com/og-image.jpg',
    type: 'profile',
    keywords: [petName, petBreed, 'pet profile', 'pet matching'],
  });
}

/**
 * Set SEO for a match page
 */
export function setMatchSEO(petName: string): void {
  updateSEO({
    title: `It's a Match with ${petName}! | PawfectMatch`,
    description: `You've matched with ${petName}! Start chatting and plan your first playdate.`,
    type: 'website',
  });
}

