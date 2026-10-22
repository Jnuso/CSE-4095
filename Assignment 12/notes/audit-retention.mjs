import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {writeFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
const require=createRequire(new URL('../math-practice-app/package.json',import.meta.url))
process.env.PLAYWRIGHT_BROWSERS_PATH=fileURLToPath(new URL('../math-practice-app/node_modules/.cache/playwright-browsers/',import.meta.url))
const {chromium,expect}=require('@playwright/test')
const browser=await chromium.launch({headless:true})
const context=await browser.newContext(),page=await context.newPage()
try {
 await page.goto('https://jnuso.github.io/CSE-4095/#/statistics')
 await page.evaluate(()=>{
  const settings={feedbackEnabled:true,soundEffectsEnabled:false,cardAnimationEnabled:true,showExplanations:true,defaultSessionLength:5,defaultDifficulty:1,defaultOperations:['addition'],masteryThreshold:3}
  const records=Array.from({length:101},(_,i)=>{
   const id='audit-session-'+i,start=Date.UTC(2026,9,1)+i*60000
   return {session:{id,startedAt:new Date(start).toISOString(),completedAt:new Date(start+10000).toISOString(),operations:['addition'],difficulty:1,sessionLength:5,reviewMode:'regular',attempted:5,correct:5,incorrect:0},attempts:Array.from({length:5},(_,j)=>({id:id+'-a'+j,questionId:id+'-q'+j,operation:'addition',firstOperand:1,secondOperand:1,correctAnswer:2,selectedAnswer:2,selfReportedCorrect:true,difficulty:1,source:'regular',attemptedAt:new Date(start+j*1000).toISOString(),sessionId:id}))}
  })
  localStorage.setItem('mathPractice.data',JSON.stringify({version:1,settings,records}))
 })
 await page.reload()
 const actual=page.locator('dl[aria-label="Overall results"]').getByText('Questions attempted',{exact:true}).locator('..').locator('dd')
 await expect(actual).toHaveText('500')
 await writeFile(new URL('../math-practice-app/output/playwright/audit/retention.txt',import.meta.url),'Fixture: 101 valid completed sessions, 5 correct attempts each. Expected lifetime total: 505. Displayed overall total: '+await actual.innerText()+'. This reproduces the intentional newest-100 limit, a compliance risk against total-statistics/aggregate-preservation requirements.')
 await page.screenshot({path:fileURLToPath(new URL('../math-practice-app/output/playwright/audit/retention.png',import.meta.url)),fullPage:true})
 console.log('CONFIRMED retention finding: 101 x 5 = 505 valid attempts; Overall results displays only 500.')
} finally {await context.close();await browser.close()}
