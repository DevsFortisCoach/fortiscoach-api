import { getMailConfig } from "./config";
import { getMailTransporter } from "./transporter";
import {
  buildAccessCredentialsTemplate,
  buildTestMailTemplate,
} from "./templates";

function formatFrom() {
  const { identity } = getMailConfig();
  return `${identity.fromName} <${identity.fromEmail}>`;
}

export async function sendTestMail(input: {
  to: string;
  recipientName?: string;
  serviceName?: string;
}) {
  const template = buildTestMailTemplate(input);
  const { identity } = getMailConfig();

  return getMailTransporter().sendMail({
    from: formatFrom(),
    to: input.to,
    replyTo: identity.replyTo,
    subject: "Correo de prueba SMTP",
    html: template.html,
    text: template.text,
  });
}

export async function sendAccessCredentialsMail(input: {
  to: string;
  recipientName?: string;
  gymName?: string;
  temporaryPassword: string;
  loginUrl?: string;
}) {
  const loginUrl = input.loginUrl ?? getMailConfig().links.socioAppUrl;
  const template = buildAccessCredentialsTemplate({
    recipientName: input.recipientName,
    gymName: input.gymName,
    email: input.to,
    temporaryPassword: input.temporaryPassword,
    loginUrl,
  });
  const { identity } = getMailConfig();

  return getMailTransporter().sendMail({
    from: formatFrom(),
    to: input.to,
    replyTo: identity.replyTo,
    subject: `Tus credenciales de acceso${input.gymName ? ` · ${input.gymName}` : ""}`,
    html: template.html,
    text: template.text,
  });
}
