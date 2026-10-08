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
  name: "Nandhini Makeup & Jewellery",
  shortDescription:
    "Salem's premier bridal makeup artistry, HD wedding makeover parlour, and curated antique jewellery rental.",
  defaultLanguage: "en",
  primaryWhatsAppNumber: "+917010847631",
  nav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Services",
      href: "/services",
    },
    {
      title: "Jewellery",
      href: "/jewellery",
    },
    {
      title: "Gallery",
      href: "/gallery",
    },
    {
      title: "Blog",
      href: "/blog",
    },
    {
      title: "About",
      href: "/about",
    },
    {
      title: "Contact",
      href: "/contact",
    },
  ],
};
