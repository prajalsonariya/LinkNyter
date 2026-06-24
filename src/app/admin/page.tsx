"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, ShieldAlert, UserCheck, Shield } from "lucide-react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchUsers();
    } else if (status !== 'loading' && session?.user?.role !== 'admin') {
      setLoading(false);
    }
  }, [status, session]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const togglePlan = async (email: string, currentPlan: string) => {
    const newPlan = currentPlan === 'free' ? 'pro' : 'free';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan: newPlan })
      });
      if (res.ok) {
        fetchUsers(); // Refresh list
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={48} color="var(--accent-color)" />
      </div>
    );
  }

  if (session?.user?.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <ShieldAlert size={64} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Access Denied</h1>
        <p style={{ color: 'var(--text-secondary)' }}>You must be an Administrator to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 2rem', minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
        <Shield size={36} color="var(--accent-color)" />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Admin Control Center</h1>
      </header>

      <section className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserCheck size={24} color="var(--accent-color)"/> Registered Users
        </h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>User</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Email</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Role</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Plan Status</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.email} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {u.image ? (
                      <img src={u.image} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-color)' }} />
                    )}
                    {u.name}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px', 
                      fontSize: '0.85rem',
                      background: u.role === 'admin' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                      color: u.role === 'admin' ? '#10b981' : 'var(--text-primary)'
                    }}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px', 
                      fontSize: '0.85rem',
                      background: u.plan === 'pro' ? 'rgba(192, 132, 252, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      color: u.plan === 'pro' ? '#c084fc' : 'var(--text-secondary)'
                    }}>
                      {u.plan.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {u.role !== 'admin' && (
                      <button 
                        className="btn" 
                        style={{ 
                          background: u.plan === 'pro' ? 'var(--surface-color)' : 'linear-gradient(135deg, var(--accent-color), #c084fc)',
                          fontSize: '0.9rem',
                          padding: '0.5rem 1rem'
                        }}
                        onClick={() => togglePlan(u.email, u.plan)}
                      >
                        {u.plan === 'pro' ? 'Revoke Pro' : 'Upgrade to Pro'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
