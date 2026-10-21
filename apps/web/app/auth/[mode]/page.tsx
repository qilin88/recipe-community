import {notFound} from 'next/navigation';
import {safeReturnPath} from '../../../lib/email-auth/security';
import AuthForm from './AuthForm';
export const dynamic='force-dynamic';
export default async function AuthPage({params,searchParams}:{params:Promise<{mode:string}>;searchParams:Promise<Record<string,string|undefined>>}){const {mode}=await params;if(!['login','register','logout'].includes(mode))notFound();const query=await searchParams;return <AuthForm mode={mode} returnTo={safeReturnPath(query.return_to)}/>;}
