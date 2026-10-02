/* =========================================================================
   EVEREST AIRES Y FRÍO — main.js
   JavaScript vanilla, sin dependencias. Los datos vienen de config.js
   (window.EVEREST_CONFIG).
   ========================================================================= */
(function () {
  "use strict";

  var C = window.EVEREST_CONFIG || {};
  var ROOT = document.body.getAttribute("data-root") || "";
  var digits = function (s) { return String(s || "").replace(/\D/g, ""); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- ¿El valor está definido? ("PENDIENTE" o vacío = no) ---------- */

  function has(value) {
    if (value === true) return true;
    if (value === false || value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    var s = String(value).trim();
    return s !== "" && s.toUpperCase() !== "PENDIENTE";
  }

  /* ---------- Promesas condicionadas y textos desde config ----------
     data-requires="MESES_GARANTIA"  → el elemento solo aparece si hay valor
                                       (varias claves separadas por espacio)
     data-fill="MESES_GARANTIA"      → escribe el valor dentro del elemento
     data-unless="MESES_GARANTIA"    → lo contrario: se oculta cuando hay valor
     data-fill-list="MARCAS"         → crea un <li> por cada elemento de la lista */

  function applyConfig() {
    document.querySelectorAll("[data-requires]").forEach(function (el) {
      var ok = el.getAttribute("data-requires").split(/\s+/).every(function (k) { return has(C[k]); });
      el.classList.toggle("is-on", ok);
    });
    // data-unless="CLAVE": texto alternativo que se oculta cuando alguna clave ya tiene valor
    document.querySelectorAll("[data-unless]").forEach(function (el) {
      var any = el.getAttribute("data-unless").split(/\s+/).some(function (k) { return has(C[k]); });
      el.classList.toggle("is-off", any);
    });
    document.querySelectorAll("[data-fill]").forEach(function (el) {
      var v = C[el.getAttribute("data-fill")];
      if (has(v)) el.textContent = v;
    });
    document.querySelectorAll("[data-fill-list]").forEach(function (el) {
      var list = C[el.getAttribute("data-fill-list")];
      if (!Array.isArray(list)) return;
      el.innerHTML = "";
      list.forEach(function (item) {
        var li = document.createElement("li");
        li.textContent = item;
        el.appendChild(li);
      });
    });
  }

  /* ---------- Enlaces de contacto (WhatsApp, llamada, correo) ----------
     En el HTML todos apuntan a contacto.html; aquí se cambian por
     wa.me / tel: / mailto: solo si el dato existe en config.js.          */

  function waLink(message) {
    var text = message || C.WHATSAPP_MENSAJE || "";
    return "https://wa.me/" + digits(C.WHATSAPP) + (text ? "?text=" + encodeURIComponent(text) : "");
  }

  function hydrateContactLinks() {
    var hasWa = has(C.WHATSAPP), hasTel = has(C.TELEFONO), hasMail = has(C.EMAIL);
    document.querySelectorAll("[data-wa]").forEach(function (el) {
      if (!hasWa) return;
      el.href = waLink(el.getAttribute("data-wa"));
      el.target = "_blank";
      el.rel = "noopener";
    });
    document.querySelectorAll("[data-tel]").forEach(function (el) {
      if (hasTel) el.href = "tel:+" + digits(C.TELEFONO);
    });
    document.querySelectorAll("[data-phone-display]").forEach(function (el) {
      el.textContent = has(C.TELEFONO_VISIBLE) ? C.TELEFONO_VISIBLE : (el.getAttribute("data-phone-display") || "Llamar");
    });
    document.querySelectorAll("[data-email]").forEach(function (el) {
      if (hasMail) el.href = "mailto:" + C.EMAIL;
    });
    document.querySelectorAll("[data-email-display]").forEach(function (el) {
      if (hasMail) el.textContent = C.EMAIL;
    });
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------- Google Ads (gtag) y medición de conversiones ---------- */

  function initGtag() {
    if (!has(C.GOOGLE_TAG_ID)) return;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(C.GOOGLE_TAG_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", C.GOOGLE_TAG_ID);
  }

  function track(eventName, conversionKey, extra) {
    window.dataLayer = window.dataLayer || [];
    var payload = { event: eventName };
    if (extra) Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; });
    window.dataLayer.push(payload);

    var label = C.CONVERSIONES && C.CONVERSIONES[conversionKey];
    if (has(C.GOOGLE_TAG_ID) && has(label) && typeof window.gtag === "function") {
      window.gtag("event", "conversion", { send_to: C.GOOGLE_TAG_ID + "/" + label });
    }
  }

  function initTracking() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest && e.target.closest("a");
      if (!link) return;
      var where = { link_location: link.getAttribute("data-track") || "" };
      if (link.hasAttribute("data-wa") && has(C.WHATSAPP)) track("whatsapp_click", "whatsapp", where);
      else if (link.hasAttribute("data-tel") && has(C.TELEFONO)) track("call_click", "llamada", where);
    });
    // La conversión del formulario se mide al llegar a la página de gracias
    if (document.body.getAttribute("data-page") === "gracias") track("form_submit", "formulario");
  }

  /* ---------- Header: estado al hacer scroll + menú móvil ---------- */

  function initHeader() {
    var header = document.querySelector("[data-header]");
    if (!header) return;

    var ticking = false;
    var update = function () {
      header.classList.toggle("is-scrolled", header.getBoundingClientRect().top <= 0 && window.scrollY > 8);
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();

    var toggle = header.querySelector("[data-nav-toggle]");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    var setOpen = function (open) {
      if (open) {
        // El panel arranca justo debajo del header, esté o no visible la barra superior
        var bottom = Math.max(0, header.getBoundingClientRect().bottom);
        nav.style.top = bottom + "px";
        nav.style.maxHeight = "calc(100dvh - " + bottom + "px)";
      }
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      document.body.classList.toggle("nav-open", open);
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", function (mq) {
      if (mq.matches) { setOpen(false); nav.style.top = ""; nav.style.maxHeight = ""; }
    });
  }

  /* ---------- Menú desplegable (Chillers, Cuartos fríos, Aires, Servicios) ----------
     Escritorio (≥901px): abre al pasar el mouse, con clic y con teclado.
       - Botón: Enter/Espacio abre o cierra, Flecha abajo abre y enfoca el primer enlace.
       - Panel: Flechas arriba/abajo, Inicio/Fin para moverse; Esc cierra y vuelve al botón.
       - Flechas izquierda/derecha en la barra: pasan al ítem vecino.
     En móvil y tablet (≤900px) el menú se reemplaza por la barra de pestañas inferior. */

  function initDropdowns() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-dropdown]"));
    if (!items.length) return;
    var desktop = window.matchMedia("(min-width: 901px)");
    var canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    var topLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-list > .nav-item > .nav-link"));

    var parts = function (item) {
      var btn = item.querySelector(".nav-sub-toggle");
      return { btn: btn, panel: document.getElementById(btn.getAttribute("aria-controls")) };
    };
    var linksOf = function (item) {
      return Array.prototype.slice.call(parts(item).panel.querySelectorAll("a"));
    };

    var setOpen = function (item, open, pinned) {
      var p = parts(item);
      item.classList.toggle("is-open", open);
      p.btn.setAttribute("aria-expanded", String(open));
      item._pinned = open && !!pinned;
      if (open && desktop.matches) {
        items.forEach(function (other) { if (other !== item) setOpen(other, false); });
      }
    };
    var closeAll = function () { items.forEach(function (it) { setOpen(it, false); }); };

    items.forEach(function (item) {
      var p = parts(item);
      var timer = null;

      p.btn.addEventListener("click", function () {
        var open = item.classList.contains("is-open");
        // Si se abrió al pasar el mouse, el clic lo deja fijo en lugar de cerrarlo
        if (open && desktop.matches && !item._pinned) { setOpen(item, true, true); return; }
        setOpen(item, !open, true);
      });

      item.addEventListener("mouseenter", function () {
        if (!desktop.matches || !canHover.matches) return;
        clearTimeout(timer);
        if (!item.classList.contains("is-open")) setOpen(item, true, false);
      });
      item.addEventListener("mouseleave", function () {
        if (!desktop.matches || !canHover.matches || item._pinned) return;
        timer = setTimeout(function () { setOpen(item, false); }, 160);
      });

      // Cerrar al salir con Tab del ítem (solo escritorio)
      item.addEventListener("focusout", function (e) {
        if (desktop.matches && !item.contains(e.relatedTarget)) setOpen(item, false);
      });

      p.btn.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(item, true, true);
          var first = linksOf(item)[0];
          if (first) first.focus();
        } else if (e.key === "Escape" && item.classList.contains("is-open")) {
          e.stopPropagation();
          setOpen(item, false);
        }
      });

      p.panel.addEventListener("keydown", function (e) {
        var links = linksOf(item);
        var i = links.indexOf(document.activeElement);
        var next = null;
        if (e.key === "ArrowDown") next = links[(i + 1) % links.length];
        else if (e.key === "ArrowUp") next = links[(i - 1 + links.length) % links.length];
        else if (e.key === "Home") next = links[0];
        else if (e.key === "End") next = links[links.length - 1];
        else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          setOpen(item, false);
          p.btn.focus();
          return;
        }
        if (next) { e.preventDefault(); next.focus(); }
      });
    });

    // Flechas izquierda/derecha entre los ítems de la barra (escritorio)
    topLinks.forEach(function (link, i) {
      var move = function (e) {
        if (!desktop.matches) return;
        var to = null;
        if (e.key === "ArrowRight") to = topLinks[(i + 1) % topLinks.length];
        else if (e.key === "ArrowLeft") to = topLinks[(i - 1 + topLinks.length) % topLinks.length];
        if (to) { e.preventDefault(); to.focus(); }
      };
      link.addEventListener("keydown", move);
      var btn = link.parentNode.querySelector(".nav-sub-toggle");
      if (btn) btn.addEventListener("keydown", move);
    });

    // Al elegir un equipo (ancla en la misma página), cerrar el desplegable
    items.forEach(function (item) {
      parts(item).panel.addEventListener("click", function (e) { if (e.target.closest("a")) closeAll(); });
    });

    // Clic fuera o Esc global cierran los desplegables de escritorio
    document.addEventListener("click", function (e) {
      if (desktop.matches && !e.target.closest("[data-dropdown]")) closeAll();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && desktop.matches) closeAll();
    });
    desktop.addEventListener("change", closeAll);

    // En móvil, abre de entrada el acordeón de la sección actual
    items.forEach(function (item) {
      if (!desktop.matches && item.classList.contains("is-current")) setOpen(item, true);
    });
  }

  /* ---------- Guía / filtro de equipos (páginas de línea) ----------
     <div data-filter-group="x"> con botones [data-filter="clave" | "all"]
     <div data-filter-target="x"> con tarjetas [data-seg="clave1 clave2"]
     Si se llega a una tarjeta por ancla (ej. desde el menú) y está filtrada,
     el filtro vuelve a "Todos" para que se vea.                                 */

  function initFilters() {
    document.querySelectorAll("[data-filter-group]").forEach(function (group) {
      var name = group.getAttribute("data-filter-group");
      var grid = document.querySelector('[data-filter-target="' + name + '"]');
      var status = document.querySelector('[data-filter-status="' + name + '"]');
      if (!grid) return;
      var buttons = Array.prototype.slice.call(group.querySelectorAll("[data-filter]"));
      var cards = Array.prototype.slice.call(grid.children);

      var apply = function (key) {
        var shown = 0;
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === key)); });
        cards.forEach(function (card) {
          var segs = (card.getAttribute("data-seg") || "").split(/\s+/);
          var visible = key === "all" || segs.indexOf(key) !== -1;
          card.hidden = !visible;
          if (visible) {
            shown++;
            card.classList.add("is-visible");
            if (!reduceMotion && key !== "all") {
              card.classList.remove("is-entering");
              void card.offsetWidth;
              card.classList.add("is-entering");
            }
          }
        });
        if (status) status.textContent = "Mostrando " + shown + (shown === 1 ? " equipo" : " equipos");
      };

      buttons.forEach(function (b) {
        b.addEventListener("click", function () { apply(b.getAttribute("data-filter")); });
      });

      var revealTarget = function () {
        var id = decodeURIComponent(location.hash.slice(1));
        var target = id && document.getElementById(id);
        if (!target || !grid.contains(target)) return;
        var card = target.closest(".pcard");
        if (card && card.hidden) {
          apply("all");
          card.scrollIntoView({ block: "start" });
        }
      };
      revealTarget();
      window.addEventListener("hashchange", revealTarget);
    });
  }

  /* ---------- Unidad de capacidad (TR / BTU/h / kW) en las tarjetas de chillers ---------- */

  function initUnits() {
    var labels = { tr: "TR", btu: "BTU/h", kw: "kW" };
    document.querySelectorAll(".unit-toggle").forEach(function (toggle) {
      var buttons = Array.prototype.slice.call(toggle.querySelectorAll("[data-unit]"));
      buttons.forEach(function (b) {
        b.addEventListener("click", function () {
          var unit = b.getAttribute("data-unit");
          buttons.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          document.querySelectorAll(".pcard-cap[data-" + unit + "]").forEach(function (cap) {
            cap.querySelector(".pcard-num").textContent = cap.getAttribute("data-" + unit);
            cap.querySelector(".pcard-unit").textContent = labels[unit];
          });
        });
      });
    });
  }

  /* ---------- Aparición suave al hacer scroll (una sola vez) ---------- */

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    document.querySelectorAll("[data-stagger]").forEach(function (group) {
      group.querySelectorAll(":scope > .reveal").forEach(function (el, i) {
        el.style.setProperty("--delay", Math.min(i * 50, 300) + "ms");
      });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -60px 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Formularios ---------- */

  var validators = {
    nombre: function (v) { return v.trim().length >= 2 || "Escribe tu nombre."; },
    telefono: function (v) {
      var d = digits(v);
      if (d.indexOf("57") === 0 && d.length === 12) d = d.slice(2);
      return d.length === 10 || "Escribe un número de 10 dígitos (celular o fijo con 601).";
    },
    correo: function (v, field) {
      if (!v.trim()) return field.required ? "Escribe tu correo." : true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Revisa el formato del correo.";
    },
    servicio: function (v) { return !!v || "Elige un servicio."; },
    acepta: function (v, field) { return field.checked || "Debes aceptar el tratamiento de datos para continuar."; }
  };

  function validateField(field) {
    var rule = validators[field.name];
    if (!rule) return true;
    var result = rule(field.value, field);
    var ok = result === true;
    var wrap = field.closest(".field");
    var msg = wrap && wrap.querySelector(".field-error");
    field.setAttribute("aria-invalid", ok ? "false" : "true");
    if (wrap) wrap.classList.toggle("has-error", !ok);
    if (msg) msg.textContent = ok ? "" : result;
    return ok;
  }

  var LABELS = { nombre: "Nombre", telefono: "Teléfono", correo: "Correo", servicio: "Servicio",
                 tipo_equipo: "Tipo de equipo", zona: "Zona", mensaje: "Mensaje" };

  function buildMessage(data) {
    var lines = ["Hola Everest, les escribo desde la página web. Quiero una cotización.", ""];
    Object.keys(LABELS).forEach(function (k) {
      if (data[k]) lines.push("*" + LABELS[k] + ":* " + data[k]);
    });
    return lines.join("\n");
  }

  function showStatus(form, html, isError) {
    var status = form.querySelector("[data-form-status]");
    if (!status) return;
    status.classList.toggle("is-error", !!isError);
    status.innerHTML = html;
    status.hidden = false;
    status.focus();
  }

  function initForms() {
    document.querySelectorAll("[data-lead-form]").forEach(function (form) {
      var hint = form.querySelector("[data-form-hint]");
      if (hint && !has(C.FORM_ENDPOINT) && has(C.WHATSAPP)) {
        hint.textContent = "Al enviar se abrirá WhatsApp con tus datos listos. Solo toca “Enviar”.";
      }

      form.querySelectorAll("input, select, textarea").forEach(function (field) {
        field.addEventListener("blur", function () {
          if (field.type !== "checkbox" && (field.value || field.getAttribute("aria-invalid") === "true")) validateField(field);
        });
        field.addEventListener("input", function () {
          if (field.getAttribute("aria-invalid") === "true") validateField(field);
        });
        field.addEventListener("change", function () {
          if (field.tagName === "SELECT" || field.type === "checkbox") validateField(field);
        });
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();

        var trap = form.querySelector("[name='sitio_web']");
        if (trap && trap.value) return; // honeypot anti-spam

        var fields = Array.prototype.slice.call(form.querySelectorAll("input, select, textarea"));
        var firstInvalid = null;
        fields.forEach(function (f) {
          if (!validateField(f) && !firstInvalid) firstInvalid = f;
        });
        if (firstInvalid) { firstInvalid.focus(); return; }

        var data = {};
        new FormData(form).forEach(function (value, key) {
          if (key !== "sitio_web") data[key] = String(value).trim();
        });
        var gracias = ROOT + "gracias.html";
        var submit = form.querySelector("[type='submit']");

        // 1) Endpoint configurado (Formspree o enviar.php) → POST y luego gracias.html
        if (has(C.FORM_ENDPOINT)) {
          var endpoint = /^https?:/.test(C.FORM_ENDPOINT) ? C.FORM_ENDPOINT : ROOT + C.FORM_ENDPOINT;
          if (submit) { submit.disabled = true; submit.classList.add("is-loading"); }
          fetch(endpoint, {
            method: "POST",
            headers: { "Accept": "application/json" },
            body: new FormData(form)
          }).then(function (res) {
            if (!res.ok) throw new Error("HTTP " + res.status);
            window.location.href = gracias;
          }).catch(function () {
            if (submit) { submit.disabled = false; submit.classList.remove("is-loading"); }
            showStatus(form, has(C.WHATSAPP)
              ? "No pudimos enviar el formulario. <a href=\"" + waLink(buildMessage(data)) + "\" target=\"_blank\" rel=\"noopener\">Envíanos tu solicitud por WhatsApp</a>."
              : "No pudimos enviar el formulario. Intenta de nuevo en unos minutos.", true);
          });
          return;
        }

        // 2) Sin endpoint → WhatsApp con los datos escritos, y gracias.html
        if (has(C.WHATSAPP)) {
          var win = window.open(waLink(buildMessage(data)), "_blank", "noopener");
          if (!win) { window.location.href = waLink(buildMessage(data)); return; }
          window.location.href = gracias;
          return;
        }

        // 3) Ni endpoint ni WhatsApp configurados
        showStatus(form, "El formulario todavía no está activo. Configura <code>FORM_ENDPOINT</code> o <code>WHATSAPP</code> en <code>assets/js/config.js</code>.", true);
      });
    });
  }

  /* ---------- Datos estructurados LocalBusiness (Schema.org) ---------- */

  function injectSchema() {
    var site = (C.SITE_URL || "").replace(/\/$/, "");
    var schema = {
      "@context": "https://schema.org",
      "@type": "HVACBusiness",
      "@id": site + "/#empresa",
      "name": C.NOMBRE_EMPRESA || "Everest Aires y Frío",
      "description": "Instalación y servicio técnico de aire acondicionado, chillers y cuartos fríos en " + (C.CIUDAD || "Bogotá") + ".",
      "url": site + "/",
      "logo": site + "/assets/img/logo.png",
      "image": site + "/assets/img/og-image.jpg",
      "address": { "@type": "PostalAddress", "addressLocality": C.CIUDAD || "Bogotá", "addressCountry": "CO" },
      "areaServed": { "@type": "City", "name": C.CIUDAD || "Bogotá" },
      "knowsAbout": ["Aire acondicionado", "Chillers", "Cuartos fríos", "Mantenimiento preventivo", "Reparación de aire acondicionado"]
    };
    if (has(C.TELEFONO)) schema.telephone = "+" + digits(C.TELEFONO);
    if (has(C.EMAIL)) schema.email = C.EMAIL;

    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(schema);
    document.head.appendChild(s);
  }

  /* ---------- Inicio ---------- */

  applyConfig();
  hydrateContactLinks();
  initGtag();
  initTracking();
  initHeader();
  initDropdowns();
  initFilters();
  initUnits();
  initReveal();
  initForms();
  injectSchema();
})();
