import {Utils, DomUtils} from './utils';
import {QueryLanguageEvents} from './events';
import {QueryLanguageEditorRenderer} from './renderer';

// TODO: m-form-control, m-btn, m-alert
// TODO: single error styling

// TODO: classList shim in docs
// TODO: test in IE9

export class QueryLanguageFactory {
  createEditor(options: IQueryLanguageOptions) {
    return new QueryLanguageEditor(options);
  }
}

(<any>window).marvelousQueryLanguage = new QueryLanguageFactory();

export class QueryLanguageEditor {
  options: IQueryLanguageOptions;
  autoCompletionResult: IAutoCompletionResult;
  selectedCompletionIndex: number = -1;

  errors: string[] = [];

  _events: QueryLanguageEvents;

  private _preventFromFocusOut = false;

  private _loading: boolean;
  private _lastSubmittedQuery: string;

  private _renderer: QueryLanguageEditorRenderer;

  get query() {
    return this._renderer.elements.input.value;
  }

  set query(value: string) {
    this._renderer.elements.input.value = value;
  }

  constructor(options: IQueryLanguageOptions) {
    this.options = options;

    this._validateOptions();
    this._createOptions();

    this._renderer = new QueryLanguageEditorRenderer(this);
    this._renderer.renderInitially();
    this._events = new QueryLanguageEvents(this._renderer);
    
    this._registerGeneralHandlers();
    this._registerInputHandlers();
  }

  unregister() {
    this._events.unregister();
  }

  private _validateOptions() {
    if (!this.options) {
      throw new Error('MQL needs options to run.');
    }

    if (!this.options.element) {
      throw new Error('MQL editor needs element to attach.');
    }
  }

  private _createOptions() {
    let o = this.options;
    o.inlineButton = o.inlineButton === undefined ? true : o.inlineButton;
    o.inlineButtonText = o.inlineButtonText || 'Apply';
    o.submitOnFocusOut = o.submitOnFocusOut === undefined ? false : o.submitOnFocusOut;
    o.onSubmit = o.onSubmit || Utils.noop;
  }

  private _registerGeneralHandlers() {
    this._events.onSubmit((ev: KeyboardEvent) => {
      this.submit();
      Utils.preventDefaultAndPropagation(ev);
    });
    this._events.onCompletionsMouseEnter(() => {
      this._preventFromFocusOut = true;
    });
    this._events.onCompletionsMouseLeave(() => {
      this._preventFromFocusOut = false;
    });
    this._events.onCompletionItemMouseEnter(ev => {
      this.select(ev.index);
    });
    this._events.onCompletionItemClick(ev => {
      Utils.preventDefaultAndPropagation(ev);      
      this.applySelectedAutoCompletion();
    });
  }

  submit() {
    if (this._lastSubmittedQuery === this.query) {
      // submits only if query has some changes
      return;
    }

    let promise = this.options.onSubmit();
    if (!promise || !(promise.then instanceof Function)) {
      return;
    }

    this._lastSubmittedQuery = this.query;
    
    this.hideCompletions();
    this._loading = true;
    promise.then((x) => {
      this._loading = false;

      if (!x) {
        return;
      }

      // if wrapped with DataSourceResult<T>
      // then uses `queryLanguage`
      // otherwise result is assumed to be QueryLanguageFilterResult<T>
      let result = x.queryLanguage || x;
      this.errors = result.errors || [];
      this._renderer.renderErrors(this.errors);
    }, () => this._loading = false);
  }

  applySelectedAutoCompletion() {
    let result = this.autoCompletionResult;
    let index = this.selectedCompletionIndex;
    if (index < 0 || index > result.Completions.length - 1) {
      return;
    }

    let selected = result.Completions[index];

    // TODO: issue with history (ctrl+z doesn't work as it should)
    let newQuery = this.query.substr(0, result.StartPosition);
    newQuery += selected.Text;
    let caretPosition = newQuery.length;
    newQuery += this.query.substr(result.StartPosition + result.Length);

    this.query = newQuery;

    this.hideCompletions();
    DomUtils.setCaretPosition(this._renderer.elements.input, caretPosition);
  }

  anyCompletion() {
    if (!this.autoCompletionResult || !this.autoCompletionResult.Completions) {
      return false;
    }
    return this.autoCompletionResult.Completions.length != 0;
  }

  hideCompletions() {
    this.selectedCompletionIndex = -1;

    if (this.autoCompletionResult)
      this.autoCompletionResult.Completions = [];

    this._renderer.hideCompletions();
  }

  select(index: number) {
    this.selectedCompletionIndex = index;
    this._renderer.selectCompletion(this.selectedCompletionIndex);
  }

  selectNext() {
    if (this.selectedCompletionIndex == this.autoCompletionResult.Completions.length - 1) {
      this.select(0);
      return;
    }
    this.select(this.selectedCompletionIndex + 1);
  }

  selectPrevious() {
    if (this.selectedCompletionIndex <= 0) {
      this.select(this.autoCompletionResult.Completions.length - 1);
      return;
    }
    this.select(this.selectedCompletionIndex - 1);
  }

  refreshCompletions() {
    // TODO: debaunce
    if (!this.options.autoComplete) {
      return;
    }

    let promise = undefined;
    let params = {
      query: this.query,
      caretPosition: DomUtils.getCaretPosition(this._renderer.elements.input),
      skip: 0
    }

    let func = Utils.createReadFunction(this.options.autoComplete, {
      allowData: false,
      dataMissingError: '`autoComplete` has to be either url or a function.',
      shouldReturnUrlOrPromiseError: '`autoComplete` function should return url or promise.'
    });

    // TODO: race condition! only last one should resolve
    func(params).then((x: IAutoCompletionResult) => {
      this.selectedCompletionIndex = -1;
      this.autoCompletionResult = x;
      this._renderer.renderAutoCompletions(this.autoCompletionResult);
    });
  }

  private _registerInputHandlers() {
    let isInputClick = false;
    let input = this._renderer.elements.input;

    this._events.onInputKeyUp(ev => {
      switch (ev.which) {
        case 37: // Left
        case 39: // Right
        case 36: // Home
        case 35: // End
          this.refreshCompletions();
          break;
        case 38: // Up
        case 40: // Down
          if (!this.anyCompletion()) {
            this.refreshCompletions();
          }
          break;
        case 27: // Esc
          this.hideCompletions();
          break;
        case 16: // Shift
        case 17: // Ctrl
        case 18: // Alt
        case 255: // Fn
        case 13: // Enter
        case 9: // Tab
          break;
        default:
          this.refreshCompletions();
          break;
      }
    });
    
    this._events.onInputKeyDown(ev => {
      if (this.anyCompletion()) {
        switch (ev.which) {
          case 38: // Up
            this.selectPrevious();
            Utils.preventDefaultAndPropagation(ev);
            return;
          case 40: // Down					
            this.selectNext();
            Utils.preventDefaultAndPropagation(ev);
            return;
          case 13: // Enter
          case 9: // Tab
            if (this.selectedCompletionIndex >= 0) {
              this.applySelectedAutoCompletion();
              Utils.preventDefaultAndPropagation(ev);
              return;
            }
        }
      }
    });
    
    this._events.onInputMouseUp(ev => {
      this.refreshCompletions();
    });
    
    this._events.onInputMouseDown(ev => {
      isInputClick = true;
    });
    
    this._events.onInputFocus(ev => {
      if (!isInputClick && !this._preventFromFocusOut) {
        this.refreshCompletions();
      }
      isInputClick = false;
    });
    
    this._events.onInputBlur(ev => {
      if (this._preventFromFocusOut) {
        Utils.preventDefaultAndPropagation(ev);
        return;
      }

      this.hideCompletions();
      isInputClick = false;

      if (this.options.submitOnFocusOut) {
        this.submit();
      }
    });
  }
}

export interface IQueryLanguageOptions {
  element: Element;
  autoComplete?: ((IAutoCompletionParams) => any) | string;
  inlineButton?: boolean;
  inlineButtonText?: string;
  queryPlaceholder?: string;
  submitOnFocusOut?: boolean;
  onSubmit?: () => any;
}

export interface IAutoCompletionParams {
  query: string,
  caretPosition: number,
  skip: number
}

export interface IAutoCompletionResult {
  StartPosition: number,
  Length: number,
  Completions: IAutoCompletionRow[],
  IsNextPageAvailable: boolean,
  Errors: string[],
  HasErrors: boolean
}

export interface IAutoCompletionRow {
  Text: string,
  Group: string
}