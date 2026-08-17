# ablaut-mcp

An [MCP](https://modelcontextprotocol.io) server that lets AI agents
conjugate verbs in 15 European languages. It wraps the
[ablaut](https://github.com/ablaut-dev/ablaut) engine as WebAssembly, so
everything runs locally: no network, no API key, microsecond answers.

Try the engine in the browser at [ablaut.dev](https://www.ablaut.dev).

## Setup

Claude Code:

```sh
claude mcp add ablaut -- npx -y @v4nn4/ablaut-mcp
```

Claude Desktop, Cursor, or any other MCP client:

```json
{
  "mcpServers": {
    "ablaut": {
      "command": "npx",
      "args": ["-y", "@v4nn4/ablaut-mcp"]
    }
  }
}
```

## Tools

- **conjugate** `(verb, language)`: the full conjugation table for an
  infinitive, covering every simple and composed tense of the
  language's written standard. Language codes are ISO 639-1 (`fr`),
  ISO 639-3 (`fra`), or English names (`French`), case-insensitive.
- **list_languages**: supported languages and their maturity status.

## Languages

German, French, Spanish, Portuguese, Italian, Romanian, Swedish,
English, Danish, Czech, Slovenian, Estonian, Finnish, and Irish.
Every language is validated against two independent gold lexicons;
see the [ablaut repository](https://github.com/ablaut-dev/ablaut) for
per-language accuracy and adjudication logs.

## Hosted API

We are building a hosted conjugation API (REST and remote MCP):
sub-millisecond responses, EU-hosted, one endpoint for all languages.
Interested? Tell us at [ablaut.dev](https://www.ablaut.dev).

## License

MIT OR Apache-2.0.
