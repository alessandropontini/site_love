const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {headers,parseSheet,buildPlan,hash}=require(process.env.SYNC_TEST_BUILD+'/model.js');
const gid='11111111-1111-4111-8111-111111111111';
function sheet(party='Fictional real household'){
 const row={'Guest name':'Rowan',Surname:'Example','Guest type':'Adult',Group:'Test','List owner':'Ale','Party / family':party,'Planning status':'On list',Priority:'Unassigned','Sync UUID':gid};
 return [headers,headers.map(h=>row[h]??'')];
}
const house=(id,name)=>({id,name,owner:'groom',plusOne:false,issued:true,responded:true,version:1,status:'active',namedCount:2});
test('only explicit active exclusions bypass unmapped guard; no name/status inference',()=>{
 const h=house(randomUUID(),'TEST — fictional');
 const db={contractVersion:2,households:[h],members:[],inviteeCount:2};
 assert(buildPlan(parseSheet(sheet()),db).errors.length);
 const active={...db,contractVersion:2,exclusions:[{householdId:h.id,active:true,revision:1}]};
 const p=buildPlan(parseSheet(sheet()),active);
 assert.deepEqual(p.errors,[]);assert.equal(p.excludedHouseholds,1);assert.equal(p.excludedInvitees,2);
 assert.equal(p.contractVersion,2);
 assert(buildPlan(parseSheet(sheet()),{...active,exclusions:[{householdId:h.id,active:false,revision:2}]}).errors.length);
 assert(buildPlan(parseSheet(sheet()),{...active,households:[h,house(randomUUID(),'Another TEST')]}).errors.length);
 assert(buildPlan(parseSheet(sheet(h.name)),active).errors.some(e=>e.includes('excluded test')));
 assert(buildPlan(parseSheet(sheet()),{...active,contractVersion:undefined}).errors.length);
 assert(buildPlan(parseSheet(sheet()),{...active,contractVersion:3}).errors.length);
});
test('inconsistent mapped/excluded snapshot fails closed',()=>{
 const g=parseSheet(sheet()).guests[0];const h=house(randomUUID(),g.party);
 const p=buildPlan(parseSheet(sheet()),{contractVersion:2,households:[h],members:[{externalId:g.externalId,householdId:h.id,inviteeId:randomUUID(),data:g,actualName:g.name}],inviteeCount:1,exclusions:[{householdId:h.id,active:true,revision:1}]});
 assert(p.errors.some(e=>e.includes('source mappings')));
});
test('missing database contract blocks Preview before an upgrade',()=>{
 const p=buildPlan(parseSheet(sheet()),{households:[],members:[],inviteeCount:0});
 assert(p.errors.some(e=>e.includes('contract')));
});
test('signed Preview is invalidated by exclusion revision changes',async()=>{
 const {preview,apply}=require(process.env.SYNC_TEST_BUILD+'/workflow.js');
 process.env.GUEST_SYNC_SIGNING_SECRET='fictional-test-secret-never-use-in-production';
 const h=house(randomUUID(),'Fictional test');
 const data={contractVersion:2,households:[h],members:[],inviteeCount:2,sources:[],exclusions:[{householdId:h.id,active:true,revision:1}]};
 const runs=new Map();let writes=0;
 const deps={sourceId:()=> 'fictional-source',readSheet:async()=>sheet(),snapshot:async()=>({data,hash:hash(data).slice(0,32)}),getRun:async r=>runs.get(r.id),recordRun:async(r,status)=>{runs.set(r.id,status);},applyPlan:async()=>{writes++;return 'SUCCESS';}};
 const p=await preview('fictional-admin',deps);assert.deepEqual(p.plan.errors,[]);assert.equal(runs.size,0);
 data.exclusions[0].revision=3;
 assert.equal(await apply(p.receipt,'fictional-admin',deps),'CONFLICT');assert.equal(writes,0);
});
test('exclusion SQL migration, history, privileges and protected RSVP data',{skip:!process.env.PGLITE_TEST_MODULE},async t=>{
 const {PGlite}=require(process.env.PGLITE_TEST_MODULE);const db=new PGlite();
 const fixtureIds=[randomUUID(),randomUUID()];
 const migrate=async f=>db.exec((await fs.readFile(path.join('db/migrations',f),'utf8')).replace('create extension if not exists pgcrypto;',''));
 try{
  await db.exec('create role site_love_sync; create role site_love_app;');
  for(const f of (await fs.readdir('db/migrations')).filter(f=>/^00[1-8]_.*\.sql$/.test(f)).sort())await migrate(f);
  for(const [n,h]of fixtureIds.entries()){
   await db.query("insert into rsvp.households(id,display_name,token_hash,status,response_version,invited_by) values($1,$2,$3,'active',1,'groom')",[h,`Fictional test ${n}`,String(n+1).repeat(64)]);
   for(let i=0;i<2;i++){
    const iid=randomUUID();await db.query('insert into rsvp.invitees(id,household_id,display_name) values($1,$2,$3)',[iid,h,`Fictional ${n} ${i}`]);
    await db.query("insert into rsvp.responses(household_id,invitee_id,attendance,meal_preference) values($1,$2,'yes',null)",[h,iid]);
   }
   await db.query("insert into rsvp.audit_events(household_id,event_type,metadata) values($1,'response_updated','{}')",[h]);
  }
  const protectedState=async()=>JSON.stringify(await Promise.all(['households','invitees','responses','additional_guests','audit_events'].map(table=>db.query(`select * from rsvp.${table} where ${table==='households'?'id':'household_id'} = any($1::uuid[]) order by 1,2`,[fixtureIds]))));
  const original=await protectedState();
  await migrate('009_guest_sync_test_exclusions.sql');
  const snap=async()=>(await db.query('select s data,md5(s::text) hash from (select rsvp.guest_sync_snapshot() s) q')).rows[0];
  const prep=async(values=sheet())=>{const s=await snap();return {hash:s.hash,plan:buildPlan(parseSheet(values),s.data)}};
  const apply=async(p,batch=randomUUID(),version=2)=>(await db.query('select rsvp.apply_guest_sync($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8) status',[batch,'fictional-admin','fictional-source',p.hash,JSON.stringify(p.plan.changes),JSON.stringify(p.plan.counts),1,version])).rows[0].status;
  const classify=async(h,active,rev)=>(await db.query('select rsvp.set_guest_sync_test_exclusion($1,$2,$3,$4,$5) revision',[h,active,rev,'fictional-owner',active?'CONFIRMED_TEST':'CLASSIFICATION_REVOKED'])).rows[0].revision;
  const stripErrors=p=>({...p,plan:{...p.plan,changes:p.plan.changes.map(c=>({...c,errors:[]}))}});
  await t.test('migration preserves existing RSVP and leaves all households unclassified',async()=>{
   assert.equal(await protectedState(),original);const s=await snap();assert.equal(s.data.contractVersion,2);assert.deepEqual(s.data.exclusions,[]);
   assert.equal((await db.query('select count(*)::int n from rsvp.guest_sync_exclusions where active')).rows[0].n,0);
   assert.equal((await db.query('select count(*)::int n from rsvp.guest_sync_exclusion_events')).rows[0].n,0);
  });
  await t.test('global SQL unmapped guard rejects forged plan',async()=>{
   const p=await prep();assert(p.plan.errors.length);await assert.rejects(apply(stripErrors(p)),/UNMAPPED_HOUSEHOLDS/);
  });
  await t.test('explicit classification preserves all RSVP and journals each decision',async()=>{
   for(const h of fixtureIds)assert.equal(await classify(h,true,0),1);
   assert.equal(await protectedState(),original);const s=await snap();assert.equal(s.data.exclusions.length,2);
   assert(!JSON.stringify(s.data.exclusions).includes('fictional-owner'));
   assert.equal((await db.query('select count(*)::int n from rsvp.guest_sync_exclusion_events')).rows[0].n,2);
   const p=await prep();assert.deepEqual(p.plan.errors,[]);assert.equal(p.plan.excludedInvitees,4);
   assert.equal(await apply(p),'SUCCESS');assert.equal(await protectedState(),original);
  });
  await t.test('same-state repeat is idempotent and stale operator revision rejected',async()=>{
   assert.equal(await classify(fixtureIds[0],true,1),1);
   await assert.rejects(classify(fixtureIds[0],false,0),/EXCLUSION_CHANGED/);
   assert.equal((await db.query('select count(*)::int n from rsvp.guest_sync_exclusion_events')).rows[0].n,2);
  });
  await t.test('excluded ID and label cannot be adopted even by forged changes',async()=>{
   let p=await prep(sheet('Fictional test 0'));assert(p.plan.errors.length);await assert.rejects(apply(stripErrors(p)),/EXCLUDED_HOUSEHOLD/);
   p=await prep();p.plan.changes[0].householdId=fixtureIds[0];p.plan.changes[0].errors=[];
   for(const operation of ['INSERT','UPDATE','NO CHANGE']){p.plan.changes[0].operation=operation;await assert.rejects(apply(p),/EXCLUDED_HOUSEHOLD/);}
   assert.equal(await protectedState(),original);
  });
  await t.test('composite FK rejects direct membership into excluded household',async()=>{
   const g={...parseSheet(sheet()).guests[0],externalId:randomUUID()};
   const iid=(await db.query('select id from rsvp.invitees where household_id=$1 limit 1',[fixtureIds[0]])).rows[0].id;
   await assert.rejects(db.query('insert into rsvp.guest_sync_members(external_id,source_id,household_id,invitee_id,data) values($1,$2,$3,$4,$5::jsonb)',[g.externalId,'fictional-source',fixtureIds[0],iid,JSON.stringify(g)]),/guest_sync_member_not_excluded/);
  });
  await t.test('mapped household cannot be excluded by operator or direct update',async()=>{
   const h=(await db.query('select household_id from rsvp.guest_sync_members where external_id=$1',[gid])).rows[0].household_id;
   await assert.rejects(classify(h,true,0),/MAPPED_HOUSEHOLD/);
   await assert.rejects(db.query('update rsvp.guest_sync_exclusions set active=true,revision=1 where household_id=$1',[h]),/guest_sync_member_not_excluded/);
  });
  await t.test('revocation restores unmapped block and reactivation invalidates old snapshot',async()=>{
   const old=await prep();assert.equal(await classify(fixtureIds[0],false,1),2);
   assert((await prep()).plan.errors.length);assert.equal(await apply(old),'CONFLICT');
   assert.equal(await classify(fixtureIds[0],true,2),3);assert.equal(await apply(old),'CONFLICT');
   const events=(await db.query('select revision,active from rsvp.guest_sync_exclusion_events where household_id=$1 order by revision',[fixtureIds[0]])).rows;
   assert.deepEqual(events,[{revision:1,active:true},{revision:2,active:false},{revision:3,active:true}]);
   assert.equal(await protectedState(),original);
  });
  await t.test('new unrelated unmapped household still blocks both planner and SQL',async()=>{
   await db.exec('begin');try{
    await db.query("insert into rsvp.households(display_name,status,invited_by) values('TEST is not authorization','disabled','groom')");
    const p=await prep();assert(p.plan.errors.length);await assert.rejects(apply(stripErrors(p)),/UNMAPPED_HOUSEHOLDS/);
   }finally{await db.exec('rollback');}
  });
  await t.test('old signature and wrong/null contracts fail closed',async()=>{
   const p=await prep();for(const version of [1,3,null])await assert.rejects(apply(p,randomUUID(),version),/SYNC_CONTRACT_VERSION/);
   await assert.rejects(db.query('select rsvp.apply_guest_sync($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7)',[randomUUID(),'fictional-admin','fictional-source',p.hash,JSON.stringify(p.plan.changes),JSON.stringify(p.plan.counts),1]),/SYNC_CONTRACT_VERSION/);
  });
  await t.test('runtime roles cannot classify, alter registry/history or call trigger helper',async()=>{
   for(const role of ['site_love_sync','site_love_app']){
    await db.exec(`set role ${role}`);try{
     await assert.rejects(classify(fixtureIds[0],false,3),/permission denied/);
     await assert.rejects(db.query('update rsvp.guest_sync_exclusions set active=false'),/permission denied/);
     await assert.rejects(db.query('delete from rsvp.guest_sync_exclusion_events'),/permission denied/);
     await assert.rejects(db.query('select rsvp.initialize_guest_sync_eligibility()'),/permission denied/);
    }finally{await db.exec('reset role');}
   }
   const p=await prep();await db.exec('set role site_love_sync');try{assert.equal(await apply(p),'SUCCESS');}finally{await db.exec('reset role');}
   assert.equal(await protectedState(),original);
  });
 }finally{await db.close();}
});
