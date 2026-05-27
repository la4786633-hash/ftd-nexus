// ============================================================
// FTD NEXUS — EscolaForm
// Create and edit school (CRM) records
// ============================================================

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { School, MapPin, Phone, Mail, User, Building2, X, Save } from 'lucide-react'
import { useCreateEscola, useUpdateEscola } from '@/lib/hooks/useCobra'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'
import type { CobraEscola } from '@/lib/supabase/types'

// ---- Schema ----
const escolaSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  cnpj: z.string().optional(),
  cidade: z.string().min(2, 'Cidade é obrigatória'),
  uf: z.string().length(2, 'UF inválida').toUpperCase(),
  endereco: z.string().optional(),
  segmento: z.enum(['fundamental', 'medio', 'tecnico', 'superior', 'integral']).optional(),
  porte: z.enum(['pequeno', 'medio', 'grande']).optional(),
  contato_nome: z.string().optional(),
  contato_cargo: z.string().optional(),
  contato_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  contato_telefone: z.string().optional(),
  observacoes: z.string().optional(),
  tags: z.string().optional(), // comma-separated
})

type EscolaFormValues = z.infer<typeof escolaSchema>

interface EscolaFormProps {
  escola?: CobraEscola | null
  onSuccess?: () => void
  onCancel?: () => void
}

const SEGMENTO_OPTIONS = [
  { value: 'fundamental', label: 'Ensino Fundamental' },
  { value: 'medio', label: 'Ensino Médio' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'superior', label: 'Superior' },
  { value: 'integral', label: 'Integral' },
]

const PORTE_OPTIONS = [
  { value: 'pequeno', label: 'Pequeno (< 300 alunos)' },
  { value: 'medio', label: 'Médio (300 – 1000 alunos)' },
  { value: 'grande', label: 'Grande (> 1000 alunos)' },
]

const UF_OPTIONS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS',
  'MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC',
  'SE','SP','TO',
]

export function EscolaForm({ escola, onSuccess, onCancel }: EscolaFormProps) {
  const isEditing = !!escola
  const createEscola = useCreateEscola()
  const updateEscola = useUpdateEscola()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EscolaFormValues>({
    resolver: zodResolver(escolaSchema),
    defaultValues: escola
      ? {
          nome: escola.nome,
          cnpj: escola.cnpj ?? '',
          cidade: escola.cidade ?? '',
          uf: escola.uf ?? 'GO',
          endereco: escola.endereco ?? '',
          segmento: escola.segmento ?? undefined,
          porte: escola.porte ?? undefined,
          contato_nome: escola.contato_nome ?? '',
          contato_cargo: escola.contato_cargo ?? '',
          contato_email: escola.contato_email ?? '',
          contato_telefone: escola.contato_telefone ?? '',
          observacoes: escola.observacoes ?? '',
          tags: escola.tags?.join(', ') ?? '',
        }
      : { uf: 'GO' },
  })

  async function onSubmit(values: EscolaFormValues) {
    const data = {
      ...values,
      cnpj: values.cnpj || null,
      endereco: values.endereco || null,
      contato_nome: values.contato_nome || null,
      contato_cargo: values.contato_cargo || null,
      contato_email: values.contato_email || null,
      contato_telefone: values.contato_telefone || null,
      observacoes: values.observacoes || null,
      tags: values.tags
        ? values.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [],
    }

    try {
      if (isEditing && escola) {
        await updateEscola.mutateAsync({ id: escola.id, ...data })
        toast.success('Escola atualizada com sucesso!')
      } else {
        await createEscola.mutateAsync(data)
        toast.success('Escola cadastrada com sucesso!')
      }
      onSuccess?.()
    } catch (err) {
      console.error('EscolaForm error:', err)
      toast.error('Erro ao salvar escola. Tente novamente.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-surface-border">
        <div className="w-8 h-8 rounded-lg bg-brand-blue-light flex items-center justify-center">
          <School className="w-4 h-4 text-brand-blue" aria-hidden />
        </div>
        <div>
          <h3 className="text-xs font-medium text-ink-primary">
            {isEditing ? 'Editar escola' : 'Nova escola'}
          </h3>
          <p className="text-[10px] text-ink-secondary">Dados cadastrais e contato</p>
        </div>
      </div>

      {/* Dados principais */}
      <fieldset className="mb-4">
        <legend className="text-[10px] font-medium text-ink-tertiary uppercase tracking-wide mb-2.5">
          Informações gerais
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <FormLabel required>Nome da escola</FormLabel>
            <input
              {...register('nome')}
              placeholder="Ex: Colégio Altamira"
              className={cn('form-input', errors.nome && 'border-status-danger')}
            />
            {errors.nome && <FormError>{errors.nome.message}</FormError>}
          </div>
          <div>
            <FormLabel>CNPJ</FormLabel>
            <input
              {...register('cnpj')}
              placeholder="00.000.000/0000-00"
              className="form-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FormLabel required>Cidade</FormLabel>
              <input
                {...register('cidade')}
                placeholder="Goiânia"
                className={cn('form-input', errors.cidade && 'border-status-danger')}
              />
              {errors.cidade && <FormError>{errors.cidade.message}</FormError>}
            </div>
            <div>
              <FormLabel required>UF</FormLabel>
              <select {...register('uf')} className="form-input">
                {UF_OPTIONS.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <FormLabel>Segmento</FormLabel>
            <select {...register('segmento')} className="form-input">
              <option value="">Selecione...</option>
              {SEGMENTO_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <FormLabel>Porte</FormLabel>
            <select {...register('porte')} className="form-input">
              <option value="">Selecione...</option>
              {PORTE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <FormLabel>Endereço</FormLabel>
            <input
              {...register('endereco')}
              placeholder="Rua, número, bairro"
              className="form-input"
            />
          </div>
        </div>
      </fieldset>

      {/* Contato */}
      <fieldset className="mb-4">
        <legend className="text-[10px] font-medium text-ink-tertiary uppercase tracking-wide mb-2.5">
          Contato principal
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <FormLabel>Nome</FormLabel>
            <input {...register('contato_nome')} placeholder="Nome do responsável" className="form-input" />
          </div>
          <div>
            <FormLabel>Cargo</FormLabel>
            <input {...register('contato_cargo')} placeholder="Ex: Diretor Pedagógico" className="form-input" />
          </div>
          <div>
            <FormLabel>E-mail</FormLabel>
            <input
              {...register('contato_email')}
              type="email"
              placeholder="email@escola.com.br"
              className={cn('form-input', errors.contato_email && 'border-status-danger')}
            />
            {errors.contato_email && <FormError>{errors.contato_email.message}</FormError>}
          </div>
          <div>
            <FormLabel>Telefone</FormLabel>
            <input {...register('contato_telefone')} placeholder="(62) 99999-9999" className="form-input" />
          </div>
        </div>
      </fieldset>

      {/* Observações e tags */}
      <fieldset className="mb-4">
        <legend className="text-[10px] font-medium text-ink-tertiary uppercase tracking-wide mb-2.5">
          Notas
        </legend>
        <div className="flex flex-col gap-3">
          <div>
            <FormLabel>Tags</FormLabel>
            <input
              {...register('tags')}
              placeholder="Ex: parceiro, renovação, expansão (separadas por vírgula)"
              className="form-input"
            />
          </div>
          <div>
            <FormLabel>Observações</FormLabel>
            <textarea
              {...register('observacoes')}
              placeholder="Informações adicionais sobre a escola..."
              rows={3}
              className="form-input resize-none"
            />
          </div>
        </div>
      </fieldset>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-ghost">
            <X className="w-3.5 h-3.5" aria-hidden />
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          <Save className="w-3.5 h-3.5" aria-hidden />
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar escola'}
        </button>
      </div>
    </form>
  )
}

// ---- Form helpers ----
function FormLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[10px] font-medium text-ink-secondary block mb-1">
      {children}{required && <span className="text-status-danger ml-0.5">*</span>}
    </label>
  )
}

function FormError({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] text-status-danger-text mt-0.5">{children}</p>
}
