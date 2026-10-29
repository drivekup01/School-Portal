import * as shared from './shared/school-auth.js?v=20261027-roles1';

try {
  const profile = await shared.profile();
  if (profile?.active) window.location.replace('staff/');
} catch {
  // The landing page remains available if identity services are temporarily offline.
}
