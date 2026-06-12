/**
 * Plausible Analytics — rastreamento de conversões das LPs (index.html e lp-form.html).
 *
 * Eventos:
 *   Lead      = clique em qualquer botão/link de WhatsApp
 *   Formulario = envio de formulário válido
 *   Conversao  = tela de confirmação/sucesso exibida
 *   PageView   = automático (script padrão do Plausible)
 *
 * Este arquivo NÃO altera o visual nem o comportamento existente: apenas observa
 * cliques de WhatsApp e expõe a função global window.trackEvent() para os fluxos
 * de formulário chamarem. O WhatsApp continua abrindo normalmente.
 */
(function () {
  "use strict";

  // Fila do Plausible: garante que eventos disparados antes do script do Plausible
  // terminar de carregar (ele é `defer`) sejam enfileirados e enviados depois.
  window.plausible =
    window.plausible ||
    function () {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };

  // Ambiente de desenvolvimento (localhost / arquivo local) — só então logamos.
  var isDev =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.protocol === "file:";

  // Captura as 5 UTMs da URL (string vazia quando ausentes).
  function getUTMParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_content: params.get("utm_content") || "",
      utm_term: params.get("utm_term") || "",
    };
  }

  // Função global reutilizável: dispara um evento no Plausible já com as UTMs anexadas.
  function trackEvent(eventName, props) {
    var allProps = Object.assign({}, getUTMParams(), props || {});
    if (isDev) console.log("Plausible Event:", eventName, allProps);
    if (typeof window.plausible === "function") {
      window.plausible(eventName, { props: allProps });
    }
  }

  // Disponibiliza para os scripts das páginas.
  window.trackEvent = trackEvent;
  window.getUTMParams = getUTMParams;

  // ===== Lead: qualquer clique em botão/link de WhatsApp =====
  // Listener delegado no document (fase de captura). Não interfere nos handlers
  // existentes — o WhatsApp continua abrindo normalmente — e dispara exatamente
  // uma vez por clique (um clique = uma chamada).
  var WHATSAPP_SELECTOR =
    'a[href*="wa.me"], a[href*="api.whatsapp"], a[href*="web.whatsapp"], .js-whatsapp';

  document.addEventListener(
    "click",
    function (event) {
      var trigger = event.target.closest && event.target.closest(WHATSAPP_SELECTOR);
      if (!trigger) return;
      trackEvent("Lead");
    },
    true
  );
})();
