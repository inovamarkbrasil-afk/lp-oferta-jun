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

  // Mesma coisa, mas garante no máximo um disparo por sessão para cada evento —
  // evita inflar os números se o usuário repetir uma ação dentro do mesmo fluxo.
  function trackEventOnce(eventName, props) {
    var key = "plausible_evt_" + eventName;
    try {
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
    } catch (e) {
      // sessionStorage indisponível (ex.: modo privado antigo) — dispara mesmo assim.
    }
    trackEvent(eventName, props);
  }

  // Disponibiliza para os scripts das páginas.
  window.trackEvent = trackEvent;
  window.trackEventOnce = trackEventOnce;
  window.getUTMParams = getUTMParams;
})();
