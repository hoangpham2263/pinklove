import "server-only";

import net from "node:net";
import tls from "node:tls";
import { getSystemSettings, type EmailSettings } from "@/lib/system-settings";

export type EmailAddress = string | { email: string; name?: string };

export type SendEmailInput = {
  to: EmailAddress | EmailAddress[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
};

export type SendEmailResult = {
  transport: EmailSettings["transport"];
  accepted: string[];
  messageId: string;
};

type SmtpReply = {
  code: number;
  message: string;
};

class SmtpClient {
  private socket?: net.Socket | tls.TLSSocket;
  private buffer = "";

  constructor(private readonly settings: EmailSettings) {}

  async send(input: Required<Pick<SendEmailInput, "subject">> & SendEmailInput, from: string, messageId: string) {
    const recipients = normalizeAddresses(input.to);
    if (recipients.length === 0) {
      throw new Error("Email recipient is required.");
    }

    await this.connect();
    await this.expect([220]);
    const ehloReply = await this.command(`EHLO ${getHostname()}`, [250]);

    if (!this.settings.smtpSecure && ehloReply.message.toUpperCase().includes("STARTTLS")) {
      await this.command("STARTTLS", [220]);
      await this.upgradeToTls();
      await this.command(`EHLO ${getHostname()}`, [250]);
    }

    if (this.settings.smtpUsername || this.settings.smtpPassword) {
      await this.command("AUTH LOGIN", [334]);
      await this.command(Buffer.from(this.settings.smtpUsername).toString("base64"), [334]);
      await this.command(Buffer.from(this.settings.smtpPassword).toString("base64"), [235]);
    }

    await this.command(`MAIL FROM:<${extractEmail(from)}>`, [250]);
    for (const recipient of recipients) {
      await this.command(`RCPT TO:<${extractEmail(formatAddress(recipient))}>`, [250, 251]);
    }

    await this.command("DATA", [354]);
    await this.write(`${buildRawEmail({ ...input, to: recipients }, from, messageId)}\r\n.\r\n`);
    await this.expect([250]);
    await this.command("QUIT", [221]).catch(() => undefined);
    this.socket?.end();
  }

  private connect() {
    return new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => reject(error);
      const onConnect = () => {
        this.socket?.off("error", onError);
        resolve();
      };

      this.socket = this.settings.smtpSecure
        ? tls.connect({
            host: this.settings.smtpHost,
            port: this.settings.smtpPort,
            servername: this.settings.smtpHost,
          })
        : net.connect({
            host: this.settings.smtpHost,
            port: this.settings.smtpPort,
          });

      this.socket.once("error", onError);
      this.socket.once("connect", onConnect);
      this.socket.on("data", (chunk) => {
        this.buffer += chunk.toString("utf8");
      });
    });
  }

  private async command(command: string, expectedCodes: number[]) {
    await this.write(`${command}\r\n`);
    return this.expect(expectedCodes);
  }

  private write(value: string) {
    return new Promise<void>((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("SMTP socket is not connected."));
        return;
      }

      this.socket.write(value, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  private upgradeToTls() {
    return new Promise<void>((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("SMTP socket is not connected."));
        return;
      }

      const secureSocket = tls.connect({
        socket: this.socket,
        servername: this.settings.smtpHost,
      });

      this.socket.removeAllListeners("data");
      this.socket = secureSocket;
      this.buffer = "";
      this.socket.on("data", (chunk) => {
        this.buffer += chunk.toString("utf8");
      });
      secureSocket.once("secureConnect", resolve);
      secureSocket.once("error", reject);
    });
  }

  private expect(expectedCodes: number[]) {
    return new Promise<SmtpReply>((resolve, reject) => {
      const startedAt = Date.now();

      const poll = () => {
        const reply = parseReply(this.buffer);
        if (reply) {
          this.buffer = this.buffer.slice(reply.rawLength);
          if (!expectedCodes.includes(reply.code)) {
            reject(new Error(`SMTP command failed: ${reply.message}`));
            return;
          }

          resolve({ code: reply.code, message: reply.message });
          return;
        }

        if (Date.now() - startedAt > 15000) {
          reject(new Error("SMTP server response timed out."));
          return;
        }

        setTimeout(poll, 25);
      };

      poll();
    });
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const settings = (await getSystemSettings()).email;
  assertEmailCanSend(settings, input);

  const from = formatAddress({
    email: settings.fromEmail,
    name: settings.fromName,
  });
  const accepted = normalizeAddresses(input.to).map((address) => extractEmail(formatAddress(address)));
  const messageId = createMessageId(settings.fromEmail);

  if (settings.transport === "log") {
    console.info("Email logged by PinkLove email transport", {
      messageId,
      to: accepted,
      subject: input.subject,
    });
    return { transport: settings.transport, accepted, messageId };
  }

  const client = new SmtpClient(settings);
  await client.send(input, from, messageId);

  return { transport: settings.transport, accepted, messageId };
}

function assertEmailCanSend(settings: EmailSettings, input: SendEmailInput) {
  if (!settings.enabled) {
    throw new Error("Email sending is disabled.");
  }

  if (!settings.fromEmail) {
    throw new Error("Sender email is required.");
  }

  if (!input.subject.trim()) {
    throw new Error("Email subject is required.");
  }

  if (!input.text?.trim() && !input.html?.trim()) {
    throw new Error("Email body is required.");
  }

  if (normalizeAddresses(input.to).length === 0) {
    throw new Error("Email recipient is required.");
  }

  if (settings.transport === "smtp" && !settings.smtpHost) {
    throw new Error("SMTP host is required.");
  }
}

function buildRawEmail(input: SendEmailInput & { to: EmailAddress[] }, from: string, messageId: string) {
  const headers = [
    `From: ${from}`,
    `To: ${input.to.map(formatAddress).join(", ")}`,
    `Subject: ${encodeHeader(input.subject)}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
    `Date: ${new Date().toUTCString()}`,
  ];

  if (input.replyTo) {
    headers.push(`Reply-To: ${input.replyTo}`);
  }

  if (input.html) {
    const boundary = `pinklove-${Date.now().toString(36)}`;
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    return [
      ...headers,
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      escapeDataLines(input.text || stripHtml(input.html)),
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      escapeDataLines(input.html),
      `--${boundary}--`,
    ].join("\r\n");
  }

  headers.push('Content-Type: text/plain; charset="UTF-8"', "Content-Transfer-Encoding: 8bit");
  return [...headers, "", escapeDataLines(input.text ?? "")].join("\r\n");
}

function normalizeAddresses(value: EmailAddress | EmailAddress[]) {
  return (Array.isArray(value) ? value : [value]).filter((address) => extractEmail(formatAddress(address)));
}

function formatAddress(address: EmailAddress) {
  if (typeof address === "string") {
    return address.trim();
  }

  const email = address.email.trim();
  if (!address.name?.trim()) {
    return email;
  }

  return `"${address.name.replaceAll('"', '\\"')}" <${email}>`;
}

function extractEmail(value: string) {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim();
}

function encodeHeader(value: string) {
  return value.replaceAll(/\r?\n/g, " ").trim();
}

function escapeDataLines(value: string) {
  return value.replaceAll(/\r?\n/g, "\r\n").replaceAll(/^\./gm, "..");
}

function stripHtml(value: string) {
  return value.replaceAll(/<[^>]*>/g, " ").replaceAll(/\s+/g, " ").trim();
}

function createMessageId(fromEmail: string) {
  const domain = fromEmail.split("@")[1] || "localhost";
  return `<${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}@${domain}>`;
}

function getHostname() {
  return process.env.HOSTNAME?.trim() || "localhost";
}

function parseReply(buffer: string) {
  const lines = buffer.split(/\r?\n/);
  let rawLength = 0;

  for (const line of lines) {
    if (!line) {
      rawLength += 2;
      continue;
    }

    rawLength += line.length + 2;
    if (/^\d{3} /.test(line)) {
      const code = Number(line.slice(0, 3));
      return {
        code,
        message: lines.filter(Boolean).join("\n"),
        rawLength,
      };
    }
  }

  return null;
}
