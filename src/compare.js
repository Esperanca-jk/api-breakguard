function kind(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function memberPath(base, key) {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? base + '.' + key : base + '[' + JSON.stringify(key) + ']';
}

/**
 * Compare two representative JSON response snapshots.
 * Structural warnings are heuristic: samples are not formal API schemas.
 */
export function compareSnapshots(before, after) {
  const changes = [];
  function walk(oldValue, newValue, path) {
    const oldKind = kind(oldValue);
    const newKind = kind(newValue);
    if (oldKind !== newKind) {
      changes.push({ severity: 'breaking', type: 'type-changed', path, from: oldKind, to: newKind });
      return;
    }
    if (oldKind === 'object') {
      for (const key of Object.keys(oldValue).sort()) {
        const keyPath = memberPath(path, key);
        if (!Object.hasOwn(newValue, key)) {
          changes.push({ severity: 'breaking', type: 'field-removed', path: keyPath });
        } else {
          walk(oldValue[key], newValue[key], keyPath);
        }
      }
      for (const key of Object.keys(newValue).sort()) {
        if (!Object.hasOwn(oldValue, key)) {
          changes.push({ severity: 'info', type: 'field-added', path: memberPath(path, key) });
        }
      }
    } else if (oldKind === 'array') {
      if (oldValue.length === 0 || newValue.length === 0) {
        changes.push({ severity: 'info', type: 'array-not-comparable', path });
      } else {
        walk(oldValue[0], newValue[0], path + '[*]');
      }
    }
  }
  walk(before, after, '$');
  return {
    breaking: changes.some(change => change.severity === 'breaking'),
    changes,
    summary: {
      breaking: changes.filter(change => change.severity === 'breaking').length,
      informational: changes.filter(change => change.severity === 'info').length
    }
  };
}
