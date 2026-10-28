(() => {
  const format = (value, decimals = 3) => new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals }).format(value);
  const formatMl = (value) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(value);
  const isCloseToInteger = (value) => Math.abs(value - Math.round(value)) < 0.000001;

  document.addEventListener("DOMContentLoaded", () => {
    const tool = document.querySelector("[data-calculator-tool]");
    if (!tool) return;

    const mode = tool.dataset.calculatorMode || "manual";
    const find = (name) => tool.querySelector(`[data-${name}]`);
    const totalInput = find("total-mg");
    const liquidInput = find("liquid-ml");
    const amountInput = find("amount");
    const unitInput = find("amount-unit");
    const capacityInput = find("capacity");
    const resultPanel = find("result-panel");
    const heading = find("result-heading");
    const line = find("result-line");
    const volume = find("volume");
    const volumeLabel = find("volume-label");
    const concentration = find("concentration");
    const concentrationMath = find("concentration-math");
    const units = find("units");
    const unitsMath = find("units-math");
    const note = find("result-note");
    const volumeMath = find("volume-math");
    const capacityNoteElement = find("capacity-note");
    const readout = find("volume-readout");
    const fill = find("fill");
    const marker = find("marker");
    const ticks = find("ticks");
    const labels = find("labels");
    let scale = 0;

    const renderScale = (maxUnits) => {
      if (scale === maxUnits) return;
      scale = maxUnits;
      const tickFragment = document.createDocumentFragment();
      const labelFragment = document.createDocumentFragment();
      for (let value = 0; value <= maxUnits; value += 1) {
        const tick = document.createElement("span");
        tick.className = `calculator-tick${value % 10 === 0 ? " major" : value % 5 === 0 ? " mid" : ""}`;
        tick.style.left = `${(value / maxUnits) * 100}%`;
        tickFragment.appendChild(tick);
      }
      for (let value = 0; value <= maxUnits; value += 10) {
        const label = document.createElement("span");
        label.className = "calculator-scale-label";
        label.style.left = `${(value / maxUnits) * 100}%`;
        label.textContent = value;
        labelFragment.appendChild(label);
      }
      ticks.replaceChildren(tickFragment);
      labels.replaceChildren(labelFragment);
    };

    const bestExampleVolume = (totalMg, amountMg, capacity) => Array.from({ length: 26 }, (_, index) => (index + 5) / 10)
      .map((liquidMl) => {
        const drawMl = amountMg / (totalMg / liquidMl);
        const syringeUnits = drawMl * 100;
        if (drawMl > capacity || syringeUnits < 2) return null;
        const whole = isCloseToInteger(syringeUnits);
        const five = whole && Math.round(syringeUnits) % 5 === 0;
        const ten = whole && Math.round(syringeUnits) % 10 === 0;
        const mgPerTen = (totalMg / liquidMl) / 10;
        const simple = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5].some((value) => Math.abs(mgPerTen - value) < 0.0001);
        return { liquidMl, score: (ten ? 300 : five ? 200 : whole ? 100 : 0) + (simple ? 30 : 0) - Math.abs(liquidMl - 1) * 2 - drawMl };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)[0];

    const capacityNote = (capacity) => `U-100 calibration: 1 unit = 0.01 mL, ${format(capacity * 100, 0)} units = ${format(capacity, 1)} mL.`;

    const waiting = (message = mode === "planner" ? "See how much water to add and what units to draw." : "See the concentration and what units to draw.", isError = false) => {
      const capacity = Number.parseFloat(capacityInput.value) || 1;
      resultPanel.classList.toggle("is-error", isError);
      resultPanel.classList.remove("is-overflow", "has-calculation");
      heading.textContent = isError ? "Check your inputs" : "Enter your values";
      line.textContent = message;
      volume.textContent = "—";
      concentration.textContent = "—";
      if (concentrationMath) concentrationMath.textContent = "";
      units.textContent = "—";
      if (volumeMath) volumeMath.textContent = "";
      if (unitsMath) unitsMath.textContent = "";
      note.textContent = mode === "planner"
        ? "Suggested volume is based on your vial's peptide amount and a clean U-100 draw. Adjust it to match your vial's instructions — the math updates live."
        : "";
      if (capacityNoteElement) capacityNoteElement.textContent = capacityNote(capacity);
      readout.textContent = "— mL";
      renderScale(capacity * 100);
      fill.style.transform = "scaleX(0)";
      marker.hidden = true;
      marker.dataset.units = "";
    };

    const syncQuickChips = () => {
      tool.querySelectorAll("[data-quick-chips]").forEach((group) => {
        const input = document.getElementById(group.dataset.quickChips);
        const value = Number.parseFloat(input?.value);
        group.querySelectorAll("button[data-value]").forEach((button) => {
          const selected = Number.parseFloat(button.dataset.value) === value;
          button.classList.toggle("is-active", selected);
          button.setAttribute("aria-pressed", String(selected));
        });
      });
    };

    const update = () => {
      const totalMg = Number.parseFloat(totalInput.value);
      const enteredLiquidMl = liquidInput ? Number.parseFloat(liquidInput.value) : null;
      const amount = Number.parseFloat(amountInput.value);
      const capacity = Number.parseFloat(capacityInput.value);
      const amountMg = unitInput.value === "mcg" ? amount / 1000 : amount;
      const inputs = mode === "planner" ? [totalMg, amount, capacity] : [totalMg, enteredLiquidMl, amount, capacity];
      if (capacityNoteElement) capacityNoteElement.textContent = capacityNote(capacity);

      if (!inputs.every(Number.isFinite) || inputs.some((value) => value <= 0)) {
        waiting();
        return;
      }
      if (amountMg > totalMg) {
        waiting("The desired amount cannot exceed the total amount in the vial.", true);
        return;
      }

      const example = mode === "planner" ? bestExampleVolume(totalMg, amountMg, capacity) : null;
      if (mode === "planner" && !example) {
        waiting("No listed syringe capacity fits this example. Choose a larger U-100 syringe or compare different values.", true);
        return;
      }

      const liquidMl = example ? example.liquidMl : enteredLiquidMl;
      const mgPerMl = totalMg / liquidMl;
      const drawMl = amountMg / mgPerMl;
      const syringeUnits = drawMl * 100;
      const maxUnits = capacity * 100;
      const fits = drawMl <= capacity;
      const position = Math.min((syringeUnits / maxUnits) * 100, 100);
      renderScale(maxUnits);
      marker.hidden = false;
    resultPanel.classList.remove("is-error");
    resultPanel.classList.toggle("is-overflow", !fits);
    resultPanel.classList.toggle("has-calculation", fits);
      concentration.textContent = `${format(mgPerMl)} mg/mL`;
      if (concentrationMath) concentrationMath.textContent = `${format(totalMg)} mg ÷ ${format(liquidMl)} mL = ${format(mgPerMl)} mg/mL`;
      volume.textContent = mode === "planner" ? `${formatMl(liquidMl)} mL` : `${formatMl(drawMl)} mL`;
      if (volumeMath) volumeMath.textContent = `${format(amountMg)} mg ÷ ${format(mgPerMl)} mg/mL = ${formatMl(drawMl)} mL`;
      if (volumeLabel) volumeLabel.textContent = mode === "planner" ? "Suggested water volume" : "Liquid volume";
      units.textContent = `${format(syringeUnits, 2)} units`;
      if (unitsMath) unitsMath.textContent = `${formatMl(drawMl)} mL × 100 = ${format(syringeUnits, 2)} units`;
      readout.textContent = `${formatMl(drawMl)} mL`;
      fill.style.transform = `scaleX(${fits ? position / 100 : 1})`;
      marker.style.left = `calc(${position}% - 1px)`;
      marker.dataset.units = fits ? format(syringeUnits, 2) : "";

      if (fits) {
        heading.innerHTML = mode === "planner"
          ? `Add <strong>${formatMl(liquidMl)} mL</strong> BAC water`
          : `Draw to <strong>${format(syringeUnits, 2)} units</strong>`;
        line.innerHTML = mode === "planner"
          ? ""
          : `That is <strong>${formatMl(drawMl)} mL</strong> on the selected U-100 syringe.`;
        if (mode === "planner") line.innerHTML = `Draw to <strong>${format(syringeUnits, 2)} units</strong> on the selected U-100 syringe.`;
        note.textContent = mode === "planner"
          ? `Suggested volume is based on your vial's peptide amount and a clean U-100 draw. Adjust it to match your vial's instructions — the math updates live. Calculation: ${format(totalMg)} mg ÷ ${formatMl(liquidMl)} mL = ${format(mgPerMl)} mg/mL.`
          : "";
      } else {
        heading.textContent = "Check the printed syringe scale";
        line.textContent = `${format(syringeUnits, 2)} units exceeds the selected ${format(maxUnits, 0)}-unit scale.`;
        note.textContent = "The calculated liquid volume is larger than the syringe capacity you selected.";
      }
    };

  [totalInput, liquidInput, amountInput].filter(Boolean).forEach((input) => input.addEventListener("input", () => {
    syncQuickChips();
    update();
  }));
  tool.querySelectorAll("[data-quick-chips]").forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-value]");
      if (!button) return;
      const input = document.getElementById(group.dataset.quickChips);
      if (!input) return;
      input.value = button.dataset.value;
      syncQuickChips();
      update();
    });
  });
    unitInput.addEventListener("change", update);
    tool.querySelectorAll("[data-capacity-button]").forEach((button) => {
      button.addEventListener("click", () => {
        capacityInput.value = button.dataset.capacityButton;
        tool.querySelectorAll("[data-capacity-button]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        update();
      });
    });
    tool.closest("form")?.addEventListener("submit", (event) => event.preventDefault());
    waiting();
  });
})();
