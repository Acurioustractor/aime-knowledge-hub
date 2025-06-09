'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Calendar, CheckCircle, AlertCircle } from 'lucide-react'

interface MailoutsFilterProps {
  selectedStatuses: string[]
  onStatusChange: (statuses: string[]) => void
}

export default function MailoutsFilter({ selectedStatuses, onStatusChange }: MailoutsFilterProps) {
  const [expandedSections, setExpandedSections] = useState({
    statuses: true,
  })

  // Static status options based on mailout dates
  const statusOptions = [
    { id: 'sent', label: 'Sent', icon: CheckCircle, color: 'text-green-600' },
    { id: 'upcoming', label: 'Upcoming (7 days)', icon: AlertCircle, color: 'text-orange-600' },
    { id: 'scheduled', label: 'Scheduled (Future)', icon: Calendar, color: 'text-blue-600' },
    { id: 'no-date', label: 'No Date Set', icon: Calendar, color: 'text-gray-600' }
  ]

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleStatusToggle = (status: string) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status]
    onStatusChange(newStatuses)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-secondary-900 mb-4">Filter Mailouts</h3>
      
      {/* Status Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('statuses')}
          className="flex items-center justify-between w-full text-left font-medium text-secondary-900 mb-3"
        >
          <span>Status</span>
          {expandedSections.statuses ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        
        {expandedSections.statuses && (
          <div className="space-y-2 ml-2">
            {statusOptions.map((status) => {
              const IconComponent = status.icon
              return (
                <label key={status.id} className="flex items-center space-x-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status.id)}
                    onChange={() => handleStatusToggle(status.id)}
                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  <IconComponent className={`w-3 h-3 ${status.color}`} />
                  <span className="text-secondary-700">{status.label}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Active Filters */}
      {selectedStatuses.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-secondary-900 mb-2">Active Filters</h4>
          <div className="space-y-2">
            {selectedStatuses.map((statusId) => {
              const status = statusOptions.find(s => s.id === statusId)
              return status ? (
                <div key={statusId} className="flex items-center justify-between bg-primary-50 text-primary-700 px-2 py-1 rounded text-sm">
                  <span>{status.label}</span>
                  <button
                    onClick={() => handleStatusToggle(statusId)}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </div>
              ) : null
            })}
            <button
              onClick={() => onStatusChange([])}
              className="text-xs text-secondary-500 hover:text-secondary-700"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 