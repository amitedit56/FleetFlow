// New file (or replace existing placeholder): frontend/src/pages/Analytics.jsx
import { useState, useEffect } from 'react'
import { BarChart3, Truck, Package, Route as RouteIcon, IdCard, Wrench } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import api from '../api/axios'

const StatCard = ({ icon, label, value, color }) => (
  <div className="ff-stat-card">
    <div className={`ff-stat-icon-box ${color}`}>{icon}</div>
    <div className="ff-stat-text">
      <span className="ff-stat-label">{label}</span>
      <span className="ff-stat-value">{value}</span>
    </div>
  </div>
)

const DonutWidget = ({ title, total, segments }) => (
  <div className="ff-widget-card">
    <div className="ff-widget-title"><span>{title}</span></div>
    {total > 0 ? (
      <div className="ff-donut-wrap">
        <div style={{ width: '120px', height: '120px', flexShrink: 0, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={segments} dataKey="value" innerRadius={40} outerRadius={54} paddingAngle={2} cx="50%" cy="50%">
                {segments.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="ff-donut-center-num">{total}</text>
              <text x="50%" y="64%" textAnchor="middle" dominantBaseline="middle" className="ff-donut-center-text">Total</text>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="ff-donut-legend">
          {segments.map((s, i) => (
            <div className="ff-legend-item" key={i}>
              <span className="ff-legend-dot" style={{ background: s.color }}></span>
              <div className="ff-legend-text-group">
                <span className="ff-legend-name">{s.label}</span>
                <span className="ff-legend-meta">{s.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No data yet</p>
    )}
  </div>
)

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/analytics/operational')
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="ff-section">
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading analytics...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="ff-section">
        <p style={{ fontSize: 13, color: 'var(--red)' }}>{error || 'Something went wrong loading analytics'}</p>
      </div>
    )
  }

  const { fleet, shipments, trips, drivers, maintenance } = data

  const rateBarData = [
    { name: 'Fleet Utilization', value: fleet.utilization_percent },
    { name: 'Shipment Success', value: shipments.success_rate },
    { name: 'Trip Completion', value: trips.completion_rate },
  ]

  return (
    <div className="ff-section">
      <div className="ff-page-header">
        <div>
          <div className="ff-section-title"><BarChart3 size={16} /><span>Operational Analytics</span></div>
          <p className="ff-page-subtitle">Cross-fleet performance at a glance</p>
        </div>
      </div>

      {/* Top KPI cards */}
      <div className="ff-stats" style={{ marginBottom: 18 }}>
        <StatCard icon={<Truck size={20} />} label="Fleet Utilization" value={`${fleet.utilization_percent}%`} color="blue" />
        <StatCard icon={<Package size={20} />} label="Shipment Success Rate" value={`${shipments.success_rate}%`} color="green" />
        <StatCard icon={<RouteIcon size={20} />} label="Trip Completion Rate" value={`${trips.completion_rate}%`} color="orange" />
        <StatCard icon={<Wrench size={20} />} label="Maintenance Cost (Total)" value={`₹${maintenance.total_cost.toLocaleString()}`} color="dark-blue" />
      </div>

      {/* Rate comparison bar chart */}
      <div className="ff-widget-card" style={{ marginBottom: 18 }}>
        <div className="ff-widget-title"><span>Performance Rates</span></div>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rateBarData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="value" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut breakdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 18 }}>
        <DonutWidget
          title="Fleet Status"
          total={fleet.total_vehicles}
          segments={[
            { label: 'In Use', value: fleet.in_use, color: 'var(--green)' },
            { label: 'Available', value: fleet.available, color: '#f5a623' },
            { label: 'Maintenance', value: fleet.maintenance, color: 'var(--red)' },
          ].filter(s => s.value > 0)}
        />
        <DonutWidget
          title="Shipment Status"
          total={shipments.total}
          segments={[
            { label: 'Delivered', value: shipments.delivered, color: 'var(--green)' },
            { label: 'In Transit', value: shipments.in_transit, color: 'var(--accent)' },
            { label: 'Delayed', value: shipments.delayed, color: '#f5a623' },
            { label: 'Cancelled', value: shipments.cancelled, color: 'var(--red)' },
          ].filter(s => s.value > 0)}
        />
        <DonutWidget
          title="Trip Status"
          total={trips.total}
          segments={[
            { label: 'Completed', value: trips.completed, color: 'var(--green)' },
            { label: 'Ongoing', value: trips.ongoing, color: 'var(--accent)' },
            { label: 'Scheduled', value: trips.scheduled, color: '#f5a623' },
            { label: 'Cancelled', value: trips.cancelled, color: 'var(--red)' },
          ].filter(s => s.value > 0)}
        />
        <DonutWidget
          title="Driver Status"
          total={drivers.total}
          segments={[
            { label: 'Active', value: drivers.active, color: 'var(--green)' },
            { label: 'Assigned', value: drivers.assigned, color: 'var(--accent)' },
            { label: 'Inactive', value: drivers.inactive, color: 'var(--red)' },
          ].filter(s => s.value > 0)}
        />
      </div>

      {/* Maintenance summary */}
      <div className="ff-widget-card">
        <div className="ff-widget-title"><span><IdCard size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Maintenance Overview</span></div>
        <div className="ff-driver-stats">
          <div className="ff-mini-stat">
            <span className="ff-mini-stat-label">Total Records</span>
            <span className="ff-mini-stat-value">{maintenance.total_records}</span>
          </div>
          <div className="ff-mini-stat">
            <span className="ff-mini-stat-label">Completed</span>
            <span className="ff-mini-stat-value" style={{ color: 'var(--green)' }}>{maintenance.completed}</span>
          </div>
          <div className="ff-mini-stat">
            <span className="ff-mini-stat-label">Due Soon</span>
            <span className="ff-mini-stat-value" style={{ color: '#f5a623' }}>{maintenance.due_soon}</span>
          </div>
          <div className="ff-mini-stat">
            <span className="ff-mini-stat-label">Overdue</span>
            <span className="ff-mini-stat-value" style={{ color: 'var(--red)' }}>{maintenance.overdue}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
