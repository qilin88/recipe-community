import {hashSecret,pkceChallenge,randomSecret} from '../mobile-security.ts';
import type {AuthUser} from './service.ts';
export async function issueMobileCode(db:D1Database,user:AuthUser,challenge:string){
 if(!/^[A-Za-z0-9_-]{43}$/.test(challenge)||user.authVersion===undefined)throw Error('请重新登录');
 const now=Date.now(),code=randomSecret();const results=await db.batch([
  db.prepare('DELETE FROM mobile_codes WHERE expiresAt<=?').bind(now),
  db.prepare('INSERT INTO mobile_codes(codeHash,userId,challenge,expiresAt,authVersion) SELECT ?,id,?,?,version FROM auth_accounts WHERE id=? AND version=? RETURNING userId').bind(await hashSecret(code),challenge,now+5*60*1000,user.userId,user.authVersion)
 ]);if(!results[1].results.length)throw Error('登录状态已变更，请重新登录');return code;
}
export async function exchangeMobileCode(db:D1Database,code:string,verifier:string){
 if(!/^[a-f0-9]{64}$/.test(code))throw Error('授权码无效');
 const challenge=await pkceChallenge(verifier),now=Date.now();
 const consumed=await db.prepare('DELETE FROM mobile_codes WHERE codeHash=? AND challenge=? AND expiresAt>? RETURNING userId,authVersion').bind(await hashSecret(code),challenge,now).first<{userId:string;authVersion:number}>();
 if(!consumed)throw Error('授权码已过期、已使用或校验失败');
 const token=randomSecret(),expiresAt=now+30*86400000;const inserted=await db.prepare('INSERT INTO mobile_sessions(tokenHash,userId,expiresAt,authVersion) SELECT ?,id,?,version FROM auth_accounts WHERE id=? AND version=? RETURNING userId').bind(await hashSecret(token),expiresAt,consumed.userId,consumed.authVersion).first();if(!inserted)throw Error('登录状态已变更，请重新登录');return {token,expiresAt};
}
export async function mobileUser(db:D1Database,token:string):Promise<AuthUser|null>{if(!/^[a-f0-9]{64}$/.test(token))return null;const found=await db.prepare('SELECT a.id,a.email,p.name,a.version FROM mobile_sessions s JOIN auth_accounts a ON a.id=s.userId AND a.version=s.authVersion JOIN profiles p ON p.id=a.id WHERE s.tokenHash=? AND s.expiresAt>?').bind(await hashSecret(token),Date.now()).first<{id:string;email:string;name:string;version:number}>();return found?{userId:found.id,email:found.email,displayName:found.name,fullName:found.name,authVersion:found.version}:null;}
