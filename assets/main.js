/* Buurtdossier — main behaviour
   - Live counter (signup count) via Cloudflare Worker, with graceful fallback
   - Postcode/huisnummer signup form
   - Personal profile form (localStorage only)
   - Delete registration / clear local data
   - Today date stamp in masthead
*/
(function () {
  "use strict";

  /* -----------------------------------------------------------
     Configuration
     Update API_BASE after deploying the Cloudflare Worker.
     Leave empty to run in "offline" mode (counter shows "—").
     ----------------------------------------------------------- */
  var CONFIG = window.BuurtConfig || {};
  var API_BASE = (CONFIG.apiBase || "").replace(/\/+$/, "");

  /* -----------------------------------------------------------
     Helpers
     ----------------------------------------------------------- */
  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }

  function setStatus(el, message, type) {
    if (!el) return;
    el.textContent = message || "";
    el.classList.remove("success", "error");
    if (type) el.classList.add(type);
  }

  function fmtDate(d) {
    var months = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
    return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
  }

  /* -----------------------------------------------------------
     Date stamp
     ----------------------------------------------------------- */
  function renderToday() {
    var el = $("#today");
    if (!el) return;
    el.textContent = fmtDate(new Date());
  }

  /* -----------------------------------------------------------
     Counter
     ----------------------------------------------------------- */
  function animateCounter(target, value) {
    if (!target) return;
    var start = 0;
    var duration = 900;
    var startTime = performance.now();
    function tick(now) {
      var t = Math.min((now - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      target.textContent = Math.round(start + (value - start) * eased).toLocaleString("nl-NL");
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function loadCounter() {
    var el = $("#counter");
    var sub = $("#counter-sub");
    if (!el) return;

    if (!API_BASE) {
      el.textContent = "—";
      if (sub) sub.textContent = "Backend nog niet geconfigureerd.";
      return;
    }

    fetch(API_BASE + "/api/count", { headers: { "Accept": "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (data) {
        var n = (data && typeof data.count === "number") ? data.count : 0;
        animateCounter(el, n);
        if (sub) sub.textContent = "Tellen tot Q-Park luistert.";
      })
      .catch(function () {
        el.textContent = "—";
        if (sub) sub.textContent = "Teller tijdelijk niet bereikbaar.";
      });
  }

  /* -----------------------------------------------------------
     Postcode validation
     ----------------------------------------------------------- */
  function normalisePostcode(input) {
    if (!input) return "";
    var s = String(input).toUpperCase().replace(/\s+/g, "");
    var m = s.match(/^(\d{4})([A-Z]{2})$/);
    if (!m) return "";
    return m[1] + " " + m[2];
  }

  function normaliseHuisnummer(input) {
    if (!input) return "";
    return String(input).trim().toUpperCase().replace(/\s+/g, " ").slice(0, 10);
  }

  /* -----------------------------------------------------------
     Signup form
     ----------------------------------------------------------- */
  function wireSignup() {
    var form = $("#signup-form");
    if (!form) return;
    var status = $("#signup-status");
    var submit = $("#signup-submit");

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var postcode = normalisePostcode($("#postcode").value);
      var huisnummer = normaliseHuisnummer($("#huisnummer").value);

      if (!postcode) {
        setStatus(status, "Postcode klopt nog niet. Gebruik vier cijfers en twee letters, bijv. 3072 AS.", "error");
        return;
      }
      if (!huisnummer) {
        setStatus(status, "Vul je huisnummer in.", "error");
        return;
      }

      if (!API_BASE) {
        setStatus(status, "Aansluiten kan zodra de beheerder de backend heeft geactiveerd.", "error");
        return;
      }

      submit.disabled = true;
      setStatus(status, "Bezig met aansluiten…");

      fetch(API_BASE + "/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ postcode: postcode, huisnummer: huisnummer })
      })
        .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, status: r.status, data: data }; }); })
        .then(function (res) {
          submit.disabled = false;
          if (!res.ok) {
            var msg = (res.data && res.data.error) || "Iets ging mis bij het aanmelden.";
            setStatus(status, msg, "error");
            return;
          }
          if (res.data && res.data.token) BuurtStorage.setDeleteToken(res.data.token);
          var n = res.data && typeof res.data.count === "number" ? res.data.count : null;
          setStatus(status, "Aangesloten. Dank je. Je bent één van " + (n != null ? n : "velen") + " adressen.", "success");
          var counterEl = $("#counter");
          if (counterEl && n != null) animateCounter(counterEl, n);
          form.reset();
        })
        .catch(function () {
          submit.disabled = false;
          setStatus(status, "Geen verbinding met de server. Probeer het later opnieuw.", "error");
        });
    });
  }

  /* -----------------------------------------------------------
     Profile form (localStorage only)
     ----------------------------------------------------------- */
  function wireProfile() {
    var form = $("#profile-form");
    if (!form) return;
    var status = $("#profile-status");
    var clearBtn = $("#profile-clear");

    var profile = BuurtStorage.getProfile();
    Object.keys(profile).forEach(function (key) {
      var input = form.elements[key];
      if (input && typeof profile[key] === "string") input.value = profile[key];
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var data = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (el.name && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
          data[el.name] = el.value.trim();
        }
      });
      if (data.postcode) data.postcode = normalisePostcode(data.postcode) || data.postcode;
      BuurtStorage.setProfile(data);
      setStatus(status, "Bewaard in deze browser. Niets verlaat je apparaat.", "success");
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        BuurtStorage.clearProfile();
        form.reset();
        var p = form.elements["plaats"]; if (p) p.value = "Rotterdam";
        setStatus(status, "Gegevens uit deze browser gewist.", "success");
      });
    }
  }

  /* -----------------------------------------------------------
     Privacy page: delete registration / clear local
     ----------------------------------------------------------- */
  function wirePrivacy() {
    var tokenEl = $("#delete-token-display");
    var deleteBtn = $("#delete-registration");
    var deleteStatus = $("#delete-status");
    var clearLocal = $("#clear-local");
    var clearStatus = $("#clear-status");

    if (tokenEl) {
      var token = BuurtStorage.getDeleteToken();
      tokenEl.textContent = token ? token : "(geen aansluiting in deze browser gevonden)";
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", function () {
        var token = BuurtStorage.getDeleteToken();
        if (!token) {
          setStatus(deleteStatus, "Er staat in deze browser geen verwijdertoken. Sluit je niet eerder aan met deze browser, neem dan contact op via het e-mailadres in punt 06.", "error");
          return;
        }
        if (!API_BASE) {
          setStatus(deleteStatus, "Backend nog niet geconfigureerd. Neem contact op met de beheerder.", "error");
          return;
        }
        deleteBtn.disabled = true;
        setStatus(deleteStatus, "Bezig met verwijderen…");
        fetch(API_BASE + "/api/register/" + encodeURIComponent(token), { method: "DELETE" })
          .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
          .then(function (res) {
            deleteBtn.disabled = false;
            if (!res.ok) {
              setStatus(deleteStatus, (res.data && res.data.error) || "Verwijderen mislukt.", "error");
              return;
            }
            BuurtStorage.clearDeleteToken();
            if (tokenEl) tokenEl.textContent = "(verwijderd)";
            setStatus(deleteStatus, "Je aansluiting is verwijderd van onze server.", "success");
          })
          .catch(function () {
            deleteBtn.disabled = false;
            setStatus(deleteStatus, "Geen verbinding met de server. Probeer het later opnieuw.", "error");
          });
      });
    }

    if (clearLocal) {
      clearLocal.addEventListener("click", function () {
        BuurtStorage.clearAll();
        setStatus(clearStatus, "Alle gegevens uit deze browser zijn gewist.", "success");
        if (tokenEl) tokenEl.textContent = "(geen aansluiting in deze browser gevonden)";
      });
    }
  }

  /* -----------------------------------------------------------
     Boot
     ----------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderToday();
    loadCounter();
    wireSignup();
    wireProfile();
    wirePrivacy();
  });
})();
