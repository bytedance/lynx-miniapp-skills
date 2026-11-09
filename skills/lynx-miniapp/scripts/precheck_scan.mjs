#!/usr/bin/env node

// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

const SCHEMA = "lynx-miniapp-precheck-scan.v1";
const COMPONENT_SIGNALS = new Set([
  "scroll-view",
  "swiper",
  "swiper-item",
  "movable-area",
  "movable-view",
  "navigator",
  "input",
  "textarea",
  "picker",
  "picker-view",
  "canvas",
  "image",
  "video",
  "camera",
  "live-preview",
  "map",
  "web-view",
  "open-data",
  "aweme-data",
  "rich-text",
  "button",
]);

class ScanError extends Error {
  constructor(code, message, path) {
    super(message);
    this.name = "ScanError";
    this.code = code;
    this.path = path;
  }
}

function usage() {
  return "Usage: node scripts/precheck_scan.mjs <miniapp-project-root> [--page <route>]";
}

function parseArgs(argv) {
  if (argv.length === 0 || argv.includes("--help")) return { help: true };
  const projectRoot = argv[0];
  let page;
  for (let index = 1; index < argv.length; index += 1) {
    if (
      argv[index] !== "--page" ||
      index + 1 >= argv.length ||
      page !== undefined
    ) {
      throw new ScanError("INVALID_ARGUMENTS", usage());
    }
    page = validateRoute(argv[index + 1], "requested page");
    index += 1;
  }
  return { help: false, projectRoot, page };
}

function validateRoute(value, label) {
  if (typeof value !== "string") {
    throw new ScanError(
      "INVALID_ROUTE",
      `${label} must be a relative miniapp route`,
    );
  }
  const route = value.replace(/^\/+|\/+$/gu, "");
  const segments = route.split("/");
  if (
    route === "" ||
    isAbsolute(value) ||
    value.includes("\\") ||
    segments.some(
      (segment) => segment === "" || segment === "." || segment === "..",
    )
  ) {
    throw new ScanError(
      "INVALID_ROUTE",
      `${label} must stay inside the project root`,
      value,
    );
  }
  return route;
}

function toPosix(value) {
  return value.split(sep).join("/");
}

function isInside(root, target) {
  const rel = relative(root, target);
  return (
    rel === "" ||
    (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
  );
}

async function establishRoot(projectRoot) {
  const lexicalRoot = resolve(projectRoot);
  let info;
  try {
    info = await lstat(lexicalRoot);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new ScanError(
        "PROJECT_ROOT_NOT_FOUND",
        "Project root does not exist",
      );
    }
    throw error;
  }
  if (info.isSymbolicLink()) {
    throw new ScanError(
      "SYMLINK_PROJECT_ROOT",
      "Project root must not be a symbolic link",
    );
  }
  if (!info.isDirectory()) {
    throw new ScanError(
      "PROJECT_ROOT_NOT_DIRECTORY",
      "Project root must be a directory",
    );
  }
  const root = await realpath(lexicalRoot);
  const resolvedInfo = await lstat(root);
  if (!resolvedInfo.isDirectory() || resolvedInfo.isSymbolicLink()) {
    throw new ScanError(
      "PROJECT_ROOT_NOT_DIRECTORY",
      "Resolved project root must be a real directory",
    );
  }
  return root;
}

async function inspectPath(root, relativePath) {
  const normalized = toPosix(relativePath);
  const segments = normalized.split("/");
  if (
    normalized === "" ||
    isAbsolute(relativePath) ||
    segments.some(
      (segment) => segment === "" || segment === "." || segment === "..",
    )
  ) {
    throw new ScanError(
      "PATH_ESCAPE",
      "Requested file path must stay inside the project root",
      normalized,
    );
  }

  const target = resolve(root, ...segments);
  if (!isInside(root, target)) {
    throw new ScanError(
      "PATH_ESCAPE",
      "Requested file path escapes the project root",
      normalized,
    );
  }

  let current = root;
  for (let index = 0; index < segments.length; index += 1) {
    current = resolve(current, segments[index]);
    let info;
    try {
      info = await lstat(current);
    } catch (error) {
      if (error?.code === "ENOENT") return { exists: false };
      throw error;
    }
    if (info.isSymbolicLink()) {
      throw new ScanError(
        "SYMLINK_PATH",
        "Symbolic links are not allowed in scanned project paths",
        segments.slice(0, index + 1).join("/"),
      );
    }
    if (index < segments.length - 1 && !info.isDirectory()) {
      throw new ScanError(
        "PATH_COMPONENT_NOT_DIRECTORY",
        "A scanned path component is not a directory",
        segments.slice(0, index + 1).join("/"),
      );
    }
    if (index === segments.length - 1 && !info.isFile())
      return { exists: false };
  }

  const resolvedTarget = await realpath(target);
  if (!isInside(root, resolvedTarget)) {
    throw new ScanError(
      "PATH_ESCAPE",
      "Resolved file path escapes the project root",
      normalized,
    );
  }
  return { exists: true, path: resolvedTarget };
}

async function readText(root, relativePath) {
  const inspected = await inspectPath(root, relativePath);
  if (!inspected.exists) return { exists: false };
  return { exists: true, text: await readFile(inspected.path, "utf8") };
}

function parseJson(text, file) {
  try {
    return JSON.parse(text);
  } catch {
    throw new ScanError("INVALID_JSON", "JSON file is invalid", file);
  }
}

function lineNumber(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

function uniqueObservations(observations) {
  const seen = new Set();
  return observations.filter((item) => {
    const key = `${item.file}:${item.line}:${item.kind}:${item.signal}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scanTemplate(text, file) {
  const observations = [];
  for (const match of text.matchAll(/<([a-z][a-z0-9-]*)\b/gu)) {
    if (COMPONENT_SIGNALS.has(match[1])) {
      observations.push({
        file,
        line: lineNumber(text, match.index),
        kind: "component",
        signal: match[1],
      });
    }
  }
  return observations;
}

function scanJavaScript(text, file) {
  const observations = [];
  for (const match of text.matchAll(/\btt\.([A-Za-z_$][\w$]*)/gu)) {
    observations.push({
      file,
      line: lineNumber(text, match.index),
      kind: "api",
      signal: `tt.${match[1]}`,
    });
  }
  for (const signal of [
    "onPageScroll",
    "onReachBottom",
    "createMediaQueryObserver",
    "removeSkeleton",
    "selectComponent",
    "selectAllComponents",
  ]) {
    const pattern = new RegExp(`\\b${signal}\\b`, "gu");
    for (const match of text.matchAll(pattern)) {
      observations.push({
        file,
        line: lineNumber(text, match.index),
        kind: "framework",
        signal,
      });
    }
  }
  for (const match of text.matchAll(
    /\b(?:event|e)\.(?:target|currentTarget)\.(?:offsetLeft|offsetTop)\b/gu,
  )) {
    observations.push({
      file,
      line: lineNumber(text, match.index),
      kind: "event-geometry",
      signal: match[0],
    });
  }
  return observations;
}

function scanStyle(text, file) {
  const observations = [];
  const patterns = [
    ["at-rule", /@(media|supports|container|scope)\b/gu],
    [
      "layout",
      /\bdisplay\s*:\s*(linear|relative|inline-block|inline|table[^;}]*)/gu,
    ],
    [
      "selector",
      /::(?:before|after)\b|:(?:first-child|last-child|nth-child|checked|disabled)\b/gu,
    ],
    ["style", /\b(?:float|pointer-events|word-break|text-transform)\s*:/gu],
  ];
  for (const [kind, pattern] of patterns) {
    for (const match of text.matchAll(pattern)) {
      observations.push({
        file,
        line: lineNumber(text, match.index),
        kind,
        signal: match[0].trim(),
      });
    }
  }
  return observations;
}

function registeredPages(appJson) {
  const pages = [];
  if (Array.isArray(appJson?.pages)) {
    for (const page of appJson.pages)
      pages.push(validateRoute(page, "registered page"));
  }
  for (const group of Array.isArray(appJson?.subpackages)
    ? appJson.subpackages
    : []) {
    const root = validateRoute(group?.root, "subpackage root");
    if (!Array.isArray(group?.pages)) continue;
    for (const page of group.pages) {
      pages.push(
        validateRoute(`${root}/${page}`, "registered subpackage page"),
      );
    }
  }
  return [...new Set(pages)];
}

async function scanPage(root, route, appRenderType) {
  const files = {
    config: `${route}.json`,
    template: `${route}.ttml`,
    script: `${route}.js`,
    style: `${route}.ttss`,
  };
  const observations = [];
  const missingFiles = [];
  let pageRenderType;
  let usingComponents = [];

  for (const [kind, file] of Object.entries(files)) {
    const input = await readText(root, file);
    if (!input.exists) {
      missingFiles.push(file);
      continue;
    }
    if (kind === "config") {
      const config = parseJson(input.text, file);
      pageRenderType =
        typeof config?.renderType === "string" ? config.renderType : undefined;
      usingComponents =
        config?.usingComponents && typeof config.usingComponents === "object"
          ? Object.entries(config.usingComponents).map(([name, path]) => ({
              name,
              path,
            }))
          : [];
    } else if (kind === "template") {
      observations.push(...scanTemplate(input.text, file));
    } else if (kind === "script") {
      observations.push(...scanJavaScript(input.text, file));
    } else if (kind === "style") {
      observations.push(...scanStyle(input.text, file));
    }
  }

  return {
    route,
    renderType: {
      app: appRenderType ?? null,
      page: pageRenderType ?? null,
      effective: pageRenderType ?? appRenderType ?? "webview-default",
    },
    files,
    missingFiles,
    usingComponents,
    observations: uniqueObservations(observations),
  };
}

function safeError(error) {
  if (error instanceof ScanError) {
    const safePath =
      typeof error.path === "string" &&
      !isAbsolute(error.path) &&
      !error.path.split(/[\\/]/u).includes("..")
        ? toPosix(error.path)
        : undefined;
    return {
      schema: SCHEMA,
      error: {
        code: error.code,
        message: error.message,
        ...(safePath === undefined ? {} : { path: safePath }),
      },
    };
  }
  return {
    schema: SCHEMA,
    error: {
      code: "SCAN_FAILED",
      message: "Precheck scan failed",
    },
  };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const root = await establishRoot(args.projectRoot);
  const appInput = await readText(root, "app.json");
  if (!appInput.exists)
    throw new ScanError(
      "APP_JSON_NOT_FOUND",
      "app.json was not found",
      "app.json",
    );
  const appJson = parseJson(appInput.text, "app.json");
  const allPages = registeredPages(appJson);
  if (args.page !== undefined && !allPages.includes(args.page)) {
    throw new ScanError(
      "UNREGISTERED_PAGE",
      "Requested page is not registered",
      args.page,
    );
  }
  const selectedPages = args.page === undefined ? allPages : [args.page];
  const appRenderType =
    typeof appJson.renderType === "string" ? appJson.renderType : undefined;
  const pages = [];
  for (const route of selectedPages)
    pages.push(await scanPage(root, route, appRenderType));

  console.log(
    JSON.stringify(
      {
        schema: SCHEMA,
        projectRoot: ".",
        scope: args.page === undefined ? "registered-pages" : "selected-page",
        app: {
          file: "app.json",
          renderType: appRenderType ?? null,
          registeredPages: allPages,
        },
        pages,
        errors: [],
        limitations: [
          "Static lexical observations only; no build, renderer, interaction, device, or visual behavior was executed.",
          "Signals are review leads, not compatibility verdicts; evaluate them with the bundled references and actual project context.",
          "Custom-component reachability is reported from page usingComponents but is not recursively expanded.",
        ],
      },
      null,
      2,
    ),
  );
}

try {
  await run();
} catch (error) {
  console.error(JSON.stringify(safeError(error), null, 2));
  process.exitCode = 1;
}
