import { useState, useEffect, useMemo, useRef } from 'react'
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  Truck,
  Fuel,
  UserCheck,
  PackageCheck,
  Wrench,
  ChevronDown,
  Calendar,
  X
} from 'lucide-react'
import api from '../api/axios'

const REPORT_TYPES = [
  { value: 'fleet_utilization', label: 'Fleet Utilization', icon: <Truck size={16} color="#3b82f6" /> },
  { value: 'fuel_consumption', label: 'Fuel Consumption', icon: <Fuel size={16} color="#f5a623" /> },
  { value: 'driver_performance', label: 'Driver Performance', icon: <UserCheck size={16} color="#10b981" /> },
  { value: 'delivery_performance', label: 'Delivery Performance', icon: <PackageCheck size={16} color="#2563eb" /> },
  { value: 'maintenance', label: 'Maintenance Report', icon: <Wrench size={16} color="#ef4444" /> },
]

const COLUMN_LABELS = {
  fleet_utilization: { name: 'Vehicle', metric1: 'Utilization %', metric2: 'KM' },
  fuel_consumption: { name: 'Vehicle', metric1: 'Fuel Used %', metric2: 'Cost (Rs)' },
  driver_performance: { name: 'Driver', metric1: 'Completion Rate %', metric2: 'Completed Trips' },
  delivery_performance: { name: 'Vehicle', metric1: 'Success Rate %', metric2: 'Total Shipments' },
  maintenance: { name: 'Vehicle', metric1: 'Completed %', metric2: 'Total Cost (Rs)' },
}

const toDateInput = (d) => d.toISOString().slice(0, 10)

const barColor = (pct) => {
  if (pct >= 70) return 'var(--green, #10b981)'
  if (pct >= 40) return '#f5a623'
  return 'var(--red, #ef4444)'
}

export default function Reports({ vehicles = [], drivers = [], trips = [], shipments = [], maintenanceRecords = [] }) {
  const [reportType, setReportType] = useState('fleet_utilization')
  const [startDate, setStartDate] = useState(toDateInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
  const [endDate, setEndDate] = useState(toDateInput(new Date()))
  
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const [fuelRecords, setFuelRecords] = useState([])
  const [fleetUtilData, setFleetUtilData] = useState(null)
  const [loading, setLoading] = useState(true)

  const datePickerRef = useRef(null)
  const typeDropdownRef = useRef(null)

  // Outside click listeners for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false)
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
        setShowTypeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    api.get('/fuel/')
      .then(res => setFuelRecords(res.data))
      .catch(err => console.log('Failed to fetch fuel records:', err))
  }, [])

  useEffect(() => {
    if (reportType !== 'fleet_utilization') { setLoading(false); return }
    setLoading(true)
    api.get('/reports/fleet-utilization', {
      params: {
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate + 'T23:59:59').toISOString(),
      },
    })
      .then(res => setFleetUtilData(res.data))
      .catch(err => console.log('Failed to fetch fleet utilization:', err))
      .finally(() => setLoading(false))
  }, [reportType, startDate, endDate])

  const inRange = (dateStr) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    return d >= new Date(startDate) && d <= new Date(endDate + 'T23:59:59')
  }

  const vehicleReg = (id) => vehicles.find(v => v.id === id)?.registration_number || `#${id}`
  const driverName = (id) => drivers.find(d => d.id === id)?.name || `#${id}`

  const rows = useMemo(() => {
    if (reportType === 'fleet_utilization') {
      if (!fleetUtilData) return []
      return fleetUtilData.vehicles.map(v => ({
        name: v.registration_number,
        metric1: v.utilization_percent,
        metric2: `${v.distance_km} KM`,
      }))
    }

    if (reportType === 'fuel_consumption') {
      const filtered = fuelRecords.filter(r => inRange(r.fuel_date))
      const byVehicle = {}
      filtered.forEach(r => {
        if (!byVehicle[r.vehicle_id]) byVehicle[r.vehicle_id] = { liters: 0, cost: 0 }
        byVehicle[r.vehicle_id].liters += r.fuel_quantity
        byVehicle[r.vehicle_id].cost += r.fuel_cost
      })
      const maxLiters = Math.max(...Object.values(byVehicle).map(v => v.liters), 1)
      return Object.entries(byVehicle).map(([vehicleId, v]) => ({
        name: vehicleReg(parseInt(vehicleId)),
        metric1: Math.round((v.liters / maxLiters) * 100),
        metric2: `₹${Math.round(v.cost)}`,
      }))
    }

    if (reportType === 'driver_performance') {
      const filtered = trips.filter(t => inRange(t.scheduled_start))
      const byDriver = {}
      filtered.forEach(t => {
        if (!byDriver[t.driver_id]) byDriver[t.driver_id] = { total: 0, completed: 0 }
        byDriver[t.driver_id].total += 1
        if (t.status === 'completed') byDriver[t.driver_id].completed += 1
      })
      return Object.entries(byDriver).map(([driverId, d]) => ({
        name: driverName(parseInt(driverId)),
        metric1: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
        metric2: `${d.completed} Trips`,
      }))
    }

    if (reportType === 'delivery_performance') {
      const filtered = shipments.filter(s => inRange(s.created_at))
      const byVehicle = {}
      filtered.forEach(s => {
        const key = s.vehicle_id || 'unassigned'
        if (!byVehicle[key]) byVehicle[key] = { total: 0, delivered: 0, cancelled: 0 }
        byVehicle[key].total += 1
        if (s.status === 'delivered') byVehicle[key].delivered += 1
        if (s.status === 'cancelled') byVehicle[key].cancelled += 1
      })
      return Object.entries(byVehicle).map(([vehicleId, s]) => {
        const nonCancelled = s.total - s.cancelled
        return {
          name: vehicleId === 'unassigned' ? 'Unassigned' : vehicleReg(parseInt(vehicleId)),
          metric1: nonCancelled > 0 ? Math.round((s.delivered / nonCancelled) * 100) : 0,
          metric2: `${s.total} Orders`,
        }
      })
    }

    if (reportType === 'maintenance') {
      const filtered = maintenanceRecords.filter(m => inRange(m.service_date))
      const byVehicle = {}
      filtered.forEach(m => {
        if (!byVehicle[m.vehicle_id]) byVehicle[m.vehicle_id] = { total: 0, completed: 0, cost: 0 }
        byVehicle[m.vehicle_id].total += 1
        if (m.status === 'completed') byVehicle[m.vehicle_id].completed += 1
        byVehicle[m.vehicle_id].cost += m.service_cost || 0
      })
      return Object.entries(byVehicle).map(([vehicleId, m]) => ({
        name: vehicleReg(parseInt(vehicleId)),
        metric1: m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0,
        metric2: `₹${Math.round(m.cost)}`,
      }))
    }

    return []
  }, [reportType, fleetUtilData, fuelRecords, trips, shipments, maintenanceRecords, startDate, endDate])

  const cols = COLUMN_LABELS[reportType]
  const currentReportObj = REPORT_TYPES.find(r => r.value === reportType)

  const buildExportRows = () => rows.map(r => ({
    [cols.name]: r.name,
    [cols.metric1]: `${r.metric1}%`,
    [cols.metric2]: r.metric2,
  }))

  const downloadBlob = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const data = buildExportRows()
    if (data.length === 0) return
    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h]}"`).join(',')),
    ]
    downloadBlob(csvRows.join('\n'), `${reportType}_${startDate}_to_${endDate}.csv`, 'text/csv')
  }

  const exportExcel = () => {
    const data = buildExportRows()
    if (data.length === 0) return
    const headers = Object.keys(data[0])
    const tableRows = data.map(row => `<tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>`).join('')
    const html = `<table border="1"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table>`
    downloadBlob(html, `${reportType}_${startDate}_to_${endDate}.xls`, 'application/vnd.ms-excel')
  }

  const openPrintableReport = () => {
    const data = buildExportRows()
    const headers = data.length > 0 ? Object.keys(data[0]) : []
    const tableRows = data.map(row => `<tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>`).join('')
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>${currentReportObj?.label}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h2 { margin-bottom: 4px; }
            p { color: #666; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h2>${currentReportObj?.label}</h2>
          <p>${startDate} to ${endDate}</p>
          <table>
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 300)
  }

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="ff-section">
      <div className="ff-page-header">
        <div>
          <div className="ff-section-title"><FileText size={16} /><span>Reports & Export</span></div>
          <p className="ff-page-subtitle">Generate and export fleet performance reports</p>
        </div>
      </div>

      <div className="ff-widget-card" style={{ padding: '20px' }}>
        
        {/* Top Controls: Dropdowns Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
            Reports & Export
          </h2>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* 1. Custom Report Type Dropdown */}
            <div style={{ position: 'relative' }} ref={typeDropdownRef}>
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-hover, #f8fafc)',
                  border: '1px solid var(--border-light, #e2e8f0)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                <span>{currentReportObj?.label}</span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {showTypeDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  zIndex: 50,
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-light, #e2e8f0)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  width: '220px',
                  overflow: 'hidden',
                  padding: '4px'
                }}>
                  {REPORT_TYPES.map(item => (
                    <div
                      key={item.value}
                      onClick={() => {
                        setReportType(item.value)
                        setShowTypeDropdown(false)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: reportType === item.value ? '600' : '400',
                        color: 'var(--text-main)',
                        background: reportType === item.value ? 'var(--bg-hover, #f1f5f9)' : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Custom Date Range Picker Pill & Popup */}
            <div style={{ position: 'relative' }} ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-hover, #f8fafc)',
                  border: '1px solid var(--border-light, #e2e8f0)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                <Calendar size={14} color="var(--text-muted)" />
                <span>{formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}</span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {/* Date Input Popup Box */}
              {showDatePicker && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  zIndex: 50,
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-light, #e2e8f0)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  padding: '16px',
                  width: '260px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>Select Custom Dates</span>
                    <button onClick={() => setShowDatePicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      <X size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-light, #cbd5e1)',
                          background: 'var(--bg-hover, #fff)',
                          color: 'var(--text-main)',
                          fontSize: '12px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-light, #cbd5e1)',
                          background: 'var(--bg-hover, #fff)',
                          color: 'var(--text-main)',
                          fontSize: '12px'
                        }}
                      />
                    </div>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      style={{
                        background: 'var(--accent, #2563eb)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginTop: '4px'
                      }}
                    >
                      Apply Range
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Main Content Layout (Left Nav + Center Table + Right Buttons) */}
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 160px', gap: '20px', alignItems: 'start' }}>
          
          {/* 1. Left Vertical Report Selection Menu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {REPORT_TYPES.map(item => {
              const active = reportType === item.value
              return (
                <div
                  key={item.value}
                  onClick={() => setReportType(item.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontSize: '12.5px',
                    fontWeight: active ? '600' : '500',
                    color: active ? 'var(--accent, #2563eb)' : 'var(--text-muted)',
                    background: active ? 'var(--bg-hover, #f1f5f9)' : 'transparent',
                    border: active ? '1px solid var(--border-light, #e2e8f0)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              )
            })}
          </div>

          {/* 2. Middle Table */}
          <div className="ff-table-wrap">
            <table className="ff-table">
              <thead>
                <tr>
                  <th>{cols.name}</th>
                  <th>{cols.metric1}</th>
                  <th style={{ textAlign: 'right' }}>{cols.metric2}</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr className="ff-empty-row"><td colSpan="3">Loading report data...</td></tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr className="ff-empty-row"><td colSpan="3">No data for this date range</td></tr>
                )}
                {!loading && rows.map((r, i) => (
                  <tr key={i}>
                    <td className="ff-reg-cell">{r.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 110, height: 8, background: 'var(--border-light, #e2e8f0)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(r.metric1, 100)}%`, height: '100%', background: barColor(r.metric1) }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{r.metric1}%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{r.metric2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3. Right Vertical Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>Export Options</span>
            
            <button
              onClick={openPrintableReport}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
              }}
            >
              <FileText size={14} /> Export PDF
            </button>

            <button
              onClick={exportExcel}
              style={{
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
              }}
            >
              <FileSpreadsheet size={14} /> Export Excel
            </button>

            <button
              onClick={exportCSV}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
              }}
            >
              <Download size={14} /> Export CSV
            </button>

            <button
              onClick={openPrintableReport}
              style={{
                background: 'var(--bg-hover, #f1f5f9)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-light, #e2e8f0)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <Printer size={14} /> Print Report
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}