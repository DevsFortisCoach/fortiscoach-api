export function buildTestMailTemplate(input: {
  recipientName?: string;
  serviceName?: string;
}) {
  const recipientName = input.recipientName?.trim() || "Hola";
  const serviceName = input.serviceName?.trim() || "GymFlow Backend";

  const html = `
    <div style="background:#0a0a0a;padding:32px 20px;font-family:Arial,sans-serif;color:#f5f5f5;">
      <div style="max-width:560px;margin:0 auto;border:1px solid rgba(168,85,247,0.25);border-radius:20px;padding:28px;background:#171717;">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#c084fc;">Correo de prueba</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;">Conexión SMTP operativa</h1>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#d4d4d4;">${recipientName}, este correo confirma que ${serviceName} logró enviar correctamente usando Nodemailer y Brevo.</p>
      </div>
    </div>
  `.trim();

  const text = `${recipientName}, este correo confirma que ${serviceName} logró enviar correctamente usando Nodemailer y Brevo.`;

  return { html, text };
}

export function buildAccessCredentialsTemplate(input: {
  recipientName?: string;
  gymName?: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}) {
  const recipientName = input.recipientName?.trim() || "Hola";
  const gymName = input.gymName?.trim() || "tu gimnasio";

  const html = `
    <div style="background:#0a0a0a;padding:32px 20px;font-family:Arial,sans-serif;color:#f5f5f5;">
      <div style="max-width:560px;margin:0 auto;border:1px solid rgba(168,85,247,0.25);border-radius:24px;padding:30px;background:linear-gradient(180deg,#171717 0%,#0f0f10 100%);">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#c084fc;">Acceso socio</p>
        <h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;">Tus credenciales ya están listas</h1>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#d4d4d4;">${recipientName}, tu acceso a la app de socios de ${gymName} ya fue creado.</p>

        <div style="margin:22px 0;border:1px solid rgba(255,255,255,0.08);border-radius:18px;background:#0a0a0a;padding:18px;">
          <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#a3a3a3;">Credenciales de ingreso</p>
          <p style="margin:0 0 8px;font-size:14px;color:#e5e5e5;"><strong>Correo:</strong> ${input.email}</p>
          <p style="margin:0;font-size:14px;color:#e5e5e5;"><strong>Contraseña temporal:</strong> ${input.temporaryPassword}</p>
        </div>

        <div style="margin:24px 0 18px;">
          <a href="${input.loginUrl}" style="display:inline-block;border-radius:999px;background:linear-gradient(135deg,#9333ea 0%,#c026d3 100%);padding:14px 24px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;box-shadow:0 14px 30px rgba(147,51,234,0.35);">
            Ir a la app de socios
          </a>
        </div>

        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a3a3a3;">Te recomendamos cambiar esta contraseña después del primer acceso.</p>
      </div>
    </div>
  `.trim();

  const text = [
    `Hola ${recipientName}.`,
    `Tu acceso a la app de socios de ${gymName} ya fue creado.`,
    `Correo: ${input.email}`,
    `Contraseña temporal: ${input.temporaryPassword}`,
    `Ingresa aquí: ${input.loginUrl}`,
  ].join("\n");

  return { html, text };
}
