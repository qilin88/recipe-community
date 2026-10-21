import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),output=path.join(root,'dist/pages');
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
await cp(path.join(root,'dist/client'),output,{recursive:true});
// Pages advanced-mode directory keeps every server module private. Never copy
// server code into the publicly served asset directory outside _worker.js.
await cp(path.join(root,'dist/server'),path.join(output,'_worker.js/server'),{recursive:true,filter:source=>!['wrangler.json','.vite'].includes(path.basename(source))});
await writeFile(path.join(output,'_worker.js/index.js'),`import worker from './server/index.js';
export default {async fetch(request,env,ctx){const result=await worker.fetch(request,env,ctx);const response=new Response(result.body,result);response.headers.set('Referrer-Policy','no-referrer');response.headers.set('X-Content-Type-Options','nosniff');return response;}};
`);
await writeFile(path.join(output,'_routes.json'),JSON.stringify({version:1,include:['/*'],exclude:['/_next/static/*','/favicon.svg']}));
await writeFile(path.join(output,'_headers'),`/*\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n`);
// The Vite Worker build emits a redirect that Pages must not follow.
await rm(path.join(root,'.wrangler/deploy/config.json'),{force:true});
console.log('Cloudflare Pages package: dist/pages (advanced-mode Worker + assets)');
