import {getChatGPTUser} from '../../../chatgpt-auth';
import {validateAuthRequest} from '../../../../lib/mobile-security';
import {issueCode} from '../../../../lib/mobile-auth';
export async function POST(request:Request){
 const origin=new URL(request.url).origin;
 if(request.headers.get('origin')!==origin)return Response.json({error:'请求来源无效'},{status:403});
 const user=await getChatGPTUser();if(!user)return Response.json({error:'请先在浏览器登录网站'},{status:401});
 try{const p=validateAuthRequest(await request.json() as Record<string,unknown>,origin);const code=await issueCode(user,p.challenge);const callback=new URL(p.redirect);callback.searchParams.set('code',code);callback.searchParams.set('state',p.state);return Response.json({redirect:callback.toString()},{headers:{'Cache-Control':'no-store','Pragma':'no-cache'}});}catch(e){return Response.json({error:e instanceof Error?e.message:'授权失败'},{status:400,headers:{'Cache-Control':'no-store'}});}
}
