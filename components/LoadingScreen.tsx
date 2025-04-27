// components/LoadingScreen.tsx
'use client'

import { useEffect, useState } from 'react'
import styles from './LoadingScreen.module.css'

export default function LoadingScreen({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Short timeout to ensure styles are loaded
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])
  
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.heartContainer}>
            <div className={styles.heart}></div>
          </div>
          <div className={styles.loadingText}>
            <h2>DonaTalk</h2>
            <p>Connecting causes with supporters...</p>
          </div>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
          </div>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}