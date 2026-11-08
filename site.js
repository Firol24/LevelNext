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
      var stop = document.getElementById("winampStop");
      var seek = document.getElementById("winampSeek");
      var volume = document.getElementById("winampVolume");
      var state = document.getElementById("winampState");
      var time = document.getElementById("winampTime");
      var elapsed = document.getElementById("winampElapsed");
      var duration = document.getElementById("winampDuration");
      var drag = document.getElementById("winampDrag");
      var minimize = document.getElementById("winampMinimize");
      var closePlayer = document.getElementById("winampClose");
      var launcher = document.getElementById("winampLauncher");
      var seeking = false;

      function formatTime(value) {
        if (!Number.isFinite(value) || value < 0) return "00:00";
        return String(Math.floor(value / 60)).padStart(2, "0") + ":" + String(Math.floor(value % 60)).padStart(2, "0");
      }
      function updateTime() {
        var current = formatTime(audio.currentTime);
        time.textContent = current;
        elapsed.textContent = current;
        duration.textContent = Number.isFinite(audio.duration) ? formatTime(audio.duration) : "--:--";
        if (!seeking && Number.isFinite(audio.duration) && audio.duration > 0) seek.value = String(Math.round(audio.currentTime / audio.duration * 1000));
      }
      function setState(value) { state.textContent = value; }
      play.addEventListener("click", function () {
        if (audio.error) {
          audio.load();
        }
        var result = audio.play();
        if (result && typeof result.catch === "function") result.catch(function () { setState("PLAYBACK ERROR"); });
      });
      pause.addEventListener("click", function () { audio.pause(); });
      stop.addEventListener("click", function () {
        audio.pause();
        try { audio.currentTime = 0; } catch (error) {}
        updateTime();
        player.classList.remove("is-playing");
        setState("STOPPED");
      });
      volume.addEventListener("input", function () { audio.volume = Number(volume.value); });
      seek.addEventListener("input", function () {
        seeking = true;
        if (Number.isFinite(audio.duration) && audio.duration > 0) time.textContent = formatTime(Number(seek.value) / 1000 * audio.duration);
      });
      seek.addEventListener("change", function () {
        if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = Number(seek.value) / 1000 * audio.duration;
        seeking = false;
        updateTime();
      });
      audio.addEventListener("loadedmetadata", updateTime);
      audio.addEventListener("timeupdate", updateTime);
      audio.addEventListener("play", function () { player.classList.add("is-playing"); setState("PLAYING"); });
      audio.addEventListener("pause", function () { player.classList.remove("is-playing"); if (!audio.ended && audio.currentTime > 0) setState("PAUSED"); });
      audio.addEventListener("ended", function () { player.classList.remove("is-playing"); setState("FINISHED"); updateTime(); });
      audio.addEventListener("error", function () {
        player.classList.remove("is-playing");
        setState(audio.error ? "FILE ERROR " + audio.error.code : "FILE ERROR");
      });
      audio.volume = Number(volume.value);
      audio.addEventListener("canplay", function () { if (state.textContent.indexOf("ERROR") !== -1) setState("STOPPED"); });
      updateTime();

      minimize.addEventListener("click", function () { player.hidden = true; launcher.hidden = false; });
      closePlayer.addEventListener("click", function () { audio.pause(); player.hidden = true; launcher.hidden = false; });
      launcher.addEventListener("click", function () { player.hidden = false; launcher.hidden = true; });

      var dragState = null;
      drag.addEventListener("pointerdown", function (event) {
        if (event.target.closest("button")) return;
        var rect = player.getBoundingClientRect();
        dragState = {x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};
        player.style.left = rect.left + "px";
        player.style.top = rect.top + "px";
        player.style.right = "auto";
        player.style.bottom = "auto";
        if (drag.setPointerCapture) drag.setPointerCapture(event.pointerId);
      });
      drag.addEventListener("pointermove", function (event) {
        if (!dragState) return;
        var left = Math.max(0, Math.min(window.innerWidth - player.offsetWidth, dragState.left + event.clientX - dragState.x));
        var top = Math.max(0, Math.min(window.innerHeight - player.offsetHeight, dragState.top + event.clientY - dragState.y));
        player.style.left = left + "px";
        player.style.top = top + "px";
      });
      function endDrag() { dragState = null; }
      drag.addEventListener("pointerup", endDrag);
      drag.addEventListener("pointercancel", endDrag);
    }

    var roll = document.getElementById("rollMission");
    if (roll) {
      var missions = [
        "Uruchom grę z 2004 roku i spędź z nią 30 minut.",
        "Włącz konsolę, której dawno nie używałeś.",
        "Znajdź instrukcję starego urządzenia z kolekcji.",
        "Zrób zrzut ekranu z gry, do której wracasz od lat.",
        "Przejdź jeden poziom bez poradnika i save state.",
        "Odszukaj demo gry z dawnej płyty lub magazynu."
      ];
      roll.addEventListener("click", function () {
        var node = document.getElementById("mission");
        if (node) {
          node.textContent = missions[Math.floor(Math.random() * missions.length)];
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
