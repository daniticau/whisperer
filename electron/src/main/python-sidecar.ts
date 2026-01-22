import { spawn, ChildProcess } from "child_process";
import * as path from "path";

export class PythonSidecar {
  private process: ChildProcess | null = null;
  private port: number = 0;

  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      const projectRoot = path.resolve(__dirname, "../../..");

      this.process = spawn("python", ["-m", "python", "--port", "0"], {
        cwd: projectRoot,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let resolved = false;

      this.process.stdout?.on("data", (data: Buffer) => {
        const text = data.toString();
        console.log(`[Python] ${text.trim()}`);

        const match = text.match(/SERVER_READY:PORT=(\d+)/);
        if (match && !resolved) {
          this.port = parseInt(match[1], 10);
          resolved = true;
          resolve(this.port);
        }
      });

      this.process.stderr?.on("data", (data: Buffer) => {
        console.error(`[Python stderr] ${data.toString().trim()}`);
      });

      this.process.on("error", (err) => {
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });

      this.process.on("exit", (code) => {
        console.log(`Python sidecar exited with code ${code}`);
        if (!resolved) {
          resolved = true;
          reject(new Error(`Python sidecar exited with code ${code}`));
        }
      });

      // Timeout after 60 seconds (model loading can take a while)
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error("Python sidecar startup timed out"));
        }
      }, 60000);
    });
  }

  stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  getPort(): number {
    return this.port;
  }
}
