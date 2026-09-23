async function request(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error ?? `Le serveur a répondu ${res.status}.`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  meta: () => request('GET', '/meta'),
  createUser: () => request('POST', '/users'),
  getUser: (id) => request('GET', `/users/${id}`),
  setProfile: (id, profile) => request('PUT', `/users/${id}/profile`, profile),
  history: (userId) => request('GET', `/users/${userId}/assessments`),
  today: (userId, day) => request('GET', `/users/${userId}/today?day=${day}`),
  checkin: (userId, day, answers) => request('PUT', `/users/${userId}/checkins/${day}`, { answers }),
  startAssessment: (userId) => request('POST', '/assessments', { userId }),
  getAssessment: (id) => request('GET', `/assessments/${id}`),
  answer: (id, questionId, value) => request('PUT', `/assessments/${id}/answers/${questionId}`, { value }),
  complete: (id) => request('POST', `/assessments/${id}/complete`),
  result: (id) => request('GET', `/assessments/${id}/result`),
};
