# For Glama's release build (security scan) and anyone who wants to run
# the MCP server as a container. Stdio transport; talks to the hosted
# ablaut API, so it needs ABLAUT_API_KEY at runtime for the engine
# tools (list_languages works without one).
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY index.js LICENSE-MIT LICENSE-APACHE ./
ENTRYPOINT ["node", "index.js"]
