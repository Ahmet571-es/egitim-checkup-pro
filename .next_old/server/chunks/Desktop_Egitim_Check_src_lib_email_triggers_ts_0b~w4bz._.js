module.exports=[71241,e=>{"use strict";var t=e.i(23071),r=Object.defineProperty,n=Object.defineProperties,i=Object.getOwnPropertyDescriptors,s=Object.getOwnPropertySymbols,l=Object.prototype.hasOwnProperty,a=Object.prototype.propertyIsEnumerable,o=(e,t,n)=>t in e?r(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,d=(e,t)=>{for(var r in t||(t={}))l.call(t,r)&&o(e,r,t[r]);if(s)for(var r of s(t))a.call(t,r)&&o(e,r,t[r]);return e},c=(e,t,r)=>new Promise((n,i)=>{var s=e=>{try{a(r.next(e))}catch(e){i(e)}},l=e=>{try{a(r.throw(e))}catch(e){i(e)}},a=e=>e.done?n(e.value):Promise.resolve(e.value).then(s,l);a((r=r.apply(e,t)).next())}),u=class{constructor(e){this.resend=e}create(e){return c(this,arguments,function*(e,t={}){return yield this.resend.post("/api-keys",e,t)})}list(){return c(this,null,function*(){return yield this.resend.get("/api-keys")})}remove(e){return c(this,null,function*(){return yield this.resend.delete(`/api-keys/${e}`)})}},h=class{constructor(e){this.resend=e}create(e){return c(this,arguments,function*(e,t={}){return yield this.resend.post("/audiences",e,t)})}list(){return c(this,null,function*(){return yield this.resend.get("/audiences")})}get(e){return c(this,null,function*(){return yield this.resend.get(`/audiences/${e}`)})}remove(e){return c(this,null,function*(){return yield this.resend.delete(`/audiences/${e}`)})}};function p(e){var t;return{attachments:null==(t=e.attachments)?void 0:t.map(e=>({content:e.content,filename:e.filename,path:e.path,content_type:e.contentType,inline_content_id:e.inlineContentId})),bcc:e.bcc,cc:e.cc,from:e.from,headers:e.headers,html:e.html,reply_to:e.replyTo,scheduled_at:e.scheduledAt,subject:e.subject,tags:e.tags,text:e.text,to:e.to}}var f=class{constructor(e){this.resend=e}send(e){return c(this,arguments,function*(e,t={}){return this.create(e,t)})}create(t){return c(this,arguments,function*(t,r={}){let n=[];for(let r of t){if(r.react){if(!this.renderAsync)try{let{renderAsync:t}=yield e.A(71498);this.renderAsync=t}catch(e){throw Error("Failed to render React component. Make sure to install `@react-email/render`")}r.html=yield this.renderAsync(r.react),r.react=void 0}n.push(p(r))}return yield this.resend.post("/emails/batch",n,r)})}},m=class{constructor(e){this.resend=e}create(t){return c(this,arguments,function*(t,r={}){if(t.react){if(!this.renderAsync)try{let{renderAsync:t}=yield e.A(71498);this.renderAsync=t}catch(e){throw Error("Failed to render React component. Make sure to install `@react-email/render`")}t.html=yield this.renderAsync(t.react)}return yield this.resend.post("/broadcasts",{name:t.name,audience_id:t.audienceId,preview_text:t.previewText,from:t.from,html:t.html,reply_to:t.replyTo,subject:t.subject,text:t.text},r)})}send(e,t){return c(this,null,function*(){return yield this.resend.post(`/broadcasts/${e}/send`,{scheduled_at:null==t?void 0:t.scheduledAt})})}list(){return c(this,null,function*(){return yield this.resend.get("/broadcasts")})}get(e){return c(this,null,function*(){return yield this.resend.get(`/broadcasts/${e}`)})}remove(e){return c(this,null,function*(){return yield this.resend.delete(`/broadcasts/${e}`)})}update(e,t){return c(this,null,function*(){return yield this.resend.patch(`/broadcasts/${e}`,{name:t.name,audience_id:t.audienceId,from:t.from,html:t.html,text:t.text,subject:t.subject,reply_to:t.replyTo,preview_text:t.previewText})})}},y=class{constructor(e){this.resend=e}create(e){return c(this,arguments,function*(e,t={}){return yield this.resend.post(`/audiences/${e.audienceId}/contacts`,{unsubscribed:e.unsubscribed,email:e.email,first_name:e.firstName,last_name:e.lastName},t)})}list(e){return c(this,null,function*(){return yield this.resend.get(`/audiences/${e.audienceId}/contacts`)})}get(e){return c(this,null,function*(){return e.id||e.email?yield this.resend.get(`/audiences/${e.audienceId}/contacts/${(null==e?void 0:e.email)?null==e?void 0:e.email:null==e?void 0:e.id}`):{data:null,error:{message:"Missing `id` or `email` field.",name:"missing_required_field"}}})}update(e){return c(this,null,function*(){return e.id||e.email?yield this.resend.patch(`/audiences/${e.audienceId}/contacts/${(null==e?void 0:e.email)?null==e?void 0:e.email:null==e?void 0:e.id}`,{unsubscribed:e.unsubscribed,first_name:e.firstName,last_name:e.lastName}):{data:null,error:{message:"Missing `id` or `email` field.",name:"missing_required_field"}}})}remove(e){return c(this,null,function*(){return e.id||e.email?yield this.resend.delete(`/audiences/${e.audienceId}/contacts/${(null==e?void 0:e.email)?null==e?void 0:e.email:null==e?void 0:e.id}`):{data:null,error:{message:"Missing `id` or `email` field.",name:"missing_required_field"}}})}},g=class{constructor(e){this.resend=e}create(e){return c(this,arguments,function*(e,t={}){return yield this.resend.post("/domains",{name:e.name,region:e.region,custom_return_path:e.customReturnPath},t)})}list(){return c(this,null,function*(){return yield this.resend.get("/domains")})}get(e){return c(this,null,function*(){return yield this.resend.get(`/domains/${e}`)})}update(e){return c(this,null,function*(){return yield this.resend.patch(`/domains/${e.id}`,{click_tracking:e.clickTracking,open_tracking:e.openTracking,tls:e.tls})})}remove(e){return c(this,null,function*(){return yield this.resend.delete(`/domains/${e}`)})}verify(e){return c(this,null,function*(){return yield this.resend.post(`/domains/${e}/verify`)})}},b=class{constructor(e){this.resend=e}send(e){return c(this,arguments,function*(e,t={}){return this.create(e,t)})}create(t){return c(this,arguments,function*(t,r={}){if(t.react){if(!this.renderAsync)try{let{renderAsync:t}=yield e.A(71498);this.renderAsync=t}catch(e){throw Error("Failed to render React component. Make sure to install `@react-email/render`")}t.html=yield this.renderAsync(t.react)}return yield this.resend.post("/emails",p(t),r)})}get(e){return c(this,null,function*(){return yield this.resend.get(`/emails/${e}`)})}update(e){return c(this,null,function*(){return yield this.resend.patch(`/emails/${e.id}`,{scheduled_at:e.scheduledAt})})}cancel(e){return c(this,null,function*(){return yield this.resend.post(`/emails/${e}/cancel`)})}},x="u">typeof process&&process.env&&process.env.RESEND_BASE_URL||"https://api.resend.com",v="u">typeof process&&process.env&&process.env.RESEND_USER_AGENT||"resend-node:4.8.0",w=class{constructor(e){if(this.key=e,this.apiKeys=new u(this),this.audiences=new h(this),this.batch=new f(this),this.broadcasts=new m(this),this.contacts=new y(this),this.domains=new g(this),this.emails=new b(this),!e&&("u">typeof process&&process.env&&(this.key=process.env.RESEND_API_KEY),!this.key))throw Error('Missing API key. Pass it to the constructor `new Resend("re_123")`');this.headers=new Headers({Authorization:`Bearer ${this.key}`,"User-Agent":v,"Content-Type":"application/json"})}fetchRequest(e){return c(this,arguments,function*(e,t={}){try{let r=yield fetch(`${x}${e}`,t);if(!r.ok)try{let e=yield r.text();return{data:null,error:JSON.parse(e)}}catch(t){if(t instanceof SyntaxError)return{data:null,error:{name:"application_error",message:"Internal server error. We are unable to process your request right now, please try again later."}};let e={message:r.statusText,name:"application_error"};if(t instanceof Error){let r,s;return{data:null,error:(r=d({},e),s={message:t.message},n(r,i(s)))}}return{data:null,error:e}}return{data:yield r.json(),error:null}}catch(e){return{data:null,error:{name:"application_error",message:"Unable to fetch data. The request could not be resolved."}}}})}post(e,t){return c(this,arguments,function*(e,t,r={}){let n=new Headers(this.headers);r.idempotencyKey&&n.set("Idempotency-Key",r.idempotencyKey);let i=d({method:"POST",headers:n,body:JSON.stringify(t)},r);return this.fetchRequest(e,i)})}get(e){return c(this,arguments,function*(e,t={}){let r=d({method:"GET",headers:this.headers},t);return this.fetchRequest(e,r)})}put(e,t){return c(this,arguments,function*(e,t,r={}){let n=d({method:"PUT",headers:this.headers,body:JSON.stringify(t)},r);return this.fetchRequest(e,n)})}patch(e,t){return c(this,arguments,function*(e,t,r={}){let n=d({method:"PATCH",headers:this.headers,body:JSON.stringify(t)},r);return this.fetchRequest(e,n)})}delete(e,t){return c(this,null,function*(){let r={method:"DELETE",headers:this.headers,body:JSON.stringify(t)};return this.fetchRequest(e,r)})}};let k=process.env.RESEND_API_KEY,$=k?new w(k):null,_=process.env.EMAIL_FROM??"noreply@egitimcheckup.com",E=process.env.NEXT_PUBLIC_BASE_URL??"http://localhost:3000";async function z(e){if(!$)return console.warn("[email] RESEND_API_KEY tanımlı değil. E-posta gönderilmedi:",e.subject),{success:!1,error:"E-posta servisi yapılandırılmamış."};let t="";for(let r=1;r<=2;r++)try{let{error:n}=await $.emails.send({from:_,to:Array.isArray(e.to)?e.to:[e.to],subject:e.subject,html:e.html});if(n){t=n.message??"Bilinmeyen Resend hatası",console.error(`[email] Deneme ${r}/2 başarısız:`,t);continue}return{success:!0}}catch(e){console.error(`[email] Deneme ${r}/2 istisna:`,t=e instanceof Error?e.message:String(e))}return{success:!1,error:t}}async function S(e){let r=await (0,t.createClient)(),{data:n}=await r.from("profiles").select("id, full_name, email, role, school_id").eq("id",e).single();return n}async function R(e,t,r="Veli Destek Raporu"){try{var n;let i,s,l=await S(e);if(!l?.email)return;let{subject:a,html:o}=(i=(n={parentName:l.full_name,studentName:t,reportType:r,reportsUrl:`${E}/parent/results`}).reportsUrl??`${E}/parent/results`,s=`
    <h1 style="margin:0 0 8px;color:#0f2847;font-size:24px;font-weight:800;">Rapor Hazır 📄</h1>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">
      Merhaba <strong style="color:#0f2847;">${n.parentName}</strong>,<br/>
      \xc7ocuğunuz i\xe7in hazırlanan rapor artık g\xf6r\xfcnt\xfclemeye hazır.
    </p>
    ${function(e,t="#f0fdf4",r="#10b981"){return`<div style="background:${t};border-left:4px solid ${r};border-radius:0 12px 12px 0;padding:16px 20px;margin:16px 0;">
    ${e}
  </div>`}(`
      <p style="margin:0 0 4px;color:#9d174d;font-size:13px;font-weight:700;">💝 \xc7ocuğunuz i\xe7in rapor hazırlandı</p>
      <p style="margin:0 0 4px;color:#9d174d;font-size:14px;">
        <strong>${n.studentName}</strong> i\xe7in <strong>${n.reportType}</strong> raporu oluşturuldu.
      </p>
      <p style="margin:4px 0 0;color:#9d174d;font-size:12px;">
        Raporda \xe7ocuğunuzun gelişimine katkıda bulunacak \xf6zel \xf6neriler ve destek rehberi yer almaktadır.
      </p>
    `,"#fdf2f8","#ec4899")}
    <h3 style="margin:20px 0 12px;color:#0f2847;font-size:15px;font-weight:700;">Raporda Neler Bulacaksınız?</h3>
    <ul style="margin:0 0 20px;padding-left:20px;color:#64748b;font-size:14px;line-height:2;">
      <li>✨ G\xfc\xe7l\xfc y\xf6nler ve \xf6zel yetenekler</li>
      <li>📚 \xd6ğrenme stiline uygun \xe7alışma \xf6nerileri</li>
      <li>💡 Evde yapabilecekleriniz (Yapın / Yapmayın listesi)</li>
      <li>🎯 Kısa ve uzun vadeli gelişim hedefleri</li>
    </ul>
    ${function(e,t,r="#10b981"){return`<table cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;">
    <tr>
      <td align="center" style="background:${r};border-radius:12px;padding:0;">
        <a href="${t}" style="display:block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:-0.2px;">
          ${e}
        </a>
      </td>
    </tr>
  </table>`}("Raporu Görüntüle",i,"#ec4899")}
  `,{subject:`${n.studentName} i\xe7in Veli Raporu Hazır — Eğitim Check-Up Pro`,html:function(e,t=""){return`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Eğitim Check-Up Pro</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f0f5ff;font-family:'Segoe UI',Arial,sans-serif;">
  ${t?`<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${t}</div>`:""}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f5ff;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(15,40,71,0.08);">
          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f2847 0%,#1a3d6e 100%);padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="display:inline-flex;align-items:center;gap:12px;">
                      <div style="width:40px;height:40px;background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;">
                        <span style="color:white;font-size:20px;">🎓</span>
                      </div>
                      <div>
                        <div style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.3px;">Eğitim Check-Up Pro</div>
                        <div style="color:rgba(255,255,255,0.6);font-size:11px;margin-top:1px;">Psikometrik Test Platformu</div>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CONTENT -->
          <tr>
            <td style="padding:32px;">
              ${e}
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e8edf5;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 8px;color:#64748b;font-size:12px;">
                \xa9 ${new Date().getFullYear()} Eğitim Check-Up Pro — T\xfcm hakları saklıdır.
              </p>
              <p style="margin:0 0 8px;color:#64748b;font-size:12px;">
                📧 destek@egitimcheckup.com &nbsp;|&nbsp; 📞 0850 123 45 67
              </p>
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                Bu e-postayı almak istemiyorsanız <a href="${E}/profil/bildirimler" style="color:#10b981;">buraya tıklayın</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`}(s,`${n.studentName} i\xe7in \xf6zel veli raporu hazırlandı.`)});await z({to:l.email,subject:a,html:o}),console.log(`[email/report-ready] G\xf6nderildi → ${l.email}`)}catch(e){console.error("[email/report-ready] Hata:",e)}}[{value:"1",label:"1. Sınıf"},{value:"2",label:"2. Sınıf"},{value:"3",label:"3. Sınıf"},{value:"4",label:"4. Sınıf"},{value:"5",label:"5. Sınıf"},{value:"6",label:"6. Sınıf"},{value:"7",label:"7. Sınıf"},{value:"8",label:"8. Sınıf"},{value:"9",label:"9. Sınıf"},{value:"10",label:"10. Sınıf"},{value:"11",label:"11. Sınıf"},{value:"12",label:"12. Sınıf"},{value:"mezun",label:"Mezun"}].reduce((e,t)=>({...e,[t.value]:t.label}),{}),e.s(["sendReportReadyEmail",0,R],71241)}];

//# sourceMappingURL=Desktop_Egitim_Check_src_lib_email_triggers_ts_0b~w4bz._.js.map