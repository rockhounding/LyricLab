// Genre and sub-genre data
export const GENRES = {
  'Rock': ['Classic Rock', 'Indie Rock', 'Alternative Rock', 'Hard Rock', 'Punk Rock', 'Progressive Rock', 'Grunge'],
  'Pop': ['Synth Pop', 'Electropop', 'Dance Pop', 'Indie Pop', 'Art Pop', 'Trap Pop', 'K-Pop'],
  'Hip-Hop/Rap': ['Trap', 'Boom Bap', 'Conscious Rap', 'Gangsta Rap', 'Pop Rap', 'Mumble Rap', 'Country Hip-Hop'],
  'Country': ['Traditional Country', 'Country Pop', 'Country Rock', 'Outlaw Country', 'Country Hip-Hop', 'Bro-Country'],
  'R&B': ['Contemporary R&B', 'Neo-Soul', 'Quiet Storm', 'New Jack Swing', 'Alternative R&B'],
  'Electronic': ['House', 'Techno', 'Dubstep', 'Drum & Bass', 'Trance', 'Ambient', 'EDM'],
  'Metal': ['Heavy Metal', 'Death Metal', 'Black Metal', 'Thrash Metal', 'Nu Metal', 'Metalcore', 'Power Metal'],
  'Emo': ['Midwest Emo', 'Screamo', 'Post-Hardcore', 'Emo Pop', 'Emo Rap'],
  'Jazz': ['Bebop', 'Smooth Jazz', 'Jazz Fusion', 'Vocal Jazz', 'Acid Jazz'],
  'Folk': ['Indie Folk', 'Folk Rock', 'Americana', 'Contemporary Folk', 'Freak Folk'],
  'Punk': ['Pop Punk', 'Hardcore Punk', 'Post-Punk', 'Ska Punk', 'Crust Punk'],
  'Alternative': ['Shoegaze', 'Dream Pop', 'Post-Rock', 'Noise Rock', 'Slowcore'],
  'Latin': ['Reggaeton', 'Latin Pop', 'Bachata', 'Salsa', 'Latin Trap'],
  'Soul': ['Classic Soul', 'Southern Soul', 'Psychedelic Soul', 'Blue-Eyed Soul'],
};

export const MOODS = [
  'Happy', 'Sad', 'Angry', 'Melancholic', 'Hopeful', 'Nostalgic', 
  'Romantic', 'Empowering', 'Rebellious', 'Peaceful', 'Anxious',
  'Euphoric', 'Bittersweet', 'Dark', 'Playful', 'Intense'
];

export const PERSPECTIVES = [
  { value: 'I', label: 'First Person (I/Me)' },
  { value: 'You', label: 'Second Person (You)' },
  { value: 'We', label: 'First Person Plural (We)' },
  { value: '3rd', label: 'Third Person (He/She/They)' },
];

export const STRUCTURES = [
  'Verse/Chorus/Verse/Chorus/Bridge/Chorus',
  'Verse/Hook/Verse/Hook',
  'Verse/Pre-Chorus/Chorus/Verse/Pre-Chorus/Chorus/Bridge/Chorus',
  'Intro/Verse/Chorus/Verse/Chorus/Outro',
  'Verse/Verse/Chorus/Verse/Chorus',
  'AABA (32-bar)',
  'Through-composed (no repeats)',
];

export const RHYME_SCHEMES = [
  { value: 'AABB', label: 'AABB (Couplets)' },
  { value: 'ABAB', label: 'ABAB (Alternate)' },
  { value: 'ABCB', label: 'ABCB (Ballad)' },
  { value: 'ABBA', label: 'ABBA (Enclosed)' },
  { value: 'Loose', label: 'Loose/Free' },
  { value: 'Monorhyme', label: 'Monorhyme Burst' },
  { value: 'Internal', label: 'Internal Focus' },
];

export const PROFANITY_OPTIONS = [
  { value: 'None', label: 'None' },
  { value: 'Mild', label: 'Mild' },
  { value: 'Allow', label: 'Allow' },
];

export const SECTIONS = ['Verse 1', 'Chorus', 'Verse 2', 'Bridge', 'Pre-Chorus', 'Outro', 'Intro'];

export const defaultSongSpec = {
  title: '',
  topic: '',
  genre: '',
  subgenre: '',
  mood: '',
  custom_mood: '',
  perspective: 'I',
  structure: 'Verse/Chorus/Verse/Chorus/Bridge/Chorus',
  rhyme_scheme: 'AABB',
  rhyme_variety: 50,
  internal_rhyme_density: 25,
  cadence_complexity: 50,
  imagery_progression: false,
  word_choice: 50,
  directness: 50,
  profanity: 'None',
  forbidden_words: [],
  ai_freedom: 50,
  sample_lyrics: '',
};
