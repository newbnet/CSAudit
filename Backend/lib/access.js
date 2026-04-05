/**
 * Project isolation: primary owner per project, optional guest auditor grants (view | edit).
 * Platform owner role manages auditors globally; does not use project grants for pen-test data.
 */

function isPlatformOwner(role) {
  return role === 'owner';
}

function isAuditor(role) {
  return role === 'auditor';
}

function projectById(db, projectId) {
  return (db.projects || []).find((p) => p.id === projectId) || null;
}

/** @returns {'owner'|'edit'|'view'|'none'} */
function auditorAccessLevel(db, auditorUserId, projectId) {
  const p = projectById(db, projectId);
  if (!p) return 'none';
  if (p.ownerUserId === auditorUserId) return 'owner';
  const g = (db.projectAuditorGrants || []).find(
    (x) => x.projectId === projectId && x.auditorUserId === auditorUserId
  );
  if (!g) return 'none';
  return g.access === 'edit' ? 'edit' : 'view';
}

function auditorCanViewProject(db, auditorUserId, projectId) {
  const lvl = auditorAccessLevel(db, auditorUserId, projectId);
  return lvl !== 'none';
}

function auditorCanEditProject(db, auditorUserId, projectId) {
  const lvl = auditorAccessLevel(db, auditorUserId, projectId);
  return lvl === 'owner' || lvl === 'edit';
}

/** Projects visible to an auditor (primary or guest). */
function visibleProjectIdsForAuditor(db, auditorUserId) {
  const ids = new Set();
  for (const p of db.projects || []) {
    if (auditorCanViewProject(db, auditorUserId, p.id)) ids.add(p.id);
  }
  return [...ids];
}

/** Projects where auditor may mutate assets / invite end-users. */
function editableProjectIdsForAuditor(db, auditorUserId) {
  const ids = new Set();
  for (const p of db.projects || []) {
    if (auditorCanEditProject(db, auditorUserId, p.id)) ids.add(p.id);
  }
  return [...ids];
}

function assertAuditorProjectView(db, user, projectId) {
  if (!projectId || !projectById(db, projectId)) return { ok: false, status: 400, error: 'Invalid project' };
  if (isPlatformOwner(user.role)) {
    if (auditorCanViewProject(db, user.id, projectId)) return { ok: true };
    return {
      ok: false,
      status: 403,
      error:
        'Platform owners only see project data for sites where they are the primary owner, or where another auditor granted them access.',
    };
  }
  if (user.role === 'end-user') {
    if (!user.projectIds?.includes(projectId)) return { ok: false, status: 403, error: 'Forbidden' };
    return { ok: true };
  }
  if (isAuditor(user.role)) {
    if (!auditorCanViewProject(db, user.id, projectId)) return { ok: false, status: 403, error: 'Forbidden' };
    return { ok: true };
  }
  return { ok: false, status: 403, error: 'Forbidden' };
}

function assertAuditorProjectEdit(db, user, projectId) {
  const v = assertAuditorProjectView(db, user, projectId);
  if (!v.ok) return v;
  if (user.role === 'end-user') return { ok: false, status: 403, error: 'Forbidden' };
  if (!auditorCanEditProject(db, user.id, projectId)) {
    return { ok: false, status: 403, error: 'Read-only access to this project' };
  }
  return { ok: true };
}

module.exports = {
  isPlatformOwner,
  isAuditor,
  projectById,
  auditorAccessLevel,
  auditorCanViewProject,
  auditorCanEditProject,
  visibleProjectIdsForAuditor,
  editableProjectIdsForAuditor,
  assertAuditorProjectView,
  assertAuditorProjectEdit,
};
