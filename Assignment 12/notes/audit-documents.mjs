import {readFile,readdir,writeFile,stat} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import path from 'node:path'
const root=fileURLToPath(new URL('../',import.meta.url))
const files=[]
for(const directory of [root,path.join(root,'docs')])
 for(const file of await readdir(directory)) if(/\.(md|txt)$/.test(file)) files.push(path.join(directory,file))
const broken=[],headings=[],pending=[]
let characters=0,links=0
for(const file of files) {
 const text=await readFile(file,'utf8');characters+=text.length
 headings.push({file:path.relative(root,file),headings:text.split('\n').filter(s=>/^#{1,3} /.test(s))})
 for(const [all,raw] of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
  const target=raw.replace(/^<|>$/g,'').split('#')[0]
  if(!target||/^[a-z]+:/i.test(target)) continue
  links++
  try {await stat(path.resolve(path.dirname(file),decodeURIComponent(target)))}
  catch {broken.push({file:path.relative(root,file),target})}
 }
 pending.push({file:path.relative(root,file),statements:text.split('\n').filter(s=>/not yet|pending|remain.*unverified|incomplete|not.*published/i.test(s)).slice(0,12)})
}
const result={documents:files.length,characters,links,broken,headings,pending}
await writeFile(path.join(root,'math-practice-app/output/audit-documents.json'),JSON.stringify(result,null,2))
console.log(JSON.stringify({documents:files.length,characters,links,broken},null,2))
