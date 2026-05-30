import { Package, Clock, CheckCircle, XCircle, TrendingUp, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { EquipmentCard } from "@/components/shared/EquipmentCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Link, useNavigate } from "react-router-dom";
import {useEffect, useState} from "react";
import api from "@/api.js";

export function StudentDashboard() {
  const [stats, setStats] = useState(null);
  const [transactions,setTransactions] = useState([])
  const [equipment,setEquipment] = useState([])
  const [recentNotifications,setRecentNotifications] = useState([])

  const weeklyData = stats?.weeklyActivity || []
  const equipmentByCategory = stats?.equipmentByCategory || []
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/dashboard/student");
        setStats(res.data);
      } catch (err) {
        console.log("Dashboard error:", err);
      }
    };

    const fetchRecentTransactions = async () => {
      try{
        const res = await api.get("/users/me/transactions?limit=4")
        setTransactions(res.data)
      }catch (err){
        console.log(err)
      }
    }
    const fetchRecentEquipment= async () => {
      try{
        const res = await api.get("/equipment")
        setEquipment(res.data)
      }catch (err){
        console.log(err)
      }
    }
    const fetchRecentNotifications = async () => {
      try{
        const res = await api.get("/users/me/notifications?limit=4")
        setRecentNotifications(res.data)
      }catch (err){
        console.log(err)
      }
    }
    fetchDashboard();
    fetchRecentTransactions()
    fetchRecentEquipment()
    fetchRecentNotifications()
  }, []);
  const navigate = useNavigate();
  // Calculate statistics
  const pendingRequests = stats?.pendingRequests || 0;
  const completedReturnsStats = stats?.completedReturnsStats;
  const availableEquipment = stats?.availableEquipment || 0;

  const COLORS = ['#e9333f', '#2c3e50', '#3498db', '#95a5a6'];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your laboratory activity overview</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Borrows"
          value={stats?.activeBorrows.count ?? 0}
          icon={Package}
          color="#e9333f"
          trend={{ value: String(stats?.activeBorrows.changePercent ?? 0) + "%", isPositive: stats?.activeBorrows.isPositive ?? false }}
        />
        <StatCard
          title="Pending Requests"
          value={stats?.pendingRequests.count ?? 0}
          icon={Clock}
          color="#f39c12"
        />
        <StatCard
          title="Completed Returns"
          value={stats?.completedReturns.count ?? 0}
          icon={CheckCircle}
          color="#27ae60"
          trend={{ value: String(stats?.completedReturns.changePercent ?? 0) + "%", isPositive: stats?.completedReturns.isPositive ?? false }}
        />
        <StatCard
          title="Available Equipment"
          value={stats?.availableEquipment.count ?? 0}
          icon={TrendingUp}
          color="#3498db"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis allowDecimals={false} stroke="#6b7280" />
              <Tooltip />
              <Bar key="borrows-bar" dataKey="borrows" fill="#e9333f" radius={[8, 8, 0, 0]} />
              <Bar key="returns-bar" dataKey="returns" fill="#2c3e50" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#e9333f] rounded"></div>
              <span className="text-sm text-gray-600">Borrows</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#2c3e50] rounded"></div>
              <span className="text-sm text-gray-600">Returns</span>
            </div>
          </div>
        </div>

        {/* Equipment by Category */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={equipmentByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {equipmentByCategory.map((entry, index) => (
                  <Cell key={entry.id} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Notifications & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notifications */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentNotifications.map((notif) => {
              const icons = {
                success: <CheckCircle className="text-green-500" size={20} />,
                error: <XCircle className="text-red-500" size={20} />,
                warning: <AlertCircle className="text-yellow-500" size={20} />,
                info: <Package className="text-blue-500" size={20} />
              };
              return (
                <div key={notif.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    {icons[notif.type]}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    {!notif.is_read && <div className="w-2 h-2 bg-[#e9333f] rounded-full mt-2"></div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {transactions.slice(0, 4).map((txn) => (
              <div key={txn.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{txn.equipmentName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {txn.type} • Qty: {txn.quantity}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(txn.requestDate).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={txn.status} />
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200">
            <Link to="/history" className="text-sm text-[#e9333f] hover:text-[#d12233] font-medium">
              View All Transactions →
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Available Equipment */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Available Equipment</h3>
          <Link to="/equipment" className="text-sm text-[#e9333f] hover:text-[#d12233] font-medium">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {equipment.filter(e => e.availableQuantity > 0).slice(0, 4).map((equipment) => (
            <EquipmentCard
              key={equipment.id}
              equipment={equipment}
              onBorrow={() => navigate("/borrow", { state: { selectedEquipmentId: equipment.id } })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
