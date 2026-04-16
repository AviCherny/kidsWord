const { spawn } = require("child_process");
const path = require("path");

const port = process.argv[2] || "3000";
const reactScriptsPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-scripts",
  "bin",
  "react-scripts.js"
);

const child = spawn(process.execPath, [reactScriptsPath, "start"], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: port,
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
