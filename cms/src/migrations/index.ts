import * as migration_20260805_161855_initial from './20260805_161855_initial';
import * as migration_20260818_152341 from './20260818_152341';
import * as migration_20260820_152641 from './20260820_152641';
import * as migration_20260820_161901 from './20260820_161901';

export const migrations = [
  {
    up: migration_20260805_161855_initial.up,
    down: migration_20260805_161855_initial.down,
    name: '20260805_161855_initial',
  },
  {
    up: migration_20260818_152341.up,
    down: migration_20260818_152341.down,
    name: '20260818_152341',
  },
  {
    up: migration_20260820_152641.up,
    down: migration_20260820_152641.down,
    name: '20260820_152641',
  },
  {
    up: migration_20260820_161901.up,
    down: migration_20260820_161901.down,
    name: '20260820_161901'
  },
];
