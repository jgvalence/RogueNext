import { auditStoryDescriptions } from "../src/game/engine/story-description-audit";

const issues = auditStoryDescriptions();

if (issues.length === 0) {
  console.log("Story description audit: OK");
  process.exit(0);
}

console.log("# Story description audit");
console.log("");
for (const issue of issues) {
  console.log(
    `- [${issue.locale}] ${issue.storyId} (${issue.bonusType}): ${issue.message}`
  );
}

process.exit(1);
