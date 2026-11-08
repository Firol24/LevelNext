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
