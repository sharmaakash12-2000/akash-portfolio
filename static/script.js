document.addEventListener("DOMContentLoaded", () => {

// 🧠 TYPE FUNCTION
function typeLine(element, text, speed = 15) {
  return new Promise((resolve) => {
    let i = 0;

    function typing() {
      if (i < text.length) {
        element.innerHTML += text.charAt(i);
        i++;
        setTimeout(typing, speed);
      } else {
        resolve();
      }
    }

    typing();
  });
}

// 🚀 LINE BY LINE FUNCTION
async function typeLines(element, lines) {
  for (let line of lines) {
    await typeLine(element, line);
    element.innerHTML += "<br>";
    await new Promise(r => setTimeout(r, 300));
  }
}

  /* ===== ELEMENTS ===== */
  const popup   = document.getElementById("visitorPopup");
  const terminal = document.getElementById("terminal");
  const output  = document.getElementById("terminal-output");
  const input   = document.getElementById("commandInput");

  const vName    = document.getElementById("vName");
  const vEmail   = document.getElementById("vEmail");
  const vPurpose = document.getElementById("vPurpose");

  let verified = false;

  /* ===== INITIAL STATE ===== */
  popup.classList.add("hidden");
  terminal.classList.add("hidden");

  const visited = localStorage.getItem("visited");
  const storedName = localStorage.getItem("visitorName");

  if (visited && storedName) {
    startTerminal(storedName);
  } else {
    popup.classList.remove("hidden");
  }

  /* ================= OTP SEND ================= */
  window.sendOTP = async function (event) {

  const email = vEmail.value.trim();

  if (!email || !email.includes("@")) {
    alert("Enter valid email");
    return;
  }

  const btn = event.target;
  btn.disabled = true;

  const statusEl = document.getElementById("status");
  statusEl.innerText = "Sending OTP...";

  try {
    const res = await fetch("/send-otp", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ email: email })
    });

    const data = await res.json();

    console.log("Backend Response:", data); // 🔥 DEBUG

    if (data.status === "success") {
      statusEl.innerText = "OTP sent 📧";
    } else {
      statusEl.innerText = "Failed to send OTP ❌";
      btn.disabled = false;
    }

  } catch (error) {
    console.log("Error:", error); // 🔥 DEBUG
    statusEl.innerText = "Server error ❌";
    btn.disabled = false;
  }
};

  /* ================= OTP VERIFY ================= */
  window.verifyOTP = function () {
    const otp = document.getElementById("otp").value;

    if (!otp) {
      alert("Enter OTP");
      return;
    }

    document.getElementById("status").innerText = "Verifying...";

    fetch("/verify-otp", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({otp: otp})
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        verified = true;
        document.getElementById("status").innerText = "Verified ✅";
        document.getElementById("enterBtn").style.display = "block";
      } else {
        document.getElementById("status").innerText = "Wrong OTP ❌";
      }
    })
    .catch(() => {
      document.getElementById("status").innerText = "Verification error ❌";
    });
  };

  /* ================= ENTER ================= */
  window.enterPortfolio = function () {

    if (!verified) {
      alert("Please verify your email first!");
      return;
    }

    const name = vName.value.trim();
    const email = vEmail.value.trim();
    const purpose = vPurpose.value;

    if (!name || !email || !purpose) {
      alert("Fill all fields");
      return;
    }

    localStorage.setItem("visited", "yes");
    localStorage.setItem("visitorName", name);

    fetch("/visit", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({name, email, purpose})
    }).catch(() => {});

    startTerminal(name);
  };

  /* ================= TERMINAL ================= */
  async function startTerminal(name) {
  popup.classList.add("hidden");
  terminal.classList.remove("hidden");

  output.innerHTML = `
  <span class="welcome-text">
    Welcome <span class="user-name">${name || "Guest"}</span>
  </span><br>
  `;

  const lines = [
    "🚀 You are now inside Akash Sharma's Portfolio",
    "💻 This portfolio works like a command terminal",
    "👉 Type commands below and press ENTER",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "📌 HOW TO USE:",
    "",
    "1️⃣ Type help → See all commands",
    "2️⃣ Type about → About me",
    "3️⃣ Type projects → My work",
    "4️⃣ Type contact → Contact info",
    "5️⃣ Type resume → Download resume",
    "6️⃣ Type clear → Clear screen",
    "7️⃣ Type hire → Work with me",
  
    "",
    "⚡ Use ↑ ↓ arrow keys for command history",
    "",
    "👉 Start with: help",
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "✨ Built with Python | Flask | SQL | Power BI | Excel |",
    "",
    ">_"
  ];

  await typeLines(output, lines);

  input.focus();
}

  /* ===== COMMAND SYSTEM ===== */
  const commands = [
    "help","about","whoami","projects",
    "open github","open linkedin",
    "contact","resume","logout","reset","clear"
  ];

  let history = [];
  let historyIndex = -1;

  input.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {
      const cmd = input.value.trim().toLowerCase();
      if (!cmd) return;

      history.push(cmd);
      historyIndex = history.length;
      input.value = "";

      runCommand(cmd);
    }

    if (e.key === "ArrowUp") {
      if (historyIndex > 0) {
        historyIndex--;
        input.value = history[historyIndex];
      }
    }

    if (e.key === "ArrowDown") {
      if (historyIndex < history.length - 1) {
        historyIndex++;
        input.value = history[historyIndex];
      } else {
        input.value = "";
      }
    }

  });

  /* ===== COMMAND ENGINE ===== */
  function runCommand(cmd) {

    output.innerHTML += `<br>&gt; ${cmd}<br>`;

    switch (cmd) {

      case "help":
        output.innerHTML += `about | projects | contact | resume | hire | clear`;
        break;

      case "hire":
      case "work":
        output.innerHTML += `
      💼 WORK WITH ME

      I am available for freelance projects and custom work.

      ✔️ Data Cleaning (Excel, Pandas)
      ✔️ Data Analysis & Insights
      ✔️ Dashboard (Power BI / Streamlit)
      ✔️ Python Automation
      ✔️ Web Apps (Flask)
      ✔️ Custom Tools

      📊 Have messy data? I can clean and transform it.

      📩 Contact: srmaakku123@gmail.com
                  7881107910
      `;
        break;

      case "about":
      case "whoami":
        output.innerHTML += `
      Akash Sharma | Data Analyst

      I specialize in transforming raw data into meaningful insights.
      Skilled in Python, SQL, Excel, and Power BI, I build data-driven solutions
      that help businesses make smarter decisions.

      Focused on problem-solving, automation, and real-world analytics.
        `;
        break;

      case "projects":
        output.innerHTML += `
      Type:
      open github   → View my projects
      open linkedin → View my profile
      `;
        break;

      case "open github":
        window.open("https://github.com/sharmaakash12-2000","_blank");
        break;

      case "open linkedin":
        window.open("https://www.linkedin.com/in/akash-sharma-93ba49242/","_blank");
        break;

      case "contact":
        output.innerHTML += `Email: srmaakku123@gmail.com`;
        output.innerHTML += ` & whatsapp: 7881107910`;
        break;

      case "resume":
        window.open("/static/assets/resume.pdf","_blank");
        break;

      case "logout":
      case "reset":
        localStorage.clear();
        location.reload();
        break;

      case "clear":
        output.innerHTML = "";
        break;

      default:
        output.innerHTML += "Command not found";
    }

    output.scrollTop = output.scrollHeight;
  }

});