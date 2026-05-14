/* Buurtdossier — localStorage helper
   Houdt persoonsgegevens uitsluitend in deze browser. */
(function (global) {
  "use strict";

  var STORAGE_KEY = "buurtdossier:profile:v1";
  var TOKEN_KEY = "buurtdossier:deletetoken:v1";

  function safeParse(str) {
    try { return str ? JSON.parse(str) : null; } catch (e) { return null; }
  }

  var BuurtStorage = {
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
    clearAll: function () {
      this.clearProfile();
      this.clearDeleteToken();
    }
  };

  global.BuurtStorage = BuurtStorage;
})(window);
