'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../public/google-ads-line.js'), 'utf8');
const officialLine = 'https://lin.ee/v1IeCtP';

function setup(options = {}) {
  const calls = [];
  const listeners = {};
  const warnings = [];
  const context = {
    URL,
    console: { warn: (message) => warnings.push(message) },
    window: {
      location: { href: 'https://example.test/knowledge/five-face-types' },
      gtag: (...args) => calls.push(args),
    },
    document: {
      currentScript: { getAttribute: () => options.url || officialLine },
      addEventListener: (name, listener) => { listeners[name] = listener; },
    },
  };
  if (options.unavailable) delete context.window.gtag;
  if (options.throws) context.window.gtag = () => { throw new Error('Blocked'); };
  vm.runInNewContext(code, context);
  function click(href = officialLine, properties = {}) {
    const anchor = { href, target: '_blank' };
    const event = {
      type: 'click', button: 0, defaultPrevented: false,
      target: { closest: () => anchor },
      preventDefault: () => { throw new Error('Navigation must not be blocked'); },
      ...properties,
    };
    listeners[event.type](event);
    assert.equal(anchor.href, href);
    assert.equal(anchor.target, '_blank');
  }
  return { calls, listeners, warnings, context, click };
}

test('page load sends no conversion; one actual LINE click sends the supplied label only', () => {
  const state = setup();
  assert.equal(state.calls.length, 0);
  state.click();
  assert.deepEqual(JSON.parse(JSON.stringify(state.calls)), [[
    'event', 'conversion', { send_to: 'AW-18469650813/uDjRCPPtgo4dEP2CgudE' },
  ]]);
});

test('non-LINE links and different LINE accounts do not count', () => {
  const state = setup();
  ['/appointment', 'https://lin.ee/another-account', 'https://lin.ee.evil.test/v1IeCtP',
    'https://example.test/', 'tel:0212345678'].forEach((url) => state.click(url));
  state.click(officialLine, { target: { closest: () => null } });
  assert.equal(state.calls.length, 0);
});

test('nested icon clicks, keyboard clicks, modifier clicks and middle clicks each count once', () => {
  const state = setup();
  state.click();
  state.click(officialLine, { detail: 0 });
  state.click(officialLine, { ctrlKey: true });
  state.click(officialLine, { type: 'auxclick', button: 1 });
  assert.equal(state.calls.length, 4);
  state.click(officialLine, { button: 2 });
  state.click(officialLine, { type: 'auxclick', button: 2 });
  state.click(officialLine, { defaultPrevented: true });
  assert.equal(state.calls.length, 4);
});

test('duplicate script initialization does not register another listener', () => {
  const state = setup();
  state.context.document.addEventListener = () => assert.fail('Duplicate listener');
  vm.runInNewContext(code, state.context);
  state.click();
  assert.equal(state.calls.length, 1);
});

test('unavailable or blocked tracking does not interfere with the LINE link', () => {
  for (const options of [{ unavailable: true }, { throws: true }]) {
    const state = setup(options);
    state.click();
    assert.equal(state.warnings.length, 1);
    assert.equal(state.calls.length, 0);
  }
});

test('invalid official URL disables tracking explicitly', () => {
  const state = setup({ url: 'https://example.test/not-line' });
  assert.equal(Object.keys(state.listeners).length, 0);
  assert.equal(state.warnings.length, 1);
  assert.equal(state.calls.length, 0);
});