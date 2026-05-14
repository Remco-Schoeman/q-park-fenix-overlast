/* Q-Park Fenix overlast — localStorage helper.
   Houdt persoonsgegevens en dagboek uitsluitend in deze browser. */
(function (global) {
  "use strict";

  var STORAGE_KEY = "qpark-overlast:profile:v1";
  var TOKEN_KEY = "qpark-overlast:deletetoken:v1";
  var DIARY_KEY = "qpark-overlast:diary:v1";

  function safeParse(str) {
    try { return str ? JSON.parse(str) : null; } catch (e) { return null; }
  }

  var BuurtStorage = {
    // ---- profile ------------------------------------------------
    getProfile: function () {
      try { return safeParse(localStorage.getItem(STORAGE_KEY)) || {}; }
      catch (e) { return {}; }
    },
    setProfile: function (profile) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile || {})); return true; }
      catch (e) { return false; }
    },
    clearProfile: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    },

    // ---- delete token (registration on server) ------------------
    getDeleteToken: function () {
      try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; }
    },
    setDeleteToken: function (token) {
      try { localStorage.setItem(TOKEN_KEY, token || ""); return true; }
      catch (e) { return false; }
    },
    clearDeleteToken: function () {
      try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
    },

    // ---- diary (noise log) --------------------------------------
    getDiary: function () {
      try { return safeParse(localStorage.getItem(DIARY_KEY)) || []; }
      catch (e) { return []; }
    },
    saveDiary: function (entries) {
      try { localStorage.setItem(DIARY_KEY, JSON.stringify(entries || [])); return true; }
      catch (e) { return false; }
    },
    addDiaryEntry: function (entry) {
      var list = this.getDiary();
      list.push(entry);
      this.saveDiary(list);
      return list;
    },
    updateDiaryEntry: function (id, updates) {
      var list = this.getDiary();
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) {
          list[i] = Object.assign({}, list[i], updates);
          this.saveDiary(list);
          return list;
        }
      }
      return list;
    },
    deleteDiaryEntry: function (id) {
      var list = this.getDiary().filter(function (e) { return e.id !== id; });
      this.saveDiary(list);
      return list;
    },
    clearDiary: function () {
      try { localStorage.removeItem(DIARY_KEY); } catch (e) {}
    },

    // ---- wipe everything ----------------------------------------
    clearAll: function () {
      this.clearProfile();
      this.clearDeleteToken();
      this.clearDiary();
    }
  };

  global.BuurtStorage = BuurtStorage;
})(window);
