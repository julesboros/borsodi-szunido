const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const htmlForParse = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '<script></script>');

const voidTags = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

function parseAttrs(rawAttrs) {
  const attrs = {};
  const attrPattern = /([^\s"'=<>`/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;

  while ((match = attrPattern.exec(rawAttrs)) !== null) {
    attrs[match[1]] = match[2] ?? match[3] ?? match[4] ?? '';
  }

  return attrs;
}

function parseHtml(source) {
  const root = { tag: '#root', attrs: {}, children: [], parent: null };
  const stack = [root];
  const tagPattern = /<\/?([a-zA-Z][\w:-]*)([^>]*)>/g;
  const errors = [];
  let match;

  while ((match = tagPattern.exec(source)) !== null) {
    const full = match[0];
    const tag = match[1].toLowerCase();
    const rawAttrs = match[2] || '';

    if (full.startsWith('</')) {
      const current = stack.pop();
      if (!current || current.tag !== tag) {
        errors.push(`Unexpected closing tag </${tag}>`);
      }
      continue;
    }

    const node = {
      tag,
      attrs: parseAttrs(rawAttrs),
      children: [],
      parent: stack[stack.length - 1],
    };
    stack[stack.length - 1].children.push(node);

    if (!voidTags.has(tag) && !rawAttrs.trim().endsWith('/')) {
      stack.push(node);
    }
  }

  if (stack.length !== 1) {
    errors.push(`Unclosed tags: ${stack.slice(1).map(node => node.tag).join(', ')}`);
  }

  return { root, errors };
}

function hasClass(node, className) {
  return (node.attrs.class || '').split(/\s+/).includes(className);
}

function findAll(node, predicate, results = []) {
  if (predicate(node)) {
    results.push(node);
  }

  for (const child of node.children || []) {
    findAll(child, predicate, results);
  }

  return results;
}

function findById(root, id) {
  return findAll(root, node => node.attrs && node.attrs.id === id)[0];
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const { root, errors } = parseHtml(htmlForParse);
assert(errors.length === 0, `HTML structure errors:\n${errors.join('\n')}`);

const cardsGrid = findById(root, 'cardsGrid');
assert(cardsGrid, 'Expected #cardsGrid to exist');

const allCards = findAll(root, node => node.tag === 'article' && hasClass(node, 'card'));
const gridCards = findAll(cardsGrid, node => node.tag === 'article' && hasClass(node, 'card'));
assert(allCards.length === 12, `Expected 12 program cards, found ${allCards.length}`);
assert(gridCards.length === 12, `Expected all 12 program cards inside #cardsGrid, found ${gridCards.length}`);

const cardsWithoutWeather = gridCards.filter(card => !card.attrs['data-weather']);
assert(cardsWithoutWeather.length === 0, 'Every program card in #cardsGrid must have data-weather');

const navTargets = findAll(root, node => node.tag === 'a' && (node.attrs.href || '').startsWith('#'))
  .map(node => node.attrs.href.slice(1))
  .filter(Boolean);

for (const target of navTargets) {
  assert(findById(root, target), `Navigation target #${target} is missing`);
}

const restaurants = findById(root, 'ettermek');
assert(restaurants, 'Expected #ettermek section to exist');

const restaurantCards = findAll(restaurants, node => node.tag === 'article' && hasClass(node, 'restaurant-card-v2'));
assert(restaurantCards.length === 6, `Expected 6 restaurant cards in #ettermek, found ${restaurantCards.length}`);

console.log('Structure validation passed');
