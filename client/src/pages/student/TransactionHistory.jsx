import { useEffect, useState } from "react";
import { Download, FileText, Filter, Calendar, Loader2, Eye, X } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { exportToPDF, exportToExcel } from "@/utils/exportUtils";
import { getUserSession } from "@/utils/auth";
import { toast } from "sonner";
import api from "@/api.js";

function TransactionDetailModal({ txn, onClose }) {
  if (!txn) return null;

  const statusColors = {
    Approved: "bg-green-100 text-green-800 border-green-200",
    Pending: "bg-amber-100 text-amber-800 border-amber-200",
    Completed: "bg-blue-100 text-blue-800 border-blue-200",
    Denied: "bg-red-100 text-red-800 border-red-200",
  };

  const denialReason = txn.denialReason || txn.denial_reason;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#2c3e50] to-[#34495e]">
          <div>
            <h2 className="text-base font-bold text-white">Transaction Details</h2>
            <p className="text-gray-300 text-xs mt-0.5">{txn.equipmentName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Status badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColors[txn.status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
              {txn.status}
            </span>
          </div>

          {/* Details grid */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
            {[
              ["Equipment", txn.equipmentName],
              ["Type", txn.type],
              ["Quantity", txn.quantity],
              ["Request Date", txn.requestDate ? new Date(txn.requestDate).toLocaleString() : "—"],
              ["Expected Return", txn.expectedReturnDate ? new Date(txn.expectedReturnDate).toLocaleDateString() : "—"],
              ["Approved By", txn.approvedBy || "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between px-4 py-3">
                <span className="text-xs text-gray-500 w-36 flex-shrink-0">{label}</span>
                <span className="text-sm font-medium text-gray-900 text-right">{value || "—"}</span>
              </div>
            ))}
          </div>

          {/* Purpose */}
          {txn.purpose && txn.purpose !== "—" && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Purpose</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-gray-800 leading-relaxed">{txn.purpose}</p>
              </div>
            </div>
          )}

          {/* Denial reason — only shown if denied */}
          {txn.status === "Denied" && denialReason && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Denial Reason</p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-800 leading-relaxed">{denialReason}</p>
              </div>
            </div>
          )}

        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <Button size="sm" onClick={onClose} className="bg-[#e9333f] hover:bg-[#d12233] text-white">Close</Button>
        </div>

      </div>
    </div>
  );
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTxn, setSelectedTxn] = useState(null);

  const sessionUser = getUserSession();

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/me/transactions");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.transactions || res.data.data || [];
      setTransactions(data);
    } catch (err) {
      console.error("Transaction History error:", err);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const normalize = (txn) => ({
    id: txn.id || txn._id,
    equipmentName: txn.equipmentName || txn.equipment_name || txn.equipment?.name || "—",
    type: txn.type,
    status: txn.status,
    quantity: txn.quantity,
    purpose: txn.purpose || "—",
    requestDate: txn.requestDate || txn.request_date || txn.createdAt,
    expectedReturnDate: txn.expectedReturnDate || txn.expected_return_date || txn.expectedReturn || txn.dueDate || txn.due_date || null,
    actualReturnDate: txn.actualReturnDate || txn.actual_return_date || txn.returnDate || null,
    approvedBy: txn.approvedBy || txn.approved_by || txn.approvedByName || null,
    denialReason: txn.denialReason || txn.denial_reason || txn.denyReason || null,
    userName: txn.userName || txn.user_name || txn.user?.name || txn.student?.name || txn.borrower?.name || "—",
    studentId: txn.studentId || txn.student_id || txn.user?.studentId || txn.user?.student_id || txn.studentNumber || "—",
  });

  const normalized = transactions.map(normalize);

  const filteredTransactions = normalized.filter(txn => {
    const matchesSearch =
      (txn.equipmentName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (txn.purpose || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || txn.type === typeFilter;
    const matchesStatus = statusFilter === "all" || txn.status === statusFilter;

    let matchesDate = true;
    if (dateFrom || dateTo) {
      const txnDate = new Date(txn.requestDate);
      txnDate.setHours(0, 0, 0, 0);
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        matchesDate = txnDate >= from;
      }
      if (dateTo && matchesDate) {
        const to = new Date(dateTo);
        to.setHours(0, 0, 0, 0);
        matchesDate = txnDate <= to;
      }
    }
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const handleExportPDF = () => {
    exportToPDF(
      filteredTransactions,
      `my-transactions-${sessionUser?.name?.replace(/\s+/g, "-") || "student"}.pdf`,
      `Transaction History — ${sessionUser?.name || "Student"}`
    );
    toast.success("PDF exported successfully!");
  };

  const handleExportExcel = () => {
    exportToExcel(
      filteredTransactions,
      `my-transactions-${sessionUser?.name?.replace(/\s+/g, "-") || "student"}.xlsx`,
      `Transaction History — ${sessionUser?.name || "Student"}`
    );
    toast.success("Excel file exported successfully!");
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {selectedTxn && <TransactionDetailModal txn={selectedTxn} onClose={() => setSelectedTxn(null)} />}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-600 mt-1">
            Your personal equipment transaction records
            {sessionUser?.name && (
              <span className="ml-1 text-[#e9333f] font-medium">— {sessionUser.name}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2"
            disabled={filteredTransactions.length === 0}>
            <FileText size={16} /> Export PDF
          </Button>
          <Button onClick={handleExportExcel}
            className="flex items-center gap-2 bg-[#e9333f] hover:bg-[#d12233] text-white"
            disabled={filteredTransactions.length === 0}>
            <Download size={16} /> Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <Input type="text" placeholder="Search by equipment or purpose..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="w-36">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger><Filter className="mr-2" size={16} /><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Borrow">Borrow</SelectItem>
                <SelectItem value="Return">Return</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-36">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><Filter className="mr-2" size={16} /><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Denied">Denied</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 font-medium pl-1">From</span>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 font-medium pl-1">To</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
            </div>
          </div>
          {(searchQuery || typeFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo) && (
            <button onClick={() => { setSearchQuery(""); setTypeFilter("all"); setStatusFilter("all"); setDateFrom(""); setDateTo(""); }}
              className="text-xs text-[#e9333f] hover:underline font-medium self-end pb-2">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Transactions", value: filteredTransactions.length, color: "text-gray-900" },
          { label: "Approved", value: filteredTransactions.filter(t => t.status === "Approved").length, color: "text-green-600" },
          { label: "Pending", value: filteredTransactions.filter(t => t.status === "Pending").length, color: "text-yellow-600" },
          { label: "Completed", value: filteredTransactions.filter(t => t.status === "Completed").length, color: "text-blue-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
              {loading ? <span className="text-gray-300 animate-pulse">—</span> : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={36} className="text-gray-300 animate-spin" />
            <p className="text-gray-400 text-sm">Loading your transactions…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? filteredTransactions.map((txn) => (
                  <TableRow key={txn.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">
                            {txn.requestDate ? new Date(txn.requestDate).toLocaleDateString() : "—"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {txn.requestDate ? new Date(txn.requestDate).toLocaleTimeString() : ""}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-gray-900">{txn.equipmentName}</p>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${txn.type === "Borrow" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                        {txn.type}
                      </span>
                    </TableCell>
                    <TableCell><p className="text-sm">{txn.quantity}</p></TableCell>
                    <TableCell><p className="text-sm text-gray-600 max-w-xs truncate">{txn.purpose}</p></TableCell>
                    <TableCell><StatusBadge status={txn.status} /></TableCell>
                    <TableCell><p className="text-sm text-gray-600">{txn.approvedBy || "—"}</p></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedTxn(txn)}
                        className="h-7 text-xs gap-1 text-[#3498db] border-[#3498db] hover:bg-[#3498db] hover:text-white">
                        <Eye size={13} /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <FileText className="mx-auto text-gray-300 mb-3" size={48} />
                      <p className="text-gray-500 font-medium">No transactions found</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {transactions.length === 0
                          ? "You have no transaction records yet."
                          : "Try adjusting your search or filters."}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
