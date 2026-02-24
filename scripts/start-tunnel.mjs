import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const port = process.env.TUNNEL_PORT ?? "9000";
const localHost = process.env.TUNNEL_LOCAL_HOST ?? "127.0.0.1";
const runtimeFile = path.resolve("resources/runtime/public-origin.txt");

fs.mkdirSync(path.dirname(runtimeFile), { recursive: true });
fs.writeFileSync(runtimeFile, "{}", "utf8");

function writeRuntime(origin) {
  const payload = {
    origin,
    updatedAt: Date.now(),
  };
  fs.writeFileSync(runtimeFile, JSON.stringify(payload), "utf8");
}

const command = `npx --yes localtunnel --port ${String(port)} --local-host ${String(localHost)}`;

console.log(
  `[OpenFront] Starting public tunnel for http://${localHost}:${port} ...`,
);

const tunnel = spawn(command, {
  shell: true,
  stdio: ["inherit", "pipe", "pipe"],
  env: process.env,
});

const URL_REGEX = /https?:\/\/[^\s]+\.loca\.lt\b/i;
let announcedUrl = false;
let stdoutBuffer = "";
let stderrBuffer = "";

function publishOriginFromLine(line) {
  const match = line.match(URL_REGEX);
  if (!match) return;

  const origin = match[0].replace(/\/$/, "");
  writeRuntime(origin);

  if (!announcedUrl) {
    announcedUrl = true;
    console.log(`[OpenFront] Public URL: ${origin}`);
    console.log(
      "[OpenFront] Share this URL to players (works outside local network).",
    );
  }
}

function onChunk(chunk, isStdErr = false) {
  const text = chunk.toString("utf8");
  const prefixed = text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => `[tunnel] ${line}`)
    .join("\n");

  if (prefixed) {
    if (isStdErr) {
      console.error(prefixed);
    } else {
      console.log(prefixed);
    }
  }

  if (isStdErr) {
    stderrBuffer += text;
    const lines = stderrBuffer.split(/\r?\n/);
    stderrBuffer = lines.pop() ?? "";
    lines.forEach((line) => publishOriginFromLine(line));
    return;
  }

  stdoutBuffer += text;
  const lines = stdoutBuffer.split(/\r?\n/);
  stdoutBuffer = lines.pop() ?? "";
  lines.forEach((line) => publishOriginFromLine(line));
}

tunnel.stdout.on("data", (chunk) => onChunk(chunk, false));
tunnel.stderr.on("data", (chunk) => onChunk(chunk, true));

tunnel.on("exit", (code, signal) => {
  fs.writeFileSync(runtimeFile, "{}", "utf8");
  if (!announcedUrl) {
    console.error(
      "[OpenFront] Tunnel stopped before getting a public URL. Check your internet connection.",
    );
  }
  console.log(
    `[OpenFront] Tunnel process exited (code=${code ?? "null"}, signal=${signal ?? "null"}).`,
  );
  process.exit(code ?? 0);
});

const shutdown = () => {
  try {
    tunnel.kill("SIGTERM");
  } catch {
    // ignore
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
