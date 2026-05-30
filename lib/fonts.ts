import { EB_Garamond, Raleway } from 'next/font/google'

/*
  Font system — chosen per brand.md typography guidance for SECANT:
  Brand words: Precise · Composed · Spatial
  Physical object: A Tadao Ando monograph — classical, minimal, deliberate

  EB Garamond:  classical high-contrast serif. Display / brand identity.
                Listed as valid in brand.md pool. NOT on the reflex-reject list.
                Works at weight 400-500 for the SECANT wordmark.

  Raleway:      geometric, Art-Deco inspired, multiple ultra-thin weights.
                Feels architectural and precise. NOT on the reflex-reject list.
                Weight 100-200 for large UI, 300 for body, 400 for labels.
*/
export const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal'],
  variable: '--font-garamond',
  display: 'swap',
})

export const raleway = Raleway({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600'],
  variable: '--font-raleway',
  display: 'swap',
})
