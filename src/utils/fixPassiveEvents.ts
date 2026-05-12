(function forceNonPassiveCanvasListeners() {
    const originalAdd = EventTarget.prototype.addEventListener;
  
    EventTarget.prototype.addEventListener = function (
      type: string,
      listener: any,
      options?: any
    ) {
      const touchEvents = [
        'touchstart',
        'touchmove',
        'touchend',
        'touchcancel'
      ];
  
      if (touchEvents.includes(type)) {
        if (typeof options === 'object') {
          options.passive = false;
        } else {
          options = { passive: false };
        }
      }
  
      return originalAdd.call(this, type, listener, options);
    };
  })();