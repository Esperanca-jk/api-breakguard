import test from 'node:test';
import assert from 'node:assert/strict';
import { compareSnapshots } from '../src/compare.js';

test('detects removed nested fields', () => {
  const result = compareSnapshots({ user: { id: 1, name: 'x' } }, { user: { id: 2 } });
  assert.equal(result.breaking, true);
  assert.deepEqual(result.changes.map(change => change.path), ['$.user.name']);
});

test('detects type changes without comparing value differences', () => {
  const result = compareSnapshots({ id: 1, active: true }, { id: '1', active: false });
  assert.deepEqual(result.changes.map(change => change.type), ['type-changed']);
});

test('added fields are informational', () => {
  const result = compareSnapshots({ id: 1 }, { id: 1, page: 2 });
  assert.equal(result.breaking, false);
  assert.equal(result.changes[0].type, 'field-added');
});

test('compares representative array entries', () => {
  const result = compareSnapshots({ users: [{ id: 1, email: 'x' }] }, { users: [{ id: 3 }] });
  assert.equal(result.changes[0].path, '$.users[*].email');
});

test('empty arrays are marked inconclusive', () => {
  const result = compareSnapshots({ users: [{ id: 1 }] }, { users: [] });
  assert.equal(result.breaking, false);
  assert.equal(result.changes[0].type, 'array-not-comparable');
});

test('handles null and keys with special characters', () => {
  const result = compareSnapshots({ 'user.name': null }, { 'user.name': 'abc' });
  assert.equal(result.changes[0].path, '$["user.name"]');
  assert.equal(result.changes[0].from, 'null');
});
