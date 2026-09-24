import React, { useState, useEffect } from "react";
import { Users, Plus, Shield, Check, Lock, Unlock, Mail, X } from "lucide-react";
import {
  getStoredAdminUsers,
  updateUserRole,
  toggleUserStatus,
  inviteAdminUser,
} from "../../../features/admin/store/admin-store.ts";
import type { AdminUserRecord, UserRole } from "../../../types/admin.ts";

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("STAFF");
  const [inviteDepartment, setInviteDepartment] = useState("Operations");

  const loadData = () => {
    setUsers(getStoredAdminUsers());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("users_updated", loadData);
    return () => window.removeEventListener("users_updated", loadData);
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await updateUserRole(userId, newRole);
    loadData();
  };

  const handleToggleStatus = async (userId: string) => {
    await toggleUserStatus(userId);
    loadData();
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    await inviteAdminUser({
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      department: inviteDepartment,
    });
    setInviteName("");
    setInviteEmail("");
    setInviteModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E1D5] pb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2A26]">
            Staff & Role-Based Access Control (RBAC)
          </h1>
          <p className="text-xs text-[#2D2A26]/70 mt-1">
            Manage dispensary operators, botanists, and permissions across Super Admin, Store Manager, and Staff roles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setInviteModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B6D43] hover:bg-[#735732] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Invite Staff Member</span>
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white border border-[#E8E1D5] rounded-2xl p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#8B6D43] text-white flex items-center justify-center font-serif text-sm font-bold shadow-xs">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-serif text-sm sm:text-base font-bold text-[#2D2A26]">
                      {user.name}
                    </h3>
                    <p className="text-[11px] text-[#2D2A26]/60">{user.email}</p>
                  </div>
                </div>
                <span
                  className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    user.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {user.status}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E8E1D5] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#2D2A26]/60">Department:</span>
                  <span className="font-semibold text-[#2D2A26]">{user.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#2D2A26]/60">Last Console Login:</span>
                  <span className="font-mono text-[11px] text-[#8B6D43]">
                    {user.lastLogin === "Never"
                      ? "Never"
                      : new Date(user.lastLogin).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#E8E1D5] flex items-center justify-between gap-2">
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                className="text-xs font-semibold bg-[#FAF9F6] border border-[#D2C2AD]/70 rounded-xl px-2.5 py-1 text-[#8B6D43] focus:outline-none focus:border-[#8B6D43]"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="STORE_MANAGER">STORE_MANAGER</option>
                <option value="STAFF">STAFF</option>
                <option value="CUSTOMER">CUSTOMER (No Admin)</option>
              </select>

              <button
                type="button"
                onClick={() => handleToggleStatus(user.id)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  user.status === "ACTIVE"
                    ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                    : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                }`}
                title={user.status === "ACTIVE" ? "Suspend Staff Access" : "Activate Staff Access"}
              >
                {user.status === "ACTIVE" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setInviteModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md bg-[#FAF9F6] border border-[#D2C2AD] rounded-[2rem] p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E8E1D5] pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5 text-[#8B6D43]" />
                <h3 className="font-serif text-lg font-bold text-[#2D2A26]">
                  Invite Dispensary Operator
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="p-1 rounded-lg text-[#2D2A26]/50 hover:text-[#2D2A26]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Maya Iyer"
                  className="w-full px-3 py-2 bg-white border border-[#D2C2AD]/80 rounded-xl focus:outline-none focus:border-[#8B6D43]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1">
                  Work Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="maya@jassproducts.com"
                  className="w-full px-3 py-2 bg-white border border-[#D2C2AD]/80 rounded-xl focus:outline-none focus:border-[#8B6D43]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1">
                    Role Authority
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white border border-[#D2C2AD]/80 rounded-xl focus:outline-none focus:border-[#8B6D43]"
                  >
                    <option value="STAFF">STAFF (Fulfillment & QA)</option>
                    <option value="STORE_MANAGER">STORE MANAGER</option>
                    <option value="SUPER_ADMIN">SUPER ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={inviteDepartment}
                    onChange={(e) => setInviteDepartment(e.target.value)}
                    placeholder="Operations"
                    className="w-full px-3 py-2 bg-white border border-[#D2C2AD]/80 rounded-xl focus:outline-none focus:border-[#8B6D43]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8E1D5] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#D2C2AD]/80 rounded-xl font-semibold hover:bg-[#F4EFE6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8B6D43] text-white rounded-xl font-semibold hover:bg-[#735732]"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
