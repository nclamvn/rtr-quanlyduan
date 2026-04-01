import { supabase } from "../lib/supabase";
import { query, insert, remove } from "./supabaseService";

const BUCKET = "attachments";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadFile(file, entityType, entityId, user) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const _ext = file.name.split(".").pop().toLowerCase();
  const timestamp = Date.now();
  const storagePath = `${entityType}/${entityId}/${timestamp}-${file.name}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) throw uploadError;

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  // Create DB record
  const record = {
    entity_type: entityType,
    entity_id: entityId,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
    storage_path: storagePath,
    thumbnail_path: isImage(file.type) ? publicUrl : null,
    uploaded_by: user.id,
    uploaded_by_name: user.name,
  };

  const { data } = await insert("file_attachments", record);
  return { ...data, publicUrl };
}

export async function fetchAttachments(entityType, entityId) {
  const result = await query("file_attachments", {
    filter: { column: "entity_type", value: entityType },
    order: { column: "created_at", ascending: false },
  });

  // Filter by entity_id (supabaseService only supports single filter)
  const filtered = (result.data || []).filter((a) => a.entity_id === entityId);

  // Add public URLs
  return filtered.map((a) => ({
    ...a,
    publicUrl: supabase.storage.from(BUCKET).getPublicUrl(a.storage_path).data.publicUrl,
  }));
}

export async function deleteAttachment(attachment) {
  // Delete from storage
  await supabase.storage.from(BUCKET).remove([attachment.storage_path]);
  // Delete DB record
  await remove("file_attachments", attachment.id);
}

export function isImage(mimeType) {
  return mimeType?.startsWith("image/");
}

export function isPdf(mimeType) {
  return mimeType === "application/pdf";
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
