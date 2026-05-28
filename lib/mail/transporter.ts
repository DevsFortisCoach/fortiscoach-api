import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { getMailConfig } from "./config";

let transporter: Transporter | null = null;

export function getMailTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport(getMailConfig().transport);
  }
  return transporter;
}
