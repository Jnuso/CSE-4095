import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const require=createRequire(new URL('../math-practice-app/package.json',import.meta.url))
process.env.PLAYWRIGHT_BROWSERS_PATH=fileURLToPath(new URL('../math-practice-app/node_modules/.cache/playwright-browsers/',import.meta.url))
const {chromium,expect}=require('@playwright/test')
const output=new URL('../math-practice-app/output/playwright/audit/',import.meta.url)
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true})
const context=await browser.newContext({viewport:{width:1440,height:1000}})
const page=await context.newPage(), evidence=[]
try {
  await page.goto('https://harmonious-puffpuff-ac1acc.netlify.app/')
  await page.screenshot({path:fileURLToPath(new URL('teacher-home.png',output)),fullPage:true})
  await page.getByRole('link',{name:'Start Practice',exact:true}).click()
  await page.locator('label[for="session-length-5"]').click()
  await expect(page.getByRole('radio',{name:'5 questions',exact:true})).toBeChecked()
  await page.screenshot({path:fileURLToPath(new URL('teacher-setup.png',output)),fullPage:true})
  await page.getByRole('button',{name:'Start Session',exact:true}).click()
  for(let i=0;i<5;i++) {
    await expect(page.getByRole('article',{name:'Practice question card'})).toContainText('Question '+(i+1)+' of 5')
    const text=await page.getByRole('article',{name:'Practice question card'}).getByRole('heading',{level:2,name:/= \?$/}).innerText()
    const m=text.match(/(\d+)\s*([+−×÷])\s*(\d+)/);assert(m)
    const a=+m[1],b=+m[3],answer=m[2]==='+'?a+b:m[2]==='−'?a-b:m[2]==='×'?a*b:a/b
    const choices=page.getByRole('group',{name:'Answer choices'}).getByRole('button')
    const labels=await choices.evaluateAll(els=>els.map(e=>e.getAttribute('aria-label')))
    const values=labels.map(s=>Number(s.match(/:\s*(-?\d+)/)[1]))
    assert.equal(new Set(values).size,4);assert(values.includes(answer))
    await expect(page.getByRole('button',{name:'Flip card to reveal the answer'})).toBeDisabled()
    await choices.nth(values.indexOf(answer)).click()
    await page.getByRole('button',{name:'Flip card to reveal the answer'}).click()
    await expect(page.getByRole('status').filter({hasText:'Answer revealed.'})).toContainText('= '+answer+'.')
    await page.getByRole('button',{name:i<3?'I got it right':'I got it wrong',exact:true}).click()
    evidence.push({text,values,answer,reportedRight:i<3})
  }
  await expect(page).toHaveURL(/practice\/summary/)
  await page.screenshot({path:fileURLToPath(new URL('teacher-recap.png',output)),fullPage:true})
  const recap=await page.locator('main').innerText()
  assert(recap.includes('60%'))
  await writeFile(new URL('teacher-recap.txt',output),recap)
  console.log('PASS teacher mixed 5-question session, independent arithmetic/unique choices/reveal, 3 right/2 wrong/60%, including wrong self-reports after correct choices')
  await page.getByRole('link',{name:'Settings',exact:true}).click()
  await expect(page.locator('main')).toContainText(/mastery/i)
  await writeFile(new URL('teacher-settings.txt',output),await page.locator('main').innerText())
  await page.screenshot({path:fileURLToPath(new URL('teacher-settings.png',output)),fullPage:true})
} finally {
  await writeFile(new URL('teacher-evidence.json',output),JSON.stringify(evidence,null,2))
  await context.close();await browser.close()
}
