// Optional integration checks: requires Playwright and a Chromium browser.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');

(async () => {
  const output = path.resolve(process.argv[2] || 'work/browser-test');
  fs.mkdirSync(output, {recursive:true});
  const preview=path.join(output,'portable.html');
  const result=spawnSync(process.env.PYTHON || 'python3',[path.join(__dirname,'../scripts/build_preview.py'),'--mode','portable','--out',preview,'--force'],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN ? {executablePath:process.env.CHROME_BIN} : {})});
  const checks=[];
  try {
    for (const host of ['manual','custom']) {
      const context=await browser.newContext({viewport:{width:736,height:1000}});
      if(host==='custom') await context.addInitScript(() => {
        window.recorded=[];
        window.inlineUiReviewHost={send(payload){window.recorded.push(payload); return Promise.resolve();}};
      });
      const page=await context.newPage(); const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto(pathToFileURL(preview).href);
      const button=page.locator('[data-send]');
      assert.equal(await button.innerText(),host==='manual'?'整理修改意见':'发送修改意见');
      await button.click(); assert.match(await page.locator('[data-error]').innerText(),/请先填写/);
      await page.getByRole('checkbox',{name:'充电器'}).check();
      const text='页面按钮放大\n保留当前内容 <script>literal</script>';
      await page.locator('#inline-review-demo-v1-note').fill(text);
      await page.getByRole('button',{name:'已完成',exact:true}).click();
      assert.equal(await page.locator('[data-item]:visible').count(),1);
      await page.getByRole('button',{name:'行前清单',exact:true}).click();
      assert.equal(await page.locator('#inline-review-demo-v1-note').inputValue(),text);
      await button.click();
      if(host==='manual') {
        assert.equal(await page.locator('[data-fallback-text]').isVisible(),true);
        assert((await page.locator('[data-fallback-text]').inputValue()).includes(text));
      } else {
        const sent=await page.evaluate(()=>window.recorded);
        assert.equal(sent.length,1); assert(sent[0].prompt.includes(text));
        assert(sent[0].prompt.includes('行前清单（list）'));
        assert(sent[0].prompt.includes('portable.html'));
        assert.match(await page.locator('[data-status]').innerText(),/已请求发送/);
      }
      for(const width of [320,736]) {
        await page.setViewportSize({width,height:1000});
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
      }
      await page.screenshot({path:path.join(output,host+'.png'),fullPage:true});
      assert.deepEqual(errors,[]);
      checks.push(host+' browser interaction and feedback');
      await context.close();
    }
    console.log(JSON.stringify({passed:checks,realChatDelivery:'not tested'},null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
