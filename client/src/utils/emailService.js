export const EMAILJS_CONFIG = {
  publicKey: "AJhBewuHl2OhJk_lO",
  serviceId: "service_q7146uv",
  templateId: "template_w037g2e",
};

export const isEmailJSConfigured = () =>
  !EMAILJS_CONFIG.publicKey.startsWith("YOUR_") &&
  !EMAILJS_CONFIG.serviceId.startsWith("YOUR_") &&
  !EMAILJS_CONFIG.templateId.startsWith("YOUR_");

/**
 * Sends a registration email using EmailJS HTTP API
 */
export async function sendRegistrationEmail({ toName, toEmail, role, department, tempPassword }) {
  if (!isEmailJSConfigured()) {
    console.warn("[LabGuard EmailJS] Not configured — email simulated.");
    console.table({ to: toEmail, toName, role, department, tempPassword });
    await new Promise(r => setTimeout(r, 700));
    return { success: true, message: "Email simulated (EmailJS keys not set)" };
  }

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.serviceId,
        template_id: EMAILJS_CONFIG.templateId,
        user_id: EMAILJS_CONFIG.publicKey,
        template_params: {
          to_name: toName,
          to_email: toEmail,
          user_email: toEmail,
          user_role: role,
          user_department: department,
          temp_password: tempPassword,
          login_url: window.location.origin + "/login",
          from_name: "LabGuard — Al Hussein Technical University",
        },
      }),
    });

    if (res.status === 200) {
      return { success: true, message: `Email sent to ${toEmail}` };
    }

    const text = await res.text().catch(() => res.statusText);
    return { success: false, message: `EmailJS error ${res.status}: ${text}` };

  } catch (err) {
    console.error("[LabGuard EmailJS] Fetch failed:", err);
    return { success: false, message: err.message || "Network error — check your connection." };
  }
}
