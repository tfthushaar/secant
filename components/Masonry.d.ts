interface MasonryItem {
  id: string
  img: string           /* full-quality display image (original) */
  thumbnailImg?: string /* small image used for fast layout measurement */
  link: string
  title: string
}

interface MasonryProps {
  items: MasonryItem[]
  ease?: string
  duration?: number
  stagger?: number
  scaleOnHover?: boolean
  hoverScale?: number
  blurToFocus?: boolean
  scrollable?: boolean
}

declare const Masonry: React.ComponentType<MasonryProps>
export default Masonry
