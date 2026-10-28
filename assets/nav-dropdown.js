(() => {
  const closeMenu = (dropdown) => {
    dropdown.classList.remove("is-open");
    dropdown.querySelector(".dropdown-toggle")?.setAttribute("aria-expanded", "false");
  };

  document.addEventListener("DOMContentLoaded", () => {
    const dropdowns = [...document.querySelectorAll(".dropdown")];

    dropdowns.forEach((dropdown) => {
      const toggle = dropdown.querySelector(".dropdown-toggle");
      if (!toggle) return;

      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        const willOpen = !dropdown.classList.contains("is-open");
        dropdowns.forEach(closeMenu);
        if (willOpen) {
          dropdown.classList.add("is-open");
          toggle.setAttribute("aria-expanded", "true");
        }
      });

      dropdown.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeMenu(dropdown);
          toggle.focus();
        }
      });
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".dropdown")) dropdowns.forEach(closeMenu);
    });
  });
})();
