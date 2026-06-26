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
    
    // Check if dragging an image, if so, don't show the global audio drop overlay
    let isImage = false;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        if (e.dataTransfer.items[i].kind === 'file' && e.dataTransfer.items[i].type.startsWith('image/')) {
          isImage = true;
          break;
        }
      }
    }

    if (isImage) {
      setDragActive(false);
      return;
    }

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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const title = file.name.replace(/\.[^/.]+$/, ""); // remove extension

      // 1. Get folder ID and Access Token from backend
      const initRes = await fetch('/api/upload/init', { method: 'POST' });
      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error || 'Failed to initialize upload');
      
      const { folderId, accessToken } = initData;

      // 2. Start Google Drive Resumable Upload Session
      const driveInitRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': file.type,
          'X-Upload-Content-Length': file.size.toString()
        },
        body: JSON.stringify({
          name: file.name,
          parents: [folderId]
        })
      });

      if (!driveInitRes.ok) throw new Error('Failed to start Google Drive upload');
      const uploadUrl = driveInitRes.headers.get('Location');
      if (!uploadUrl) throw new Error('Google Drive did not return an upload URL');

      // 3. Upload File Data to Google Drive via XHR (for progress tracking)
      const driveFileId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText).id);
          } else {
            reject(new Error('Google Drive upload failed with status ' + xhr.status));
          }
        };

        xhr.onerror = () => reject(new Error('Network error occurred while uploading directly to Google Drive.'));

        xhr.open('PUT', uploadUrl, true);
        xhr.send(file);
      });

      // 4. Finalize with our backend (Set permissions & save to DB)
      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driveFileId, title })
      });
      
      const completeData = await completeRes.json();
      if (!completeRes.ok) throw new Error(completeData.error || 'Failed to finalize upload');

      setTracks((prev) => [completeData.track, ...prev]);
      setSelectedTrack(completeData.track);
      
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
        isUploading, uploadProgress, dragActive, setDragActive, 
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
