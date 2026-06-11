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

const N8N_WEBHOOK_URL =
  "https://n8n-n8n.yhtsge.easypanel.host/webhook-test/captura-lead";

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
  const steps = Array.from(form.querySelectorAll(".lead-step"));

  let current = 0;
  let lastFocused = null;

  function showStep(index) {
    current = index;

    steps.forEach((step, i) => {
      step.classList.toggle("is-active", i === index);
      step.classList.remove("has-error");
    });

    progressBar.style.width = `${((index + 1) / steps.length) * 100}%`;

    const input = steps[index].querySelector(".lead-input");
    if (input) {
      setTimeout(() => input.focus(), 60);
    }
  }

  function openModal(event) {
    if (event) event.preventDefault();
    lastFocused = document.activeElement;
    form.reset();
    showStep(0);
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
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

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("active")) {
      closeModal();
    }
  });

  form.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => {
      if (validateStep(current)) showStep(current + 1);
    });
  });

  form.querySelectorAll("[data-back]").forEach((button) => {
    button.addEventListener("click", () => showStep(current - 1));
  });

  steps.forEach((step) => {
    const input = step.querySelector(".lead-input");

    input.addEventListener("input", () => {
      if (input.name === "phone") {
        input.value = formatPhone(input.value);
      }
      step.classList.remove("has-error");
    });

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      if (input.name === "phone") {
        form.requestSubmit();
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
      closeModal();
      if (submitButton) submitButton.disabled = false;
    }, 200);
  });
}