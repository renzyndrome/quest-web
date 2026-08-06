import * as migration_20260805_161855_initial from './20260805_161855_initial';

export const migrations = [
  {
    up: migration_20260805_161855_initial.up,
    down: migration_20260805_161855_initial.down,
    name: '20260805_161855_initial'
  },
];
