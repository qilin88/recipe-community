import { env } from 'cloudflare:workers';
import type { ChatGPTUser } from '../app/chatgpt-auth';
import type { Post, Profile } from './types';
export function database() { if(!env.DB) throw new Error('数据库尚未连接'); return env.DB; }
export function bucket() { if(!env.BUCKET) throw new Error('图片存储尚未连接'); return env.BUCKET; }
export async function ensureProfile(user:ChatGPTUser) {
  const name=user.fullName || user.email.split('@')[0] || '食光新朋友';
  await database().prepare('INSERT INTO profiles (id,name,bio,avatar,createdAt) VALUES (?,?,?, ?,?) ON CONFLICT(id) DO NOTHING').bind(user.userId,name.slice(0,40),'把日常过成喜欢的味道','',Date.now()).run();
}
export async function getProfile(id:string,viewer:string) {
  return database().prepare(`SELECT p.*, (SELECT COUNT(*) FROM follows WHERE authorId=p.id) followers, (SELECT COUNT(*) FROM follows WHERE userId=p.id) following, EXISTS(SELECT 1 FROM follows WHERE authorId=p.id AND userId=?) followed FROM profiles p WHERE p.id=?`).bind(viewer,id).first<Profile>();
}
export async function getFeed(query:URLSearchParams,viewer:string) {
  const db=database(), mode=query.get('feed')||'discover',q=(query.get('q')||'').trim().slice(0,100),author=query.get('author');
  const page=Math.max(0,Math.min(10000,Number(query.get('page'))||0));
  const args: (string|number)[] = [viewer,viewer,viewer];
  const where:string[]=[];
  const detail=query.get('detail');if(detail){where.push('p.id=?');args.push(detail);}
  const kind=query.get('type');if(kind==='recipe'||kind==='work'){where.push('p.type=?');args.push(kind);}
  if(q){where.push('(p.title LIKE ? ESCAPE \'\\\' OR u.name LIKE ? ESCAPE \'\\\')');const escaped=q.replace(/[\\%_]/g,'\\$&');args.push(`%${escaped}%`,`%${escaped}%`);}
  if(author){where.push('p.authorId=?');args.push(author);}
  if(mode==='following'){where.push('EXISTS(SELECT 1 FROM follows WHERE userId=? AND authorId=p.authorId)');args.push(viewer);}
  if(mode==='saved'){where.push('EXISTS(SELECT 1 FROM favorites WHERE userId=? AND postId=p.id)');args.push(viewer);}
  const rows=await db.prepare(`SELECT p.*,u.name,u.avatar,(SELECT COUNT(*) FROM likes WHERE postId=p.id) likes,(SELECT COUNT(*) FROM favorites WHERE postId=p.id) favorites,(SELECT COUNT(*) FROM comments WHERE postId=p.id) commentCount,EXISTS(SELECT 1 FROM likes WHERE postId=p.id AND userId=?) liked,EXISTS(SELECT 1 FROM favorites WHERE postId=p.id AND userId=?) saved,EXISTS(SELECT 1 FROM follows WHERE authorId=p.authorId AND userId=?) followed FROM posts p JOIN profiles u ON p.authorId=u.id ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY p.createdAt DESC,p.id DESC LIMIT 25 OFFSET ?`).bind(...args,page*24).all();
  const posts=rows.results.slice(0,24).map(row=>({...row,images:JSON.parse(String(row.images)),ingredients:JSON.parse(String(row.ingredients)),steps:JSON.parse(String(row.steps)),liked:!!row.liked,saved:!!row.saved,followed:!!row.followed})) as Post[];
  const creators=await db.prepare(`SELECT p.*, (SELECT COUNT(*) FROM follows WHERE authorId=p.id) followers,(SELECT COUNT(*) FROM follows WHERE userId=p.id) following,EXISTS(SELECT 1 FROM follows WHERE authorId=p.id AND userId=?) followed FROM profiles p WHERE ${q?'p.name LIKE ?':'EXISTS(SELECT 1 FROM posts WHERE authorId=p.id)'} ORDER BY followers DESC,p.createdAt DESC LIMIT 6`).bind(...(q?[viewer,'%'+q+'%']:[viewer])).all<Profile>();
  return {posts,creators:creators.results,profile:author?await getProfile(author,viewer):null,me:viewer?await getProfile(viewer,viewer):null,hasMore:rows.results.length>24};
}
