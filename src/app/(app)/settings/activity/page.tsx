"use client"

import React from "react"
import { Activity, Clock } from "lucide-react"

export default function ActivityPage() {
  const [logs, setLogs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/audit")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLogs(data.logs)
        }
        setLoading(false)
      })
  }, [])

  return (
    <div className="w-full h-full flex flex-col p-6 bg-[#f4f5f8]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-gray-800">Activity History</h1>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">Loading history...</div>
        ) : logs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <Activity className="w-12 h-12 mb-4 text-gray-300" />
            <p>No recent activity found.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {logs.map((log: any) => (
              <div key={log.id} className="flex gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                <div className="mt-1">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs uppercase">
                    {log.user?.name?.substring(0, 2) || "U"}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {log.user?.name} <span className="text-gray-500 font-normal">{log.action.toLowerCase()}d</span> a {log.entity}
                    </p>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">ID: {log.entityId}</p>
                  
                  {log.changes && (
                    <div className="mt-3 text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                      <pre className="text-gray-600">{JSON.stringify(log.changes, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

