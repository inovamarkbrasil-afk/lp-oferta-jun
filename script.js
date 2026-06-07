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

function registerClick() {
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