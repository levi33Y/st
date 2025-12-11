import vue from "@vitejs/plugin-vue";
import fs, { rmSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import { createHtmlPlugin } from "vite-plugin-html";
import resolve from "vite-plugin-resolve";
import pkg from "./package.json";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  rmSync("dist-electron", { recursive: true, force: true });

  const isServe = command === "serve";
  const isBuild = command === "build";
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  const appEnv = process.env.VITE_APP_ENV || "development";
  let config = {
    baseURL: "https://sugartalktest.yamimeal.ca",
    foundationURL: "http://auth.testomenow.com",
    echoAvatarURL: "https://testsmarties.yamimeal.ca",
    websocketURL: "wss://ams-origin.wiltechs.com/LiveApp/websocket",
    feedUrl: "https://sugartalk-client.testomenow.com",
    recordShareBasicUrl: "https://sugartalk.omenow.com/#/intelligent",
  };
  if (appEnv === "production") {
    //prd
    config = {
      baseURL: "https://sugartalk.yamimeal.ca",
      foundationURL: "https://auth.omenow.com",
      echoAvatarURL: "https://smarties.yamimeal.ca",
      websocketURL: "wss://ams-origin.wiltechs.com/LiveApp/websocket",
      feedUrl: "https://sugartalk-client.omenow.com",
      recordShareBasicUrl: "https://sugartalk.omenow.com/#/intelligent",
    };
  } else {
    //test
    config = {
      baseURL: "https://sugartalktest.yamimeal.ca",
      foundationURL: "http://auth.testomenow.com",
      echoAvatarURL: "https://testsmarties.yamimeal.ca",
      websocketURL: "wss://ams-origin.wiltechs.com/LiveApp/websocket",
      feedUrl: "https://sugartalk-client.testomenow.com",
      recordShareBasicUrl: "https://sugartalk.testomenow.com/#/intelligent",
    };
  }

  fs.writeFile(
    path.join(__dirname, "./src/config/config.json"),
    JSON.stringify(config),
    "utf8",
    (err) => {
      if (err) throw err;
    },
  );

  return {
    plugins: [
      vue(),
      electron([
        {
          // Main-Process entry file of the Electron App.
          entry: "electron/main/index.ts",
          onstart(options) {
            if (process.env.VSCODE_DEBUG) {
              console.log(
                /* For `.vscode/.debug.script.mjs` */ "[startup] Electron App",
              );
            } else {
              options.startup();
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: "dist-electron/main",
              rollupOptions: {
                external: Object.keys(
                  "dependencies" in pkg ? pkg.dependencies : {},
                ),
              },
            },
          },
        },
        {
          entry: "electron/preload/index.ts",
          onstart(options) {
            // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
            // instead of restarting the entire Electron App.
            options.reload();
          },
          vite: {
            build: {
              sourcemap: sourcemap ? "inline" : undefined, // #332
              minify: isBuild,
              outDir: "dist-electron/preload",
              rollupOptions: {
                external: Object.keys(
                  "dependencies" in pkg ? pkg.dependencies : {},
                ),
              },
            },
          },
        },
      ]),
      // Use Node.js API in the Renderer-process
      renderer(),
      createHtmlPlugin({
        inject: {
          data: {
            productName: pkg.productName,
          },
        },
      }),
      resolve({
        "trtc-electron-sdk": `
           const TRTCCloud = require("trtc-electron-sdk");
          const TRTCParams = TRTCCloud.TRTCParams;
          const TRTCAppScene = TRTCCloud.TRTCAppScene;
          const TRTCVideoStreamType = TRTCCloud.TRTCVideoStreamType;
          const TRTCScreenCaptureSourceType = TRTCCloud.TRTCScreenCaptureSourceType;
          const TRTCVideoEncParam = TRTCCloud.TRTCVideoEncParam;
          const Rect = TRTCCloud.Rect;
          const TRTCAudioQuality = TRTCCloud.TRTCAudioQuality;
          const TRTCScreenCaptureSourceInfo = TRTCCloud.TRTCScreenCaptureSourceInfo;
          const TRTCDeviceInfo = TRTCCloud.TRTCDeviceInfo;
          const TRTCVideoQosPreference = TRTCCloud.TRTCVideoQosPreference;
          const TRTCQualityInfo = TRTCCloud.TRTCQualityInfo;
          const TRTCQuality = TRTCCloud.TRTCQuality;
          const TRTCStatistics = TRTCCloud.TRTCStatistics;
          const TRTCVolumeInfo = TRTCCloud.TRTCVolumeInfo;
          const TRTCDeviceType = TRTCCloud.TRTCDeviceType;
          const TRTCDeviceState = TRTCCloud.TRTCDeviceState;
          const TRTCBeautyStyle = TRTCCloud.TRTCBeautyStyle;
          const TRTCVideoResolution = TRTCCloud.TRTCVideoResolution;
          const TRTCVideoResolutionMode = TRTCCloud.TRTCVideoResolutionMode;
          const TRTCVideoMirrorType = TRTCCloud.TRTCVideoMirrorType;
          const TRTCVideoRotation = TRTCCloud.TRTCVideoRotation;
          const TRTCVideoFillMode = TRTCCloud.TRTCVideoFillMode;
          const TRTCRoleType = TRTCCloud.TRTCRoleType;
          const TRTCScreenCaptureProperty = TRTCCloud.TRTCScreenCaptureProperty;
          export { 
            TRTCParams,
            TRTCAppScene,
            TRTCVideoStreamType,
            TRTCScreenCaptureSourceType,
            TRTCVideoEncParam,
            Rect,
            TRTCAudioQuality,
            TRTCScreenCaptureSourceInfo,
            TRTCDeviceInfo,
            TRTCVideoQosPreference,
            TRTCQualityInfo,
            TRTCStatistics,
            TRTCVolumeInfo,
            TRTCDeviceType,
            TRTCDeviceState,
            TRTCBeautyStyle,
            TRTCVideoResolution,
            TRTCVideoResolutionMode,
            TRTCVideoMirrorType,
            TRTCVideoRotation,
            TRTCVideoFillMode,
            TRTCRoleType,
            TRTCQuality,
            TRTCScreenCaptureProperty,
          };
          export default TRTCCloud.default;
        `,
      }),
    ],
    resolve: {
      alias: {
        "@": path.join(__dirname, "src"),
        "@components": path.join(__dirname, "src/components"),
        "@assets": path.join(__dirname, "src/assets"),
        "@icon": path.join(__dirname, "src/icon"),
      },
    },
    server:
      process.env.VSCODE_DEBUG &&
      (() => {
        const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
        return {
          host: url.hostname,
          port: +url.port,
        };
      })(),
    clearScreen: false,
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
          silenceDeprecations: ["legacy-js-api"],
        },
      },
    },
  };
});
