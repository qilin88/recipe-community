import {getChatGPTUser,type ChatGPTUser} from '../app/chatgpt-auth';
import {database} from './data';
import {hashSecret} from './mobile-security';
import {issueMobileCode,exchangeMobileCode,mobileUser} from './email-auth/mobile';
export async function getRequestUser(request:Request):Promise<ChatGPTUser|null>{const auth=request.headers.get('authorization');if(!auth)return getChatGPTUser();if(!/^Bearer [a-f0-9]{64}$/.test(auth))return null;return mobileUser(database(),auth.slice(7));}
export async function issueCode(user:ChatGPTUser,challenge:string){return issueMobileCode(database(),user,challenge);}
export async function exchangeCode(code:string,verifier:string){return exchangeMobileCode(database(),code,verifier);}
export async function revokeSession(request:Request){const auth=request.headers.get('authorization');if(!auth||!/^Bearer [a-f0-9]{64}$/.test(auth))throw Error('缺少有效设备会话');await database().prepare('DELETE FROM mobile_sessions WHERE tokenHash=?').bind(await hashSecret(auth.slice(7))).run();}
