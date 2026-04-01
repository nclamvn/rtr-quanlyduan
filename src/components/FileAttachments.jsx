import { useState, useEffect, useRef, useCallback } from "react";
import { Paperclip, Upload, X, Download, FileText, Image, File, Trash2 } from "lucide-react";
import {
  uploadFile,
  fetchAttachments,
  deleteAttachment,
  isImage,
  isPdf,
  formatFileSize,
} from "../services/attachmentService";
import { getConnectionStatus } from "../lib/supabase";
import { Btn } from "./ui";
import { mono } from "../constants";

function FileIcon({ mimeType, size = 20 }) {
  if (isImage(mimeType)) return <Image size={size} color="#3B82F6" />;
  if (isPdf(mimeType)) return <FileText size={size} color="#EF4444" />;
  return <File size={size} color="var(--text-faint)" />;
}

function AttachmentCard({ attachment, canDelete, onDelete, lang: _lang }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(attachment);
    setDeleting(false);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: "var(--bg-modal)",
      }}
    >
      {/* Thumbnail or icon */}
      {isImage(attachment.mime_type) && attachment.publicUrl ? (
        <a href={attachment.publicUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={attachment.publicUrl}
            alt={attachment.file_name}
            style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, border: "1px solid var(--border)" }}
          />
        </a>
      ) : (
        <FileIcon mimeType={attachment.mime_type} />
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {attachment.file_name}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: mono }}>
          {formatFileSize(attachment.file_size)} • {attachment.uploaded_by_name}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 4 }}>
        <a
          href={attachment.publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          style={{ color: "var(--text-dim)", display: "flex", padding: 4 }}
        >
          <Download size={14} />
        </a>
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#EF4444",
              display: "flex",
              padding: 4,
              opacity: deleting ? 0.3 : 0.6,
            }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function FileAttachments({ entityType, entityId, currentUser, canUpload, lang }) {
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const isAdmin = currentUser?.role === "admin";

  const loadAttachments = useCallback(async () => {
    if (getConnectionStatus() !== "online" || !entityId) return;
    try {
      const data = await fetchAttachments(entityType, entityId);
      setAttachments(data);
    } catch {
      /* offline */
    }
  }, [entityType, entityId]);

  useEffect(() => {
    loadAttachments();
  }, [loadAttachments]);

  const handleUpload = async (files) => {
    if (!files?.length || !currentUser) return;
    setUploading(true);
    for (const file of files) {
      try {
        const result = await uploadFile(file, entityType, entityId, currentUser);
        setAttachments((prev) => [{ ...result, publicUrl: result.publicUrl }, ...prev]);
      } catch (err) {
        console.warn("Upload error:", err.message);
      }
    }
    setUploading(false);
  };

  const handleDelete = async (attachment) => {
    try {
      await deleteAttachment(attachment);
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
    } catch (err) {
      console.warn("Delete error:", err.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (canUpload) handleUpload(Array.from(e.dataTransfer.files));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Paperclip size={13} />
        {lang === "vi" ? "Tệp đính kèm" : "Attachments"}
        {attachments.length > 0 && (
          <span style={{ fontSize: 12, color: "var(--text-faint)", fontWeight: 400 }}>({attachments.length})</span>
        )}
      </div>

      {/* Upload zone */}
      {canUpload && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "#3B82F6" : "var(--border)"}`,
            borderRadius: 8,
            padding: "16px 12px",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? "#3B82F608" : "transparent",
            transition: "border-color 0.2s, background 0.2s",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleUpload(Array.from(e.target.files))}
            style={{ display: "none" }}
          />
          {uploading ? (
            <div style={{ fontSize: 12, color: "#3B82F6", fontWeight: 600 }}>
              {lang === "vi" ? "Đang tải lên..." : "Uploading..."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <Upload size={20} color="var(--text-disabled)" />
              <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
                {lang === "vi" ? "Kéo thả file hoặc bấm để chọn" : "Drag & drop files or click to browse"}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-disabled)" }}>
                {lang === "vi" ? "Tối đa 10MB / file" : "Max 10MB per file"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* File list */}
      {attachments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {attachments.map((a) => (
            <AttachmentCard
              key={a.id}
              attachment={a}
              canDelete={isAdmin || a.uploaded_by === currentUser?.id}
              onDelete={handleDelete}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
}
