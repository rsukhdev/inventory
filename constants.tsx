
export const COLORS = {
  primary: '#4f46e5',
  secondary: '#64748b',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
};

export const INITIAL_FABRICS: any[] = [
  {
    id: '1',
    name: 'BLACKOUT',
    category: 'Curtain',
    color: 'Color #1',
    rolls: [
      { id: 'r1', lotNumber: '12', meters: 100, remarks: 'Fresh Arrival' },
      { id: 'r2', lotNumber: '13', meters: 150, remarks: 'Export Quality' }
    ],
    quantityMeters: 250,
    widthIn: 54,
    gsm: 250,
    composition: '100% Polyester',
    location: 'Rack B-12',
    imageUrl: 'https://picsum.photos/seed/blackout1/400/400',
    lastUpdated: new Date().toISOString(),
    isFavorite: true
  },
  {
    id: '3',
    name: 'LINEN PREMIUM',
    category: 'Suits',
    color: 'Navy Blue',
    rolls: [
      { id: 'r3', lotNumber: '05', meters: 45, remarks: 'End of Bolt' }
    ],
    quantityMeters: 45,
    widthIn: 60,
    gsm: 180,
    composition: '100% Linen',
    location: 'Aisle 3-B',
    imageUrl: 'https://picsum.photos/seed/fabric1/400/400',
    lastUpdated: new Date().toISOString(),
    isFavorite: true
  }
];
