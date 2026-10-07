/* ==========================================
   EXPENSE TRACKER
   100% OFFLINE
========================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ========================================
     STORAGE
  ======================================== */

  const EXPENSE_KEY = "offlineExpenseTracker_expenses";
  const BUDGET_KEY = "offlineExpenseTracker_budgets";
  const SETTINGS_KEY = "offlineExpenseTracker_settings";

  let expenses =
    JSON.parse(localStorage.getItem(EXPENSE_KEY)) || [];

  let budgets =
    JSON.parse(localStorage.getItem(BUDGET_KEY)) || {};

  let settings =
    JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {
      currency: "₹",
      sound: false
    };


  /* ========================================
     ELEMENTS
  ======================================== */

  const pages = document.querySelectorAll(".page");
  const navItems = document.querySelectorAll("[data-page]");

  const expenseModal =
    document.getElementById("expenseModal");

  const budgetModal =
    document.getElementById("budgetModal");

  const expenseForm =
    document.getElementById("expenseForm");

  const budgetForm =
    document.getElementById("budgetForm");


  /* ========================================
     SAVE DATA
  ======================================== */

  function saveExpenses() {
    localStorage.setItem(
      EXPENSE_KEY,
      JSON.stringify(expenses)
    );
  }

  function saveBudgets() {
    localStorage.setItem(
      BUDGET_KEY,
      JSON.stringify(budgets)
    );
  }

  function saveSettings() {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    );
  }


  /* ========================================
     CURRENCY
  ======================================== */

  function money(amount) {

    return settings.currency +
      Number(amount || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
      });

  }


  /* ========================================
     NAVIGATION
  ======================================== */

  function openPage(pageName) {

    pages.forEach(page => {
      page.classList.remove("active");
    });

    const page =
      document.getElementById(pageName);

    if (page) {
      page.classList.add("active");
    }

    navItems.forEach(item => {

      item.classList.toggle(
        "active",
        item.dataset.page === pageName
      );

    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    playSound("click");
  }


  navItems.forEach(item => {

    item.addEventListener("click", () => {

      openPage(item.dataset.page);

    });

  });


  /* ========================================
     MONTH
  ======================================== */

  function updateMonth() {

    const now = new Date();

    const month =
      now.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
      });

    document.getElementById(
      "currentMonth"
    ).textContent = month;

  }


  /* ========================================
     EXPENSE MODAL
  ======================================== */

  function openExpenseModal() {

    expenseModal.classList.add("show");

    document.body.style.overflow = "hidden";

    setTimeout(() => {

      document
        .getElementById("expenseAmount")
        ?.focus();

    }, 200);

  }


  function closeExpenseModal() {

    expenseModal.classList.remove("show");

    document.body.style.overflow = "";

  }


  document
    .getElementById("openExpenseModal")
    .addEventListener(
      "click",
      openExpenseModal
    );


  document
    .getElementById("mobileAddExpense")
    .addEventListener(
      "click",
      openExpenseModal
    );


  document
    .getElementById("closeExpenseModal")
    .addEventListener(
      "click",
      closeExpenseModal
    );


  expenseModal.addEventListener(
    "click",
    event => {

      if (event.target === expenseModal) {
        closeExpenseModal();
      }

    }
  );


  /* ========================================
     DEFAULT DATE
  ======================================== */

  function setToday() {

    const dateInput =
      document.getElementById("expenseDate");

    const today = new Date();

    const year =
      today.getFullYear();

    const month =
      String(today.getMonth() + 1)
        .padStart(2, "0");

    const day =
      String(today.getDate())
        .padStart(2, "0");

    dateInput.value =
      `${year}-${month}-${day}`;

  }


  /* ========================================
     ADD EXPENSE
  ======================================== */

  expenseForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const amount =
        Number(
          document.getElementById(
            "expenseAmount"
          ).value
        );

      const description =
        document.getElementById(
          "expenseDescription"
        ).value.trim();

      const category =
        document.getElementById(
          "expenseCategory"
        ).value;

      const date =
        document.getElementById(
          "expenseDate"
        ).value;


      if (
        !amount ||
        amount <= 0 ||
        !description ||
        !date
      ) {

        alert("Please fill all fields.");

        return;

      }


      expenses.unshift({

        id: Date.now(),

        amount,

        description,

        category,

        date

      });


      saveExpenses();

      expenseForm.reset();

      setToday();

      closeExpenseModal();

      refreshApp();

      playSound("success");

      openPage("dashboard");

    }
  );


  /* ========================================
     DELETE EXPENSE
  ======================================== */

  function deleteExpense(id) {

    const confirmed =
      confirm(
        "Delete this expense?"
      );

    if (!confirmed) return;


    expenses =
      expenses.filter(
        expense =>
          expense.id !== id
      );


    saveExpenses();

    refreshApp();

    playSound("delete");

  }


  /* ========================================
     DATE FORMAT
  ======================================== */

  function formatDate(date) {

    if (!date) return "";

    return new Date(
      date + "T00:00:00"
    ).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    );

  }


  /* ========================================
     TRANSACTION RENDER
  ======================================== */

  function transactionHTML(
    expense,
    showDelete = true
  ) {

    return `

      <div
        class="transaction"
        data-id="${expense.id}"
      >

        <div class="transaction-icon ${categoryClass(expense.category)}">
          ${categoryIcon(expense.category)}
        </div>

        <div class="transaction-info">

          <strong>
            ${escapeHTML(expense.description)}
          </strong>

          <span>
            ${escapeHTML(expense.category)}
            •
            ${formatDate(expense.date)}
          </span>

        </div>

        <div class="transaction-right">

          <strong class="expense-amount">
            -${money(expense.amount)}
          </strong>

          ${
            showDelete
              ? `
                <button
                  class="delete-transaction"
                  data-delete="${expense.id}"
                >
                  ×
                </button>
              `
              : ""
          }

        </div>

      </div>

    `;

  }


  function renderTransactions() {

    const dashboard =
      document.getElementById(
        "dashboardTransactions"
      );

    const all =
      document.getElementById(
        "allTransactions"
      );


    if (expenses.length === 0) {

      dashboard.innerHTML = emptyTransactions();

      all.innerHTML = emptyTransactions();

      return;

    }


    dashboard.innerHTML =
      expenses
        .slice(0, 5)
        .map(
          expense =>
            transactionHTML(
              expense,
              false
            )
        )
        .join("");


    renderFilteredTransactions();

  }


  function renderFilteredTransactions() {

    const container =
      document.getElementById(
        "allTransactions"
      );

    const search =
      document
        .getElementById(
          "searchTransactions"
        )
        .value
        .toLowerCase()
        .trim();

    const filter =
      document.getElementById(
        "transactionFilter"
      ).value;


    const filtered =
      expenses.filter(expense => {

        const matchesSearch =
          expense.description
            .toLowerCase()
            .includes(search);

        const matchesCategory =
          filter === "all" ||
          expense.category === filter;

        return (
          matchesSearch &&
          matchesCategory
        );

      });


    if (filtered.length === 0) {

      container.innerHTML = emptyTransactions();

      return;

    }


    container.innerHTML =
      filtered
        .map(expense =>
          transactionHTML(
            expense,
            true
          )
        )
        .join("");

  }


  function emptyTransactions() {

    return `

      <div class="empty-state">

        <div class="empty-icon">+</div>

        <strong>No transactions</strong>

        <span>
          Add your first expense.
        </span>

      </div>

    `;

  }


  /* ========================================
     DELETE BUTTON EVENTS
  ======================================== */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-delete]"
        );

      if (!button) return;

      deleteExpense(
        Number(
          button.dataset.delete
        )
      );

    }
  );


  /* ========================================
     SEARCH
  ======================================== */

  document
    .getElementById(
      "searchTransactions"
    )
    .addEventListener(
      "input",
      renderFilteredTransactions
    );


  document
    .getElementById(
      "transactionFilter"
    )
    .addEventListener(
      "change",
      renderFilteredTransactions
    );


  /* ========================================
     DASHBOARD
  ======================================== */

  function updateDashboard() {

    const total =
      expenses.reduce(
        (sum, expense) =>
          sum + Number(expense.amount),
        0
      );


    const budget =
      Number(
        budgets.Overall || 0
      );


    const remaining =
      Math.max(
        budget - total,
        0
      );


    document.getElementById(
      "totalSpent"
    ).textContent = money(total);


    document.getElementById(
      "budgetTotal"
    ).textContent = money(budget);


    document.getElementById(
      "transactionCount"
    ).textContent =
      expenses.length;


    document.getElementById(
      "remainingBudget"
    ).textContent =
      money(remaining);


    document.getElementById(
      "budgetNote"
    ).textContent =
      budget
        ? "Overall budget"
        : "No budget set";


    document.getElementById(
      "remainingNote"
    ).textContent =
      budget
        ? "Available"
        : "Set a budget to track";


    document.getElementById(
      "chartTotal"
    ).textContent =
      money(total);

  }


  /* ========================================
     CATEGORY DATA
  ======================================== */

  function getCategoryTotals() {

    const totals = {};

    expenses.forEach(expense => {

      if (!totals[expense.category]) {
        totals[expense.category] = 0;
      }

      totals[expense.category] +=
        Number(expense.amount);

    });

    return totals;

  }


  /* ========================================
     CATEGORY LIST
  ======================================== */

  function renderCategories() {

    const container =
      document.getElementById(
        "categoryList"
      );

    const totals =
      getCategoryTotals();

    const entries =
      Object.entries(totals)
        .sort(
          (a, b) =>
            b[1] - a[1]
        );


    if (entries.length === 0) {

      container.innerHTML =
        `<div class="empty-small">
          No expenses yet.
        </div>`;

      return;

    }


    const total =
      entries.reduce(
        (sum, [, value]) =>
          sum + value,
        0
      );


    container.innerHTML =
      entries
        .map(
          ([category, amount], index) => {

            const percentage =
              total
                ? (amount / total) * 100
                : 0;


            return `

              <div
                class="category-row"
                style="animation-delay:${index * 70}ms"
              >

                <div class="category-top">

                  <span class="category-name">
                    ${category}
                  </span>

                  <span class="category-amount">
                    ${money(amount)}
                  </span>

                </div>

                <div class="progress">

                  <div
                    class="progress-fill ${categoryClass(category)}"
                    style="width:0%"
                    data-width="${percentage}%"
                  ></div>

                </div>

              </div>

            `;

          }
        )
        .join("");


    requestAnimationFrame(() => {

      document
        .querySelectorAll(
          "#categoryList .progress-fill"
        )
        .forEach(bar => {

          setTimeout(() => {

            bar.style.width =
              bar.dataset.width;

          }, 100);

        });

    });

  }


  /* ========================================
     ANALYTICS
  ======================================== */

  function updateAnalytics() {

    const total =
      expenses.reduce(
        (sum, expense) =>
          sum + Number(expense.amount),
        0
      );


    const average =
      expenses.length
        ? total / expenses.length
        : 0;


    const largest =
      expenses.length
        ? Math.max(
            ...expenses.map(
              expense =>
                Number(expense.amount)
            )
          )
        : 0;


    document.getElementById(
      "analyticsTotal"
    ).textContent = money(total);


    document.getElementById(
      "averageExpense"
    ).textContent = money(average);


    document.getElementById(
      "largestExpense"
    ).textContent = money(largest);


    renderAnalyticsCategories();

  }


  function renderAnalyticsCategories() {

    const container =
      document.getElementById(
        "analyticsCategories"
      );

    const totals =
      getCategoryTotals();


    const entries =
      Object.entries(totals)
        .sort(
          (a, b) =>
            b[1] - a[1]
        );


    if (entries.length === 0) {

      container.innerHTML = `

        <div class="empty-state compact">

          <strong>No data yet</strong>

          <span>
            Add expenses to generate analytics.
          </span>

        </div>

      `;

      return;

    }


    const total =
      entries.reduce(
        (sum, [, value]) =>
          sum + value,
        0
      );


    container.innerHTML =
      entries
        .map(
          ([category, amount]) => {

            const percent =
              (amount / total) * 100;


            return `

              <div class="category-row">

                <div class="category-top">

                  <span class="category-name">
                    ${category}
                  </span>

                  <span class="category-amount">
                    ${money(amount)}
                    · ${percent.toFixed(0)}%
                  </span>

                </div>

                <div class="progress">

                  <div
                    class="progress-fill ${categoryClass(category)}"
                    style="width:0%"
                    data-width="${percent}%"
                  ></div>

                </div>

              </div>

            `;

          }
        )
        .join("");


    setTimeout(() => {

      container
        .querySelectorAll(
          ".progress-fill"
        )
        .forEach(bar => {

          bar.style.width =
            bar.dataset.width;

        });

    }, 100);

  }


  /* ========================================
     SPENDING GRAPH
  ======================================== */

  function getLast7Days() {

    const days = [];

    for (let i = 6; i >= 0; i--) {

      const date = new Date();

      date.setHours(0, 0, 0, 0);

      date.setDate(
        date.getDate() - i
      );

      const key =
        date.toISOString()
          .split("T")[0];

      days.push({
        key,
        label:
          date.toLocaleDateString(
            "en-IN",
            {
              weekday: "short"
            }
          ),
        amount: 0
      });

    }

    expenses.forEach(expense => {

      const day =
        days.find(
          d =>
            d.key === expense.date
        );

      if (day) {

        day.amount +=
          Number(expense.amount);

      }

    });

    return days;

  }


  function drawChart(
    canvas,
    data,
    emptyElement
  ) {

    const ctx =
      canvas.getContext("2d");

    const rect =
      canvas.getBoundingClientRect();


    const dpr =
      window.devicePixelRatio || 1;


    canvas.width =
      rect.width * dpr;

    canvas.height =
      rect.height * dpr;


    ctx.scale(dpr, dpr);


    const width =
      rect.width;

    const height =
      rect.height;


    const padding = {
      top: 20,
      right: 12,
      bottom: 32,
      left: 42
    };


    const chartWidth =
      width -
      padding.left -
      padding.right;


    const chartHeight =
      height -
      padding.top -
      padding.bottom;


    const max =
      Math.max(
        ...data.map(
          item => item.amount
        ),
        1
      );


    const hasData =
      data.some(
        item => item.amount > 0
      );


    emptyElement.classList.toggle(
      "hidden",
      hasData
    );


    if (!hasData) return;


    /* animation */

    let progress = 0;

    function animate() {

      progress += 0.035;

      if (progress > 1) {
        progress = 1;
      }


      ctx.clearRect(
        0,
        0,
        width,
        height
      );


      /* grid */

      ctx.strokeStyle =
        "#eeeeeb";

      ctx.lineWidth = 1;


      for (let i = 0; i < 4; i++) {

        const y =
          padding.top +
          chartHeight -
          (chartHeight / 3) * i;


        ctx.beginPath();

        ctx.moveTo(
          padding.left,
          y
        );

        ctx.lineTo(
          width - padding.right,
          y
        );

        ctx.stroke();

      }


      /* line */

      const points =
        data.map(
          (item, index) => {

            const x =
              padding.left +
              (chartWidth /
                (data.length - 1)) *
                index;


            const targetY =
              padding.top +
              chartHeight -
              (item.amount / max) *
                chartHeight;


            const y =
              padding.top +
              chartHeight -
              (
                chartHeight -
                (
                  targetY -
                  (
                    padding.top +
                    chartHeight
                  )
                )
              ) *
                progress;


            return {
              x,
              y
            };

          }
        );


      /* area */

      ctx.beginPath();

      points.forEach(
        (point, index) => {

          if (index === 0) {

            ctx.moveTo(
              point.x,
              point.y
            );

          } else {

            ctx.lineTo(
              point.x,
              point.y
            );

          }

        }
      );


      ctx.lineTo(
        points[points.length - 1].x,
        padding.top + chartHeight
      );

      ctx.lineTo(
        points[0].x,
        padding.top + chartHeight
      );

      ctx.closePath();


      const gradient =
        ctx.createLinearGradient(
          0,
          padding.top,
          0,
          height
        );

      gradient.addColorStop(
        0,
        "rgba(255,107,44,.18)"
      );

      gradient.addColorStop(
        1,
        "rgba(255,107,44,0)"
      );


      ctx.fillStyle =
        gradient;

      ctx.fill();


      /* line */

      ctx.beginPath();

      points.forEach(
        (point, index) => {

          if (index === 0) {

            ctx.moveTo(
              point.x,
              point.y
            );

          } else {

            ctx.lineTo(
              point.x,
              point.y
            );

          }

        }
      );


      ctx.strokeStyle =
        "#ff6b2c";

      ctx.lineWidth = 3;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.stroke();


      /* points */

      points.forEach(point => {

        ctx.beginPath();

        ctx.arc(
          point.x,
          point.y,
          4,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          "#ffffff";

        ctx.fill();

        ctx.strokeStyle =
          "#ff6b2c";

        ctx.lineWidth = 2;

        ctx.stroke();

      });


      /* labels */

      ctx.fillStyle =
        "#999";

      ctx.font =
        "11px Inter, sans-serif";

      ctx.textAlign =
        "center";


      data.forEach(
        (item, index) => {

          const x =
            padding.left +
            (chartWidth /
              (data.length - 1)) *
              index;


          ctx.fillText(
            item.label,
            x,
            height - 10
          );

        }
      );


      if (progress < 1) {

        requestAnimationFrame(
          animate
        );

      }

    }


    animate();

  }


  function renderCharts() {

    const data =
      getLast7Days();


    drawChart(
      document.getElementById(
        "spendingChart"
      ),
      data,
      document.getElementById(
        "chartEmpty"
      )
    );


    drawChart(
      document.getElementById(
        "analyticsChart"
      ),
      data,
      document.getElementById(
        "analyticsEmpty"
      )
    );

  }


  /* ========================================
     BUDGETS
  ======================================== */

  function renderBudgets() {

    const container =
      document.getElementById(
        "budgetList"
      );


    const entries =
      Object.entries(budgets);


    const totalBudget =
      entries.reduce(
        (sum, [, amount]) =>
          sum + Number(amount),
        0
      );


    const overallSpent =
      expenses.reduce(
        (sum, expense) =>
          sum + Number(expense.amount),
        0
      );


    document.getElementById(
      "budgetsTotal"
    ).textContent =
      money(totalBudget);


    document.getElementById(
      "budgetsSpent"
    ).textContent =
      money(overallSpent);


    document.getElementById(
      "budgetsRemaining"
    ).textContent =
      money(
        Math.max(
          totalBudget - overallSpent,
          0
        )
      );


    if (entries.length === 0) {

      container.innerHTML = `

        <div class="empty-state">

          <div class="empty-icon">+</div>

          <strong>No budgets</strong>

          <span>
            Create a budget to start tracking limits.
          </span>

        </div>

      `;

      return;

    }


    container.innerHTML =
      entries
        .map(
          ([category, limit]) => {

            const spent =
              category === "Overall"

                ? overallSpent

                : expenses
                    .filter(
                      expense =>
                        expense.category ===
                        category
                    )
                    .reduce(
                      (
                        sum,
                        expense
                      ) =>
                        sum +
                        Number(
                          expense.amount
                        ),
                      0
                    );


            const percent =
              limit
                ? Math.min(
                    (spent / limit) *
                      100,
                    100
                  )
                : 0;


            return `

              <div class="budget-card">

                <div class="budget-card-top">

                  <div>
                    <h3>
                      ${category}
                    </h3>

                    <small>
                      ${percent.toFixed(0)}% used
                    </small>
                  </div>

                  <button
                    class="delete-transaction"
                    data-budget-delete="${category}"
                  >
                    ×
                  </button>

                </div>


                <div class="budget-numbers">

                  <strong>
                    ${money(spent)}
                  </strong>

                  <span>
                    of ${money(limit)}
                  </span>

                </div>


                <div class="progress">

                  <div
                    class="progress-fill ${
                      percent >= 90
                        ? "orange"
                        : "green"
                    }"
                    style="width:0%"
                    data-width="${percent}%"
                  ></div>

                </div>

              </div>

            `;

          }
        )
        .join("");


    setTimeout(() => {

      container
        .querySelectorAll(
          ".progress-fill"
        )
        .forEach(bar => {

          bar.style.width =
            bar.dataset.width;

        });

    }, 100);

  }


  /* ========================================
     BUDGET MODAL
  ======================================== */

  document
    .getElementById("addBudgetBtn")
    .addEventListener(
      "click",
      () => {

        budgetModal.classList.add("show");

        document.body.style.overflow =
          "hidden";

      }
    );


  document
    .getElementById("closeBudgetModal")
    .addEventListener(
      "click",
      () => {

        budgetModal.classList.remove(
          "show"
        );

        document.body.style.overflow =
          "";

      }
    );


  budgetModal.addEventListener(
    "click",
    event => {

      if (event.target === budgetModal) {

        budgetModal.classList.remove(
          "show"
        );

        document.body.style.overflow =
          "";

      }

    }
  );


  budgetForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const category =
        document.getElementById(
          "budgetCategory"
        ).value;


      const amount =
        Number(
          document.getElementById(
            "budgetAmount"
          ).value
        );


      if (!amount || amount <= 0) {

        alert(
          "Enter a valid budget."
        );

        return;

      }


      budgets[category] =
        amount;


      saveBudgets();


      budgetForm.reset();


      budgetModal.classList.remove(
        "show"
      );

      document.body.style.overflow =
        "";


      refreshApp();

      playSound("success");

    }
  );


  /* ========================================
     DELETE BUDGET
  ======================================== */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-budget-delete]"
        );

      if (!button) return;


      const category =
        button.dataset.budgetDelete;


      delete budgets[category];

      saveBudgets();

      refreshApp();

    }
  );


  /* ========================================
     SETTINGS
  ======================================== */

  const currencySetting =
    document.getElementById(
      "currencySetting"
    );


  currencySetting.value =
    settings.currency;


  currencySetting.addEventListener(
    "change",
    () => {

      settings.currency =
        currencySetting.value;

      saveSettings();

      updateCurrencySymbols();

      refreshApp();

    }
  );


  const soundToggle =
    document.getElementById(
      "soundToggle"
    );


  soundToggle.checked =
    settings.sound;


  soundToggle.addEventListener(
    "change",
    () => {

      settings.sound =
        soundToggle.checked;

      saveSettings();

    }
  );


  /* ========================================
     RESET APP
  ======================================== */

  document
    .getElementById("resetApp")
    .addEventListener(
      "click",
      () => {

        const confirmed =
          confirm(
            "This will permanently delete all local expenses and budgets. Continue?"
          );


        if (!confirmed) return;


        expenses = [];

        budgets = {};


        saveExpenses();
        saveBudgets();


        refreshApp();

      }
    );


  /* ========================================
     CURRENCY SYMBOLS
  ======================================== */

  function updateCurrencySymbols() {

    document.getElementById(
      "currencySymbol"
    ).textContent =
      settings.currency;


    document.getElementById(
      "budgetCurrencySymbol"
    ).textContent =
      settings.currency;

  }


  /* ========================================
     CATEGORY HELPERS
  ======================================== */

  function categoryClass(category) {

    const classes = {

      Food: "orange",

      Transport: "blue",

      Shopping: "purple",

      Entertainment: "green",

      Bills: "blue",

      Other: "orange"

    };


    return classes[category] ||
      "orange";

  }


  function categoryIcon(category) {

    const icons = {

      Food: "🍴",

      Transport: "⌁",

      Shopping: "□",

      Entertainment: "◉",

      Bills: "▤",

      Other: "●"

    };


    return icons[category] ||
      "●";

  }


  /* ========================================
     SECURITY
  ======================================== */

  function escapeHTML(value) {

    const div =
      document.createElement(
        "div"
      );

    div.textContent =
      value;

    return div.innerHTML;

  }


  /* ========================================
     SOUND
  ======================================== */

  let audioContext = null;


  function playSound(type) {

    if (!settings.sound) return;


    try {

      if (!audioContext) {

        audioContext =
          new (
            window.AudioContext ||
            window.webkitAudioContext
          )();

      }


      const oscillator =
        audioContext.createOscillator();

      const gain =
        audioContext.createGain();


      oscillator.connect(gain);

      gain.connect(
        audioContext.destination
      );


      const frequencies = {

        click: 500,

        success: 700,

        delete: 250

      };


      oscillator.frequency.value =
        frequencies[type] || 500;


      gain.gain.setValueAtTime(
        .035,
        audioContext.currentTime
      );


      gain.gain.exponentialRampToValueAtTime(
        .001,
        audioContext.currentTime + .08
      );


      oscillator.start();

      oscillator.stop(
        audioContext.currentTime + .08
      );

    } catch (error) {

      // Sound is optional.

    }

  }


  /* ========================================
     REFRESH EVERYTHING
  ======================================== */

  function refreshApp() {

    updateMonth();

    updateCurrencySymbols();

    updateDashboard();

    renderTransactions();

    renderCategories();

    updateAnalytics();

    renderCharts();

    renderBudgets();

  }


  /* ========================================
     RESIZE GRAPH
  ======================================== */

  window.addEventListener(
    "resize",
    () => {

      renderCharts();

    }
  );


  /* ========================================
     ESCAPE KEY
  ======================================== */

  document.addEventListener(
    "keydown",
    event => {

      if (event.key !== "Escape") {
        return;
      }


      expenseModal.classList.remove(
        "show"
      );

      budgetModal.classList.remove(
        "show"
      );

      document.body.style.overflow =
        "";

    }
  );


  /* ========================================
     START APP
  ======================================== */

  setToday();

  updateMonth();

  refreshApp();

  console.log(
    "Expense Tracker running completely offline."
  );

});
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("Spendly offline mode enabled"))
      .catch(error => console.error("Service Worker error:", error));
  });
}
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("Spendly offline mode enabled"))
      .catch(error => console.error("Service Worker error:", error));
  });
}