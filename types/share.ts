export interface ShareSettings {
  isPublic: boolean;
  showLocation: LocationVisibility;
  showPhotos: boolean;
  allowComments: boolean;
  shareUrl?: string;
}

export type LocationVisibility = "exact" | "country" | "hidden";

export interface ShareImageOptions {
  template: ShareImageTemplate;
  includeStats: boolean;
  includeMap: boolean;
  backgroundColor: string;
}

export type ShareImageTemplate =
  | "minimal" // 미니멀 디자인
  | "vibrant" // 화려한 디자인
  | "classic" // 클래식 디자인
  | "modern"; // 모던 디자인

export interface SharePlatform {
  id: string;
  name: string;
  icon: string;
  imageSize: { width: number; height: number };
  maxTextLength?: number;
}

export const sharePlatforms: Record<string, SharePlatform> = {
  instagram: {
    id: "instagram",
    name: "Instagram",
    icon: "📷",
    imageSize: { width: 1080, height: 1080 },
  },
  twitter: {
    id: "twitter",
    name: "Twitter",
    icon: "🐦",
    imageSize: { width: 1200, height: 675 },
    maxTextLength: 280,
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    icon: "👥",
    imageSize: { width: 1200, height: 630 },
  },
  link: {
    id: "link",
    name: "링크 복사",
    icon: "🔗",
    imageSize: { width: 1200, height: 630 },
  },
};

export interface PDFExportOptions {
  includeMap: boolean;
  includePhotos: boolean;
  includeDiary: boolean;
  includeStats: boolean;
  pageSize: "A4" | "Letter";
  orientation: "portrait" | "landscape";
}
