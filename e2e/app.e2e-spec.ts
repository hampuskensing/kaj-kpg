import { KeyboardPcbGeneratorPage } from './app.po';

describe('keyboard-pcb-generator App', function() {
  let page: KeyboardPcbGeneratorPage;

  beforeEach(() => {
    page = new KeyboardPcbGeneratorPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
