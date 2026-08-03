"use strict";
const $=id=>document.getElementById(id);
let authConfig={oauth:{google:false,facebook:false},emailEnabled:false,requireEmailVerification:false};
function mode(register){$("loginForm").classList.toggle("hidden",register);$("registerForm").classList.toggle("hidden",!register);$("loginTab").classList.toggle("active",!register);$("registerTab").classList.toggle("active",register);$("authMessage").textContent=""}
function show(text,error=true){$("authMessage").className=`message ${error?"error":"success"}`;$("authMessage").innerHTML=text}
function saveSession(data,remember=true){const storage=remember?localStorage:sessionStorage;const other=remember?sessionStorage:localStorage;other.removeItem("rsrSession");other.removeItem("rsrUser");storage.setItem("rsrSession",data.token);storage.setItem("rsrUser",JSON.stringify(data.user||{}));location.href="dashboard.html"}
function currentToken(){return localStorage.getItem("rsrSession")||sessionStorage.getItem("rsrSession")}
async function refreshStatus(){
  const indicator=$("authServerStatus");
  try{const health=await RSRNetwork.api("/api/health",{}, {retries:1,showReconnect:false,timeoutMs:10000});indicator.className="server-status online";indicator.innerHTML="<span></span><b>Secure server online</b>";return health}
  catch{indicator.className="server-status waking";indicator.innerHTML="<span></span><b>Server waking up…</b>";return null}
}
async function loadConfig(){
  try{
    authConfig=await RSRNetwork.api("/api/auth/config",{}, {retries:2});
    $("googleLogin").classList.toggle("hidden",!authConfig.oauth.google);
    $("facebookLogin").classList.toggle("hidden",!authConfig.oauth.facebook);
    $("socialLogin").classList.toggle("hidden",!authConfig.oauth.google&&!authConfig.oauth.facebook);
    $("resendVerification").classList.toggle("hidden",!authConfig.emailEnabled);
  }catch(error){show(error.message)}
}
function oauth(provider){
  const remember=$("rememberMe").checked;
  const width=540,height=700,left=Math.max(0,(screen.width-width)/2),top=Math.max(0,(screen.height-height)/2);
  const popup=window.open(`/api/auth/${provider}/start?rememberMe=${remember}&returnTo=${encodeURIComponent("/dashboard.html")}`,"rsrOauth",`width=${width},height=${height},left=${left},top=${top}`);
  if(!popup)show("Allow pop-ups for Reck Shop, then try again.");
}
window.addEventListener("message",event=>{if(event.origin!==location.origin||event.data?.type!=="rsr-oauth-result")return;if(event.data.ok)saveSession({token:event.data.token,user:{}},$("rememberMe").checked);else show(event.data.error||"Social login failed.")});
$("loginTab").onclick=()=>mode(false);$("registerTab").onclick=()=>mode(true);
$("googleLogin").onclick=()=>oauth("google");$("facebookLogin").onclick=()=>oauth("facebook");
$("loginForm").onsubmit=async event=>{event.preventDefault();const button=$("loginSubmit");button.disabled=true;button.textContent="Connecting…";try{const remember=$("rememberMe").checked;const data=await RSRNetwork.api("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:$("loginEmail").value.trim(),password:$("loginPassword").value,rememberMe:remember})},{retries:2});saveSession(data,remember)}catch(error){show(error.message)}finally{button.disabled=false;button.textContent="Login"}};
$("registerForm").onsubmit=async event=>{event.preventDefault();if($("registerPassword").value!==$("registerConfirm").value)return show("Passwords do not match.");const button=$("registerSubmit");button.disabled=true;button.textContent="Creating account…";try{const data=await RSRNetwork.api("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fullName:$("registerName").value.trim(),email:$("registerEmail").value.trim(),password:$("registerPassword").value})},{retries:1});if(data.verificationRequired){show(`${data.message}${data.verificationUrl?` <a href="${data.verificationUrl}">Development verification link</a>`:""}`,false);mode(false);$("loginEmail").value=$("registerEmail").value.trim()}else saveSession(data,true)}catch(error){show(error.message)}finally{button.disabled=false;button.textContent="Register"}};
$("resendVerification").onclick=async()=>{const email=$("loginEmail").value.trim()||prompt("Enter your registered email:");if(!email)return;try{const data=await RSRNetwork.api("/api/auth/resend-verification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});show(`${data.message}${data.verificationUrl?` <a href="${data.verificationUrl}">Development verification link</a>`:""}`,false)}catch(error){show(error.message)}};
(async()=>{if(currentToken()){location.href="dashboard.html";return}const oauthError=new URLSearchParams(location.search).get("oauthError");if(oauthError)show(oauthError);await refreshStatus();await loadConfig()})();