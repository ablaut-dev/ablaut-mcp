#!/usr/bin/env node
// MCP server for the ablaut conjugation API. Each tool call is one
// HTTP request to the hosted service; the engine itself runs there as
// native Rust. Point ABLAUT_API_URL elsewhere to use another instance.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = (process.env.ABLAUT_API_URL ?? "https://api.ablaut.dev").replace(/\/$/, "");

const server = new McpServer({ name: "ablaut", version: "0.3.1" });

async function call(path) {
  const headers = {};
  if (process.env.ABLAUT_API_KEY) headers["x-api-key"] = process.env.ABLAUT_API_KEY;
  const res = await fetch(`${BASE}${path}`, { headers });
  const body = await res.text();
  return { ok: res.ok, body };
}

server.registerTool(
  "conjugate",
  {
    title: "Conjugate a verb",
    description:
      "Full conjugation table for a verb in one of 14 European languages. " +
      "Input is the infinitive (e.g. 'aufstehen', 'appeler', 'vorbi'); " +
      "the result covers the language's written standard, validated " +
      "against two independent gold lexicons. Field reference: " +
      "https://www.ablaut.dev/api",
    inputSchema: {
      verb: z.string().describe("The infinitive to conjugate"),
      language: z
        .string()
        .default("de")
        .describe(
          "Language code (ISO 639-1 like 'fr', ISO 639-3 like 'fra', or an English name like 'French'). Defaults to German."
        ),
    },
    outputSchema: {
      verb: z.string(),
      lang: z.string(),
      table: z
        .record(z.any())
        .describe("The conjugation table; fields are language-specific"),
    },
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  async ({ verb, language }) => {
    try {
      const params = new URLSearchParams({ verb, lang: language ?? "de" });
      const { ok, body } = await call(`/v1/conjugate?${params}`);
      if (!ok) {
        return {
          content: [
            {
              type: "text",
              text: `${body} Use list_languages to see supported languages; the verb must be an infinitive of the requested language.`,
            },
          ],
          isError: true,
        };
      }
      return { content: [{ type: "text", text: body }], structuredContent: JSON.parse(body) };
    } catch (e) {
      return {
        content: [{ type: "text", text: `ablaut API unreachable: ${String(e)}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "find_infinitive",
  {
    title: "Find the infinitive of a conjugated form",
    description:
      "Reverse lookup: given any conjugated form and a language, " +
      "returns the infinitive(s) whose paradigm contains it, with the " +
      "slots it occupies (e.g. 'suis' in French matches both être and " +
      "suivre). Full coverage for fr/es/de/en; irregular forms in all " +
      "14 languages.",
    inputSchema: {
      form: z.string().describe("The conjugated form to look up"),
      language: z
        .string()
        .describe("Language code (ISO 639-1, ISO 639-3, or an English name)"),
    },
    outputSchema: {
      form: z.string(),
      matches: z.array(
        z.object({
          infinitive: z.string(),
          slots: z
            .array(z.string())
            .describe("Where the form occurs, e.g. 'present 1sg'"),
        })
      ),
    },
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  async ({ form, language }) => {
    try {
      const params = new URLSearchParams({ form, lang: language });
      const { ok, body } = await call(`/v1/lemma?${params}`);
      return ok
        ? { content: [{ type: "text", text: body }], structuredContent: JSON.parse(body) }
        : { content: [{ type: "text", text: body }], isError: true };
    } catch (e) {
      return {
        content: [{ type: "text", text: `ablaut API unreachable: ${String(e)}` }],
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
      "The 14 languages ablaut conjugates, with their codes and maturity status (beta: verified at 100% against two gold lexicons; wip: known gaps).",
    inputSchema: {},
    outputSchema: {
      languages: z.array(
        z.object({
          code: z.string(),
          iso3: z.string(),
          name: z.string(),
          status: z.string(),
        })
      ),
    },
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  async () => {
    try {
      const { ok, body } = await call("/v1/languages");
      return ok
        ? { content: [{ type: "text", text: body }], structuredContent: JSON.parse(body) }
        : { content: [{ type: "text", text: body }], isError: true };
    } catch (e) {
      return {
        content: [{ type: "text", text: `ablaut API unreachable: ${String(e)}` }],
        isError: true,
      };
    }
  }
);

await server.connect(new StdioServerTransport());
