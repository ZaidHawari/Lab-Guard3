import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserSession, setUserSession } from "@/utils/auth";
import api from "@/api.js";
import { toast } from "sonner";

function PasswordStrength({ password }) {
  const checks = [
    { label: "At least 8 characters", pass: password.length >= 8 },
    { label: "Contains uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", pass: /[a-z]/.test(password) },
    { label: "Contains a number", pass: /[0-9]/.test(password) },
    { label: "Contains special character", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const levels = [
    { label: "Too weak", color: "bg-red-500", text: "text-red-600" },
    { label: "Weak", color: "bg-orange-500", text: "text-orange-600" },
    { label: "Fair", color: "bg-yellow-500", text: "text-yellow-600" },
    { label: "Good", color: "bg-blue-500", text: "text-blue-600" },
    { label: "Strong", color: "bg-green-500", text: "text-green-600" },
  ];
  const level = levels[Math.max(0, score - 1)] || levels[0];

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= score ? level.color : "bg-gray-200"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${level.text}`}>Password strength: {level.label}</p>
      {/* Checklist */}
      <div className="grid grid-cols-1 gap-1 mt-1">
        {checks.map(c => (
          <p key={c.label} className={`text-xs flex items-center gap-1.5 ${c.pass ? "text-green-600" : "text-gray-400"}`}>
            <span>{c.pass ? "✓" : "○"}</span> {c.label}
          </p>
        ))}
      </div>
    </div>
  );
}

export function ChangePassword() {
  const navigate = useNavigate();
  const user = getUserSession();

  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleShow = (field) => setShow(p => ({ ...p, [field]: !p[field] }));
  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.current) e.current = "Current password is required";
    if (!form.newPass) e.newPass = "New password is required";
    else if (form.newPass.length < 8) e.newPass = "Password must be at least 8 characters";
    else if (form.newPass === form.current) e.newPass = "New password must be different from current";
    if (!form.confirm) e.confirm = "Please confirm your new password";
    else if (form.confirm !== form.newPass) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await api.post("/users/me/change-password", {
        currentPassword: form.current,
        newPassword: form.newPass,
        confirmPassword: form.confirm
      });
      setUserSession({ ...user, passwordChanged: true, mustChangePassword: false });
      setSuccess(true);
      toast.success("Password changed successfully!");
    } catch (err) {
      console.log(err)
      const msg = err.response?.data?.error || "Failed to change password";
      setErrors({ current: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-green-600" size={36} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Updated!</h2>
          <p className="text-gray-500 text-sm mb-6">Your password has been changed successfully. Use your new password next time you log in.</p>
          <Button
            onClick={() => {
              const role = getUserSession()?.role;
              if (role === "admin") navigate("/admin");
              else if (role === "instructor") navigate("/instructor");
              else if (role === "lab-assistant") navigate("/lab-assistant");
              else navigate("/");
            }}
            className="w-full bg-[#e9333f] hover:bg-[#d12233] text-white"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
          <p className="text-gray-500 mt-1 text-sm">Update your account password</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">

            {/* Current user info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-[#e9333f] text-white flex items-center justify-center font-bold text-base flex-shrink-0">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>

            {/* Current Password */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">
                <Lock size={13} className="inline mr-1" />Current Password
              </Label>
              <div className="relative">
                <Input
                  type={show.current ? "text" : "password"}
                  placeholder="Enter your current password"
                  value={form.current}
                  onChange={e => set("current", e.target.value)}
                  className={`pr-10 ${errors.current ? "border-red-400" : ""}`}
                />
                <button type="button" onClick={() => toggleShow("current")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.current && <p className="text-xs text-red-500">{errors.current}</p>}
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">
                <Lock size={13} className="inline mr-1" />New Password
              </Label>
              <div className="relative">
                <Input
                  type={show.newPass ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={form.newPass}
                  onChange={e => set("newPass", e.target.value)}
                  className={`pr-10 ${errors.newPass ? "border-red-400" : ""}`}
                />
                <button type="button" onClick={() => toggleShow("newPass")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show.newPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.newPass && <p className="text-xs text-red-500">{errors.newPass}</p>}
              <PasswordStrength password={form.newPass} />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">
                <Lock size={13} className="inline mr-1" />Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  type={show.confirm ? "text" : "password"}
                  placeholder="Re-enter your new password"
                  value={form.confirm}
                  onChange={e => set("confirm", e.target.value)}
                  className={`pr-10 ${errors.confirm ? "border-red-400"
                    : form.confirm && form.confirm === form.newPass ? "border-green-400"
                      : ""
                    }`}
                />
                <button type="button" onClick={() => toggleShow("confirm")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirm && <p className="text-xs text-red-500">{errors.confirm}</p>}
              {!errors.confirm && form.confirm && form.confirm === form.newPass && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Passwords match
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e9333f] hover:bg-[#d12233] text-white py-6 text-base font-semibold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating password...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck size={18} /> Update Password
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Tips panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#e9333f]" /> Password Tips
            </h3>
            <ul className="space-y-2 text-xs text-gray-600">
              {[
                "Use at least 8 characters",
                "Mix uppercase and lowercase letters",
                "Include numbers and symbols",
                "Avoid using your name or email",
                "Don't reuse old passwords",
                "Never share your password",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#e9333f] mt-0.5">•</span> {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800">Security Notice</p>
                <p className="text-xs text-amber-700 mt-1">
                  After changing your password, you will continue your current session. You'll need the new password on your next login.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
