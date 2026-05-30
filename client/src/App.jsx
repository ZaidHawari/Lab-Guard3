import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import { RootLayout } from "@/components/layouts/RootLayout";
import { StudentDashboard } from "@/pages/student/StudentDashboard";
import { EquipmentBrowse } from "@/pages/student/EquipmentBrowse";
import { BorrowRequest } from "@/pages/student/BorrowRequest";
import { TransactionHistory } from "@/pages/student/TransactionHistory";
import { InstructorDashboard } from "@/pages/instructor/InstructorDashboard";
import { LabAssistantDashboard } from "@/pages/labassistant/LabAssistantDashboard";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { RegisterUser } from "@/pages/admin/RegisterUser";
import { ChangePassword } from "@/pages/ChangePassword";
import { Login } from "@/pages/Login";
import { NotFound } from "@/pages/NotFound";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {getUserSession} from "@/utils/auth.js";

// redirect non-student roles to their home page
function RootIndex() {
  const user = getUserSession()
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (user.role === "instructor")    return <Navigate to="/instructor" replace />;
  if (user.role === "lab-assistant") return <Navigate to="/lab-assistant" replace />;
  if (user.role === "admin")         return <Navigate to="/admin" replace />;
  return <StudentDashboard />;
}

const router = createBrowserRouter([
  { path: "/login", Component: Login },
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, element: <RootIndex /> },
      { path: "change-password", Component: ChangePassword },
      {
        path: "equipment",
        element: <ProtectedRoute allowedRoles={["student", "admin"]}><EquipmentBrowse /></ProtectedRoute>
      },
      {
        path: "borrow",
        element: <ProtectedRoute allowedRoles={["student", "admin"]}><BorrowRequest /></ProtectedRoute>
      },
      {
        path: "history",
        element: <ProtectedRoute allowedRoles={["student", "admin"]}><TransactionHistory /></ProtectedRoute>
      },
      {
        path: "instructor",
        element: <ProtectedRoute allowedRoles={["instructor", "admin"]}><InstructorDashboard /></ProtectedRoute>
      },
      {
        path: "lab-assistant",
        element: <ProtectedRoute allowedRoles={["lab-assistant", "admin"]}><LabAssistantDashboard /></ProtectedRoute>
      },
      {
        path: "admin",
        element: <ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>
      },
      {
        path: "admin/register-user",
        element: <ProtectedRoute allowedRoles={["admin"]}><RegisterUser /></ProtectedRoute>
      },
    ]
  },
  {
    path: "*",
    Component: NotFound,
  },
]);

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </>
  );
}