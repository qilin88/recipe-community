import {createTestAccount} from './helpers/http-accounts.mjs';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base=process.env.TEST_ORIGIN||'http://127.0.0.1:8787',account=await createTestAccount(base,'mobile-test-'+Date.now()),user=account.userId,headers={cookie:account.cookie,origin:base,'content-type':'application/json'};
const verifier=randomBytes(32).toString('hex'),challenge=createHash('sha256').update(verifier).digest('base64url'),state=randomBytes(16).toString('hex');let checks=0;
function ok(value,label){assert.ok(value,label);checks++;console.log('PASS '+label);}
async function json(path,body,extra={}){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...extra},body:body?JSON.stringify(body):undefined});return {status:r.status,headers:r.headers,data:await r.json()};}
async function issue(){const r=await json('/api/mobile/authorize',{challenge,state,redirect_uri:'shiguang://auth'},headers);assert.equal(r.status,200);return new URL(r.data.redirect).searchParams.get('code');}
function expire(table,column,secret){const hash=createHash('sha256').update(secret).digest('hex');execFileSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--persist-to','.wrangler/state','--command',`UPDATE ${table} SET expiresAt=0 WHERE ${column}='${hash}'`],{stdio:'pipe'});}
const params={challenge,state,redirect_uri:'shiguang://auth'};
ok((await json('/api/mobile/authorize',params,{origin:base})).status===401,'authorization requires browser identity');
ok((await json('/api/mobile/authorize',params,{...headers,origin:'https://evil.example'})).status===403,'cross-origin authorization rejected');
ok((await json('/api/mobile/authorize',{...params,redirect_uri:'https://evil.example'},headers)).status===400,'unregistered callback rejected');
const code=await issue();ok(!!code,'authenticated browser receives one-time callback code');
ok((await json('/api/mobile/session',{action:'exchange',code,verifier:'x'.repeat(64)})).status===400,'wrong PKCE verifier rejected');
const exchange=await json('/api/mobile/session',{action:'exchange',code,verifier});const token=exchange.data.token;ok(exchange.status===200&&token.length===64,'PKCE exchange yields device session');
ok((await json('/api/mobile/session',{action:'exchange',code,verifier})).status===400,'authorization code replay rejected');
const profile=await json('/api/community',null,{authorization:'Bearer '+token});ok(profile.data.me?.id===user,'device token resolves correct user');
ok((await json('/api/community',{action:'profile',name:'移动测试厨房',bio:'test'},{authorization:'Bearer '+token})).status===200,'device token authorizes existing community actions');
const cors=await fetch(base+'/api/community',{method:'OPTIONS',headers:{origin:'http://localhost:8081','access-control-request-headers':'authorization,content-type'}});ok(cors.headers.get('access-control-allow-origin')==='http://localhost:8081','loopback web preview CORS allowed');
const denied=await fetch(base+'/api/community',{headers:{origin:'https://evil.example'}});ok(!denied.headers.get('access-control-allow-origin'),'arbitrary browser origins not allowed');
ok((await json('/api/mobile/session',{action:'revoke'},{authorization:'Bearer '+token})).status===200,'device logout revokes session');
ok((await json('/api/community',null,{authorization:'Bearer '+token})).data.me===null,'revoked token cannot authenticate');
const expiredCode=await issue();expire('mobile_codes','codeHash',expiredCode);ok((await json('/api/mobile/session',{action:'exchange',code:expiredCode,verifier})).status===400,'expired code rejected');
const secondCode=await issue(),second=await json('/api/mobile/session',{action:'exchange',code:secondCode,verifier});expire('mobile_sessions','tokenHash',second.data.token);ok((await json('/api/community',null,{authorization:'Bearer '+second.data.token})).data.me===null,'expired device session rejected');
console.log(`\n${checks} mobile integration checks passed.`);
