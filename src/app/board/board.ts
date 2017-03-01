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
  traceRowsQueue = [];
  traceColsQueue = [];
  searchGraph: any;

  scaleFactor = 0;
  private searchMatrix: { weight: number, owner?: Point }[][];

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
          this.traceRowsQueue.push({ from: {x: x, y: y}, to: holeToId });
        } else if (holeTo === 'diodeIn') {
          let holeToId = (col) + ':' + row + ':diodeIn';
          this.traceRowsQueue.push({ from: {x: x, y: y}, to: holeToId });
        } else if (holeTo === 'diodeOut') {
          let holeToId = (col) + ':' + row + ':diodeOut';
          this.traceRowsQueue.push({ from: {x: x, y: y}, to: holeToId });
        } else if (holeTo === 'col') {
          let holeToId = (col) + ':' + (row + 1) + ':col';
          this.traceColsQueue.push({ from: {x: x, y: y}, to: holeToId });
        }
      }
    });
  }

  private drawTraces(traces: SVGElement) {
    this.traceRowsQueue.concat(this.traceColsQueue).forEach((trace: any) => {
      if (this.keyLookup[trace.to]) {

        const start = this.searchGraph.grid[trace.from.x][trace.from.y];
        const end = this.searchGraph.grid[this.keyLookup[trace.to].x][this.keyLookup[trace.to].y];

        const nodes = (<any>window).astar.search(this.searchGraph, start, end, { heuristic: (<any>window).astar.heuristics.diagonal });

        this.addTraceToSearchGraph(nodes);

        let linePoints = this.prepareNodesForLineDrawing(nodes);

        let line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let pathString = '';
        pathString = pathString + 'M' + (trace.from.x * this.scaleFactor * (72/19.05)) + ' ' + (trace.from.y * this.scaleFactor * (72/19.05));
        pathString = pathString + ' L';
        linePoints.forEach((gridNode: any) => {
          pathString = pathString + ' ' + (gridNode.x * this.scaleFactor * (72/19.05)) +
           ' ' + (gridNode.y * this.scaleFactor * (72/19.05));
        });
        line.setAttributeNS(null, 'd', pathString);
        line.setAttributeNS(null, 'fill', 'transparent');
        line.setAttributeNS(null, 'stroke-width', '0.5mm');
        line.setAttributeNS(null, 'stroke', '#275520');
        traces.appendChild(line);
      }
    });
  }

  private createSearchMatrix() {
    this.searchMatrix = [];
    for (let i = 0; i < this.width; i++) {
      this.searchMatrix[i] = [];
      for (let j = 0; j < this.height; j++) {
        this.searchMatrix[i].push({ weight: 1 });
      }
    }
    this.decoratedDrillHoles.forEach((decoratedDrillHole) => {
      let x = decoratedDrillHole.coordinate.x;
      let y = decoratedDrillHole.coordinate.y;
      let padding = Math.floor(((decoratedDrillHole.hole.diameter / 2) + 1.5) / this.scaleFactor);
      this.markHoleAndPad(x, y, padding, this.searchMatrix);
    });
    this.searchGraph = new (<any>window).Graph(this.searchMatrix, { diagonal: true });
  }

  private addTraceToSearchGraph(nodes: Point[]) {
      nodes.forEach(node => this.searchMatrix[node.x][node.y].weight = 0);
      this.searchGraph = new (<any>window).Graph(this.searchMatrix, { diagonal: true });
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

  private prepareNodesForLineDrawing(nodes: any) {
    let result = [];
    for (let i = 0; i < nodes.length; i++) {
      if (i === 0 || i === nodes.length-1) {
        result.push(nodes[i]);
      } else {
        let pdx = nodes[i-1].x - nodes[i].x;
        let pdy = nodes[i-1].y - nodes[i].y;
        let ndx = nodes[i].x - nodes[i+1].x;
        let ndy = nodes[i].y - nodes[i+1].y;
        if (pdx === pdy && (pdx === 1 || pdx === -1)) {
          console.log('a diagonal');
        }

        if (pdx === ndx && pdy === ndy) {
          continue;
        } else {
          result.push(nodes[i]);
        }
      }
    }
    return result;
  }
}
