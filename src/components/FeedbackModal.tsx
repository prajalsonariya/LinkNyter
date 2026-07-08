"use client";

import { useState } from "react";
import { X, MessageSquarePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FeedbackModalProps {
  onClose: () => void;
}

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill out both fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description })
      });
      
      if (res.ok) {
        toast.success("Feedback submitted! Thank you.");
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit feedback.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface-container rounded-3xl shadow-2xl overflow-hidden animate-slide-up border border-outline-variant/20">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display-sm text-xl font-bold text-on-surface flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-primary" />
              Found Bug or Request Feature
            </h2>
            <button 
              onClick={onClose}
              className="p-2 bg-surface-container-highest hover:bg-surface-container-highest/80 text-on-surface-variant rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-label-caps uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Dark mode is too dark"
                className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-label-caps uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">
                Details
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us what happened or what you'd like to see..."
                className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm min-h-[120px] resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className="w-full mt-2 py-3.5 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
