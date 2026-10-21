'use client';
import {useEffect,useState} from 'react';
import {CookingPot,ArrowLeft,ArrowRight,Mail,CheckCircle2,LoaderCircle} from 'lucide-react';
const copy:Record<string,{title:string;intro:string;button:string}>={
 login:{title:'欢迎回到你的厨房。',intro:'登录食光，把喜欢的味道留在身边。',button:'登录'},
 register:{title:'好味道，从这里开始。',intro:'创建账号，与同样热爱美食的人相遇。',button:'注册食光'},
 logout:{title:'暂时离开厨房？',intro:'退出后仍可浏览，分享和收藏时需要重新登录。',button:'退出登录'}
};
export default function AuthForm({mode,returnTo}:{mode:string;returnTo:string}){
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(false);
 useEffect(()=>setReady(true),[]);
 const c=copy[mode],registration=mode==='register',path=(next:string)=>'/auth/'+next+'?return_to='+encodeURIComponent(returnTo);
 async function submit(event:React.FormEvent){event.preventDefault();setError('');if(registration&&password!==confirm){setError('两次输入的密码不一致');return;}setBusy(true);try{const response=await fetch('/api/auth/'+mode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,password,returnTo})});const result=await response.json() as {error?:string;returnTo:string};if(!response.ok)throw Error(result.error||'操作失败，请稍后重试');if(mode==='login'){window.location.assign(result.returnTo);return;}if(mode==='logout'){window.location.assign(returnTo);return;}setPassword('');setConfirm('');setSuccess(true);}catch(e){setError(e instanceof Error?e.message:'网络连接失败，请重试');}finally{setBusy(false);}}
 return <main className="auth-page"><section className="auth-story"><a className="brand" href="/"><span className="brand-icon"><CookingPot size={26}/></span><span>食光<span className="brand-en">SHIGUANG</span></span></a><div><span className="eyebrow">A LITTLE TASTE OF THE GOOD LIFE</span><h1>一餐一饭，<br/>皆是<span>热爱。</span></h1><p>收藏一份灵感，分享一道好菜。<br/>在烟火日常里，遇见同样热爱的人。</p><span className="auth-flower" aria-hidden="true">✳</span></div><small>COOK. CREATE. CONNECT.</small></section><section className="auth-content"><a className="auth-back" href="/"><ArrowLeft size={16}/>先逛逛食光</a><div className="auth-card"><span className="auth-emblem">{success?<CheckCircle2 size={28}/>:<Mail size={28}/>}</span><span className="section-eyebrow">YOUR LITTLE KITCHEN</span><h2>{c.title}</h2><p className="auth-intro">{c.intro}</p>
 {success?<div className="auth-success"><p role="status">注册成功，欢迎加入食光！现在可以用邮箱和密码登录。</p><a className="primary-button" href={path('login')}>前往登录<ArrowRight size={17}/></a></div>:<form className="auth-form" onSubmit={submit}>
 {registration&&<label className="form-field">昵称<input name="name" autoComplete="nickname" required maxLength={40} value={name} onChange={e=>setName(e.target.value)} placeholder="大家怎么称呼你"/></label>}
 {mode!=='logout'&&<><label className="form-field">邮箱<input name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label className="form-field">密码<input name="password" type="password" required minLength={registration?12:1} maxLength={128} autoComplete={registration?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={registration?'至少 12 个字符，可使用短语':'请输入密码'} aria-describedby={registration?'password-help':undefined}/>{registration&&<small id="password-help">12–128 个字符，建议使用独特且较长的密码。</small>}</label></>}
 {registration&&<label className="form-field">确认密码<input name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="再输入一次密码"/></label>}
 {error&&<p className="auth-error" role="alert">{error}</p>}
 <button className="primary-button" disabled={busy||!ready}>{busy?<><LoaderCircle size={17} className="spin"/>处理中…</>:<>{c.button}<ArrowRight size={17}/></>}</button>
 {registration&&<small className="auth-note">注册后即可登录。请妥善保管密码。</small>}
 </form>}
 <div className="auth-switch">{mode==='login'?<>还没有账号？<a href={path('register')}>注册食光</a></>:<>已有账号？<a href={path('login')}>返回登录</a></>}</div><p className="auth-guest-note">游客也能发现美味，发布、收藏与交流需要登录。</p></div><small className="auth-copyright">© 2026 食光 · 好好做饭，好好生活</small></section></main>;
}
