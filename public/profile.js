function formatNumber(value, digits = 1) {
  return Number(value).toFixed(digits).replace(/\.0+$/, "");
}

async function loadProfile() {
  const parts = window.location.pathname.split("/");
  const userId = parts[parts.length - 1];
  const res = await fetch(`/api/public-profile/${userId}`);
  const data = await res.json();

  if (!res.ok) {
    document.getElementById("publicContent").innerHTML = `<div class="small">Profile not found.</div>`;
    return;
  }

  document.getElementById("publicName").textContent = data.name || "Public Profile";
  document.getElementById("publicUpdated").textContent = data.updated_at
    ? `Updated: ${data.updated_at}`
    : "";

  const avatar = document.getElementById("publicAvatar");
  const avatarLabel = document.getElementById("publicAvatarLabel");
  if (data.avatar) {
    avatar.src = data.avatar;
    avatar.style.display = "block";
    avatarLabel.textContent = "Profile photo";
  } else {
    avatar.style.display = "none";
    avatarLabel.textContent = "";
  }

  const items = [];
  if (data.email) items.push(`Email: ${data.email}`);
  if (data.phone) items.push(`Phone: ${data.phone}`);
  if (data.height_cm) items.push(`Height: ${formatNumber(data.height_cm, 0)} cm`);
  if (data.current_weight_kg) items.push(`Weight: ${formatNumber(data.current_weight_kg, 1)} kg`);
  if (data.bmi) items.push(`BMI: ${formatNumber(data.bmi, 1)}`);
  if (data.activity_level) items.push(`Activity: ${data.activity_level}`);
  if (data.goal) {
    const goalLine = data.goal_weight_kg
      ? `${data.goal} to ${formatNumber(data.goal_weight_kg, 1)} kg`
      : data.goal;
    items.push(`Goal: ${goalLine}`);
  }
  if (data.measurements) {
    const m = data.measurements;
    const parts = [];
    if (m.waist_cm) parts.push(`Waist ${formatNumber(m.waist_cm, 1)} cm`);
    if (m.chest_cm) parts.push(`Chest ${formatNumber(m.chest_cm, 1)} cm`);
    if (m.hip_cm) parts.push(`Hip ${formatNumber(m.hip_cm, 1)} cm`);
    if (m.thigh_cm) parts.push(`Thigh ${formatNumber(m.thigh_cm, 1)} cm`);
    if (m.arm_cm) parts.push(`Arm ${formatNumber(m.arm_cm, 1)} cm`);
    if (m.neck_cm) parts.push(`Neck ${formatNumber(m.neck_cm, 1)} cm`);
    if (parts.length) items.push(`Measurements: ${parts.join(", ")}`);
  }

  document.getElementById("publicContent").innerHTML = items.length
    ? items.map((item) => `<div class="entry">${item}</div>`).join("")
    : `<div class="small">This profile is private.</div>`;
}

loadProfile();
