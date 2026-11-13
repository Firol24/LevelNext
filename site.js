(function () {
  "use strict";

  function init() {
    function tick() {
      var clock = document.getElementById("clock");
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
      "Zrób zdjęcie swojego retro stanowiska do archiwum.",
      "Uruchom grę z ery Windows 95/98 i spróbuj przejść pierwszy poziom bez poradnika.",
      "Znajdź w starej grze ukrytą lokację albo sekret, którego wcześniej nie zauważyłeś.",
      "Zagraj w klasyka z 8-bitów przez 20 minut i poznaj jego oryginalne sterowanie.",
      "Odpal dowolną grę z 2000-2005 i sprawdź, jak wygląda jej ekran startowy.",
      "Przejdź jedną misję w GTA III, Vice City albo San Andreas bez używania kodów.",
      "Włącz starą grę wyścigową i ukończ trzy wyścigi na widoku z kokpitu.",
      "Znajdź grę, która mieściła się kiedyś na jednej dyskietce, i zobacz ją w akcji.",
      "Uruchom klasyczną grę DOS-ową i pograj, nie korzystając z save state.",
      "Zagraj w demko z epoki PS1 albo PS2 i oceń, czy chciałbyś pełną wersję.",
      "Przejdź jeden etap platformówki bez utraty życia.",
      "Odpal starą bijatykę i wygraj trzy rundy postacią, której prawie nie używasz.",
      "Zagraj w klasyczny horror po zmroku, przy przygaszonym świetle.",
      "Znajdź w swojej kolekcji najstarszą płytę z grą i obejrzyj jej pudełko.",
      "Przejrzyj instrukcję gry i przeczytaj ją tak, jak robiło się to przed pierwszym uruchomieniem.",
      "Uruchom grę z pierwszej generacji PlayStation i sprawdź jej intro.",
      "Zagraj w klasyczną grę na klawiaturze, nawet jeśli masz pod ręką pada.",
      "Odpal starą grę sportową i rozegraj pełny mecz.",
      "Znajdź zapomnianą grę freeware z lat 90. lub 2000. i przetestuj ją.",
      "Zagraj w klasyczną strategię i rozegraj pierwsze 15 minut bez pośpiechu.",
      "Uruchom starą grę RPG i porozmawiaj z każdą postacią w pierwszej osadzie.",
      "Znajdź w grze lokację, która najbardziej przypomina klimat starego internetu.",
      "Zagraj w coś z czasów Windows XP i zostaw domyślne ustawienia grafiki.",
      "Odpal grę z płyty CD lub DVD, jeśli nadal masz taką możliwość.",
      "Przejrzyj stare menu konsoli i sprawdź, jakie opcje pamiętasz z dzieciństwa.",
      "Zagraj w klasyczną grę logiczną i rozwiąż przynajmniej trzy zagadki.",
      "Uruchom retro FPS i ukończ jeden poziom bez zmiany poziomu trudności.",
      "Znajdź w grze lokalny multiplayer i przygotuj ją do wspólnej rozgrywki.",
      "Zagraj w klasyczną grę przygodową i obejrzyj animacje w pierwszej scenie.",
      "Uruchom grę z ery 16-bitów i spróbuj dojść dalej niż za pierwszym razem.",
      "Zagraj w jedną rundę klasycznego arcade i spróbuj pobić własny wynik.",
      "Znajdź starą ścieżkę dźwiękową z gry i posłuchaj jej bez oglądania gameplayu.",
      "Odpal grę z 2001 roku i spędź 20 minut, eksplorując zamiast wykonywać misje.",
      "Przejdź pierwszą misję w grze, którą od dawna masz zainstalowaną, ale ciągle odkładasz.",
      "Uruchom klasyczny symulator i wykonaj jedno zadanie zgodnie z instrukcją.",
      "Zagraj w starą grę na najniższej rozdzielczości, w jakiej nadal da się komfortowo grać.",
      "Znajdź w grze easter egg z epoki PS2 albo pierwszych pecetowych hitów.",
      "Zagraj w retro platformówkę i zbierz wszystkie znajdźki na jednym etapie.",
      "Odpal klasyczną grę point-and-click i rozwiąż jedną zagadkę bez podpowiedzi.",
      "Uruchom starą grę strategiczną i zbuduj bazę od zera.",
      "Zagraj w klasyczny survival horror i nie używaj poradnika przez całą sesję.",
      "Sprawdź, czy stara gra nadal działa na twoim obecnym systemie.",
      "Znajdź archiwalny zwiastun gry, w którą dziś grasz, i porównaj go z gotowym produktem.",
      "Zagraj w grę z ery modemów i ekranów 4:3, najlepiej w oryginalnych proporcjach.",
      "Odpal starą grę z otwartym światem i odwiedź miejsce, które pamiętasz najlepiej.",
      "Zrób własny ranking pięciu najlepszych ekranów tytułowych z retro gier.",
      "Znajdź starą grę, której nigdy nie ukończyłeś, i wróć do niej na pół godziny.",
      "Uruchom klasyczny tytuł z 1998-2003 i sprawdź, jak rozwiązano w nim zapis gry.",
      "Zagraj w grę z epoki CRT i włącz filtr obrazu, jeśli jest dostępny.",
      "Sprawdź stare menu opcji gry i przywróć jej domyślne ustawienia.",
      "Przejdź jeden poziom w grze, używając wyłącznie podstawowego wyposażenia.",
      "Uruchom klasyczną grę samochodową i przejedź trasę bez wspomagaczy.",
      "Znajdź starą grę, która miała edytor poziomów, i stwórz małą mapę.",
      "Zagraj w klasyczny tytuł z automatu arcade przez 15 minut.",
      "Odpal grę z dzieciństwa i spróbuj odtworzyć trasę lub misję z pamięci.",
      "Znajdź w starym tytule najbardziej charakterystyczny dźwięk.",
      "Zagraj w retro grę przygodową i obejrzyj intro oraz napisy końcowe.",
      "Przetestuj starą grę na padzie, który zwykle leży nieużywany.",
      "Uruchom klasyka z 2005 roku lub starszego i ustaw limit 30 FPS.",
      "Zagraj w klasyczny tytuł sieciowy albo jego fanowski odpowiednik.",
      "Znajdź starą grę, która miała polską wersję językową, i sprawdź tłumaczenie.",
      "Przejrzyj archiwalne screeny z gry, którą masz w kolekcji, a potem uruchom ją ponownie.",
      "Zagraj w jedną misję gry stealth, nie wszczynając alarmu.",
      "Uruchom klasyczny tytuł i spróbuj ukończyć fragment bez mapy.",
      "Znajdź grę z nietypowym kontrolerem lub akcesorium i poczytaj, jak działało.",
      "Zagraj w starą grę muzyczną albo rytmiczną i zalicz trzy utwory.",
      "Odpal klasyczny tytuł z widokiem izometrycznym i odkryj całą pierwszą mapę.",
      "Zrób zdjęcie ekranu startowego retro gry i zachowaj je w swoim archiwum.",
      "Znajdź starą grę z lokalnym split-screenem i sprawdź dostępne tryby.",
      "Uruchom grę z 2000 roku i sprawdź, czy nadal pamiętasz jej sterowanie.",
      "Zagraj w klasyczną grę taktyczną i wygraj jedną potyczkę bez wczytywania zapisu.",
      "Przejdź początkowy etap gry, nie pomijając żadnych dialogów.",
      "Znajdź w swojej bibliotece najstarszy tytuł, którego jeszcze nigdy nie uruchamiałeś.",
      "Odpal grę z ery pierwszego Xboxa, PS2 albo GameCube i sprawdź jej intro.",
      "Zagraj w klasyczną grę z widokiem z góry i odkryj wszystkie przejścia na pierwszej mapie.",
      "Przetestuj stary mod do gry, którą dobrze znasz.",
      "Uruchom grę, która kiedyś była dostępna na płytach z czasopismami, i pograj przez chwilę.",
      "Znajdź w starej grze easter egg lub bonus i spróbuj go odblokować.",
      "Zagraj w klasyczny tytuł na CRT albo ustaw proporcje 4:3 na obecnym ekranie.",
      "Sprawdź, jak wyglądała oryginalna instrukcja instalacji starej gry na PC.",
      "Uruchom retro grę i spróbuj przejść pierwszy etap bez korzystania z minimapy.",
      "Zagraj w klasyczny tytuł, którego akcja rozgrywa się nocą, i zwróć uwagę na oświetlenie.",
      "Znajdź starą grę z edytorem postaci i stwórz bohatera od zera.",
      "Odpal klasyczną grę i spędź 10 minut na szukaniu sekretów poza główną trasą.",
      "Zagraj w retro wyścigi i ukończ serię prób czasowych.",
      "Znajdź grę z ery PS2, która miała nietypowy ekran ładowania, i zobacz go ponownie.",
      "Uruchom starą grę bez modów i porównaj ją z tym, jak zwykle w nią grasz.",
      "Przejdź jedną misję w grze akcji, używając innej taktyki niż zazwyczaj.",
      "Zagraj w klasyczny tytuł z widokiem FPP i sprawdź, jak działa jego interfejs.",
      "Znajdź starą grę, która miała demo na oficjalnej stronie, i odszukaj jej archiwalną wersję.",
      "Uruchom klasyczną grę i sprawdź, czy pamiętasz kod do sejfu, drzwi albo zagadki.",
      "Zagraj w retro tytuł przez 30 minut bez przełączania się na inne okna.",
      "Przejrzyj folder z zapisami starej gry i wybierz zapis, do którego warto wrócić.",
      "Znajdź grę z charakterystycznym dubbingiem i posłuchaj kilku dialogów.",
      "Odpal klasyczny tytuł i spróbuj zdobyć jedno osiągnięcie lub odblokować jeden bonus.",
      "Zagraj w starą grę na poziomie trudności wyższym niż zwykle.",
      "Znajdź w grze miejsce, w którym warto po prostu zatrzymać się i posłuchać otoczenia.",
      "Uruchom klasyczny tytuł z 1995-2005 i sprawdź jego wymagania sprzętowe.",
      "Zagraj w jedną rundę retro multiplayera, lokalnie albo na serwerze społeczności.",
      "Znajdź starą grę, która miała papierową mapę, i obejrzyj jej skan lub oryginał.",
      "Odpal grę, którą pamiętasz z salonu gier, i spróbuj dojść do kolejnego etapu.",
      "Zrób krótką notatkę: co w tej starej grze nadal działa świetnie, a co się zestarzało?",
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
    window.levelNextSetupMission = setupMission;
    setupMission("rollMission", "mission", "missionState");
    setupMission("rollRetro", "retro-action", "retroMissionState");


    // Wlasny CMS witryny LEVEL NEXT. Dane sa oddzielone od LEVEL NEXT DAILY.
    function loadSiteContent() {
      var page = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
      fetch("data/site-content.json?ts=" + Date.now(), { cache: "no-store" })
        .then(function (response) { if (!response.ok) throw new Error("CMS unavailable"); return response.json(); })
        .then(function (data) {
          if (page !== (window.location.pathname.split("/").pop() || "index.html").toLowerCase()) return;
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
    }
    window.levelNextLoadSiteContent = loadSiteContent;
    loadSiteContent();

    // Zaznaczenie aktywnej zakladki na kazdej podstronie.
    function markCurrentNavigation() {
      var currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
      document.querySelectorAll(".nav a").forEach(function (link) {
        var target = (link.getAttribute("href") || "").split(/[?#]/)[0].toLowerCase();
        if (target === currentPage) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    }
    markCurrentNavigation();

    // Nawigacja bez przeladowania dokumentu. Winamp pozostaje w tym samym
    // elemencie DOM, wiec audio nie przerywa pracy podczas zmiany podstron.
    function syncPageHead(nextDocument) {
      document.title = nextDocument.title || "LEVEL NEXT";
      var description = nextDocument.querySelector('meta[name="description"]');
      var currentDescription = document.querySelector('meta[name="description"]');
      if (description && currentDescription) currentDescription.setAttribute("content", description.content);
      document.querySelectorAll("style[data-levelnext-page-style],link[data-levelnext-page-head]").forEach(function (node) { node.remove(); });
      nextDocument.querySelectorAll("style").forEach(function (node) {
        var copy = document.createElement("style");
        copy.setAttribute("data-levelnext-page-style", "");
        copy.textContent = node.textContent;
        document.head.appendChild(copy);
      });
      nextDocument.querySelectorAll('link[rel="stylesheet"],link[rel="preconnect"]').forEach(function (node) {
        var href = node.getAttribute("href");
        if (!href) return;
        if (href.indexOf("site.css") !== -1) return;
        var copy = document.createElement("link");
        Array.from(node.attributes).forEach(function (attribute) { copy.setAttribute(attribute.name, attribute.value); });
        copy.setAttribute("data-levelnext-page-head", "");
        document.head.appendChild(copy);
      });
    }

    var pageLoading = false;
    function navigatePage(url, addHistory) {
      if (pageLoading) return;
      pageLoading = true;
      fetch(url.href, { credentials: "same-origin" })
        .then(function (response) {
          if (!response.ok) throw new Error("Page load failed");
          return response.text();
        })
        .then(function (html) {
          var nextDocument = new DOMParser().parseFromString(html, "text/html");
          if (!nextDocument.body) throw new Error("Invalid page");
          var nextPlayer = nextDocument.getElementById("winampWindow");
          if (nextPlayer) nextPlayer.remove();
          var nextLauncher = nextDocument.getElementById("winampLauncher");
          if (nextLauncher) nextLauncher.remove();

          var persistentPlayer = document.getElementById("winampWindow");
          var persistentLauncher = document.getElementById("winampLauncher");
          Array.from(document.body.children).forEach(function (node) {
            if (node !== persistentPlayer && node !== persistentLauncher) node.remove();
          });
          Array.from(nextDocument.body.children).forEach(function (node) {
            if (node.tagName === "SCRIPT") return;
            document.body.appendChild(document.importNode(node, true));
          });
          if (persistentPlayer) document.body.appendChild(persistentPlayer);
          if (persistentLauncher) document.body.appendChild(persistentLauncher);

          syncPageHead(nextDocument);
          document.documentElement.lang = nextDocument.documentElement.lang || "pl";
          if (addHistory) history.pushState({ levelNext: true }, "", url.href);
          window.scrollTo(0, 0);

          // Uruchom skrypty danej podstrony, ale nie laduj ponownie wspolnego site.js.
          nextDocument.body.querySelectorAll("script").forEach(function (oldScript) {
            if (oldScript.src && oldScript.src.indexOf("site.js") !== -1) return;
            var script = document.createElement("script");
            Array.from(oldScript.attributes).forEach(function (attribute) { script.setAttribute(attribute.name, attribute.value); });
            script.textContent = oldScript.textContent;
            document.body.appendChild(script);
            if (!script.src) script.remove();
          });

          markCurrentNavigation();
          var welcomeModal = document.getElementById("welcomeModal");
          var welcomeClose = document.getElementById("closeModal");
          if (welcomeModal && welcomeClose && !welcomeModal.dataset.pjaxBound) {
            welcomeModal.dataset.pjaxBound = "true";
            function dismissWelcome() {
              welcomeModal.style.display = "none";
              welcomeModal.hidden = true;
              try { window.sessionStorage.setItem("lnWelcomeSeen", "1"); } catch (error) {}
            }
            welcomeClose.addEventListener("click", function (event) {
              event.preventDefault();
              event.stopPropagation();
              dismissWelcome();
            });
            welcomeModal.addEventListener("click", function (event) {
              if (event.target === welcomeModal) dismissWelcome();
            });
            try {
              if (window.sessionStorage.getItem("lnWelcomeSeen") === "1") dismissWelcome();
            } catch (error) {}
          }
          if (window.levelNextSetupMission) {
            window.levelNextSetupMission("rollMission", "mission", "missionState");
            window.levelNextSetupMission("rollRetro", "retro-action", "retroMissionState");
          }
          if (window.levelNextLoadSiteContent) window.levelNextLoadSiteContent();
          document.dispatchEvent(new CustomEvent("levelnext:pagechange", { detail: { url: url.href } }));
          if (url.hash) {
            var target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
            if (target) target.scrollIntoView();
          }
        })
        .catch(function () { window.location.href = url.href; })
        .finally(function () { pageLoading = false; });
    }

    document.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var link = event.target.closest("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download") || link.hasAttribute("data-no-pjax")) return;
      var url;
      try { url = new URL(link.href, window.location.href); } catch (error) { return; }
      if (url.origin !== window.location.origin || !/\.html$/i.test(url.pathname)) return;
      if (url.href === window.location.href) return;
      event.preventDefault();
      navigatePage(url, true);
    });

    window.addEventListener("popstate", function () {
      navigatePage(new URL(window.location.href), false);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
