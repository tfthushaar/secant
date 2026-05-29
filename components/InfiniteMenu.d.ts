interface InfiniteMenuItem {
  image: string
  link?: string
  title?: string
  description?: string
  [key: string]: unknown
}

interface InfiniteMenuProps {
  items?: InfiniteMenuItem[]
  scale?: number
  onItemClick?: (activeItem: InfiniteMenuItem) => void
}

declare function InfiniteMenu(props: InfiniteMenuProps): JSX.Element
export default InfiniteMenu
