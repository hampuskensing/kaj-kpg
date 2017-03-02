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

export class CircuitBoard {

  private width: number = 0;
  private height: number = 0;
  private decoratedDrillHoles: DecoratedSwitchHoles = [];
  private solderPads: any = [];
  private traces: any = [];

  private keyLookup: any = {};
  private traceRowsQueue = [];
  private traceColsQueue = [];
  private searchGraph: any;

  private scaleFactor = 0;
  private searchMatrix: { weight: number, owner?: Point }[][];

  constructor(rawData: KleData, unitSize: number, keySwitch: Switch) {
    this.scaleFactor = unitSize / keySwitch.gridCellSize;
    this.height = rawData.length * keySwitch.gridCellSize;

    this.createDrillHolesAndSolderPads(rawData, keySwitch);
    this.prepareTraceQueue();
    this.createSearchMatrix();
    this.calculateTraces();
  }

  public getWidth() {
    return this.width;
  }

  public getHeight() {
    return this.height;
  }

  public getScaleFactor() {
    return this.scaleFactor;
  }

  public getDrillHoles() {
    return this.decoratedDrillHoles;
  }

  public getSolderPads() {
    return this.solderPads;
  }

  public getTraces() {
    return this.traces;
  }

  private createDrillHolesAndSolderPads(rawData: KleData, keySwitch: Switch) {
    let currentSwitchUnit = 1;
    let currentYPosition = 0;
    let currentXPosition = 0;

    rawData.forEach((row: any, rowNumber: number) => {
      let colNumber = 0;
      row.forEach((potentialKey: any) => {

        if (typeof potentialKey === 'string') {
          keySwitch.holes.forEach((switchHole) => {
            const coordinate = { x: currentXPosition + (((currentSwitchUnit-1)/2) * keySwitch.gridCellSize) + switchHole.x, y: currentYPosition + switchHole.y };
            this.decoratedDrillHoles.push({
              hole: switchHole,
              switchPosition: { col: colNumber, row: rowNumber },
              coordinate: coordinate
            });
            if (switchHole.type === 'connector') {
              this.solderPads.push({
                hole: switchHole,
                switchPosition: { col: colNumber, row: rowNumber },
                coordinate: coordinate
              });
            }
          });
          currentXPosition += currentSwitchUnit * keySwitch.gridCellSize;
          currentSwitchUnit = 1;
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

  private prepareTraceQueue() {
    this.solderPads.forEach((decoratedSwitchHole) => {
      const x = decoratedSwitchHole.coordinate.x;
      const y = decoratedSwitchHole.coordinate.y;
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
    });
  }

  private calculateTraces() {
    this.traces = [];
    this.traceRowsQueue.concat(this.traceColsQueue).forEach((trace: any) => {
      if (this.keyLookup[trace.to]) {

        const start = this.searchGraph.grid[trace.from.x][trace.from.y];
        const end = this.searchGraph.grid[this.keyLookup[trace.to].x][this.keyLookup[trace.to].y];

        const nodes = (<any>window).astar.search(this.searchGraph, start, end, { heuristic: (<any>window).astar.heuristics.diagonal });
        this.traces.push(nodes);

        this.addTraceToSearchGraph(nodes);
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
    // nodes.forEach(node => this.searchMatrix[node.x][node.y].weight = 0);
    // this.searchGraph = new (<any>window).Graph(this.searchMatrix, { diagonal: true });
    nodes.forEach(node => this.searchGraph.grid[node.x][node.y].weight = 0);
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
