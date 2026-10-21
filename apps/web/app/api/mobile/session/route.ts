import {exchangeCode,revokeSession} from '../../../../lib/mobile-auth';
import {mobileCors,isDevAppOrigin} from '../../../../lib/mobile-security';
export function OPTIONS(request:Request){return mobileCors(request,new Response(null,{status:204}));}
export async function POST(request:Request){
 const reply=(value:unknown,status=200)=>mobileCors(request,Response.json(value,{status,headers:{'Cache-Control':'no-store','Pragma':'no-cache'}}));
 const origin=request.headers.get('origin'),server=new URL(request.url).origin;
 if(origin&&origin!==server&&!isDevAppOrigin(server,origin))return reply({error:'请求来源无效'},403);
 try{if(Number(request.headers.get('content-length'))>4096)return reply({error:'请求过大'},413);const value=await request.json() as Record<string,unknown>;
 if(value.action==='exchange')return reply(await exchangeCode(String(value.code||''),String(value.verifier||'')));
 if(value.action==='revoke'){await revokeSession(request);return reply({ok:true});}
 return reply({error:'不支持的操作'},400);
 }catch(e){return reply({error:e instanceof Error&&!e.message.includes('D1')?e.message:'设备登录失败'},400);}
}
