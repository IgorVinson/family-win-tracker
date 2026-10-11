#!/usr/bin/env node
/**
 * Generate Antigravity rules from Cursor rules, and link Superpowers skills.
 *
 * Source of truth:
 * - .cursor/rules/*.mdc  ->  .agents/rules/*.md
 * - .cursor/skills/<name>  ->  .agents/skills/<name> (symlink)
 *
 * Expo and Firebase skills already live in .agents/skills as real directories.
 * This script never replaces a non-symlink entry there.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX_RULE_CHARS = 12000;
const TRIGGERS = new Set(["always_on", "glob", "model_decision", "manual"]);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function unquote(value) {
  const trimmed = String(value).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    const inner = trimmed.slice(1, -1);
    if (trimmed.startsWith('"')) {
      return inner.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
    return inner;
  }
  return trimmed;
}

function yamlDoubleQuote(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function splitGlobs(text) {
  const parts = [];
  let current = "";
  let depth = 0;
  let quote = "";
  for (const ch of text) {
    if (quote) {
      current += ch;
      if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "{" || ch === "[") depth += 1;
    if ((ch === "}" || ch === "]") && depth > 0) depth -= 1;
    if (ch === "," && depth === 0) {
      if (current.trim()) parts.push(unquote(current));
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(unquote(current));
  return parts;
}

export function normalizeGlobs(value) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.map((item) => unquote(item)).map((item) => item.trim()).filter(Boolean);
  }
  const text = String(value).trim();
  if (!text || text === "null" || text === "~" || text === "[]") return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Fall through and split the raw string.
    }
  }
  return splitGlobs(text);
}

export function parseFrontmatter(text) {
  const normalized = text.replace(/^\uFEFF/, "");
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    throw new Error("file does not start with YAML frontmatter");
  }
  const data = {};
  const lines = match[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field) {
      throw new Error(`unsupported frontmatter line: ${line}`);
    }
    const key = field[1];
    const rawValue = field[2].trim();
    if (rawValue === "|" || rawValue === ">" || rawValue === "|-" || rawValue === ">-") {
      throw new Error(`unsupported multiline frontmatter for ${key}`);
    }
    if (rawValue === "") {
      const items = [];
      while (i + 1 < lines.length && /^\s+-\s+/.test(lines[i + 1])) {
        i += 1;
        items.push(unquote(lines[i].replace(/^\s+-\s+/, "")));
      }
      data[key] = items;
      continue;
    }
    data[key] = unquote(rawValue);
  }
  const body = normalized.slice(match[0].length).replace(/^\r?\n/, "");
  return { data, body };
}

export function validateAgentRule(content) {
  if (!content.startsWith("---\n")) {
    throw new Error("generated rule does not start with YAML frontmatter");
  }
  if (content.length > MAX_RULE_CHARS) {
    throw new Error(`generated rule is ${content.length} characters (max ${MAX_RULE_CHARS})`);
  }
  const { data, body } = parseFrontmatter(content);
  if (!TRIGGERS.has(data.trigger)) {
    throw new Error(`invalid trigger: ${data.trigger}`);
  }
  if (data.trigger === "glob" && normalizeGlobs(data.globs ?? data.glob).length === 0) {
    throw new Error("glob trigger is missing globs");
  }
  if (data.trigger === "model_decision" && !data.description) {
    throw new Error("model_decision trigger is missing description");
  }
  if (!body.includes(".cursor/rules is the source of truth")) {
    throw new Error("missing source-of-truth header comment");
  }
  return data;
}

export function buildAgentRule(sourceFileName, sourceText) {
  const { data, body } = parseFrontmatter(sourceText);
  const globs = normalizeGlobs(data.globs ?? data.glob);
  const trigger = globs.length > 0 ? "glob" : "always_on";
  const lines = ["---", `trigger: ${trigger}`];
  if (data.description) {
    lines.push(`description: ${yamlDoubleQuote(data.description)}`);
  }
  if (trigger === "glob") {
    lines.push(`globs: ${yamlDoubleQuote(globs.join(", "))}`);
  }
  lines.push("---", "");
  const comment =
    `<!-- Generated from .cursor/rules/${sourceFileName}. ` +
    `.cursor/rules is the source of truth. Edit that file and run \`npm run sync-agent-rules\`. -->`;
  let content = `${lines.join("\n")}\n${comment}\n\n${body}`;
  if (!content.endsWith("\n")) content += "\n";
  validateAgentRule(content);
  return content;
}

function syncRules() {
  const srcDir = path.join(repoRoot, ".cursor/rules");
  const destDir = path.join(repoRoot, ".agents/rules");
  fs.mkdirSync(destDir, { recursive: true });
  const sources = fs.readdirSync(srcDir).filter((name) => name.endsWith(".mdc")).sort();
  if (sources.length === 0) {
    throw new Error(`no Cursor rules found in ${srcDir}`);
  }
  const written = new Set();
  for (const file of sources) {
    const content = buildAgentRule(file, fs.readFileSync(path.join(srcDir, file), "utf8"));
    const destName = `${file.slice(0, -".mdc".length)}.md`;
    fs.writeFileSync(path.join(destDir, destName), content);
    written.add(destName);
    const { trigger } = validateAgentRule(content);
    console.log(`.agents/rules/${destName}  trigger=${trigger}  chars=${content.length}`);
  }
  for (const existing of fs.readdirSync(destDir)) {
    if (!existing.endsWith(".md") || written.has(existing)) continue;
    fs.unlinkSync(path.join(destDir, existing));
    console.log(`removed stale .agents/rules/${existing}`);
  }
}

function syncSkillLinks() {
  const cursorSkills = path.join(repoRoot, ".cursor/skills");
  const agentsSkills = path.join(repoRoot, ".agents/skills");
  fs.mkdirSync(agentsSkills, { recursive: true });
  const linked = new Set();

  for (const name of fs.readdirSync(cursorSkills).sort()) {
    const source = path.join(cursorSkills, name);
    let stat;
    try {
      stat = fs.statSync(source);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;
    if (!fs.existsSync(path.join(source, "SKILL.md"))) continue;

    const dest = path.join(agentsSkills, name);
    const relTarget = path.relative(agentsSkills, source);
    let current = null;
    try {
      current = fs.lstatSync(dest);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (current && !current.isSymbolicLink()) {
      console.log(`left .agents/skills/${name} in place (not a symlink)`);
      continue;
    }
    if (current && fs.readlinkSync(dest) === relTarget) {
      console.log(`.agents/skills/${name} -> ${relTarget}`);
    } else {
      if (current) fs.unlinkSync(dest);
      fs.symlinkSync(relTarget, dest);
      console.log(`linked .agents/skills/${name} -> ${relTarget}`);
    }
    linked.add(name);
  }

  for (const name of fs.readdirSync(agentsSkills)) {
    const dest = path.join(agentsSkills, name);
    if (!fs.lstatSync(dest).isSymbolicLink()) continue;
    const resolved = path.resolve(agentsSkills, fs.readlinkSync(dest));
    const insideCursorSkills =
      resolved === cursorSkills || resolved.startsWith(`${cursorSkills}${path.sep}`);
    if (insideCursorSkills && !linked.has(name)) {
      fs.unlinkSync(dest);
      console.log(`removed stale skill symlink .agents/skills/${name}`);
    }
  }
}

function main() {
  syncRules();
  syncSkillLinks();
}

const isDirect =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) main();
