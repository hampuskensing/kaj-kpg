import { SwitchHole } from './switch-hole.domain';

export interface Switch {
  name: string;
  gridCellSize: number;
  holes: SwitchHole[];
}
