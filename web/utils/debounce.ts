export default function debounce(callback: Function, wait: number) {
    let timeout: NodeJS.Timer
    return (...args: any) => {
      clearTimeout(timeout);
      timeout = setTimeout(function () { callback.apply(this, args); }, wait);
    };
  }

