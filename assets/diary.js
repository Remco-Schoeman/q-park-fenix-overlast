/* Q-Park Fenix overlast — geluidsdagboek.
   Alle waarnemingen leven uitsluitend in localStorage van deze browser.
*/
(function () {
  "use strict";

  function $(s, ctx) { return (ctx || document).querySelector(s); }

  var MONTHS_LONG = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
  var MONTHS_SHORT = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];
  var DAYS_SHORT = ["zo","ma","di","wo","do","vr","za"];
  var INTENSITY_LABELS = ["", "licht hoorbaar", "storend", "hinderlijk", "ernstig storend", "ondraaglijk"];

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function fmtDateLong(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    return DAYS_SHORT[d.getDay()] + " " + d.getDate() + " " + MONTHS_SHORT[d.getMonth()] + " " + d.getFullYear();
  }

  function fmtDateIso(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function durationStr(start, end) {
    if (!start || !end) return "";
    var sParts = start.split(":");
    var eParts = end.split(":");
    if (sParts.length < 2 || eParts.length < 2) return "";
    var minsStart = Number(sParts[0]) * 60 + Number(sParts[1]);
    var minsEnd = Number(eParts[0]) * 60 + Number(eParts[1]);
    if (isNaN(minsStart) || isNaN(minsEnd)) return "";
    if (minsEnd < minsStart) minsEnd += 24 * 60; // crosses midnight
    var diff = minsEnd - minsStart;
    if (diff <= 0) return "";
    var h = Math.floor(diff / 60);
    var m = diff % 60;
    if (h && m) return h + "u" + String(m).padStart(2, "0");
    if (h) return h + "u";
    return m + "m";
  }

  function intensityLabel(n) {
    var v = Number(n) || 0;
    return INTENSITY_LABELS[v] || "";
  }

  function sortEntries(entries) {
    return entries.slice().sort(function (a, b) {
      var ka = (a.date || "") + "T" + (a.startTime || "00:00");
      var kb = (b.date || "") + "T" + (b.startTime || "00:00");
      if (kb < ka) return -1;
      if (kb > ka) return 1;
      return 0;
    });
  }

  /* ---------- form ---------- */

  var form;
  var editingId = "";

  function readForm() {
    var fd = new FormData(form);
    return {
      id: fd.get("id") || "",
      date: (fd.get("date") || "").trim(),
      startTime: (fd.get("startTime") || "").trim(),
      endTime: (fd.get("endTime") || "").trim(),
      intensity: Number(fd.get("intensity") || 0),
      notitie: (fd.get("notitie") || "").trim()
    };
  }

  function clearForm() {
    if (!form) return;
    form.reset();
    form.elements["id"].value = "";
    editingId = "";
    var reset = $("#diary-reset");
    if (reset) reset.hidden = true;
    var submit = $("#diary-submit");
    if (submit) submit.textContent = "Waarneming opslaan";
  }

  function loadIntoForm(entry) {
    if (!form || !entry) return;
    form.elements["id"].value = entry.id || "";
    form.elements["date"].value = entry.date || "";
    form.elements["startTime"].value = entry.startTime || "";
    form.elements["endTime"].value = entry.endTime || "";
    form.elements["notitie"].value = entry.notitie || "";
    var radios = form.querySelectorAll('input[name="intensity"]');
    Array.prototype.forEach.call(radios, function (r) {
      r.checked = String(entry.intensity) === r.value;
    });
    editingId = entry.id || "";
    var reset = $("#diary-reset");
    if (reset) reset.hidden = false;
    var submit = $("#diary-submit");
    if (submit) submit.textContent = "Waarneming bijwerken";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setStatus(msg, type) {
    var el = $("#diary-status");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.remove("success", "error");
    if (type) el.classList.add(type);
  }

  /* ---------- list rendering ---------- */

  function renderCounter(n) {
    var el = $("#diary-counter");
    if (!el) return;
    if (!n) {
      el.textContent = "Nog geen waarnemingen vastgelegd.";
    } else if (n === 1) {
      el.textContent = "1 waarneming vastgelegd in deze browser.";
    } else {
      el.textContent = n + " waarnemingen vastgelegd in deze browser.";
    }
  }

  function renderList() {
    var list = BuurtStorage.getDiary();
    renderCounter(list.length);
    var container = $("#diary-list");
    if (!container) return;

    if (!list.length) {
      container.innerHTML = '<p class="diary__empty">Nog geen waarnemingen. Voeg er hierboven één toe — datum en intensiteit zijn voldoende.</p>';
      return;
    }

    var sorted = sortEntries(list);
    container.innerHTML = sorted.map(function (e) {
      var tijdStr = "";
      if (e.startTime && e.endTime) {
        var dur = durationStr(e.startTime, e.endTime);
        tijdStr = e.startTime + "&ndash;" + e.endTime + (dur ? ' <span class="muted">(' + escapeHtml(dur) + ')</span>' : '');
      } else if (e.startTime) {
        tijdStr = "vanaf " + e.startTime;
      } else if (e.endTime) {
        tijdStr = "tot " + e.endTime;
      }
      var intensity = Number(e.intensity || 0);
      return '<article class="diary-entry" data-id="' + escapeHtml(e.id) + '">' +
        '<div class="diary-entry__head">' +
          '<time datetime="' + escapeHtml(e.date) + '">' + escapeHtml(fmtDateLong(e.date)) + '</time>' +
          (tijdStr ? '<span class="diary-entry__time">' + tijdStr + '</span>' : '') +
          (intensity ? '<span class="diary-entry__intensity intensity-' + intensity + '">' + intensity + '/5 &middot; ' + escapeHtml(intensityLabel(intensity)) + '</span>' : '') +
        '</div>' +
        (e.notitie ? '<p class="diary-entry__note">' + escapeHtml(e.notitie) + '</p>' : '') +
        '<div class="diary-entry__actions">' +
          '<button type="button" class="entry-link" data-action="edit">Bewerken</button>' +
          '<button type="button" class="entry-link entry-link--danger" data-action="delete">Verwijderen</button>' +
        '</div>' +
      '</article>';
    }).join("");
  }

  /* ---------- export ---------- */

  function buildExportText() {
    var entries = sortEntries(BuurtStorage.getDiary());
    var profile = BuurtStorage.getProfile();
    var now = new Date();
    var head = [];
    head.push("Geluidsdagboek — defecte ventilator Q-Park Fenix, Veerlaan Rotterdam");
    var bewoner = [profile.naam, profile.straat ? (profile.straat + " " + (profile.huisnummer || "")).trim() : "", profile.postcode, profile.plaats]
      .filter(function (s) { return s && s.trim(); }).join(", ");
    if (bewoner) head.push("Bijgehouden door: " + bewoner);
    head.push("Geëxporteerd op: " + now.getDate() + " " + MONTHS_LONG[now.getMonth()] + " " + now.getFullYear());
    head.push("Totaal: " + entries.length + " " + (entries.length === 1 ? "waarneming" : "waarnemingen"));
    head.push("");
    head.push("---------------------------------------------------------------");

    if (!entries.length) {
      head.push("(nog geen waarnemingen vastgelegd)");
      return head.join("\n");
    }

    var body = entries.map(function (e) {
      var line1 = [fmtDateIso(e.date)];
      if (e.startTime && e.endTime) {
        var dur = durationStr(e.startTime, e.endTime);
        line1.push(e.startTime + "–" + e.endTime + (dur ? " (" + dur + ")" : ""));
      } else if (e.startTime) {
        line1.push("vanaf " + e.startTime);
      } else if (e.endTime) {
        line1.push("tot " + e.endTime);
      }
      var iv = Number(e.intensity || 0);
      if (iv) line1.push("Intensiteit " + iv + "/5 — " + intensityLabel(iv));
      var lines = [line1.join("   ")];
      if (e.notitie) lines.push("   " + e.notitie.replace(/\r?\n/g, " "));
      return lines.join("\n");
    }).join("\n");

    return head.join("\n") + "\n" + body + "\n";
  }

  function copyExport() {
    var text = buildExportText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { setStatus("Dagboek gekopieerd. Plak het onder je volgende brief.", "success"); },
        function () { fallbackCopy(text); }
      );
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); setStatus("Dagboek gekopieerd.", "success"); }
    catch (err) { setStatus("Kopiëren mislukt — selecteer de tekst handmatig.", "error"); }
    ta.remove();
  }

  function downloadExport() {
    var text = buildExportText();
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var now = new Date();
    var iso = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
    var a = document.createElement("a");
    a.href = url;
    a.download = "geluidsdagboek-q-park-fenix-" + iso + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    setStatus("Dagboek opgeslagen als bestand.", "success");
  }

  /* ---------- wiring ---------- */

  function wireForm() {
    form = $("#diary-form");
    if (!form) return;

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var data = readForm();
      if (!data.date) { setStatus("Vul minstens een datum in.", "error"); return; }
      if (!data.intensity) { setStatus("Kies een intensiteit van 1 tot 5.", "error"); return; }

      if (editingId) {
        BuurtStorage.updateDiaryEntry(editingId, {
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          intensity: data.intensity,
          notitie: data.notitie
        });
        setStatus("Waarneming bijgewerkt.", "success");
      } else {
        BuurtStorage.addDiaryEntry({
          id: uuid(),
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          intensity: data.intensity,
          notitie: data.notitie,
          createdAt: Date.now()
        });
        setStatus("Waarneming toegevoegd.", "success");
      }
      clearForm();
      renderList();
    });

    var reset = $("#diary-reset");
    if (reset) reset.addEventListener("click", function () {
      clearForm();
      setStatus("Bewerking geannuleerd.");
    });
  }

  function wireList() {
    var container = $("#diary-list");
    if (!container) return;
    container.addEventListener("click", function (ev) {
      var btn = ev.target.closest("button[data-action]");
      if (!btn) return;
      var card = btn.closest("[data-id]");
      if (!card) return;
      var id = card.getAttribute("data-id");
      var action = btn.getAttribute("data-action");
      if (action === "delete") {
        BuurtStorage.deleteDiaryEntry(id);
        if (editingId === id) clearForm();
        renderList();
        setStatus("Waarneming verwijderd.");
      } else if (action === "edit") {
        var entries = BuurtStorage.getDiary();
        var found = null;
        for (var i = 0; i < entries.length; i++) { if (entries[i].id === id) { found = entries[i]; break; } }
        if (found) loadIntoForm(found);
      }
    });
  }

  function wireToolbar() {
    var copy = $("#diary-copy");
    var dl = $("#diary-download");
    var wipe = $("#diary-clear");
    if (copy) copy.addEventListener("click", copyExport);
    if (dl) dl.addEventListener("click", downloadExport);
    if (wipe) wipe.addEventListener("click", function () {
      var n = BuurtStorage.getDiary().length;
      if (!n) { setStatus("Er staat niets in het dagboek om te wissen."); return; }
      var ok = window.confirm("Weet je zeker dat je alle " + n + " waarnemingen wilt wissen? Dit kan niet ongedaan gemaakt worden.");
      if (!ok) return;
      BuurtStorage.clearDiary();
      clearForm();
      renderList();
      setStatus("Dagboek gewist.", "success");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    // default the date input to today
    var dateInput = document.getElementById("d-date");
    if (dateInput && !dateInput.value) {
      var t = new Date();
      var iso = t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
      dateInput.value = iso;
    }
    wireForm();
    wireList();
    wireToolbar();
    renderList();
  });
})();
