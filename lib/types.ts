// Shapes mirror the original site's CMS records so ported components keep the same props.

export type Media = {
  id: string;
  url: string; // /media/<id>.webp or /media/<id>.mp4
  kind: "image" | "video";
  width: number;
  height: number;
  alt: string;
  caption: string;
  focalX: number;
  focalY: number;
  color: string;
  blurDataUrl: string | null;
  durationS: number | null;
  poster: Media | null;
};

export type Ref = { slug: string; name: string };

export type PuppyStatus = "available" | "reserved" | "home";

export type Puppy = {
  id: string;
  slug: string;
  name: string; // may be "" when the puppy is listed by breed only
  displayName: string;
  breed: string;
  gender: "male" | "female" | "male-female";
  genderLabel: string;
  age: string;
  colour: string;
  description: string;
  records: { label: string; value: string }[];
  status: PuppyStatus;
  featured: boolean;
  seoDescription: string;
  cover: Media | null;
  media: Media[];
  origin: Ref | null;
  collections: Ref[];
  breeds: Ref[];
  published: boolean;
  sortOrder: number;
};

export type HappyPhoto = Media & { sortOrder: number; showOnHome: boolean };

export type Faq = { id: string; question: string; answer: string; sortOrder: number; published?: boolean };

export type Testimonial = { id: string; quote: string; name: string; location: string; sortOrder: number; published?: boolean };

export type Section = {
  page: string;
  key: string;
  heading: string;
  body: string;
  data: Record<string, any>;
  media: Media[];
};

export type Settings = {
  siteName: string;
  shortName: string;
  tagline: string;
  footerHeading: string;
  footerBlurb: string;
  whatsappNumber: string;
  whatsappMessage: string;
  phoneDisplay: string;
  phoneTel: string;
  email: string;
  address: string;
  mapsUrl?: string;
  socials: { label: string; href: string }[];
  seo: { title: string; description: string; ogImage: string };
};

export type Enquiry = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  area: string;
  message: string;
  puppyId: string | null;
  puppyName?: string | null;
  source: "contact" | "puppy";
  status: "new" | "read" | "archived";
};
