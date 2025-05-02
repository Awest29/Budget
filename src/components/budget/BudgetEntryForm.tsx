// src/components/budget/BudgetEntryForm.tsx
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle } from "lucide-react"
import type { BudgetEntry, BudgetCategory } from '../../types/budget'

interface BudgetEntryFormProps {
  category: BudgetCategory
  onSave: (subHeaderId: string, entry: Omit<BudgetEntry, 'id'>) => void
}

export function BudgetEntryForm({ category, onSave }: BudgetEntryFormProps) {
  const [open, setOpen] = useState(false)
  const [selectedSubHeader, setSelectedSubHeader] = useState('')
  const [entryName, setEntryName] = useState('')
  const [amount, setAmount] = useState('')
  const [matchers, setMatchers] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedSubHeader) return

    onSave(selectedSubHeader, {
      name: entryName,
      monthlyAmounts: {},
      transactionMatchers: matchers.split(',').map(m => m.trim()).filter(Boolean)
    })

    setOpen(false)
    setSelectedSubHeader('')
    setEntryName('')
    setAmount('')
    setMatchers('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Budget Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subHeader">Sub-header</Label>
            <Select value={selectedSubHeader} onValueChange={setSelectedSubHeader}>
              <SelectTrigger>
                <SelectValue placeholder="Select sub-header" />
              </SelectTrigger>
              <SelectContent>
                {category.subHeaders.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entryName">Entry Name</Label>
            <Input
              id="entryName"
              value={entryName}
              onChange={(e) => setEntryName(e.target.value)}
              placeholder="e.g., Electricity Bill, Netflix"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="matchers">Transaction Matchers</Label>
            <Input
              id="matchers"
              value={matchers}
              onChange={(e) => setMatchers(e.target.value)}
              placeholder="Enter keywords separated by commas"
            />
          </div>

          <Button type="submit" className="w-full">Save Entry</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}