import { readFile, writeFile } from "node:fs/promises";
import postcss from "postcss";

const file = new URL("../src/app/globals.css", import.meta.url);
const root = postcss.parse(await readFile(file, "utf8"), { from: file.pathname });
const seen = new Map();
let removed = 0;

function contextFor(node) {
  const context = [];
  let parent = node.parent;
  while (parent && parent.type !== "root") {
    if (parent.type === "atrule") context.unshift(`@${parent.name} ${parent.params}`);
    parent = parent.parent;
  }
  return context.join(" > ");
}

root.walkRules((rule) => {
  const key = `${contextFor(rule)}|||${rule.selector.replace(/\s+/g, " ").trim()}`;
  const rules = seen.get(key) ?? [];
  rules.push(rule);
  seen.set(key, rules);
});

for (const rules of seen.values()) {
  if (rules.length < 2) continue;
  const latestByProperty = new Map();
  for (const rule of rules) {
    rule.walkDecls((declaration) => latestByProperty.set(declaration.prop, declaration));
  }
  for (const rule of rules) {
    rule.walkDecls((declaration) => {
      if (latestByProperty.get(declaration.prop) !== declaration) {
        declaration.remove();
        removed += 1;
      }
    });
    if (!rule.nodes?.some((node) => node.type === "decl" || node.type === "atrule")) rule.remove();
  }
}

await writeFile(file, root.toString(), "utf8");
console.log(`Removed ${removed} superseded CSS declarations; latest values retained.`);
