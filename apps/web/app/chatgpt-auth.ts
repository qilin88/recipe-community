// Compatibility names retained for the existing mobile PKCE consent flow.
// Identity now comes only from the server-side email session, never client headers.
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {authService} from '../lib/email-auth/runtime';
import {readSession,safeReturnPath} from '../lib/email-auth/security';
import type {AuthUser} from '../lib/email-auth/service';
export type ChatGPTUser=AuthUser;
export async function getChatGPTUser():Promise<ChatGPTUser|null>{const head=await headers();return authService().user(readSession(head.get('cookie')));}
export async function requireChatGPTUser(returnTo:string):Promise<ChatGPTUser>{const user=await getChatGPTUser();if(user)return user;redirect(chatGPTSignInPath(returnTo));}
export function chatGPTSignInPath(returnTo:string){return '/auth/login?return_to='+encodeURIComponent(safeReturnPath(returnTo));}
export function chatGPTSignOutPath(returnTo='/'){return '/auth/logout?return_to='+encodeURIComponent(safeReturnPath(returnTo));}
