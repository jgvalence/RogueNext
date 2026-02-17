module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation changes
        "style", // Code style changes (formatting, etc.)
        "refactor", // Code refactoring
        "perf", // Performance improvements
        "test", // Adding or updating tests
        "build", // Build system or external dependencies
        "ci", // CI/CD changes
        "chore", // Other changes (maintenance, etc.)
        "revert", // Revert a previous commit
      ],
    ],
    "subject-case": [2, "never", ["upper-case"]],
  },
};
