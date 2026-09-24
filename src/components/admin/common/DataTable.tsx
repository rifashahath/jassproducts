import React, { useState, useMemo, type ReactNode } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  Inbox,
  X,
} from "lucide-react";

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T) => string;
  searchPlaceholder?: string;
  searchField?: keyof T | ((row: T) => string);
  onRowClick?: (row: T) => void;
  exportFileName?: string;
  extraActions?: ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = "Search botanical records...",
  searchField,
  onRowClick,
  exportFileName = "jass-apothecary-export.csv",
  extraActions,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 1. Filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase().trim();

    return data.filter((row) => {
      if (typeof searchField === "function") {
        return searchField(row).toLowerCase().includes(query);
      }
      if (searchField && row[searchField]) {
        return String(row[searchField]).toLowerCase().includes(query);
      }
      // General match
      return Object.values(row as Record<string, unknown>).some((val) =>
        String(val).toLowerCase().includes(query)
      );
    });
  }, [data, searchQuery, searchField]);

  // 2. Sort
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    const col = columns.find((c) => c.id === sortColumn);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = col.accessorKey ? a[col.accessorKey] : (a as Record<string, unknown>)[col.id];
      const valB = col.accessorKey ? b[col.accessorKey] : (b as Record<string, unknown>)[col.id];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === "string") {
        const comp = valA.localeCompare(String(valB));
        return sortDirection === "asc" ? comp : -comp;
      }
      if (typeof valA === "number") {
        return sortDirection === "asc" ? valA - Number(valB) : Number(valB) - valA;
      }
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection, columns]);

  // 3. Paginate
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (colId: string) => {
    if (sortColumn === colId) {
      if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(colId);
      setSortDirection("asc");
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    if (!sortedData.length) return;
    const headers = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(",");
    const rows = sortedData.map((row) =>
      columns
        .map((c) => {
          const val = c.accessorKey ? row[c.accessorKey] : (row as Record<string, unknown>)[c.id];
          if (val === null || val === undefined) return '""';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", exportFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full bg-[#FAF9F6] border border-[#E8E1D5] rounded-2xl overflow-hidden shadow-xs">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-[#E8E1D5] bg-[#FAF8F5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B6D43]/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-9 py-2 bg-[#FFFFFF] border border-[#D2C2AD]/70 rounded-xl text-xs text-[#2D2A26] placeholder:text-[#2D2A26]/40 focus:outline-none focus:border-[#8B6D43] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D2A26]/50 hover:text-[#2D2A26] p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Actions & Export */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {extraActions}
          <button
            onClick={handleExportCsv}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FFFFFF] border border-[#D2C2AD]/70 hover:border-[#8B6D43] text-xs font-semibold text-[#2D2A26] rounded-xl hover:bg-[#F4EFE6]/50 transition-colors shadow-2xs cursor-pointer"
            title="Export filtered records to CSV"
          >
            <Download className="h-3.5 w-3.5 text-[#8B6D43]" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#2D2A26]">
          <thead className="bg-[#F4EFE6]/70 border-b border-[#E8E1D5] text-[11px] uppercase tracking-wider font-semibold text-[#8B6D43]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  onClick={() => col.sortable && handleSort(col.id)}
                  className={`py-3.5 px-4 sm:px-5 font-semibold select-none ${
                    col.sortable ? "cursor-pointer hover:bg-[#EAE2D5]/60 transition-colors" : ""
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-[#8B6D43]/60">
                        {sortColumn === col.id ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5 text-[#8B6D43]" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-[#8B6D43]" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E1D5]/60 bg-[#FAF9F6]">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-14 text-center text-[#2D2A26]/50">
                  <Inbox className="h-8 w-8 mx-auto mb-2 text-[#8B6D43]/40" />
                  <p className="font-serif text-sm text-[#2D2A26]">No records found</p>
                  <p className="text-[11px] text-[#2D2A26]/40 mt-0.5">
                    {searchQuery ? "Try refining your search query" : "No botanical data available"}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const key = keyExtractor(row);
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition-colors ${
                      onRowClick
                        ? "cursor-pointer hover:bg-[#F4EFE6]/60"
                        : "hover:bg-[#FBFBF9]"
                    }`}
                  >
                    {columns.map((col) => (
                      <td key={col.id} className="py-3.5 px-4 sm:px-5 align-middle">
                        {col.cell
                          ? col.cell(row)
                          : String(
                              col.accessorKey
                                ? row[col.accessorKey]
                                : (row as Record<string, unknown>)[col.id] ?? ""
                            )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-4 sm:px-5 border-t border-[#E8E1D5] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#2D2A26]/70">
        <div className="flex items-center gap-3">
          <span>
            Showing{" "}
            <strong className="text-[#2D2A26]">
              {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-[#2D2A26]">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </strong>{" "}
            of <strong className="text-[#2D2A26]">{sortedData.length}</strong> entries
          </span>
          <div className="flex items-center gap-1.5 ml-2 border-l border-[#D2C2AD]/50 pl-3">
            <span className="text-[11px] text-[#2D2A26]/50">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#FFFFFF] border border-[#D2C2AD]/70 rounded-lg px-2 py-1 text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#D2C2AD]/60 bg-[#FFFFFF] text-[#2D2A26] hover:bg-[#F4EFE6] disabled:opacity-35 disabled:pointer-events-none transition-colors"
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-1 text-[#2D2A26]/40">...</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-7 h-7 px-2 text-xs font-semibold rounded-lg transition-colors ${
                        currentPage === p
                          ? "bg-[#8B6D43] text-white shadow-2xs"
                          : "bg-[#FFFFFF] border border-[#D2C2AD]/60 text-[#2D2A26] hover:bg-[#F4EFE6]"
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#D2C2AD]/60 bg-[#FFFFFF] text-[#2D2A26] hover:bg-[#F4EFE6] disabled:opacity-35 disabled:pointer-events-none transition-colors"
              aria-label="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
