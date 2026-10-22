import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const require = createRequire(new URL('../math-practice-app/package.json', import.meta.url))
process.env.PLAYWRIGHT_BROWSERS_PATH = fileURLToPath(new URL('../math-practice-app/node_modules/.cache/playwright-browsers/', import.meta.url))
const { chromium, expect } = require('@playwright/test')
const output = new URL('../math-practice-app/output/playwright/audit/', import.meta.url)
await mkdir(output, {recursive:true})
const browser = await chromium.launch({headless:true})
const context = await browser.newContext({viewport:{width:1440,height:1000}})
const page = await context.newPage()
const errors = [], evidence = []
page.on('pageerror',e=>errors.push(e.message))
page.on('console',m=>{if(m.type()==='error') errors.push(m.text())})
const base = 'https://jnuso.github.io/CSE-4095/'
async function snap(name) {
  await writeFile(new URL(name+'.txt',output),await page.locator('body').innerText())
  await page.screenshot({path:fileURLToPath(new URL(name+'.png',output)),fullPage:true})
}
async function overflow() {assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth))}
async function answer(right) {
  const card=page.getByRole('region',{name:'Math question card',exact:true})
  const text=await card.getByRole('heading',{level:2}).innerText()
  const m=text.match(/(\d+)\s*([+−×÷])\s*(\d+)/)
  assert(m,'Question parses: '+text)
  const a=+m[1],b=+m[3],value=m[2]==='+'?a+b:m[2]==='−'?a-b:m[2]==='×'?a*b:a/b
  assert(Number.isSafeInteger(value)&&value>=0)
  const buttons=page.getByRole('group',{name:'Answer choices',exact:true}).getByRole('button')
  const choices=(await buttons.allTextContents()).map(t=>Number(t.match(/-?\d+/)[0]))
  assert.equal(new Set(choices).size,4); assert(choices.includes(value),JSON.stringify({text,choices,value}))
  await expect(page.getByRole('button',{name:'Flip Card',exact:true})).toBeDisabled()
  await buttons.nth(choices.indexOf(value)).click()
  await page.getByRole('button',{name:'Flip Card',exact:true}).click()
  await expect(card.getByRole('heading',{name:'Correct answer: '+value,exact:true})).toBeVisible()
  await page.getByRole('button',{name:right?'I Got It Right':'I Got It Wrong',exact:true}).click()
  evidence.push({text,choices,value,right})
}
try {
  await page.goto(base); await snap('home-desktop')
  for(const op of ['Addition','Subtraction','Multiplication','Division']) {
    for(const level of ['Beginner','Easy','Intermediate','Advanced']) {
      await page.goto(base+'#/practice/setup')
      await page.getByRole('button',{name:'Clear selection',exact:true}).click()
      await expect(page.getByRole('button',{name:'Start Session',exact:true})).toBeDisabled()
      await page.getByRole('checkbox',{name:op,exact:true}).check()
      await page.getByRole('radio',{name:new RegExp('^'+level)}).check()
      await page.getByRole('radio',{name:'5 questions',exact:true}).check()
      await page.getByRole('button',{name:'Start Session',exact:true}).click()
      for(let i=0;i<5;i++) await answer(i!==0)
      await expect(page.getByRole('heading',{name:'Your practice recap',exact:true})).toBeVisible()
      await expect(page.getByText('Accuracy',{exact:true}).locator('..').locator('dd')).toHaveText('80%')
      console.log('PASS hosted',op,level,'5 attempts, 4 right, 1 wrong, 80%')
    }
  }
  await page.reload()
  await expect(page.getByText('Accuracy',{exact:true}).locator('..').locator('dd')).toHaveText('80%')
  await snap('recap-desktop')
  await page.goto(base+'#/practice/setup')
  await page.getByRole('radio',{name:'Mistake review',exact:true}).check()
  await page.getByRole('button',{name:'Clear selection',exact:true}).click()
  await page.getByRole('checkbox',{name:'Addition',exact:true}).check()
  await page.getByRole('radio',{name:/^Beginner/}).check()
  await page.getByRole('radio',{name:'Continuous practice',exact:true}).check()
  await page.getByRole('button',{name:'Start Session',exact:true}).click()
  for(let i=0;i<3;i++) await answer(true)
  await expect(page.getByRole('heading',{name:'Your practice recap',exact:true})).toBeVisible()
  await expect(page.getByText('Mistake-review questions completed',{exact:true}).locator('..').locator('dd')).toHaveText('3')
  await page.goto(base+'#/statistics'); await page.reload()
  const totals=page.getByRole('definition',{name:'unused'})
  await expect(page.getByRole('heading',{name:'Your statistics',exact:true})).toBeVisible()
  const overall=page.locator('dl[aria-label="Overall results"]')
  await expect(overall.getByText('Questions attempted',{exact:true}).locator('..').locator('dd')).toHaveText('83')
  await snap('statistics-desktop'); await overflow()
  await page.goto(base+'#/settings'); await page.reload()
  await expect(page.getByLabel('Mastery threshold',{exact:true})).toHaveValue('3')
  await page.getByLabel('Mastery threshold',{exact:true}).fill('4')
  await page.getByRole('button',{name:'Save Settings',exact:true}).click()
  await page.reload(); await expect(page.getByLabel('Mastery threshold',{exact:true})).toHaveValue('4')
  await snap('settings-desktop')
  await page.setViewportSize({width:320,height:740})
  for(const route of ['','practice/setup','statistics','settings','unknown-page','practice/summary']) {
    await page.goto(base+'#/'+route); await page.reload(); await overflow(); await snap('mobile-'+(route.replaceAll('/','-')||'home'))
  }
  assert.deepEqual(errors,[])
  console.log('PASS hosted review mastery, settings persistence, recap reload, 83 total attempts, every route/refresh and 320px overflow; zero runtime/console errors')
} finally {
  await writeFile(new URL('evidence.json',output),JSON.stringify({evidence,errors},null,2))
  await context.close(); await browser.close()
}
