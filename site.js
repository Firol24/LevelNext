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
    if (!player) {
      document.body.insertAdjacentHTML("beforeend",
        '<div class="winamp-window" id="winampWindow" aria-label="Odtwarzacz LEVEL NEXT">' +
          '<div class="winamp-titlebar" id="winampDrag"><span class="winamp-app-icon">▰</span><strong>WINAMP 2.9x</strong><span class="winamp-title-spacer"></span><button type="button" class="winamp-window-btn" id="winampMinimize" aria-label="Minimalizuj">_</button><button type="button" class="winamp-window-btn winamp-close" id="winampClose" aria-label="Zamknij">×</button></div>' +
          '<div class="winamp-inner"><div class="winamp-display"><div class="winamp-display-top"><span id="winampState">STARTING</span><span id="winampTime">00:00</span></div><div class="winamp-track"><span id="winampTrackName">untitled.mp3</span></div><div class="winamp-spectrum" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div>' +
          '<div class="winamp-controls"><button type="button" id="winampPlay" aria-label="Odtwórz">▶</button><button type="button" id="winampPause" aria-label="Pauza">Ⅱ</button><span class="winamp-volume-label">VOL</span><input id="winampVolume" type="range" min="0" max="1" step="0.01" value="0.75" aria-label="Głośność"></div><audio id="winampAudio" preload="auto" autoplay loop><source src="assets/audio/untitled.mp3" type="audio/mpeg"></audio></div>' +
          '<div class="winamp-bottom"><span>STEREO</span><span>44 KHZ</span><span>LEVEL NEXT RADIO</span></div></div>' +
          '<button type="button" id="winampLauncher" class="winamp-launcher" hidden>♫ WINAMP</button>');
      player = document.getElementById("winampWindow");
    }
    if (player) {
      if (player.parentElement !== document.body) document.body.appendChild(player);
      var existingLauncher = document.getElementById("winampLauncher");
      if (existingLauncher && existingLauncher.parentElement !== document.body) document.body.appendChild(existingLauncher);
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
      audio.autoplay = true;
      play.addEventListener("click", function () {
        if (audio.error) audio.load();
        var result = audio.play();
        if (result && typeof result.catch === "function") result.catch(function () { setState("CLICK TO PLAY"); });
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
      if (!audio.paused) {
        player.classList.add("is-playing");
        setState("PLAYING");
      }

      // Proba startu od razu po wejsciu. Jesli przegladarka blokuje dzwiek,
      // ponawiamy ja przy pierwszej interakcji odwiedzajacego ze strona.
      var autoplayStarted = false;
      function tryAutoplay() {
        if (autoplayStarted || !audio.paused) return;
        var attempt = audio.play();
        if (attempt && typeof attempt.then === "function") {
          attempt.then(function () {
            autoplayStarted = true;
            document.removeEventListener("pointerdown", retryAutoplay, true);
            document.removeEventListener("keydown", retryAutoplay, true);
          }).catch(function (error) {
            if (error && error.name === "NotAllowedError") setState("CLICK TO PLAY");
            else setState("FILE ERROR");
          });
        }
      }
      function retryAutoplay() { tryAutoplay(); }
      tryAutoplay();
      document.addEventListener("pointerdown", retryAutoplay, true);
      document.addEventListener("keydown", retryAutoplay, true);

      minimize.addEventListener("click", function () { player.hidden = true; launcher.hidden = false; });
      closePlayer.addEventListener("click", function () { audio.pause(); player.hidden = true; launcher.hidden = false; });
      launcher.addEventListener("click", function () { player.hidden = false; launcher.hidden = true; });

      // Okno jest przypiete do body, wiec zapisane wspolrzedne sa wspolrzednymi dokumentu.
      var positionKey = "levelNextWinampPosition";
      var savedPosition = null;
      try { savedPosition = JSON.parse(window.localStorage.getItem(positionKey) || "null"); } catch (error) {}
      function clampPlayerPosition(left, top) {
        var pageWidth = Math.max(window.innerWidth, document.body.offsetWidth, document.documentElement.clientWidth);
        var pageHeight = Math.max(window.innerHeight, document.body.offsetHeight, document.documentElement.clientHeight);
        var maxLeft = Math.max(0, pageWidth - player.offsetWidth);
        var maxTop = Math.max(0, pageHeight - player.offsetHeight);
        return {
          left: Math.max(0, Math.min(maxLeft, left)),
          top: Math.max(0, Math.min(maxTop, top))
        };
      }
      var initialRect = player.getBoundingClientRect();
      var initialPosition = savedPosition && Number.isFinite(savedPosition.left) && Number.isFinite(savedPosition.top)
        ? clampPlayerPosition(savedPosition.left, savedPosition.top)
        : clampPlayerPosition(window.scrollX + window.innerWidth - initialRect.width - 24, window.scrollY + window.innerHeight - initialRect.height - 24);
      player.style.left = initialPosition.left + "px";
      player.style.top = initialPosition.top + "px";

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
        var pageWidth = Math.max(window.innerWidth, document.body.offsetWidth, document.documentElement.clientWidth);
        var pageHeight = Math.max(window.innerHeight, document.body.offsetHeight, document.documentElement.clientHeight);
        var maxLeft = Math.max(0, pageWidth - player.offsetWidth);
        var maxTop = Math.max(0, pageHeight - player.offsetHeight);
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
        var consoleBox = result.closest(".mission-console");
        if (consoleBox) consoleBox.classList.add("is-rolling");
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
            if (consoleBox) consoleBox.classList.remove("is-rolling");
            button.disabled = false;
            if (status) status.textContent = "MISSION SELECTED // POWODZENIA!";
          }
        }, 95);
      });
    }
    setupMission("rollMission", "mission", "missionState");
    setupMission("rollRetro", "retro-action", "retroMissionState");


    // Wlasny CMS witryny LEVEL NEXT. Dane sa oddzielone od LEVEL NEXT DAILY.
    (function loadSiteContent() {
      var page = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
      fetch("data/site-content.json?ts=" + Date.now(), { cache: "no-store" })
        .then(function (response) { if (!response.ok) throw new Error("CMS unavailable"); return response.json(); })
        .then(function (data) {
          (Array.isArray(data.blocks) ? data.blocks : [])
            .filter(function (block) { return block.page === page && block.enabled !== false; })
            .sort(function (a, b) {
              var order = { leftcol: 0, maincol: 1, rightcol: 2 };
              return (order[a.column] - order[b.column]) || (Number(a.position || 1) - Number(b.position || 1));
            })
            .forEach(function (block) {
              var column = document.querySelector(".layout ." + block.column);
              if (!column) return;
              var panel = document.createElement("section");
              panel.className = "panel cms-panel";
              panel.dataset.cmsId = block.id || "";
              if (block.id) panel.id = block.id;
              var head = document.createElement("div");
              head.className = "panelhead";
              var heading = document.createElement("h2");
              heading.textContent = block.title || "NOTATKA";
              head.appendChild(heading);
              var body = document.createElement("div");
              body.className = "panelbody";
              String(block.body || "").split(/\n\s*\n/).filter(Boolean).forEach(function (paragraph) {
                var p = document.createElement("p");
                p.textContent = paragraph;
                body.appendChild(p);
              });
              if (block.image) {
                var img = document.createElement("img");
                img.src = block.image;
                img.alt = block.title || "";
                img.loading = "lazy";
                img.style.maxWidth = "100%";
                img.style.height = "auto";
                body.insertBefore(img, body.firstChild);
              }
              if (block.link) {
                var a = document.createElement("a");
                a.href = block.link;
                a.textContent = "Otwórz odnośnik »";
                a.target = "_blank";
                a.rel = "noopener";
                a.className = "button";
                body.appendChild(a);
              }
              panel.append(head, body);
              var panels = Array.from(column.querySelectorAll(":scope > .panel"));
              var position = Math.max(1, Number(block.position || 1));
              if (panels.length >= position) column.insertBefore(panel, panels[position - 1]);
              else column.appendChild(panel);
            });
          document.documentElement.dataset.cmsLoaded = "true";
          document.dispatchEvent(new Event("levelnextcmsready"));
        }).catch(function () { document.documentElement.dataset.cmsLoaded = "true"; });
    })();

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
