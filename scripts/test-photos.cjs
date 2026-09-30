const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
function load(file, dependencies = {}) {
 const module = { exports: {} };
 const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,require:name=>{if (!(name in dependencies)) throw Error(name); return dependencies[name];}});
 return module.exports;
}
const images=load('domain/images.ts');
const jpeg=size=>{const b=Buffer.alloc(size); b[0]=255;b[1]=216;b[2]=255;return b.toString('base64');};
const small=jpeg(100);
function photos(manipulate=async()=>({uri:'file:///small.jpg',base64:small}),read=small) {
 return load('services/photos.ts',{'react-native':{Platform:{OS:'android'}},'expo-image-picker':{},'expo-image-manipulator':{manipulateAsync:manipulate,SaveFormat:{JPEG:'jpeg'}},'expo-file-system':{File:class{async base64(){return read;}}},'expo-crypto':{},'../domain/images':images});
}
const record={id:'note',revision:'r1',kind:'note',title:'Notes',updatedAt:1,photoUri:'file:///photo.jpg',photoPending:true};
test('Base64 validation accepts the boundary and rejects excess, malformed and non-JPEG data',()=>{
 assert.equal(images.validateImage(jpeg(204800)),204800);
 assert.throws(()=>images.validateImage(jpeg(204801)),/200 KB/);
 assert.throws(()=>images.validateImage('bad'),/encoded/);
 assert.throws(()=>images.validateImage('YWJj'),/JPEG/);
});
test('compression retries at smaller dimensions until image fits',async()=>{
 const attempts=[];const result=await photos(async(_uri,actions,options)=>{attempts.push([actions[0].resize.width,options.compress]);return {uri:'small',base64:attempts.length===1?jpeg(250000):small};}).compressPhoto('original',2000);
 assert.equal(result.base64,small);assert.equal(attempts.length,2);assert.equal(attempts[1][0],1024);
});
test('compression rejects images that remain oversized',async()=>{
 await assert.rejects(photos(async()=>({base64:jpeg(250000)})).compressPhoto('original'),/200 KB/);
});
test('native preparation reads Base64 without Blob and returns a separate immutable image',async()=>{
 const result=await photos().prepareRecordPhoto(record);
 assert.equal(result.image.base64,small);assert.equal(result.record.photoId,'note-r1');assert.equal(result.record.base64,undefined);assert.equal(result.record.photoPending,false);assert.equal(record.photoPending,true);
});
test('previous oversized pending photos are recompressed',async()=>{
 const result=await photos(undefined,jpeg(250000)).prepareRecordPhoto(record);assert.equal(result.image.bytes,100);
});
test('ordinary edits reuse existing image; deleted records clear attachments',async()=>{
 const api=photos();const existing={...record,photoPending:false,photoId:'note-old'};
 assert.equal((await api.prepareRecordPhoto(existing)).image,undefined);
 assert.equal((await api.prepareRecordPhoto({...existing,deleted:true})).record.photoId,'');
});
test('image cache isolates accounts and provides offline access after download',async()=>{
 const values=new Map();let reads=0;
 const api=load('services/imageCache.ts',{'@react-native-async-storage/async-storage':{getItem:async k=>values.get(k),setItem:async(k,v)=>values.set(k,v),removeItem:async k=>values.delete(k)},'firebase/firestore':{doc:(_db,...p)=>p.join('/'),getDocFromServer:async()=>{reads++;return{exists:()=>true,data:()=>({mimeType:'image/jpeg',base64:small})};}},'./firebase':{database:{}},'../domain/images':images});
 assert.equal(await api.loadStudyImage('alice','photo',true),images.JPEG_DATA_PREFIX+small);
 await api.loadStudyImage('alice','photo',false);assert.equal(reads,1);
 await assert.rejects(api.loadStudyImage('bob','photo',false),/not downloaded/);
 for(let i=0;i<5;i++)await api.loadStudyImage('alice','photo'+i,true);
 assert.equal(values.has('studymate:image:alice:photo'),false);
});
test('failed atomic image write keeps outbox pending, successful retry acknowledges it',async()=>{
 let fail=true;const batches=[];
 const models=load('domain/models.ts');const sync=load('domain/sync.ts');
 const firestore={writeBatch:()=>{const writes=[];batches.push(writes);return{set:(path,data)=>writes.push({path,data}),commit:async()=>{if(fail)throw Error('Connection lost');}};},doc:(_db,...p)=>p.join('/'),serverTimestamp:()=>123,collection:()=>0,query:()=>0,where:()=>0,orderBy:()=>0,limit:()=>0,Timestamp:{fromMillis:n=>n},getDocsFromServer:async()=>({docs:[],size:0})};
 const {StudyRepository}=load('services/repository.ts',{'@react-native-async-storage/async-storage':{setItem:async()=>{}},'expo-crypto':{},'firebase/firestore':firestore,'../domain/models':models,'../domain/sync':sync,'../domain/planner':{},'./firebase':{database:{}},'./photos':photos(),'./errors':{friendlyError:e=>e.message},'../domain/demo':{}});
 const repo=new StudyRepository('alice');repo.ready=true;repo.state={...models.emptyState(),records:{note:record},pending:{note:'r1'}};
 await repo.sync(true);assert.equal(repo.state.pending.note,'r1');assert.equal(repo.state.records.note.photoPending,true);
 fail=false;await repo.sync(true);assert.equal(repo.state.pending.note,undefined);assert.equal(repo.state.records.note.photoId,'note-r1');assert.equal(batches[1].length,2);assert.equal(batches[1][0].path,'users/alice/images/note-r1');assert.equal(batches[1][1].data.base64,undefined);assert.equal(batches[1][1].data.photoUri,undefined);
});
