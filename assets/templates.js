/* Q-Park Fenix overlast — email template rendering
   Fills the letter pages with profile data from localStorage,
   wires the mailto / copy / print buttons.
*/
(function (global) {
  "use strict";

  function $(s, ctx) { return (ctx || document).querySelector(s); }

  function profile() { return BuurtStorage.getProfile(); }

  function buildAddressLines(p) {
    var line1 = [p.straat, p.huisnummer].filter(Boolean).join(" ").trim();
    var line2 = [p.postcode, p.plaats].filter(Boolean).join(" ").trim();
    return { line1: line1, line2: line2 };
  }

  function fillFromBlock(p) {
    var fromBlock = $("#from-block");
    if (!fromBlock) return;
    var addr = buildAddressLines(p);
    var nameHtml = p.naam ? escapeHtml(p.naam) : "<span class=\"placeholder\">[Je naam]</span>";
    var addr1Html = addr.line1 ? escapeHtml(addr.line1) : "<span class=\"placeholder\">[Straat en huisnummer]</span>";
    var addr2Html = addr.line2 ? escapeHtml(addr.line2) : "<span class=\"placeholder\">[Postcode] [Plaats]</span>";
    var emailHtml = p.email ? escapeHtml(p.email) : "<span class=\"placeholder\">[E-mailadres]</span>";
    fromBlock.innerHTML = nameHtml + "<br />" + addr1Html + "<br />" + addr2Html + "<br />" + emailHtml;
  }

  function fillTemplate(p) {
    var addr = buildAddressLines(p);
    var addressFull = [addr.line1, addr.line2].filter(Boolean).join(", ");
    document.querySelectorAll(".fill").forEach(function (node) {
      var key = node.getAttribute("data-fill");
      var value = "";
      if (key === "naam") value = p.naam || "";
      else if (key === "adres-volledig") value = addressFull;
      if (value) {
        node.textContent = value;
        node.classList.remove("is-empty");
      } else {
        node.classList.add("is-empty");
        node.textContent = node.getAttribute("data-placeholder") || node.textContent;
      }
    });
  }

  function renderDate() {
    var months = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
    var d = new Date();
    var s = "Rotterdam, " + d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
    var el = $("#letter-date");
    if (el) el.textContent = s;
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function plainTextOf(node) {
    var clone = node.cloneNode(true);
    clone.querySelectorAll("br").forEach(function (b) { b.replaceWith("\n"); });
    var text = clone.innerText || clone.textContent || "";
    return text.replace(/\n{3,}/g, "\n\n").trim();
  }

  function buildBody(profileObj) {
    var paper = $("#letter-paper");
    if (!paper) return "";
    var headerText = plainTextOf($(".letter__paperhead"));
    var bodyText = plainTextOf($("#letter-body"));
    return headerText + "\n\n" + bodyText;
  }

  function setStatus(msg, type) {
    var s = $("#letter-status");
    if (!s) return;
    s.textContent = msg || "";
    s.classList.remove("success", "error");
    if (type) s.classList.add(type);
  }

  function wireToolbar(to) {
    var mailto = $("#mailto-link");
    var copy = $("#copy-link");
    var print = $("#print-link");
    var onderwerp = $("#onderwerp");

    function refreshMailto() {
      if (!mailto) return;
      var subj = encodeURIComponent((onderwerp && onderwerp.value) || "");
      var body = encodeURIComponent(buildBody(profile()));
      mailto.href = "mailto:" + encodeURIComponent(to) + "?subject=" + subj + "&body=" + body;
    }
    refreshMailto();
    if (onderwerp) onderwerp.addEventListener("input", refreshMailto);

    if (copy) {
      copy.addEventListener("click", function () {
        var text = ((onderwerp && onderwerp.value) ? "Onderwerp: " + onderwerp.value + "\n\n" : "") + buildBody(profile());
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(
            function () { setStatus("Brief gekopieerd. Plak hem in je e-mailprogramma of contactformulier.", "success"); },
            function () { fallbackCopy(text); }
          );
        } else {
          fallbackCopy(text);
        }
      });
    }
    if (print) print.addEventListener("click", function () { window.print(); });
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); setStatus("Brief gekopieerd.", "success"); }
    catch (e) { setStatus("Kopiëren lukt niet automatisch — selecteer de tekst handmatig.", "error"); }
    ta.remove();
  }

  function showWarningIfEmpty(p) {
    var w = $("#profile-warning");
    if (!w) return;
    var hasAny = p && (p.naam || p.email || p.straat || p.huisnummer || p.postcode);
    if (!hasAny) w.hidden = false;
  }

  function renderFor(to) {
    document.addEventListener("DOMContentLoaded", function () {
      var p = profile();
      fillFromBlock(p);
      fillTemplate(p);
      renderDate();
      showWarningIfEmpty(p);
      wireToolbar(to);
    });
  }

  global.BuurtTemplates = {
    renderQpark: function () { renderFor("klantenservice@q-park.nl"); },
    renderDcmr:  function () { renderFor("meldkamer@dcmr.nl"); }
  };
})(window);
