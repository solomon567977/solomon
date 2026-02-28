import { Confession } from './types';

export const MOCK_CONFESSIONS: Confession[] = [
  {
    id: '1',
    to: 'Sarah from Biology 101',
    from: 'Anonymous Admirer',
    content: "I see you every Tuesday in the library and I've always wanted to tell you that your smile brightens my entire week. Maybe one day I'll have the courage to say hi. You were wearing that green scarf today and looked stunning.",
    timestamp: '2 hours ago',
    likes: 1200,
    comments: 48,
    shares: 12,
    isTrending: true,
    music: {
      title: "Enchanted (Taylor's Version)",
      artist: "Taylor Swift",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
    }
  },
  {
    id: '2',
    to: 'The guy with the vintage camera',
    from: 'Coffee Shop Regular',
    content: "I see you capturing moments around campus every Friday. I hope one day I'm the one in your viewfinder. Your focus and passion are truly inspiring.",
    timestamp: '5 hours ago',
    likes: 342,
    comments: 12,
    shares: 5,
    music: {
      title: "Fine Line",
      artist: "Harry Styles",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    }
  },
  {
    id: '3',
    to: 'My Lab Partner',
    from: 'Secretly In Love',
    content: "I keep messing up our titration experiments on purpose just to spend five more minutes hearing you explain the process. You're brilliant and I'm just distracted by you.",
    timestamp: '8 hours ago',
    likes: 891,
    comments: 29,
    shares: 21,
    music: {
      title: "Chemistry",
      artist: "Post Malone",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
    }
  }
];
