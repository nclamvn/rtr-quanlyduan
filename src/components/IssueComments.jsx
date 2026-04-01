import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Edit3, Trash2, AtSign, Clock } from "lucide-react";
import { getConnectionStatus } from "../lib/supabase";
import { fetchComments, createComment, updateComment, deleteComment } from "../services/commentService";
import { useRealtimeSubscription } from "../hooks/useRealtime";
import { Badge, Btn } from "./ui";
import { sans } from "../constants";

function MentionInput({ value, onChange, onSubmit, teamMembers, lang: _lang, placeholder }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef(null);

  const suggestions = mentionQuery
    ? teamMembers.filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5)
    : [];

  const handleChange = (e) => {
    const text = e.target.value;
    const pos = e.target.selectionStart;
    onChange(text);
    setCursorPos(pos);

    // Detect @ trigger
    const beforeCursor = text.slice(0, pos);
    const atMatch = beforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setMentionQuery("");
    }
  };

  const insertMention = (name) => {
    const beforeCursor = value.slice(0, cursorPos);
    const atIdx = beforeCursor.lastIndexOf("@");
    const newValue = value.slice(0, atIdx) + `@${name} ` + value.slice(cursorPos);
    onChange(newValue);
    setShowSuggestions(false);
    setMentionQuery("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !showSuggestions) {
      e.preventDefault();
      onSubmit?.();
    }
    if (e.key === "Escape") setShowSuggestions(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={2}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid var(--border)",
          background: "var(--bg-input)",
          color: "var(--text-primary)",
          fontSize: 13,
          fontFamily: sans,
          resize: "vertical",
          minHeight: 40,
          outline: "none",
        }}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            background: "var(--bg-modal)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 4,
            minWidth: 200,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 100,
          }}
        >
          {suggestions.map((m) => (
            <div
              key={m.name}
              onClick={() => insertMention(m.name)}
              style={{
                padding: "6px 10px",
                borderRadius: 4,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "var(--text-primary)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--hover-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                }}
              >
                {m.name.split(" ").pop()[0]}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment, currentUserId, isAdmin, lang, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const isOwn = comment.author_id === currentUserId;
  const timeAgo = formatTimeAgo(comment.created_at, lang);

  const handleSave = () => {
    onEdit(comment.id, editText);
    setEditing(false);
  };

  // Render content with @mentions highlighted
  const renderContent = (text) => {
    return text.split(/(@\w[\w\s]*?)(?=\s|$|@)/g).map((part, i) =>
      part.startsWith("@") ? (
        <span key={i} style={{ color: "#3B82F6", fontWeight: 600 }}>
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 0",
        borderBottom: "1px solid var(--border-a10)",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: isOwn ? "#3B82F620" : "var(--hover-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          color: isOwn ? "#3B82F6" : "var(--text-muted)",
          flexShrink: 0,
        }}
      >
        {comment.author_name.split(" ").pop()[0]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{comment.author_name}</span>
          <Badge
            label={comment.author_role}
            color={comment.author_role === "admin" ? "#EF4444" : comment.author_role === "pm" ? "#3B82F6" : "#F59E0B"}
          />
          <span style={{ fontSize: 11, color: "var(--text-faint)", display: "flex", alignItems: "center", gap: 2 }}>
            <Clock size={9} /> {timeAgo}
          </span>
          {comment.edited_at && (
            <span style={{ fontSize: 10, color: "var(--text-disabled)", fontStyle: "italic" }}>
              ({lang === "vi" ? "đã sửa" : "edited"})
            </span>
          )}
        </div>
        {editing ? (
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: 4,
                border: "1px solid var(--border)",
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: 13,
                fontFamily: sans,
                outline: "none",
                resize: "none",
              }}
            />
            <Btn variant="primary" small onClick={handleSave}>
              Save
            </Btn>
            <Btn small onClick={() => setEditing(false)}>
              Cancel
            </Btn>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
            {renderContent(comment.content)}
          </div>
        )}
        {!editing && (isOwn || isAdmin) && (
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            {isOwn && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-faint)",
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Edit3 size={9} /> {lang === "vi" ? "Sửa" : "Edit"}
              </button>
            )}
            <button
              onClick={() => onDelete(comment.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#EF4444",
                fontSize: 11,
                display: "flex",
                alignItems: "center",
                gap: 2,
                opacity: 0.6,
              }}
            >
              <Trash2 size={9} /> {lang === "vi" ? "Xóa" : "Delete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr, lang = "en") {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === "vi" ? "vừa xong" : "just now";
  if (mins < 60) return `${mins}${lang === "vi" ? " phút trước" : "m ago"}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${lang === "vi" ? " giờ trước" : "h ago"}`;
  const days = Math.floor(hrs / 24);
  return `${days}${lang === "vi" ? " ngày trước" : "d ago"}`;
}

export default function IssueComments({ issueId, currentUser, teamMembers, lang }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const isAdmin = currentUser?.role === "admin";

  const loadComments = useCallback(async () => {
    if (getConnectionStatus() !== "online" || !issueId) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await fetchComments(issueId);
      setComments(data || []);
    } catch {
      /* offline */
    }
    setLoading(false);
  }, [issueId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useRealtimeSubscription("issue_comments", {
    onInsert: (row) => {
      if (row.issue_id === issueId) setComments((prev) => [...prev, row]);
    },
    onUpdate: (row) => {
      if (row.issue_id === issueId) setComments((prev) => prev.map((c) => (c.id === row.id ? row : c)));
    },
    onDelete: (row) => {
      setComments((prev) => prev.filter((c) => c.id !== row.id));
    },
  });

  const handleSubmit = async () => {
    const text = newComment.trim();
    if (!text || !currentUser) return;

    // Extract @mentions
    const mentions = [...text.matchAll(/@([\w\s]+?)(?=\s|$|@)/g)].map((m) => m[1].trim());

    await createComment({
      issueId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      content: text,
      mentions,
    });
    setNewComment("");
  };

  const handleEdit = async (commentId, content) => {
    await updateComment(commentId, content);
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, content, edited_at: new Date().toISOString() } : c)),
    );
  };

  const handleDelete = async (commentId) => {
    await deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
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
        <AtSign size={13} />
        {lang === "vi" ? "Bình luận" : "Comments"}
        {comments.length > 0 && (
          <span style={{ fontSize: 12, color: "var(--text-faint)", fontWeight: 400 }}>({comments.length})</span>
        )}
      </div>

      {/* Comment list */}
      {loading ? (
        <div style={{ padding: 12, color: "var(--text-faint)", fontSize: 12 }}>
          {lang === "vi" ? "Đang tải..." : "Loading..."}
        </div>
      ) : (
        <div>
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={currentUser?.id}
              isAdmin={isAdmin}
              lang={lang}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
          {comments.length === 0 && (
            <div style={{ padding: "12px 0", fontSize: 12, color: "var(--text-disabled)" }}>
              {lang === "vi" ? "Chưa có bình luận. Hãy là người đầu tiên!" : "No comments yet. Be the first!"}
            </div>
          )}
        </div>
      )}

      {/* New comment input */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <MentionInput
            value={newComment}
            onChange={setNewComment}
            onSubmit={handleSubmit}
            teamMembers={teamMembers || []}
            lang={lang}
            placeholder={
              lang === "vi"
                ? "Viết bình luận... (dùng @ để nhắc ai đó)"
                : "Write a comment... (use @ to mention someone)"
            }
          />
        </div>
        <Btn variant="primary" small onClick={handleSubmit} disabled={!newComment.trim()}>
          <Send size={12} />
        </Btn>
      </div>
    </div>
  );
}
