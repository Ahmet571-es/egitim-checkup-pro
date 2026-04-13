module.exports=[3894,a=>{"use strict";var b=a.i(26346),c=Object.defineProperty,d=Object.defineProperties,e=Object.getOwnPropertyDescriptors,f=Object.getOwnPropertySymbols,g=Object.prototype.hasOwnProperty,h=Object.prototype.propertyIsEnumerable,i=(a,b,d)=>b in a?c(a,b,{enumerable:!0,configurable:!0,writable:!0,value:d}):a[b]=d,j=(a,b)=>{for(var c in b||(b={}))g.call(b,c)&&i(a,c,b[c]);if(f)for(var c of f(b))h.call(b,c)&&i(a,c,b[c]);return a},k=(a,b,c)=>new Promise((d,e)=>{var f=a=>{try{h(c.next(a))}catch(a){e(a)}},g=a=>{try{h(c.throw(a))}catch(a){e(a)}},h=a=>a.done?d(a.value):Promise.resolve(a.value).then(f,g);h((c=c.apply(a,b)).next())}),l=class{constructor(a){this.resend=a}create(a){return k(this,arguments,function*(a,b={}){return yield this.resend.post("/api-keys",a,b)})}list(){return k(this,null,function*(){return yield this.resend.get("/api-keys")})}remove(a){return k(this,null,function*(){return yield this.resend.delete(`/api-keys/${a}`)})}},m=class{constructor(a){this.resend=a}create(a){return k(this,arguments,function*(a,b={}){return yield this.resend.post("/audiences",a,b)})}list(){return k(this,null,function*(){return yield this.resend.get("/audiences")})}get(a){return k(this,null,function*(){return yield this.resend.get(`/audiences/${a}`)})}remove(a){return k(this,null,function*(){return yield this.resend.delete(`/audiences/${a}`)})}};function n(a){var b;return{attachments:null==(b=a.attachments)?void 0:b.map(a=>({content:a.content,filename:a.filename,path:a.path,content_type:a.contentType,inline_content_id:a.inlineContentId})),bcc:a.bcc,cc:a.cc,from:a.from,headers:a.headers,html:a.html,reply_to:a.replyTo,scheduled_at:a.scheduledAt,subject:a.subject,tags:a.tags,text:a.text,to:a.to}}var o=class{constructor(a){this.resend=a}send(a){return k(this,arguments,function*(a,b={}){return this.create(a,b)})}create(b){return k(this,arguments,function*(b,c={}){let d=[];for(let c of b){if(c.react){if(!this.renderAsync)try{let{renderAsync:b}=yield a.A(34470);this.renderAsync=b}catch(a){throw Error("Failed to render React component. Make sure to install `@react-email/render`")}c.html=yield this.renderAsync(c.react),c.react=void 0}d.push(n(c))}return yield this.resend.post("/emails/batch",d,c)})}},p=class{constructor(a){this.resend=a}create(b){return k(this,arguments,function*(b,c={}){if(b.react){if(!this.renderAsync)try{let{renderAsync:b}=yield a.A(34470);this.renderAsync=b}catch(a){throw Error("Failed to render React component. Make sure to install `@react-email/render`")}b.html=yield this.renderAsync(b.react)}return yield this.resend.post("/broadcasts",{name:b.name,audience_id:b.audienceId,preview_text:b.previewText,from:b.from,html:b.html,reply_to:b.replyTo,subject:b.subject,text:b.text},c)})}send(a,b){return k(this,null,function*(){return yield this.resend.post(`/broadcasts/${a}/send`,{scheduled_at:null==b?void 0:b.scheduledAt})})}list(){return k(this,null,function*(){return yield this.resend.get("/broadcasts")})}get(a){return k(this,null,function*(){return yield this.resend.get(`/broadcasts/${a}`)})}remove(a){return k(this,null,function*(){return yield this.resend.delete(`/broadcasts/${a}`)})}update(a,b){return k(this,null,function*(){return yield this.resend.patch(`/broadcasts/${a}`,{name:b.name,audience_id:b.audienceId,from:b.from,html:b.html,text:b.text,subject:b.subject,reply_to:b.replyTo,preview_text:b.previewText})})}},q=class{constructor(a){this.resend=a}create(a){return k(this,arguments,function*(a,b={}){return yield this.resend.post(`/audiences/${a.audienceId}/contacts`,{unsubscribed:a.unsubscribed,email:a.email,first_name:a.firstName,last_name:a.lastName},b)})}list(a){return k(this,null,function*(){return yield this.resend.get(`/audiences/${a.audienceId}/contacts`)})}get(a){return k(this,null,function*(){return a.id||a.email?yield this.resend.get(`/audiences/${a.audienceId}/contacts/${(null==a?void 0:a.email)?null==a?void 0:a.email:null==a?void 0:a.id}`):{data:null,error:{message:"Missing `id` or `email` field.",name:"missing_required_field"}}})}update(a){return k(this,null,function*(){return a.id||a.email?yield this.resend.patch(`/audiences/${a.audienceId}/contacts/${(null==a?void 0:a.email)?null==a?void 0:a.email:null==a?void 0:a.id}`,{unsubscribed:a.unsubscribed,first_name:a.firstName,last_name:a.lastName}):{data:null,error:{message:"Missing `id` or `email` field.",name:"missing_required_field"}}})}remove(a){return k(this,null,function*(){return a.id||a.email?yield this.resend.delete(`/audiences/${a.audienceId}/contacts/${(null==a?void 0:a.email)?null==a?void 0:a.email:null==a?void 0:a.id}`):{data:null,error:{message:"Missing `id` or `email` field.",name:"missing_required_field"}}})}},r=class{constructor(a){this.resend=a}create(a){return k(this,arguments,function*(a,b={}){return yield this.resend.post("/domains",{name:a.name,region:a.region,custom_return_path:a.customReturnPath},b)})}list(){return k(this,null,function*(){return yield this.resend.get("/domains")})}get(a){return k(this,null,function*(){return yield this.resend.get(`/domains/${a}`)})}update(a){return k(this,null,function*(){return yield this.resend.patch(`/domains/${a.id}`,{click_tracking:a.clickTracking,open_tracking:a.openTracking,tls:a.tls})})}remove(a){return k(this,null,function*(){return yield this.resend.delete(`/domains/${a}`)})}verify(a){return k(this,null,function*(){return yield this.resend.post(`/domains/${a}/verify`)})}},s=class{constructor(a){this.resend=a}send(a){return k(this,arguments,function*(a,b={}){return this.create(a,b)})}create(b){return k(this,arguments,function*(b,c={}){if(b.react){if(!this.renderAsync)try{let{renderAsync:b}=yield a.A(34470);this.renderAsync=b}catch(a){throw Error("Failed to render React component. Make sure to install `@react-email/render`")}b.html=yield this.renderAsync(b.react)}return yield this.resend.post("/emails",n(b),c)})}get(a){return k(this,null,function*(){return yield this.resend.get(`/emails/${a}`)})}update(a){return k(this,null,function*(){return yield this.resend.patch(`/emails/${a.id}`,{scheduled_at:a.scheduledAt})})}cancel(a){return k(this,null,function*(){return yield this.resend.post(`/emails/${a}/cancel`)})}},t="u">typeof process&&process.env&&process.env.RESEND_BASE_URL||"https://api.resend.com",u="u">typeof process&&process.env&&process.env.RESEND_USER_AGENT||"resend-node:4.8.0",v=class{constructor(a){if(this.key=a,this.apiKeys=new l(this),this.audiences=new m(this),this.batch=new o(this),this.broadcasts=new p(this),this.contacts=new q(this),this.domains=new r(this),this.emails=new s(this),!a&&("u">typeof process&&process.env&&(this.key=process.env.RESEND_API_KEY),!this.key))throw Error('Missing API key. Pass it to the constructor `new Resend("re_123")`');this.headers=new Headers({Authorization:`Bearer ${this.key}`,"User-Agent":u,"Content-Type":"application/json"})}fetchRequest(a){return k(this,arguments,function*(a,b={}){try{let c=yield fetch(`${t}${a}`,b);if(!c.ok)try{let a=yield c.text();return{data:null,error:JSON.parse(a)}}catch(b){if(b instanceof SyntaxError)return{data:null,error:{name:"application_error",message:"Internal server error. We are unable to process your request right now, please try again later."}};let a={message:c.statusText,name:"application_error"};if(b instanceof Error){let c,f;return{data:null,error:(c=j({},a),f={message:b.message},d(c,e(f)))}}return{data:null,error:a}}return{data:yield c.json(),error:null}}catch(a){return{data:null,error:{name:"application_error",message:"Unable to fetch data. The request could not be resolved."}}}})}post(a,b){return k(this,arguments,function*(a,b,c={}){let d=new Headers(this.headers);c.idempotencyKey&&d.set("Idempotency-Key",c.idempotencyKey);let e=j({method:"POST",headers:d,body:JSON.stringify(b)},c);return this.fetchRequest(a,e)})}get(a){return k(this,arguments,function*(a,b={}){let c=j({method:"GET",headers:this.headers},b);return this.fetchRequest(a,c)})}put(a,b){return k(this,arguments,function*(a,b,c={}){let d=j({method:"PUT",headers:this.headers,body:JSON.stringify(b)},c);return this.fetchRequest(a,d)})}patch(a,b){return k(this,arguments,function*(a,b,c={}){let d=j({method:"PATCH",headers:this.headers,body:JSON.stringify(b)},c);return this.fetchRequest(a,d)})}delete(a,b){return k(this,null,function*(){let c={method:"DELETE",headers:this.headers,body:JSON.stringify(b)};return this.fetchRequest(a,c)})}};let w=process.env.RESEND_API_KEY,x=w?new v(w):null,y=process.env.EMAIL_FROM??"noreply@egitimcheckup.com",z=process.env.NEXT_PUBLIC_BASE_URL??"http://localhost:3000";async function A(a){if(!x)return console.warn("[email] RESEND_API_KEY tanımlı değil. E-posta gönderilmedi:",a.subject),{success:!1,error:"E-posta servisi yapılandırılmamış."};let b="";for(let c=1;c<=2;c++)try{let{error:d}=await x.emails.send({from:y,to:Array.isArray(a.to)?a.to:[a.to],subject:a.subject,html:a.html});if(d){b=d.message??"Bilinmeyen Resend hatası",console.error(`[email] Deneme ${c}/2 başarısız:`,b);continue}return{success:!0}}catch(a){console.error(`[email] Deneme ${c}/2 istisna:`,b=a instanceof Error?a.message:String(a))}return{success:!1,error:b}}var B=a.i(71120);async function C(a){let c=await (0,b.createClient)(),{data:d}=await c.from("profiles").select("id, full_name, email, role, school_id").eq("id",a).single();return d}async function D(a){try{var b;let c,d,e=await C(a);if(!e?.email)return;let f=B.ROLE_LABELS[e.role]??e.role,{subject:g,html:h}=(c=(b={fullName:e.full_name,role:f,loginUrl:`${z}/login`}).loginUrl??`${z}/login`,d=`
    <h1 style="margin:0 0 8px;color:#0f2847;font-size:24px;font-weight:800;">Hoş Geldiniz, ${b.fullName}! 🎉</h1>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">
      Eğitim Check-Up Pro ailesine katıldığınız i\xe7in teşekk\xfcr ederiz. 
      Hesabınız <strong style="color:#0f2847;">${b.role}</strong> rol\xfcyle başarıyla oluşturuldu.
    </p>
    ${function(a,b="#f0fdf4",c="#10b981"){return`<div style="background:${b};border-left:4px solid ${c};border-radius:0 12px 12px 0;padding:16px 20px;margin:16px 0;">
    ${a}
  </div>`}(`
      <p style="margin:0 0 6px;color:#166534;font-size:13px;font-weight:700;">✅ Hesabınız aktif</p>
      <p style="margin:0;color:#166534;font-size:13px;">Platforma giriş yaparak psikometrik testlere erişebilirsiniz.</p>
    `)}
    <h2 style="margin:24px 0 12px;color:#0f2847;font-size:16px;font-weight:700;">Platformda Neler Yapabilirsiniz?</h2>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${[["🧠","Psikometrik Testler","10 farklı test ile öğrencilerin güçlü yönlerini keşfedin"],["📊","AI Raporlar","Yapay zeka destekli kişiselleştirilmiş analizler"],["👥","Panel Yönetimi","Rol bazlı erişim ile ekibinizi yönetin"]].map(([a,b,c])=>`
        <tr>
          <td style="padding:8px 0;vertical-align:top;width:36px;">
            <span style="font-size:20px;">${a}</span>
          </td>
          <td style="padding:8px 0 8px 8px;">
            <strong style="color:#0f2847;font-size:14px;">${b}</strong>
            <br/>
            <span style="color:#64748b;font-size:13px;">${c}</span>
          </td>
        </tr>
      `).join("")}
    </table>
    ${function(a,b,c="#10b981"){return`<table cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;">
    <tr>
      <td align="center" style="background:${c};border-radius:12px;padding:0;">
        <a href="${b}" style="display:block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:-0.2px;">
          ${a}
        </a>
      </td>
    </tr>
  </table>`}("Platforma Giriş Yap",c)}
    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
      Sorunuz mu var? <a href="mailto:destek@egitimcheckup.com" style="color:#10b981;">destek@egitimcheckup.com</a> adresimize yazın.
    </p>
  `,{subject:`Eğitim Check-Up Pro'ya Hoş Geldiniz, ${b.fullName}!`,html:function(a,b=""){return`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Eğitim Check-Up Pro</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f0f5ff;font-family:'Segoe UI',Arial,sans-serif;">
  ${b?`<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${b}</div>`:""}
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
              ${a}
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
                Bu e-postayı almak istemiyorsanız <a href="${z}/profil/bildirimler" style="color:#10b981;">buraya tıklayın</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`}(d,"Hesabınız başarıyla oluşturuldu. Platforma giriş yapın.")});await A({to:e.email,subject:g,html:h}),console.log(`[email/welcome] G\xf6nderildi → ${e.email}`)}catch(a){console.error("[email/welcome] Hata:",a)}}a.s(["sendWelcomeEmail",0,D],3894)}];

//# sourceMappingURL=Desktop_Egitim_Check_src_lib_email_triggers_ts_0.4u1aa._.js.map