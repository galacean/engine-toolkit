let requestSize = 0;

let originalSend = XMLHttpRequest.prototype.send;

const cacheMap = new Map<string, number>();
function addRequestSize(url: string, size: number) {
  if (cacheMap.get(url) == undefined) {
    cacheMap.set(url, size);
    console.log(`request(${size}): ${url}`);
    requestSize += size;
  }
}

XMLHttpRequest.prototype.send = function (body) {
  this.addEventListener(
    "load",
    function () {
      let size = 0;
      if (this.responseType === "" || this.responseType === "text") {
        size = new Blob([JSON.stringify(this.responseText)]).size;
      } else if (this.response instanceof Blob) {
        size = this.response.size;
      } else if (this.response instanceof ArrayBuffer) {
        size = this.response.byteLength;
      } else if (this.responseType === "json") {
        size = new Blob([JSON.stringify(this.response)]).size;
      }

      addRequestSize((this as XMLHttpRequest).responseURL, size);
    },
    false
  );

  originalSend.call(this, body);

  var originalImageSrc = Object.getOwnPropertyDescriptor(
    Image.prototype,
    "src"
  ).set;

  this.originalImageSrc = originalImageSrc;

  Object.defineProperty(Image.prototype, "src", {
    set: function (value) {
      fetch(value).then((response) => {
        if (response.ok) {
          response.blob().then((blob) => {
            addRequestSize((this as XMLHttpRequest).responseURL, blob.size);
          });
        }
      });
      originalImageSrc.call(this, value);
    },
  });
};

export class RequestHook {
  private _originalSend;
  private _hooked = false;

  get size() {
    return formatNumber(requestSize / 1024 / 1024);
  }

  constructor() {
    this._hooked = true;
  }

  public reset(): void {
    requestSize = 0;
  }

  public release(): void {
    if (this._hooked) {
      XMLHttpRequest.prototype.send = this._originalSend;
      Object.defineProperty(Image.prototype, "src", {
        set: function (value) {
          this.src.call(this, value);
        },
      });
    }
    this._hooked = false;
  }
}

function formatNumber(num: number): string {
  return Number(num).toFixed(
    Math.max(6 - num.toString().split(".")[0].length, 0)
  );
}
