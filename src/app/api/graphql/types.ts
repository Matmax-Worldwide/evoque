import { NextRequest } from 'next/server';

// Definición de los tipos de usuario y sesión
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: {
    id: string;
    name: string;
  };
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
}

// Contexto para los resolvers de GraphQL
export interface Context {
  req: NextRequest;
  session?: Session;
}

// Tipo para permisos específicos de usuario
export interface UserPermission {
  id: string;
  userId: string;
  permissionName: string;
  granted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipo para roles
export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tipo para permisos
export interface Permission {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
} 

// Tipo para elemento de menú
export interface MenuItem {
  id: string;
  menuId: string;
  parentId: string | null;
  title: string;
  url: string | null;
  pageId: string | null;
  target: string | null;
  icon: string | null;
  order: number;
  children?: MenuItem[];
  parent?: MenuItem;
  menu?: Menu;
  page?: PageBasic;
}

// Tipo simplificado de página para uso en menús
export interface PageBasic {
  id: string;
  title: string;
  slug: string;
}

// Tipo para menú completo
export interface Menu {
  id: string;
  name: string;
  location: string | null;
  items: MenuItem[];
  headerStyle?: HeaderStyle | null;
  footerStyle?: FooterStyle | null;
}

// Tipo para estilo de header
export interface HeaderStyle {
  id: string;
  menuId: string;
  transparency?: number;
  headerSize?: HeaderSize;
  menuAlignment?: MenuAlignment;
  menuButtonStyle?: MenuButtonStyle;
  mobileMenuStyle?: MobileMenuStyle;
  mobileMenuPosition?: MobileMenuPosition;
  transparentHeader?: boolean;
  borderBottom?: boolean;
  advancedOptions?: Record<string, unknown>;
}

// Tipo para estilo de footer
export interface FooterStyle {
  id: string;
  menuId: string;
  transparency?: number;
  columnLayout?: 'stacked' | 'grid' | 'flex';
  socialAlignment?: 'left' | 'center' | 'right';
  borderTop?: boolean;
  alignment?: 'left' | 'center' | 'right';
  padding?: 'small' | 'medium' | 'large';
  width?: 'full' | 'container' | 'narrow';
  advancedOptions?: Record<string, unknown>;
}

// Tipos de enum para estilos de header
export enum HeaderSize {
  sm = 'sm',
  md = 'md',
  lg = 'lg'
}

export enum MenuAlignment {
  left = 'left',
  center = 'center',
  right = 'right'
}

export enum MenuButtonStyle {
  default = 'default',
  filled = 'filled',
  outline = 'outline'
}

export enum MobileMenuStyle {
  fullscreen = 'fullscreen',
  dropdown = 'dropdown',
  sidebar = 'sidebar'
}

export enum MobileMenuPosition {
  left = 'left',
  right = 'right'
}

// Tipo para componente CMS
export interface CMSComponent {
  id: string;
  type: ComponentType;
  data: Record<string, unknown>;
}

// Tipo para sección CMS
export interface CMSSection {
  id: string;
  sectionId: string;
  name?: string;
  description?: string;
  order?: number;
  lastUpdated: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy?: string | null;
  components: SectionComponent[];
}

// Tipo para componente de sección
export interface SectionComponent {
  id: string;
  sectionId: string;
  componentId: string;
  order: number;
  data?: Record<string, unknown>;
  component?: CMSComponent;
}


// solo queda SectionData para renderizado interno
export interface SectionData {
  id: string;
  title?: string;
  order: number;
  components: CMSComponent[];
}

// Interfaz para datos de sección en renderizado interno
export interface SectionData {
  id: string;
  title?: string;
  order: number;
  components: CMSComponent[];
}

// Tipos de enum para página
export enum PageType {
  CONTENT = 'CONTENT',
  LANDING = 'LANDING',
  BLOG = 'BLOG',
  PRODUCT = 'PRODUCT',
  CATEGORY = 'CATEGORY',
  TAG = 'TAG',
  HOME = 'HOME',
  CONTACT = 'CONTACT',
  ABOUT = 'ABOUT',
  CUSTOM = 'CUSTOM'
}

export enum ScrollType {
  NORMAL = 'NORMAL',
  SMOOTH = 'SMOOTH'
}

// Tipos de componentes
export enum ComponentType {
  HERO = 'HERO',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  GALLERY = 'GALLERY',
  VIDEO = 'VIDEO',
  FORM = 'FORM',
  CARDS = 'CARDS',
  TESTIMONIALS = 'TESTIMONIALS',
  CTA = 'CTA',
  FAQ = 'FAQ',
  FEATURES = 'FEATURES',
  PRICING = 'PRICING',
  TEAM = 'TEAM',
  BENEFITS = 'BENEFITS',
  CONTACT = 'CONTACT',
  SERVICES = 'SERVICES',
  HEADER = 'HEADER',
  FOOTER = 'FOOTER',
  CARD = 'CARD',
  BENEFIT = 'BENEFIT',
  FEATURE = 'FEATURE',
  TESTIMONIAL = 'TESTIMONIAL',
  CUSTOM = 'CUSTOM'
}

// Tipo para SEO de página
export interface PageSEO {
  id: string;
  pageId: string;
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
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Tipo completo para página
export interface Page {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  template: string;
  isPublished: boolean;
  publishDate?: string | Date | null;
  featuredImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  parentId?: string | null;
  order?: number;
  pageType: PageType | string;
  locale?: string;
  scrollType?: ScrollType | string;
  createdAt: string | Date;
  updatedAt: string | Date;
  parent?: Page | null;
  children?: Page[];
  seo?: PageSEO | null;
  sections?: CMSSection[];
}