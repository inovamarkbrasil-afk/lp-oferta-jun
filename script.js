const whatsappNumber = "5547991795018";

const whatsappMessage = encodeURIComponent(
  "Olá, Rafael! Vim da oferta de Junho e quero gerar mais leads para minha empresa."
);

const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

function getUTMParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
  };
}

function hasContactEventAlreadyFired() {
  return sessionStorage.getItem("meta_contact_fired") === "true";
}

function markContactEventAsFired() {
  sessionStorage.setItem("meta_contact_fired", "true");
}

const VALIDATE_ENDPOINT =
  "https://lading-pages-backend-lp-oferta-junho.yhtsge.easypanel.host/api/validate-lead";

const N8N_WEBHOOK_URL =
  "https://n8n-n8n.yhtsge.easypanel.host/webhook/captura-lead";

function launchConfetti() {
  const colors = ["#7800FF", "#25d366", "#ffd23f", "#ff5b8a", "#00c2ff"];
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
    piece.style.animationDelay = Math.random() * 0.25 + "s";
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 3200);
  }
}

function sendLeadToWebhook(lead) {
  const utms = getUTMParams();

  return fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...lead,
      origem: "lp-oferta-junho",
      utm_source: utms.utm_source,
      utm_medium: utms.utm_medium,
      utm_campaign: utms.utm_campaign,
      enviado_em: new Date().toISOString(),
    }),
  }).catch(() => {});
}

function registerClick(lead = {}) {
  const utms = getUTMParams();

  fetch("https://api.inovamarkbrasil.com/api/leads/click", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "inovamark-ops-2026",
    },
    body: JSON.stringify({
      utm_source: utms.utm_source,
      utm_medium: utms.utm_medium,
      utm_campaign: utms.utm_campaign,
      origem: "lp-oferta-junho",
      ...lead,
    }),
  }).catch(() => {});
}

function trackContactEventOnce() {
  if (hasContactEventAlreadyFired()) return;

  if (typeof fbq === "function") {
    fbq("track", "Contact");
  }

  registerClick();

  markContactEventAsFired();
}

function openWhatsapp(event) {
  if (event) {
    event.preventDefault();
  }

  trackContactEventOnce();

  setTimeout(() => {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    // Plausible: WhatsApp aberto pelo botão de contato direto (topo).
    if (typeof window.trackEventOnce === "function") {
      window.trackEventOnce("WhatsApp", { origem: "botao_topo" });
    }
  }, 200);
}

document.addEventListener("DOMContentLoaded", () => {
  const whatsappButtons = document.querySelectorAll(".js-whatsapp");

  whatsappButtons.forEach((button) => {
    button.addEventListener("click", openWhatsapp);
  });

  const printCards = document.querySelectorAll(".print-card img");
  const modal = document.getElementById("imageModal");
  const modalImage = document.getElementById("modalImage");
  const modalClose = document.getElementById("modalClose");

  if (modal && modalImage && modalClose) {
    printCards.forEach((image) => {
      image.addEventListener("click", () => {
        modalImage.src = image.src;
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
      });
    });

    function closeModal() {
      modal.classList.remove("active");
      modalImage.src = "";
      document.body.style.overflow = "";
    }

    modalClose.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("active")) {
        closeModal();
      }
    });
  }

  initCountdown();
  initLeadForm();
});

function initCountdown() {
  const display = document.getElementById("countdown");
  if (!display) return;

  const DURATION = 5 * 24 * 60 * 60 * 1000; // 5 dias em ms
  const key = "oferta_expira_em";

  function getExpiry() {
    let expira = localStorage.getItem(key);

    // Sem registro OU já expirou: reinicia 5 dias a partir de agora.
    if (!expira || Date.now() > parseInt(expira, 10)) {
      expira = Date.now() + DURATION;
      localStorage.setItem(key, expira);
    }

    return parseInt(expira, 10);
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function render() {
    let diff = getExpiry() - Date.now();
    if (diff < 0) diff = 0;

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    display.textContent = `${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }

  render();
  setInterval(render, 1000);
}

function initLeadForm() {
  const modal = document.getElementById("leadModal");
  const form = document.getElementById("leadForm");
  if (!modal || !form) return;

  const openButtons = document.querySelectorAll(".js-open-form");
  const closeButton = document.getElementById("leadClose");
  const progressBar = document.getElementById("leadProgressBar");
  const aiFeedback = document.getElementById("leadAiFeedback");
  const steps = Array.from(form.querySelectorAll(".lead-step"));

  let current = 0;
  let lastFocused = null;
  let validating = false;

  function setAiFeedback(type, html) {
    if (!aiFeedback) return;
    aiFeedback.className = `lead-ai-feedback is-visible ${type}`;
    aiFeedback.innerHTML = html;
  }

  function clearAiFeedback() {
    if (!aiFeedback) return;
    aiFeedback.className = "lead-ai-feedback";
    aiFeedback.innerHTML = "";
  }

  // Valida o tipo de negócio com a IA antes de avançar da etapa 1
  async function validateBusinessWithAI(button) {
    const input = steps[0].querySelector(".lead-input");
    const tipo = input.value.trim();

    if (tipo.length < 2) {
      steps[0].classList.add("has-error");
      return;
    }
    if (validating) return;
    validating = true;
    steps[0].classList.remove("has-error");

    // Mantém o input focado (teclado aberto) durante a validação — por isso NÃO
    // usamos input.disabled, que tiraria o foco e fecharia o teclado no mobile.
    button.disabled = true;
    setAiFeedback(
      "loading",
      `<span class="lead-spinner" aria-hidden="true"></span><span>Verificando se atendemos esse tipo de negócio, um segundo...</span>`
    );

    const finish = () => {
      validating = false;
      button.disabled = false;
    };

    try {
      const res = await fetch(VALIDATE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      });

      if (res.status === 429) {
        setAiFeedback("error", "Muitas tentativas seguidas. Aguarde alguns segundos e tente de novo.");
        finish();
        return;
      }

      const data = await res.json();

      if (data.aprovado) {
        // Plausible: IA aprovou o tipo de negócio.
        if (typeof window.trackEventOnce === "function") {
          window.trackEventOnce("NegocioQualificado", {
            tipo_negocio: tipo,
            status_ia: "qualificado",
          });
        }
        launchConfetti();
        setAiFeedback("success", `<span>🎉</span><span>${data.mensagem || "Eu atendo seu negócio! Vamos pra cima! 🎉"}</span>`);
        setTimeout(() => {
          clearAiFeedback();
          finish();
          showStep(1);
        }, 1400);
      } else {
        // Plausible: IA reprovou o tipo de negócio.
        if (typeof window.trackEventOnce === "function") {
          window.trackEventOnce("NegocioDesqualificado", {
            tipo_negocio: tipo,
            status_ia: "desqualificado",
          });
        }
        setAiFeedback("error", `<span>⚠️</span><span>${data.mensagem || "Esse setor não é a nossa especialidade no momento."}</span>`);
        finish();
      }
    } catch (err) {
      setAiFeedback("error", "Não conseguimos verificar agora. Tente novamente em instantes.");
      finish();
    }
  }

  function showStep(index) {
    current = index;

    steps.forEach((step, i) => {
      step.classList.toggle("is-active", i === index);
      step.classList.remove("has-error");
    });

    progressBar.style.width = `${((index + 1) / steps.length) * 100}%`;

    // Foco SÍNCRONO: no mobile, focar o campo enquanto o teclado já está aberto
    // (e dentro do gesto de toque) mantém o teclado ativo — o usuário não precisa
    // tocar no campo de novo a cada etapa.
    const input = steps[index].querySelector(".lead-input");
    if (input) input.focus();
  }

  function openModal(event) {
    if (event) event.preventDefault();

    // Plausible: usuário clicou em "Quero montar minha estrutura" e abriu o formulário.
    if (typeof window.trackEventOnce === "function") {
      window.trackEventOnce("FormularioIniciado");
    }

    lastFocused = document.activeElement;
    form.reset();
    clearAiFeedback();
    // Ativa o modal ANTES de focar — o campo precisa estar visível para o foco
    // (e o teclado) funcionar. showStep(0) por último foca já dentro do gesto do clique.
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    showStep(0);
    syncViewport();
  }

  function closeModal() {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    clearViewportSync();
    if (lastFocused) lastFocused.focus();
  }

  // Mantém o modal encaixado exatamente na área visível acima do teclado (mobile).
  // Quando o teclado abre, a visualViewport encolhe; ajustamos topo/altura do
  // overlay para essa área, e ele rola internamente caso o conteúdo não caiba.
  const viewport = window.visualViewport;

  function syncViewport() {
    if (!viewport || !modal.classList.contains("active")) return;
    // Só encaixa na área visível quando o teclado está ABERTO. Com ele fechado,
    // mantém o overlay cobrindo a tela inteira (senão sobra faixa mostrando a LP).
    const keyboardOpen = window.innerHeight - viewport.height > 120;
    if (keyboardOpen) {
      modal.style.top = viewport.offsetTop + "px";
      modal.style.bottom = "auto";
      modal.style.height = viewport.height + "px";
    } else {
      clearViewportSync();
    }
  }

  function clearViewportSync() {
    modal.style.top = "";
    modal.style.bottom = "";
    modal.style.height = "";
  }

  if (viewport) {
    viewport.addEventListener("resize", syncViewport);
    viewport.addEventListener("scroll", syncViewport);
  }

  function validateStep(index) {
    const step = steps[index];
    const input = step.querySelector(".lead-input");
    const value = input.value.trim();
    let valid = value.length >= 2;

    if (input.name === "phone") {
      valid = value.replace(/\D/g, "").length >= 10;
    }

    step.classList.toggle("has-error", !valid);
    return valid;
  }

  function formatPhone(value) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : "";
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function buildWhatsappUrl(data) {
    const message = encodeURIComponent(
      `Olá, Rafael! Quero uma estrutura completa para o meu negócio\n\n` +
        `• Negócio: ${data.business}\n` +
        `• Nome: ${data.name}\n` +
        `• WhatsApp: ${data.phone}`
    );
    return `https://wa.me/${whatsappNumber}?text=${message}`;
  }

  openButtons.forEach((button) => button.addEventListener("click", openModal));
  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  // Mobile: tocar num botão com o teclado aberto não deve roubar o foco do input.
  // Sem isso, o input perde o foco no 1º toque, o teclado fecha, a página se
  // reposiciona e o clique "erra" o botão (exige tocar 2x). O preventDefault no
  // mousedown mantém o foco/teclado estáveis; o clique continua disparando normal.
  [...form.querySelectorAll("button"), closeButton].forEach((button) => {
    if (button) {
      button.addEventListener("mousedown", (event) => event.preventDefault());
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("active")) {
      closeModal();
    }
  });

  form.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => {
      // Etapa do tipo de negócio: valida com a IA antes de avançar
      if (current === 0) {
        validateBusinessWithAI(button);
        return;
      }
      if (validateStep(current)) showStep(current + 1);
    });
  });

  form.querySelectorAll("[data-back]").forEach((button) => {
    button.addEventListener("click", () => showStep(current - 1));
  });

  steps.forEach((step) => {
    const input = step.querySelector(".lead-input");

    // Ao focar, garante o campo visível acima do teclado.
    input.addEventListener("focus", () => {
      setTimeout(() => {
        syncViewport();
        input.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 150);
    });

    input.addEventListener("input", () => {
      if (input.name === "phone") {
        input.value = formatPhone(input.value);
      }
      if (input.name === "business") {
        clearAiFeedback();
      }
      step.classList.remove("has-error");
    });

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      if (input.name === "phone") {
        form.requestSubmit();
      } else if (input.name === "business") {
        validateBusinessWithAI(steps[0].querySelector("[data-next]"));
      } else if (validateStep(current)) {
        showStep(current + 1);
      }
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateStep(current)) return;

    const data = {
      business: form.elements["business"].value.trim(),
      name: form.elements["name"].value.trim(),
      phone: form.elements["phone"].value.trim(),
    };

    if (typeof fbq === "function") {
      fbq("track", "Lead");
    }

    // Plausible: etapa 3 concluída (WhatsApp informado) — lead efetivo.
    if (typeof window.trackEventOnce === "function") {
      window.trackEventOnce("Lead", { tipo_negocio: data.business });
    }

    registerClick({
      tipo_negocio: data.business,
      nome: data.name,
      telefone: data.phone,
    });

    sendLeadToWebhook({
      tipo_negocio: data.business,
      nome: data.name,
      telefone: data.phone,
    });

    const submitButton = form.querySelector(".lead-submit");
    if (submitButton) submitButton.disabled = true;

    setTimeout(() => {
      window.open(buildWhatsappUrl(data), "_blank", "noopener,noreferrer");

      // Plausible: WhatsApp aberto.
      if (typeof window.trackEventOnce === "function") {
        window.trackEventOnce("WhatsApp", { origem: "formulario" });
      }

      closeModal();
      if (submitButton) submitButton.disabled = false;
    }, 200);
  });
}