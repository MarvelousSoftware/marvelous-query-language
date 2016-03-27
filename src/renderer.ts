import {QueryLanguageEditor, IAutoCompletionResult} from './query-language';
import {DomUtils} from './utils';

let template = `
<div class="m-query-language-editor">
  <form>
    <div class="mql-text-wrapper">
        <div class="mql-text-input">
          <input class="m-form-control" type="text"/>
        </div>
        <div class="mql-inline-button">
          <button class="mql-submit-btn m-btn m-btn-default" type="submit"></button>
        </div>
    </div>
  </form>
  <div class="mql-completions-wrapper">
    <ul class="mql-completions">
    </ul>
  </div>
  <div class="mql-errors m-alert m-alert-error">
    <ul>
    </ul>
  </div>
</div>
`;

export class QueryLanguageEditorRenderer {
  elements = {
    main: <HTMLElement>undefined,
    form: <HTMLElement>undefined,
    input: <HTMLInputElement>undefined,
    submitButton: <HTMLElement>undefined,
    completions: <HTMLElement>undefined
  }

  classes = {
    main: {
      element: 'm-query-language-editor',
      inlineButtonEnabled: 'mql-inline-button-enabled',
      completionsAvailable: 'mql-completions',
      errors: 'mql-errors'
    },
    query: 'mql-text-input',
    submitButton: 'mql-submit-btn',
    errors: 'mql-errors',
    completions: {
      list: 'mql-completions',
      item: 'mql-completion',
      selected: 'mql-completion-selected'
    }
  }

  private _completions: HTMLLIElement[] = [];

  constructor(private _editor: QueryLanguageEditor) {
    this._bindElements();
  }

  private _bindElements() {
    let el = this._editor.options.element;
    this.elements = {
      main: <HTMLElement>el.getElementsByClassName(this.classes.main.element)[0],
      form: <HTMLElement>el.querySelector('form'),
      input: <HTMLInputElement>el.querySelector('input'),
      submitButton: <HTMLElement>el.querySelector('button[type="submit"]'),
      completions: <HTMLElement>el.getElementsByClassName(this.classes.completions.list)[0]
    };
  }

  renderInitially() {
    let el = this._editor.options.element;

    el.innerHTML = template;

    let input = el.querySelector(`.${this.classes.query} input`);
    let placeholder = this._editor.options.queryPlaceholder === undefined ? 'Write a query' : this._editor.options.queryPlaceholder;
    input.setAttribute('placeholder', placeholder);

    // TODO: disabled while _editor._loading
    // TODO: show/hide depending on option
    let submitBtn = <HTMLButtonElement>el.getElementsByClassName(this.classes.submitButton)[0];
    submitBtn.innerText = this._editor.options.inlineButtonText;

    this._bindElements();
  }

  renderErrors(errors: string[]) {
    if (!errors || !!errors.length === false) {
      this.elements.main.classList.remove(this.classes.main.errors);
      return;
    }

    let errorsEl = this.elements.main.getElementsByClassName(this.classes.errors)[0];
    let list = errorsEl.querySelector('ul');
    let result = '';

    errors.forEach(error => {
      result += `<li>${error}</li>`;
    });

    list.innerHTML = result;
    this.elements.main.classList.add(this.classes.main.errors);
  }

  renderAutoCompletions(result: IAutoCompletionResult) {
    if (!!result.Completions.length === false) {
      this.hideCompletions();
      return;
    }

    let completions = this.elements.main.getElementsByClassName(this.classes.completions.list)[0];
    completions.innerHTML = '';
    this._completions = [];

    for (let index = 0; index < result.Completions.length; index ++) {
      let completion = result.Completions[index];
      
      let li = document.createElement('li');
      li.innerText = completion.Text;
      li.classList.add(this.classes.completions.item);
      DomUtils.addEventListener(li, 'mouseenter', ev => {
        this._editor._events.completionItemMouseEnterHandlers.forEach(h => h({ item: li, native: ev, index }))
      });
      DomUtils.addEventListener(li, 'mouseleave', ev => {
        this._editor._events.completionItemMouseLeaveHandlers.forEach(h => h({ item: li, native: ev, index }))
      });
      DomUtils.addEventListener(li, 'click', ev => {
        this._editor._events.completionItemClickHandlers.forEach(h => h({ item: li, native: ev, index }))
      });
      
      this._completions.push(li);
      completions.appendChild(li);
    }

    this.showCompletions();
    this.selectCompletion(this._editor.selectedCompletionIndex);
  }

  selectCompletion(index: number) {
    this._deselectAllCompletions();
    if (index < 0 || index > this._completions.length - 1) {
      return;
    }
    let completion = this._completions[index];
    completion.classList.add(this.classes.completions.selected);
  }

  private _deselectAllCompletions() {
    for (let completion of this._completions) {
      completion.classList.remove(this.classes.completions.selected);
    }
  }

  showCompletions() {
    this.elements.main.classList.add(this.classes.main.completionsAvailable);
  }

  hideCompletions() {
    this.elements.main.classList.remove(this.classes.main.completionsAvailable);
  }
}