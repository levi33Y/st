import { app, ipcMain } from "electron";
import log from "electron-log";
import ffmpeg from "fluent-ffmpeg";
import fs from "node:fs";
import path from "node:path";

interface VideoFrame {
  index: number;
  timestamp: number;
  imageData: string;
}

// 导入 ffmpeg-static 和 ffprobe-static 编译的二进制文件
let ffmpegPath: string;

let ffprobePath: string;

// 处理 asar 打包后的路径
const fixAsarPath = (filePath: string): string => {
  if (!filePath) return filePath;

  if (filePath.includes("app.asar")) {
    const unpackedPath = filePath.replace("app.asar", "app.asar.unpacked");

    if (fs.existsSync(unpackedPath)) {
      return unpackedPath;
    }
  }

  return filePath;
};

try {
  ffmpegPath = require("ffmpeg-static");

  ffmpegPath = fixAsarPath(ffmpegPath);

  ffmpeg.setFfmpegPath(ffmpegPath);
} catch (error) {
  log.error("❌ ffmpeg-static 设置失败", error);
}

try {
  ffprobePath = require("ffprobe-static").path;

  ffprobePath = fixAsarPath(ffprobePath);

  ffmpeg.setFfprobePath(ffprobePath);
} catch (error) {
  log.error("❌ ffprobe-static 设置失败", error);
}

const createTempDir = () => {
  try {
    const tempDir = path.join(app.getPath("temp"), `frames-${Date.now()}`);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    return tempDir;
  } catch (error: any) {
    throw new Error(`创建临时目录失败: ${error.message}`);
  }
};

const deleteTempDir = (tempDir: string) => {
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch (error: any) {
    throw new Error(`清理临时目录失败: ${error.message}`);
  }
};

ipcMain.handle(
  "extract-video-keyframes",
  async (
    _,
    videoPath: string,
    frameCount: number,
    frameWidth: number,
    frameHeight: number,
  ) => {
    return new Promise<VideoFrame[]>((resolve, reject) => {
      const tempDir = createTempDir();

      const outputPattern = path.join(tempDir, "frame-%04d.jpg");

      // key: 帧索引(n), value: pts_time
      const frameTimestamps = new Map<number, number>();

      ffmpeg(videoPath)
        .inputOptions(["-skip_frame", "nokey"])
        .outputOptions([
          "-vf",
          `showinfo,scale=${frameWidth}:${frameHeight}`,
          "-vsync",
          "vfr",
          "-frames:v",
          frameCount.toString(),
          "-q:v",
          "10", // JPEG 质量（1-31，数值越小质量越高）
        ])
        .output(outputPattern)
        .on("start", (commandLine) => {
          log.info("  ", commandLine);
        })
        .on("progress", (progress) => {
          if (progress.percent) {
            log.info(`  进度: ${Math.round(progress.percent)}%`);
          }
        })
        .on("stderr", (stderrLine) => {
          // [Parsed_showinfo_0 @ 0x...] n:   0 pts:   1001 pts_time:0.0417083 ...
          if (
            stderrLine.includes("showinfo") &&
            stderrLine.includes("pts_time")
          ) {
            try {
              const nMatch = stderrLine.match(/n:\s*(\d+)/);

              const ptsTimeMatch = stderrLine.match(/pts_time:([\d.]+)/);

              if (nMatch && ptsTimeMatch) {
                const frameIndex = parseInt(nMatch[1], 10);

                const timestamp = parseFloat(ptsTimeMatch[1]);

                frameTimestamps.set(frameIndex, timestamp);

                log.debug(`  📍 帧 ${frameIndex}: ${timestamp.toFixed(3)}s`);
              }
            } catch (parseError) {
              reject(
                new Error(`解析 showinfo 日志失败: ${parseError.message}`),
              );
            }
          }
        })
        .on("error", (error, stdout, stderr) => {
          deleteTempDir(tempDir);

          reject(new Error(`ffmpeg 执行失败: ${error.message}`));
        })
        .on("end", () => {
          try {
            const files = fs
              .readdirSync(tempDir)
              .filter((f) => f.endsWith(".jpg"))
              .sort();

            if (files.length === 0) {
              throw new Error("未生成任何帧图片");
            }

            const frames: VideoFrame[] = files.map((file, index) => {
              const filePath = path.join(tempDir, file);

              const buffer = fs.readFileSync(filePath);

              const base64 = buffer.toString("base64");

              const timestamp = frameTimestamps.get(index) ?? index;

              log.debug(
                `  [${index + 1}/${files.length}] ${file} - ${timestamp.toFixed(
                  3,
                )}s`,
              );

              return {
                index,
                timestamp,
                imageData: `data:image/jpeg;base64,${base64}`,
              };
            });

            deleteTempDir(tempDir);

            resolve(frames);
          } catch (readError: any) {
            deleteTempDir(tempDir);

            reject(new Error(`读取帧图片失败: ${readError.message}`));
          }
        })
        .run();
    });
  },
);
