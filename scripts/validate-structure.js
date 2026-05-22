const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

function articleTagsWithClass(text, className) {
  return [...text.matchAll(/<article\b[^>]*>/g)].filter((articleMatch) => {
    const classMatch = /\bclass="([^"]*)"/.exec(articleMatch[0]);
    if (!classMatch) return false;
    return classMatch[1].split(/\s+/).includes(className);
  });
}

const gridStartPattern =
  /<div\b(?=[^>]*\bid="cardsGrid")(?=[^>]*\bclass="[^"]*\bcards-grid\b)[^>]*>/;
const gridStartMatch = gridStartPattern.exec(html);

if (!gridStartMatch) {
  fail('Missing #cardsGrid program card container.');
}

const voidTags = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const tags = /<\/?([a-zA-Z][a-zA-Z0-9-]*)(?:\s[^>]*)?>/g;
tags.lastIndex = gridStartMatch.index + gridStartMatch[0].length;

let divDepth = 1;
let gridEnd = -1;
let match;

while ((match = tags.exec(html)) !== null) {
  const [tagText, tagName] = match;
  const normalized = tagName.toLowerCase();

  if (normalized !== 'div' || voidTags.has(normalized)) continue;

  if (tagText.startsWith('</')) {
    divDepth -= 1;
    if (divDepth === 0) {
      gridEnd = match.index;
      break;
    }
  } else if (!tagText.endsWith('/>')) {
    divDepth += 1;
  }
}

if (gridEnd === -1) {
  fail('Could not find closing tag for #cardsGrid.');
}

const gridHtml = html.slice(gridStartMatch.index, gridEnd);
const programCards = articleTagsWithClass(html, 'card');
const programCardsInsideGrid = articleTagsWithClass(gridHtml, 'card');
const totalProgramCards = programCards.length;
const cardsInsideGrid = programCardsInsideGrid.length;
const weatherTaggedCardsInsideGrid = programCardsInsideGrid.filter((articleMatch) =>
  /\bdata-weather=/.test(articleMatch[0]),
).length;

if (totalProgramCards !== 12) {
  fail(`Expected 12 program cards, found ${totalProgramCards}.`);
}

if (cardsInsideGrid !== totalProgramCards) {
  fail(
    `Expected all ${totalProgramCards} program cards inside #cardsGrid, found ${cardsInsideGrid}.`,
  );
}

if (weatherTaggedCardsInsideGrid !== totalProgramCards) {
  fail(
    `Expected all ${totalProgramCards} program cards to have data-weather, found ${weatherTaggedCardsInsideGrid}.`,
  );
}

console.log(`Validated ${cardsInsideGrid} filterable program cards inside #cardsGrid.`);
