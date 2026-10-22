import {createRequire} from 'node:module'
import {writeFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
const require=createRequire(new URL('../math-practice-app/package.json',import.meta.url))
process.env.PLAYWRIGHT_BROWSERS_PATH=fileURLToPath(new URL('../math-practice-app/node_modules/.cache/playwright-browsers/',import.meta.url))
const {chromium,expect}=require('@playwright/test')
const browser=await chromium.launch({headless:true})
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})
const page=await context.newPage(),results=[]
try {
 await page.goto('https://jnuso.github.io/CSE-4095/#/statistics')
 await expect(page.getByRole('heading',{name:'Your statistics',exact:true})).toBeVisible()
 const menu=page.getByRole('navigation',{name:'Statistics sections'})
 for(let round=0;round<5;round++) {
  for(const name of ['By operation','By difficulty','Mistakes and review','Recent sessions','Reset history','Overview']) {
   const button=menu.getByRole('button',{name,exact:true})
   await button.click()
   try {await expect(button).toHaveAttribute('aria-current','location',{timeout:8000})}
   catch(error) {
    const state=await page.evaluate(()=>({scrollY,headings:[...document.querySelectorAll('main h1, main h2')].map(e=>({id:e.id,text:e.textContent,top:e.getBoundingClientRect().top})),active:[...document.querySelectorAll('[aria-current="location"]')].map(e=>e.textContent)}))
    results.push({round,name,failure:String(error),state})
    await page.screenshot({path:fileURLToPath(new URL('../math-practice-app/output/playwright/audit/statistics-menu-failure.png',import.meta.url)),fullPage:true})
    throw error
   }
   results.push({round,name,passed:true})
  }
 }
 console.log('PASS 30 hosted mobile section-menu jumps; CI intermittent failure not reproduced in this focused sample')
} finally {
 await writeFile(new URL('../math-practice-app/output/playwright/audit/statistics-menu.json',import.meta.url),JSON.stringify(results,null,2))
 await context.close();await browser.close()
}
