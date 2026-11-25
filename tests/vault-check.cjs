const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const listeners={};
const elements=new Map();
function element(id){
  if(!elements.has(id)){
    const classes=new Set();
    elements.set(id,{
      value:'', type:'password', textContent:'', innerHTML:'', dataset:{},
      classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle:(c,on)=>on?classes.add(c):classes.delete(c)},
      addEventListener:(name,fn)=>listeners[id+name]=fn,focus(){},setAttribute(){},
      click(){this.onclick?.()},replaceChildren(){this.innerHTML=''},querySelector(){return null},
      reset(){for(const field of ['siteName','siteAddress','loginUsername','loginPassword'])element(field).value=''}
    });
  }
  return elements.get(id);
}
const html=readFileSync('index.html','utf8');
const source=html.split('<script>')[1].split('</script>')[0];
let blob=null, failWrite=false, copied, timer;
const context=vm.createContext({
  crypto:webcrypto, TextEncoder, TextDecoder, btoa, atob, URL, CSS:{escape:String},
  navigator:{clipboard:{writeText:async value=>{copied=value}}},
  localStorage:{getItem:()=>blob,setItem:(_,data)=>{if(failWrite)throw Error();blob=data}},
  document:{getElementById:element,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(name,fn)=>listeners[name]=fn},
  window:{isSecureContext:true,addEventListener:(name,fn)=>listeners[name]=fn},
  setInterval(){},setTimeout(fn,ms){if(ms===15000)timer=fn;return 1},clearTimeout(){},confirm:()=>true
});
const run=code=>vm.runInContext(code,context);
async function idle(){while(run('vaultBusy'))await new Promise(resolve=>setTimeout(resolve,5))}
async function submit(){element('loginForm').onsubmit({preventDefault(){}});await idle()}
(async()=>{
  run(source);
  const legacy=[{id:'otp',issuer:'Example',label:'old',secret:'JBSWY3DPEHPK3PXP',period:30,digits:6,algorithm:'SHA1'}];
  const original=JSON.stringify(await run('encryptData('+JSON.stringify(legacy)+',"master-password")'));
  blob=original;
  element('pass').value='master-password';
  listeners.unlockFormsubmit({preventDefault(){}});
  await idle();
  assert.equal(blob,original);
  assert.equal(run('accounts[0].id'),'otp');
  assert.match(await run('codeFor(accounts[0])'),/^\d{6}$/);
  element('passwordNav').onclick();
  element('addLogin').onclick();
  element('siteName').value='<b>example</b>';
  element('loginUsername').value='user@example.test';
  element('generatePassword').onclick();
  const password=element('loginPassword').value;
  assert.equal(password.length,24);
  assert.match(password,/[A-Z]/);
  assert.match(password,/[a-z]/);
  assert.match(password,/[0-9]/);
  assert.match(password,/[^a-z0-9]/i);
  element('showDraft').onclick();
  assert.equal(element('loginPassword').type,'text');
  timer();
  assert.equal(element('loginPassword').type,'password');
  failWrite=true;
  await submit();
  assert.equal(blob,original);
  assert.equal(run('logins.length'),0);
  failWrite=false;
  await submit();
  const updated=blob;
  assert(!blob.includes(password));
  assert(!blob.includes('user@example.test'));
  const payload=await run('decryptData(vault,"master-password")');
  assert.deepEqual(JSON.parse(JSON.stringify(payload.accounts)),legacy);
  assert.equal(payload.logins[0].password,password);
  assert.match(element('loginCards').innerHTML,/&lt;b&gt;example/);
  assert(!element('loginCards').innerHTML.includes(password));
  element('loginSearch').value='unmatched';
  element('loginSearch').oninput();
  assert(!element('loginCards').innerHTML.includes('example'));
  element('loginSearch').value='user@';
  element('loginSearch').oninput();
  assert.match(element('loginCards').innerHTML,/user@example/);
  const id=payload.logins[0].id;
  const visible={textContent:'••••••••'};
  let aria='false';
  const card={dataset:{login:id},querySelector:()=>visible};
  const click=action=>element('loginCards').onclick({target:{closest:()=>({
    dataset:{action},closest:()=>card,getAttribute:()=>aria,setAttribute:(_,value)=>{aria=value}
  })}});
  await click('password');
  assert.equal(copied,password);
  await click('reveal');
  assert.equal(visible.textContent,password);
  element('loginCards').querySelector=()=>aria==='true'?{closest:()=>card,setAttribute:(_,value)=>{aria=value}}:null;
  timer();
  assert.equal(visible.textContent,'••••••••');
  await click('edit');
  assert.equal(element('loginPassword').value,'');
  element('siteName').value='Edited';
  await submit();
  assert.equal(run('logins[0].name'),'Edited');
  assert.equal(run('logins[0].password'),password);
  element('settingsNav').onclick();
  assert.equal(element('backupArea').classList.contains('hidden'),false);
  assert.equal(element('loginCards').innerHTML.includes(password),false);
  element('lockBtn').onclick();
  assert.equal(element('vaultNav').classList.contains('hidden'),true);
  assert.equal(run('logins.length'),0);
  assert.equal(element('loginCards').innerHTML,'');
  element('pass').value='master-password';
  listeners.unlockFormsubmit({preventDefault(){}});
  await idle();
  assert.equal(run('logins[0].name'),'Edited');
  await click('delete');
  await idle();
  assert.equal(run('logins.length'),0);
  assert.equal(run('accounts.length'),1);
  assert.notEqual(blob,updated);
  await assert.rejects(run('decryptData(vault,"incorrect-password")'));
  assert.throws(()=>run('readPayload({schema:99,accounts:[],logins:[]})'));
  console.log('PASS: legacy migration, TOTP, encryption, failed writes, add, edit, search, mask, reveal timeout, copy, lock, reload, delete');
})().catch(error=>{console.error(error);process.exitCode=1});
