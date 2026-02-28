export interface Reply {
  id: string;
  content: string;
  timestamp: string;
  isPrivate: boolean;
}

export interface Reactions {
  feltThis: number;
  stayStrong: number;
  beautiful: number;
  magical: number;
}

export interface Confession {
  id: string;
  to: string;
  from: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isTrending?: boolean;
  mood?: 'Love' | 'Heartbreak' | 'Secret Crush' | 'Regret' | 'Appreciation' | 'Passion';
  secretCode?: string;
  expiryDate?: string;
  replies?: Reply[];
  reactions?: Reactions;
  music?: {
    title: string;
    artist: string;
    audioUrl?: string;
  };
  rawConfession?: string;
}

export type View = 'feed' | 'compose' | 'liked' | 'my-hearts' | 'dashboard';
