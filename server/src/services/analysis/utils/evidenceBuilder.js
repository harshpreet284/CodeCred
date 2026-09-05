export function createEvidence(type, path, field, detail) {
  return {
    type,
    source: {
      path: path || null,
      field: field || null
    },
    detail
  };
}
