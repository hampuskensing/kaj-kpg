import { SwitchHole } from '../switches/switch-hole.domain';
import { Switch } from '../switches/switch.domain';

interface Point {
  x: number,
  y: number;
}
interface SwitchPosition {
  row: number;
  col: number;
}
type KleData = ({ [key: string]: any } | string)[][];
type DecoratedSwitchHoles = { hole: SwitchHole, switchPosition: SwitchPosition, coordinate: Point }[];

export class Board {

  width: number = 0;
  height: number = 0;
  decoratedDrillHoles: DecoratedSwitchHoles = [];
  keyLookup: any = {};
  traceTaskQueue = [];
  searchGraph: any;

  scaleFactor = 0;

  constructor(rawData: KleData, unitSize: number, keySwitch: Switch) {
    this.scaleFactor = unitSize / keySwitch.gridCellSize;
    this.height = rawData.length * keySwitch.gridCellSize;

    this.populateDrillHoles(rawData, keySwitch);
    this.createSearchMatrix();

  }

  createSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', (this.width * this.scaleFactor) + 'mm');
    svg.setAttribute('height', (this.height * this.scaleFactor) + 'mm');
    svg.setAttribute('viewport', '0 0 ' + (this.width * this.scaleFactor) + ' ' + (this.height * this.scaleFactor));
    const boardSvg = this.drawBoard({ width: this.width, height: this.height });
    const solderingPads = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const traces = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const drillHoles = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(boardSvg);
    svg.appendChild(traces);
    svg.appendChild(solderingPads);
    svg.appendChild(drillHoles);

    this.drawDrillHoles(drillHoles, solderingPads);
    this.drawTraces(traces);
    return svg;
  }

  private populateDrillHoles(rawData: KleData, keySwitch: Switch) {
    let currentSwitchUnit = 1;
    let currentYPosition = 0;
    let currentXPosition = 0;

    rawData.forEach((row: any, rowNumber: number) => {
      let colNumber = 0;
      row.forEach((potentialKey: any) => {

        if (typeof potentialKey === 'string') {
          keySwitch.holes.forEach((switchHole) => {
            const coordinate = { x: currentXPosition + switchHole.x, y: currentYPosition + switchHole.y };
            this.decoratedDrillHoles.push({
              hole: switchHole,
              switchPosition: { col: colNumber, row: rowNumber },
              coordinate: coordinate
            });
          });
          currentXPosition += currentSwitchUnit * keySwitch.gridCellSize;
          colNumber++;
        } else if (typeof potentialKey === 'object') {
          if (potentialKey.w) {
            currentSwitchUnit = potentialKey.w;
          }
          if (potentialKey.x) {
            currentXPosition += keySwitch.gridCellSize * potentialKey.x;
          }
        }

        if (currentXPosition > this.width) {
          this.width = currentXPosition;
        }
      });
      currentYPosition += keySwitch.gridCellSize;
      currentXPosition = 0;
    });
  }

  private drawBoard(pcbSize: { width: number, height: number }) {
    const board = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    board.setAttributeNS(null, 'width', pcbSize.width + 'mm');
    board.setAttributeNS(null, 'height', pcbSize.height + 'mm');
    board.setAttributeNS(null, 'fill', '#3a6629');
    return board;
  }

  private drawDrillHoles(drillHoles: SVGElement, solderingPads: SVGElement) {
    this.decoratedDrillHoles.forEach((decoratedSwitchHole) => {
      const x = decoratedSwitchHole.coordinate.x;
      const y = decoratedSwitchHole.coordinate.y;
      const drillHole = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      drillHole.setAttributeNS(null, 'cx', (this.scaleFactor * x) + 'mm');
      drillHole.setAttributeNS(null, 'cy', (this.scaleFactor * y) + 'mm');
      drillHole.setAttributeNS(null, 'r', decoratedSwitchHole.hole.diameter / 2 + 'mm');
      drillHole.setAttributeNS(null, 'fill', '#ffffff');
      drillHoles.appendChild(drillHole);

      if (decoratedSwitchHole.hole.type === 'connector') {
        const solderingPad = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        solderingPad.setAttributeNS(null, 'cx', (this.scaleFactor * x) + 'mm');
        solderingPad.setAttributeNS(null, 'cy', (this.scaleFactor * y) + 'mm');
        solderingPad.setAttributeNS(null, 'r', (decoratedSwitchHole.hole.diameter + 1) / 2 + 'mm');
        solderingPad.setAttributeNS(null, 'fill', '#F7BD13');
        solderingPads.appendChild(solderingPad);
        const holeName = decoratedSwitchHole.hole.name;
        const col = decoratedSwitchHole.switchPosition.col;
        const row = decoratedSwitchHole.switchPosition.row;
        if (holeName) {
          let holeId = col + ':' + row + ':' + holeName;
          this.keyLookup[holeId] = { x: x, y: y };
        }
        const holeTo = decoratedSwitchHole.hole.to;
        if (holeTo === 'row') {
          let holeToId = (col - 1) + ':' + row + ':row';
          this.traceTaskQueue.push({ from: {x: x, y: y}, to: holeToId });
        } else if (holeTo === 'diodeIn') {
          let holeToId = (col) + ':' + row + ':diodeIn';
          this.traceTaskQueue.push({ from: {x: x, y: y}, to: holeToId });
        } else if (holeTo === 'diodeOut') {
          let holeToId = (col) + ':' + row + ':diodeOut';
          this.traceTaskQueue.push({ from: {x: x, y: y}, to: holeToId });
        } else if (holeTo === 'col') {
          let holeToId = (col) + ':' + (row + 1) + ':col';
          this.traceTaskQueue.push({ from: {x: x, y: y}, to: holeToId });
        }
      }
    });
  }

  private drawTraces(traces: SVGElement) {
    this.traceTaskQueue.forEach((trace: any) => {
      if (this.keyLookup[trace.to]) {

        const start = this.searchGraph.grid[trace.from.x][trace.from.y];
        const end = this.searchGraph.grid[this.keyLookup[trace.to].x][this.keyLookup[trace.to].y];

        const result = (<any>window).astar.search(this.searchGraph, start, end, { heuristic: (<any>window).astar.heuristics.diagonal });

        let line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let pathString = '';
        pathString = pathString + 'M' + (trace.from.x * this.scaleFactor * (72/19.05)) + ' ' + (trace.from.y * this.scaleFactor * (72/19.05));
        pathString = pathString + ' L';
        result.forEach((gridNode: any) => {
          pathString = pathString + ' ' + (gridNode.x * this.scaleFactor * (72/19.05)) +
           ' ' + (gridNode.y * this.scaleFactor * (72/19.05));
        });
        line.setAttributeNS(null, 'd', pathString);
        line.setAttributeNS(null, 'fill', 'transparent');
        line.setAttributeNS(null, 'stroke-width', '1mm');
        line.setAttributeNS(null, 'stroke', '#275520');
        traces.appendChild(line);
      }
    });
  }

  private createSearchMatrix() {
    const searchMatrix = [];
    for (let i = 0; i < this.width; i++) {
      searchMatrix[i] = [];
      for (let j = 0; j < this.height; j++) {
        searchMatrix[i].push({ weight: 1 });
      }
    }
    this.decoratedDrillHoles.forEach((decoratedDrillHole) => {
      let x = decoratedDrillHole.coordinate.x;
      let y = decoratedDrillHole.coordinate.y;
      let padding = Math.floor(((decoratedDrillHole.hole.diameter / 2) + 1.5) / this.scaleFactor);
      this.markHoleAndPad(x, y, padding, searchMatrix);
    });
    this.searchGraph = new (<any>window).Graph(searchMatrix, { diagonals: true });
  }

  private markHoleAndPad(x, y, padding, searchMatrix) {
    for (let hor = x + 1 - padding; hor < x+padding; hor++) {
      if (searchMatrix[hor]) {
        for (let ver = y + 1 - padding; ver < y+padding; ver++) {
          if (searchMatrix[hor][ver]) {
            searchMatrix[hor][ver] = { weight: 0, owner: { x: x, y: y }};
          }
        }
      }
    }
  }

}
