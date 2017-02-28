import { SwitchHole } from './switch-hole.domain';

export interface Switch {
  gridCellSize: number;
  holes: SwitchHole[];
}
