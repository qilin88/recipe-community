import {headers} from 'next/headers';
import {requireChatGPTUser} from '../../chatgpt-auth';
import {validateAuthRequest} from '../../../lib/mobile-security';
import Consent from './Consent';
export const dynamic='force-dynamic';
export default async function MobileAuth({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const query=await searchParams,head=await headers();
 const host=head.get('host')||'',protocol=host.startsWith('127.0.0.1:')||host.startsWith('localhost:')||host.startsWith('10.0.2.2:')?'http:':'https:';
 let p:ReturnType<typeof validateAuthRequest>;
 try{p=validateAuthRequest(query,protocol+'//'+host);}catch{return <main style={{padding:40}}><h1>无法登录 App</h1><p>登录参数或回调无效，请从食光 App 重新发起。</p></main>;}
 const returnTo='/mobile/auth?'+new URLSearchParams({challenge:p.challenge,state:p.state,redirect_uri:p.redirect});
 const user=await requireChatGPTUser(returnTo);
 return <Consent challenge={p.challenge} state={p.state} redirect={p.redirect} name={user.displayName}/>;
}
