import React, { useState, useEffect } from "react";
import { Star, CheckCircle2, XCircle, Trash2, ShieldCheck } from "lucide-react";
import { DataTable, type ColumnDef } from "../common/DataTable.tsx";
import {
  getStoredAdminReviews,
  updateReviewStatus,
  deleteReview,
} from "../../../features/admin/store/admin-store.ts";
import type { ReviewRecord } from "../../../types/admin.ts";

export const ReviewsView: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);

  const loadData = () => {
    setReviews(getStoredAdminReviews());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("reviews_updated", loadData);
    return () => window.removeEventListener("reviews_updated", loadData);
  }, []);

  const handleStatus = async (id: string, status: ReviewRecord["status"]) => {
    await updateReviewStatus(id, status);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this customer review?")) {
      await deleteReview(id);
      loadData();
    }
  };

  const columns: ColumnDef<ReviewRecord>[] = [
    {
      id: "product",
      header: "Botanical Product",
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-semibold text-xs text-[#2D2A26] block">
            {row.productName}
          </span>
          <span className="text-[10px] text-[#8B6D43] font-mono">ID: {row.productId}</span>
        </div>
      ),
    },
    {
      id: "customer",
      header: "Patron / Date",
      sortable: true,
      cell: (row) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-[#2D2A26]">{row.customerName}</span>
            {row.verifiedBuyer && (
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                Verified
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#2D2A26]/50">{row.date}</span>
        </div>
      ),
    },
    {
      id: "rating",
      header: "Rating",
      accessorKey: "rating",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1 text-[#8B6D43]">
          <Star className="h-3.5 w-3.5 fill-[#8B6D43]" />
          <span className="font-bold text-xs">{row.rating}.0</span>
        </div>
      ),
    },
    {
      id: "comment",
      header: "Review Feedback",
      cell: (row) => (
        <div className="max-w-md">
          <p className="font-semibold text-xs text-[#2D2A26]">{row.title}</p>
          <p className="text-xs text-[#2D2A26]/75 mt-0.5 line-clamp-2 leading-relaxed">
            "{row.comment}"
          </p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Moderation Status",
      cell: (row) => (
        <span
          className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
            row.status === "APPROVED"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : row.status === "PENDING"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Moderation",
      cell: (row) => (
        <div className="flex items-center gap-1">
          {row.status !== "APPROVED" && (
            <button
              type="button"
              onClick={() => handleStatus(row.id, "APPROVED")}
              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
              title="Approve Review"
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
          {row.status !== "REJECTED" && (
            <button
              type="button"
              onClick={() => handleStatus(row.id, "REJECTED")}
              className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors"
              title="Reject Review"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDelete(row.id)}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Review"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E1D5] pb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2A26]">
            Customer Reviews & Ratings Moderation
          </h1>
          <p className="text-xs text-[#2D2A26]/70 mt-1">
            Approve verified buyer feedback, filter testimonial ratings, and moderate public comments.
          </p>
        </div>
      </div>

      <DataTable
        data={reviews}
        columns={columns}
        keyExtractor={(r) => r.id}
        searchPlaceholder="Search review text, customer, or product..."
        searchField={(r) => `${r.customerName} ${r.productName} ${r.title} ${r.comment}`}
        exportFileName="jass-reviews-moderation.csv"
      />
    </div>
  );
};
