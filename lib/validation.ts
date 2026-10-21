export function cleanText(value: unknown, max: number, required = false): string {
  if (value == null && !required) return '';
  if (typeof value !== 'string') throw new Error('请输入有效文字');
  const text = value.trim();
  if (required && !text) throw new Error('请填写必填内容');
  if (text.length > max) throw new Error(`内容不能超过 ${max} 字`);
  return text;
}
function imagePath(value: unknown): string {
  if (typeof value !== 'string' || !/^\/api\/images\/[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(value)) throw new Error('请使用已上传的图片');
  return value;
}
export function validatePost(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('无效的内容');
  const v = value as Record<string, unknown>;
  if (v.type !== 'work' && v.type !== 'recipe') throw new Error('请选择作品或食谱');
  const title = cleanText(v.title,80,true), body = cleanText(v.body,5000);
  if (!Array.isArray(v.images) || v.images.length < 1 || v.images.length > 9) throw new Error('请上传 1–9 张图片');
  const images = v.images.map(imagePath);
  const ingredients: {name:string;amount:string}[] = [], steps: {text:string;image?:string}[] = [];
  if(v.type === 'recipe') {
    if(!Array.isArray(v.ingredients) || !v.ingredients.length || v.ingredients.length>50) throw new Error('请填写 1–50 种食材');
    for(const item of v.ingredients) {
      if(!item || typeof item!=='object') throw new Error('食材格式无效');
      ingredients.push({name:cleanText(item.name,80,true),amount:cleanText(item.amount,80,true)});
    }
    if(!Array.isArray(v.steps)||!v.steps.length||v.steps.length>30) throw new Error('请填写 1–30 个制作步骤');
    for(const item of v.steps) {
      if(!item||typeof item!=='object') throw new Error('步骤格式无效');
      steps.push({text:cleanText(item.text,2000,true),...(item.image?{image:imagePath(item.image)}:{})});
    }
  }
  return {type:v.type as 'work'|'recipe',title,body,images,ingredients,steps,tag:cleanText(v.tag,20),servings:cleanText(v.servings,30)};
}
export function validateUpload(file:{size:number;type:string}) {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('仅支持 JPG、PNG、WebP 图片');
  if(file.size<=0||file.size>5*1024*1024) throw new Error('单张图片需小于 5 MB');
}
export function requireSamePost(parent:{postId:string}|null,postId:string) {
  if(!parent || parent.postId!==postId) throw new Error('回复的评论不存在或不属于该内容');
}
