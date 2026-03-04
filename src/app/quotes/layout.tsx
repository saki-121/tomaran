import type { ReactNode } from 'react'
import MobileNav from '@/app/_components/MobileNav'

export default function QuotesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileNav />
      {children}
    </>
  )
}
