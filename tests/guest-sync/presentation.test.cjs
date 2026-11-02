const {test}=require('node:test');
const assert=require('node:assert/strict');
const {planningDetails,householdSummary}=require(process.env.SYNC_TEST_BUILD+'/presentation.js');
const guest={externalId:'fictional-id',name:'Rowan Example',kind:'named',party:'Fictional family',owner:'groom',group:'Friends',planning:'On list',priority:'Normal',table:''};
const change=(current,next,operation='UPDATE',householdId='fictional-household')=>({current,next,operation,householdId,errors:[],guest:'Fictional guest'});
test('legacy source-name fallback avoids a false first-name change',()=>{
 const rows=planningDetails(change(guest,{...guest,sourceName:guest.name,surname:'Example',priority:'High'}));
 assert(!rows.some(r=>r.field==='sourceName'));assert(rows.some(r=>r.field==='priority'&&r.before==='Normal'&&r.after==='High'));
});
test('removed surname and empty table remain visible as changes',()=>{
 const rows=planningDetails(change({...guest,surname:'Example',table:'12'},{...guest,surname:null,table:''}));
 assert.equal(rows.find(r=>r.field==='surname').after,'—');assert.equal(rows.find(r=>r.field==='table').after,'—');
});
test('anonymous places never disclose malformed name fields or private extras',()=>{
 const rows=planningDetails(change(null,{...guest,kind:'child',sourceName:'Never display',surname:'Private',notes:'Secret'},'INSERT'));
 const text=JSON.stringify(rows);assert(!text.includes('Never display'));assert(!text.includes('Private'));assert(!text.includes('Secret'));assert(!text.includes('fictional-id'));
});
test('missing source retains readable stored values',()=>{
 const rows=planningDetails(change(guest,null,'MISSING FROM SOURCE'));assert.equal(rows.find(r=>r.field==='name').before,guest.name);
});
test('household totals use stable IDs and include missing or blocked unchanged rows',()=>{
 const missing=change(guest,null,'MISSING FROM SOURCE');
 const blocked={...change(guest,{...guest,party:'Renamed'},'NO CHANGE'),errors:['Conflict']};
 const other=change(null,guest,'INSERT',null);
 const groups=householdSummary({changes:[missing,blocked,other]});assert.equal(groups.length,2);assert.equal(groups[0].rows,2);assert.equal(groups[0].blocked,true);assert.equal(groups[0].changed,false);assert.equal(groups[1].changed,true);
});
