import type { ReactNode } from 'react'

interface TiltedCardProps {
  imageSrc: string
  altText?: string
  captionText?: string
  containerHeight?: string
  containerWidth?: string
  imageHeight?: string
  imageWidth?: string
  scaleOnHover?: number
  rotateAmplitude?: number
  showMobileWarning?: boolean
  showTooltip?: boolean
  overlayContent?: ReactNode        /* ReactNode so JSX elements are accepted */
  displayOverlayContent?: boolean
}

declare function TiltedCard(props: TiltedCardProps): JSX.Element
export default TiltedCard
