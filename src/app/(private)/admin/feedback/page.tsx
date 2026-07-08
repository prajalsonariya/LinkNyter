"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { MessageSquare, Trash2, Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await fetch("/api/admin/feedback");
      if (res.ok) {
        const data = await res.json();
        setFeedback(data.feedback || []);
      } else {
        toast.error("Not authorized to view this page.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateNotes = async (id: string, notes: string) => {
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: notes })
      });
      if (res.ok) {
        toast.success("Notes saved");
      } else {
        toast.error("Failed to save notes");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setFeedback(feedback.map(f => f.id === id ? { ...f, status } : f));
        toast.success("Status updated");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFeedback = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFeedback(feedback.filter(f => f.id !== id));
        toast.success("Feedback deleted");
      } else {
        toast.error("Failed to delete feedback");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting");
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 md:ml-64 pb-32 md:pb-0 pt-20 md:pt-0">
      <header className="sticky top-0 w-full z-40 flex justify-between items-center px-margin-desktop h-20 bg-surface/60 backdrop-blur-xl border-b border-outline-variant/10">
        <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Admin Feedback
        </h2>
      </header>

      <div className="p-6 max-w-5xl mx-auto space-y-6 mt-6">
        {feedback.length === 0 ? (
          <div className="text-center py-20 text-on-surface-variant opacity-60">
            No feedback found.
          </div>
        ) : (
          feedback.map((item) => (
            <div key={item.id} className="bg-surface-container border border-outline-variant/20 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-on-surface">{item.title}</h3>
                  <p className="text-sm text-on-surface-variant/70 mt-1">
                    From: <span className="text-primary">{item.user_email}</span> • {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded ${item.status === 'resolved' ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'}`}>
                    {item.status || 'pending'}
                  </span>
                  {item.status !== 'resolved' && (
                    <button 
                      onClick={() => updateStatus(item.id, 'resolved')}
                      title="Mark as Resolved"
                      className="p-1.5 hover:bg-success/20 text-success rounded transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => setDeleteId(item.id)}
                    title="Delete Feedback"
                    className="p-1.5 hover:bg-error/20 text-error rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="bg-surface-container-lowest p-4 rounded-xl text-on-surface text-sm whitespace-pre-wrap">
                {item.description}
              </div>

              <div className="pt-2 border-t border-outline-variant/10">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Admin Notes (Private)</label>
                <textarea
                  defaultValue={item.admin_notes || ""}
                  onBlur={(e) => updateNotes(item.id, e.target.value)}
                  placeholder="Leave a note for yourself..."
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:border-primary/50 text-on-surface min-h-[80px]"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm bg-surface-container rounded-3xl p-6 border border-outline-variant/20 shadow-2xl animate-slide-up">
            <h3 className="font-display-sm text-xl font-bold text-on-surface mb-2">Delete Feedback?</h3>
            <p className="text-on-surface-variant text-sm mb-6">Are you sure you want to delete this feedback? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-full font-label-caps text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteFeedback(deleteId)}
                className="px-4 py-2 rounded-full font-label-caps bg-error text-white hover:bg-error/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
