import {digest,randomToken,normalizeEmail,validateCredentials,hashPassword,verifyPassword} from './security.ts';
export type AuthUser={userId:string;email:string;displayName:string;fullName:string|null;authVersion?:number};
type Account={id:string;email:string;passwordHash:string;version:number};
export class EmailAuth{
 private db:D1Database;private now:()=>number;
 constructor(db:D1Database,now=Date.now){this.db=db;this.now=now;}
 async limit(key:string,max:number,windowMs:number){const now=this.now(),hash=await digest(key+':'+Math.floor(now/windowMs));const result=await this.db.prepare('INSERT INTO auth_limits(key,count,expiresAt) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(hash,now+windowMs,max).first();if(!result)throw Error('操作过于频繁，请稍后再试');}
 private account(email:string){return this.db.prepare('SELECT * FROM auth_accounts WHERE email=?').bind(email).first<Account>();}
 async register(input:Record<string,unknown>){const {name,email,password}=validateCredentials(input,true);await this.limit('register:'+email,5,86400000);if(await this.account(email))throw Error('该邮箱已注册，请直接登录');const passwordHash=await hashPassword(password),id=crypto.randomUUID();
  try{await this.db.batch([
   this.db.prepare("INSERT INTO profiles(id,name,bio,avatar,createdAt) VALUES (?,?, '把日常过成喜欢的味道','',?)").bind(id,name,this.now()),
   this.db.prepare('INSERT INTO auth_accounts(id,email,passwordHash,version) VALUES (?,?,?,0)').bind(id,email,passwordHash)
  ]);}catch(error){if(await this.account(email))throw Error('该邮箱已注册，请直接登录');throw error;}
 }
 async login(value:unknown,password:unknown){const email=normalizeEmail(value);if(typeof password!=='string'||password.length>128)throw Error('邮箱或密码不正确');await this.limit('login:'+email,10,15*60*1000);const account=await this.account(email);const dummy='pbkdf2-sha256$100000$00000000000000000000000000000000$'+'0'.repeat(64);const valid=await verifyPassword(password,account?.passwordHash||dummy);if(!account||!valid)throw Error('邮箱或密码不正确');const token=randomToken(),expiresAt=this.now()+7*86400000;
  const results=await this.db.batch([
   this.db.prepare('DELETE FROM auth_sessions WHERE expiresAt<=?').bind(this.now()),
   this.db.prepare('DELETE FROM auth_limits WHERE expiresAt<=?').bind(this.now()),
   this.db.prepare('INSERT INTO auth_sessions(tokenHash,userId,version,expiresAt) SELECT ?,id,version,? FROM auth_accounts WHERE id=? AND version=? RETURNING userId').bind(await digest(token),expiresAt,account.id,account.version)
  ]);if(!results[2].results.length)throw Error('登录状态已变更，请重新登录');return {token,expiresAt};}
 async user(token:string|null):Promise<AuthUser|null>{if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const row=await this.db.prepare('SELECT a.id,a.email,p.name,a.version FROM auth_sessions s JOIN auth_accounts a ON a.id=s.userId JOIN profiles p ON p.id=a.id WHERE s.tokenHash=? AND s.expiresAt>? AND s.version=a.version').bind(await digest(token),this.now()).first<{id:string;email:string;name:string;version:number}>();return row?{userId:row.id,email:row.email,displayName:row.name,fullName:row.name,authVersion:row.version}:null;}
 async logout(token:string|null){if(token)await this.db.prepare('DELETE FROM auth_sessions WHERE tokenHash=?').bind(await digest(token)).run();}
}
