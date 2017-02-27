import { Switch } from './switch.domain';

export const CHERRY_ML_SWITCH: Switch = {
  holes: [
    { x: 3.5 * 4, y: 4 * 4, diameter: 1.4, to: 'diodeIn', type: 'connector'},
    { x: 7.5 * 4, y: 4 * 4, diameter: 1.4, name: 'col', to: 'col', type: 'connector'},
    { x: 11.5 * 4, y: 4 * 4, diameter: 1.4, name: 'row', type: 'connector'},
    { x: 7.5 * 4, y: 11 * 4, diameter: 1.5, to: 'diodeOut', type: 'connector'},
    { x: 1.5 * 4, y: 4 * 4, diameter: 1.5, name: 'diodeIn', to: 'row', type: 'connector'},
    { x: 1.5 * 4, y: 11 * 4, diameter: 1.5, name: 'diodeOut', type: 'connector'},
    { x: 3.5 * 4, y: 7 * 4, diameter: 1.5, type: 'fastener'},
    { x: 7.5 * 4, y: 7 * 4, diameter: 2.6, type: 'fastener'},
    { x: 11.5 * 4, y: 7 * 4, diameter: 1.5, type: 'fastener'}
  ]
};

export const CHERRY_MX_PCB_SWITCH: Switch  = {
  holes: [
    { x: 9 * 4, y: 3 * 4, diameter: 1.5, name: 'col', type: 'connector'},
    { x: 4.5 * 4, y: 5 * 4, diameter: 1.5, name: 'toDiodeOut', type: 'connector'},
    { x: 3.5 * 4, y: 7 * 4, diameter: 1, type: 'fastener'},
    { x: 7.5 * 4, y: 7 * 4, diameter: 4, type: 'fastener'},
    { x: 11.5 * 4, y: 7 * 4, diameter: 1, type: 'fastener'},
  ]
};

export const CHERRY_MX_PLATE_SWITCH: Switch  = {
  holes: [
    { x: 9 * 4, y: 3 * 4, diameter: 1.5, name: 'col', type: 'connector'},
    { x: 4.5 * 4, y: 5 * 4, diameter: 1.5, name: 'toDiodeOut', type: 'connector'},
    { x: 7.5 * 4, y: 7 * 4, diameter: 4, name: '', type: 'fastener'}
  ]
};
