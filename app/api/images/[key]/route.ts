import { bucket } from '../../../../lib/data';
export async function GET(_request:Request,{params}:{params:Promise<{key:string}>}) {
  const {key}=await params;
  if(!/^[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(key)) return new Response('Not found',{status:404});
  const object=await bucket().get(key);
  if(!object) return new Response('Not found',{status:404});
  const headers=new Headers({'Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff'});object.writeHttpMetadata(headers);
  return new Response(object.body,{headers});
}
