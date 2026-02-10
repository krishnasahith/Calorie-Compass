const tabs = document.querySelectorAll(".tab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const otpForm = document.getElementById("otpForm");

function setActive(tabName) {
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });
  loginForm.style.display = tabName === "login" ? "block" : "none";
  registerForm.style.display = tabName === "register" ? "block" : "none";
  otpForm.style.display = tabName === "otp" ? "block" : "none";
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setActive(tab.dataset.tab));
});

async function api(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.getElementById("loginError");
  error.textContent = "";
  try {
    await api("/api/auth/login", {
      email: document.getElementById("loginEmail").value,
      password: document.getElementById("loginPassword").value
    });
    window.location.href = "/app";
  } catch (err) {
    error.textContent = err.message;
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.getElementById("registerError");
  error.textContent = "";
  try {
    await api("/api/auth/register", {
      name: document.getElementById("registerName").value,
      email: document.getElementById("registerEmail").value,
      phone: document.getElementById("registerPhone").value,
      password: document.getElementById("registerPassword").value
    });
    window.location.href = "/app";
  } catch (err) {
    error.textContent = err.message;
  }
});

const otpStatus = document.getElementById("otpStatus");
const otpError = document.getElementById("otpError");

document.getElementById("sendOtp").addEventListener("click", async () => {
  otpStatus.textContent = "";
  otpError.textContent = "";
  try {
    await api("/api/auth/request-otp", {
      contact: document.getElementById("otpContact").value
    });
    otpStatus.textContent = "OTP sent. Check your inbox or messages.";
  } catch (err) {
    otpError.textContent = err.message;
  }
});

otpForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  otpStatus.textContent = "";
  otpError.textContent = "";
  try {
    await api("/api/auth/verify-otp", {
      contact: document.getElementById("otpContact").value,
      code: document.getElementById("otpCode").value
    });
    window.location.href = "/app";
  } catch (err) {
    otpError.textContent = err.message;
  }
});
