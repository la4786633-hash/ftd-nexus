// ============================================================
// app/(dashboard)/guia/page.tsx
// Practical guide — 4DX methodology + COBRA framework
// ============================================================

'use client'

import { useState } from 'react'
import {
  BookOpen, Target, TrendingUp, BarChart3, Users, Heart,
  Search, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  Lightbulb, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type Category = 'tudo' | '4dx' | 'cobra' | 'cadencia' | 'erros'

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'tudo', label: 'Tudo' },
  { id: '4dx', label: '4DX' },
  { id: 'cobra', label: 'COBRA' },
  { id: 'cadencia', label: 'Cadências' },
  { id: 'erros', label: 'Erros comuns' },
]

interface GuideSection {
  id: string
  title: string
  category: Category
  icon: typeof Target
  iconColor: string
  content: string
  highlight?: string
  bullets?: string[]
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'wig',
    title: 'D1 — WIG: Meta Crucialmente Importante',
    category: '4dx',
    icon: Target,
    iconColor: '#1565C0',
    content: 'A WIG (Wildly Important Goal) é a meta mais importante do período — um número, um prazo. A regra de ouro é: uma única WIG por consultor. Foco total no que mais importa.',
    highlight: '"Se atingir só isso no mês, foi um sucesso?"',
    bullets: [
      'Formato: "De X para Y até data"',
      'Exemplo: "Renovar 15 escolas até 30 de Janeiro"',
      'Uma MCI por consultor — sem exceções',
      'A MCI não é qualquer meta — é a que move o negócio',
    ],
  },
  {
    id: 'lead',
    title: 'D2 — Lead Measure: Medida de Direção',
    category: '4dx',
    icon: TrendingUp,
    iconColor: '#FF991F',
    content: 'Ação semanal que o consultor controla diretamente e que impacta na MCI. Dois critérios essenciais: deve estar no controle do consultor e deve impactar na MCI.',
    highlight: '"Fazer 8 prospecções esta semana" ✓ · "Fechar 2 contratos" ✗',
    bullets: [
      'Preditiva — prevê o atingimento da MCI',
      'Influenciável — o consultor consegue realizar',
      'Semanal — registrada toda semana',
      '2 a 3 medidas por WIG no máximo',
    ],
  },
  {
    id: 'scoreboard',
    title: 'D3 — Placar: Todo mundo vê se está ganhando',
    category: '4dx',
    icon: BarChart3,
    iconColor: '#00875A',
    content: 'Marcador semanal binário. Verde = D2 ≥ 100%. Vermelho = D2 < 100%. O placar deve ser visível para todos e atualizado semanalmente. Se precisar explicar o placar, ele é complicado demais.',
    highlight: '2 semanas seguidas em 🔴 = ação imediata do coordenador',
    bullets: [
      '🟢 Verde = D2 atingida (100%+)',
      '🔴 Vermelho = D2 não atingida',
      'Placar simples — todos entendem em 5 segundos',
      'Time que vê o placar age diferente',
    ],
  },
  {
    id: 'cadencia-d4',
    title: 'D4 — Cadência: 20 minutos toda semana',
    category: '4dx',
    icon: Users,
    iconColor: '#7F77DD',
    content: 'Reunião estruturada de 20 minutos toda semana — sem cancelamento. Três momentos obrigatórios: comprometimento anterior, revisão do placar, novo comprometimento.',
    highlight: '"A cadência nunca cancela — mesmo que seja por WhatsApp"',
    bullets: [
      '1️⃣ "Cumpriu o compromisso anterior?" (5 min)',
      '2️⃣ Revisão do placar D3 (5 min)',
      '3️⃣ Novo comprometimento — o consultor propõe (10 min)',
      'O coordenador facilita, não dita o compromisso',
    ],
  },
  {
    id: 'cobra-metodologia',
    title: 'COBRA — Avaliação de competências comerciais',
    category: 'cobra',
    icon: Heart,
    iconColor: '#FF7A59',
    content: 'Avaliação mensal de 5 competências, notas de 0 a 5, máximo 25 pontos. Os critérios variam por perfil do consultor. A nota mais baixa define o próximo Lead Measure D2.',
    highlight: 'Loop COBRA → D2: nota mais baixa = próxima medida de direção',
    bullets: [
      'Farmers/Híbridos: Renovação, Relacionamento, Expansão, Consistência, Consultoria',
      'Hunters: Captação, Prospecção, Conversão, Consistência, Postura',
      'Inside Sales: Atendimento, Volume, Conversão, Consistência, Postura',
      '16-18 pts = Bom · 19-22 = Muito bom · 23+ = Excelente',
    ],
  },
  {
    id: 'cobra-niveis',
    title: 'COBRA — Níveis e critérios por perfil',
    category: 'cobra',
    icon: Heart,
    iconColor: '#FF7A59',
    content: 'Cada perfil de consultor tem critérios específicos que refletem suas responsabilidades no pipeline. A avaliação mensal é feita pelo coordenador em conjunto com o consultor.',
    bullets: [
      '0-10 pts: Crítico — PDI obrigatório imediato',
      '11-15 pts: Baixo, atenção — plano de 30 dias',
      '16-18 pts: Bom, ajustar — 1 área de foco',
      '19-22 pts: Muito bom — manter evolução',
      '23-25 pts: Excelente — referência para o time',
    ],
  },
  {
    id: 'cadencia-pratica',
    title: 'Cadência na prática — guia passo a passo',
    category: 'cadencia',
    icon: Users,
    iconColor: '#7F77DD',
    content: 'Como conduzir uma cadência eficaz em 20 minutos. O segredo é a consistência e a estrutura dos 3 momentos.',
    bullets: [
      'Abrir com: "Na semana passada você se comprometeu com X — cumpriu?"',
      'Revisar placar: "Estamos verde ou vermelho? Por quê?"',
      'Fechar com: "O que você vai fazer diferente esta semana?"',
      'Registrar o compromisso no sistema — com prazo e data',
      'Se não cumpriu: não punir — perguntar o que impediu',
    ],
  },
  {
    id: 'cadencia-erros',
    title: 'Cadência — erros que sabotam o resultado',
    category: 'cadencia',
    icon: AlertTriangle,
    iconColor: '#DE350B',
    content: 'Os erros mais comuns que transformam a cadência em apenas mais uma reunião operacional.',
    bullets: [
      '❌ Usar os 20 min para resolver problemas operacionais',
      '❌ O coordenador ditar o compromisso ao consultor',
      '❌ Cancelar quando "ninguém está no verde"',
      '❌ Não registrar o compromisso no sistema',
      '❌ Comprometimento vago: "vou me esforçar mais"',
    ],
  },
  {
    id: 'erros-4dx',
    title: 'Erros comuns na implementação do 4DX',
    category: 'erros',
    icon: AlertTriangle,
    iconColor: '#DE350B',
    content: 'Os erros mais comuns que desviam o time da execução disciplinada.',
    highlight: '"Mais de uma meta = zero metas"',
    bullets: [
      '❌ Criar mais de uma WIG por consultor',
      '❌ Lead Measure fora do controle do consultor',
      '❌ Placar complexo — não atualizado todo semana',
      '❌ Cadência virar reunião de números e resultados',
      '❌ Confundir D2 (ação semanal) com D1 (meta)',
      '❌ COBRA sem plano de ação no critério mais baixo',
    ],
  },
]

// ============================================================
// ACCORDION ITEM
// ============================================================

function AccordionItem({ section, isOpen, onToggle }: {
  section: GuideSection
  isOpen: boolean
  onToggle: () => void
}) {
  const Icon = section.icon

  return (
    <div className={cn(
      'card overflow-hidden',
      isOpen && 'ring-1 ring-brand-blue/20'
    )}>
      <button
        className="w-full flex items-center gap-3 text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${section.iconColor}15` }}
        >
          <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: section.iconColor }} aria-hidden />
        </div>
        <span className="text-xs font-medium text-ink-primary flex-1">{section.title}</span>
        {isOpen
          ? <ChevronDown className="w-3.5 h-3.5 text-ink-tertiary flex-shrink-0" aria-hidden />
          : <ChevronRight className="w-3.5 h-3.5 text-ink-tertiary flex-shrink-0" aria-hidden />}
      </button>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-surface-border">
          <p className="text-[11px] text-ink-secondary leading-relaxed mb-3">
            {section.content}
          </p>

          {section.highlight && (
            <div className="px-3 py-2 bg-brand-blue-light/50 rounded-lg mb-3">
              <p className="text-[10px] font-medium text-brand-blue italic">
                {section.highlight}
              </p>
            </div>
          )}

          {section.bullets && (
            <ul className="flex flex-col gap-1.5">
              {section.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-[10px] text-ink-secondary">
                  <CheckCircle2
                    className="w-3 h-3 flex-shrink-0 mt-0.5"
                    style={{ color: section.iconColor }}
                    aria-hidden
                  />
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// PAGE
// ============================================================

export default function GuiaPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('tudo')
  const [search, setSearch] = useState('')
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['wig', 'cobra-metodologia']))

  function toggleSection(id: string) {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = GUIDE_SECTIONS.filter(s => {
    const matchCategory = activeCategory === 'tudo' || s.category === activeCategory
    const matchSearch = !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.content.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <div className="page-content">
      {/* Header */}
      <div>
        <h2 className="text-sm font-medium text-ink-primary flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-ink-tertiary" aria-hidden />
          Guia Prático
        </h2>
        <p className="text-xs text-ink-secondary mt-0.5">
          Metodologia 4DX + COBRA · FTD Educação 2027
        </p>
      </div>

      {/* Quick reference cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'D1 WIG', desc: 'Uma meta. Um prazo.', color: '#1565C0', icon: Target },
          { label: 'D2 Lead', desc: 'Ação semanal que você controla', color: '#FF991F', icon: TrendingUp },
          { label: 'D3 Placar', desc: '🟢 ou 🔴 — sem complicação', color: '#00875A', icon: BarChart3 },
          { label: 'D4 Cadência', desc: '20 min. Toda semana. Sempre.', color: '#7F77DD', icon: Users },
        ].map(({ label, desc, color, icon: Icon }) => (
          <div
            key={label}
            className="p-3 rounded-lg border-l-2 cursor-pointer hover:shadow-sm transition-shadow"
            style={{
              borderLeftColor: color,
              background: `${color}08`,
              borderTop: `0.5px solid ${color}20`,
              borderRight: `0.5px solid ${color}20`,
              borderBottom: `0.5px solid ${color}20`,
            }}
            onClick={() => {
              setActiveCategory('4dx')
              setOpenSections(prev => new Set([...prev, label.toLowerCase()]))
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5" style={{ color }} aria-hidden />
              <p className="text-xs font-medium" style={{ color }}>{label}</p>
            </div>
            <p className="text-[9px] text-ink-secondary">{desc}</p>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" aria-hidden />
          <input
            type="search"
            placeholder="Buscar no guia..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-8"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'btn text-xs',
                activeCategory === cat.id ? 'btn-primary' : 'btn-ghost'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="card text-center py-10">
            <Search className="w-8 h-8 text-ink-tertiary mx-auto mb-2" aria-hidden />
            <p className="text-sm font-medium text-ink-primary">Nenhum resultado</p>
            <p className="text-xs text-ink-secondary mt-1">Tente outros termos ou selecione outra categoria</p>
          </div>
        ) : (
          filtered.map(section => (
            <AccordionItem
              key={section.id}
              section={section}
              isOpen={openSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
            />
          ))
        )}
      </div>

      {/* Tip box */}
      <div className="card border-brand-coral/20 bg-brand-coral/5">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-4 h-4 text-brand-coral flex-shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-xs font-medium text-ink-primary mb-1">
              Dica de ouro: o Loop 4DX → COBRA
            </p>
            <p className="text-[10px] text-ink-secondary leading-relaxed">
              Use a nota mais baixa do COBRA para definir o próximo Lead Measure D2.
              Isso cria um ciclo virtuoso: COBRA identifica o gap →
              D2 endereça o gap semanalmente → MCI melhora → COBRA evolui.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
