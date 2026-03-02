'use client'

import { useState } from 'react'

export default function OnboardingPage() {
  const [name, setName] = useState('')

  const createCompany = async () => {
    await fetch('/api/tenants', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })

    alert('会社作成OK（仮）')
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>会社を作成</h1>

      <input
        placeholder="会社名"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={createCompany}>
        作成
      </button>
    </div>
  )
}