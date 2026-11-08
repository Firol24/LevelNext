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

    var player = document.getElementById("winampPlayer");
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
      var seeking = false;

      function formatTime(value) {
        if (!Number.isFinite(value) || value < 0) return "00:00";
        var mins = Math.floor(value / 60);
        var secs = Math.floor(value % 60);
        return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
      }
      function updateTime() {
        var current = formatTime(audio.currentTime);
        time.textContent = current;
        elapsed.textContent = current;
        duration.textContent = Number.isFinite(audio.duration) ? formatTime(audio.duration) : "--:--";
        if (!seeking && Number.isFinite(audio.duration) && audio.duration > 0) {
          seek.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
        }
      }
      function setPlaying() {
        player.classList.add("is-playing");
        state.textContent = "PLAYING";
        play.textContent = "▶";
      }
      function setPaused() {
        player.classList.remove("is-playing");
        state.textContent = "PAUSED";
      }
      play.addEventListener("click", function () {
        var result = audio.play();
        if (result && typeof result.catch === "function") {
          result.catch(function () { state.textContent = "LOAD ERROR"; });
        }
      });
      pause.addEventListener("click", function () {
        audio.pause();
      });
      stop.addEventListener("click", function () {
        audio.pause();
        audio.currentTime = 0;
        updateTime();
        player.classList.remove("is-playing");
        state.textContent = "STOPPED";
      });
      volume.addEventListener("input", function () {
        audio.volume = Number(volume.value);
      });
      seek.addEventListener("input", function () {
        seeking = true;
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          var preview = (Number(seek.value) / 1000) * audio.duration;
          time.textContent = formatTime(preview);
        }
      });
      seek.addEventListener("change", function () {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          audio.currentTime = (Number(seek.value) / 1000) * audio.duration;
        }
        seeking = false;
        updateTime();
      });
      audio.addEventListener("loadedmetadata", updateTime);
      audio.addEventListener("timeupdate", updateTime);
      audio.addEventListener("play", setPlaying);
      audio.addEventListener("pause", function () {
        if (!audio.ended && audio.currentTime > 0) setPaused();
      });
      audio.addEventListener("ended", function () {
        player.classList.remove("is-playing");
        state.textContent = "FINISHED";
        updateTime();
      });
      audio.addEventListener("error", function () {
        player.classList.remove("is-playing");
        state.textContent = "FILE ERROR";
      });
      audio.volume = Number(volume.value);
      updateTime();
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
