"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface DashboardContextType {
  tracks: any[];
  setTracks: React.Dispatch<React.SetStateAction<any[]>>;
  selectedTrack: any | null;
  setSelectedTrack: React.Dispatch<React.SetStateAction<any | null>>;
  isUploading: boolean;
  uploadProgress: number;
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  reachedLimit: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleGlobalDrag: (e: React.DragEvent) => void;
  handleGlobalDrop: (e: React.DragEvent) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fetchTracks: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [tracks, setTracks] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const isPro = session?.user?.role === 'pro' || session?.user?.role === 'admin';
  const reachedLimit = !isPro && tracks.length >= 3;

  const fetchTracks = async () => {
    if (!session?.user?.email) return;
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('user_email', session.user.email)
        .order('created_at', { ascending: false });
      if (data) setTracks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, [session]);

  const handleGlobalDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleGlobalDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (reachedLimit) {
      toast.error("Free tier limit reached (3 tracks). Upgrade to Pro.");
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("audio/")) {
        await handleUpload(file);
      } else {
        toast.error("Please drop an audio file.");
      }
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (reachedLimit) {
      toast.error("Free tier limit reached (3 tracks). Upgrade to Pro.");
      return;
    }
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.[^/.]+$/, "")); // remove extension

      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || 'Upload failed'));
            } catch (e) {
              reject(new Error('Upload failed with status ' + xhr.status));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error occurred while uploading. Is the server running?'));

        xhr.open('POST', '/api/upload', true);
        xhr.send(formData);
      });

      setTracks((prev) => [data.track, ...prev]);
      setSelectedTrack(data.track);
      
    } catch (error: any) {
      console.error(error);
      toast.error("Upload error: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardContext.Provider value={{ 
        tracks, setTracks, selectedTrack, setSelectedTrack, 
        isUploading, uploadProgress, dragActive, setDragActive, reachedLimit, 
        inputRef, handleGlobalDrag, handleGlobalDrop, handleChange, fetchTracks 
      }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
