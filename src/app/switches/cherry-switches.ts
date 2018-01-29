import { Switch } from './switch.domain';

const multiplyingFactor = 8;

export const CHERRY_ML_SWITCH: Switch = {
  name: 'ML_PCB',
  gridCellSize: 15 * multiplyingFactor,
  holes: [
    { x: 3.5 * multiplyingFactor, y: 4 * multiplyingFactor, diameter: 1.4, to: 'diodeIn', type: 'connector'},
    { x: 7.5 * multiplyingFactor, y: 4 * multiplyingFactor, diameter: 1.4, name: 'col', to: 'col', type: 'connector'},
    { x: 11.5 * multiplyingFactor, y: 4 * multiplyingFactor, diameter: 1.4, name: 'row', type: 'connector'},
    { x: 7.5 * multiplyingFactor, y: 11 * multiplyingFactor, diameter: 1.5, to: 'diodeOut', type: 'connector'},
    { x: 1.5 * multiplyingFactor, y: 5 * multiplyingFactor, diameter: 1.5, name: 'diodeIn', to: 'row', type: 'connector'},
    { x: 1.5 * multiplyingFactor, y: 10 * multiplyingFactor, diameter: 1.5, name: 'diodeOut', type: 'connector'},
    { x: 3.5 * multiplyingFactor, y: 7 * multiplyingFactor, diameter: 1.5, type: 'fastener'},
    { x: 7.5 * multiplyingFactor, y: 7 * multiplyingFactor, diameter: 2.6, type: 'fastener'},
    { x: 11.5 * multiplyingFactor, y: 7 * multiplyingFactor, diameter: 1.5, type: 'fastener'}
  ]
};

export const CHERRY_MX_PCB_SWITCH: Switch  = {
  name: 'MX_PCB',
  gridCellSize: 15 * multiplyingFactor,
  holes: [
    { x: 9 * multiplyingFactor, y: 3 * multiplyingFactor, diameter: 1.5, name: 'col', to: 'col', type: 'connector'},
    { x: 4.5 * multiplyingFactor, y: 5 * multiplyingFactor, diameter: 1.5, to: 'diodeOut', type: 'connector'},
    { x: 0 * multiplyingFactor, y: 5 * multiplyingFactor, diameter: 1.5, name: 'diodeOut', type: 'connector'},
    { x: 1.5 * multiplyingFactor, y: 11 * multiplyingFactor, diameter: 1.5, name: 'diodeIn', type: 'connector'},
    { x: 3.0 * multiplyingFactor, y: 11 * multiplyingFactor, diameter: 1.5, name: 'row', type: 'connector'},
    { x: 0.0 * multiplyingFactor, y: 11 * multiplyingFactor, diameter: 1.5, name: 'row', type: 'connector'},
    { x: 3.5 * multiplyingFactor, y: 7 * multiplyingFactor, diameter: 1, type: 'fastener'},
    { x: 7.5 * multiplyingFactor, y: 7 * multiplyingFactor, diameter: 4, type: 'fastener'},
    { x: 11.5 * multiplyingFactor, y: 7 * multiplyingFactor, diameter: 1, type: 'fastener'},
  ]
};

export const CHERRY_MX_PLATE_SWITCH: Switch  = {
  name: 'MX_PLATE',
  gridCellSize: 15 * multiplyingFactor,
  holes: [
    { x: 9 * multiplyingFactor, y: 3 * multiplyingFactor, diameter: 1.5, name: 'col', to: 'col', type: 'connector'},
    { x: 4.5 * multiplyingFactor, y: 5 * multiplyingFactor, diameter: 1.5, type: 'connector'},
    { x: 7.5 * multiplyingFactor, y: 7 * multiplyingFactor, diameter: 4, name: '', type: 'fastener'}
  ]
};
