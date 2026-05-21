import { Package, AlertCircle, Wrench, CheckCircle, MapPin, Search, Plus, Trash2, AlertTriangle, X } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { mockEquipment } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddEquipmentModal } from "@/components/shared/AddEquipmentModal";
import api from "@/api.js";

export function LabAssistantDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [maintenanceNotes, setMaintenanceNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }
  const [quantityEquipment, setQuantityEquipment] = useState(null); // equipment being edited
  const [newTotalQty, setNewTotalQty] = useState(0);
  const [stats, setStats] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const fetchStats = async () => {
    try {
      const res = await api.get("/dashboard/lab-assistant")
      setStats(res.data)
    } catch (err) {
      console.log("Lab Assistant Stats Error", err)
    }
  }
  const fetchEquipment = async () => {
    try {
      const res = await api.get("/equipment")
      setEquipment(res.data)
    } catch (err) {
      console.log("Lab Assistant Equipment Error", err)
    }
  }
  useEffect(() => {
    fetchStats()
    fetchEquipment()
  }, [])
  const labAssistantStats = stats?.labAssistantStats
  const totalEquipment = labAssistantStats?.totalEquipment.count || 0;
  const availableCount = labAssistantStats?.available.count || 0;
  const maintenanceCount = labAssistantStats?.maintenance.count || 0;
  const inUseCount = labAssistantStats?.inUse.count || 0

  const handleDelete = (id, name) => {
    setConfirmDelete({ id, name });
  };

  const handleConfirmedDelete = async () => {
    if (!confirmDelete) return;
    const { id, name } = confirmDelete;
    setConfirmDelete(null);
    try {
      // Try standard REST delete endpoint
      await api.delete(`/equipment/${id}`);
      setEquipment(prev => prev.filter(e => e.id !== id && e._id !== id));
      await fetchStats()
      toast.success(`"${name}" deleted from inventory.`);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        toast.error(`Delete endpoint not found. Ask your backend developer to add: DELETE /api/equipment/:id`);
      } else if (status === 403) {
        toast.error("You don't have permission to delete equipment.");
      } else {
        toast.error(`Failed to delete "${name}". ${err?.response?.data?.message || err.message || ""}`);
      }
      console.error("Delete equipment error:", err?.response?.data || err);
    }
  };

  const handleUpdateQuantity = async () => {
    if (!quantityEquipment) return;
    if (newTotalQty < 1) {
      toast.error("Total quantity must be at least 1");
      return;
    }
    const currentlyInUse = quantityEquipment.totalQuantity - quantityEquipment.availableQuantity;
    if (newTotalQty < currentlyInUse) {
      toast.error(`Cannot set total below ${currentlyInUse} — that many units are currently in use`);
      return;
    }
    try {
      await api.patch("/equipment/update", {
        id: quantityEquipment.id,
        totalQuantity: newTotalQty,
        availableQuantity: newTotalQty - currentlyInUse,
      });
      await fetchEquipment();
      await fetchStats();
      toast.success(`Quantity updated to ${newTotalQty}`);
    } catch (err) {
      toast.error(`Failed to update quantity. ${err?.response?.data?.message || err.message || ""}`);
      console.error("Update quantity error:", err);
    } finally {
      setQuantityEquipment(null);
      setNewTotalQty(0);
    }
  };

  const filteredEquipment = equipment.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error("Please select a status");
      return;
    }
    try {
      await api.patch("/equipment/update", {
        id: selectedEquipment.id,
        status: newStatus
      })
      await fetchStats()
      await fetchEquipment()
      toast.success(`Equipment status updated to ${newStatus}`);
    } catch (err) {
      console.log("Update Status Error", err)
    } finally {
      setSelectedEquipment(null);
      setMaintenanceNotes("");
      setNewStatus("");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'text-green-600 bg-green-100';
      case 'In Use':
        return 'text-blue-600 bg-blue-100';
      case 'Maintenance':
        return 'text-orange-600 bg-orange-100';
      case 'Reserved':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-700 to-red-600">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-white" />
                <h2 className="text-base font-bold text-white">Delete Equipment</h2>
              </div>
              <button onClick={() => setConfirmDelete(null)} className="text-white hover:bg-white/20 p-1 rounded-full">
                <X size={16} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">"{confirmDelete.name}"</span>{" "}
                from the inventory?
              </p>
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5">
                <AlertTriangle size={12} /> This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmedDelete}
                className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
              >
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      <AddEquipmentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(newEq) => {
          fetchEquipment()
          fetchStats();
        }}
      />

      {/* Update Quantity Modal */}
      {quantityEquipment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#2c3e50] to-[#34495e]">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-white" />
                  <h2 className="text-base font-bold text-white">Update Quantity</h2>
                </div>
                <button onClick={() => setQuantityEquipment(null)} className="text-white hover:bg-white/20 p-1 rounded-full">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{quantityEquipment.name}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{quantityEquipment.serialNumber}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Current total</span>
                    <span className="font-semibold text-gray-900">{quantityEquipment.totalQuantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Currently in use</span>
                    <span className="font-semibold text-blue-600">
                    {quantityEquipment.totalQuantity - quantityEquipment.availableQuantity}
                  </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Currently available</span>
                    <span className="font-semibold text-green-600">{quantityEquipment.availableQuantity}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">New Total Quantity</Label>
                  <div className="flex items-center gap-3">
                    <button
                        onClick={() => setNewTotalQty(q => Math.max(1, q - 1))}
                        className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      −
                    </button>
                    <input
                        type="number"
                        min={1}
                        value={newTotalQty}
                        onChange={e => setNewTotalQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 text-center text-xl font-bold text-gray-900 border border-gray-200 rounded-xl h-10 focus:outline-none focus:ring-2 focus:ring-[#e9333f]"
                    />
                    <button
                        onClick={() => setNewTotalQty(q => q + 1)}
                        className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  {newTotalQty !== quantityEquipment.totalQuantity && (
                      <p className="text-xs text-center text-gray-500">
                        Available after update:{" "}
                        <span className="font-semibold text-green-600">
                      {newTotalQty - (quantityEquipment.totalQuantity - quantityEquipment.availableQuantity)}
                    </span>
                      </p>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setQuantityEquipment(null)}>
                  Cancel
                </Button>
                <Button
                    className="flex-1 bg-[#e9333f] hover:bg-[#d12233] text-white"
                    onClick={handleUpdateQuantity}
                    disabled={newTotalQty === quantityEquipment.totalQuantity}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lab Assistant Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage laboratory equipment inventory</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#e9333f] hover:bg-[#d12233] text-white"
        >
          <Plus size={16} /> Add Equipment
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Equipment"
          value={totalEquipment}
          icon={Package}
          color="#3498db"
          trend={{ value: String(labAssistantStats?.totalEquipment.changePercent ?? 0) + "%", isPositive: labAssistantStats?.totalEquipment.isPositive ?? false }}
        />
        <StatCard
          title="Available"
          value={availableCount}
          icon={CheckCircle}
          color="#27ae60"
        />
        <StatCard
          title="In Maintenance"
          value={maintenanceCount}
          icon={Wrench}
          color="#f39c12"
        />
        <StatCard
          title="Currently in Use"
          value={inUseCount}
          icon={AlertCircle}
          color="#e9333f"
        />
      </div>

      {/* Equipment Inventory */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Equipment Inventory</h3>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search by name, location, or serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Equipment</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.map((equipment) => (
                <TableRow key={equipment.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={equipment.imageUrl}
                        alt={equipment.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{equipment.name}</p>
                        <p className="text-xs text-gray-500">{equipment.category}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-mono text-gray-600">{equipment.serialNumber}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin size={14} className="text-gray-400" />
                      {equipment.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">{equipment.availableQuantity}</span>
                      <span className="text-gray-500"> / {equipment.totalQuantity}</span>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-[#e9333f] h-1.5 rounded-full"
                        style={{ width: `${(equipment.availableQuantity / equipment.totalQuantity) * 100}%` }}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(equipment.status)}>
                      {equipment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedEquipment(equipment);
                          setNewStatus(equipment.status);
                        }}
                        className="text-[#e9333f] border-[#e9333f] hover:bg-[#e9333f] hover:text-white"
                      >
                        Update Status
                      </Button>
                      <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setQuantityEquipment(equipment);
                            setNewTotalQty(equipment.totalQuantity);
                          }}
                          className="text-blue-600 border-blue-300 hover:bg-blue-600 hover:text-white"
                      >
                        <Package size={13} className="mr-1" />
                        Qty
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(equipment.id, equipment.name)}
                        className="text-red-600 border-red-300 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Location Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment by Location</h3>
          <div className="space-y-3">
            {
              stats?.labs?.map((lab) => {
                return (
                  <div key={lab.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{lab.name}</span>
                    </div>
                    <Badge variant="outline">{lab.equipment_count} items</Badge>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Required</h3>
          <div className="space-y-3">
            {equipment.filter(e => e.status === 'Maintenance').map((eq) => (
              <div key={eq.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{eq.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{eq.location}</p>
                  </div>
                  <Wrench size={16} className="text-orange-600" />
                </div>
              </div>
            ))}
            {equipment.filter(e => e.status === 'Maintenance').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm">All equipment in good condition</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Status Dialog */}
      <Dialog open={!!selectedEquipment} onOpenChange={() => setSelectedEquipment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Equipment Status</DialogTitle>
            <DialogDescription>
              Change the status and add notes for {selectedEquipment?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Equipment</Label>
              <p className="text-sm font-medium">{selectedEquipment?.name}</p>
              <p className="text-xs text-gray-500">{selectedEquipment?.serialNumber}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="In Use">In Use</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about the status change..."
                value={maintenanceNotes}
                onChange={(e) => setMaintenanceNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setSelectedEquipment(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              className="flex-1 bg-[#e9333f] hover:bg-[#d12233] text-white"
            >
              Update Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
