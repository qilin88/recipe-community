import {getRequestUser} from '../../../lib/mobile-auth';
import {mobileCors,isDevAppOrigin} from '../../../lib/mobile-security';
import { database,bucket,ensureProfile,getFeed } from '../../../lib/data';
import { cleanText,validatePost,validateUpload,requireSamePost } from '../../../lib/validation';
export const dynamic='force-dynamic';
function respond(request:Request,value:unknown,status=200){return mobileCors(request,Response.json(value,{status,headers:{'Cache-Control':'no-store'}}));}
export function OPTIONS(request:Request){return mobileCors(request,new Response(null,{status:204}));}
export async function GET(request:Request) {
  const json=(value:unknown,status=200)=>respond(request,value,status);
  try {
    const user=await getRequestUser(request); if(user) await ensureProfile(user);
    const query=new URL(request.url).searchParams,db=database();
    if(query.get('post')) {
      const page=Math.max(0,Math.min(10000,Number(query.get('page'))||0));
      const comments=await db.prepare('SELECT c.*,p.name FROM comments c JOIN profiles p ON p.id=c.authorId WHERE c.postId=? ORDER BY c.createdAt DESC,c.id DESC LIMIT 51 OFFSET ?').bind(query.get('post'),page*50).all();
      return json({comments:comments.results.slice(0,50).reverse(),hasMore:comments.results.length>50});
    }
    return json(await getFeed(query,user?.userId||''));
  } catch(error) {console.error('community GET',error);return json({error:'加载失败，请稍后重试'},503);}
}
export async function POST(request:Request) {
  const json=(value:unknown,status=200)=>respond(request,value,status);
  try {
    const origin=request.headers.get('origin');
    if(origin&&origin!==new URL(request.url).origin&&!isDevAppOrigin(new URL(request.url).origin,origin)) return json({error:'请求来源无效'},403);
    const user=await getRequestUser(request);
    if(!user) return json({error:'请先登录后再操作'},401);
    await ensureProfile(user);
    const db=database(),uid=user.userId;
    if(request.headers.get('content-type')?.includes('multipart/form-data')) {
      if(Number(request.headers.get('content-length'))>6*1024*1024) return json({error:'图片过大'},413);
      const data=await request.formData(),file=data.get('file');
      if(!(file instanceof File)) return json({error:'请选择图片'},400);
      validateUpload(file);
      const bytes=new Uint8Array(await file.arrayBuffer());
      const actual=bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'image/jpeg':bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71?'image/png':new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP'?'image/webp':'';
      if(actual!==file.type) return json({error:'图片内容与文件类型不符'},400);
      const ext=file.type==='image/jpeg'?'jpg':file.type==='image/png'?'png':'webp',key=crypto.randomUUID()+'.'+ext;
      await bucket().put(key,bytes,{httpMetadata:{contentType:file.type}});
      try {await db.prepare('INSERT INTO uploads(key,userId,createdAt) VALUES (?,?,?)').bind(key,uid,Date.now()).run();} catch(error){await bucket().delete(key);throw error;}
      return json({url:'/api/images/'+key});
    }
    if(Number(request.headers.get('content-length'))>100000) return json({error:'内容过大'},413);
    const data=await request.json() as Record<string,unknown>, action=data.action;
    if(action==='publish') {
      const p=validatePost(data),paths=[...p.images,...p.steps.flatMap(s=>s.image?[s.image]:[])];
      for(const path of new Set(paths)) {
        const owned=await db.prepare('SELECT key FROM uploads WHERE key=? AND userId=?').bind(path.split('/').pop(),uid).first();
        if(!owned) return json({error:'请上传属于自己的图片'},403);
      }
      const id=crypto.randomUUID();
      await db.prepare('INSERT INTO posts(id,authorId,type,title,body,images,ingredients,steps,servings,tag,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(id,uid,p.type,p.title,p.body,JSON.stringify(p.images),JSON.stringify(p.ingredients),JSON.stringify(p.steps),p.servings,p.tag,Date.now()).run();
      return json({id});
    }
    if(action==='profile') {
      const name=cleanText(data.name,40,true),bio=cleanText(data.bio,200);
      await db.prepare('UPDATE profiles SET name=?,bio=? WHERE id=?').bind(name,bio,uid).run();return json({ok:true});
    }
    if(action==='follow') {
      const authorId=cleanText(data.authorId,200,true);
      if(authorId===uid) return json({error:'不能关注自己'},400);
      if(!await db.prepare('SELECT id FROM profiles WHERE id=?').bind(authorId).first()) return json({error:'作者不存在'},404);
      await db.prepare(data.active===true?'INSERT OR IGNORE INTO follows(userId,authorId) VALUES (?,?)':'DELETE FROM follows WHERE userId=? AND authorId=?').bind(uid,authorId).run();return json({ok:true});
    }
    if(!['like','save','comment','delete','deleteComment'].includes(String(action))) return json({error:'不支持的操作'},400);
    if(action==='deleteComment') {
      const id=cleanText(data.id,200,true),c=await db.prepare('SELECT authorId FROM comments WHERE id=?').bind(id).first();
      if(!c) return json({error:'评论不存在'},404);
      if(c.authorId!==uid) return json({error:'只能删除自己的评论'},403);
      await db.batch([db.prepare('UPDATE comments SET parentId=NULL WHERE parentId=?').bind(id),db.prepare('DELETE FROM comments WHERE id=? AND authorId=?').bind(id,uid)]);return json({ok:true});
    }
    const postId=cleanText(data.postId,200,true),post=await db.prepare('SELECT * FROM posts WHERE id=?').bind(postId).first();
    if(!post) return json({error:'内容不存在或已删除'},404);
    if(action==='like'||action==='save') {
      const table=action==='like'?'likes':'favorites';
      await db.prepare(data.active===true?`INSERT OR IGNORE INTO ${table}(userId,postId) VALUES (?,?)`:`DELETE FROM ${table} WHERE userId=? AND postId=?`).bind(uid,postId).run();return json({ok:true});
    }
    if(action==='comment') {
      const text=cleanText(data.text,1000,true),parentId=data.parentId?cleanText(data.parentId,200,true):null;
      if(parentId) {const parent=await db.prepare('SELECT postId FROM comments WHERE id=?').bind(parentId).first<{postId:string}>();requireSamePost(parent,postId);}
      await db.prepare('INSERT INTO comments(id,postId,authorId,text,parentId,createdAt) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),postId,uid,text,parentId,Date.now()).run();return json({ok:true});
    }
    if(action==='delete') {
      if(post.authorId!==uid) return json({error:'只能删除自己的内容'},403);
      await db.batch(['likes','favorites','comments'].map(table=>db.prepare(`DELETE FROM ${table} WHERE postId=?`).bind(postId)).concat([db.prepare('DELETE FROM posts WHERE id=? AND authorId=?').bind(postId,uid)]));
      const paths=[...JSON.parse(String(post.images)),...JSON.parse(String(post.steps)).flatMap((s:{image?:string})=>s.image?[s.image]:[])];
      for(const path of new Set<string>(paths)) {
        const key=path.split('/').pop()!;
        const used=await db.prepare('SELECT id FROM posts WHERE images LIKE ? OR steps LIKE ? LIMIT 1').bind('%'+key+'%','%'+key+'%').first();
        if(!used){await bucket().delete(key);await db.prepare('DELETE FROM uploads WHERE key=? AND userId=?').bind(key,uid).run();}
      }
      return json({ok:true});
    }
    return json({error:'操作失败'},400);
  } catch(error) {
    if(error instanceof SyntaxError) return json({error:'请求内容无效'},400);
    console.error('community POST',error);
    return json({error:error instanceof Error&& !error.message.includes('D1')&&!error.message.includes('SQL')?error.message:'操作失败，请稍后重试'},400);
  }
}
