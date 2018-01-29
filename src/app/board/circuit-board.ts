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
  private numRows: number = 0;
  private numCols: number = 0;
  private decoratedDrillHoles: DecoratedSwitchHoles = [];
  private solderPads: any = [];
  private traces: any = [];

  private keyLookup: any = {};
  private traceRowsQueue = [];
  private traceColsQueue = [];
  private traceControllerConnectorsQueue = [];
  private searchGraph: any;

  private scaleFactor = 0;
  private searchMatrix: { weight: number, owner?: Point }[][];

  constructor(rawData: KleData, unitSize: number, keySwitch: Switch) {
    this.scaleFactor = unitSize / keySwitch.gridCellSize;
    this.numRows = rawData.length;
    this.height = rawData.length * keySwitch.gridCellSize;

    this.createDrillHolesAndSolderPads(rawData, keySwitch);
    this.createControllerConnectorPads(keySwitch);
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
          colNumber++;
          currentXPosition += currentSwitchUnit * keySwitch.gridCellSize;
          currentSwitchUnit = 1;
        } else if (typeof potentialKey === 'object') {
          if (potentialKey.w) {
            currentSwitchUnit = potentialKey.w;
          }
          if (potentialKey.x) {
            currentXPosition += keySwitch.gridCellSize * potentialKey.x;
          }
        }
        if (colNumber > this.numCols) {
          this.numCols = colNumber;
        }
        if (currentXPosition > this.width) {
          this.width = currentXPosition;
        }
      });
      currentYPosition += keySwitch.gridCellSize;
      currentXPosition = 0;
    });
  }

  private createControllerConnectorPads(keySwitch: Switch) {
    if (keySwitch.name === 'ML_PCB') {
      for (let i = 0; i < this.numRows; i++) {
        const x = 12;
        const y = keySwitch.gridCellSize * i + 12;
        this.solderPads.push({
          hole: { diameter: 1.5 },
          switchPosition: { col: -1, row: -1 },
          coordinate: { x: x, y: y }
        });
        let holeToId = 0 + ':' + i + ':diodeIn';
        this.traceControllerConnectorsQueue.push({ from: { x: x, y: y }, to: holeToId });
      }
    }
    for (let i = 0; i < this.numCols; i++) {
      const x = keySwitch.gridCellSize * i + keySwitch.gridCellSize / 2;
      const y = 12;
      this.solderPads.push({
        hole: { diameter: 1.5 },
        switchPosition: { col: -1, row: -1 },
        coordinate: { x: x, y: y }
      });
      let holeToId = i + ':' + 0 + ':col';
      this.traceControllerConnectorsQueue.push({ from: { x: x, y: y }, to: holeToId });
    }
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
    const traceWarnings = [];
    this.traceRowsQueue.concat(this.traceColsQueue).concat(this.traceControllerConnectorsQueue).forEach((trace: any) => {
      if (this.keyLookup[trace.to]) {

        const start = this.searchGraph.grid[trace.from.x][trace.from.y];
        const end = this.searchGraph.grid[this.keyLookup[trace.to].x][this.keyLookup[trace.to].y];

        const nodes = (<any>window).astar.search(this.searchGraph, start, end, { heuristic: (<any>window).astar.heuristics.diagonal });

        if (nodes.length === 0) {
          traceWarnings.push(trace);
        }

        this.traces.push(nodes);

        this.addTraceToSearchGraph(nodes);
      } else {
        console.log('There was no target', trace.to);
      }
    });
    if (traceWarnings.length > 0) {
      alert('Unable to find traces:\n\n' + JSON.stringify(traceWarnings));
    }
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
      let margin;
      let extra = 3.2;
      if (decoratedDrillHole.hole.type === 'connector') {
        margin = Math.floor(((decoratedDrillHole.hole.diameter / 2) + 1.8) / this.scaleFactor);
      } else {
        margin = Math.floor(((decoratedDrillHole.hole.diameter / 2) + 1.5) / this.scaleFactor);
      }
      this.markHoleAndPad(x, y, margin, this.searchMatrix);
    });
    this.searchGraph = new (<any>window).Graph(this.searchMatrix, { diagonal: true });
  }

  private addTraceToSearchGraph(nodes: Point[]) {
    // nodes.forEach(node => this.searchMatrix[node.x][node.y].weight = 0);
    // nodes.forEach((node) => {
    //   this.markHoleAndPad(node.x, node.y, Math.floor(1.5 / this.scaleFactor), this.searchMatrix, true);
    // });
    // this.searchGraph = new (<any>window).Graph(this.searchMatrix, { diagonal: true });

    // Modify grid within searchGraph to increase performance a hundredfold. Beware for the bugs
    nodes.forEach((node) => {
      this.markHoleAndPad(node.x, node.y, Math.floor(1.5 / this.scaleFactor), this.searchGraph.grid, true);
    });
  }

  private markHoleAndPad(x: number, y: number, margin: number, searchMatrix: any, skipOwner?: boolean) {
    for (let hor = x + 1 - margin; hor < x + margin; hor++) {
      if (searchMatrix[hor]) {
        for (let ver = y + 1 - margin; ver < y + margin; ver++) {
          if (searchMatrix[hor][ver]) {
            if (skipOwner) {
              searchMatrix[hor][ver].weight = 0;
            } else {
              searchMatrix[hor][ver] = { weight: 0, owner: x + ':' + y };
            }
          }
        }
      }
    }
  }

}
