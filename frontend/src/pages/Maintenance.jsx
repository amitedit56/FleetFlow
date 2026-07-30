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
  return new Date(isoString).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

const Maintenance = ({ vehicles = [], maintenanceRecords = [], loading, search, onRecordAdded, onRecordDeleted }) => {
  const [activeTab, setActiveTab] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)

  const vehicleReg = (id) => vehicles.find(v => v.id === id)?.registration_number || '—'

  const filteredRecords = (maintenanceRecords || []).filter(r => {
    const reg = vehicleReg(r.vehicle_id)
    const matchesSearch = reg.toLowerCase().includes(search.toLowerCase()) ||
      (CATEGORY_LABELS[r.category] || '').toLowerCase().includes(search.toLowerCase())

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

  // Overview stats
  const pendingCount = maintenanceRecords.filter(r => ['scheduled', 'in_progress'].includes(r.status)).length
  const completedCount = maintenanceRecords.filter(r => r.status === 'completed').length
  const overdueCount = maintenanceRecords.filter(r => getDisplayCategory(r) === 'overdue').length
  const totalCount = maintenanceRecords.length

  const donutData = [
    { name: 'pending', label: 'Pending', value: pendingCount, color: '#f5a623' },
    { name: 'completed', label: 'Completed', value: completedCount, color: 'var(--green)' },
    { name: 'overdue', label: 'Overdue', value: overdueCount, color: 'var(--red)' },
  ].filter(d => d.value > 0)

  return (
    <div className="ff-section">
      <div className="ff-page-header">
        <div>
          <div className="ff-section-title"><Wrench size={16} /><span>Maintenance</span></div>
          <p className="ff-page-subtitle">Schedule and track vehicle service history</p>
        </div>
        {canEdit() && (
          <button className="ff-btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Schedule Service
          </button>
        )}
      </div>

      <div className="ff-tabs">
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

      <div className="ff-table-wrap">
        <table className="ff-table">
          <thead>
            <tr>
              <th>Vehicle</th><th>Service</th><th>Date</th><th>Next Service</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 && !loading && (
              <tr className="ff-empty-row"><td colSpan="6">No maintenance records match your search</td></tr>
            )}
            {filteredRecords.map(r => {
              const category = getDisplayCategory(r)
              const badge = CATEGORY_BADGE[category]
              return (
                <tr key={r.id}>
                  <td className="ff-reg-cell" data-label="Vehicle">{vehicleReg(r.vehicle_id)}</td>
                  <td data-label="Service">{CATEGORY_LABELS[r.category] || r.category}</td>
                  <td data-label="Date">{formatDate(r.service_date)}</td>
                  <td data-label="Next Service">{formatDate(r.next_service_date)}</td>
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

      {/* Maintenance Overview */}
      <div className="ff-widget-card" style={{ marginTop: 16, maxWidth: 420 }}>
        <div className="ff-widget-title"><span>Maintenance Overview</span></div>
        {totalCount > 0 ? (
          <div className="ff-donut-wrap">
            <div style={{ width: '120px', height: '120px', flexShrink: 0, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" innerRadius={40} outerRadius={54} paddingAngle={2} cx="50%" cy="50%">
                    {donutData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="ff-donut-center-num">{totalCount}</text>
                  <text x="50%" y="64%" textAnchor="middle" dominantBaseline="middle" className="ff-donut-center-text">Total</text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="ff-donut-legend">
              <div className="ff-legend-item">
                <span className="ff-legend-dot" style={{ background: '#f5a623' }}></span>
                <div className="ff-legend-text-group">
                  <span className="ff-legend-name">Pending</span>
                  <span className="ff-legend-meta">{pendingCount}</span>
                </div>
              </div>
              <div className="ff-legend-item">
                <span className="ff-legend-dot" style={{ background: 'var(--green)' }}></span>
                <div className="ff-legend-text-group">
                  <span className="ff-legend-name">Completed</span>
                  <span className="ff-legend-meta">{completedCount}</span>
                </div>
              </div>
              <div className="ff-legend-item">
                <span className="ff-legend-dot" style={{ background: 'var(--red)' }}></span>
                <div className="ff-legend-text-group">
                  <span className="ff-legend-name">Overdue</span>
                  <span className="ff-legend-meta">{overdueCount}</span>
                </div>
              </div>
              <div className="ff-legend-item">
                <span className="ff-legend-dot" style={{ background: 'var(--text-muted)' }}></span>
                <div className="ff-legend-text-group">
                  <span className="ff-legend-name">Total</span>
                  <span className="ff-legend-meta">{totalCount}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No maintenance records yet</p>
        )}
      </div>

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
