export type Category = 'Apartments' | 'Commercial' | 'Institutions' | 'Interiors' | 'Residences' | 'Sketches'
export type ItemKind = 'render' | 'sketch'

export interface WorkItem {
  id: string
  title: string
  category: Category
  kind: ItemKind
  image: string         /* small/ — fast thumbnail for grids              */
  detailImage?: string  /* originals/ — full-quality for masonry + detail  */
}

export const workItems: WorkItem[] = [
  /* ── APARTMENTS ─────────────────────────────────────────────────────────── */
  {
    id: 'apartment-himagiri',
    title: 'Himagiri View',
    category: 'Apartments', kind: 'render',
    image:       '/assets/web/small/apartment-himagiri.jpg',
    detailImage: '/assets/web/originals/apartments/apartment-himagiri.jpg',
  },
  {
    id: 'apartment-east-wood',
    title: 'East Wood Complex',
    category: 'Apartments', kind: 'render',
    image:       '/assets/web/small/apartment-east-wood.jpg',
    detailImage: '/assets/web/originals/apartments/apartment-east-wood.jpg',
  },
  {
    id: 'apartment-krs',
    title: 'KRS Development I',
    category: 'Apartments', kind: 'render',
    image:       '/assets/web/small/apartment-krs.jpg',
    detailImage: '/assets/web/originals/apartments/apartment-krs.jpg',
  },
  {
    id: 'apartment-krs-02',
    title: 'KRS Development II',
    category: 'Apartments', kind: 'render',
    image:       '/assets/web/small/apartment-krs-02.jpg',
    detailImage: '/assets/web/originals/apartments/apartment-krs-02.jpg',
  },
  {
    id: 'apartment-park-avenue',
    title: 'Park Avenue — Aerial',
    category: 'Apartments', kind: 'render',
    image:       '/assets/web/small/apartment-park-avenue.jpg',
    detailImage: '/assets/web/originals/apartments/apartment-park-avenue.jpg',
  },
  {
    id: 'apartment-pioneer',
    title: 'Pioneer Complex',
    category: 'Apartments', kind: 'render',
    image:       '/assets/web/small/apartment-pioneer.jpg',
    detailImage: '/assets/web/originals/apartments/apartment-pioneer.jpg',
  },
  {
    id: 'apartment-pioneers-kengari',
    title: 'Pioneers Kengari',
    category: 'Apartments', kind: 'render',
    image:       '/assets/web/small/apartment-pioneers-kengari.jpg',
    detailImage: '/assets/web/originals/apartments/apartment-pioneers-kengari.jpg',
  },
  {
    id: 'apartment-side-view',
    title: 'Side Elevation Study',
    category: 'Apartments', kind: 'render',
    image:       '/assets/web/small/apartment-side-view.jpg',
    detailImage: '/assets/web/originals/apartments/apartment-side-view.jpg',
  },

  /* ── COMMERCIAL ───────────────────────────────────────────────────────────── */
  {
    id: 'commercial-clouds-wood',
    title: 'Clouds Wood Technology',
    category: 'Commercial', kind: 'render',
    image:       '/assets/web/small/commercial-clouds-wood.jpg',
    detailImage: '/assets/web/originals/commercial/commercial-clouds-wood.jpg',
  },
  {
    id: 'commercial-c1',
    title: 'Commercial Elevation I',
    category: 'Commercial', kind: 'render',
    image:       '/assets/web/small/commercial-c1.jpg',
    detailImage: '/assets/web/originals/commercial/commercial-c1.jpg',
  },
  {
    id: 'commercial-c8',
    title: 'Commercial Elevation II',
    category: 'Commercial', kind: 'render',
    image:       '/assets/web/small/commercial-c8.jpg',
    detailImage: '/assets/web/originals/commercial/commercial-c8.jpg',
  },
  {
    id: 'commercial-gangaiah',
    title: 'Gangaiah Commercial',
    category: 'Commercial', kind: 'render',
    image:       '/assets/web/small/commercial-gangaiah.jpg',
    detailImage: '/assets/web/originals/commercial/commercial-gangaiah.jpg',
  },
  {
    id: 'commercial-marbel',
    title: 'Marble Campus',
    category: 'Commercial', kind: 'render',
    image:       '/assets/web/small/commercial-marbel.jpg',
    detailImage: '/assets/web/originals/commercial/commercial-marbel.jpg',
  },
  {
    id: 'commercial-nagraj',
    title: 'Nagraj Commercial',
    category: 'Commercial', kind: 'render',
    image:       '/assets/web/small/commercial-nagraj.jpg',
    detailImage: '/assets/web/originals/commercial/commercial-nagraj.jpg',
  },
  {
    id: 'commercial-sahara',
    title: 'Sahara Labels',
    category: 'Commercial', kind: 'render',
    image:       '/assets/web/small/commercial-sahara.jpg',
    detailImage: '/assets/web/originals/commercial/commercial-sahara.jpg',
  },

  /* ── INSTITUTIONS ──────────────────────────────────────────────────────────── */
  {
    id: 'institution-arvind-college',
    title: 'Arvind College',
    category: 'Institutions', kind: 'render',
    image:       '/assets/web/small/institution-arvind-college.jpg',
    detailImage: '/assets/web/originals/institutions/institution-arvind-college.jpg',
  },
  {
    id: 'institution-arvind-hostel',
    title: 'Arvind Hostel',
    category: 'Institutions', kind: 'render',
    image:       '/assets/web/small/institution-arvind-hostel.jpg',
    detailImage: '/assets/web/originals/institutions/institution-arvind-hostel.jpg',
  },
  {
    id: 'institution-nallur-school',
    title: 'Nallur School',
    category: 'Institutions', kind: 'render',
    image:       '/assets/web/small/institution-nallur-school.jpg',
    detailImage: '/assets/web/originals/institutions/institution-nallur-school.jpg',
  },
  {
    id: 'school-arvind',
    title: 'Arvind School',
    category: 'Institutions', kind: 'render',
    image:       '/assets/web/small/school-arvind.jpg',
    detailImage: '/assets/web/originals/institutions/school-arvind.jpg',
  },
  {
    id: 'school-mahavidyalaya',
    title: 'Mahavidyalaya Admin Block',
    category: 'Institutions', kind: 'render',
    image:       '/assets/web/small/school-mahavidyalaya.jpg',
    detailImage: '/assets/web/originals/institutions/school-mahavidyalaya.jpg',
  },

  /* ── INTERIORS ────────────────────────────────────────────────────────────── */
  {
    id: 'interior-01',
    title: 'InteriorI',
    category: 'Interiors', kind: 'render',
    image:       '/assets/web/small/interior-01.jpg',
    detailImage: '/assets/web/originals/interiors/interior-01.jpg',
  },
  {
    id: 'interior-02',
    title: 'InteriorII',
    category: 'Interiors', kind: 'render',
    image:       '/assets/web/small/interior-02.jpg',
    detailImage: '/assets/web/originals/interiors/interior-02.jpg',
  },
  {
    id: 'interior-03',
    title: 'InteriorIII',
    category: 'Interiors', kind: 'render',
    image:       '/assets/web/small/interior-03.jpg',
    detailImage: '/assets/web/originals/interiors/interior-03.jpg',
  },
  {
    id: 'interior-04',
    title: 'InteriorIV',
    category: 'Interiors', kind: 'render',
    image:       '/assets/web/small/interior-04.jpg',
    detailImage: '/assets/web/originals/interiors/interior-04.jpg',
  },
  {
    id: 'interior-05',
    title: 'InteriorV',
    category: 'Interiors', kind: 'render',
    image:       '/assets/web/small/interior-05.jpg',
    detailImage: '/assets/web/originals/interiors/interior-05.jpg',
  },
  {
    id: 'interior-06',
    title: 'InteriorVI',
    category: 'Interiors', kind: 'render',
    image:       '/assets/web/small/interior-06.jpg',
    detailImage: '/assets/web/originals/interiors/interior-06.jpg',
  },
  {
    id: 'interior-07',
    title: 'InteriorVII',
    category: 'Interiors', kind: 'render',
    image:       '/assets/web/small/interior-07.jpg',
    detailImage: '/assets/web/originals/interiors/interior-07.jpg',
  },
  {
    id: 'interior-08',
    title: 'InteriorVIII',
    category: 'Interiors', kind: 'render',
    image:       '/assets/web/small/interior-08.jpg',
    detailImage: '/assets/web/originals/interiors/interior-08.jpg',
  },
  {
    id: 'interior-09',
    title: 'InteriorIX',
    category: 'Interiors', kind: 'render',
    image:       '/assets/web/small/interior-09.jpg',
    detailImage: '/assets/web/originals/interiors/interior-09.jpg',
  },
  {
    id: 'interior-10',
    title: 'InteriorX',
    category: 'Interiors', kind: 'render',
    image:       '/assets/web/small/interior-10.jpg',
    detailImage: '/assets/web/originals/interiors/interior-10.jpg',
  },

  /* ── RESIDENCES ───────────────────────────────────────────────────────────── */
  {
    id: 'bungalow-arshia-house-view',
    title: 'Arshia House',
    category: 'Residences', kind: 'render',
    image:       '/assets/web/small/bungalow-arshia-house-view.jpg',
    detailImage: '/assets/web/originals/residences/bungalow-arshia-house-view.jpg',
  },
  {
    id: 'bungalow-lokesh-cm',
    title: 'Lokesh Residence',
    category: 'Residences', kind: 'render',
    image:       '/assets/web/small/bungalow-lokesh-cm.jpg',
    detailImage: '/assets/web/originals/residences/bungalow-lokesh-cm.jpg',
  },
  {
    id: 'bungalow-munirathna',
    title: 'Munirathna Residence',
    category: 'Residences', kind: 'render',
    image:       '/assets/web/small/bungalow-munirathna.jpg',
    detailImage: '/assets/web/originals/residences/bungalow-munirathna.jpg',
  },
  {
    id: 'residence-chandrashekar',
    title: 'Chandrashekar Residence',
    category: 'Residences', kind: 'render',
    image:       '/assets/web/small/residence-chandrashekar.jpg',
    detailImage: '/assets/web/originals/residences/residence-chandrashekar.jpg',
  },
  {
    id: 'residence-deepak',
    title: 'Deepak Residence',
    category: 'Residences', kind: 'render',
    image:       '/assets/web/small/residence-deepak.jpg',
    detailImage: '/assets/web/originals/residences/residence-deepak.jpg',
  },
  {
    id: 'residence-kumar',
    title: 'Kumar Residence',
    category: 'Residences', kind: 'render',
    image:       '/assets/web/small/residence-kumar.jpg',
    detailImage: '/assets/web/originals/residences/residence-kumar.jpg',
  },
  {
    id: 'residence-nagaraj',
    title: 'Nagaraj Residence',
    category: 'Residences', kind: 'render',
    image:       '/assets/web/small/residence-nagaraj.jpg',
    detailImage: '/assets/web/originals/residences/residence-nagaraj.jpg',
  },

  /* ── SKETCHES ─────────────────────────────────────────────────────────────── */
  {
    id: 'sketch-ashok-kumar',
    title: 'Ashok Kumar — Study I',
    category: 'Sketches', kind: 'sketch',
    image:       '/assets/web/small/sketches/sketch-ashok-kumar.jpg',
    detailImage: '/assets/web/originals/sketches/sketch-ashok-kumar.jpg',
  },
  {
    id: 'sketch-ashok-kumar-02',
    title: 'Ashok Kumar — Study II',
    category: 'Sketches', kind: 'sketch',
    image:       '/assets/web/small/sketches/sketch-ashok-kumar-02.jpg',
    detailImage: '/assets/web/originals/sketches/sketch-ashok-kumar-02.jpg',
  },
  {
    id: 'sketch-mahaveer',
    title: 'Mahaveer — Concept I',
    category: 'Sketches', kind: 'sketch',
    image:       '/assets/web/small/sketches/sketch-mahaveer.jpg',
    detailImage: '/assets/web/originals/sketches/sketch-mahaveer.jpg',
  },
  {
    id: 'sketch-mahaveer-02',
    title: 'Mahaveer — Concept II',
    category: 'Sketches', kind: 'sketch',
    image:       '/assets/web/small/sketches/sketch-mahaveer-02.jpg',
    detailImage: '/assets/web/originals/sketches/sketch-mahaveer-02.jpg',
  },
  {
    id: 'sketch-mahaveer-rehman',
    title: 'Mahaveer Rehman — Concept',
    category: 'Sketches', kind: 'sketch',
    image:       '/assets/web/small/sketches/sketch-mahaveer-rehman.jpg',
    detailImage: '/assets/web/originals/sketches/sketch-mahaveer-rehman.jpg',
  },
  {
    id: 'sketch-nanda-comm',
    title: 'Nanda Commercial — Study',
    category: 'Sketches', kind: 'sketch',
    image:       '/assets/web/small/sketches/sketch-nanda-comm.jpg',
    detailImage: '/assets/web/originals/sketches/sketch-nanda-comm.jpg',
  },
  {
    id: 'sketch-pioneer-rehman',
    title: 'Pioneer Rehman — Concept',
    category: 'Sketches', kind: 'sketch',
    image:       '/assets/web/small/sketches/sketch-pioneer-rehman.jpg',
    detailImage: '/assets/web/originals/sketches/sketch-pioneer-rehman.jpg',
  },
  {
    id: 'sketch-prabhakar',
    title: 'Prabhakar House — Study',
    category: 'Sketches', kind: 'sketch',
    image:       '/assets/web/small/sketches/sketch-prabhakar.jpg',
    detailImage: '/assets/web/originals/sketches/sketch-prabhakar.jpg',
  },
  {
    id: 'sketch-prashant',
    title: 'Prashant — Concept',
    category: 'Sketches', kind: 'sketch',
    image:       '/assets/web/small/sketches/sketch-prashant.jpg',
    detailImage: '/assets/web/originals/sketches/sketch-prashant.jpg',
  },
  {
    id: 'sketch-ramesh',
    title: 'Ramesh — Study',
    category: 'Sketches', kind: 'sketch',
    image:       '/assets/web/small/sketches/sketch-ramesh.jpg',
    detailImage: '/assets/web/originals/sketches/sketch-ramesh.jpg',
  },
  {
    id: 'sketch-school',
    title: 'School — Concept',
    category: 'Sketches', kind: 'sketch',
    image:       '/assets/web/small/sketches/sketch-school.jpg',
    detailImage: '/assets/web/originals/sketches/sketch-school.jpg',
  },
  {
    id: 'sketch-sukesh',
    title: 'Sukesh — Study',
    category: 'Sketches', kind: 'sketch',
    image:       '/assets/web/small/sketches/sketch-sukesh.jpg',
    detailImage: '/assets/web/originals/sketches/sketch-sukesh.jpg',
  },
  {
    id: 'sketch-venugopal',
    title: 'Venugopal — Concept',
    category: 'Sketches', kind: 'sketch',
    image:       '/assets/web/small/sketches/sketch-venugopal.jpg',
    detailImage: '/assets/web/originals/sketches/sketch-venugopal.jpg',
  },
]

/* ── Category config ──────────────────────────────────────────────────────── */
export interface CategoryConfig {
  slug:        string
  label:       string
  value:       Category
  heroImage:   string
  description: string
}

export const CATEGORY_CONFIG: CategoryConfig[] = [
  {
    slug:        'apartments',
    label:       'Apartments',
    value:       'Apartments',
    heroImage:   '/assets/web/small/apartment-park-avenue.jpg',
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
    slug:        'institutions',
    label:       'Institutions',
    value:       'Institutions',
    heroImage:   '/assets/web/small/institution-arvind-college.jpg',
    description: 'Schools, colleges & institutional complexes',
  },
  {
    slug:        'interiors',
    label:       'Interiors',
    value:       'Interiors',
    heroImage:   '/assets/web/small/interior-01.jpg',
    description: 'Interior design & spatial studies',
  },
  {
    slug:        'residences',
    label:       'Residences',
    value:       'Residences',
    heroImage:   '/assets/web/small/bungalow-arshia-house-view.jpg',
    description: 'Private residences & bungalows',
  },
  {
    slug:        'sketches',
    label:       'Sketches',
    value:       'Sketches',
    heroImage:   '/assets/web/small/sketches/sketch-pioneer-rehman.jpg',
    description: 'Concept sketches & architectural studies',
  },
]

export function getItemsByCategory(slug: string): WorkItem[] {
  const config = CATEGORY_CONFIG.find(c => c.slug === slug)
  if (!config) return []
  return workItems.filter(w => w.category === config.value)
}
