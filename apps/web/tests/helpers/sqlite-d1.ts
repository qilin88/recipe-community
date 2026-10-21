import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
export function sqliteD1(){
 const sqlite=new DatabaseSync(':memory:');
 for(const name of readdirSync(new URL('../../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())sqlite.exec(readFileSync(new URL('../../drizzle/'+name,import.meta.url),'utf8'));
 function prepare(sql:string){let args:unknown[]=[];const stmt={bind(...values:unknown[]){args=values;return stmt;},async first<T>(){return (sqlite.prepare(sql).get(...args as never[])||null) as T|null;},async run(){const result=sqlite.prepare(sql).run(...args as never[]);return {success:true,results:[],meta:{changes:Number(result.changes)}};},async all<T>(){const result=sqlite.prepare(sql).all(...args as never[]);return {success:true,results:result as T[],meta:{changes:0}};}};return stmt;}
 return {prepare,async batch(statements:ReturnType<typeof prepare>[]){sqlite.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.all());sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}},exec:(sql:string)=>sqlite.exec(sql),close:()=>sqlite.close()};
}
