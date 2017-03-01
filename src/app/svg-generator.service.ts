import { Injectable } from '@angular/core';
import { CircuitBoard } from './board/circuit-board';

@Injectable()
export class SvgGenerator {

  createSvg(circuitBoard: CircuitBoard) {
    const width = circuitBoard.getWidth();
    const height = circuitBoard.getHeight();
    const scaleFactor = circuitBoard.getScaleFactor();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', (width * scaleFactor) + 'mm');
    svg.setAttribute('height', (height * scaleFactor) + 'mm');
    svg.setAttribute('viewport', '0 0 ' + (width * scaleFactor) + ' ' + (height * scaleFactor));
    const boardSvg = this.drawBoard({ width: width, height: height });
    const solderingPadsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const tracesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const drillHolesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(boardSvg);
    svg.appendChild(tracesGroup);
    svg.appendChild(solderingPadsGroup);
    svg.appendChild(drillHolesGroup);

    this.drawDrillHoles(drillHolesGroup, circuitBoard.getDrillHoles(), scaleFactor);
    this.drawSolderingPads(solderingPadsGroup, circuitBoard.getSolderPads(), scaleFactor);
    this.drawTraces(tracesGroup, circuitBoard.getTraces(), scaleFactor);
    return svg;
  }

  private drawBoard(pcbSize: { width: number, height: number }) {
    const board = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    board.setAttributeNS(null, 'width', pcbSize.width + 'mm');
    board.setAttributeNS(null, 'height', pcbSize.height + 'mm');
    board.setAttributeNS(null, 'fill', '#3a6629');
    return board;
  }

  private drawDrillHoles(drillHolesGroup: SVGElement, drillHoles: any, scaleFactor) {
    drillHoles.forEach((decoratedSwitchHole) => {
      const x = decoratedSwitchHole.coordinate.x;
      const y = decoratedSwitchHole.coordinate.y;
      const drillHole = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      drillHole.setAttributeNS(null, 'cx', (scaleFactor * x) + 'mm');
      drillHole.setAttributeNS(null, 'cy', (scaleFactor * y) + 'mm');
      drillHole.setAttributeNS(null, 'r', decoratedSwitchHole.hole.diameter / 2 + 'mm');
      drillHole.setAttributeNS(null, 'fill', '#ffffff');
      drillHolesGroup.appendChild(drillHole);
    });
  }

  private drawSolderingPads(solderingPadsGroup: SVGElement, solderingPads: any, scaleFactor) {
    solderingPads.forEach((solderingPad) => {
      const solderingPadCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      solderingPadCircle.setAttributeNS(null, 'cx', (scaleFactor * solderingPad.coordinate.x) + 'mm');
      solderingPadCircle.setAttributeNS(null, 'cy', (scaleFactor * solderingPad.coordinate.y) + 'mm');
      solderingPadCircle.setAttributeNS(null, 'r', (solderingPad.hole.diameter + 1) / 2 + 'mm');
      solderingPadCircle.setAttributeNS(null, 'fill', '#F7BD13');
      solderingPadsGroup.appendChild(solderingPadCircle);
    });
  }

  private drawTraces(tracesGroup: SVGElement, traces: any, scaleFactor: number) {
    traces.forEach((traceNodes) => {
      let linePoints = this.prepareNodesForLineDrawing(traceNodes);

      let first = linePoints.shift();
      let line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let pathString = '';
      pathString = pathString + 'M' + (first.x * scaleFactor * (72/19.05)) + ' ' + (first.y * scaleFactor * (72/19.05));
      pathString = pathString + ' L';
      linePoints.forEach((gridNode: any) => {
        pathString = pathString + ' ' + (gridNode.x * scaleFactor * (72/19.05)) +
          ' ' + (gridNode.y * scaleFactor * (72/19.05));
      });
      line.setAttributeNS(null, 'd', pathString);
      line.setAttributeNS(null, 'fill', 'transparent');
      line.setAttributeNS(null, 'stroke-width', '0.5mm');
      line.setAttributeNS(null, 'stroke', '#275520');
      tracesGroup.appendChild(line);
    });
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
