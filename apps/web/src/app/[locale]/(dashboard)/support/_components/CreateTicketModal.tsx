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
import { TicketPriority, TicketCategory, type CreateTicketDto } from '@/services/tickets'

interface CreateTicketModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateTicketDto) => Promise<void>
  grupoId: string
}

export function CreateTicketModal({ open, onOpenChange, onSubmit, grupoId }: CreateTicketModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: TicketPriority.MEDIUM,
    category: TicketCategory.OTHER,
    location: '',
    reproductionSteps: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        grupoId,
        location: formData.location || undefined,
        reproductionSteps: formData.reproductionSteps || undefined,
      })
      onOpenChange(false)
      setFormData({
        title: '',
        description: '',
        priority: TicketPriority.MEDIUM,
        category: TicketCategory.OTHER,
        location: '',
        reproductionSteps: '',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titulo *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Descreva brevemente o problema"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descricao *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o problema em detalhes"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => setFormData({ ...formData, priority: v as TicketPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TicketPriority.LOW}>Baixa</SelectItem>
                  <SelectItem value={TicketPriority.MEDIUM}>Media</SelectItem>
                  <SelectItem value={TicketPriority.HIGH}>Alta</SelectItem>
                  <SelectItem value={TicketPriority.CRITICAL}>Critica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v as TicketCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TicketCategory.UI}>Interface</SelectItem>
                  <SelectItem value={TicketCategory.FUNCTIONALITY}>Funcionalidade</SelectItem>
                  <SelectItem value={TicketCategory.PERFORMANCE}>Performance</SelectItem>
                  <SelectItem value={TicketCategory.SECURITY}>Seguranca</SelectItem>
                  <SelectItem value={TicketCategory.API}>API</SelectItem>
                  <SelectItem value={TicketCategory.OTHER}>Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Localizacao (URL ou pagina)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="/dashboard/vagas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reproductionSteps">Passos para Reproducao</Label>
            <Textarea
              id="reproductionSteps"
              value={formData.reproductionSteps}
              onChange={(e) => setFormData({ ...formData, reproductionSteps: e.target.value })}
              placeholder="1. Acessar a pagina X&#10;2. Clicar no botao Y&#10;3. Erro aparece"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Ticket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
