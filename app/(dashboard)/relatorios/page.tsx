'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Calendar, Loader2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useTeamDashboard, useTeamScoreboard } from '@/lib/hooks/use4dx'
import { useCobraAvaliacoes, usePipelineFunnel } from '@/lib/hooks/useCobra'
import { useAuth } from '@/components/providers/AuthProvider'
import { KPICard, StatusBadge, ProfilePill, Skeleton } from '@/components/ui/KPICard'
import { exportTeamReportPDF, exportTeamReportExcel, exportPipelineExcel } from '@/lib/utils/exports'
import { formatCurrency, getCurrentMonth, getCurrentYear, calcTeamMCIMedia } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import { BarChart3, Target, CheckCircle2, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function RelatoriosPage() {
  const { profile } = useAuth()
  const { data: teamData, isLoading } = useTeamDashboard()
  const { data: scoreboard } = useTeamScoreboard()
  const { data: avaliacoes } = useCobraAvaliacoes()
  const { data: funnel } = usePipelineFunnel()

  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingXLS, setExportingXLS] = useState(false)

  const mes = getCurrentMonth()
  const ano = getCurrentYear()
  const grupo = profile?.nome ?? 'Grupo 12'

  const mciMedia = teamData ? calcTeamMCIMedia(teamData.map(t => t.pct_mci)) : 0

  async function handleExportPDF() {
    if (!teamData || !scoreboard) return
    setExportingPDF(true)
    try {
      await exportTeamReportPDF(teamData, scoreboard, grupo, mes, ano)
      toast.success('PDF exportado com sucesso!')
    } catch (e) {
      toast.error('Erro ao exportar PDF')
    } finally {
      setExportingPDF(false)
    }
  }

  async function handleExportXLS() {
    if (!teamData || !scoreboard) return
    setExportingXLS(true)
    try {
      await exportTeamReportExcel(teamData, scoreboard, grupo, mes, ano)
      toast.success('Excel exportado!')
    } catch (e) {
      toast.error('Erro ao exportar Excel')
    } finally {
      setExportingXLS(false)
    }
  }

  // Build evolution data (mock last 4 weeks from real data)
  const evolutionData = [
    { name: 'Sem.1', media: 42, Douglas: 40, Wadson: 60, Mauricio: 55 },
    { name: 'Sem.2', media: 48, Douglas: 42, Wadson: 64, Mauricio: 58 },
    { name: 'Sem.3', media: 54, Douglas: 45, Wadson: 68, Mauricio: 62 },
    { name: 'Sem.4', media: mciMedia, Douglas: 47, Wadson: 71, Mauricio: 65 },
  ]

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-ink-primary">Relatórios e Análises</h2>
          <p className="text-xs text-ink-secondary mt-0.5">Performance do time · Jan 2027</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-ghost btn"
            onClick={handleExportPDF}
            disabled={exportingPDF}
          >
            {exportingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Download className="w-3.5 h-3.5" aria-hidden />}
            Exportar PDF
          </button>
          <button
            className="btn-ghost btn"
            onClick={handleExportXLS}
            disabled={exportingXLS}
          >
            {exportingXLS ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden />}
            Excel
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="MCI Médio" value={`${mciMedia}%`} trend="Meta: 100% até 31 Jan" trendType={mciMedia >= 80 ? 'ok' : 'danger'} color={mciMedia >= 80 ? 'ok' : 'danger'} icon={<Target className="w-4 h-4" aria-hidden />} />
        <KPICard label="Cadências OK" value="4/4" trend="100% de presença" trendType="ok" color="ok" icon={<CheckCircle2 className="w-4 h-4" aria-hidden />} />
        <KPICard label="Taxa comprometimento" value="67%" trend="D4 · 10 de 15 cumpriram" trendType="warning" color="warning" icon={<Users className="w-4 h-4" aria-hidden />} />
        <KPICard label="Pipeline ativo" value={formatCurrency(funnel?.reduce((a, f) => a + f.valor_total, 0) ?? 0, true)} trend={`${funnel?.reduce((a, f) => a + f.total_opps, 0) ?? 0} opps ativas`} trendType="neutral" color="info" icon={<BarChart3 className="w-4 h-4" aria-hidden />} />
      </div>

      {/* Evolution chart */}
      <div className="card">
        <h3 className="text-xs font-medium text-ink-primary mb-4">Evolução MCI — 4 semanas</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolutionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(9,30,66,.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B778C' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#6B778C' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: any, name: string) => [`${v}%`, name]} contentStyle={{ fontSize: 10, borderRadius: 6 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="Douglas" stroke="#DE350B" strokeWidth={1.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Mauricio" stroke="#FF991F" strokeWidth={1.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Wadson" stroke="#00875A" strokeWidth={1.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ranking */}
        <div className="card">
          <h3 className="text-xs font-medium text-ink-primary mb-3">Ranking do time</h3>
          {isLoading ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
          ) : (
            <div className="flex flex-col divide-y divide-surface-border">
              {[...teamData ?? []].sort((a, b) => b.pct_mci - a.pct_mci).map((m, i) => (
                <div key={m.consultor_id} className="flex items-center gap-3 py-2">
                  <span className="text-[10px] text-ink-tertiary w-4">{i + 1}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs font-medium text-ink-primary">{m.consultor_nome}</span>
                    {m.perfil && <ProfilePill perfil={m.perfil} />}
                  </div>
                  <StatusBadge status={m.pct_mci >= 80 ? 'ok' : m.pct_mci >= 50 ? 'warning' : 'danger'}>
                    {m.pct_mci}%
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pipeline funnel */}
        <div className="card">
          <h3 className="text-xs font-medium text-ink-primary mb-3">Funil COBRA — Jan/2027</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel ?? []} layout="vertical" margin={{ left: 0, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(9,30,66,.06)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 8, fill: '#6B778C' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="etapa_nome" tick={{ fontSize: 9, fill: '#6B778C' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip formatter={(v: any) => [v, 'Opp.']} contentStyle={{ fontSize: 10, borderRadius: 6 }} />
                <Bar dataKey="total_opps" fill="#1565C0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
