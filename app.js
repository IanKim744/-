(function () {
  const displayEl = document.getElementById("display");
  const expressionEl = document.getElementById("expression");
  const keysEl = document.getElementById("keys");

  let current = "0";
  let stored = null;
  let pendingOp = null;
  let fresh = true;

  function formatNumber(n) {
    if (!Number.isFinite(n)) return "오류";
    const s = String(n);
    if (s.includes("e")) return s;
    const [intPart, frac = ""] = s.split(".");
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return frac ? `${withCommas}.${frac}` : withCommas;
  }

  function updateView() {
    const num = parseFloat(current);
    displayEl.textContent = Number.isFinite(num) ? formatNumber(num) : current;
    if (stored !== null && pendingOp) {
      const opSymbol = { "+": "+", "-": "−", "*": "×", "/": "÷" }[pendingOp] || pendingOp;
      expressionEl.textContent = `${formatNumber(stored)} ${opSymbol}`;
    } else {
      expressionEl.textContent = "";
    }
  }

  function resetAll() {
    current = "0";
    stored = null;
    pendingOp = null;
    fresh = true;
    updateView();
  }

  function applyPercent() {
    const n = parseFloat(current);
    if (!Number.isFinite(n)) return;
    current = String(n / 100);
    fresh = true;
    updateView();
  }

  function deleteLast() {
    if (fresh) return;
    if (current.length <= 1) {
      current = "0";
      fresh = true;
    } else {
      current = current.slice(0, -1);
    }
    updateView();
  }

  function inputDigit(d) {
    if (fresh) {
      current = d === "0" ? "0" : d;
      fresh = false;
    } else if (current === "0" && d !== "0") {
      current = d;
    } else if (current === "0" && d === "0") {
      return;
    } else if (current.replace(".", "").length >= 14) {
      return;
    } else {
      current += d;
    }
    updateView();
  }

  function inputDecimal() {
    if (fresh) {
      current = "0.";
      fresh = false;
      updateView();
      return;
    }
    if (!current.includes(".")) {
      current += ".";
      updateView();
    }
  }

  function operate(a, b, op) {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  }

  function commitPending() {
    if (stored === null || !pendingOp) return;
    const a = stored;
    const b = parseFloat(current);
    const result = operate(a, b, pendingOp);
    stored = null;
    pendingOp = null;
    if (!Number.isFinite(result)) {
      current = "0으로 나눌 수 없음";
      fresh = true;
    } else {
      current = String(result);
      fresh = true;
    }
    updateView();
  }

  function setOperator(op) {
    const n = parseFloat(current);
    if (!Number.isFinite(n) && current !== "0") return;

    if (stored === null) {
      stored = n;
    } else if (!fresh && pendingOp) {
      const result = operate(stored, n, pendingOp);
      if (!Number.isFinite(result)) {
        current = "0으로 나눌 수 없음";
        stored = null;
        pendingOp = null;
        fresh = true;
        updateView();
        return;
      }
      stored = result;
    } else if (pendingOp) {
      stored = n;
    }

    pendingOp = op;
    fresh = true;
    updateView();
  }

  function onKeyClick(e) {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;

    if (current === "0으로 나눌 수 없음" && action !== "clear") {
      return;
    }

    switch (action) {
      case "digit":
        inputDigit(btn.dataset.value);
        break;
      case "decimal":
        inputDecimal();
        break;
      case "operator":
        setOperator(btn.dataset.value);
        break;
      case "equals":
        commitPending();
        break;
      case "clear":
        resetAll();
        break;
      case "delete":
        deleteLast();
        break;
      case "percent":
        applyPercent();
        break;
      default:
        break;
    }
  }

  function mapKeyboard(key) {
    if (/^\d$/.test(key)) return { type: "digit", value: key };
    if (key === ".") return { type: "decimal" };
    if (key === "+" || key === "-") return { type: "operator", value: key };
    if (key === "*") return { type: "operator", value: "*" };
    if (key === "/") return { type: "operator", value: "/" };
    if (key === "Enter" || key === "=") return { type: "equals" };
    if (key === "Escape" || key === "c" || key === "C") return { type: "clear" };
    if (key === "Backspace") return { type: "delete" };
    if (key === "%") return { type: "percent" };
    return null;
  }

  function pulseButton(selector) {
    const el = keysEl.querySelector(selector);
    if (!el) return;
    el.animate([{ transform: "scale(1)" }, { transform: "scale(0.94)" }, { transform: "scale(1)" }], {
      duration: 120,
      easing: "ease-out",
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    const mapped = mapKeyboard(e.key);
    if (!mapped) return;
    e.preventDefault();

    if (current === "0으로 나눌 수 없음" && mapped.type !== "clear") return;

    switch (mapped.type) {
      case "digit":
        pulseButton(`[data-action="digit"][data-value="${mapped.value}"]`);
        inputDigit(mapped.value);
        break;
      case "decimal":
        pulseButton('[data-action="decimal"]');
        inputDecimal();
        break;
      case "operator":
        pulseButton(`[data-action="operator"][data-value="${CSS.escape(mapped.value)}"]`);
        setOperator(mapped.value);
        break;
      case "equals":
        pulseButton('[data-action="equals"]');
        commitPending();
        break;
      case "clear":
        pulseButton('[data-action="clear"]');
        resetAll();
        break;
      case "delete":
        pulseButton('[data-action="delete"]');
        deleteLast();
        break;
      case "percent":
        pulseButton('[data-action="percent"]');
        applyPercent();
        break;
      default:
        break;
    }
  });

  keysEl.addEventListener("click", onKeyClick);
  updateView();
})();
