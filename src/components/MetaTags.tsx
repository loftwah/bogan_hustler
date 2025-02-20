import { useEffect } from 'react'
import ogImage from '../assets/ogimage.jpg'

export const MetaTags = () => {
  // Update meta tags when component mounts
  useEffect(() => {
    document.querySelector('meta[property="og:image"]')?.setAttribute('content', ogImage)
    document.querySelector('meta[property="twitter:image"]')?.setAttribute('content', ogImage)
  }, []) // Empty dependency array means this runs once when component mounts

  return null // This component doesn't render anything
} 