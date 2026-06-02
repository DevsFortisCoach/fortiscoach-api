export function buildTestMailTemplate(input: {
  recipientName?: string;
  serviceName?: string;
}) {
  const recipientName = input.recipientName?.trim() || "Hola";
  const serviceName = input.serviceName?.trim() || "FortisCoach API";

  const html = `
    <div style="background:#eef4f7;padding:32px 18px;font-family:Arial,sans-serif;color:#0b2a36;">
      <div style="max-width:600px;margin:0 auto;border:1px solid #c9dbe3;border-radius:28px;overflow:hidden;background:#ffffff;box-shadow:0 20px 50px rgba(5,71,97,0.10);">
        <div style="padding:22px 28px;background:linear-gradient(135deg,#044760 0%,#0c7a94 100%);">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#dce9ef;">FortisCoach</p>
        </div>
        <div style="padding:30px 28px 32px;">
          <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#0c7a94;">Correo de prueba</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;color:#0b2a36;">Canal de correo operativo</h1>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#48626c;">${recipientName}, este correo confirma que ${serviceName} logró enviar correctamente usando la configuración SMTP de FortisCoach.</p>
          <div style="margin-top:22px;border:1px solid #d9e7ed;border-radius:18px;background:#f4f8fa;padding:18px 20px;">
            <p style="margin:0;font-size:14px;line-height:1.7;color:#32515c;">El canal de envío está disponible para correos de acceso, credenciales y notificaciones operativas del sistema.</p>
          </div>
          <p style="margin:22px 0 0;font-size:13px;line-height:1.7;color:#6a7f88;">Remitente configurado: <strong style="color:#0b2a36;">FortisCoach &lt;no-reply@fortiscoach.cl&gt;</strong></p>
        </div>
      </div>
    </div>
  `.trim();

  const text = `${recipientName}, este correo confirma que ${serviceName} logró enviar correctamente usando la configuración SMTP de FortisCoach.`;

  return { html, text };
}

export function buildAccessCredentialsTemplate(input: {
  recipientName?: string;
  gymName?: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  buttonLoginUrl?: string;
}) {
  const recipientName = input.recipientName?.trim() || "Hola";
  const gymName = input.gymName?.trim() || "tu gimnasio";

  const html = `
    <div style="background:#eef4f7;padding:32px 18px;font-family:Arial,sans-serif;color:#0b2a36;">
      <div style="max-width:600px;margin:0 auto;border:1px solid #c9dbe3;border-radius:28px;overflow:hidden;background:#ffffff;box-shadow:0 20px 50px rgba(5,71,97,0.10);">
        <div style="padding:22px 28px;background:linear-gradient(135deg,#044760 0%,#0c7a94 100%);">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#dce9ef;">FortisCoach</p>
        </div>
        <div style="padding:30px 28px 32px;">
          <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#0c7a94;">Acceso socio</p>
          <h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;color:#0b2a36;">Tus credenciales ya están listas</h1>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#48626c;">${recipientName}, tu acceso a la app de socios de ${gymName} ya fue creado en FortisCoach.</p>

          <div style="margin:24px 0;border:1px solid #d9e7ed;border-radius:20px;background:#f4f8fa;padding:20px;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#0c7a94;">Credenciales de ingreso</p>
            <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#32515c;"><strong style="color:#0b2a36;">Correo:</strong> ${input.email}</p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#32515c;"><strong style="color:#0b2a36;">Contraseña temporal:</strong> ${input.temporaryPassword}</p>
          </div>

          <div style="margin:24px 0 18px;">
            <a href="${input.buttonLoginUrl ?? input.loginUrl}" style="display:inline-block;border-radius:999px;background:linear-gradient(135deg,#0c7a94 0%,#054761 100%);padding:14px 24px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;box-shadow:0 14px 30px rgba(5,71,97,0.24);">
              ${input.buttonLoginUrl ? "Ingresar con un clic" : "Ir a la app de socios"}
            </a>
          </div>

          <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#48626c;">Te recomendamos cambiar esta contraseña después del primer acceso para mantener segura tu cuenta.</p>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#6a7f88;">${input.buttonLoginUrl ? "El botón de acceso es temporal y fue generado solo para este correo." : "Si no solicitaste este acceso o necesitas ayuda, responde a este correo o comunícate con tu gimnasio."}</p>
        </div>
      </div>
    </div>
  `.trim();

  const text = [
    `Hola ${recipientName}.`,
    `Tu acceso a la app de socios de ${gymName} ya fue creado.`,
    `Correo: ${input.email}`,
    `Contraseña temporal: ${input.temporaryPassword}`,
    `Ingresa aquí: ${input.buttonLoginUrl ?? input.loginUrl}`,
  ].join("\n");

  return { html, text };
}
