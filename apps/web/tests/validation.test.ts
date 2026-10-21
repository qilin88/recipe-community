import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePost, validateUpload, requireSamePost, cleanText } from '../lib/validation.ts';
const image = '/api/images/abc.webp';
test('作品必须有标题、图片，忽略伪造作者', () => {
  assert.throws(() => validatePost({type:'work',title:'  ',images:[image]}));
  assert.throws(() => validatePost({type:'work',title:'好菜',images:[]}));
  const result = validatePost({type:'work',title:' 好菜 ',images:[image],authorId:'someone'});
  assert.equal(result.title,'好菜');
  assert.equal('authorId' in result,false);
});
test('食谱必须有食材及文字步骤，步骤图片可选', () => {
  const recipe = {type:'recipe',title:'意面',images:[image],ingredients:[{name:'意面',amount:'100g'}],steps:[{text:'煮熟'}]};
  assert.equal(validatePost(recipe).steps.length,1);
  assert.throws(() => validatePost({...recipe,ingredients:[]}));
  assert.throws(() => validatePost({...recipe,steps:[{text:' '}]}));
});
test('校验图片上限、文件大小和类型', () => {
  assert.throws(() => validatePost({type:'work',title:'图片',images:Array(10).fill(image)}));
  assert.throws(() => validatePost({type:'work',title:'图片',images:['https://evil.test/a.svg']}));
  assert.throws(() => validateUpload({size:5*1024*1024+1,type:'image/jpeg'}));
  assert.throws(() => validateUpload({size:100,type:'image/svg+xml'}));
  assert.doesNotThrow(() => validateUpload({size:100,type:'image/webp'}));
});
test('回复必须属于同一内容', () => {
  assert.throws(() => requireSamePost({postId:'other'},'current'));
  assert.doesNotThrow(() => requireSamePost({postId:'current'},'current'));
});
test('文本限制与非法类型', () => {
  assert.throws(() => cleanText('a'.repeat(81),80,true));
  assert.throws(() => validatePost({type:'invalid',title:'菜',images:[image]}));
  assert.throws(() => cleanText({},80,true));
});
