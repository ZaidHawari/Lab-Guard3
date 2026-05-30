import { Package, Users, CheckCircle, Clock, TrendingUp, XCircle, AlertTriangle, FileDown, FileSpreadsheet, FileText, X, Search, Filter, Plus, Loader2, Eye } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockEquipment } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { exportToPDF, exportToExcel } from "@/utils/exportUtils";
import { AddEquipmentModal } from "@/components/shared/AddEquipmentModal";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, LineChart, Line, Legend, RadarChart,
  Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import api from "@/api.js";

const COLORS = ["#e9333f", "#3498db", "#27ae60", "#f39c12", "#9b59b6"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

const STATUS_COLORS = {
  Approved: "bg-green-100 text-green-800",
  Pending: "bg-amber-100 text-amber-800",
  Completed: "bg-blue-100 text-blue-800",
  Denied: "bg-red-100 text-red-800",
};

// ── All-Transactions Modal ────────────────────────────────────────────────────
function AllTransactionsModal({ onClose }) {
  const [search, setSearch] = useState("");
  const [typeF, setTypeF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [allTransactions, setAll] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await api.get("/transactions");
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.transactions || res.data.data || [];
        if (data.length > 0) {
          console.log("[AllTransactions] Raw field names:", Object.keys(data[0]));
          console.log("[AllTransactions] First record:", data[0]);
        }
        // Normalize field names from backend
        setAll(data.map(t => ({
          id: t.id || t._id,
          equipmentName: t.equipmentName || t.equipment_name || t.equipment?.name || "—",
          type: t.type,
          status: t.status,
          quantity: t.quantity,
          purpose: t.purpose || "—",
          requestDate: t.requestDate || t.request_date || t.createdAt,
          expectedReturnDate: t.expectedReturnDate || t.expected_return_date || t.expectedReturn || t.returnDeadline || t.return_deadline || t.dueDate || t.due_date || null,
          actualReturnDate: t.actualReturnDate || t.actual_return_date || t.returnDate || null,
          userName: t.userName || t.user_name || t.user?.name || t.student?.name || t.borrower?.name || "—",
          studentId: t.studentId || t.student_id || t.universityId || t.university_id || t.universityNumber || t.university_number || t.uniNumber || t.uni_number || t.studentNumber || t.user?.studentId || t.user?.student_id || t.user?.universityId || t.student?.studentId || t.student?.universityId || "—",
          approvedBy: t.approvedBy || t.approved_by || t.approvedByName || null,
          denialReason: t.denialReason || t.denial_reason || t.denyReason || null,
        })));
      } catch (err) {
        console.error("Failed to load transactions:", err);
        toast.error("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filtered = allTransactions.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (t.equipmentName || "").toLowerCase().includes(q) ||
      (t.userName || "").toLowerCase().includes(q) ||
      (t.studentId || "").toLowerCase().includes(q) ||
      (t.approvedBy || "").toLowerCase().includes(q);
    const matchType = typeF === "all" || t.type === typeF;
    const matchStatus = statusF === "all" || t.status === statusF;
    return matchSearch && matchType && matchStatus;
  });

  const handlePDF = () => {
    exportToPDF(filtered, "all-transactions.pdf", "All System Transactions");
    toast.success("PDF exported!", { description: `${filtered.length} records exported.` });
  };

  const handleExcel = () => {
    exportToExcel(filtered, "all-transactions.xlsx", "All System Transactions");
    toast.success("Excel exported!", { description: `${filtered.length} records exported.` });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#2c3e50] to-[#34495e]">
          <div className="flex items-center gap-3">
            <FileText className="text-white" size={22} />
            <div>
              <h2 className="text-lg font-bold text-white">All System Transactions</h2>
              <p className="text-gray-300 text-xs">{loading ? "Loading…" : `${filtered.length} of ${allTransactions.length} records shown`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExcel}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm h-9"
            >
              <FileSpreadsheet size={15} /> Export Excel
            </Button>
            <Button
              onClick={handlePDF}
              className="flex items-center gap-2 bg-[#e9333f] hover:bg-[#d12233] text-white text-sm h-9"
            >
              <FileDown size={15} /> Export PDF
            </Button>
            <button
              onClick={onClose}
              className="ml-2 p-2 rounded-full hover:bg-white/20 text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <Input
              placeholder="Search by student, equipment, uni number…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={typeF} onValueChange={setTypeF}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <Filter size={13} className="mr-1 text-gray-400" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Borrow">Borrow</SelectItem>
              <SelectItem value="Return">Return</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusF} onValueChange={setStatusF}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Denied">Denied</SelectItem>
            </SelectContent>
          </Select>
          {(search || typeF !== "all" || statusF !== "all") && (
            <button
              onClick={() => { setSearch(""); setTypeF("all"); setStatusF("all"); }}
              className="text-xs text-[#e9333f] hover:underline font-medium"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 sticky top-0">
                <TableHead className="text-xs font-semibold whitespace-nowrap">Date</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap">Equipment</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap">Type</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap">Status</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap">Student Name</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap">Uni Number</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap">Approved By</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap text-center">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={28} className="text-gray-300 animate-spin" />
                      <p className="text-sm text-gray-400">Loading transactions…</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length > 0 ? filtered.map(txn => (
                <TableRow key={txn.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                    {txn.requestDate ? new Date(txn.requestDate).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-medium text-gray-900">{txn.equipmentName}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{txn.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[txn.status] || "bg-gray-100 text-gray-700"}`}>
                      {txn.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#3498db] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {(txn.userName || "?").charAt(0)}
                      </div>
                      <p className="text-xs font-medium text-gray-900 whitespace-nowrap">{txn.userName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-gray-700">{txn.studentId || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-gray-600 whitespace-nowrap">{txn.approvedBy || "—"}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs font-semibold text-gray-800">{txn.quantity}</span>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-gray-400">
                    No transactions match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing <strong>{filtered.length}</strong> of <strong>{allTransactions.length}</strong> transactions
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExcel} size="sm" className="text-xs gap-1.5">
              <FileSpreadsheet size={13} className="text-emerald-600" /> Excel
            </Button>
            <Button variant="outline" onClick={handlePDF} size="sm" className="text-xs gap-1.5">
              <FileDown size={13} className="text-[#e9333f]" /> PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TxnDetailModal({ txn, onClose }) {
  if (!txn) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#2c3e50] to-[#34495e]">
          <h2 className="text-base font-bold text-white">Transaction Details</h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded-full"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-3">
          {[
            ["Student", txn.userName],
            ["Uni Number", txn.studentId || "—"],
            ["Equipment", txn.equipmentName],
            ["Quantity", txn.quantity],
            ["Purpose", txn.purpose],
            ["Request Date", txn.requestDate ? new Date(txn.requestDate).toLocaleString() : "—"],
            ["Expected Return", txn.expectedReturnDate ? new Date(txn.expectedReturnDate).toLocaleDateString() : "—"],
            ["Status", txn.status],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-start gap-4">
              <span className="text-xs text-gray-500 font-medium w-36 flex-shrink-0">{label}</span>
              <span className="text-sm font-medium text-gray-900 text-right">{value || "—"}</span>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <Button size="sm" onClick={onClose} className="bg-[#2c3e50] hover:bg-[#34495e] text-white">Close</Button>
        </div>
      </div>
    </div>
  );
}

function DenyReasonModal({ txn, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  if (!txn) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-700 to-red-600">
          <h2 className="text-base font-bold text-white">Deny Request</h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded-full"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Denying borrow request for <span className="font-semibold text-gray-900">{txn.equipmentName}</span> by <span className="font-semibold text-gray-900">{txn.userName}</span>.
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Reason for Denial *</label>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-red-400"
              placeholder="e.g. Equipment reserved for lab exam, insufficient purpose..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
            <p className="text-xs text-gray-400">This reason will be visible to the student.</p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="bg-red-600 hover:bg-red-700 text-white gap-1.5">
            <XCircle size={14} /> Confirm Deny
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function InstructorDashboard() {
  const [showAllTxns, setShowAllTxns] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [denyingTxn, setDenyingTxn] = useState(null);
  const [stats, setStats] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([])
  const equipmentStatus = stats?.equipmentStatus || []
  const equipmentUsage = stats?.equipmentUsage || []
  const peakRequestHours = stats?.peakRequestHours || []
  const weeklyData = stats?.weeklyData || []
  const studentActivityRadar = stats?.studentComplianceMetrics || []
  const fetchStats = async () => {
    try {
      const res = await api.get("/dashboard/instructor")
      setStats(res.data)
    } catch (err) {
      console.log("Pending Approvals Error", err)
    }
  }

  const fetchPendingApprovals = async () => {
    try {
      const res = await api.get("/transactions?status=Pending")
      const raw = Array.isArray(res.data) ? res.data : res.data.transactions || res.data.data || [];
      if (raw.length > 0) console.log("[PendingApprovals] ALL RAW FIELDS:", JSON.stringify(raw[0], null, 2));
      setPendingApprovals(raw.map(t => ({
        id: t.id || t._id,
        equipmentName: t.equipmentName || t.equipment_name || t.equipment?.name || "—",
        type: t.type,
        status: t.status,
        quantity: t.quantity,
        purpose: t.purpose || "—",
        requestDate: t.requestDate || t.request_date || t.createdAt,
        expectedReturnDate: t.expectedReturnDate || t.expected_return_date || t.expectedReturn || t.returnDeadline || t.return_deadline || t.dueDate || t.due_date || null,
        userName: t.userName || t.user_name || t.user?.name || t.student?.name || t.borrower?.name || "—",
        studentId: t.studentId || t.student_id || t.universityId || t.university_id || t.universityNumber || t.university_number || t.uniNumber || t.uni_number || t.studentNumber || t.user?.studentId || t.user?.student_id || t.user?.universityId || t.student?.studentId || t.student?.universityId || "—",
        userRole: t.userRole || t.user?.role || "Student",
        approvedBy: t.approvedBy || t.approved_by || t.approvedByName || null,
      })));
    } catch (err) {
      console.log("Pending Approvals Error", err)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchPendingApprovals()
  }, [])


  const handleApprove = async (id, name) => {
    try {
      await api.patch(`/transactions/${id}/approve`)
      await fetchStats()
      await fetchPendingApprovals()
      toast.success(`Approved borrow request for ${name}`);
    } catch (err) {
      console.log("Approve Transaction Error", err)
    }
  };

  const handleDeny = async (id, name, reason) => {
    try {
      await api.patch(`/transactions/${id}/deny`, { reason });
      await fetchStats();
      await fetchPendingApprovals();
      setDenyingTxn(null);
      toast.error(`Denied borrow request for ${name}`);
    } catch (err) {
      console.log("Deny Transaction Error", err);
    }
  };
  const instructorStats = stats?.instructorStats
  console.log(stats)
  const totalStudents = stats?.totalStudents || 0;
  const activeEquipment = equipmentStatus.find(
      e => e.status === "In Use"
  )?.value || 0;



  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {showAllTxns && <AllTransactionsModal onClose={() => setShowAllTxns(false)} />}

      {denyingTxn && (
        <DenyReasonModal
          txn={denyingTxn}
          onConfirm={(reason) => handleDeny(denyingTxn.id, denyingTxn.equipmentName, reason)}
          onClose={() => setDenyingTxn(null)}
        />
      )}

      <TxnDetailModal txn={selectedTxn} onClose={() => setSelectedTxn(null)} />

      <AddEquipmentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={() => { }}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage requests · Monitor student activity</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {pendingApprovals.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
              <AlertTriangle size={16} className="text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">
                {pendingApprovals.length} pending approval{pendingApprovals.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#27ae60] hover:bg-[#219a52] text-white text-sm h-10"
          >
            <Plus size={16} /> Add Equipment
          </Button>
          <Button
            onClick={() => setShowAllTxns(true)}
            className="flex items-center gap-2 bg-[#2c3e50] hover:bg-[#34495e] text-white text-sm h-10"
          >
            <FileText size={16} /> View All Transactions
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Pending Approvals" value={pendingApprovals.length} icon={Clock} color="#f39c12" />
        <StatCard title="Approved Today" value={instructorStats?.approvedToday.count ?? 0} icon={CheckCircle} color="#27ae60" trend={{ value: String(instructorStats?.approvedToday.changePercent ?? 0) + "%", isPositive: instructorStats?.approvedToday.isPositive ?? false }} />
        <StatCard title="Active Students" value={totalStudents} icon={Users} color="#3498db" />
        <StatCard title="Equipment in Use" value={activeEquipment} icon={TrendingUp} color="#e9333f" />
      </div>

      {/* Row 1: Weekly Activity + Hourly */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Weekly Request vs Approval Activity</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e9333f" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#e9333f" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#27ae60" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#27ae60" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="requests" stroke="#e9333f" fill="url(#reqGrad)" strokeWidth={2.5} name="Requests" dot={{ r: 4, fill: "#e9333f" }} />
              <Area type="monotone" dataKey="approvals" stroke="#27ae60" fill="url(#appGrad)" strokeWidth={2.5} name="Approvals" dot={{ r: 4, fill: "#27ae60" }} />
              <Line type="monotone" dataKey="denials" stroke="#f39c12" strokeWidth={2} strokeDasharray="4 4" name="Denials" dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Peak Request Hours</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={peakRequestHours} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} angle={-35} textAnchor="end" />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="requests" name="Requests" radius={[4, 4, 0, 0]}>
                {peakRequestHours.map((entry, i) => (
                  <Cell key={i} fill={entry.requests >= 12 ? "#e9333f" : entry.requests >= 8 ? "#f39c12" : "#3498db"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Most Used Equipment + Purpose Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Most Requested Equipment</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={equipmentUsage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" stroke="#9ca3af" fontSize={11} />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="borrows" name="Borrow Requests" radius={[0, 4, 4, 0]}>
                {equipmentUsage.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>


      </div>

      {/* Row 3: Equipment Status + Student Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-5">Equipment Status Overview</h3>
          <div className="space-y-4">
            {equipmentStatus.map(data => {
              const count = data.value
              const pct = data.percentage
              return (
                <div key={data.status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{data.status}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {count} <span className="text-xs text-gray-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: data.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Student Compliance Metrics</h3>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={studentActivityRadar}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <Radar name="Class Average" dataKey="A" stroke="#e9333f" fill="#e9333f" fillOpacity={0.2} strokeWidth={2} dot />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending Approvals Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            Pending Approval Requests
            {pendingApprovals.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                {pendingApprovals.length}
              </span>
            )}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllTxns(true)}
            className="text-xs text-gray-500 hover:text-gray-700 gap-1"
          >
            <FileText size={13} /> View all transactions
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Student</TableHead>
                <TableHead>Uni Number</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApprovals.length > 0 ? pendingApprovals.map(txn => (
                <TableRow key={txn.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#3498db] text-white flex items-center justify-center text-xs font-bold">
                        {txn.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{txn.userName}</p>
                        <p className="text-xs text-gray-500">{txn.userRole}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-gray-700">{txn.studentId || "—"}</span>
                  </TableCell>
                  <TableCell><p className="text-sm font-medium">{txn.equipmentName}</p></TableCell>
                  <TableCell><p className="text-sm">{txn.quantity}</p></TableCell>
                  <TableCell><p className="text-sm text-gray-600 max-w-xs truncate">{txn.purpose}</p></TableCell>
                  <TableCell><p className="text-sm">{new Date(txn.requestDate).toLocaleDateString()}</p></TableCell>
                  <TableCell><StatusBadge status={txn.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedTxn(txn)}
                        className="flex items-center gap-1 text-xs text-[#3498db] font-medium hover:underline mr-1"
                      >
                        <Eye size={13} /> Details
                      </button>
                      <Button size="sm" onClick={() => handleApprove(txn.id, txn.equipmentName)}
                        className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs">
                        <CheckCircle size={13} className="mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setDenyingTxn(txn)}
                        className="border-red-400 text-red-600 hover:bg-red-50 h-7 text-xs">
                        <XCircle size={13} className="mr-1" /> Deny
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <CheckCircle className="mx-auto text-green-400 mb-2" size={40} />
                    <p className="text-gray-500 text-sm">All caught up! No pending approvals.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
