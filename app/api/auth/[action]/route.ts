import {authService} from '../../../../lib/email-auth/runtime';
import {isAllowedAuthPost} from '../../../../lib/email-auth/http';
import {readSession,sessionCookie,safeReturnPath} from '../../../../lib/email-auth/security';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{action:string}>}){
 const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 if(!isAllowedAuthPost(request))return json({error:'请求来源或格式无效'},403);
 try{
  const text=await request.text();if(new TextEncoder().encode(text).length>8192)return json({error:'请求内容过大'},413);
  const body=JSON.parse(text) as Record<string,unknown>;if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'请求格式无效'},400);
  const {action}=await params;if(!['register','login','logout'].includes(action))return json({error:'操作不存在'},404);
  const auth=authService(),ip=request.headers.get('cf-connecting-ip')||'local';
  await auth.limit('ip:'+ip+':'+action,action==='login'?50:20,3600000);
  if(action==='register'){await auth.register(body);return json({ok:true});}
  if(action==='login'){const session=await auth.login(body.email,body.password);const response=json({ok:true,returnTo:safeReturnPath(body.returnTo)});response.headers.set('Set-Cookie',sessionCookie(session.token,7*86400,new URL(request.url).protocol==='https:'));return response;}
  await auth.logout(readSession(request.headers.get('cookie')));const response=json({ok:true});response.headers.set('Set-Cookie',sessionCookie('',0,new URL(request.url).protocol==='https:'));return response;
 }catch(error){if(error instanceof SyntaxError)return json({error:'请求格式无效'},400);const message=error instanceof Error?error.message:'';const expected=/频繁|邮箱|密码|昵称|登录状态/.test(message);return json({error:expected?message:'操作失败，请稍后重试'},message.includes('频繁')?429:400);}
}
