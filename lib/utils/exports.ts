// ============================================================
// FTD NEXUS — Export Functions (PDF + Excel)
// ============================================================

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { TeamDashboardRow, ScoreboardHistory, CobraAvaliacaoWithNotas } from '@/lib/supabase/types'

// ============================================================
// PDF EXPORT
// ============================================================

export async function exportTeamReportPDF(
  teamData: TeamDashboardRow[],
  scoreboard: ScoreboardHistory[],
  grupo: string,
  mes: number,
  ano: number
) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const now = new Date()
  const mesLabel = format(new Date(ano, mes - 1, 1), 'MMMM yyyy', { locale: ptBR })

  // ---- Header ----
  doc.setFillColor(10, 22, 40) // navy
  doc.rect(0, 0, 210, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('FTD NEXUS', 14, 12)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('4DX + COBRA · Plataforma de Gestão Comercial', 14, 18)

  doc.setFontSize(8)
  doc.setTextColor(180, 180, 200)
  doc.text(`Grupo: ${grupo}`, 14, 24)
  doc.text(`Período: ${mesLabel}`, 80, 24)
  doc.text(`Gerado: ${format(now, 'dd/MM/yyyy HH:mm')}`, 150, 24)

  let y = 36

  // ---- MCI Summary ----
  doc.setTextColor(23, 43, 77)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumo de Performance — D1 MCI', 14, y)
  y += 6

  const mciData = teamData.map(m => [
    m.consultor_nome,
    m.perfil ?? '—',
    m.wig_meta ? String(m.wig_meta) : '—',
    m.wig_realizado ? String(m.wig_realizado) : '0',
    `${m.pct_mci}%`,
    m.status_mci === 'atingido' ? '✅ Atingido' :
    m.status_mci === 'no_caminho' ? '🟡 No caminho' :
    m.status_mci === 'atencao' ? '⚠️ Atenção' :
    m.status_mci === 'critico' ? '🔴 Crítico' : '—',
  ])

  autoTable(doc, {
    startY: y,
    head: [['Consultor', 'Perfil', 'Meta', 'Realizado', '% MCI', 'Status']],
    body: mciData,
    headStyles: { fillColor: [21, 101, 192], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: [23, 43, 77] },
    alternateRowStyles: { fillColor: [244, 245, 247] },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 22 },
      2: { cellWidth: 18 },
      3: { cellWidth: 22 },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 30 },
    },
    margin: { left: 14, right: 14 },
  })

  y = (doc as any).lastAutoTable.finalY + 12

  // ---- Scoreboard ----
  if (scoreboard.length > 0) {
    if (y > 230) { doc.addPage(); y = 20 }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('D3 Scoreboard — Placar Semanal', 14, y)
    y += 6

    // Group by consultant
    const byConsultor = scoreboard.reduce((acc, s) => {
      if (!acc[s.consultor_id]) {
        acc[s.consultor_id] = { nome: s.consultor_nome, weeks: [] }
      }
      acc[s.consultor_id].weeks.push(s)
      return acc
    }, {} as Record<string, { nome: string; weeks: ScoreboardHistory[] }>)

    const scoreboardData = Object.values(byConsultor).map(c => {
      const weeks = c.weeks.sort((a, b) => a.semana_num - b.semana_num).slice(0, 5)
      return [
        c.nome,
        ...Array.from({ length: 5 }, (_, i) => {
          const w = weeks[i]
          if (!w) return '—'
          return w.status === 'verde' ? '🟢' : w.status === 'vermelho' ? '🔴' : '⚪'
        })
      ]
    })

    autoTable(doc, {
      startY: y,
      head: [['Consultor', 'Sem.1', 'Sem.2', 'Sem.3', 'Sem.4', 'Sem.5']],
      body: scoreboardData,
      headStyles: { fillColor: [21, 101, 192], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, textColor: [23, 43, 77], halign: 'center' },
      columnStyles: { 0: { halign: 'left', cellWidth: 50 } },
      alternateRowStyles: { fillColor: [244, 245, 247] },
      margin: { left: 14, right: 14 },
    })

    y = (doc as any).lastAutoTable.finalY + 12
  }

  // ---- Footer ----
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(180, 180, 200)
    doc.text(
      `FTD Educação · Confidencial · Página ${i} de ${totalPages}`,
      105, 290,
      { align: 'center' }
    )
  }

  doc.save(`FTD_Nexus_${grupo.replace(/\s+/g, '_')}_${mes.toString().padStart(2, '0')}_${ano}.pdf`)
}

export async function exportCobraAvaliacaoPDF(
  avaliacoes: CobraAvaliacaoWithNotas[],
  grupo: string,
  mes: number,
  ano: number
) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const mesLabel = format(new Date(ano, mes - 1, 1), 'MMMM yyyy', { locale: ptBR })

  doc.setFillColor(10, 22, 40)
  doc.rect(0, 0, 297, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('FTD NEXUS — Avaliações COBRA', 14, 10)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`${grupo} · ${mesLabel}`, 14, 17)

  const rows = avaliacoes.map(a => {
    const notesByCriteria = a.notas?.reduce((acc: any, n: any) => {
      acc[n.criterio?.nome ?? ''] = n.nota
      return acc
    }, {} as Record<string, number>)

    return [
      a.consultor_nome,
      a.consultor?.perfil ?? '—',
      String(notesByCriteria?.['Renovação'] ?? notesByCriteria?.['Captação'] ?? '—'),
      String(notesByCriteria?.['Relacionamento'] ?? notesByCriteria?.['Prospecção'] ?? '—'),
      String(notesByCriteria?.['Expansão'] ?? notesByCriteria?.['Conversão'] ?? '—'),
      String(notesByCriteria?.['Consistência'] ?? '—'),
      String(notesByCriteria?.['Consultoria'] ?? notesByCriteria?.['Postura'] ?? '—'),
      `${a.total_pontos ?? 0}/25`,
      a.nivel ?? '—',
      a.lead_sugerido ?? '—',
    ]
  })

  autoTable(doc, {
    startY: 28,
    head: [['Consultor', 'Perfil', 'Crit.1', 'Crit.2', 'Crit.3', 'Crit.4', 'Crit.5', 'Total', 'Nível', 'Lead Sugerido']],
    body: rows,
    headStyles: { fillColor: [21, 101, 192], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    alternateRowStyles: { fillColor: [244, 245, 247] },
    columnStyles: {
      0: { cellWidth: 40 },
      7: { halign: 'center' },
      8: { cellWidth: 28 },
    },
    margin: { left: 14, right: 14 },
  })

  doc.save(`COBRA_${grupo.replace(/\s+/g, '_')}_${mes.toString().padStart(2, '0')}_${ano}.pdf`)
}

// ============================================================
// EXCEL EXPORT
// ============================================================

export async function exportTeamReportExcel(
  teamData: TeamDashboardRow[],
  scoreboard: ScoreboardHistory[],
  grupo: string,
  mes: number,
  ano: number
) {
  const ExcelJS = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  const mesLabel = format(new Date(ano, mes - 1, 1), 'MMMM/yyyy', { locale: ptBR })

  // ---- MCI Sheet ----
  const mciSheet = wb.addWorksheet('MCI — Performance')
  mciSheet.mergeCells('A1:F1')
  const titleCell = mciSheet.getCell('A1')
  titleCell.value = `FTD Nexus — Relatório de Performance | ${grupo} | ${mesLabel}`
  titleCell.font = { bold: true, size: 13, color: { argb: 'FF172B4D' } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } }
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' }
  mciSheet.getRow(1).height = 28

  mciSheet.addRow([])
  const headerRow = mciSheet.addRow(['Consultor', 'Perfil', 'Meta MCI', 'Realizado', '% MCI', 'Status'])
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })
  mciSheet.getRow(3).height = 20

  teamData.forEach((m, i) => {
    const row = mciSheet.addRow([
      m.consultor_nome,
      m.perfil ?? '—',
      m.wig_meta ?? 0,
      m.wig_realizado ?? 0,
      (m.pct_mci ?? 0) / 100,
      m.status_mci === 'atingido' ? 'Atingido' :
      m.status_mci === 'no_caminho' ? 'No caminho' :
      m.status_mci === 'atencao' ? 'Atenção' :
      m.status_mci === 'critico' ? 'Crítico' : '—',
    ])

    row.getCell(5).numFmt = '0.0%'

    const statusColor = m.status_mci === 'atingido' || m.status_mci === 'no_caminho' ? 'FFE3FCEF' :
                        m.status_mci === 'atencao' ? 'FFFFFAE6' : 'FFFFEBE6'
    row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusColor } }

    if (i % 2 === 1) {
      row.eachCell(cell => {
        if (!cell.fill || (cell.fill as any).fgColor?.argb === 'FFFFFFFF') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
        }
      })
    }
  })

  mciSheet.columns = [
    { width: 30 }, { width: 14 }, { width: 12 }, { width: 14 }, { width: 10 }, { width: 16 }
  ]

  // ---- Scoreboard Sheet ----
  const sbSheet = wb.addWorksheet('Scoreboard')
  sbSheet.addRow(['Consultor', 'Sem.1', 'Sem.2', 'Sem.3', 'Sem.4', 'Sem.5'])
    .eachCell(c => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } }
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      c.alignment = { horizontal: 'center' }
    })

  const grouped = scoreboard.reduce((acc, s) => {
    if (!acc[s.consultor_id]) acc[s.consultor_id] = { nome: s.consultor_nome, weeks: [] }
    acc[s.consultor_id].weeks.push(s)
    return acc
  }, {} as Record<string, { nome: string; weeks: ScoreboardHistory[] }>)

  Object.values(grouped).forEach(c => {
    const weeks = c.weeks.sort((a, b) => a.semana_num - b.semana_num).slice(0, 5)
    const row = sbSheet.addRow([
      c.nome,
      ...Array.from({ length: 5 }, (_, i) => {
        const w = weeks[i]
        if (!w) return ''
        return w.status === 'verde' ? 'VERDE' : w.status === 'vermelho' ? 'VERMELHO' : 'PENDENTE'
      })
    ])
    weeks.forEach((w, i) => {
      const cell = row.getCell(i + 2)
      if (w.status === 'verde') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3FCEF' } }
        cell.font = { color: { argb: 'FF006644' }, bold: true }
      } else if (w.status === 'vermelho') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBE6' } }
        cell.font = { color: { argb: 'FFBF2600' }, bold: true }
      }
      cell.alignment = { horizontal: 'center' }
    })
  })

  sbSheet.columns = [{ width: 30 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }]

  // Save
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `FTD_Nexus_${grupo.replace(/\s+/g, '_')}_${mes.toString().padStart(2, '0')}_${ano}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportPipelineExcel(opps: any[], grupo: string) {
  const ExcelJS = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  const sheet = wb.addWorksheet('Pipeline COBRA')

  sheet.addRow(['Escola', 'Etapa', 'Consultor', 'Valor Est.', 'Probabilidade', 'Data Prevista', 'Status'])
    .eachCell(c => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF7A59' } }
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    })

  opps.forEach(o => {
    sheet.addRow([
      o.escola?.nome ?? o.titulo,
      o.etapa?.nome ?? '—',
      o.consultor?.nome ?? '—',
      o.valor_estimado ?? 0,
      (o.probabilidade ?? 50) / 100,
      o.data_prevista ?? '—',
      o.status,
    ])
  })

  sheet.getColumn(4).numFmt = 'R$ #,##0.00'
  sheet.getColumn(5).numFmt = '0%'
  sheet.columns = [
    { width: 35 }, { width: 16 }, { width: 24 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 10 }
  ]

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Pipeline_COBRA_${grupo.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMM')}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
