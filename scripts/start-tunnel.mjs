import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const port = process.env.TUNNEL_PORT ?? process.env.VITE_PORT ?? "9000";
const localHost = process.env.TUNNEL_LOCAL_HOST ?? "127.0.0.1";
const runtimeFile = path.resolve("resources/runtime/public-origin.txt");
const cloudflaredLogFile = path.resolve("resources/runtime/cloudflared.log");
const startupTimeoutMs = Number.parseInt(
  process.env.TUNNEL_STARTUP_TIMEOUT_MS ?? "25000",
  10,
);
const preferredProvider = (
  process.env.TUNNEL_PROVIDER ?? "cloudflared"
).toLowerCase();
const providerOrder =
  preferredProvider === "localtunnel"
    ? ["localtunnel", "cloudflared"]
    : ["cloudflared", "localtunnel"];

fs.mkdirSync(path.dirname(runtimeFile), { recursive: true });
fs.writeFileSync(runtimeFile, "{}", "utf8");

function writeRuntime(origin) {
  const payload = {
    origin,
    updatedAt: Date.now(),
  };
  fs.writeFileSync(runtimeFile, JSON.stringify(payload), "utf8");
}

function resetRuntime() {
  fs.writeFileSync(runtimeFile, "{}", "utf8");
}

function extractOrigin(line, provider) {
  const regex =
    provider === "cloudflared"
      ? /https?:\/\/[^\s|"]+\.trycloudflare\.com\b/i
      : /https?:\/\/[^\s]+\.loca\.lt\b/i;
  const match = line.match(regex);
  if (!match) {
    return null;
  }
  return match[0].replace(/\/$/, "");
}

let announcedUrl = false;
let shuttingDown = false;
let activeTunnel = null;
let activeStartupTimeout = null;
let activeLogPoller = null;
let cloudflaredLogOffset = 0;
let fallbackTriggeredForProvider = false;

function publishOriginFromLine(line, provider) {
  const origin = extractOrigin(line, provider);
  if (!origin) {
    return;
  }

  writeRuntime(origin);

  if (!announcedUrl) {
    announcedUrl = true;
    console.log(`[OpenFront] Public URL: ${origin}`);
    console.log(
      "[OpenFront] Share this URL to players (works outside local network).",
    );
  }
}

function pipeChunkToLines(chunk, state, provider, isStdErr = false) {
  const text = chunk.toString("utf8");
  state.buffer += text;
  const lines = state.buffer.split(/\r?\n/);
  state.buffer = lines.pop() ?? "";

  lines.forEach((line) => {
    if (!line.trim()) return;
    if (isStdErr) {
      console.error(`[tunnel] ${line}`);
    } else {
      console.log(`[tunnel] ${line}`);
    }
    publishOriginFromLine(line, provider);
  });
}

function pollCloudflaredLog() {
  try {
    if (!fs.existsSync(cloudflaredLogFile)) {
      return;
    }

    const content = fs.readFileSync(cloudflaredLogFile, "utf8");
    if (content.length < cloudflaredLogOffset) {
      cloudflaredLogOffset = 0;
    }

    const nextContent = content.slice(cloudflaredLogOffset);
    if (!nextContent) {
      return;
    }
    cloudflaredLogOffset = content.length;

    nextContent
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach((line) => {
        console.log(`[tunnel] ${line}`);
        publishOriginFromLine(line, "cloudflared");
      });
  } catch {
    // Ignore temporary log read failures.
  }
}

function clearActiveHandles() {
  if (activeStartupTimeout !== null) {
    clearTimeout(activeStartupTimeout);
    activeStartupTimeout = null;
  }
  if (activeLogPoller !== null) {
    clearInterval(activeLogPoller);
    activeLogPoller = null;
  }
}

function stopActiveTunnel(signal = "SIGTERM") {
  if (!activeTunnel) return;
  try {
    activeTunnel.kill(signal);
  } catch {
    // ignore
  }
}

function startProvider(index) {
  if (index >= providerOrder.length) {
    resetRuntime();
    console.error(
      "[OpenFront] Tunnel stopped before getting a public URL. Check your internet connection, firewall, or proxy.",
    );
    process.exit(1);
    return;
  }

  fallbackTriggeredForProvider = false;
  const provider = providerOrder[index];
  const target = `http://${localHost}:${port}`;
  const command =
    provider === "cloudflared"
      ? `npx --yes cloudflared tunnel --no-autoupdate --logfile "${cloudflaredLogFile}" --url ${target}`
      : `npx --yes localtunnel --port ${String(port)} --local-host ${String(localHost)}`;

  if (provider === "cloudflared") {
    try {
      fs.unlinkSync(cloudflaredLogFile);
    } catch {
      // ignore
    }
    cloudflaredLogOffset = 0;
    activeLogPoller = setInterval(pollCloudflaredLog, 500);
  }

  console.log(`[OpenFront] Starting public tunnel (${provider}) for ${target} ...`);

  const tunnel = spawn(command, {
    shell: true,
    stdio: ["inherit", "pipe", "pipe"],
    env: process.env,
  });
  activeTunnel = tunnel;

  const stdoutState = { buffer: "" };
  const stderrState = { buffer: "" };

  tunnel.stdout.on("data", (chunk) => {
    pipeChunkToLines(chunk, stdoutState, provider, false);
  });
  tunnel.stderr.on("data", (chunk) => {
    pipeChunkToLines(chunk, stderrState, provider, true);
  });

  activeStartupTimeout = setTimeout(() => {
    if (announcedUrl || shuttingDown || fallbackTriggeredForProvider) {
      return;
    }
    fallbackTriggeredForProvider = true;
    console.error(
      `[OpenFront] ${provider} did not provide a public URL in ${Math.round(
        startupTimeoutMs / 1000,
      )}s.`,
    );
    if (index + 1 < providerOrder.length) {
      console.log(
        `[OpenFront] Switching tunnel provider to ${providerOrder[index + 1]}...`,
      );
    }
    stopActiveTunnel("SIGTERM");
  }, startupTimeoutMs);

  tunnel.on("exit", (code, signal) => {
    clearActiveHandles();
    activeTunnel = null;

    if (shuttingDown || announcedUrl) {
      resetRuntime();
      console.log(
        `[OpenFront] Tunnel process exited (code=${code ?? "null"}, signal=${signal ?? "null"}).`,
      );
      process.exit(code ?? 0);
      return;
    }

    if (index + 1 < providerOrder.length) {
      if (!fallbackTriggeredForProvider) {
        console.error(
          `[OpenFront] ${provider} exited before providing a public URL.`,
        );
        console.log(
          `[OpenFront] Switching tunnel provider to ${providerOrder[index + 1]}...`,
        );
      }
      startProvider(index + 1);
      return;
    }

    resetRuntime();
    console.error(
      "[OpenFront] Tunnel stopped before getting a public URL. Check your internet connection, firewall, or proxy.",
    );
    console.log(
      `[OpenFront] Tunnel process exited (code=${code ?? "null"}, signal=${signal ?? "null"}).`,
    );
    process.exit(code ?? 1);
  });
}

startProvider(0);

const shutdown = () => {
  shuttingDown = true;
  clearActiveHandles();
  stopActiveTunnel("SIGTERM");
  setTimeout(() => {
    stopActiveTunnel("SIGKILL");
  }, 3000);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
