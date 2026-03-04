import type { ReactNode } from 'react'
import MobileNav from '@/app/_components/MobileNav'

export default function DeliveriesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileNav />
      {children}
    </>
  )
}
