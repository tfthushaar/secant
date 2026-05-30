interface MasonryItem {
  id: string
  img: string
  link: string
  title: string
}

interface MasonryProps {
  items: MasonryItem[]
  ease?: string
  duration?: number
  stagger?: number
  animateFrom?: 'top' | 'bottom' | 'left' | 'right'
  scaleOnHover?: boolean
  hoverScale?: number
  blurToFocus?: boolean
}

declare const Masonry: React.ComponentType<MasonryProps>
export default Masonry
