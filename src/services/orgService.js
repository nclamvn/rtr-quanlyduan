import { insert, update, remove } from "./supabaseService";
import { supabase } from "../lib/supabase";

export async function fetchUserOrgs(userId) {
  const { data } = await supabase
    .from("org_members")
    .select("org_id, role, organizations(id, name, slug, logo_url, plan, max_projects, max_members, settings)")
    .eq("user_id", userId);
  return (data || []).map((m) => ({
    ...m.organizations,
    memberRole: m.role,
  }));
}

export async function createOrg(org) {
  return insert("organizations", {
    name: org.name,
    slug: org.slug,
    plan: org.plan || "free",
    created_by: org.createdBy,
  });
}

export async function updateOrg(orgId, updates) {
  return update("organizations", orgId, updates);
}

export async function fetchOrgMembers(orgId) {
  const { data } = await supabase
    .from("org_members")
    .select("*, profiles:user_id(id, full_name, email, role, avatar_url)")
    .eq("org_id", orgId)
    .order("joined_at", { ascending: true });
  return (data || []).map((m) => ({
    id: m.id,
    userId: m.user_id,
    orgId: m.org_id,
    role: m.role,
    joinedAt: m.joined_at,
    name: m.profiles?.full_name || "Unknown",
    email: m.profiles?.email || "",
    avatar: m.profiles?.avatar_url,
  }));
}

export async function inviteMember(orgId, email, role, invitedBy) {
  const token = crypto.randomUUID();
  return insert("org_invitations", {
    org_id: orgId,
    email,
    role,
    token,
    invited_by: invitedBy,
  });
}

export async function acceptInvitation(token, userId) {
  const { data: inv } = await supabase
    .from("org_invitations")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .single();

  if (!inv) throw new Error("Invalid or expired invitation");
  if (new Date(inv.expires_at) < new Date()) throw new Error("Invitation expired");

  await insert("org_members", {
    org_id: inv.org_id,
    user_id: userId,
    role: inv.role,
    invited_by: inv.invited_by,
  });

  await update("org_invitations", inv.id, { accepted_at: new Date().toISOString() });
  return inv;
}

export async function removeMember(memberId) {
  return remove("org_members", memberId);
}

export async function updateMemberRole(memberId, newRole) {
  return update("org_members", memberId, { role: newRole });
}
