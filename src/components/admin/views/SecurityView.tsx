import React, { useState, useEffect } from "react";
import { ShieldCheck, Lock, AlertTriangle, Key, Activity } from "lucide-react";
import { DataTable, type ColumnDef } from "../common/DataTable.tsx";
import { getStoredSecurityLogs } from "../../../features/admin/store/admin-store.ts";
import type { SecurityAuditLog } from "../../../types/admin.ts";

export const SecurityView: React.FC = () => {
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);

  useEffect(() => {
    setLogs(getStoredSecurityLogs());
  }, []);

  const columns: ColumnDef<SecurityAuditLog>[] = [
    {
      id: "action",
      header: "Security Event Action",
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-[#2D2A26] text-xs block">
            {row.action}
          </span>
          <span className="text-[11px] text-[#2D2A26]/70">{row.details}</span>
        </div>
      ),
    },
    {
      id: "user",
      header: "Identity User",
      accessorKey: "user",
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-[#8B6D43]">
          {row.user}
        </span>
      ),
    },
    {
      id: "ipAddress",
      header: "IP Address",
      accessorKey: "ipAddress",
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-xs text-[#2D2A26]/60">{row.ipAddress}</span>
      ),
    },
    {
      id: "severity",
      header: "Severity",
      accessorKey: "severity",
      sortable: true,
      cell: (row) => (
        <span
          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
            row.severity === "CRITICAL"
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : row.severity === "WARNING"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          {row.severity}
        </span>
      ),
    },
    {
      id: "timestamp",
      header: "Timestamp",
      accessorKey: "timestamp",
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-[#2D2A26]/50">
          {new Date(row.timestamp).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E1D5] pb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2A26]">
            Security Audit & Access Telemetry
          </h1>
          <p className="text-xs text-[#2D2A26]/70 mt-1">
            Immutable audit logs for administrative logins, database role changes, and inventory modifications.
          </p>
        </div>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        keyExtractor={(l) => l.id}
        searchPlaceholder="Search audit events, users, IP addresses..."
        searchField={(l) => `${l.action} ${l.user} ${l.ipAddress} ${l.details}`}
        exportFileName="jass-security-audit-log.csv"
      />
    </div>
  );
};
