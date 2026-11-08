(function () {
  "use strict";

  function init() {
    var clock = document.getElementById("clock");
    function tick() {
      if (!clock) return;
      clock.textContent = new Date().toLocaleString("pl-PL", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }).toUpperCase();
    }
    tick();
    window.setInterval(tick, 1000);

    var modal = document.getElementById("welcomeModal");
    var close = document.getElementById("closeModal");

    function hideWelcome() {
      if (!modal) return;
      modal.style.display = "none";
      modal.hidden = true;
      try {
        window.sessionStorage.setItem("lnWelcomeSeen", "1");
      } catch (error) {}
    }

    if (modal && close) {
      close.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        hideWelcome();
      });

      modal.addEventListener("click", function (event) {
        if (event.target === modal) hideWelcome();
      });

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") hideWelcome();
      });

      try {
        if (window.sessionStorage.getItem("lnWelcomeSeen") === "1") {
          hideWelcome();
        }
      } catch (error) {}
    }

    var player = document.getElementById("winampWindow");
    if (player) {
      var audio = document.getElementById("winampAudio");
      var play = document.getElementById("winampPlay");
      var pause = document.getElementById("winampPause");
      var volume = document.getElementById("winampVolume");
      var state = document.getElementById("winampState");
      var time = document.getElementById("winampTime");
      var drag = document.getElementById("winampDrag");
      var minimize = document.getElementById("winampMinimize");
      var closePlayer = document.getElementById("winampClose");
      var launcher = document.getElementById("winampLauncher");

      function formatTime(value) {
        if (!Number.isFinite(value) || value < 0) return "00:00";
        return String(Math.floor(value / 60)).padStart(2, "0") + ":" + String(Math.floor(value % 60)).padStart(2, "0");
      }
      function updateTime() { time.textContent = formatTime(audio.currentTime); }
      function setState(value) { state.textContent = value; }

      audio.loop = true;
      play.addEventListener("click", function () {
        if (audio.error) audio.load();
        var result = audio.play();
        if (result && typeof result.catch === "function") result.catch(function () { setState("PLAY ERROR"); });
      });
      pause.addEventListener("click", function () { audio.pause(); });
      volume.addEventListener("input", function () { audio.volume = Number(volume.value); });
      audio.addEventListener("loadedmetadata", updateTime);
      audio.addEventListener("timeupdate", updateTime);
      audio.addEventListener("play", function () { player.classList.add("is-playing"); setState("PLAYING"); });
      audio.addEventListener("pause", function () { player.classList.remove("is-playing"); setState("PAUSED"); });
      audio.addEventListener("error", function () {
        player.classList.remove("is-playing");
        setState(audio.error ? "FILE ERROR " + audio.error.code : "FILE ERROR");
      });
      audio.addEventListener("canplay", function () { if (state.textContent.indexOf("ERROR") !== -1) setState("STOPPED"); });
      audio.volume = Number(volume.value);
      updateTime();

      minimize.addEventListener("click", function () { player.hidden = true; launcher.hidden = false; });
      closePlayer.addEventListener("click", function () { audio.pause(); player.hidden = true; launcher.hidden = false; });
      launcher.addEventListener("click", function () { player.hidden = false; launcher.hidden = true; });

      // Okno jest pozycjonowane względem całego dokumentu, a nie ekranu.
      var positionKey = "levelNextWinampPosition";
      var savedPosition = null;
      try { savedPosition = JSON.parse(window.localStorage.getItem(positionKey) || "null"); } catch (error) {}
      if (savedPosition && Number.isFinite(savedPosition.left) && Number.isFinite(savedPosition.top)) {
        player.style.left = Math.max(0, savedPosition.left) + "px";
        player.style.top = Math.max(0, savedPosition.top) + "px";
      } else {
        var initialRect = player.getBoundingClientRect();
        player.style.left = Math.max(0, window.scrollX + window.innerWidth - initialRect.width - 24) + "px";
        player.style.top = Math.max(0, window.scrollY + window.innerHeight - initialRect.height - 24) + "px";
      }

      var dragState = null;
      drag.addEventListener("pointerdown", function (event) {
        if (event.target.closest("button")) return;
        event.preventDefault();
        var rect = player.getBoundingClientRect();
        dragState = {
          pointerId: event.pointerId,
          startX: event.pageX,
          startY: event.pageY,
          left: rect.left + window.scrollX,
          top: rect.top + window.scrollY
        };
        drag.classList.add("dragging");
      });
      document.addEventListener("pointermove", function (event) {
        if (!dragState || event.pointerId !== dragState.pointerId) return;
        var maxLeft = Math.max(0, document.documentElement.scrollWidth - player.offsetWidth);
        var maxTop = Math.max(0, document.documentElement.scrollHeight - player.offsetHeight);
        var left = Math.max(0, Math.min(maxLeft, dragState.left + event.pageX - dragState.startX));
        var top = Math.max(0, Math.min(maxTop, dragState.top + event.pageY - dragState.startY));
        player.style.left = left + "px";
        player.style.top = top + "px";
      });
      function endDrag(event) {
        if (!dragState || (event && event.pointerId !== dragState.pointerId)) return;
        dragState = null;
        drag.classList.remove("dragging");
        try {
          window.localStorage.setItem(positionKey, JSON.stringify({
            left: parseFloat(player.style.left) || 0,
            top: parseFloat(player.style.top) || 0
          }));
        } catch (error) {}
      }
      document.addEventListener("pointerup", endDrag);
      document.addEventListener("pointercancel", endDrag);
    }

    // Wspolny generator misji dla strony glownej i osobnej podstrony.
    var missions = [
      "Uruchom grę z 2004 roku i spędź z nią 30 minut.",
      "Włącz konsolę, której dawno nie używałeś.",
      "Znajdź instrukcję starego urządzenia z kolekcji.",
      "Zrób zrzut ekranu z gry, do której wracasz od lat.",
      "Przejdź jeden poziom bez poradnika i save state.",
      "Odszukaj demo gry z dawnej płyty lub magazynu.",
      "Włącz ulubioną grę z dzieciństwa i sprawdź, jak się zestarzała.",
      "Zagraj przez pół godziny na konsoli zamiast na komputerze.",
      "Znajdź starą grę freeware i uruchom ją na swoim sprzęcie.",
      "Przejrzyj instrukcję lub pudełko gry, które nadal masz.",
      "Uruchom grę bez muzyki w tle i wsłuchaj się w jej oryginalne dźwięki.",
      "Odwiedź lokację w grze, którą dobrze pamiętasz.",
      "Poszukaj zapomnianego dema z epoki płyt CD.",
      "Zrób zdjęcie swojego retro stanowiska do archiwum."
    ];
    function setupMission(buttonId, resultId, stateId) {
      var button = document.getElementById(buttonId);
      var result = document.getElementById(resultId);
      var status = document.getElementById(stateId);
      if (!button || !result) return;
      button.addEventListener("click", function () {
        if (button.disabled) return;
        button.disabled = true;
        button.classList.add("is-rolling");
        if (status) status.textContent = "LOSOWANIE W TOKU...";
        result.classList.remove("mission-reveal");
        result.classList.add("is-shuffling");
        var started = Date.now();
        var duration = 1450;
        var interval = window.setInterval(function () {
          result.textContent = missions[Math.floor(Math.random() * missions.length)];
          if (Date.now() - started >= duration) {
            window.clearInterval(interval);
            result.textContent = missions[Math.floor(Math.random() * missions.length)];
            result.classList.remove("is-shuffling");
            result.classList.add("mission-reveal");
            button.classList.remove("is-rolling");
            button.disabled = false;
            if (status) status.textContent = "MISSION SELECTED // POWODZENIA!";
          }
        }, 95);
      });
    }
    setupMission("rollMission", "mission", "missionState");
    setupMission("rollRetro", "retro-action", "retroMissionState");

    // Zaznaczenie aktywnej zakladki na kazdej podstronie.
    var currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".nav a").forEach(function (link) {
      var target = (link.getAttribute("href") || "").split("#")[0].toLowerCase();
      if (target === currentPage) link.setAttribute("aria-current", "page");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
