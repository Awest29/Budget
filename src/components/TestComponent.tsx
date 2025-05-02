// src/components/TestComponent.tsx
import { supabase } from '../lib/lib/supabase'

export function TestComponent() {
  return (
    <div>
      <h1>Test Component</h1>
      <button onClick={async () => {
        const { data, error } = await supabase.from('budget_categories').select('*')
        console.log('Data:', data)
        console.log('Error:', error)
      }}>
        Test Supabase
      </button>
    </div>
  )
}