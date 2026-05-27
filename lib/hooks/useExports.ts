// ============================================================
// FTD NEXUS — useExports Hook
// PDF and Excel export via jsPDF + ExcelJS
// ============================================================

'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { TeamDashboardRow, CobraOportunidadeWithRelations } from '@/lib/supabase/types'

interface ExportOptions {
  grupo?: string
  mes?: number
  ano?: number
}

// ============================================================
// PDF EXPORT
// ============================================================

export function useExportPDF() {
  const [isExporting, setIsExporting] = useState(false)

  const exportTeamReport = useCallback(async (
    teamData: TeamDashboardRow[],
    options: ExportOptions = {}
  ) => {
    setIsExporting(true)
    const toastId = toast.loading('Gerando relatório PDF...')

    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const { grupo = 'Time', mes = new Date().getMonth() + 1, ano = new Date().getFullYear() } = options
      const mesLabel = format(new Date(ano, mes - 1, 1), "MMMM 'de' yyyy", { locale: ptBR })
        .replace(/^\w/, c => c.toUpperCase())

      // ---- Header ----
      doc.setFillColor(10, 22, 40) // navy #0A1628
      doc.rect(0, 0, 210, 28, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('FTD Nexus', 14, 11)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('4DX + COBRA — Relatório de Performance', 14, 17)
      doc.text(`${grupo} · ${mesLabel}`, 14, 23)

      // Generated at
      doc.setFontSize(7)
      doc.setTextColor(180, 180, 180)
      doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, 210 - 14, 23, { align: 'right' })

      let yPos = 36

      // ---- KPI Summary ----
      doc.setTextColor(23, 43, 77)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Resumo da Equipe', 14, yPos)
      yPos += 8

      if (teamData.length > 0) {
        const avgMCI = Math.round(teamData.reduce((a, t) => a + (t.pct_mci ?? 0), 0) / teamData.length)
        const verde = teamData.filter(t => t.placar_semana === 'verde').length
        const criticos = teamData.filter(t => t.status_mci === 'critico').length

        const kpis = [
          ['MCI Médio do Time', `${avgMCI}%`],
          ['Placar Verde (sem. atual)', `${verde}/${teamData.length}`],
          ['Consultores em Crítico', `${criticos}`],
          ['Total de Consultores', `${teamData.length}`],
        ]

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        kpis.forEach(([label, value], i) => {
          const x = 14 + (i % 2) * 93
          const y = yPos + Math.floor(i / 2) * 8
          doc.setTextColor(107, 119, 140)
          doc.text(label, x, y)
          doc.setTextColor(23, 43, 77)
          doc.setFont('helvetica', 'bold')
          doc.text(value, x + 60, y, { align: 'right' })
          doc.setFont('helvetica', 'normal')
        })
        yPos += 24
      }

      yPos += 4
      doc.setFillColor(244, 245, 247)
      doc.rect(14, yPos - 2, 182, 0.5, 'F')
      yPos += 6

      // ---- Team Table ----
      doc.setTextColor(23, 43, 77)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('D1 MCI — Status Individual', 14, yPos)
      yPos += 6

      autoTable(doc, {
        startY: yPos,
        head: [['Consultor', 'Perfil', 'MCI %', 'Realiz.', 'Meta', 'D2 %', 'COBRA', 'Status']],
        body: teamData.map(m => [
          m.consultor_nome ?? '—',
          m.perfil ?? '—',
          `${m.pct_mci ?? 0}%`,
          String(m.realizado ?? 0),
          String(m.meta_para ?? 0),
          `${m.pct_d2 ?? 0}%`,
          m.cobra_total ? String(m.cobra_total) : '—',
          m.status_mci === 'critico' ? 'Crítico' :
          m.status_mci === 'atencao' ? 'Atenção' :
          m.status_mci === 'no_caminho' ? 'No caminho' : 'Atingido',
        ]),
        headStyles: {
          fillColor: [21, 101, 192],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      })

      // ---- Footer ----
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(180, 180, 180)
        doc.text('FTD Educação · Sistema FTD Nexus · Uso interno', 14, 292)
        doc.text(`Página ${i}/${pageCount}`, 196, 292, { align: 'right' })
      }

      const filename = `ftd-nexus-${grupo.toLowerCase().replace(/\s/g, '-')}-${format(new Date(ano, mes - 1, 1), 'yyyy-MM')}.pdf`
      doc.save(filename)

      toast.success('Relatório PDF gerado com sucesso!', { id: toastId })
    } catch (err) {
      console.error('PDF export error:', err)
      toast.error('Erro ao gerar PDF. Tente novamente.', { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }, [])

  return { exportTeamReport, isExporting }
}

// ============================================================
// EXCEL EXPORT
// ============================================================

export function useExportExcel() {
  const [isExporting, setIsExporting] = useState(false)

  const exportTeamData = useCallback(async (
    teamData: TeamDashboardRow[],
    options: ExportOptions = {}
  ) => {
    setIsExporting(true)
    const toastId = toast.loading('Gerando planilha Excel...')

    try {
      const ExcelJS = await import('exceljs')
      const wb = new ExcelJS.Workbook()

      wb.creator = 'FTD Nexus'
      wb.lastModifiedBy = 'FTD Nexus'
      wb.created = new Date()
      wb.modified = new Date()

      const { grupo = 'Time', mes = new Date().getMonth() + 1, ano = new Date().getFullYear() } = options

      // ---- Sheet 1: Team Performance ----
      const ws1 = wb.addWorksheet('Performance MCI', {
        pageSetup: { orientation: 'landscape' },
      })

      // Header row
      ws1.mergeCells('A1:H1')
      ws1.getCell('A1').value = `FTD Nexus — ${grupo} — Relatório MCI — ${format(new Date(ano, mes - 1, 1), "MMMM 'de' yyyy", { locale: ptBR })}`
      ws1.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
      ws1.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A1628' } }
      ws1.getCell('A1').alignment = { horizontal: 'center' }
      ws1.getRow(1).height = 28

      // Column headers
      ws1.getRow(2).values = [
        'Consultor', 'Perfil', 'MCI %', 'Realiz.', 'Meta', 'D2 %', 'COBRA', 'Status'
      ]
      ws1.getRow(2).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } }
        cell.alignment = { horizontal: 'center' }
      })

      // Column widths
      ws1.columns = [
        { width: 22 }, { width: 14 }, { width: 10 },
        { width: 10 }, { width: 10 }, { width: 10 },
        { width: 10 }, { width: 14 },
      ]

      // Data rows
      teamData.forEach((m, i) => {
        const row = ws1.addRow([
          m.consultor_nome ?? '—',
          m.perfil ?? '—',
          `${m.pct_mci ?? 0}%`,
          m.realizado ?? 0,
          m.meta_para ?? 0,
          `${m.pct_d2 ?? 0}%`,
          m.cobra_total ?? '—',
          m.status_mci === 'critico' ? 'Crítico' :
          m.status_mci === 'atencao' ? 'Atenção' :
          m.status_mci === 'no_caminho' ? 'No caminho' : 'Atingido',
        ])

        // Color MCI column by status
        const mciCell = row.getCell(3)
        const statusColor =
          (m.pct_mci ?? 0) >= 80 ? 'FF006644' :
          (m.pct_mci ?? 0) >= 50 ? 'FF974F0C' : 'FFBF2600'
        mciCell.font = { bold: true, color: { argb: statusColor } }

        // Alternate row color
        if (i % 2 === 1) {
          row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F5F7' } }
          })
        }
      })

      // Footer
      ws1.addRow([])
      const footerRow = ws1.addRow([`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`])
      footerRow.getCell(1).font = { italic: true, color: { argb: 'FF6B778C' }, size: 8 }

      // ---- Generate and download ----
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ftd-nexus-${grupo.toLowerCase().replace(/\s/g, '-')}-${format(new Date(ano, mes - 1, 1), 'yyyy-MM')}.xlsx`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Planilha Excel gerada com sucesso!', { id: toastId })
    } catch (err) {
      console.error('Excel export error:', err)
      toast.error('Erro ao gerar planilha. Tente novamente.', { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }, [])

  const exportPipelineData = useCallback(async (
    opps: CobraOportunidadeWithRelations[],
    options: ExportOptions = {}
  ) => {
    setIsExporting(true)
    const toastId = toast.loading('Gerando planilha do pipeline...')

    try {
      const ExcelJS = await import('exceljs')
      const wb = new ExcelJS.Workbook()
      wb.creator = 'FTD Nexus'
      wb.created = new Date()

      const ws = wb.addWorksheet('Pipeline COBRA')

      ws.mergeCells('A1:G1')
      ws.getCell('A1').value = `FTD Nexus — Pipeline COBRA — ${format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}`
      ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
      ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A1628' } }
      ws.getCell('A1').alignment = { horizontal: 'center' }
      ws.getRow(1).height = 28

      ws.getRow(2).values = [
        'Escola', 'Consultor', 'Etapa', 'Valor (R$)', 'Prob. %', 'Previsão', 'Status'
      ]
      ws.getRow(2).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF7A59' } }
        cell.alignment = { horizontal: 'center' }
      })

      ws.columns = [
        { width: 30 }, { width: 18 }, { width: 16 },
        { width: 14 }, { width: 10 }, { width: 14 }, { width: 12 },
      ]

      opps.forEach((o, i) => {
        const row = ws.addRow([
          o.escola?.nome ?? '—',
          o.consultor?.nome ?? '—',
          o.etapa?.nome ?? '—',
          o.valor_estimado ?? 0,
          o.probabilidade ?? 0,
          o.data_prevista ? format(new Date(o.data_prevista), 'dd/MM/yyyy') : '—',
          o.status === 'ganho' ? 'Ganho' :
          o.status === 'perdido' ? 'Perdido' :
          o.status === 'pausado' ? 'Pausado' : 'Ativo',
        ])
        if (i % 2 === 1) {
          row.eachCell(c => {
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F5F7' } }
          })
        }
      })

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ftd-nexus-pipeline-${format(new Date(), 'yyyy-MM')}.xlsx`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Pipeline exportado com sucesso!', { id: toastId })
    } catch (err) {
      console.error('Excel pipeline export error:', err)
      toast.error('Erro ao exportar pipeline.', { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }, [])

  return { exportTeamData, exportPipelineData, isExporting }
}
