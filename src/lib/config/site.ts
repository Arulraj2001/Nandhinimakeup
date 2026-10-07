export interface NavItem {
  title: string;
  href: string;
}

export interface SiteConfig {
  name: string;
  shortDescription: string;
  defaultLanguage: string;
  primaryWhatsAppNumber: string;
  nav: NavItem[];
}

export const siteConfig: SiteConfig = {
  name: "[BUSINESS NAME]",
  shortDescription:
    "Professional beauty parlour, bridal makeup artistry, and curated jewellery accessories.",
  defaultLanguage: "en",
  primaryWhatsAppNumber: "",
  nav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Services",
      href: "/services",
    },
  ],
};
