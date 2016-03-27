import {DomUtils} from './utils';
import {QueryLanguageEditorRenderer} from './renderer';

export declare type MouseHandler = (event: MouseEvent) => void;
export declare type KeyboardHandler = (event: KeyboardEvent) => void;
export declare type CompletionItemHandler = (event: { item: HTMLElement, native: MouseHandler, index: number }) => void;

export class QueryLanguageEvents {
  completionItemMouseEnterHandlers: CompletionItemHandler[] = [];
  completionItemMouseLeaveHandlers: CompletionItemHandler[] = [];
  completionItemClickHandlers: CompletionItemHandler[] = [];
  
  private _subs = [];
  
  constructor(private _renderer: QueryLanguageEditorRenderer) {
  }
  
  onSubmit(handler: (event: any) => void) {
    this._register(this._renderer.elements.form, 'submit', handler);
  }
  
  onInputKeyUp(handler: KeyboardHandler) {
    this._register(this._renderer.elements.input, 'keyup', handler);
  }
  
  onInputKeyDown(handler: KeyboardHandler) {
    this._register(this._renderer.elements.input, 'keydown', handler);
  }
  
  onInputMouseUp(handler: MouseHandler) {
    this._register(this._renderer.elements.input, 'mouseup', handler);
  }
  
  onInputMouseDown(handler: MouseHandler) {
    this._register(this._renderer.elements.input, 'mousedown', handler);
  }
  
  onInputFocus(handler: KeyboardHandler) {
    this._register(this._renderer.elements.input, 'focus', handler);
  }
  
  onInputBlur(handler: KeyboardHandler) {
    this._register(this._renderer.elements.input, 'blur', handler);
  }
  
  onCompletionsMouseEnter(handler: MouseHandler) {
    this._register(this._renderer.elements.completions, 'mouseenter', handler);
  }
  
  onCompletionsMouseLeave(handler: MouseHandler) {
    this._register(this._renderer.elements.completions, 'mouseleave', handler);
  }
  
  onCompletionItemMouseEnter(handler: CompletionItemHandler) {
    this.completionItemMouseEnterHandlers.push(handler);
  }
  
  onCompletionItemMouseLeave(handler: CompletionItemHandler) {
    this.completionItemMouseLeaveHandlers.push(handler);
  }
  
  onCompletionItemClick(handler: CompletionItemHandler) {
    this.completionItemClickHandlers.push(handler);
  }
  
  private _register(element: Element, eventName: string, handler: (event: any) => void) {
    this._subs.push(DomUtils.addEventListener(element, eventName, handler));
  }
  
  unregister() {
    // TODO: how to invoke this automatically?
    this._subs.forEach(x => x());
    this._subs = [];
  }
}