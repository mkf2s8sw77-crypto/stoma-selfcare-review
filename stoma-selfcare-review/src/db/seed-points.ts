import type { CarePointDef } from '../lib/points';
import { POINT_VERSIONS } from '../lib/points';

export interface SeedPoint extends CarePointDef {
  id: number;
}

function flatten(version: string, startId: number): SeedPoint[] {
  const v = POINT_VERSIONS.find((x) => x.version === version)!;
  return v.points.map((p, i) => ({ id: startId + i, ...p }));
}

const v1 = flatten('v1.0', 1);
const v2 = flatten('v2.0', 100);
const v3 = flatten('v3.0-草稿', 200);

export const CARE_POINT_MAP_BY_VERSION: Record<string, SeedPoint[]> = {
  'v1.0': v1,
  'v2.0': v2,
  'v3.0-草稿': v3,
};

export const CARE_POINT_IDS_BY_VERSION: Record<string, Record<string, number>> = {
  'v1.0': Object.fromEntries(v1.map((p) => [p.code, p.id])),
  'v2.0': Object.fromEntries(v2.map((p) => [p.code, p.id])),
  'v3.0-草稿': Object.fromEntries(v3.map((p) => [p.code, p.id])),
};
