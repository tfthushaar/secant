export type Category = 'Residential' | 'Commercial' | 'Institutional' | 'Private' | 'Sketch'
export type ItemKind = 'render' | 'sketch'

export interface WorkItem {
  id: string
  title: string
  category: Category
  kind: ItemKind
  image: string         /* small/ — used for gallery sphere atlas (fast load)    */
  detailImage?: string  /* large/ — full-quality for the detail page, if present */
}

/*
  image:       /assets/web/small/  — web-optimised (120–280 KB). Used by the
               InfiniteMenu sphere gallery which loads many images at once.
  detailImage: /assets/web/large/  — best available quality (300 KB–1.5 MB).
               Only exists for files ≤ 2 MB; larger originals (10–37 MB) stay
               on small/ to keep page loads fast.
               Detail page: uses detailImage when present, falls back to image.
*/

export const workItems: WorkItem[] = [
  /* ── RESIDENTIAL ─────────────────────────────────────────────────────────── */
  {
    id: 'apartment-himagiri',
    title: 'Himagiri View',
    category: 'Residential',
    kind: 'render',
    image: '/assets/web/small/apartment-himagiri.jpg',
    /* original 4 MB — small is better for web */
  },
  {
    id: 'apartment-east-wood',
    title: 'East Wood Complex',
    category: 'Residential',
    kind: 'render',
    image: '/assets/web/small/apartment-east-wood.jpg',
    detailImage: '/assets/web/large/apartment-east-wood.jpg',  /* 949 KB */
  },
  {
    id: 'apartment-krs',
    title: 'KRS Development I',
    category: 'Residential',
    kind: 'render',
    image: '/assets/web/small/apartment-krs.jpg',
    /* original 10.5 MB — small is better for web */
  },
  {
    id: 'apartment-krs-02',
    title: 'KRS Development II',
    category: 'Residential',
    kind: 'render',
    image: '/assets/web/small/apartment-krs-02.jpg',
    /* original 7 MB — small is better for web */
  },
  {
    id: 'apartment-park-avenue',
    title: 'Park Avenue — Aerial',
    category: 'Residential',
    kind: 'render',
    image: '/assets/web/small/apartment-park-avenue.jpg',
    /* original 23 MB — small is better for web */
  },
  {
    id: 'apartment-pioneer',
    title: 'Pioneer Complex',
    category: 'Residential',
    kind: 'render',
    image: '/assets/web/small/apartment-pioneer.jpg',
    detailImage: '/assets/web/large/apartment-pioneer.jpg',    /* 1.5 MB */
  },
  {
    id: 'apartment-pioneers-kengari',
    title: 'Pioneers Kengari',
    category: 'Residential',
    kind: 'render',
    image: '/assets/web/small/apartment-pioneers-kengari.jpg',
    /* original 21 MB — small is better for web */
  },
  {
    id: 'apartment-side-view',
    title: 'Residential Block — Side Elevation',
    category: 'Residential',
    kind: 'render',
    image: '/assets/web/small/apartment-side-view.jpg',
    /* original 37 MB — small is better for web */
  },

  /* ── COMMERCIAL ───────────────────────────────────────────────────────────── */
  {
    id: 'commercial-clouds-wood',
    title: 'Clouds Wood Technology',
    category: 'Commercial',
    kind: 'render',
    image: '/assets/web/small/commercial-clouds-wood.jpg',
    /* original 17 MB — small is better for web */
  },
  {
    id: 'commercial-c1',
    title: 'Commercial Elevation I',
    category: 'Commercial',
    kind: 'render',
    image: '/assets/web/small/commercial-c1.jpg',
    /* original 5.3 MB — small is better for web */
  },
  {
    id: 'commercial-c8',
    title: 'Commercial Elevation II',
    category: 'Commercial',
    kind: 'render',
    image: '/assets/web/small/commercial-c8.jpg',
    /* original 46 KB — same size, small is fine */
  },
  {
    id: 'commercial-gangaiah',
    title: 'Gangaiah Commercial',
    category: 'Commercial',
    kind: 'render',
    image: '/assets/web/small/commercial-gangaiah.jpg',
    detailImage: '/assets/web/large/commercial-gangaiah.jpg',  /* 754 KB */
  },
  {
    id: 'commercial-marbel',
    title: 'Marbel Campus',
    category: 'Commercial',
    kind: 'render',
    image: '/assets/web/small/commercial-marbel.jpg',
    /* original 5.6 MB — small is better for web */
  },
  {
    id: 'commercial-nagraj',
    title: 'Nagraj Commercial',
    category: 'Commercial',
    kind: 'render',
    image: '/assets/web/small/commercial-nagraj.jpg',
    detailImage: '/assets/web/large/commercial-nagraj.jpg',    /* 972 KB */
  },
  {
    id: 'commercial-sahara',
    title: 'Sahara Labels — Elevation',
    category: 'Commercial',
    kind: 'render',
    image: '/assets/web/small/commercial-sahara.jpg',
    /* original 3.7 MB — small is better for web */
  },

  /* ── INSTITUTIONAL ────────────────────────────────────────────────────────── */
  {
    id: 'institution-arvind-college',
    title: 'Arvind College',
    category: 'Institutional',
    kind: 'render',
    image: '/assets/web/small/institution-arvind-college.jpg',
    /* original 6.4 MB — small is better for web */
  },
  {
    id: 'institution-arvind-hostel',
    title: 'Arvind Hostel',
    category: 'Institutional',
    kind: 'render',
    image: '/assets/web/small/institution-arvind-hostel.jpg',
    /* original 10.5 MB — small is better for web */
  },
  {
    id: 'institution-nallur-school',
    title: 'Nallur School',
    category: 'Institutional',
    kind: 'render',
    image: '/assets/web/small/institution-nallur-school.jpg',
    /* original 33 MB — small is better for web */
  },
  {
    id: 'school-arvind',
    title: 'Arvind School',
    category: 'Institutional',
    kind: 'render',
    image: '/assets/web/small/school-arvind.jpg',
    detailImage: '/assets/web/large/school-arvind.jpg',        /* 809 KB */
  },
  {
    id: 'school-mahavidyalaya',
    title: 'Mahavidyalaya Admin Block',
    category: 'Institutional',
    kind: 'render',
    image: '/assets/web/small/school-mahavidyalaya.jpg',
    detailImage: '/assets/web/large/school-mahavidyalaya.jpg', /* 291 KB */
  },

  /* ── PRIVATE ──────────────────────────────────────────────────────────────── */
  {
    id: 'bungalow-arshia-house-view',
    title: 'Arshia House',
    category: 'Private',
    kind: 'render',
    image: '/assets/web/small/bungalow-arshia-house-view.jpg',
    detailImage: '/assets/web/large/bungalow-arshia-house-view.jpg', /* 873 KB */
  },
  {
    id: 'bungalow-lokesh-cm',
    title: 'Lokesh Residence',
    category: 'Private',
    kind: 'render',
    image: '/assets/web/small/bungalow-lokesh-cm.jpg',
    detailImage: '/assets/web/large/bungalow-lokesh-cm.jpg',   /* 367 KB */
  },
  {
    id: 'bungalow-munirathna',
    title: 'Munirathna Residence',
    category: 'Private',
    kind: 'render',
    image: '/assets/web/small/bungalow-munirathna.jpg',
    /* original 3.6 MB — small is better for web */
  },
  {
    id: 'residence-chandrashekar',
    title: 'Chandrashekar Residence',
    category: 'Private',
    kind: 'render',
    image: '/assets/web/small/residence-chandrashekar.jpg',
    /* original 6.7 MB — small is better for web */
  },
  {
    id: 'residence-deepak',
    title: 'Deepak Residence',
    category: 'Private',
    kind: 'render',
    image: '/assets/web/small/residence-deepak.jpg',
    /* original 10.5 MB — small is better for web */
  },
  {
    id: 'residence-kumar',
    title: 'Kumar Residence',
    category: 'Private',
    kind: 'render',
    image: '/assets/web/small/residence-kumar.jpg',
    /* original 10 MB — small is better for web */
  },
  {
    id: 'residence-nagaraj',
    title: 'Nagaraj Residence',
    category: 'Private',
    kind: 'render',
    image: '/assets/web/small/residence-nagaraj.jpg',
    /* original 16.8 MB — small is better for web */
  },

  /* ── SKETCHES — all originals ≤ 1.7 MB, fine for detail pages ──────────── */
  {
    id: 'sketch-ashok-kumar',
    title: 'Ashok Kumar — Study I',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-ashok-kumar.jpg',
    detailImage: '/assets/web/large/sketches/sketch-ashok-kumar.jpg',
  },
  {
    id: 'sketch-ashok-kumar-02',
    title: 'Ashok Kumar — Study II',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-ashok-kumar-02.jpg',
    detailImage: '/assets/web/large/sketches/sketch-ashok-kumar-02.jpg',
  },
  {
    id: 'sketch-mahaveer',
    title: 'Mahaveer — Concept I',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-mahaveer.jpg',
    detailImage: '/assets/web/large/sketches/sketch-mahaveer.jpg',
  },
  {
    id: 'sketch-mahaveer-02',
    title: 'Mahaveer — Concept II',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-mahaveer-02.jpg',
    detailImage: '/assets/web/large/sketches/sketch-mahaveer-02.jpg',
  },
  {
    id: 'sketch-mahaveer-rehman',
    title: 'Mahaveer Rehman — Concept',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-mahaveer-rehman.jpg',
    detailImage: '/assets/web/large/sketches/sketch-mahaveer-rehman.jpg',
  },
  {
    id: 'sketch-nanda-comm',
    title: 'Nanda Commercial — Study',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-nanda-comm.jpg',
    detailImage: '/assets/web/large/sketches/sketch-nanda-comm.jpg',
  },
  {
    id: 'sketch-pioneer-rehman',
    title: 'Pioneer Rehman — Concept',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-pioneer-rehman.jpg',
    detailImage: '/assets/web/large/sketches/sketch-pioneer-rehman.jpg',
  },
  {
    id: 'sketch-prabhakar',
    title: 'Prabhakar House — Study',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-prabhakar.jpg',
    detailImage: '/assets/web/large/sketches/sketch-prabhakar.jpg',
  },
  {
    id: 'sketch-prashant',
    title: 'Prashant — Concept',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-prashant.jpg',
    detailImage: '/assets/web/large/sketches/sketch-prashant.jpg',
  },
  {
    id: 'sketch-ramesh',
    title: 'Ramesh — Study',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-ramesh.jpg',
    detailImage: '/assets/web/large/sketches/sketch-ramesh.jpg',
  },
  {
    id: 'sketch-school',
    title: 'School — Concept',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-school.jpg',
    detailImage: '/assets/web/large/sketches/sketch-school.jpg',
  },
  {
    id: 'sketch-sukesh',
    title: 'Sukesh — Study',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-sukesh.jpg',
    detailImage: '/assets/web/large/sketches/sketch-sukesh.jpg',
  },
  {
    id: 'sketch-venugopal',
    title: 'Venugopal — Concept',
    category: 'Sketch',
    kind: 'sketch',
    image: '/assets/web/small/sketches/sketch-venugopal.jpg',
    detailImage: '/assets/web/large/sketches/sketch-venugopal.jpg',
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
