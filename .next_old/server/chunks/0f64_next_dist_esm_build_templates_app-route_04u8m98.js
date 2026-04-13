module.exports=[30929,e=>{"use strict";var t=e.i(84760),a=e.i(85446),r=e.i(7800),n=e.i(60652),i=e.i(96778),l=e.i(55940),o=e.i(80639),s=e.i(25511),u=e.i(66705),d=e.i(37605),p=e.i(91388),c=e.i(52863),R=e.i(26181),h=e.i(50664),m=e.i(91675),f=e.i(93695);e.i(82414);var v=e.i(55421),x=e.i(92099),k=e.i(11787);e.i(9312);let g={enneagram:"Enneagram",vark:"VARK",holland:"Holland RIASEC","coklu-zeka":"Çoklu Zekâ","sinav-kaygisi":"Sınav Kaygısı","calisma-davranisi":"Çalışma Davranışı","akademik-analiz":"Akademik Analiz","hizli-okuma":"Hızlı Okuma","d2-dikkat":"D2 Dikkat","sag-sol-beyin":"Sağ-Sol Beyin"};async function E(e){try{let{results:t,patterns:a,risk:r,careers:n}=await e.json(),i=t.map(e=>{let t=g[e.test_type]||e.test_type;return`### ${t}
\`\`\`json
${JSON.stringify(e.scores,null,2)}
\`\`\``}).join("\n\n"),l=a.length>0?a.map(e=>`- **${e.title}** (${e.severity}): ${e.description}`).join("\n"):"Belirgin korelasyon bulgusu tespit edilmedi.",o=r?`Risk Skoru: ${r.overallScore}/100 (${r.label})
Boyutlar: ${r.dimensions.map(e=>`${e.name}: ${e.available?e.score:"veri yok"}`).join(", ")}
Uyarılar: ${r.flags.map(e=>e.message).join("; ")||"Yok"}`:"Risk verisi mevcut değil.",s=n&&n.topCareers.length>0?`Holland Kodu: ${n.hollandCode||"N/A"}
Baskın Zek\xe2: ${n.dominantZeka||"N/A"}
\xd6ğrenme Stili: ${n.varkStyle||"N/A"}
\xd6nerilen Kariyerler: ${n.topCareers.map(e=>`${e.career} (%${e.matchScore})`).join(", ")}`:"Kariyer verisi mevcut değil.",u=`# ROL

Sen, T\xfcrkiye'nin \xf6nde gelen eğitim psikolojisi merkezlerinde uzmanlaşmış bir Klinik Eğitim Psikoloğusun.
Bu \xf6ğrencinin 360\xb0 b\xfct\xfcnc\xfcl profil raporunu hazırla.

# TEST VERİLERİ

${i}

# \xc7APRAZ KORELASYON BULGULARI

${l}

# RİSK DEĞERLENDİRMESİ

${o}

# KARİYER EŞLEŞTİRMESİ

${s}

# RAPOR FORMATI

L\xfctfen şu b\xf6l\xfcmleri i\xe7eren, yaklaşık 800-1000 kelimelik T\xfcrk\xe7e bir rapor yaz:

1. **Genel Profil \xd6zeti**: T\xfcm test sonu\xe7larının sentezi
2. **G\xfc\xe7l\xfc Y\xf6nler**: \xd6ğrencinin \xf6ne \xe7ıkan alanları (verilere dayalı)
3. **Gelişim Alanları**: Dikkat gerektiren noktalar
4. **\xc7apraz Analiz**: Testler arası korelasyonlar ve bağlantılar
5. **Risk Değerlendirmesi**: Risk durumu ve \xf6neriler
6. **Kariyer Y\xf6nlendirmesi**: Test sonu\xe7larına dayalı kariyer \xf6nerileri
7. **Eylem Planı**: Somut, uygulanabilir 5 \xf6neri

Her yorumu parantez i\xe7inde kaynak test ve puan ile destekle.
Abartısız, dengeli, bilimsel bir dil kullan.
Tıbbi tanı terimi kullanma.`,d=await (0,k.generateAIReport)(u);return x.NextResponse.json({report:d})}catch{return x.NextResponse.json({report:"Rapor oluşturulurken bir hata oluştu."},{status:500})}}e.s(["POST",0,E],51370);var y=e.i(51370);let A=new t.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/reports/profile-360/route",pathname:"/api/reports/profile-360",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/Desktop/Egitim_Check/src/app/api/reports/profile-360/route.ts",nextConfigOutput:"",userland:y,...{}}),{workAsyncStorage:C,workUnitAsyncStorage:w,serverHooks:b}=A;async function S(e,t,r){r.requestMeta&&(0,n.setRequestMeta)(e,r.requestMeta),A.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let x="/api/reports/profile-360/route";x=x.replace(/\/index$/,"")||"/";let k=await A.prepare(e,t,{srcPage:x,multiZoneDraftMode:!1});if(!k)return t.statusCode=400,t.end("Bad Request"),null==r.waitUntil||r.waitUntil.call(r,Promise.resolve()),null;let{buildId:g,params:E,nextConfig:y,parsedUrl:C,isDraftMode:w,prerenderManifest:b,routerServerContext:S,isOnDemandRevalidate:T,revalidateOnlyGenerated:N,resolvedPathname:P,clientReferenceManifest:$,serverActionsManifest:O}=k,_=(0,o.normalizeAppPath)(x),D=!!(b.dynamicRoutes[_]||b.routes[P]),H=async()=>((null==S?void 0:S.render404)?await S.render404(e,t,C,!1):t.end("This page could not be found"),null);if(D&&!w){let e=!!b.routes[P],t=b.dynamicRoutes[_];if(t&&!1===t.fallback&&!e){if(y.adapterPath)return await H();throw new f.NoFallbackError}}let I=null;!D||A.isDev||w||(I="/index"===(I=P)?"/":I);let U=!0===A.isDev||!D,q=D&&!U;O&&$&&(0,l.setManifestsSingleton)({page:x,clientReferenceManifest:$,serverActionsManifest:O});let K=e.method||"GET",M=(0,i.getTracer)(),j=M.getActiveScopeSpan(),z=!!(null==S?void 0:S.isWrappedByNextServer),L=!!(0,n.getRequestMeta)(e,"minimalMode"),B=(0,n.getRequestMeta)(e,"incrementalCache")||await A.getIncrementalCache(e,y,b,L);null==B||B.resetRequestCache(),globalThis.__incrementalCache=B;let F={params:E,previewProps:b.preview,renderOpts:{experimental:{authInterrupts:!!y.experimental.authInterrupts},cacheComponents:!!y.cacheComponents,supportsDynamicResponse:U,incrementalCache:B,cacheLifeProfiles:y.cacheLife,waitUntil:r.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,a,r,n)=>A.onRequestError(e,t,r,n,S)},sharedContext:{buildId:g}},G=new s.NodeNextRequest(e),V=new s.NodeNextResponse(t),Y=u.NextRequestAdapter.fromNodeNextRequest(G,(0,u.signalFromNodeResponse)(t));try{let n,l=async e=>A.handle(Y,F).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let a=M.getRootSpanAttributes();if(!a)return;if(a.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${a.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let r=a.get("next.route");if(r){let t=`${K} ${r}`;e.setAttributes({"next.route":r,"http.route":r,"next.span_name":t}),e.updateName(t),n&&n!==e&&(n.setAttribute("http.route",r),n.updateName(t))}else e.updateName(`${K} ${x}`)}),o=async n=>{var i,o;let s=async({previousCacheEntry:a})=>{try{if(!L&&T&&N&&!a)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await l(n);e.fetchMetrics=F.renderOpts.fetchMetrics;let o=F.renderOpts.pendingWaitUntil;o&&r.waitUntil&&(r.waitUntil(o),o=void 0);let s=F.renderOpts.collectedTags;if(!D)return await (0,c.sendResponse)(G,V,i,F.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,R.toNodeOutgoingHttpHeaders)(i.headers);s&&(t[m.NEXT_CACHE_TAGS_HEADER]=s),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let a=void 0!==F.renderOpts.collectedRevalidate&&!(F.renderOpts.collectedRevalidate>=m.INFINITE_CACHE)&&F.renderOpts.collectedRevalidate,r=void 0===F.renderOpts.collectedExpire||F.renderOpts.collectedExpire>=m.INFINITE_CACHE?void 0:F.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:a,expire:r}}}}catch(t){throw(null==a?void 0:a.isStale)&&await A.onRequestError(e,t,{routerKind:"App Router",routePath:x,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:q,isOnDemandRevalidate:T})},!1,S),t}},u=await A.handleResponse({req:e,nextConfig:y,cacheKey:I,routeKind:a.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:b,isRoutePPREnabled:!1,isOnDemandRevalidate:T,revalidateOnlyGenerated:N,responseGenerator:s,waitUntil:r.waitUntil,isMinimalMode:L});if(!D)return null;if((null==u||null==(i=u.value)?void 0:i.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(o=u.value)?void 0:o.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});L||t.setHeader("x-nextjs-cache",T?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),w&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let d=(0,R.fromNodeOutgoingHttpHeaders)(u.value.headers);return L&&D||d.delete(m.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||d.get("Cache-Control")||d.set("Cache-Control",(0,h.getCacheControlHeader)(u.cacheControl)),await (0,c.sendResponse)(G,V,new Response(u.value.body,{headers:d,status:u.value.status||200})),null};z&&j?await o(j):(n=M.getActiveScopeSpan(),await M.withPropagatedContext(e.headers,()=>M.trace(d.BaseServerSpan.handleRequest,{spanName:`${K} ${x}`,kind:i.SpanKind.SERVER,attributes:{"http.method":K,"http.target":e.url}},o),void 0,!z))}catch(t){if(t instanceof f.NoFallbackError||await A.onRequestError(e,t,{routerKind:"App Router",routePath:_,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:q,isOnDemandRevalidate:T})},!1,S),D)throw t;return await (0,c.sendResponse)(G,V,new Response(null,{status:500})),null}}e.s(["handler",0,S,"patchFetch",0,function(){return(0,r.patchFetch)({workAsyncStorage:C,workUnitAsyncStorage:w})},"routeModule",0,A,"serverHooks",0,b,"workAsyncStorage",0,C,"workUnitAsyncStorage",0,w],30929)}];

//# sourceMappingURL=0f64_next_dist_esm_build_templates_app-route_04u8m98.js.map