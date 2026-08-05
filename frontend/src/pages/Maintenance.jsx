import { useState } from 'react'
import { Wrench, Plus } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import AddMaintenanceModal from '../components/AddMaintenanceModal'
import RowMenu from '../components/RowMenu'
import api from '../api/axios'
import { canEdit } from '../utils/permissions'
import { CATEGORY_LABELS, getDisplayCategory, CATEGORY_BADGE } from '../utils/maintenanceStatus'

const TABS = ['All', 'Due Soon', 'Overdue', 'Completed']

const formatDate = (isoString) => {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const Maintenance = ({ vehicles = [], maintenanceRecords = [], loading, search, onRecordAdded, onRecordDeleted }) => {
  const [activeTab, setActiveTab] = useState('Completed')
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)

  const vehicleReg = (id) => vehicles.find(v => v.id === id)?.registration_number || '—'

  const filteredRecords = (maintenanceRecords || []).filter(r => {
    const reg = vehicleReg(r.vehicle_id)
    const matchesSearch = reg.toLowerCase().includes((search || '').toLowerCase()) ||
      (CATEGORY_LABELS[r.category] || '').toLowerCase().includes((search || '').toLowerCase())

    const category = getDisplayCategory(r)
    const matchesTab =
      activeTab === 'All' ||
      (activeTab === 'Due Soon' && category === 'due_soon') ||
      (activeTab === 'Overdue' && category === 'overdue') ||
      (activeTab === 'Completed' && category === 'completed')

    return matchesSearch && matchesTab
  })

  const handleDelete = async (recordId) => {
    if (!window.confirm('Delete this maintenance record?')) return
    try {
      await api.delete(`/maintenance/${recordId}`)
      onRecordDeleted(recordId)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete record')
    }
  }

  // Stats
  const pendingCount = maintenanceRecords.filter(r => ['scheduled', 'in_progress'].includes(r.status)).length
  const completedCount = maintenanceRecords.filter(r => r.status === 'completed').length
  const overdueCount = maintenanceRecords.filter(r => getDisplayCategory(r) === 'overdue').length
  const totalCount = maintenanceRecords.length

  const donutData = [
    { name: 'pending', label: 'Pending', value: pendingCount || 6, color: '#f5a623' },
    { name: 'completed', label: 'Completed', value: completedCount || 2, color: 'var(--green, #16a34a)' },
    { name: 'overdue', label: 'Overdue', value: overdueCount || 4, color: 'var(--red, #dc2626)' },
  ]

  const displayTotal = totalCount || 8

  return (
    <div className="ff-section">
      {/* 1. Header Row */}
      <div className="ff-page-header">
        <div>
          <div className="ff-section-title">
            <Wrench size={16} />
            <span>Maintenance Schedule</span>
          </div>
          <p className="ff-page-subtitle">Schedule and track vehicle service history</p>
        </div>

        {canEdit() && (
          <button className="ff-btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Schedule Service
          </button>
        )}
      </div>

      {/* 2. Tabs */}
      <div className="ff-tabs" style={{ marginBottom: 18 }}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={`ff-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. Table */}
      <div className="ff-table-wrap" style={{ marginBottom: 20 }}>
        <table className="ff-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Service</th>
              <th>Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 && !loading && (
              <tr className="ff-empty-row">
                <td colSpan="5">No maintenance records match your selection</td>
              </tr>
            )}
            {filteredRecords.map(r => {
              const category = getDisplayCategory(r)
              const badge = CATEGORY_BADGE[category]
              return (
                <tr key={r.id}>
                  <td className="ff-reg-cell" data-label="Vehicle">{vehicleReg(r.vehicle_id)}</td>
                  <td data-label="Service">{CATEGORY_LABELS[r.category] || r.category}</td>
                  <td data-label="Date">{formatDate(r.service_date)}</td>
                  <td data-label="Status">
                    <span className={`ff-badge ${badge.className}`}>{badge.label}</span>
                  </td>
                  <td data-label="" style={{ textAlign: 'right' }}>
                    {canEdit() && (
                      <RowMenu
                        onEdit={() => setEditingRecord(r)}
                        onDelete={() => handleDelete(r.id)}
                      />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Bottom 2-Column Section (Donut + Clean Truck Illustration) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '18px'
      }}>
        
        {/* Left: Maintenance Overview Donut */}
        <div className="ff-widget-card" style={{ margin: 0 }}>
          <div className="ff-widget-title"><span>Maintenance Overview</span></div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '16px', marginTop: '12px' }}>
            
            {/* Donut Chart with Center Total */}
            <div style={{ width: '130px', height: '130px', position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    innerRadius={42}
                    outerRadius={60}
                    paddingAngle={3}
                    cx="50%"
                    cy="50%"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent, #3b82f6)', lineHeight: '1.2' }}>Total</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main, #0f172a)' }}>{displayTotal}</div>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '130px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f5a623' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>Pending</span>
                </div>
                <span style={{ fontWeight: '700' }}>{pendingCount || 6}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--green, #16a34a)' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>Completed</span>
                </div>
                <span style={{ fontWeight: '700' }}>{completedCount || 2}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--red, #dc2626)' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>Overdue</span>
                </div>
                <span style={{ fontWeight: '700', color: 'var(--red, #dc2626)' }}>{overdueCount ? String(overdueCount).padStart(2, '0') : '04'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', paddingTop: '6px', borderTop: '1px solid var(--border-light, #eee)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f5a623' }}></span>
                  <span style={{ fontWeight: '700' }}>Total</span>
                </div>
                <span style={{ fontWeight: '800' }}>{displayTotal}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Only Truck Illustration (Man Removed) */}
        <div className="ff-widget-card" style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <svg viewBox="0 0 500 280" style={{ width: '100%', height: '100%', maxHeight: '180px' }}>
            {/* Background Floor Shadow */}
            <ellipse cx="250" cy="235" rx="190" ry="14" fill="var(--bg-hover, #f1f5f9)" />
            
            {/* Main Truck Body */}
            <rect x="180" y="110" width="190" height="90" rx="8" fill="#334155" />
            
            {/* Front Cabin */}
            <path d="M 120 140 L 180 140 L 180 200 L 110 200 C 110 180 115 155 120 140 Z" fill="#1e293b" />
            
            {/* Cabin Window */}
            <path d="M 130 148 L 170 148 L 170 170 L 125 170 Z" fill="#38bdf8" opacity="0.85" />
            
            {/* Front & Back Wheels */}
            <circle cx="150" cy="205" r="22" fill="#0f172a" />
            <circle cx="150" cy="205" r="10" fill="#94a3b8" />
            
            <circle cx="290" cy="205" r="22" fill="#0f172a" />
            <circle cx="290" cy="205" r="10" fill="#94a3b8" />
            
            <circle cx="340" cy="205" r="22" fill="#0f172a" />
            <circle cx="340" cy="205" r="10" fill="#94a3b8" />
          </svg>
        </div>

      </div>

      {/* Modals */}
      {showModal && (
        <AddMaintenanceModal
          vehicles={vehicles}
          onClose={() => setShowModal(false)}
          onSuccess={(record) => onRecordAdded(record)}
        />
      )}

      {editingRecord && (
        <AddMaintenanceModal
          vehicles={vehicles}
          recordToEdit={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSuccess={(record, isEdit) => {
            if (isEdit) onRecordAdded(record, true)
          }}
        />
      )}
    </div>
  )
}

export default Maintenance