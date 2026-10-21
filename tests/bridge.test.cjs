const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync(require('node:path').join(__dirname, '../assets/review-bridge.js'), 'utf8');
function boot(values = {}) {
  const listeners = new Map();
  const scope = { ...values, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) };
  vm.runInNewContext(code, { window: scope });
  return { scope, listeners, bridge: scope.InlineReviewBridge.create() };
}
test('manual host does not invent submission or storage', () => {
  const { bridge } = boot();
  assert.equal(bridge.kind, 'manual'); assert.equal(bridge.canSend, false);
  assert.equal(bridge.load(), null); assert.equal(bridge.save({}), undefined);
  assert.throws(() => bridge.send({prompt:'hello'}), /unavailable/);
});
test('OpenAI submission is invoked synchronously and exact payload is preserved', () => {
  const calls=[]; const saved=[];
  const payload={prompt:'页面 A\n中文意见', title:'反馈'};
  const { bridge, listeners }=boot({openai:{widgetState:{privateContent:{draft:'未发送'}},sendFollowUpMessage: p=>{calls.push(p);return Promise.resolve();},setWidgetState:s=>saved.push(s)}});
  const result=bridge.send(payload);
  assert.equal(calls.length,1); assert.equal(calls[0],payload);
  assert.equal(bridge.load().privateContent.draft,'未发送');
  bridge.save({privateContent:{draft:'改'}}); assert.equal(saved.length,1);
  let received; const off=bridge.subscribe(x=>received=x);
  listeners.get('openai:set_globals')({detail:{globals:{widgetState:{x:1}}}});
  assert.equal(received.x,1); off(); assert.equal(listeners.size,0);
  return result;
});
test('explicit custom adapter takes priority and preserves method binding', () => {
  const custom={value:7,send(p){assert.equal(this.value,7);return p;},getState(){return {privateContent:{x:this.value}};}};
  const {bridge}=boot({inlineUiReviewHost:custom,openai:{sendFollowUpMessage(){throw Error('wrong host');}}});
  assert.equal(bridge.kind,'custom'); assert.equal(bridge.send('feedback'),'feedback');
  assert.equal(bridge.load().privateContent.x,7);
});
test('custom host with no send never borrows OpenAI transport', () => {
  const {bridge}=boot({inlineUiReviewHost:{},openai:{sendFollowUpMessage(){throw Error('must not send');}}});
  assert.equal(bridge.canSend,false); assert.throws(()=>bridge.send({}),/unavailable/);
});
test('cancellation and exceptions propagate for the UI to retain the draft', async () => {
  const {bridge}=boot({inlineUiReviewHost:{send(){return Promise.reject(new Error('cancelled'));}}});
  await assert.rejects(bridge.send({prompt:'preserve'}),/cancelled/);
});
test('late host initialization is detected without loading or sending automatically', () => {
  const {bridge,scope}=boot(); let calls=0;
  scope.openai={sendFollowUpMessage(){calls++;}};
  assert.equal(bridge.canSend,true); assert.equal(calls,0);
  bridge.send({prompt:'explicit'}); assert.equal(calls,1);
});
