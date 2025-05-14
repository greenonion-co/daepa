module.exports = {
  backendApi: {
    input: "http://localhost:4000/api-docs/json",
    output: {
      workspace: "packages/api-client",
      baseUrl: "http://localhost:4000",
      target: "src/api/index.ts",
      schemas: "src/model",
      mock: true,
    },
    hooks: {
      afterAllFilesWrite: "prettier --write",
    },
  },
};
