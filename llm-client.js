/* Shared transport for Ollama native and OpenAI-compatible providers. */
(function (global) {
  'use strict';
  var lastError = '';
  var calls = 0;
  var successes = 0;
  var generation = 0;
  var controllers = [];
  function settings() {
    var value = { enabled: false, endpoint: '', apiKey: '', model: 'glm-5.2', timeoutMs: 20000, maxTokens: 2200, temperature: 0.8 };
    try {
      var raw = global.localStorage.getItem('sbt_llm_settings');
      if (!raw) raw = global.localStorage.getItem('sbt_llm_narrative_settings');
      var saved = JSON.parse(raw || '{}');
      for (var key in saved) value[key] = saved[key];
    } catch (e) {}
    return value;
  }
  function save(value) {
    var current = settings();
    for (var key in value) current[key] = value[key];
    global.localStorage.setItem('sbt_llm_settings', JSON.stringify(current));
    return current;
  }
  function request(system, prompt, override) {
    var cfg = override || settings();
    if (!cfg.enabled || !cfg.endpoint) return Promise.resolve(null);
    var nativeAPI = /\/api\/chat(?:[/?#]|$)/.test(cfg.endpoint);
    var body = { model: cfg.model, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], stream: false };
    if (nativeAPI) {
      body.format = 'json';
      body.options = { temperature: cfg.temperature, num_predict: cfg.maxTokens || 2200 };
    } else {
      body.temperature = cfg.temperature == null ? 0.8 : cfg.temperature;
      body.max_tokens = cfg.maxTokens || 2200;
    }
    var headers = { 'Content-Type': 'application/json' };
    if (cfg.apiKey) headers.Authorization = 'Bearer ' + cfg.apiKey;
    var token = generation;
    var controller = global.AbortController ? new global.AbortController() : null;
    if (controller) controllers.push(controller);
    calls++;
    return new Promise(function (resolve, reject) {
      var settled = false;
      var timer = global.setTimeout(function () {
        if (controller) controller.abort();
        finish(new Error('Tempo di risposta esaurito'));
      }, Math.max(100, Math.min(cfg.timeoutMs || cfg.timeout || 20000, 30000)));
      function finish(error, text) {
        if (settled) return;
        settled = true;
        global.clearTimeout(timer);
        var index = controllers.indexOf(controller);
        if (index >= 0) controllers.splice(index, 1);
        if (token !== generation) { resolve(null); return; }
        if (error) { lastError = error.message; reject(error); }
        else { successes++; resolve(text); }
      }
      var options = { method: 'POST', headers: headers, body: JSON.stringify(body) };
      if (controller) options.signal = controller.signal;
      Promise.resolve().then(function () { return global.fetch(cfg.endpoint, options); }).then(function (response) {
        if (!response.ok) throw new Error('Provider HTTP ' + response.status);
        return response.json();
      }).then(function (data) {
        var message = data.message || (data.choices && data.choices[0] && data.choices[0].message);
        var text = message && message.content;
        if (typeof text !== 'string' || !text.trim()) throw new Error('Risposta del modello vuota');
        finish(null, text);
      }).catch(function (error) { finish(error); });
    });
  }
  global.WolfLLM = {
    getSettings: settings, saveSettings: save, request: request,
    beginTurn: function () { calls = 0; successes = 0; lastError = ''; },
    cancel: function () {
      generation++;
      controllers.forEach(function (controller) { controller.abort(); });
      controllers = [];
    },
    status: function () { return { enabled: settings().enabled, calls: calls, successes: successes, error: lastError }; }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.WolfLLM;
}(typeof window !== 'undefined' ? window : global));
