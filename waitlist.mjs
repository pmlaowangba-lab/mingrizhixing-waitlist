import {mountAuthDots} from './auth-dots.mjs';

const EMAIL_RE=/^[^\s@<>(),;:"[\]\\]+@[^\s@<>(),;:"[\]\\]+\.[^\s@<>(),;:"[\]\\]{2,}$/;
const REMOTE_WAITLIST_ENDPOINT='https://laowangba.com/api/waitlist';

function resolveWaitlistEndpoint(){
 const host=location.hostname;
 if(host==='laowangba.com'||host==='127.0.0.1'||host==='localhost')return '/api/waitlist';
 return REMOTE_WAITLIST_ENDPOINT;
}

const stage=document.getElementById('wlStage');
const formView=document.getElementById('wlFormView');
const successView=document.getElementById('wlSuccessView');
const form=document.getElementById('wlForm');
const emailInput=document.getElementById('wlEmail');
const submitBtn=document.getElementById('wlSubmit');
const submitLabel=submitBtn?.querySelector('.wl-submit-label');
const feedback=document.getElementById('wlFeedback');
const successTitle=document.getElementById('wlSuccessTitle');
const successDesc=document.getElementById('wlSuccessDesc');
const successEmail=document.getElementById('wlSuccessEmail');
const copyBtn=document.getElementById('wlCopyBtn');
const resetBtn=document.getElementById('wlResetBtn');

if(stage){
 try{mountAuthDots(stage);}catch{}
}

function readSource(){
 try{
  const params=new URLSearchParams(location.search);
  const raw=params.get('ref')||params.get('utm_source')||params.get('from')||'';
  return raw.trim().replace(/[^\w.-]/g,'').slice(0,64)||(location.hostname.endsWith('.github.io')?'github-pages':'direct');
 }catch{
  return 'direct';
 }
}

function setFeedback(message){
 if(!feedback)return;
 if(!message){
  feedback.hidden=true;
  feedback.textContent='';
  emailInput?.removeAttribute('aria-invalid');
  return;
 }
 feedback.textContent=message;
 feedback.hidden=false;
 emailInput?.setAttribute('aria-invalid','true');
}

function setSubmitting(busy){
 if(!submitBtn)return;
 submitBtn.disabled=busy;
 if(submitLabel)submitLabel.textContent=busy?'正在登记…':'加入等待名单';
}

function showSuccess({email,alreadyJoined}){
 if(formView)formView.hidden=true;
 if(successView)successView.hidden=false;
 if(successTitle){
  successTitle.textContent=alreadyJoined?'你已在等待名单中':'已加入等待名单';
 }
 if(successDesc){
  successDesc.textContent=alreadyJoined
   ?'无需重复登记，上线后将邮件通知'
   :'正式上线后将第一时间通知';
  if(successEmail){
   successEmail.textContent=email;
   successDesc.append(' ',successEmail);
  }
 }
}

emailInput?.addEventListener('input',()=>{
 if(!feedback?.hidden)setFeedback('');
});

form?.addEventListener('submit',async event=>{
 event.preventDefault();
 const raw=String(emailInput?.value||'').trim().toLowerCase();
 if(!raw){
  setFeedback('请先输入你的邮箱地址');
  emailInput?.focus();
  return;
 }
 if(raw.length>254||!EMAIL_RE.test(raw)){
  setFeedback('邮箱格式不太正确，请检查后重试');
  emailInput?.focus();
  return;
 }
 setFeedback('');
 setSubmitting(true);
 try{
  const response=await fetch(resolveWaitlistEndpoint(),{
   method:'POST',
   headers:{
    'Content-Type':'application/json',
    'X-Workbench-Action':'waitlist',
   },
   body:JSON.stringify({email:raw,source:readSource()}),
  });
  let payload={};
  try{payload=await response.json();}catch{}
  if(!response.ok){
   setFeedback(payload.error||'登记暂时失败，请稍后重试');
   return;
  }
  showSuccess({
   email:payload.email||raw,
   alreadyJoined:payload.alreadyJoined===true,
  });
 }catch{
  setFeedback('网络连接异常，请稍后重试');
 }finally{
  setSubmitting(false);
 }
});

copyBtn?.addEventListener('click',async()=>{
 const url=location.href.split('#')[0];
 try{
  await navigator.clipboard.writeText(url);
  const original=copyBtn.textContent;
  copyBtn.textContent='已复制';
  setTimeout(()=>{copyBtn.textContent=original;},1800);
 }catch{
  window.prompt('复制等待名单链接：',url);
 }
});

resetBtn?.addEventListener('click',()=>{
 if(successView)successView.hidden=true;
 if(formView)formView.hidden=false;
 if(emailInput){
  emailInput.value='';
  emailInput.focus();
 }
 setFeedback('');
});

for(const btn of document.querySelectorAll('[data-copy]')){
 btn.addEventListener('click',async()=>{
  const value=btn.getAttribute('data-copy')||'';
  const badge=btn.querySelector('small');
  try{
   await navigator.clipboard.writeText(value);
   btn.classList.add('is-copied');
   if(badge)badge.textContent='已复制';
   setTimeout(()=>{
    btn.classList.remove('is-copied');
    if(badge)badge.textContent='复制';
   },1800);
  }catch{
   window.prompt('复制以下内容：',value);
  }
 });
}
