import { CMSComponent, CMSSection } from '@/app/api/graphql/types';

export interface Section {
  id: string;
  sectionId: string;
  name?: string;
  type: string;
  data: CMSComponent[];
  order: number;
  description?: string;
  pageId: string;
  componentId?: string;
}

export type ComponentType = 
  | 'Header' 
  | 'Hero' 
  | 'Text' 
  | 'Image' 
  | 'Feature' 
  | 'Testimonial' 
  | 'Card' 
  | 'Benefit' 
  | 'Form' 
  | 'Footer' 
  | 'Article' 
  | 'Blog' 
  | 'CtaButton' 
  | 'Video' 
  | 'Gallery'
  | 'Calendar'
  | 'QRCode'
  | 'Signage'

export interface AvailableSection {
  id: string;
  sectionId: string;
  name: string;
  type: string;
  description?: string;
  pageId: string;
}

export interface PageData {
  id: string;
  title: string;
  slug: string;
  description: string;
  template: string;
  isPublished: boolean;
  pageType: string;
  locale: string;
  sections: CMSSection[];
  metaTitle: string;
  metaDescription: string;
  featuredImage: string;
  isDefault?: boolean;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    canonicalUrl?: string;
    structuredData?: Record<string, unknown>;
  };
}

export interface PageParams {
  locale: string;
  slug: string;
  [key: string]: string;
}

export interface PageResponse {
  id: string;
  title: string;
  slug: string;
  description?: string;
  template?: string;
  isPublished: boolean;
  pageType: string;
  locale?: string;
  sections?: Array<{
    id: string;
    order: number;
    title?: string;
    componentType?: string;
    sectionId?: string;
    data?: Record<string, unknown>;
    isVisible?: boolean;
  }>;
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
  publishDate?: string;
  isDefault?: boolean;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    canonicalUrl?: string;
    structuredData?: Record<string, unknown>;
  };
}

export interface NotificationType {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export interface ManageableSectionHandle {
  saveChanges: (skipLoadingState?: boolean) => Promise<void>;
}

// Header customization types
export type HeaderSize = 'sm' | 'md' | 'lg';
export type MenuAlignment = 'left' | 'center' | 'right';
export type MenuButtonStyle = 'default' | 'filled' | 'outline';
export type MobileMenuStyle = 'fullscreen' | 'dropdown' | 'sidebar';
export type MobileMenuPosition = 'left' | 'right';

export interface HeaderAdvancedOptions {
  glassmorphism?: boolean;
  blur?: number;
  shadow?: string;
  animation?: string;
  customClass?: string;
  borderRadius?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface HeaderStyle {
  id: string;
  menuId: string;
  transparency: number;
  headerSize: HeaderSize;
  menuAlignment: MenuAlignment;
  menuButtonStyle: MenuButtonStyle;
  mobileMenuStyle: MobileMenuStyle;
  mobileMenuPosition: MobileMenuPosition;
  transparentHeader: boolean;
  borderBottom: boolean;
  advancedOptions?: HeaderAdvancedOptions;
  createdAt: string;
  updatedAt: string;
} 