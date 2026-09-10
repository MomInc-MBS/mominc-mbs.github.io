var Di={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Ni={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Tf=0,Xh=1,wf=2;var ad=1,Ef=2,zn=3,Cn=0,Ft=1,kt=2,ii=0,is=1,Yh=2,qh=3,Kh=4,Af=5,Ti=100,Rf=101,Cf=102,If=103,Pf=104,Lf=200,Df=201,Nf=202,Uf=203,Za=204,Ja=205,Of=206,Ff=207,Bf=208,zf=209,kf=210,Hf=211,Vf=212,Gf=213,Wf=214,ja=0,$a=1,Qa=2,as=3,ec=4,tc=5,nc=6,ic=7,cd=0,Xf=1,Yf=2,si=0,qf=1,Kf=2,Zf=3,ml=4,Jf=5,jf=6,$f=7,Zh="attached",Qf="detached",ld=300,cs=301,ls=302,sc=303,rc=304,Wo=306,Sn=1e3,Mn=1001,Ri=1002,Ct=1003,ur=1004;var ti=1005;var Rt=1006,Ai=1007;var Xt=1008;var Hn=1009,hd=1010,ud=1011,qs=1012,gl=1013,Ci=1014,bn=1015,dr=1016,_l=1017,yl=1018,hs=1020,dd=35902,fd=1021,pd=1022,Ot=1023,md=1024,gd=1025,ss=1026,us=1027,xl=1028,vl=1029,_d=1030,Ml=1031;var bl=1033,Qr=33776,eo=33777,to=33778,no=33779,oc=35840,ac=35841,cc=35842,lc=35843,hc=36196,uc=37492,dc=37496,fc=37808,pc=37809,mc=37810,gc=37811,_c=37812,yc=37813,xc=37814,vc=37815,Mc=37816,bc=37817,Sc=37818,Tc=37819,wc=37820,Ec=37821,io=36492,Ac=36494,Rc=36495,yd=36283,Cc=36284,Ic=36285,Pc=36286,Sl=2200,Tl=2201,ep=2202,ri=2300,oi=2301,fa=2302,Qi=2400,es=2401,ro=2402,wl=2500,tp=2501,xd=0,Xo=1,fr=2,np=3200,ip=3201;var vd=0,sp=1,Rn="",mt="srgb",Pt="srgb-linear",El="display-p3",Yo="display-p3-linear",oo="linear",ct="srgb",ao="rec709",co="p3";var Bi=7680;var Jh=519,rp=512,op=513,ap=514,Md=515,cp=516,lp=517,hp=518,up=519,Lc=35044;var jh="300 es",kn=2e3,lo=2001,In=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let i=this._listeners[e];if(i!==void 0){let r=i.indexOf(t);r!==-1&&i.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let n=this._listeners[e.type];if(n!==void 0){e.target=this;let i=n.slice(0);for(let r=0,o=i.length;r<o;r++)i[r].call(this,e);e.target=null}}},Nt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],$h=1234567,Hs=Math.PI/180,ds=180/Math.PI;function cn(){let s=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Nt[s&255]+Nt[s>>8&255]+Nt[s>>16&255]+Nt[s>>24&255]+"-"+Nt[e&255]+Nt[e>>8&255]+"-"+Nt[e>>16&15|64]+Nt[e>>24&255]+"-"+Nt[t&63|128]+Nt[t>>8&255]+"-"+Nt[t>>16&255]+Nt[t>>24&255]+Nt[n&255]+Nt[n>>8&255]+Nt[n>>16&255]+Nt[n>>24&255]).toLowerCase()}function Mt(s,e,t){return Math.max(e,Math.min(t,s))}function Al(s,e){return(s%e+e)%e}function dp(s,e,t,n,i){return n+(s-e)*(i-n)/(t-e)}function fp(s,e,t){return s!==e?(t-s)/(e-s):0}function Vs(s,e,t){return(1-t)*s+t*e}function pp(s,e,t,n){return Vs(s,e,1-Math.exp(-t*n))}function mp(s,e=1){return e-Math.abs(Al(s,e*2)-e)}function gp(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*(3-2*s))}function _p(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*s*(s*(s*6-15)+10))}function yp(s,e){return s+Math.floor(Math.random()*(e-s+1))}function xp(s,e){return s+Math.random()*(e-s)}function vp(s){return s*(.5-Math.random())}function Mp(s){s!==void 0&&($h=s);let e=$h+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function bp(s){return s*Hs}function Sp(s){return s*ds}function Tp(s){return(s&s-1)===0&&s!==0}function wp(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))}function Ep(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function Ap(s,e,t,n,i){let r=Math.cos,o=Math.sin,a=r(t/2),c=o(t/2),l=r((e+n)/2),h=o((e+n)/2),u=r((e-n)/2),d=o((e-n)/2),f=r((n-e)/2),m=o((n-e)/2);switch(i){case"XYX":s.set(a*h,c*u,c*d,a*l);break;case"YZY":s.set(c*d,a*h,c*u,a*l);break;case"ZXZ":s.set(c*u,c*d,a*h,a*l);break;case"XZX":s.set(a*h,c*m,c*f,a*l);break;case"YXY":s.set(c*f,a*h,c*m,a*l);break;case"ZYZ":s.set(c*m,c*f,a*h,a*l);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function vn(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return s/4294967295;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int32Array:return Math.max(s/2147483647,-1);case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("Invalid component type.")}}function tt(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return Math.round(s*4294967295);case Uint16Array:return Math.round(s*65535);case Uint8Array:return Math.round(s*255);case Int32Array:return Math.round(s*2147483647);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("Invalid component type.")}}var vt={DEG2RAD:Hs,RAD2DEG:ds,generateUUID:cn,clamp:Mt,euclideanModulo:Al,mapLinear:dp,inverseLerp:fp,lerp:Vs,damp:pp,pingpong:mp,smoothstep:gp,smootherstep:_p,randInt:yp,randFloat:xp,randFloatSpread:vp,seededRandom:Mp,degToRad:bp,radToDeg:Sp,isPowerOfTwo:Tp,ceilPowerOfTwo:wp,floorPowerOfTwo:Ep,setQuaternionFromProperEuler:Ap,normalize:tt,denormalize:vn},ie=class s{constructor(e=0,t=0){s.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Mt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*i+e.x,this.y=r*i+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Le=class s{constructor(e,t,n,i,r,o,a,c,l){s.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,o,a,c,l)}set(e,t,n,i,r,o,a,c,l){let h=this.elements;return h[0]=e,h[1]=i,h[2]=a,h[3]=t,h[4]=r,h[5]=c,h[6]=n,h[7]=o,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],h=n[4],u=n[7],d=n[2],f=n[5],m=n[8],_=i[0],p=i[3],g=i[6],M=i[1],x=i[4],y=i[7],A=i[2],w=i[5],R=i[8];return r[0]=o*_+a*M+c*A,r[3]=o*p+a*x+c*w,r[6]=o*g+a*y+c*R,r[1]=l*_+h*M+u*A,r[4]=l*p+h*x+u*w,r[7]=l*g+h*y+u*R,r[2]=d*_+f*M+m*A,r[5]=d*p+f*x+m*w,r[8]=d*g+f*y+m*R,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],h=e[8];return t*o*h-t*a*l-n*r*h+n*a*c+i*r*l-i*o*c}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],h=e[8],u=h*o-a*l,d=a*c-h*r,f=l*r-o*c,m=t*u+n*d+i*f;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let _=1/m;return e[0]=u*_,e[1]=(i*l-h*n)*_,e[2]=(a*n-i*o)*_,e[3]=d*_,e[4]=(h*t-i*c)*_,e[5]=(i*r-a*t)*_,e[6]=f*_,e[7]=(n*c-l*t)*_,e[8]=(o*t-n*r)*_,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,o,a){let c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*o+l*a)+o+e,-i*l,i*c,-i*(-l*o+c*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(pa.makeScale(e,t)),this}rotate(e){return this.premultiply(pa.makeRotation(-e)),this}translate(e,t){return this.premultiply(pa.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},pa=new Le;function bd(s){for(let e=s.length-1;e>=0;--e)if(s[e]>=65535)return!0;return!1}function Ks(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function Rp(){let s=Ks("canvas");return s.style.display="block",s}var Qh={};function so(s){s in Qh||(Qh[s]=!0,console.warn(s))}function Cp(s,e,t){return new Promise(function(n,i){function r(){switch(s.clientWaitSync(e,s.SYNC_FLUSH_COMMANDS_BIT,0)){case s.WAIT_FAILED:i();break;case s.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}function Ip(s){let e=s.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function Pp(s){let e=s.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var eu=new Le().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),tu=new Le().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Ps={[Pt]:{transfer:oo,primaries:ao,luminanceCoefficients:[.2126,.7152,.0722],toReference:s=>s,fromReference:s=>s},[mt]:{transfer:ct,primaries:ao,luminanceCoefficients:[.2126,.7152,.0722],toReference:s=>s.convertSRGBToLinear(),fromReference:s=>s.convertLinearToSRGB()},[Yo]:{transfer:oo,primaries:co,luminanceCoefficients:[.2289,.6917,.0793],toReference:s=>s.applyMatrix3(tu),fromReference:s=>s.applyMatrix3(eu)},[El]:{transfer:ct,primaries:co,luminanceCoefficients:[.2289,.6917,.0793],toReference:s=>s.convertSRGBToLinear().applyMatrix3(tu),fromReference:s=>s.applyMatrix3(eu).convertLinearToSRGB()}},Lp=new Set([Pt,Yo]),Ye={enabled:!0,_workingColorSpace:Pt,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(s){if(!Lp.has(s))throw new Error(`Unsupported working color space, "${s}".`);this._workingColorSpace=s},convert:function(s,e,t){if(this.enabled===!1||e===t||!e||!t)return s;let n=Ps[e].toReference,i=Ps[t].fromReference;return i(n(s))},fromWorkingColorSpace:function(s,e){return this.convert(s,this._workingColorSpace,e)},toWorkingColorSpace:function(s,e){return this.convert(s,e,this._workingColorSpace)},getPrimaries:function(s){return Ps[s].primaries},getTransfer:function(s){return s===Rn?oo:Ps[s].transfer},getLuminanceCoefficients:function(s,e=this._workingColorSpace){return s.fromArray(Ps[e].luminanceCoefficients)}};function rs(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function ma(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}var zi,Dc=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{zi===void 0&&(zi=Ks("canvas")),zi.width=e.width,zi.height=e.height;let n=zi.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=zi}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Ks("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let o=0;o<r.length;o++)r[o]=rs(r[o]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(rs(t[n]/255)*255):t[n]=rs(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Dp=0,fs=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Dp++}),this.uuid=cn(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let o=0,a=i.length;o<a;o++)i[o].isDataTexture?r.push(ga(i[o].image)):r.push(ga(i[o]))}else r=ga(i);n.url=r}return t||(e.images[this.uuid]=n),n}};function ga(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?Dc.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Np=0,bt=class s extends In{constructor(e=s.DEFAULT_IMAGE,t=s.DEFAULT_MAPPING,n=Mn,i=Mn,r=Rt,o=Xt,a=Ot,c=Hn,l=s.DEFAULT_ANISOTROPY,h=Rn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Np++}),this.uuid=cn(),this.name="",this.source=new fs(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new ie(0,0),this.repeat=new ie(1,1),this.center=new ie(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Le,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==ld)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Sn:e.x=e.x-Math.floor(e.x);break;case Mn:e.x=e.x<0?0:1;break;case Ri:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Sn:e.y=e.y-Math.floor(e.y);break;case Mn:e.y=e.y<0?0:1;break;case Ri:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};bt.DEFAULT_IMAGE=null;bt.DEFAULT_MAPPING=ld;bt.DEFAULT_ANISOTROPY=1;var je=class s{constructor(e=0,t=0,n=0,i=1){s.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*i+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*i+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*i+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*i+o[15]*r,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,r,c=e.elements,l=c[0],h=c[4],u=c[8],d=c[1],f=c[5],m=c[9],_=c[2],p=c[6],g=c[10];if(Math.abs(h-d)<.01&&Math.abs(u-_)<.01&&Math.abs(m-p)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+_)<.1&&Math.abs(m+p)<.1&&Math.abs(l+f+g-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let x=(l+1)/2,y=(f+1)/2,A=(g+1)/2,w=(h+d)/4,R=(u+_)/4,I=(m+p)/4;return x>y&&x>A?x<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(x),i=w/n,r=R/n):y>A?y<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(y),n=w/i,r=I/i):A<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(A),n=R/r,i=I/r),this.set(n,i,r,t),this}let M=Math.sqrt((p-m)*(p-m)+(u-_)*(u-_)+(d-h)*(d-h));return Math.abs(M)<.001&&(M=1),this.x=(p-m)/M,this.y=(u-_)/M,this.z=(d-h)/M,this.w=Math.acos((l+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Nc=class extends In{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new je(0,0,e,t),this.scissorTest=!1,this.viewport=new je(0,0,e,t);let i={width:e,height:t,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Rt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let r=new bt(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)this.textures[i].image.width=e,this.textures[i].image.height=t,this.textures[i].image.depth=n;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let n=0,i=e.textures.length;n<i;n++)this.textures[n]=e.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new fs(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Vn=class extends Nc{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},ho=class extends bt{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=Ct,this.minFilter=Ct,this.wrapR=Mn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Uc=class extends bt{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=Ct,this.minFilter=Ct,this.wrapR=Mn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var lt=class{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,o,a){let c=n[i+0],l=n[i+1],h=n[i+2],u=n[i+3],d=r[o+0],f=r[o+1],m=r[o+2],_=r[o+3];if(a===0){e[t+0]=c,e[t+1]=l,e[t+2]=h,e[t+3]=u;return}if(a===1){e[t+0]=d,e[t+1]=f,e[t+2]=m,e[t+3]=_;return}if(u!==_||c!==d||l!==f||h!==m){let p=1-a,g=c*d+l*f+h*m+u*_,M=g>=0?1:-1,x=1-g*g;if(x>Number.EPSILON){let A=Math.sqrt(x),w=Math.atan2(A,g*M);p=Math.sin(p*w)/A,a=Math.sin(a*w)/A}let y=a*M;if(c=c*p+d*y,l=l*p+f*y,h=h*p+m*y,u=u*p+_*y,p===1-a){let A=1/Math.sqrt(c*c+l*l+h*h+u*u);c*=A,l*=A,h*=A,u*=A}}e[t]=c,e[t+1]=l,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,i,r,o){let a=n[i],c=n[i+1],l=n[i+2],h=n[i+3],u=r[o],d=r[o+1],f=r[o+2],m=r[o+3];return e[t]=a*m+h*u+c*f-l*d,e[t+1]=c*m+h*d+l*u-a*f,e[t+2]=l*m+h*f+a*d-c*u,e[t+3]=h*m-a*u-c*d-l*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,i=e._y,r=e._z,o=e._order,a=Math.cos,c=Math.sin,l=a(n/2),h=a(i/2),u=a(r/2),d=c(n/2),f=c(i/2),m=c(r/2);switch(o){case"XYZ":this._x=d*h*u+l*f*m,this._y=l*f*u-d*h*m,this._z=l*h*m+d*f*u,this._w=l*h*u-d*f*m;break;case"YXZ":this._x=d*h*u+l*f*m,this._y=l*f*u-d*h*m,this._z=l*h*m-d*f*u,this._w=l*h*u+d*f*m;break;case"ZXY":this._x=d*h*u-l*f*m,this._y=l*f*u+d*h*m,this._z=l*h*m+d*f*u,this._w=l*h*u-d*f*m;break;case"ZYX":this._x=d*h*u-l*f*m,this._y=l*f*u+d*h*m,this._z=l*h*m-d*f*u,this._w=l*h*u+d*f*m;break;case"YZX":this._x=d*h*u+l*f*m,this._y=l*f*u+d*h*m,this._z=l*h*m-d*f*u,this._w=l*h*u-d*f*m;break;case"XZY":this._x=d*h*u-l*f*m,this._y=l*f*u-d*h*m,this._z=l*h*m+d*f*u,this._w=l*h*u+d*f*m;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],i=t[4],r=t[8],o=t[1],a=t[5],c=t[9],l=t[2],h=t[6],u=t[10],d=n+a+u;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-c)*f,this._y=(r-l)*f,this._z=(o-i)*f}else if(n>a&&n>u){let f=2*Math.sqrt(1+n-a-u);this._w=(h-c)/f,this._x=.25*f,this._y=(i+o)/f,this._z=(r+l)/f}else if(a>u){let f=2*Math.sqrt(1+a-n-u);this._w=(r-l)/f,this._x=(i+o)/f,this._y=.25*f,this._z=(c+h)/f}else{let f=2*Math.sqrt(1+u-n-a);this._w=(o-i)/f,this._x=(r+l)/f,this._y=(c+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Mt(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,i=e._y,r=e._z,o=e._w,a=t._x,c=t._y,l=t._z,h=t._w;return this._x=n*h+o*a+i*l-r*c,this._y=i*h+o*c+r*a-n*l,this._z=r*h+o*l+n*c-i*a,this._w=o*h-n*a-i*c-r*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,i=this._y,r=this._z,o=this._w,a=o*e._w+n*e._x+i*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=i,this._z=r,this;let c=1-a*a;if(c<=Number.EPSILON){let f=1-t;return this._w=f*o+t*this._w,this._x=f*n+t*this._x,this._y=f*i+t*this._y,this._z=f*r+t*this._z,this.normalize(),this}let l=Math.sqrt(c),h=Math.atan2(l,a),u=Math.sin((1-t)*h)/l,d=Math.sin(t*h)/l;return this._w=o*u+this._w*d,this._x=n*u+this._x*d,this._y=i*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(e),i*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},E=class s{constructor(e=0,t=0,n=0){s.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(nu.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(nu.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*o,this}applyQuaternion(e){let t=this.x,n=this.y,i=this.z,r=e.x,o=e.y,a=e.z,c=e.w,l=2*(o*i-a*n),h=2*(a*t-r*i),u=2*(r*n-o*t);return this.x=t+c*l+o*u-a*h,this.y=n+c*h+a*l-r*u,this.z=i+c*u+r*h-o*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,i=e.y,r=e.z,o=t.x,a=t.y,c=t.z;return this.x=i*c-r*a,this.y=r*o-n*c,this.z=n*a-i*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return _a.copy(this).projectOnVector(e),this.sub(_a)}reflect(e){return this.sub(_a.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Mt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},_a=new E,nu=new lt,Yt=class{constructor(e=new E(1/0,1/0,1/0),t=new E(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(gn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(gn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=gn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,gn):gn.fromBufferAttribute(r,o),gn.applyMatrix4(e.matrixWorld),this.expandByPoint(gn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Sr.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Sr.copy(n.boundingBox)),Sr.applyMatrix4(e.matrixWorld),this.union(Sr)}let i=e.children;for(let r=0,o=i.length;r<o;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,gn),gn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ls),Tr.subVectors(this.max,Ls),ki.subVectors(e.a,Ls),Hi.subVectors(e.b,Ls),Vi.subVectors(e.c,Ls),Zn.subVectors(Hi,ki),Jn.subVectors(Vi,Hi),_i.subVectors(ki,Vi);let t=[0,-Zn.z,Zn.y,0,-Jn.z,Jn.y,0,-_i.z,_i.y,Zn.z,0,-Zn.x,Jn.z,0,-Jn.x,_i.z,0,-_i.x,-Zn.y,Zn.x,0,-Jn.y,Jn.x,0,-_i.y,_i.x,0];return!ya(t,ki,Hi,Vi,Tr)||(t=[1,0,0,0,1,0,0,0,1],!ya(t,ki,Hi,Vi,Tr))?!1:(wr.crossVectors(Zn,Jn),t=[wr.x,wr.y,wr.z],ya(t,ki,Hi,Vi,Tr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,gn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(gn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Dn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Dn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Dn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Dn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Dn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Dn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Dn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Dn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Dn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},Dn=[new E,new E,new E,new E,new E,new E,new E,new E],gn=new E,Sr=new Yt,ki=new E,Hi=new E,Vi=new E,Zn=new E,Jn=new E,_i=new E,Ls=new E,Tr=new E,wr=new E,yi=new E;function ya(s,e,t,n,i){for(let r=0,o=s.length-3;r<=o;r+=3){yi.fromArray(s,r);let a=i.x*Math.abs(yi.x)+i.y*Math.abs(yi.y)+i.z*Math.abs(yi.z),c=e.dot(yi),l=t.dot(yi),h=n.dot(yi);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>a)return!1}return!0}var Up=new Yt,Ds=new E,xa=new E,en=class{constructor(e=new E,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):Up.setFromPoints(e).getCenter(n);let i=0;for(let r=0,o=e.length;r<o;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Ds.subVectors(e,this.center);let t=Ds.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(Ds,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(xa.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Ds.copy(e.center).add(xa)),this.expandByPoint(Ds.copy(e.center).sub(xa))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},Nn=new E,va=new E,Er=new E,jn=new E,Ma=new E,Ar=new E,ba=new E,ai=class{constructor(e=new E,t=new E(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Nn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Nn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Nn.copy(this.origin).addScaledVector(this.direction,t),Nn.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){va.copy(e).add(t).multiplyScalar(.5),Er.copy(t).sub(e).normalize(),jn.copy(this.origin).sub(va);let r=e.distanceTo(t)*.5,o=-this.direction.dot(Er),a=jn.dot(this.direction),c=-jn.dot(Er),l=jn.lengthSq(),h=Math.abs(1-o*o),u,d,f,m;if(h>0)if(u=o*c-a,d=o*a-c,m=r*h,u>=0)if(d>=-m)if(d<=m){let _=1/h;u*=_,d*=_,f=u*(u+o*d+2*a)+d*(o*u+d+2*c)+l}else d=r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*c)+l;else d=-r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*c)+l;else d<=-m?(u=Math.max(0,-(-o*r+a)),d=u>0?-r:Math.min(Math.max(-r,-c),r),f=-u*u+d*(d+2*c)+l):d<=m?(u=0,d=Math.min(Math.max(-r,-c),r),f=d*(d+2*c)+l):(u=Math.max(0,-(o*r+a)),d=u>0?r:Math.min(Math.max(-r,-c),r),f=-u*u+d*(d+2*c)+l);else d=o>0?-r:r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(va).addScaledVector(Er,d),f}intersectSphere(e,t){Nn.subVectors(e.center,this.origin);let n=Nn.dot(this.direction),i=Nn.dot(Nn)-n*n,r=e.radius*e.radius;if(i>r)return null;let o=Math.sqrt(r-i),a=n-o,c=n+o;return c<0?null:a<0?this.at(c,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,r,o,a,c,l=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return l>=0?(n=(e.min.x-d.x)*l,i=(e.max.x-d.x)*l):(n=(e.max.x-d.x)*l,i=(e.min.x-d.x)*l),h>=0?(r=(e.min.y-d.y)*h,o=(e.max.y-d.y)*h):(r=(e.max.y-d.y)*h,o=(e.min.y-d.y)*h),n>o||r>i||((r>n||isNaN(n))&&(n=r),(o<i||isNaN(i))&&(i=o),u>=0?(a=(e.min.z-d.z)*u,c=(e.max.z-d.z)*u):(a=(e.max.z-d.z)*u,c=(e.min.z-d.z)*u),n>c||a>i)||((a>n||n!==n)&&(n=a),(c<i||i!==i)&&(i=c),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,Nn)!==null}intersectTriangle(e,t,n,i,r){Ma.subVectors(t,e),Ar.subVectors(n,e),ba.crossVectors(Ma,Ar);let o=this.direction.dot(ba),a;if(o>0){if(i)return null;a=1}else if(o<0)a=-1,o=-o;else return null;jn.subVectors(this.origin,e);let c=a*this.direction.dot(Ar.crossVectors(jn,Ar));if(c<0)return null;let l=a*this.direction.dot(Ma.cross(jn));if(l<0||c+l>o)return null;let h=-a*jn.dot(ba);return h<0?null:this.at(h/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Te=class s{constructor(e,t,n,i,r,o,a,c,l,h,u,d,f,m,_,p){s.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,o,a,c,l,h,u,d,f,m,_,p)}set(e,t,n,i,r,o,a,c,l,h,u,d,f,m,_,p){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=i,g[1]=r,g[5]=o,g[9]=a,g[13]=c,g[2]=l,g[6]=h,g[10]=u,g[14]=d,g[3]=f,g[7]=m,g[11]=_,g[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new s().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,i=1/Gi.setFromMatrixColumn(e,0).length(),r=1/Gi.setFromMatrixColumn(e,1).length(),o=1/Gi.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,i=e.y,r=e.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(i),l=Math.sin(i),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let d=o*h,f=o*u,m=a*h,_=a*u;t[0]=c*h,t[4]=-c*u,t[8]=l,t[1]=f+m*l,t[5]=d-_*l,t[9]=-a*c,t[2]=_-d*l,t[6]=m+f*l,t[10]=o*c}else if(e.order==="YXZ"){let d=c*h,f=c*u,m=l*h,_=l*u;t[0]=d+_*a,t[4]=m*a-f,t[8]=o*l,t[1]=o*u,t[5]=o*h,t[9]=-a,t[2]=f*a-m,t[6]=_+d*a,t[10]=o*c}else if(e.order==="ZXY"){let d=c*h,f=c*u,m=l*h,_=l*u;t[0]=d-_*a,t[4]=-o*u,t[8]=m+f*a,t[1]=f+m*a,t[5]=o*h,t[9]=_-d*a,t[2]=-o*l,t[6]=a,t[10]=o*c}else if(e.order==="ZYX"){let d=o*h,f=o*u,m=a*h,_=a*u;t[0]=c*h,t[4]=m*l-f,t[8]=d*l+_,t[1]=c*u,t[5]=_*l+d,t[9]=f*l-m,t[2]=-l,t[6]=a*c,t[10]=o*c}else if(e.order==="YZX"){let d=o*c,f=o*l,m=a*c,_=a*l;t[0]=c*h,t[4]=_-d*u,t[8]=m*u+f,t[1]=u,t[5]=o*h,t[9]=-a*h,t[2]=-l*h,t[6]=f*u+m,t[10]=d-_*u}else if(e.order==="XZY"){let d=o*c,f=o*l,m=a*c,_=a*l;t[0]=c*h,t[4]=-u,t[8]=l*h,t[1]=d*u+_,t[5]=o*h,t[9]=f*u-m,t[2]=m*u-f,t[6]=a*h,t[10]=_*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Op,e,Fp)}lookAt(e,t,n){let i=this.elements;return $t.subVectors(e,t),$t.lengthSq()===0&&($t.z=1),$t.normalize(),$n.crossVectors(n,$t),$n.lengthSq()===0&&(Math.abs(n.z)===1?$t.x+=1e-4:$t.z+=1e-4,$t.normalize(),$n.crossVectors(n,$t)),$n.normalize(),Rr.crossVectors($t,$n),i[0]=$n.x,i[4]=Rr.x,i[8]=$t.x,i[1]=$n.y,i[5]=Rr.y,i[9]=$t.y,i[2]=$n.z,i[6]=Rr.z,i[10]=$t.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],h=n[1],u=n[5],d=n[9],f=n[13],m=n[2],_=n[6],p=n[10],g=n[14],M=n[3],x=n[7],y=n[11],A=n[15],w=i[0],R=i[4],I=i[8],N=i[12],v=i[1],S=i[5],F=i[9],B=i[13],G=i[2],Y=i[6],P=i[10],j=i[14],k=i[3],J=i[7],ee=i[11],re=i[15];return r[0]=o*w+a*v+c*G+l*k,r[4]=o*R+a*S+c*Y+l*J,r[8]=o*I+a*F+c*P+l*ee,r[12]=o*N+a*B+c*j+l*re,r[1]=h*w+u*v+d*G+f*k,r[5]=h*R+u*S+d*Y+f*J,r[9]=h*I+u*F+d*P+f*ee,r[13]=h*N+u*B+d*j+f*re,r[2]=m*w+_*v+p*G+g*k,r[6]=m*R+_*S+p*Y+g*J,r[10]=m*I+_*F+p*P+g*ee,r[14]=m*N+_*B+p*j+g*re,r[3]=M*w+x*v+y*G+A*k,r[7]=M*R+x*S+y*Y+A*J,r[11]=M*I+x*F+y*P+A*ee,r[15]=M*N+x*B+y*j+A*re,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],o=e[1],a=e[5],c=e[9],l=e[13],h=e[2],u=e[6],d=e[10],f=e[14],m=e[3],_=e[7],p=e[11],g=e[15];return m*(+r*c*u-i*l*u-r*a*d+n*l*d+i*a*f-n*c*f)+_*(+t*c*f-t*l*d+r*o*d-i*o*f+i*l*h-r*c*h)+p*(+t*l*u-t*a*f-r*o*u+n*o*f+r*a*h-n*l*h)+g*(-i*a*h-t*c*u+t*a*d+i*o*u-n*o*d+n*c*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],h=e[8],u=e[9],d=e[10],f=e[11],m=e[12],_=e[13],p=e[14],g=e[15],M=u*p*l-_*d*l+_*c*f-a*p*f-u*c*g+a*d*g,x=m*d*l-h*p*l-m*c*f+o*p*f+h*c*g-o*d*g,y=h*_*l-m*u*l+m*a*f-o*_*f-h*a*g+o*u*g,A=m*u*c-h*_*c-m*a*d+o*_*d+h*a*p-o*u*p,w=t*M+n*x+i*y+r*A;if(w===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let R=1/w;return e[0]=M*R,e[1]=(_*d*r-u*p*r-_*i*f+n*p*f+u*i*g-n*d*g)*R,e[2]=(a*p*r-_*c*r+_*i*l-n*p*l-a*i*g+n*c*g)*R,e[3]=(u*c*r-a*d*r-u*i*l+n*d*l+a*i*f-n*c*f)*R,e[4]=x*R,e[5]=(h*p*r-m*d*r+m*i*f-t*p*f-h*i*g+t*d*g)*R,e[6]=(m*c*r-o*p*r-m*i*l+t*p*l+o*i*g-t*c*g)*R,e[7]=(o*d*r-h*c*r+h*i*l-t*d*l-o*i*f+t*c*f)*R,e[8]=y*R,e[9]=(m*u*r-h*_*r-m*n*f+t*_*f+h*n*g-t*u*g)*R,e[10]=(o*_*r-m*a*r+m*n*l-t*_*l-o*n*g+t*a*g)*R,e[11]=(h*a*r-o*u*r-h*n*l+t*u*l+o*n*f-t*a*f)*R,e[12]=A*R,e[13]=(h*_*i-m*u*i+m*n*d-t*_*d-h*n*p+t*u*p)*R,e[14]=(m*a*i-o*_*i-m*n*c+t*_*c+o*n*p-t*a*p)*R,e[15]=(o*u*i-h*a*i+h*n*c-t*u*c-o*n*d+t*a*d)*R,this}scale(e){let t=this.elements,n=e.x,i=e.y,r=e.z;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),i=Math.sin(t),r=1-n,o=e.x,a=e.y,c=e.z,l=r*o,h=r*a;return this.set(l*o+n,l*a-i*c,l*c+i*a,0,l*a+i*c,h*a+n,h*c-i*o,0,l*c-i*a,h*c+i*o,r*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,o){return this.set(1,n,r,0,e,1,o,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){let i=this.elements,r=t._x,o=t._y,a=t._z,c=t._w,l=r+r,h=o+o,u=a+a,d=r*l,f=r*h,m=r*u,_=o*h,p=o*u,g=a*u,M=c*l,x=c*h,y=c*u,A=n.x,w=n.y,R=n.z;return i[0]=(1-(_+g))*A,i[1]=(f+y)*A,i[2]=(m-x)*A,i[3]=0,i[4]=(f-y)*w,i[5]=(1-(d+g))*w,i[6]=(p+M)*w,i[7]=0,i[8]=(m+x)*R,i[9]=(p-M)*R,i[10]=(1-(d+_))*R,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){let i=this.elements,r=Gi.set(i[0],i[1],i[2]).length(),o=Gi.set(i[4],i[5],i[6]).length(),a=Gi.set(i[8],i[9],i[10]).length();this.determinant()<0&&(r=-r),e.x=i[12],e.y=i[13],e.z=i[14],_n.copy(this);let l=1/r,h=1/o,u=1/a;return _n.elements[0]*=l,_n.elements[1]*=l,_n.elements[2]*=l,_n.elements[4]*=h,_n.elements[5]*=h,_n.elements[6]*=h,_n.elements[8]*=u,_n.elements[9]*=u,_n.elements[10]*=u,t.setFromRotationMatrix(_n),n.x=r,n.y=o,n.z=a,this}makePerspective(e,t,n,i,r,o,a=kn){let c=this.elements,l=2*r/(t-e),h=2*r/(n-i),u=(t+e)/(t-e),d=(n+i)/(n-i),f,m;if(a===kn)f=-(o+r)/(o-r),m=-2*o*r/(o-r);else if(a===lo)f=-o/(o-r),m=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=l,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=h,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=f,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,i,r,o,a=kn){let c=this.elements,l=1/(t-e),h=1/(n-i),u=1/(o-r),d=(t+e)*l,f=(n+i)*h,m,_;if(a===kn)m=(o+r)*u,_=-2*u;else if(a===lo)m=r*u,_=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=2*l,c[4]=0,c[8]=0,c[12]=-d,c[1]=0,c[5]=2*h,c[9]=0,c[13]=-f,c[2]=0,c[6]=0,c[10]=_,c[14]=-m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Gi=new E,_n=new Te,Op=new E(0,0,0),Fp=new E(1,1,1),$n=new E,Rr=new E,$t=new E,iu=new Te,su=new lt,ln=class s{constructor(e=0,t=0,n=0,i=s.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let i=e.elements,r=i[0],o=i[4],a=i[8],c=i[1],l=i[5],h=i[9],u=i[2],d=i[6],f=i[10];switch(t){case"XYZ":this._y=Math.asin(Mt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Mt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Mt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Mt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(Mt(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-Mt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return iu.makeRotationFromQuaternion(e),this.setFromRotationMatrix(iu,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return su.setFromEuler(this),this.setFromQuaternion(su,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};ln.DEFAULT_ORDER="XYZ";var uo=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Bp=0,ru=new E,Wi=new lt,Un=new Te,Cr=new E,Ns=new E,zp=new E,kp=new lt,ou=new E(1,0,0),au=new E(0,1,0),cu=new E(0,0,1),lu={type:"added"},Hp={type:"removed"},Xi={type:"childadded",child:null},Sa={type:"childremoved",child:null},ft=class s extends In{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Bp++}),this.uuid=cn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=s.DEFAULT_UP.clone();let e=new E,t=new ln,n=new lt,i=new E(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Te},normalMatrix:{value:new Le}}),this.matrix=new Te,this.matrixWorld=new Te,this.matrixAutoUpdate=s.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=s.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new uo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Wi.setFromAxisAngle(e,t),this.quaternion.multiply(Wi),this}rotateOnWorldAxis(e,t){return Wi.setFromAxisAngle(e,t),this.quaternion.premultiply(Wi),this}rotateX(e){return this.rotateOnAxis(ou,e)}rotateY(e){return this.rotateOnAxis(au,e)}rotateZ(e){return this.rotateOnAxis(cu,e)}translateOnAxis(e,t){return ru.copy(e).applyQuaternion(this.quaternion),this.position.add(ru.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(ou,e)}translateY(e){return this.translateOnAxis(au,e)}translateZ(e){return this.translateOnAxis(cu,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Un.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Cr.copy(e):Cr.set(e,t,n);let i=this.parent;this.updateWorldMatrix(!0,!1),Ns.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Un.lookAt(Ns,Cr,this.up):Un.lookAt(Cr,Ns,this.up),this.quaternion.setFromRotationMatrix(Un),i&&(Un.extractRotation(i.matrixWorld),Wi.setFromRotationMatrix(Un),this.quaternion.premultiply(Wi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(lu),Xi.child=e,this.dispatchEvent(Xi),Xi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Hp),Sa.child=e,this.dispatchEvent(Sa),Sa.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Un.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Un.multiply(e.parent.matrixWorld)),e.applyMatrix4(Un),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(lu),Xi.child=e,this.dispatchEvent(Xi),Xi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){let o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let i=this.children;for(let r=0,o=i.length;r<o;r++)i[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ns,e,zp),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ns,kp,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let i=this.children;for(let r=0,o=i.length;r<o;r++)i[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.visibility=this._visibility,i.active=this._active,i.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.geometryCount=this._geometryCount,i.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(i.boundingSphere={center:i.boundingSphere.center.toArray(),radius:i.boundingSphere.radius}),this.boundingBox!==null&&(i.boundingBox={min:i.boundingBox.min.toArray(),max:i.boundingBox.max.toArray()}));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let c=a.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){let u=c[l];r(e.shapes,u)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(r(e.materials,this.material[c]));i.material=a}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let a=0;a<this.children.length;a++)i.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let a=0;a<this.animations.length;a++){let c=this.animations[a];i.animations.push(r(e.animations,c))}}if(t){let a=o(e.geometries),c=o(e.materials),l=o(e.textures),h=o(e.images),u=o(e.shapes),d=o(e.skeletons),f=o(e.animations),m=o(e.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),m.length>0&&(n.nodes=m)}return n.object=i,n;function o(a){let c=[];for(let l in a){let h=a[l];delete h.metadata,c.push(h)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let i=e.children[n];this.add(i.clone())}return this}};ft.DEFAULT_UP=new E(0,1,0);ft.DEFAULT_MATRIX_AUTO_UPDATE=!0;ft.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var yn=new E,On=new E,Ta=new E,Fn=new E,Yi=new E,qi=new E,hu=new E,wa=new E,Ea=new E,Aa=new E,Ra=new je,Ca=new je,Ia=new je,wi=class s{constructor(e=new E,t=new E,n=new E){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),yn.subVectors(e,t),i.cross(yn);let r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(e,t,n,i,r){yn.subVectors(i,t),On.subVectors(n,t),Ta.subVectors(e,t);let o=yn.dot(yn),a=yn.dot(On),c=yn.dot(Ta),l=On.dot(On),h=On.dot(Ta),u=o*l-a*a;if(u===0)return r.set(0,0,0),null;let d=1/u,f=(l*c-a*h)*d,m=(o*h-a*c)*d;return r.set(1-f-m,m,f)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,Fn)===null?!1:Fn.x>=0&&Fn.y>=0&&Fn.x+Fn.y<=1}static getInterpolation(e,t,n,i,r,o,a,c){return this.getBarycoord(e,t,n,i,Fn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,Fn.x),c.addScaledVector(o,Fn.y),c.addScaledVector(a,Fn.z),c)}static getInterpolatedAttribute(e,t,n,i,r,o){return Ra.setScalar(0),Ca.setScalar(0),Ia.setScalar(0),Ra.fromBufferAttribute(e,t),Ca.fromBufferAttribute(e,n),Ia.fromBufferAttribute(e,i),o.setScalar(0),o.addScaledVector(Ra,r.x),o.addScaledVector(Ca,r.y),o.addScaledVector(Ia,r.z),o}static isFrontFacing(e,t,n,i){return yn.subVectors(n,t),On.subVectors(e,t),yn.cross(On).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return yn.subVectors(this.c,this.b),On.subVectors(this.a,this.b),yn.cross(On).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return s.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return s.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,i,r){return s.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return s.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return s.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,i=this.b,r=this.c,o,a;Yi.subVectors(i,n),qi.subVectors(r,n),wa.subVectors(e,n);let c=Yi.dot(wa),l=qi.dot(wa);if(c<=0&&l<=0)return t.copy(n);Ea.subVectors(e,i);let h=Yi.dot(Ea),u=qi.dot(Ea);if(h>=0&&u<=h)return t.copy(i);let d=c*u-h*l;if(d<=0&&c>=0&&h<=0)return o=c/(c-h),t.copy(n).addScaledVector(Yi,o);Aa.subVectors(e,r);let f=Yi.dot(Aa),m=qi.dot(Aa);if(m>=0&&f<=m)return t.copy(r);let _=f*l-c*m;if(_<=0&&l>=0&&m<=0)return a=l/(l-m),t.copy(n).addScaledVector(qi,a);let p=h*m-f*u;if(p<=0&&u-h>=0&&f-m>=0)return hu.subVectors(r,i),a=(u-h)/(u-h+(f-m)),t.copy(i).addScaledVector(hu,a);let g=1/(p+_+d);return o=_*g,a=d*g,t.copy(n).addScaledVector(Yi,o).addScaledVector(qi,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Sd={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Qn={h:0,s:0,l:0},Ir={h:0,s:0,l:0};function Pa(s,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?s+(e-s)*6*t:t<1/2?e:t<2/3?s+(e-s)*6*(2/3-t):s}var be=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=mt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ye.toWorkingColorSpace(this,t),this}setRGB(e,t,n,i=Ye.workingColorSpace){return this.r=e,this.g=t,this.b=n,Ye.toWorkingColorSpace(this,i),this}setHSL(e,t,n,i=Ye.workingColorSpace){if(e=Al(e,1),t=Mt(t,0,1),n=Mt(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=Pa(o,r,e+1/3),this.g=Pa(o,r,e),this.b=Pa(o,r,e-1/3)}return Ye.toWorkingColorSpace(this,i),this}setStyle(e,t=mt){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=i[1],a=i[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=i[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=mt){let n=Sd[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=rs(e.r),this.g=rs(e.g),this.b=rs(e.b),this}copyLinearToSRGB(e){return this.r=ma(e.r),this.g=ma(e.g),this.b=ma(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=mt){return Ye.fromWorkingColorSpace(Ut.copy(this),e),Math.round(Mt(Ut.r*255,0,255))*65536+Math.round(Mt(Ut.g*255,0,255))*256+Math.round(Mt(Ut.b*255,0,255))}getHexString(e=mt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ye.workingColorSpace){Ye.fromWorkingColorSpace(Ut.copy(this),t);let n=Ut.r,i=Ut.g,r=Ut.b,o=Math.max(n,i,r),a=Math.min(n,i,r),c,l,h=(a+o)/2;if(a===o)c=0,l=0;else{let u=o-a;switch(l=h<=.5?u/(o+a):u/(2-o-a),o){case n:c=(i-r)/u+(i<r?6:0);break;case i:c=(r-n)/u+2;break;case r:c=(n-i)/u+4;break}c/=6}return e.h=c,e.s=l,e.l=h,e}getRGB(e,t=Ye.workingColorSpace){return Ye.fromWorkingColorSpace(Ut.copy(this),t),e.r=Ut.r,e.g=Ut.g,e.b=Ut.b,e}getStyle(e=mt){Ye.fromWorkingColorSpace(Ut.copy(this),e);let t=Ut.r,n=Ut.g,i=Ut.b;return e!==mt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(e,t,n){return this.getHSL(Qn),this.setHSL(Qn.h+e,Qn.s+t,Qn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Qn),e.getHSL(Ir);let n=Vs(Qn.h,Ir.h,t),i=Vs(Qn.s,Ir.s,t),r=Vs(Qn.l,Ir.l,t);return this.setHSL(n,i,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,i=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*i,this.g=r[1]*t+r[4]*n+r[7]*i,this.b=r[2]*t+r[5]*n+r[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ut=new be;be.NAMES=Sd;var Vp=0,tn=class extends In{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Vp++}),this.uuid=cn(),this.name="",this.type="Material",this.blending=is,this.side=Cn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Za,this.blendDst=Ja,this.blendEquation=Ti,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new be(0,0,0),this.blendAlpha=0,this.depthFunc=as,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Jh,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Bi,this.stencilZFail=Bi,this.stencilZPass=Bi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==is&&(n.blending=this.blending),this.side!==Cn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Za&&(n.blendSrc=this.blendSrc),this.blendDst!==Ja&&(n.blendDst=this.blendDst),this.blendEquation!==Ti&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==as&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Jh&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Bi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Bi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Bi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){let o=[];for(let a in r){let c=r[a];delete c.metadata,o.push(c)}return o}if(t){let r=i(e.textures),o=i(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let i=t.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},qt=class extends tn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new be(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ln,this.combine=cd,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var xt=new E,Pr=new ie,ke=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Lc,this.updateRanges=[],this.gpuType=bn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Pr.fromBufferAttribute(this,t),Pr.applyMatrix3(e),this.setXY(t,Pr.x,Pr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)xt.fromBufferAttribute(this,t),xt.applyMatrix3(e),this.setXYZ(t,xt.x,xt.y,xt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)xt.fromBufferAttribute(this,t),xt.applyMatrix4(e),this.setXYZ(t,xt.x,xt.y,xt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)xt.fromBufferAttribute(this,t),xt.applyNormalMatrix(e),this.setXYZ(t,xt.x,xt.y,xt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)xt.fromBufferAttribute(this,t),xt.transformDirection(e),this.setXYZ(t,xt.x,xt.y,xt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=vn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=tt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=vn(t,this.array)),t}setX(e,t){return this.normalized&&(t=tt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=vn(t,this.array)),t}setY(e,t){return this.normalized&&(t=tt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=vn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=tt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=vn(t,this.array)),t}setW(e,t){return this.normalized&&(t=tt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=tt(t,this.array),n=tt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=tt(t,this.array),n=tt(n,this.array),i=tt(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e*=this.itemSize,this.normalized&&(t=tt(t,this.array),n=tt(n,this.array),i=tt(i,this.array),r=tt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Lc&&(e.usage=this.usage),e}};var fo=class extends ke{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var po=class extends ke{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var Oe=class extends ke{constructor(e,t,n){super(new Float32Array(e),t,n)}},Gp=0,an=new Te,La=new ft,Ki=new E,Qt=new Yt,Us=new Yt,At=new E,ht=class s extends In{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Gp++}),this.uuid=cn(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(bd(e)?po:fo)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Le().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return an.makeRotationFromQuaternion(e),this.applyMatrix4(an),this}rotateX(e){return an.makeRotationX(e),this.applyMatrix4(an),this}rotateY(e){return an.makeRotationY(e),this.applyMatrix4(an),this}rotateZ(e){return an.makeRotationZ(e),this.applyMatrix4(an),this}translate(e,t,n){return an.makeTranslation(e,t,n),this.applyMatrix4(an),this}scale(e,t,n){return an.makeScale(e,t,n),this.applyMatrix4(an),this}lookAt(e){return La.lookAt(e),La.updateMatrix(),this.applyMatrix4(La.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ki).negate(),this.translate(Ki.x,Ki.y,Ki.z),this}setFromPoints(e){let t=[];for(let n=0,i=e.length;n<i;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new Oe(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Yt);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new E(-1/0,-1/0,-1/0),new E(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){let r=t[n];Qt.setFromBufferAttribute(r),this.morphTargetsRelative?(At.addVectors(this.boundingBox.min,Qt.min),this.boundingBox.expandByPoint(At),At.addVectors(this.boundingBox.max,Qt.max),this.boundingBox.expandByPoint(At)):(this.boundingBox.expandByPoint(Qt.min),this.boundingBox.expandByPoint(Qt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new en);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new E,1/0);return}if(e){let n=this.boundingSphere.center;if(Qt.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];Us.setFromBufferAttribute(a),this.morphTargetsRelative?(At.addVectors(Qt.min,Us.min),Qt.expandByPoint(At),At.addVectors(Qt.max,Us.max),Qt.expandByPoint(At)):(Qt.expandByPoint(Us.min),Qt.expandByPoint(Us.max))}Qt.getCenter(n);let i=0;for(let r=0,o=e.count;r<o;r++)At.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(At));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],c=this.morphTargetsRelative;for(let l=0,h=a.count;l<h;l++)At.fromBufferAttribute(a,l),c&&(Ki.fromBufferAttribute(e,l),At.add(Ki)),i=Math.max(i,n.distanceToSquared(At))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,i=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new ke(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),a=[],c=[];for(let I=0;I<n.count;I++)a[I]=new E,c[I]=new E;let l=new E,h=new E,u=new E,d=new ie,f=new ie,m=new ie,_=new E,p=new E;function g(I,N,v){l.fromBufferAttribute(n,I),h.fromBufferAttribute(n,N),u.fromBufferAttribute(n,v),d.fromBufferAttribute(r,I),f.fromBufferAttribute(r,N),m.fromBufferAttribute(r,v),h.sub(l),u.sub(l),f.sub(d),m.sub(d);let S=1/(f.x*m.y-m.x*f.y);isFinite(S)&&(_.copy(h).multiplyScalar(m.y).addScaledVector(u,-f.y).multiplyScalar(S),p.copy(u).multiplyScalar(f.x).addScaledVector(h,-m.x).multiplyScalar(S),a[I].add(_),a[N].add(_),a[v].add(_),c[I].add(p),c[N].add(p),c[v].add(p))}let M=this.groups;M.length===0&&(M=[{start:0,count:e.count}]);for(let I=0,N=M.length;I<N;++I){let v=M[I],S=v.start,F=v.count;for(let B=S,G=S+F;B<G;B+=3)g(e.getX(B+0),e.getX(B+1),e.getX(B+2))}let x=new E,y=new E,A=new E,w=new E;function R(I){A.fromBufferAttribute(i,I),w.copy(A);let N=a[I];x.copy(N),x.sub(A.multiplyScalar(A.dot(N))).normalize(),y.crossVectors(w,N);let S=y.dot(c[I])<0?-1:1;o.setXYZW(I,x.x,x.y,x.z,S)}for(let I=0,N=M.length;I<N;++I){let v=M[I],S=v.start,F=v.count;for(let B=S,G=S+F;B<G;B+=3)R(e.getX(B+0)),R(e.getX(B+1)),R(e.getX(B+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new ke(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);let i=new E,r=new E,o=new E,a=new E,c=new E,l=new E,h=new E,u=new E;if(e)for(let d=0,f=e.count;d<f;d+=3){let m=e.getX(d+0),_=e.getX(d+1),p=e.getX(d+2);i.fromBufferAttribute(t,m),r.fromBufferAttribute(t,_),o.fromBufferAttribute(t,p),h.subVectors(o,r),u.subVectors(i,r),h.cross(u),a.fromBufferAttribute(n,m),c.fromBufferAttribute(n,_),l.fromBufferAttribute(n,p),a.add(h),c.add(h),l.add(h),n.setXYZ(m,a.x,a.y,a.z),n.setXYZ(_,c.x,c.y,c.z),n.setXYZ(p,l.x,l.y,l.z)}else for(let d=0,f=t.count;d<f;d+=3)i.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),h.subVectors(o,r),u.subVectors(i,r),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)At.fromBufferAttribute(e,t),At.normalize(),e.setXYZ(t,At.x,At.y,At.z)}toNonIndexed(){function e(a,c){let l=a.array,h=a.itemSize,u=a.normalized,d=new l.constructor(c.length*h),f=0,m=0;for(let _=0,p=c.length;_<p;_++){a.isInterleavedBufferAttribute?f=c[_]*a.data.stride+a.offset:f=c[_]*h;for(let g=0;g<h;g++)d[m++]=l[f++]}return new ke(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new s,n=this.index.array,i=this.attributes;for(let a in i){let c=i[a],l=e(c,n);t.setAttribute(a,l)}let r=this.morphAttributes;for(let a in r){let c=[],l=r[a];for(let h=0,u=l.length;h<u;h++){let d=l[h],f=e(d,n);c.push(f)}t.morphAttributes[a]=c}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,c=o.length;a<c;a++){let l=o[a];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let c in n){let l=n[c];e.data.attributes[c]=l.toJSON(e.data)}let i={},r=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],h=[];for(let u=0,d=l.length;u<d;u++){let f=l[u];h.push(f.toJSON(e.data))}h.length>0&&(i[c]=h,r=!0)}r&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone(t));let i=e.attributes;for(let l in i){let h=i[l];this.setAttribute(l,h.clone(t))}let r=e.morphAttributes;for(let l in r){let h=[],u=r[l];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(t));this.morphAttributes[l]=h}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let l=0,h=o.length;l<h;l++){let u=o[l];this.addGroup(u.start,u.count,u.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},uu=new Te,xi=new ai,Lr=new en,du=new E,Dr=new E,Nr=new E,Ur=new E,Da=new E,Or=new E,fu=new E,Fr=new E,ye=class extends ft{constructor(e=new ht,t=new qt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){let a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(i,e);let a=this.morphTargetInfluences;if(r&&a){Or.set(0,0,0);for(let c=0,l=r.length;c<l;c++){let h=a[c],u=r[c];h!==0&&(Da.fromBufferAttribute(u,e),o?Or.addScaledVector(Da,h):Or.addScaledVector(Da.sub(t),h))}t.add(Or)}return t}raycast(e,t){let n=this.geometry,i=this.material,r=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Lr.copy(n.boundingSphere),Lr.applyMatrix4(r),xi.copy(e.ray).recast(e.near),!(Lr.containsPoint(xi.origin)===!1&&(xi.intersectSphere(Lr,du)===null||xi.origin.distanceToSquared(du)>(e.far-e.near)**2))&&(uu.copy(r).invert(),xi.copy(e.ray).applyMatrix4(uu),!(n.boundingBox!==null&&xi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,xi)))}_computeIntersections(e,t,n){let i,r=this.geometry,o=this.material,a=r.index,c=r.attributes.position,l=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let m=0,_=d.length;m<_;m++){let p=d[m],g=o[p.materialIndex],M=Math.max(p.start,f.start),x=Math.min(a.count,Math.min(p.start+p.count,f.start+f.count));for(let y=M,A=x;y<A;y+=3){let w=a.getX(y),R=a.getX(y+1),I=a.getX(y+2);i=Br(this,g,e,n,l,h,u,w,R,I),i&&(i.faceIndex=Math.floor(y/3),i.face.materialIndex=p.materialIndex,t.push(i))}}else{let m=Math.max(0,f.start),_=Math.min(a.count,f.start+f.count);for(let p=m,g=_;p<g;p+=3){let M=a.getX(p),x=a.getX(p+1),y=a.getX(p+2);i=Br(this,o,e,n,l,h,u,M,x,y),i&&(i.faceIndex=Math.floor(p/3),t.push(i))}}else if(c!==void 0)if(Array.isArray(o))for(let m=0,_=d.length;m<_;m++){let p=d[m],g=o[p.materialIndex],M=Math.max(p.start,f.start),x=Math.min(c.count,Math.min(p.start+p.count,f.start+f.count));for(let y=M,A=x;y<A;y+=3){let w=y,R=y+1,I=y+2;i=Br(this,g,e,n,l,h,u,w,R,I),i&&(i.faceIndex=Math.floor(y/3),i.face.materialIndex=p.materialIndex,t.push(i))}}else{let m=Math.max(0,f.start),_=Math.min(c.count,f.start+f.count);for(let p=m,g=_;p<g;p+=3){let M=p,x=p+1,y=p+2;i=Br(this,o,e,n,l,h,u,M,x,y),i&&(i.faceIndex=Math.floor(p/3),t.push(i))}}}};function Wp(s,e,t,n,i,r,o,a){let c;if(e.side===Ft?c=n.intersectTriangle(o,r,i,!0,a):c=n.intersectTriangle(i,r,o,e.side===Cn,a),c===null)return null;Fr.copy(a),Fr.applyMatrix4(s.matrixWorld);let l=t.ray.origin.distanceTo(Fr);return l<t.near||l>t.far?null:{distance:l,point:Fr.clone(),object:s}}function Br(s,e,t,n,i,r,o,a,c,l){s.getVertexPosition(a,Dr),s.getVertexPosition(c,Nr),s.getVertexPosition(l,Ur);let h=Wp(s,e,t,n,Dr,Nr,Ur,fu);if(h){let u=new E;wi.getBarycoord(fu,Dr,Nr,Ur,u),i&&(h.uv=wi.getInterpolatedAttribute(i,a,c,l,u,new ie)),r&&(h.uv1=wi.getInterpolatedAttribute(r,a,c,l,u,new ie)),o&&(h.normal=wi.getInterpolatedAttribute(o,a,c,l,u,new E),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let d={a,b:c,c:l,normal:new E,materialIndex:0};wi.getNormal(Dr,Nr,Ur,d.normal),h.face=d,h.barycoord=u}return h}var Ht=class s extends ht{constructor(e=1,t=1,n=1,i=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:o};let a=this;i=Math.floor(i),r=Math.floor(r),o=Math.floor(o);let c=[],l=[],h=[],u=[],d=0,f=0;m("z","y","x",-1,-1,n,t,e,o,r,0),m("z","y","x",1,-1,n,t,-e,o,r,1),m("x","z","y",1,1,e,n,t,i,o,2),m("x","z","y",1,-1,e,n,-t,i,o,3),m("x","y","z",1,-1,e,t,n,i,r,4),m("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(c),this.setAttribute("position",new Oe(l,3)),this.setAttribute("normal",new Oe(h,3)),this.setAttribute("uv",new Oe(u,2));function m(_,p,g,M,x,y,A,w,R,I,N){let v=y/R,S=A/I,F=y/2,B=A/2,G=w/2,Y=R+1,P=I+1,j=0,k=0,J=new E;for(let ee=0;ee<P;ee++){let re=ee*S-B;for(let Ae=0;Ae<Y;Ae++){let De=Ae*v-F;J[_]=De*M,J[p]=re*x,J[g]=G,l.push(J.x,J.y,J.z),J[_]=0,J[p]=0,J[g]=w>0?1:-1,h.push(J.x,J.y,J.z),u.push(Ae/R),u.push(1-ee/I),j+=1}}for(let ee=0;ee<I;ee++)for(let re=0;re<R;re++){let Ae=d+re+Y*ee,De=d+re+Y*(ee+1),X=d+(re+1)+Y*(ee+1),Q=d+(re+1)+Y*ee;c.push(Ae,De,Q),c.push(De,X,Q),k+=6}a.addGroup(f,k,N),f+=k,d+=j}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function ps(s){let e={};for(let t in s){e[t]={};for(let n in s[t]){let i=s[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function zt(s){let e={};for(let t=0;t<s.length;t++){let n=ps(s[t]);for(let i in n)e[i]=n[i]}return e}function Xp(s){let e=[];for(let t=0;t<s.length;t++)e.push(s[t].clone());return e}function Td(s){let e=s.getRenderTarget();return e===null?s.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ye.workingColorSpace}var Yp={clone:ps,merge:zt},qp=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Kp=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,hn=class extends tn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=qp,this.fragmentShader=Kp,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=ps(e.uniforms),this.uniformsGroups=Xp(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let i in this.uniforms){let o=this.uniforms[i].value;o&&o.isTexture?t.uniforms[i]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[i]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[i]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[i]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[i]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[i]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[i]={type:"m4",value:o.toArray()}:t.uniforms[i]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},mo=class extends ft{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Te,this.projectionMatrix=new Te,this.projectionMatrixInverse=new Te,this.coordinateSystem=kn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},ei=new E,pu=new ie,mu=new ie,_t=class extends mo{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=ds*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Hs*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ds*2*Math.atan(Math.tan(Hs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){ei.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ei.x,ei.y).multiplyScalar(-e/ei.z),ei.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ei.x,ei.y).multiplyScalar(-e/ei.z)}getViewSize(e,t){return this.getViewBounds(e,pu,mu),t.subVectors(mu,pu)}setViewOffset(e,t,n,i,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Hs*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-.5*i,o=this.view;if(this.view!==null&&this.view.enabled){let c=o.fullWidth,l=o.fullHeight;r+=o.offsetX*i/c,t-=o.offsetY*n/l,i*=o.width/c,n*=o.height/l}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Zi=-90,Ji=1,Oc=class extends ft{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let i=new _t(Zi,Ji,e,t);i.layers=this.layers,this.add(i);let r=new _t(Zi,Ji,e,t);r.layers=this.layers,this.add(r);let o=new _t(Zi,Ji,e,t);o.layers=this.layers,this.add(o);let a=new _t(Zi,Ji,e,t);a.layers=this.layers,this.add(a);let c=new _t(Zi,Ji,e,t);c.layers=this.layers,this.add(c);let l=new _t(Zi,Ji,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,i,r,o,a,c]=t;for(let l of t)this.remove(l);if(e===kn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===lo)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,c,l,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),m=e.xr.enabled;e.xr.enabled=!1;let _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,i),e.render(t,r),e.setRenderTarget(n,1,i),e.render(t,o),e.setRenderTarget(n,2,i),e.render(t,a),e.setRenderTarget(n,3,i),e.render(t,c),e.setRenderTarget(n,4,i),e.render(t,l),n.texture.generateMipmaps=_,e.setRenderTarget(n,5,i),e.render(t,h),e.setRenderTarget(u,d,f),e.xr.enabled=m,n.texture.needsPMREMUpdate=!0}},go=class extends bt{constructor(e,t,n,i,r,o,a,c,l,h){e=e!==void 0?e:[],t=t!==void 0?t:cs,super(e,t,n,i,r,o,a,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Fc=class extends Vn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new go(i,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:Rt}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new Ht(5,5,5),r=new hn({name:"CubemapFromEquirect",uniforms:ps(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ft,blending:ii});r.uniforms.tEquirect.value=t;let o=new ye(i,r),a=t.minFilter;return t.minFilter===Xt&&(t.minFilter=Rt),new Oc(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,n,i){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,i);e.setRenderTarget(r)}},Na=new E,Zp=new E,Jp=new Le,xn=class{constructor(e=new E(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let i=Na.subVectors(n,t).cross(Zp.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(Na),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/i;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Jp.getNormalMatrix(e),i=this.coplanarPoint(Na).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},vi=new en,zr=new E,Zs=class{constructor(e=new xn,t=new xn,n=new xn,i=new xn,r=new xn,o=new xn){this.planes=[e,t,n,i,r,o]}set(e,t,n,i,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(i),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=kn){let n=this.planes,i=e.elements,r=i[0],o=i[1],a=i[2],c=i[3],l=i[4],h=i[5],u=i[6],d=i[7],f=i[8],m=i[9],_=i[10],p=i[11],g=i[12],M=i[13],x=i[14],y=i[15];if(n[0].setComponents(c-r,d-l,p-f,y-g).normalize(),n[1].setComponents(c+r,d+l,p+f,y+g).normalize(),n[2].setComponents(c+o,d+h,p+m,y+M).normalize(),n[3].setComponents(c-o,d-h,p-m,y-M).normalize(),n[4].setComponents(c-a,d-u,p-_,y-x).normalize(),t===kn)n[5].setComponents(c+a,d+u,p+_,y+x).normalize();else if(t===lo)n[5].setComponents(a,u,_,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),vi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),vi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(vi)}intersectsSprite(e){return vi.center.set(0,0,0),vi.radius=.7071067811865476,vi.applyMatrix4(e.matrixWorld),this.intersectsSphere(vi)}intersectsSphere(e){let t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let i=t[n];if(zr.x=i.normal.x>0?e.max.x:e.min.x,zr.y=i.normal.y>0?e.max.y:e.min.y,zr.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(zr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function wd(){let s=null,e=!1,t=null,n=null;function i(r,o){t(r,o),n=s.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&(n=s.requestAnimationFrame(i),e=!0)},stop:function(){s.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){s=r}}}function jp(s){let e=new WeakMap;function t(a,c){let l=a.array,h=a.usage,u=l.byteLength,d=s.createBuffer();s.bindBuffer(c,d),s.bufferData(c,l,h),a.onUploadCallback();let f;if(l instanceof Float32Array)f=s.FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?f=s.HALF_FLOAT:f=s.UNSIGNED_SHORT;else if(l instanceof Int16Array)f=s.SHORT;else if(l instanceof Uint32Array)f=s.UNSIGNED_INT;else if(l instanceof Int32Array)f=s.INT;else if(l instanceof Int8Array)f=s.BYTE;else if(l instanceof Uint8Array)f=s.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)f=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:d,type:f,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:u}}function n(a,c,l){let h=c.array,u=c.updateRanges;if(s.bindBuffer(l,a),u.length===0)s.bufferSubData(l,0,h);else{u.sort((f,m)=>f.start-m.start);let d=0;for(let f=1;f<u.length;f++){let m=u[d],_=u[f];_.start<=m.start+m.count+1?m.count=Math.max(m.count,_.start+_.count-m.start):(++d,u[d]=_)}u.length=d+1;for(let f=0,m=u.length;f<m;f++){let _=u[f];s.bufferSubData(l,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count)}c.clearUpdateRanges()}c.onUploadCallback()}function i(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let c=e.get(a);c&&(s.deleteBuffer(c.buffer),e.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=e.get(a);(!h||h.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let l=e.get(a);if(l===void 0)e.set(a,t(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,a,c),l.version=a.version}}return{get:i,remove:r,update:o}}var ms=class s extends ht{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};let r=e/2,o=t/2,a=Math.floor(n),c=Math.floor(i),l=a+1,h=c+1,u=e/a,d=t/c,f=[],m=[],_=[],p=[];for(let g=0;g<h;g++){let M=g*d-o;for(let x=0;x<l;x++){let y=x*u-r;m.push(y,-M,0),_.push(0,0,1),p.push(x/a),p.push(1-g/c)}}for(let g=0;g<c;g++)for(let M=0;M<a;M++){let x=M+l*g,y=M+l*(g+1),A=M+1+l*(g+1),w=M+1+l*g;f.push(x,y,w),f.push(y,A,w)}this.setIndex(f),this.setAttribute("position",new Oe(m,3)),this.setAttribute("normal",new Oe(_,3)),this.setAttribute("uv",new Oe(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.width,e.height,e.widthSegments,e.heightSegments)}},$p=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Qp=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,em=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,tm=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,nm=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,im=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,sm=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,rm=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,om=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,am=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,cm=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,lm=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,hm=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,um=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,dm=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,fm=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,pm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,mm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,gm=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,_m=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,ym=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,xm=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,vm=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Mm=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,bm=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Sm=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Tm=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,wm=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Em=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Am=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Rm="gl_FragColor = linearToOutputTexel( gl_FragColor );",Cm=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Im=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Pm=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Lm=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Dm=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Nm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Um=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Om=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Fm=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Bm=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,zm=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,km=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Hm=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Vm=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Gm=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Wm=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Xm=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Ym=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,qm=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Km=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Zm=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Jm=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,jm=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,$m=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Qm=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,eg=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,tg=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ng=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ig=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,sg=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,rg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,og=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,ag=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,cg=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,lg=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,hg=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,ug=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,dg=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,fg=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,pg=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,mg=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,gg=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,_g=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,yg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,xg=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,vg=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Mg=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,bg=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Sg=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Tg=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,wg=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Eg=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Ag=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Rg=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Cg=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Ig=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Pg=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Lg=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Dg=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Ng=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Ug=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Og=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Fg=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Bg=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,zg=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,kg=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Hg=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Vg=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Gg=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Wg=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Xg=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Yg=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,qg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Kg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Zg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Jg=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,jg=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,$g=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Qg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,e0=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,t0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,n0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,i0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,s0=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,r0=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,o0=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,a0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,c0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,l0=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,h0=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,u0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,d0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,f0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,p0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,m0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,g0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,y0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,x0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,v0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,M0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,b0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,S0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,T0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,w0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,E0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,A0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,R0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,C0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,I0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Fe={alphahash_fragment:$p,alphahash_pars_fragment:Qp,alphamap_fragment:em,alphamap_pars_fragment:tm,alphatest_fragment:nm,alphatest_pars_fragment:im,aomap_fragment:sm,aomap_pars_fragment:rm,batching_pars_vertex:om,batching_vertex:am,begin_vertex:cm,beginnormal_vertex:lm,bsdfs:hm,iridescence_fragment:um,bumpmap_pars_fragment:dm,clipping_planes_fragment:fm,clipping_planes_pars_fragment:pm,clipping_planes_pars_vertex:mm,clipping_planes_vertex:gm,color_fragment:_m,color_pars_fragment:ym,color_pars_vertex:xm,color_vertex:vm,common:Mm,cube_uv_reflection_fragment:bm,defaultnormal_vertex:Sm,displacementmap_pars_vertex:Tm,displacementmap_vertex:wm,emissivemap_fragment:Em,emissivemap_pars_fragment:Am,colorspace_fragment:Rm,colorspace_pars_fragment:Cm,envmap_fragment:Im,envmap_common_pars_fragment:Pm,envmap_pars_fragment:Lm,envmap_pars_vertex:Dm,envmap_physical_pars_fragment:Wm,envmap_vertex:Nm,fog_vertex:Um,fog_pars_vertex:Om,fog_fragment:Fm,fog_pars_fragment:Bm,gradientmap_pars_fragment:zm,lightmap_pars_fragment:km,lights_lambert_fragment:Hm,lights_lambert_pars_fragment:Vm,lights_pars_begin:Gm,lights_toon_fragment:Xm,lights_toon_pars_fragment:Ym,lights_phong_fragment:qm,lights_phong_pars_fragment:Km,lights_physical_fragment:Zm,lights_physical_pars_fragment:Jm,lights_fragment_begin:jm,lights_fragment_maps:$m,lights_fragment_end:Qm,logdepthbuf_fragment:eg,logdepthbuf_pars_fragment:tg,logdepthbuf_pars_vertex:ng,logdepthbuf_vertex:ig,map_fragment:sg,map_pars_fragment:rg,map_particle_fragment:og,map_particle_pars_fragment:ag,metalnessmap_fragment:cg,metalnessmap_pars_fragment:lg,morphinstance_vertex:hg,morphcolor_vertex:ug,morphnormal_vertex:dg,morphtarget_pars_vertex:fg,morphtarget_vertex:pg,normal_fragment_begin:mg,normal_fragment_maps:gg,normal_pars_fragment:_g,normal_pars_vertex:yg,normal_vertex:xg,normalmap_pars_fragment:vg,clearcoat_normal_fragment_begin:Mg,clearcoat_normal_fragment_maps:bg,clearcoat_pars_fragment:Sg,iridescence_pars_fragment:Tg,opaque_fragment:wg,packing:Eg,premultiplied_alpha_fragment:Ag,project_vertex:Rg,dithering_fragment:Cg,dithering_pars_fragment:Ig,roughnessmap_fragment:Pg,roughnessmap_pars_fragment:Lg,shadowmap_pars_fragment:Dg,shadowmap_pars_vertex:Ng,shadowmap_vertex:Ug,shadowmask_pars_fragment:Og,skinbase_vertex:Fg,skinning_pars_vertex:Bg,skinning_vertex:zg,skinnormal_vertex:kg,specularmap_fragment:Hg,specularmap_pars_fragment:Vg,tonemapping_fragment:Gg,tonemapping_pars_fragment:Wg,transmission_fragment:Xg,transmission_pars_fragment:Yg,uv_pars_fragment:qg,uv_pars_vertex:Kg,uv_vertex:Zg,worldpos_vertex:Jg,background_vert:jg,background_frag:$g,backgroundCube_vert:Qg,backgroundCube_frag:e0,cube_vert:t0,cube_frag:n0,depth_vert:i0,depth_frag:s0,distanceRGBA_vert:r0,distanceRGBA_frag:o0,equirect_vert:a0,equirect_frag:c0,linedashed_vert:l0,linedashed_frag:h0,meshbasic_vert:u0,meshbasic_frag:d0,meshlambert_vert:f0,meshlambert_frag:p0,meshmatcap_vert:m0,meshmatcap_frag:g0,meshnormal_vert:_0,meshnormal_frag:y0,meshphong_vert:x0,meshphong_frag:v0,meshphysical_vert:M0,meshphysical_frag:b0,meshtoon_vert:S0,meshtoon_frag:T0,points_vert:w0,points_frag:E0,shadow_vert:A0,shadow_frag:R0,sprite_vert:C0,sprite_frag:I0},se={common:{diffuse:{value:new be(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Le}},envmap:{envMap:{value:null},envMapRotation:{value:new Le},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Le}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Le}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Le},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Le},normalScale:{value:new ie(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Le},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Le}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Le}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Le}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new be(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new be(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0},uvTransform:{value:new Le}},sprite:{diffuse:{value:new be(16777215)},opacity:{value:1},center:{value:new ie(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}}},An={basic:{uniforms:zt([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.fog]),vertexShader:Fe.meshbasic_vert,fragmentShader:Fe.meshbasic_frag},lambert:{uniforms:zt([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.fog,se.lights,{emissive:{value:new be(0)}}]),vertexShader:Fe.meshlambert_vert,fragmentShader:Fe.meshlambert_frag},phong:{uniforms:zt([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.fog,se.lights,{emissive:{value:new be(0)},specular:{value:new be(1118481)},shininess:{value:30}}]),vertexShader:Fe.meshphong_vert,fragmentShader:Fe.meshphong_frag},standard:{uniforms:zt([se.common,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.roughnessmap,se.metalnessmap,se.fog,se.lights,{emissive:{value:new be(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Fe.meshphysical_vert,fragmentShader:Fe.meshphysical_frag},toon:{uniforms:zt([se.common,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.gradientmap,se.fog,se.lights,{emissive:{value:new be(0)}}]),vertexShader:Fe.meshtoon_vert,fragmentShader:Fe.meshtoon_frag},matcap:{uniforms:zt([se.common,se.bumpmap,se.normalmap,se.displacementmap,se.fog,{matcap:{value:null}}]),vertexShader:Fe.meshmatcap_vert,fragmentShader:Fe.meshmatcap_frag},points:{uniforms:zt([se.points,se.fog]),vertexShader:Fe.points_vert,fragmentShader:Fe.points_frag},dashed:{uniforms:zt([se.common,se.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Fe.linedashed_vert,fragmentShader:Fe.linedashed_frag},depth:{uniforms:zt([se.common,se.displacementmap]),vertexShader:Fe.depth_vert,fragmentShader:Fe.depth_frag},normal:{uniforms:zt([se.common,se.bumpmap,se.normalmap,se.displacementmap,{opacity:{value:1}}]),vertexShader:Fe.meshnormal_vert,fragmentShader:Fe.meshnormal_frag},sprite:{uniforms:zt([se.sprite,se.fog]),vertexShader:Fe.sprite_vert,fragmentShader:Fe.sprite_frag},background:{uniforms:{uvTransform:{value:new Le},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Fe.background_vert,fragmentShader:Fe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Le}},vertexShader:Fe.backgroundCube_vert,fragmentShader:Fe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Fe.cube_vert,fragmentShader:Fe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Fe.equirect_vert,fragmentShader:Fe.equirect_frag},distanceRGBA:{uniforms:zt([se.common,se.displacementmap,{referencePosition:{value:new E},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Fe.distanceRGBA_vert,fragmentShader:Fe.distanceRGBA_frag},shadow:{uniforms:zt([se.lights,se.fog,{color:{value:new be(0)},opacity:{value:1}}]),vertexShader:Fe.shadow_vert,fragmentShader:Fe.shadow_frag}};An.physical={uniforms:zt([An.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Le},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Le},clearcoatNormalScale:{value:new ie(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Le},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Le},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Le},sheen:{value:0},sheenColor:{value:new be(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Le},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Le},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Le},transmissionSamplerSize:{value:new ie},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Le},attenuationDistance:{value:0},attenuationColor:{value:new be(0)},specularColor:{value:new be(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Le},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Le},anisotropyVector:{value:new ie},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Le}}]),vertexShader:Fe.meshphysical_vert,fragmentShader:Fe.meshphysical_frag};var kr={r:0,b:0,g:0},Mi=new ln,P0=new Te;function L0(s,e,t,n,i,r,o){let a=new be(0),c=r===!0?0:1,l,h,u=null,d=0,f=null;function m(M){let x=M.isScene===!0?M.background:null;return x&&x.isTexture&&(x=(M.backgroundBlurriness>0?t:e).get(x)),x}function _(M){let x=!1,y=m(M);y===null?g(a,c):y&&y.isColor&&(g(y,1),x=!0);let A=s.xr.getEnvironmentBlendMode();A==="additive"?n.buffers.color.setClear(0,0,0,1,o):A==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(s.autoClear||x)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil))}function p(M,x){let y=m(x);y&&(y.isCubeTexture||y.mapping===Wo)?(h===void 0&&(h=new ye(new Ht(1,1,1),new hn({name:"BackgroundCubeMaterial",uniforms:ps(An.backgroundCube.uniforms),vertexShader:An.backgroundCube.vertexShader,fragmentShader:An.backgroundCube.fragmentShader,side:Ft,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(A,w,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(h)),Mi.copy(x.backgroundRotation),Mi.x*=-1,Mi.y*=-1,Mi.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(Mi.y*=-1,Mi.z*=-1),h.material.uniforms.envMap.value=y,h.material.uniforms.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=x.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(P0.makeRotationFromEuler(Mi)),h.material.toneMapped=Ye.getTransfer(y.colorSpace)!==ct,(u!==y||d!==y.version||f!==s.toneMapping)&&(h.material.needsUpdate=!0,u=y,d=y.version,f=s.toneMapping),h.layers.enableAll(),M.unshift(h,h.geometry,h.material,0,0,null)):y&&y.isTexture&&(l===void 0&&(l=new ye(new ms(2,2),new hn({name:"BackgroundMaterial",uniforms:ps(An.background.uniforms),vertexShader:An.background.vertexShader,fragmentShader:An.background.fragmentShader,side:Cn,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=y,l.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,l.material.toneMapped=Ye.getTransfer(y.colorSpace)!==ct,y.matrixAutoUpdate===!0&&y.updateMatrix(),l.material.uniforms.uvTransform.value.copy(y.matrix),(u!==y||d!==y.version||f!==s.toneMapping)&&(l.material.needsUpdate=!0,u=y,d=y.version,f=s.toneMapping),l.layers.enableAll(),M.unshift(l,l.geometry,l.material,0,0,null))}function g(M,x){M.getRGB(kr,Td(s)),n.buffers.color.setClear(kr.r,kr.g,kr.b,x,o)}return{getClearColor:function(){return a},setClearColor:function(M,x=1){a.set(M),c=x,g(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(M){c=M,g(a,c)},render:_,addToRenderList:p}}function D0(s,e){let t=s.getParameter(s.MAX_VERTEX_ATTRIBS),n={},i=d(null),r=i,o=!1;function a(v,S,F,B,G){let Y=!1,P=u(B,F,S);r!==P&&(r=P,l(r.object)),Y=f(v,B,F,G),Y&&m(v,B,F,G),G!==null&&e.update(G,s.ELEMENT_ARRAY_BUFFER),(Y||o)&&(o=!1,y(v,S,F,B),G!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,e.get(G).buffer))}function c(){return s.createVertexArray()}function l(v){return s.bindVertexArray(v)}function h(v){return s.deleteVertexArray(v)}function u(v,S,F){let B=F.wireframe===!0,G=n[v.id];G===void 0&&(G={},n[v.id]=G);let Y=G[S.id];Y===void 0&&(Y={},G[S.id]=Y);let P=Y[B];return P===void 0&&(P=d(c()),Y[B]=P),P}function d(v){let S=[],F=[],B=[];for(let G=0;G<t;G++)S[G]=0,F[G]=0,B[G]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:S,enabledAttributes:F,attributeDivisors:B,object:v,attributes:{},index:null}}function f(v,S,F,B){let G=r.attributes,Y=S.attributes,P=0,j=F.getAttributes();for(let k in j)if(j[k].location>=0){let ee=G[k],re=Y[k];if(re===void 0&&(k==="instanceMatrix"&&v.instanceMatrix&&(re=v.instanceMatrix),k==="instanceColor"&&v.instanceColor&&(re=v.instanceColor)),ee===void 0||ee.attribute!==re||re&&ee.data!==re.data)return!0;P++}return r.attributesNum!==P||r.index!==B}function m(v,S,F,B){let G={},Y=S.attributes,P=0,j=F.getAttributes();for(let k in j)if(j[k].location>=0){let ee=Y[k];ee===void 0&&(k==="instanceMatrix"&&v.instanceMatrix&&(ee=v.instanceMatrix),k==="instanceColor"&&v.instanceColor&&(ee=v.instanceColor));let re={};re.attribute=ee,ee&&ee.data&&(re.data=ee.data),G[k]=re,P++}r.attributes=G,r.attributesNum=P,r.index=B}function _(){let v=r.newAttributes;for(let S=0,F=v.length;S<F;S++)v[S]=0}function p(v){g(v,0)}function g(v,S){let F=r.newAttributes,B=r.enabledAttributes,G=r.attributeDivisors;F[v]=1,B[v]===0&&(s.enableVertexAttribArray(v),B[v]=1),G[v]!==S&&(s.vertexAttribDivisor(v,S),G[v]=S)}function M(){let v=r.newAttributes,S=r.enabledAttributes;for(let F=0,B=S.length;F<B;F++)S[F]!==v[F]&&(s.disableVertexAttribArray(F),S[F]=0)}function x(v,S,F,B,G,Y,P){P===!0?s.vertexAttribIPointer(v,S,F,G,Y):s.vertexAttribPointer(v,S,F,B,G,Y)}function y(v,S,F,B){_();let G=B.attributes,Y=F.getAttributes(),P=S.defaultAttributeValues;for(let j in Y){let k=Y[j];if(k.location>=0){let J=G[j];if(J===void 0&&(j==="instanceMatrix"&&v.instanceMatrix&&(J=v.instanceMatrix),j==="instanceColor"&&v.instanceColor&&(J=v.instanceColor)),J!==void 0){let ee=J.normalized,re=J.itemSize,Ae=e.get(J);if(Ae===void 0)continue;let De=Ae.buffer,X=Ae.type,Q=Ae.bytesPerElement,he=X===s.INT||X===s.UNSIGNED_INT||J.gpuType===gl;if(J.isInterleavedBufferAttribute){let le=J.data,Ne=le.stride,we=J.offset;if(le.isInstancedInterleavedBuffer){for(let Ge=0;Ge<k.locationSize;Ge++)g(k.location+Ge,le.meshPerAttribute);v.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=le.meshPerAttribute*le.count)}else for(let Ge=0;Ge<k.locationSize;Ge++)p(k.location+Ge);s.bindBuffer(s.ARRAY_BUFFER,De);for(let Ge=0;Ge<k.locationSize;Ge++)x(k.location+Ge,re/k.locationSize,X,ee,Ne*Q,(we+re/k.locationSize*Ge)*Q,he)}else{if(J.isInstancedBufferAttribute){for(let le=0;le<k.locationSize;le++)g(k.location+le,J.meshPerAttribute);v.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let le=0;le<k.locationSize;le++)p(k.location+le);s.bindBuffer(s.ARRAY_BUFFER,De);for(let le=0;le<k.locationSize;le++)x(k.location+le,re/k.locationSize,X,ee,re*Q,re/k.locationSize*le*Q,he)}}else if(P!==void 0){let ee=P[j];if(ee!==void 0)switch(ee.length){case 2:s.vertexAttrib2fv(k.location,ee);break;case 3:s.vertexAttrib3fv(k.location,ee);break;case 4:s.vertexAttrib4fv(k.location,ee);break;default:s.vertexAttrib1fv(k.location,ee)}}}}M()}function A(){I();for(let v in n){let S=n[v];for(let F in S){let B=S[F];for(let G in B)h(B[G].object),delete B[G];delete S[F]}delete n[v]}}function w(v){if(n[v.id]===void 0)return;let S=n[v.id];for(let F in S){let B=S[F];for(let G in B)h(B[G].object),delete B[G];delete S[F]}delete n[v.id]}function R(v){for(let S in n){let F=n[S];if(F[v.id]===void 0)continue;let B=F[v.id];for(let G in B)h(B[G].object),delete B[G];delete F[v.id]}}function I(){N(),o=!0,r!==i&&(r=i,l(r.object))}function N(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:a,reset:I,resetDefaultState:N,dispose:A,releaseStatesOfGeometry:w,releaseStatesOfProgram:R,initAttributes:_,enableAttribute:p,disableUnusedAttributes:M}}function N0(s,e,t){let n;function i(l){n=l}function r(l,h){s.drawArrays(n,l,h),t.update(h,n,1)}function o(l,h,u){u!==0&&(s.drawArraysInstanced(n,l,h,u),t.update(h,n,u))}function a(l,h,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,h,0,u);let f=0;for(let m=0;m<u;m++)f+=h[m];t.update(f,n,1)}function c(l,h,u,d){if(u===0)return;let f=e.get("WEBGL_multi_draw");if(f===null)for(let m=0;m<l.length;m++)o(l[m],h[m],d[m]);else{f.multiDrawArraysInstancedWEBGL(n,l,0,h,0,d,0,u);let m=0;for(let _=0;_<u;_++)m+=h[_];for(let _=0;_<d.length;_++)t.update(m,n,d[_])}}this.setMode=i,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=c}function U0(s,e,t,n){let i;function r(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){let R=e.get("EXT_texture_filter_anisotropic");i=s.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(R){return!(R!==Ot&&n.convert(R)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(R){let I=R===dr&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(R!==Hn&&n.convert(R)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_TYPE)&&R!==bn&&!I)}function c(R){if(R==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp",h=c(l);h!==l&&(console.warn("THREE.WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);let u=t.logarithmicDepthBuffer===!0,d=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control");if(d===!0){let R=e.get("EXT_clip_control");R.clipControlEXT(R.LOWER_LEFT_EXT,R.ZERO_TO_ONE_EXT)}let f=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),m=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=s.getParameter(s.MAX_TEXTURE_SIZE),p=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),g=s.getParameter(s.MAX_VERTEX_ATTRIBS),M=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),x=s.getParameter(s.MAX_VARYING_VECTORS),y=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),A=m>0,w=s.getParameter(s.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:u,reverseDepthBuffer:d,maxTextures:f,maxVertexTextures:m,maxTextureSize:_,maxCubemapSize:p,maxAttributes:g,maxVertexUniforms:M,maxVaryings:x,maxFragmentUniforms:y,vertexTextures:A,maxSamples:w}}function O0(s){let e=this,t=null,n=0,i=!1,r=!1,o=new xn,a=new Le,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let f=u.length!==0||d||n!==0||i;return i=d,n=u.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){t=h(u,d,0)},this.setState=function(u,d,f){let m=u.clippingPlanes,_=u.clipIntersection,p=u.clipShadows,g=s.get(u);if(!i||m===null||m.length===0||r&&!p)r?h(null):l();else{let M=r?0:n,x=M*4,y=g.clippingState||null;c.value=y,y=h(m,d,x,f);for(let A=0;A!==x;++A)y[A]=t[A];g.clippingState=y,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=M}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(u,d,f,m){let _=u!==null?u.length:0,p=null;if(_!==0){if(p=c.value,m!==!0||p===null){let g=f+_*4,M=d.matrixWorldInverse;a.getNormalMatrix(M),(p===null||p.length<g)&&(p=new Float32Array(g));for(let x=0,y=f;x!==_;++x,y+=4)o.copy(u[x]).applyMatrix4(M,a),o.normal.toArray(p,y),p[y+3]=o.constant}c.value=p,c.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,p}}function F0(s){let e=new WeakMap;function t(o,a){return a===sc?o.mapping=cs:a===rc&&(o.mapping=ls),o}function n(o){if(o&&o.isTexture){let a=o.mapping;if(a===sc||a===rc)if(e.has(o)){let c=e.get(o).texture;return t(c,o.mapping)}else{let c=o.image;if(c&&c.height>0){let l=new Fc(c.height);return l.fromEquirectangularTexture(s,o),e.set(o,l),o.addEventListener("dispose",i),t(l.texture,o.mapping)}else return null}}return o}function i(o){let a=o.target;a.removeEventListener("dispose",i);let c=e.get(a);c!==void 0&&(e.delete(a),c.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}var gs=class extends mo{constructor(e=-1,t=1,n=1,i=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2,r=n-e,o=n+e,a=i+t,c=i-t;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,o=r+l*this.view.width,a-=h*this.view.offsetY,c=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},ts=4,gu=[.125,.215,.35,.446,.526,.582],Ei=20,Ua=new gs,_u=new be,Oa=null,Fa=0,Ba=0,za=!1,Si=(1+Math.sqrt(5))/2,ji=1/Si,yu=[new E(-Si,ji,0),new E(Si,ji,0),new E(-ji,0,Si),new E(ji,0,Si),new E(0,Si,-ji),new E(0,Si,ji),new E(-1,1,-1),new E(1,1,-1),new E(-1,1,1),new E(1,1,1)],_s=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,i=100){Oa=this._renderer.getRenderTarget(),Fa=this._renderer.getActiveCubeFace(),Ba=this._renderer.getActiveMipmapLevel(),za=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,n,i,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Mu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=vu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Oa,Fa,Ba),this._renderer.xr.enabled=za,e.scissorTest=!1,Hr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===cs||e.mapping===ls?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Oa=this._renderer.getRenderTarget(),Fa=this._renderer.getActiveCubeFace(),Ba=this._renderer.getActiveMipmapLevel(),za=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Rt,minFilter:Rt,generateMipmaps:!1,type:dr,format:Ot,colorSpace:Pt,depthBuffer:!1},i=xu(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=xu(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=B0(r)),this._blurMaterial=z0(r,e,t)}return i}_compileMaterial(e){let t=new ye(this._lodPlanes[0],e);this._renderer.compile(t,Ua)}_sceneToCubeUV(e,t,n,i){let a=new _t(90,1,t,n),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,d=h.toneMapping;h.getClearColor(_u),h.toneMapping=si,h.autoClear=!1;let f=new qt({name:"PMREM.Background",side:Ft,depthWrite:!1,depthTest:!1}),m=new ye(new Ht,f),_=!1,p=e.background;p?p.isColor&&(f.color.copy(p),e.background=null,_=!0):(f.color.copy(_u),_=!0);for(let g=0;g<6;g++){let M=g%3;M===0?(a.up.set(0,c[g],0),a.lookAt(l[g],0,0)):M===1?(a.up.set(0,0,c[g]),a.lookAt(0,l[g],0)):(a.up.set(0,c[g],0),a.lookAt(0,0,l[g]));let x=this._cubeSize;Hr(i,M*x,g>2?x:0,x,x),h.setRenderTarget(i),_&&h.render(m,a),h.render(e,a)}m.geometry.dispose(),m.material.dispose(),h.toneMapping=d,h.autoClear=u,e.background=p}_textureToCubeUV(e,t){let n=this._renderer,i=e.mapping===cs||e.mapping===ls;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Mu()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=vu());let r=i?this._cubemapMaterial:this._equirectMaterial,o=new ye(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;let c=this._cubeSize;Hr(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(o,Ua)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let i=this._lodPlanes.length;for(let r=1;r<i;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=yu[(i-r-1)%yu.length];this._blur(e,r-1,r,o,a)}t.autoClear=n}_blur(e,t,n,i,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,i,"latitudinal",r),this._halfBlur(o,e,n,n,i,"longitudinal",r)}_halfBlur(e,t,n,i,r,o,a){let c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new ye(this._lodPlanes[i],l),d=l.uniforms,f=this._sizeLods[n]-1,m=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*Ei-1),_=r/m,p=isFinite(r)?1+Math.floor(h*_):Ei;p>Ei&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${Ei}`);let g=[],M=0;for(let R=0;R<Ei;++R){let I=R/_,N=Math.exp(-I*I/2);g.push(N),R===0?M+=N:R<p&&(M+=2*N)}for(let R=0;R<g.length;R++)g[R]=g[R]/M;d.envMap.value=e.texture,d.samples.value=p,d.weights.value=g,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);let{_lodMax:x}=this;d.dTheta.value=m,d.mipInt.value=x-n;let y=this._sizeLods[i],A=3*y*(i>x-ts?i-x+ts:0),w=4*(this._cubeSize-y);Hr(t,A,w,3*y,2*y),c.setRenderTarget(t),c.render(u,Ua)}};function B0(s){let e=[],t=[],n=[],i=s,r=s-ts+1+gu.length;for(let o=0;o<r;o++){let a=Math.pow(2,i);t.push(a);let c=1/a;o>s-ts?c=gu[o-s+ts-1]:o===0&&(c=0),n.push(c);let l=1/(a-2),h=-l,u=1+l,d=[h,h,u,h,u,u,h,h,u,u,h,u],f=6,m=6,_=3,p=2,g=1,M=new Float32Array(_*m*f),x=new Float32Array(p*m*f),y=new Float32Array(g*m*f);for(let w=0;w<f;w++){let R=w%3*2/3-1,I=w>2?0:-1,N=[R,I,0,R+2/3,I,0,R+2/3,I+1,0,R,I,0,R+2/3,I+1,0,R,I+1,0];M.set(N,_*m*w),x.set(d,p*m*w);let v=[w,w,w,w,w,w];y.set(v,g*m*w)}let A=new ht;A.setAttribute("position",new ke(M,_)),A.setAttribute("uv",new ke(x,p)),A.setAttribute("faceIndex",new ke(y,g)),e.push(A),i>ts&&i--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function xu(s,e,t){let n=new Vn(s,e,t);return n.texture.mapping=Wo,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Hr(s,e,t,n,i){s.viewport.set(e,t,n,i),s.scissor.set(e,t,n,i)}function z0(s,e,t){let n=new Float32Array(Ei),i=new E(0,1,0);return new hn({name:"SphericalGaussianBlur",defines:{n:Ei,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:Rl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:ii,depthTest:!1,depthWrite:!1})}function vu(){return new hn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Rl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:ii,depthTest:!1,depthWrite:!1})}function Mu(){return new hn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Rl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ii,depthTest:!1,depthWrite:!1})}function Rl(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function k0(s){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){let c=a.mapping,l=c===sc||c===rc,h=c===cs||c===ls;if(l||h){let u=e.get(a),d=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return t===null&&(t=new _s(s)),u=l?t.fromEquirectangular(a,u):t.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),u.texture;if(u!==void 0)return u.texture;{let f=a.image;return l&&f&&f.height>0||h&&f&&i(f)?(t===null&&(t=new _s(s)),u=l?t.fromEquirectangular(a):t.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function i(a){let c=0,l=6;for(let h=0;h<l;h++)a[h]!==void 0&&c++;return c===l}function r(a){let c=a.target;c.removeEventListener("dispose",r);let l=e.get(c);l!==void 0&&(e.delete(c),l.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function H0(s){let e={};function t(n){if(e[n]!==void 0)return e[n];let i;switch(n){case"WEBGL_depth_texture":i=s.getExtension("WEBGL_depth_texture")||s.getExtension("MOZ_WEBGL_depth_texture")||s.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=s.getExtension("EXT_texture_filter_anisotropic")||s.getExtension("MOZ_EXT_texture_filter_anisotropic")||s.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=s.getExtension("WEBGL_compressed_texture_s3tc")||s.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=s.getExtension("WEBGL_compressed_texture_pvrtc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=s.getExtension(n)}return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let i=t(n);return i===null&&so("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function V0(s,e,t,n){let i={},r=new WeakMap;function o(u){let d=u.target;d.index!==null&&e.remove(d.index);for(let m in d.attributes)e.remove(d.attributes[m]);for(let m in d.morphAttributes){let _=d.morphAttributes[m];for(let p=0,g=_.length;p<g;p++)e.remove(_[p])}d.removeEventListener("dispose",o),delete i[d.id];let f=r.get(d);f&&(e.remove(f),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function a(u,d){return i[d.id]===!0||(d.addEventListener("dispose",o),i[d.id]=!0,t.memory.geometries++),d}function c(u){let d=u.attributes;for(let m in d)e.update(d[m],s.ARRAY_BUFFER);let f=u.morphAttributes;for(let m in f){let _=f[m];for(let p=0,g=_.length;p<g;p++)e.update(_[p],s.ARRAY_BUFFER)}}function l(u){let d=[],f=u.index,m=u.attributes.position,_=0;if(f!==null){let M=f.array;_=f.version;for(let x=0,y=M.length;x<y;x+=3){let A=M[x+0],w=M[x+1],R=M[x+2];d.push(A,w,w,R,R,A)}}else if(m!==void 0){let M=m.array;_=m.version;for(let x=0,y=M.length/3-1;x<y;x+=3){let A=x+0,w=x+1,R=x+2;d.push(A,w,w,R,R,A)}}else return;let p=new(bd(d)?po:fo)(d,1);p.version=_;let g=r.get(u);g&&e.remove(g),r.set(u,p)}function h(u){let d=r.get(u);if(d){let f=u.index;f!==null&&d.version<f.version&&l(u)}else l(u);return r.get(u)}return{get:a,update:c,getWireframeAttribute:h}}function G0(s,e,t){let n;function i(d){n=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function c(d,f){s.drawElements(n,f,r,d*o),t.update(f,n,1)}function l(d,f,m){m!==0&&(s.drawElementsInstanced(n,f,r,d*o,m),t.update(f,n,m))}function h(d,f,m){if(m===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,d,0,m);let p=0;for(let g=0;g<m;g++)p+=f[g];t.update(p,n,1)}function u(d,f,m,_){if(m===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<d.length;g++)l(d[g]/o,f[g],_[g]);else{p.multiDrawElementsInstancedWEBGL(n,f,0,r,d,0,_,0,m);let g=0;for(let M=0;M<m;M++)g+=f[M];for(let M=0;M<_.length;M++)t.update(g,n,_[M])}}this.setMode=i,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function W0(s){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(t.calls++,o){case s.TRIANGLES:t.triangles+=a*(r/3);break;case s.LINES:t.lines+=a*(r/2);break;case s.LINE_STRIP:t.lines+=a*(r-1);break;case s.LINE_LOOP:t.lines+=a*r;break;case s.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function i(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function X0(s,e,t){let n=new WeakMap,i=new je;function r(o,a,c){let l=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0,d=n.get(a);if(d===void 0||d.count!==u){let N=function(){R.dispose(),n.delete(a),a.removeEventListener("dispose",N)};d!==void 0&&d.texture.dispose();let f=a.morphAttributes.position!==void 0,m=a.morphAttributes.normal!==void 0,_=a.morphAttributes.color!==void 0,p=a.morphAttributes.position||[],g=a.morphAttributes.normal||[],M=a.morphAttributes.color||[],x=0;f===!0&&(x=1),m===!0&&(x=2),_===!0&&(x=3);let y=a.attributes.position.count*x,A=1;y>e.maxTextureSize&&(A=Math.ceil(y/e.maxTextureSize),y=e.maxTextureSize);let w=new Float32Array(y*A*4*u),R=new ho(w,y,A,u);R.type=bn,R.needsUpdate=!0;let I=x*4;for(let v=0;v<u;v++){let S=p[v],F=g[v],B=M[v],G=y*A*4*v;for(let Y=0;Y<S.count;Y++){let P=Y*I;f===!0&&(i.fromBufferAttribute(S,Y),w[G+P+0]=i.x,w[G+P+1]=i.y,w[G+P+2]=i.z,w[G+P+3]=0),m===!0&&(i.fromBufferAttribute(F,Y),w[G+P+4]=i.x,w[G+P+5]=i.y,w[G+P+6]=i.z,w[G+P+7]=0),_===!0&&(i.fromBufferAttribute(B,Y),w[G+P+8]=i.x,w[G+P+9]=i.y,w[G+P+10]=i.z,w[G+P+11]=B.itemSize===4?i.w:1)}}d={count:u,texture:R,size:new ie(y,A)},n.set(a,d),a.addEventListener("dispose",N)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(s,"morphTexture",o.morphTexture,t);else{let f=0;for(let _=0;_<l.length;_++)f+=l[_];let m=a.morphTargetsRelative?1:1-f;c.getUniforms().setValue(s,"morphTargetBaseInfluence",m),c.getUniforms().setValue(s,"morphTargetInfluences",l)}c.getUniforms().setValue(s,"morphTargetsTexture",d.texture,t),c.getUniforms().setValue(s,"morphTargetsTextureSize",d.size)}return{update:r}}function Y0(s,e,t,n){let i=new WeakMap;function r(c){let l=n.render.frame,h=c.geometry,u=e.get(c,h);if(i.get(u)!==l&&(e.update(u),i.set(u,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),i.get(c)!==l&&(t.update(c.instanceMatrix,s.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,s.ARRAY_BUFFER),i.set(c,l))),c.isSkinnedMesh){let d=c.skeleton;i.get(d)!==l&&(d.update(),i.set(d,l))}return u}function o(){i=new WeakMap}function a(c){let l=c.target;l.removeEventListener("dispose",a),t.remove(l.instanceMatrix),l.instanceColor!==null&&t.remove(l.instanceColor)}return{update:r,dispose:o}}var _o=class extends bt{constructor(e,t,n,i,r,o,a,c,l,h=ss){if(h!==ss&&h!==us)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===ss&&(n=Ci),n===void 0&&h===us&&(n=hs),super(null,i,r,o,a,c,h,n,l),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=a!==void 0?a:Ct,this.minFilter=c!==void 0?c:Ct,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Ed=new bt,bu=new _o(1,1),Ad=new ho,Rd=new Uc,Cd=new go,Su=[],Tu=[],wu=new Float32Array(16),Eu=new Float32Array(9),Au=new Float32Array(4);function Es(s,e,t){let n=s[0];if(n<=0||n>0)return s;let i=e*t,r=Su[i];if(r===void 0&&(r=new Float32Array(i),Su[i]=r),e!==0){n.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,s[o].toArray(r,a)}return r}function St(s,e){if(s.length!==e.length)return!1;for(let t=0,n=s.length;t<n;t++)if(s[t]!==e[t])return!1;return!0}function Tt(s,e){for(let t=0,n=e.length;t<n;t++)s[t]=e[t]}function qo(s,e){let t=Tu[e];t===void 0&&(t=new Int32Array(e),Tu[e]=t);for(let n=0;n!==e;++n)t[n]=s.allocateTextureUnit();return t}function q0(s,e){let t=this.cache;t[0]!==e&&(s.uniform1f(this.addr,e),t[0]=e)}function K0(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(St(t,e))return;s.uniform2fv(this.addr,e),Tt(t,e)}}function Z0(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(s.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(St(t,e))return;s.uniform3fv(this.addr,e),Tt(t,e)}}function J0(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(St(t,e))return;s.uniform4fv(this.addr,e),Tt(t,e)}}function j0(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(St(t,e))return;s.uniformMatrix2fv(this.addr,!1,e),Tt(t,e)}else{if(St(t,n))return;Au.set(n),s.uniformMatrix2fv(this.addr,!1,Au),Tt(t,n)}}function $0(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(St(t,e))return;s.uniformMatrix3fv(this.addr,!1,e),Tt(t,e)}else{if(St(t,n))return;Eu.set(n),s.uniformMatrix3fv(this.addr,!1,Eu),Tt(t,n)}}function Q0(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(St(t,e))return;s.uniformMatrix4fv(this.addr,!1,e),Tt(t,e)}else{if(St(t,n))return;wu.set(n),s.uniformMatrix4fv(this.addr,!1,wu),Tt(t,n)}}function e_(s,e){let t=this.cache;t[0]!==e&&(s.uniform1i(this.addr,e),t[0]=e)}function t_(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(St(t,e))return;s.uniform2iv(this.addr,e),Tt(t,e)}}function n_(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(St(t,e))return;s.uniform3iv(this.addr,e),Tt(t,e)}}function i_(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(St(t,e))return;s.uniform4iv(this.addr,e),Tt(t,e)}}function s_(s,e){let t=this.cache;t[0]!==e&&(s.uniform1ui(this.addr,e),t[0]=e)}function r_(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(St(t,e))return;s.uniform2uiv(this.addr,e),Tt(t,e)}}function o_(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(St(t,e))return;s.uniform3uiv(this.addr,e),Tt(t,e)}}function a_(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(St(t,e))return;s.uniform4uiv(this.addr,e),Tt(t,e)}}function c_(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_2D_SHADOW?(bu.compareFunction=Md,r=bu):r=Ed,t.setTexture2D(e||r,i)}function l_(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||Rd,i)}function h_(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||Cd,i)}function u_(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||Ad,i)}function d_(s){switch(s){case 5126:return q0;case 35664:return K0;case 35665:return Z0;case 35666:return J0;case 35674:return j0;case 35675:return $0;case 35676:return Q0;case 5124:case 35670:return e_;case 35667:case 35671:return t_;case 35668:case 35672:return n_;case 35669:case 35673:return i_;case 5125:return s_;case 36294:return r_;case 36295:return o_;case 36296:return a_;case 35678:case 36198:case 36298:case 36306:case 35682:return c_;case 35679:case 36299:case 36307:return l_;case 35680:case 36300:case 36308:case 36293:return h_;case 36289:case 36303:case 36311:case 36292:return u_}}function f_(s,e){s.uniform1fv(this.addr,e)}function p_(s,e){let t=Es(e,this.size,2);s.uniform2fv(this.addr,t)}function m_(s,e){let t=Es(e,this.size,3);s.uniform3fv(this.addr,t)}function g_(s,e){let t=Es(e,this.size,4);s.uniform4fv(this.addr,t)}function __(s,e){let t=Es(e,this.size,4);s.uniformMatrix2fv(this.addr,!1,t)}function y_(s,e){let t=Es(e,this.size,9);s.uniformMatrix3fv(this.addr,!1,t)}function x_(s,e){let t=Es(e,this.size,16);s.uniformMatrix4fv(this.addr,!1,t)}function v_(s,e){s.uniform1iv(this.addr,e)}function M_(s,e){s.uniform2iv(this.addr,e)}function b_(s,e){s.uniform3iv(this.addr,e)}function S_(s,e){s.uniform4iv(this.addr,e)}function T_(s,e){s.uniform1uiv(this.addr,e)}function w_(s,e){s.uniform2uiv(this.addr,e)}function E_(s,e){s.uniform3uiv(this.addr,e)}function A_(s,e){s.uniform4uiv(this.addr,e)}function R_(s,e,t){let n=this.cache,i=e.length,r=qo(t,i);St(n,r)||(s.uniform1iv(this.addr,r),Tt(n,r));for(let o=0;o!==i;++o)t.setTexture2D(e[o]||Ed,r[o])}function C_(s,e,t){let n=this.cache,i=e.length,r=qo(t,i);St(n,r)||(s.uniform1iv(this.addr,r),Tt(n,r));for(let o=0;o!==i;++o)t.setTexture3D(e[o]||Rd,r[o])}function I_(s,e,t){let n=this.cache,i=e.length,r=qo(t,i);St(n,r)||(s.uniform1iv(this.addr,r),Tt(n,r));for(let o=0;o!==i;++o)t.setTextureCube(e[o]||Cd,r[o])}function P_(s,e,t){let n=this.cache,i=e.length,r=qo(t,i);St(n,r)||(s.uniform1iv(this.addr,r),Tt(n,r));for(let o=0;o!==i;++o)t.setTexture2DArray(e[o]||Ad,r[o])}function L_(s){switch(s){case 5126:return f_;case 35664:return p_;case 35665:return m_;case 35666:return g_;case 35674:return __;case 35675:return y_;case 35676:return x_;case 5124:case 35670:return v_;case 35667:case 35671:return M_;case 35668:case 35672:return b_;case 35669:case 35673:return S_;case 5125:return T_;case 36294:return w_;case 36295:return E_;case 36296:return A_;case 35678:case 36198:case 36298:case 36306:case 35682:return R_;case 35679:case 36299:case 36307:return C_;case 35680:case 36300:case 36308:case 36293:return I_;case 36289:case 36303:case 36311:case 36292:return P_}}var Bc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=d_(t.type)}},zc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=L_(t.type)}},kc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let i=this.seq;for(let r=0,o=i.length;r!==o;++r){let a=i[r];a.setValue(e,t[a.id],n)}}},ka=/(\w+)(\])?(\[|\.)?/g;function Ru(s,e){s.seq.push(e),s.map[e.id]=e}function D_(s,e,t){let n=s.name,i=n.length;for(ka.lastIndex=0;;){let r=ka.exec(n),o=ka.lastIndex,a=r[1],c=r[2]==="]",l=r[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===i){Ru(t,l===void 0?new Bc(a,s,e):new zc(a,s,e));break}else{let u=t.map[a];u===void 0&&(u=new kc(a),Ru(t,u)),t=u}}}var os=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){let r=e.getActiveUniform(t,i),o=e.getUniformLocation(t,r.name);D_(r,o,this)}}setValue(e,t,n,i){let r=this.map[t];r!==void 0&&r.setValue(e,n,i)}setOptional(e,t,n){let i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,o=t.length;r!==o;++r){let a=t[r],c=n[a.id];c.needsUpdate!==!1&&a.setValue(e,c.value,i)}}static seqWithValue(e,t){let n=[];for(let i=0,r=e.length;i!==r;++i){let o=e[i];o.id in t&&n.push(o)}return n}};function Cu(s,e,t){let n=s.createShader(e);return s.shaderSource(n,t),s.compileShader(n),n}var N_=37297,U_=0;function O_(s,e){let t=s.split(`
`),n=[],i=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=i;o<r;o++){let a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}function F_(s){let e=Ye.getPrimaries(Ye.workingColorSpace),t=Ye.getPrimaries(s),n;switch(e===t?n="":e===co&&t===ao?n="LinearDisplayP3ToLinearSRGB":e===ao&&t===co&&(n="LinearSRGBToLinearDisplayP3"),s){case Pt:case Yo:return[n,"LinearTransferOETF"];case mt:case El:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",s),[n,"LinearTransferOETF"]}}function Iu(s,e,t){let n=s.getShaderParameter(e,s.COMPILE_STATUS),i=s.getShaderInfoLog(e).trim();if(n&&i==="")return"";let r=/ERROR: 0:(\d+)/.exec(i);if(r){let o=parseInt(r[1]);return t.toUpperCase()+`

`+i+`

`+O_(s.getShaderSource(e),o)}else return i}function B_(s,e){let t=F_(e);return`vec4 ${s}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function z_(s,e){let t;switch(e){case qf:t="Linear";break;case Kf:t="Reinhard";break;case Zf:t="Cineon";break;case ml:t="ACESFilmic";break;case jf:t="AgX";break;case $f:t="Neutral";break;case Jf:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+s+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Vr=new E;function k_(){Ye.getLuminanceCoefficients(Vr);let s=Vr.x.toFixed(4),e=Vr.y.toFixed(4),t=Vr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${s}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function H_(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",s.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ks).join(`
`)}function V_(s){let e=[];for(let t in s){let n=s[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function G_(s,e){let t={},n=s.getProgramParameter(e,s.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){let r=s.getActiveAttrib(e,i),o=r.name,a=1;r.type===s.FLOAT_MAT2&&(a=2),r.type===s.FLOAT_MAT3&&(a=3),r.type===s.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:s.getAttribLocation(e,o),locationSize:a}}return t}function ks(s){return s!==""}function Pu(s,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Lu(s,e){return s.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var W_=/^[ \t]*#include +<([\w\d./]+)>/gm;function Hc(s){return s.replace(W_,Y_)}var X_=new Map;function Y_(s,e){let t=Fe[e];if(t===void 0){let n=X_.get(e);if(n!==void 0)t=Fe[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return Hc(t)}var q_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Du(s){return s.replace(q_,K_)}function K_(s,e,t,n){let i="";for(let r=parseInt(e);r<parseInt(t);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function Nu(s){let e=`precision ${s.precision} float;
	precision ${s.precision} int;
	precision ${s.precision} sampler2D;
	precision ${s.precision} samplerCube;
	precision ${s.precision} sampler3D;
	precision ${s.precision} sampler2DArray;
	precision ${s.precision} sampler2DShadow;
	precision ${s.precision} samplerCubeShadow;
	precision ${s.precision} sampler2DArrayShadow;
	precision ${s.precision} isampler2D;
	precision ${s.precision} isampler3D;
	precision ${s.precision} isamplerCube;
	precision ${s.precision} isampler2DArray;
	precision ${s.precision} usampler2D;
	precision ${s.precision} usampler3D;
	precision ${s.precision} usamplerCube;
	precision ${s.precision} usampler2DArray;
	`;return s.precision==="highp"?e+=`
#define HIGH_PRECISION`:s.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Z_(s){let e="SHADOWMAP_TYPE_BASIC";return s.shadowMapType===ad?e="SHADOWMAP_TYPE_PCF":s.shadowMapType===Ef?e="SHADOWMAP_TYPE_PCF_SOFT":s.shadowMapType===zn&&(e="SHADOWMAP_TYPE_VSM"),e}function J_(s){let e="ENVMAP_TYPE_CUBE";if(s.envMap)switch(s.envMapMode){case cs:case ls:e="ENVMAP_TYPE_CUBE";break;case Wo:e="ENVMAP_TYPE_CUBE_UV";break}return e}function j_(s){let e="ENVMAP_MODE_REFLECTION";return s.envMap&&s.envMapMode===ls&&(e="ENVMAP_MODE_REFRACTION"),e}function $_(s){let e="ENVMAP_BLENDING_NONE";if(s.envMap)switch(s.combine){case cd:e="ENVMAP_BLENDING_MULTIPLY";break;case Xf:e="ENVMAP_BLENDING_MIX";break;case Yf:e="ENVMAP_BLENDING_ADD";break}return e}function Q_(s){let e=s.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function ey(s,e,t,n){let i=s.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,c=Z_(t),l=J_(t),h=j_(t),u=$_(t),d=Q_(t),f=H_(t),m=V_(r),_=i.createProgram(),p,g,M=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(ks).join(`
`),p.length>0&&(p+=`
`),g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(ks).join(`
`),g.length>0&&(g+=`
`)):(p=[Nu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ks).join(`
`),g=[Nu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==si?"#define TONE_MAPPING":"",t.toneMapping!==si?Fe.tonemapping_pars_fragment:"",t.toneMapping!==si?z_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Fe.colorspace_pars_fragment,B_("linearToOutputTexel",t.outputColorSpace),k_(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ks).join(`
`)),o=Hc(o),o=Pu(o,t),o=Lu(o,t),a=Hc(a),a=Pu(a,t),a=Lu(a,t),o=Du(o),a=Du(a),t.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,g=["#define varying in",t.glslVersion===jh?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===jh?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+g);let x=M+p+o,y=M+g+a,A=Cu(i,i.VERTEX_SHADER,x),w=Cu(i,i.FRAGMENT_SHADER,y);i.attachShader(_,A),i.attachShader(_,w),t.index0AttributeName!==void 0?i.bindAttribLocation(_,0,t.index0AttributeName):t.morphTargets===!0&&i.bindAttribLocation(_,0,"position"),i.linkProgram(_);function R(S){if(s.debug.checkShaderErrors){let F=i.getProgramInfoLog(_).trim(),B=i.getShaderInfoLog(A).trim(),G=i.getShaderInfoLog(w).trim(),Y=!0,P=!0;if(i.getProgramParameter(_,i.LINK_STATUS)===!1)if(Y=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(i,_,A,w);else{let j=Iu(i,A,"vertex"),k=Iu(i,w,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(_,i.VALIDATE_STATUS)+`

Material Name: `+S.name+`
Material Type: `+S.type+`

Program Info Log: `+F+`
`+j+`
`+k)}else F!==""?console.warn("THREE.WebGLProgram: Program Info Log:",F):(B===""||G==="")&&(P=!1);P&&(S.diagnostics={runnable:Y,programLog:F,vertexShader:{log:B,prefix:p},fragmentShader:{log:G,prefix:g}})}i.deleteShader(A),i.deleteShader(w),I=new os(i,_),N=G_(i,_)}let I;this.getUniforms=function(){return I===void 0&&R(this),I};let N;this.getAttributes=function(){return N===void 0&&R(this),N};let v=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return v===!1&&(v=i.getProgramParameter(_,N_)),v},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(_),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=U_++,this.cacheKey=e,this.usedTimes=1,this.program=_,this.vertexShader=A,this.fragmentShader=w,this}var ty=0,Vc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,i=this._getShaderStage(t),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(i)===!1&&(o.add(i),i.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Gc(e),t.set(e,n)),n}},Gc=class{constructor(e){this.id=ty++,this.code=e,this.usedTimes=0}};function ny(s,e,t,n,i,r,o){let a=new uo,c=new Vc,l=new Set,h=[],u=i.logarithmicDepthBuffer,d=i.reverseDepthBuffer,f=i.vertexTextures,m=i.precision,_={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(v){return l.add(v),v===0?"uv":`uv${v}`}function g(v,S,F,B,G){let Y=B.fog,P=G.geometry,j=v.isMeshStandardMaterial?B.environment:null,k=(v.isMeshStandardMaterial?t:e).get(v.envMap||j),J=k&&k.mapping===Wo?k.image.height:null,ee=_[v.type];v.precision!==null&&(m=i.getMaxPrecision(v.precision),m!==v.precision&&console.warn("THREE.WebGLProgram.getParameters:",v.precision,"not supported, using",m,"instead."));let re=P.morphAttributes.position||P.morphAttributes.normal||P.morphAttributes.color,Ae=re!==void 0?re.length:0,De=0;P.morphAttributes.position!==void 0&&(De=1),P.morphAttributes.normal!==void 0&&(De=2),P.morphAttributes.color!==void 0&&(De=3);let X,Q,he,le;if(ee){let Wt=An[ee];X=Wt.vertexShader,Q=Wt.fragmentShader}else X=v.vertexShader,Q=v.fragmentShader,c.update(v),he=c.getVertexShaderID(v),le=c.getFragmentShaderID(v);let Ne=s.getRenderTarget(),we=G.isInstancedMesh===!0,Ge=G.isBatchedMesh===!0,nt=!!v.map,We=!!v.matcap,L=!!k,Zt=!!v.aoMap,He=!!v.lightMap,qe=!!v.bumpMap,Re=!!v.normalMap,ot=!!v.displacementMap,Pe=!!v.emissiveMap,C=!!v.metalnessMap,b=!!v.roughnessMap,z=v.anisotropy>0,K=v.clearcoat>0,$=v.dispersion>0,q=v.iridescence>0,xe=v.sheen>0,oe=v.transmission>0,fe=z&&!!v.anisotropyMap,Ke=K&&!!v.clearcoatMap,te=K&&!!v.clearcoatNormalMap,pe=K&&!!v.clearcoatRoughnessMap,Ce=q&&!!v.iridescenceMap,Ie=q&&!!v.iridescenceThicknessMap,me=xe&&!!v.sheenColorMap,Ve=xe&&!!v.sheenRoughnessMap,Ue=!!v.specularMap,rt=!!v.specularColorMap,D=!!v.specularIntensityMap,ue=oe&&!!v.transmissionMap,W=oe&&!!v.thicknessMap,Z=!!v.gradientMap,ae=!!v.alphaMap,de=v.alphaTest>0,Xe=!!v.alphaHash,yt=!!v.extensions,Gt=si;v.toneMapped&&(Ne===null||Ne.isXRRenderTarget===!0)&&(Gt=s.toneMapping);let Je={shaderID:ee,shaderType:v.type,shaderName:v.name,vertexShader:X,fragmentShader:Q,defines:v.defines,customVertexShaderID:he,customFragmentShaderID:le,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:m,batching:Ge,batchingColor:Ge&&G._colorsTexture!==null,instancing:we,instancingColor:we&&G.instanceColor!==null,instancingMorph:we&&G.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:Ne===null?s.outputColorSpace:Ne.isXRRenderTarget===!0?Ne.texture.colorSpace:Pt,alphaToCoverage:!!v.alphaToCoverage,map:nt,matcap:We,envMap:L,envMapMode:L&&k.mapping,envMapCubeUVHeight:J,aoMap:Zt,lightMap:He,bumpMap:qe,normalMap:Re,displacementMap:f&&ot,emissiveMap:Pe,normalMapObjectSpace:Re&&v.normalMapType===sp,normalMapTangentSpace:Re&&v.normalMapType===vd,metalnessMap:C,roughnessMap:b,anisotropy:z,anisotropyMap:fe,clearcoat:K,clearcoatMap:Ke,clearcoatNormalMap:te,clearcoatRoughnessMap:pe,dispersion:$,iridescence:q,iridescenceMap:Ce,iridescenceThicknessMap:Ie,sheen:xe,sheenColorMap:me,sheenRoughnessMap:Ve,specularMap:Ue,specularColorMap:rt,specularIntensityMap:D,transmission:oe,transmissionMap:ue,thicknessMap:W,gradientMap:Z,opaque:v.transparent===!1&&v.blending===is&&v.alphaToCoverage===!1,alphaMap:ae,alphaTest:de,alphaHash:Xe,combine:v.combine,mapUv:nt&&p(v.map.channel),aoMapUv:Zt&&p(v.aoMap.channel),lightMapUv:He&&p(v.lightMap.channel),bumpMapUv:qe&&p(v.bumpMap.channel),normalMapUv:Re&&p(v.normalMap.channel),displacementMapUv:ot&&p(v.displacementMap.channel),emissiveMapUv:Pe&&p(v.emissiveMap.channel),metalnessMapUv:C&&p(v.metalnessMap.channel),roughnessMapUv:b&&p(v.roughnessMap.channel),anisotropyMapUv:fe&&p(v.anisotropyMap.channel),clearcoatMapUv:Ke&&p(v.clearcoatMap.channel),clearcoatNormalMapUv:te&&p(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:pe&&p(v.clearcoatRoughnessMap.channel),iridescenceMapUv:Ce&&p(v.iridescenceMap.channel),iridescenceThicknessMapUv:Ie&&p(v.iridescenceThicknessMap.channel),sheenColorMapUv:me&&p(v.sheenColorMap.channel),sheenRoughnessMapUv:Ve&&p(v.sheenRoughnessMap.channel),specularMapUv:Ue&&p(v.specularMap.channel),specularColorMapUv:rt&&p(v.specularColorMap.channel),specularIntensityMapUv:D&&p(v.specularIntensityMap.channel),transmissionMapUv:ue&&p(v.transmissionMap.channel),thicknessMapUv:W&&p(v.thicknessMap.channel),alphaMapUv:ae&&p(v.alphaMap.channel),vertexTangents:!!P.attributes.tangent&&(Re||z),vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!P.attributes.color&&P.attributes.color.itemSize===4,pointsUvs:G.isPoints===!0&&!!P.attributes.uv&&(nt||ae),fog:!!Y,useFog:v.fog===!0,fogExp2:!!Y&&Y.isFogExp2,flatShading:v.flatShading===!0,sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:d,skinning:G.isSkinnedMesh===!0,morphTargets:P.morphAttributes.position!==void 0,morphNormals:P.morphAttributes.normal!==void 0,morphColors:P.morphAttributes.color!==void 0,morphTargetsCount:Ae,morphTextureStride:De,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:v.dithering,shadowMapEnabled:s.shadowMap.enabled&&F.length>0,shadowMapType:s.shadowMap.type,toneMapping:Gt,decodeVideoTexture:nt&&v.map.isVideoTexture===!0&&Ye.getTransfer(v.map.colorSpace)===ct,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===kt,flipSided:v.side===Ft,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:yt&&v.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(yt&&v.extensions.multiDraw===!0||Ge)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return Je.vertexUv1s=l.has(1),Je.vertexUv2s=l.has(2),Je.vertexUv3s=l.has(3),l.clear(),Je}function M(v){let S=[];if(v.shaderID?S.push(v.shaderID):(S.push(v.customVertexShaderID),S.push(v.customFragmentShaderID)),v.defines!==void 0)for(let F in v.defines)S.push(F),S.push(v.defines[F]);return v.isRawShaderMaterial===!1&&(x(S,v),y(S,v),S.push(s.outputColorSpace)),S.push(v.customProgramCacheKey),S.join()}function x(v,S){v.push(S.precision),v.push(S.outputColorSpace),v.push(S.envMapMode),v.push(S.envMapCubeUVHeight),v.push(S.mapUv),v.push(S.alphaMapUv),v.push(S.lightMapUv),v.push(S.aoMapUv),v.push(S.bumpMapUv),v.push(S.normalMapUv),v.push(S.displacementMapUv),v.push(S.emissiveMapUv),v.push(S.metalnessMapUv),v.push(S.roughnessMapUv),v.push(S.anisotropyMapUv),v.push(S.clearcoatMapUv),v.push(S.clearcoatNormalMapUv),v.push(S.clearcoatRoughnessMapUv),v.push(S.iridescenceMapUv),v.push(S.iridescenceThicknessMapUv),v.push(S.sheenColorMapUv),v.push(S.sheenRoughnessMapUv),v.push(S.specularMapUv),v.push(S.specularColorMapUv),v.push(S.specularIntensityMapUv),v.push(S.transmissionMapUv),v.push(S.thicknessMapUv),v.push(S.combine),v.push(S.fogExp2),v.push(S.sizeAttenuation),v.push(S.morphTargetsCount),v.push(S.morphAttributeCount),v.push(S.numDirLights),v.push(S.numPointLights),v.push(S.numSpotLights),v.push(S.numSpotLightMaps),v.push(S.numHemiLights),v.push(S.numRectAreaLights),v.push(S.numDirLightShadows),v.push(S.numPointLightShadows),v.push(S.numSpotLightShadows),v.push(S.numSpotLightShadowsWithMaps),v.push(S.numLightProbes),v.push(S.shadowMapType),v.push(S.toneMapping),v.push(S.numClippingPlanes),v.push(S.numClipIntersection),v.push(S.depthPacking)}function y(v,S){a.disableAll(),S.supportsVertexTextures&&a.enable(0),S.instancing&&a.enable(1),S.instancingColor&&a.enable(2),S.instancingMorph&&a.enable(3),S.matcap&&a.enable(4),S.envMap&&a.enable(5),S.normalMapObjectSpace&&a.enable(6),S.normalMapTangentSpace&&a.enable(7),S.clearcoat&&a.enable(8),S.iridescence&&a.enable(9),S.alphaTest&&a.enable(10),S.vertexColors&&a.enable(11),S.vertexAlphas&&a.enable(12),S.vertexUv1s&&a.enable(13),S.vertexUv2s&&a.enable(14),S.vertexUv3s&&a.enable(15),S.vertexTangents&&a.enable(16),S.anisotropy&&a.enable(17),S.alphaHash&&a.enable(18),S.batching&&a.enable(19),S.dispersion&&a.enable(20),S.batchingColor&&a.enable(21),v.push(a.mask),a.disableAll(),S.fog&&a.enable(0),S.useFog&&a.enable(1),S.flatShading&&a.enable(2),S.logarithmicDepthBuffer&&a.enable(3),S.reverseDepthBuffer&&a.enable(4),S.skinning&&a.enable(5),S.morphTargets&&a.enable(6),S.morphNormals&&a.enable(7),S.morphColors&&a.enable(8),S.premultipliedAlpha&&a.enable(9),S.shadowMapEnabled&&a.enable(10),S.doubleSided&&a.enable(11),S.flipSided&&a.enable(12),S.useDepthPacking&&a.enable(13),S.dithering&&a.enable(14),S.transmission&&a.enable(15),S.sheen&&a.enable(16),S.opaque&&a.enable(17),S.pointsUvs&&a.enable(18),S.decodeVideoTexture&&a.enable(19),S.alphaToCoverage&&a.enable(20),v.push(a.mask)}function A(v){let S=_[v.type],F;if(S){let B=An[S];F=Yp.clone(B.uniforms)}else F=v.uniforms;return F}function w(v,S){let F;for(let B=0,G=h.length;B<G;B++){let Y=h[B];if(Y.cacheKey===S){F=Y,++F.usedTimes;break}}return F===void 0&&(F=new ey(s,S,v,r),h.push(F)),F}function R(v){if(--v.usedTimes===0){let S=h.indexOf(v);h[S]=h[h.length-1],h.pop(),v.destroy()}}function I(v){c.remove(v)}function N(){c.dispose()}return{getParameters:g,getProgramCacheKey:M,getUniforms:A,acquireProgram:w,releaseProgram:R,releaseShaderCache:I,programs:h,dispose:N}}function iy(){let s=new WeakMap;function e(o){return s.has(o)}function t(o){let a=s.get(o);return a===void 0&&(a={},s.set(o,a)),a}function n(o){s.delete(o)}function i(o,a,c){s.get(o)[a]=c}function r(){s=new WeakMap}return{has:e,get:t,remove:n,update:i,dispose:r}}function sy(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.material.id!==e.material.id?s.material.id-e.material.id:s.z!==e.z?s.z-e.z:s.id-e.id}function Uu(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.z!==e.z?e.z-s.z:s.id-e.id}function Ou(){let s=[],e=0,t=[],n=[],i=[];function r(){e=0,t.length=0,n.length=0,i.length=0}function o(u,d,f,m,_,p){let g=s[e];return g===void 0?(g={id:u.id,object:u,geometry:d,material:f,groupOrder:m,renderOrder:u.renderOrder,z:_,group:p},s[e]=g):(g.id=u.id,g.object=u,g.geometry=d,g.material=f,g.groupOrder=m,g.renderOrder=u.renderOrder,g.z=_,g.group=p),e++,g}function a(u,d,f,m,_,p){let g=o(u,d,f,m,_,p);f.transmission>0?n.push(g):f.transparent===!0?i.push(g):t.push(g)}function c(u,d,f,m,_,p){let g=o(u,d,f,m,_,p);f.transmission>0?n.unshift(g):f.transparent===!0?i.unshift(g):t.unshift(g)}function l(u,d){t.length>1&&t.sort(u||sy),n.length>1&&n.sort(d||Uu),i.length>1&&i.sort(d||Uu)}function h(){for(let u=e,d=s.length;u<d;u++){let f=s[u];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:t,transmissive:n,transparent:i,init:r,push:a,unshift:c,finish:h,sort:l}}function ry(){let s=new WeakMap;function e(n,i){let r=s.get(n),o;return r===void 0?(o=new Ou,s.set(n,[o])):i>=r.length?(o=new Ou,r.push(o)):o=r[i],o}function t(){s=new WeakMap}return{get:e,dispose:t}}function oy(){let s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new E,color:new be};break;case"SpotLight":t={position:new E,direction:new E,color:new be,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new E,color:new be,distance:0,decay:0};break;case"HemisphereLight":t={direction:new E,skyColor:new be,groundColor:new be};break;case"RectAreaLight":t={color:new be,position:new E,halfWidth:new E,halfHeight:new E};break}return s[e.id]=t,t}}}function ay(){let s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ie};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ie};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ie,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[e.id]=t,t}}}var cy=0;function ly(s,e){return(e.castShadow?2:0)-(s.castShadow?2:0)+(e.map?1:0)-(s.map?1:0)}function hy(s){let e=new oy,t=ay(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new E);let i=new E,r=new Te,o=new Te;function a(l){let h=0,u=0,d=0;for(let N=0;N<9;N++)n.probe[N].set(0,0,0);let f=0,m=0,_=0,p=0,g=0,M=0,x=0,y=0,A=0,w=0,R=0;l.sort(ly);for(let N=0,v=l.length;N<v;N++){let S=l[N],F=S.color,B=S.intensity,G=S.distance,Y=S.shadow&&S.shadow.map?S.shadow.map.texture:null;if(S.isAmbientLight)h+=F.r*B,u+=F.g*B,d+=F.b*B;else if(S.isLightProbe){for(let P=0;P<9;P++)n.probe[P].addScaledVector(S.sh.coefficients[P],B);R++}else if(S.isDirectionalLight){let P=e.get(S);if(P.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let j=S.shadow,k=t.get(S);k.shadowIntensity=j.intensity,k.shadowBias=j.bias,k.shadowNormalBias=j.normalBias,k.shadowRadius=j.radius,k.shadowMapSize=j.mapSize,n.directionalShadow[f]=k,n.directionalShadowMap[f]=Y,n.directionalShadowMatrix[f]=S.shadow.matrix,M++}n.directional[f]=P,f++}else if(S.isSpotLight){let P=e.get(S);P.position.setFromMatrixPosition(S.matrixWorld),P.color.copy(F).multiplyScalar(B),P.distance=G,P.coneCos=Math.cos(S.angle),P.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),P.decay=S.decay,n.spot[_]=P;let j=S.shadow;if(S.map&&(n.spotLightMap[A]=S.map,A++,j.updateMatrices(S),S.castShadow&&w++),n.spotLightMatrix[_]=j.matrix,S.castShadow){let k=t.get(S);k.shadowIntensity=j.intensity,k.shadowBias=j.bias,k.shadowNormalBias=j.normalBias,k.shadowRadius=j.radius,k.shadowMapSize=j.mapSize,n.spotShadow[_]=k,n.spotShadowMap[_]=Y,y++}_++}else if(S.isRectAreaLight){let P=e.get(S);P.color.copy(F).multiplyScalar(B),P.halfWidth.set(S.width*.5,0,0),P.halfHeight.set(0,S.height*.5,0),n.rectArea[p]=P,p++}else if(S.isPointLight){let P=e.get(S);if(P.color.copy(S.color).multiplyScalar(S.intensity),P.distance=S.distance,P.decay=S.decay,S.castShadow){let j=S.shadow,k=t.get(S);k.shadowIntensity=j.intensity,k.shadowBias=j.bias,k.shadowNormalBias=j.normalBias,k.shadowRadius=j.radius,k.shadowMapSize=j.mapSize,k.shadowCameraNear=j.camera.near,k.shadowCameraFar=j.camera.far,n.pointShadow[m]=k,n.pointShadowMap[m]=Y,n.pointShadowMatrix[m]=S.shadow.matrix,x++}n.point[m]=P,m++}else if(S.isHemisphereLight){let P=e.get(S);P.skyColor.copy(S.color).multiplyScalar(B),P.groundColor.copy(S.groundColor).multiplyScalar(B),n.hemi[g]=P,g++}}p>0&&(s.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=se.LTC_FLOAT_1,n.rectAreaLTC2=se.LTC_FLOAT_2):(n.rectAreaLTC1=se.LTC_HALF_1,n.rectAreaLTC2=se.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=d;let I=n.hash;(I.directionalLength!==f||I.pointLength!==m||I.spotLength!==_||I.rectAreaLength!==p||I.hemiLength!==g||I.numDirectionalShadows!==M||I.numPointShadows!==x||I.numSpotShadows!==y||I.numSpotMaps!==A||I.numLightProbes!==R)&&(n.directional.length=f,n.spot.length=_,n.rectArea.length=p,n.point.length=m,n.hemi.length=g,n.directionalShadow.length=M,n.directionalShadowMap.length=M,n.pointShadow.length=x,n.pointShadowMap.length=x,n.spotShadow.length=y,n.spotShadowMap.length=y,n.directionalShadowMatrix.length=M,n.pointShadowMatrix.length=x,n.spotLightMatrix.length=y+A-w,n.spotLightMap.length=A,n.numSpotLightShadowsWithMaps=w,n.numLightProbes=R,I.directionalLength=f,I.pointLength=m,I.spotLength=_,I.rectAreaLength=p,I.hemiLength=g,I.numDirectionalShadows=M,I.numPointShadows=x,I.numSpotShadows=y,I.numSpotMaps=A,I.numLightProbes=R,n.version=cy++)}function c(l,h){let u=0,d=0,f=0,m=0,_=0,p=h.matrixWorldInverse;for(let g=0,M=l.length;g<M;g++){let x=l[g];if(x.isDirectionalLight){let y=n.directional[u];y.direction.setFromMatrixPosition(x.matrixWorld),i.setFromMatrixPosition(x.target.matrixWorld),y.direction.sub(i),y.direction.transformDirection(p),u++}else if(x.isSpotLight){let y=n.spot[f];y.position.setFromMatrixPosition(x.matrixWorld),y.position.applyMatrix4(p),y.direction.setFromMatrixPosition(x.matrixWorld),i.setFromMatrixPosition(x.target.matrixWorld),y.direction.sub(i),y.direction.transformDirection(p),f++}else if(x.isRectAreaLight){let y=n.rectArea[m];y.position.setFromMatrixPosition(x.matrixWorld),y.position.applyMatrix4(p),o.identity(),r.copy(x.matrixWorld),r.premultiply(p),o.extractRotation(r),y.halfWidth.set(x.width*.5,0,0),y.halfHeight.set(0,x.height*.5,0),y.halfWidth.applyMatrix4(o),y.halfHeight.applyMatrix4(o),m++}else if(x.isPointLight){let y=n.point[d];y.position.setFromMatrixPosition(x.matrixWorld),y.position.applyMatrix4(p),d++}else if(x.isHemisphereLight){let y=n.hemi[_];y.direction.setFromMatrixPosition(x.matrixWorld),y.direction.transformDirection(p),_++}}}return{setup:a,setupView:c,state:n}}function Fu(s){let e=new hy(s),t=[],n=[];function i(h){l.camera=h,t.length=0,n.length=0}function r(h){t.push(h)}function o(h){n.push(h)}function a(){e.setup(t)}function c(h){e.setupView(t,h)}let l={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:i,state:l,setupLights:a,setupLightsView:c,pushLight:r,pushShadow:o}}function uy(s){let e=new WeakMap;function t(i,r=0){let o=e.get(i),a;return o===void 0?(a=new Fu(s),e.set(i,[a])):r>=o.length?(a=new Fu(s),o.push(a)):a=o[r],a}function n(){e=new WeakMap}return{get:t,dispose:n}}var Wc=class extends tn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=np,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Xc=class extends tn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}},dy=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,fy=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function py(s,e,t){let n=new Zs,i=new ie,r=new ie,o=new je,a=new Wc({depthPacking:ip}),c=new Xc,l={},h=t.maxTextureSize,u={[Cn]:Ft,[Ft]:Cn,[kt]:kt},d=new hn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ie},radius:{value:4}},vertexShader:dy,fragmentShader:fy}),f=d.clone();f.defines.HORIZONTAL_PASS=1;let m=new ht;m.setAttribute("position",new ke(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let _=new ye(m,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ad;let g=this.type;this.render=function(w,R,I){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||w.length===0)return;let N=s.getRenderTarget(),v=s.getActiveCubeFace(),S=s.getActiveMipmapLevel(),F=s.state;F.setBlending(ii),F.buffers.color.setClear(1,1,1,1),F.buffers.depth.setTest(!0),F.setScissorTest(!1);let B=g!==zn&&this.type===zn,G=g===zn&&this.type!==zn;for(let Y=0,P=w.length;Y<P;Y++){let j=w[Y],k=j.shadow;if(k===void 0){console.warn("THREE.WebGLShadowMap:",j,"has no shadow.");continue}if(k.autoUpdate===!1&&k.needsUpdate===!1)continue;i.copy(k.mapSize);let J=k.getFrameExtents();if(i.multiply(J),r.copy(k.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(r.x=Math.floor(h/J.x),i.x=r.x*J.x,k.mapSize.x=r.x),i.y>h&&(r.y=Math.floor(h/J.y),i.y=r.y*J.y,k.mapSize.y=r.y)),k.map===null||B===!0||G===!0){let re=this.type!==zn?{minFilter:Ct,magFilter:Ct}:{};k.map!==null&&k.map.dispose(),k.map=new Vn(i.x,i.y,re),k.map.texture.name=j.name+".shadowMap",k.camera.updateProjectionMatrix()}s.setRenderTarget(k.map),s.clear();let ee=k.getViewportCount();for(let re=0;re<ee;re++){let Ae=k.getViewport(re);o.set(r.x*Ae.x,r.y*Ae.y,r.x*Ae.z,r.y*Ae.w),F.viewport(o),k.updateMatrices(j,re),n=k.getFrustum(),y(R,I,k.camera,j,this.type)}k.isPointLightShadow!==!0&&this.type===zn&&M(k,I),k.needsUpdate=!1}g=this.type,p.needsUpdate=!1,s.setRenderTarget(N,v,S)};function M(w,R){let I=e.update(_);d.defines.VSM_SAMPLES!==w.blurSamples&&(d.defines.VSM_SAMPLES=w.blurSamples,f.defines.VSM_SAMPLES=w.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),w.mapPass===null&&(w.mapPass=new Vn(i.x,i.y)),d.uniforms.shadow_pass.value=w.map.texture,d.uniforms.resolution.value=w.mapSize,d.uniforms.radius.value=w.radius,s.setRenderTarget(w.mapPass),s.clear(),s.renderBufferDirect(R,null,I,d,_,null),f.uniforms.shadow_pass.value=w.mapPass.texture,f.uniforms.resolution.value=w.mapSize,f.uniforms.radius.value=w.radius,s.setRenderTarget(w.map),s.clear(),s.renderBufferDirect(R,null,I,f,_,null)}function x(w,R,I,N){let v=null,S=I.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(S!==void 0)v=S;else if(v=I.isPointLight===!0?c:a,s.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0){let F=v.uuid,B=R.uuid,G=l[F];G===void 0&&(G={},l[F]=G);let Y=G[B];Y===void 0&&(Y=v.clone(),G[B]=Y,R.addEventListener("dispose",A)),v=Y}if(v.visible=R.visible,v.wireframe=R.wireframe,N===zn?v.side=R.shadowSide!==null?R.shadowSide:R.side:v.side=R.shadowSide!==null?R.shadowSide:u[R.side],v.alphaMap=R.alphaMap,v.alphaTest=R.alphaTest,v.map=R.map,v.clipShadows=R.clipShadows,v.clippingPlanes=R.clippingPlanes,v.clipIntersection=R.clipIntersection,v.displacementMap=R.displacementMap,v.displacementScale=R.displacementScale,v.displacementBias=R.displacementBias,v.wireframeLinewidth=R.wireframeLinewidth,v.linewidth=R.linewidth,I.isPointLight===!0&&v.isMeshDistanceMaterial===!0){let F=s.properties.get(v);F.light=I}return v}function y(w,R,I,N,v){if(w.visible===!1)return;if(w.layers.test(R.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&v===zn)&&(!w.frustumCulled||n.intersectsObject(w))){w.modelViewMatrix.multiplyMatrices(I.matrixWorldInverse,w.matrixWorld);let B=e.update(w),G=w.material;if(Array.isArray(G)){let Y=B.groups;for(let P=0,j=Y.length;P<j;P++){let k=Y[P],J=G[k.materialIndex];if(J&&J.visible){let ee=x(w,J,N,v);w.onBeforeShadow(s,w,R,I,B,ee,k),s.renderBufferDirect(I,null,B,ee,w,k),w.onAfterShadow(s,w,R,I,B,ee,k)}}}else if(G.visible){let Y=x(w,G,N,v);w.onBeforeShadow(s,w,R,I,B,Y,null),s.renderBufferDirect(I,null,B,Y,w,null),w.onAfterShadow(s,w,R,I,B,Y,null)}}let F=w.children;for(let B=0,G=F.length;B<G;B++)y(F[B],R,I,N,v)}function A(w){w.target.removeEventListener("dispose",A);for(let I in l){let N=l[I],v=w.target.uuid;v in N&&(N[v].dispose(),delete N[v])}}}var my={[ja]:$a,[Qa]:nc,[ec]:ic,[as]:tc,[$a]:ja,[nc]:Qa,[ic]:ec,[tc]:as};function gy(s){function e(){let D=!1,ue=new je,W=null,Z=new je(0,0,0,0);return{setMask:function(ae){W!==ae&&!D&&(s.colorMask(ae,ae,ae,ae),W=ae)},setLocked:function(ae){D=ae},setClear:function(ae,de,Xe,yt,Gt){Gt===!0&&(ae*=yt,de*=yt,Xe*=yt),ue.set(ae,de,Xe,yt),Z.equals(ue)===!1&&(s.clearColor(ae,de,Xe,yt),Z.copy(ue))},reset:function(){D=!1,W=null,Z.set(-1,0,0,0)}}}function t(){let D=!1,ue=!1,W=null,Z=null,ae=null;return{setReversed:function(de){ue=de},setTest:function(de){de?he(s.DEPTH_TEST):le(s.DEPTH_TEST)},setMask:function(de){W!==de&&!D&&(s.depthMask(de),W=de)},setFunc:function(de){if(ue&&(de=my[de]),Z!==de){switch(de){case ja:s.depthFunc(s.NEVER);break;case $a:s.depthFunc(s.ALWAYS);break;case Qa:s.depthFunc(s.LESS);break;case as:s.depthFunc(s.LEQUAL);break;case ec:s.depthFunc(s.EQUAL);break;case tc:s.depthFunc(s.GEQUAL);break;case nc:s.depthFunc(s.GREATER);break;case ic:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}Z=de}},setLocked:function(de){D=de},setClear:function(de){ae!==de&&(s.clearDepth(de),ae=de)},reset:function(){D=!1,W=null,Z=null,ae=null}}}function n(){let D=!1,ue=null,W=null,Z=null,ae=null,de=null,Xe=null,yt=null,Gt=null;return{setTest:function(Je){D||(Je?he(s.STENCIL_TEST):le(s.STENCIL_TEST))},setMask:function(Je){ue!==Je&&!D&&(s.stencilMask(Je),ue=Je)},setFunc:function(Je,Wt,Ln){(W!==Je||Z!==Wt||ae!==Ln)&&(s.stencilFunc(Je,Wt,Ln),W=Je,Z=Wt,ae=Ln)},setOp:function(Je,Wt,Ln){(de!==Je||Xe!==Wt||yt!==Ln)&&(s.stencilOp(Je,Wt,Ln),de=Je,Xe=Wt,yt=Ln)},setLocked:function(Je){D=Je},setClear:function(Je){Gt!==Je&&(s.clearStencil(Je),Gt=Je)},reset:function(){D=!1,ue=null,W=null,Z=null,ae=null,de=null,Xe=null,yt=null,Gt=null}}}let i=new e,r=new t,o=new n,a=new WeakMap,c=new WeakMap,l={},h={},u=new WeakMap,d=[],f=null,m=!1,_=null,p=null,g=null,M=null,x=null,y=null,A=null,w=new be(0,0,0),R=0,I=!1,N=null,v=null,S=null,F=null,B=null,G=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS),Y=!1,P=0,j=s.getParameter(s.VERSION);j.indexOf("WebGL")!==-1?(P=parseFloat(/^WebGL (\d)/.exec(j)[1]),Y=P>=1):j.indexOf("OpenGL ES")!==-1&&(P=parseFloat(/^OpenGL ES (\d)/.exec(j)[1]),Y=P>=2);let k=null,J={},ee=s.getParameter(s.SCISSOR_BOX),re=s.getParameter(s.VIEWPORT),Ae=new je().fromArray(ee),De=new je().fromArray(re);function X(D,ue,W,Z){let ae=new Uint8Array(4),de=s.createTexture();s.bindTexture(D,de),s.texParameteri(D,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(D,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let Xe=0;Xe<W;Xe++)D===s.TEXTURE_3D||D===s.TEXTURE_2D_ARRAY?s.texImage3D(ue,0,s.RGBA,1,1,Z,0,s.RGBA,s.UNSIGNED_BYTE,ae):s.texImage2D(ue+Xe,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,ae);return de}let Q={};Q[s.TEXTURE_2D]=X(s.TEXTURE_2D,s.TEXTURE_2D,1),Q[s.TEXTURE_CUBE_MAP]=X(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),Q[s.TEXTURE_2D_ARRAY]=X(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),Q[s.TEXTURE_3D]=X(s.TEXTURE_3D,s.TEXTURE_3D,1,1),i.setClear(0,0,0,1),r.setClear(1),o.setClear(0),he(s.DEPTH_TEST),r.setFunc(as),He(!1),qe(Xh),he(s.CULL_FACE),L(ii);function he(D){l[D]!==!0&&(s.enable(D),l[D]=!0)}function le(D){l[D]!==!1&&(s.disable(D),l[D]=!1)}function Ne(D,ue){return h[D]!==ue?(s.bindFramebuffer(D,ue),h[D]=ue,D===s.DRAW_FRAMEBUFFER&&(h[s.FRAMEBUFFER]=ue),D===s.FRAMEBUFFER&&(h[s.DRAW_FRAMEBUFFER]=ue),!0):!1}function we(D,ue){let W=d,Z=!1;if(D){W=u.get(ue),W===void 0&&(W=[],u.set(ue,W));let ae=D.textures;if(W.length!==ae.length||W[0]!==s.COLOR_ATTACHMENT0){for(let de=0,Xe=ae.length;de<Xe;de++)W[de]=s.COLOR_ATTACHMENT0+de;W.length=ae.length,Z=!0}}else W[0]!==s.BACK&&(W[0]=s.BACK,Z=!0);Z&&s.drawBuffers(W)}function Ge(D){return f!==D?(s.useProgram(D),f=D,!0):!1}let nt={[Ti]:s.FUNC_ADD,[Rf]:s.FUNC_SUBTRACT,[Cf]:s.FUNC_REVERSE_SUBTRACT};nt[If]=s.MIN,nt[Pf]=s.MAX;let We={[Lf]:s.ZERO,[Df]:s.ONE,[Nf]:s.SRC_COLOR,[Za]:s.SRC_ALPHA,[kf]:s.SRC_ALPHA_SATURATE,[Bf]:s.DST_COLOR,[Of]:s.DST_ALPHA,[Uf]:s.ONE_MINUS_SRC_COLOR,[Ja]:s.ONE_MINUS_SRC_ALPHA,[zf]:s.ONE_MINUS_DST_COLOR,[Ff]:s.ONE_MINUS_DST_ALPHA,[Hf]:s.CONSTANT_COLOR,[Vf]:s.ONE_MINUS_CONSTANT_COLOR,[Gf]:s.CONSTANT_ALPHA,[Wf]:s.ONE_MINUS_CONSTANT_ALPHA};function L(D,ue,W,Z,ae,de,Xe,yt,Gt,Je){if(D===ii){m===!0&&(le(s.BLEND),m=!1);return}if(m===!1&&(he(s.BLEND),m=!0),D!==Af){if(D!==_||Je!==I){if((p!==Ti||x!==Ti)&&(s.blendEquation(s.FUNC_ADD),p=Ti,x=Ti),Je)switch(D){case is:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Yh:s.blendFunc(s.ONE,s.ONE);break;case qh:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case Kh:s.blendFuncSeparate(s.ZERO,s.SRC_COLOR,s.ZERO,s.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}else switch(D){case is:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Yh:s.blendFunc(s.SRC_ALPHA,s.ONE);break;case qh:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case Kh:s.blendFunc(s.ZERO,s.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}g=null,M=null,y=null,A=null,w.set(0,0,0),R=0,_=D,I=Je}return}ae=ae||ue,de=de||W,Xe=Xe||Z,(ue!==p||ae!==x)&&(s.blendEquationSeparate(nt[ue],nt[ae]),p=ue,x=ae),(W!==g||Z!==M||de!==y||Xe!==A)&&(s.blendFuncSeparate(We[W],We[Z],We[de],We[Xe]),g=W,M=Z,y=de,A=Xe),(yt.equals(w)===!1||Gt!==R)&&(s.blendColor(yt.r,yt.g,yt.b,Gt),w.copy(yt),R=Gt),_=D,I=!1}function Zt(D,ue){D.side===kt?le(s.CULL_FACE):he(s.CULL_FACE);let W=D.side===Ft;ue&&(W=!W),He(W),D.blending===is&&D.transparent===!1?L(ii):L(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),r.setFunc(D.depthFunc),r.setTest(D.depthTest),r.setMask(D.depthWrite),i.setMask(D.colorWrite);let Z=D.stencilWrite;o.setTest(Z),Z&&(o.setMask(D.stencilWriteMask),o.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),o.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),ot(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?he(s.SAMPLE_ALPHA_TO_COVERAGE):le(s.SAMPLE_ALPHA_TO_COVERAGE)}function He(D){N!==D&&(D?s.frontFace(s.CW):s.frontFace(s.CCW),N=D)}function qe(D){D!==Tf?(he(s.CULL_FACE),D!==v&&(D===Xh?s.cullFace(s.BACK):D===wf?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):le(s.CULL_FACE),v=D}function Re(D){D!==S&&(Y&&s.lineWidth(D),S=D)}function ot(D,ue,W){D?(he(s.POLYGON_OFFSET_FILL),(F!==ue||B!==W)&&(s.polygonOffset(ue,W),F=ue,B=W)):le(s.POLYGON_OFFSET_FILL)}function Pe(D){D?he(s.SCISSOR_TEST):le(s.SCISSOR_TEST)}function C(D){D===void 0&&(D=s.TEXTURE0+G-1),k!==D&&(s.activeTexture(D),k=D)}function b(D,ue,W){W===void 0&&(k===null?W=s.TEXTURE0+G-1:W=k);let Z=J[W];Z===void 0&&(Z={type:void 0,texture:void 0},J[W]=Z),(Z.type!==D||Z.texture!==ue)&&(k!==W&&(s.activeTexture(W),k=W),s.bindTexture(D,ue||Q[D]),Z.type=D,Z.texture=ue)}function z(){let D=J[k];D!==void 0&&D.type!==void 0&&(s.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function K(){try{s.compressedTexImage2D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function $(){try{s.compressedTexImage3D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function q(){try{s.texSubImage2D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function xe(){try{s.texSubImage3D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function oe(){try{s.compressedTexSubImage2D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function fe(){try{s.compressedTexSubImage3D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Ke(){try{s.texStorage2D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function te(){try{s.texStorage3D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function pe(){try{s.texImage2D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Ce(){try{s.texImage3D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Ie(D){Ae.equals(D)===!1&&(s.scissor(D.x,D.y,D.z,D.w),Ae.copy(D))}function me(D){De.equals(D)===!1&&(s.viewport(D.x,D.y,D.z,D.w),De.copy(D))}function Ve(D,ue){let W=c.get(ue);W===void 0&&(W=new WeakMap,c.set(ue,W));let Z=W.get(D);Z===void 0&&(Z=s.getUniformBlockIndex(ue,D.name),W.set(D,Z))}function Ue(D,ue){let Z=c.get(ue).get(D);a.get(ue)!==Z&&(s.uniformBlockBinding(ue,Z,D.__bindingPointIndex),a.set(ue,Z))}function rt(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),l={},k=null,J={},h={},u=new WeakMap,d=[],f=null,m=!1,_=null,p=null,g=null,M=null,x=null,y=null,A=null,w=new be(0,0,0),R=0,I=!1,N=null,v=null,S=null,F=null,B=null,Ae.set(0,0,s.canvas.width,s.canvas.height),De.set(0,0,s.canvas.width,s.canvas.height),i.reset(),r.reset(),o.reset()}return{buffers:{color:i,depth:r,stencil:o},enable:he,disable:le,bindFramebuffer:Ne,drawBuffers:we,useProgram:Ge,setBlending:L,setMaterial:Zt,setFlipSided:He,setCullFace:qe,setLineWidth:Re,setPolygonOffset:ot,setScissorTest:Pe,activeTexture:C,bindTexture:b,unbindTexture:z,compressedTexImage2D:K,compressedTexImage3D:$,texImage2D:pe,texImage3D:Ce,updateUBOMapping:Ve,uniformBlockBinding:Ue,texStorage2D:Ke,texStorage3D:te,texSubImage2D:q,texSubImage3D:xe,compressedTexSubImage2D:oe,compressedTexSubImage3D:fe,scissor:Ie,viewport:me,reset:rt}}function Bu(s,e,t,n){let i=_y(n);switch(t){case fd:return s*e;case md:return s*e;case gd:return s*e*2;case xl:return s*e/i.components*i.byteLength;case vl:return s*e/i.components*i.byteLength;case _d:return s*e*2/i.components*i.byteLength;case Ml:return s*e*2/i.components*i.byteLength;case pd:return s*e*3/i.components*i.byteLength;case Ot:return s*e*4/i.components*i.byteLength;case bl:return s*e*4/i.components*i.byteLength;case Qr:case eo:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case to:case no:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case ac:case lc:return Math.max(s,16)*Math.max(e,8)/4;case oc:case cc:return Math.max(s,8)*Math.max(e,8)/2;case hc:case uc:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case dc:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case fc:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case pc:return Math.floor((s+4)/5)*Math.floor((e+3)/4)*16;case mc:return Math.floor((s+4)/5)*Math.floor((e+4)/5)*16;case gc:return Math.floor((s+5)/6)*Math.floor((e+4)/5)*16;case _c:return Math.floor((s+5)/6)*Math.floor((e+5)/6)*16;case yc:return Math.floor((s+7)/8)*Math.floor((e+4)/5)*16;case xc:return Math.floor((s+7)/8)*Math.floor((e+5)/6)*16;case vc:return Math.floor((s+7)/8)*Math.floor((e+7)/8)*16;case Mc:return Math.floor((s+9)/10)*Math.floor((e+4)/5)*16;case bc:return Math.floor((s+9)/10)*Math.floor((e+5)/6)*16;case Sc:return Math.floor((s+9)/10)*Math.floor((e+7)/8)*16;case Tc:return Math.floor((s+9)/10)*Math.floor((e+9)/10)*16;case wc:return Math.floor((s+11)/12)*Math.floor((e+9)/10)*16;case Ec:return Math.floor((s+11)/12)*Math.floor((e+11)/12)*16;case io:case Ac:case Rc:return Math.ceil(s/4)*Math.ceil(e/4)*16;case yd:case Cc:return Math.ceil(s/4)*Math.ceil(e/4)*8;case Ic:case Pc:return Math.ceil(s/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function _y(s){switch(s){case Hn:case hd:return{byteLength:1,components:1};case qs:case ud:case dr:return{byteLength:2,components:1};case _l:case yl:return{byteLength:2,components:4};case Ci:case gl:case bn:return{byteLength:4,components:1};case dd:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${s}.`)}function yy(s,e,t,n,i,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new ie,h=new WeakMap,u,d=new WeakMap,f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(C,b){return f?new OffscreenCanvas(C,b):Ks("canvas")}function _(C,b,z){let K=1,$=Pe(C);if(($.width>z||$.height>z)&&(K=z/Math.max($.width,$.height)),K<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){let q=Math.floor(K*$.width),xe=Math.floor(K*$.height);u===void 0&&(u=m(q,xe));let oe=b?m(q,xe):u;return oe.width=q,oe.height=xe,oe.getContext("2d").drawImage(C,0,0,q,xe),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+$.width+"x"+$.height+") to ("+q+"x"+xe+")."),oe}else return"data"in C&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+$.width+"x"+$.height+")."),C;return C}function p(C){return C.generateMipmaps&&C.minFilter!==Ct&&C.minFilter!==Rt}function g(C){s.generateMipmap(C)}function M(C,b,z,K,$=!1){if(C!==null){if(s[C]!==void 0)return s[C];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let q=b;if(b===s.RED&&(z===s.FLOAT&&(q=s.R32F),z===s.HALF_FLOAT&&(q=s.R16F),z===s.UNSIGNED_BYTE&&(q=s.R8)),b===s.RED_INTEGER&&(z===s.UNSIGNED_BYTE&&(q=s.R8UI),z===s.UNSIGNED_SHORT&&(q=s.R16UI),z===s.UNSIGNED_INT&&(q=s.R32UI),z===s.BYTE&&(q=s.R8I),z===s.SHORT&&(q=s.R16I),z===s.INT&&(q=s.R32I)),b===s.RG&&(z===s.FLOAT&&(q=s.RG32F),z===s.HALF_FLOAT&&(q=s.RG16F),z===s.UNSIGNED_BYTE&&(q=s.RG8)),b===s.RG_INTEGER&&(z===s.UNSIGNED_BYTE&&(q=s.RG8UI),z===s.UNSIGNED_SHORT&&(q=s.RG16UI),z===s.UNSIGNED_INT&&(q=s.RG32UI),z===s.BYTE&&(q=s.RG8I),z===s.SHORT&&(q=s.RG16I),z===s.INT&&(q=s.RG32I)),b===s.RGB_INTEGER&&(z===s.UNSIGNED_BYTE&&(q=s.RGB8UI),z===s.UNSIGNED_SHORT&&(q=s.RGB16UI),z===s.UNSIGNED_INT&&(q=s.RGB32UI),z===s.BYTE&&(q=s.RGB8I),z===s.SHORT&&(q=s.RGB16I),z===s.INT&&(q=s.RGB32I)),b===s.RGBA_INTEGER&&(z===s.UNSIGNED_BYTE&&(q=s.RGBA8UI),z===s.UNSIGNED_SHORT&&(q=s.RGBA16UI),z===s.UNSIGNED_INT&&(q=s.RGBA32UI),z===s.BYTE&&(q=s.RGBA8I),z===s.SHORT&&(q=s.RGBA16I),z===s.INT&&(q=s.RGBA32I)),b===s.RGB&&z===s.UNSIGNED_INT_5_9_9_9_REV&&(q=s.RGB9_E5),b===s.RGBA){let xe=$?oo:Ye.getTransfer(K);z===s.FLOAT&&(q=s.RGBA32F),z===s.HALF_FLOAT&&(q=s.RGBA16F),z===s.UNSIGNED_BYTE&&(q=xe===ct?s.SRGB8_ALPHA8:s.RGBA8),z===s.UNSIGNED_SHORT_4_4_4_4&&(q=s.RGBA4),z===s.UNSIGNED_SHORT_5_5_5_1&&(q=s.RGB5_A1)}return(q===s.R16F||q===s.R32F||q===s.RG16F||q===s.RG32F||q===s.RGBA16F||q===s.RGBA32F)&&e.get("EXT_color_buffer_float"),q}function x(C,b){let z;return C?b===null||b===Ci||b===hs?z=s.DEPTH24_STENCIL8:b===bn?z=s.DEPTH32F_STENCIL8:b===qs&&(z=s.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):b===null||b===Ci||b===hs?z=s.DEPTH_COMPONENT24:b===bn?z=s.DEPTH_COMPONENT32F:b===qs&&(z=s.DEPTH_COMPONENT16),z}function y(C,b){return p(C)===!0||C.isFramebufferTexture&&C.minFilter!==Ct&&C.minFilter!==Rt?Math.log2(Math.max(b.width,b.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?b.mipmaps.length:1}function A(C){let b=C.target;b.removeEventListener("dispose",A),R(b),b.isVideoTexture&&h.delete(b)}function w(C){let b=C.target;b.removeEventListener("dispose",w),N(b)}function R(C){let b=n.get(C);if(b.__webglInit===void 0)return;let z=C.source,K=d.get(z);if(K){let $=K[b.__cacheKey];$.usedTimes--,$.usedTimes===0&&I(C),Object.keys(K).length===0&&d.delete(z)}n.remove(C)}function I(C){let b=n.get(C);s.deleteTexture(b.__webglTexture);let z=C.source,K=d.get(z);delete K[b.__cacheKey],o.memory.textures--}function N(C){let b=n.get(C);if(C.depthTexture&&C.depthTexture.dispose(),C.isWebGLCubeRenderTarget)for(let K=0;K<6;K++){if(Array.isArray(b.__webglFramebuffer[K]))for(let $=0;$<b.__webglFramebuffer[K].length;$++)s.deleteFramebuffer(b.__webglFramebuffer[K][$]);else s.deleteFramebuffer(b.__webglFramebuffer[K]);b.__webglDepthbuffer&&s.deleteRenderbuffer(b.__webglDepthbuffer[K])}else{if(Array.isArray(b.__webglFramebuffer))for(let K=0;K<b.__webglFramebuffer.length;K++)s.deleteFramebuffer(b.__webglFramebuffer[K]);else s.deleteFramebuffer(b.__webglFramebuffer);if(b.__webglDepthbuffer&&s.deleteRenderbuffer(b.__webglDepthbuffer),b.__webglMultisampledFramebuffer&&s.deleteFramebuffer(b.__webglMultisampledFramebuffer),b.__webglColorRenderbuffer)for(let K=0;K<b.__webglColorRenderbuffer.length;K++)b.__webglColorRenderbuffer[K]&&s.deleteRenderbuffer(b.__webglColorRenderbuffer[K]);b.__webglDepthRenderbuffer&&s.deleteRenderbuffer(b.__webglDepthRenderbuffer)}let z=C.textures;for(let K=0,$=z.length;K<$;K++){let q=n.get(z[K]);q.__webglTexture&&(s.deleteTexture(q.__webglTexture),o.memory.textures--),n.remove(z[K])}n.remove(C)}let v=0;function S(){v=0}function F(){let C=v;return C>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+C+" texture units while this GPU supports only "+i.maxTextures),v+=1,C}function B(C){let b=[];return b.push(C.wrapS),b.push(C.wrapT),b.push(C.wrapR||0),b.push(C.magFilter),b.push(C.minFilter),b.push(C.anisotropy),b.push(C.internalFormat),b.push(C.format),b.push(C.type),b.push(C.generateMipmaps),b.push(C.premultiplyAlpha),b.push(C.flipY),b.push(C.unpackAlignment),b.push(C.colorSpace),b.join()}function G(C,b){let z=n.get(C);if(C.isVideoTexture&&Re(C),C.isRenderTargetTexture===!1&&C.version>0&&z.__version!==C.version){let K=C.image;if(K===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(K.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{De(z,C,b);return}}t.bindTexture(s.TEXTURE_2D,z.__webglTexture,s.TEXTURE0+b)}function Y(C,b){let z=n.get(C);if(C.version>0&&z.__version!==C.version){De(z,C,b);return}t.bindTexture(s.TEXTURE_2D_ARRAY,z.__webglTexture,s.TEXTURE0+b)}function P(C,b){let z=n.get(C);if(C.version>0&&z.__version!==C.version){De(z,C,b);return}t.bindTexture(s.TEXTURE_3D,z.__webglTexture,s.TEXTURE0+b)}function j(C,b){let z=n.get(C);if(C.version>0&&z.__version!==C.version){X(z,C,b);return}t.bindTexture(s.TEXTURE_CUBE_MAP,z.__webglTexture,s.TEXTURE0+b)}let k={[Sn]:s.REPEAT,[Mn]:s.CLAMP_TO_EDGE,[Ri]:s.MIRRORED_REPEAT},J={[Ct]:s.NEAREST,[ur]:s.NEAREST_MIPMAP_NEAREST,[ti]:s.NEAREST_MIPMAP_LINEAR,[Rt]:s.LINEAR,[Ai]:s.LINEAR_MIPMAP_NEAREST,[Xt]:s.LINEAR_MIPMAP_LINEAR},ee={[rp]:s.NEVER,[up]:s.ALWAYS,[op]:s.LESS,[Md]:s.LEQUAL,[ap]:s.EQUAL,[hp]:s.GEQUAL,[cp]:s.GREATER,[lp]:s.NOTEQUAL};function re(C,b){if(b.type===bn&&e.has("OES_texture_float_linear")===!1&&(b.magFilter===Rt||b.magFilter===Ai||b.magFilter===ti||b.magFilter===Xt||b.minFilter===Rt||b.minFilter===Ai||b.minFilter===ti||b.minFilter===Xt)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),s.texParameteri(C,s.TEXTURE_WRAP_S,k[b.wrapS]),s.texParameteri(C,s.TEXTURE_WRAP_T,k[b.wrapT]),(C===s.TEXTURE_3D||C===s.TEXTURE_2D_ARRAY)&&s.texParameteri(C,s.TEXTURE_WRAP_R,k[b.wrapR]),s.texParameteri(C,s.TEXTURE_MAG_FILTER,J[b.magFilter]),s.texParameteri(C,s.TEXTURE_MIN_FILTER,J[b.minFilter]),b.compareFunction&&(s.texParameteri(C,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(C,s.TEXTURE_COMPARE_FUNC,ee[b.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(b.magFilter===Ct||b.minFilter!==ti&&b.minFilter!==Xt||b.type===bn&&e.has("OES_texture_float_linear")===!1)return;if(b.anisotropy>1||n.get(b).__currentAnisotropy){let z=e.get("EXT_texture_filter_anisotropic");s.texParameterf(C,z.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(b.anisotropy,i.getMaxAnisotropy())),n.get(b).__currentAnisotropy=b.anisotropy}}}function Ae(C,b){let z=!1;C.__webglInit===void 0&&(C.__webglInit=!0,b.addEventListener("dispose",A));let K=b.source,$=d.get(K);$===void 0&&($={},d.set(K,$));let q=B(b);if(q!==C.__cacheKey){$[q]===void 0&&($[q]={texture:s.createTexture(),usedTimes:0},o.memory.textures++,z=!0),$[q].usedTimes++;let xe=$[C.__cacheKey];xe!==void 0&&($[C.__cacheKey].usedTimes--,xe.usedTimes===0&&I(b)),C.__cacheKey=q,C.__webglTexture=$[q].texture}return z}function De(C,b,z){let K=s.TEXTURE_2D;(b.isDataArrayTexture||b.isCompressedArrayTexture)&&(K=s.TEXTURE_2D_ARRAY),b.isData3DTexture&&(K=s.TEXTURE_3D);let $=Ae(C,b),q=b.source;t.bindTexture(K,C.__webglTexture,s.TEXTURE0+z);let xe=n.get(q);if(q.version!==xe.__version||$===!0){t.activeTexture(s.TEXTURE0+z);let oe=Ye.getPrimaries(Ye.workingColorSpace),fe=b.colorSpace===Rn?null:Ye.getPrimaries(b.colorSpace),Ke=b.colorSpace===Rn||oe===fe?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,b.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,b.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ke);let te=_(b.image,!1,i.maxTextureSize);te=ot(b,te);let pe=r.convert(b.format,b.colorSpace),Ce=r.convert(b.type),Ie=M(b.internalFormat,pe,Ce,b.colorSpace,b.isVideoTexture);re(K,b);let me,Ve=b.mipmaps,Ue=b.isVideoTexture!==!0,rt=xe.__version===void 0||$===!0,D=q.dataReady,ue=y(b,te);if(b.isDepthTexture)Ie=x(b.format===us,b.type),rt&&(Ue?t.texStorage2D(s.TEXTURE_2D,1,Ie,te.width,te.height):t.texImage2D(s.TEXTURE_2D,0,Ie,te.width,te.height,0,pe,Ce,null));else if(b.isDataTexture)if(Ve.length>0){Ue&&rt&&t.texStorage2D(s.TEXTURE_2D,ue,Ie,Ve[0].width,Ve[0].height);for(let W=0,Z=Ve.length;W<Z;W++)me=Ve[W],Ue?D&&t.texSubImage2D(s.TEXTURE_2D,W,0,0,me.width,me.height,pe,Ce,me.data):t.texImage2D(s.TEXTURE_2D,W,Ie,me.width,me.height,0,pe,Ce,me.data);b.generateMipmaps=!1}else Ue?(rt&&t.texStorage2D(s.TEXTURE_2D,ue,Ie,te.width,te.height),D&&t.texSubImage2D(s.TEXTURE_2D,0,0,0,te.width,te.height,pe,Ce,te.data)):t.texImage2D(s.TEXTURE_2D,0,Ie,te.width,te.height,0,pe,Ce,te.data);else if(b.isCompressedTexture)if(b.isCompressedArrayTexture){Ue&&rt&&t.texStorage3D(s.TEXTURE_2D_ARRAY,ue,Ie,Ve[0].width,Ve[0].height,te.depth);for(let W=0,Z=Ve.length;W<Z;W++)if(me=Ve[W],b.format!==Ot)if(pe!==null)if(Ue){if(D)if(b.layerUpdates.size>0){let ae=Bu(me.width,me.height,b.format,b.type);for(let de of b.layerUpdates){let Xe=me.data.subarray(de*ae/me.data.BYTES_PER_ELEMENT,(de+1)*ae/me.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,W,0,0,de,me.width,me.height,1,pe,Xe,0,0)}b.clearLayerUpdates()}else t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,W,0,0,0,me.width,me.height,te.depth,pe,me.data,0,0)}else t.compressedTexImage3D(s.TEXTURE_2D_ARRAY,W,Ie,me.width,me.height,te.depth,0,me.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ue?D&&t.texSubImage3D(s.TEXTURE_2D_ARRAY,W,0,0,0,me.width,me.height,te.depth,pe,Ce,me.data):t.texImage3D(s.TEXTURE_2D_ARRAY,W,Ie,me.width,me.height,te.depth,0,pe,Ce,me.data)}else{Ue&&rt&&t.texStorage2D(s.TEXTURE_2D,ue,Ie,Ve[0].width,Ve[0].height);for(let W=0,Z=Ve.length;W<Z;W++)me=Ve[W],b.format!==Ot?pe!==null?Ue?D&&t.compressedTexSubImage2D(s.TEXTURE_2D,W,0,0,me.width,me.height,pe,me.data):t.compressedTexImage2D(s.TEXTURE_2D,W,Ie,me.width,me.height,0,me.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ue?D&&t.texSubImage2D(s.TEXTURE_2D,W,0,0,me.width,me.height,pe,Ce,me.data):t.texImage2D(s.TEXTURE_2D,W,Ie,me.width,me.height,0,pe,Ce,me.data)}else if(b.isDataArrayTexture)if(Ue){if(rt&&t.texStorage3D(s.TEXTURE_2D_ARRAY,ue,Ie,te.width,te.height,te.depth),D)if(b.layerUpdates.size>0){let W=Bu(te.width,te.height,b.format,b.type);for(let Z of b.layerUpdates){let ae=te.data.subarray(Z*W/te.data.BYTES_PER_ELEMENT,(Z+1)*W/te.data.BYTES_PER_ELEMENT);t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,Z,te.width,te.height,1,pe,Ce,ae)}b.clearLayerUpdates()}else t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,te.width,te.height,te.depth,pe,Ce,te.data)}else t.texImage3D(s.TEXTURE_2D_ARRAY,0,Ie,te.width,te.height,te.depth,0,pe,Ce,te.data);else if(b.isData3DTexture)Ue?(rt&&t.texStorage3D(s.TEXTURE_3D,ue,Ie,te.width,te.height,te.depth),D&&t.texSubImage3D(s.TEXTURE_3D,0,0,0,0,te.width,te.height,te.depth,pe,Ce,te.data)):t.texImage3D(s.TEXTURE_3D,0,Ie,te.width,te.height,te.depth,0,pe,Ce,te.data);else if(b.isFramebufferTexture){if(rt)if(Ue)t.texStorage2D(s.TEXTURE_2D,ue,Ie,te.width,te.height);else{let W=te.width,Z=te.height;for(let ae=0;ae<ue;ae++)t.texImage2D(s.TEXTURE_2D,ae,Ie,W,Z,0,pe,Ce,null),W>>=1,Z>>=1}}else if(Ve.length>0){if(Ue&&rt){let W=Pe(Ve[0]);t.texStorage2D(s.TEXTURE_2D,ue,Ie,W.width,W.height)}for(let W=0,Z=Ve.length;W<Z;W++)me=Ve[W],Ue?D&&t.texSubImage2D(s.TEXTURE_2D,W,0,0,pe,Ce,me):t.texImage2D(s.TEXTURE_2D,W,Ie,pe,Ce,me);b.generateMipmaps=!1}else if(Ue){if(rt){let W=Pe(te);t.texStorage2D(s.TEXTURE_2D,ue,Ie,W.width,W.height)}D&&t.texSubImage2D(s.TEXTURE_2D,0,0,0,pe,Ce,te)}else t.texImage2D(s.TEXTURE_2D,0,Ie,pe,Ce,te);p(b)&&g(K),xe.__version=q.version,b.onUpdate&&b.onUpdate(b)}C.__version=b.version}function X(C,b,z){if(b.image.length!==6)return;let K=Ae(C,b),$=b.source;t.bindTexture(s.TEXTURE_CUBE_MAP,C.__webglTexture,s.TEXTURE0+z);let q=n.get($);if($.version!==q.__version||K===!0){t.activeTexture(s.TEXTURE0+z);let xe=Ye.getPrimaries(Ye.workingColorSpace),oe=b.colorSpace===Rn?null:Ye.getPrimaries(b.colorSpace),fe=b.colorSpace===Rn||xe===oe?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,b.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,b.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,fe);let Ke=b.isCompressedTexture||b.image[0].isCompressedTexture,te=b.image[0]&&b.image[0].isDataTexture,pe=[];for(let Z=0;Z<6;Z++)!Ke&&!te?pe[Z]=_(b.image[Z],!0,i.maxCubemapSize):pe[Z]=te?b.image[Z].image:b.image[Z],pe[Z]=ot(b,pe[Z]);let Ce=pe[0],Ie=r.convert(b.format,b.colorSpace),me=r.convert(b.type),Ve=M(b.internalFormat,Ie,me,b.colorSpace),Ue=b.isVideoTexture!==!0,rt=q.__version===void 0||K===!0,D=$.dataReady,ue=y(b,Ce);re(s.TEXTURE_CUBE_MAP,b);let W;if(Ke){Ue&&rt&&t.texStorage2D(s.TEXTURE_CUBE_MAP,ue,Ve,Ce.width,Ce.height);for(let Z=0;Z<6;Z++){W=pe[Z].mipmaps;for(let ae=0;ae<W.length;ae++){let de=W[ae];b.format!==Ot?Ie!==null?Ue?D&&t.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Z,ae,0,0,de.width,de.height,Ie,de.data):t.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Z,ae,Ve,de.width,de.height,0,de.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ue?D&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Z,ae,0,0,de.width,de.height,Ie,me,de.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Z,ae,Ve,de.width,de.height,0,Ie,me,de.data)}}}else{if(W=b.mipmaps,Ue&&rt){W.length>0&&ue++;let Z=Pe(pe[0]);t.texStorage2D(s.TEXTURE_CUBE_MAP,ue,Ve,Z.width,Z.height)}for(let Z=0;Z<6;Z++)if(te){Ue?D&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Z,0,0,0,pe[Z].width,pe[Z].height,Ie,me,pe[Z].data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Z,0,Ve,pe[Z].width,pe[Z].height,0,Ie,me,pe[Z].data);for(let ae=0;ae<W.length;ae++){let Xe=W[ae].image[Z].image;Ue?D&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Z,ae+1,0,0,Xe.width,Xe.height,Ie,me,Xe.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Z,ae+1,Ve,Xe.width,Xe.height,0,Ie,me,Xe.data)}}else{Ue?D&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Z,0,0,0,Ie,me,pe[Z]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Z,0,Ve,Ie,me,pe[Z]);for(let ae=0;ae<W.length;ae++){let de=W[ae];Ue?D&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Z,ae+1,0,0,Ie,me,de.image[Z]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Z,ae+1,Ve,Ie,me,de.image[Z])}}}p(b)&&g(s.TEXTURE_CUBE_MAP),q.__version=$.version,b.onUpdate&&b.onUpdate(b)}C.__version=b.version}function Q(C,b,z,K,$,q){let xe=r.convert(z.format,z.colorSpace),oe=r.convert(z.type),fe=M(z.internalFormat,xe,oe,z.colorSpace);if(!n.get(b).__hasExternalTextures){let te=Math.max(1,b.width>>q),pe=Math.max(1,b.height>>q);$===s.TEXTURE_3D||$===s.TEXTURE_2D_ARRAY?t.texImage3D($,q,fe,te,pe,b.depth,0,xe,oe,null):t.texImage2D($,q,fe,te,pe,0,xe,oe,null)}t.bindFramebuffer(s.FRAMEBUFFER,C),qe(b)?a.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,K,$,n.get(z).__webglTexture,0,He(b)):($===s.TEXTURE_2D||$>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&$<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,K,$,n.get(z).__webglTexture,q),t.bindFramebuffer(s.FRAMEBUFFER,null)}function he(C,b,z){if(s.bindRenderbuffer(s.RENDERBUFFER,C),b.depthBuffer){let K=b.depthTexture,$=K&&K.isDepthTexture?K.type:null,q=x(b.stencilBuffer,$),xe=b.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,oe=He(b);qe(b)?a.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,oe,q,b.width,b.height):z?s.renderbufferStorageMultisample(s.RENDERBUFFER,oe,q,b.width,b.height):s.renderbufferStorage(s.RENDERBUFFER,q,b.width,b.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,xe,s.RENDERBUFFER,C)}else{let K=b.textures;for(let $=0;$<K.length;$++){let q=K[$],xe=r.convert(q.format,q.colorSpace),oe=r.convert(q.type),fe=M(q.internalFormat,xe,oe,q.colorSpace),Ke=He(b);z&&qe(b)===!1?s.renderbufferStorageMultisample(s.RENDERBUFFER,Ke,fe,b.width,b.height):qe(b)?a.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,Ke,fe,b.width,b.height):s.renderbufferStorage(s.RENDERBUFFER,fe,b.width,b.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function le(C,b){if(b&&b.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(s.FRAMEBUFFER,C),!(b.depthTexture&&b.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(b.depthTexture).__webglTexture||b.depthTexture.image.width!==b.width||b.depthTexture.image.height!==b.height)&&(b.depthTexture.image.width=b.width,b.depthTexture.image.height=b.height,b.depthTexture.needsUpdate=!0),G(b.depthTexture,0);let K=n.get(b.depthTexture).__webglTexture,$=He(b);if(b.depthTexture.format===ss)qe(b)?a.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,K,0,$):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,K,0);else if(b.depthTexture.format===us)qe(b)?a.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,K,0,$):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,K,0);else throw new Error("Unknown depthTexture format")}function Ne(C){let b=n.get(C),z=C.isWebGLCubeRenderTarget===!0;if(b.__boundDepthTexture!==C.depthTexture){let K=C.depthTexture;if(b.__depthDisposeCallback&&b.__depthDisposeCallback(),K){let $=()=>{delete b.__boundDepthTexture,delete b.__depthDisposeCallback,K.removeEventListener("dispose",$)};K.addEventListener("dispose",$),b.__depthDisposeCallback=$}b.__boundDepthTexture=K}if(C.depthTexture&&!b.__autoAllocateDepthBuffer){if(z)throw new Error("target.depthTexture not supported in Cube render targets");le(b.__webglFramebuffer,C)}else if(z){b.__webglDepthbuffer=[];for(let K=0;K<6;K++)if(t.bindFramebuffer(s.FRAMEBUFFER,b.__webglFramebuffer[K]),b.__webglDepthbuffer[K]===void 0)b.__webglDepthbuffer[K]=s.createRenderbuffer(),he(b.__webglDepthbuffer[K],C,!1);else{let $=C.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,q=b.__webglDepthbuffer[K];s.bindRenderbuffer(s.RENDERBUFFER,q),s.framebufferRenderbuffer(s.FRAMEBUFFER,$,s.RENDERBUFFER,q)}}else if(t.bindFramebuffer(s.FRAMEBUFFER,b.__webglFramebuffer),b.__webglDepthbuffer===void 0)b.__webglDepthbuffer=s.createRenderbuffer(),he(b.__webglDepthbuffer,C,!1);else{let K=C.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,$=b.__webglDepthbuffer;s.bindRenderbuffer(s.RENDERBUFFER,$),s.framebufferRenderbuffer(s.FRAMEBUFFER,K,s.RENDERBUFFER,$)}t.bindFramebuffer(s.FRAMEBUFFER,null)}function we(C,b,z){let K=n.get(C);b!==void 0&&Q(K.__webglFramebuffer,C,C.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),z!==void 0&&Ne(C)}function Ge(C){let b=C.texture,z=n.get(C),K=n.get(b);C.addEventListener("dispose",w);let $=C.textures,q=C.isWebGLCubeRenderTarget===!0,xe=$.length>1;if(xe||(K.__webglTexture===void 0&&(K.__webglTexture=s.createTexture()),K.__version=b.version,o.memory.textures++),q){z.__webglFramebuffer=[];for(let oe=0;oe<6;oe++)if(b.mipmaps&&b.mipmaps.length>0){z.__webglFramebuffer[oe]=[];for(let fe=0;fe<b.mipmaps.length;fe++)z.__webglFramebuffer[oe][fe]=s.createFramebuffer()}else z.__webglFramebuffer[oe]=s.createFramebuffer()}else{if(b.mipmaps&&b.mipmaps.length>0){z.__webglFramebuffer=[];for(let oe=0;oe<b.mipmaps.length;oe++)z.__webglFramebuffer[oe]=s.createFramebuffer()}else z.__webglFramebuffer=s.createFramebuffer();if(xe)for(let oe=0,fe=$.length;oe<fe;oe++){let Ke=n.get($[oe]);Ke.__webglTexture===void 0&&(Ke.__webglTexture=s.createTexture(),o.memory.textures++)}if(C.samples>0&&qe(C)===!1){z.__webglMultisampledFramebuffer=s.createFramebuffer(),z.__webglColorRenderbuffer=[],t.bindFramebuffer(s.FRAMEBUFFER,z.__webglMultisampledFramebuffer);for(let oe=0;oe<$.length;oe++){let fe=$[oe];z.__webglColorRenderbuffer[oe]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,z.__webglColorRenderbuffer[oe]);let Ke=r.convert(fe.format,fe.colorSpace),te=r.convert(fe.type),pe=M(fe.internalFormat,Ke,te,fe.colorSpace,C.isXRRenderTarget===!0),Ce=He(C);s.renderbufferStorageMultisample(s.RENDERBUFFER,Ce,pe,C.width,C.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+oe,s.RENDERBUFFER,z.__webglColorRenderbuffer[oe])}s.bindRenderbuffer(s.RENDERBUFFER,null),C.depthBuffer&&(z.__webglDepthRenderbuffer=s.createRenderbuffer(),he(z.__webglDepthRenderbuffer,C,!0)),t.bindFramebuffer(s.FRAMEBUFFER,null)}}if(q){t.bindTexture(s.TEXTURE_CUBE_MAP,K.__webglTexture),re(s.TEXTURE_CUBE_MAP,b);for(let oe=0;oe<6;oe++)if(b.mipmaps&&b.mipmaps.length>0)for(let fe=0;fe<b.mipmaps.length;fe++)Q(z.__webglFramebuffer[oe][fe],C,b,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,fe);else Q(z.__webglFramebuffer[oe],C,b,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0);p(b)&&g(s.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(xe){for(let oe=0,fe=$.length;oe<fe;oe++){let Ke=$[oe],te=n.get(Ke);t.bindTexture(s.TEXTURE_2D,te.__webglTexture),re(s.TEXTURE_2D,Ke),Q(z.__webglFramebuffer,C,Ke,s.COLOR_ATTACHMENT0+oe,s.TEXTURE_2D,0),p(Ke)&&g(s.TEXTURE_2D)}t.unbindTexture()}else{let oe=s.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(oe=C.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture(oe,K.__webglTexture),re(oe,b),b.mipmaps&&b.mipmaps.length>0)for(let fe=0;fe<b.mipmaps.length;fe++)Q(z.__webglFramebuffer[fe],C,b,s.COLOR_ATTACHMENT0,oe,fe);else Q(z.__webglFramebuffer,C,b,s.COLOR_ATTACHMENT0,oe,0);p(b)&&g(oe),t.unbindTexture()}C.depthBuffer&&Ne(C)}function nt(C){let b=C.textures;for(let z=0,K=b.length;z<K;z++){let $=b[z];if(p($)){let q=C.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:s.TEXTURE_2D,xe=n.get($).__webglTexture;t.bindTexture(q,xe),g(q),t.unbindTexture()}}}let We=[],L=[];function Zt(C){if(C.samples>0){if(qe(C)===!1){let b=C.textures,z=C.width,K=C.height,$=s.COLOR_BUFFER_BIT,q=C.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,xe=n.get(C),oe=b.length>1;if(oe)for(let fe=0;fe<b.length;fe++)t.bindFramebuffer(s.FRAMEBUFFER,xe.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+fe,s.RENDERBUFFER,null),t.bindFramebuffer(s.FRAMEBUFFER,xe.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+fe,s.TEXTURE_2D,null,0);t.bindFramebuffer(s.READ_FRAMEBUFFER,xe.__webglMultisampledFramebuffer),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,xe.__webglFramebuffer);for(let fe=0;fe<b.length;fe++){if(C.resolveDepthBuffer&&(C.depthBuffer&&($|=s.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&($|=s.STENCIL_BUFFER_BIT)),oe){s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,xe.__webglColorRenderbuffer[fe]);let Ke=n.get(b[fe]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,Ke,0)}s.blitFramebuffer(0,0,z,K,0,0,z,K,$,s.NEAREST),c===!0&&(We.length=0,L.length=0,We.push(s.COLOR_ATTACHMENT0+fe),C.depthBuffer&&C.resolveDepthBuffer===!1&&(We.push(q),L.push(q),s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,L)),s.invalidateFramebuffer(s.READ_FRAMEBUFFER,We))}if(t.bindFramebuffer(s.READ_FRAMEBUFFER,null),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),oe)for(let fe=0;fe<b.length;fe++){t.bindFramebuffer(s.FRAMEBUFFER,xe.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+fe,s.RENDERBUFFER,xe.__webglColorRenderbuffer[fe]);let Ke=n.get(b[fe]).__webglTexture;t.bindFramebuffer(s.FRAMEBUFFER,xe.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+fe,s.TEXTURE_2D,Ke,0)}t.bindFramebuffer(s.DRAW_FRAMEBUFFER,xe.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.resolveDepthBuffer===!1&&c){let b=C.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[b])}}}function He(C){return Math.min(i.maxSamples,C.samples)}function qe(C){let b=n.get(C);return C.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&b.__useRenderToTexture!==!1}function Re(C){let b=o.render.frame;h.get(C)!==b&&(h.set(C,b),C.update())}function ot(C,b){let z=C.colorSpace,K=C.format,$=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||z!==Pt&&z!==Rn&&(Ye.getTransfer(z)===ct?(K!==Ot||$!==Hn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",z)),b}function Pe(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(l.width=C.naturalWidth||C.width,l.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(l.width=C.displayWidth,l.height=C.displayHeight):(l.width=C.width,l.height=C.height),l}this.allocateTextureUnit=F,this.resetTextureUnits=S,this.setTexture2D=G,this.setTexture2DArray=Y,this.setTexture3D=P,this.setTextureCube=j,this.rebindTextures=we,this.setupRenderTarget=Ge,this.updateRenderTargetMipmap=nt,this.updateMultisampleRenderTarget=Zt,this.setupDepthRenderbuffer=Ne,this.setupFrameBufferTexture=Q,this.useMultisampledRTT=qe}function xy(s,e){function t(n,i=Rn){let r,o=Ye.getTransfer(i);if(n===Hn)return s.UNSIGNED_BYTE;if(n===_l)return s.UNSIGNED_SHORT_4_4_4_4;if(n===yl)return s.UNSIGNED_SHORT_5_5_5_1;if(n===dd)return s.UNSIGNED_INT_5_9_9_9_REV;if(n===hd)return s.BYTE;if(n===ud)return s.SHORT;if(n===qs)return s.UNSIGNED_SHORT;if(n===gl)return s.INT;if(n===Ci)return s.UNSIGNED_INT;if(n===bn)return s.FLOAT;if(n===dr)return s.HALF_FLOAT;if(n===fd)return s.ALPHA;if(n===pd)return s.RGB;if(n===Ot)return s.RGBA;if(n===md)return s.LUMINANCE;if(n===gd)return s.LUMINANCE_ALPHA;if(n===ss)return s.DEPTH_COMPONENT;if(n===us)return s.DEPTH_STENCIL;if(n===xl)return s.RED;if(n===vl)return s.RED_INTEGER;if(n===_d)return s.RG;if(n===Ml)return s.RG_INTEGER;if(n===bl)return s.RGBA_INTEGER;if(n===Qr||n===eo||n===to||n===no)if(o===ct)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Qr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===eo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===to)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===no)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Qr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===eo)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===to)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===no)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===oc||n===ac||n===cc||n===lc)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===oc)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===ac)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===cc)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===lc)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===hc||n===uc||n===dc)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===hc||n===uc)return o===ct?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===dc)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===fc||n===pc||n===mc||n===gc||n===_c||n===yc||n===xc||n===vc||n===Mc||n===bc||n===Sc||n===Tc||n===wc||n===Ec)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===fc)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===pc)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===mc)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===gc)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===_c)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===yc)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===xc)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===vc)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Mc)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===bc)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Sc)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Tc)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===wc)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Ec)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===io||n===Ac||n===Rc)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===io)return o===ct?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Ac)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Rc)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===yd||n===Cc||n===Ic||n===Pc)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===io)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Cc)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Ic)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Pc)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===hs?s.UNSIGNED_INT_24_8:s[n]!==void 0?s[n]:null}return{convert:t}}var Yc=class extends _t{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},it=class extends ft{constructor(){super(),this.isGroup=!0,this.type="Group"}},vy={type:"move"},Gs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new it,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new it,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new E,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new E),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new it,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new E,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new E),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,r=null,o=null,a=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){o=!0;for(let _ of e.hand.values()){let p=t.getJointPose(_,n),g=this._getHandJoint(l,_);p!==null&&(g.matrix.fromArray(p.transform.matrix),g.matrix.decompose(g.position,g.rotation,g.scale),g.matrixWorldNeedsUpdate=!0,g.jointRadius=p.radius),g.visible=p!==null}let h=l.joints["index-finger-tip"],u=l.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,m=.005;l.inputState.pinching&&d>f+m?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&d<=f-m&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(a.matrix.fromArray(i.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,i.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(i.linearVelocity)):a.hasLinearVelocity=!1,i.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(i.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(vy)))}return a!==null&&(a.visible=i!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new it;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},My=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,by=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,qc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,n){if(this.texture===null){let i=new bt,r=e.properties.get(i);r.__webglTexture=t.texture,(t.depthNear!=n.depthNear||t.depthFar!=n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new hn({vertexShader:My,fragmentShader:by,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ye(new ms(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Kc=class extends In{constructor(e,t){super();let n=this,i=null,r=1,o=null,a="local-floor",c=1,l=null,h=null,u=null,d=null,f=null,m=null,_=new qc,p=t.getContextAttributes(),g=null,M=null,x=[],y=[],A=new ie,w=null,R=new _t;R.layers.enable(1),R.viewport=new je;let I=new _t;I.layers.enable(2),I.viewport=new je;let N=[R,I],v=new Yc;v.layers.enable(1),v.layers.enable(2);let S=null,F=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(X){let Q=x[X];return Q===void 0&&(Q=new Gs,x[X]=Q),Q.getTargetRaySpace()},this.getControllerGrip=function(X){let Q=x[X];return Q===void 0&&(Q=new Gs,x[X]=Q),Q.getGripSpace()},this.getHand=function(X){let Q=x[X];return Q===void 0&&(Q=new Gs,x[X]=Q),Q.getHandSpace()};function B(X){let Q=y.indexOf(X.inputSource);if(Q===-1)return;let he=x[Q];he!==void 0&&(he.update(X.inputSource,X.frame,l||o),he.dispatchEvent({type:X.type,data:X.inputSource}))}function G(){i.removeEventListener("select",B),i.removeEventListener("selectstart",B),i.removeEventListener("selectend",B),i.removeEventListener("squeeze",B),i.removeEventListener("squeezestart",B),i.removeEventListener("squeezeend",B),i.removeEventListener("end",G),i.removeEventListener("inputsourceschange",Y);for(let X=0;X<x.length;X++){let Q=y[X];Q!==null&&(y[X]=null,x[X].disconnect(Q))}S=null,F=null,_.reset(),e.setRenderTarget(g),f=null,d=null,u=null,i=null,M=null,De.stop(),n.isPresenting=!1,e.setPixelRatio(w),e.setSize(A.width,A.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(X){r=X,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(X){a=X,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(X){l=X},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u},this.getFrame=function(){return m},this.getSession=function(){return i},this.setSession=async function(X){if(i=X,i!==null){if(g=e.getRenderTarget(),i.addEventListener("select",B),i.addEventListener("selectstart",B),i.addEventListener("selectend",B),i.addEventListener("squeeze",B),i.addEventListener("squeezestart",B),i.addEventListener("squeezeend",B),i.addEventListener("end",G),i.addEventListener("inputsourceschange",Y),p.xrCompatible!==!0&&await t.makeXRCompatible(),w=e.getPixelRatio(),e.getSize(A),i.renderState.layers===void 0){let Q={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(i,t,Q),i.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),M=new Vn(f.framebufferWidth,f.framebufferHeight,{format:Ot,type:Hn,colorSpace:e.outputColorSpace,stencilBuffer:p.stencil})}else{let Q=null,he=null,le=null;p.depth&&(le=p.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Q=p.stencil?us:ss,he=p.stencil?hs:Ci);let Ne={colorFormat:t.RGBA8,depthFormat:le,scaleFactor:r};u=new XRWebGLBinding(i,t),d=u.createProjectionLayer(Ne),i.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),M=new Vn(d.textureWidth,d.textureHeight,{format:Ot,type:Hn,depthTexture:new _o(d.textureWidth,d.textureHeight,he,void 0,void 0,void 0,void 0,void 0,void 0,Q),stencilBuffer:p.stencil,colorSpace:e.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await i.requestReferenceSpace(a),De.setContext(i),De.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function Y(X){for(let Q=0;Q<X.removed.length;Q++){let he=X.removed[Q],le=y.indexOf(he);le>=0&&(y[le]=null,x[le].disconnect(he))}for(let Q=0;Q<X.added.length;Q++){let he=X.added[Q],le=y.indexOf(he);if(le===-1){for(let we=0;we<x.length;we++)if(we>=y.length){y.push(he),le=we;break}else if(y[we]===null){y[we]=he,le=we;break}if(le===-1)break}let Ne=x[le];Ne&&Ne.connect(he)}}let P=new E,j=new E;function k(X,Q,he){P.setFromMatrixPosition(Q.matrixWorld),j.setFromMatrixPosition(he.matrixWorld);let le=P.distanceTo(j),Ne=Q.projectionMatrix.elements,we=he.projectionMatrix.elements,Ge=Ne[14]/(Ne[10]-1),nt=Ne[14]/(Ne[10]+1),We=(Ne[9]+1)/Ne[5],L=(Ne[9]-1)/Ne[5],Zt=(Ne[8]-1)/Ne[0],He=(we[8]+1)/we[0],qe=Ge*Zt,Re=Ge*He,ot=le/(-Zt+He),Pe=ot*-Zt;if(Q.matrixWorld.decompose(X.position,X.quaternion,X.scale),X.translateX(Pe),X.translateZ(ot),X.matrixWorld.compose(X.position,X.quaternion,X.scale),X.matrixWorldInverse.copy(X.matrixWorld).invert(),Ne[10]===-1)X.projectionMatrix.copy(Q.projectionMatrix),X.projectionMatrixInverse.copy(Q.projectionMatrixInverse);else{let C=Ge+ot,b=nt+ot,z=qe-Pe,K=Re+(le-Pe),$=We*nt/b*C,q=L*nt/b*C;X.projectionMatrix.makePerspective(z,K,$,q,C,b),X.projectionMatrixInverse.copy(X.projectionMatrix).invert()}}function J(X,Q){Q===null?X.matrixWorld.copy(X.matrix):X.matrixWorld.multiplyMatrices(Q.matrixWorld,X.matrix),X.matrixWorldInverse.copy(X.matrixWorld).invert()}this.updateCamera=function(X){if(i===null)return;let Q=X.near,he=X.far;_.texture!==null&&(_.depthNear>0&&(Q=_.depthNear),_.depthFar>0&&(he=_.depthFar)),v.near=I.near=R.near=Q,v.far=I.far=R.far=he,(S!==v.near||F!==v.far)&&(i.updateRenderState({depthNear:v.near,depthFar:v.far}),S=v.near,F=v.far);let le=X.parent,Ne=v.cameras;J(v,le);for(let we=0;we<Ne.length;we++)J(Ne[we],le);Ne.length===2?k(v,R,I):v.projectionMatrix.copy(R.projectionMatrix),ee(X,v,le)};function ee(X,Q,he){he===null?X.matrix.copy(Q.matrixWorld):(X.matrix.copy(he.matrixWorld),X.matrix.invert(),X.matrix.multiply(Q.matrixWorld)),X.matrix.decompose(X.position,X.quaternion,X.scale),X.updateMatrixWorld(!0),X.projectionMatrix.copy(Q.projectionMatrix),X.projectionMatrixInverse.copy(Q.projectionMatrixInverse),X.isPerspectiveCamera&&(X.fov=ds*2*Math.atan(1/X.projectionMatrix.elements[5]),X.zoom=1)}this.getCamera=function(){return v},this.getFoveation=function(){if(!(d===null&&f===null))return c},this.setFoveation=function(X){c=X,d!==null&&(d.fixedFoveation=X),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=X)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(v)};let re=null;function Ae(X,Q){if(h=Q.getViewerPose(l||o),m=Q,h!==null){let he=h.views;f!==null&&(e.setRenderTargetFramebuffer(M,f.framebuffer),e.setRenderTarget(M));let le=!1;he.length!==v.cameras.length&&(v.cameras.length=0,le=!0);for(let we=0;we<he.length;we++){let Ge=he[we],nt=null;if(f!==null)nt=f.getViewport(Ge);else{let L=u.getViewSubImage(d,Ge);nt=L.viewport,we===0&&(e.setRenderTargetTextures(M,L.colorTexture,d.ignoreDepthValues?void 0:L.depthStencilTexture),e.setRenderTarget(M))}let We=N[we];We===void 0&&(We=new _t,We.layers.enable(we),We.viewport=new je,N[we]=We),We.matrix.fromArray(Ge.transform.matrix),We.matrix.decompose(We.position,We.quaternion,We.scale),We.projectionMatrix.fromArray(Ge.projectionMatrix),We.projectionMatrixInverse.copy(We.projectionMatrix).invert(),We.viewport.set(nt.x,nt.y,nt.width,nt.height),we===0&&(v.matrix.copy(We.matrix),v.matrix.decompose(v.position,v.quaternion,v.scale)),le===!0&&v.cameras.push(We)}let Ne=i.enabledFeatures;if(Ne&&Ne.includes("depth-sensing")){let we=u.getDepthInformation(he[0]);we&&we.isValid&&we.texture&&_.init(e,we,i.renderState)}}for(let he=0;he<x.length;he++){let le=y[he],Ne=x[he];le!==null&&Ne!==void 0&&Ne.update(le,Q,l||o)}re&&re(X,Q),Q.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Q}),m=null}let De=new wd;De.setAnimationLoop(Ae),this.setAnimationLoop=function(X){re=X},this.dispose=function(){}}},bi=new ln,Sy=new Te;function Ty(s,e){function t(p,g){p.matrixAutoUpdate===!0&&p.updateMatrix(),g.value.copy(p.matrix)}function n(p,g){g.color.getRGB(p.fogColor.value,Td(s)),g.isFog?(p.fogNear.value=g.near,p.fogFar.value=g.far):g.isFogExp2&&(p.fogDensity.value=g.density)}function i(p,g,M,x,y){g.isMeshBasicMaterial||g.isMeshLambertMaterial?r(p,g):g.isMeshToonMaterial?(r(p,g),u(p,g)):g.isMeshPhongMaterial?(r(p,g),h(p,g)):g.isMeshStandardMaterial?(r(p,g),d(p,g),g.isMeshPhysicalMaterial&&f(p,g,y)):g.isMeshMatcapMaterial?(r(p,g),m(p,g)):g.isMeshDepthMaterial?r(p,g):g.isMeshDistanceMaterial?(r(p,g),_(p,g)):g.isMeshNormalMaterial?r(p,g):g.isLineBasicMaterial?(o(p,g),g.isLineDashedMaterial&&a(p,g)):g.isPointsMaterial?c(p,g,M,x):g.isSpriteMaterial?l(p,g):g.isShadowMaterial?(p.color.value.copy(g.color),p.opacity.value=g.opacity):g.isShaderMaterial&&(g.uniformsNeedUpdate=!1)}function r(p,g){p.opacity.value=g.opacity,g.color&&p.diffuse.value.copy(g.color),g.emissive&&p.emissive.value.copy(g.emissive).multiplyScalar(g.emissiveIntensity),g.map&&(p.map.value=g.map,t(g.map,p.mapTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,t(g.alphaMap,p.alphaMapTransform)),g.bumpMap&&(p.bumpMap.value=g.bumpMap,t(g.bumpMap,p.bumpMapTransform),p.bumpScale.value=g.bumpScale,g.side===Ft&&(p.bumpScale.value*=-1)),g.normalMap&&(p.normalMap.value=g.normalMap,t(g.normalMap,p.normalMapTransform),p.normalScale.value.copy(g.normalScale),g.side===Ft&&p.normalScale.value.negate()),g.displacementMap&&(p.displacementMap.value=g.displacementMap,t(g.displacementMap,p.displacementMapTransform),p.displacementScale.value=g.displacementScale,p.displacementBias.value=g.displacementBias),g.emissiveMap&&(p.emissiveMap.value=g.emissiveMap,t(g.emissiveMap,p.emissiveMapTransform)),g.specularMap&&(p.specularMap.value=g.specularMap,t(g.specularMap,p.specularMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest);let M=e.get(g),x=M.envMap,y=M.envMapRotation;x&&(p.envMap.value=x,bi.copy(y),bi.x*=-1,bi.y*=-1,bi.z*=-1,x.isCubeTexture&&x.isRenderTargetTexture===!1&&(bi.y*=-1,bi.z*=-1),p.envMapRotation.value.setFromMatrix4(Sy.makeRotationFromEuler(bi)),p.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=g.reflectivity,p.ior.value=g.ior,p.refractionRatio.value=g.refractionRatio),g.lightMap&&(p.lightMap.value=g.lightMap,p.lightMapIntensity.value=g.lightMapIntensity,t(g.lightMap,p.lightMapTransform)),g.aoMap&&(p.aoMap.value=g.aoMap,p.aoMapIntensity.value=g.aoMapIntensity,t(g.aoMap,p.aoMapTransform))}function o(p,g){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,g.map&&(p.map.value=g.map,t(g.map,p.mapTransform))}function a(p,g){p.dashSize.value=g.dashSize,p.totalSize.value=g.dashSize+g.gapSize,p.scale.value=g.scale}function c(p,g,M,x){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,p.size.value=g.size*M,p.scale.value=x*.5,g.map&&(p.map.value=g.map,t(g.map,p.uvTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,t(g.alphaMap,p.alphaMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest)}function l(p,g){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,p.rotation.value=g.rotation,g.map&&(p.map.value=g.map,t(g.map,p.mapTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,t(g.alphaMap,p.alphaMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest)}function h(p,g){p.specular.value.copy(g.specular),p.shininess.value=Math.max(g.shininess,1e-4)}function u(p,g){g.gradientMap&&(p.gradientMap.value=g.gradientMap)}function d(p,g){p.metalness.value=g.metalness,g.metalnessMap&&(p.metalnessMap.value=g.metalnessMap,t(g.metalnessMap,p.metalnessMapTransform)),p.roughness.value=g.roughness,g.roughnessMap&&(p.roughnessMap.value=g.roughnessMap,t(g.roughnessMap,p.roughnessMapTransform)),g.envMap&&(p.envMapIntensity.value=g.envMapIntensity)}function f(p,g,M){p.ior.value=g.ior,g.sheen>0&&(p.sheenColor.value.copy(g.sheenColor).multiplyScalar(g.sheen),p.sheenRoughness.value=g.sheenRoughness,g.sheenColorMap&&(p.sheenColorMap.value=g.sheenColorMap,t(g.sheenColorMap,p.sheenColorMapTransform)),g.sheenRoughnessMap&&(p.sheenRoughnessMap.value=g.sheenRoughnessMap,t(g.sheenRoughnessMap,p.sheenRoughnessMapTransform))),g.clearcoat>0&&(p.clearcoat.value=g.clearcoat,p.clearcoatRoughness.value=g.clearcoatRoughness,g.clearcoatMap&&(p.clearcoatMap.value=g.clearcoatMap,t(g.clearcoatMap,p.clearcoatMapTransform)),g.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=g.clearcoatRoughnessMap,t(g.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),g.clearcoatNormalMap&&(p.clearcoatNormalMap.value=g.clearcoatNormalMap,t(g.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(g.clearcoatNormalScale),g.side===Ft&&p.clearcoatNormalScale.value.negate())),g.dispersion>0&&(p.dispersion.value=g.dispersion),g.iridescence>0&&(p.iridescence.value=g.iridescence,p.iridescenceIOR.value=g.iridescenceIOR,p.iridescenceThicknessMinimum.value=g.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=g.iridescenceThicknessRange[1],g.iridescenceMap&&(p.iridescenceMap.value=g.iridescenceMap,t(g.iridescenceMap,p.iridescenceMapTransform)),g.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=g.iridescenceThicknessMap,t(g.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),g.transmission>0&&(p.transmission.value=g.transmission,p.transmissionSamplerMap.value=M.texture,p.transmissionSamplerSize.value.set(M.width,M.height),g.transmissionMap&&(p.transmissionMap.value=g.transmissionMap,t(g.transmissionMap,p.transmissionMapTransform)),p.thickness.value=g.thickness,g.thicknessMap&&(p.thicknessMap.value=g.thicknessMap,t(g.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=g.attenuationDistance,p.attenuationColor.value.copy(g.attenuationColor)),g.anisotropy>0&&(p.anisotropyVector.value.set(g.anisotropy*Math.cos(g.anisotropyRotation),g.anisotropy*Math.sin(g.anisotropyRotation)),g.anisotropyMap&&(p.anisotropyMap.value=g.anisotropyMap,t(g.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=g.specularIntensity,p.specularColor.value.copy(g.specularColor),g.specularColorMap&&(p.specularColorMap.value=g.specularColorMap,t(g.specularColorMap,p.specularColorMapTransform)),g.specularIntensityMap&&(p.specularIntensityMap.value=g.specularIntensityMap,t(g.specularIntensityMap,p.specularIntensityMapTransform))}function m(p,g){g.matcap&&(p.matcap.value=g.matcap)}function _(p,g){let M=e.get(g).light;p.referencePosition.value.setFromMatrixPosition(M.matrixWorld),p.nearDistance.value=M.shadow.camera.near,p.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function wy(s,e,t,n){let i={},r={},o=[],a=s.getParameter(s.MAX_UNIFORM_BUFFER_BINDINGS);function c(M,x){let y=x.program;n.uniformBlockBinding(M,y)}function l(M,x){let y=i[M.id];y===void 0&&(m(M),y=h(M),i[M.id]=y,M.addEventListener("dispose",p));let A=x.program;n.updateUBOMapping(M,A);let w=e.render.frame;r[M.id]!==w&&(d(M),r[M.id]=w)}function h(M){let x=u();M.__bindingPointIndex=x;let y=s.createBuffer(),A=M.__size,w=M.usage;return s.bindBuffer(s.UNIFORM_BUFFER,y),s.bufferData(s.UNIFORM_BUFFER,A,w),s.bindBuffer(s.UNIFORM_BUFFER,null),s.bindBufferBase(s.UNIFORM_BUFFER,x,y),y}function u(){for(let M=0;M<a;M++)if(o.indexOf(M)===-1)return o.push(M),M;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(M){let x=i[M.id],y=M.uniforms,A=M.__cache;s.bindBuffer(s.UNIFORM_BUFFER,x);for(let w=0,R=y.length;w<R;w++){let I=Array.isArray(y[w])?y[w]:[y[w]];for(let N=0,v=I.length;N<v;N++){let S=I[N];if(f(S,w,N,A)===!0){let F=S.__offset,B=Array.isArray(S.value)?S.value:[S.value],G=0;for(let Y=0;Y<B.length;Y++){let P=B[Y],j=_(P);typeof P=="number"||typeof P=="boolean"?(S.__data[0]=P,s.bufferSubData(s.UNIFORM_BUFFER,F+G,S.__data)):P.isMatrix3?(S.__data[0]=P.elements[0],S.__data[1]=P.elements[1],S.__data[2]=P.elements[2],S.__data[3]=0,S.__data[4]=P.elements[3],S.__data[5]=P.elements[4],S.__data[6]=P.elements[5],S.__data[7]=0,S.__data[8]=P.elements[6],S.__data[9]=P.elements[7],S.__data[10]=P.elements[8],S.__data[11]=0):(P.toArray(S.__data,G),G+=j.storage/Float32Array.BYTES_PER_ELEMENT)}s.bufferSubData(s.UNIFORM_BUFFER,F,S.__data)}}}s.bindBuffer(s.UNIFORM_BUFFER,null)}function f(M,x,y,A){let w=M.value,R=x+"_"+y;if(A[R]===void 0)return typeof w=="number"||typeof w=="boolean"?A[R]=w:A[R]=w.clone(),!0;{let I=A[R];if(typeof w=="number"||typeof w=="boolean"){if(I!==w)return A[R]=w,!0}else if(I.equals(w)===!1)return I.copy(w),!0}return!1}function m(M){let x=M.uniforms,y=0,A=16;for(let R=0,I=x.length;R<I;R++){let N=Array.isArray(x[R])?x[R]:[x[R]];for(let v=0,S=N.length;v<S;v++){let F=N[v],B=Array.isArray(F.value)?F.value:[F.value];for(let G=0,Y=B.length;G<Y;G++){let P=B[G],j=_(P),k=y%A,J=k%j.boundary,ee=k+J;y+=J,ee!==0&&A-ee<j.storage&&(y+=A-ee),F.__data=new Float32Array(j.storage/Float32Array.BYTES_PER_ELEMENT),F.__offset=y,y+=j.storage}}}let w=y%A;return w>0&&(y+=A-w),M.__size=y,M.__cache={},this}function _(M){let x={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(x.boundary=4,x.storage=4):M.isVector2?(x.boundary=8,x.storage=8):M.isVector3||M.isColor?(x.boundary=16,x.storage=12):M.isVector4?(x.boundary=16,x.storage=16):M.isMatrix3?(x.boundary=48,x.storage=48):M.isMatrix4?(x.boundary=64,x.storage=64):M.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",M),x}function p(M){let x=M.target;x.removeEventListener("dispose",p);let y=o.indexOf(x.__bindingPointIndex);o.splice(y,1),s.deleteBuffer(i[x.id]),delete i[x.id],delete r[x.id]}function g(){for(let M in i)s.deleteBuffer(i[M]);o=[],i={},r={}}return{bind:c,update:l,dispose:g}}var ys=class{constructor(e={}){let{canvas:t=Rp(),context:n=null,depth:i=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1}=e;this.isWebGLRenderer=!0;let d;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=n.getContextAttributes().alpha}else d=o;let f=new Uint32Array(4),m=new Int32Array(4),_=null,p=null,g=[],M=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=mt,this.toneMapping=si,this.toneMappingExposure=1;let x=this,y=!1,A=0,w=0,R=null,I=-1,N=null,v=new je,S=new je,F=null,B=new be(0),G=0,Y=t.width,P=t.height,j=1,k=null,J=null,ee=new je(0,0,Y,P),re=new je(0,0,Y,P),Ae=!1,De=new Zs,X=!1,Q=!1,he=new Te,le=new Te,Ne=new E,we=new je,Ge={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},nt=!1;function We(){return R===null?j:1}let L=n;function Zt(T,U){return t.getContext(T,U)}try{let T={alpha:!0,depth:i,stencil:r,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine","three.js r169"),t.addEventListener("webglcontextlost",Z,!1),t.addEventListener("webglcontextrestored",ae,!1),t.addEventListener("webglcontextcreationerror",de,!1),L===null){let U="webgl2";if(L=Zt(U,T),L===null)throw Zt(U)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(T){throw console.error("THREE.WebGLRenderer: "+T.message),T}let He,qe,Re,ot,Pe,C,b,z,K,$,q,xe,oe,fe,Ke,te,pe,Ce,Ie,me,Ve,Ue,rt,D;function ue(){He=new H0(L),He.init(),Ue=new xy(L,He),qe=new U0(L,He,e,Ue),Re=new gy(L),qe.reverseDepthBuffer&&Re.buffers.depth.setReversed(!0),ot=new W0(L),Pe=new iy,C=new yy(L,He,Re,Pe,qe,Ue,ot),b=new F0(x),z=new k0(x),K=new jp(L),rt=new D0(L,K),$=new V0(L,K,ot,rt),q=new Y0(L,$,K,ot),Ie=new X0(L,qe,C),te=new O0(Pe),xe=new ny(x,b,z,He,qe,rt,te),oe=new Ty(x,Pe),fe=new ry,Ke=new uy(He),Ce=new L0(x,b,z,Re,q,d,c),pe=new py(x,q,qe),D=new wy(L,ot,qe,Re),me=new N0(L,He,ot),Ve=new G0(L,He,ot),ot.programs=xe.programs,x.capabilities=qe,x.extensions=He,x.properties=Pe,x.renderLists=fe,x.shadowMap=pe,x.state=Re,x.info=ot}ue();let W=new Kc(x,L);this.xr=W,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){let T=He.get("WEBGL_lose_context");T&&T.loseContext()},this.forceContextRestore=function(){let T=He.get("WEBGL_lose_context");T&&T.restoreContext()},this.getPixelRatio=function(){return j},this.setPixelRatio=function(T){T!==void 0&&(j=T,this.setSize(Y,P,!1))},this.getSize=function(T){return T.set(Y,P)},this.setSize=function(T,U,H=!0){if(W.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}Y=T,P=U,t.width=Math.floor(T*j),t.height=Math.floor(U*j),H===!0&&(t.style.width=T+"px",t.style.height=U+"px"),this.setViewport(0,0,T,U)},this.getDrawingBufferSize=function(T){return T.set(Y*j,P*j).floor()},this.setDrawingBufferSize=function(T,U,H){Y=T,P=U,j=H,t.width=Math.floor(T*H),t.height=Math.floor(U*H),this.setViewport(0,0,T,U)},this.getCurrentViewport=function(T){return T.copy(v)},this.getViewport=function(T){return T.copy(ee)},this.setViewport=function(T,U,H,V){T.isVector4?ee.set(T.x,T.y,T.z,T.w):ee.set(T,U,H,V),Re.viewport(v.copy(ee).multiplyScalar(j).round())},this.getScissor=function(T){return T.copy(re)},this.setScissor=function(T,U,H,V){T.isVector4?re.set(T.x,T.y,T.z,T.w):re.set(T,U,H,V),Re.scissor(S.copy(re).multiplyScalar(j).round())},this.getScissorTest=function(){return Ae},this.setScissorTest=function(T){Re.setScissorTest(Ae=T)},this.setOpaqueSort=function(T){k=T},this.setTransparentSort=function(T){J=T},this.getClearColor=function(T){return T.copy(Ce.getClearColor())},this.setClearColor=function(){Ce.setClearColor.apply(Ce,arguments)},this.getClearAlpha=function(){return Ce.getClearAlpha()},this.setClearAlpha=function(){Ce.setClearAlpha.apply(Ce,arguments)},this.clear=function(T=!0,U=!0,H=!0){let V=0;if(T){let O=!1;if(R!==null){let ne=R.texture.format;O=ne===bl||ne===Ml||ne===vl}if(O){let ne=R.texture.type,ce=ne===Hn||ne===Ci||ne===qs||ne===hs||ne===_l||ne===yl,ge=Ce.getClearColor(),_e=Ce.getClearAlpha(),Se=ge.r,Ee=ge.g,ve=ge.b;ce?(f[0]=Se,f[1]=Ee,f[2]=ve,f[3]=_e,L.clearBufferuiv(L.COLOR,0,f)):(m[0]=Se,m[1]=Ee,m[2]=ve,m[3]=_e,L.clearBufferiv(L.COLOR,0,m))}else V|=L.COLOR_BUFFER_BIT}U&&(V|=L.DEPTH_BUFFER_BIT,L.clearDepth(this.capabilities.reverseDepthBuffer?0:1)),H&&(V|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),L.clear(V)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",Z,!1),t.removeEventListener("webglcontextrestored",ae,!1),t.removeEventListener("webglcontextcreationerror",de,!1),fe.dispose(),Ke.dispose(),Pe.dispose(),b.dispose(),z.dispose(),q.dispose(),rt.dispose(),D.dispose(),xe.dispose(),W.dispose(),W.removeEventListener("sessionstart",Fh),W.removeEventListener("sessionend",Bh),gi.stop()};function Z(T){T.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),y=!0}function ae(){console.log("THREE.WebGLRenderer: Context Restored."),y=!1;let T=ot.autoReset,U=pe.enabled,H=pe.autoUpdate,V=pe.needsUpdate,O=pe.type;ue(),ot.autoReset=T,pe.enabled=U,pe.autoUpdate=H,pe.needsUpdate=V,pe.type=O}function de(T){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",T.statusMessage)}function Xe(T){let U=T.target;U.removeEventListener("dispose",Xe),yt(U)}function yt(T){Gt(T),Pe.remove(T)}function Gt(T){let U=Pe.get(T).programs;U!==void 0&&(U.forEach(function(H){xe.releaseProgram(H)}),T.isShaderMaterial&&xe.releaseShaderCache(T))}this.renderBufferDirect=function(T,U,H,V,O,ne){U===null&&(U=Ge);let ce=O.isMesh&&O.matrixWorld.determinant()<0,ge=vf(T,U,H,V,O);Re.setMaterial(V,ce);let _e=H.index,Se=1;if(V.wireframe===!0){if(_e=$.getWireframeAttribute(H),_e===void 0)return;Se=2}let Ee=H.drawRange,ve=H.attributes.position,et=Ee.start*Se,at=(Ee.start+Ee.count)*Se;ne!==null&&(et=Math.max(et,ne.start*Se),at=Math.min(at,(ne.start+ne.count)*Se)),_e!==null?(et=Math.max(et,0),at=Math.min(at,_e.count)):ve!=null&&(et=Math.max(et,0),at=Math.min(at,ve.count));let pt=at-et;if(pt<0||pt===1/0)return;rt.setup(O,V,ge,H,_e);let Jt,$e=me;if(_e!==null&&(Jt=K.get(_e),$e=Ve,$e.setIndex(Jt)),O.isMesh)V.wireframe===!0?(Re.setLineWidth(V.wireframeLinewidth*We()),$e.setMode(L.LINES)):$e.setMode(L.TRIANGLES);else if(O.isLine){let Me=V.linewidth;Me===void 0&&(Me=1),Re.setLineWidth(Me*We()),O.isLineSegments?$e.setMode(L.LINES):O.isLineLoop?$e.setMode(L.LINE_LOOP):$e.setMode(L.LINE_STRIP)}else O.isPoints?$e.setMode(L.POINTS):O.isSprite&&$e.setMode(L.TRIANGLES);if(O.isBatchedMesh)if(O._multiDrawInstances!==null)$e.renderMultiDrawInstances(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount,O._multiDrawInstances);else if(He.get("WEBGL_multi_draw"))$e.renderMultiDraw(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount);else{let Me=O._multiDrawStarts,Lt=O._multiDrawCounts,Qe=O._multiDrawCount,mn=_e?K.get(_e).bytesPerElement:1,Fi=Pe.get(V).currentProgram.getUniforms();for(let jt=0;jt<Qe;jt++)Fi.setValue(L,"_gl_DrawID",jt),$e.render(Me[jt]/mn,Lt[jt])}else if(O.isInstancedMesh)$e.renderInstances(et,pt,O.count);else if(H.isInstancedBufferGeometry){let Me=H._maxInstanceCount!==void 0?H._maxInstanceCount:1/0,Lt=Math.min(H.instanceCount,Me);$e.renderInstances(et,pt,Lt)}else $e.render(et,pt)};function Je(T,U,H){T.transparent===!0&&T.side===kt&&T.forceSinglePass===!1?(T.side=Ft,T.needsUpdate=!0,br(T,U,H),T.side=Cn,T.needsUpdate=!0,br(T,U,H),T.side=kt):br(T,U,H)}this.compile=function(T,U,H=null){H===null&&(H=T),p=Ke.get(H),p.init(U),M.push(p),H.traverseVisible(function(O){O.isLight&&O.layers.test(U.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),T!==H&&T.traverseVisible(function(O){O.isLight&&O.layers.test(U.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),p.setupLights();let V=new Set;return T.traverse(function(O){if(!(O.isMesh||O.isPoints||O.isLine||O.isSprite))return;let ne=O.material;if(ne)if(Array.isArray(ne))for(let ce=0;ce<ne.length;ce++){let ge=ne[ce];Je(ge,H,O),V.add(ge)}else Je(ne,H,O),V.add(ne)}),M.pop(),p=null,V},this.compileAsync=function(T,U,H=null){let V=this.compile(T,U,H);return new Promise(O=>{function ne(){if(V.forEach(function(ce){Pe.get(ce).currentProgram.isReady()&&V.delete(ce)}),V.size===0){O(T);return}setTimeout(ne,10)}He.get("KHR_parallel_shader_compile")!==null?ne():setTimeout(ne,10)})};let Wt=null;function Ln(T){Wt&&Wt(T)}function Fh(){gi.stop()}function Bh(){gi.start()}let gi=new wd;gi.setAnimationLoop(Ln),typeof self<"u"&&gi.setContext(self),this.setAnimationLoop=function(T){Wt=T,W.setAnimationLoop(T),T===null?gi.stop():gi.start()},W.addEventListener("sessionstart",Fh),W.addEventListener("sessionend",Bh),this.render=function(T,U){if(U!==void 0&&U.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(y===!0)return;if(T.matrixWorldAutoUpdate===!0&&T.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),W.enabled===!0&&W.isPresenting===!0&&(W.cameraAutoUpdate===!0&&W.updateCamera(U),U=W.getCamera()),T.isScene===!0&&T.onBeforeRender(x,T,U,R),p=Ke.get(T,M.length),p.init(U),M.push(p),le.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),De.setFromProjectionMatrix(le),Q=this.localClippingEnabled,X=te.init(this.clippingPlanes,Q),_=fe.get(T,g.length),_.init(),g.push(_),W.enabled===!0&&W.isPresenting===!0){let ne=x.xr.getDepthSensingMesh();ne!==null&&la(ne,U,-1/0,x.sortObjects)}la(T,U,0,x.sortObjects),_.finish(),x.sortObjects===!0&&_.sort(k,J),nt=W.enabled===!1||W.isPresenting===!1||W.hasDepthSensing()===!1,nt&&Ce.addToRenderList(_,T),this.info.render.frame++,X===!0&&te.beginShadows();let H=p.state.shadowsArray;pe.render(H,T,U),X===!0&&te.endShadows(),this.info.autoReset===!0&&this.info.reset();let V=_.opaque,O=_.transmissive;if(p.setupLights(),U.isArrayCamera){let ne=U.cameras;if(O.length>0)for(let ce=0,ge=ne.length;ce<ge;ce++){let _e=ne[ce];kh(V,O,T,_e)}nt&&Ce.render(T);for(let ce=0,ge=ne.length;ce<ge;ce++){let _e=ne[ce];zh(_,T,_e,_e.viewport)}}else O.length>0&&kh(V,O,T,U),nt&&Ce.render(T),zh(_,T,U);R!==null&&(C.updateMultisampleRenderTarget(R),C.updateRenderTargetMipmap(R)),T.isScene===!0&&T.onAfterRender(x,T,U),rt.resetDefaultState(),I=-1,N=null,M.pop(),M.length>0?(p=M[M.length-1],X===!0&&te.setGlobalState(x.clippingPlanes,p.state.camera)):p=null,g.pop(),g.length>0?_=g[g.length-1]:_=null};function la(T,U,H,V){if(T.visible===!1)return;if(T.layers.test(U.layers)){if(T.isGroup)H=T.renderOrder;else if(T.isLOD)T.autoUpdate===!0&&T.update(U);else if(T.isLight)p.pushLight(T),T.castShadow&&p.pushShadow(T);else if(T.isSprite){if(!T.frustumCulled||De.intersectsSprite(T)){V&&we.setFromMatrixPosition(T.matrixWorld).applyMatrix4(le);let ce=q.update(T),ge=T.material;ge.visible&&_.push(T,ce,ge,H,we.z,null)}}else if((T.isMesh||T.isLine||T.isPoints)&&(!T.frustumCulled||De.intersectsObject(T))){let ce=q.update(T),ge=T.material;if(V&&(T.boundingSphere!==void 0?(T.boundingSphere===null&&T.computeBoundingSphere(),we.copy(T.boundingSphere.center)):(ce.boundingSphere===null&&ce.computeBoundingSphere(),we.copy(ce.boundingSphere.center)),we.applyMatrix4(T.matrixWorld).applyMatrix4(le)),Array.isArray(ge)){let _e=ce.groups;for(let Se=0,Ee=_e.length;Se<Ee;Se++){let ve=_e[Se],et=ge[ve.materialIndex];et&&et.visible&&_.push(T,ce,et,H,we.z,ve)}}else ge.visible&&_.push(T,ce,ge,H,we.z,null)}}let ne=T.children;for(let ce=0,ge=ne.length;ce<ge;ce++)la(ne[ce],U,H,V)}function zh(T,U,H,V){let O=T.opaque,ne=T.transmissive,ce=T.transparent;p.setupLightsView(H),X===!0&&te.setGlobalState(x.clippingPlanes,H),V&&Re.viewport(v.copy(V)),O.length>0&&Mr(O,U,H),ne.length>0&&Mr(ne,U,H),ce.length>0&&Mr(ce,U,H),Re.buffers.depth.setTest(!0),Re.buffers.depth.setMask(!0),Re.buffers.color.setMask(!0),Re.setPolygonOffset(!1)}function kh(T,U,H,V){if((H.isScene===!0?H.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[V.id]===void 0&&(p.state.transmissionRenderTarget[V.id]=new Vn(1,1,{generateMipmaps:!0,type:He.has("EXT_color_buffer_half_float")||He.has("EXT_color_buffer_float")?dr:Hn,minFilter:Xt,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Ye.workingColorSpace}));let ne=p.state.transmissionRenderTarget[V.id],ce=V.viewport||v;ne.setSize(ce.z,ce.w);let ge=x.getRenderTarget();x.setRenderTarget(ne),x.getClearColor(B),G=x.getClearAlpha(),G<1&&x.setClearColor(16777215,.5),x.clear(),nt&&Ce.render(H);let _e=x.toneMapping;x.toneMapping=si;let Se=V.viewport;if(V.viewport!==void 0&&(V.viewport=void 0),p.setupLightsView(V),X===!0&&te.setGlobalState(x.clippingPlanes,V),Mr(T,H,V),C.updateMultisampleRenderTarget(ne),C.updateRenderTargetMipmap(ne),He.has("WEBGL_multisampled_render_to_texture")===!1){let Ee=!1;for(let ve=0,et=U.length;ve<et;ve++){let at=U[ve],pt=at.object,Jt=at.geometry,$e=at.material,Me=at.group;if($e.side===kt&&pt.layers.test(V.layers)){let Lt=$e.side;$e.side=Ft,$e.needsUpdate=!0,Hh(pt,H,V,Jt,$e,Me),$e.side=Lt,$e.needsUpdate=!0,Ee=!0}}Ee===!0&&(C.updateMultisampleRenderTarget(ne),C.updateRenderTargetMipmap(ne))}x.setRenderTarget(ge),x.setClearColor(B,G),Se!==void 0&&(V.viewport=Se),x.toneMapping=_e}function Mr(T,U,H){let V=U.isScene===!0?U.overrideMaterial:null;for(let O=0,ne=T.length;O<ne;O++){let ce=T[O],ge=ce.object,_e=ce.geometry,Se=V===null?ce.material:V,Ee=ce.group;ge.layers.test(H.layers)&&Hh(ge,U,H,_e,Se,Ee)}}function Hh(T,U,H,V,O,ne){T.onBeforeRender(x,U,H,V,O,ne),T.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,T.matrixWorld),T.normalMatrix.getNormalMatrix(T.modelViewMatrix),O.onBeforeRender(x,U,H,V,T,ne),O.transparent===!0&&O.side===kt&&O.forceSinglePass===!1?(O.side=Ft,O.needsUpdate=!0,x.renderBufferDirect(H,U,V,O,T,ne),O.side=Cn,O.needsUpdate=!0,x.renderBufferDirect(H,U,V,O,T,ne),O.side=kt):x.renderBufferDirect(H,U,V,O,T,ne),T.onAfterRender(x,U,H,V,O,ne)}function br(T,U,H){U.isScene!==!0&&(U=Ge);let V=Pe.get(T),O=p.state.lights,ne=p.state.shadowsArray,ce=O.state.version,ge=xe.getParameters(T,O.state,ne,U,H),_e=xe.getProgramCacheKey(ge),Se=V.programs;V.environment=T.isMeshStandardMaterial?U.environment:null,V.fog=U.fog,V.envMap=(T.isMeshStandardMaterial?z:b).get(T.envMap||V.environment),V.envMapRotation=V.environment!==null&&T.envMap===null?U.environmentRotation:T.envMapRotation,Se===void 0&&(T.addEventListener("dispose",Xe),Se=new Map,V.programs=Se);let Ee=Se.get(_e);if(Ee!==void 0){if(V.currentProgram===Ee&&V.lightsStateVersion===ce)return Gh(T,ge),Ee}else ge.uniforms=xe.getUniforms(T),T.onBeforeCompile(ge,x),Ee=xe.acquireProgram(ge,_e),Se.set(_e,Ee),V.uniforms=ge.uniforms;let ve=V.uniforms;return(!T.isShaderMaterial&&!T.isRawShaderMaterial||T.clipping===!0)&&(ve.clippingPlanes=te.uniform),Gh(T,ge),V.needsLights=bf(T),V.lightsStateVersion=ce,V.needsLights&&(ve.ambientLightColor.value=O.state.ambient,ve.lightProbe.value=O.state.probe,ve.directionalLights.value=O.state.directional,ve.directionalLightShadows.value=O.state.directionalShadow,ve.spotLights.value=O.state.spot,ve.spotLightShadows.value=O.state.spotShadow,ve.rectAreaLights.value=O.state.rectArea,ve.ltc_1.value=O.state.rectAreaLTC1,ve.ltc_2.value=O.state.rectAreaLTC2,ve.pointLights.value=O.state.point,ve.pointLightShadows.value=O.state.pointShadow,ve.hemisphereLights.value=O.state.hemi,ve.directionalShadowMap.value=O.state.directionalShadowMap,ve.directionalShadowMatrix.value=O.state.directionalShadowMatrix,ve.spotShadowMap.value=O.state.spotShadowMap,ve.spotLightMatrix.value=O.state.spotLightMatrix,ve.spotLightMap.value=O.state.spotLightMap,ve.pointShadowMap.value=O.state.pointShadowMap,ve.pointShadowMatrix.value=O.state.pointShadowMatrix),V.currentProgram=Ee,V.uniformsList=null,Ee}function Vh(T){if(T.uniformsList===null){let U=T.currentProgram.getUniforms();T.uniformsList=os.seqWithValue(U.seq,T.uniforms)}return T.uniformsList}function Gh(T,U){let H=Pe.get(T);H.outputColorSpace=U.outputColorSpace,H.batching=U.batching,H.batchingColor=U.batchingColor,H.instancing=U.instancing,H.instancingColor=U.instancingColor,H.instancingMorph=U.instancingMorph,H.skinning=U.skinning,H.morphTargets=U.morphTargets,H.morphNormals=U.morphNormals,H.morphColors=U.morphColors,H.morphTargetsCount=U.morphTargetsCount,H.numClippingPlanes=U.numClippingPlanes,H.numIntersection=U.numClipIntersection,H.vertexAlphas=U.vertexAlphas,H.vertexTangents=U.vertexTangents,H.toneMapping=U.toneMapping}function vf(T,U,H,V,O){U.isScene!==!0&&(U=Ge),C.resetTextureUnits();let ne=U.fog,ce=V.isMeshStandardMaterial?U.environment:null,ge=R===null?x.outputColorSpace:R.isXRRenderTarget===!0?R.texture.colorSpace:Pt,_e=(V.isMeshStandardMaterial?z:b).get(V.envMap||ce),Se=V.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,Ee=!!H.attributes.tangent&&(!!V.normalMap||V.anisotropy>0),ve=!!H.morphAttributes.position,et=!!H.morphAttributes.normal,at=!!H.morphAttributes.color,pt=si;V.toneMapped&&(R===null||R.isXRRenderTarget===!0)&&(pt=x.toneMapping);let Jt=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,$e=Jt!==void 0?Jt.length:0,Me=Pe.get(V),Lt=p.state.lights;if(X===!0&&(Q===!0||T!==N)){let on=T===N&&V.id===I;te.setState(V,T,on)}let Qe=!1;V.version===Me.__version?(Me.needsLights&&Me.lightsStateVersion!==Lt.state.version||Me.outputColorSpace!==ge||O.isBatchedMesh&&Me.batching===!1||!O.isBatchedMesh&&Me.batching===!0||O.isBatchedMesh&&Me.batchingColor===!0&&O.colorTexture===null||O.isBatchedMesh&&Me.batchingColor===!1&&O.colorTexture!==null||O.isInstancedMesh&&Me.instancing===!1||!O.isInstancedMesh&&Me.instancing===!0||O.isSkinnedMesh&&Me.skinning===!1||!O.isSkinnedMesh&&Me.skinning===!0||O.isInstancedMesh&&Me.instancingColor===!0&&O.instanceColor===null||O.isInstancedMesh&&Me.instancingColor===!1&&O.instanceColor!==null||O.isInstancedMesh&&Me.instancingMorph===!0&&O.morphTexture===null||O.isInstancedMesh&&Me.instancingMorph===!1&&O.morphTexture!==null||Me.envMap!==_e||V.fog===!0&&Me.fog!==ne||Me.numClippingPlanes!==void 0&&(Me.numClippingPlanes!==te.numPlanes||Me.numIntersection!==te.numIntersection)||Me.vertexAlphas!==Se||Me.vertexTangents!==Ee||Me.morphTargets!==ve||Me.morphNormals!==et||Me.morphColors!==at||Me.toneMapping!==pt||Me.morphTargetsCount!==$e)&&(Qe=!0):(Qe=!0,Me.__version=V.version);let mn=Me.currentProgram;Qe===!0&&(mn=br(V,U,O));let Fi=!1,jt=!1,ha=!1,gt=mn.getUniforms(),Kn=Me.uniforms;if(Re.useProgram(mn.program)&&(Fi=!0,jt=!0,ha=!0),V.id!==I&&(I=V.id,jt=!0),Fi||N!==T){qe.reverseDepthBuffer?(he.copy(T.projectionMatrix),Ip(he),Pp(he),gt.setValue(L,"projectionMatrix",he)):gt.setValue(L,"projectionMatrix",T.projectionMatrix),gt.setValue(L,"viewMatrix",T.matrixWorldInverse);let on=gt.map.cameraPosition;on!==void 0&&on.setValue(L,Ne.setFromMatrixPosition(T.matrixWorld)),qe.logarithmicDepthBuffer&&gt.setValue(L,"logDepthBufFC",2/(Math.log(T.far+1)/Math.LN2)),(V.isMeshPhongMaterial||V.isMeshToonMaterial||V.isMeshLambertMaterial||V.isMeshBasicMaterial||V.isMeshStandardMaterial||V.isShaderMaterial)&&gt.setValue(L,"isOrthographic",T.isOrthographicCamera===!0),N!==T&&(N=T,jt=!0,ha=!0)}if(O.isSkinnedMesh){gt.setOptional(L,O,"bindMatrix"),gt.setOptional(L,O,"bindMatrixInverse");let on=O.skeleton;on&&(on.boneTexture===null&&on.computeBoneTexture(),gt.setValue(L,"boneTexture",on.boneTexture,C))}O.isBatchedMesh&&(gt.setOptional(L,O,"batchingTexture"),gt.setValue(L,"batchingTexture",O._matricesTexture,C),gt.setOptional(L,O,"batchingIdTexture"),gt.setValue(L,"batchingIdTexture",O._indirectTexture,C),gt.setOptional(L,O,"batchingColorTexture"),O._colorsTexture!==null&&gt.setValue(L,"batchingColorTexture",O._colorsTexture,C));let ua=H.morphAttributes;if((ua.position!==void 0||ua.normal!==void 0||ua.color!==void 0)&&Ie.update(O,H,mn),(jt||Me.receiveShadow!==O.receiveShadow)&&(Me.receiveShadow=O.receiveShadow,gt.setValue(L,"receiveShadow",O.receiveShadow)),V.isMeshGouraudMaterial&&V.envMap!==null&&(Kn.envMap.value=_e,Kn.flipEnvMap.value=_e.isCubeTexture&&_e.isRenderTargetTexture===!1?-1:1),V.isMeshStandardMaterial&&V.envMap===null&&U.environment!==null&&(Kn.envMapIntensity.value=U.environmentIntensity),jt&&(gt.setValue(L,"toneMappingExposure",x.toneMappingExposure),Me.needsLights&&Mf(Kn,ha),ne&&V.fog===!0&&oe.refreshFogUniforms(Kn,ne),oe.refreshMaterialUniforms(Kn,V,j,P,p.state.transmissionRenderTarget[T.id]),os.upload(L,Vh(Me),Kn,C)),V.isShaderMaterial&&V.uniformsNeedUpdate===!0&&(os.upload(L,Vh(Me),Kn,C),V.uniformsNeedUpdate=!1),V.isSpriteMaterial&&gt.setValue(L,"center",O.center),gt.setValue(L,"modelViewMatrix",O.modelViewMatrix),gt.setValue(L,"normalMatrix",O.normalMatrix),gt.setValue(L,"modelMatrix",O.matrixWorld),V.isShaderMaterial||V.isRawShaderMaterial){let on=V.uniformsGroups;for(let da=0,Sf=on.length;da<Sf;da++){let Wh=on[da];D.update(Wh,mn),D.bind(Wh,mn)}}return mn}function Mf(T,U){T.ambientLightColor.needsUpdate=U,T.lightProbe.needsUpdate=U,T.directionalLights.needsUpdate=U,T.directionalLightShadows.needsUpdate=U,T.pointLights.needsUpdate=U,T.pointLightShadows.needsUpdate=U,T.spotLights.needsUpdate=U,T.spotLightShadows.needsUpdate=U,T.rectAreaLights.needsUpdate=U,T.hemisphereLights.needsUpdate=U}function bf(T){return T.isMeshLambertMaterial||T.isMeshToonMaterial||T.isMeshPhongMaterial||T.isMeshStandardMaterial||T.isShadowMaterial||T.isShaderMaterial&&T.lights===!0}this.getActiveCubeFace=function(){return A},this.getActiveMipmapLevel=function(){return w},this.getRenderTarget=function(){return R},this.setRenderTargetTextures=function(T,U,H){Pe.get(T.texture).__webglTexture=U,Pe.get(T.depthTexture).__webglTexture=H;let V=Pe.get(T);V.__hasExternalTextures=!0,V.__autoAllocateDepthBuffer=H===void 0,V.__autoAllocateDepthBuffer||He.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),V.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(T,U){let H=Pe.get(T);H.__webglFramebuffer=U,H.__useDefaultFramebuffer=U===void 0},this.setRenderTarget=function(T,U=0,H=0){R=T,A=U,w=H;let V=!0,O=null,ne=!1,ce=!1;if(T){let _e=Pe.get(T);if(_e.__useDefaultFramebuffer!==void 0)Re.bindFramebuffer(L.FRAMEBUFFER,null),V=!1;else if(_e.__webglFramebuffer===void 0)C.setupRenderTarget(T);else if(_e.__hasExternalTextures)C.rebindTextures(T,Pe.get(T.texture).__webglTexture,Pe.get(T.depthTexture).__webglTexture);else if(T.depthBuffer){let ve=T.depthTexture;if(_e.__boundDepthTexture!==ve){if(ve!==null&&Pe.has(ve)&&(T.width!==ve.image.width||T.height!==ve.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");C.setupDepthRenderbuffer(T)}}let Se=T.texture;(Se.isData3DTexture||Se.isDataArrayTexture||Se.isCompressedArrayTexture)&&(ce=!0);let Ee=Pe.get(T).__webglFramebuffer;T.isWebGLCubeRenderTarget?(Array.isArray(Ee[U])?O=Ee[U][H]:O=Ee[U],ne=!0):T.samples>0&&C.useMultisampledRTT(T)===!1?O=Pe.get(T).__webglMultisampledFramebuffer:Array.isArray(Ee)?O=Ee[H]:O=Ee,v.copy(T.viewport),S.copy(T.scissor),F=T.scissorTest}else v.copy(ee).multiplyScalar(j).floor(),S.copy(re).multiplyScalar(j).floor(),F=Ae;if(Re.bindFramebuffer(L.FRAMEBUFFER,O)&&V&&Re.drawBuffers(T,O),Re.viewport(v),Re.scissor(S),Re.setScissorTest(F),ne){let _e=Pe.get(T.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+U,_e.__webglTexture,H)}else if(ce){let _e=Pe.get(T.texture),Se=U||0;L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,_e.__webglTexture,H||0,Se)}I=-1},this.readRenderTargetPixels=function(T,U,H,V,O,ne,ce){if(!(T&&T.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ge=Pe.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&ce!==void 0&&(ge=ge[ce]),ge){Re.bindFramebuffer(L.FRAMEBUFFER,ge);try{let _e=T.texture,Se=_e.format,Ee=_e.type;if(!qe.textureFormatReadable(Se)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!qe.textureTypeReadable(Ee)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=T.width-V&&H>=0&&H<=T.height-O&&L.readPixels(U,H,V,O,Ue.convert(Se),Ue.convert(Ee),ne)}finally{let _e=R!==null?Pe.get(R).__webglFramebuffer:null;Re.bindFramebuffer(L.FRAMEBUFFER,_e)}}},this.readRenderTargetPixelsAsync=async function(T,U,H,V,O,ne,ce){if(!(T&&T.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ge=Pe.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&ce!==void 0&&(ge=ge[ce]),ge){let _e=T.texture,Se=_e.format,Ee=_e.type;if(!qe.textureFormatReadable(Se))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!qe.textureTypeReadable(Ee))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(U>=0&&U<=T.width-V&&H>=0&&H<=T.height-O){Re.bindFramebuffer(L.FRAMEBUFFER,ge);let ve=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,ve),L.bufferData(L.PIXEL_PACK_BUFFER,ne.byteLength,L.STREAM_READ),L.readPixels(U,H,V,O,Ue.convert(Se),Ue.convert(Ee),0);let et=R!==null?Pe.get(R).__webglFramebuffer:null;Re.bindFramebuffer(L.FRAMEBUFFER,et);let at=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await Cp(L,at,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,ve),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,ne),L.deleteBuffer(ve),L.deleteSync(at),ne}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(T,U=null,H=0){T.isTexture!==!0&&(so("WebGLRenderer: copyFramebufferToTexture function signature has changed."),U=arguments[0]||null,T=arguments[1]);let V=Math.pow(2,-H),O=Math.floor(T.image.width*V),ne=Math.floor(T.image.height*V),ce=U!==null?U.x:0,ge=U!==null?U.y:0;C.setTexture2D(T,0),L.copyTexSubImage2D(L.TEXTURE_2D,H,0,0,ce,ge,O,ne),Re.unbindTexture()},this.copyTextureToTexture=function(T,U,H=null,V=null,O=0){T.isTexture!==!0&&(so("WebGLRenderer: copyTextureToTexture function signature has changed."),V=arguments[0]||null,T=arguments[1],U=arguments[2],O=arguments[3]||0,H=null);let ne,ce,ge,_e,Se,Ee;H!==null?(ne=H.max.x-H.min.x,ce=H.max.y-H.min.y,ge=H.min.x,_e=H.min.y):(ne=T.image.width,ce=T.image.height,ge=0,_e=0),V!==null?(Se=V.x,Ee=V.y):(Se=0,Ee=0);let ve=Ue.convert(U.format),et=Ue.convert(U.type);C.setTexture2D(U,0),L.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,U.flipY),L.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),L.pixelStorei(L.UNPACK_ALIGNMENT,U.unpackAlignment);let at=L.getParameter(L.UNPACK_ROW_LENGTH),pt=L.getParameter(L.UNPACK_IMAGE_HEIGHT),Jt=L.getParameter(L.UNPACK_SKIP_PIXELS),$e=L.getParameter(L.UNPACK_SKIP_ROWS),Me=L.getParameter(L.UNPACK_SKIP_IMAGES),Lt=T.isCompressedTexture?T.mipmaps[O]:T.image;L.pixelStorei(L.UNPACK_ROW_LENGTH,Lt.width),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,Lt.height),L.pixelStorei(L.UNPACK_SKIP_PIXELS,ge),L.pixelStorei(L.UNPACK_SKIP_ROWS,_e),T.isDataTexture?L.texSubImage2D(L.TEXTURE_2D,O,Se,Ee,ne,ce,ve,et,Lt.data):T.isCompressedTexture?L.compressedTexSubImage2D(L.TEXTURE_2D,O,Se,Ee,Lt.width,Lt.height,ve,Lt.data):L.texSubImage2D(L.TEXTURE_2D,O,Se,Ee,ne,ce,ve,et,Lt),L.pixelStorei(L.UNPACK_ROW_LENGTH,at),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,pt),L.pixelStorei(L.UNPACK_SKIP_PIXELS,Jt),L.pixelStorei(L.UNPACK_SKIP_ROWS,$e),L.pixelStorei(L.UNPACK_SKIP_IMAGES,Me),O===0&&U.generateMipmaps&&L.generateMipmap(L.TEXTURE_2D),Re.unbindTexture()},this.copyTextureToTexture3D=function(T,U,H=null,V=null,O=0){T.isTexture!==!0&&(so("WebGLRenderer: copyTextureToTexture3D function signature has changed."),H=arguments[0]||null,V=arguments[1]||null,T=arguments[2],U=arguments[3],O=arguments[4]||0);let ne,ce,ge,_e,Se,Ee,ve,et,at,pt=T.isCompressedTexture?T.mipmaps[O]:T.image;H!==null?(ne=H.max.x-H.min.x,ce=H.max.y-H.min.y,ge=H.max.z-H.min.z,_e=H.min.x,Se=H.min.y,Ee=H.min.z):(ne=pt.width,ce=pt.height,ge=pt.depth,_e=0,Se=0,Ee=0),V!==null?(ve=V.x,et=V.y,at=V.z):(ve=0,et=0,at=0);let Jt=Ue.convert(U.format),$e=Ue.convert(U.type),Me;if(U.isData3DTexture)C.setTexture3D(U,0),Me=L.TEXTURE_3D;else if(U.isDataArrayTexture||U.isCompressedArrayTexture)C.setTexture2DArray(U,0),Me=L.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}L.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,U.flipY),L.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),L.pixelStorei(L.UNPACK_ALIGNMENT,U.unpackAlignment);let Lt=L.getParameter(L.UNPACK_ROW_LENGTH),Qe=L.getParameter(L.UNPACK_IMAGE_HEIGHT),mn=L.getParameter(L.UNPACK_SKIP_PIXELS),Fi=L.getParameter(L.UNPACK_SKIP_ROWS),jt=L.getParameter(L.UNPACK_SKIP_IMAGES);L.pixelStorei(L.UNPACK_ROW_LENGTH,pt.width),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,pt.height),L.pixelStorei(L.UNPACK_SKIP_PIXELS,_e),L.pixelStorei(L.UNPACK_SKIP_ROWS,Se),L.pixelStorei(L.UNPACK_SKIP_IMAGES,Ee),T.isDataTexture||T.isData3DTexture?L.texSubImage3D(Me,O,ve,et,at,ne,ce,ge,Jt,$e,pt.data):U.isCompressedArrayTexture?L.compressedTexSubImage3D(Me,O,ve,et,at,ne,ce,ge,Jt,pt.data):L.texSubImage3D(Me,O,ve,et,at,ne,ce,ge,Jt,$e,pt),L.pixelStorei(L.UNPACK_ROW_LENGTH,Lt),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,Qe),L.pixelStorei(L.UNPACK_SKIP_PIXELS,mn),L.pixelStorei(L.UNPACK_SKIP_ROWS,Fi),L.pixelStorei(L.UNPACK_SKIP_IMAGES,jt),O===0&&U.generateMipmaps&&L.generateMipmap(Me),Re.unbindTexture()},this.initRenderTarget=function(T){Pe.get(T).__webglFramebuffer===void 0&&C.setupRenderTarget(T)},this.initTexture=function(T){T.isCubeTexture?C.setTextureCube(T,0):T.isData3DTexture?C.setTexture3D(T,0):T.isDataArrayTexture||T.isCompressedArrayTexture?C.setTexture2DArray(T,0):C.setTexture2D(T,0),Re.unbindTexture()},this.resetState=function(){A=0,w=0,R=null,Re.reset(),rt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return kn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=e===El?"display-p3":"srgb",t.unpackColorSpace=Ye.workingColorSpace===Yo?"display-p3":"srgb"}};var Tn=class extends ft{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ln,this.environmentIntensity=1,this.environmentRotation=new ln,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},Js=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Lc,this.updateRanges=[],this.version=0,this.uuid=cn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let i=0,r=this.stride;i<r;i++)this.array[e+i]=t.array[n+i];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=cn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=cn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},Bt=new E,js=class s{constructor(e,t,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Bt.fromBufferAttribute(this,t),Bt.applyMatrix4(e),this.setXYZ(t,Bt.x,Bt.y,Bt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Bt.fromBufferAttribute(this,t),Bt.applyNormalMatrix(e),this.setXYZ(t,Bt.x,Bt.y,Bt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Bt.fromBufferAttribute(this,t),Bt.transformDirection(e),this.setXYZ(t,Bt.x,Bt.y,Bt.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=vn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=tt(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=tt(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=tt(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=tt(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=tt(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=vn(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=vn(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=vn(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=vn(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=tt(t,this.array),n=tt(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=tt(t,this.array),n=tt(n,this.array),i=tt(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=tt(t,this.array),n=tt(n,this.array),i=tt(i,this.array),r=tt(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this.data.array[e+3]=r,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return new ke(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new s(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}};var zu=new E,ku=new je,Hu=new je,Ey=new E,Vu=new Te,Gr=new E,Ha=new en,Gu=new Te,Va=new ai,yo=class extends ye{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=Zh,this.bindMatrix=new Te,this.bindMatrixInverse=new Te,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;this.boundingBox===null&&(this.boundingBox=new Yt),this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,Gr),this.boundingBox.expandByPoint(Gr)}computeBoundingSphere(){let e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new en),this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,Gr),this.boundingSphere.expandByPoint(Gr)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){let n=this.material,i=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ha.copy(this.boundingSphere),Ha.applyMatrix4(i),e.ray.intersectsSphere(Ha)!==!1&&(Gu.copy(i).invert(),Va.copy(e.ray).applyMatrix4(Gu),!(this.boundingBox!==null&&Va.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,Va)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new je,t=this.geometry.attributes.skinWeight;for(let n=0,i=t.count;n<i;n++){e.fromBufferAttribute(t,n);let r=1/e.manhattanLength();r!==1/0?e.multiplyScalar(r):e.set(1,0,0,0),t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===Zh?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===Qf?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let n=this.skeleton,i=this.geometry;ku.fromBufferAttribute(i.attributes.skinIndex,e),Hu.fromBufferAttribute(i.attributes.skinWeight,e),zu.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let r=0;r<4;r++){let o=Hu.getComponent(r);if(o!==0){let a=ku.getComponent(r);Vu.multiplyMatrices(n.bones[a].matrixWorld,n.boneInverses[a]),t.addScaledVector(Ey.copy(zu).applyMatrix4(Vu),o)}}return t.applyMatrix4(this.bindMatrixInverse)}},$s=class extends ft{constructor(){super(),this.isBone=!0,this.type="Bone"}},xs=class extends bt{constructor(e=null,t=1,n=1,i,r,o,a,c,l=Ct,h=Ct,u,d){super(null,o,a,c,l,h,i,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Wu=new Te,Ay=new Te,xo=class s{constructor(e=[],t=[]){this.uuid=cn(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,i=this.bones.length;n<i;n++)this.boneInverses.push(new Te)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let n=new Te;this.bones[e]&&n.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];n&&n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){let e=this.bones,t=this.boneInverses,n=this.boneMatrices,i=this.boneTexture;for(let r=0,o=e.length;r<o;r++){let a=e[r]?e[r].matrixWorld:Ay;Wu.multiplyMatrices(a,t[r]),Wu.toArray(n,r*16)}i!==null&&(i.needsUpdate=!0)}clone(){return new s(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let n=new xs(t,e,e,Ot,bn);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){let i=this.bones[t];if(i.name===e)return i}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,i=e.bones.length;n<i;n++){let r=e.bones[n],o=t[r];o===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",r),o=new $s),this.bones.push(o),this.boneInverses.push(new Te().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){let e={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,n=this.boneInverses;for(let i=0,r=t.length;i<r;i++){let o=t[i];e.bones.push(o.uuid);let a=n[i];e.boneInverses.push(a.toArray())}return e}},Ii=class extends ke{constructor(e,t,n,i=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},$i=new Te,Xu=new Te,Wr=[],Yu=new Yt,Ry=new Te,Os=new ye,Fs=new en,vo=class extends ye{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Ii(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,Ry)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Yt),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,$i),Yu.copy(e.boundingBox).applyMatrix4($i),this.boundingBox.union(Yu)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new en),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,$i),Fs.copy(e.boundingSphere).applyMatrix4($i),this.boundingSphere.union(Fs)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,i=this.morphTexture.source.data.data,r=n.length+1,o=e*r+1;for(let a=0;a<n.length;a++)n[a]=i[o+a]}raycast(e,t){let n=this.matrixWorld,i=this.count;if(Os.geometry=this.geometry,Os.material=this.material,Os.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Fs.copy(this.boundingSphere),Fs.applyMatrix4(n),e.ray.intersectsSphere(Fs)!==!1))for(let r=0;r<i;r++){this.getMatrixAt(r,$i),Xu.multiplyMatrices(n,$i),Os.matrixWorld=Xu,Os.raycast(e,Wr);for(let o=0,a=Wr.length;o<a;o++){let c=Wr[o];c.instanceId=r,c.object=this,t.push(c)}Wr.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Ii(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let n=t.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new xs(new Float32Array(i*this.count),i,this.count,xl,bn));let r=this.morphTexture.source.data.data,o=0;for(let l=0;l<n.length;l++)o+=n[l];let a=this.geometry.morphTargetsRelative?1:1-o,c=i*e;r[c]=a,r.set(n,c+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}};var Qs=class extends tn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new be(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Mo=new E,bo=new E,qu=new Te,Bs=new ai,Xr=new en,Ga=new E,Ku=new E,vs=class extends ft{constructor(e=new ht,t=new Qs){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let i=1,r=t.count;i<r;i++)Mo.fromBufferAttribute(t,i-1),bo.fromBufferAttribute(t,i),n[i]=n[i-1],n[i]+=Mo.distanceTo(bo);e.setAttribute("lineDistance",new Oe(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let n=this.geometry,i=this.matrixWorld,r=e.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Xr.copy(n.boundingSphere),Xr.applyMatrix4(i),Xr.radius+=r,e.ray.intersectsSphere(Xr)===!1)return;qu.copy(i).invert(),Bs.copy(e.ray).applyMatrix4(qu);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=this.isLineSegments?2:1,h=n.index,d=n.attributes.position;if(h!==null){let f=Math.max(0,o.start),m=Math.min(h.count,o.start+o.count);for(let _=f,p=m-1;_<p;_+=l){let g=h.getX(_),M=h.getX(_+1),x=Yr(this,e,Bs,c,g,M);x&&t.push(x)}if(this.isLineLoop){let _=h.getX(m-1),p=h.getX(f),g=Yr(this,e,Bs,c,_,p);g&&t.push(g)}}else{let f=Math.max(0,o.start),m=Math.min(d.count,o.start+o.count);for(let _=f,p=m-1;_<p;_+=l){let g=Yr(this,e,Bs,c,_,_+1);g&&t.push(g)}if(this.isLineLoop){let _=Yr(this,e,Bs,c,m-1,f);_&&t.push(_)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){let a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Yr(s,e,t,n,i,r){let o=s.geometry.attributes.position;if(Mo.fromBufferAttribute(o,i),bo.fromBufferAttribute(o,r),t.distanceSqToSegment(Mo,bo,Ga,Ku)>n)return;Ga.applyMatrix4(s.matrixWorld);let c=e.ray.origin.distanceTo(Ga);if(!(c<e.near||c>e.far))return{distance:c,point:Ku.clone().applyMatrix4(s.matrixWorld),index:i,face:null,faceIndex:null,barycoord:null,object:s}}var Zu=new E,Ju=new E,So=class extends vs{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let i=0,r=t.count;i<r;i+=2)Zu.fromBufferAttribute(t,i),Ju.fromBufferAttribute(t,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+Zu.distanceTo(Ju);e.setAttribute("lineDistance",new Oe(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},To=class extends vs{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}},er=class extends tn{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new be(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},ju=new Te,Zc=new ai,qr=new en,Kr=new E,wo=class extends ft{constructor(e=new ht,t=new er){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let n=this.geometry,i=this.matrixWorld,r=e.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),qr.copy(n.boundingSphere),qr.applyMatrix4(i),qr.radius+=r,e.ray.intersectsSphere(qr)===!1)return;ju.copy(i).invert(),Zc.copy(e.ray).applyMatrix4(ju);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=n.index,u=n.attributes.position;if(l!==null){let d=Math.max(0,o.start),f=Math.min(l.count,o.start+o.count);for(let m=d,_=f;m<_;m++){let p=l.getX(m);Kr.fromBufferAttribute(u,p),$u(Kr,p,c,i,e,t,this)}}else{let d=Math.max(0,o.start),f=Math.min(u.count,o.start+o.count);for(let m=d,_=f;m<_;m++)Kr.fromBufferAttribute(u,m),$u(Kr,m,c,i,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){let a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function $u(s,e,t,n,i,r,o){let a=Zc.distanceSqToPoint(s);if(a<t){let c=new E;Zc.closestPointToPoint(s,c),c.applyMatrix4(n);let l=i.ray.origin.distanceTo(c);if(l<i.near||l>i.far)return;r.push({distance:l,distanceToRay:Math.sqrt(a),point:c,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}var Ms=class extends bt{constructor(e,t,n,i,r,o,a,c,l,h,u,d){super(null,o,a,c,l,h,i,r,u,d),this.isCompressedTexture=!0,this.image={width:t,height:n},this.mipmaps=e,this.flipY=!1,this.generateMipmaps=!1}};var Eo=class extends bt{constructor(e,t,n,i,r,o,a,c,l){super(e,t,n,i,r,o,a,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}},un=class{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,i=this.getPoint(0),r=0;t.push(0);for(let o=1;o<=e;o++)n=this.getPoint(o/e),r+=n.distanceTo(i),t.push(r),i=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t){let n=this.getLengths(),i=0,r=n.length,o;t?o=t:o=e*n[r-1];let a=0,c=r-1,l;for(;a<=c;)if(i=Math.floor(a+(c-a)/2),l=n[i]-o,l<0)a=i+1;else if(l>0)c=i-1;else{c=i;break}if(i=c,n[i]===o)return i/(r-1);let h=n[i],d=n[i+1]-h,f=(o-h)/d;return(i+f)/(r-1)}getTangent(e,t){let i=e-1e-4,r=e+1e-4;i<0&&(i=0),r>1&&(r=1);let o=this.getPoint(i),a=this.getPoint(r),c=t||(o.isVector2?new ie:new E);return c.copy(a).sub(o).normalize(),c}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t){let n=new E,i=[],r=[],o=[],a=new E,c=new Te;for(let f=0;f<=e;f++){let m=f/e;i[f]=this.getTangentAt(m,new E)}r[0]=new E,o[0]=new E;let l=Number.MAX_VALUE,h=Math.abs(i[0].x),u=Math.abs(i[0].y),d=Math.abs(i[0].z);h<=l&&(l=h,n.set(1,0,0)),u<=l&&(l=u,n.set(0,1,0)),d<=l&&n.set(0,0,1),a.crossVectors(i[0],n).normalize(),r[0].crossVectors(i[0],a),o[0].crossVectors(i[0],r[0]);for(let f=1;f<=e;f++){if(r[f]=r[f-1].clone(),o[f]=o[f-1].clone(),a.crossVectors(i[f-1],i[f]),a.length()>Number.EPSILON){a.normalize();let m=Math.acos(Mt(i[f-1].dot(i[f]),-1,1));r[f].applyMatrix4(c.makeRotationAxis(a,m))}o[f].crossVectors(i[f],r[f])}if(t===!0){let f=Math.acos(Mt(r[0].dot(r[e]),-1,1));f/=e,i[0].dot(a.crossVectors(r[0],r[e]))>0&&(f=-f);for(let m=1;m<=e;m++)r[m].applyMatrix4(c.makeRotationAxis(i[m],f*m)),o[m].crossVectors(i[m],r[m])}return{tangents:i,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},tr=class extends un{constructor(e=0,t=0,n=1,i=1,r=0,o=Math.PI*2,a=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=i,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=c}getPoint(e,t=new ie){let n=t,i=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=i;for(;r>i;)r-=i;r<Number.EPSILON&&(o?r=0:r=i),this.aClockwise===!0&&!o&&(r===i?r=-i:r=r-i);let a=this.aStartAngle+e*r,c=this.aX+this.xRadius*Math.cos(a),l=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=c-this.aX,f=l-this.aY;c=d*h-f*u+this.aX,l=d*u+f*h+this.aY}return n.set(c,l)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Jc=class extends tr{constructor(e,t,n,i,r,o){super(e,t,n,n,i,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function Cl(){let s=0,e=0,t=0,n=0;function i(r,o,a,c){s=r,e=a,t=-3*r+3*o-2*a-c,n=2*r-2*o+a+c}return{initCatmullRom:function(r,o,a,c,l){i(o,a,l*(a-r),l*(c-o))},initNonuniformCatmullRom:function(r,o,a,c,l,h,u){let d=(o-r)/l-(a-r)/(l+h)+(a-o)/h,f=(a-o)/h-(c-o)/(h+u)+(c-a)/u;d*=h,f*=h,i(o,a,d,f)},calc:function(r){let o=r*r,a=o*r;return s+e*r+t*o+n*a}}}var Zr=new E,Wa=new Cl,Xa=new Cl,Ya=new Cl,Gn=class extends un{constructor(e=[],t=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=i}getPoint(e,t=new E){let n=t,i=this.points,r=i.length,o=(r-(this.closed?0:1))*e,a=Math.floor(o),c=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:c===0&&a===r-1&&(a=r-2,c=1);let l,h;this.closed||a>0?l=i[(a-1)%r]:(Zr.subVectors(i[0],i[1]).add(i[0]),l=Zr);let u=i[a%r],d=i[(a+1)%r];if(this.closed||a+2<r?h=i[(a+2)%r]:(Zr.subVectors(i[r-1],i[r-2]).add(i[r-1]),h=Zr),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,m=Math.pow(l.distanceToSquared(u),f),_=Math.pow(u.distanceToSquared(d),f),p=Math.pow(d.distanceToSquared(h),f);_<1e-4&&(_=1),m<1e-4&&(m=_),p<1e-4&&(p=_),Wa.initNonuniformCatmullRom(l.x,u.x,d.x,h.x,m,_,p),Xa.initNonuniformCatmullRom(l.y,u.y,d.y,h.y,m,_,p),Ya.initNonuniformCatmullRom(l.z,u.z,d.z,h.z,m,_,p)}else this.curveType==="catmullrom"&&(Wa.initCatmullRom(l.x,u.x,d.x,h.x,this.tension),Xa.initCatmullRom(l.y,u.y,d.y,h.y,this.tension),Ya.initCatmullRom(l.z,u.z,d.z,h.z,this.tension));return n.set(Wa.calc(c),Xa.calc(c),Ya.calc(c)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(i.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let i=this.points[t];e.points.push(i.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(new E().fromArray(i))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Qu(s,e,t,n,i){let r=(n-e)*.5,o=(i-t)*.5,a=s*s,c=s*a;return(2*t-2*n+r+o)*c+(-3*t+3*n-2*r-o)*a+r*s+t}function Cy(s,e){let t=1-s;return t*t*e}function Iy(s,e){return 2*(1-s)*s*e}function Py(s,e){return s*s*e}function Ws(s,e,t,n){return Cy(s,e)+Iy(s,t)+Py(s,n)}function Ly(s,e){let t=1-s;return t*t*t*e}function Dy(s,e){let t=1-s;return 3*t*t*s*e}function Ny(s,e){return 3*(1-s)*s*s*e}function Uy(s,e){return s*s*s*e}function Xs(s,e,t,n,i){return Ly(s,e)+Dy(s,t)+Ny(s,n)+Uy(s,i)}var Ao=class extends un{constructor(e=new ie,t=new ie,n=new ie,i=new ie){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new ie){let n=t,i=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(Xs(e,i.x,r.x,o.x,a.x),Xs(e,i.y,r.y,o.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},jc=class extends un{constructor(e=new E,t=new E,n=new E,i=new E){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new E){let n=t,i=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(Xs(e,i.x,r.x,o.x,a.x),Xs(e,i.y,r.y,o.y,a.y),Xs(e,i.z,r.z,o.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Ro=class extends un{constructor(e=new ie,t=new ie){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ie){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ie){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},$c=class extends un{constructor(e=new E,t=new E){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new E){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new E){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Co=class extends un{constructor(e=new ie,t=new ie,n=new ie){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new ie){let n=t,i=this.v0,r=this.v1,o=this.v2;return n.set(Ws(e,i.x,r.x,o.x),Ws(e,i.y,r.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Io=class extends un{constructor(e=new E,t=new E,n=new E){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new E){let n=t,i=this.v0,r=this.v1,o=this.v2;return n.set(Ws(e,i.x,r.x,o.x),Ws(e,i.y,r.y,o.y),Ws(e,i.z,r.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Po=class extends un{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ie){let n=t,i=this.points,r=(i.length-1)*e,o=Math.floor(r),a=r-o,c=i[o===0?o:o-1],l=i[o],h=i[o>i.length-2?i.length-1:o+1],u=i[o>i.length-3?i.length-1:o+2];return n.set(Qu(a,c.x,l.x,h.x,u.x),Qu(a,c.y,l.y,h.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(i.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let i=this.points[t];e.points.push(i.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(new ie().fromArray(i))}return this}},Qc=Object.freeze({__proto__:null,ArcCurve:Jc,CatmullRomCurve3:Gn,CubicBezierCurve:Ao,CubicBezierCurve3:jc,EllipseCurve:tr,LineCurve:Ro,LineCurve3:$c,QuadraticBezierCurve:Co,QuadraticBezierCurve3:Io,SplineCurve:Po}),el=class extends un{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Qc[n](t,e))}return this}getPoint(e,t){let n=e*this.getLength(),i=this.getCurveLengths(),r=0;for(;r<i.length;){if(i[r]>=n){let o=i[r]-n,a=this.curves[r],c=a.getLength(),l=c===0?0:1-o/c;return a.getPointAt(l,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let n=0,i=this.curves.length;n<i;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],n;for(let i=0,r=this.curves;i<r.length;i++){let o=r[i],a=o.isEllipseCurve?e*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?e*o.points.length:e,c=o.getPoints(a);for(let l=0;l<c.length;l++){let h=c[l];n&&n.equals(h)||(t.push(h),n=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let i=e.curves[t];this.curves.push(i.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){let i=this.curves[t];e.curves.push(i.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let i=e.curves[t];this.curves.push(new Qc[i.type]().fromJSON(i))}return this}},Lo=class extends el{constructor(e){super(),this.type="Path",this.currentPoint=new ie,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let n=new Ro(this.currentPoint.clone(),new ie(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,i){let r=new Co(this.currentPoint.clone(),new ie(e,t),new ie(n,i));return this.curves.push(r),this.currentPoint.set(n,i),this}bezierCurveTo(e,t,n,i,r,o){let a=new Ao(this.currentPoint.clone(),new ie(e,t),new ie(n,i),new ie(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),n=new Po(t);return this.curves.push(n),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,i,r,o){let a=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(e+a,t+c,n,i,r,o),this}absarc(e,t,n,i,r,o){return this.absellipse(e,t,n,n,i,r,o),this}ellipse(e,t,n,i,r,o,a,c){let l=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+l,t+h,n,i,r,o,a,c),this}absellipse(e,t,n,i,r,o,a,c){let l=new tr(e,t,n,i,r,o,a,c);if(this.curves.length>0){let u=l.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(l);let h=l.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}};var nr=class s extends ht{constructor(e=1,t=32,n=0,i=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:i},t=Math.max(3,t);let r=[],o=[],a=[],c=[],l=new E,h=new ie;o.push(0,0,0),a.push(0,0,1),c.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let f=n+u/t*i;l.x=e*Math.cos(f),l.y=e*Math.sin(f),o.push(l.x,l.y,l.z),a.push(0,0,1),h.x=(o[d]/e+1)/2,h.y=(o[d+1]/e+1)/2,c.push(h.x,h.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new Oe(o,3)),this.setAttribute("normal",new Oe(a,3)),this.setAttribute("uv",new Oe(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.segments,e.thetaStart,e.thetaLength)}},ut=class s extends ht{constructor(e=1,t=1,n=1,i=32,r=1,o=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:i,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:c};let l=this;i=Math.floor(i),r=Math.floor(r);let h=[],u=[],d=[],f=[],m=0,_=[],p=n/2,g=0;M(),o===!1&&(e>0&&x(!0),t>0&&x(!1)),this.setIndex(h),this.setAttribute("position",new Oe(u,3)),this.setAttribute("normal",new Oe(d,3)),this.setAttribute("uv",new Oe(f,2));function M(){let y=new E,A=new E,w=0,R=(t-e)/n;for(let I=0;I<=r;I++){let N=[],v=I/r,S=v*(t-e)+e;for(let F=0;F<=i;F++){let B=F/i,G=B*c+a,Y=Math.sin(G),P=Math.cos(G);A.x=S*Y,A.y=-v*n+p,A.z=S*P,u.push(A.x,A.y,A.z),y.set(Y,R,P).normalize(),d.push(y.x,y.y,y.z),f.push(B,1-v),N.push(m++)}_.push(N)}for(let I=0;I<i;I++)for(let N=0;N<r;N++){let v=_[N][I],S=_[N+1][I],F=_[N+1][I+1],B=_[N][I+1];e>0&&(h.push(v,S,B),w+=3),t>0&&(h.push(S,F,B),w+=3)}l.addGroup(g,w,0),g+=w}function x(y){let A=m,w=new ie,R=new E,I=0,N=y===!0?e:t,v=y===!0?1:-1;for(let F=1;F<=i;F++)u.push(0,p*v,0),d.push(0,v,0),f.push(.5,.5),m++;let S=m;for(let F=0;F<=i;F++){let G=F/i*c+a,Y=Math.cos(G),P=Math.sin(G);R.x=N*P,R.y=p*v,R.z=N*Y,u.push(R.x,R.y,R.z),d.push(0,v,0),w.x=Y*.5+.5,w.y=P*.5*v+.5,f.push(w.x,w.y),m++}for(let F=0;F<i;F++){let B=A+F,G=S+F;y===!0?h.push(G,G+1,B):h.push(G+1,G,B),I+=3}l.addGroup(g,I,y===!0?1:2),g+=I}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},bs=class s extends ut{constructor(e=1,t=1,n=32,i=1,r=!1,o=0,a=Math.PI*2){super(0,e,t,n,i,r,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:i,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(e){return new s(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Do=class s extends ht{constructor(e=[],t=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:i};let r=[],o=[];a(i),l(n),h(),this.setAttribute("position",new Oe(r,3)),this.setAttribute("normal",new Oe(r.slice(),3)),this.setAttribute("uv",new Oe(o,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function a(M){let x=new E,y=new E,A=new E;for(let w=0;w<t.length;w+=3)f(t[w+0],x),f(t[w+1],y),f(t[w+2],A),c(x,y,A,M)}function c(M,x,y,A){let w=A+1,R=[];for(let I=0;I<=w;I++){R[I]=[];let N=M.clone().lerp(y,I/w),v=x.clone().lerp(y,I/w),S=w-I;for(let F=0;F<=S;F++)F===0&&I===w?R[I][F]=N:R[I][F]=N.clone().lerp(v,F/S)}for(let I=0;I<w;I++)for(let N=0;N<2*(w-I)-1;N++){let v=Math.floor(N/2);N%2===0?(d(R[I][v+1]),d(R[I+1][v]),d(R[I][v])):(d(R[I][v+1]),d(R[I+1][v+1]),d(R[I+1][v]))}}function l(M){let x=new E;for(let y=0;y<r.length;y+=3)x.x=r[y+0],x.y=r[y+1],x.z=r[y+2],x.normalize().multiplyScalar(M),r[y+0]=x.x,r[y+1]=x.y,r[y+2]=x.z}function h(){let M=new E;for(let x=0;x<r.length;x+=3){M.x=r[x+0],M.y=r[x+1],M.z=r[x+2];let y=p(M)/2/Math.PI+.5,A=g(M)/Math.PI+.5;o.push(y,1-A)}m(),u()}function u(){for(let M=0;M<o.length;M+=6){let x=o[M+0],y=o[M+2],A=o[M+4],w=Math.max(x,y,A),R=Math.min(x,y,A);w>.9&&R<.1&&(x<.2&&(o[M+0]+=1),y<.2&&(o[M+2]+=1),A<.2&&(o[M+4]+=1))}}function d(M){r.push(M.x,M.y,M.z)}function f(M,x){let y=M*3;x.x=e[y+0],x.y=e[y+1],x.z=e[y+2]}function m(){let M=new E,x=new E,y=new E,A=new E,w=new ie,R=new ie,I=new ie;for(let N=0,v=0;N<r.length;N+=9,v+=6){M.set(r[N+0],r[N+1],r[N+2]),x.set(r[N+3],r[N+4],r[N+5]),y.set(r[N+6],r[N+7],r[N+8]),w.set(o[v+0],o[v+1]),R.set(o[v+2],o[v+3]),I.set(o[v+4],o[v+5]),A.copy(M).add(x).add(y).divideScalar(3);let S=p(A);_(w,v+0,M,S),_(R,v+2,x,S),_(I,v+4,y,S)}}function _(M,x,y,A){A<0&&M.x===1&&(o[x]=M.x-1),y.x===0&&y.z===0&&(o[x]=A/2/Math.PI+.5)}function p(M){return Math.atan2(M.z,-M.x)}function g(M){return Math.atan2(-M.y,Math.sqrt(M.x*M.x+M.z*M.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.vertices,e.indices,e.radius,e.details)}},ir=class s extends Do{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,i=1/n,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-i,-n,0,-i,n,0,i,-n,0,i,n,-i,-n,0,-i,n,0,i,-n,0,i,n,0,-n,0,-i,n,0,-i,-n,0,i,n,0,i],o=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,o,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new s(e.radius,e.detail)}};var sr=class extends Lo{constructor(e){super(e),this.uuid=cn(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let n=0,i=this.holes.length;n<i;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let i=e.holes[t];this.holes.push(i.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){let i=this.holes[t];e.holes.push(i.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let i=e.holes[t];this.holes.push(new Lo().fromJSON(i))}return this}},Oy={triangulate:function(s,e,t=2){let n=e&&e.length,i=n?e[0]*t:s.length,r=Id(s,0,i,t,!0),o=[];if(!r||r.next===r.prev)return o;let a,c,l,h,u,d,f;if(n&&(r=Hy(s,e,r,t)),s.length>80*t){a=l=s[0],c=h=s[1];for(let m=t;m<i;m+=t)u=s[m],d=s[m+1],u<a&&(a=u),d<c&&(c=d),u>l&&(l=u),d>h&&(h=d);f=Math.max(l-a,h-c),f=f!==0?32767/f:0}return rr(r,o,t,a,c,f,0),o}};function Id(s,e,t,n,i){let r,o;if(i===$y(s,e,t,n)>0)for(r=e;r<t;r+=n)o=ed(r,s[r],s[r+1],o);else for(r=t-n;r>=e;r-=n)o=ed(r,s[r],s[r+1],o);return o&&Ko(o,o.next)&&(ar(o),o=o.next),o}function Pi(s,e){if(!s)return s;e||(e=s);let t=s,n;do if(n=!1,!t.steiner&&(Ko(t,t.next)||dt(t.prev,t,t.next)===0)){if(ar(t),t=e=t.prev,t===t.next)break;n=!0}else t=t.next;while(n||t!==e);return e}function rr(s,e,t,n,i,r,o){if(!s)return;!o&&r&&Yy(s,n,i,r);let a=s,c,l;for(;s.prev!==s.next;){if(c=s.prev,l=s.next,r?By(s,n,i,r):Fy(s)){e.push(c.i/t|0),e.push(s.i/t|0),e.push(l.i/t|0),ar(s),s=l.next,a=l.next;continue}if(s=l,s===a){o?o===1?(s=zy(Pi(s),e,t),rr(s,e,t,n,i,r,2)):o===2&&ky(s,e,t,n,i,r):rr(Pi(s),e,t,n,i,r,1);break}}}function Fy(s){let e=s.prev,t=s,n=s.next;if(dt(e,t,n)>=0)return!1;let i=e.x,r=t.x,o=n.x,a=e.y,c=t.y,l=n.y,h=i<r?i<o?i:o:r<o?r:o,u=a<c?a<l?a:l:c<l?c:l,d=i>r?i>o?i:o:r>o?r:o,f=a>c?a>l?a:l:c>l?c:l,m=n.next;for(;m!==e;){if(m.x>=h&&m.x<=d&&m.y>=u&&m.y<=f&&ns(i,a,r,c,o,l,m.x,m.y)&&dt(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function By(s,e,t,n){let i=s.prev,r=s,o=s.next;if(dt(i,r,o)>=0)return!1;let a=i.x,c=r.x,l=o.x,h=i.y,u=r.y,d=o.y,f=a<c?a<l?a:l:c<l?c:l,m=h<u?h<d?h:d:u<d?u:d,_=a>c?a>l?a:l:c>l?c:l,p=h>u?h>d?h:d:u>d?u:d,g=tl(f,m,e,t,n),M=tl(_,p,e,t,n),x=s.prevZ,y=s.nextZ;for(;x&&x.z>=g&&y&&y.z<=M;){if(x.x>=f&&x.x<=_&&x.y>=m&&x.y<=p&&x!==i&&x!==o&&ns(a,h,c,u,l,d,x.x,x.y)&&dt(x.prev,x,x.next)>=0||(x=x.prevZ,y.x>=f&&y.x<=_&&y.y>=m&&y.y<=p&&y!==i&&y!==o&&ns(a,h,c,u,l,d,y.x,y.y)&&dt(y.prev,y,y.next)>=0))return!1;y=y.nextZ}for(;x&&x.z>=g;){if(x.x>=f&&x.x<=_&&x.y>=m&&x.y<=p&&x!==i&&x!==o&&ns(a,h,c,u,l,d,x.x,x.y)&&dt(x.prev,x,x.next)>=0)return!1;x=x.prevZ}for(;y&&y.z<=M;){if(y.x>=f&&y.x<=_&&y.y>=m&&y.y<=p&&y!==i&&y!==o&&ns(a,h,c,u,l,d,y.x,y.y)&&dt(y.prev,y,y.next)>=0)return!1;y=y.nextZ}return!0}function zy(s,e,t){let n=s;do{let i=n.prev,r=n.next.next;!Ko(i,r)&&Pd(i,n,n.next,r)&&or(i,r)&&or(r,i)&&(e.push(i.i/t|0),e.push(n.i/t|0),e.push(r.i/t|0),ar(n),ar(n.next),n=s=r),n=n.next}while(n!==s);return Pi(n)}function ky(s,e,t,n,i,r){let o=s;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&Zy(o,a)){let c=Ld(o,a);o=Pi(o,o.next),c=Pi(c,c.next),rr(o,e,t,n,i,r,0),rr(c,e,t,n,i,r,0);return}a=a.next}o=o.next}while(o!==s)}function Hy(s,e,t,n){let i=[],r,o,a,c,l;for(r=0,o=e.length;r<o;r++)a=e[r]*n,c=r<o-1?e[r+1]*n:s.length,l=Id(s,a,c,n,!1),l===l.next&&(l.steiner=!0),i.push(Ky(l));for(i.sort(Vy),r=0;r<i.length;r++)t=Gy(i[r],t);return t}function Vy(s,e){return s.x-e.x}function Gy(s,e){let t=Wy(s,e);if(!t)return e;let n=Ld(t,s);return Pi(n,n.next),Pi(t,t.next)}function Wy(s,e){let t=e,n=-1/0,i,r=s.x,o=s.y;do{if(o<=t.y&&o>=t.next.y&&t.next.y!==t.y){let d=t.x+(o-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(d<=r&&d>n&&(n=d,i=t.x<t.next.x?t:t.next,d===r))return i}t=t.next}while(t!==e);if(!i)return null;let a=i,c=i.x,l=i.y,h=1/0,u;t=i;do r>=t.x&&t.x>=c&&r!==t.x&&ns(o<l?r:n,o,c,l,o<l?n:r,o,t.x,t.y)&&(u=Math.abs(o-t.y)/(r-t.x),or(t,s)&&(u<h||u===h&&(t.x>i.x||t.x===i.x&&Xy(i,t)))&&(i=t,h=u)),t=t.next;while(t!==a);return i}function Xy(s,e){return dt(s.prev,s,e.prev)<0&&dt(e.next,s,s.next)<0}function Yy(s,e,t,n){let i=s;do i.z===0&&(i.z=tl(i.x,i.y,e,t,n)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==s);i.prevZ.nextZ=null,i.prevZ=null,qy(i)}function qy(s){let e,t,n,i,r,o,a,c,l=1;do{for(t=s,s=null,r=null,o=0;t;){for(o++,n=t,a=0,e=0;e<l&&(a++,n=n.nextZ,!!n);e++);for(c=l;a>0||c>0&&n;)a!==0&&(c===0||!n||t.z<=n.z)?(i=t,t=t.nextZ,a--):(i=n,n=n.nextZ,c--),r?r.nextZ=i:s=i,i.prevZ=r,r=i;t=n}r.nextZ=null,l*=2}while(o>1);return s}function tl(s,e,t,n,i){return s=(s-t)*i|0,e=(e-n)*i|0,s=(s|s<<8)&16711935,s=(s|s<<4)&252645135,s=(s|s<<2)&858993459,s=(s|s<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,s|e<<1}function Ky(s){let e=s,t=s;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==s);return t}function ns(s,e,t,n,i,r,o,a){return(i-o)*(e-a)>=(s-o)*(r-a)&&(s-o)*(n-a)>=(t-o)*(e-a)&&(t-o)*(r-a)>=(i-o)*(n-a)}function Zy(s,e){return s.next.i!==e.i&&s.prev.i!==e.i&&!Jy(s,e)&&(or(s,e)&&or(e,s)&&jy(s,e)&&(dt(s.prev,s,e.prev)||dt(s,e.prev,e))||Ko(s,e)&&dt(s.prev,s,s.next)>0&&dt(e.prev,e,e.next)>0)}function dt(s,e,t){return(e.y-s.y)*(t.x-e.x)-(e.x-s.x)*(t.y-e.y)}function Ko(s,e){return s.x===e.x&&s.y===e.y}function Pd(s,e,t,n){let i=jr(dt(s,e,t)),r=jr(dt(s,e,n)),o=jr(dt(t,n,s)),a=jr(dt(t,n,e));return!!(i!==r&&o!==a||i===0&&Jr(s,t,e)||r===0&&Jr(s,n,e)||o===0&&Jr(t,s,n)||a===0&&Jr(t,e,n))}function Jr(s,e,t){return e.x<=Math.max(s.x,t.x)&&e.x>=Math.min(s.x,t.x)&&e.y<=Math.max(s.y,t.y)&&e.y>=Math.min(s.y,t.y)}function jr(s){return s>0?1:s<0?-1:0}function Jy(s,e){let t=s;do{if(t.i!==s.i&&t.next.i!==s.i&&t.i!==e.i&&t.next.i!==e.i&&Pd(t,t.next,s,e))return!0;t=t.next}while(t!==s);return!1}function or(s,e){return dt(s.prev,s,s.next)<0?dt(s,e,s.next)>=0&&dt(s,s.prev,e)>=0:dt(s,e,s.prev)<0||dt(s,s.next,e)<0}function jy(s,e){let t=s,n=!1,i=(s.x+e.x)/2,r=(s.y+e.y)/2;do t.y>r!=t.next.y>r&&t.next.y!==t.y&&i<(t.next.x-t.x)*(r-t.y)/(t.next.y-t.y)+t.x&&(n=!n),t=t.next;while(t!==s);return n}function Ld(s,e){let t=new nl(s.i,s.x,s.y),n=new nl(e.i,e.x,e.y),i=s.next,r=e.prev;return s.next=e,e.prev=s,t.next=i,i.prev=t,n.next=t,t.prev=n,r.next=n,n.prev=r,n}function ed(s,e,t,n){let i=new nl(s,e,t);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function ar(s){s.next.prev=s.prev,s.prev.next=s.next,s.prevZ&&(s.prevZ.nextZ=s.nextZ),s.nextZ&&(s.nextZ.prevZ=s.prevZ)}function nl(s,e,t){this.i=s,this.x=e,this.y=t,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function $y(s,e,t,n){let i=0;for(let r=e,o=t-n;r<t;r+=n)i+=(s[o]-s[r])*(s[r+1]+s[o+1]),o=r;return i}var Ys=class s{static area(e){let t=e.length,n=0;for(let i=t-1,r=0;r<t;i=r++)n+=e[i].x*e[r].y-e[r].x*e[i].y;return n*.5}static isClockWise(e){return s.area(e)<0}static triangulateShape(e,t){let n=[],i=[],r=[];td(e),nd(n,e);let o=e.length;t.forEach(td);for(let c=0;c<t.length;c++)i.push(o),o+=t[c].length,nd(n,t[c]);let a=Oy.triangulate(n,i);for(let c=0;c<a.length;c+=3)r.push(a.slice(c,c+3));return r}};function td(s){let e=s.length;e>2&&s[e-1].equals(s[0])&&s.pop()}function nd(s,e){for(let t=0;t<e.length;t++)s.push(e[t].x),s.push(e[t].y)}var Ss=class s extends Do{constructor(e=1,t=0){let n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],i=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,i,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new s(e.radius,e.detail)}};var No=class s extends ht{constructor(e=new sr([new ie(0,.5),new ie(-.5,-.5),new ie(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let n=[],i=[],r=[],o=[],a=0,c=0;if(Array.isArray(e)===!1)l(e);else for(let h=0;h<e.length;h++)l(e[h]),this.addGroup(a,c,h),a+=c,c=0;this.setIndex(n),this.setAttribute("position",new Oe(i,3)),this.setAttribute("normal",new Oe(r,3)),this.setAttribute("uv",new Oe(o,2));function l(h){let u=i.length/3,d=h.extractPoints(t),f=d.shape,m=d.holes;Ys.isClockWise(f)===!1&&(f=f.reverse());for(let p=0,g=m.length;p<g;p++){let M=m[p];Ys.isClockWise(M)===!0&&(m[p]=M.reverse())}let _=Ys.triangulateShape(f,m);for(let p=0,g=m.length;p<g;p++){let M=m[p];f=f.concat(M)}for(let p=0,g=f.length;p<g;p++){let M=f[p];i.push(M.x,M.y,0),r.push(0,0,1),o.push(M.x,M.y)}for(let p=0,g=_.length;p<g;p++){let M=_[p],x=M[0]+u,y=M[1]+u,A=M[2]+u;n.push(x,y,A),c+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return Qy(t,e)}static fromJSON(e,t){let n=[];for(let i=0,r=e.shapes.length;i<r;i++){let o=t[e.shapes[i]];n.push(o)}return new s(n,e.curveSegments)}};function Qy(s,e){if(e.shapes=[],Array.isArray(s))for(let t=0,n=s.length;t<n;t++){let i=s[t];e.shapes.push(i.uuid)}else e.shapes.push(s.uuid);return e}var Dt=class s extends ht{constructor(e=1,t=32,n=16,i=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:i,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let c=Math.min(o+a,Math.PI),l=0,h=[],u=new E,d=new E,f=[],m=[],_=[],p=[];for(let g=0;g<=n;g++){let M=[],x=g/n,y=0;g===0&&o===0?y=.5/t:g===n&&c===Math.PI&&(y=-.5/t);for(let A=0;A<=t;A++){let w=A/t;u.x=-e*Math.cos(i+w*r)*Math.sin(o+x*a),u.y=e*Math.cos(o+x*a),u.z=e*Math.sin(i+w*r)*Math.sin(o+x*a),m.push(u.x,u.y,u.z),d.copy(u).normalize(),_.push(d.x,d.y,d.z),p.push(w+y,1-x),M.push(l++)}h.push(M)}for(let g=0;g<n;g++)for(let M=0;M<t;M++){let x=h[g][M+1],y=h[g][M],A=h[g+1][M],w=h[g+1][M+1];(g!==0||o>0)&&f.push(x,y,w),(g!==n-1||c<Math.PI)&&f.push(y,A,w)}this.setIndex(f),this.setAttribute("position",new Oe(m,3)),this.setAttribute("normal",new Oe(_,3)),this.setAttribute("uv",new Oe(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var Vt=class s extends ht{constructor(e=1,t=.4,n=12,i=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:i,arc:r},n=Math.floor(n),i=Math.floor(i);let o=[],a=[],c=[],l=[],h=new E,u=new E,d=new E;for(let f=0;f<=n;f++)for(let m=0;m<=i;m++){let _=m/i*r,p=f/n*Math.PI*2;u.x=(e+t*Math.cos(p))*Math.cos(_),u.y=(e+t*Math.cos(p))*Math.sin(_),u.z=t*Math.sin(p),a.push(u.x,u.y,u.z),h.x=e*Math.cos(_),h.y=e*Math.sin(_),d.subVectors(u,h).normalize(),c.push(d.x,d.y,d.z),l.push(m/i),l.push(f/n)}for(let f=1;f<=n;f++)for(let m=1;m<=i;m++){let _=(i+1)*f+m-1,p=(i+1)*(f-1)+m-1,g=(i+1)*(f-1)+m,M=(i+1)*f+m;o.push(_,p,M),o.push(p,g,M)}this.setIndex(o),this.setAttribute("position",new Oe(a,3)),this.setAttribute("normal",new Oe(c,3)),this.setAttribute("uv",new Oe(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var ci=class s extends ht{constructor(e=new Io(new E(-1,-1,0),new E(-1,1,0),new E(1,1,0)),t=64,n=1,i=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:n,radialSegments:i,closed:r};let o=e.computeFrenetFrames(t,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;let a=new E,c=new E,l=new ie,h=new E,u=[],d=[],f=[],m=[];_(),this.setIndex(m),this.setAttribute("position",new Oe(u,3)),this.setAttribute("normal",new Oe(d,3)),this.setAttribute("uv",new Oe(f,2));function _(){for(let x=0;x<t;x++)p(x);p(r===!1?t:0),M(),g()}function p(x){h=e.getPointAt(x/t,h);let y=o.normals[x],A=o.binormals[x];for(let w=0;w<=i;w++){let R=w/i*Math.PI*2,I=Math.sin(R),N=-Math.cos(R);c.x=N*y.x+I*A.x,c.y=N*y.y+I*A.y,c.z=N*y.z+I*A.z,c.normalize(),d.push(c.x,c.y,c.z),a.x=h.x+n*c.x,a.y=h.y+n*c.y,a.z=h.z+n*c.z,u.push(a.x,a.y,a.z)}}function g(){for(let x=1;x<=t;x++)for(let y=1;y<=i;y++){let A=(i+1)*(x-1)+(y-1),w=(i+1)*x+(y-1),R=(i+1)*x+y,I=(i+1)*(x-1)+y;m.push(A,w,I),m.push(w,R,I)}}function M(){for(let x=0;x<=t;x++)for(let y=0;y<=i;y++)l.x=x/t,l.y=y/i,f.push(l.x,l.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new s(new Qc[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};var wt=class extends tn{constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new be(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new be(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=vd,this.normalScale=new ie(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ln,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},It=class extends wt{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new ie(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Mt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new be(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new be(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new be(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};function $r(s,e,t){return!s||!t&&s.constructor===e?s:typeof e.BYTES_PER_ELEMENT=="number"?new e(s):Array.prototype.slice.call(s)}function ex(s){return ArrayBuffer.isView(s)&&!(s instanceof DataView)}function tx(s){function e(i,r){return s[i]-s[r]}let t=s.length,n=new Array(t);for(let i=0;i!==t;++i)n[i]=i;return n.sort(e),n}function id(s,e,t){let n=s.length,i=new s.constructor(n);for(let r=0,o=0;o!==n;++r){let a=t[r]*e;for(let c=0;c!==e;++c)i[o++]=s[a+c]}return i}function Dd(s,e,t,n){let i=1,r=s[0];for(;r!==void 0&&r[n]===void 0;)r=s[i++];if(r===void 0)return;let o=r[n];if(o!==void 0)if(Array.isArray(o))do o=r[n],o!==void 0&&(e.push(r.time),t.push.apply(t,o)),r=s[i++];while(r!==void 0);else if(o.toArray!==void 0)do o=r[n],o!==void 0&&(e.push(r.time),o.toArray(t,t.length)),r=s[i++];while(r!==void 0);else do o=r[n],o!==void 0&&(e.push(r.time),t.push(o)),r=s[i++];while(r!==void 0)}var li=class{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,i=t[n],r=t[n-1];e:{t:{let o;n:{i:if(!(e<i)){for(let a=n+2;;){if(i===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=i,i=t[++n],e<i)break t}o=t.length;break n}if(!(e>=r)){let a=t[1];e<a&&(n=2,r=a);for(let c=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(i=r,r=t[--n-1],e>=r)break t}o=n,n=0;break n}break e}for(;n<o;){let a=n+o>>>1;e<t[a]?o=a:n=a+1}if(i=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i;for(let o=0;o!==i;++o)t[o]=n[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},il=class extends li{constructor(e,t,n,i){super(e,t,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Qi,endingEnd:Qi}}intervalChanged_(e,t,n){let i=this.parameterPositions,r=e-2,o=e+1,a=i[r],c=i[o];if(a===void 0)switch(this.getSettings_().endingStart){case es:r=e,a=2*t-n;break;case ro:r=i.length-2,a=t+i[r]-i[r+1];break;default:r=e,a=n}if(c===void 0)switch(this.getSettings_().endingEnd){case es:o=e,c=2*n-t;break;case ro:o=1,c=n+i[1]-i[0];break;default:o=e-1,c=t}let l=(n-t)*.5,h=this.valueSize;this._weightPrev=l/(t-a),this._weightNext=l/(c-n),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,m=(n-t)/(i-t),_=m*m,p=_*m,g=-d*p+2*d*_-d*m,M=(1+d)*p+(-1.5-2*d)*_+(-.5+d)*m+1,x=(-1-f)*p+(1.5+f)*_+.5*m,y=f*p-f*_;for(let A=0;A!==a;++A)r[A]=g*o[h+A]+M*o[l+A]+x*o[c+A]+y*o[u+A];return r}},Uo=class extends li{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,h=(n-t)/(i-t),u=1-h;for(let d=0;d!==a;++d)r[d]=o[l+d]*u+o[c+d]*h;return r}},sl=class extends li{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}},dn=class{constructor(e,t,n,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=$r(t,this.TimeBufferType),this.values=$r(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:$r(e.times,Array),values:$r(e.values,Array)};let i=e.getInterpolation();i!==e.DefaultInterpolation&&(n.interpolation=i)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new sl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Uo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new il(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case ri:t=this.InterpolantFactoryMethodDiscrete;break;case oi:t=this.InterpolantFactoryMethodLinear;break;case fa:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return ri;case this.InterpolantFactoryMethodLinear:return oi;case this.InterpolantFactoryMethodSmooth:return fa}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e}return this}trim(e,t){let n=this.times,i=n.length,r=0,o=i-1;for(;r!==i&&n[r]<e;)++r;for(;o!==-1&&n[o]>t;)--o;if(++o,r!==0||o!==i){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,i=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let c=n[a];if(typeof c=="number"&&isNaN(c)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,c),e=!1;break}if(o!==null&&o>c){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,c,o),e=!1;break}o=c}if(i!==void 0&&ex(i))for(let a=0,c=i.length;a!==c;++a){let l=i[a];if(isNaN(l)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,l),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===fa,r=e.length-1,o=1;for(let a=1;a<r;++a){let c=!1,l=e[a],h=e[a+1];if(l!==h&&(a!==1||l!==e[0]))if(i)c=!0;else{let u=a*n,d=u-n,f=u+n;for(let m=0;m!==n;++m){let _=t[u+m];if(_!==t[d+m]||_!==t[f+m]){c=!0;break}}}if(c){if(a!==o){e[o]=e[a];let u=a*n,d=o*n;for(let f=0;f!==n;++f)t[d+f]=t[u+f]}++o}}if(r>0){e[o]=e[r];for(let a=r*n,c=o*n,l=0;l!==n;++l)t[c+l]=t[a+l];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,i=new n(this.name,e,t);return i.createInterpolant=this.createInterpolant,i}};dn.prototype.TimeBufferType=Float32Array;dn.prototype.ValueBufferType=Float32Array;dn.prototype.DefaultInterpolation=oi;var hi=class extends dn{constructor(e,t,n){super(e,t,n)}};hi.prototype.ValueTypeName="bool";hi.prototype.ValueBufferType=Array;hi.prototype.DefaultInterpolation=ri;hi.prototype.InterpolantFactoryMethodLinear=void 0;hi.prototype.InterpolantFactoryMethodSmooth=void 0;var Oo=class extends dn{};Oo.prototype.ValueTypeName="color";var Wn=class extends dn{};Wn.prototype.ValueTypeName="number";var rl=class extends li{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=(n-t)/(i-t),l=e*a;for(let h=l+a;l!==h;l+=4)lt.slerpFlat(r,0,o,l-a,o,l,c);return r}},wn=class extends dn{InterpolantFactoryMethodLinear(e){return new rl(this.times,this.values,this.getValueSize(),e)}};wn.prototype.ValueTypeName="quaternion";wn.prototype.InterpolantFactoryMethodSmooth=void 0;var ui=class extends dn{constructor(e,t,n){super(e,t,n)}};ui.prototype.ValueTypeName="string";ui.prototype.ValueBufferType=Array;ui.prototype.DefaultInterpolation=ri;ui.prototype.InterpolantFactoryMethodLinear=void 0;ui.prototype.InterpolantFactoryMethodSmooth=void 0;var nn=class extends dn{};nn.prototype.ValueTypeName="vector";var di=class{constructor(e="",t=-1,n=[],i=wl){this.name=e,this.tracks=n,this.duration=t,this.blendMode=i,this.uuid=cn(),this.duration<0&&this.resetDuration()}static parse(e){let t=[],n=e.tracks,i=1/(e.fps||1);for(let o=0,a=n.length;o!==a;++o)t.push(ix(n[o]).scale(i));let r=new this(e.name,e.duration,t,e.blendMode);return r.uuid=e.uuid,r}static toJSON(e){let t=[],n=e.tracks,i={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode};for(let r=0,o=n.length;r!==o;++r)t.push(dn.toJSON(n[r]));return i}static CreateFromMorphTargetSequence(e,t,n,i){let r=t.length,o=[];for(let a=0;a<r;a++){let c=[],l=[];c.push((a+r-1)%r,a,(a+1)%r),l.push(0,1,0);let h=tx(c);c=id(c,1,h),l=id(l,1,h),!i&&c[0]===0&&(c.push(r),l.push(l[0])),o.push(new Wn(".morphTargetInfluences["+t[a].name+"]",c,l).scale(1/n))}return new this(e,-1,o)}static findByName(e,t){let n=e;if(!Array.isArray(e)){let i=e;n=i.geometry&&i.geometry.animations||i.animations}for(let i=0;i<n.length;i++)if(n[i].name===t)return n[i];return null}static CreateClipsFromMorphTargetSequences(e,t,n){let i={},r=/^([\w-]*?)([\d]+)$/;for(let a=0,c=e.length;a<c;a++){let l=e[a],h=l.name.match(r);if(h&&h.length>1){let u=h[1],d=i[u];d||(i[u]=d=[]),d.push(l)}}let o=[];for(let a in i)o.push(this.CreateFromMorphTargetSequence(a,i[a],t,n));return o}static parseAnimation(e,t){if(!e)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;let n=function(u,d,f,m,_){if(f.length!==0){let p=[],g=[];Dd(f,p,g,m),p.length!==0&&_.push(new u(d,p,g))}},i=[],r=e.name||"default",o=e.fps||30,a=e.blendMode,c=e.length||-1,l=e.hierarchy||[];for(let u=0;u<l.length;u++){let d=l[u].keys;if(!(!d||d.length===0))if(d[0].morphTargets){let f={},m;for(m=0;m<d.length;m++)if(d[m].morphTargets)for(let _=0;_<d[m].morphTargets.length;_++)f[d[m].morphTargets[_]]=-1;for(let _ in f){let p=[],g=[];for(let M=0;M!==d[m].morphTargets.length;++M){let x=d[m];p.push(x.time),g.push(x.morphTarget===_?1:0)}i.push(new Wn(".morphTargetInfluence["+_+"]",p,g))}c=f.length*o}else{let f=".bones["+t[u].name+"]";n(nn,f+".position",d,"pos",i),n(wn,f+".quaternion",d,"rot",i),n(nn,f+".scale",d,"scl",i)}}return i.length===0?null:new this(r,c,i,a)}resetDuration(){let e=this.tracks,t=0;for(let n=0,i=e.length;n!==i;++n){let r=this.tracks[n];t=Math.max(t,r.times[r.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let t=0;t<this.tracks.length;t++)e.push(this.tracks[t].clone());return new this.constructor(this.name,this.duration,e,this.blendMode)}toJSON(){return this.constructor.toJSON(this)}};function nx(s){switch(s.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Wn;case"vector":case"vector2":case"vector3":case"vector4":return nn;case"color":return Oo;case"quaternion":return wn;case"bool":case"boolean":return hi;case"string":return ui}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+s)}function ix(s){if(s.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");let e=nx(s.type);if(s.times===void 0){let t=[],n=[];Dd(s.keys,t,n,"value"),s.times=t,s.values=n}return e.parse!==void 0?e.parse(s):new e(s.name,s.times,s.values,s.interpolation)}var ni={enabled:!1,files:{},add:function(s,e){this.enabled!==!1&&(this.files[s]=e)},get:function(s){if(this.enabled!==!1)return this.files[s]},remove:function(s){delete this.files[s]},clear:function(){this.files={}}},ol=class{constructor(e,t,n){let i=this,r=!1,o=0,a=0,c,l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(h){a++,r===!1&&i.onStart!==void 0&&i.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,i.onProgress!==void 0&&i.onProgress(h,o,a),o===a&&(r=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return c?c(h):h},this.setURLModifier=function(h){return c=h,this},this.addHandler=function(h,u){return l.push(h,u),this},this.removeHandler=function(h){let u=l.indexOf(h);return u!==-1&&l.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=l.length;u<d;u+=2){let f=l[u],m=l[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return m}return null}}},sx=new ol,Xn=class{constructor(e){this.manager=e!==void 0?e:sx,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};Xn.DEFAULT_MATERIAL_NAME="__DEFAULT";var Bn={},al=class extends Error{constructor(e,t){super(e),this.response=t}},cr=class extends Xn{constructor(e){super(e)}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=ni.get(e);if(r!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0),r;if(Bn[e]!==void 0){Bn[e].push({onLoad:t,onProgress:n,onError:i});return}Bn[e]=[],Bn[e].push({onLoad:t,onProgress:n,onError:i});let o=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),a=this.mimeType,c=this.responseType;fetch(o).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;let h=Bn[e],u=l.body.getReader(),d=l.headers.get("X-File-Size")||l.headers.get("Content-Length"),f=d?parseInt(d):0,m=f!==0,_=0,p=new ReadableStream({start(g){M();function M(){u.read().then(({done:x,value:y})=>{if(x)g.close();else{_+=y.byteLength;let A=new ProgressEvent("progress",{lengthComputable:m,loaded:_,total:f});for(let w=0,R=h.length;w<R;w++){let I=h[w];I.onProgress&&I.onProgress(A)}g.enqueue(y),M()}},x=>{g.error(x)})}}});return new Response(p)}else throw new al(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(c){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(h=>new DOMParser().parseFromString(h,a));case"json":return l.json();default:if(a===void 0)return l.text();{let u=/charset="?([^;"\s]*)"?/i.exec(a),d=u&&u[1]?u[1].toLowerCase():void 0,f=new TextDecoder(d);return l.arrayBuffer().then(m=>f.decode(m))}}}).then(l=>{ni.add(e,l);let h=Bn[e];delete Bn[e];for(let u=0,d=h.length;u<d;u++){let f=h[u];f.onLoad&&f.onLoad(l)}}).catch(l=>{let h=Bn[e];if(h===void 0)throw this.manager.itemError(e),l;delete Bn[e];for(let u=0,d=h.length;u<d;u++){let f=h[u];f.onError&&f.onError(l)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}};var cl=class extends Xn{constructor(e){super(e)}load(e,t,n,i){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,o=ni.get(e);if(o!==void 0)return r.manager.itemStart(e),setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0),o;let a=Ks("img");function c(){h(),ni.add(e,this),t&&t(this),r.manager.itemEnd(e)}function l(u){h(),i&&i(u),r.manager.itemError(e),r.manager.itemEnd(e)}function h(){a.removeEventListener("load",c,!1),a.removeEventListener("error",l,!1)}return a.addEventListener("load",c,!1),a.addEventListener("error",l,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),r.manager.itemStart(e),a.src=e,a}};var Fo=class extends Xn{constructor(e){super(e)}load(e,t,n,i){let r=new bt,o=new cl(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(a){r.image=a,r.needsUpdate=!0,t!==void 0&&t(r)},n,i),r}},Ts=class extends ft{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new be(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},Bo=class extends Ts{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(ft.DEFAULT_UP),this.updateMatrix(),this.groundColor=new be(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},qa=new Te,sd=new E,rd=new E,lr=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ie(512,512),this.map=null,this.mapPass=null,this.matrix=new Te,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Zs,this._frameExtents=new ie(1,1),this._viewportCount=1,this._viewports=[new je(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;sd.setFromMatrixPosition(e.matrixWorld),t.position.copy(sd),rd.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(rd),t.updateMatrixWorld(),qa.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(qa),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(qa)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},ll=class extends lr{constructor(){super(new _t(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(e){let t=this.camera,n=ds*2*e.angle*this.focus,i=this.mapSize.width/this.mapSize.height,r=e.distance||t.far;(n!==t.fov||i!==t.aspect||r!==t.far)&&(t.fov=n,t.aspect=i,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}},zo=class extends Ts{constructor(e,t,n=0,i=Math.PI/3,r=0,o=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(ft.DEFAULT_UP),this.updateMatrix(),this.target=new ft,this.distance=n,this.angle=i,this.penumbra=r,this.decay=o,this.map=null,this.shadow=new ll}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},od=new Te,zs=new E,Ka=new E,hl=class extends lr{constructor(){super(new _t(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new ie(4,2),this._viewportCount=6,this._viewports=[new je(2,1,1,1),new je(0,1,1,1),new je(3,1,1,1),new je(1,1,1,1),new je(3,0,1,1),new je(1,0,1,1)],this._cubeDirections=[new E(1,0,0),new E(-1,0,0),new E(0,0,1),new E(0,0,-1),new E(0,1,0),new E(0,-1,0)],this._cubeUps=[new E(0,1,0),new E(0,1,0),new E(0,1,0),new E(0,1,0),new E(0,0,1),new E(0,0,-1)]}updateMatrices(e,t=0){let n=this.camera,i=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),zs.setFromMatrixPosition(e.matrixWorld),n.position.copy(zs),Ka.copy(n.position),Ka.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(Ka),n.updateMatrixWorld(),i.makeTranslation(-zs.x,-zs.y,-zs.z),od.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(od)}},ws=class extends Ts{constructor(e,t,n=0,i=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new hl}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},ul=class extends lr{constructor(){super(new gs(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Li=class extends Ts{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ft.DEFAULT_UP),this.updateMatrix(),this.target=new ft,this.shadow=new ul}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var fi=class{static decodeText(e){if(console.warn("THREE.LoaderUtils: decodeText() has been deprecated with r165 and will be removed with r175. Use TextDecoder instead."),typeof TextDecoder<"u")return new TextDecoder().decode(e);let t="";for(let n=0,i=e.length;n<i;n++)t+=String.fromCharCode(e[n]);try{return decodeURIComponent(escape(t))}catch{return t}}static extractUrlBase(e){let t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}};var ko=class extends Xn{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"}}setOptions(e){return this.options=e,this}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,o=ni.get(e);if(o!==void 0){if(r.manager.itemStart(e),o.then){o.then(l=>{t&&t(l),r.manager.itemEnd(e)}).catch(l=>{i&&i(l)});return}return setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0),o}let a={};a.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",a.headers=this.requestHeader;let c=fetch(e,a).then(function(l){return l.blob()}).then(function(l){return createImageBitmap(l,Object.assign(r.options,{colorSpaceConversion:"none"}))}).then(function(l){return ni.add(e,l),t&&t(l),r.manager.itemEnd(e),l}).catch(function(l){i&&i(l),ni.remove(e),r.manager.itemError(e),r.manager.itemEnd(e)});ni.add(e,c),r.manager.itemStart(e)}};var dl=class{constructor(e,t,n){this.binding=e,this.valueSize=n;let i,r,o;switch(t){case"quaternion":i=this._slerp,r=this._slerpAdditive,o=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(n*6),this._workIndex=5;break;case"string":case"bool":i=this._select,r=this._select,o=this._setAdditiveIdentityOther,this.buffer=new Array(n*5);break;default:i=this._lerp,r=this._lerpAdditive,o=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(n*5)}this._mixBufferRegion=i,this._mixBufferRegionAdditive=r,this._setIdentity=o,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(e,t){let n=this.buffer,i=this.valueSize,r=e*i+i,o=this.cumulativeWeight;if(o===0){for(let a=0;a!==i;++a)n[r+a]=n[a];o=t}else{o+=t;let a=t/o;this._mixBufferRegion(n,r,0,a,i)}this.cumulativeWeight=o}accumulateAdditive(e){let t=this.buffer,n=this.valueSize,i=n*this._addIndex;this.cumulativeWeightAdditive===0&&this._setIdentity(),this._mixBufferRegionAdditive(t,i,0,e,n),this.cumulativeWeightAdditive+=e}apply(e){let t=this.valueSize,n=this.buffer,i=e*t+t,r=this.cumulativeWeight,o=this.cumulativeWeightAdditive,a=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,r<1){let c=t*this._origIndex;this._mixBufferRegion(n,i,c,1-r,t)}o>0&&this._mixBufferRegionAdditive(n,i,this._addIndex*t,1,t);for(let c=t,l=t+t;c!==l;++c)if(n[c]!==n[c+t]){a.setValue(n,i);break}}saveOriginalState(){let e=this.binding,t=this.buffer,n=this.valueSize,i=n*this._origIndex;e.getValue(t,i);for(let r=n,o=i;r!==o;++r)t[r]=t[i+r%n];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){let e=this.valueSize*3;this.binding.setValue(this.buffer,e)}_setAdditiveIdentityNumeric(){let e=this._addIndex*this.valueSize,t=e+this.valueSize;for(let n=e;n<t;n++)this.buffer[n]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){let e=this._origIndex*this.valueSize,t=this._addIndex*this.valueSize;for(let n=0;n<this.valueSize;n++)this.buffer[t+n]=this.buffer[e+n]}_select(e,t,n,i,r){if(i>=.5)for(let o=0;o!==r;++o)e[t+o]=e[n+o]}_slerp(e,t,n,i){lt.slerpFlat(e,t,e,t,e,n,i)}_slerpAdditive(e,t,n,i,r){let o=this._workIndex*r;lt.multiplyQuaternionsFlat(e,o,e,t,e,n),lt.slerpFlat(e,t,e,t,e,o,i)}_lerp(e,t,n,i,r){let o=1-i;for(let a=0;a!==r;++a){let c=t+a;e[c]=e[c]*o+e[n+a]*i}}_lerpAdditive(e,t,n,i,r){for(let o=0;o!==r;++o){let a=t+o;e[a]=e[a]+e[n+o]*i}}},Il="\\[\\]\\.:\\/",rx=new RegExp("["+Il+"]","g"),Pl="[^"+Il+"]",ox="[^"+Il.replace("\\.","")+"]",ax=/((?:WC+[\/:])*)/.source.replace("WC",Pl),cx=/(WCOD+)?/.source.replace("WCOD",ox),lx=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Pl),hx=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Pl),ux=new RegExp("^"+ax+cx+lx+hx+"$"),dx=["material","materials","bones","map"],fl=class{constructor(e,t,n){let i=n||Ze.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,r=n.length;i!==r;++i)n[i].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},Ze=class s{constructor(e,t,n){this.path=t,this.parsedPath=n||s.parseTrackName(t),this.node=s.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new s.Composite(e,t,n):new s(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(rx,"")}static parseTrackName(e){let t=ux.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let r=n.nodeName.substring(i+1);dx.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let c=n(a.children);if(c)return c}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,i=t.propertyName,r=t.propertyIndex;if(e||(e=s.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let l=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===l){l=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(l!==void 0){if(e[l]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[l]}}let o=e[i];if(o===void 0){let l=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+l+"."+i+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?a=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Ze.Composite=fl;Ze.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Ze.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Ze.prototype.GetterByBindingType=[Ze.prototype._getValue_direct,Ze.prototype._getValue_array,Ze.prototype._getValue_arrayElement,Ze.prototype._getValue_toArray];Ze.prototype.SetterByBindingTypeAndVersioning=[[Ze.prototype._setValue_direct,Ze.prototype._setValue_direct_setNeedsUpdate,Ze.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Ze.prototype._setValue_array,Ze.prototype._setValue_array_setNeedsUpdate,Ze.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Ze.prototype._setValue_arrayElement,Ze.prototype._setValue_arrayElement_setNeedsUpdate,Ze.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Ze.prototype._setValue_fromArray,Ze.prototype._setValue_fromArray_setNeedsUpdate,Ze.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var pl=class{constructor(e,t,n=null,i=t.blendMode){this._mixer=e,this._clip=t,this._localRoot=n,this.blendMode=i;let r=t.tracks,o=r.length,a=new Array(o),c={endingStart:Qi,endingEnd:Qi};for(let l=0;l!==o;++l){let h=r[l].createInterpolant(null);a[l]=h,h.settings=c}this._interpolantSettings=c,this._interpolants=a,this._propertyBindings=new Array(o),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._weightInterpolant=null,this.loop=Tl,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(e){return this._startTime=e,this}setLoop(e,t){return this.loop=e,this.repetitions=t,this}setEffectiveWeight(e){return this.weight=e,this._effectiveWeight=this.enabled?e:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(e){return this._scheduleFading(e,0,1)}fadeOut(e){return this._scheduleFading(e,1,0)}crossFadeFrom(e,t,n){if(e.fadeOut(t),this.fadeIn(t),n){let i=this._clip.duration,r=e._clip.duration,o=r/i,a=i/r;e.warp(1,o,t),this.warp(a,1,t)}return this}crossFadeTo(e,t,n){return e.crossFadeFrom(this,t,n)}stopFading(){let e=this._weightInterpolant;return e!==null&&(this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(e)),this}setEffectiveTimeScale(e){return this.timeScale=e,this._effectiveTimeScale=this.paused?0:e,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(e){return this.timeScale=this._clip.duration/e,this.stopWarping()}syncWith(e){return this.time=e.time,this.timeScale=e.timeScale,this.stopWarping()}halt(e){return this.warp(this._effectiveTimeScale,0,e)}warp(e,t,n){let i=this._mixer,r=i.time,o=this.timeScale,a=this._timeScaleInterpolant;a===null&&(a=i._lendControlInterpolant(),this._timeScaleInterpolant=a);let c=a.parameterPositions,l=a.sampleValues;return c[0]=r,c[1]=r+n,l[0]=e/o,l[1]=t/o,this}stopWarping(){let e=this._timeScaleInterpolant;return e!==null&&(this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(e)),this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(e,t,n,i){if(!this.enabled){this._updateWeight(e);return}let r=this._startTime;if(r!==null){let c=(e-r)*n;c<0||n===0?t=0:(this._startTime=null,t=n*c)}t*=this._updateTimeScale(e);let o=this._updateTime(t),a=this._updateWeight(e);if(a>0){let c=this._interpolants,l=this._propertyBindings;switch(this.blendMode){case tp:for(let h=0,u=c.length;h!==u;++h)c[h].evaluate(o),l[h].accumulateAdditive(a);break;case wl:default:for(let h=0,u=c.length;h!==u;++h)c[h].evaluate(o),l[h].accumulate(i,a)}}}_updateWeight(e){let t=0;if(this.enabled){t=this.weight;let n=this._weightInterpolant;if(n!==null){let i=n.evaluate(e)[0];t*=i,e>n.parameterPositions[1]&&(this.stopFading(),i===0&&(this.enabled=!1))}}return this._effectiveWeight=t,t}_updateTimeScale(e){let t=0;if(!this.paused){t=this.timeScale;let n=this._timeScaleInterpolant;if(n!==null){let i=n.evaluate(e)[0];t*=i,e>n.parameterPositions[1]&&(this.stopWarping(),t===0?this.paused=!0:this.timeScale=t)}}return this._effectiveTimeScale=t,t}_updateTime(e){let t=this._clip.duration,n=this.loop,i=this.time+e,r=this._loopCount,o=n===ep;if(e===0)return r===-1?i:o&&(r&1)===1?t-i:i;if(n===Sl){r===-1&&(this._loopCount=0,this._setEndings(!0,!0,!1));e:{if(i>=t)i=t;else if(i<0)i=0;else{this.time=i;break e}this.clampWhenFinished?this.paused=!0:this.enabled=!1,this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:e<0?-1:1})}}else{if(r===-1&&(e>=0?(r=0,this._setEndings(!0,this.repetitions===0,o)):this._setEndings(this.repetitions===0,!0,o)),i>=t||i<0){let a=Math.floor(i/t);i-=t*a,r+=Math.abs(a);let c=this.repetitions-r;if(c<=0)this.clampWhenFinished?this.paused=!0:this.enabled=!1,i=e>0?t:0,this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:e>0?1:-1});else{if(c===1){let l=e<0;this._setEndings(l,!l,o)}else this._setEndings(!1,!1,o);this._loopCount=r,this.time=i,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:a})}}else this.time=i;if(o&&(r&1)===1)return t-i}return i}_setEndings(e,t,n){let i=this._interpolantSettings;n?(i.endingStart=es,i.endingEnd=es):(e?i.endingStart=this.zeroSlopeAtStart?es:Qi:i.endingStart=ro,t?i.endingEnd=this.zeroSlopeAtEnd?es:Qi:i.endingEnd=ro)}_scheduleFading(e,t,n){let i=this._mixer,r=i.time,o=this._weightInterpolant;o===null&&(o=i._lendControlInterpolant(),this._weightInterpolant=o);let a=o.parameterPositions,c=o.sampleValues;return a[0]=r,c[0]=t,a[1]=r+e,c[1]=n,this}},fx=new Float32Array(1),Ho=class extends In{constructor(e){super(),this._root=e,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1}_bindAction(e,t){let n=e._localRoot||this._root,i=e._clip.tracks,r=i.length,o=e._propertyBindings,a=e._interpolants,c=n.uuid,l=this._bindingsByRootAndName,h=l[c];h===void 0&&(h={},l[c]=h);for(let u=0;u!==r;++u){let d=i[u],f=d.name,m=h[f];if(m!==void 0)++m.referenceCount,o[u]=m;else{if(m=o[u],m!==void 0){m._cacheIndex===null&&(++m.referenceCount,this._addInactiveBinding(m,c,f));continue}let _=t&&t._propertyBindings[u].binding.parsedPath;m=new dl(Ze.create(n,f,_),d.ValueTypeName,d.getValueSize()),++m.referenceCount,this._addInactiveBinding(m,c,f),o[u]=m}a[u].resultBuffer=m.buffer}}_activateAction(e){if(!this._isActiveAction(e)){if(e._cacheIndex===null){let n=(e._localRoot||this._root).uuid,i=e._clip.uuid,r=this._actionsByClip[i];this._bindAction(e,r&&r.knownActions[0]),this._addInactiveAction(e,i,n)}let t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){let r=t[n];r.useCount++===0&&(this._lendBinding(r),r.saveOriginalState())}this._lendAction(e)}}_deactivateAction(e){if(this._isActiveAction(e)){let t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){let r=t[n];--r.useCount===0&&(r.restoreOriginalState(),this._takeBackBinding(r))}this._takeBackAction(e)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;let e=this;this.stats={actions:{get total(){return e._actions.length},get inUse(){return e._nActiveActions}},bindings:{get total(){return e._bindings.length},get inUse(){return e._nActiveBindings}},controlInterpolants:{get total(){return e._controlInterpolants.length},get inUse(){return e._nActiveControlInterpolants}}}}_isActiveAction(e){let t=e._cacheIndex;return t!==null&&t<this._nActiveActions}_addInactiveAction(e,t,n){let i=this._actions,r=this._actionsByClip,o=r[t];if(o===void 0)o={knownActions:[e],actionByRoot:{}},e._byClipCacheIndex=0,r[t]=o;else{let a=o.knownActions;e._byClipCacheIndex=a.length,a.push(e)}e._cacheIndex=i.length,i.push(e),o.actionByRoot[n]=e}_removeInactiveAction(e){let t=this._actions,n=t[t.length-1],i=e._cacheIndex;n._cacheIndex=i,t[i]=n,t.pop(),e._cacheIndex=null;let r=e._clip.uuid,o=this._actionsByClip,a=o[r],c=a.knownActions,l=c[c.length-1],h=e._byClipCacheIndex;l._byClipCacheIndex=h,c[h]=l,c.pop(),e._byClipCacheIndex=null;let u=a.actionByRoot,d=(e._localRoot||this._root).uuid;delete u[d],c.length===0&&delete o[r],this._removeInactiveBindingsForAction(e)}_removeInactiveBindingsForAction(e){let t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){let r=t[n];--r.referenceCount===0&&this._removeInactiveBinding(r)}}_lendAction(e){let t=this._actions,n=e._cacheIndex,i=this._nActiveActions++,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_takeBackAction(e){let t=this._actions,n=e._cacheIndex,i=--this._nActiveActions,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_addInactiveBinding(e,t,n){let i=this._bindingsByRootAndName,r=this._bindings,o=i[t];o===void 0&&(o={},i[t]=o),o[n]=e,e._cacheIndex=r.length,r.push(e)}_removeInactiveBinding(e){let t=this._bindings,n=e.binding,i=n.rootNode.uuid,r=n.path,o=this._bindingsByRootAndName,a=o[i],c=t[t.length-1],l=e._cacheIndex;c._cacheIndex=l,t[l]=c,t.pop(),delete a[r],Object.keys(a).length===0&&delete o[i]}_lendBinding(e){let t=this._bindings,n=e._cacheIndex,i=this._nActiveBindings++,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_takeBackBinding(e){let t=this._bindings,n=e._cacheIndex,i=--this._nActiveBindings,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_lendControlInterpolant(){let e=this._controlInterpolants,t=this._nActiveControlInterpolants++,n=e[t];return n===void 0&&(n=new Uo(new Float32Array(2),new Float32Array(2),1,fx),n.__cacheIndex=t,e[t]=n),n}_takeBackControlInterpolant(e){let t=this._controlInterpolants,n=e.__cacheIndex,i=--this._nActiveControlInterpolants,r=t[i];e.__cacheIndex=i,t[i]=e,r.__cacheIndex=n,t[n]=r}clipAction(e,t,n){let i=t||this._root,r=i.uuid,o=typeof e=="string"?di.findByName(i,e):e,a=o!==null?o.uuid:e,c=this._actionsByClip[a],l=null;if(n===void 0&&(o!==null?n=o.blendMode:n=wl),c!==void 0){let u=c.actionByRoot[r];if(u!==void 0&&u.blendMode===n)return u;l=c.knownActions[0],o===null&&(o=l._clip)}if(o===null)return null;let h=new pl(this,o,t,n);return this._bindAction(h,l),this._addInactiveAction(h,a,r),h}existingAction(e,t){let n=t||this._root,i=n.uuid,r=typeof e=="string"?di.findByName(n,e):e,o=r?r.uuid:e,a=this._actionsByClip[o];return a!==void 0&&a.actionByRoot[i]||null}stopAllAction(){let e=this._actions,t=this._nActiveActions;for(let n=t-1;n>=0;--n)e[n].stop();return this}update(e){e*=this.timeScale;let t=this._actions,n=this._nActiveActions,i=this.time+=e,r=Math.sign(e),o=this._accuIndex^=1;for(let l=0;l!==n;++l)t[l]._update(i,e,r,o);let a=this._bindings,c=this._nActiveBindings;for(let l=0;l!==c;++l)a[l].apply(o);return this}setTime(e){this.time=0;for(let t=0;t<this._actions.length;t++)this._actions[t].time=0;return this.update(e)}getRoot(){return this._root}uncacheClip(e){let t=this._actions,n=e.uuid,i=this._actionsByClip,r=i[n];if(r!==void 0){let o=r.knownActions;for(let a=0,c=o.length;a!==c;++a){let l=o[a];this._deactivateAction(l);let h=l._cacheIndex,u=t[t.length-1];l._cacheIndex=null,l._byClipCacheIndex=null,u._cacheIndex=h,t[h]=u,t.pop(),this._removeInactiveBindingsForAction(l)}delete i[n]}}uncacheRoot(e){let t=e.uuid,n=this._actionsByClip;for(let o in n){let a=n[o].actionByRoot,c=a[t];c!==void 0&&(this._deactivateAction(c),this._removeInactiveAction(c))}let i=this._bindingsByRootAndName,r=i[t];if(r!==void 0)for(let o in r){let a=r[o];a.restoreOriginalState(),this._removeInactiveBinding(a)}}uncacheAction(e,t){let n=this.existingAction(e,t);n!==null&&(this._deactivateAction(n),this._removeInactiveAction(n))}},Vo=class s{constructor(e){this.value=e}clone(){return new s(this.value.clone===void 0?this.value:this.value.clone())}};var hr=class{constructor(e=1,t=0,n=0){return this.radius=e,this.phi=t,this.theta=n,this}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(Mt(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var Go=class extends In{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"169"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="169");var Nd={type:"change"},Dl={type:"start"},Od={type:"end"},Zo=new ai,Ud=new xn,px=Math.cos(70*vt.DEG2RAD),Et=new E,Kt=2*Math.PI,st={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Ll=1e-6,Jo=class extends Go{constructor(e,t=null){super(e,t),this.state=st.NONE,this.enabled=!0,this.target=new E,this.cursor=new E,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Di.ROTATE,MIDDLE:Di.DOLLY,RIGHT:Di.PAN},this.touches={ONE:Ni.ROTATE,TWO:Ni.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new E,this._lastQuaternion=new lt,this._lastTargetPosition=new E,this._quat=new lt().setFromUnitVectors(e.up,new E(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new hr,this._sphericalDelta=new hr,this._scale=1,this._panOffset=new E,this._rotateStart=new ie,this._rotateEnd=new ie,this._rotateDelta=new ie,this._panStart=new ie,this._panEnd=new ie,this._panDelta=new ie,this._dollyStart=new ie,this._dollyEnd=new ie,this._dollyDelta=new ie,this._dollyDirection=new E,this._mouse=new ie,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=gx.bind(this),this._onPointerDown=mx.bind(this),this._onPointerUp=_x.bind(this),this._onContextMenu=Tx.bind(this),this._onMouseWheel=vx.bind(this),this._onKeyDown=Mx.bind(this),this._onTouchStart=bx.bind(this),this._onTouchMove=Sx.bind(this),this._onMouseDown=yx.bind(this),this._onMouseMove=xx.bind(this),this._interceptControlDown=wx.bind(this),this._interceptControlUp=Ex.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Nd),this.update(),this.state=st.NONE}update(e=null){let t=this.object.position;Et.copy(t).sub(this.target),Et.applyQuaternion(this._quat),this._spherical.setFromVector3(Et),this.autoRotate&&this.state===st.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,i=this.maxAzimuthAngle;isFinite(n)&&isFinite(i)&&(n<-Math.PI?n+=Kt:n>Math.PI&&(n-=Kt),i<-Math.PI?i+=Kt:i>Math.PI&&(i-=Kt),n<=i?this._spherical.theta=Math.max(n,Math.min(i,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+i)/2?Math.max(n,this._spherical.theta):Math.min(i,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=o!=this._spherical.radius}if(Et.setFromSpherical(this._spherical),Et.applyQuaternion(this._quatInverse),t.copy(this.target).add(Et),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){let a=Et.length();o=this._clampDistance(a*this._scale);let c=a-o;this.object.position.addScaledVector(this._dollyDirection,c),this.object.updateMatrixWorld(),r=!!c}else if(this.object.isOrthographicCamera){let a=new E(this._mouse.x,this._mouse.y,0);a.unproject(this.object);let c=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=c!==this.object.zoom;let l=new E(this._mouse.x,this._mouse.y,0);l.unproject(this.object),this.object.position.sub(l).add(a),this.object.updateMatrixWorld(),o=Et.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(Zo.origin.copy(this.object.position),Zo.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Zo.direction))<px?this.object.lookAt(this.target):(Ud.setFromNormalAndCoplanarPoint(this.object.up,this.target),Zo.intersectPlane(Ud,this.target))))}else if(this.object.isOrthographicCamera){let o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>Ll||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Ll||this._lastTargetPosition.distanceToSquared(this.target)>Ll?(this.dispatchEvent(Nd),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?Kt/60*this.autoRotateSpeed*e:Kt/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Et.setFromMatrixColumn(t,0),Et.multiplyScalar(-e),this._panOffset.add(Et)}_panUp(e,t){this.screenSpacePanning===!0?Et.setFromMatrixColumn(t,1):(Et.setFromMatrixColumn(t,0),Et.crossVectors(this.object.up,Et)),Et.multiplyScalar(e),this._panOffset.add(Et)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let i=this.object.position;Et.copy(i).sub(this.target);let r=Et.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/n.clientHeight,this.object.matrix),this._panUp(2*t*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),i=e-n.left,r=t-n.top,o=n.width,a=n.height;this._mouse.x=i/o*2-1,this._mouse.y=-(r/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Kt*this._rotateDelta.x/t.clientHeight),this._rotateUp(Kt*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateUp(Kt*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateUp(-Kt*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateLeft(Kt*this.rotateSpeed/this.domElement.clientHeight):this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateLeft(-Kt*this.rotateSpeed/this.domElement.clientHeight):this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);this._rotateStart.set(n,i)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);this._panStart.set(n,i)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,i=e.pageY-t.y,r=Math.sqrt(n*n+i*i);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let n=this._getSecondPointerPosition(e),i=.5*(e.pageX+n.x),r=.5*(e.pageY+n.y);this._rotateEnd.set(i,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Kt*this._rotateDelta.x/t.clientHeight),this._rotateUp(Kt*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);this._panEnd.set(n,i)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,i=e.pageY-t.y,r=Math.sqrt(n*n+i*i);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let o=(e.pageX+t.x)*.5,a=(e.pageY+t.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new ie,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function mx(s){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(s.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(s)&&(this._addPointer(s),s.pointerType==="touch"?this._onTouchStart(s):this._onMouseDown(s)))}function gx(s){this.enabled!==!1&&(s.pointerType==="touch"?this._onTouchMove(s):this._onMouseMove(s))}function _x(s){switch(this._removePointer(s),this._pointers.length){case 0:this.domElement.releasePointerCapture(s.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Od),this.state=st.NONE;break;case 1:let e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function yx(s){let e;switch(s.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case Di.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(s),this.state=st.DOLLY;break;case Di.ROTATE:if(s.ctrlKey||s.metaKey||s.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(s),this.state=st.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(s),this.state=st.ROTATE}break;case Di.PAN:if(s.ctrlKey||s.metaKey||s.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(s),this.state=st.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(s),this.state=st.PAN}break;default:this.state=st.NONE}this.state!==st.NONE&&this.dispatchEvent(Dl)}function xx(s){switch(this.state){case st.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(s);break;case st.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(s);break;case st.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(s);break}}function vx(s){this.enabled===!1||this.enableZoom===!1||this.state!==st.NONE||(s.preventDefault(),this.dispatchEvent(Dl),this._handleMouseWheel(this._customWheelEvent(s)),this.dispatchEvent(Od))}function Mx(s){this.enabled===!1||this.enablePan===!1||this._handleKeyDown(s)}function bx(s){switch(this._trackPointer(s),this._pointers.length){case 1:switch(this.touches.ONE){case Ni.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(s),this.state=st.TOUCH_ROTATE;break;case Ni.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(s),this.state=st.TOUCH_PAN;break;default:this.state=st.NONE}break;case 2:switch(this.touches.TWO){case Ni.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(s),this.state=st.TOUCH_DOLLY_PAN;break;case Ni.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(s),this.state=st.TOUCH_DOLLY_ROTATE;break;default:this.state=st.NONE}break;default:this.state=st.NONE}this.state!==st.NONE&&this.dispatchEvent(Dl)}function Sx(s){switch(this._trackPointer(s),this.state){case st.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(s),this.update();break;case st.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(s),this.update();break;case st.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(s),this.update();break;case st.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(s),this.update();break;default:this.state=st.NONE}}function Tx(s){this.enabled!==!1&&s.preventDefault()}function wx(s){s.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function Ex(s){s.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var jo=class extends Tn{constructor(){super();let e=new Ht;e.deleteAttribute("uv");let t=new wt({side:Ft}),n=new wt,i=new ws(16777215,900,28,2);i.position.set(.418,16.199,.3),this.add(i);let r=new ye(e,t);r.position.set(-.757,13.219,.717),r.scale.set(31.713,28.305,28.591),this.add(r);let o=new ye(e,n);o.position.set(-10.906,2.009,1.846),o.rotation.set(0,-.195,0),o.scale.set(2.328,7.905,4.651),this.add(o);let a=new ye(e,n);a.position.set(-5.607,-.754,-.758),a.rotation.set(0,.994,0),a.scale.set(1.97,1.534,3.955),this.add(a);let c=new ye(e,n);c.position.set(6.167,.857,7.803),c.rotation.set(0,.561,0),c.scale.set(3.927,6.285,3.687),this.add(c);let l=new ye(e,n);l.position.set(-2.017,.018,6.124),l.rotation.set(0,.333,0),l.scale.set(2.002,4.566,2.064),this.add(l);let h=new ye(e,n);h.position.set(2.291,-.756,-2.621),h.rotation.set(0,-.286,0),h.scale.set(1.546,1.552,1.496),this.add(h);let u=new ye(e,n);u.position.set(-2.193,-.369,-5.547),u.rotation.set(0,.516,0),u.scale.set(3.875,3.487,2.986),this.add(u);let d=new ye(e,As(50));d.position.set(-16.116,14.37,8.208),d.scale.set(.1,2.428,2.739),this.add(d);let f=new ye(e,As(50));f.position.set(-16.109,18.021,-8.207),f.scale.set(.1,2.425,2.751),this.add(f);let m=new ye(e,As(17));m.position.set(14.904,12.198,-1.832),m.scale.set(.15,4.265,6.331),this.add(m);let _=new ye(e,As(43));_.position.set(-.462,8.89,14.52),_.scale.set(4.38,5.441,.088),this.add(_);let p=new ye(e,As(20));p.position.set(3.235,11.486,-12.541),p.scale.set(2.5,2,.1),this.add(p);let g=new ye(e,As(100));g.position.set(0,20,0),g.scale.set(1,.1,1),this.add(g)}dispose(){let e=new Set;this.traverse(t=>{t.isMesh&&(e.add(t.geometry),e.add(t.material))});for(let t of e)t.dispose()}};function As(s){let e=new qt;return e.color.setScalar(s),e}var pr,Nl,Rs,$o;function Qo(s,e=1/0,t=null){Nl||(Nl=new ms(2,2,1,1)),Rs||(Rs=new hn({uniforms:{blitTexture:new Vo(s)},vertexShader:`
			varying vec2 vUv;
			void main(){
				vUv = uv;
				gl_Position = vec4(position.xy * 1.0,0.,.999999);
			}`,fragmentShader:`
			uniform sampler2D blitTexture; 
			varying vec2 vUv;

			void main(){ 
				gl_FragColor = vec4(vUv.xy, 0, 1);
				
				#ifdef IS_SRGB
				gl_FragColor = sRGBTransferOETF( texture2D( blitTexture, vUv) );
				#else
				gl_FragColor = texture2D( blitTexture, vUv);
				#endif
			}`})),Rs.uniforms.blitTexture.value=s,Rs.defines.IS_SRGB=s.colorSpace==mt,Rs.needsUpdate=!0,$o||($o=new ye(Nl,Rs),$o.frustumCulled=!1);let n=new _t,i=new Tn;i.add($o),t===null&&(t=pr=new ys({antialias:!1}));let r=Math.min(s.image.width,e),o=Math.min(s.image.height,e);t.setSize(r,o),t.clear(),t.render(i,n);let a=document.createElement("canvas"),c=a.getContext("2d");a.width=r,a.height=o,c.drawImage(t.domElement,0,0,r,o);let l=new Eo(a);return l.minFilter=s.minFilter,l.magFilter=s.magFilter,l.wrapS=s.wrapS,l.wrapT=s.wrapT,l.colorSpace=s.colorSpace,l.name=s.name,pr&&(pr.forceContextLoss(),pr.dispose(),pr=null),l}var Fd={POSITION:["byte","byte normalized","unsigned byte","unsigned byte normalized","short","short normalized","unsigned short","unsigned short normalized"],NORMAL:["byte normalized","short normalized"],TANGENT:["byte normalized","short normalized"],TEXCOORD:["byte","byte normalized","unsigned byte","short","short normalized","unsigned short"]},Cs=class{constructor(){this.pluginCallbacks=[],this.register(function(e){return new Bl(e)}),this.register(function(e){return new zl(e)}),this.register(function(e){return new Gl(e)}),this.register(function(e){return new Wl(e)}),this.register(function(e){return new Xl(e)}),this.register(function(e){return new Yl(e)}),this.register(function(e){return new kl(e)}),this.register(function(e){return new Hl(e)}),this.register(function(e){return new Vl(e)}),this.register(function(e){return new ql(e)}),this.register(function(e){return new Kl(e)}),this.register(function(e){return new Zl(e)}),this.register(function(e){return new Jl(e)}),this.register(function(e){return new jl(e)})}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,n,i){let r=new Fl,o=[];for(let a=0,c=this.pluginCallbacks.length;a<c;a++)o.push(this.pluginCallbacks[a](r));r.setPlugins(o),r.write(e,t,i).catch(n)}parseAsync(e,t){let n=this;return new Promise(function(i,r){n.parse(e,i,r,t)})}},Be={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,BYTE:5120,UNSIGNED_BYTE:5121,SHORT:5122,UNSIGNED_SHORT:5123,INT:5124,UNSIGNED_INT:5125,FLOAT:5126,ARRAY_BUFFER:34962,ELEMENT_ARRAY_BUFFER:34963,NEAREST:9728,LINEAR:9729,NEAREST_MIPMAP_NEAREST:9984,LINEAR_MIPMAP_NEAREST:9985,NEAREST_MIPMAP_LINEAR:9986,LINEAR_MIPMAP_LINEAR:9987,CLAMP_TO_EDGE:33071,MIRRORED_REPEAT:33648,REPEAT:10497},Ul="KHR_mesh_quantization",sn={};sn[Ct]=Be.NEAREST;sn[ur]=Be.NEAREST_MIPMAP_NEAREST;sn[ti]=Be.NEAREST_MIPMAP_LINEAR;sn[Rt]=Be.LINEAR;sn[Ai]=Be.LINEAR_MIPMAP_NEAREST;sn[Xt]=Be.LINEAR_MIPMAP_LINEAR;sn[Mn]=Be.CLAMP_TO_EDGE;sn[Sn]=Be.REPEAT;sn[Ri]=Be.MIRRORED_REPEAT;var Bd={scale:"scale",position:"translation",quaternion:"rotation",morphTargetInfluences:"weights"},Rx=new be,zd=12,Cx=1179937895,Ix=2,kd=8,Px=1313821514,Lx=5130562;function mr(s,e){return s.length===e.length&&s.every(function(t,n){return t===e[n]})}function Dx(s){return new TextEncoder().encode(s).buffer}function Nx(s){return mr(s.elements,[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}function Ux(s,e,t){let n={min:new Array(s.itemSize).fill(Number.POSITIVE_INFINITY),max:new Array(s.itemSize).fill(Number.NEGATIVE_INFINITY)};for(let i=e;i<e+t;i++)for(let r=0;r<s.itemSize;r++){let o;s.itemSize>4?o=s.array[i*s.itemSize+r]:(r===0?o=s.getX(i):r===1?o=s.getY(i):r===2?o=s.getZ(i):r===3&&(o=s.getW(i)),s.normalized===!0&&(o=vt.normalize(o,s.array))),n.min[r]=Math.min(n.min[r],o),n.max[r]=Math.max(n.max[r],o)}return n}function Gd(s){return Math.ceil(s/4)*4}function Ol(s,e=0){let t=Gd(s.byteLength);if(t!==s.byteLength){let n=new Uint8Array(t);if(n.set(new Uint8Array(s)),e!==0)for(let i=s.byteLength;i<t;i++)n[i]=e;return n.buffer}return s}function Hd(){return typeof document>"u"&&typeof OffscreenCanvas<"u"?new OffscreenCanvas(1,1):document.createElement("canvas")}function Vd(s,e){if(s.toBlob!==void 0)return new Promise(n=>s.toBlob(n,e));let t;return e==="image/jpeg"?t=.92:e==="image/webp"&&(t=.8),s.convertToBlob({type:e,quality:t})}var Fl=class{constructor(){this.plugins=[],this.options={},this.pending=[],this.buffers=[],this.byteOffset=0,this.buffers=[],this.nodeMap=new Map,this.skins=[],this.extensionsUsed={},this.extensionsRequired={},this.uids=new Map,this.uid=0,this.json={asset:{version:"2.0",generator:"THREE.GLTFExporter r169"}},this.cache={meshes:new Map,attributes:new Map,attributesNormalized:new Map,materials:new Map,textures:new Map,images:new Map}}setPlugins(e){this.plugins=e}async write(e,t,n={}){this.options=Object.assign({binary:!1,trs:!1,onlyVisible:!0,maxTextureSize:1/0,animations:[],includeCustomExtensions:!1},n),this.options.animations.length>0&&(this.options.trs=!0),this.processInput(e),await Promise.all(this.pending);let i=this,r=i.buffers,o=i.json;n=i.options;let a=i.extensionsUsed,c=i.extensionsRequired,l=new Blob(r,{type:"application/octet-stream"}),h=Object.keys(a),u=Object.keys(c);if(h.length>0&&(o.extensionsUsed=h),u.length>0&&(o.extensionsRequired=u),o.buffers&&o.buffers.length>0&&(o.buffers[0].byteLength=l.size),n.binary===!0){let d=new FileReader;d.readAsArrayBuffer(l),d.onloadend=function(){let f=Ol(d.result),m=new DataView(new ArrayBuffer(kd));m.setUint32(0,f.byteLength,!0),m.setUint32(4,Lx,!0);let _=Ol(Dx(JSON.stringify(o)),32),p=new DataView(new ArrayBuffer(kd));p.setUint32(0,_.byteLength,!0),p.setUint32(4,Px,!0);let g=new ArrayBuffer(zd),M=new DataView(g);M.setUint32(0,Cx,!0),M.setUint32(4,Ix,!0);let x=zd+p.byteLength+_.byteLength+m.byteLength+f.byteLength;M.setUint32(8,x,!0);let y=new Blob([g,p,_,m,f],{type:"application/octet-stream"}),A=new FileReader;A.readAsArrayBuffer(y),A.onloadend=function(){t(A.result)}}}else if(o.buffers&&o.buffers.length>0){let d=new FileReader;d.readAsDataURL(l),d.onloadend=function(){let f=d.result;o.buffers[0].uri=f,t(o)}}else t(o)}serializeUserData(e,t){if(Object.keys(e.userData).length===0)return;let n=this.options,i=this.extensionsUsed;try{let r=JSON.parse(JSON.stringify(e.userData));if(n.includeCustomExtensions&&r.gltfExtensions){t.extensions===void 0&&(t.extensions={});for(let o in r.gltfExtensions)t.extensions[o]=r.gltfExtensions[o],i[o]=!0;delete r.gltfExtensions}Object.keys(r).length>0&&(t.extras=r)}catch(r){console.warn("THREE.GLTFExporter: userData of '"+e.name+"' won't be serialized because of JSON.stringify error - "+r.message)}}getUID(e,t=!1){if(this.uids.has(e)===!1){let i=new Map;i.set(!0,this.uid++),i.set(!1,this.uid++),this.uids.set(e,i)}return this.uids.get(e).get(t)}isNormalizedNormalAttribute(e){if(this.cache.attributesNormalized.has(e))return!1;let n=new E;for(let i=0,r=e.count;i<r;i++)if(Math.abs(n.fromBufferAttribute(e,i).length()-1)>5e-4)return!1;return!0}createNormalizedNormalAttribute(e){let t=this.cache;if(t.attributesNormalized.has(e))return t.attributesNormalized.get(e);let n=e.clone(),i=new E;for(let r=0,o=n.count;r<o;r++)i.fromBufferAttribute(n,r),i.x===0&&i.y===0&&i.z===0?i.setX(1):i.normalize(),n.setXYZ(r,i.x,i.y,i.z);return t.attributesNormalized.set(e,n),n}applyTextureTransform(e,t){let n=!1,i={};(t.offset.x!==0||t.offset.y!==0)&&(i.offset=t.offset.toArray(),n=!0),t.rotation!==0&&(i.rotation=t.rotation,n=!0),(t.repeat.x!==1||t.repeat.y!==1)&&(i.scale=t.repeat.toArray(),n=!0),n&&(e.extensions=e.extensions||{},e.extensions.KHR_texture_transform=i,this.extensionsUsed.KHR_texture_transform=!0)}buildMetalRoughTexture(e,t){if(e===t)return e;function n(f){return f.colorSpace===mt?function(_){return _<.04045?_*.0773993808:Math.pow(_*.9478672986+.0521327014,2.4)}:function(_){return _}}console.warn("THREE.GLTFExporter: Merged metalnessMap and roughnessMap textures."),e instanceof Ms&&(e=Qo(e)),t instanceof Ms&&(t=Qo(t));let i=e?e.image:null,r=t?t.image:null,o=Math.max(i?i.width:0,r?r.width:0),a=Math.max(i?i.height:0,r?r.height:0),c=Hd();c.width=o,c.height=a;let l=c.getContext("2d",{willReadFrequently:!0});l.fillStyle="#00ffff",l.fillRect(0,0,o,a);let h=l.getImageData(0,0,o,a);if(i){l.drawImage(i,0,0,o,a);let f=n(e),m=l.getImageData(0,0,o,a).data;for(let _=2;_<m.length;_+=4)h.data[_]=f(m[_]/256)*256}if(r){l.drawImage(r,0,0,o,a);let f=n(t),m=l.getImageData(0,0,o,a).data;for(let _=1;_<m.length;_+=4)h.data[_]=f(m[_]/256)*256}l.putImageData(h,0,0);let d=(e||t).clone();return d.source=new fs(c),d.colorSpace=Rn,d.channel=(e||t).channel,e&&t&&e.channel!==t.channel&&console.warn("THREE.GLTFExporter: UV channels for metalnessMap and roughnessMap textures must match."),d}processBuffer(e){let t=this.json,n=this.buffers;return t.buffers||(t.buffers=[{byteLength:0}]),n.push(e),0}processBufferView(e,t,n,i,r){let o=this.json;o.bufferViews||(o.bufferViews=[]);let a;switch(t){case Be.BYTE:case Be.UNSIGNED_BYTE:a=1;break;case Be.SHORT:case Be.UNSIGNED_SHORT:a=2;break;default:a=4}let c=e.itemSize*a;r===Be.ARRAY_BUFFER&&(c=Math.ceil(c/4)*4);let l=Gd(i*c),h=new DataView(new ArrayBuffer(l)),u=0;for(let m=n;m<n+i;m++){for(let _=0;_<e.itemSize;_++){let p;e.itemSize>4?p=e.array[m*e.itemSize+_]:(_===0?p=e.getX(m):_===1?p=e.getY(m):_===2?p=e.getZ(m):_===3&&(p=e.getW(m)),e.normalized===!0&&(p=vt.normalize(p,e.array))),t===Be.FLOAT?h.setFloat32(u,p,!0):t===Be.INT?h.setInt32(u,p,!0):t===Be.UNSIGNED_INT?h.setUint32(u,p,!0):t===Be.SHORT?h.setInt16(u,p,!0):t===Be.UNSIGNED_SHORT?h.setUint16(u,p,!0):t===Be.BYTE?h.setInt8(u,p):t===Be.UNSIGNED_BYTE&&h.setUint8(u,p),u+=a}u%c!==0&&(u+=c-u%c)}let d={buffer:this.processBuffer(h.buffer),byteOffset:this.byteOffset,byteLength:l};return r!==void 0&&(d.target=r),r===Be.ARRAY_BUFFER&&(d.byteStride=c),this.byteOffset+=l,o.bufferViews.push(d),{id:o.bufferViews.length-1,byteLength:0}}processBufferViewImage(e){let t=this,n=t.json;return n.bufferViews||(n.bufferViews=[]),new Promise(function(i){let r=new FileReader;r.readAsArrayBuffer(e),r.onloadend=function(){let o=Ol(r.result),a={buffer:t.processBuffer(o),byteOffset:t.byteOffset,byteLength:o.byteLength};t.byteOffset+=o.byteLength,i(n.bufferViews.push(a)-1)}})}processAccessor(e,t,n,i){let r=this.json,o={1:"SCALAR",2:"VEC2",3:"VEC3",4:"VEC4",9:"MAT3",16:"MAT4"},a;if(e.array.constructor===Float32Array)a=Be.FLOAT;else if(e.array.constructor===Int32Array)a=Be.INT;else if(e.array.constructor===Uint32Array)a=Be.UNSIGNED_INT;else if(e.array.constructor===Int16Array)a=Be.SHORT;else if(e.array.constructor===Uint16Array)a=Be.UNSIGNED_SHORT;else if(e.array.constructor===Int8Array)a=Be.BYTE;else if(e.array.constructor===Uint8Array)a=Be.UNSIGNED_BYTE;else throw new Error("THREE.GLTFExporter: Unsupported bufferAttribute component type: "+e.array.constructor.name);if(n===void 0&&(n=0),(i===void 0||i===1/0)&&(i=e.count),i===0)return null;let c=Ux(e,n,i),l;t!==void 0&&(l=e===t.index?Be.ELEMENT_ARRAY_BUFFER:Be.ARRAY_BUFFER);let h=this.processBufferView(e,a,n,i,l),u={bufferView:h.id,byteOffset:h.byteOffset,componentType:a,count:i,max:c.max,min:c.min,type:o[e.itemSize]};return e.normalized===!0&&(u.normalized=!0),r.accessors||(r.accessors=[]),r.accessors.push(u)-1}processImage(e,t,n,i="image/png"){if(e!==null){let r=this,o=r.cache,a=r.json,c=r.options,l=r.pending;o.images.has(e)||o.images.set(e,{});let h=o.images.get(e),u=i+":flipY/"+n.toString();if(h[u]!==void 0)return h[u];a.images||(a.images=[]);let d={mimeType:i},f=Hd();f.width=Math.min(e.width,c.maxTextureSize),f.height=Math.min(e.height,c.maxTextureSize);let m=f.getContext("2d",{willReadFrequently:!0});if(n===!0&&(m.translate(0,f.height),m.scale(1,-1)),e.data!==void 0){t!==Ot&&console.error("GLTFExporter: Only RGBAFormat is supported.",t),(e.width>c.maxTextureSize||e.height>c.maxTextureSize)&&console.warn("GLTFExporter: Image size is bigger than maxTextureSize",e);let p=new Uint8ClampedArray(e.height*e.width*4);for(let g=0;g<p.length;g+=4)p[g+0]=e.data[g+0],p[g+1]=e.data[g+1],p[g+2]=e.data[g+2],p[g+3]=e.data[g+3];m.putImageData(new ImageData(p,e.width,e.height),0,0)}else if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap||typeof OffscreenCanvas<"u"&&e instanceof OffscreenCanvas)m.drawImage(e,0,0,f.width,f.height);else throw new Error("THREE.GLTFExporter: Invalid image type. Use HTMLImageElement, HTMLCanvasElement, ImageBitmap or OffscreenCanvas.");c.binary===!0?l.push(Vd(f,i).then(p=>r.processBufferViewImage(p)).then(p=>{d.bufferView=p})):f.toDataURL!==void 0?d.uri=f.toDataURL(i):l.push(Vd(f,i).then(p=>new FileReader().readAsDataURL(p)).then(p=>{d.uri=p}));let _=a.images.push(d)-1;return h[u]=_,_}else throw new Error("THREE.GLTFExporter: No valid image data found. Unable to process texture.")}processSampler(e){let t=this.json;t.samplers||(t.samplers=[]);let n={magFilter:sn[e.magFilter],minFilter:sn[e.minFilter],wrapS:sn[e.wrapS],wrapT:sn[e.wrapT]};return t.samplers.push(n)-1}processTexture(e){let n=this.options,i=this.cache,r=this.json;if(i.textures.has(e))return i.textures.get(e);r.textures||(r.textures=[]),e instanceof Ms&&(e=Qo(e,n.maxTextureSize));let o=e.userData.mimeType;o==="image/webp"&&(o="image/png");let a={sampler:this.processSampler(e),source:this.processImage(e.image,e.format,e.flipY,o)};e.name&&(a.name=e.name),this._invokeAll(function(l){l.writeTexture&&l.writeTexture(e,a)});let c=r.textures.push(a)-1;return i.textures.set(e,c),c}processMaterial(e){let t=this.cache,n=this.json;if(t.materials.has(e))return t.materials.get(e);if(e.isShaderMaterial)return console.warn("GLTFExporter: THREE.ShaderMaterial not supported."),null;n.materials||(n.materials=[]);let i={pbrMetallicRoughness:{}};e.isMeshStandardMaterial!==!0&&e.isMeshBasicMaterial!==!0&&console.warn("GLTFExporter: Use MeshStandardMaterial or MeshBasicMaterial for best results.");let r=e.color.toArray().concat([e.opacity]);if(mr(r,[1,1,1,1])||(i.pbrMetallicRoughness.baseColorFactor=r),e.isMeshStandardMaterial?(i.pbrMetallicRoughness.metallicFactor=e.metalness,i.pbrMetallicRoughness.roughnessFactor=e.roughness):(i.pbrMetallicRoughness.metallicFactor=.5,i.pbrMetallicRoughness.roughnessFactor=.5),e.metalnessMap||e.roughnessMap){let a=this.buildMetalRoughTexture(e.metalnessMap,e.roughnessMap),c={index:this.processTexture(a),channel:a.channel};this.applyTextureTransform(c,a),i.pbrMetallicRoughness.metallicRoughnessTexture=c}if(e.map){let a={index:this.processTexture(e.map),texCoord:e.map.channel};this.applyTextureTransform(a,e.map),i.pbrMetallicRoughness.baseColorTexture=a}if(e.emissive){let a=e.emissive;if(Math.max(a.r,a.g,a.b)>0&&(i.emissiveFactor=e.emissive.toArray()),e.emissiveMap){let l={index:this.processTexture(e.emissiveMap),texCoord:e.emissiveMap.channel};this.applyTextureTransform(l,e.emissiveMap),i.emissiveTexture=l}}if(e.normalMap){let a={index:this.processTexture(e.normalMap),texCoord:e.normalMap.channel};e.normalScale&&e.normalScale.x!==1&&(a.scale=e.normalScale.x),this.applyTextureTransform(a,e.normalMap),i.normalTexture=a}if(e.aoMap){let a={index:this.processTexture(e.aoMap),texCoord:e.aoMap.channel};e.aoMapIntensity!==1&&(a.strength=e.aoMapIntensity),this.applyTextureTransform(a,e.aoMap),i.occlusionTexture=a}e.transparent?i.alphaMode="BLEND":e.alphaTest>0&&(i.alphaMode="MASK",i.alphaCutoff=e.alphaTest),e.side===kt&&(i.doubleSided=!0),e.name!==""&&(i.name=e.name),this.serializeUserData(e,i),this._invokeAll(function(a){a.writeMaterial&&a.writeMaterial(e,i)});let o=n.materials.push(i)-1;return t.materials.set(e,o),o}processMesh(e){let t=this.cache,n=this.json,i=[e.geometry.uuid];if(Array.isArray(e.material))for(let y=0,A=e.material.length;y<A;y++)i.push(e.material[y].uuid);else i.push(e.material.uuid);let r=i.join(":");if(t.meshes.has(r))return t.meshes.get(r);let o=e.geometry,a;e.isLineSegments?a=Be.LINES:e.isLineLoop?a=Be.LINE_LOOP:e.isLine?a=Be.LINE_STRIP:e.isPoints?a=Be.POINTS:a=e.material.wireframe?Be.LINES:Be.TRIANGLES;let c={},l={},h=[],u=[],d={uv:"TEXCOORD_0",uv1:"TEXCOORD_1",uv2:"TEXCOORD_2",uv3:"TEXCOORD_3",color:"COLOR_0",skinWeight:"WEIGHTS_0",skinIndex:"JOINTS_0"},f=o.getAttribute("normal");f!==void 0&&!this.isNormalizedNormalAttribute(f)&&(console.warn("THREE.GLTFExporter: Creating normalized normal attribute from the non-normalized one."),o.setAttribute("normal",this.createNormalizedNormalAttribute(f)));let m=null;for(let y in o.attributes){if(y.slice(0,5)==="morph")continue;let A=o.attributes[y];if(y=d[y]||y.toUpperCase(),/^(POSITION|NORMAL|TANGENT|TEXCOORD_\d+|COLOR_\d+|JOINTS_\d+|WEIGHTS_\d+)$/.test(y)||(y="_"+y),t.attributes.has(this.getUID(A))){l[y]=t.attributes.get(this.getUID(A));continue}m=null;let R=A.array;y==="JOINTS_0"&&!(R instanceof Uint16Array)&&!(R instanceof Uint8Array)&&(console.warn('GLTFExporter: Attribute "skinIndex" converted to type UNSIGNED_SHORT.'),m=new ke(new Uint16Array(R),A.itemSize,A.normalized));let I=this.processAccessor(m||A,o);I!==null&&(y.startsWith("_")||this.detectMeshQuantization(y,A),l[y]=I,t.attributes.set(this.getUID(A),I))}if(f!==void 0&&o.setAttribute("normal",f),Object.keys(l).length===0)return null;if(e.morphTargetInfluences!==void 0&&e.morphTargetInfluences.length>0){let y=[],A=[],w={};if(e.morphTargetDictionary!==void 0)for(let R in e.morphTargetDictionary)w[e.morphTargetDictionary[R]]=R;for(let R=0;R<e.morphTargetInfluences.length;++R){let I={},N=!1;for(let v in o.morphAttributes){if(v!=="position"&&v!=="normal"){N||(console.warn("GLTFExporter: Only POSITION and NORMAL morph are supported."),N=!0);continue}let S=o.morphAttributes[v][R],F=v.toUpperCase(),B=o.attributes[v];if(t.attributes.has(this.getUID(S,!0))){I[F]=t.attributes.get(this.getUID(S,!0));continue}let G=S.clone();if(!o.morphTargetsRelative)for(let Y=0,P=S.count;Y<P;Y++)for(let j=0;j<S.itemSize;j++)j===0&&G.setX(Y,S.getX(Y)-B.getX(Y)),j===1&&G.setY(Y,S.getY(Y)-B.getY(Y)),j===2&&G.setZ(Y,S.getZ(Y)-B.getZ(Y)),j===3&&G.setW(Y,S.getW(Y)-B.getW(Y));I[F]=this.processAccessor(G,o),t.attributes.set(this.getUID(B,!0),I[F])}u.push(I),y.push(e.morphTargetInfluences[R]),e.morphTargetDictionary!==void 0&&A.push(w[R])}c.weights=y,A.length>0&&(c.extras={},c.extras.targetNames=A)}let _=Array.isArray(e.material);if(_&&o.groups.length===0)return null;let p=!1;if(_&&o.index===null){let y=[];for(let A=0,w=o.attributes.position.count;A<w;A++)y[A]=A;o.setIndex(y),p=!0}let g=_?e.material:[e.material],M=_?o.groups:[{materialIndex:0,start:void 0,count:void 0}];for(let y=0,A=M.length;y<A;y++){let w={mode:a,attributes:l};if(this.serializeUserData(o,w),u.length>0&&(w.targets=u),o.index!==null){let I=this.getUID(o.index);(M[y].start!==void 0||M[y].count!==void 0)&&(I+=":"+M[y].start+":"+M[y].count),t.attributes.has(I)?w.indices=t.attributes.get(I):(w.indices=this.processAccessor(o.index,o,M[y].start,M[y].count),t.attributes.set(I,w.indices)),w.indices===null&&delete w.indices}let R=this.processMaterial(g[M[y].materialIndex]);R!==null&&(w.material=R),h.push(w)}p===!0&&o.setIndex(null),c.primitives=h,n.meshes||(n.meshes=[]),this._invokeAll(function(y){y.writeMesh&&y.writeMesh(e,c)});let x=n.meshes.push(c)-1;return t.meshes.set(r,x),x}detectMeshQuantization(e,t){if(this.extensionsUsed[Ul])return;let n;switch(t.array.constructor){case Int8Array:n="byte";break;case Uint8Array:n="unsigned byte";break;case Int16Array:n="short";break;case Uint16Array:n="unsigned short";break;default:return}t.normalized&&(n+=" normalized");let i=e.split("_",1)[0];Fd[i]&&Fd[i].includes(n)&&(this.extensionsUsed[Ul]=!0,this.extensionsRequired[Ul]=!0)}processCamera(e){let t=this.json;t.cameras||(t.cameras=[]);let n=e.isOrthographicCamera,i={type:n?"orthographic":"perspective"};return n?i.orthographic={xmag:e.right*2,ymag:e.top*2,zfar:e.far<=0?.001:e.far,znear:e.near<0?0:e.near}:i.perspective={aspectRatio:e.aspect,yfov:vt.degToRad(e.fov),zfar:e.far<=0?.001:e.far,znear:e.near<0?0:e.near},e.name!==""&&(i.name=e.type),t.cameras.push(i)-1}processAnimation(e,t){let n=this.json,i=this.nodeMap;n.animations||(n.animations=[]),e=Cs.Utils.mergeMorphTargetTracks(e.clone(),t);let r=e.tracks,o=[],a=[];for(let c=0;c<r.length;++c){let l=r[c],h=Ze.parseTrackName(l.name),u=Ze.findNode(t,h.nodeName),d=Bd[h.propertyName];if(h.objectName==="bones"&&(u.isSkinnedMesh===!0?u=u.skeleton.getBoneByName(h.objectIndex):u=void 0),!u||!d){console.warn('THREE.GLTFExporter: Could not export animation track "%s".',l.name);continue}let f=1,m=l.values.length/l.times.length;d===Bd.morphTargetInfluences&&(m/=u.morphTargetInfluences.length);let _;l.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline===!0?(_="CUBICSPLINE",m/=3):l.getInterpolation()===ri?_="STEP":_="LINEAR",a.push({input:this.processAccessor(new ke(l.times,f)),output:this.processAccessor(new ke(l.values,m)),interpolation:_}),o.push({sampler:a.length-1,target:{node:i.get(u),path:d}})}return n.animations.push({name:e.name||"clip_"+n.animations.length,samplers:a,channels:o}),n.animations.length-1}processSkin(e){let t=this.json,n=this.nodeMap,i=t.nodes[n.get(e)],r=e.skeleton;if(r===void 0)return null;let o=e.skeleton.bones[0];if(o===void 0)return null;let a=[],c=new Float32Array(r.bones.length*16),l=new Te;for(let u=0;u<r.bones.length;++u)a.push(n.get(r.bones[u])),l.copy(r.boneInverses[u]),l.multiply(e.bindMatrix).toArray(c,u*16);return t.skins===void 0&&(t.skins=[]),t.skins.push({inverseBindMatrices:this.processAccessor(new ke(c,16)),joints:a,skeleton:n.get(o)}),i.skin=t.skins.length-1}processNode(e){let t=this.json,n=this.options,i=this.nodeMap;t.nodes||(t.nodes=[]);let r={};if(n.trs){let a=e.quaternion.toArray(),c=e.position.toArray(),l=e.scale.toArray();mr(a,[0,0,0,1])||(r.rotation=a),mr(c,[0,0,0])||(r.translation=c),mr(l,[1,1,1])||(r.scale=l)}else e.matrixAutoUpdate&&e.updateMatrix(),Nx(e.matrix)===!1&&(r.matrix=e.matrix.elements);if(e.name!==""&&(r.name=String(e.name)),this.serializeUserData(e,r),e.isMesh||e.isLine||e.isPoints){let a=this.processMesh(e);a!==null&&(r.mesh=a)}else e.isCamera&&(r.camera=this.processCamera(e));if(e.isSkinnedMesh&&this.skins.push(e),e.children.length>0){let a=[];for(let c=0,l=e.children.length;c<l;c++){let h=e.children[c];if(h.visible||n.onlyVisible===!1){let u=this.processNode(h);u!==null&&a.push(u)}}a.length>0&&(r.children=a)}this._invokeAll(function(a){a.writeNode&&a.writeNode(e,r)});let o=t.nodes.push(r)-1;return i.set(e,o),o}processScene(e){let t=this.json,n=this.options;t.scenes||(t.scenes=[],t.scene=0);let i={};e.name!==""&&(i.name=e.name),t.scenes.push(i);let r=[];for(let o=0,a=e.children.length;o<a;o++){let c=e.children[o];if(c.visible||n.onlyVisible===!1){let l=this.processNode(c);l!==null&&r.push(l)}}r.length>0&&(i.nodes=r),this.serializeUserData(e,i)}processObjects(e){let t=new Tn;t.name="AuxScene";for(let n=0;n<e.length;n++)t.children.push(e[n]);this.processScene(t)}processInput(e){let t=this.options;e=e instanceof Array?e:[e],this._invokeAll(function(i){i.beforeParse&&i.beforeParse(e)});let n=[];for(let i=0;i<e.length;i++)e[i]instanceof Tn?this.processScene(e[i]):n.push(e[i]);n.length>0&&this.processObjects(n);for(let i=0;i<this.skins.length;++i)this.processSkin(this.skins[i]);for(let i=0;i<t.animations.length;++i)this.processAnimation(t.animations[i],e[0]);this._invokeAll(function(i){i.afterParse&&i.afterParse(e)})}_invokeAll(e){for(let t=0,n=this.plugins.length;t<n;t++)e(this.plugins[t])}},Bl=class{constructor(e){this.writer=e,this.name="KHR_lights_punctual"}writeNode(e,t){if(!e.isLight)return;if(!e.isDirectionalLight&&!e.isPointLight&&!e.isSpotLight){console.warn("THREE.GLTFExporter: Only directional, point, and spot lights are supported.",e);return}let n=this.writer,i=n.json,r=n.extensionsUsed,o={};e.name&&(o.name=e.name),o.color=e.color.toArray(),o.intensity=e.intensity,e.isDirectionalLight?o.type="directional":e.isPointLight?(o.type="point",e.distance>0&&(o.range=e.distance)):e.isSpotLight&&(o.type="spot",e.distance>0&&(o.range=e.distance),o.spot={},o.spot.innerConeAngle=(1-e.penumbra)*e.angle,o.spot.outerConeAngle=e.angle),e.decay!==void 0&&e.decay!==2&&console.warn("THREE.GLTFExporter: Light decay may be lost. glTF is physically-based, and expects light.decay=2."),e.target&&(e.target.parent!==e||e.target.position.x!==0||e.target.position.y!==0||e.target.position.z!==-1)&&console.warn("THREE.GLTFExporter: Light direction may be lost. For best results, make light.target a child of the light with position 0,0,-1."),r[this.name]||(i.extensions=i.extensions||{},i.extensions[this.name]={lights:[]},r[this.name]=!0);let a=i.extensions[this.name].lights;a.push(o),t.extensions=t.extensions||{},t.extensions[this.name]={light:a.length-1}}},zl=class{constructor(e){this.writer=e,this.name="KHR_materials_unlit"}writeMaterial(e,t){if(!e.isMeshBasicMaterial)return;let i=this.writer.extensionsUsed;t.extensions=t.extensions||{},t.extensions[this.name]={},i[this.name]=!0,t.pbrMetallicRoughness.metallicFactor=0,t.pbrMetallicRoughness.roughnessFactor=.9}},kl=class{constructor(e){this.writer=e,this.name="KHR_materials_clearcoat"}writeMaterial(e,t){if(!e.isMeshPhysicalMaterial||e.clearcoat===0)return;let n=this.writer,i=n.extensionsUsed,r={};if(r.clearcoatFactor=e.clearcoat,e.clearcoatMap){let o={index:n.processTexture(e.clearcoatMap),texCoord:e.clearcoatMap.channel};n.applyTextureTransform(o,e.clearcoatMap),r.clearcoatTexture=o}if(r.clearcoatRoughnessFactor=e.clearcoatRoughness,e.clearcoatRoughnessMap){let o={index:n.processTexture(e.clearcoatRoughnessMap),texCoord:e.clearcoatRoughnessMap.channel};n.applyTextureTransform(o,e.clearcoatRoughnessMap),r.clearcoatRoughnessTexture=o}if(e.clearcoatNormalMap){let o={index:n.processTexture(e.clearcoatNormalMap),texCoord:e.clearcoatNormalMap.channel};e.clearcoatNormalScale.x!==1&&(o.scale=e.clearcoatNormalScale.x),n.applyTextureTransform(o,e.clearcoatNormalMap),r.clearcoatNormalTexture=o}t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},Hl=class{constructor(e){this.writer=e,this.name="KHR_materials_dispersion"}writeMaterial(e,t){if(!e.isMeshPhysicalMaterial||e.dispersion===0)return;let i=this.writer.extensionsUsed,r={};r.dispersion=e.dispersion,t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},Vl=class{constructor(e){this.writer=e,this.name="KHR_materials_iridescence"}writeMaterial(e,t){if(!e.isMeshPhysicalMaterial||e.iridescence===0)return;let n=this.writer,i=n.extensionsUsed,r={};if(r.iridescenceFactor=e.iridescence,e.iridescenceMap){let o={index:n.processTexture(e.iridescenceMap),texCoord:e.iridescenceMap.channel};n.applyTextureTransform(o,e.iridescenceMap),r.iridescenceTexture=o}if(r.iridescenceIor=e.iridescenceIOR,r.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],r.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1],e.iridescenceThicknessMap){let o={index:n.processTexture(e.iridescenceThicknessMap),texCoord:e.iridescenceThicknessMap.channel};n.applyTextureTransform(o,e.iridescenceThicknessMap),r.iridescenceThicknessTexture=o}t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},Gl=class{constructor(e){this.writer=e,this.name="KHR_materials_transmission"}writeMaterial(e,t){if(!e.isMeshPhysicalMaterial||e.transmission===0)return;let n=this.writer,i=n.extensionsUsed,r={};if(r.transmissionFactor=e.transmission,e.transmissionMap){let o={index:n.processTexture(e.transmissionMap),texCoord:e.transmissionMap.channel};n.applyTextureTransform(o,e.transmissionMap),r.transmissionTexture=o}t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},Wl=class{constructor(e){this.writer=e,this.name="KHR_materials_volume"}writeMaterial(e,t){if(!e.isMeshPhysicalMaterial||e.transmission===0)return;let n=this.writer,i=n.extensionsUsed,r={};if(r.thicknessFactor=e.thickness,e.thicknessMap){let o={index:n.processTexture(e.thicknessMap),texCoord:e.thicknessMap.channel};n.applyTextureTransform(o,e.thicknessMap),r.thicknessTexture=o}e.attenuationDistance!==1/0&&(r.attenuationDistance=e.attenuationDistance),r.attenuationColor=e.attenuationColor.toArray(),t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},Xl=class{constructor(e){this.writer=e,this.name="KHR_materials_ior"}writeMaterial(e,t){if(!e.isMeshPhysicalMaterial||e.ior===1.5)return;let i=this.writer.extensionsUsed,r={};r.ior=e.ior,t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},Yl=class{constructor(e){this.writer=e,this.name="KHR_materials_specular"}writeMaterial(e,t){if(!e.isMeshPhysicalMaterial||e.specularIntensity===1&&e.specularColor.equals(Rx)&&!e.specularIntensityMap&&!e.specularColorMap)return;let n=this.writer,i=n.extensionsUsed,r={};if(e.specularIntensityMap){let o={index:n.processTexture(e.specularIntensityMap),texCoord:e.specularIntensityMap.channel};n.applyTextureTransform(o,e.specularIntensityMap),r.specularTexture=o}if(e.specularColorMap){let o={index:n.processTexture(e.specularColorMap),texCoord:e.specularColorMap.channel};n.applyTextureTransform(o,e.specularColorMap),r.specularColorTexture=o}r.specularFactor=e.specularIntensity,r.specularColorFactor=e.specularColor.toArray(),t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},ql=class{constructor(e){this.writer=e,this.name="KHR_materials_sheen"}writeMaterial(e,t){if(!e.isMeshPhysicalMaterial||e.sheen==0)return;let n=this.writer,i=n.extensionsUsed,r={};if(e.sheenRoughnessMap){let o={index:n.processTexture(e.sheenRoughnessMap),texCoord:e.sheenRoughnessMap.channel};n.applyTextureTransform(o,e.sheenRoughnessMap),r.sheenRoughnessTexture=o}if(e.sheenColorMap){let o={index:n.processTexture(e.sheenColorMap),texCoord:e.sheenColorMap.channel};n.applyTextureTransform(o,e.sheenColorMap),r.sheenColorTexture=o}r.sheenRoughnessFactor=e.sheenRoughness,r.sheenColorFactor=e.sheenColor.toArray(),t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},Kl=class{constructor(e){this.writer=e,this.name="KHR_materials_anisotropy"}writeMaterial(e,t){if(!e.isMeshPhysicalMaterial||e.anisotropy==0)return;let n=this.writer,i=n.extensionsUsed,r={};if(e.anisotropyMap){let o={index:n.processTexture(e.anisotropyMap)};n.applyTextureTransform(o,e.anisotropyMap),r.anisotropyTexture=o}r.anisotropyStrength=e.anisotropy,r.anisotropyRotation=e.anisotropyRotation,t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},Zl=class{constructor(e){this.writer=e,this.name="KHR_materials_emissive_strength"}writeMaterial(e,t){if(!e.isMeshStandardMaterial||e.emissiveIntensity===1)return;let i=this.writer.extensionsUsed,r={};r.emissiveStrength=e.emissiveIntensity,t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},Jl=class{constructor(e){this.writer=e,this.name="EXT_materials_bump"}writeMaterial(e,t){if(!e.isMeshStandardMaterial||e.bumpScale===1&&!e.bumpMap)return;let n=this.writer,i=n.extensionsUsed,r={};if(e.bumpMap){let o={index:n.processTexture(e.bumpMap),texCoord:e.bumpMap.channel};n.applyTextureTransform(o,e.bumpMap),r.bumpTexture=o}r.bumpFactor=e.bumpScale,t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},jl=class{constructor(e){this.writer=e,this.name="EXT_mesh_gpu_instancing"}writeNode(e,t){if(!e.isInstancedMesh)return;let n=this.writer,i=e,r=new Float32Array(i.count*3),o=new Float32Array(i.count*4),a=new Float32Array(i.count*3),c=new Te,l=new E,h=new lt,u=new E;for(let f=0;f<i.count;f++)i.getMatrixAt(f,c),c.decompose(l,h,u),l.toArray(r,f*3),h.toArray(o,f*4),u.toArray(a,f*3);let d={TRANSLATION:n.processAccessor(new ke(r,3)),ROTATION:n.processAccessor(new ke(o,4)),SCALE:n.processAccessor(new ke(a,3))};i.instanceColor&&(d._COLOR_0=n.processAccessor(i.instanceColor)),t.extensions=t.extensions||{},t.extensions[this.name]={attributes:d},n.extensionsUsed[this.name]=!0,n.extensionsRequired[this.name]=!0}};Cs.Utils={insertKeyframe:function(s,e){let n=s.getValueSize(),i=new s.TimeBufferType(s.times.length+1),r=new s.ValueBufferType(s.values.length+n),o=s.createInterpolant(new s.ValueBufferType(n)),a;if(s.times.length===0){i[0]=e;for(let c=0;c<n;c++)r[c]=0;a=0}else if(e<s.times[0]){if(Math.abs(s.times[0]-e)<.001)return 0;i[0]=e,i.set(s.times,1),r.set(o.evaluate(e),0),r.set(s.values,n),a=0}else if(e>s.times[s.times.length-1]){if(Math.abs(s.times[s.times.length-1]-e)<.001)return s.times.length-1;i[i.length-1]=e,i.set(s.times,0),r.set(s.values,0),r.set(o.evaluate(e),s.values.length),a=i.length-1}else for(let c=0;c<s.times.length;c++){if(Math.abs(s.times[c]-e)<.001)return c;if(s.times[c]<e&&s.times[c+1]>e){i.set(s.times.slice(0,c+1),0),i[c+1]=e,i.set(s.times.slice(c+1),c+2),r.set(s.values.slice(0,(c+1)*n),0),r.set(o.evaluate(e),(c+1)*n),r.set(s.values.slice((c+1)*n),(c+2)*n),a=c+1;break}}return s.times=i,s.values=r,a},mergeMorphTargetTracks:function(s,e){let t=[],n={},i=s.tracks;for(let r=0;r<i.length;++r){let o=i[r],a=Ze.parseTrackName(o.name),c=Ze.findNode(e,a.nodeName);if(a.propertyName!=="morphTargetInfluences"||a.propertyIndex===void 0){t.push(o);continue}if(o.createInterpolant!==o.InterpolantFactoryMethodDiscrete&&o.createInterpolant!==o.InterpolantFactoryMethodLinear){if(o.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline)throw new Error("THREE.GLTFExporter: Cannot merge tracks with glTF CUBICSPLINE interpolation.");console.warn("THREE.GLTFExporter: Morph target interpolation mode not yet supported. Using LINEAR instead."),o=o.clone(),o.setInterpolation(oi)}let l=c.morphTargetInfluences.length,h=c.morphTargetDictionary[a.propertyIndex];if(h===void 0)throw new Error("THREE.GLTFExporter: Morph target name not found: "+a.propertyIndex);let u;if(n[c.uuid]===void 0){u=o.clone();let f=new u.ValueBufferType(l*u.times.length);for(let m=0;m<u.times.length;m++)f[m*l+h]=u.values[m];u.name=(a.nodeName||"")+".morphTargetInfluences",u.values=f,n[c.uuid]=u,t.push(u);continue}let d=o.createInterpolant(new o.ValueBufferType(1));u=n[c.uuid];for(let f=0;f<u.times.length;f++)u.values[f*l+h]=d.evaluate(u.times[f]);for(let f=0;f<o.times.length;f++){let m=this.insertKeyframe(u,o.times[f]);u.values[m*l+h]=o.values[f]}}return s.tracks=t,s}};var En={single:{label:"One cyclops eye",eyes:[[0,2.1575,.55,.605,0]]},horizontal:{label:"Horizontal pair",eyes:[[-.34,2.25,.49,.32,0],[.34,2.25,.49,.32,0]]},vertical:{label:"Vertical pair",eyes:[[0,2.03,.49,.32,0],[0,2.73,.39,.31,0]]},frontBack:{label:"One front \xB7 one back",eyes:[[0,2.22,.49,.48,0],[0,2.22,-.43,.48,180]]},triangle:{label:"Triangle",eyes:[[-.33,2.17,.49,.3,0],[.33,2.17,.49,.3,0],[0,2.8,.36,.28,0]]},around:{label:"Evenly around the head",eyes:[[0,2.25,.49,.35,0],[.59,2.25,-.215,.35,120],[-.59,2.25,-.215,.35,240]]},spider:{label:"Spider \xB7 two big + two small",eyes:[[-.34,2.16,.49,.32,0],[.34,2.16,.49,.32,0],[-.235,2.77,.375,.2,0],[.235,2.77,.375,.2,0]]},square:{label:"Four small \xB7 square",eyes:[[-.285,2.16,.49,.25,0],[.285,2.16,.49,.25,0],[-.285,2.73,.375,.25,0],[.285,2.73,.375,.25,0]]}};var pi=new E(0,2.1575,.55);var Wd=new WeakMap;function Ox(s){let e=s.index?s.toNonIndexed():s.clone(),t=e.getAttribute("position"),n=[],i=(o,a,c,l)=>{if(l<6&&Math.max(o.distanceTo(a),a.distanceTo(c),c.distanceTo(o))>.04){let h=o.clone().lerp(a,.5),u=a.clone().lerp(c,.5),d=c.clone().lerp(o,.5);i(o,h,d,l+1),i(h,a,u,l+1),i(d,u,c,l+1),i(h,u,d,l+1)}else n.push(...o.toArray(),...a.toArray(),...c.toArray())};for(let o=0;o<t.count;o+=3)i(new E().fromBufferAttribute(t,o),new E().fromBufferAttribute(t,o+1),new E().fromBufferAttribute(t,o+2),0);e.dispose();let r=new ht;return r.setAttribute("position",new Oe(n,3)),r}function Xd(s){if(s.name==="Iris")s.geometry.dispose(),s.geometry=new nr(.375,128),s.geometry.scale(1,.395/.375,1),s.position.set(.04,2.1475,1.133);else if(s.name==="Glint"||s.name==="Small_glint"||s.name==="Small glint"){let e=s.name!=="Glint";s.geometry.dispose(),s.geometry=new nr(e?.024:.063,32),s.geometry.scale(1,e?.028/.024:.081/.063,1),s.position.y-=.4725}}function Yd(s){if(!/^(Iris|Pupil|Glint|Small.glint)/.test(s.name))return;let e=Wd.get(s);(!e||e.projected!==s.geometry)&&(e?.source.dispose(),e={source:Ox(s.geometry),projected:s.geometry},Wd.set(s,e));let t=e.source.clone(),n=t.getAttribute("position"),i=new E;s.updateMatrix();let r=s.matrix.clone().invert(),o=new Le().setFromMatrix4(s.matrix).transpose(),a=new E,c=new Float32Array(n.count*3),l=s.name==="Pupil"?.609:/glint/i.test(s.name)?.611:s.name==="Iris"?.606:.6075;for(let h=0;h<n.count;h++){i.fromBufferAttribute(n,h).applyMatrix4(s.matrix);let u=i.x-pi.x,d=i.y-pi.y,f=Math.hypot(u,d),m=.595;f>m&&(u*=m/f,d*=m/f),i.set(pi.x+u,pi.y+d,pi.z+Math.sqrt(l*l-u*u-d*d)),a.copy(i).sub(pi).normalize().applyMatrix3(o).normalize(),a.toArray(c,h*3),i.applyMatrix4(r),n.setXYZ(h,i.x,i.y,i.z)}t.setAttribute("normal",new ke(c,3)),t.computeBoundingBox(),t.computeBoundingSphere(),s.geometry.dispose(),s.geometry=t,e.projected=t}function qd(s,e){let t=new it;t.name="Eye arrangement";for(let[n,[i,r,o,a,c]]of En[e].eyes.entries()){let l=new it;l.name="Eye "+(n+1),l.position.set(i,r,o),l.rotation.y=vt.degToRad(c),l.scale.setScalar(a/.605);let h=s.clone(!0);h.visible=!0,h.position.copy(pi).negate(),l.add(h),t.add(l)}return t}var $l=[["round","Round"],["vertical","Vertical slit"],["horizontal","Horizontal slit"],["oval","Oval"],["diamond","Diamond"],["star","Star"],["heart","Heart"],["cross","Cross"]];function Ql(s){let e=new sr;if(["round","vertical","horizontal","oval"].includes(s)){let t=s==="vertical"?.07:s==="horizontal"?.3:.239,n=s==="horizontal"?.065:s==="vertical"||s==="oval"?.31:.257;e.absellipse(0,0,t,n,0,Math.PI*2,!1,0)}else if(s==="heart")e.moveTo(0,-.28),e.bezierCurveTo(-.09,-.18,-.31,0,-.27,.17),e.bezierCurveTo(-.24,.32,-.07,.32,0,.18),e.bezierCurveTo(.07,.32,.24,.32,.27,.17),e.bezierCurveTo(.31,0,.09,-.18,0,-.28);else{let t=[];s==="diamond"&&(t=[[0,.31],[.21,0],[0,-.31],[-.21,0]]),s==="star"&&(t=Array.from({length:10},(n,i)=>{let r=Math.PI/2+i*Math.PI/5,o=i%2?.135:.3;return[Math.cos(r)*o,Math.sin(r)*o]})),s==="cross"&&(t=[[-.08,.28],[.08,.28],[.08,.08],[.28,.08],[.28,-.08],[.08,-.08],[.08,-.28],[-.08,-.28],[-.08,-.08],[-.28,-.08],[-.28,.08],[-.08,.08]]),t.forEach((n,i)=>i?e.lineTo(n[0],n[1]):e.moveTo(n[0],n[1])),e.closePath()}return new No(e,40)}function ea(s,e=!1){let t=s[0].index!==null,n=new Set(Object.keys(s[0].attributes)),i=new Set(Object.keys(s[0].morphAttributes)),r={},o={},a=s[0].morphTargetsRelative,c=new ht,l=0;for(let h=0;h<s.length;++h){let u=s[h],d=0;if(t!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let f in u.attributes){if(!n.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;r[f]===void 0&&(r[f]=[]),r[f].push(u.attributes[f]),d++}if(d!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(a!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let f in u.morphAttributes){if(!i.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;o[f]===void 0&&(o[f]=[]),o[f].push(u.morphAttributes[f])}if(e){let f;if(t)f=u.index.count;else if(u.attributes.position!==void 0)f=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;c.addGroup(l,f,h),l+=f}}if(t){let h=0,u=[];for(let d=0;d<s.length;++d){let f=s[d].index;for(let m=0;m<f.count;++m)u.push(f.getX(m)+h);h+=s[d].attributes.position.count}c.setIndex(u)}for(let h in r){let u=Kd(r[h]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;c.setAttribute(h,u)}for(let h in o){let u=o[h][0].length;if(u===0)break;c.morphAttributes=c.morphAttributes||{},c.morphAttributes[h]=[];for(let d=0;d<u;++d){let f=[];for(let _=0;_<o[h].length;++_)f.push(o[h][_][d]);let m=Kd(f);if(!m)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;c.morphAttributes[h].push(m)}}return c}function Kd(s){let e,t,n,i=-1,r=0;for(let l=0;l<s.length;++l){let h=s[l];if(e===void 0&&(e=h.array.constructor),e!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=h.itemSize),t!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(i===-1&&(i=h.gpuType),i!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=h.count*t}let o=new e(r),a=new ke(o,t,n),c=0;for(let l=0;l<s.length;++l){let h=s[l];if(h.isInterleavedBufferAttribute){let u=c/t;for(let d=0,f=h.count;d<f;d++)for(let m=0;m<t;m++){let _=h.getComponent(d,m);a.setComponent(d+u,m,_)}}else o.set(h.array,c);c+=h.count*t}return i!==void 0&&(a.gpuType=i),a}function eh(s,e){if(e===xd)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),s;if(e===fr||e===Xo){let t=s.getIndex();if(t===null){let o=[],a=s.getAttribute("position");if(a!==void 0){for(let c=0;c<a.count;c++)o.push(c);s.setIndex(o),t=s.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),s}let n=t.count-2,i=[];if(e===fr)for(let o=1;o<=n;o++)i.push(t.getX(0)),i.push(t.getX(o)),i.push(t.getX(o+1));else for(let o=0;o<n;o++)o%2===0?(i.push(t.getX(o)),i.push(t.getX(o+1)),i.push(t.getX(o+2))):(i.push(t.getX(o+2)),i.push(t.getX(o+1)),i.push(t.getX(o)));i.length/3!==n&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");let r=s.clone();return r.setIndex(i),r.clearGroups(),r}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),s}var Fx="material-sculpt-2026-09-10";var Zd=vt.clamp,Ui=s=>s-Math.floor(s),ta=(s,e)=>Ui(Math.sin(s*127.1+e*311.7)*43758.5453);function Jd(s,e){let t=Math.floor(s),n=Math.floor(e),i=10,r=10;for(let o=-1;o<=1;o++)for(let a=-1;a<=1;a++){let c=t+a+.2+.6*ta(t+a,n+o),l=n+o+.2+.6*ta(n+o,t+a+19),h=Math.hypot(s-c,e-l);h<i?(r=i,i=h):h<r&&(r=h)}return{pit:i,seam:r-i}}function jd(s,e,t){let n=Jd(e*5,t*5),i=ta(Math.floor(e*180),Math.floor(t*180)),r=Math.sin(e*18+Math.sin(t*9)*2),o=Math.pow(1-Math.abs(Math.sin(e*12+Math.sin(t*7)*2)),9),a=1-vt.smoothstep(n.seam,.025,.12),c=1-vt.smoothstep(n.pit,.06,.19),l=Ui(e*10+Math.floor(t*12)%2*.5)-.5,h=Ui(t*12)-.5,u=Zd(1-Math.pow(Math.abs(l)*1.9,3)-Math.pow(Math.abs(h)*1.9,4),0,1),d=.5,f=.5,m=0,_=.7;switch(s){case 0:d=.42+i*.12+r*.015,f=.54+i*.07,_=.61+i*.2;break;case 1:d=.4+r*.19+o*.25,f=.28+o*.42+i*.13,_=.91;break;case 2:d=.6-c*.3+Math.sin(Math.atan2(h,l)*24)*.04,f=.7-c*.4,m=c*.16,_=.87;break;case 3:d=u*.75,f=.22+u*.65,_=.18+(.9-u)*.4;break;case 4:d=u*.6+i*.12,f=.22+u*.52+r*.08,_=.56+i*.2;break;case 5:d=.55+r*.12-c*.23,f=.15+c*.8,m=c,_=.32;break;case 6:d=.75-c*.65-i*.12,f=.44+c*.4+i*.1,_=.93;break;case 7:d=.55+Math.sin(t*35)*.09-i*.12-a*.06,f=.75-i*.2-a*.35,_=.83;break;case 8:d=.5+r*.035,f=.7+r*.12,m=o*.35,_=.12;break;case 9:d=.48+r*.14+i*.12,f=.15+i*.13+o*.3,m=o*.4,_=.83;break;case 10:d=.55+o*.08,f=.74+o*.23,m=o*.22,_=.18+i*.07;break;case 11:d=.55-a*.3,f=.03+a*.48,m=a*.8,_=.14;break;case 12:d=.5+r*.19+c*.18,f=.25+c*.65,m=c*.4,_=.39;break;case 13:d=.62-a*.52+Math.floor(i*4)*.035,f=.32+i*.2-a*.26,_=.98;break;case 14:d=.45+Math.floor(n.pit*8)*.05,f=.32+n.pit*.45,_=.09;break;case 15:{let p=Jd(e*2+Math.sin(t*5)*.3,t*2+Math.sin(e*4)*.3),g=1-vt.smoothstep(p.seam,.015,.065);d=.72-g*.65+i*.1,f=.015+g*.88,m=g,_=.95-g*.7;break}case 16:d=.5+a*.14,f=.72+a*.22,_=.13+a*.48;break;case 17:{let p=Math.pow(1-Math.abs(Math.sin(e*7+Math.sin(t*22)*.25+Math.sin(t*9))),24);d=.54-p*.2,f=.13+p*.82,m=p,_=.38;break}case 18:{let p=Math.min(Ui(e*5),Ui(t*5));d=p<.06?.12:.68+i*.03,f=p<.06?.05:.43+i*.16,_=.24+i*.25;break}case 19:{let p=Ui(e*6),g=Ui(t*6),M=ta(Math.floor(e*6),Math.floor(t*6)),x=Math.abs(p-.5)<.025&&g>.2&&M>.35||Math.abs(g-.5)<.025&&p<.6&&M<.65?1:0;d=.5-x*.2,f=.08+x*.9,m=x,_=.25;break}case 20:d=.5+Math.sin(e*160+Math.sin(t*25))*.2,f=.58+i*.2,_=.98;break;case 21:d=.5+r*.018,f=.7+r*.07,_=.07;break;case 22:d=.5+i*.035+r*.01,f=.67+r*.02,_=.51;break}return{height:d,tint:Zd(f,0,1),glow:m,rough:_}}var th=new Map;function Bx(s){let e=s.id+s.primary;if(th.has(e))return th.get(e);let t=192,n=Array.from({length:4},()=>new Uint8Array(t*t*4)),i=new be(s.secondary),r=new be(s.primary),o=new be(s.accent),a=new be;for(let h=0;h<t;h++)for(let u=0;u<t;u++){let d=jd(s.id,u/t,h/t),f=(h*t+u)*4;a.copy(d.tint<.5?i:r).lerp(d.tint<.5?r:o,d.tint<.5?d.tint*2:(d.tint-.5)*2);for(let m=0;m<3;m++)n[0][f+m]=Math.round([a.r,a.g,a.b][m]*255),n[1][f+m]=d.height*255,n[2][f+m]=d.rough*255,n[3][f+m]=d.glow*255;for(let m of n)m[f+3]=255}let c=n.map(h=>{let u=new xs(h,t,t,Ot);return u.wrapS=u.wrapT=Sn,u.magFilter=Rt,u.minFilter=Xt,u.generateMipmaps=!0,u.needsUpdate=!0,u}),l={map:c[0],bump:c[1],rough:c[2],glow:c[3]};return th.set(e,l),l}function nh(s,e,t){let n=Bx(s),i=s.id,r=new It({name:s.detail+" \xB7 "+Fx,color:"white",map:n.map,bumpMap:n.bump,bumpScale:e*([8,21,22].includes(i)?5e-4:.007),roughnessMap:n.rough,roughness:1,metalness:s.metalness,vertexColors:!0,envMapIntensity:[18,19,14].includes(i)?1.3:1});return t&&(r.side=t.side,r.polygonOffset=t.polygonOffset,r.polygonOffsetFactor=t.polygonOffsetFactor),[3,4,10,11,14,18,19,21].includes(i)&&(r.clearcoat=i===21?1:.6,r.clearcoatRoughness=i===21?.055:.19),[8,14,16,21].includes(i)&&(r.transmission=i===21?.8:i===8?.62:i===16?.54:.28,r.thickness=e*(i===21?.36:.16),r.ior=i===21?1.36:i===16?1.31:1.46,r.attenuationColor.set(s.primary),r.attenuationDistance=e*(i===21?1.4:2),r.metalness=0,r.roughnessMap=null,r.roughness=i===21?.075:i===16?.16:.12),[5,8,9,10,11,12,15,17,19].includes(i)&&(r.emissive.set(s.accent),r.emissiveMap=n.glow,r.emissiveIntensity=i===15?2.1:i===17?1.5:.85),i===20&&(r.sheen=1,r.sheenRoughness=.96,r.sheenColor.set(s.accent),r.metalness=0),(i===0||i===22)&&(r.sheen=.22,r.sheenColor.set("#ffc9b1")),r.flatShading=[13,14].includes(i),r.userData.materialStyle=i,r}function gr(s,e,t=1,n=1){if(Array.isArray(s.material)||!s.geometry.attributes.position)return;let i=s.geometry,r=i.clone();r.attributes.normal||r.computeVertexNormals();let o=r.attributes.position,a=r.attributes.normal,c=new Float32Array(o.count*2),l=new Float32Array(o.count*3);s.updateWorldMatrix(!0,!1);let h=new Le().getNormalMatrix(s.matrixWorld),u=s.matrixWorld.clone().invert(),d=new E,f=new E,m=e.id,_=t*([0,8,20,21,22].includes(m)?.0018:m===13?.037:m===18?.018:.019);for(let g=0;g<o.count;g++){d.fromBufferAttribute(o,g).applyMatrix4(s.matrixWorld),f.fromBufferAttribute(a,g).applyMatrix3(h).normalize();let M=d.x/t,x=d.y/t,y=d.z/t,A=(Math.abs(f.z)>.45?M:y)*1.8+.5,w=x*1.8+.5,R=jd(m,A,w);c[g*2]=A,c[g*2+1]=w;let I=1;for(let[v,S,F,B]of s.userData.eyeSockets??[])I*=vt.smoothstep(Math.hypot(d.x-v,d.y-S,d.z-F),B*1.04,B*1.35);d.addScaledVector(f,(R.height-.5)*_*n*I).applyMatrix4(u),o.setXYZ(g,d.x,d.y,d.z);let N=.91+.09*Math.sin(M*3+x*4+y*2);l.set([N,N,N],g*3)}r.setAttribute("uv",new ke(c,2)),r.setAttribute("color",new ke(l,3)),r.computeVertexNormals(),r.computeBoundingBox(),r.computeBoundingSphere();let p=s.material;s.material=nh(e,t,p),s.geometry=r,s.userData.ownedGeometry&&i.dispose(),s.userData.ownedGeometry=!0,s.userData.ownedMaterial=!0}function zx(s){s.updateWorldMatrix(!0,!0);let e=s.matrixWorld.clone().invert(),t=[],n=0;return s.traverseVisible(i=>{if(!(i instanceof ye)||i.userData.materialDetail)return;let r=i.geometry,o=r.attributes.position,a=r.index;if(!o)return;let c=e.clone().multiply(i.matrixWorld),l=a?.count??o.count,h=Math.max(1,Math.ceil(l/24e3))*3;for(let u=0;u+2<l;u+=h){let[d,f,m]=[0,1,2].map(p=>new E().fromBufferAttribute(o,a?a.getX(u+p):u+p).applyMatrix4(c)),_=f.clone().sub(d).cross(m.clone().sub(d)).length()*.5;_<1e-10||(n+=_,t.push({a:d,b:f,c:m,total:n}))}}),{triangles:t,total:n}}function $d(s,e,t,n=1,i=1,r=!1){let o=new it;if(o.name="Material sculpture "+e.detail,o.userData.region=t,t==="eye"||t==="nails"||[0,7,22].includes(e.id))return o;let{triangles:a,total:c}=zx(s);if(!a.length)return o;let l=e.id*9173+t.length*419,h=()=>(l=Math.imul(l,1664525)+1013904223>>>0,l/4294967296),u=e.id;if(r&&u===20)return o;let d=u===20?2100:[3,4].includes(u)?110:u===21?32:42,f=Math.round(d*(t==="head"||t==="palm"||t==="back_of_hand"?1:t==="body"?.8:.5)),m=[[],[],[]],_=new E,p=new E,g=new E(0,1,0);function M(y,A,w,R,I=0){if(y.applyMatrix4(new Te().compose(A,w,R)),y.attributes.uv||y.setAttribute("uv",new Oe(new Float32Array(y.attributes.position.count*2),2)),y.index){let N=y.toNonIndexed();y.dispose(),y=N}m[I].push(y)}let x=[e.primary,e.accent,e.secondary];for(let y=0;y<f;y++){let A=h()*c,w=0,R=a.length-1;for(;w<R;){let ee=w+R>>1;a[ee].total<A?w=ee+1:R=ee}let{a:I,b:N,c:v}=a[w],S=Math.sqrt(h()),F=h();p.copy(I).multiplyScalar(1-S).addScaledVector(N,S*(1-F)).addScaledVector(v,S*F),_.copy(N).sub(I).cross(v.clone().sub(I)).normalize();let B=!1;if(s.traverse(ee=>{for(let[re,Ae,De,X]of ee.userData.eyeSockets??[])p.distanceTo(new E(re,Ae,De))<X*1.48&&(B=!0)}),B||!r&&t==="feet"&&_.y<-.2)continue;let G=[2,3,9,13,14,16].includes(u)?1.7:1,Y=new lt().setFromUnitVectors(g,_),P=n*i*(.055+h()*.075)*G,j=p.clone(),k=new E(P,P,P),J=(ee,re=0,Ae=k,De=0)=>M(ee,j.clone().addScaledVector(_,re),Y,Ae,De);switch(u){case 1:{let ee=new Gn([new E(0,-.1,0),new E(.18,.5,0),new E(-.15,1.3,.1),new E(.35,2,.1)]);J(new ci(ee,8,.14,5,!1),0,k,2),J(new Dt(1,8,5),P*1.1,new E(P*.55,P*.9,P*.12),1);break}case 2:J(new ut(.13,.19,1,6),P*.25,new E(P,P,P),2),J(new Dt(1,12,8,0,Math.PI*2,0,Math.PI/2),P*.8,new E(P*.8,P*.38,P*.8),y%3===0?1:0),J(new bs(.73,.12,16),P*.77,k,2);break;case 3:J(new Dt(1,6,4),P*.08,new E(P*.86,P*.26,P*1.3),0),J(new bs(.19,.8,5),P*.34,k,1);break;case 4:J(new Dt(1,5,3),P*.015,new E(P*.68,P*.17,P),y%6===0?1:0);break;case 5:J(new bs(.18,2.5,4),P*.6,new E(P,P,P*.5),2),J(new Dt(.22,8,5),P*1.7,k,1);break;case 6:{J(new ut(.19,.32,1.9,7),P*.55,k,0);for(let ee of[-1,1]){let re=Y.clone().multiply(new lt().setFromAxisAngle(new E(0,0,1),ee*.62));M(new ut(.12,.2,1.2,6),j.clone().addScaledVector(_,P),re,k,1)}J(new Vt(.2,.08,5,9),P*1.5,k,2);break}case 8:J(new Dt(1,9,6),P*.3,new E(P*.3,P*1.9,P*.13),1);break;case 9:{let ee=new Gn([new E(0,-.15,0),new E(.1,.7,0),new E(.6,1.5,0)]),re=new ci(ee,9,.24,7,!1),Ae=re.attributes.position;for(let De=0;De<Ae.count;De++){let X=Math.floor(De/8)/9,Q=ee.getPointAt(X),he=new E().fromBufferAttribute(Ae,De).sub(Q).multiplyScalar(1-X*.97).add(Q);Ae.setXYZ(De,he.x,he.y,he.z)}re.computeVertexNormals(),J(re,0,k,2);break}case 10:J(new Vt(.65,.075,5,18,Math.PI*1.55),P*.3,k,1),J(new Ss(.35),P*.4,k,0);break;case 11:J(new Ss(1),P*.02,new E(P*.7,P*.28,P*.85),2),J(new Ss(.11),P*.5,k,1);break;case 12:J(new Vt(.65,.18,7,13,Math.PI*1.8),P*.25,k,0),J(new Dt(.28,8,6),P*.4,k,1);break;case 13:J(new ir(1,0),P*.05,new E(P*1.3,P*.38,P*.9),y%4===0?1:0);break;case 14:case 16:J(new ut(0,.36,2.3,u===14?6:5),P*.72,new E(P,P,P),y%3===0?1:0),J(new ut(.28,.34,.65,6),P*.14,k,2);break;case 15:J(new ir(1,0),P*.025,new E(P*1.25,P*.22,P),2);break;case 17:J(new Ht(.12,1.7,.9),P*.45,k,2),J(new ut(.08,.08,1.4,5),P*.4,k,1);break;case 18:{J(new ut(.76,.88,.18,8),P*.12,k,0),J(new Vt(.38,.1,5,14),P*.26,k,2);for(let ee=0;ee<6;ee++){let re=ee*Math.PI/3,Ae=new E(Math.cos(re)*P*.63,P*.29,Math.sin(re)*P*.63).applyQuaternion(Y);M(new ut(.08,.08,.12,6),j.clone().add(Ae),Y,k,1)}y%3===0&&J(new ut(.46,.46,.23,12),P*.32,k,2);break}case 19:J(new Ht(1.1,.19,1.65),P*.06,k,2),J(new Ht(.075,.035,1.35),P*.18,k,1);break;case 20:{let ee=.3+h()*.6,re=new Gn([new E(0,-.1,0),new E(.15,.6,.1),new E(ee,1.3,.25),new E(ee*1.4,1.65,.3)]),Ae=new ci(re,5,.035,3,!1),De=Ae.attributes.position;for(let X=0;X<De.count;X++){let Q=Math.floor(X/4)/5,he=re.getPointAt(Q),le=new E().fromBufferAttribute(De,X).sub(he).multiplyScalar(1-Q*.96).add(he);De.setXYZ(X,le.x,le.y,le.z)}Ae.computeVertexNormals(),J(Ae,0,k,y%4===0?1:y%5===0?2:0);break}case 21:J(new Dt(1,10,7),-P*.72,new E(P*.3,P*.43,P*.3),y%4===0?1:2);break}}return m.forEach((y,A)=>{if(!y.length)return;let w=ea(y,!1);if(y.forEach(N=>N.dispose()),!w)return;let R=new It({color:x[A],roughness:[14,16,21].includes(u)?.12:u===20?.95:e.roughness,metalness:e.metalness,clearcoat:[3,18,19,21].includes(u)?.7:0});A===1&&[5,8,9,11,12,15,17,19].includes(u)&&(R.emissive.set(e.accent),R.emissiveIntensity=1.2),[8,14,16].includes(u)&&(R.transmission=.45,R.thickness=n*.15,R.ior=1.35,R.metalness=0),u===20&&(R.sheen=1,R.sheenColor.set(e.accent)),u===21&&(R.color.set(A===1?e.accent:"#edffd3"),R.roughness=.12,R.metalness=0),u===18&&(R.metalness=.87,R.color.set(A===2?"#333d48":x[A]));let I=new ye(w,R);I.name=e.detail+" structural details",I.userData={materialDetail:!0,ownedGeometry:!0,ownedMaterial:!0,region:t},o.add(I)}),o}var ih=[{id:"supportive",name:"Supportive",tone:"Warm, patient, encouraging.",approach:"Acknowledge effort. Offer one manageable next step. Celebrate progress without pressure.",lines:{start:"We can start small. What is one thing you could do in the next five minutes?",stuck:"You do not have to solve everything at once. Let\u2019s make the next step smaller.",missed:"One missed goal does not erase your progress. What would make trying again easier?",win:"You followed through. Take a moment to notice what helped you do that."}},{id:"direct",name:"Direct",tone:"Clear, firm, practical.",approach:"Be concise. Turn vague intentions into a specific next action. Hold the user accountable without insults.",lines:{start:"Pick one task. Decide what finished looks like. Begin with the first step.",stuck:"Name the obstacle. Choose one action that is still under your control.",missed:"Review what got in the way, adjust the plan, and choose your next attempt.",win:"You did what you said you would. Keep the part of the plan that worked."}},{id:"analytical",name:"Analytical",tone:"Methodical, curious, precise.",approach:"Ask about constraints. Break goals into observable steps. Treat setbacks as information, not character flaws.",lines:{start:"What is the goal, what time do you have, and what is the smallest useful result?",stuck:"Is the obstacle time, clarity, energy, or resources? Let\u2019s change one variable.",missed:"Compare the plan with what happened. Which assumption needs updating?",win:"What specifically helped? Record it so you can repeat the conditions."}},{id:"playful",name:"Playful",tone:"Mischievous, upbeat, lightly teasing.",approach:"Use small quests and creature humor. Keep encouragement specific. Never shame the user.",lines:{start:"Tiny quest unlocked: defeat the first five minutes. The giant task can wait its turn.",stuck:"This boss fight needs a smaller boss. What can we turn into a side quest?",missed:"The quest log has been updated, not destroyed. Pick your next checkpoint.",win:"Achievement unlocked: actually doing the thing. My one eye is impressed."}},{id:"calm",name:"Calm",tone:"Steady, spacious, grounded.",approach:"Use short, unhurried language. Leave room for the user\u2019s choices. Focus on the present next step.",lines:{start:"There is no need to rush the whole plan. Choose one thing to begin.",stuck:"Pause for a moment. What feels possible from where you are right now?",missed:"That attempt is over. You can choose a gentler, more workable next one.",win:"Notice this moment. You made progress, and you can let that be enough for now."}},{id:"mom",name:"MOM Inc.",tone:"Polite, theatrical, dry corporate humor.",approach:"Use fictional MOM Inc. bureaucracy and understated absurdity. Keep choices voluntary and practical.",lines:{start:"MOM Inc. has approved one manageable task. Please select yours; the paperwork can wait.",stuck:"Your obstacle has been escalated to the Department of Smaller Steps. What can we simplify?",missed:"No disciplinary forms today. We are revising the plan, not your worth.",win:"Progress officially recorded. Please accept one highly regulated moment of pride."}}];var kx=[{id:"nails",label:"Nails",short:"Nails",description:"Five claw and nail forms"},{id:"fingertips",label:"Finger tips",short:"Tips",description:"Distal pads and final phalanges"},{id:"fingers",label:"Fingers & knuckles",short:"Fingers",description:"Joined finger shafts, bases and knuckles"},{id:"palm",label:"Palm",short:"Palm",description:"The inner hand surface"},{id:"back_of_hand",label:"Back of hand",short:"Back",description:"The dorsal hand surface"},{id:"wrist",label:"Wrist",short:"Wrist",description:"Stump, cuff and transition"}],_r=[{id:0,name:"Mortal",realm:"Baseline \xB7 Earth",primary:"#b9856f",secondary:"#714c42",accent:"#f0c0a3",emissive:"#000000",roughness:.72,metalness:.02,detail:"clean"},{id:1,name:"Verdant",realm:"Wildroot \xB7 Dimension 12",primary:"#3f7448",secondary:"#1e3b2b",accent:"#b8dd6e",emissive:"#172d13",roughness:.88,metalness:0,detail:"vine"},{id:2,name:"Mycelial",realm:"Sporesea \xB7 Dimension 09",primary:"#d5c7ae",secondary:"#776b82",accent:"#f59ec4",emissive:"#6d234a",roughness:.92,metalness:0,detail:"caps"},{id:3,name:"Chitin",realm:"Carapace \xB7 Dimension 31",primary:"#4f263d",secondary:"#180f20",accent:"#d17663",emissive:"#240716",roughness:.3,metalness:.28,detail:"plates"},{id:4,name:"Reptilian",realm:"Scalehold \xB7 Dimension 04",primary:"#5f7a3f",secondary:"#283621",accent:"#cfb85c",emissive:"#101c08",roughness:.76,metalness:.04,detail:"scales"},{id:5,name:"Abyssal",realm:"Deep Trench \xB7 Dimension 88",primary:"#132a42",secondary:"#06111f",accent:"#4edfd3",emissive:"#0b756f",roughness:.34,metalness:.12,detail:"spines"},{id:6,name:"Coral",realm:"Living Reef \xB7 Dimension 22",primary:"#e46867",secondary:"#70344c",accent:"#ffd27a",emissive:"#8b2438",roughness:.83,metalness:0,detail:"coral"},{id:7,name:"Skeletal",realm:"Ossuary \xB7 Dimension 00",primary:"#d8d0af",secondary:"#80785f",accent:"#fff7d1",emissive:"#17160e",roughness:.9,metalness:0,detail:"bone"},{id:8,name:"Spectral",realm:"Veil \xB7 Dimension 13",primary:"#8ed9cd",secondary:"#294c58",accent:"#d5fff8",emissive:"#248e86",roughness:.18,metalness:.04,detail:"mist"},{id:9,name:"Infernal",realm:"Cinder Court \xB7 Dimension 66",primary:"#7b211e",secondary:"#260b0a",accent:"#ff8a2a",emissive:"#d33812",roughness:.58,metalness:.1,detail:"flame"},{id:10,name:"Celestial",realm:"High Orbit \xB7 Dimension 07",primary:"#e6dca4",secondary:"#786da7",accent:"#fffbd7",emissive:"#8d74d6",roughness:.24,metalness:.5,detail:"halo"},{id:11,name:"Voidborn",realm:"Null Expanse \xB7 Dimension \u2205",primary:"#16101f",secondary:"#060409",accent:"#9f64ff",emissive:"#482285",roughness:.16,metalness:.36,detail:"void"},{id:12,name:"Eldritch",realm:"Watcher Fold \xB7 Dimension 47",primary:"#6b426c",secondary:"#252038",accent:"#b6ef63",emissive:"#4e7628",roughness:.64,metalness:.04,detail:"eyes"},{id:13,name:"Stone Golem",realm:"Deep Strata \xB7 Dimension 19",primary:"#6f7068",secondary:"#393b37",accent:"#b7a37d",emissive:"#171811",roughness:.98,metalness:0,detail:"rock"},{id:14,name:"Crystal",realm:"Prism Vault \xB7 Dimension 52",primary:"#896bc2",secondary:"#302e66",accent:"#e0c8ff",emissive:"#5a3da8",roughness:.12,metalness:.3,detail:"crystal"},{id:15,name:"Magma",realm:"Mantle \xB7 Dimension 03",primary:"#4a1713",secondary:"#140706",accent:"#ffb22f",emissive:"#e44712",roughness:.78,metalness:.06,detail:"magma"},{id:16,name:"Glacial",realm:"White Silence \xB7 Dimension 71",primary:"#93c9df",secondary:"#315a76",accent:"#ebfdff",emissive:"#3c93bb",roughness:.2,metalness:.14,detail:"ice"},{id:17,name:"Stormcharged",realm:"Tempest Ring \xB7 Dimension 28",primary:"#48536e",secondary:"#1a2236",accent:"#c3f7ff",emissive:"#3ebde0",roughness:.4,metalness:.32,detail:"storm"},{id:18,name:"Clockwork Robot",realm:"Brass Meridian \xB7 Dimension 14",primary:"#9a6a37",secondary:"#33251d",accent:"#efd08c",emissive:"#5b2c12",roughness:.32,metalness:.82,detail:"gears"},{id:19,name:"Neon Synth",realm:"Aftergrid \xB7 Dimension 20",primary:"#251d54",secondary:"#0b0921",accent:"#ff5bd7",emissive:"#b519ac",roughness:.22,metalness:.55,detail:"neon"},{id:20,name:"Fluffy",realm:"Cloudburrow \xB7 Soft forms",primary:"#d6a987",secondary:"#bb8969",accent:"#ffe4c3",emissive:"#000000",roughness:.88,metalness:0,detail:"fur"},{id:21,name:"Jelly",realm:"Lime Lagoon \xB7 Soft forms",primary:"#a7ec69",secondary:"#f1ffd4",accent:"#c9ff90",emissive:"#000000",roughness:.13,metalness:0,detail:"jelly"},{id:22,name:"Baby",realm:"Little One \xB7 Soft forms",primary:"#efb398",secondary:"#d68e7c",accent:"#ffe2d5",emissive:"#000000",roughness:.52,metalness:0,detail:"baby"}];var Sv=_r.map(s=>({name:s.name,description:`A pure ${s.name.toLowerCase()} hand`,values:Object.fromEntries(kx.map(e=>[e.id,s.id]))})),Tv=_r.filter(s=>![8,11].includes(s.id));var Yn=["head","eye","collar","body","arms","feet"];var rn=[{..._r[0],name:"Original MYR5",primary:"#7946aa",secondary:"#351344",accent:"#b373d4",roughness:.62},..._r.slice(1)],Hx=rn.filter(s=>![8,11,22].includes(s.id)),sh=()=>({version:1,styles:{head:0,eye:0,collar:0,body:0,arms:0,feet:0},eye:"open",fur:1,iris:1,pupil:"round",pupilSize:1,detail:1,coach:"supportive",fingers:4,toes:3,eyeLayout:"single"});function Qd(s){let e=JSON.parse(s);if(e.pupil??="round",e.pupilSize??=1,e.detail??=1,e.coach??="supportive",e.fingers??=4,e.toes??=3,e.eyeLayout??="single",!Number.isInteger(e.fingers)||e.fingers<2||e.fingers>6||!Number.isInteger(e.toes)||e.toes<1||e.toes>6||!Object.hasOwn(En,e.eyeLayout)||e.version!==1||!e.styles||!Yn.every(t=>Number.isInteger(e.styles[t])&&e.styles[t]>=0&&e.styles[t]<rn.length)||!["open","sleepy","wide"].includes(e.eye)||!Number.isFinite(e.fur)||e.fur<.65||e.fur>1.4||!Number.isFinite(e.iris)||e.iris<.7||e.iris>1.25||!$l.some(t=>t[0]===e.pupil)||!Number.isFinite(e.pupilSize)||e.pupilSize<.6||e.pupilSize>1.15||!Number.isFinite(e.detail)||e.detail<.5||e.detail>1.5||!ih.some(t=>t.id===e.coach))throw Error("Choose a valid MYR5 recipe.");return{version:1,styles:Object.fromEntries(Yn.map(t=>[t,e.styles[t]])),eye:e.eye,fur:e.fur,iris:e.iris,pupil:e.pupil,pupilSize:e.pupilSize,detail:e.detail,coach:e.coach,fingers:e.fingers,toes:e.toes,eyeLayout:e.eyeLayout}}function ef(s){let e=new it;e.name="Empty bone sockets",e.userData.region="head";for(let[t,[n,i,r,o,a]]of En[s.eyeLayout].eyes.entries()){let c=new it;c.name="Empty socket "+(t+1),c.position.set(n,i,r),c.rotation.y=vt.degToRad(a);let l=new Dt(o*.94,32,20,0,Math.PI*2,Math.PI/2,Math.PI/2);l.rotateX(Math.PI/2);let h=new ye(l,new wt({color:"#0c0907",roughness:1,side:kt}));h.name="Recessed empty cavity",h.position.z=-o*.06;let u=new ye(new Vt(o*.94,o*.105,8,32),nh(rn[7],1));u.material.vertexColors=!1,u.name="Weathered orbital bone",c.add(h,u),c.userData.emptySocket=!0,e.add(c)}return e}function tf(s,e){let t=new it;t.name="Articulated skeleton "+s,t.userData.region=s;let n=new wt({color:rn[7].primary,roughness:.83}),i=(a,c,l=[1,1,1])=>{let h=new ye(a,n.clone());return h.position.fromArray(c),h.scale.fromArray(l),h.userData.region=s,t.add(h),h},r=(a,c=.07)=>i(new Dt(c,10,7),a,[1,.78,1]),o=(a,c,l=.055)=>{let h=new E(...a),u=new E(...c),d=u.clone().sub(h);i(new ut(l*.72,l*.9,d.length(),9),h.clone().add(u).multiplyScalar(.5).toArray()).quaternion.setFromUnitVectors(new E(0,1,0),d.normalize()),r(a,l*1.6),r(c,l*1.6)};if(s==="body"){o([0,.48,-.18],[0,1.5,-.18],.09);for(let a=0;a<7;a++){let c=.58+a*.125,l=.3+Math.sin((a+1)/8*Math.PI)*.24,h=Array.from({length:25},(u,d)=>{let f=d/24*Math.PI*2;return new E(Math.cos(f)*l,c+Math.sin(f)*.035,-.08+Math.sin(f)*.35)});i(new ci(new Gn(h,!0),32,.031,6,!0),[0,0,0])}o([0,.75,.3],[0,1.41,.27],.043);for(let a of[-1,1]){o([0,1.4,-.08],[a*.51,1.4,-.03],.048);let c=i(new Vt(.2,.075,6,12),[a*.22,.51,-.09],[1,.78,1]);c.rotation.y=a*.3}}else if(s==="collar")for(let a=0;a<3;a++){let c=i(new Vt(.24+a*.075,.043,6,22),[0,1.39+a*.09,-.04]);c.rotation.x=Math.PI/2}else if(s==="arms")for(let a of[-1,1]){let c=[a*.52,1.36,-.02],l=[a*.78,1.05,.04],h=[a*.91,.81,.16];o(c,l,.057),o([l[0]-.035,l[1],l[2]],h,.035),o([l[0]+.035,l[1],l[2]-.025],[h[0]+.055,h[1],h[2]],.028);for(let u=0;u<e.fingers;u++){let d=(u-(e.fingers-1)/2)*.056,f=[h[0]+a*d,h[1]-.08,h[2]+.035],m=[f[0]+a*.06,f[1]-.13,f[2]+.08],_=[m[0]-a*.025,m[1]-.09,m[2]+.055];o(h,f,.024),o(f,m,.021),o(m,_,.017)}}else if(s==="feet")for(let a of[-1,1]){let c=[a*.34,.58,-.03],l=[a*.39,.2,.04];o(c,l,.068);for(let h=0;h<e.toes;h++){let u=a*.39+(h-(e.toes-1)/2)*.072;o(l,[u,.14,.2],.03),o([u,.14,.2],[u,.105,.38],.025)}}return t.updateMatrixWorld(!0),t.traverse(a=>{a instanceof ye&&gr(a,rn[7])}),t}function nf(s){let e=new it;e.name="Material collar",e.userData.region="collar";let t=rn[s],n=[3,13,18,19].includes(s),i=new Vt(.52,n?.15:.18,n?6:14,n?12:32);i.rotateX(Math.PI/2),i.scale(1,1,.75),i.translate(0,1.45,-.03);let r=new ye(i,new wt);return e.add(r),gr(r,t,1),e}function sf(s,e){let t=new it;t.name="Mechanical "+s,t.userData.region=s;let n=new It({color:"#ad7842",metalness:.87,roughness:.27,clearcoat:.4}),i=new wt({color:"#252e3b",metalness:.88,roughness:.3}),r=new wt({color:"#ffe7a0",emissive:"#ffd169",emissiveIntensity:1.2,roughness:.2}),o=(l,h,u=n)=>{let d=new ye(l,u.clone());return d.position.fromArray(h),d.userData.region=s,t.add(d),d},a=(l,h,u,d=i)=>{let f=new E(...l),m=new E(...h),_=m.clone().sub(f);o(new ut(u,u,_.length(),8),f.clone().add(m).multiplyScalar(.5).toArray(),d).quaternion.setFromUnitVectors(new E(0,1,0),_.normalize())},c=(l,h)=>{let u=o(new ut(h,h,.12,12),l,i);u.rotation.x=Math.PI/2;let d=o(new ut(h*.45,h*.45,.14,8),l);d.rotation.x=Math.PI/2};if(s==="body"){let l=o(new ut(.51,.42,.93,8),[0,.99,-.09]);l.scale.z=.79;for(let d of[.57,.78,1.03,1.43]){let f=o(new Vt(.45,.035,5,8),[0,d,-.09],i);f.rotation.x=Math.PI/2,f.scale.y=.8}let h=o(new ut(.19,.19,.07,12),[0,1.1,.34],i);h.rotation.x=Math.PI/2;let u=o(new ut(.12,.12,.08,12),[0,1.1,.36],r);u.rotation.x=Math.PI/2;for(let d of[-1,1])for(let f of[.75,1.3]){let m=o(new ut(.036,.036,.1,6),[d*.29,f,.34],i);m.rotation.x=Math.PI/2}}else if(s==="arms")for(let l of[-1,1]){let h=[l*.52,1.38,0],u=[l*.77,1.04,.04],d=[l*.91,.8,.17];c(h,.16),a(h,u,.108,n),c(u,.12),a(u,d,.086,n),a([u[0]+l*.06,u[1],u[2]+.07],[d[0]+l*.06,d[1],d[2]+.07],.027),c(d,.085),o(new Ht(.23,.16,.13),[d[0],.69,.21]);for(let f=0;f<e.fingers;f++){let m=d[0]+(f-(e.fingers-1)/2)*.052,_=[m,.63,.21],p=[m,.52,.27],g=[m,.45,.3];c(_,.029),a(_,p,.023,n),c(p,.026),a(p,g,.02,n)}}else if(s==="feet")for(let l of[-1,1]){c([l*.35,.53,-.01],.13),a([l*.35,.53,-.01],[l*.39,.22,.04],.095,n),c([l*.39,.22,.04],.095),o(new Ht(.26,.13,.32),[l*.39,.13,.15]);for(let h=0;h<e.toes;h++)o(new Ht(.055,.085,.13),[l*.39+(h-(e.toes-1)/2)*.065,.115,.36])}return t}var na=class extends Xn{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new uh(t)}),this.register(function(t){return new dh(t)}),this.register(function(t){return new Mh(t)}),this.register(function(t){return new bh(t)}),this.register(function(t){return new Sh(t)}),this.register(function(t){return new ph(t)}),this.register(function(t){return new mh(t)}),this.register(function(t){return new gh(t)}),this.register(function(t){return new _h(t)}),this.register(function(t){return new hh(t)}),this.register(function(t){return new yh(t)}),this.register(function(t){return new fh(t)}),this.register(function(t){return new vh(t)}),this.register(function(t){return new xh(t)}),this.register(function(t){return new ch(t)}),this.register(function(t){return new Th(t)}),this.register(function(t){return new wh(t)})}load(e,t,n,i){let r=this,o;if(this.resourcePath!=="")o=this.resourcePath;else if(this.path!==""){let l=fi.extractUrlBase(e);o=fi.resolveURL(l,this.path)}else o=fi.extractUrlBase(e);this.manager.itemStart(e);let a=function(l){i?i(l):console.error(l),r.manager.itemError(e),r.manager.itemEnd(e)},c=new cr(this.manager);c.setPath(this.path),c.setResponseType("arraybuffer"),c.setRequestHeader(this.requestHeader),c.setWithCredentials(this.withCredentials),c.load(e,function(l){try{r.parse(l,o,function(h){t(h),r.manager.itemEnd(e)},a)}catch(h){a(h)}},n,a)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,n,i){let r,o={},a={},c=new TextDecoder;if(typeof e=="string")r=JSON.parse(e);else if(e instanceof ArrayBuffer)if(c.decode(new Uint8Array(e,0,4))===lf){try{o[ze.KHR_BINARY_GLTF]=new Eh(e)}catch(u){i&&i(u);return}r=JSON.parse(o[ze.KHR_BINARY_GLTF].content)}else r=JSON.parse(c.decode(e));else r=e;if(r.asset===void 0||r.asset.version[0]<2){i&&i(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let l=new Dh(r,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});l.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){let u=this.pluginCallbacks[h](l);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),a[u.name]=u,o[u.name]=!0}if(r.extensionsUsed)for(let h=0;h<r.extensionsUsed.length;++h){let u=r.extensionsUsed[h],d=r.extensionsRequired||[];switch(u){case ze.KHR_MATERIALS_UNLIT:o[u]=new lh;break;case ze.KHR_DRACO_MESH_COMPRESSION:o[u]=new Ah(r,this.dracoLoader);break;case ze.KHR_TEXTURE_TRANSFORM:o[u]=new Rh;break;case ze.KHR_MESH_QUANTIZATION:o[u]=new Ch;break;default:d.indexOf(u)>=0&&a[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}l.setExtensions(o),l.setPlugins(a),l.parse(n,i)}parseAsync(e,t){let n=this;return new Promise(function(i,r){n.parse(e,t,i,r)})}};function Vx(){let s={};return{get:function(e){return s[e]},add:function(e,t){s[e]=t},remove:function(e){delete s[e]},removeAll:function(){s={}}}}var ze={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"},ch=class{constructor(e){this.parser=e,this.name=ze.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let n=0,i=t.length;n<i;n++){let r=t[n];r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){let t=this.parser,n="light:"+e,i=t.cache.get(n);if(i)return i;let r=t.json,c=((r.extensions&&r.extensions[this.name]||{}).lights||[])[e],l,h=new be(16777215);c.color!==void 0&&h.setRGB(c.color[0],c.color[1],c.color[2],Pt);let u=c.range!==void 0?c.range:0;switch(c.type){case"directional":l=new Li(h),l.target.position.set(0,0,-1),l.add(l.target);break;case"point":l=new ws(h),l.distance=u;break;case"spot":l=new zo(h),l.distance=u,c.spot=c.spot||{},c.spot.innerConeAngle=c.spot.innerConeAngle!==void 0?c.spot.innerConeAngle:0,c.spot.outerConeAngle=c.spot.outerConeAngle!==void 0?c.spot.outerConeAngle:Math.PI/4,l.angle=c.spot.outerConeAngle,l.penumbra=1-c.spot.innerConeAngle/c.spot.outerConeAngle,l.target.position.set(0,0,-1),l.add(l.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+c.type)}return l.position.set(0,0,0),l.decay=2,qn(l,c),c.intensity!==void 0&&(l.intensity=c.intensity),l.name=t.createUniqueName(c.name||"light_"+e),i=Promise.resolve(l),t.cache.add(n,i),i}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){let t=this,n=this.parser,r=n.json.nodes[e],a=(r.extensions&&r.extensions[this.name]||{}).light;return a===void 0?null:this._loadLight(a).then(function(c){return n._getNodeRef(t.cache,a,c)})}},lh=class{constructor(){this.name=ze.KHR_MATERIALS_UNLIT}getMaterialType(){return qt}extendParams(e,t,n){let i=[];e.color=new be(1,1,1),e.opacity=1;let r=t.pbrMetallicRoughness;if(r){if(Array.isArray(r.baseColorFactor)){let o=r.baseColorFactor;e.color.setRGB(o[0],o[1],o[2],Pt),e.opacity=o[3]}r.baseColorTexture!==void 0&&i.push(n.assignTexture(e,"map",r.baseColorTexture,mt))}return Promise.all(i)}},hh=class{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=i.extensions[this.name].emissiveStrength;return r!==void 0&&(t.emissiveIntensity=r),Promise.resolve()}},uh=class{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:It}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];if(o.clearcoatFactor!==void 0&&(t.clearcoat=o.clearcoatFactor),o.clearcoatTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatMap",o.clearcoatTexture)),o.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=o.clearcoatRoughnessFactor),o.clearcoatRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatRoughnessMap",o.clearcoatRoughnessTexture)),o.clearcoatNormalTexture!==void 0&&(r.push(n.assignTexture(t,"clearcoatNormalMap",o.clearcoatNormalTexture)),o.clearcoatNormalTexture.scale!==void 0)){let a=o.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new ie(a,a)}return Promise.all(r)}},dh=class{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_DISPERSION}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:It}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=i.extensions[this.name];return t.dispersion=r.dispersion!==void 0?r.dispersion:0,Promise.resolve()}},fh=class{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:It}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];return o.iridescenceFactor!==void 0&&(t.iridescence=o.iridescenceFactor),o.iridescenceTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceMap",o.iridescenceTexture)),o.iridescenceIor!==void 0&&(t.iridescenceIOR=o.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),o.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=o.iridescenceThicknessMaximum),o.iridescenceThicknessTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceThicknessMap",o.iridescenceThicknessTexture)),Promise.all(r)}},ph=class{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_SHEEN}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:It}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[];t.sheenColor=new be(0,0,0),t.sheenRoughness=0,t.sheen=1;let o=i.extensions[this.name];if(o.sheenColorFactor!==void 0){let a=o.sheenColorFactor;t.sheenColor.setRGB(a[0],a[1],a[2],Pt)}return o.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=o.sheenRoughnessFactor),o.sheenColorTexture!==void 0&&r.push(n.assignTexture(t,"sheenColorMap",o.sheenColorTexture,mt)),o.sheenRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"sheenRoughnessMap",o.sheenRoughnessTexture)),Promise.all(r)}},mh=class{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:It}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];return o.transmissionFactor!==void 0&&(t.transmission=o.transmissionFactor),o.transmissionTexture!==void 0&&r.push(n.assignTexture(t,"transmissionMap",o.transmissionTexture)),Promise.all(r)}},gh=class{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_VOLUME}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:It}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];t.thickness=o.thicknessFactor!==void 0?o.thicknessFactor:0,o.thicknessTexture!==void 0&&r.push(n.assignTexture(t,"thicknessMap",o.thicknessTexture)),t.attenuationDistance=o.attenuationDistance||1/0;let a=o.attenuationColor||[1,1,1];return t.attenuationColor=new be().setRGB(a[0],a[1],a[2],Pt),Promise.all(r)}},_h=class{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_IOR}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:It}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=i.extensions[this.name];return t.ior=r.ior!==void 0?r.ior:1.5,Promise.resolve()}},yh=class{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_SPECULAR}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:It}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];t.specularIntensity=o.specularFactor!==void 0?o.specularFactor:1,o.specularTexture!==void 0&&r.push(n.assignTexture(t,"specularIntensityMap",o.specularTexture));let a=o.specularColorFactor||[1,1,1];return t.specularColor=new be().setRGB(a[0],a[1],a[2],Pt),o.specularColorTexture!==void 0&&r.push(n.assignTexture(t,"specularColorMap",o.specularColorTexture,mt)),Promise.all(r)}},xh=class{constructor(e){this.parser=e,this.name=ze.EXT_MATERIALS_BUMP}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:It}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];return t.bumpScale=o.bumpFactor!==void 0?o.bumpFactor:1,o.bumpTexture!==void 0&&r.push(n.assignTexture(t,"bumpMap",o.bumpTexture)),Promise.all(r)}},vh=class{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:It}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];return o.anisotropyStrength!==void 0&&(t.anisotropy=o.anisotropyStrength),o.anisotropyRotation!==void 0&&(t.anisotropyRotation=o.anisotropyRotation),o.anisotropyTexture!==void 0&&r.push(n.assignTexture(t,"anisotropyMap",o.anisotropyTexture)),Promise.all(r)}},Mh=class{constructor(e){this.parser=e,this.name=ze.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,n=t.json,i=n.textures[e];if(!i.extensions||!i.extensions[this.name])return null;let r=i.extensions[this.name],o=t.options.ktx2Loader;if(!o){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,r.source,o)}},bh=class{constructor(e){this.parser=e,this.name=ze.EXT_TEXTURE_WEBP,this.isSupported=null}loadTexture(e){let t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;let o=r.extensions[t],a=i.images[o.source],c=n.textureLoader;if(a.uri){let l=n.options.manager.getHandler(a.uri);l!==null&&(c=l)}return this.detectSupport().then(function(l){if(l)return n.loadTextureImage(e,o.source,c);if(i.extensionsRequired&&i.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");return n.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){let t=new Image;t.src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}},Sh=class{constructor(e){this.parser=e,this.name=ze.EXT_TEXTURE_AVIF,this.isSupported=null}loadTexture(e){let t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;let o=r.extensions[t],a=i.images[o.source],c=n.textureLoader;if(a.uri){let l=n.options.manager.getHandler(a.uri);l!==null&&(c=l)}return this.detectSupport().then(function(l){if(l)return n.loadTextureImage(e,o.source,c);if(i.extensionsRequired&&i.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");return n.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){let t=new Image;t.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}},Th=class{constructor(e){this.name=ze.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){let t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){let i=n.extensions[this.name],r=this.parser.getDependency("buffer",i.buffer),o=this.parser.options.meshoptDecoder;if(!o||!o.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return r.then(function(a){let c=i.byteOffset||0,l=i.byteLength||0,h=i.count,u=i.byteStride,d=new Uint8Array(a,c,l);return o.decodeGltfBufferAsync?o.decodeGltfBufferAsync(h,u,d,i.mode,i.filter).then(function(f){return f.buffer}):o.ready.then(function(){let f=new ArrayBuffer(h*u);return o.decodeGltfBuffer(new Uint8Array(f),h,u,d,i.mode,i.filter),f})})}else return null}},wh=class{constructor(e){this.name=ze.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;let i=t.meshes[n.mesh];for(let l of i.primitives)if(l.mode!==fn.TRIANGLES&&l.mode!==fn.TRIANGLE_STRIP&&l.mode!==fn.TRIANGLE_FAN&&l.mode!==void 0)return null;let o=n.extensions[this.name].attributes,a=[],c={};for(let l in o)a.push(this.parser.getDependency("accessor",o[l]).then(h=>(c[l]=h,c[l])));return a.length<1?null:(a.push(this.parser.createNodeMesh(e)),Promise.all(a).then(l=>{let h=l.pop(),u=h.isGroup?h.children:[h],d=l[0].count,f=[];for(let m of u){let _=new Te,p=new E,g=new lt,M=new E(1,1,1),x=new vo(m.geometry,m.material,d);for(let y=0;y<d;y++)c.TRANSLATION&&p.fromBufferAttribute(c.TRANSLATION,y),c.ROTATION&&g.fromBufferAttribute(c.ROTATION,y),c.SCALE&&M.fromBufferAttribute(c.SCALE,y),x.setMatrixAt(y,_.compose(p,g,M));for(let y in c)if(y==="_COLOR_0"){let A=c[y];x.instanceColor=new Ii(A.array,A.itemSize,A.normalized)}else y!=="TRANSLATION"&&y!=="ROTATION"&&y!=="SCALE"&&m.geometry.setAttribute(y,c[y]);ft.prototype.copy.call(x,m),this.parser.assignFinalMaterial(x),f.push(x)}return h.isGroup?(h.clear(),h.add(...f),h):f[0]}))}},lf="glTF",yr=12,rf={JSON:1313821514,BIN:5130562},Eh=class{constructor(e){this.name=ze.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,yr),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==lf)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");let i=this.header.length-yr,r=new DataView(e,yr),o=0;for(;o<i;){let a=r.getUint32(o,!0);o+=4;let c=r.getUint32(o,!0);if(o+=4,c===rf.JSON){let l=new Uint8Array(e,yr+o,a);this.content=n.decode(l)}else if(c===rf.BIN){let l=yr+o;this.body=e.slice(l,l+a)}o+=a}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}},Ah=class{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=ze.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let n=this.json,i=this.dracoLoader,r=e.extensions[this.name].bufferView,o=e.extensions[this.name].attributes,a={},c={},l={};for(let h in o){let u=Ph[h]||h.toLowerCase();a[u]=o[h]}for(let h in e.attributes){let u=Ph[h]||h.toLowerCase();if(o[h]!==void 0){let d=n.accessors[e.attributes[h]],f=Is[d.componentType];l[u]=f.name,c[u]=d.normalized===!0}}return t.getDependency("bufferView",r).then(function(h){return new Promise(function(u,d){i.decodeDracoFile(h,function(f){for(let m in f.attributes){let _=f.attributes[m],p=c[m];p!==void 0&&(_.normalized=p)}u(f)},a,l,Pt,d)})})}},Rh=class{constructor(){this.name=ze.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}},Ch=class{constructor(){this.name=ze.KHR_MESH_QUANTIZATION}},ia=class extends li{constructor(e,t,n,i){super(e,t,n,i)}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i*3+i;for(let o=0;o!==i;o++)t[o]=n[r+o];return t}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=a*2,l=a*3,h=i-t,u=(n-t)/h,d=u*u,f=d*u,m=e*l,_=m-l,p=-2*f+3*d,g=f-d,M=1-p,x=g-d+u;for(let y=0;y!==a;y++){let A=o[_+y+a],w=o[_+y+c]*h,R=o[m+y+a],I=o[m+y]*h;r[y]=M*A+x*w+p*R+g*I}return r}},Gx=new lt,Ih=class extends ia{interpolate_(e,t,n,i){let r=super.interpolate_(e,t,n,i);return Gx.fromArray(r).normalize().toArray(r),r}},fn={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},Is={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},of={9728:Ct,9729:Rt,9984:ur,9985:Ai,9986:ti,9987:Xt},af={33071:Mn,33648:Ri,10497:Sn},rh={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Ph={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},mi={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},Wx={CUBICSPLINE:void 0,LINEAR:oi,STEP:ri},oh={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function Xx(s){return s.DefaultMaterial===void 0&&(s.DefaultMaterial=new wt({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Cn})),s.DefaultMaterial}function Oi(s,e,t){for(let n in t.extensions)s[n]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[n]=t.extensions[n])}function qn(s,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(s.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function Yx(s,e,t){let n=!1,i=!1,r=!1;for(let l=0,h=e.length;l<h;l++){let u=e[l];if(u.POSITION!==void 0&&(n=!0),u.NORMAL!==void 0&&(i=!0),u.COLOR_0!==void 0&&(r=!0),n&&i&&r)break}if(!n&&!i&&!r)return Promise.resolve(s);let o=[],a=[],c=[];for(let l=0,h=e.length;l<h;l++){let u=e[l];if(n){let d=u.POSITION!==void 0?t.getDependency("accessor",u.POSITION):s.attributes.position;o.push(d)}if(i){let d=u.NORMAL!==void 0?t.getDependency("accessor",u.NORMAL):s.attributes.normal;a.push(d)}if(r){let d=u.COLOR_0!==void 0?t.getDependency("accessor",u.COLOR_0):s.attributes.color;c.push(d)}}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(c)]).then(function(l){let h=l[0],u=l[1],d=l[2];return n&&(s.morphAttributes.position=h),i&&(s.morphAttributes.normal=u),r&&(s.morphAttributes.color=d),s.morphTargetsRelative=!0,s})}function qx(s,e){if(s.updateMorphTargets(),e.weights!==void 0)for(let t=0,n=e.weights.length;t<n;t++)s.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){let t=e.extras.targetNames;if(s.morphTargetInfluences.length===t.length){s.morphTargetDictionary={};for(let n=0,i=t.length;n<i;n++)s.morphTargetDictionary[t[n]]=n}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function Kx(s){let e,t=s.extensions&&s.extensions[ze.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+ah(t.attributes):e=s.indices+":"+ah(s.attributes)+":"+s.mode,s.targets!==void 0)for(let n=0,i=s.targets.length;n<i;n++)e+=":"+ah(s.targets[n]);return e}function ah(s){let e="",t=Object.keys(s).sort();for(let n=0,i=t.length;n<i;n++)e+=t[n]+":"+s[t[n]]+";";return e}function Lh(s){switch(s){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function Zx(s){return s.search(/\.jpe?g($|\?)/i)>0||s.search(/^data\:image\/jpeg/)===0?"image/jpeg":s.search(/\.webp($|\?)/i)>0||s.search(/^data\:image\/webp/)===0?"image/webp":"image/png"}var Jx=new Te,Dh=class{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new Vx,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,i=-1,r=!1,o=-1;if(typeof navigator<"u"){let a=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(a)===!0;let c=a.match(/Version\/(\d+)/);i=n&&c?parseInt(c[1],10):-1,r=a.indexOf("Firefox")>-1,o=r?a.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||n&&i<17||r&&o<98?this.textureLoader=new Fo(this.options.manager):this.textureLoader=new ko(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new cr(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let n=this,i=this.json,r=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(o){return o._markDefs&&o._markDefs()}),Promise.all(this._invokeAll(function(o){return o.beforeRoot&&o.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(o){let a={scene:o[0][i.scene||0],scenes:o[0],animations:o[1],cameras:o[2],asset:i.asset,parser:n,userData:{}};return Oi(r,a,i),qn(a,i),Promise.all(n._invokeAll(function(c){return c.afterRoot&&c.afterRoot(a)})).then(function(){for(let c of a.scenes)c.updateMatrixWorld();e(a)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let i=0,r=t.length;i<r;i++){let o=t[i].joints;for(let a=0,c=o.length;a<c;a++)e[o[a]].isBone=!0}for(let i=0,r=e.length;i<r;i++){let o=e[i];o.mesh!==void 0&&(this._addNodeRef(this.meshCache,o.mesh),o.skin!==void 0&&(n[o.mesh].isSkinnedMesh=!0)),o.camera!==void 0&&this._addNodeRef(this.cameraCache,o.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;let i=n.clone(),r=(o,a)=>{let c=this.associations.get(o);c!=null&&this.associations.set(a,c);for(let[l,h]of o.children.entries())r(h,a.children[l])};return r(n,i),i.name+="_instance_"+e.uses[t]++,i}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){let i=e(t[n]);if(i)return i}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let n=[];for(let i=0;i<t.length;i++){let r=e(t[i]);r&&n.push(r)}return n}getDependency(e,t){let n=e+":"+t,i=this.cache.get(n);if(!i){switch(e){case"scene":i=this.loadScene(t);break;case"node":i=this._invokeOne(function(r){return r.loadNode&&r.loadNode(t)});break;case"mesh":i=this._invokeOne(function(r){return r.loadMesh&&r.loadMesh(t)});break;case"accessor":i=this.loadAccessor(t);break;case"bufferView":i=this._invokeOne(function(r){return r.loadBufferView&&r.loadBufferView(t)});break;case"buffer":i=this.loadBuffer(t);break;case"material":i=this._invokeOne(function(r){return r.loadMaterial&&r.loadMaterial(t)});break;case"texture":i=this._invokeOne(function(r){return r.loadTexture&&r.loadTexture(t)});break;case"skin":i=this.loadSkin(t);break;case"animation":i=this._invokeOne(function(r){return r.loadAnimation&&r.loadAnimation(t)});break;case"camera":i=this.loadCamera(t);break;default:if(i=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)}),!i)throw new Error("Unknown type: "+e);break}this.cache.add(n,i)}return i}getDependencies(e){let t=this.cache.get(e);if(!t){let n=this,i=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(i.map(function(r,o){return n.getDependency(e,o)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[ze.KHR_BINARY_GLTF].body);let i=this.options;return new Promise(function(r,o){n.load(fi.resolveURL(t.uri,i.path),r,void 0,function(){o(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(n){let i=t.byteLength||0,r=t.byteOffset||0;return n.slice(r,r+i)})}loadAccessor(e){let t=this,n=this.json,i=this.json.accessors[e];if(i.bufferView===void 0&&i.sparse===void 0){let o=rh[i.type],a=Is[i.componentType],c=i.normalized===!0,l=new a(i.count*o);return Promise.resolve(new ke(l,o,c))}let r=[];return i.bufferView!==void 0?r.push(this.getDependency("bufferView",i.bufferView)):r.push(null),i.sparse!==void 0&&(r.push(this.getDependency("bufferView",i.sparse.indices.bufferView)),r.push(this.getDependency("bufferView",i.sparse.values.bufferView))),Promise.all(r).then(function(o){let a=o[0],c=rh[i.type],l=Is[i.componentType],h=l.BYTES_PER_ELEMENT,u=h*c,d=i.byteOffset||0,f=i.bufferView!==void 0?n.bufferViews[i.bufferView].byteStride:void 0,m=i.normalized===!0,_,p;if(f&&f!==u){let g=Math.floor(d/f),M="InterleavedBuffer:"+i.bufferView+":"+i.componentType+":"+g+":"+i.count,x=t.cache.get(M);x||(_=new l(a,g*f,i.count*f/h),x=new Js(_,f/h),t.cache.add(M,x)),p=new js(x,c,d%f/h,m)}else a===null?_=new l(i.count*c):_=new l(a,d,i.count*c),p=new ke(_,c,m);if(i.sparse!==void 0){let g=rh.SCALAR,M=Is[i.sparse.indices.componentType],x=i.sparse.indices.byteOffset||0,y=i.sparse.values.byteOffset||0,A=new M(o[1],x,i.sparse.count*g),w=new l(o[2],y,i.sparse.count*c);a!==null&&(p=new ke(p.array.slice(),p.itemSize,p.normalized)),p.normalized=!1;for(let R=0,I=A.length;R<I;R++){let N=A[R];if(p.setX(N,w[R*c]),c>=2&&p.setY(N,w[R*c+1]),c>=3&&p.setZ(N,w[R*c+2]),c>=4&&p.setW(N,w[R*c+3]),c>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}p.normalized=m}return p})}loadTexture(e){let t=this.json,n=this.options,r=t.textures[e].source,o=t.images[r],a=this.textureLoader;if(o.uri){let c=n.manager.getHandler(o.uri);c!==null&&(a=c)}return this.loadTextureImage(e,r,a)}loadTextureImage(e,t,n){let i=this,r=this.json,o=r.textures[e],a=r.images[t],c=(a.uri||a.bufferView)+":"+o.sampler;if(this.textureCache[c])return this.textureCache[c];let l=this.loadImageSource(t,n).then(function(h){h.flipY=!1,h.name=o.name||a.name||"",h.name===""&&typeof a.uri=="string"&&a.uri.startsWith("data:image/")===!1&&(h.name=a.uri);let d=(r.samplers||{})[o.sampler]||{};return h.magFilter=of[d.magFilter]||Rt,h.minFilter=of[d.minFilter]||Xt,h.wrapS=af[d.wrapS]||Sn,h.wrapT=af[d.wrapT]||Sn,i.associations.set(h,{textures:e}),h}).catch(function(){return null});return this.textureCache[c]=l,l}loadImageSource(e,t){let n=this,i=this.json,r=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(u=>u.clone());let o=i.images[e],a=self.URL||self.webkitURL,c=o.uri||"",l=!1;if(o.bufferView!==void 0)c=n.getDependency("bufferView",o.bufferView).then(function(u){l=!0;let d=new Blob([u],{type:o.mimeType});return c=a.createObjectURL(d),c});else if(o.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let h=Promise.resolve(c).then(function(u){return new Promise(function(d,f){let m=d;t.isImageBitmapLoader===!0&&(m=function(_){let p=new bt(_);p.needsUpdate=!0,d(p)}),t.load(fi.resolveURL(u,r.path),m,void 0,f)})}).then(function(u){return l===!0&&a.revokeObjectURL(c),qn(u,o),u.userData.mimeType=o.mimeType||Zx(o.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",c),u});return this.sourceCache[e]=h,h}assignTexture(e,t,n,i){let r=this;return this.getDependency("texture",n.index).then(function(o){if(!o)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(o=o.clone(),o.channel=n.texCoord),r.extensions[ze.KHR_TEXTURE_TRANSFORM]){let a=n.extensions!==void 0?n.extensions[ze.KHR_TEXTURE_TRANSFORM]:void 0;if(a){let c=r.associations.get(o);o=r.extensions[ze.KHR_TEXTURE_TRANSFORM].extendTexture(o,a),r.associations.set(o,c)}}return i!==void 0&&(o.colorSpace=i),e[t]=o,o})}assignFinalMaterial(e){let t=e.geometry,n=e.material,i=t.attributes.tangent===void 0,r=t.attributes.color!==void 0,o=t.attributes.normal===void 0;if(e.isPoints){let a="PointsMaterial:"+n.uuid,c=this.cache.get(a);c||(c=new er,tn.prototype.copy.call(c,n),c.color.copy(n.color),c.map=n.map,c.sizeAttenuation=!1,this.cache.add(a,c)),n=c}else if(e.isLine){let a="LineBasicMaterial:"+n.uuid,c=this.cache.get(a);c||(c=new Qs,tn.prototype.copy.call(c,n),c.color.copy(n.color),c.map=n.map,this.cache.add(a,c)),n=c}if(i||r||o){let a="ClonedMaterial:"+n.uuid+":";i&&(a+="derivative-tangents:"),r&&(a+="vertex-colors:"),o&&(a+="flat-shading:");let c=this.cache.get(a);c||(c=n.clone(),r&&(c.vertexColors=!0),o&&(c.flatShading=!0),i&&(c.normalScale&&(c.normalScale.y*=-1),c.clearcoatNormalScale&&(c.clearcoatNormalScale.y*=-1)),this.cache.add(a,c),this.associations.set(c,this.associations.get(n))),n=c}e.material=n}getMaterialType(){return wt}loadMaterial(e){let t=this,n=this.json,i=this.extensions,r=n.materials[e],o,a={},c=r.extensions||{},l=[];if(c[ze.KHR_MATERIALS_UNLIT]){let u=i[ze.KHR_MATERIALS_UNLIT];o=u.getMaterialType(),l.push(u.extendParams(a,r,t))}else{let u=r.pbrMetallicRoughness||{};if(a.color=new be(1,1,1),a.opacity=1,Array.isArray(u.baseColorFactor)){let d=u.baseColorFactor;a.color.setRGB(d[0],d[1],d[2],Pt),a.opacity=d[3]}u.baseColorTexture!==void 0&&l.push(t.assignTexture(a,"map",u.baseColorTexture,mt)),a.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,a.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(l.push(t.assignTexture(a,"metalnessMap",u.metallicRoughnessTexture)),l.push(t.assignTexture(a,"roughnessMap",u.metallicRoughnessTexture))),o=this._invokeOne(function(d){return d.getMaterialType&&d.getMaterialType(e)}),l.push(Promise.all(this._invokeAll(function(d){return d.extendMaterialParams&&d.extendMaterialParams(e,a)})))}r.doubleSided===!0&&(a.side=kt);let h=r.alphaMode||oh.OPAQUE;if(h===oh.BLEND?(a.transparent=!0,a.depthWrite=!1):(a.transparent=!1,h===oh.MASK&&(a.alphaTest=r.alphaCutoff!==void 0?r.alphaCutoff:.5)),r.normalTexture!==void 0&&o!==qt&&(l.push(t.assignTexture(a,"normalMap",r.normalTexture)),a.normalScale=new ie(1,1),r.normalTexture.scale!==void 0)){let u=r.normalTexture.scale;a.normalScale.set(u,u)}if(r.occlusionTexture!==void 0&&o!==qt&&(l.push(t.assignTexture(a,"aoMap",r.occlusionTexture)),r.occlusionTexture.strength!==void 0&&(a.aoMapIntensity=r.occlusionTexture.strength)),r.emissiveFactor!==void 0&&o!==qt){let u=r.emissiveFactor;a.emissive=new be().setRGB(u[0],u[1],u[2],Pt)}return r.emissiveTexture!==void 0&&o!==qt&&l.push(t.assignTexture(a,"emissiveMap",r.emissiveTexture,mt)),Promise.all(l).then(function(){let u=new o(a);return r.name&&(u.name=r.name),qn(u,r),t.associations.set(u,{materials:e}),r.extensions&&Oi(i,u,r),u})}createUniqueName(e){let t=Ze.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){let t=this,n=this.extensions,i=this.primitiveCache;function r(a){return n[ze.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(a,t).then(function(c){return cf(c,a,t)})}let o=[];for(let a=0,c=e.length;a<c;a++){let l=e[a],h=Kx(l),u=i[h];if(u)o.push(u.promise);else{let d;l.extensions&&l.extensions[ze.KHR_DRACO_MESH_COMPRESSION]?d=r(l):d=cf(new ht,l,t),i[h]={primitive:l,promise:d},o.push(d)}}return Promise.all(o)}loadMesh(e){let t=this,n=this.json,i=this.extensions,r=n.meshes[e],o=r.primitives,a=[];for(let c=0,l=o.length;c<l;c++){let h=o[c].material===void 0?Xx(this.cache):this.getDependency("material",o[c].material);a.push(h)}return a.push(t.loadGeometries(o)),Promise.all(a).then(function(c){let l=c.slice(0,c.length-1),h=c[c.length-1],u=[];for(let f=0,m=h.length;f<m;f++){let _=h[f],p=o[f],g,M=l[f];if(p.mode===fn.TRIANGLES||p.mode===fn.TRIANGLE_STRIP||p.mode===fn.TRIANGLE_FAN||p.mode===void 0)g=r.isSkinnedMesh===!0?new yo(_,M):new ye(_,M),g.isSkinnedMesh===!0&&g.normalizeSkinWeights(),p.mode===fn.TRIANGLE_STRIP?g.geometry=eh(g.geometry,Xo):p.mode===fn.TRIANGLE_FAN&&(g.geometry=eh(g.geometry,fr));else if(p.mode===fn.LINES)g=new So(_,M);else if(p.mode===fn.LINE_STRIP)g=new vs(_,M);else if(p.mode===fn.LINE_LOOP)g=new To(_,M);else if(p.mode===fn.POINTS)g=new wo(_,M);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+p.mode);Object.keys(g.geometry.morphAttributes).length>0&&qx(g,r),g.name=t.createUniqueName(r.name||"mesh_"+e),qn(g,r),p.extensions&&Oi(i,g,p),t.assignFinalMaterial(g),u.push(g)}for(let f=0,m=u.length;f<m;f++)t.associations.set(u[f],{meshes:e,primitives:f});if(u.length===1)return r.extensions&&Oi(i,u[0],r),u[0];let d=new it;r.extensions&&Oi(i,d,r),t.associations.set(d,{meshes:e});for(let f=0,m=u.length;f<m;f++)d.add(u[f]);return d})}loadCamera(e){let t,n=this.json.cameras[e],i=n[n.type];if(!i){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return n.type==="perspective"?t=new _t(vt.radToDeg(i.yfov),i.aspectRatio||1,i.znear||1,i.zfar||2e6):n.type==="orthographic"&&(t=new gs(-i.xmag,i.xmag,i.ymag,-i.ymag,i.znear,i.zfar)),n.name&&(t.name=this.createUniqueName(n.name)),qn(t,n),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],n=[];for(let i=0,r=t.joints.length;i<r;i++)n.push(this._loadNodeShallow(t.joints[i]));return t.inverseBindMatrices!==void 0?n.push(this.getDependency("accessor",t.inverseBindMatrices)):n.push(null),Promise.all(n).then(function(i){let r=i.pop(),o=i,a=[],c=[];for(let l=0,h=o.length;l<h;l++){let u=o[l];if(u){a.push(u);let d=new Te;r!==null&&d.fromArray(r.array,l*16),c.push(d)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[l])}return new xo(a,c)})}loadAnimation(e){let t=this.json,n=this,i=t.animations[e],r=i.name?i.name:"animation_"+e,o=[],a=[],c=[],l=[],h=[];for(let u=0,d=i.channels.length;u<d;u++){let f=i.channels[u],m=i.samplers[f.sampler],_=f.target,p=_.node,g=i.parameters!==void 0?i.parameters[m.input]:m.input,M=i.parameters!==void 0?i.parameters[m.output]:m.output;_.node!==void 0&&(o.push(this.getDependency("node",p)),a.push(this.getDependency("accessor",g)),c.push(this.getDependency("accessor",M)),l.push(m),h.push(_))}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(c),Promise.all(l),Promise.all(h)]).then(function(u){let d=u[0],f=u[1],m=u[2],_=u[3],p=u[4],g=[];for(let M=0,x=d.length;M<x;M++){let y=d[M],A=f[M],w=m[M],R=_[M],I=p[M];if(y===void 0)continue;y.updateMatrix&&y.updateMatrix();let N=n._createAnimationTracks(y,A,w,R,I);if(N)for(let v=0;v<N.length;v++)g.push(N[v])}return new di(r,void 0,g)})}createNodeMesh(e){let t=this.json,n=this,i=t.nodes[e];return i.mesh===void 0?null:n.getDependency("mesh",i.mesh).then(function(r){let o=n._getNodeRef(n.meshCache,i.mesh,r);return i.weights!==void 0&&o.traverse(function(a){if(a.isMesh)for(let c=0,l=i.weights.length;c<l;c++)a.morphTargetInfluences[c]=i.weights[c]}),o})}loadNode(e){let t=this.json,n=this,i=t.nodes[e],r=n._loadNodeShallow(e),o=[],a=i.children||[];for(let l=0,h=a.length;l<h;l++)o.push(n.getDependency("node",a[l]));let c=i.skin===void 0?Promise.resolve(null):n.getDependency("skin",i.skin);return Promise.all([r,Promise.all(o),c]).then(function(l){let h=l[0],u=l[1],d=l[2];d!==null&&h.traverse(function(f){f.isSkinnedMesh&&f.bind(d,Jx)});for(let f=0,m=u.length;f<m;f++)h.add(u[f]);return h})}_loadNodeShallow(e){let t=this.json,n=this.extensions,i=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let r=t.nodes[e],o=r.name?i.createUniqueName(r.name):"",a=[],c=i._invokeOne(function(l){return l.createNodeMesh&&l.createNodeMesh(e)});return c&&a.push(c),r.camera!==void 0&&a.push(i.getDependency("camera",r.camera).then(function(l){return i._getNodeRef(i.cameraCache,r.camera,l)})),i._invokeAll(function(l){return l.createNodeAttachment&&l.createNodeAttachment(e)}).forEach(function(l){a.push(l)}),this.nodeCache[e]=Promise.all(a).then(function(l){let h;if(r.isBone===!0?h=new $s:l.length>1?h=new it:l.length===1?h=l[0]:h=new ft,h!==l[0])for(let u=0,d=l.length;u<d;u++)h.add(l[u]);if(r.name&&(h.userData.name=r.name,h.name=o),qn(h,r),r.extensions&&Oi(n,h,r),r.matrix!==void 0){let u=new Te;u.fromArray(r.matrix),h.applyMatrix4(u)}else r.translation!==void 0&&h.position.fromArray(r.translation),r.rotation!==void 0&&h.quaternion.fromArray(r.rotation),r.scale!==void 0&&h.scale.fromArray(r.scale);return i.associations.has(h)||i.associations.set(h,{}),i.associations.get(h).nodes=e,h}),this.nodeCache[e]}loadScene(e){let t=this.extensions,n=this.json.scenes[e],i=this,r=new it;n.name&&(r.name=i.createUniqueName(n.name)),qn(r,n),n.extensions&&Oi(t,r,n);let o=n.nodes||[],a=[];for(let c=0,l=o.length;c<l;c++)a.push(i.getDependency("node",o[c]));return Promise.all(a).then(function(c){for(let h=0,u=c.length;h<u;h++)r.add(c[h]);let l=h=>{let u=new Map;for(let[d,f]of i.associations)(d instanceof tn||d instanceof bt)&&u.set(d,f);return h.traverse(d=>{let f=i.associations.get(d);f!=null&&u.set(d,f)}),u};return i.associations=l(r),r})}_createAnimationTracks(e,t,n,i,r){let o=[],a=e.name?e.name:e.uuid,c=[];mi[r.path]===mi.weights?e.traverse(function(d){d.morphTargetInfluences&&c.push(d.name?d.name:d.uuid)}):c.push(a);let l;switch(mi[r.path]){case mi.weights:l=Wn;break;case mi.rotation:l=wn;break;case mi.position:case mi.scale:l=nn;break;default:n.itemSize===1?l=Wn:l=nn;break}let h=i.interpolation!==void 0?Wx[i.interpolation]:oi,u=this._getArrayFromAccessor(n);for(let d=0,f=c.length;d<f;d++){let m=new l(c[d]+"."+mi[r.path],t.array,u,h);i.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(m),o.push(m)}return o}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let n=Lh(t.constructor),i=new Float32Array(t.length);for(let r=0,o=t.length;r<o;r++)i[r]=t[r]*n;t=i}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(n){let i=this instanceof wn?Ih:ia;return new i(this.times,this.values,this.getValueSize()/3,n)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}};function jx(s,e,t){let n=e.attributes,i=new Yt;if(n.POSITION!==void 0){let a=t.json.accessors[n.POSITION],c=a.min,l=a.max;if(c!==void 0&&l!==void 0){if(i.set(new E(c[0],c[1],c[2]),new E(l[0],l[1],l[2])),a.normalized){let h=Lh(Is[a.componentType]);i.min.multiplyScalar(h),i.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let r=e.targets;if(r!==void 0){let a=new E,c=new E;for(let l=0,h=r.length;l<h;l++){let u=r[l];if(u.POSITION!==void 0){let d=t.json.accessors[u.POSITION],f=d.min,m=d.max;if(f!==void 0&&m!==void 0){if(c.setX(Math.max(Math.abs(f[0]),Math.abs(m[0]))),c.setY(Math.max(Math.abs(f[1]),Math.abs(m[1]))),c.setZ(Math.max(Math.abs(f[2]),Math.abs(m[2]))),d.normalized){let _=Lh(Is[d.componentType]);c.multiplyScalar(_)}a.max(c)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}i.expandByVector(a)}s.boundingBox=i;let o=new en;i.getCenter(o.center),o.radius=i.min.distanceTo(i.max)/2,s.boundingSphere=o}function cf(s,e,t){let n=e.attributes,i=[];function r(o,a){return t.getDependency("accessor",o).then(function(c){s.setAttribute(a,c)})}for(let o in n){let a=Ph[o]||o.toLowerCase();a in s.attributes||i.push(r(n[o],a))}if(e.indices!==void 0&&!s.index){let o=t.getDependency("accessor",e.indices).then(function(a){s.setIndex(a)});i.push(o)}return Ye.workingColorSpace!==Pt&&"COLOR_0"in n&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${Ye.workingColorSpace}" not supported.`),qn(s,e),jx(s,e,t),Promise.all(i).then(function(){return e.targets!==void 0?Yx(s,e.targets,t):s})}function hf(s,e,t){let n=s.userData.basePosition,i=s.userData.baseScale;if(!(!n||!i)&&(s.position.copy(n),s.scale.copy(i),(s.name.startsWith("Silky_collar")||s.name.startsWith("Silky collar"))&&(s.scale.x*=1+.2*(t.fur-1),s.scale.z*=1+.2*(t.fur-1),s.scale.y*=t.fur,s.position.y+=1.5175*(1-t.fur)),e==="eye"&&/Iris|Pupil|Glint|glint/.test(s.name))){let r=t.iris*(s.name==="Pupil"?t.pupilSize:1);s.scale.x*=r,s.scale.y*=r,s.position.x=n.x*r+.04*(1-r),s.position.y=n.y*r+2.1475*(1-r)}}var sa=new Map;function $x(s){return sa.has(s)||sa.set(s,fetch(s).then(e=>{if(!e.ok)throw Error("Creature model is unavailable.");return e.arrayBuffer()}).catch(e=>{throw sa.delete(s),e})),sa.get(s)}async function uf(s,e){let t=new na,[n,i,r]=await Promise.all(["myr5","anatomy","hands-v2"].map(async M=>t.parseAsync(await $x(e+"models/"+M+".glb"),e+"models/"))),o=new it,a=new it;a.name="Style ornaments",o.add(a);let c=[],l={};for(let M of Yn){let x=n.scene.getObjectByName(M);if(!x)throw Error("A creature section could not load.");let y=new it;y.name=M,o.add(y),y.add(x),l[M]=y,y.traverse(A=>{if(A instanceof ye){M==="eye"&&Xd(A),A.userData.region=M,A.userData.basePosition=A.position.clone(),A.userData.baseScale=A.scale.clone(),A.material=A.material.clone();let w=A.material;w.userData={baseColor:w.color.clone(),baseRough:w.roughness,baseMetal:w.metalness,name:w.name},c.push(w)}})}let h=new ye(new Dt(.619,48,24,0,Math.PI*2,0,.57),new wt({color:rn[0].primary,roughness:.58}));h.position.set(0,2.1575,.55),h.name="Expression eyelid",h.userData.region="eye";let u=l.eye.children[0];u.add(h);let d=new Map;d.set("head_single",l.head.children[0]),d.set("original_arms",l.arms.children[0]),d.set("original_feet",l.feet.children[0]);for(let M of[...i.scene.children].filter(x=>!x.name.startsWith("arms_")).concat([...r.scene.children])){let x=M.name.split("_")[0];M.traverse(y=>{if(y instanceof ye){y.userData.region=x,y.userData.basePosition=y.position.clone(),y.userData.baseScale=y.scale.clone(),y.material=y.material.clone();let A=y.material;A.userData={baseColor:A.color.clone(),baseRough:A.roughness,baseMetal:A.metalness,name:A.name}}}),M.removeFromParent(),d.set(M.name,M)}let f={root:o,regions:l,details:a,lid:h,materials:c,variants:d,eyeTemplate:u,eyeCopies:null},m=!1,_=!1;f.eyeCopies&&(f.regions.eye.remove(f.eyeCopies),f.eyeCopies=null),f.eyeTemplate.visible=!0;for(let[M,x]of[["head","head_"+s.eyeLayout],["arms","arms_"+s.fingers],["feet","feet_"+s.toes]]){let y=f.variants.get(x);y&&f.regions[M].children[0]!==y&&(f.regions[M].clear(),f.regions[M].add(y)),M==="head"&&y?.traverse(A=>{A.userData.eyeSockets=En[s.eyeLayout].eyes})}for(let M of Yn){let x=rn[s.styles[M]],y=f.regions[M];if(y.position.set(0,0,0),_){let A={head:[0,.65,0],eye:[0,.18,1],collar:[0,-.1,0],body:[0,-.45,0],arms:[.45,0,0],feet:[0,-.65,0]};y.position.fromArray(A[M])}y.traverse(A=>{if(!(A instanceof ye)||A===f.lid)return;let w=A.material,R=w.userData.baseColor,I=w.userData.name,N=["Eye ivory","Pupil","Eye glint"].includes(I);if(w.color.copy(R),w.emissive.set(0),w.metalness=w.userData.baseMetal,w.roughness=w.userData.baseRough,w.transparent=!1,w.opacity=1,w.depthWrite=!0,s.styles[M]!==0&&!N&&(w.color.set(I==="Lilac hair"||I==="Raised scales"?x.accent:x.primary),(I==="Socket shadow"||I==="Body velvet")&&w.color.multiplyScalar(.43),w.roughness=x.roughness,w.metalness=x.metalness,w.emissive.set(x.emissive).multiplyScalar(.25)),m&&(w.color.set(N&&I==="Pupil"?"#261336":"#c9b0ea"),w.emissive.set("#76518f"),w.emissiveIntensity=.55,w.roughness=.25,w.metalness=.1),A.name==="Pupil"&&A.userData.pupilType!==s.pupil&&(A.geometry.dispose(),A.geometry=Ql(s.pupil),A.userData.basePosition=new E(.04,2.1475,1.183),A.userData.baseScale=new E(1,1,1),A.userData.pupilType=s.pupil),A.name==="Iris"&&A.userData.irisType!==s.pupil&&(A.geometry.dispose(),A.geometry=Ql(s.pupil),A.geometry.scale(1.48,1.48,1),A.userData.basePosition=new E(.04,2.1475,1.133),A.userData.baseScale=new E(1,1,1),A.userData.irisType=s.pupil),/^Iris.fiber/.test(A.name)&&(A.visible=s.pupil==="round"),/^Crown.scale/.test(A.name)&&(A.visible=s.styles[M]===0),hf(A,M,s),M==="eye"?Yd(A):A.visible&&x.id!==0&&gr(A,x,1,s.detail),A.name==="Iris"){let v=A.geometry.attributes.position,S=new Float32Array(v.count*3);for(let F=0;F<v.count;F++){let B=Math.atan2(v.getY(F),v.getX(F)),G=Math.hypot(v.getX(F),v.getY(F)),Y=.78+.16*Math.sin(B*117+G*35)+.06*Math.cos(B*61);S[F*3]=Y,S[F*3+1]=Y,S[F*3+2]=Math.min(1,Y+.07)}A.geometry.setAttribute("color",new ke(S,3)),w.vertexColors=!0,w.needsUpdate=!0}})}let p=s.eye==="sleepy"?1.56:s.eye==="wide"?.3:.57;f.lid.geometry.dispose(),f.lid.geometry=new Dt(.619,48,24,0,Math.PI*2,0,p),f.lid.material.color.set(m?"#c9b0ea":rn[s.styles.head].primary),s.eyeLayout!=="single"&&(f.eyeCopies=qd(f.eyeTemplate,s.eyeLayout),f.regions.eye.add(f.eyeCopies),f.eyeTemplate.visible=!1);let g=JSON.stringify([s.styles,s.detail,s.eyeLayout,s.fingers,s.toes,m,_]);f.details.userData.key=g,f.details.children.slice().forEach(M=>{M.traverse(x=>{x instanceof ye&&(x.geometry.dispose(),x.material.dispose())}),f.details.remove(M)});for(let M of Yn){let x=rn[s.styles[M]],y=f.regions[M];if(x.id===7&&M!=="head"&&M!=="eye"){y.visible=!1,f.details.add(tf(M,s));continue}if(x.id===18&&["body","arms","feet"].includes(M)){y.visible=!1,f.details.add(sf(M,s));continue}let A=y;M==="collar"&&x.id!==0&&x.id!==20&&(y.visible=!1,A=nf(x.id),f.details.add(A)),f.details.add($d(A,x,M,1,s.detail))}return s.styles.head===7&&(f.regions.eye.visible=!1,f.details.add(ef(s))),o.userData.recipe=JSON.parse(JSON.stringify(s)),{root:o,dispose(){let M=new Set,x=new Set;for(let y of[o,...d.values(),n.scene,i.scene,r.scene])y.traverse(A=>{if(A instanceof ye){M.add(A.geometry);for(let w of Array.isArray(A.material)?A.material:[A.material])x.add(w)}});M.forEach(y=>y.dispose()),x.forEach(y=>y.dispose())}}}function Nh(s){let e=new Set,t=new Set;s.traverse(n=>{if(n instanceof ye){e.add(n.geometry);for(let i of Array.isArray(n.material)?n.material:[n.material])t.add(i)}}),e.forEach(n=>n.dispose()),t.forEach(n=>n.dispose())}function Qx(s,e=0){let t=s.geometry.clone();t.applyMatrix4(s.matrixWorld),t.getAttribute("normal")||t.computeVertexNormals();let n=t.getAttribute("position"),i=t.getAttribute("normal"),r=t.getAttribute("color"),o=t.getAttribute("uv"),a=[],c=[],l=[],h=[],u=[],d=new Map,f=t.index?.count??n.count,m=p=>t.index?t.index.getX(p):p;for(let p=0;p<f;p+=3){let g=[m(p),m(p+1),m(p+2)],M=g.reduce((x,y)=>x+n.getX(y),0)/3;if(!(e&&(e<0&&M>=0||e>0&&M<0)))for(let x of g)d.has(x)||(d.set(x,a.length/3),a.push(n.getX(x),n.getY(x),n.getZ(x)),c.push(i.getX(x),i.getY(x),i.getZ(x)),l.push(r?r.getX(x):1,r?r.getY(x):1,r?r.getZ(x):1),h.push(o?o.getX(x):0,o?o.getY(x):0)),u.push(d.get(x))}if(t.dispose(),!a.length)return null;let _=new ht;return _.setAttribute("position",new Oe(a,3)),_.setAttribute("normal",new Oe(c,3)),_.setAttribute("color",new Oe(l,3)),_.setAttribute("uv",new Oe(h,2)),_.setIndex(u),_}function df(s,e){let t=new it;t.name="MYR5",t.userData={rigVersion:1,recipe:JSON.parse(JSON.stringify(e))};let n={};function i(d,f,m=t){let _=new it;return _.name=d,_.position.fromArray(f),m.add(_),n[d]=_,_}let r=i("BodyMotion",[0,.8,0]),o=i("HeadMotion",[0,.75,0],r);i("ArmLeft",[-.55,.48,0],r),i("ArmRight",[.55,.48,0],r),i("FootLeft",[-.35,.35,0]),i("FootRight",[.35,.35,0]),En[e.eyeLayout].eyes.forEach(([d,f,m],_)=>i("EyeBlink"+_,[d,f-1.55,m],o)),t.updateMatrixWorld(!0),s.updateMatrixWorld(!0);let c=new Map;function l(d,f,m=0){if(Array.isArray(d.material))throw Error("This MYR5 mesh uses an unsupported material layout.");let _=Qx(d,m);if(!_)return;_.applyMatrix4(f.matrixWorld.clone().invert());let p=d.material,g=p,M=f.name+JSON.stringify([p.type,p.color.getHex(),p.emissive.getHex(),p.emissiveIntensity,p.roughness,p.metalness,p.opacity,p.side,p.map?.uuid,p.bumpMap?.uuid,p.roughnessMap?.uuid,p.emissiveMap?.uuid,p.bumpScale,g.transmission,g.thickness,g.ior,g.clearcoat,g.sheen]);if(!c.has(M)){let x=p.clone();x.vertexColors=!0,x.userData={},c.set(M,{node:f,material:x,geometries:[]})}c.get(M).geometries.push(_)}function h(d,f,m=0){if(d.visible){/^Eye [1-8]$/.test(d.name)&&(m=Number(d.name.split(" ")[1])-1),d instanceof ye&&(f==="arms"?(l(d,n.ArmLeft,-1),l(d,n.ArmRight,1)):f==="feet"?(l(d,n.FootLeft,-1),l(d,n.FootRight,1)):l(d,f==="eye"?n["EyeBlink"+m]:f==="head"?o:r));for(let _ of d.children)h(_,f,m)}}for(let d of s.children)if(d.name==="Style ornaments")for(let f of d.children)h(f,f.userData.region);else h(d,d.name);for(let{node:d,material:f,geometries:m}of c.values()){let _=ea(m,!1);if(m.forEach(g=>g.dispose()),!_)throw Error("Could not assemble this creature.");_.computeBoundingSphere();let p=new ye(_,f);p.name=d.name+"Surface",d.add(p)}let u=Object.fromEntries(Object.entries(n).map(([d,f])=>[d,{position:f.position.clone(),scale:f.scale.clone(),quaternion:f.quaternion.clone()}]));return{root:t,nodes:n,rest:u,recipe:e}}var pn={idle:{label:"At ease",duration:7,loop:!0},listening:{label:"Listening",duration:4,loop:!0},thinking:{label:"Thinking",duration:5,loop:!0},speaking:{label:"Speaking",duration:3.6,loop:!0},greet:{label:"Hello",duration:2.6,loop:!1},agree:{label:"Yes / understood",duration:1.9,loop:!1},correct:{label:"Gentle correction",duration:2.4,loop:!1},encourage:{label:"Encouragement",duration:2.8,loop:!1},celebrate:{label:"Celebrate",duration:3.2,loop:!1},rest:{label:"Take a breath",duration:5,loop:!0},laugh:{label:"Giant laugh",duration:3.4,loop:!1},swipe:{label:"Platform sweep",duration:1.8,loop:!1},awaken:{label:"Pod awakening",duration:4.8,loop:!1},ready:{label:"Ready to train",duration:3.3,loop:!1},victory:{label:"Effort earned",duration:3.8,loop:!1}};function ff(s){return{count:"agree",complete:"celebrate",ready:"greet",tracking:"correct",setup:"listening",time:"encourage"}[s]||"speaking"}function ev(s,e){let t=pn[s].duration,n=e/t,i=Math.sin(n*Math.PI*2),r=Math.sin(Math.PI*n)**2,o={headX:0,headY:0,headZ:0,bodyX:0,bodyZ:0,bodyY:0,leftX:0,leftZ:0,rightX:0,rightZ:0,breath:0};if(s==="idle"&&(o.headY=.045*i,o.headZ=.018*Math.sin(n*Math.PI*4),o.breath=.009*i,o.leftX=.02*i,o.rightX=-.015*i),s==="listening"&&(o.headZ=-.085*(.5-.5*Math.cos(n*Math.PI*2)),o.headX=.03*i),s==="thinking"&&(o.headY=.1*i,o.headZ=.055*(1-Math.cos(n*Math.PI*2)),o.rightX=-.06*i),s==="speaking"&&(o.headX=.035*i,o.headZ=.02*Math.sin(n*Math.PI*4),o.rightX=.13*i,o.rightZ=.07*(1-Math.cos(n*Math.PI*2)),o.leftX=-.06*i),s==="greet"&&(o.rightZ=.27*r,o.rightX=.2*Math.sin(n*Math.PI*8)*r,o.headZ=-.06*r),s==="agree"&&(o.headX=.15*Math.sin(n*Math.PI*4)*r,o.rightZ=.05*r),s==="correct"&&(o.headY=.16*Math.sin(n*Math.PI*4)*r,o.rightZ=.12*r),s==="encourage"&&(o.headX=.1*Math.sin(n*Math.PI*4)*r,o.leftZ=-.15*r,o.rightZ=.18*r,o.bodyZ=.02*i*r),s==="celebrate"&&(o.leftZ=-.45*r,o.rightZ=.33*r,o.headZ=.06*i*r,o.bodyY=.08*r*(.5+.5*Math.sin(n*Math.PI*6))),s==="rest"&&(o.breath=.015*i,o.headX=.025*i,o.leftX=.025*i),s==="laugh"){let a=Math.sin(n*Math.PI*14)*r;o.headX=-.2*r+.12*a,o.headZ=.08*a,o.bodyX=-.05*r,o.bodyY=.055*a,o.leftZ=-.18*r,o.rightZ=.2*r,o.breath=.045*Math.abs(a)}if(s==="swipe"){let a=Math.sin(n*Math.PI)*Math.sin(n*Math.PI);o.bodyZ=-.12*a,o.headY=.22*Math.sin(n*Math.PI*2)*a,o.rightZ=1.15*Math.sin(n*Math.PI*2)*a,o.rightX=-.65*a,o.leftZ=-.16*a,o.bodyY=-.06*a}return s==="awaken"&&(o.headX=.24*(1-n)*r,o.headY=-.14*Math.sin(n*Math.PI*2)*r,o.bodyY=.08*r,o.leftZ=-.17*r,o.rightZ=.27*r,o.breath=.028*r),s==="ready"&&(o.headX=.16*Math.sin(n*Math.PI*2)*r,o.leftZ=-.36*r,o.rightZ=.42*r,o.leftX=-.24*r,o.rightX=-.32*r,o.bodyY=-.045*r,o.breath=.018*r),s==="victory"&&(o.leftZ=-.65*r,o.rightZ=.68*r,o.headX=-.12*r,o.headZ=.08*Math.sin(n*Math.PI*2)*r,o.bodyY=.09*r,o.breath=.026*r),o}function tv(s){return Object.entries(pn).map(([e,t])=>{let n=Math.ceil(t.duration*24),i=Array.from({length:n+1},(c,l)=>t.duration*l/n),r=i.map(c=>ev(e,c)),o=[],a={HeadMotion:c=>[c.headX,c.headY,c.headZ],BodyMotion:c=>[c.bodyX,0,c.bodyZ],ArmLeft:c=>[c.leftX,0,c.leftZ],ArmRight:c=>[c.rightX,0,c.rightZ]};for(let[c,l]of Object.entries(a))o.push(new wn(c+".quaternion",i,r.flatMap(h=>{let[u,d,f]=l(h);return new lt().setFromEuler(new ln(u,d,f)).toArray()})));o.push(new nn("BodyMotion.position",i,r.flatMap(c=>[0,s.rest.BodyMotion.position.y+c.bodyY,0]))),o.push(new nn("BodyMotion.scale",i,r.flatMap(c=>[1+c.breath*.3,1+c.breath,1+c.breath*.3])));for(let c of Object.keys(s.nodes).filter(l=>l.startsWith("EyeBlink"))){let l=t.duration*.55;o.push(new nn(c+".scale",[0,l,l+.1,l+.23,t.duration],[1,1,1,1,1,1,1,.06,1,1,1,1,1,1,1]))}return new di(e,t.duration,o)})}var ra=class{rig;mixer;clips;current="idle";action;ambient=!0;reduced=!1;paused=!1;amount=.65;clock=0;nextBlink=3.4;blinkStart=-100;actions=new Map;constructor(e){this.rig=e,this.clips=tv(e),this.mixer=new Ho(e.root);for(let t of this.clips){let n=this.mixer.clipAction(t),i=t.name;n.setLoop(pn[i].loop?Tl:Sl,pn[i].loop?1/0:1),n.clampWhenFinished=!pn[i].loop,this.actions.set(i,n)}this.action=this.actions.get("idle"),this.action.play(),this.mixer.addEventListener("finished",()=>this.play("idle"))}play(e){if(!Object.hasOwn(pn,e)||this.current===e&&pn[e].loop)return;let t=this.actions.get(e);for(let n of this.actions.values())n!==this.action&&n!==t&&n.stop();t===this.action?t.reset().play():(this.action.fadeOut(.22),t.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(.22).play()),this.action=t,this.current=e}update(e){if(this.paused)return;e=Math.min(.05,Math.max(0,e)),this.clock+=e,this.mixer.update(e);let t=this.reduced||this.current==="idle"&&!this.ambient?0:this.amount;for(let[r,o]of Object.entries(this.rig.nodes)){let a=this.rig.rest[r];if(r.startsWith("EyeBlink"))continue;let c=o.position.clone(),l=o.scale.clone();o.quaternion.slerpQuaternions(a.quaternion,o.quaternion.clone(),t),o.position.copy(a.position).lerp(c,t),o.scale.copy(a.scale).lerp(l,t)}this.clock>=this.nextBlink&&(this.blinkStart=this.clock,this.nextBlink=this.clock+3.8+Math.random()*2.5);let n=(this.clock-this.blinkStart)/.23,i=!this.reduced&&this.ambient&&n>=0&&n<=1?Math.sin(n*Math.PI)**2:0;for(let[r,o]of Object.entries(this.rig.nodes))r.startsWith("EyeBlink")&&(o.scale.y=1-.94*i)}neutral(){this.mixer.stopAllAction();for(let[e,t]of Object.entries(this.rig.nodes)){let n=this.rig.rest[e];t.position.copy(n.position),t.scale.copy(n.scale),t.quaternion.copy(n.quaternion)}}dispose(){this.mixer.stopAllAction(),this.mixer.uncacheRoot(this.rig.root)}};var Uh="myr5-recipe-v1",Oh="myr5-motion-v1",nv=64*1024;function xr(s){if(typeof s!="string"||new TextEncoder().encode(s).length>nv)throw Error("Choose a MYR5 recipe smaller than 64 KB.");try{let e=JSON.parse(s);if(!e||typeof e!="object"||Array.isArray(e)||e.format!==void 0&&e.format!=="myr5-companion"||e.format==="myr5-companion"&&e.version!==1)throw Error();return Qd(JSON.stringify(e.format==="myr5-companion"?e.recipe:e))}catch{throw Error("This is not a supported MYR5 recipe. Export \u201CSave editable recipe \xB7 JSON\u201D from the creature creator.")}}function pf(s){let e=s.getItem(Uh);return e?xr(e):sh()}function vr(s){try{let e=JSON.parse(s||"{}");return{amount:Number.isFinite(e?.amount)?Math.max(0,Math.min(1.5,e.amount)):.65,reduced:typeof e?.reduced=="boolean"?e.reduced:!1,ambient:e?.ambient!==!1}}catch{return{amount:.65,reduced:!1,ambient:!0}}}var oa={opening:{duration:4800,gesture:"awaken",frames:[[-1.7,1.6,7.7,1.65],[-.6,2.25,7.2,1.82],[0,2.65,8.9,1.95]]},home:{duration:2400,gesture:"greet",frames:[[.55,2.4,9.5,1.9],[.24,2.5,9.1,1.95],[0,2.65,8.9,1.95]]},pre:{duration:3300,gesture:"ready",frames:[[.85,2.35,8.5,1.87],[.2,2.15,7.5,1.87],[0,2.65,8.9,1.95]]},post:{duration:3800,gesture:"victory",frames:[[-.6,2.1,7.4,2.1],[.25,2.35,8.1,2.1],[0,2.1,5.8,2.25]]}};function mf(s,e){let t=oa[s],n=Math.max(0,Math.min(1,e/t.duration)),i=Math.min(1,Math.floor(n*2)),r=n*2-i,o=r*r*(3-2*r),a=t.frames[i],c=t.frames[i+1];return a.map((l,h)=>l+(c[h]-l)*o)}function gf(s,e){let t=new Yt;s.updateMatrixWorld(!0);function n(i){i.visible&&(i instanceof ye&&i.userData.region===e&&(i.geometry.computeBoundingBox(),i.geometry.boundingBox&&t.union(i.geometry.boundingBox.clone().applyMatrix4(i.matrixWorld))),i.children.forEach(n))}return n(s),t}function _f(s,e,t,n=1.2){if(t.isEmpty())return!1;let i=t.getCenter(new E),r=t.getSize(new E),o=vt.degToRad(s.fov/2),a=Math.max(r.y/(2*Math.tan(o)),r.x/(2*Math.tan(o)*Math.max(.25,s.aspect)))*n+r.z/2;return e.minDistance=Math.min(.7,a*.5),e.maxDistance=Math.max(14,a*2),e.target.copy(i),s.position.copy(i).add(new E(0,0,Math.max(1,a))),e.update(),!0}var aa=class{constructor(e,t,n=!0){this.mount=e;this.assetBase=t;this.interactive=n;this.renderer=new ys({antialias:!0,alpha:!0,preserveDrawingBuffer:!0,powerPreference:"low-power"}),this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)),this.renderer.outputColorSpace=mt,this.renderer.toneMapping=ml;let i=new jo,r=new _s(this.renderer);this.scene.environment=r.fromScene(i,.04).texture,i.dispose(),r.dispose(),this.renderer.domElement.setAttribute("aria-label","Your animated MYR5 creature"),this.renderer.domElement.setAttribute("role","img"),e.append(this.renderer.domElement),this.camera.position.set(0,2.65,8.9),this.orbit=new Jo(this.camera,this.renderer.domElement),this.orbit.target.set(0,1.95,0),this.orbit.enableDamping=!0,this.orbit.enablePan=!1,this.orbit.minDistance=6,this.orbit.maxDistance=13,this.orbit.enabled=n,this.orbit.maxPolarAngle=Math.PI*.85,this.scene.add(new Bo(15062527,2299182,2));let o=new Li(16772828,3);o.position.set(-3,5,5),this.scene.add(o);let a=new Li(12163071,2);a.position.set(3,4,-3),this.scene.add(a);let c=new ye(new ut(1.45,1.55,.08,64),new wt({color:2367025,roughness:.5,metalness:.4}));c.position.y=-.05,this.scene.add(c);let l=new ye(new Vt(1.4,.014,6,64),new qt({color:13875309}));l.rotation.x=Math.PI/2,l.position.y=.005,this.scene.add(l),this.floorObjects=[c,l],this.resizeObserver=new ResizeObserver(()=>this.resize()),this.resizeObserver.observe(e),this.resize(),this.visibilityObserver=new IntersectionObserver(u=>{this.visible=u[0].isIntersecting}),this.visibilityObserver.observe(e);let h=u=>{if(this.disposed)return;this.frame=requestAnimationFrame(h);let d=Math.min(.05,(u-this.last)/1e3);u-this.last<32||(this.last=u,!(!this.visible||document.hidden)&&(this.motion?.update(d),this.orbit.update(),this.renderer.render(this.scene,this.camera)))};this.frame=requestAnimationFrame(h)}mount;assetBase;interactive;regionBoxes=new Map;focused=null;focusRegion(e){this.focused=e;let t=this.regionBoxes.get(e);return t?_f(this.camera,this.orbit,t):!1}homeView(){!this.interactive&&this.stage==="pod"&&this.focusRegion("head")}cinematicKind=null;cinematic(e,t=0){if(!e){if(!this.cinematicKind)return;this.cinematicKind=null,this.resetStageView(),this.play("idle");return}if(!Object.hasOwn(oa,e)||this.settings.reduced)return;this.cinematicKind!==e&&(this.cinematicKind=e,this.play(oa[e].gesture));let[n,i,r,o]=mf(e,t);this.camera.position.set(n,i,r),this.orbit.target.set(0,o,0),this.camera.fov=36,this.camera.updateProjectionMatrix(),this.orbit.update()}scene=new Tn;camera=new _t(36,1,.1,50);renderer;orbit;rig=null;motion=null;generation=0;disposed=!1;frame=0;last=0;visible=!0;settings=vr(null);resizeObserver;visibilityObserver;gesture="idle";paused=!1;stage="pod";floorObjects=[];resize(){let{width:e,height:t}=this.mount.getBoundingClientRect();e&&t&&(this.renderer.setSize(e,t,!1),this.camera.aspect=e/t,this.camera.updateProjectionMatrix(),this.cinematicKind||(this.focused&&this.interactive?this.focusRegion(this.focused):this.homeView()))}async setRecipe(e){let t=xr(JSON.stringify(e)),n=++this.generation,i=await uf(t,this.assetBase),r;try{if(this.disposed||n!==this.generation)return!1;this.regionBoxes=new Map(Yn.map(o=>[o,gf(i.root,o)])),this.regionBoxes.get("eye").isEmpty()&&this.regionBoxes.set("eye",this.regionBoxes.get("head").clone()),r=df(i.root,t)}finally{i.dispose()}return this.rig&&(this.motion?.dispose(),this.scene.remove(this.rig.root),Nh(this.rig.root)),this.rig=r,this.motion=new ra(r),Object.assign(this.motion,this.settings,{paused:this.paused}),this.scene.add(r.root),this.motion.play(this.gesture),this.cinematicKind||(this.interactive&&this.focused?this.focusRegion(this.focused):this.homeView()),!0}play(e){this.gesture=e,this.motion?.play(e)}setSettings(e){this.settings=e,this.motion&&Object.assign(this.motion,e)}setPaused(e){this.paused=e,this.motion&&(this.motion.paused=e)}resetStageView(){let e=this.stage==="encounter";this.orbit.minDistance=e?4:6,this.orbit.maxDistance=14,this.camera.fov=e?32:36,this.camera.position.set(0,e?2.1:2.65,e?5.8:8.9),this.orbit.target.set(0,e?2.25:1.95,0),this.camera.updateProjectionMatrix(),this.orbit.update(),this.homeView()}setStage(e){this.stage=e,this.focused=null,this.floorObjects.forEach(t=>t.visible=e!=="encounter"),this.cinematicKind||this.resetStageView(),this.resize()}resetView(){this.focused=null,this.orbit.minDistance=6,this.camera.position.set(0,2.65,8.9),this.orbit.target.set(0,1.95,0),this.orbit.update()}async exportGLB(){if(!this.rig||!this.motion)throw Error("Wait for your creature to load.");let e=this.rig.root.clone(!0);for(let[n,i]of Object.entries(this.rig.rest)){let r=e.getObjectByName(n);r.position.copy(i.position),r.quaternion.copy(i.quaternion),r.scale.copy(i.scale)}e.updateMatrixWorld(!0);let t=await new Cs().parseAsync(e,{binary:!0,animations:this.motion.clips});return new Blob([t],{type:"model/gltf-binary"})}stats(){return{gesture:this.motion?.current,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,visible:this.visible,paused:this.paused,contextLost:this.renderer.getContext().isContextLost(),canvas:{width:this.renderer.domElement.width,height:this.renderer.domElement.height},rigVersion:1,recipe:this.rig?.recipe}}dispose(){this.disposed=!0,this.generation++,cancelAnimationFrame(this.frame),this.resizeObserver.disconnect(),this.visibilityObserver.disconnect(),this.orbit.dispose(),this.motion?.dispose(),Nh(this.scene),this.scene.environment?.dispose(),this.renderer.dispose(),this.renderer.domElement.remove()}};var ca=class{constructor(e){this.gestures=e}gestures;index=0;due=0;next(e,t){if(!t)return this.due=e+8e3,null;if(!this.due)return this.due=e+8e3,null;if(e<this.due||!this.gestures.length)return null;let n=this.gestures[this.index++%this.gestures.length];return this.due=e+8e3,n}};var yf=new URL("../",import.meta.url).href,xf=document.getElementById("view");if(xf){let _=function(){let N=vr(null);try{N=vr(localStorage.getItem(Oh))}catch{}r?.setSettings({...N,reduced:N.reduced||m.matches})},g=function(N,v=pn[N]?.duration*1e3+300){!u||r?.cinematicKind||!Object.hasOwn(pn,N)||(r?.play(N),c=performance.now()+v)},s=document.createElement("aside");s.className="myr5-companion-card",s.setAttribute("aria-label","Your MYR5 coach");let e=document.createElement("div");e.className="myr5-companion-stage";let t=document.createElement("a");t.href=new URL("index.html",yf).href,t.textContent="Customize MYR5",t.className="myr5-customize";let n=document.createElement("span");n.className="myr5-companion-status",n.textContent="Waking up\u2026",n.setAttribute("role","status");let i=document.createElement("button");i.className="myr5-hide",i.textContent="Hide creature",i.setAttribute("aria-expanded","true"),s.append(e,n,t,i),xf.append(s);let r=null,o="",a=0,c=0,l=0,h=!1,u=!0,d=!1,f=new ca(Object.keys(pn)),m=matchMedia("(prefers-reduced-motion: reduce)");async function p(N){let v=++l;s.dataset.ready="false",n.textContent="Loading coach\u2026";try{r||(r=new aa(e,yf,!1),_());let S=N?xr(N):pf(localStorage);if(!await r.setRecipe(S)||v!==l||h)return;s.dataset.ready="true",n.textContent="MYR5";let B=document.body.dataset.screen==="rest";r.setStage(B?"encounter":"pod"),r.play(B?"laugh":"greet"),c=performance.now()+(B?3700:2800)}catch(S){v===l&&!h&&(n.textContent=S.message)}}let M=N=>{let v=N.detail;!v||typeof v.key!="string"||(a=performance.now(),g(ff(v.key)))};window.addEventListener("myr5:cue",M);let x=N=>{let v=N.detail,S=v?.state,F={listening:"listening",thinking:"thinking",speaking:"speaking",idle:"idle"};Object.hasOwn(F,S)&&(d=S==="speaking",!(S==="speaking"&&performance.now()<c&&r?.motion?.current!=="speaking")&&(S==="idle"&&r?.motion?.current!=="speaking"&&performance.now()<c||g(F[S],S==="idle"?0:15e3)))};window.addEventListener("myr5:response",x);let y=document.getElementById("coachCaption"),A=new MutationObserver(()=>{let N=y?.textContent||"";N&&N!==o&&(o=N,performance.now()-a>120&&performance.now()>c&&g("speaking",Math.min(14e3,1200+N.length*80)))});y&&A.observe(y,{childList:!0,characterData:!0,subtree:!0});let w=setInterval(()=>{let N=performance.now(),v=h||!r?.motion||s.dataset.ready!=="true"||!u||document.hidden||!!document.querySelector("dialog[open]")||!!r?.cinematicKind||N<c||d||document.body.dataset.tracking==="true"||m.matches,S=f.next(N,!v);if(h||!r?.motion||s.dataset.ready!=="true"||!u||document.hidden)return;if(S)r.play(S);else if(N>c&&!r.cinematicKind&&(d||document.body.dataset.tracking==="true")){let B=d?"speaking":"listening";r.motion.current!==B&&r.play(B)}let F=pn[r.motion.current].label;n.textContent!==F&&(n.textContent=F)},200),R=N=>{N.key===Oh&&_(),N.key===Uh&&p(N.newValue||void 0)};window.addEventListener("storage",R),m.addEventListener("change",_);let I=N=>{p(JSON.stringify(N.detail))};window.addEventListener("myr5:recipe",I),i.onclick=()=>{u=!u,e.hidden=!u,n.hidden=!u,r?.setPaused(!u),i.textContent=u?"Hide creature":"Show creature",i.setAttribute("aria-expanded",String(u))},document.getElementById("start")?.addEventListener("click",()=>g("greet")),document.getElementById("stop")?.addEventListener("click",()=>g("rest",5e3)),window.addEventListener("pagehide",()=>{h=!0,l++,clearInterval(w),A.disconnect(),r?.dispose(),window.removeEventListener("myr5:cue",M),window.removeEventListener("myr5:response",x),window.removeEventListener("storage",R),window.removeEventListener("myr5:recipe",I),m.removeEventListener("change",_)},{once:!0}),window.myr5Creature={play:g,stage:N=>r?.setStage(N),cinematic:(N,v=0)=>{r?.cinematic(N,v),c=performance.now()+(N?1e4:500)},stats:()=>({...r?.stats(),stage:r?.stage,cinematic:r?.cinematicKind,handsVersion:2})},p(),window.addEventListener("pageshow",N=>{N.persisted&&location.reload()})}export{xr as importCreature};
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2024 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
//# sourceMappingURL=phone.js.map
