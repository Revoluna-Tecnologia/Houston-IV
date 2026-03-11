'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { KanbanTab, type CreateCardDto } from '@/services/kanban'

interface CreateCardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateCardDto) => Promise<void>
  grupoId: string
  defaultStatus?: string
}

const STATUSES = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'A Fazer' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'review', label: 'Revisao' },
  { value: 'done', label: 'Concluido' },
]

export function CreateCardModal({ open, onOpenChange, onSubmit, grupoId, defaultStatus = 'backlog' }: CreateCardModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: defaultStatus,
    tab: KanbanTab.PROJETOS,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        grupoId,
        description: formData.description || undefined,
      })
      onOpenChange(false)
      setFormData({
        title: '',
        description: '',
        status: defaultStatus,
        tab: KanbanTab.PROJETOS,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Card</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titulo *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nome da tarefa"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descricao</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva a tarefa..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Aba</Label>
              <Select
                value={formData.tab}
                onValueChange={(v) => setFormData({ ...formData, tab: v as KanbanTab })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KanbanTab.PROJETOS}>Projetos</SelectItem>
                  <SelectItem value={KanbanTab.FINANCEIRO}>Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Card'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
