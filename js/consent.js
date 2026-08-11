(function(){
  'use strict';
  var cfg=window.LocPilotTrackingConfig||{};
  var KEY='locpilot-cookie-consent';
  var VERSION=cfg.consentVersion||'2026-08-11-v5';
  var DAYS=Number(cfg.cookieLifetimeDays||183);
  var banner=document.getElementById('lpConsentBanner');
  var modal=document.getElementById('lpConsentModal');
  if(!banner||!modal)return;
  var analytics=document.getElementById('lpConsentAnalytics');
  var marketing=document.getElementById('lpConsentMarketing');
  var lastFocus=null;
  function safeGet(){try{return localStorage.getItem(KEY)}catch(e){return null}}
  function safeSet(v){try{localStorage.setItem(KEY,v)}catch(e){}}
  function safeRemove(){try{localStorage.removeItem(KEY)}catch(e){}}
  function readCookie(){try{var m=document.cookie.match(new RegExp('(?:^|; )'+KEY.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'=([^;]*)'));return m?decodeURIComponent(m[1]):null}catch(e){return null}}
  function clearCookie(){try{document.cookie=KEY+'=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax'}catch(e){}}
  function parse(raw){if(!raw)return null;try{var x=JSON.parse(raw);if(!x||x.version!==VERSION||!x.expiresAt||Date.parse(x.expiresAt)<=Date.now())return null;return {necessary:true,analytics:x.analytics===true,marketing:x.marketing===true,version:VERSION,updatedAt:x.updatedAt||'',expiresAt:x.expiresAt}}catch(e){return null}}
  function getConsent(){var c=parse(safeGet())||parse(readCookie());if(!c){safeRemove();clearCookie()}return c}
  function persist(choice){var c={necessary:true,analytics:choice.analytics===true,marketing:choice.marketing===true,version:VERSION,updatedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+DAYS*86400000).toISOString()};var s=JSON.stringify(c);safeSet(s);try{document.cookie=KEY+'='+encodeURIComponent(s)+'; expires='+new Date(c.expiresAt).toUTCString()+'; path=/; SameSite=Lax'}catch(e){}return c}
  function dispatch(c){window.LocPilotCookieConsent=c;document.documentElement.dataset.cookieAnalytics=c.analytics?'granted':'denied';document.documentElement.dataset.cookieMarketing=c.marketing?'granted':'denied';window.dispatchEvent(new CustomEvent('locpilot:consent-updated',{detail:c}))}
  function showBanner(){banner.hidden=false;banner.setAttribute('aria-hidden','false')}
  function hideBanner(){banner.hidden=true;banner.setAttribute('aria-hidden','true')}
  function openModal(){lastFocus=document.activeElement;var c=getConsent();analytics.checked=!!(c&&c.analytics);marketing.checked=!!(c&&c.marketing);modal.hidden=false;modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';setTimeout(function(){document.getElementById('lpConsentClose').focus()},0)}
  function closeModal(){modal.hidden=true;modal.setAttribute('aria-hidden','true');document.body.style.overflow='';if(!getConsent())showBanner();if(lastFocus&&lastFocus.focus)lastFocus.focus()}
  function apply(choice){var c=persist(choice);dispatch(c);hideBanner();modal.hidden=true;modal.setAttribute('aria-hidden','true');document.body.style.overflow=''}
  function bind(id,fn){var el=document.getElementById(id);if(el)el.addEventListener('click',fn)}
  bind('lpConsentReject',function(){apply({analytics:false,marketing:false})});
  bind('lpConsentAccept',function(){apply({analytics:true,marketing:true})});
  bind('lpConsentCustomize',openModal);
  bind('lpConsentRejectAll',function(){apply({analytics:false,marketing:false})});
  bind('lpConsentAcceptAll',function(){apply({analytics:true,marketing:true})});
  bind('lpConsentSave',function(){apply({analytics:analytics.checked,marketing:marketing.checked})});
  bind('lpConsentClose',closeModal);
  var backdrop=modal.querySelector('[data-lp-consent-close]');if(backdrop)backdrop.addEventListener('click',closeModal);
  document.querySelectorAll('[data-open-cookie-manager],#openCookieManager,a[href="#gestion-cookies"]').forEach(function(el){el.addEventListener('click',function(e){e.preventDefault();openModal()})});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!modal.hidden)closeModal()});
  window.LocPilotCookieManager={getConsent:getConsent,openPanel:openModal,acceptAll:function(){apply({analytics:true,marketing:true})},rejectAll:function(){apply({analytics:false,marketing:false})}};
  var current=getConsent();
  if(current){dispatch(current);hideBanner()}else{window.requestAnimationFrame(showBanner)}
})();
