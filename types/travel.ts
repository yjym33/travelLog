export interface TravelLog {
  id: string;
  userId: string;
  lat: number;
  lng: number;
  placeName: string;
  country: string;
  emotion: string;
  photos: string[];
  diary: string;
  tags: string[];
  createdAt: string;
}

export interface Emotion {
  color: string;
  emoji: string;
  label: string;
}
