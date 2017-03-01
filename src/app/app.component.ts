import { Component } from '@angular/core';
import { CHERRY_ML_SWITCH, CHERRY_MX_PLATE_SWITCH, CHERRY_MX_PCB_SWITCH } from './switches/cherry-switches';
import { Switch } from './switches/switch.domain';
import { Board } from './board/board';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  availableSwitches: { label: string, keySwitch: Switch }[] = [
    { label: 'Cherry ML', keySwitch: CHERRY_ML_SWITCH },
    { label: 'Cherry MX PCB mount', keySwitch: CHERRY_MX_PCB_SWITCH },
    { label: 'Cherry MX plate mount', keySwitch: CHERRY_MX_PLATE_SWITCH }
  ];

  selectedSwitch = CHERRY_ML_SWITCH;
  unitSize: number = 19.05;
  rawData: any = '["A"], ["C"]';

  createPcbSuggestion(rawData: any) {
    this.removeOldBoards();

    const board = new Board((<any>window).RJSON.parse('[' + this.rawData + ']'),
                            this.unitSize,
                            this.selectedSwitch);

    const svg = board.createSvg();
    document.getElementById('pcb-output').appendChild(svg);
  }

  private removeOldBoards() {
    const output = document.getElementById('pcb-output');
    while (output.firstChild) {
      output.removeChild(output.firstChild);
    }
  }

}
