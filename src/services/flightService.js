import { query } from './supabaseService';

export async function fetchFlightTests(projectId = null) {
  const options = {
    select: '*, flight_anomalies(*), flight_attachments(*)',
    order: { column: 'date', asc: false },
  };
  if (projectId) options.eq = { project_id: projectId };
  return query('flight_tests', options);
}

export async function fetchDecisions(projectId = null) {
  const options = {
    order: { column: 'date', asc: false },
  };
  if (projectId) options.eq = { project_id: projectId };
  return query('decisions', options);
}
