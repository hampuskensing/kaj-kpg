import { Component } from '@angular/core';
import { CHERRY_ML_SWITCH, CHERRY_MX_PLATE_SWITCH, CHERRY_MX_PCB_SWITCH } from './switches/cherry-switches';
import { SwitchHole } from './switches/switch-hole.domain';
import { Switch } from './switches/switch.domain';
import { RJSON } from '../../lib/@types/relaxed-json';

type KeyboardMatrix = { [coordinate: string]: { hole: SwitchHole, row: number, col: number } };

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  scaleFactor = 19.05 / 15 / 4;

  availableSwitches: { label: string, keySwitch: Switch }[] = [
    { label: 'Cherry ML', keySwitch: CHERRY_ML_SWITCH },
    { label: 'Cherry MX PCB mount', keySwitch: CHERRY_MX_PCB_SWITCH },
    { label: 'Cherry MX plate mount', keySwitch: CHERRY_MX_PLATE_SWITCH }
  ];

  selectedSwitch = CHERRY_ML_SWITCH;

  keyLookup: any = {};
  traceTaskQueue = [];

  createPcbSuggestion(rawData: any) {
    this.traceTaskQueue = [];
    this.removeOldBoards();

    const keyboardLayout = RJSON.parse('[' + rawData + ']');
    let currentSwitchUnit = 1;
    const unitSize = 60;

    let currentYPosition = 0;
    let currentXPosition = 0;
    let widestX = 0;

    let keyboardMatrix: KeyboardMatrix = {};

    keyboardLayout.forEach((row: any, rowNumber: number) => {
      let colNumber = 0;
      row.forEach((potentialKey: any) => {

        if (typeof potentialKey === 'string') {
          console.log(potentialKey + 'at ' + colNumber + ',' + rowNumber);
          this.selectedSwitch.holes.forEach((switchHole) => {
            const coordinate = (currentXPosition + switchHole.x) + ':' + (currentYPosition + switchHole.y);
            keyboardMatrix[coordinate] = { hole: switchHole, col: colNumber, row: rowNumber };
          });
          currentXPosition += currentSwitchUnit * unitSize;
          colNumber++;
        } else if (typeof potentialKey === 'object') {
          if (potentialKey.w) {
            currentSwitchUnit = potentialKey.w;
          }
          if (potentialKey.x) {
            currentXPosition += unitSize * potentialKey.x;
          }
        }

        if (currentXPosition > widestX) {
          widestX = currentXPosition;
        }
      });
      currentYPosition += unitSize;
      currentXPosition = 0;
    });
    let tallestY = keyboardLayout.length * unitSize;


    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', (widestX * this.scaleFactor) + 'mm');
    svg.setAttribute('height', (tallestY * this.scaleFactor) + 'mm');
    svg.setAttribute('viewport', '0 0 ' + (widestX * this.scaleFactor) + ' ' + (tallestY * this.scaleFactor));
    const board = this.drawBoard({ width: widestX, height: tallestY });
    const solderingPads = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    // const traces = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const drillHoles = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(board);
    svg.appendChild(solderingPads);
    // svg.appendChild(traces);
    svg.appendChild(drillHoles);
    document.getElementById('pcb-output').appendChild(svg);

    this.drawDrillHoles(keyboardMatrix, drillHoles, solderingPads);
    // this.drawTraces(traces);
  }

  private removeOldBoards() {
    const output = document.getElementById('pcb-output');
    while (output.firstChild) {
      output.removeChild(output.firstChild);
    }
  }

  private drawBoard(pcbSize: { width: number, height: number }) {
    let board = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    board.setAttributeNS(null, 'width', pcbSize.width + 'mm');
    board.setAttributeNS(null, 'height', pcbSize.height + 'mm');
    board.setAttributeNS(null, 'fill', '#3a6629');
    return board;
  }

  private drawDrillHoles(matrix: KeyboardMatrix, drillHoles: SVGElement, solderingPads: SVGElement) {
    for (const key in matrix) {
      if (matrix.hasOwnProperty(key)) {
        let parts = key.split(':');
        const x = parseInt(parts[0]);
        const y = parseInt(parts[1]);
        let drillHole = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        drillHole.setAttributeNS(null, 'cx', (this.scaleFactor * x) + 'mm');
        drillHole.setAttributeNS(null, 'cy', (this.scaleFactor * y) + 'mm');
        drillHole.setAttributeNS(null, 'r', matrix[key].hole.diameter / 2 + 'mm');
        drillHole.setAttributeNS(null, 'fill', '#ffffff');
        drillHoles.appendChild(drillHole);

        if (matrix[key].hole.type === 'connector') {
          let solderingPad = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          solderingPad.setAttributeNS(null, 'cx', (this.scaleFactor * x) + 'mm');
          solderingPad.setAttributeNS(null, 'cy', (this.scaleFactor * y) + 'mm');
          solderingPad.setAttributeNS(null, 'r', (matrix[key].hole.diameter + 1) / 2 + 'mm');
          solderingPad.setAttributeNS(null, 'fill', '#F7BD13');
          solderingPads.appendChild(solderingPad);
          const holeName = matrix[key].hole.name;
          if (holeName) {
            let holeId = matrix[key].col + ':' + matrix[key].row + ':' + holeName;
            this.keyLookup[holeId] = { x: x, y: y };
          }
          const holeTo = matrix[key].hole.to;
          if (holeTo === 'row') {
            let holeToId = (matrix[key].col - 1) + ':' + matrix[key].row + ':row';
            this.traceTaskQueue.push({ from: {x: x, y: y}, to: holeToId });
          } else if (holeTo === 'diodeIn') {
            let holeToId = (matrix[key].col) + ':' + matrix[key].row + ':diodeIn';
            this.traceTaskQueue.push({ from: {x: x, y: y}, to: holeToId });
          } else if (holeTo === 'diodeOut') {
            let holeToId = (matrix[key].col) + ':' + matrix[key].row + ':diodeOut';
            this.traceTaskQueue.push({ from: {x: x, y: y}, to: holeToId });
          } else if (holeTo === 'col') {
            let holeToId = (matrix[key].col) + ':' + (matrix[key].row + 1) + ':col';
            this.traceTaskQueue.push({ from: {x: x, y: y}, to: holeToId });
          }
        }
      }
    }
  }

  private drawTraces(traces: SVGElement) {

    this.traceTaskQueue.forEach((trace: any) => {
      if (this.keyLookup[trace.to]) {
        let line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let pathString = '';
        pathString = pathString + 'M' + (trace.from.x * this.scaleFactor * (72/19.05)) + ' ' + (trace.from.y * this.scaleFactor * (72/19.05));
        pathString = pathString + ' ';
        pathString = pathString + 'L' + (this.keyLookup[trace.to].x * this.scaleFactor * (72/19.05)) +
          ' ' + (this.keyLookup[trace.to].y * this.scaleFactor * (72/19.05));
        line.setAttributeNS(null, 'd', pathString);
        line.setAttributeNS(null, 'fill', 'transparent');
        line.setAttributeNS(null, 'stroke-width', '1mm');
        line.setAttributeNS(null, 'stroke', '#F7BD13');
        traces.appendChild(line);
      }
    });

  }


}
