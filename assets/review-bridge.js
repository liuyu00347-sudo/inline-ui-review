/* MIT. Internal portability contract, not a vendor-provided API. */
(function (scope) {
  "use strict";
  function create(explicitHost) {
    const candidate = explicitHost === undefined ? scope.inlineUiReviewHost : explicitHost;
    const custom = candidate && typeof candidate === "object" ? candidate : null;
    if (custom) {
      return {
        kind: "custom",
        get canSend() { return typeof custom.send === "function"; },
        load: () => typeof custom.getState === "function" ? custom.getState() : null,
        save: snapshot => typeof custom.saveState === "function" ? custom.saveState(snapshot) : undefined,
        subscribe: callback => typeof custom.subscribe === "function" ? custom.subscribe(callback) : undefined,
        send: payload => {
          if (typeof custom.send !== "function") throw new Error("feedback_transport_unavailable");
          return custom.send(payload);
        }
      };
    }
    return {
      get kind() { return scope.openai ? "openai" : "manual"; },
      get canSend() { return typeof scope.openai?.sendFollowUpMessage === "function"; },
      load: () => scope.openai?.widgetState ?? null,
      save: snapshot => typeof scope.openai?.setWidgetState === "function" ? scope.openai.setWidgetState(snapshot) : undefined,
      subscribe: callback => {
        if (typeof scope.addEventListener !== "function") return undefined;
        const handler = event => {
          if (event.detail?.globals && Object.hasOwn(event.detail.globals, "widgetState")) callback(event.detail.globals.widgetState);
        };
        scope.addEventListener("openai:set_globals", handler);
        return () => scope.removeEventListener("openai:set_globals", handler);
      },
      send: payload => {
        if (typeof scope.openai?.sendFollowUpMessage !== "function") throw new Error("feedback_transport_unavailable");
        return scope.openai.sendFollowUpMessage(payload);
      }
    };
  }
  scope.InlineReviewBridge = { create };
})(typeof window === "undefined" ? globalThis : window);
