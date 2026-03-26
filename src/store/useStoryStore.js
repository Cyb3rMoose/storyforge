import { create } from 'zustand'

const MOCK_ANIMATIONS = [
  {
    id: '1',
    title: "The Dragon's Lost Treasure",
    audience: 'Kids (6-10)',
    style: 'Cartoon',
    characters: ['Ember the Dragon', 'Luna the Fairy', 'Griff the Knight'],
    source: 'prompt',
    prompt: 'A dragon searching for its lost treasure with a fairy companion',
    date: 'Mar 15, 2025',
    duration: '3:24',
    scenes: 6,
    thumb: { from: '#4c1d95', via: '#7c3aed', to: '#ec4899' },
    description: 'Ember, a young dragon with golden scales, teams up with Luna the fairy to recover a legendary gem stolen by the shadow wolves.',
    sceneList: [
      { id: 's1', label: 'Scene 1', desc: 'Ember wakes in the dragon cave', from: '#1a0533', to: '#4c1d95' },
      { id: 's2', label: 'Scene 2', desc: 'Meeting Luna at the Crystal Spring', from: '#0f2d4a', to: '#1e40af' },
      { id: 's3', label: 'Scene 3', desc: 'Entering the Enchanted Forest', from: '#064e3b', to: '#047857' },
      { id: 's4', label: 'Scene 4', desc: 'Confronting the Shadow Wolves', from: '#1c1917', to: '#44403c' },
      { id: 's5', label: 'Scene 5', desc: 'The final showdown at Shadow Peak', from: '#450a0a', to: '#991b1b' },
      { id: 's6', label: 'Scene 6', desc: 'Victory and the treasure returned', from: '#713f12', to: '#92400e' },
    ],
  },
  {
    id: '2',
    title: "Luna's Space Adventure",
    audience: 'Toddlers',
    style: 'Watercolor',
    characters: ['Luna', 'Cosmo the Robot', 'Star the Space Cat'],
    source: 'recording',
    date: 'Mar 14, 2025',
    duration: '2:15',
    scenes: 4,
    thumb: { from: '#0f172a', via: '#1e3a5f', to: '#3b82f6' },
    description: 'Little Luna blasts off in her bubble spaceship to find the missing stars that keep the moon company at night.',
    sceneList: [
      { id: 's1', label: 'Scene 1', desc: 'Launch day at the star dock', from: '#0f172a', to: '#1e3a5f' },
      { id: 's2', label: 'Scene 2', desc: 'Flying through the nebula', from: '#1e1b4b', to: '#3730a3' },
      { id: 's3', label: 'Scene 3', desc: 'Finding the lost stars', from: '#1a1a2e', to: '#312e81' },
      { id: 's4', label: 'Scene 4', desc: 'Home to the moon', from: '#0a0a1a', to: '#1e3a5f' },
    ],
  },
  {
    id: '3',
    title: "The Brave Little Robot",
    audience: 'Kids (6-10)',
    style: '3D Animated',
    characters: ['Bolt the Robot', 'Spark', 'Professor Gear'],
    source: 'recording',
    date: 'Mar 13, 2025',
    duration: '4:10',
    scenes: 8,
    thumb: { from: '#022c22', via: '#064e3b', to: '#10b981' },
    description: "A small but determined robot named Bolt discovers he can do anything when he sets his circuits to it.",
    sceneList: [
      { id: 's1', label: 'Scene 1', desc: 'Bolt rolls out of the factory', from: '#022c22', to: '#064e3b' },
      { id: 's2', label: 'Scene 2', desc: 'The big robot challenge', from: '#052e16', to: '#166534' },
      { id: 's3', label: 'Scene 3', desc: 'Meeting Professor Gear', from: '#1c1917', to: '#3d2c1a' },
      { id: 's4', label: 'Scene 4', desc: 'Training montage', from: '#0c4a6e', to: '#0369a1' },
    ],
  },
]

const useStoryStore = create((set, get) => ({
  // ── Input mode ────────────────────────────────
  inputMode: 'record', // 'record' | 'prompt'
  setInputMode: (mode) => set({ inputMode: mode }),

  // ── Recordings ────────────────────────────────
  recordings: [],
  addRecording: (rec) => set((s) => ({ recordings: [rec, ...s.recordings] })),
  removeRecording: (id) => set((s) => ({ recordings: s.recordings.filter((r) => r.id !== id) })),

  // ── Prompt ────────────────────────────────────
  storyPrompt: '',
  setStoryPrompt: (text) => set({ storyPrompt: text }),

  // ── Generation settings ───────────────────────
  selectedAudience: null,
  setSelectedAudience: (a) => set({ selectedAudience: a }),

  selectedStyle: null,
  setSelectedStyle: (s) => set({ selectedStyle: s }),

  selectedLength: '5s',
  setSelectedLength: (l) => set({ selectedLength: l }),

  // ── Animations ────────────────────────────────
  animations: MOCK_ANIMATIONS,
  addAnimation: (anim) => set((s) => ({ animations: [anim, ...s.animations] })),

  // ── Books ─────────────────────────────────────
  books: [],
  addBook: (book) => set((s) => ({ books: [book, ...s.books] })),

  // ── Derived helpers ───────────────────────────
  getAnimation: (id) => get().animations.find((a) => a.id === id),
}))

export default useStoryStore
