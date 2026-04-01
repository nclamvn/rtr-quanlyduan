import { query, insert, update, remove } from "./supabaseService";

export async function fetchComments(issueId) {
  return query("issue_comments", {
    filter: { column: "issue_id", value: issueId },
    order: { column: "created_at", ascending: true },
  });
}

export async function createComment(comment) {
  return insert("issue_comments", {
    issue_id: comment.issueId,
    author_id: comment.authorId,
    author_name: comment.authorName,
    author_role: comment.authorRole,
    content: comment.content,
    mentions: comment.mentions || [],
  });
}

export async function updateComment(commentId, content) {
  return update("issue_comments", commentId, { content, edited_at: new Date().toISOString() });
}

export async function deleteComment(commentId) {
  return remove("issue_comments", commentId);
}
