import {createTestAccount} from './helpers/http-accounts.mjs';
import assert from 'node:assert/strict';
const base=process.env.TEST_ORIGIN||'http://127.0.0.1:8787';
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base))throw new Error('Integration tests only run against loopback');
const suffix=Date.now(),a='test-chef-a-'+suffix,b='test-chef-b-'+suffix;
const accounts=new Map([[a,await createTestAccount(base,a)],[b,await createTestAccount(base,b)]]);
let checks=0;const created=[];
async function call(user,path='',body){const headers={origin:base};if(user)headers.cookie=accounts.get(user).cookie;if(body&&!(body instanceof FormData))headers['content-type']='application/json';const r=await fetch(base+'/api/community'+path,{method:body?'POST':'GET',headers,body:body instanceof FormData?body:body?JSON.stringify(body):undefined});const data=await r.json();return {status:r.status,data};}
function check(condition,label){assert.ok(condition,label);checks++;console.log('PASS '+label);}
try{
  check((await call(null,'',{action:'like',postId:'no',active:true})).status===401,'anonymous writes rejected');
  const userA=(await call(a)).data.me,userB=(await call(b)).data.me;
  check(userA.id===accounts.get(a).userId&&userB.id===accounts.get(b).userId,'independent server identities');
  const form=new FormData();form.set('file',new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jP1EAAAAASUVORK5CYII=','base64')],'test.png',{type:'image/png'}));
  const image=(await call(a,'',form)).data.url;check(!!image,'real R2 upload');
  const fixture={action:'publish',type:'work',title:'测试香煎南瓜 '+suffix,body:'集成测试内容',images:[image]};
  check((await call(b,'',fixture)).status===403,'cannot publish another user image');
  const first=await call(a,'',fixture),id=first.data.id;check(first.status===200&&!!id,'work persists');created.push(id);
  check((await call(a,'',{...fixture,type:'recipe'})).status===400,'recipe requires ingredients and steps');
  const recipe=await call(a,'',{...fixture,title:'测试完整食谱 '+suffix,type:'recipe',ingredients:[{name:'南瓜',amount:'100 克'}],steps:[{text:'蒸熟'}]});const second=recipe.data.id;check(recipe.status===200&&!!second,'recipe persists');created.push(second);
  const recipes=(await call(a,'?type=recipe')).data.posts;check(recipes.some(p=>p.id===second)&&recipes.every(p=>p.type==='recipe'),'type filtering happens before pagination');
  check((await call(b,'',{action:'delete',postId:id})).status===403,'cannot delete another author post');
  check((await call(a,'',{action:'follow',authorId:accounts.get(a).userId,active:true})).status===400,'cannot follow self');
  for(let i=0;i<2;i++){await call(b,'',{action:'follow',authorId:accounts.get(a).userId,active:true});await call(b,'',{action:'like',postId:id,active:true});await call(b,'',{action:'save',postId:id,active:true});}
  const following=(await call(b,'?feed=following')).data;const found=following.posts.find(p=>p.id===id);
  check(found?.liked&&found?.saved&&found?.likes===1,'like and favorite idempotency');
  check(found?.followed,'follow feed includes followed author');
  check((await call(a,'?feed=saved')).data.posts.every(p=>p.id!==id),'favorites private to current identity');
  check((await call(b,'?feed=saved')).data.posts.some(p=>p.id===id),'saved feed persists');
  check((await call(b,'?q='+encodeURIComponent('香煎南瓜 '+suffix))).data.posts.some(p=>p.id===id),'title search');
  await call(b,'',{action:'comment',postId:id,text:'想试试！'});
  const comments=(await call(a,'?post='+id)).data.comments,parent=comments[0];check(parent.text==='想试试！','comment persists');
  check((await call(a,'',{action:'comment',postId:second,text:'跨内容回复',parentId:parent.id})).status===400,'cross-post reply rejected');
  check((await call(a,'',{action:'comment',postId:id,text:'欢迎尝试',parentId:parent.id})).status===200,'same-post reply accepted');
  check((await call(a,'',{action:'deleteComment',id:parent.id})).status===403,'comment author permission');
  check((await call(b,'',{action:'deleteComment',id:parent.id})).status===200,'author can delete own comment');
  check((await call(a,'?post='+id)).data.comments[0].parentId===null,'reply survives parent removal');
  for(let i=0;i<51;i++)await call(b,'',{action:'comment',postId:id,text:'分页评论 '+i});
  const recent=(await call(a,'?post='+id)).data,older=(await call(a,'?post='+id+'&page=1')).data;
  check(recent.comments.length===50&&recent.hasMore&&recent.comments.some(c=>c.text==='分页评论 50'),'new comments remain visible beyond first page');
  check(older.comments.length===2&&!older.hasMore&&older.comments.some(c=>c.text==='欢迎尝试'),'older comment pagination');
  check((await call(a,'',{action:'unsupported'})).status===400,'unknown action rejected');
  const imageResponse=await fetch(base+image);check(imageResponse.ok&&imageResponse.headers.get('content-type')?.startsWith('image/png'),'uploaded image readable');
  await call(b,'',{action:'like',postId:id,active:false});await call(b,'',{action:'save',postId:id,active:false});await call(b,'',{action:'follow',authorId:accounts.get(a).userId,active:false});
  for(const postId of created){check((await call(a,'',{action:'delete',postId})).status===200,'author delete and cleanup');}
  check((await fetch(base+image)).status===404,'unreferenced image removed');
  console.log(`\n${checks} integration checks passed.`);
}finally{for(const postId of created)await call(a,'',{action:'delete',postId}).catch(()=>{});}
