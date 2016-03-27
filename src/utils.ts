export class Debouncer {
  private _executingId: number;

  constructor(private _debounceTime: number) {
  }

  do(action: () => void) {
    if (this._debounceTime === undefined || this._debounceTime <= 0) {
      action();
    }

    if (this._executingId !== undefined) {
      clearTimeout(this._executingId);
    }

    this._executingId = setTimeout(function() {
      action();
    }, this._debounceTime);
  }
}

export class DomUtils {
  static getCaretPosition(input) {
    // Internet Explorer Caret Position (TextArea)
    let caretPosition;
    let doc: any = document;
    if (doc.selection && doc.selection.createRange) {
      let range = doc.selection.createRange();
      let bookmark = range.getBookmark();
      caretPosition = bookmark.charCodeAt(2) - 2;
    } else {
      // Firefox Caret Position (TextArea)
      if (input.setSelectionRange)
        caretPosition = input.selectionStart;
    }

    return caretPosition;
  }

  static setCaretPosition(element: Element, caretPos) {
    let elem: any = element;
    if (elem != null) {
      if (elem.createTextRange) {
        let range = elem.createTextRange();
        range.move('character', caretPos);
        range.select();
      }
      else {
        if (elem.selectionStart) {
          elem.focus();
          elem.setSelectionRange(caretPos, caretPos);
        }
        else
          elem.focus();
      }
    }
  }
  
  static addEventListener(element: Element, event: string, listener: (event) => void) {
    element.addEventListener(event, listener);
    return () => {
      element.removeEventListener(event, listener);
    }
  }
}

export class Utils {
  static noop() {}
  
  static preventDefaultAndPropagation(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    } else {
      e.cancelBubble = true;
    }

    if (e.preventDefault) {
      e.preventDefault();
    } else {
      e.returnValue = false;
    }
  }
   
  static defer() {
    // TODO: return appropriate type (generic one)!
    let deferred;

    let promise = new Promise((resolve, reject) => {
      deferred = {
        resolve: function(...args) {
          resolve.apply(this, args);
        },
        reject: function(...args) {
          reject.apply(this, args);
        }
      };
    });

    deferred.promise = promise;
    return deferred;
  }
  
  static createReadFunction(promiseOrUrlOrData, options: ICreateReadFunctionOptions = { allowData: true }): (context:any)=>Promise<any> {
    options.params = options.params || (x => x);
    
    if (promiseOrUrlOrData instanceof Function) {
      let func = promiseOrUrlOrData;

      return (context) => {
        let result = func(context);

        if (result === undefined && options.allowUndefined) {
          return undefined;
        }

        if (options.allowData && result instanceof Array) {
          return Utils.createReadFunction(result);
        }

        if (!result || (!(typeof result === "string") && !result.then)) {
          throw new Error(options.shouldReturnUrlOrPromiseError || 'Function should return url or promise.');
        }

        if (typeof result === "string") {
          let url = result;
          result = Utils.sendAjax(url, options.params(context))
        }

        return result;
      }
    }
    if (typeof promiseOrUrlOrData == "string") {
      // read should be an url
      return context => Utils.sendAjax(promiseOrUrlOrData, options.params(context));
    }

    if (!options.allowData) {
      throw new Error(options.dataMissingError);
    }

    return function() {
      return new Promise<any>((resolve) => {
        resolve(promiseOrUrlOrData);
      });
    }
  }
  
  static sendAjax(url: string, params) {
    let deferred = Utils.defer();
    let http = new XMLHttpRequest();

    http.open("GET", Utils.combineUrlWithParams(url, params), true);
    http.onreadystatechange = function() {
      if (http.readyState == 4 && http.status >= 200 && http.status < 300) {
        deferred.resolve(JSON.parse(http.responseText));
      } else if (http.readyState == 4) {
        deferred.reject({
          text: http.responseText,
          status: http.status,
          statusText: http.statusText
        });
      }
    }
    http.send(null);
    return deferred.promise;
  }

  static combineUrlWithParams(url, params) {
    let paramsString = "";
    for (let key in params) {
      let value = encodeURIComponent(params[key]);
      paramsString += `&${key}=${value}`;
    }
    if (paramsString) {
      paramsString = paramsString.substr(1);
    }

    let separator = '?';
    if (url.indexOf('?') != -1) {
      if (url[url.length - 1] == '?') {
        separator = '';
      }
      else {
        separator = '&';
      }
    }

    return `${url}${separator}${paramsString}`;
  }
}

export interface ICreateReadFunctionOptions {
  allowData: boolean;
  params?: (context:any)=>any;
  allowUndefined?: boolean;
  dataMissingError?: string;
  shouldReturnUrlOrPromiseError?: string;
}