#!/usr/bin/env node
// MCP server exposing the ablaut conjugation engine over stdio. The
// engine is the same WebAssembly build that powers ablaut.dev; it runs
// entirely in-process, so conjugation needs no network and answers in
// microseconds.
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import init, { conjugate } from "./vendor/ablaut.js";

await init({
  module_or_path: readFileSync(new URL("./vendor/ablaut_bg.wasm", import.meta.url)),
});

const LANGUAGES = [
  { code: "de", iso3: "deu", name: "German", status: "beta" },
  { code: "fr", iso3: "fra", name: "French", status: "beta" },
  { code: "es", iso3: "spa", name: "Spanish", status: "beta" },
  { code: "pt", iso3: "por", name: "Portuguese", status: "beta" },
  { code: "it", iso3: "ita", name: "Italian", status: "beta" },
  { code: "ro", iso3: "ron", name: "Romanian", status: "beta" },
  { code: "sv", iso3: "swe", name: "Swedish", status: "beta" },
  { code: "en", iso3: "eng", name: "English", status: "beta" },
  { code: "da", iso3: "dan", name: "Danish", status: "wip" },
  { code: "cs", iso3: "ces", name: "Czech", status: "wip" },
  { code: "sl", iso3: "slv", name: "Slovenian", status: "wip" },
  { code: "et", iso3: "est", name: "Estonian", status: "beta" },
  { code: "fi", iso3: "fin", name: "Finnish", status: "beta" },
  { code: "ga", iso3: "gle", name: "Irish", status: "wip" },
];

const server = new McpServer({ name: "ablaut", version: "0.1.0" });

server.registerTool(
  "conjugate",
  {
    title: "Conjugate a verb",
    description:
      "Full conjugation table for a verb in one of 15 European languages. " +
      "Input is the infinitive (e.g. 'aufstehen', 'appeler', 'vorbi'); " +
      "the result covers every simple and composed tense of the " +
      "language's written standard, validated against two independent " +
      "gold lexicons. Runs locally, no network.",
    inputSchema: {
      verb: z.string().describe("The infinitive to conjugate"),
      language: z
        .string()
        .default("de")
        .describe(
          "Language code (ISO 639-1 like 'fr', ISO 639-3 like 'fra', or an English name like 'French'). Defaults to German."
        ),
    },
  },
  async ({ verb, language }) => {
    try {
      const table = conjugate(verb, language ?? "de");
      return {
        content: [{ type: "text", text: JSON.stringify(table, null, 2) }],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text",
            text: `${String(e)}. Use list_languages to see supported languages; the verb must be an infinitive of the requested language.`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "list_languages",
  {
    title: "List supported languages",
    description:
      "The 15 languages ablaut conjugates, with their codes and maturity status (beta: verified at 100% against two gold lexicons; wip: known gaps).",
    inputSchema: {},
  },
  async () => ({
    content: [{ type: "text", text: JSON.stringify(LANGUAGES, null, 2) }],
  })
);

await server.connect(new StdioServerTransport());
