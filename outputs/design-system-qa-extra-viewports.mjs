import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const base='http://127.0.0.1:4178';
const out='/Users/greatdamzi/Projects/Elevate-Frontend/outputs/design-system-qa/extra-viewports.json';
const routes=['/','/about/','/career-services/','/educational-services/','/blog/','/contact-us/','/diy-products/','/product/remote-job-playbook/'];
const vps=[{name:'mobile320',width:320,height:740},{name:'mobile412',width:412,height:915},{name:'smallLaptop1024',width:1024,height:900}];
const browser=await chromium.launch({headless:true});
const results=[];
for(const vp of vps){const page=await browser.newPage({viewport:{width:vp.width,height:vp.height}});for(const route of routes){let status=null,err=null;try{const res=await page.goto(base+route,{waitUntil:'networkidle',timeout:30000});status=res?.status()??null;}catch(e){err=String(e)}const data=err?{}:await page.evaluate(()=>({textLength:document.body.innerText.trim().length,overflowX:document.documentElement.scrollWidth>window.innerWidth+2,scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth,brokenImages:Array.from(document.images).filter(img=>img.offsetWidth&&(!img.complete||img.naturalWidth===0)).length,visibleShortcodes:(document.body.innerText.match(/\[[^\]]+\]/g)||[]),visibleFormLimit:document.body.innerText.includes('Maximum number of entries exceeded')}));results.push({viewport:vp.name,route,status,err,...data});}await page.close();}
await browser.close();
await fs.writeFile(out,JSON.stringify(results,null,2));
console.log(`Wrote ${out}`);
