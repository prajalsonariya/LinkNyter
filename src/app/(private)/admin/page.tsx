"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Users, Music, PlayCircle, Globe, Laptop, Smartphone, AlertCircle, Download, Eye, EyeOff, Activity, Monitor, Compass } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalTracks: number;
  totalSessions: number;
  activeUsers: number;
  topCountries: { name: string; count: number }[];
  deviceTypes: { name: string; count: number }[];
  topOs: { name: string; count: number }[];
  topBrowsers: { name: string; count: number }[];
  recentUsers: { name: string; email: string; created_at: string }[];
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealedEmails, setRevealedEmails] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "loading") return;
    
    // Check if user is an admin
    if (!session || (session.user as any).role !== "admin") {
      router.push("/dashboard");
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        if (!res.ok) throw new Error("Failed to fetch admin stats");
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session, status, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-error/10 border border-error/20 p-6 rounded-2xl flex items-center gap-4 text-error max-w-2xl">
          <AlertCircle className="w-8 h-8 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-lg mb-1">Failed to Load Dashboard</h3>
            <p className="text-error/80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;



  const calculatePercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return email;
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
  };

  const toggleEmail = (email: string) => {
    setRevealedEmails(prev => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const downloadCSV = () => {
    if (!stats?.recentUsers) return;
    const headers = ["Name", "Email", "Joined On"];
    const csvRows = [headers.join(",")];
    
    stats.recentUsers.forEach(user => {
      const row = [
        `"${user.name || 'Unknown'}"`,
        `"${user.email}"`,
        `"${new Date(user.created_at).toISOString()}"`
      ];
      csvRows.push(row.join(","));
    });
    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "recently_joined_musicians.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-surface relative h-screen">
      {/* Background gradients */}
      <div className="fixed top-0 left-1/4 w-[800px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      <div className="max-w-6xl mx-auto px-12 py-16">
        
        <header className="mb-12">
          <h1 className="font-display-lg text-4xl font-bold text-primary tracking-tight mb-2">
            Developer Analytics
          </h1>
          <p className="text-on-surface-variant font-body-lg">
            Platform wide metrics, user adoption, and playback statistics.
          </p>
        </header>

        {/* Hero KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-surface-container/50 border border-outline-variant/30 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Total Musicians</h3>
            </div>
            <p className="text-4xl font-display-lg font-bold text-on-surface">{stats.totalUsers}</p>
          </div>

          <div className="bg-surface-container/50 border border-outline-variant/30 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#0ea5e9]/10 rounded-full blur-2xl group-hover:bg-[#0ea5e9]/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#0ea5e9]/10 rounded-xl flex items-center justify-center text-[#0ea5e9]">
                <Music className="w-6 h-6" />
              </div>
              <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Tracks Hosted</h3>
            </div>
            <p className="text-4xl font-display-lg font-bold text-on-surface">{stats.totalTracks}</p>
          </div>

          <div className="bg-surface-container/50 border border-outline-variant/30 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#10b981]/10 rounded-full blur-2xl group-hover:bg-[#10b981]/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#10b981]/10 rounded-xl flex items-center justify-center text-[#10b981]">
                <PlayCircle className="w-6 h-6" />
              </div>
              <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Total Playbacks</h3>
            </div>
            <p className="text-4xl font-display-lg font-bold text-on-surface">{stats.totalSessions}</p>
          </div>

          <div className="bg-surface-container/50 border border-outline-variant/30 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#8b5cf6]/10 rounded-full blur-2xl group-hover:bg-[#8b5cf6]/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#8b5cf6]/10 rounded-xl flex items-center justify-center text-[#8b5cf6]">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Active Users</h3>
            </div>
            <p className="text-4xl font-display-lg font-bold text-on-surface">{stats.activeUsers}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Top Countries */}
          <div className="lg:col-span-2 bg-surface-container/30 border border-outline-variant/20 p-8 rounded-3xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display-sm text-2xl font-bold text-on-surface flex items-center gap-3">
                <Globe className="w-6 h-6 text-primary" />
                Audience Demographics
              </h2>
            </div>
            
            <div className="space-y-6">
              {stats.topCountries.length === 0 ? (
                <p className="text-on-surface-variant">No demographic data available yet.</p>
              ) : (
                stats.topCountries.map((c, i) => {
                  const percentage = calculatePercentage(c.count, stats.totalSessions);
                  return (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-on-surface">{c.name === 'Unknown' ? 'Global / Undetected' : c.name}</span>
                        <span className="text-on-surface-variant font-label-caps text-sm">{c.count} sessions • {percentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-1000" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Device Types */}
          <div className="bg-surface-container/30 border border-outline-variant/20 p-8 rounded-3xl">
            <h2 className="font-display-sm text-2xl font-bold text-on-surface mb-8 flex items-center gap-3">
              <Laptop className="w-6 h-6 text-[#0ea5e9]" />
              Device Breakdown
            </h2>
            
            <div className="space-y-6">
              {stats.deviceTypes.length === 0 ? (
                <p className="text-on-surface-variant">No device data available yet.</p>
              ) : (
                stats.deviceTypes.map((d, i) => {
                  const percentage = calculatePercentage(d.count, stats.totalSessions);
                  const isMobile = d.name.toLowerCase() === 'mobile' || d.name.toLowerCase() === 'tablet';
                  
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isMobile ? 'bg-[#8b5cf6]/10 text-[#8b5cf6]' : 'bg-[#0ea5e9]/10 text-[#0ea5e9]'}`}>
                        {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-on-surface">{d.name}</span>
                          <span className="text-on-surface-variant text-sm">{percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${isMobile ? 'bg-[#8b5cf6]' : 'bg-[#0ea5e9]'}`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Operating Systems */}
          <div className="bg-surface-container/30 border border-outline-variant/20 p-8 rounded-3xl">
            <h2 className="font-display-sm text-2xl font-bold text-on-surface mb-8 flex items-center gap-3">
              <Monitor className="w-6 h-6 text-[#10b981]" />
              Operating Systems
            </h2>
            
            <div className="space-y-6">
              {stats.topOs?.length === 0 ? (
                <p className="text-on-surface-variant">No OS data available yet.</p>
              ) : (
                stats.topOs?.map((o, i) => {
                  const percentage = calculatePercentage(o.count, stats.totalSessions);
                  return (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-on-surface">{o.name}</span>
                        <span className="text-on-surface-variant font-label-caps text-sm">{percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#10b981] rounded-full transition-all duration-1000" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Browsers */}
          <div className="bg-surface-container/30 border border-outline-variant/20 p-8 rounded-3xl">
            <h2 className="font-display-sm text-2xl font-bold text-on-surface mb-8 flex items-center gap-3">
              <Compass className="w-6 h-6 text-[#f59e0b]" />
              Web Browsers
            </h2>
            
            <div className="space-y-6">
              {stats.topBrowsers?.length === 0 ? (
                <p className="text-on-surface-variant">No browser data available yet.</p>
              ) : (
                stats.topBrowsers?.map((b, i) => {
                  const percentage = calculatePercentage(b.count, stats.totalSessions);
                  return (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-on-surface">{b.name}</span>
                        <span className="text-on-surface-variant font-label-caps text-sm">{percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#f59e0b] rounded-full transition-all duration-1000" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 mt-8">
          {/* Recent Musicians */}
          <div className="bg-surface-container/30 border border-outline-variant/20 p-8 rounded-3xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display-sm text-2xl font-bold text-on-surface">
                Recently Joined Musicians
              </h2>
              <button 
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-label-caps text-label-caps transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="pb-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Name</th>
                    <th className="pb-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Email</th>
                    <th className="pb-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Joined On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {stats.recentUsers.map((user, i) => (
                    <tr key={i} className="group hover:bg-surface-container-low transition-colors">
                      <td className="py-4 px-2 font-medium text-on-surface">{user.name || "Unknown"}</td>
                      <td className="py-4 px-2 text-on-surface-variant flex items-center gap-2">
                        {revealedEmails.has(user.email) ? user.email : maskEmail(user.email)}
                        <button 
                          onClick={() => toggleEmail(user.email)} 
                          className="text-on-surface-variant/50 hover:text-primary transition-colors p-1"
                          title={revealedEmails.has(user.email) ? "Hide Email" : "Reveal Email"}
                        >
                          {revealedEmails.has(user.email) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="py-4 px-2 text-on-surface-variant">{new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    </tr>
                  ))}
                  {stats.recentUsers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-on-surface-variant">
                        No musicians found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
