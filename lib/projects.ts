export type Category = 'Residential' | 'Commercial' | 'Institutional' | 'Private' | 'Sketch'
export type ItemKind = 'render' | 'sketch'

export interface WorkItem {
  id: string
  title: string
  category: Category
  kind: ItemKind
  image: string   /* path served from /public */
}

/* ── Every render and sketch is its own entity with its own detail page ──────
   Images served from /assets/web/small/ for consistent naming + performance  */

export const workItems: WorkItem[] = [
  /* ── RESIDENTIAL ─────────────────────────────────────────────────────────── */
  {
    id: 'apartment-himagiri',
    title: 'Himagiri View',
    category: 'Residential',
    kind: 'render',
    image: '/assets/web/small/apartment-himagiri.jpg',
  },
  {
    id: 'apartment-east-wood',
    title: 'East Wood Complex',
    category: 'Residential',
    kind: 'render',
    image: '/assets/web/small/apartment-east-wood.jpg',
  },
  {
    id: 'apartment-krs',
    title: 'KRS Development I',
    category: 'Residential',
    kind: 'render',
    image: '/assets/web/small/apartment-krs.jpg',
  },
  {
    id: 'apartment-krs-02',
    title: 'KRS Development II',
    category: 'Residential',
    kind: 'render',
    image: '/assets/web/small/apartment-krs-02.jpg',
  },
  {
    id: 'apartment-park-avenue',
    title: 'Park Avenue — Aerial',
    category: 'Residential',
    kind: 'render',
    image: '/assets/web/small/apartment-park-avenue.jpg',
  },
  {
    id: 'apartment-pioneer',
    title: 'Pioneer Complex',
    category: 'Residential',
    kind: 'render',
    image: '/assets/web/small/apartment-pioneer.jpg',
  },
  {
    id: 'apartment-pioneers-kengari',
    title: 'Pioneers Kengari',
    category: 'Residential',
    kind: 'render',
    image: '/assets/web/small/apartment-pioneers-kengari.jpg',
  },
  {
    id: 'apartment-side-view',
    title: 'Residential Block — Side Elevation',
    category: 'Residential',
    kind: 'render',
    image: '/assets/web/small/apartment-side-view.jpg',
  },

  /* ── COMMERCIAL ───────────────────────────────────────────────────────────── */
  {
    id: 'commercial-clouds-wood',
    title: 'Clouds Wood Technology',
    category: 'Commercial',
    kind: 'render',
    image: '/assets/web/small/commercial-clouds-wood.jpg',
  },
  {
    id: 'commercial-c1',
    title: 'Commercial Elevation I',
    category: 'Commercial',
    kind: 'render',
    image: '/assets/web/small/commercial-c1.jpg',
  },
  {
    id: 'commercial-c8',
    title: 'Commercial Elevation II',
    category: 'Commercial',
    kind: 'render',
    image: '/assets/web/small/commercial-c8.jpg',
  },
  {
    id: 'commercial-gangaiah',
    title: 'Gangaiah Commercial',
    category: 'Commercial',
    kind: 'render',
    image: '/assets/web/small/commercial-gangaiah.jpg',
  },
  {
    id: 'commercial-marbel',
    title: 'Marbel Campus',
    category: 'Commercial',
    kind: 'render',
    image: '/assets/web/small/commercial-marbel.jpg',
  },
  {
    id: 'commercial-nagraj',
    title: 'Nagraj Commercial',
    category: 'Commercial',
    kind: 'render',
    image: '/assets/web/small/commercial-nagraj.jpg',
  },
  {
    id: 'commercial-sahara',
    title: 'Sahara Labels — Elevation',
    category: 'Commercial',
    kind: 'render',
    image: '/assets/web/small/commercial-sahara.jpg',
  },

  /* ── INSTITUTIONAL ────────────────────────────────────────────────────────── */
  {
    id: 'institution-arvind-college',
    title: 'Arvind College',
    category: 'Institutional',
    kind: 'render',
    image: '/assets/web/small/institution-arvind-college.jpg',
  },
  {
    id: 'institution-arvind-hostel',
    title: 'Arvind Hostel',
    category: 'Institutional',
    kind: 'render',
    image: '/assets/web/small/institution-arvind-hostel.jpg',
  },
  {
    id: 'institution-nallur-school',
    title: 'Nallur School',
    category: 'Institutional',
    kind: 'render',
    image: '/assets/web/small/institution-nallur-school.jpg',
  },
  {
    id: 'school-arvind',
    title: 'Arvind School',
    category: 'Institutional',
    kind: 'render',
    image: '/assets/web/small/school-arvind.jpg',
  },
  {
    id: 'school-mahavidyalaya',
    title: 'Mahavidyalaya Admin Block',
    category: 'Institutional',
    kind: 'render',
    image: '/assets/web/small/school-mahavidyalaya.jpg',
  },

  /* ── PRIVATE ──────────────────────────────────────────────────────────────── */
  {
    id: 'bungalow-arshia-house-view',
    title: 'Arshia House',
    category: 'Private',
    kind: 'render',
    image: '/assets/web/small/bungalow-arshia-house-view.jpg',
  },
  {
    id: 'bungalow-lokesh-cm',
    title: 'Lokesh Residence',
    category: 'Private',
    kind: 'render',
    image: '/assets/web/small/bungalow-lokesh-cm.jpg',
  },
  {
    id: 'bungalow-munirathna',
    title: 'Munirathna Residence',
    category: 'Private',
    kind: 'render',
    image: '/assets/web/small/bungalow-munirathna.jpg',
  },
  {
    id: 'residence-chandrashekar',
    title: 'Chandrashekar Residence',
    category: 'Private',
    kind: 'render',
    image: '/assets/web/small/residence-chandrashekar.jpg',
  },
  {
    id: 'residence-deepak',
    title: 'Deepak Residence',
    category: 'Private',
    kind: 'render',
    image: '/assets/web/small/residence-deepak.jpg',
  },
  {
    id: 'residence-kumar',
    title: 'Kumar Residence',
    category: 'Private',
    kind: 'render',
    image: '/assets/web/small/residence-kumar.jpg',
  },
  {
    id: 'residence-nagaraj',
    title: 'Nagaraj Residence',
    category: 'Private',
    kind: 'render',
    image: '/assets/web/small/residence-nagaraj.jpg',
  },

  /* ── SKETCHES ─────────────────────────────────────────────────────────────── */
  {
    id: 'sketch-ashok-kumar',
    title: 'Ashok Kumar — Study I',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-ashok-kumar.jpg',
  },
  {
    id: 'sketch-ashok-kumar-02',
    title: 'Ashok Kumar — Study II',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-ashok-kumar-02.jpg',
  },
  {
    id: 'sketch-mahaveer',
    title: 'Mahaveer — Concept I',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-mahaveer.jpg',
  },
  {
    id: 'sketch-mahaveer-02',
    title: 'Mahaveer — Concept II',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-mahaveer-02.jpg',
  },
  {
    id: 'sketch-mahaveer-rehman',
    title: 'Mahaveer Rehman — Concept',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-mahaveer-rehman.jpg',
  },
  {
    id: 'sketch-nanda-comm',
    title: 'Nanda Commercial — Study',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-nanda-comm.jpg',
  },
  {
    id: 'sketch-pioneer-rehman',
    title: 'Pioneer Rehman — Concept',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-pioneer-rehman.jpg',
  },
  {
    id: 'sketch-prabhakar',
    title: 'Prabhakar House — Study',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-prabhakar.jpg',
  },
  {
    id: 'sketch-prashant',
    title: 'Prashant — Concept',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-prashant.jpg',
  },
  {
    id: 'sketch-ramesh',
    title: 'Ramesh — Study',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-ramesh.jpg',
  },
  {
    id: 'sketch-school',
    title: 'School — Concept',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-school.jpg',
  },
  {
    id: 'sketch-sukesh',
    title: 'Sukesh — Study',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-sukesh.jpg',
  },
  {
    id: 'sketch-venugopal',
    title: 'Venugopal — Concept',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-venugopal.jpg',
  },
]

/* ── Category config ─────────────────────────────────────────────────────── */
export interface CategoryConfig {
  slug:       string
  label:      string
  value:      Category
  heroImage:  string   /* best single render to represent the category */
  description: string
}

export const CATEGORY_CONFIG: CategoryConfig[] = [
  {
    slug:        'residential',
    label:       'Residential',
    value:       'Residential',
    heroImage:   '/assets/web/small/apartment-himagiri.jpg',
    description: 'Multi-family complexes & apartment towers',
  },
  {
    slug:        'commercial',
    label:       'Commercial',
    value:       'Commercial',
    heroImage:   '/assets/web/small/commercial-clouds-wood.jpg',
    description: 'Corporate campuses & commercial buildings',
  },
  {
    slug:        'institutional',
    label:       'Institutional',
    value:       'Institutional',
    heroImage:   '/assets/web/small/institution-arvind-college.jpg',
    description: 'Schools, colleges & institutional complexes',
  },
  {
    slug:        'private',
    label:       'Private',
    value:       'Private',
    heroImage:   '/assets/web/small/bungalow-arshia-house-view.jpg',
    description: 'Private residences & bungalows',
  },
  {
    slug:        'sketches',
    label:       'Sketches',
    value:       'Sketch',
    heroImage:   '/assets/web/small/sketches/sketch-pioneer-rehman.jpg',
    description: 'Concept sketches & architectural studies',
  },
]

/** Returns all workItems matching a category slug */
export function getItemsByCategory(slug: string): WorkItem[] {
  const config = CATEGORY_CONFIG.find(c => c.slug === slug)
  if (!config) return []
  return workItems.filter(w =>
    config.value === 'Sketch' ? w.kind === 'sketch' : w.category === config.value
  )
}
