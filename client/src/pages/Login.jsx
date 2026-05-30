import {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setUserSession } from "@/utils/auth";
import api from "@/api.js";
import { socket } from "@/socket/socket.js";
const DEMO_ACCOUNTS = [
  { label: "Admin", email: "ahmad.admin@htu.edu.jo", color: "#e9333f" },
  { label: "Instructor", email: "dr.sarah.instructor@htu.edu.jo", color: "#27ae60" },
  { label: "Lab Assistant", email: "eng.assistant@htu.edu.jo", color: "#f39c12" },
  { label: "Student", email: "ahmad.khalil@htu.edu.jo", color: "#3498db" },
];

export function Login() {
  const navigate = useNavigate();
  const [loginStats,setLoginStats] = useState([])
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(()=>{
    const fetchLoginStats = async () => {
      try {
          const res = await api.get("/dashboard/login")
          setLoginStats(res.data)
        console.log(res)
      }catch (err) {
          console.log("Error Fetching Login Stats",err.message)
      }
    }
    fetchLoginStats()
  },[])

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email,
        password
      });
      const { token, user } = res.data;
      setUserSession({
        ...user,
        token
      });
      socket.auth = { token };
      socket.connect();
      socket.emit("register_user", user.id);
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "instructor") navigate("/instructor");
      else if (user.role === "lab-assistant") navigate("/lab-assistant");
      else navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Incorrect email or password");
    }finally {
      setLoading(false)
    }
    /*
    const userPayload = {
      name: name || email.split("@")[0],
      email,
      role: userRole,
      imageUrl: "https://github.com/shadcn.png",
      // If password doesn't look like a real password (demo), mark as must change
      mustChangePassword: password === "demo1234" ? false : true,
      passwordChanged: false,
    };
    */
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword("demo1234");
    setError("");
  };

  return (
      <div className="min-h-screen flex bg-[#f5f5f5]">
        {/* Left panel — branding */}
        <div className="hidden lg:flex lg:w-2/5 bg-[#2c3e50] flex-col justify-between p-12 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#e9333f] translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#e9333f] -translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="relative">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-[#e9333f] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">LG</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">LabGuard</h1>
                <p className="text-gray-400 text-xs">Al Hussein Technical University</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Manage lab equipment<br />
              <span className="text-[#e9333f]">smarter</span>, faster.
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              A unified platform for borrowing, tracking, and managing laboratory equipment across all departments.
            </p>
          </div>

          <div className="relative space-y-3">
            {[
              { num: (loginStats.equipmentCount || "0") + "+", label: "Equipment Items" },
              { num: (loginStats.transactionsCount || "0") + "+", label: "Transactions Processed" },
              { num: "99.8%", label: "System Uptime" },
            ].map((stat, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-[#e9333f]">{stat.num}</span>
                  <span className="text-gray-400 text-sm">{stat.label}</span>
                </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div className="w-10 h-10 bg-[#e9333f] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">LG</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">LabGuard</p>
                <p className="text-xs text-gray-500">Al Hussein Technical University</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 mt-1 text-sm">Sign in to access the laboratory system</p>
            </div>

            {/* Demo quick-login pills */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Quick Demo Login</p>
              <div className="flex flex-wrap gap-2">
                {DEMO_ACCOUNTS.map(d => (
                    <button
                        key={d.label}
                        type="button"
                        onClick={() => fillDemo(d.email)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-80"
                        style={{ backgroundColor: d.color }}
                    >
                      {d.label}
                    </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                      id="email"
                      type="email"
                      placeholder="your.name@htu.edu.jo"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(""); }}
                      className="pl-9 h-11 border-gray-200 focus-visible:border-[#e9333f]"
                      required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(""); }}
                      className="pl-9 pr-10 h-11 border-gray-200 focus-visible:border-[#e9333f]"
                      required
                  />
                  <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
              )}

              <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#e9333f] hover:bg-[#d12233] text-white font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                    <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
                ) : (
                    <span className="flex items-center gap-2">
                  Sign In <ArrowRight size={16} />
                </span>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>Need access? Contact your <span className="text-[#e9333f] font-medium">lab administrator</span></p>
            </div>
          </div>
        </div>
      </div>
  );
}