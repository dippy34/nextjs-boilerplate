(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=1e3,t=1001,n=1002,r=1003,i=1004,a=1005,o=1006,s=1007,c=1008,l=1009,u=1010,d=1011,f=1012,p=1013,m=1014,h=1015,g=1016,_=1017,v=1018,y=1020,b=35902,x=35899,S=1021,C=1022,w=1023,T=1026,E=1027,D=1028,O=1029,k=1030,A=1031,ee=1033,j=33776,te=33777,M=33778,ne=33779,N=35840,re=35841,ie=35842,ae=35843,oe=36196,se=37492,ce=37496,le=37488,P=37489,ue=37490,de=37491,fe=37808,pe=37809,me=37810,he=37811,ge=37812,_e=37813,ve=37814,ye=37815,be=37816,xe=37817,Se=37818,Ce=37819,we=37820,Te=37821,Ee=36492,De=36494,Oe=36495,ke=36283,Ae=36284,je=36285,Me=36286,Ne=2300,F=2301,Pe=2302,Fe=2303,Ie=2400,I=2401,Le=2402,L=3200,Re=`srgb`,R=`srgb-linear`,ze=`linear`,Be=`srgb`,Ve=7680,He=35044,Ue=35048,We=2e3;function Ge(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function Ke(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function qe(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function Je(){let e=qe(`canvas`);return e.style.display=`block`,e}var Ye={};function Xe(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function Ze(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function z(...e){e=Ze(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function B(...e){e=Ze(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function Qe(...e){let t=e.join(` `);t in Ye||(Ye[t]=!0,z(...e))}function $e(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var et={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3},tt=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},nt=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),rt=Math.PI/180,it=180/Math.PI;function at(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(nt[e&255]+nt[e>>8&255]+nt[e>>16&255]+nt[e>>24&255]+`-`+nt[t&255]+nt[t>>8&255]+`-`+nt[t>>16&15|64]+nt[t>>24&255]+`-`+nt[n&63|128]+nt[n>>8&255]+`-`+nt[n>>16&255]+nt[n>>24&255]+nt[r&255]+nt[r>>8&255]+nt[r>>16&255]+nt[r>>24&255]).toLowerCase()}function ot(e,t,n){return Math.max(t,Math.min(n,e))}function st(e,t){return(e%t+t)%t}function ct(e,t,n){return(1-n)*e+n*t}function lt(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:case Uint8ClampedArray:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}function ut(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}var V=class e{static{e.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=ot(this.x,e.x,t.x),this.y=ot(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=ot(this.x,e,t),this.y=ot(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ot(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(ot(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},H=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:z(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(ot(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},U=class e{static{e.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(ft.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(ft.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=ot(this.x,e.x,t.x),this.y=ot(this.y,e.y,t.y),this.z=ot(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=ot(this.x,e,t),this.y=ot(this.y,e,t),this.z=ot(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ot(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return dt.copy(this).projectOnVector(e),this.sub(dt)}reflect(e){return this.sub(dt.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(ot(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},dt=new U,ft=new H,W=class e{static{e.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return Qe(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(pt.makeScale(e,t)),this}rotate(e){return Qe(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(pt.makeRotation(-e)),this}translate(e,t){return Qe(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(pt.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},pt=new W,mt=new W().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),ht=new W().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function gt(){let e={enabled:!0,workingColorSpace:R,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n?e:(this.spaces[t].transfer===`srgb`&&(e.r=vt(e.r),e.g=vt(e.g),e.b=vt(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=yt(e.r),e.g=yt(e.g),e.b=yt(e.b)),e)},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?ze:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[t].toXYZ).multiply(this.spaces[n].fromXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(t,n){return Qe(`ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().`),e.workingToColorSpace(t,n)},toWorkingColorSpace:function(t,n){return Qe(`ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().`),e.colorSpaceToWorking(t,n)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[R]:{primaries:t,whitePoint:r,transfer:ze,toXYZ:mt,fromXYZ:ht,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:Re},outputColorSpaceConfig:{drawingBufferColorSpace:Re}},[Re]:{primaries:t,whitePoint:r,transfer:Be,toXYZ:mt,fromXYZ:ht,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:Re}}}),e}var _t=gt();function vt(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function yt(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var bt,xt=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{bt===void 0&&(bt=qe(`canvas`)),bt.width=e.width,bt.height=e.height;let t=bt.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=bt}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=qe(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=vt(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(vt(t[e]/255)*255):t[e]=vt(t[e]);return{data:t,width:e.width,height:e.height}}return z(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},St=0,Ct=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:St++}),this.uuid=at(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width,t.height,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(wt(r[t].image)):e.push(wt(r[t]))}else e=wt(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function wt(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?xt.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(z(`Texture: Unable to serialize Texture.`),{})}var Tt=0,Et=new U,Dt=class r extends tt{constructor(e=r.DEFAULT_IMAGE,n=r.DEFAULT_MAPPING,i=t,a=t,s=o,u=c,d=w,f=l,p=r.DEFAULT_ANISOTROPY,m=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Tt++}),this.uuid=at(),this.name=``,this.source=new Ct(e),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=i,this.wrapT=a,this.magFilter=s,this.minFilter=u,this.anisotropy=p,this.format=d,this.internalFormat=null,this.type=f,this.offset=new V(0,0),this.repeat=new V(1,1),this.center=new V(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new W,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=m,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Et).x}get height(){return this.source.getSize(Et).y}get depth(){return this.source.getSize(Et).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){z(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){z(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(r){if(this.mapping!==300)return r;if(r.applyMatrix3(this.matrix),r.x<0||r.x>1)switch(this.wrapS){case e:r.x-=Math.floor(r.x);break;case t:r.x=r.x<0?0:1;break;case n:Math.abs(Math.floor(r.x)%2)===1?r.x=Math.ceil(r.x)-r.x:r.x-=Math.floor(r.x)}if(r.y<0||r.y>1)switch(this.wrapT){case e:r.y-=Math.floor(r.y);break;case t:r.y=r.y<0?0:1;break;case n:Math.abs(Math.floor(r.y)%2)===1?r.y=Math.ceil(r.y)-r.y:r.y-=Math.floor(r.y)}return this.flipY&&(r.y=1-r.y),r}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Dt.DEFAULT_IMAGE=null,Dt.DEFAULT_MAPPING=300,Dt.DEFAULT_ANISOTROPY=1;var Ot=class e{static{e.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=ot(this.x,e.x,t.x),this.y=ot(this.y,e.y,t.y),this.z=ot(this.z,e.z,t.z),this.w=ot(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=ot(this.x,e,t),this.y=ot(this.y,e,t),this.z=ot(this.z,e,t),this.w=ot(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ot(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},kt=class extends tt{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:o,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new Ot(0,0,e,t),this.scissorTest=!1,this.viewport=new Ot(0,0,e,t),this.textures=[];let r=new Dt({width:e,height:t,depth:n.depth}),i=n.count;for(let e=0;e<i;e++)this.textures[e]=r.clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:o,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new Ct(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},At=class extends kt{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},jt=class extends Dt{constructor(e=null,n=1,i=1,a=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:n,height:i,depth:a},this.magFilter=r,this.minFilter=r,this.wrapR=t,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},Mt=class extends Dt{constructor(e=null,n=1,i=1,a=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:n,height:i,depth:a},this.magFilter=r,this.minFilter=r,this.wrapR=t,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},G=class e{static{e.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/Nt.setFromMatrixColumn(e,0).length(),i=1/Nt.setFromMatrixColumn(e,1).length(),a=1/Nt.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Ft,e,It)}lookAt(e,t,n){let r=this.elements;return zt.subVectors(e,t),zt.lengthSq()===0&&(zt.z=1),zt.normalize(),Lt.crossVectors(n,zt),Lt.lengthSq()===0&&(Math.abs(n.z)===1?zt.x+=1e-4:zt.z+=1e-4,zt.normalize(),Lt.crossVectors(n,zt)),Lt.normalize(),Rt.crossVectors(zt,Lt),r[0]=Lt.x,r[4]=Rt.x,r[8]=zt.x,r[1]=Lt.y,r[5]=Rt.y,r[9]=zt.y,r[2]=Lt.z,r[6]=Rt.z,r[10]=zt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],ee=r[10],j=r[14],te=r[3],M=r[7],ne=r[11],N=r[15];return i[0]=a*x+o*T+s*k+c*te,i[4]=a*S+o*E+s*A+c*M,i[8]=a*C+o*D+s*ee+c*ne,i[12]=a*w+o*O+s*j+c*N,i[1]=l*x+u*T+d*k+f*te,i[5]=l*S+u*E+d*A+f*M,i[9]=l*C+u*D+d*ee+f*ne,i[13]=l*w+u*O+d*j+f*N,i[2]=p*x+m*T+h*k+g*te,i[6]=p*S+m*E+h*A+g*M,i[10]=p*C+m*D+h*ee+g*ne,i[14]=p*w+m*O+h*j+g*N,i[3]=_*x+v*T+y*k+b*te,i[7]=_*S+v*E+y*A+b*M,i[11]=_*C+v*D+y*ee+b*ne,i[15]=_*w+v*O+y*j+b*N,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=Nt.set(r[0],r[1],r[2]).length(),o=Nt.set(r[4],r[5],r[6]).length(),s=Nt.set(r[8],r[9],r[10]).length();i<0&&(a=-a),Pt.copy(this);let c=1/a,l=1/o,u=1/s;return Pt.elements[0]*=c,Pt.elements[1]*=c,Pt.elements[2]*=c,Pt.elements[4]*=l,Pt.elements[5]*=l,Pt.elements[6]*=l,Pt.elements[8]*=u,Pt.elements[9]*=u,Pt.elements[10]*=u,t.setFromRotationMatrix(Pt),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=We,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=We,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Nt=new U,Pt=new G,Ft=new U(0,0,0),It=new U(1,1,1),Lt=new U,Rt=new U,zt=new U,Bt=new G,Vt=new H,Ht=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(ot(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-ot(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(ot(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-ot(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(ot(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-ot(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:z(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Bt.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Bt,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Vt.setFromEuler(this),this.setFromQuaternion(Vt,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Ht.DEFAULT_ORDER=`XYZ`;var Ut=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&(1<<e|0))}},Wt=0,Gt=new U,Kt=new H,qt=new G,Jt=new U,Yt=new U,Xt=new U,Zt=new H,Qt=new U(1,0,0),$t=new U(0,1,0),en=new U(0,0,1),tn={type:`added`},nn={type:`removed`},rn={type:`childadded`,child:null},an={type:`childremoved`,child:null},on=class e extends tt{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Wt++}),this.uuid=at(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new U,n=new Ht,r=new H,i=new U(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new G},normalMatrix:{value:new W}}),this.matrix=new G,this.matrixWorld=new G,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ut,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Kt.setFromAxisAngle(e,t),this.quaternion.multiply(Kt),this}rotateOnWorldAxis(e,t){return Kt.setFromAxisAngle(e,t),this.quaternion.premultiply(Kt),this}rotateX(e){return this.rotateOnAxis(Qt,e)}rotateY(e){return this.rotateOnAxis($t,e)}rotateZ(e){return this.rotateOnAxis(en,e)}translateOnAxis(e,t){return Gt.copy(e).applyQuaternion(this.quaternion),this.position.add(Gt.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Qt,e)}translateY(e){return this.translateOnAxis($t,e)}translateZ(e){return this.translateOnAxis(en,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(qt.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Jt.copy(e):Jt.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),Yt.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?qt.lookAt(Yt,Jt,this.up):qt.lookAt(Jt,Yt,this.up),this.quaternion.setFromRotationMatrix(qt),r&&(qt.extractRotation(r.matrixWorld),Kt.setFromRotationMatrix(qt),this.quaternion.premultiply(Kt.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(B(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(tn),rn.child=e,this.dispatchEvent(rn),rn.child=null):B(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(nn),an.child=e,this.dispatchEvent(an),an.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),qt.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),qt.multiply(e.parent.matrixWorld)),e.applyMatrix4(qt),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(tn),rn.child=e,this.dispatchEvent(rn),rn.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Yt,e,Xt),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Yt,Zt,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};on.DEFAULT_UP=new U(0,1,0),on.DEFAULT_MATRIX_AUTO_UPDATE=!0,on.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var sn=class extends on{constructor(){super(),this.isGroup=!0,this.type=`Group`}},cn={type:`move`},ln=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new sn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new sn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new U,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new U),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new sn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new U,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new U,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.rotation,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(cn)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new sn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},un={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},dn={h:0,s:0,l:0},fn={h:0,s:0,l:0};function pn(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var mn=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Re){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,_t.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=_t.workingColorSpace){return this.r=e,this.g=t,this.b=n,_t.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=_t.workingColorSpace){if(e=st(e,1),t=ot(t,0,1),n=ot(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=pn(i,r,e+1/3),this.g=pn(i,r,e),this.b=pn(i,r,e-1/3)}return _t.colorSpaceToWorking(this,r),this}setStyle(e,t=Re){function n(t){t!==void 0&&parseFloat(t)<1&&z(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:z(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);z(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Re){let n=un[e.toLowerCase()];return n===void 0?z(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=vt(e.r),this.g=vt(e.g),this.b=vt(e.b),this}copyLinearToSRGB(e){return this.r=yt(e.r),this.g=yt(e.g),this.b=yt(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Re){return _t.workingToColorSpace(hn.copy(this),e),Math.round(ot(hn.r*255,0,255))*65536+Math.round(ot(hn.g*255,0,255))*256+Math.round(ot(hn.b*255,0,255))}getHexString(e=Re){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=_t.workingColorSpace){_t.workingToColorSpace(hn.copy(this),t);let n=hn.r,r=hn.g,i=hn.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=_t.workingColorSpace){return _t.workingToColorSpace(hn.copy(this),t),e.r=hn.r,e.g=hn.g,e.b=hn.b,e}getStyle(e=Re){_t.workingToColorSpace(hn.copy(this),e);let t=hn.r,n=hn.g,r=hn.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(dn),this.setHSL(dn.h+e,dn.s+t,dn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(dn),e.getHSL(fn);let n=ct(dn.h,fn.h,t),r=ct(dn.s,fn.s,t),i=ct(dn.l,fn.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},hn=new mn;mn.NAMES=un;var gn=class extends on{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ht,this.environmentIntensity=1,this.environmentRotation=new Ht,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},_n=new U,vn=new U,yn=new U,bn=new U,xn=new U,Sn=new U,Cn=new U,wn=new U,Tn=new U,En=new U,Dn=new Ot,On=new Ot,kn=new Ot,An=class e{constructor(e=new U,t=new U,n=new U){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),_n.subVectors(e,t),r.cross(_n);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){_n.subVectors(r,t),vn.subVectors(n,t),yn.subVectors(e,t);let a=_n.dot(_n),o=_n.dot(vn),s=_n.dot(yn),c=vn.dot(vn),l=vn.dot(yn),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,bn)!==null&&bn.x>=0&&bn.y>=0&&bn.x+bn.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,bn)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,bn.x),s.addScaledVector(a,bn.y),s.addScaledVector(o,bn.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return Dn.setScalar(0),On.setScalar(0),kn.setScalar(0),Dn.fromBufferAttribute(e,t),On.fromBufferAttribute(e,n),kn.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(Dn,i.x),a.addScaledVector(On,i.y),a.addScaledVector(kn,i.z),a}static isFrontFacing(e,t,n,r){return _n.subVectors(n,t),vn.subVectors(e,t),_n.cross(vn).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return _n.subVectors(this.c,this.b),vn.subVectors(this.a,this.b),_n.cross(vn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;xn.subVectors(r,n),Sn.subVectors(i,n),wn.subVectors(e,n);let s=xn.dot(wn),c=Sn.dot(wn);if(s<=0&&c<=0)return t.copy(n);Tn.subVectors(e,r);let l=xn.dot(Tn),u=Sn.dot(Tn);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0)return a=s/(s-l),t.copy(n).addScaledVector(xn,a);En.subVectors(e,i);let f=xn.dot(En),p=Sn.dot(En);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(Sn,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return Cn.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(Cn,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(xn,a).addScaledVector(Sn,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},jn=class{constructor(e=new U(1/0,1/0,1/0),t=new U(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Nn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Nn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Nn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,Nn):Nn.fromBufferAttribute(r,t),Nn.applyMatrix4(e.matrixWorld),this.expandByPoint(Nn);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),Pn.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),Pn.copy(e.boundingBox)),Pn.applyMatrix4(e.matrixWorld),this.union(Pn)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Nn),Nn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Vn),Hn.subVectors(this.max,Vn),Fn.subVectors(e.a,Vn),In.subVectors(e.b,Vn),Ln.subVectors(e.c,Vn),Rn.subVectors(In,Fn),zn.subVectors(Ln,In),Bn.subVectors(Fn,Ln);let t=[0,-Rn.z,Rn.y,0,-zn.z,zn.y,0,-Bn.z,Bn.y,Rn.z,0,-Rn.x,zn.z,0,-zn.x,Bn.z,0,-Bn.x,-Rn.y,Rn.x,0,-zn.y,zn.x,0,-Bn.y,Bn.x,0];return!Gn(t,Fn,In,Ln,Hn)||(t=[1,0,0,0,1,0,0,0,1],!Gn(t,Fn,In,Ln,Hn))?!1:(Un.crossVectors(Rn,zn),t=[Un.x,Un.y,Un.z],Gn(t,Fn,In,Ln,Hn))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Nn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Nn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Mn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Mn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Mn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Mn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Mn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Mn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Mn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Mn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Mn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Mn=[new U,new U,new U,new U,new U,new U,new U,new U],Nn=new U,Pn=new jn,Fn=new U,In=new U,Ln=new U,Rn=new U,zn=new U,Bn=new U,Vn=new U,Hn=new U,Un=new U,Wn=new U;function Gn(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){Wn.fromArray(e,a);let o=i.x*Math.abs(Wn.x)+i.y*Math.abs(Wn.y)+i.z*Math.abs(Wn.z),s=t.dot(Wn),c=n.dot(Wn),l=r.dot(Wn);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var Kn=qn();function qn(){let e=new ArrayBuffer(4),t=new Float32Array(e),n=new Uint32Array(e),r=new Uint32Array(512),i=new Uint32Array(512);for(let e=0;e<256;++e){let t=e-127;t<-27?(r[e]=0,r[e|256]=32768,i[e]=24,i[e|256]=24):t<-14?(r[e]=1024>>-t-14,r[e|256]=1024>>-t-14|32768,i[e]=-t-1,i[e|256]=-t-1):t<=15?(r[e]=t+15<<10,r[e|256]=t+15<<10|32768,i[e]=13,i[e|256]=13):t<128?(r[e]=31744,r[e|256]=64512,i[e]=24,i[e|256]=24):(r[e]=31744,r[e|256]=64512,i[e]=13,i[e|256]=13)}let a=new Uint32Array(2048),o=new Uint32Array(64),s=new Uint32Array(64);for(let e=1;e<1024;++e){let t=e<<13,n=0;for(;!(t&8388608);)t<<=1,n-=8388608;t&=-8388609,n+=947912704,a[e]=t|n}for(let e=1024;e<2048;++e)a[e]=939524096+(e-1024<<13);for(let e=1;e<31;++e)o[e]=e<<23;o[31]=1199570944,o[32]=2147483648;for(let e=33;e<63;++e)o[e]=2147483648+(e-32<<23);o[63]=3347054592;for(let e=1;e<64;++e)e!==32&&(s[e]=1024);return{floatView:t,uint32View:n,baseTable:r,shiftTable:i,mantissaTable:a,exponentTable:o,offsetTable:s}}function Jn(e){Math.abs(e)>65504&&z(`DataUtils.toHalfFloat(): Value out of range.`),e=ot(e,-65504,65504),Kn.floatView[0]=e;let t=Kn.uint32View[0],n=t>>23&511;return Kn.baseTable[n]+((t&8388607)>>Kn.shiftTable[n])}function Yn(e){let t=e>>10;return Kn.uint32View[0]=Kn.mantissaTable[Kn.offsetTable[t]+(e&1023)]+Kn.exponentTable[t],Kn.floatView[0]}var Xn=class{static toHalfFloat(e){return Jn(e)}static fromHalfFloat(e){return Yn(e)}},Zn=new U,Qn=new V,$n=0,K=class extends tt{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:$n++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=He,this.updateRanges=[],this.gpuType=h,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Qn.fromBufferAttribute(this,t),Qn.applyMatrix3(e),this.setXY(t,Qn.x,Qn.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Zn.fromBufferAttribute(this,t),Zn.applyMatrix3(e),this.setXYZ(t,Zn.x,Zn.y,Zn.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Zn.fromBufferAttribute(this,t),Zn.applyMatrix4(e),this.setXYZ(t,Zn.x,Zn.y,Zn.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Zn.fromBufferAttribute(this,t),Zn.applyNormalMatrix(e),this.setXYZ(t,Zn.x,Zn.y,Zn.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Zn.fromBufferAttribute(this,t),Zn.transformDirection(e),this.setXYZ(t,Zn.x,Zn.y,Zn.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=lt(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=ut(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=lt(t,this.array)),t}setX(e,t){return this.normalized&&(t=ut(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=lt(t,this.array)),t}setY(e,t){return this.normalized&&(t=ut(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=lt(t,this.array)),t}setZ(e,t){return this.normalized&&(t=ut(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=lt(t,this.array)),t}setW(e,t){return this.normalized&&(t=ut(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=ut(t,this.array),n=ut(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=ut(t,this.array),n=ut(n,this.array),r=ut(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=ut(t,this.array),n=ut(n,this.array),r=ut(r,this.array),i=ut(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}},er=class extends K{constructor(e,t,n){super(new Uint16Array(e),t,n)}},tr=class extends K{constructor(e,t,n){super(new Uint32Array(e),t,n)}},nr=class extends K{constructor(e,t,n){super(new Float32Array(e),t,n)}},rr=new jn,ir=new U,ar=new U,or=class{constructor(e=new U,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?rr.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ir.subVectors(e,this.center);let t=ir.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(ir,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(ar.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ir.copy(e.center).add(ar)),this.expandByPoint(ir.copy(e.center).sub(ar))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},sr=0,cr=new G,lr=new on,ur=new U,dr=new jn,fr=new jn,pr=new U,mr=class e extends tt{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:sr++}),this.uuid=at(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(Ge(e)?tr:er)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new W().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return cr.makeRotationFromQuaternion(e),this.applyMatrix4(cr),this}rotateX(e){return cr.makeRotationX(e),this.applyMatrix4(cr),this}rotateY(e){return cr.makeRotationY(e),this.applyMatrix4(cr),this}rotateZ(e){return cr.makeRotationZ(e),this.applyMatrix4(cr),this}translate(e,t,n){return cr.makeTranslation(e,t,n),this.applyMatrix4(cr),this}scale(e,t,n){return cr.makeScale(e,t,n),this.applyMatrix4(cr),this}lookAt(e){return lr.lookAt(e),lr.updateMatrix(),this.applyMatrix4(lr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ur).negate(),this.translate(ur.x,ur.y,ur.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new nr(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&z(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new jn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){B(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new U(-1/0,-1/0,-1/0),new U(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];dr.setFromBufferAttribute(n),this.morphTargetsRelative?(pr.addVectors(this.boundingBox.min,dr.min),this.boundingBox.expandByPoint(pr),pr.addVectors(this.boundingBox.max,dr.max),this.boundingBox.expandByPoint(pr)):(this.boundingBox.expandByPoint(dr.min),this.boundingBox.expandByPoint(dr.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&B(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new or);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){B(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new U,1/0);return}if(e){let n=this.boundingSphere.center;if(dr.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];fr.setFromBufferAttribute(n),this.morphTargetsRelative?(pr.addVectors(dr.min,fr.min),dr.expandByPoint(pr),pr.addVectors(dr.max,fr.max),dr.expandByPoint(pr)):(dr.expandByPoint(fr.min),dr.expandByPoint(fr.max))}dr.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)pr.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(pr));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)pr.fromBufferAttribute(a,t),o&&(ur.fromBufferAttribute(e,t),pr.add(ur)),r=Math.max(r,n.distanceToSquared(pr))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&B(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){B(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new K(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[];for(let e=0;e<n.count;e++)o[e]=new U,s[e]=new U;let c=new U,l=new U,u=new U,d=new V,f=new V,p=new V,m=new U,h=new U;function g(e,t,r){c.fromBufferAttribute(n,e),l.fromBufferAttribute(n,t),u.fromBufferAttribute(n,r),d.fromBufferAttribute(i,e),f.fromBufferAttribute(i,t),p.fromBufferAttribute(i,r),l.sub(c),u.sub(c),f.sub(d),p.sub(d);let a=1/(f.x*p.y-p.x*f.y);isFinite(a)&&(m.copy(l).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(a),h.copy(u).multiplyScalar(f.x).addScaledVector(l,-p.x).multiplyScalar(a),o[e].add(m),o[t].add(m),o[r].add(m),s[e].add(h),s[t].add(h),s[r].add(h))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)g(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let v=new U,y=new U,b=new U,x=new U;function S(e){b.fromBufferAttribute(r,e),x.copy(b);let t=o[e];v.copy(t),v.sub(b.multiplyScalar(b.dot(t))).normalize(),y.crossVectors(x,t);let n=y.dot(s[e])<0?-1:1;a.setXYZW(e,v.x,v.y,v.z,n)}for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)S(e.getX(t+0)),S(e.getX(t+1)),S(e.getX(t+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new K(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new U,i=new U,a=new U,o=new U,s=new U,c=new U,l=new U,u=new U;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)pr.fromBufferAttribute(e,t),pr.normalize(),e.setXYZ(t,pr.x,pr.y,pr.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new K(a,r,i)}if(this.index===null)return z(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},hr=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e===void 0?0:e.length/t,this.usage=He,this.updateRanges=[],this.version=0,this.uuid=at()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let r=0,i=this.stride;r<i;r++)this.array[e+r]=t.array[n+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=at()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=at()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));let t={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return t.usage=this.usage,t}},gr=new U,_r=class e{constructor(e,t,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name=``,this.data=e,this.itemSize=t,this.offset=n,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)gr.fromBufferAttribute(this,t),gr.applyMatrix4(e),this.setXYZ(t,gr.x,gr.y,gr.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)gr.fromBufferAttribute(this,t),gr.applyNormalMatrix(e),this.setXYZ(t,gr.x,gr.y,gr.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)gr.fromBufferAttribute(this,t),gr.transformDirection(e),this.setXYZ(t,gr.x,gr.y,gr.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=lt(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=ut(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=ut(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=ut(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=ut(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=ut(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=lt(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=lt(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=lt(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=lt(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=ut(t,this.array),n=ut(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=ut(t,this.array),n=ut(n,this.array),r=ut(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=ut(t,this.array),n=ut(n,this.array),r=ut(r,this.array),i=ut(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this.data.array[e+3]=i,this}clone(t){if(t===void 0){Xe(`InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return new K(new this.array.constructor(e),this.itemSize,this.normalized)}return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Xe(`InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},vr=new U,yr=new U,br=new W,xr=class{constructor(e=new U(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=vr.subVectors(n,t).cross(yr.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(vr),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||br.getNormalMatrix(e),r=this.coplanarPoint(vr).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Sr=0,Cr=class extends tt{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Sr++}),this.uuid=at(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new mn(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ve,this.stencilZFail=Ve,this.stencilZPass=Ve,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){z(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){z(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new mn().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new xr().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new V().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new V().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},wr=class extends Cr{constructor(e){super(),this.isSpriteMaterial=!0,this.type=`SpriteMaterial`,this.color=new mn(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Tr,Er=new U,Dr=new U,Or=new U,kr=new V,Ar=new V,jr=new G,Mr=new U,Nr=new U,Pr=new U,Fr=new V,Ir=new V,Lr=new V,Rr=class extends on{constructor(e=new wr){if(super(),this.isSprite=!0,this.type=`Sprite`,Tr===void 0){Tr=new mr;let e=new hr(new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),5);Tr.setIndex([0,1,2,0,2,3]),Tr.setAttribute(`position`,new _r(e,3,0,!1)),Tr.setAttribute(`uv`,new _r(e,2,3,!1))}this.geometry=Tr,this.material=e,this.center=new V(.5,.5),this.count=1}intersectsFrustum(e){return e.intersectsSprite(this)}raycast(e,t){e.camera===null&&B(`Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.`),Dr.setFromMatrixScale(this.matrixWorld),jr.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),Or.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Dr.multiplyScalar(-Or.z);let n=this.material.rotation,r,i;n!==0&&(i=Math.cos(n),r=Math.sin(n));let a=this.center;zr(Mr.set(-.5,-.5,0),Or,a,Dr,r,i),zr(Nr.set(.5,-.5,0),Or,a,Dr,r,i),zr(Pr.set(.5,.5,0),Or,a,Dr,r,i),Fr.set(0,0),Ir.set(1,0),Lr.set(1,1);let o=e.ray.intersectTriangle(Mr,Nr,Pr,!1,Er);if(o===null&&(zr(Nr.set(-.5,.5,0),Or,a,Dr,r,i),Ir.set(0,1),o=e.ray.intersectTriangle(Mr,Pr,Nr,!1,Er),o===null))return;let s=e.ray.origin.distanceTo(Er);s<e.near||s>e.far||t.push({distance:s,point:Er.clone(),uv:An.getInterpolation(Er,Mr,Nr,Pr,Fr,Ir,Lr,new V),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function zr(e,t,n,r,i,a){kr.subVectors(e,n).addScalar(.5).multiply(r),i===void 0?Ar.copy(kr):(Ar.x=a*kr.x-i*kr.y,Ar.y=i*kr.x+a*kr.y),e.copy(t),e.x+=Ar.x,e.y+=Ar.y,e.applyMatrix4(jr)}var Br=new U,Vr=new U,Hr=new U,Ur=new U,Wr=class{constructor(e=new U,t=new U(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Br)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Br.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Br.copy(this.origin).addScaledVector(this.direction,t),Br.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Vr.copy(e).add(t).multiplyScalar(.5),Hr.copy(t).sub(e).normalize(),Ur.copy(this.origin).sub(Vr);let i=e.distanceTo(t)*.5,a=-this.direction.dot(Hr),o=Ur.dot(this.direction),s=-Ur.dot(Hr),c=Ur.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Vr).addScaledVector(Hr,d),f}intersectSphere(e,t){if(e.radius<0)return null;Br.subVectors(e.center,this.origin);let n=Br.dot(this.direction),r=Br.dot(Br)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Br)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,A,ee,j,te;if(y>=b&&y>=x?(w=s,D=u,A=p,te=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,ee=_,j=v):(S=l,C=c,T=f,E=d,O=h,k=m,ee=v,j=_)):b>=x?(w=c,D=d,A=m,te=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,ee=v,j=g):(S=s,C=l,T=u,E=f,O=p,k=h,ee=g,j=v)):(w=l,D=f,A=h,te=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,ee=g,j=_):(S=c,C=s,T=d,E=u,O=m,k=p,ee=_,j=g)),w===0)return null;let M=S/w,ne=C/w,N=1/w,re=T-M*D,ie=E-ne*D,ae=O-M*A,oe=k-ne*A,se=ee-M*te,ce=j-ne*te,le=se*oe-ce*ae,P=re*ce-ie*se,ue=ae*ie-oe*re;if(r){if(le<0||P<0||ue<0)return null}else if((le<0||P<0||ue<0)&&(le>0||P>0||ue>0))return null;let de=le+P+ue;if(de===0)return null;let fe=N*(le*D+P*A+ue*te);return(de>0?fe<0:fe>0)?null:this.at(fe/de,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Gr=class extends Cr{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new mn(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ht,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Kr=new G,qr=new Wr,Jr=new or,Yr=new U,Xr=new U,Zr=new U,Qr=new U,$r=new U,ei=new U,ti=new U,ni=new U,q=class extends on{constructor(e=new mr,t=new Gr){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){ei.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&($r.fromBufferAttribute(s,e),a?ei.addScaledVector($r,r):ei.addScaledVector($r.sub(t),r))}t.add(ei)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Jr.copy(n.boundingSphere),Jr.applyMatrix4(i),qr.copy(e.ray).recast(e.near),!(Jr.containsPoint(qr.origin)===!1&&(qr.intersectSphere(Jr,Yr)===null||qr.origin.distanceToSquared(Yr)>(e.far-e.near)**2))&&(Kr.copy(i).invert(),qr.copy(e.ray).applyMatrix4(Kr),(n.boundingBox===null||qr.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,qr)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=ii(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=ii(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=ii(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=ii(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function ri(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;ni.copy(s),ni.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(ni);return l<n.near||l>n.far?null:{distance:l,point:ni.clone(),object:e}}function ii(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,Xr),e.getVertexPosition(c,Zr),e.getVertexPosition(l,Qr);let u=ri(e,t,n,r,Xr,Zr,Qr,ti);if(u){let e=new U;An.getBarycoord(ti,Xr,Zr,Qr,e),i&&(u.uv=An.getInterpolatedAttribute(i,s,c,l,e,new V)),a&&(u.uv1=An.getInterpolatedAttribute(a,s,c,l,e,new V)),o&&(u.normal=An.getInterpolatedAttribute(o,s,c,l,e,new U),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new U,materialIndex:0};An.getNormal(Xr,Zr,Qr,t.normal),u.face=t,u.barycoord=e}return u}var ai=class extends Dt{constructor(e=null,t=1,n=1,i,a,o,s,c,l=r,u=r,d,f){super(null,o,s,c,l,u,i,a,d,f),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},oi=class extends K{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},si=new G,ci=new G,li=[],ui=new jn,di=new G,fi=new q,pi=new or,mi=class extends q{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new oi(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let e=0;e<n;e++)this.setMatrixAt(e,di)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new jn),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,si),ui.copy(e.boundingBox).applyMatrix4(si),this.boundingBox.union(ui)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new or),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,si),pi.copy(e.boundingSphere).applyMatrix4(si),this.boundingSphere.union(pi)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,i=e*(n.length+1)+1;for(let e=0;e<n.length;e++)n[e]=r[i+e]}raycast(e,t){let n=this.matrixWorld,r=this.count;if(fi.geometry=this.geometry,fi.material=this.material,fi.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),pi.copy(this.boundingSphere),pi.applyMatrix4(n),e.ray.intersectsSphere(pi)!==!1))for(let i=0;i<r;i++){this.getMatrixAt(i,si),ci.multiplyMatrices(n,si),fi.matrixWorld=ci,fi.raycast(e,li);for(let e=0,n=li.length;e<n;e++){let n=li[e];n.instanceId=i,n.object=this,t.push(n)}li.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new oi(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new ai(new Float32Array(r*this.count),r,this.count,D,h));let i=this.morphTexture.source.data.data,a=0;for(let e=0;e<n.length;e++)a+=n[e];let o=this.geometry.morphTargetsRelative?1:1-a,s=r*e;return i[s]=o,i.set(n,s+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},hi=new or,gi=new V(.5,.5),_i=new U,vi=class{constructor(e=new xr,t=new xr,n=new xr,r=new xr,i=new xr,a=new xr){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=We,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),hi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),hi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(hi)}intersectsSprite(e){return hi.center.set(0,0,0),hi.radius=.7071067811865476+gi.distanceTo(e.center),hi.applyMatrix4(e.matrixWorld),this.intersectsSphere(hi)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(_i.x=r.normal.x>0?e.max.x:e.min.x,_i.y=r.normal.y>0?e.max.y:e.min.y,_i.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(_i)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},yi=class extends Cr{constructor(e){super(),this.isLineBasicMaterial=!0,this.type=`LineBasicMaterial`,this.color=new mn(16777215),this.map=null,this.linewidth=1,this.linecap=`round`,this.linejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},bi=new U,xi=new U,Si=new G,Ci=new Wr,wi=new or,Ti=new U,Ei=new U,Di=class extends on{constructor(e=new mr,t=new yi){super(),this.isLine=!0,this.type=`Line`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let e=1,r=t.count;e<r;e++)bi.fromBufferAttribute(t,e-1),xi.fromBufferAttribute(t,e),n[e]=n[e-1],n[e]+=bi.distanceTo(xi);e.setAttribute(`lineDistance`,new nr(n,1))}else z(`Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),wi.copy(n.boundingSphere),wi.applyMatrix4(r),wi.radius+=i,e.ray.intersectsSphere(wi)===!1)return;Si.copy(r).invert(),Ci.copy(e.ray).applyMatrix4(Si);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=this.isLineSegments?2:1,l=n.index,u=n.attributes.position;if(l!==null){let n=Math.max(0,a.start),r=Math.min(l.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=l.getX(i),r=l.getX(i+1),a=Oi(this,e,Ci,s,n,r,i);a&&t.push(a)}if(this.isLineLoop){let i=l.getX(r-1),a=l.getX(n),o=Oi(this,e,Ci,s,i,a,r-1);o&&t.push(o)}}else{let n=Math.max(0,a.start),r=Math.min(u.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=Oi(this,e,Ci,s,i,i+1,i);n&&t.push(n)}if(this.isLineLoop){let i=Oi(this,e,Ci,s,r-1,n,r-1);i&&t.push(i)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function Oi(e,t,n,r,i,a,o){let s=e.geometry.attributes.position;if(bi.fromBufferAttribute(s,i),xi.fromBufferAttribute(s,a),n.distanceSqToSegment(bi,xi,Ti,Ei)>r)return;Ti.applyMatrix4(e.matrixWorld);let c=t.ray.origin.distanceTo(Ti);if(!(c<t.near||c>t.far))return{distance:c,point:Ei.clone().applyMatrix4(e.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:e}}var ki=new U,Ai=new U,ji=class extends Di{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type=`LineSegments`}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let e=0,r=t.count;e<r;e+=2)ki.fromBufferAttribute(t,e),Ai.fromBufferAttribute(t,e+1),n[e]=e===0?0:n[e-1],n[e+1]=n[e]+ki.distanceTo(Ai);e.setAttribute(`lineDistance`,new nr(n,1))}else z(`LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}},Mi=class extends Cr{constructor(e){super(),this.isPointsMaterial=!0,this.type=`PointsMaterial`,this.color=new mn(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Ni=new G,Pi=new Wr,Fi=new or,Ii=new U,Li=class extends on{constructor(e=new mr,t=new Mi){super(),this.isPoints=!0,this.type=`Points`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Fi.copy(n.boundingSphere),Fi.applyMatrix4(r),Fi.radius+=i,e.ray.intersectsSphere(Fi)===!1)return;Ni.copy(r).invert(),Pi.copy(e.ray).applyMatrix4(Ni);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=n.index,l=n.attributes.position;if(c!==null){let n=Math.max(0,a.start),i=Math.min(c.count,a.start+a.count);for(let a=n,o=i;a<o;a++){let n=c.getX(a);Ii.fromBufferAttribute(l,n),Ri(Ii,n,s,r,e,t,this)}}else{let n=Math.max(0,a.start),i=Math.min(l.count,a.start+a.count);for(let a=n,o=i;a<o;a++)Ii.fromBufferAttribute(l,a),Ri(Ii,a,s,r,e,t,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function Ri(e,t,n,r,i,a,o){let s=Pi.distanceSqToPoint(e);if(s<n){let n=new U;Pi.closestPointToPoint(e,n),n.applyMatrix4(r);let c=i.ray.origin.distanceTo(n);if(c<i.near||c>i.far)return;a.push({distance:c,distanceToRay:Math.sqrt(s),point:n,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var zi=class extends Dt{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Bi=class extends Dt{constructor(e,t,n,r,i,a,o,s,c){super(e,t,n,r,i,a,o,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Vi=class extends Dt{constructor(e,t,n=m,i,a,o,s=r,c=r,l,u=T,d=1){if(u!==1026&&u!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:d},i,a,o,s,c,u,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ct(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},Hi=class extends Vi{constructor(e,t=m,n=301,i,a,o=r,s=r,c,l=T){let u={width:e,height:e,depth:1},d=[u,u,u,u,u,u];super(e,e,t,n,i,a,o,s,c,l),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},Ui=class extends Dt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},Wi=class e extends mr{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new nr(c,3)),this.setAttribute(`normal`,new nr(l,3)),this.setAttribute(`uv`,new nr(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new U;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},Gi=class e extends mr{constructor(e=1,t=32,n=0,r=Math.PI*2){super(),this.type=`CircleGeometry`,this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:r},t=Math.max(3,t);let i=[],a=[],o=[],s=[],c=new U,l=new V;a.push(0,0,0),o.push(0,0,1),s.push(.5,.5);for(let i=0,u=3;i<=t;i++,u+=3){let d=n+i/t*r;c.x=e*Math.cos(d),c.y=e*Math.sin(d),a.push(c.x,c.y,c.z),o.push(0,0,1),l.x=(a[u]/e+1)/2,l.y=(a[u+1]/e+1)/2,s.push(l.x,l.y)}for(let e=1;e<=t;e++)i.push(e,e+1,0);this.setIndex(i),this.setAttribute(`position`,new nr(a,3)),this.setAttribute(`normal`,new nr(o,3)),this.setAttribute(`uv`,new nr(s,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.segments,t.thetaStart,t.thetaLength)}},Ki=class e extends mr{constructor(e=1,t=1,n=1,r=32,i=1,a=!1,o=0,s=Math.PI*2){super(),this.type=`CylinderGeometry`,this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:i,openEnded:a,thetaStart:o,thetaLength:s};let c=this;r=Math.floor(r),i=Math.floor(i);let l=[],u=[],d=[],f=[],p=0,m=[],h=n/2,g=0;_(),a===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(l),this.setAttribute(`position`,new nr(u,3)),this.setAttribute(`normal`,new nr(d,3)),this.setAttribute(`uv`,new nr(f,2));function _(){let a=new U,_=new U,v=0,y=(t-e)/n;for(let c=0;c<=i;c++){let l=[],g=c/i,v=g*(t-e)+e;for(let e=0;e<=r;e++){let t=e/r,i=t*s+o,c=Math.sin(i),m=Math.cos(i);_.x=v*c,_.y=-g*n+h,_.z=v*m,u.push(_.x,_.y,_.z),a.set(c,y,m).normalize(),d.push(a.x,a.y,a.z),f.push(t,1-g),l.push(p++)}m.push(l)}for(let n=0;n<r;n++)for(let r=0;r<i;r++){let a=m[r][n],o=m[r+1][n],s=m[r+1][n+1],c=m[r][n+1];(e>0||r!==0)&&(l.push(a,o,c),v+=3),(t>0||r!==i-1)&&(l.push(o,s,c),v+=3)}c.addGroup(g,v,0),g+=v}function v(n){let i=p,a=new V,m=new U,_=0,v=n===!0?e:t,y=n===!0?1:-1;for(let e=1;e<=r;e++)u.push(0,h*y,0),d.push(0,y,0),f.push(.5,.5),p++;let b=p;for(let e=0;e<=r;e++){let t=e/r*s+o,n=Math.cos(t),i=Math.sin(t);m.x=v*i,m.y=h*y,m.z=v*n,u.push(m.x,m.y,m.z),d.push(0,y,0),a.x=n*.5+.5,a.y=i*.5*y+.5,f.push(a.x,a.y),p++}for(let e=0;e<r;e++){let t=i+e,r=b+e;n===!0?l.push(r,r+1,t):l.push(r+1,r,t),_+=3}c.addGroup(g,_,n===!0?1:2),g+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},qi=class e extends Ki{constructor(e=1,t=1,n=32,r=1,i=!1,a=0,o=Math.PI*2){super(0,e,t,n,r,i,a,o),this.type=`ConeGeometry`,this.parameters={radius:e,height:t,radialSegments:n,heightSegments:r,openEnded:i,thetaStart:a,thetaLength:o}}static fromJSON(t){return new e(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Ji=class e extends mr{constructor(e=[],t=[],n=1,r=0){super(),this.type=`PolyhedronGeometry`,this.parameters={vertices:e,indices:t,radius:n,detail:r};let i=[],a=[];o(r),c(n),l(),this.setAttribute(`position`,new nr(i,3)),this.setAttribute(`normal`,new nr(i.slice(),3)),this.setAttribute(`uv`,new nr(a,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(e){let n=new U,r=new U,i=new U;for(let a=0;a<t.length;a+=3)f(t[a+0],n),f(t[a+1],r),f(t[a+2],i),s(n,r,i,e)}function s(e,t,n,r){let i=r+1,a=[];for(let r=0;r<=i;r++){a[r]=[];let o=e.clone().lerp(n,r/i),s=t.clone().lerp(n,r/i),c=i-r;for(let e=0;e<=c;e++)e===0&&r===i?a[r][e]=o:a[r][e]=o.clone().lerp(s,e/c)}for(let e=0;e<i;e++)for(let t=0;t<2*(i-e)-1;t++){let n=Math.floor(t/2);t%2==0?(d(a[e][n+1]),d(a[e+1][n]),d(a[e][n])):(d(a[e][n+1]),d(a[e+1][n+1]),d(a[e+1][n]))}}function c(e){let t=new U;for(let n=0;n<i.length;n+=3)t.x=i[n+0],t.y=i[n+1],t.z=i[n+2],t.normalize().multiplyScalar(e),i[n+0]=t.x,i[n+1]=t.y,i[n+2]=t.z}function l(){let e=new U;for(let t=0;t<i.length;t+=3){e.x=i[t+0],e.y=i[t+1],e.z=i[t+2];let n=h(e)/2/Math.PI+.5,r=g(e)/Math.PI+.5;a.push(n,1-r)}p(),u()}function u(){for(let e=0;e<a.length;e+=6){let t=a[e+0],n=a[e+2],r=a[e+4];Math.max(t,n,r)>.9&&Math.min(t,n,r)<.1&&(t<.2&&(a[e+0]+=1),n<.2&&(a[e+2]+=1),r<.2&&(a[e+4]+=1))}}function d(e){i.push(e.x,e.y,e.z)}function f(t,n){let r=t*3;n.x=e[r+0],n.y=e[r+1],n.z=e[r+2]}function p(){let e=new U,t=new U,n=new U,r=new U,o=new V,s=new V,c=new V;for(let l=0,u=0;l<i.length;l+=9,u+=6){e.set(i[l+0],i[l+1],i[l+2]),t.set(i[l+3],i[l+4],i[l+5]),n.set(i[l+6],i[l+7],i[l+8]),o.set(a[u+0],a[u+1]),s.set(a[u+2],a[u+3]),c.set(a[u+4],a[u+5]),r.copy(e).add(t).add(n).divideScalar(3);let d=h(r);m(o,u+0,e,d),m(s,u+2,t,d),m(c,u+4,n,d)}}function m(e,t,n,r){r<0&&e.x===1&&(a[t]=e.x-1),n.x===0&&n.z===0&&(a[t]=r/2/Math.PI+.5)}function h(e){return Math.atan2(e.z,-e.x)}function g(e){return Math.atan2(-e.y,Math.sqrt(e.x*e.x+e.z*e.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.vertices,t.indices,t.radius,t.detail)}},Yi=class e extends Ji{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,r=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1];super(r,[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1],e,t),this.type=`IcosahedronGeometry`,this.parameters={radius:e,detail:t}}static fromJSON(t){return new e(t.radius,t.detail)}},Xi=class e extends mr{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new nr(p,3)),this.setAttribute(`normal`,new nr(m,3)),this.setAttribute(`uv`,new nr(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}},Zi=class e extends mr{constructor(e=.5,t=1,n=32,r=1,i=0,a=Math.PI*2){super(),this.type=`RingGeometry`,this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:r,thetaStart:i,thetaLength:a},n=Math.max(3,n),r=Math.max(1,r);let o=[],s=[],c=[],l=[],u=e,d=(t-e)/r,f=new U,p=new V;for(let e=0;e<=r;e++){for(let e=0;e<=n;e++){let r=i+e/n*a;f.x=u*Math.cos(r),f.y=u*Math.sin(r),s.push(f.x,f.y,f.z),c.push(0,0,1),p.x=(f.x/t+1)/2,p.y=(f.y/t+1)/2,l.push(p.x,p.y)}u+=d}for(let e=0;e<r;e++){let t=e*(n+1);for(let e=0;e<n;e++){let r=e+t,i=r,a=r+n+1,s=r+n+2,c=r+1;o.push(i,a,c),o.push(a,s,c)}}this.setIndex(o),this.setAttribute(`position`,new nr(s,3)),this.setAttribute(`normal`,new nr(c,3)),this.setAttribute(`uv`,new nr(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}},Qi=class e extends mr{constructor(e=1,t=32,n=16,r=0,i=Math.PI*2,a=0,o=Math.PI){super(),this.type=`SphereGeometry`,this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:i,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let s=Math.min(a+o,Math.PI),c=0,l=[],u=new U,d=new U,f=[],p=[],m=[],h=[];for(let f=0;f<=n;f++){let g=[],_=f/n,v=a+_*o,y=e*Math.cos(v),b=Math.sqrt(e*e-y*y),x=0;f===0&&a===0?x=.5/t:f===n&&s===Math.PI&&(x=-.5/t);for(let e=0;e<=t;e++){let n=e/t,a=r+n*i;u.x=-b*Math.cos(a),u.y=y,u.z=b*Math.sin(a),p.push(u.x,u.y,u.z),d.copy(u).normalize(),m.push(d.x,d.y,d.z),h.push(n+x,1-_),g.push(c++)}l.push(g)}for(let e=0;e<n;e++)for(let r=0;r<t;r++){let t=l[e][r+1],i=l[e][r],o=l[e+1][r],c=l[e+1][r+1];(e!==0||a>0)&&f.push(t,i,c),(e!==n-1||s<Math.PI)&&f.push(i,o,c)}this.setIndex(f),this.setAttribute(`position`,new nr(p,3)),this.setAttribute(`normal`,new nr(m,3)),this.setAttribute(`uv`,new nr(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}},$i=class e extends mr{constructor(e=1,t=.4,n=12,r=48,i=Math.PI*2,a=0,o=Math.PI*2){super(),this.type=`TorusGeometry`,this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:r,arc:i,thetaStart:a,thetaLength:o},n=Math.floor(n),r=Math.floor(r);let s=[],c=[],l=[],u=[],d=new U,f=new U,p=new U;for(let s=0;s<=n;s++){let m=a+s/n*o;for(let a=0;a<=r;a++){let o=a/r*i;f.x=(e+t*Math.cos(m))*Math.cos(o),f.y=(e+t*Math.cos(m))*Math.sin(o),f.z=t*Math.sin(m),c.push(f.x,f.y,f.z),d.x=e*Math.cos(o),d.y=e*Math.sin(o),p.subVectors(f,d).normalize(),l.push(p.x,p.y,p.z),u.push(a/r),u.push(s/n)}}for(let e=1;e<=n;e++)for(let t=1;t<=r;t++){let n=(r+1)*e+t-1,i=(r+1)*(e-1)+t-1,a=(r+1)*(e-1)+t,o=(r+1)*e+t;s.push(n,i,o),s.push(i,a,o)}this.setIndex(s),this.setAttribute(`position`,new nr(c,3)),this.setAttribute(`normal`,new nr(l,3)),this.setAttribute(`uv`,new nr(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}};function ea(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(na(i))i.isRenderTargetTexture?(z(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(na(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function ta(e){let t={};for(let n=0;n<e.length;n++){let r=ea(e[n]);for(let e in r)t[e]=r[e]}return t}function na(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function ra(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function ia(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:_t.workingColorSpace}var aa={clone:ea,merge:ta},oa=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,sa=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,J=class extends Cr{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=oa,this.fragmentShader=sa,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=ea(e.uniforms),this.uniformsGroups=ra(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new mn().setHex(r.value);break;case`v2`:this.uniforms[n].value=new V().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new U().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new Ot().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new W().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new G().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},ca=class extends J{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},la=class extends Cr{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=L,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},ua=class extends Cr{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function da(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function fa(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var pa=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},ma=class extends pa{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Ie,endingEnd:Ie}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case I:i=e,o=2*t-n;break;case Le:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case I:a=e,s=2*n-t;break;case Le:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},ha=class extends pa{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},ga=class extends pa{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},_a=class extends pa{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=ba(n,t,g,y,r);i[p]=va(x,o,_,b,m)}return i}};function va(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function ya(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function ba(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=va(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=ya(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var xa=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=da(t,this.TimeBufferType),this.values=da(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:da(e.times,Array),values:da(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),fa(e.settings)&&(n.settings={inTangents:da(e.settings.inTangents,Array),outTangents:da(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new ga(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new ha(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new ma(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new _a(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Ne:t=this.InterpolantFactoryMethodDiscrete;break;case F:t=this.InterpolantFactoryMethodLinear;break;case Pe:t=this.InterpolantFactoryMethodSmooth;break;case Fe:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return z(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ne;case this.InterpolantFactoryMethodLinear:return F;case this.InterpolantFactoryMethodSmooth:return Pe;case this.InterpolantFactoryMethodBezier:return Fe}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;fa(this.settings)&&(Sa(this.settings.inTangents,e),Sa(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(B(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(B(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){B(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){B(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&Ke(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){B(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===Pe,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,fa(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function Sa(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}xa.prototype.ValueTypeName=``,xa.prototype.TimeBufferType=Float32Array,xa.prototype.ValueBufferType=Float32Array,xa.prototype.DefaultInterpolation=F;var Ca=class extends xa{constructor(e,t,n){super(e,t,n)}};Ca.prototype.ValueTypeName=`bool`,Ca.prototype.ValueBufferType=Array,Ca.prototype.DefaultInterpolation=Ne,Ca.prototype.InterpolantFactoryMethodLinear=void 0,Ca.prototype.InterpolantFactoryMethodSmooth=void 0;var wa=class extends xa{constructor(e,t,n,r){super(e,t,n,r)}};wa.prototype.ValueTypeName=`color`;var Ta=class extends xa{constructor(e,t,n,r){super(e,t,n,r)}};Ta.prototype.ValueTypeName=`number`;var Ea=class extends pa{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)H.slerpFlat(i,0,a,c-o,a,c,s);return i}},Da=class extends xa{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new Ea(this.times,this.values,this.getValueSize(),e)}};Da.prototype.ValueTypeName=`quaternion`,Da.prototype.InterpolantFactoryMethodSmooth=void 0;var Oa=class extends xa{constructor(e,t,n){super(e,t,n)}};Oa.prototype.ValueTypeName=`string`,Oa.prototype.ValueBufferType=Array,Oa.prototype.DefaultInterpolation=Ne,Oa.prototype.InterpolantFactoryMethodLinear=void 0,Oa.prototype.InterpolantFactoryMethodSmooth=void 0;var ka=class extends xa{constructor(e,t,n,r){super(e,t,n,r)}};ka.prototype.ValueTypeName=`vector`;var Aa={enabled:!1,files:{},add:function(e,t){this.enabled!==!1&&(ja(e)||(this.files[e]=t))},get:function(e){if(this.enabled!==!1&&!ja(e))return this.files[e]},remove:function(e){delete this.files[e]},clear:function(){this.files={}}};function ja(e){try{let t=e.slice(e.indexOf(`:`)+1);return new URL(t).protocol===`blob:`}catch{return!1}}var Ma=new class{constructor(e,t,n){let r=this,i=!1,a=0,o=0,s,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(e){o++,i===!1&&r.onStart!==void 0&&r.onStart(e,a,o),i=!0},this.itemEnd=function(e){a++,r.onProgress!==void 0&&r.onProgress(e,a,o),a===o&&(i=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(e){r.onError!==void 0&&r.onError(e)},this.resolveURL=function(e){return e=e.normalize(`NFC`),s?s(e):e},this.setURLModifier=function(e){return s=e,this},this.addHandler=function(e,t){return c.push(e,t),this},this.removeHandler=function(e){let t=c.indexOf(e);return t!==-1&&c.splice(t,2),this},this.getHandler=function(e){for(let t=0,n=c.length;t<n;t+=2){let n=c[t],r=c[t+1];if(n.global&&(n.lastIndex=0),n.test(e))return r}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||=new AbortController,this._abortController}},Na=class{constructor(e){this.manager=e===void 0?Ma:e,this.crossOrigin=`anonymous`,this.withCredentials=!1,this.path=``,this.resourcePath=``,this.requestHeader={},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(r,i){n.load(e,r,t,i)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Na.DEFAULT_MATERIAL_NAME=`__DEFAULT`;var Pa=new WeakMap,Fa=class extends Na{constructor(e){super(e)}load(e,t,n,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let i=this,a=Aa.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)i.manager.itemStart(e),setTimeout(function(){t&&t(a),i.manager.itemEnd(e)},0);else{let e=Pa.get(a);e===void 0&&(e=[],Pa.set(a,e)),e.push({onLoad:t,onError:r})}return a}let o=qe(`img`);function s(){l(),t&&t(this);let n=Pa.get(this)||[];for(let e=0;e<n.length;e++){let t=n[e];t.onLoad&&t.onLoad(this)}Pa.delete(this),i.manager.itemEnd(e)}function c(t){l(),r&&r(t),Aa.remove(`image:${e}`);let n=Pa.get(this)||[];for(let e=0;e<n.length;e++){let r=n[e];r.onError&&r.onError(t)}Pa.delete(this),i.manager.itemError(e),i.manager.itemEnd(e)}function l(){o.removeEventListener(`load`,s,!1),o.removeEventListener(`error`,c,!1)}return o.addEventListener(`load`,s,!1),o.addEventListener(`error`,c,!1),e.slice(0,5)!==`data:`&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),Aa.add(`image:${e}`,o),i.manager.itemStart(e),o.src=e,o}},Ia=class extends Na{constructor(e){super(e)}load(e,t,n,r){let i=new Dt,a=new Fa(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(e){i.image=e,i.needsUpdate=!0,t!==void 0&&t(i)},n,r),i}},La=new U,Ra=new H,za=new U,Ba=class extends on{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new G,this.projectionMatrix=new G,this.projectionMatrixInverse=new G,this.coordinateSystem=We,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(La,Ra,za),za.x===1&&za.y===1&&za.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(La,Ra,za.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(La,Ra,za),za.x===1&&za.y===1&&za.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(La,Ra,za.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Va=new U,Ha=new V,Ua=new V,Wa=class extends Ba{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=it*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(rt*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return it*2*Math.atan(Math.tan(rt*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Va.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Va.x,Va.y).multiplyScalar(-e/Va.z),Va.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Va.x,Va.y).multiplyScalar(-e/Va.z)}getViewSize(e,t){return this.getViewBounds(e,Ha,Ua),t.subVectors(Ua,Ha)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(rt*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Ga=class extends Ba{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Ka=new WeakMap,qa=class extends Na{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>`u`&&z(`ImageBitmapLoader: createImageBitmap() not supported.`),typeof fetch>`u`&&z(`ImageBitmapLoader: fetch() not supported.`),this.options={premultiplyAlpha:`none`},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,n,r){e===void 0&&(e=``),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let i=this,a=Aa.get(`image-bitmap:${e}`);if(a!==void 0){if(i.manager.itemStart(e),a.then){a.then(n=>{Ka.has(a)===!0?(r&&r(Ka.get(a)),i.manager.itemError(e),i.manager.itemEnd(e)):(t&&t(n),i.manager.itemEnd(e))});return}setTimeout(function(){t&&t(a),i.manager.itemEnd(e)},0);return}let o={};o.credentials=this.crossOrigin===`anonymous`?`same-origin`:`include`,o.headers=this.requestHeader,o.signal=typeof AbortSignal.any==`function`?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;let s=fetch(e,o).then(function(e){return e.blob()}).then(function(e){return createImageBitmap(e,Object.assign({},i.options,{colorSpaceConversion:`none`}))}).then(function(n){return Aa.add(`image-bitmap:${e}`,n),t&&t(n),i.manager.itemEnd(e),n}).catch(function(t){r&&r(t),Ka.set(s,t),Aa.remove(`image-bitmap:${e}`),i.manager.itemError(e),i.manager.itemEnd(e)});Aa.add(`image-bitmap:${e}`,s),i.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}},Ja=-90,Ya=1,Xa=class extends on{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Wa(Ja,Ya,e,t);r.layers=this.layers,this.add(r);let i=new Wa(Ja,Ya,e,t);i.layers=this.layers,this.add(i);let a=new Wa(Ja,Ya,e,t);a.layers=this.layers,this.add(a);let o=new Wa(Ja,Ya,e,t);o.layers=this.layers,this.add(o);let s=new Wa(Ja,Ya,e,t);s.layers=this.layers,this.add(s);let c=new Wa(Ja,Ya,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},Za=class extends Wa{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}},Qa=`\\[\\]\\.:\\/`,$a=RegExp(`[\\[\\]\\.:\\/]`,`g`),eo=`[^\\[\\]\\.:\\/]`,to=`[^`+Qa.replace(`\\.`,``)+`]`,no=`((?:WC+[\\/:])*)`.replace(`WC`,eo),ro=`(WCOD+)?`.replace(`WCOD`,to),io=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,eo),ao=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,eo),oo=RegExp(`^`+no+ro+io+ao+`$`),so=[`material`,`materials`,`bones`,`map`],co=class{constructor(e,t,n){let r=n||lo.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},lo=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace($a,``)}static parseTrackName(e){let t=oo.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);so.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){z(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){B(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){B(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){B(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){B(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){B(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){B(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){B(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;B(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){B(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){B(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};lo.Composite=co,lo.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},lo.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},lo.prototype.GetterByBindingType=[lo.prototype._getValue_direct,lo.prototype._getValue_array,lo.prototype._getValue_arrayElement,lo.prototype._getValue_toArray],lo.prototype.SetterByBindingTypeAndVersioning=[[lo.prototype._setValue_direct,lo.prototype._setValue_direct_setNeedsUpdate,lo.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[lo.prototype._setValue_array,lo.prototype._setValue_array_setNeedsUpdate,lo.prototype._setValue_array_setMatrixWorldNeedsUpdate],[lo.prototype._setValue_arrayElement,lo.prototype._setValue_arrayElement_setNeedsUpdate,lo.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[lo.prototype._setValue_fromArray,lo.prototype._setValue_fromArray_setNeedsUpdate,lo.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var uo=new G,fo=class{constructor(e,t,n=0,r=1/0){this.ray=new Wr(e,t),this.near=n,this.far=r,this.camera=null,this.layers=new Ut,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):B(`Raycaster: Unsupported camera type: `+t.type)}setFromXRController(e){return uo.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(uo),this}intersectObject(e,t=!0,n=[]){return mo(e,this,n,t),n.sort(po),n}intersectObjects(e,t=!0,n=[]){for(let r=0,i=e.length;r<i;r++)mo(e[r],this,n,t);return n.sort(po),n}};function po(e,t){return e.distance-t.distance}function mo(e,t,n,r){let i=!0;if(e.layers.test(t.layers)&&e.raycast(t,n)===!1&&(i=!1),i===!0&&r===!0){let r=e.children;for(let e=0,i=r.length;e<i;e++)mo(r[e],t,n,!0)}}(class e{static{e.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}});function ho(e,t,n,r){let i=go(r);switch(n){case S:return e*t;case D:return e*t/i.components*i.byteLength;case O:return e*t/i.components*i.byteLength;case k:return e*t*2/i.components*i.byteLength;case A:return e*t*2/i.components*i.byteLength;case C:return e*t*3/i.components*i.byteLength;case w:return e*t*4/i.components*i.byteLength;case ee:return e*t*4/i.components*i.byteLength;case j:case te:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case M:case ne:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case re:case ae:return Math.max(e,16)*Math.max(t,8)/4;case N:case ie:return Math.max(e,8)*Math.max(t,8)/2;case oe:case se:case le:case P:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case ce:case ue:case de:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case fe:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case pe:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case me:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case he:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case ge:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case _e:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case ve:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case ye:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case be:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case xe:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case Se:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case Ce:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case we:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case Te:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Ee:case De:case Oe:return Math.ceil(e/4)*Math.ceil(t/4)*16;case ke:case Ae:return Math.ceil(e/4)*Math.ceil(t/4)*8;case je:case Me:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function go(e){switch(e){case l:case u:return{byteLength:1,components:1};case f:case d:case g:return{byteLength:2,components:1};case _:case v:return{byteLength:2,components:4};case m:case p:case h:return{byteLength:4,components:1};case b:case x:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`186`}})),typeof window<`u`&&(window.__THREE__?z(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`186`);function _o(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function vo(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var Y={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
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
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
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
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
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
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
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
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
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
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
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
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
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
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,common:`#define PI 3.141592653589793
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
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
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
} // validated`,cube_uv_reflection_fragment:`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
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
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
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
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
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
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
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
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
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
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
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
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
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
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
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
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
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
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
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
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
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
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
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
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
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
		return 0.5 / max( gv + gl, EPSILON );
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
	vec3 f0 = material.specularColorBlended;
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
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
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
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
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
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
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
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
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
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
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
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
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
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
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
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
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
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
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
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
	#ifdef DOUBLE_SIDED
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
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
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
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
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
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
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
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
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
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
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
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
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
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
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
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
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
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
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
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
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
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
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
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
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
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
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
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
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
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
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
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
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
}`,depth_frag:`#if DEPTH_PACKING == 3200
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
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
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
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
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
}`,linedashed_frag:`uniform vec3 diffuse;
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
}`,meshbasic_vert:`#include <common>
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
}`,meshbasic_frag:`uniform vec3 diffuse;
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
}`,meshlambert_vert:`#define LAMBERT
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
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
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
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
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
}`,meshmatcap_vert:`#define MATCAP
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
}`,meshmatcap_frag:`#define MATCAP
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
}`,meshnormal_vert:`#define NORMAL
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
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
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
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
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
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
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
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
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
}`,meshphysical_vert:`#define STANDARD
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
}`,meshphysical_frag:`#define STANDARD
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
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
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
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
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
}`,meshtoon_vert:`#define TOON
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
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
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
}`,points_vert:`uniform float size;
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
}`,points_frag:`uniform vec3 diffuse;
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
}`,shadow_vert:`#include <common>
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
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
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
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
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
}`,sprite_frag:`uniform vec3 diffuse;
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
}`},X={common:{diffuse:{value:new mn(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new W},alphaMap:{value:null},alphaMapTransform:{value:new W},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new W}},envmap:{envMap:{value:null},envMapRotation:{value:new W},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new W}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new W}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new W},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new W},normalScale:{value:new V(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new W},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new W}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new W}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new W}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new mn(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new U},probesMax:{value:new U},probesResolution:{value:new U}},points:{diffuse:{value:new mn(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new W},alphaTest:{value:0},uvTransform:{value:new W}},sprite:{diffuse:{value:new mn(16777215)},opacity:{value:1},center:{value:new V(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new W},alphaMap:{value:null},alphaMapTransform:{value:new W},alphaTest:{value:0}}},yo={basic:{uniforms:ta([X.common,X.specularmap,X.envmap,X.aomap,X.lightmap,X.fog]),vertexShader:Y.meshbasic_vert,fragmentShader:Y.meshbasic_frag},lambert:{uniforms:ta([X.common,X.specularmap,X.envmap,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.fog,X.lights,{emissive:{value:new mn(0)},envMapIntensity:{value:1}}]),vertexShader:Y.meshlambert_vert,fragmentShader:Y.meshlambert_frag},phong:{uniforms:ta([X.common,X.specularmap,X.envmap,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.fog,X.lights,{emissive:{value:new mn(0)},specular:{value:new mn(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Y.meshphong_vert,fragmentShader:Y.meshphong_frag},standard:{uniforms:ta([X.common,X.envmap,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.roughnessmap,X.metalnessmap,X.fog,X.lights,{emissive:{value:new mn(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Y.meshphysical_vert,fragmentShader:Y.meshphysical_frag},toon:{uniforms:ta([X.common,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.gradientmap,X.fog,X.lights,{emissive:{value:new mn(0)}}]),vertexShader:Y.meshtoon_vert,fragmentShader:Y.meshtoon_frag},matcap:{uniforms:ta([X.common,X.bumpmap,X.normalmap,X.displacementmap,X.fog,{matcap:{value:null}}]),vertexShader:Y.meshmatcap_vert,fragmentShader:Y.meshmatcap_frag},points:{uniforms:ta([X.points,X.fog]),vertexShader:Y.points_vert,fragmentShader:Y.points_frag},dashed:{uniforms:ta([X.common,X.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Y.linedashed_vert,fragmentShader:Y.linedashed_frag},depth:{uniforms:ta([X.common,X.displacementmap]),vertexShader:Y.depth_vert,fragmentShader:Y.depth_frag},normal:{uniforms:ta([X.common,X.bumpmap,X.normalmap,X.displacementmap,{opacity:{value:1}}]),vertexShader:Y.meshnormal_vert,fragmentShader:Y.meshnormal_frag},sprite:{uniforms:ta([X.sprite,X.fog]),vertexShader:Y.sprite_vert,fragmentShader:Y.sprite_frag},background:{uniforms:{uvTransform:{value:new W},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Y.background_vert,fragmentShader:Y.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new W}},vertexShader:Y.backgroundCube_vert,fragmentShader:Y.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Y.cube_vert,fragmentShader:Y.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Y.equirect_vert,fragmentShader:Y.equirect_frag},distance:{uniforms:ta([X.common,X.displacementmap,{referencePosition:{value:new U},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Y.distance_vert,fragmentShader:Y.distance_frag},shadow:{uniforms:ta([X.lights,X.fog,{color:{value:new mn(0)},opacity:{value:1}}]),vertexShader:Y.shadow_vert,fragmentShader:Y.shadow_frag}};yo.physical={uniforms:ta([yo.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new W},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new W},clearcoatNormalScale:{value:new V(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new W},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new W},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new W},sheen:{value:0},sheenColor:{value:new mn(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new W},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new W},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new W},transmissionSamplerSize:{value:new V},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new W},attenuationDistance:{value:0},attenuationColor:{value:new mn(0)},specularColor:{value:new mn(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new W},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new W},anisotropyVector:{value:new V},anisotropyMap:{value:null},anisotropyMapTransform:{value:new W}}]),vertexShader:Y.meshphysical_vert,fragmentShader:Y.meshphysical_frag};var bo={r:0,b:0,g:0},xo=new G,So=new W;So.set(-1,0,0,0,1,0,0,0,1);function Co(e,t,n,r,i,a){let o=new mn(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&(i.isCubeTexture||i.mapping===306)?(l===void 0&&(l=new q(new Wi(1,1,1),new J({name:`BackgroundCubeMaterial`,uniforms:ea(yo.backgroundCube.uniforms),vertexShader:yo.backgroundCube.vertexShader,fragmentShader:yo.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(xo.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isCubeTexture&&i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(So),l.material.toneMapped=_t.getTransfer(i.colorSpace)!==Be,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new q(new Xi(2,2),new J({name:`BackgroundMaterial`,uniforms:ea(yo.background.uniforms),vertexShader:yo.background.vertexShader,fragmentShader:yo.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=_t.getTransfer(i.colorSpace)!==Be,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(bo,ia(e)),n.buffers.color.setClear(bo.r,bo.g,bo.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function wo(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.stride,p=s.offset;if(t.isInstancedInterleavedBuffer){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function To(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function Eo(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(z(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.logarithmicDepthBuffer===!0,f=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`);n.reversedDepthBuffer===!0&&f===!1&&z(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:f,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function Do(e){let t=this,n=null,r=0,i=!1,a=!1,o=new xr,s=new W,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var Oo=4,ko=6,Ao=20,jo=256,Mo=new Ga,No=new mn,Po=null,Fo=0,Io=0,Lo=!1,Ro=new U,zo=new U,Bo=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=Ro}=i;Po=this._renderer.getRenderTarget(),Fo=this._renderer.getActiveCubeFace(),Io=this._renderer.getActiveMipmapLevel(),Lo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,r,s,o),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=qo(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ko(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=2**this._lodMax}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Po,Fo,Io),this._renderer.xr.enabled=Lo,e.scissorTest=!1,Uo(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Po=this._renderer.getRenderTarget(),Fo=this._renderer.getActiveCubeFace(),Io=this._renderer.getActiveMipmapLevel(),Lo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:o,minFilter:o,generateMipmaps:!1,type:g,format:w,colorSpace:R,depthBuffer:!1},r=Ho(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Ho(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Vo(r)),this._blurMaterial=Go(r,e,t),this._ggxMaterial=Wo(r,e,t)}return r}_compileMaterial(e){let t=new q(new mr,e);this._renderer.compile(t,Mo)}_sceneToCubeUV(e,t,n,r,i){let a=new Wa(90,1,t,n),o=[1,-1,1,1,1,1],s=[1,1,1,-1,-1,-1],c=this._renderer,l=c.autoClear,u=c.toneMapping;c.getClearColor(No),c.toneMapping=0,c.autoClear=!1,c.state.buffers.depth.getReversed()&&(c.setRenderTarget(r),c.clearDepth(),c.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new q(new Wi,new Gr({name:`PMREM.Background`,side:1,depthWrite:!1,depthTest:!1})));let d=this._backgroundBox,f=d.material,p=!1,m=e.background;m?m.isColor&&(f.color.copy(m),e.background=null,p=!0):(f.color.copy(No),p=!0);for(let t=0;t<6;t++){let n=t%3;n===0?(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x+s[t],i.y,i.z)):n===1?(a.up.set(0,0,o[t]),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y+s[t],i.z)):(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y,i.z+s[t]));let l=this._cubeSize;Uo(r,n*l,t>2?l:0,l,l),c.setRenderTarget(r),p&&c.render(d,a),c.render(e,a)}c.toneMapping=u,c.autoClear=l,e.background=m}_textureToCubeUV(e,t){let n=this._renderer,r=e.mapping===301||e.mapping===302;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=qo()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ko());let i=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=i;let o=i.uniforms;o.envMap.value=e;let s=this._cubeSize;Uo(t,0,0,3*s,2*s),n.setRenderTarget(t),n.render(a,Mo)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let t=1;t<r;t++)this._applyGGXFilter(e,t-1,t);t.autoClear=n}_applyGGXFilter(e,t,n){let r=this._renderer,i=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let s=a.uniforms,c=n/(this._lodMeshes.length-1),l=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-l*l)*(c*1.25),{_lodMax:d}=this,f=this._sizeLods[n],p=3*f*(n>d-Oo?n-d+Oo:0),m=4*(this._cubeSize-f);s.envMap.value=e.texture,s.roughness.value=u,s.mipInt.value=d-t,Uo(i,p,m,3*f,2*f),r.setRenderTarget(i),r.render(o,Mo),s.envMap.value=i.texture,s.roughness.value=0,s.mipInt.value=d-n,Uo(e,p,m,3*f,2*f),r.setRenderTarget(e),r.render(o,Mo)}_blur(e,t,n,r){let i=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,i,t,n,a),this._blurPass(i,e,n,n,a)}_blurPass(e,t,n,r,i){let a=this._renderer,o=this._blurMaterial,s=this._lodMeshes[r];s.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=i,c.mipInt.value=this._lodMax-n;let l=this._sizeLods[r];Uo(t,3*l*(r>this._lodMax-Oo?r-this._lodMax+Oo:0),4*(this._cubeSize-l),3*l,2*l),a.setRenderTarget(t),a.render(s,Mo)}};function Vo(e){let t=[],n=[],r=e,i=e-Oo+1+ko;for(let e=0;e<i;e++){let e=2**r;t.push(e);let i=1/(e-2),a=-i,o=1+i,s=[a,a,o,a,o,o,a,a,o,o,a,o],c=new Float32Array(108),l=new Float32Array(108);for(let e=0;e<6;e++){let t=e%3*2/3-1,n=e>2?0:-1,r=[t,n,0,t+2/3,n,0,t+2/3,n+1,0,t,n,0,t+2/3,n+1,0,t,n+1,0];c.set(r,18*e);for(let t=0;t<6;t++){let n=s[t*2]*2-1,r=s[t*2+1]*2-1;e===0?zo.set(1,r,n):e===1?zo.set(-n,1,-r):e===2?zo.set(-n,r,1):e===3?zo.set(-1,r,-n):e===4?zo.set(-n,-1,r):zo.set(n,r,-1),zo.toArray(l,(e*6+t)*3)}}let u=new mr;u.setAttribute(`position`,new K(c,3)),u.setAttribute(`outputDirection`,new K(l,3)),n.push(new q(u,null)),r>Oo&&r--}return{lodMeshes:n,sizeLods:t}}function Ho(e,t,n){let r=new At(e,t,n);return r.texture.mapping=306,r.texture.name=`PMREM.cubeUv`,r.scissorTest=!0,r}function Uo(e,t,n,r,i){e.viewport.set(t,n,r,i),e.scissor.set(t,n,r,i)}function Wo(e,t,n){return new J({name:`PMREMGGXConvolution`,defines:{GGX_SAMPLES:jo,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Jo(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Go(e,t,n){return new J({name:`SphericalGaussianBlur`,defines:{SAMPLES:Ao,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Jo(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Ko(){return new J({name:`EquirectangularToCubeUV`,uniforms:{envMap:{value:null}},vertexShader:Jo(),fragmentShader:`

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
		`,blending:0,depthTest:!1,depthWrite:!1})}function qo(){return new J({name:`CubemapToCubeUV`,uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Jo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Jo(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Yo=class extends At{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new zi(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new Wi(5,5,5),i=new J({name:`CubemapFromEquirect`,uniforms:ea(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new q(r,i),s=t.minFilter;return t.minFilter===1008&&(t.minFilter=o),new Xa(1,10,this).update(e,a),t.minFilter=s,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}};function Xo(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new Yo(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new Bo(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new Bo(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function Zo(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&Qe(`WebGLRenderer: `+e+` extension not supported.`),t}}}function Qo(e,t,n,r){let i={},a=new WeakMap;function o(e){let s=e.target;s.index!==null&&t.remove(s.index);for(let e in s.attributes)t.remove(s.attributes[e]);s.removeEventListener(`dispose`,o),delete i[s.id];let c=a.get(s);c&&(t.remove(c),a.delete(s)),r.releaseStatesOfGeometry(s),s.isInstancedBufferGeometry===!0&&delete s._maxInstanceCount,n.memory.geometries--}function s(e,t){return i[t.id]===!0?t:(t.addEventListener(`dispose`,o),i[t.id]=!0,n.memory.geometries++,t)}function c(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function l(e){let n=[],r=e.index,i=e.attributes.position,o=0;if(i===void 0)return;if(r!==null){let e=r.array;o=r.version;for(let t=0,r=e.length;t<r;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];n.push(r,i,i,a,a,r)}}else{let e=i.array;o=i.version;for(let t=0,r=e.length/3-1;t<r;t+=3){let e=t+0,r=t+1,i=t+2;n.push(e,r,r,i,i,e)}}let s=new(i.count>=65535?tr:er)(n,1);s.version=o;let c=a.get(e);c&&t.remove(c),a.set(e,s)}function u(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&l(e)}else l(e);return a.get(e)}return{get:s,update:c,getWireframeAttribute:u}}function $o(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function es(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:B(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function ts(e,t,n){let r=new WeakMap,i=new Ot;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let g=new Float32Array(p*m*4*u),_=new jt(g,p,m,u);_.type=h,_.needsUpdate=!0;let v=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*v;e===!0&&(i.fromBufferAttribute(r,t),g[d+s+0]=i.x,g[d+s+1]=i.y,g[d+s+2]=i.z,g[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),g[d+s+4]=i.x,g[d+s+5]=i.y,g[d+s+6]=i.z,g[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),g[d+s+8]=i.x,g[d+s+9]=i.y,g[d+s+10]=i.z,g[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:_,size:new V(p,m)},r.set(o,d);function y(){_.dispose(),r.delete(o),o.removeEventListener(`dispose`,y)}o.addEventListener(`dispose`,y)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function ns(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var rs={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function is(e,t,n,r,i,a){let o=new At(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=new mr;l.setAttribute(`position`,new nr([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute(`uv`,new nr([0,2,0,0,2,0],2));let u=new ca({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new q(l,u),f=new Ga(-1,1,1,-1,0,1),p=null,m=null,h=!1,_,v=null,y=[],b=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<y.length;n++){let r=y[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){y=e,b=y.length>0&&y[0].isRenderPass===!0;let t=o.width,n=o.height;y.length>0&&s===null&&(s=new At(t,n,{type:g,depthBuffer:!1,stencilBuffer:!1}),c=new At(t,n,{type:g,depthBuffer:!1,stencilBuffer:!1}));for(let e=0;e<y.length;e++){let r=y[e];r.setSize&&r.setSize(t,n)}},this.begin=function(e,t){if(h||e.toneMapping===0&&y.length===0)return!1;if(v=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return b===!1&&e.setRenderTarget(o),_=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return b},this.end=function(e,t){e.toneMapping=_,h=!0;let n=o,r=s;for(let i=0;i<y.length;i++){let a=y[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(p!==e.outputColorSpace||m!==e.toneMapping){p=e.outputColorSpace,m=e.toneMapping,u.defines={},_t.getTransfer(p)===`srgb`&&(u.defines.SRGB_TRANSFER=``);let t=rs[m];t&&(u.defines[t]=``),u.needsUpdate=!0}u.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(v),e.render(d,f),v=null,h=!1},this.isCompositing=function(){return h},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),l.dispose(),u.dispose()}}var as=new Dt,os=new Vi(1,1),ss=new jt,cs=new Mt,ls=new zi,us=[],ds=[],fs=new Float32Array(16),ps=new Float32Array(9),ms=new Float32Array(4);function hs(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=us[i];if(a===void 0&&(a=new Float32Array(i),us[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function gs(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function _s(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function vs(e,t){let n=ds[t];n===void 0&&(n=new Int32Array(t),ds[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function ys(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function bs(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(gs(n,t))return;e.uniform2fv(this.addr,t),_s(n,t)}}function xs(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(gs(n,t))return;e.uniform3fv(this.addr,t),_s(n,t)}}function Ss(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(gs(n,t))return;e.uniform4fv(this.addr,t),_s(n,t)}}function Cs(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(gs(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),_s(n,t)}else{if(gs(n,r))return;ms.set(r),e.uniformMatrix2fv(this.addr,!1,ms),_s(n,r)}}function ws(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(gs(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),_s(n,t)}else{if(gs(n,r))return;ps.set(r),e.uniformMatrix3fv(this.addr,!1,ps),_s(n,r)}}function Ts(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(gs(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),_s(n,t)}else{if(gs(n,r))return;fs.set(r),e.uniformMatrix4fv(this.addr,!1,fs),_s(n,r)}}function Es(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function Ds(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(gs(n,t))return;e.uniform2iv(this.addr,t),_s(n,t)}}function Os(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(gs(n,t))return;e.uniform3iv(this.addr,t),_s(n,t)}}function ks(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(gs(n,t))return;e.uniform4iv(this.addr,t),_s(n,t)}}function As(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function js(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(gs(n,t))return;e.uniform2uiv(this.addr,t),_s(n,t)}}function Ms(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(gs(n,t))return;e.uniform3uiv(this.addr,t),_s(n,t)}}function Ns(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(gs(n,t))return;e.uniform4uiv(this.addr,t),_s(n,t)}}function Ps(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;this.type===e.SAMPLER_2D_SHADOW?(os.compareFunction=n.isReversedDepthBuffer()?518:515,a=os):a=as,n.setTexture2D(t||a,i)}function Fs(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||cs,i)}function Is(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTextureCube(t||ls,i)}function Ls(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||ss,i)}function Rs(e){switch(e){case 5126:return ys;case 35664:return bs;case 35665:return xs;case 35666:return Ss;case 35674:return Cs;case 35675:return ws;case 35676:return Ts;case 5124:case 35670:return Es;case 35667:case 35671:return Ds;case 35668:case 35672:return Os;case 35669:case 35673:return ks;case 5125:return As;case 36294:return js;case 36295:return Ms;case 36296:return Ns;case 35678:case 36198:case 36298:case 36306:case 35682:return Ps;case 35679:case 36299:case 36307:return Fs;case 35680:case 36300:case 36308:case 36293:return Is;case 36289:case 36303:case 36311:case 36292:return Ls}}function zs(e,t){e.uniform1fv(this.addr,t)}function Bs(e,t){let n=hs(t,this.size,2);e.uniform2fv(this.addr,n)}function Vs(e,t){let n=hs(t,this.size,3);e.uniform3fv(this.addr,n)}function Hs(e,t){let n=hs(t,this.size,4);e.uniform4fv(this.addr,n)}function Us(e,t){let n=hs(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function Ws(e,t){let n=hs(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function Gs(e,t){let n=hs(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function Ks(e,t){e.uniform1iv(this.addr,t)}function qs(e,t){e.uniform2iv(this.addr,t)}function Js(e,t){e.uniform3iv(this.addr,t)}function Ys(e,t){e.uniform4iv(this.addr,t)}function Xs(e,t){e.uniform1uiv(this.addr,t)}function Zs(e,t){e.uniform2uiv(this.addr,t)}function Qs(e,t){e.uniform3uiv(this.addr,t)}function $s(e,t){e.uniform4uiv(this.addr,t)}function ec(e,t,n){let r=this.cache,i=t.length,a=vs(n,i);gs(r,a)||(e.uniform1iv(this.addr,a),_s(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?os:as;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function tc(e,t,n){let r=this.cache,i=t.length,a=vs(n,i);gs(r,a)||(e.uniform1iv(this.addr,a),_s(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||cs,a[e])}function nc(e,t,n){let r=this.cache,i=t.length,a=vs(n,i);gs(r,a)||(e.uniform1iv(this.addr,a),_s(r,a));for(let e=0;e!==i;++e)n.setTextureCube(t[e]||ls,a[e])}function rc(e,t,n){let r=this.cache,i=t.length,a=vs(n,i);gs(r,a)||(e.uniform1iv(this.addr,a),_s(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||ss,a[e])}function ic(e){switch(e){case 5126:return zs;case 35664:return Bs;case 35665:return Vs;case 35666:return Hs;case 35674:return Us;case 35675:return Ws;case 35676:return Gs;case 5124:case 35670:return Ks;case 35667:case 35671:return qs;case 35668:case 35672:return Js;case 35669:case 35673:return Ys;case 5125:return Xs;case 36294:return Zs;case 36295:return Qs;case 36296:return $s;case 35678:case 36198:case 36298:case 36306:case 35682:return ec;case 35679:case 36299:case 36307:return tc;case 35680:case 36300:case 36308:case 36293:return nc;case 36289:case 36303:case 36311:case 36292:return rc}}var ac=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Rs(t.type)}},oc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=ic(t.type)}},sc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},cc=/(\w+)(\])?(\[|\.)?/g;function lc(e,t){e.seq.push(t),e.map[t.id]=t}function uc(e,t,n){let r=e.name,i=r.length;for(cc.lastIndex=0;;){let a=cc.exec(r),o=cc.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){lc(n,l===void 0?new ac(s,e,t):new oc(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new sc(s),lc(n,e)),n=e}}}var dc=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);uc(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function fc(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var pc=37297,mc=0;function hc(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var gc=new W;function _c(e){_t._getMatrix(gc,_t.workingColorSpace,e);let t=`mat3( ${gc.elements.map(e=>e.toFixed(4))} )`;switch(_t.getTransfer(e)){case ze:return[t,`LinearTransferOETF`];case Be:return[t,`sRGBTransferOETF`];default:return z(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function vc(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+hc(e.getShaderSource(t),r)}return i}function yc(e,t){let n=_c(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,`}`].join(`
`)}var bc={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function xc(e,t){let n=bc[t];return n===void 0?(z(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var Sc=new U;function Cc(){return _t.getLuminanceCoefficients(Sc),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${Sc.x.toFixed(4)}, ${Sc.y.toFixed(4)}, ${Sc.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function wc(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(Dc).join(`
`)}function Tc(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function Ec(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function Dc(e){return e!==``}function Oc(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function kc(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Ac=/^[ \t]*#include +<([\w\d./]+)>/gm;function jc(e){return e.replace(Ac,Nc)}var Mc=new Map;function Nc(e,t){let n=Y[t];if(n===void 0){let e=Mc.get(t);if(e!==void 0)n=Y[e],z(`WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.`,t,e);else throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`)}return jc(n)}var Pc=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Fc(e){return e.replace(Pc,Ic)}function Ic(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function Lc(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var Rc={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function zc(e){return Rc[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var Bc={301:`ENVMAP_TYPE_CUBE`,302:`ENVMAP_TYPE_CUBE`,306:`ENVMAP_TYPE_CUBE_UV`};function Vc(e){return e.envMap===!1?`ENVMAP_TYPE_CUBE`:Bc[e.envMapMode]||`ENVMAP_TYPE_CUBE`}var Hc={302:`ENVMAP_MODE_REFRACTION`};function Uc(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:Hc[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var Wc={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function Gc(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:Wc[e.combine]||`ENVMAP_BLENDING_NONE`}function Kc(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,r=1/t;return{texelWidth:1/(3*Math.max(2**n,112)),texelHeight:r,maxMip:n}}function qc(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=zc(n),l=Vc(n),u=Uc(n),d=Gc(n),f=Kc(n),p=wc(n),m=Tc(a),h=i.createProgram(),g,_,v=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(Dc).join(`
`),g.length>0&&(g+=`
`),_=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(Dc).join(`
`),_.length>0&&(_+=`
`)):(g=[Lc(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(Dc).join(`
`),_=[Lc(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,f?`#define CUBEUV_TEXEL_WIDTH `+f.texelWidth:``,f?`#define CUBEUV_TEXEL_HEIGHT `+f.texelHeight:``,f?`#define CUBEUV_MAX_MIP `+f.maxMip+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.numLightProbeGrids>0?`#define USE_LIGHT_PROBES_GRID`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:Y.tonemapping_pars_fragment,n.toneMapping===0?``:xc(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,Y.colorspace_pars_fragment,yc(`linearToOutputTexel`,n.outputColorSpace),Cc(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(Dc).join(`
`)),o=jc(o),o=Oc(o,n),o=kc(o,n),s=jc(s),s=Oc(s,n),s=kc(s,n),o=Fc(o),s=Fc(s),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[p,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+g,_=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+_);let y=v+g+o,b=v+_+s,x=fc(i,i.VERTEX_SHADER,y),S=fc(i,i.FRAGMENT_SHADER,b);i.attachShader(h,x),i.attachShader(h,S),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(h,0,`position`):i.bindAttribLocation(h,0,n.index0AttributeName),i.linkProgram(h);function C(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(h)||``,r=i.getShaderInfoLog(x)||``,a=i.getShaderInfoLog(S)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(h,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,h,x,S);else{let e=vc(i,x,`vertex`),n=vc(i,S,`fragment`);B(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(h,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):z(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:g},fragmentShader:{log:c,prefix:_}})}i.deleteShader(x),i.deleteShader(S),w=new dc(i,h),T=Ec(i,h)}let w;this.getUniforms=function(){return w===void 0&&C(this),w};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let E=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=i.getProgramParameter(h,pc)),E},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(h),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=mc++,this.cacheKey=t,this.usedTimes=1,this.program=h,this.vertexShader=x,this.fragmentShader=S,this}var Jc=0,Yc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Xc(e),t.set(e,n)),n}},Xc=class{constructor(e){this.id=Jc++,this.code=e,this.usedTimes=0}};function Zc(e){return e===1030||e===37490||e===36285}function Qc(e,t,n,r,i,a){let o=new Ut,s=new Yc,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f=r.precision,p={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function m(e){return c.add(e),e===0?`uv`:`uv${e}`}function h(i,o,l,u,h,g){let _=u.fog,v=h.geometry,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,b=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,x=t.get(i.envMap||y,b),S=x&&x.mapping===306?x.image.height:null,C=p[i.type];i.precision!==null&&(f=r.getMaxPrecision(i.precision),f!==i.precision&&z(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,f,`instead.`));let w=v.morphAttributes.position||v.morphAttributes.normal||v.morphAttributes.color,T=w===void 0?0:w.length,E=0;v.morphAttributes.position!==void 0&&(E=1),v.morphAttributes.normal!==void 0&&(E=2),v.morphAttributes.color!==void 0&&(E=3);let D,O,k,A;if(C){let e=yo[C];D=e.vertexShader,O=e.fragmentShader}else{D=i.vertexShader,O=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),k=e.id,A=t.id}let ee=e.getRenderTarget(),j=e.state.buffers.depth.getReversed(),te=h.isInstancedMesh===!0,M=h.isBatchedMesh===!0,ne=!!i.map,N=!!i.matcap,re=!!x,ie=!!i.aoMap,ae=!!i.lightMap,oe=!!i.bumpMap&&i.wireframe===!1,se=!!i.normalMap,ce=!!i.displacementMap,le=!!i.emissiveMap,P=!!i.metalnessMap,ue=!!i.roughnessMap,de=i.anisotropy>0,fe=i.clearcoat>0,pe=i.dispersion>0,me=i.retroreflectivity>0,he=i.iridescence>0,ge=i.sheen>0,_e=i.transmission>0,ve=de&&!!i.anisotropyMap,ye=fe&&!!i.clearcoatMap,be=fe&&!!i.clearcoatNormalMap,xe=fe&&!!i.clearcoatRoughnessMap,Se=he&&!!i.iridescenceMap,Ce=he&&!!i.iridescenceThicknessMap,we=ge&&!!i.sheenColorMap,Te=ge&&!!i.sheenRoughnessMap,Ee=!!i.specularMap,De=!!i.specularColorMap,Oe=!!i.specularIntensityMap,ke=_e&&!!i.transmissionMap,Ae=_e&&!!i.thicknessMap,je=!!i.gradientMap,Me=!!i.alphaMap,Ne=i.alphaTest>0,F=!!i.alphaHash,Pe=!!i.extensions,Fe=0;i.toneMapped&&(ee===null||ee.isXRRenderTarget===!0)&&(Fe=e.toneMapping);let Ie={shaderID:C,shaderType:i.type,shaderName:i.name,vertexShader:D,fragmentShader:O,defines:i.defines,customVertexShaderID:k,customFragmentShaderID:A,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:f,batching:M,batchingColor:M&&h._colorsTexture!==null,instancing:te,instancingColor:te&&h.instanceColor!==null,instancingMorph:te&&h.morphTexture!==null,outputColorSpace:ee===null?e.outputColorSpace:ee.isXRRenderTarget===!0?ee.texture.colorSpace:_t.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:ne,matcap:N,envMap:re,envMapMode:re&&x.mapping,envMapCubeUVHeight:S,aoMap:ie,lightMap:ae,bumpMap:oe,normalMap:se,displacementMap:ce,emissiveMap:le,normalMapObjectSpace:se&&i.normalMapType===1,normalMapTangentSpace:se&&i.normalMapType===0,packedNormalMap:se&&i.normalMapType===0&&Zc(i.normalMap.format),metalnessMap:P,roughnessMap:ue,anisotropy:de,anisotropyMap:ve,clearcoat:fe,clearcoatMap:ye,clearcoatNormalMap:be,clearcoatRoughnessMap:xe,dispersion:pe,retroreflection:me,iridescence:he,iridescenceMap:Se,iridescenceThicknessMap:Ce,sheen:ge,sheenColorMap:we,sheenRoughnessMap:Te,specularMap:Ee,specularColorMap:De,specularIntensityMap:Oe,transmission:_e,transmissionMap:ke,thicknessMap:Ae,gradientMap:je,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:Me,alphaTest:Ne,alphaHash:F,combine:i.combine,mapUv:ne&&m(i.map.channel),aoMapUv:ie&&m(i.aoMap.channel),lightMapUv:ae&&m(i.lightMap.channel),bumpMapUv:oe&&m(i.bumpMap.channel),normalMapUv:se&&m(i.normalMap.channel),displacementMapUv:ce&&m(i.displacementMap.channel),emissiveMapUv:le&&m(i.emissiveMap.channel),metalnessMapUv:P&&m(i.metalnessMap.channel),roughnessMapUv:ue&&m(i.roughnessMap.channel),anisotropyMapUv:ve&&m(i.anisotropyMap.channel),clearcoatMapUv:ye&&m(i.clearcoatMap.channel),clearcoatNormalMapUv:be&&m(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:xe&&m(i.clearcoatRoughnessMap.channel),iridescenceMapUv:Se&&m(i.iridescenceMap.channel),iridescenceThicknessMapUv:Ce&&m(i.iridescenceThicknessMap.channel),sheenColorMapUv:we&&m(i.sheenColorMap.channel),sheenRoughnessMapUv:Te&&m(i.sheenRoughnessMap.channel),specularMapUv:Ee&&m(i.specularMap.channel),specularColorMapUv:De&&m(i.specularColorMap.channel),specularIntensityMapUv:Oe&&m(i.specularIntensityMap.channel),transmissionMapUv:ke&&m(i.transmissionMap.channel),thicknessMapUv:Ae&&m(i.thicknessMap.channel),alphaMapUv:Me&&m(i.alphaMap.channel),vertexTangents:!!v.attributes.tangent&&(se||de),vertexNormals:!!v.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!v.attributes.color&&v.attributes.color.itemSize===4,pointsUvs:h.isPoints===!0&&!!v.attributes.uv&&(ne||Me),fog:!!_,useFog:i.fog===!0,fogExp2:!!_&&_.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||v.attributes.normal===void 0&&se===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:j,skinning:h.isSkinnedMesh===!0,hasPositionAttribute:v.attributes.position!==void 0,morphTargets:v.morphAttributes.position!==void 0,morphNormals:v.morphAttributes.normal!==void 0,morphColors:v.morphAttributes.color!==void 0,morphTargetsCount:T,morphTextureStride:E,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:g.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:Fe,decodeVideoTexture:ne&&i.map.isVideoTexture===!0&&_t.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:le&&i.emissiveMap.isVideoTexture===!0&&_t.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:Pe&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(Pe&&i.extensions.multiDraw===!0||M)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return Ie.vertexUv1s=c.has(1),Ie.vertexUv2s=c.has(2),Ie.vertexUv3s=c.has(3),c.clear(),Ie}function g(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(_(n,t),v(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function _(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapCubeUVHeight),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.morphAttributeCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function v(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function y(e){let t=p[e.type],n;if(t){let e=yo[t];n=aa.clone(e.uniforms)}else n=e.uniforms;return n}function b(t,n){let r=u.get(n);return r===void 0?(r=new qc(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function x(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function S(e){s.remove(e)}function C(){s.dispose()}return{getParameters:h,getProgramCacheKey:g,getUniforms:y,acquireProgram:b,releaseProgram:x,releaseShaderCache:S,programs:l,dispose:C}}function $c(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function el(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function tl(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function nl(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||el),r.length>1&&r.sort(t||tl),i.length>1&&i.sort(t||tl)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function rl(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new nl,e.set(t,[i])):n>=r.length?(i=new nl,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function il(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new U,color:new mn};break;case`SpotLight`:n={position:new U,direction:new U,color:new mn,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new U,color:new mn,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new U,skyColor:new mn,groundColor:new mn};break;case`RectAreaLight`:n={color:new mn,position:new U,halfWidth:new U,halfHeight:new U}}return e[t.id]=n,n}}}function al(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new V};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new V};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new V,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var ol=0;function sl(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function cl(e){let t=new il,n=al(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new U);let i=new U,a=new G,o=new G;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(sl);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=X.LTC_FLOAT_1,r.rectAreaLTC2=X.LTC_FLOAT_2):(r.rectAreaLTC1=X.LTC_HALF_1,r.rectAreaLTC2=X.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=ol++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function ll(e){let t=new cl(e),n=[],r=[],i=[];function a(e){d.camera=e,n.length=0,r.length=0,i.length=0}function o(e){n.push(e)}function s(e){r.push(e)}function c(e){i.push(e)}function l(){t.setup(n)}function u(e){t.setupView(n,e)}let d={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:d,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:s,pushLightProbeGrid:c}}function ul(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new ll(e),t.set(n,[a])):r>=i.length?(a=new ll(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var dl=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,fl=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,pl=[new U(1,0,0),new U(-1,0,0),new U(0,1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1)],ml=[new U(0,-1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1),new U(0,-1,0),new U(0,-1,0)],hl=new G,gl=new U,_l=new U;function vl(e,t,n){let i=new vi,a=new V,s=new V,c=new Ot,l=new la,u=new ua,d={},f=n.maxTextureSize,p={0:1,1:0,2:2},_=new J({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new V},radius:{value:4}},vertexShader:dl,fragmentShader:fl}),v=_.clone();v.defines.HORIZONTAL_PASS=1;let y=new mr;y.setAttribute(`position`,new K(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let b=new q(y,_),x=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let S=this.type;this.render=function(t,n,l){if(x.enabled===!1||x.autoUpdate===!1&&x.needsUpdate===!1||t.length===0)return;this.type===2&&(z(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let u=e.getRenderTarget(),d=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),_=e.state;_.setBlending(0),_.buffers.depth.getReversed()===!0?_.buffers.color.setClear(0,0,0,0):_.buffers.color.setClear(1,1,1,1),_.buffers.depth.setTest(!0),_.setScissorTest(!1);let v=S!==this.type;v&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let u=0,d=t.length;u<d;u++){let d=t[u],p=d.shadow;if(p===void 0){z(`WebGLShadowMap:`,d,`has no shadow.`);continue}if(p.autoUpdate===!1&&p.needsUpdate===!1)continue;a.copy(p.mapSize);let y=p.getFrameExtents();a.multiply(y),s.copy(p.mapSize),(a.x>f||a.y>f)&&(a.x>f&&(s.x=Math.floor(f/y.x),a.x=s.x*y.x,p.mapSize.x=s.x),a.y>f&&(s.y=Math.floor(f/y.y),a.y=s.y*y.y,p.mapSize.y=s.y));let b=e.state.buffers.depth.getReversed();if(p.camera._reversedDepth=b,p.map===null||v===!0){if(p.map!==null&&(p.map.depthTexture!==null&&(p.map.depthTexture.dispose(),p.map.depthTexture=null),p.map.dispose()),this.type===3){if(d.isPointLight){z(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}p.map=new At(a.x,a.y,{format:k,type:g,minFilter:o,magFilter:o,generateMipmaps:!1}),p.map.texture.name=d.name+`.shadowMap`,p.map.depthTexture=new Vi(a.x,a.y,h),p.map.depthTexture.name=d.name+`.shadowMapDepth`,p.map.depthTexture.format=T,p.map.depthTexture.compareFunction=null,p.map.depthTexture.minFilter=r,p.map.depthTexture.magFilter=r}else d.isPointLight?(p.map=new Yo(a.x),p.map.depthTexture=new Hi(a.x,m)):(p.map=new At(a.x,a.y),p.map.depthTexture=new Vi(a.x,a.y,m)),p.map.depthTexture.name=d.name+`.shadowMap`,p.map.depthTexture.format=T,this.type===1?(p.map.depthTexture.compareFunction=b?518:515,p.map.depthTexture.minFilter=o,p.map.depthTexture.magFilter=o):(p.map.depthTexture.compareFunction=null,p.map.depthTexture.minFilter=r,p.map.depthTexture.magFilter=r);p.camera.updateProjectionMatrix()}p.map.isWebGLCubeRenderTarget!==!0&&(p.map.width!==a.x||p.map.height!==a.y)&&p.map.setSize(a.x,a.y);let x=p.map.isWebGLCubeRenderTarget?6:p.getViewportCount();d.isPointLight!==!0&&p.updateMatrices(d,l);for(let t=0;t<x;t++){let r=p.getCamera(t);if(d.isPointLight){let e=p.camera,n=p.matrix,r=d.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),gl.setFromMatrixPosition(d.matrixWorld),e.position.copy(gl),_l.copy(e.position),_l.add(pl[t]),e.up.copy(ml[t]),e.lookAt(_l),e.updateMatrixWorld(),n.makeTranslation(-gl.x,-gl.y,-gl.z),hl.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),p._frustum.setFromProjectionMatrix(hl,e.coordinateSystem,e.reversedDepth)}if(p.map.isWebGLCubeRenderTarget)e.setRenderTarget(p.map,t),e.clear();else{t===0&&(e.setRenderTarget(p.map),e.clear());let n=p.getViewport(t);c.set(s.x*n.x,s.y*n.y,s.x*n.z,s.y*n.w),_.viewport(c)}i=p.getFrustum(t),E(n,l,r,d,this.type)}p.isPointLightShadow!==!0&&this.type===3&&C(p,l),p.needsUpdate=!1}S=this.type,x.needsUpdate=!1,e.setRenderTarget(u,d,p)};function C(n,r){let i=t.update(b);_.defines.VSM_SAMPLES!==n.blurSamples&&(_.defines.VSM_SAMPLES=n.blurSamples,v.defines.VSM_SAMPLES=n.blurSamples,_.needsUpdate=!0,v.needsUpdate=!0),n.mapPass===null?n.mapPass=new At(a.x,a.y,{format:k,type:g}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),_.uniforms.shadow_pass.value=n.map.depthTexture,_.uniforms.resolution.value.set(n.map.width,n.map.height),_.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,i,_,b,null),v.uniforms.shadow_pass.value=n.mapPass.texture,v.uniforms.resolution.value.set(n.map.width,n.map.height),v.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,i,v,b,null)}function w(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?u:l,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=d[e];r===void 0&&(r={},d[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,D)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?p[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function E(n,r,a,o,s){if(n.visible===!1)return;if(n.layers.test(r.layers)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&s===3)&&(!n.frustumCulled||n.intersectsFrustum(i))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let i=t.update(n),c=n.material;if(Array.isArray(c)){let t=i.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=c[u.materialIndex];if(d&&d.visible){let t=w(n,d,o,s);n.onBeforeShadow(e,n,r,a,i,t,u),e.renderBufferDirect(a,null,i,t,n,u),n.onAfterShadow(e,n,r,a,i,t,u)}}}else if(c.visible){let t=w(n,c,o,s);n.onBeforeShadow(e,n,r,a,i,t,null),e.renderBufferDirect(a,null,i,t,n,null),n.onAfterShadow(e,n,r,a,i,t,null)}}let c=n.children;for(let e=0,t=c.length;e<t;e++)E(c[e],r,a,o,s)}function D(e){e.target.removeEventListener(`dispose`,D);for(let t in d){let n=d[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function yl(e,t){function n(){let t=!1,n=new Ot,r=null,i=new Ot(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?P(e.DEPTH_TEST):ue(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=et[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?P(e.STENCIL_TEST):ue(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c=new WeakMap,l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new mn(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,ee=null,j=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),te=!1,M=0,ne=e.getParameter(e.VERSION);ne.indexOf(`WebGL`)===-1?ne.indexOf(`OpenGL ES`)!==-1&&(M=parseFloat(/^OpenGL ES (\d)/.exec(ne)[1]),te=M>=2):(M=parseFloat(/^WebGL (\d)/.exec(ne)[1]),te=M>=1);let N=null,re={},ie=e.getParameter(e.SCISSOR_BOX),ae=e.getParameter(e.VIEWPORT),oe=new Ot().fromArray(ie),se=new Ot().fromArray(ae);function ce(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let le={};le[e.TEXTURE_2D]=ce(e.TEXTURE_2D,e.TEXTURE_2D,1),le[e.TEXTURE_CUBE_MAP]=ce(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),le[e.TEXTURE_2D_ARRAY]=ce(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),le[e.TEXTURE_3D]=ce(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),P(e.DEPTH_TEST),o.setFunc(3),ve(!1),ye(1),P(e.CULL_FACE),ge(0);function P(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function ue(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function de(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function fe(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function pe(t){return h!==t&&(e.useProgram(t),h=t,!0)}let me={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};me[103]=e.MIN,me[104]=e.MAX;let he={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function ge(t,n,r,i,a,o,s,c,l,u){if(t===0){g===!0&&(ue(e.BLEND),g=!1);return}if(g===!1&&(P(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:B(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:B(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:B(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:B(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}return}a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(me[n],me[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(he[r],he[i],he[o],he[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function _e(t,n){t.side===2?ue(e.CULL_FACE):P(e.CULL_FACE);let r=t.side===1;n&&(r=!r),ve(r),t.blending===1&&t.transparent===!1?ge(0):ge(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),xe(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?P(e.SAMPLE_ALPHA_TO_COVERAGE):ue(e.SAMPLE_ALPHA_TO_COVERAGE)}function ve(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function ye(t){t===0?ue(e.CULL_FACE):(P(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function be(t){t!==k&&(te&&e.lineWidth(t),k=t)}function xe(t,n,r){t?(P(e.POLYGON_OFFSET_FILL),(A!==n||ee!==r)&&(A=n,ee=r,o.getReversed()&&(n=-n),e.polygonOffset(n,r))):ue(e.POLYGON_OFFSET_FILL)}function Se(t){t?P(e.SCISSOR_TEST):ue(e.SCISSOR_TEST)}function Ce(t){t===void 0&&(t=e.TEXTURE0+j-1),N!==t&&(e.activeTexture(t),N=t)}function we(t,n,r){r===void 0&&(r=N===null?e.TEXTURE0+j-1:N);let i=re[r];i===void 0&&(i={type:void 0,texture:void 0},re[r]=i),(i.type!==t||i.texture!==n)&&(N!==r&&(e.activeTexture(r),N=r),e.bindTexture(t,n||le[t]),i.type=t,i.texture=n)}function Te(){let t=re[N];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function Ee(){try{e.compressedTexImage2D(...arguments)}catch(e){B(`WebGLState:`,e)}}function De(){try{e.compressedTexImage3D(...arguments)}catch(e){B(`WebGLState:`,e)}}function Oe(){try{e.texSubImage2D(...arguments)}catch(e){B(`WebGLState:`,e)}}function ke(){try{e.texSubImage3D(...arguments)}catch(e){B(`WebGLState:`,e)}}function Ae(){try{e.compressedTexSubImage2D(...arguments)}catch(e){B(`WebGLState:`,e)}}function je(){try{e.compressedTexSubImage3D(...arguments)}catch(e){B(`WebGLState:`,e)}}function Me(){try{e.texStorage2D(...arguments)}catch(e){B(`WebGLState:`,e)}}function Ne(){try{e.texStorage3D(...arguments)}catch(e){B(`WebGLState:`,e)}}function F(){try{e.texImage2D(...arguments)}catch(e){B(`WebGLState:`,e)}}function Pe(){try{e.texImage3D(...arguments)}catch(e){B(`WebGLState:`,e)}}function Fe(t){return d[t]===void 0?e.getParameter(t):d[t]}function Ie(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function I(t){oe.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),oe.copy(t))}function Le(t){se.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),se.copy(t))}function L(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),r.set(t,i))}function Re(t,n){let r=l.get(n).get(t);c.get(n)!==r&&(e.uniformBlockBinding(n,r,t.__bindingPointIndex),c.set(n,r))}function R(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},N=null,re={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new mn(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,ee=null,oe.set(0,0,e.canvas.width,e.canvas.height),se.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:P,disable:ue,bindFramebuffer:de,drawBuffers:fe,useProgram:pe,setBlending:ge,setMaterial:_e,setFlipSided:ve,setCullFace:ye,setLineWidth:be,setPolygonOffset:xe,setScissorTest:Se,activeTexture:Ce,bindTexture:we,unbindTexture:Te,compressedTexImage2D:Ee,compressedTexImage3D:De,texImage2D:F,texImage3D:Pe,pixelStorei:Ie,getParameter:Fe,updateUBOMapping:L,uniformBlockBinding:Re,texStorage2D:Me,texStorage3D:Ne,texSubImage2D:Oe,texSubImage3D:ke,compressedTexSubImage2D:Ae,compressedTexSubImage3D:je,scissor:I,viewport:Le,reset:R}}function bl(l,u,d,f,p,m,h){let g=u.has(`WEBGL_multisampled_render_to_texture`)?u.get(`WEBGL_multisampled_render_to_texture`):null,_=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),v=new V,y=new WeakMap,b=new Set,x,S=new WeakMap,C=!1;try{C=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function w(e,t){return C?new OffscreenCanvas(e,t):qe(`canvas`)}function T(e,t,n){let r=1,i=Fe(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);x===void 0&&(x=w(n,a));let o=t?w(n,a):x;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),z(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&z(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function D(e){return e.generateMipmaps}function O(e){l.generateMipmap(e)}function k(e){return e.isWebGLCubeRenderTarget?l.TEXTURE_CUBE_MAP:e.isWebGL3DRenderTarget?l.TEXTURE_3D:e.isWebGLArrayRenderTarget||e.isCompressedArrayTexture?l.TEXTURE_2D_ARRAY:l.TEXTURE_2D}function A(e,t,n,r,i,a=!1){if(e!==null){if(l[e]!==void 0)return l[e];z(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+e+`'`)}let o;r&&(o=u.get(`EXT_texture_norm16`),o||z(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let s=t;if(t===l.RED&&(n===l.FLOAT&&(s=l.R32F),n===l.HALF_FLOAT&&(s=l.R16F),n===l.UNSIGNED_BYTE&&(s=l.R8),n===l.UNSIGNED_SHORT&&o&&(s=o.R16_EXT),n===l.SHORT&&o&&(s=o.R16_SNORM_EXT)),t===l.RED_INTEGER&&(n===l.UNSIGNED_BYTE&&(s=l.R8UI),n===l.UNSIGNED_SHORT&&(s=l.R16UI),n===l.UNSIGNED_INT&&(s=l.R32UI),n===l.BYTE&&(s=l.R8I),n===l.SHORT&&(s=l.R16I),n===l.INT&&(s=l.R32I)),t===l.RG&&(n===l.FLOAT&&(s=l.RG32F),n===l.HALF_FLOAT&&(s=l.RG16F),n===l.UNSIGNED_BYTE&&(s=l.RG8),n===l.UNSIGNED_SHORT&&o&&(s=o.RG16_EXT),n===l.SHORT&&o&&(s=o.RG16_SNORM_EXT)),t===l.RG_INTEGER&&(n===l.UNSIGNED_BYTE&&(s=l.RG8UI),n===l.UNSIGNED_SHORT&&(s=l.RG16UI),n===l.UNSIGNED_INT&&(s=l.RG32UI),n===l.BYTE&&(s=l.RG8I),n===l.SHORT&&(s=l.RG16I),n===l.INT&&(s=l.RG32I)),t===l.RGB_INTEGER&&(n===l.UNSIGNED_BYTE&&(s=l.RGB8UI),n===l.UNSIGNED_SHORT&&(s=l.RGB16UI),n===l.UNSIGNED_INT&&(s=l.RGB32UI),n===l.BYTE&&(s=l.RGB8I),n===l.SHORT&&(s=l.RGB16I),n===l.INT&&(s=l.RGB32I)),t===l.RGBA_INTEGER&&(n===l.UNSIGNED_BYTE&&(s=l.RGBA8UI),n===l.UNSIGNED_SHORT&&(s=l.RGBA16UI),n===l.UNSIGNED_INT&&(s=l.RGBA32UI),n===l.BYTE&&(s=l.RGBA8I),n===l.SHORT&&(s=l.RGBA16I),n===l.INT&&(s=l.RGBA32I)),t===l.RGB&&(n===l.UNSIGNED_SHORT&&o&&(s=o.RGB16_EXT),n===l.SHORT&&o&&(s=o.RGB16_SNORM_EXT),n===l.UNSIGNED_INT_5_9_9_9_REV&&(s=l.RGB9_E5),n===l.UNSIGNED_INT_10F_11F_11F_REV&&(s=l.R11F_G11F_B10F)),t===l.RGBA){let e=a?ze:_t.getTransfer(i);n===l.FLOAT&&(s=l.RGBA32F),n===l.HALF_FLOAT&&(s=l.RGBA16F),n===l.UNSIGNED_BYTE&&(s=e===`srgb`?l.SRGB8_ALPHA8:l.RGBA8),n===l.UNSIGNED_SHORT&&o&&(s=o.RGBA16_EXT),n===l.SHORT&&o&&(s=o.RGBA16_SNORM_EXT),n===l.UNSIGNED_SHORT_4_4_4_4&&(s=l.RGBA4),n===l.UNSIGNED_SHORT_5_5_5_1&&(s=l.RGB5_A1)}return(s===l.R16F||s===l.R32F||s===l.RG16F||s===l.RG32F||s===l.RGBA16F||s===l.RGBA32F)&&u.get(`EXT_color_buffer_float`),s}function ee(e,t){let n;return e?t===null||t===1014||t===1020?n=l.DEPTH24_STENCIL8:t===1015?n=l.DEPTH32F_STENCIL8:t===1012&&(n=l.DEPTH24_STENCIL8,z(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):t===null||t===1014||t===1020?n=l.DEPTH_COMPONENT24:t===1015?n=l.DEPTH_COMPONENT32F:t===1012&&(n=l.DEPTH_COMPONENT16),n}function j(e,t){return D(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps!==void 0&&e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function te(e){let t=e.target;t.removeEventListener(`dispose`,te),ne(t),t.isVideoTexture&&y.delete(t),t.isHTMLTexture&&b.delete(t)}function M(e){let t=e.target;t.removeEventListener(`dispose`,M),re(t)}function ne(e){let t=f.get(e);if(t.__webglInit===void 0)return;let n=e.source,r=S.get(n);if(r){let i=r[t.__cacheKey];i.usedTimes--,i.usedTimes===0&&N(e),Object.keys(r).length===0&&S.delete(n)}f.remove(e)}function N(e){let t=f.get(e);l.deleteTexture(t.__webglTexture);let n=e.source,r=S.get(n);delete r[t.__cacheKey],h.memory.textures--}function re(e){let t=f.get(e);if(e.depthTexture&&(e.depthTexture.dispose(),f.remove(e.depthTexture)),e.isWebGLCubeRenderTarget)for(let e=0;e<6;e++){if(Array.isArray(t.__webglFramebuffer[e]))for(let n=0;n<t.__webglFramebuffer[e].length;n++)l.deleteFramebuffer(t.__webglFramebuffer[e][n]);else l.deleteFramebuffer(t.__webglFramebuffer[e]);t.__webglDepthbuffer&&l.deleteRenderbuffer(t.__webglDepthbuffer[e])}else{if(Array.isArray(t.__webglFramebuffer))for(let e=0;e<t.__webglFramebuffer.length;e++)l.deleteFramebuffer(t.__webglFramebuffer[e]);else l.deleteFramebuffer(t.__webglFramebuffer);if(t.__webglDepthbuffer&&l.deleteRenderbuffer(t.__webglDepthbuffer),t.__webglMultisampledFramebuffer&&l.deleteFramebuffer(t.__webglMultisampledFramebuffer),t.__webglColorRenderbuffer)for(let e=0;e<t.__webglColorRenderbuffer.length;e++)t.__webglColorRenderbuffer[e]&&l.deleteRenderbuffer(t.__webglColorRenderbuffer[e]);t.__webglDepthRenderbuffer&&l.deleteRenderbuffer(t.__webglDepthRenderbuffer)}let n=e.textures;for(let e=0,t=n.length;e<t;e++){let t=f.get(n[e]);t.__webglTexture&&(l.deleteTexture(t.__webglTexture),h.memory.textures--),f.remove(n[e])}f.remove(e)}let ie=0;function ae(){ie=0}function oe(){return ie}function se(e){ie=e}function ce(){let e=ie;return e>=p.maxTextures&&z(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+p.maxTextures),ie+=1,e}function le(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function P(e,t){let n=f.get(e);if(e.isVideoTexture&&F(e),e.isRenderTargetTexture===!1&&e.isExternalTexture!==!0&&e.version>0&&n.__version!==e.version){let r=e.image;if(r===null)z(`WebGLRenderer: Texture marked for update but no image data found.`);else if(r.complete===!1)z(`WebGLRenderer: Texture marked for update but image is incomplete`);else{be(n,e,t);return}}else e.isExternalTexture&&(n.__webglTexture=e.sourceTexture?e.sourceTexture:null);d.bindTexture(l.TEXTURE_2D,n.__webglTexture,l.TEXTURE0+t)}function ue(e,t){let n=f.get(e);if(e.isRenderTargetTexture===!1&&e.version>0&&n.__version!==e.version){be(n,e,t);return}e.isExternalTexture&&(n.__webglTexture=e.sourceTexture?e.sourceTexture:null),d.bindTexture(l.TEXTURE_2D_ARRAY,n.__webglTexture,l.TEXTURE0+t)}function de(e,t){let n=f.get(e);if(e.isRenderTargetTexture===!1&&e.version>0&&n.__version!==e.version){be(n,e,t);return}d.bindTexture(l.TEXTURE_3D,n.__webglTexture,l.TEXTURE0+t)}function fe(e,t){let n=f.get(e);if(e.isCubeDepthTexture!==!0&&e.version>0&&n.__version!==e.version){xe(n,e,t);return}d.bindTexture(l.TEXTURE_CUBE_MAP,n.__webglTexture,l.TEXTURE0+t)}let pe={[e]:l.REPEAT,[t]:l.CLAMP_TO_EDGE,[n]:l.MIRRORED_REPEAT},me={[r]:l.NEAREST,[i]:l.NEAREST_MIPMAP_NEAREST,[a]:l.NEAREST_MIPMAP_LINEAR,[o]:l.LINEAR,[s]:l.LINEAR_MIPMAP_NEAREST,[c]:l.LINEAR_MIPMAP_LINEAR},he={512:l.NEVER,519:l.ALWAYS,513:l.LESS,515:l.LEQUAL,514:l.EQUAL,518:l.GEQUAL,516:l.GREATER,517:l.NOTEQUAL};function ge(e,t){if(t.type===1015&&u.has(`OES_texture_float_linear`)===!1&&(t.magFilter===1006||t.magFilter===1007||t.magFilter===1005||t.magFilter===1008||t.minFilter===1006||t.minFilter===1007||t.minFilter===1005||t.minFilter===1008)&&z(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),l.texParameteri(e,l.TEXTURE_WRAP_S,pe[t.wrapS]),l.texParameteri(e,l.TEXTURE_WRAP_T,pe[t.wrapT]),(e===l.TEXTURE_3D||e===l.TEXTURE_2D_ARRAY)&&l.texParameteri(e,l.TEXTURE_WRAP_R,pe[t.wrapR]),l.texParameteri(e,l.TEXTURE_MAG_FILTER,me[t.magFilter]),l.texParameteri(e,l.TEXTURE_MIN_FILTER,me[t.minFilter]),t.compareFunction&&(l.texParameteri(e,l.TEXTURE_COMPARE_MODE,l.COMPARE_REF_TO_TEXTURE),l.texParameteri(e,l.TEXTURE_COMPARE_FUNC,he[t.compareFunction])),u.has(`EXT_texture_filter_anisotropic`)===!0){if(t.magFilter===1003||t.minFilter!==1005&&t.minFilter!==1008||t.type===1015&&u.has(`OES_texture_float_linear`)===!1)return;if(t.anisotropy>1||f.get(t).__currentAnisotropy){let n=u.get(`EXT_texture_filter_anisotropic`);l.texParameterf(e,n.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(t.anisotropy,p.getMaxAnisotropy())),f.get(t).__currentAnisotropy=t.anisotropy}}}function _e(e,t){let n=!1;e.__webglInit===void 0&&(e.__webglInit=!0,t.addEventListener(`dispose`,te));let r=t.source,i=S.get(r);i===void 0&&(i={},S.set(r,i));let a=le(t);if(a!==e.__cacheKey){i[a]===void 0&&(i[a]={texture:l.createTexture(),usedTimes:0},h.memory.textures++,n=!0),i[a].usedTimes++;let r=i[e.__cacheKey];r!==void 0&&(i[e.__cacheKey].usedTimes--,r.usedTimes===0&&N(t)),e.__cacheKey=a,e.__webglTexture=i[a].texture}return n}function ve(e,t,n){return Math.floor(Math.floor(e/n)/t)}function ye(e,t,n,r){let i=e.updateRanges;if(i.length===0)d.texSubImage2D(l.TEXTURE_2D,0,0,0,t.width,t.height,n,r,t.data);else{i.sort((e,t)=>e.start-t.start);let a=0;for(let e=1;e<i.length;e++){let n=i[a],r=i[e],o=n.start+n.count,s=ve(r.start,t.width,4),c=ve(n.start,t.width,4);r.start<=o+1&&s===c&&ve(r.start+r.count-1,t.width,4)===s?n.count=Math.max(n.count,r.start+r.count-n.start):(++a,i[a]=r)}i.length=a+1;let o=d.getParameter(l.UNPACK_ROW_LENGTH),s=d.getParameter(l.UNPACK_SKIP_PIXELS),c=d.getParameter(l.UNPACK_SKIP_ROWS);d.pixelStorei(l.UNPACK_ROW_LENGTH,t.width);for(let e=0,a=i.length;e<a;e++){let a=i[e],o=Math.floor(a.start/4),s=Math.ceil(a.count/4),c=o%t.width,u=Math.floor(o/t.width),f=s;d.pixelStorei(l.UNPACK_SKIP_PIXELS,c),d.pixelStorei(l.UNPACK_SKIP_ROWS,u),d.texSubImage2D(l.TEXTURE_2D,0,c,u,f,1,n,r,t.data)}e.clearUpdateRanges(),d.pixelStorei(l.UNPACK_ROW_LENGTH,o),d.pixelStorei(l.UNPACK_SKIP_PIXELS,s),d.pixelStorei(l.UNPACK_SKIP_ROWS,c)}}function be(e,t,n){let r=l.TEXTURE_2D;(t.isDataArrayTexture||t.isCompressedArrayTexture)&&(r=l.TEXTURE_2D_ARRAY),t.isData3DTexture&&(r=l.TEXTURE_3D);let i=_e(e,t),a=t.source;d.bindTexture(r,e.__webglTexture,l.TEXTURE0+n);let o=f.get(a);if(a.version!==o.__version||i===!0){if(d.activeTexture(l.TEXTURE0+n),!(typeof ImageBitmap<`u`&&t.image instanceof ImageBitmap)){let e=_t.getPrimaries(_t.workingColorSpace),n=t.colorSpace===``?null:_t.getPrimaries(t.colorSpace),r=t.colorSpace===``||e===n?l.NONE:l.BROWSER_DEFAULT_WEBGL;d.pixelStorei(l.UNPACK_FLIP_Y_WEBGL,t.flipY),d.pixelStorei(l.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),d.pixelStorei(l.UNPACK_COLORSPACE_CONVERSION_WEBGL,r)}d.pixelStorei(l.UNPACK_ALIGNMENT,t.unpackAlignment);let e=T(t.image,!1,p.maxTextureSize);e=Pe(t,e);let s=m.convert(t.format,t.colorSpace),c=m.convert(t.type),u=A(t.internalFormat,s,c,t.normalized,t.colorSpace,t.isVideoTexture);ge(r,t);let f,h=t.mipmaps,g=t.isVideoTexture!==!0,_=o.__version===void 0||i===!0,v=a.dataReady,y=j(t,e);if(t.isDepthTexture)u=ee(t.format===E,t.type),_&&(g?d.texStorage2D(l.TEXTURE_2D,1,u,e.width,e.height):d.texImage2D(l.TEXTURE_2D,0,u,e.width,e.height,0,s,c,null));else if(t.isDataTexture){if(h.length>0){g&&_&&d.texStorage2D(l.TEXTURE_2D,y,u,h[0].width,h[0].height);for(let e=0,t=h.length;e<t;e++)f=h[e],g?v&&d.texSubImage2D(l.TEXTURE_2D,e,0,0,f.width,f.height,s,c,f.data):d.texImage2D(l.TEXTURE_2D,e,u,f.width,f.height,0,s,c,f.data);t.generateMipmaps=!1}else g?(_&&d.texStorage2D(l.TEXTURE_2D,y,u,e.width,e.height),v&&ye(t,e,s,c)):d.texImage2D(l.TEXTURE_2D,0,u,e.width,e.height,0,s,c,e.data)}else if(t.isCompressedTexture){if(t.isCompressedArrayTexture){g&&_&&d.texStorage3D(l.TEXTURE_2D_ARRAY,y,u,h[0].width,h[0].height,e.depth);for(let n=0,r=h.length;n<r;n++)if(f=h[n],t.format!==1023){if(s!==null){if(g){if(v){if(t.layerUpdates.size>0){let e=ho(f.width,f.height,t.format,t.type);for(let r of t.layerUpdates){let t=f.data.subarray(r*e/f.data.BYTES_PER_ELEMENT,(r+1)*e/f.data.BYTES_PER_ELEMENT);d.compressedTexSubImage3D(l.TEXTURE_2D_ARRAY,n,0,0,r,f.width,f.height,1,s,t)}}else d.compressedTexSubImage3D(l.TEXTURE_2D_ARRAY,n,0,0,0,f.width,f.height,e.depth,s,f.data)}}else d.compressedTexImage3D(l.TEXTURE_2D_ARRAY,n,u,f.width,f.height,e.depth,0,f.data,0,0)}else z(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else g?v&&d.texSubImage3D(l.TEXTURE_2D_ARRAY,n,0,0,0,f.width,f.height,e.depth,s,c,f.data):d.texImage3D(l.TEXTURE_2D_ARRAY,n,u,f.width,f.height,e.depth,0,s,c,f.data);t.layerUpdates.size>0&&t.clearLayerUpdates()}else{g&&_&&d.texStorage2D(l.TEXTURE_2D,y,u,h[0].width,h[0].height);for(let e=0,n=h.length;e<n;e++)f=h[e],t.format===1023?g?v&&d.texSubImage2D(l.TEXTURE_2D,e,0,0,f.width,f.height,s,c,f.data):d.texImage2D(l.TEXTURE_2D,e,u,f.width,f.height,0,s,c,f.data):s===null?z(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):g?v&&d.compressedTexSubImage2D(l.TEXTURE_2D,e,0,0,f.width,f.height,s,f.data):d.compressedTexImage2D(l.TEXTURE_2D,e,u,f.width,f.height,0,f.data)}}else if(t.isDataArrayTexture){if(g){if(_&&d.texStorage3D(l.TEXTURE_2D_ARRAY,y,u,e.width,e.height,e.depth),v){if(t.layerUpdates.size>0){let n=ho(e.width,e.height,t.format,t.type);for(let r of t.layerUpdates){let t=e.data.subarray(r*n/e.data.BYTES_PER_ELEMENT,(r+1)*n/e.data.BYTES_PER_ELEMENT);d.texSubImage3D(l.TEXTURE_2D_ARRAY,0,0,0,r,e.width,e.height,1,s,c,t)}t.clearLayerUpdates()}else d.texSubImage3D(l.TEXTURE_2D_ARRAY,0,0,0,0,e.width,e.height,e.depth,s,c,e.data)}}else d.texImage3D(l.TEXTURE_2D_ARRAY,0,u,e.width,e.height,e.depth,0,s,c,e.data)}else if(t.isData3DTexture)g?(_&&d.texStorage3D(l.TEXTURE_3D,y,u,e.width,e.height,e.depth),v&&d.texSubImage3D(l.TEXTURE_3D,0,0,0,0,e.width,e.height,e.depth,s,c,e.data)):d.texImage3D(l.TEXTURE_3D,0,u,e.width,e.height,e.depth,0,s,c,e.data);else if(t.isFramebufferTexture){if(_){if(g)d.texStorage2D(l.TEXTURE_2D,y,u,e.width,e.height);else{let t=e.width,n=e.height;for(let e=0;e<y;e++)d.texImage2D(l.TEXTURE_2D,e,u,t,n,0,s,c,null),t>>=1,n>>=1}}}else if(t.isHTMLTexture){if(`texElementImage2D`in l){let n=l.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),e.parentNode!==n){n.appendChild(e),b.add(t),n.onpaint=e=>{let t=e.changedElements;for(let e of b)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(l.texElementImage2D.length===3)l.texElementImage2D(l.TEXTURE_2D,l.RGBA8,e);else{let t=l.RGBA,n=l.RGBA,r=l.UNSIGNED_BYTE;l.texElementImage2D(l.TEXTURE_2D,0,t,n,r,e)}l.texParameteri(l.TEXTURE_2D,l.TEXTURE_MIN_FILTER,l.LINEAR),l.texParameteri(l.TEXTURE_2D,l.TEXTURE_WRAP_S,l.CLAMP_TO_EDGE),l.texParameteri(l.TEXTURE_2D,l.TEXTURE_WRAP_T,l.CLAMP_TO_EDGE)}}else if(h.length>0){if(g&&_){let e=Fe(h[0]);d.texStorage2D(l.TEXTURE_2D,y,u,e.width,e.height)}for(let e=0,t=h.length;e<t;e++)f=h[e],g?v&&d.texSubImage2D(l.TEXTURE_2D,e,0,0,s,c,f):d.texImage2D(l.TEXTURE_2D,e,u,s,c,f);t.generateMipmaps=!1}else if(g){if(_){let t=Fe(e);d.texStorage2D(l.TEXTURE_2D,y,u,t.width,t.height)}v&&d.texSubImage2D(l.TEXTURE_2D,0,0,0,s,c,e)}else d.texImage2D(l.TEXTURE_2D,0,u,s,c,e);D(t)&&O(r),o.__version=a.version,t.onUpdate&&t.onUpdate(t)}e.__version=t.version}function xe(e,t,n){if(t.image.length!==6)return;let r=_e(e,t),i=t.source;d.bindTexture(l.TEXTURE_CUBE_MAP,e.__webglTexture,l.TEXTURE0+n);let a=f.get(i);if(i.version!==a.__version||r===!0){d.activeTexture(l.TEXTURE0+n);let e=_t.getPrimaries(_t.workingColorSpace),o=t.colorSpace===``?null:_t.getPrimaries(t.colorSpace),s=t.colorSpace===``||e===o?l.NONE:l.BROWSER_DEFAULT_WEBGL;d.pixelStorei(l.UNPACK_FLIP_Y_WEBGL,t.flipY),d.pixelStorei(l.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),d.pixelStorei(l.UNPACK_ALIGNMENT,t.unpackAlignment),d.pixelStorei(l.UNPACK_COLORSPACE_CONVERSION_WEBGL,s);let c=t.isCompressedTexture||t.image[0].isCompressedTexture,u=t.image[0]&&t.image[0].isDataTexture,f=[];for(let e=0;e<6;e++)!c&&!u?f[e]=T(t.image[e],!0,p.maxCubemapSize):f[e]=u?t.image[e].image:t.image[e],f[e]=Pe(t,f[e]);let h=f[0],g=m.convert(t.format,t.colorSpace),_=m.convert(t.type),v=A(t.internalFormat,g,_,t.normalized,t.colorSpace),y=t.isVideoTexture!==!0,b=a.__version===void 0||r===!0,x=i.dataReady,S=j(t,h);ge(l.TEXTURE_CUBE_MAP,t);let C;if(c){y&&b&&d.texStorage2D(l.TEXTURE_CUBE_MAP,S,v,h.width,h.height);for(let e=0;e<6;e++){C=f[e].mipmaps;for(let n=0;n<C.length;n++){let r=C[n];t.format===1023?y?x&&d.texSubImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,n,0,0,r.width,r.height,g,_,r.data):d.texImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,n,v,r.width,r.height,0,g,_,r.data):g===null?z(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):y?x&&d.compressedTexSubImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,n,0,0,r.width,r.height,g,r.data):d.compressedTexImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,n,v,r.width,r.height,0,r.data)}}}else{if(C=t.mipmaps,y&&b){C.length>0&&S++;let e=Fe(f[0]);d.texStorage2D(l.TEXTURE_CUBE_MAP,S,v,e.width,e.height)}for(let e=0;e<6;e++)if(u){y?x&&d.texSubImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,0,0,0,f[e].width,f[e].height,g,_,f[e].data):d.texImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,0,v,f[e].width,f[e].height,0,g,_,f[e].data);for(let t=0;t<C.length;t++){let n=C[t].image[e].image;y?x&&d.texSubImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,t+1,0,0,n.width,n.height,g,_,n.data):d.texImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,t+1,v,n.width,n.height,0,g,_,n.data)}}else{y?x&&d.texSubImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,0,0,0,g,_,f[e]):d.texImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,0,v,g,_,f[e]);for(let t=0;t<C.length;t++){let n=C[t];y?x&&d.texSubImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,t+1,0,0,g,_,n.image[e]):d.texImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,t+1,v,g,_,n.image[e])}}}D(t)&&O(l.TEXTURE_CUBE_MAP),a.__version=i.version,t.onUpdate&&t.onUpdate(t)}e.__version=t.version}function Se(e,t,n,r,i,a){let o=m.convert(n.format,n.colorSpace),s=m.convert(n.type),c=A(n.internalFormat,o,s,n.normalized,n.colorSpace),u=f.get(t),p=f.get(n);if(p.__renderTarget=t,!u.__hasExternalTextures){let e=Math.max(1,t.width>>a),n=Math.max(1,t.height>>a);i===l.TEXTURE_3D||i===l.TEXTURE_2D_ARRAY?d.texImage3D(i,a,c,e,n,t.depth,0,o,s,null):d.texImage2D(i,a,c,e,n,0,o,s,null)}d.bindFramebuffer(l.FRAMEBUFFER,e),Ne(t)?g.framebufferTexture2DMultisampleEXT(l.FRAMEBUFFER,r,i,p.__webglTexture,0,Me(t)):(i===l.TEXTURE_2D||i>=l.TEXTURE_CUBE_MAP_POSITIVE_X&&i<=l.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&l.framebufferTexture2D(l.FRAMEBUFFER,r,i,p.__webglTexture,a),d.bindFramebuffer(l.FRAMEBUFFER,null)}function Ce(e,t,n){if(l.bindRenderbuffer(l.RENDERBUFFER,e),t.depthBuffer){let r=t.depthTexture,i=r&&r.isDepthTexture?r.type:null,a=ee(t.stencilBuffer,i),o=t.stencilBuffer?l.DEPTH_STENCIL_ATTACHMENT:l.DEPTH_ATTACHMENT;Ne(t)?g.renderbufferStorageMultisampleEXT(l.RENDERBUFFER,Me(t),a,t.width,t.height):n?l.renderbufferStorageMultisample(l.RENDERBUFFER,Me(t),a,t.width,t.height):l.renderbufferStorage(l.RENDERBUFFER,a,t.width,t.height),l.framebufferRenderbuffer(l.FRAMEBUFFER,o,l.RENDERBUFFER,e)}else{let e=t.textures;for(let r=0;r<e.length;r++){let i=e[r],a=m.convert(i.format,i.colorSpace),o=m.convert(i.type),s=A(i.internalFormat,a,o,i.normalized,i.colorSpace);Ne(t)?g.renderbufferStorageMultisampleEXT(l.RENDERBUFFER,Me(t),s,t.width,t.height):n?l.renderbufferStorageMultisample(l.RENDERBUFFER,Me(t),s,t.width,t.height):l.renderbufferStorage(l.RENDERBUFFER,s,t.width,t.height)}}l.bindRenderbuffer(l.RENDERBUFFER,null)}function we(e,t,n){let r=t.isWebGLCubeRenderTarget===!0;if(d.bindFramebuffer(l.FRAMEBUFFER,e),!(t.depthTexture&&t.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let i=f.get(t.depthTexture);if(i.__renderTarget=t,(!i.__webglTexture||t.depthTexture.image.width!==t.width||t.depthTexture.image.height!==t.height)&&(t.depthTexture.image.width=t.width,t.depthTexture.image.height=t.height,t.depthTexture.needsUpdate=!0),r){if(i.__webglInit===void 0&&(i.__webglInit=!0,t.depthTexture.addEventListener(`dispose`,te)),i.__webglTexture===void 0){i.__webglTexture=l.createTexture(),d.bindTexture(l.TEXTURE_CUBE_MAP,i.__webglTexture),ge(l.TEXTURE_CUBE_MAP,t.depthTexture);let e=m.convert(t.depthTexture.format),n=m.convert(t.depthTexture.type),r;t.depthTexture.format===1026?r=l.DEPTH_COMPONENT24:t.depthTexture.format===1027&&(r=l.DEPTH24_STENCIL8);for(let i=0;i<6;i++)l.texImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+i,0,r,t.width,t.height,0,e,n,null)}}else P(t.depthTexture,0);let a=i.__webglTexture,o=Me(t),s=r?l.TEXTURE_CUBE_MAP_POSITIVE_X+n:l.TEXTURE_2D,c=t.depthTexture.format===1027?l.DEPTH_STENCIL_ATTACHMENT:l.DEPTH_ATTACHMENT;if(t.depthTexture.format===1026)Ne(t)?g.framebufferTexture2DMultisampleEXT(l.FRAMEBUFFER,c,s,a,0,o):l.framebufferTexture2D(l.FRAMEBUFFER,c,s,a,0);else if(t.depthTexture.format===1027)Ne(t)?g.framebufferTexture2DMultisampleEXT(l.FRAMEBUFFER,c,s,a,0,o):l.framebufferTexture2D(l.FRAMEBUFFER,c,s,a,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function Te(e){let t=f.get(e),n=e.isWebGLCubeRenderTarget===!0;if(t.__boundDepthTexture!==e.depthTexture){let n=e.depthTexture;if(t.__depthDisposeCallback&&t.__depthDisposeCallback(),n){let e=()=>{delete t.__boundDepthTexture,delete t.__depthDisposeCallback,n.removeEventListener(`dispose`,e)};n.addEventListener(`dispose`,e),t.__depthDisposeCallback=e}t.__boundDepthTexture=n}if(e.depthTexture&&!t.__autoAllocateDepthBuffer){if(n)for(let n=0;n<6;n++)we(t.__webglFramebuffer[n],e,n);else{let n=e.texture.mipmaps;n&&n.length>0?we(t.__webglFramebuffer[0],e,0):we(t.__webglFramebuffer,e,0)}}else if(n){t.__webglDepthbuffer=[];for(let n=0;n<6;n++)if(d.bindFramebuffer(l.FRAMEBUFFER,t.__webglFramebuffer[n]),t.__webglDepthbuffer[n]===void 0)t.__webglDepthbuffer[n]=l.createRenderbuffer(),Ce(t.__webglDepthbuffer[n],e,!1);else{let r=e.stencilBuffer?l.DEPTH_STENCIL_ATTACHMENT:l.DEPTH_ATTACHMENT,i=t.__webglDepthbuffer[n];l.bindRenderbuffer(l.RENDERBUFFER,i),l.framebufferRenderbuffer(l.FRAMEBUFFER,r,l.RENDERBUFFER,i)}}else{let n=e.texture.mipmaps;if(n&&n.length>0?d.bindFramebuffer(l.FRAMEBUFFER,t.__webglFramebuffer[0]):d.bindFramebuffer(l.FRAMEBUFFER,t.__webglFramebuffer),t.__webglDepthbuffer===void 0)t.__webglDepthbuffer=l.createRenderbuffer(),Ce(t.__webglDepthbuffer,e,!1);else{let n=e.stencilBuffer?l.DEPTH_STENCIL_ATTACHMENT:l.DEPTH_ATTACHMENT,r=t.__webglDepthbuffer;l.bindRenderbuffer(l.RENDERBUFFER,r),l.framebufferRenderbuffer(l.FRAMEBUFFER,n,l.RENDERBUFFER,r)}}d.bindFramebuffer(l.FRAMEBUFFER,null)}function Ee(e,t,n){let r=f.get(e);t!==void 0&&Se(r.__webglFramebuffer,e,e.texture,l.COLOR_ATTACHMENT0,l.TEXTURE_2D,0),n!==void 0&&Te(e)}function De(e){let t=e.texture,n=f.get(e),r=f.get(t);e.addEventListener(`dispose`,M);let i=e.textures,a=e.isWebGLCubeRenderTarget===!0,o=i.length>1;if(o||(r.__webglTexture===void 0&&(r.__webglTexture=l.createTexture()),r.__version=t.version,h.memory.textures++),a){n.__webglFramebuffer=[];for(let e=0;e<6;e++)if(t.mipmaps&&t.mipmaps.length>0){n.__webglFramebuffer[e]=[];for(let r=0;r<t.mipmaps.length;r++)n.__webglFramebuffer[e][r]=l.createFramebuffer()}else n.__webglFramebuffer[e]=l.createFramebuffer()}else{if(t.mipmaps&&t.mipmaps.length>0){n.__webglFramebuffer=[];for(let e=0;e<t.mipmaps.length;e++)n.__webglFramebuffer[e]=l.createFramebuffer()}else n.__webglFramebuffer=l.createFramebuffer();if(o)for(let e=0,t=i.length;e<t;e++){let t=f.get(i[e]);t.__webglTexture===void 0&&(t.__webglTexture=l.createTexture(),h.memory.textures++)}if(e.samples>0&&Ne(e)===!1){n.__webglMultisampledFramebuffer=l.createFramebuffer(),n.__webglColorRenderbuffer=[],d.bindFramebuffer(l.FRAMEBUFFER,n.__webglMultisampledFramebuffer);for(let t=0;t<i.length;t++){let r=i[t];n.__webglColorRenderbuffer[t]=l.createRenderbuffer(),l.bindRenderbuffer(l.RENDERBUFFER,n.__webglColorRenderbuffer[t]);let a=m.convert(r.format,r.colorSpace),o=m.convert(r.type),s=A(r.internalFormat,a,o,r.normalized,r.colorSpace,e.isXRRenderTarget===!0),c=Me(e);l.renderbufferStorageMultisample(l.RENDERBUFFER,c,s,e.width,e.height),l.framebufferRenderbuffer(l.FRAMEBUFFER,l.COLOR_ATTACHMENT0+t,l.RENDERBUFFER,n.__webglColorRenderbuffer[t])}l.bindRenderbuffer(l.RENDERBUFFER,null),e.depthBuffer&&(n.__webglDepthRenderbuffer=l.createRenderbuffer(),Ce(n.__webglDepthRenderbuffer,e,!0)),d.bindFramebuffer(l.FRAMEBUFFER,null)}}if(a){d.bindTexture(l.TEXTURE_CUBE_MAP,r.__webglTexture),ge(l.TEXTURE_CUBE_MAP,t);for(let r=0;r<6;r++)if(t.mipmaps&&t.mipmaps.length>0)for(let i=0;i<t.mipmaps.length;i++)Se(n.__webglFramebuffer[r][i],e,t,l.COLOR_ATTACHMENT0,l.TEXTURE_CUBE_MAP_POSITIVE_X+r,i);else Se(n.__webglFramebuffer[r],e,t,l.COLOR_ATTACHMENT0,l.TEXTURE_CUBE_MAP_POSITIVE_X+r,0);D(t)&&O(l.TEXTURE_CUBE_MAP),d.unbindTexture()}else if(o){for(let t=0,r=i.length;t<r;t++){let r=i[t],a=f.get(r),o=l.TEXTURE_2D;(e.isWebGL3DRenderTarget||e.isWebGLArrayRenderTarget)&&(o=e.isWebGL3DRenderTarget?l.TEXTURE_3D:l.TEXTURE_2D_ARRAY),d.bindTexture(o,a.__webglTexture),ge(o,r),Se(n.__webglFramebuffer,e,r,l.COLOR_ATTACHMENT0+t,o,0),D(r)&&O(o)}d.unbindTexture()}else{let i=l.TEXTURE_2D;if((e.isWebGL3DRenderTarget||e.isWebGLArrayRenderTarget)&&(i=e.isWebGL3DRenderTarget?l.TEXTURE_3D:l.TEXTURE_2D_ARRAY),d.bindTexture(i,r.__webglTexture),ge(i,t),t.mipmaps&&t.mipmaps.length>0)for(let r=0;r<t.mipmaps.length;r++)Se(n.__webglFramebuffer[r],e,t,l.COLOR_ATTACHMENT0,i,r);else Se(n.__webglFramebuffer,e,t,l.COLOR_ATTACHMENT0,i,0);D(t)&&O(i),d.unbindTexture()}e.depthBuffer&&Te(e)}function Oe(e){let t=e.textures;for(let n=0,r=t.length;n<r;n++){let r=t[n];if(D(r)){let t=k(e),n=f.get(r).__webglTexture;d.bindTexture(t,n),O(t),d.unbindTexture()}}}let ke=[],Ae=[];function je(e){if(e.samples>0){if(Ne(e)===!1){let t=e.textures,n=e.width,r=e.height,i=l.COLOR_BUFFER_BIT,a=e.stencilBuffer?l.DEPTH_STENCIL_ATTACHMENT:l.DEPTH_ATTACHMENT,o=f.get(e),s=t.length>1;if(s)for(let e=0;e<t.length;e++)d.bindFramebuffer(l.FRAMEBUFFER,o.__webglMultisampledFramebuffer),l.framebufferRenderbuffer(l.FRAMEBUFFER,l.COLOR_ATTACHMENT0+e,l.RENDERBUFFER,null),d.bindFramebuffer(l.FRAMEBUFFER,o.__webglFramebuffer),l.framebufferTexture2D(l.DRAW_FRAMEBUFFER,l.COLOR_ATTACHMENT0+e,l.TEXTURE_2D,null,0);d.bindFramebuffer(l.READ_FRAMEBUFFER,o.__webglMultisampledFramebuffer);let c=e.texture.mipmaps;c&&c.length>0?d.bindFramebuffer(l.DRAW_FRAMEBUFFER,o.__webglFramebuffer[0]):d.bindFramebuffer(l.DRAW_FRAMEBUFFER,o.__webglFramebuffer);for(let c=0;c<t.length;c++){if(e.resolveDepthBuffer&&(e.depthBuffer&&(i|=l.DEPTH_BUFFER_BIT),e.stencilBuffer&&e.resolveStencilBuffer&&(i|=l.STENCIL_BUFFER_BIT)),s){l.framebufferRenderbuffer(l.READ_FRAMEBUFFER,l.COLOR_ATTACHMENT0,l.RENDERBUFFER,o.__webglColorRenderbuffer[c]);let e=f.get(t[c]).__webglTexture;l.framebufferTexture2D(l.DRAW_FRAMEBUFFER,l.COLOR_ATTACHMENT0,l.TEXTURE_2D,e,0)}l.blitFramebuffer(0,0,n,r,0,0,n,r,i,l.NEAREST),_===!0&&(ke.length=0,Ae.length=0,ke.push(l.COLOR_ATTACHMENT0+c),e.depthBuffer&&e.storeMultisampledDepthBuffer===!1&&(ke.push(a),Ae.push(a),l.invalidateFramebuffer(l.DRAW_FRAMEBUFFER,Ae)),l.invalidateFramebuffer(l.READ_FRAMEBUFFER,ke))}if(d.bindFramebuffer(l.READ_FRAMEBUFFER,null),d.bindFramebuffer(l.DRAW_FRAMEBUFFER,null),s)for(let e=0;e<t.length;e++){d.bindFramebuffer(l.FRAMEBUFFER,o.__webglMultisampledFramebuffer),l.framebufferRenderbuffer(l.FRAMEBUFFER,l.COLOR_ATTACHMENT0+e,l.RENDERBUFFER,o.__webglColorRenderbuffer[e]);let n=f.get(t[e]).__webglTexture;d.bindFramebuffer(l.FRAMEBUFFER,o.__webglFramebuffer),l.framebufferTexture2D(l.DRAW_FRAMEBUFFER,l.COLOR_ATTACHMENT0+e,l.TEXTURE_2D,n,0)}d.bindFramebuffer(l.DRAW_FRAMEBUFFER,o.__webglMultisampledFramebuffer)}else if(e.depthBuffer&&e.storeMultisampledDepthBuffer===!1&&_){let t=e.stencilBuffer?l.DEPTH_STENCIL_ATTACHMENT:l.DEPTH_ATTACHMENT;l.invalidateFramebuffer(l.DRAW_FRAMEBUFFER,[t])}}}function Me(e){return Math.min(p.maxSamples,e.samples)}function Ne(e){let t=f.get(e);return e.samples>0&&u.has(`WEBGL_multisampled_render_to_texture`)===!0&&t.__useRenderToTexture!==!1}function F(e){let t=h.render.frame;y.get(e)!==t&&(y.set(e,t),e.update())}function Pe(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(_t.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&z(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):B(`WebGLTextures: Unsupported texture color space:`,n)),t}function Fe(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(v.width=e.naturalWidth||e.width,v.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(v.width=e.displayWidth,v.height=e.displayHeight):(v.width=e.width,v.height=e.height),v}this.allocateTextureUnit=ce,this.resetTextureUnits=ae,this.getTextureUnits=oe,this.setTextureUnits=se,this.setTexture2D=P,this.setTexture2DArray=ue,this.setTexture3D=de,this.setTextureCube=fe,this.rebindTextures=Ee,this.setupRenderTarget=De,this.updateRenderTargetMipmap=Oe,this.updateMultisampleRenderTarget=je,this.setupDepthRenderbuffer=Te,this.setupFrameBufferTexture=Se,this.useMultisampledRTT=Ne,this.isReversedDepthBuffer=function(){return d.buffers.depth.getReversed()}}function xl(e,t){function n(n,r=``){let i,a=_t.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var Sl=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Cl=`
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

}`,wl=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new Ui(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new J({vertexShader:Sl,fragmentShader:Cl,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new q(new Xi(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Tl=class extends tt{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,u=null,d=null,f=null,p=null,h=null,g=typeof XRWebGLBinding<`u`,_=new wl,v={},b=t.getContextAttributes(),x=null,S=null,C=[],D=[],O=new V,k=null,A=null,ee=new Wa;ee.viewport=new Ot;let j=new Wa;j.viewport=new Ot;let te=[ee,j],M=new Za,ne=null,N=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=C[e];return t===void 0&&(t=new ln,C[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=C[e];return t===void 0&&(t=new ln,C[e]=t),t.getGripSpace()},this.getHand=function(e){let t=C[e];return t===void 0&&(t=new ln,C[e]=t),t.getHandSpace()};function re(e){let t=D.indexOf(e.inputSource);if(t===-1)return;let n=C[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function ie(){r.removeEventListener(`select`,re),r.removeEventListener(`selectstart`,re),r.removeEventListener(`selectend`,re),r.removeEventListener(`squeeze`,re),r.removeEventListener(`squeezestart`,re),r.removeEventListener(`squeezeend`,re),r.removeEventListener(`end`,ie),r.removeEventListener(`inputsourceschange`,ae);for(let e=0;e<C.length;e++){let t=D[e];t!==null&&(D[e]=null,C[e].disconnect(t))}ne=null,N=null,_.reset();for(let e in v)delete v[e];if(e.setRenderTarget(x),p=null,f=null,d=null,r=null,S=null,fe.stop(),n.isPresenting=!1,e.setPixelRatio(k),e.setSize(O.width,O.height,!1),A!==null){let e=A.camera;e.fov=A.fov,e.zoom=A.zoom,e.updateProjectionMatrix(),A=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&z(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&z(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return f===null?p:f},this.getBinding=function(){return d===null&&g&&(d=new XRWebGLBinding(r,t)),d},this.getFrame=function(){return h},this.getSession=function(){return r},this.setSession=async function(u){if(r=u,r!==null){if(x=e.getRenderTarget(),r.addEventListener(`select`,re),r.addEventListener(`selectstart`,re),r.addEventListener(`selectend`,re),r.addEventListener(`squeeze`,re),r.addEventListener(`squeezestart`,re),r.addEventListener(`squeezeend`,re),r.addEventListener(`end`,ie),r.addEventListener(`inputsourceschange`,ae),b.xrCompatible!==!0&&await t.makeXRCompatible(),k=e.getPixelRatio(),e.getSize(O),g&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;b.depth&&(o=b.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=b.stencil?E:T,a=b.stencil?y:m);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};d=this.getBinding(),f=d.createProjectionLayer(s),r.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),S=new At(f.textureWidth,f.textureHeight,{format:w,type:l,depthTexture:new Vi(f.textureWidth,f.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:b.stencil,colorSpace:e.outputColorSpace,samples:b.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}else{let n={antialias:b.antialias,alpha:!0,depth:b.depth,stencil:b.stencil,framebufferScaleFactor:i};p=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),S=new At(p.framebufferWidth,p.framebufferHeight,{format:w,type:l,colorSpace:e.outputColorSpace,stencilBuffer:b.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1,storeMultisampledDepthBuffer:p.ignoreDepthValues===!1,storeMultisampledStencilBuffer:p.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),fe.setContext(r),fe.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function ae(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=D.indexOf(n);r>=0&&(D[r]=null,C[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=D.indexOf(n);if(r===-1){for(let e=0;e<C.length;e++)if(e>=D.length){D.push(n),r=e;break}else if(D[e]===null){D[e]=n,r=e;break}if(r===-1)break}let i=C[r];i&&i.connect(n)}}let oe=new U,se=new U;function ce(e,t,n){oe.setFromMatrixPosition(t.matrixWorld),se.setFromMatrixPosition(n.matrixWorld);let r=oe.distanceTo(se),i=t.projectionMatrix.elements,a=n.projectionMatrix.elements,o=i[14]/(i[10]-1),s=i[14]/(i[10]+1),c=(i[9]+1)/i[5],l=(i[9]-1)/i[5],u=(i[8]-1)/i[0],d=(a[8]+1)/a[0],f=o*u,p=o*d,m=r/(-u+d),h=m*-u;if(t.matrixWorld.decompose(e.position,e.quaternion,e.scale),e.translateX(h),e.translateZ(m),e.matrixWorld.compose(e.position,e.quaternion,e.scale),e.matrixWorldInverse.copy(e.matrixWorld).invert(),i[10]===-1)e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse);else{let t=o+m,n=s+m,i=f-h,a=p+(r-h),u=c*s/n*t,d=l*s/n*t;e.projectionMatrix.makePerspective(i,a,u,d,t,n),e.projectionMatrixInverse.copy(e.projectionMatrix).invert()}}function le(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;_.texture!==null&&(_.depthNear>0&&(t=_.depthNear),_.depthFar>0&&(n=_.depthFar)),M.near=j.near=ee.near=t,M.far=j.far=ee.far=n,(ne!==M.near||N!==M.far)&&(r.updateRenderState({depthNear:M.near,depthFar:M.far}),ne=M.near,N=M.far),M.layers.mask=e.layers.mask|6,ee.layers.mask=M.layers.mask&-5,j.layers.mask=M.layers.mask&-3;let i=e.parent,a=M.cameras;le(M,i);for(let e=0;e<a.length;e++)le(a[e],i);a.length===2?ce(M,ee,j):M.projectionMatrix.copy(ee.projectionMatrix),A===null&&e.isPerspectiveCamera&&(A={camera:e,fov:e.fov,zoom:e.zoom}),P(e,M,i)};function P(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=it*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return M},this.getFoveation=function(){if(f!==null||p!==null)return s},this.setFoveation=function(e){s=e,f!==null&&(f.fixedFoveation=e),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=e)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(M)},this.getCameraTexture=function(e){return v[e]};let ue=null;function de(t,i){if(u=i.getViewerPose(c||a),h=i,u!==null){let t=u.views;p!==null&&(e.setRenderTargetFramebuffer(S,p.framebuffer),e.setRenderTarget(S));let i=!1;t.length!==M.cameras.length&&(M.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(p!==null)a=p.getViewport(r);else{let t=d.getViewSubImage(f,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(S,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(S))}let o=te[n];o===void 0&&(o=new Wa,o.layers.enable(n),o.viewport=new Ot,te[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(M.matrix.copy(o.matrix),M.matrix.decompose(M.position,M.quaternion,M.scale)),i===!0&&M.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&g){d=n.getBinding();let e=d.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&_.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&g){e.state.unbindTexture(),d=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=v[n];e||(e=new Ui,v[n]=e);let t=d.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<C.length;e++){let t=D[e],n=C[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}ue&&ue(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),h=null}let fe=new _o;fe.setAnimationLoop(de),this.setAnimationLoop=function(e){ue=e},this.dispose=function(){}}},El=new G,Dl=new W;Dl.set(-1,0,0,0,1,0,0,0,1);function Ol(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,ia(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(El.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(Dl),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessRange[0],e.iridescenceThicknessMaximum.value=t.iridescenceThicknessRange[1],t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function kl(e,t,n,r){let i={},a={},o=[],s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(e,t){let n=t.program;r.uniformBlockBinding(e,n)}function l(e,n){let o=i[e.id];o===void 0&&(g(e),o=u(e),i[e.id]=o,e.addEventListener(`dispose`,v));let s=n.program;r.updateUBOMapping(e,s);let c=t.render.frame;a[e.id]!==c&&(f(e),a[e.id]=c)}function u(t){let n=d();t.__bindingPointIndex=n;let r=e.createBuffer(),i=t.__size,a=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,r),e.bufferData(e.UNIFORM_BUFFER,i,a),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,n,r),r}function d(){for(let e=0;e<s;e++)if(o.indexOf(e)===-1)return o.push(e),e;return B(`WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.`),0}function f(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)p(t[n],e,n,a);else p(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(t,n,r,i){if(h(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=_(i);m(i,t.__data,e),typeof i!=`number`&&typeof i!=`boolean`&&!i.isMatrix3&&!ArrayBuffer.isView(i)&&(e+=a.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function m(e,t,n){typeof e==`number`||typeof e==`boolean`?t[0]=e:e.isMatrix3?(t[0]=e.elements[0],t[1]=e.elements[1],t[2]=e.elements[2],t[3]=0,t[4]=e.elements[3],t[5]=e.elements[4],t[6]=e.elements[5],t[7]=0,t[8]=e.elements[6],t[9]=e.elements[7],t[10]=e.elements[8],t[11]=0):ArrayBuffer.isView(e)?t.set(new e.constructor(e.buffer,e.byteOffset,t.length)):e.toArray(t,n)}function h(e,t,n,r){let i=e.value,a=t+`_`+n;if(r[a]===void 0)return r[a]=typeof i==`number`||typeof i==`boolean`?i:ArrayBuffer.isView(i)?i.slice():i.clone(),!0;{let e=r[a];if(typeof i==`number`||typeof i==`boolean`){if(e!==i)return r[a]=i,!0}else if(ArrayBuffer.isView(i))return!0;else if(e.equals(i)===!1)return e.copy(i),!0}return!1}function g(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let e=0,t=r.length;e<t;e++){let t=r[e],i=Array.isArray(t.value)?t.value:[t.value];for(let e=0,r=i.length;e<r;e++){let r=i[e],a=_(r),o=n%16,s=o%a.boundary,c=o+s;n+=s,c!==0&&16-c<a.storage&&(n+=16-c),t.__data=new Float32Array(a.storage/Float32Array.BYTES_PER_ELEMENT),t.__offset=n,n+=a.storage}}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function _(e){let t={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(t.boundary=4,t.storage=4):e.isVector2?(t.boundary=8,t.storage=8):e.isVector3||e.isColor?(t.boundary=16,t.storage=12):e.isVector4?(t.boundary=16,t.storage=16):e.isMatrix3?(t.boundary=48,t.storage=48):e.isMatrix4?(t.boundary=64,t.storage=64):e.isTexture?z(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(t.boundary=16,t.storage=e.byteLength):z(`WebGLRenderer: Unsupported uniform value type.`,e),t}function v(t){let n=t.target;n.removeEventListener(`dispose`,v);let r=o.indexOf(n.__bindingPointIndex);o.splice(r,1),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function y(){for(let t in i)e.deleteBuffer(i[t]);o=[],i={},a={}}return{bind:c,update:l,dispose:y}}var Al=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),jl=null;function Ml(){return jl===null&&(jl=new ai(Al,16,16,k,g),jl.name=`DFG_LUT`,jl.minFilter=o,jl.magFilter=o,jl.wrapS=t,jl.wrapT=t,jl.generateMipmaps=!1,jl.needsUpdate=!0),jl}var Nl=class{constructor(e={}){let{canvas:t=Je(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:u=!1,powerPreference:d=`default`,failIfMajorPerformanceCaveat:p=!1,reversedDepthBuffer:h=!1,outputBufferType:b=l}=e;this.isWebGLRenderer=!0;let x;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);x=n.getContextAttributes().alpha}else x=a;let S=b,C=new Set([ee,A,O]),w=new Set([l,m,f,y,_,v]),T=new Uint32Array(4),E=new Int32Array(4),D=new U,k=null,j=null,te=[],M=[],ne=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let N=this,re=!1,ie=null,ae=null,oe=null,se=null;this._outputColorSpace=Re;let ce=0,le=0,P=null,ue=-1,de=null,fe=new Ot,pe=new Ot,me=null,he=new mn(0),ge=0,_e=t.width,ve=t.height,ye=1,be=null,xe=null,Se=new Ot(0,0,_e,ve),Ce=new Ot(0,0,_e,ve),we=!1,Te=new vi,Ee=!1,De=!1,Oe=new G,ke=new U,Ae=new Ot,je={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Me=!1;function Ne(){return P===null?ye:1}let F=n;function Pe(e,n){return t.getContext(e,n)}let Fe,Ie,I,Le,L,R,ze,Be,Ve,He,Ue,Ge,Ke,qe,Ye,Ze,Qe,et,tt,nt,rt,it,at;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:u,powerPreference:d,failIfMajorPerformanceCaveat:p};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r186`),t.addEventListener(`webglcontextlost`,ct,!1),t.addEventListener(`webglcontextrestored`,lt,!1),t.addEventListener(`webglcontextcreationerror`,ut,!1),F===null){let t=`webgl2`;if(F=Pe(t,e),F===null)throw Pe(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}ot()}catch(e){throw t.removeEventListener(`webglcontextlost`,ct,!1),t.removeEventListener(`webglcontextrestored`,lt,!1),t.removeEventListener(`webglcontextcreationerror`,ut,!1),B(`WebGLRenderer: `+e.message),e}function ot(){Fe=new Zo(F),Fe.init(),rt=new xl(F,Fe),Ie=new Eo(F,Fe,e,rt),I=new yl(F,Fe),Ie.reversedDepthBuffer&&h&&I.buffers.depth.setReversed(!0),ae=F.createFramebuffer(),oe=F.createFramebuffer(),se=F.createFramebuffer(),Le=new es(F),L=new $c,R=new bl(F,Fe,I,L,Ie,rt,Le),ze=new Xo(N),Be=new vo(F),it=new wo(F,Be),Ve=new Qo(F,Be,Le,it),He=new ns(F,Ve,Be,it,Le),et=new ts(F,Ie,R),Ye=new Do(L),Ue=new Qc(N,ze,Fe,Ie,it,Ye),Ge=new Ol(N,L),Ke=new rl,qe=new ul(Fe),Qe=new Co(N,ze,I,He,x,s),Ze=new vl(N,He,Ie),at=new kl(F,Le,Ie,I),tt=new To(F,Fe,Le),nt=new $o(F,Fe,Le),Le.programs=Ue.programs,N.capabilities=Ie,N.extensions=Fe,N.properties=L,N.renderLists=Ke,N.shadowMap=Ze,N.state=I,N.info=Le}S!==1009&&(ne=new is(S,t.width,t.height,o,r,i));let st=new Tl(N,F);this.xr=st,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){let e=Fe.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=Fe.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return ye},this.setPixelRatio=function(e){e!==void 0&&(ye=e,this.setSize(_e,ve,!1))},this.getSize=function(e){return e.set(_e,ve)},this.setSize=function(e,n,r=!0){if(st.isPresenting){z(`WebGLRenderer: Can't change size while VR device is presenting.`);return}_e=e,ve=n,t.width=Math.floor(e*ye),t.height=Math.floor(n*ye),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),ne!==null&&ne.setSize(t.width,t.height),this.setViewport(0,0,e,n)},this.getDrawingBufferSize=function(e){return e.set(_e*ye,ve*ye).floor()},this.setDrawingBufferSize=function(e,n,r){_e=e,ve=n,ye=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(S===1009){B(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);return}if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){z(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}ne.setEffects(e||[])},this.getCurrentViewport=function(e){return e.copy(fe)},this.getViewport=function(e){return e.copy(Se)},this.setViewport=function(e,t,n,r){e.isVector4?Se.set(e.x,e.y,e.z,e.w):Se.set(e,t,n,r),I.viewport(fe.copy(Se).multiplyScalar(ye).round())},this.getScissor=function(e){return e.copy(Ce)},this.setScissor=function(e,t,n,r){e.isVector4?Ce.set(e.x,e.y,e.z,e.w):Ce.set(e,t,n,r),I.scissor(pe.copy(Ce).multiplyScalar(ye).round())},this.getScissorTest=function(){return we},this.setScissorTest=function(e){I.setScissorTest(we=e)},this.setOpaqueSort=function(e){be=e},this.setTransparentSort=function(e){xe=e},this.getClearColor=function(e){return e.copy(Qe.getClearColor())},this.setClearColor=function(){Qe.setClearColor(...arguments)},this.getClearAlpha=function(){return Qe.getClearAlpha()},this.setClearAlpha=function(){Qe.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(P!==null){let t=P.texture.format;e=C.has(t)}if(e){let e=P.texture.type,t=w.has(e),n=Qe.getClearColor(),r=Qe.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(T[0]=i,T[1]=a,T[2]=o,T[3]=r,F.clearBufferuiv(F.COLOR,0,T)):(E[0]=i,E[1]=a,E[2]=o,E[3]=r,F.clearBufferiv(F.COLOR,0,E))}else r|=F.COLOR_BUFFER_BIT}t&&(r|=F.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&F.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),ie=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,ct,!1),t.removeEventListener(`webglcontextrestored`,lt,!1),t.removeEventListener(`webglcontextcreationerror`,ut,!1),Qe.dispose(),Ke.dispose(),qe.dispose(),L.dispose(),ze.dispose(),He.dispose(),it.dispose(),at.dispose(),Ue.dispose(),st.dispose(),st.removeEventListener(`sessionstart`,mt),st.removeEventListener(`sessionend`,ht),gt.stop()};function ct(e){e.preventDefault(),Xe(`WebGLRenderer: Context Lost.`),re=!0}function lt(){Xe(`WebGLRenderer: Context Restored.`),re=!1;let e=Le.autoReset,t=Ze.enabled,n=Ze.autoUpdate,r=Ze.needsUpdate,i=Ze.type;ot(),Le.autoReset=e,Ze.enabled=t,Ze.autoUpdate=n,Ze.needsUpdate=r,Ze.type=i}function ut(e){B(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function V(e){let t=e.target;t.removeEventListener(`dispose`,V),H(t)}function H(e){dt(e),L.remove(e)}function dt(e){let t=L.get(e).programs;t!==void 0&&(t.forEach(function(e){Ue.releaseProgram(e)}),e.isShaderMaterial&&Ue.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=je);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=Dt(e,t,n,r,i);I.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=Ve.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;it.setup(i,r,s,n,c);let h,g=tt;if(c!==null&&(h=Be.get(c),g=nt,g.setIndex(h)),i.isMesh)r.wireframe===!0?(I.setLineWidth(r.wireframeLinewidth*Ne()),g.setMode(F.LINES)):g.setMode(F.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),I.setLineWidth(e*Ne()),i.isLineSegments?g.setMode(F.LINES):i.isLineLoop?g.setMode(F.LINE_LOOP):g.setMode(F.LINE_STRIP)}else i.isPoints?g.setMode(F.POINTS):i.isSprite&&g.setMode(F.TRIANGLES);if(i.isBatchedMesh){if(Fe.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?Be.get(c).bytesPerElement:1,o=L.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(F,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function ft(e,t,n,r){ie!==null&&e.isNodeMaterial&&ie.setObject(r,e),Ee===!0&&Ye.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,Ct(e,t,r),e.side=0,e.needsUpdate=!0,Ct(e,t,r),e.side=2):Ct(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),ie!==null&&ie.renderStart(e,t,n),j=qe.get(n),j.init(t),M.push(j),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(j.pushLight(e),e.castShadow&&j.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(j.pushLight(e),e.castShadow&&j.pushShadow(e))}),j.setupLights(),ie!==null&&ie.updateLights(j.state.lightsArray),De=this.localClippingEnabled,Ee=Ye.init(this.clippingPlanes,De),Ee===!0&&Ye.setGlobalState(this.clippingPlanes,t),ie!==null&&Ze.render(j.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];ft(o,n,t,e),r.add(o)}else ft(i,n,t,e),r.add(i)}}),j=M.pop(),ie!==null&&ie.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){if(r.forEach(function(e){let t=L.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0){t(e);return}setTimeout(n,10)}Fe.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let W=null;function pt(e){W&&W(e)}function mt(){gt.stop()}function ht(){gt.start()}let gt=new _o;gt.setAnimationLoop(pt),typeof self<`u`&&gt.setContext(self),this.setAnimationLoop=function(e){W=e,st.setAnimationLoop(e),e===null?gt.stop():gt.start()},st.addEventListener(`sessionstart`,mt),st.addEventListener(`sessionend`,ht),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){B(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(re===!0)return;ie!==null&&ie.renderStart(e,t);let n=st.enabled===!0&&st.isPresenting===!0,r=ne!==null&&(P===null||n)&&ne.begin(N,P);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),st.enabled===!0&&st.isPresenting===!0&&(ne===null||ne.isCompositing()===!1)&&(st.cameraAutoUpdate===!0&&st.updateCamera(t),t=st.getCamera()),e.isScene===!0&&e.onBeforeRender(N,e,t,P),j=qe.get(e,M.length),j.init(t),j.state.textureUnits=R.getTextureUnits(),M.push(j),Oe.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),Te.setFromProjectionMatrix(Oe,We,t.reversedDepth),De=this.localClippingEnabled,Ee=Ye.init(this.clippingPlanes,De),k=Ke.get(e,te.length),k.init(),te.push(k),st.enabled===!0&&st.isPresenting===!0){let e=N.xr.getDepthSensingMesh();e!==null&&vt(e,t,-1/0,N.sortObjects)}vt(e,t,0,N.sortObjects),k.finish(),ie!==null&&ie.updateLights(j.state.lightsArray),N.sortObjects===!0&&k.sort(be,xe),Me=st.enabled===!1||st.isPresenting===!1||st.hasDepthSensing()===!1,Me&&Qe.addToRenderList(k,e),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),Ee===!0&&Ye.beginShadows();let i=j.state.shadowsArray;if(Ze.render(i,e,t),Ee===!0&&Ye.endShadows(),(r&&ne.hasRenderPass())===!1){let n=k.opaque,r=k.transmissive;if(j.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];bt(n,r,e,a)}Me&&Qe.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];yt(k,e,n,n.viewport)}}else r.length>0&&bt(n,r,e,t),Me&&Qe.render(e),yt(k,e,t)}P!==null&&le===0&&(R.updateMultisampleRenderTarget(P),R.updateRenderTargetMipmap(P)),r&&ne.end(N),e.isScene===!0&&e.onAfterRender(N,e,t),it.resetDefaultState(),ue=-1,de=null,M.pop(),M.length>0?(j=M[M.length-1],R.setTextureUnits(j.state.textureUnits),Ee===!0&&Ye.setGlobalState(N.clippingPlanes,j.state.camera)):j=null,te.pop(),k=te.length>0?te[te.length-1]:null,ie!==null&&ie.renderEnd()};function vt(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLightProbeGrid)j.pushLightProbeGrid(e);else if(e.isLight)j.pushLight(e),e.castShadow&&j.pushShadow(e);else if(e.isSprite){if(!e.frustumCulled||e.intersectsFrustum(Te)){r&&Ae.setFromMatrixPosition(e.matrixWorld).applyMatrix4(Oe);let i=He.update(e),a=e.material;a.visible&&k.push(e,i,a,n,Ae.z,null,t)}}else if((e.isMesh||e.isLine||e.isPoints)&&(!e.frustumCulled||e.intersectsFrustum(Te))){let i=He.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),Ae.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),Ae.copy(e.boundingSphere.center)),Ae.applyMatrix4(e.matrixWorld).applyMatrix4(Oe)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&k.push(e,i,c,n,Ae.z,s,t)}}else a.visible&&k.push(e,i,a,n,Ae.z,null,t)}}let i=e.children;for(let e=0,a=i.length;e<a;e++)vt(i[e],t,n,r)}function yt(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;j.setupLightsView(n),Ee===!0&&Ye.setGlobalState(N.clippingPlanes,n),r&&I.viewport(fe.copy(r)),i.length>0&&xt(i,t,n),a.length>0&&xt(a,t,n),o.length>0&&xt(o,t,n),I.buffers.depth.setTest(!0),I.buffers.depth.setMask(!0),I.buffers.color.setMask(!0),I.setPolygonOffset(!1)}function bt(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(j.state.transmissionRenderTarget[r.id]===void 0){let e=Fe.has(`EXT_color_buffer_half_float`)||Fe.has(`EXT_color_buffer_float`);j.state.transmissionRenderTarget[r.id]=new At(1,1,{generateMipmaps:!0,type:e?g:l,minFilter:c,samples:Math.max(4,Ie.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:_t.workingColorSpace})}let a=j.state.transmissionRenderTarget[r.id],o=r.viewport||fe;a.setSize(o.z*N.transmissionResolutionScale,o.w*N.transmissionResolutionScale);let s=N.getRenderTarget(),u=N.getActiveCubeFace(),d=N.getActiveMipmapLevel();N.setRenderTarget(a),N.getClearColor(he),ge=N.getClearAlpha(),ge<1&&N.setClearColor(16777215,.5),N.clear(),Me&&Qe.render(n);let f=N.toneMapping;N.toneMapping=0;let p=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),j.setupLightsView(r),Ee===!0&&Ye.setGlobalState(N.clippingPlanes,r),xt(e,n,r),R.updateMultisampleRenderTarget(a),R.updateRenderTargetMipmap(a),Fe.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,St(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(R.updateMultisampleRenderTarget(a),R.updateRenderTargetMipmap(a))}N.setRenderTarget(s,u,d),N.setClearColor(he,ge),p!==void 0&&(r.viewport=p),N.toneMapping=f}function xt(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&St(o,t,n,s,l,c)}}function St(e,t,n,r,i,a){ie!==null&&i.isNodeMaterial&&ie.setObject(e,i),e.onBeforeRender(N,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(N,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,N.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,N.renderBufferDirect(n,t,r,i,e,a),i.side=2):N.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(N,t,n,r,i,a)}function Ct(e,t,n){t.isScene!==!0&&(t=je);let r=L.get(e),i=j.state.lights,a=j.state.shadowsArray,o=i.state.version,s=Ue.getParameters(e,i.state,a,t,n,j.state.lightProbeGridArray),c=Ue.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=ze.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,V),l=new Map,r.programs=l);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return Tt(e,s),d}else s.uniforms=Ue.getUniforms(e),ie!==null&&e.isNodeMaterial&&ie.build(e,n,s),e.onBeforeCompile(s,N),d=Ue.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=Ye.uniform),Tt(e,s),r.needsLights=jt(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.lightProbeGrid=j.state.lightProbeGridArray.length>0,r.currentProgram=d,r.uniformsList=null,d}function wt(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=dc.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function Tt(e,t){let n=L.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function Et(e,t){if(e.length===0)return null;if(e.length===1)return e[0].texture===null?null:e[0];D.setFromMatrixPosition(t.matrixWorld);for(let t=0,n=e.length;t<n;t++){let n=e[t];if(n.texture!==null&&n.boundingBox.containsPoint(D))return n}return null}function Dt(e,t,n,r,i){t.isScene!==!0&&(t=je),R.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=P===null?N.outputColorSpace:P.isXRRenderTarget===!0?P.texture.colorSpace:_t.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=ze.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(P===null||P.isXRRenderTarget===!0)&&(h=N.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=L.get(r),y=j.state.lights;if(Ee===!0&&(De===!0||e!==de)){let t=e===de&&r.id===ue;Ye.setState(r,e,t)}let b=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==y.state.version?b=!0:v.outputColorSpace===s?i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?b=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==Ye.numPlanes||v.numIntersection!==Ye.numIntersection)?b=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.toneMapping===h&&v.morphTargetsCount===_?!!v.lightProbeGrid!=j.state.lightProbeGridArray.length>0&&(b=!0):b=!0:b=!0:b=!0:(b=!0,v.__version=r.version);let x=v.currentProgram;b===!0&&(x=Ct(r,t,i),ie&&r.isNodeMaterial&&ie.onUpdateProgram(r,x,v));let S=!1,C=!1,w=!1,T=x.getUniforms(),E=v.uniforms;if(I.useProgram(x.program)&&(S=!0,C=!0,w=!0),r.id!==ue&&(ue=r.id,C=!0),v.needsLights){let e=Et(j.state.lightProbeGridArray,i);v.lightProbeGrid!==e&&(v.lightProbeGrid=e,C=!0)}if(S||de!==e){I.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),T.setValue(F,`projectionMatrix`,e.projectionMatrix),T.setValue(F,`viewMatrix`,e.matrixWorldInverse);let t=T.map.cameraPosition;t!==void 0&&t.setValue(F,ke.setFromMatrixPosition(e.matrixWorld)),Ie.logarithmicDepthBuffer&&T.setValue(F,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&T.setValue(F,`isOrthographic`,e.isOrthographicCamera===!0),de!==e&&(de=e,C=!0,w=!0)}if(v.needsLights&&(y.state.sunShadowMap.length>0&&T.setValue(F,`sunShadowMap`,y.state.sunShadowMap,R),y.state.directionalShadowMap.length>0&&T.setValue(F,`directionalShadowMap`,y.state.directionalShadowMap,R),y.state.spotShadowMap.length>0&&T.setValue(F,`spotShadowMap`,y.state.spotShadowMap,R),y.state.pointShadowMap.length>0&&T.setValue(F,`pointShadowMap`,y.state.pointShadowMap,R)),i.isSkinnedMesh){T.setOptional(F,i,`bindMatrix`),T.setOptional(F,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),T.setValue(F,`boneTexture`,e.boneTexture,R))}i.isBatchedMesh&&(T.setOptional(F,i,`batchingTexture`),T.setValue(F,`batchingTexture`,i._matricesTexture,R),T.setOptional(F,i,`batchingIdTexture`),T.setValue(F,`batchingIdTexture`,i._indirectTexture,R),T.setOptional(F,i,`batchingColorTexture`),i._colorsTexture!==null&&T.setValue(F,`batchingColorTexture`,i._colorsTexture,R));let D=n.morphAttributes;if((D.position!==void 0||D.normal!==void 0||D.color!==void 0)&&et.update(i,n,x),(C||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,T.setValue(F,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(E.envMapIntensity.value=t.environmentIntensity),E.dfgLUT!==void 0&&(E.dfgLUT.value=Ml()),C){if(T.setValue(F,`toneMappingExposure`,N.toneMappingExposure),v.needsLights&&kt(E,w),a&&r.fog===!0&&Ge.refreshFogUniforms(E,a),Ge.refreshMaterialUniforms(E,r,ye,ve,j.state.transmissionRenderTarget[e.id]),v.needsLights&&v.lightProbeGrid){let e=v.lightProbeGrid;E.probesSH.value=e.texture,E.probesMin.value.copy(e.boundingBox.min),E.probesMax.value.copy(e.boundingBox.max),E.probesResolution.value.copy(e.resolution)}dc.upload(F,wt(v),E,R)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(dc.upload(F,wt(v),E,R),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&T.setValue(F,`center`,i.center),T.setValue(F,`modelViewMatrix`,i.modelViewMatrix),T.setValue(F,`normalMatrix`,i.normalMatrix),T.setValue(F,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];at.update(n,x),at.bind(n,x)}}return x}function kt(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function jt(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return ce},this.getActiveMipmapLevel=function(){return le},this.getRenderTarget=function(){return P},this.setRenderTargetTextures=function(e,t,n){let r=L.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),L.get(e.texture).__webglTexture=t,L.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=L.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){P=e,ce=t,le=n;let r=null,i=!1,a=!1;if(e){let o=L.get(e);if(o.__useDefaultFramebuffer!==void 0){I.bindFramebuffer(F.FRAMEBUFFER,o.__webglFramebuffer),fe.copy(e.viewport),pe.copy(e.scissor),me=e.scissorTest,I.viewport(fe),I.scissor(pe),I.setScissorTest(me),ue=-1;return}if(o.__webglFramebuffer===void 0)R.setupRenderTarget(e);else if(o.__hasExternalTextures)R.rebindTextures(e,L.get(e.texture).__webglTexture,L.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&L.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);R.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=L.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&R.useMultisampledRTT(e)===!1?L.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,fe.copy(e.viewport),pe.copy(e.scissor),me=e.scissorTest}else fe.copy(Se).multiplyScalar(ye).floor(),pe.copy(Ce).multiplyScalar(ye).floor(),me=we;if(n!==0&&(r=ae),I.bindFramebuffer(F.FRAMEBUFFER,r)&&I.drawBuffers(e,r),I.viewport(fe),I.scissor(pe),I.setScissorTest(me),i){let r=L.get(e.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=L.get(e.textures[t]);F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=L.get(e.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,t.__webglTexture,n)}ue=-1};function Mt(e){let t=L.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=Ie.textureFormatReadable(e.format),t.__typeReadable=Ie.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){B(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=L.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){I.bindFramebuffer(F.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&F.readBuffer(F.COLOR_ATTACHMENT0+s);let u=Mt(o);if(u.__formatReadable===!1){B(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){B(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&F.readPixels(t,n,r,i,rt.convert(c),rt.convert(l),a)}finally{let e=P===null?null:L.get(P).__webglFramebuffer;I.bindFramebuffer(F.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=L.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){I.bindFramebuffer(F.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&F.readBuffer(F.COLOR_ATTACHMENT0+s);let d=Mt(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=F.createBuffer();F.bindBuffer(F.PIXEL_PACK_BUFFER,f),F.bufferData(F.PIXEL_PACK_BUFFER,a.byteLength,F.STREAM_READ),F.readPixels(t,n,r,i,rt.convert(l),rt.convert(u),0),F.bindBuffer(F.PIXEL_PACK_BUFFER,null);let p=P===null?null:L.get(P).__webglFramebuffer;I.bindFramebuffer(F.FRAMEBUFFER,p);let m=F.fenceSync(F.SYNC_GPU_COMMANDS_COMPLETE,0);return F.flush(),await $e(F,m,4),F.bindBuffer(F.PIXEL_PACK_BUFFER,f),F.getBufferSubData(F.PIXEL_PACK_BUFFER,0,a),F.bindBuffer(F.PIXEL_PACK_BUFFER,null),F.deleteBuffer(f),F.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;R.setTexture2D(e,0),F.copyTexSubImage2D(F.TEXTURE_2D,n,0,0,o,s,i,a),I.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=rt.convert(t.format),_=rt.convert(t.type),v;t.isData3DTexture?(R.setTexture3D(t,0),v=F.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(R.setTexture2DArray(t,0),v=F.TEXTURE_2D_ARRAY):(R.setTexture2D(t,0),v=F.TEXTURE_2D),I.activeTexture(F.TEXTURE0),I.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,t.flipY),I.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),I.pixelStorei(F.UNPACK_ALIGNMENT,t.unpackAlignment);let y=I.getParameter(F.UNPACK_ROW_LENGTH),b=I.getParameter(F.UNPACK_IMAGE_HEIGHT),x=I.getParameter(F.UNPACK_SKIP_PIXELS),S=I.getParameter(F.UNPACK_SKIP_ROWS),C=I.getParameter(F.UNPACK_SKIP_IMAGES);I.pixelStorei(F.UNPACK_ROW_LENGTH,h.width),I.pixelStorei(F.UNPACK_IMAGE_HEIGHT,h.height),I.pixelStorei(F.UNPACK_SKIP_PIXELS,l),I.pixelStorei(F.UNPACK_SKIP_ROWS,u),I.pixelStorei(F.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=L.get(e),r=L.get(t),h=L.get(n.__renderTarget),g=L.get(r.__renderTarget);I.bindFramebuffer(F.READ_FRAMEBUFFER,h.__webglFramebuffer),I.bindFramebuffer(F.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,L.get(e).__webglTexture,i,d+n),F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,L.get(t).__webglTexture,a,m+n)),F.blitFramebuffer(l,u,o,s,f,p,o,s,F.DEPTH_BUFFER_BIT,F.NEAREST);I.bindFramebuffer(F.READ_FRAMEBUFFER,null),I.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||L.has(e)){let n=L.get(e),r=L.get(t);I.bindFramebuffer(F.READ_FRAMEBUFFER,oe),I.bindFramebuffer(F.DRAW_FRAMEBUFFER,se);for(let e=0;e<c;e++)w?F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):F.framebufferTexture2D(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,n.__webglTexture,i),T?F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):F.framebufferTexture2D(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,r.__webglTexture,a),i===0?T?F.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):F.copyTexSubImage2D(v,a,f,p,l,u,o,s):F.blitFramebuffer(l,u,o,s,f,p,o,s,F.COLOR_BUFFER_BIT,F.NEAREST);I.bindFramebuffer(F.READ_FRAMEBUFFER,null),I.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?F.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?F.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):F.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):F.texSubImage2D(F.TEXTURE_2D,a,f,p,o,s,g,_,h);I.pixelStorei(F.UNPACK_ROW_LENGTH,y),I.pixelStorei(F.UNPACK_IMAGE_HEIGHT,b),I.pixelStorei(F.UNPACK_SKIP_PIXELS,x),I.pixelStorei(F.UNPACK_SKIP_ROWS,S),I.pixelStorei(F.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps&&F.generateMipmap(v),I.unbindTexture()},this.initRenderTarget=function(e){L.get(e).__webglFramebuffer===void 0&&R.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?R.setTextureCube(e,0):e.isData3DTexture?R.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?R.setTexture2DArray(e,0):R.setTexture2D(e,0),I.unbindTexture()},this.resetState=function(){ce=0,le=0,P=null,I.reset(),it.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return We}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=_t._getDrawingBufferColorSpace(e),t.unpackColorSpace=_t._getUnpackColorSpace()}},Pl=149597870700,Fl=9460730472580800,Z=0x6da012f95c9e88,Il=1e3*Z,Ll=1e6*Z,Rl=299792458,zl=86400;365.25*zl;var Bl=2451545,Vl=Math.PI/180,Hl=0x731c14d0a13578000,Ul=-26.74,Wl=4.831,Gl=5772,Kl=6957e5;function ql(e){let t=Math.abs(e);return t<1e3?`${e.toFixed(1)} m`:t<1e7?`${(e/1e3).toFixed(t<1e5?2:0)} km`:t<14959787070?`${(e/1e3).toExponential(3).replace(`e+`,`×10^`)} km`:t<473036523629040?`${(e/Pl).toFixed(t<1495978707e3?4:2)} AU`:t<0x834b443d5de46000?`${(e/Fl).toFixed(t<94607304725808e3?3:1)} ly`:t<3085677581491367e7?`${(e/Il).toFixed(2)} kpc`:`${(e/Ll).toFixed(2)} Mpc`}function Jl(e){let t=Math.abs(e);return t<1e3?`${e.toFixed(1)} m/s`:t<2997924.58?`${(e/1e3).toFixed(t<1e5?2:0)} km/s`:t<29979245800?`${(e/Rl).toFixed(3)} c`:t<0x834b443d5de46000?`${(e/Fl).toFixed(3)} ly/s`:t<3085677581491367e7?`${(e/Z).toFixed(1)} pc/s`:`${(e/Ll).toFixed(3)} Mpc/s`}var Yl=Math.PI;function Xl(e){return Yl*10**(-.4*(e-Ul))}function Zl(e){return Ul-2.5*Math.log10(e/Yl)}function Ql(e){return(Math.sin(e)+(Math.PI-e)*Math.cos(e))/Math.PI}var $l=(e,t=1)=>Yl*t*Pl*Pl/(e*e);function eu(e){let t=(e-442)*(e<442?.0624:.0374),n=(e-599.8)*(e<599.8?.0264:.0323),r=(e-501.1)*(e<501.1?.049:.0382);return .362*Math.exp(-.5*t*t)+1.056*Math.exp(-.5*n*n)-.065*Math.exp(-.5*r*r)}function tu(e){let t=(e-568.8)*(e<568.8?.0213:.0247),n=(e-530.9)*(e<530.9?.0613:.0322);return .821*Math.exp(-.5*t*t)+.286*Math.exp(-.5*n*n)}function nu(e){let t=(e-437)*(e<437?.0845:.0278),n=(e-459)*(e<459?.0385:.0725);return 1.217*Math.exp(-.5*t*t)+.681*Math.exp(-.5*n*n)}function ru(e){let t=0,n=0,r=0;for(let i=380;i<=780;i+=5){let a=i*1e-9,o=1/(a**5*Math.expm1(19864458571489286e-41/(a*1380649e-29*e)));t+=o*eu(i),n+=o*tu(i),r+=o*nu(i)}return[t,n,r]}function iu([e,t,n]){let r=3.2404542*e-1.5371385*t-.4985314*n,i=-.969266*e+1.8760108*t+.041556*n,a=.0556434*e-.2040259*t+1.0572252*n;return[Math.max(r,0),Math.max(i,0),Math.max(a,0)]}function au(e){let[t,n,r]=iu(ru(e)),i=Math.max(t,n,r);return[t/i,n/i,r/i]}function ou(e,t=5772){let n=ru(e),r=iu(n),i=su(r)||1;return{rgb:[r[0]/i,r[1]/i,r[2]/i],relY:n[1]/ru(t)[1]}}var su=e=>.2126*e[0]+.7152*e[1]+.0722*e[2],cu=1e3,lu=5e4;function uu(e){let t=(Math.log(e)-Math.log(cu))/(Math.log(lu)-Math.log(cu));return Math.min(1,Math.max(0,t))}function du(e){return Math.exp(Math.log(cu)+e*(Math.log(lu)-Math.log(cu)))}function fu(e=256){let t=new Uint8Array(e*4);for(let n=0;n<e;n++){let r=au(du(n/(e-1))),i=su(r);for(let e=0;e<3;e++)t[n*4+e]=Math.round(Math.min(1,r[e]/i*.5)*255);t[n*4+3]=255}return t}var pu=32.184,mu=[[1972,1,1,10]],hu=[];function gu(e){mu=e.slice().sort((e,t)=>bu(e[0],e[1],e[2])-bu(t[0],t[1],t[2])),hu=mu.map(([e,t,n])=>bu(e,t,n))}function _u(e){let t=mu[0][3];for(let n=0;n<hu.length;n++)e>=hu[n]&&(t=mu[n][3]);return t}function vu(e){return e+(_u(e)+pu)/zl}function yu(e){let t=e-69.184/zl;for(let n=0;n<2;n++)t=e-(_u(t)+pu)/zl;return t}function bu(e,t,n){let r=Math.floor((14-t)/12),i=e+4800-r,a=t+12*r-3;return Math.floor(n)+Math.floor((153*a+2)/5)+365*i+Math.floor(i/4)-Math.floor(i/100)+Math.floor(i/400)-32045-.5+(n-Math.floor(n))}function xu(e){let t=Math.floor(e+.5),n=e+.5-t,r=t+32044,i=Math.floor((4*r+3)/146097),a=r-Math.floor(146097*i/4),o=Math.floor((4*a+3)/1461),s=a-Math.floor(1461*o/4),c=Math.floor((5*s+2)/153),l=s-Math.floor((153*c+2)/5)+1,u=c+3-12*Math.floor(c/10),d=100*i+o-4800+Math.floor(c/10),f=n*zl,p=Math.floor(f/3600);f-=p*3600;let m=Math.floor(f/60);return f-=m*60,{year:d,month:u,day:l,hour:p,minute:m,second:f}}function Su(e){return e.getTime()/864e5+2440587.5}function Cu(e){let t=xu(yu(e)),n=(e,t=2)=>String(Math.floor(e)).padStart(t,`0`);return`${t.year<0?`-${n(-t.year,4)}`:n(t.year,4)}-${n(t.month)}-${n(t.day)} ${n(t.hour)}:${n(t.minute)}:${n(t.second)} UTC`}var wu=class e{jdTdb;rate=1;paused=!1;constructor(e){this.jdTdb=e}static now(){return new e(vu(Su(new Date)))}advance(e){this.paused||(this.jdTdb+=e*this.rate/zl)}setUtcNow(){this.jdTdb=vu(Su(new Date))}},Q={uPullIn:{value:0},uDepthK:{value:1}},Tu={uLite:{value:0}};function Eu(e){return Number.isFinite(e)&&e<1e30?Math.log2(e+1)/Math.log2(1e30):1}var Du=`  gl_Position /= max(abs(gl_Position.w), 1.0);`,Ou=`
uniform float uPullIn;
uniform float uDepthK;
float gTrueDepth;
vec4 projectView(vec4 mv) {
  gTrueDepth = -mv.z;
  if (uPullIn > 0.0 && gTrueDepth > uPullIn) mv.xyz *= uPullIn / gTrueDepth;
  return projectionMatrix * mv;
}
`,ku=`
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  vFragDepth = uDepthK < 1.0 ? exp2(log2(1.0 + max(gTrueDepth, 0.0)) * uDepthK) : 1.0 + max(gTrueDepth, 0.0);
#endif
`,Au=`
#include <tonemapping_fragment>
#include <colorspace_fragment>
`,ju=`
// column density (m) of an exponential layer from radius r towards zenith-angle cosine mu, to infinity
float sunColumn(float r, float mu, float H, float Rp) {
  float c = sqrt(1.5707963 * r / H);
  float rho = exp(-(r - Rp) / H);
  if (mu >= 0.0) return H * rho * c / ((c - 1.0) * mu + 1.0);
  float s = sqrt(max(0.0, 1.0 - mu * mu));
  float r0 = r * s;
  if (r0 < Rp) return 1.0e12; // the planet is in the way
  float c0 = sqrt(1.5707963 * r0 / H);
  float rho0 = exp(-(r0 - Rp) / H);
  return H * (2.0 * c0 * rho0 - rho * c / ((c - 1.0) * (-mu) + 1.0));
}
`,Mu=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${ku}
}`,Nu=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uO;          // camera position in the scaled planet frame (m)
uniform mat3 uToBody;     // world direction -> scaled planet frame
uniform vec3 uSun;        // Sun direction, scaled planet frame
uniform float uRp;        // planet (equatorial) radius, m
uniform float uRt;        // top of the atmosphere, m
uniform vec3 uBetaR;      // Rayleigh scattering (= extinction) at the reference level, 1/m
uniform float uHR;
uniform vec3 uBetaMs;     // Mie scattering, 1/m
uniform vec3 uBetaMe;     // Mie extinction, 1/m
uniform float uHM;
uniform vec3 uG;          // Mie asymmetry per channel
uniform float uSunIrr;
uniform vec3 uSunColor;
uniform float uExposure;
uniform float uGroundMix; // 1 = full aerial perspective over the disk; <1 when the map already shows the atmosphere
uniform int uSteps;
varying vec3 vWorld;
${ju}
vec2 hitSphere(vec3 o, vec3 d, float R) {
  // robust for |o| >> R: discriminant from the perpendicular distance
  float b = dot(o, d);
  vec3 perp = cross(o, d);
  float disc = R * R - dot(perp, perp);
  if (disc < 0.0) return vec2(1.0, -1.0);
  float s = sqrt(disc);
  return vec2(-b - s, -b + s);
}
void main() {
  vec3 d = normalize(uToBody * normalize(vWorld));
  vec2 ta = hitSphere(uO, d, uRt);
  if (ta.y <= 0.0 || ta.x > ta.y) discard;
  float t0 = max(ta.x, 0.0);
  float t1 = ta.y;
  vec2 tp = hitSphere(uO, d, uRp);
  bool ground = tp.x <= tp.y && tp.y > 0.0;
  if (ground) t1 = min(t1, max(tp.x, 0.0));
  float ds = (t1 - t0) / float(uSteps);
  float mu = dot(d, uSun);
  float pR = 0.0596831 * (1.0 + mu * mu);
  vec3 g2 = uG * uG;
  vec3 pM = 0.0795775 * (1.0 - g2) / pow(max(1.0 + g2 - 2.0 * uG * mu, 1e-4), vec3(1.5));
  float odR = 0.0, odM = 0.0;
  vec3 sum = vec3(0.0);
  for (int i = 0; i < 32; i++) {
    if (i >= uSteps) break;
    vec3 p = uO + d * (t0 + (float(i) + 0.5) * ds);
    float r = length(p);
    float h = r - uRp;
    float rR = exp(-h / uHR) * ds;
    float rM = exp(-h / uHM) * ds;
    odR += 0.5 * rR; odM += 0.5 * rM;
    float muS = dot(p, uSun) / r;
    float cR = sunColumn(r, muS, uHR, uRp);
    if (cR < 1.0e11) {
      float cM = sunColumn(r, muS, uHM, uRp);
      vec3 T = exp(-(uBetaR * (odR + cR) + uBetaMe * (odM + cM)));
      sum += T * (uBetaR * rR * pR + uBetaMs * rM * pM);
    }
    odR += 0.5 * rR; odM += 0.5 * rM;
  }
  vec3 Tview = exp(-(uBetaR * odR + uBetaMe * odM));
  float k = ground ? uGroundMix : 1.0;
  vec3 L = sum * uSunIrr * uSunColor * k;
  float alpha = (1.0 - dot(Tview, vec3(0.3333))) * k;
  gl_FragColor = vec4(min(L * uExposure, vec3(6.0e4)), clamp(alpha, 0.0, 1.0));
${Au}
  #include <logdepthbuf_fragment>
}`,Pu=Nu.replace(`varying vec3 vWorld;`,`varying vec3 vPosView;`).replace(`  vec3 d = normalize(uToBody * normalize(vWorld));
  vec2 ta = hitSphere(uO, d, uRt);
  if (ta.y <= 0.0 || ta.x > ta.y) discard;
  float t0 = max(ta.x, 0.0);
  float t1 = ta.y;
  vec2 tp = hitSphere(uO, d, uRp);
  bool ground = tp.x <= tp.y && tp.y > 0.0;
  if (ground) t1 = min(t1, max(tp.x, 0.0));`,`  vec3 pe = uToBody * vPosView;
  float te = length(pe);
  vec3 d = pe / te;
  vec2 ta = hitSphere(uO, d, uRt);
  if (ta.y <= 0.0 || ta.x > ta.y || ta.x > te) discard;
  float t0 = max(ta.x, 0.0);
  float t1 = min(ta.y, te);
  bool ground = true;`),Fu=1380649e-29,Iu=166053907e-35,Lu=[5802e-9,13558e-9,331e-7],Ru=101325/(Fu*288.15),zu={N2:1,CO2:2.35,H2:.2},Bu=(e,t)=>[e[0]*t,e[1]*t,e[2]*t];function Vu(e,t){let n=(e,t,n)=>Bu(Lu,e*1e5/(Fu*t)/Ru*zu[n]),r=t[e.name];switch(e.name){case`Earth`:{let e=r.scaleHeightKm*1e3;return{betaR:n(r.surfacePressureBar,288.15,`N2`),HR:e,betaMs:[3996e-9,3996e-9,3996e-9],betaMe:[444e-8,444e-8,444e-8],HM:1200,g:[.8,.8,.8],top:1e5,groundMix:1,surfaceTransmittance:!0}}case`Mars`:{let e=r.scaleHeightKm*1e3,t=.5/e;return{betaR:n(r.surfacePressureBar,r.temperatureK,`CO2`),HR:e,betaMe:[t,t,t],betaMs:[t*.95,t*.85,t*.62],HM:e,g:[.63,.68,.76],top:12e4,groundMix:1,surfaceTransmittance:!0}}case`Venus`:return{betaR:n(.1,240,`CO2`),HR:r.scaleHeightKm*1e3,betaMs:[25e-7,25e-7,24e-7],betaMe:[26e-7,26e-7,26e-7],HM:5e3,g:[.7,.7,.7],top:16e4,groundMix:.3,surfaceTransmittance:!1};case`Titan`:{let t=e.gm/(e.radius*e.radius),r=Fu*93.7/(28*Iu*t),i=1.2/65e3;return{betaR:n(1.467,93.7,`N2`),HR:r,betaMe:[i*.75,i,i*1.35],betaMs:[i*.75*.95,i*.85,i*1.35*.55],HM:65e3,g:[.62,.62,.62],top:65e4,groundMix:.35,surfaceTransmittance:!1}}case`Jupiter`:case`Saturn`:case`Uranus`:case`Neptune`:{let e=r.scaleHeightKm*1e3;return{betaR:n(1,r.temperatureK,`H2`),HR:e,betaMs:[0,0,0],betaMe:[0,0,0],HM:e,g:[.7,.7,.7],top:9*e,groundMix:.12,surfaceTransmittance:!1}}default:return null}}function Hu(e,t,n){let r=Fu*t/(29*Iu*n);return{betaR:Bu(Lu,e*1e5/(Fu*t)/Ru),HR:r,betaMs:Bu([3996e-9,3996e-9,3996e-9],e),betaMe:Bu([444e-8,444e-8,444e-8],e),HM:r/8500*1200,g:[.8,.8,.8],top:12*r,groundMix:1,surfaceTransmittance:!0}}var Uu=class{system;data;exposure;sunColor;group=new sn;shells=new Map;geo=new Qi(1,96,48);steps=16;constructor(e,t,n,r){this.system=e,this.data=t,this.exposure=n,this.sunColor=r,this.group.name=`atmospheres`}spec(e){return this.shells.get(e)?.spec??Vu(e,this.data)}shell(e){let t=this.shells.get(e);if(t)return t;let n=Vu(e,this.data);return n?this.makeShell(e,e.name,e.radii[0],n):null}makeShell(e,t,n,r){let i,a=new J({vertexShader:Mu,fragmentShader:Nu,uniforms:{uO:{value:new U},uToBody:{value:new W},uSun:{value:new U},uRp:{value:n},uRt:{value:n+r.top},uBetaR:{value:new U(...r.betaR)},uHR:{value:r.HR},uBetaMs:{value:new U(...r.betaMs)},uBetaMe:{value:new U(...r.betaMe)},uHM:{value:r.HM},uG:{value:new U(...r.g)},uSunIrr:{value:Math.PI},uSunColor:{value:new U(...this.sunColor)},uExposure:this.exposure,uGroundMix:{value:r.groundMix},uSteps:{value:this.steps},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK},transparent:!0,depthWrite:!1,blending:5,blendSrc:201,blendDst:205}),o=new q(this.geo,a);return o.matrixAutoUpdate=!1,o.frustumCulled=!1,o.renderOrder=19.8,o.name=`${t} atmosphere`,this.group.add(o),i={body:e,spec:r,mesh:o,mat:a},this.shells.set(e,i),i}updateExo(e){for(let t of e){let e=this.shells.get(t.key)??this.makeShell(t.key,t.name,t.radius,t.spec),n=e.mat.uniforms;n.uSteps.value=this.steps;let r=new W().setFromMatrix4(t.orient).transpose();n.uToBody.value.copy(r),n.uO.value.copy(t.rel).negate().applyMatrix3(r),n.uSun.value.copy(t.sunDir).applyMatrix3(r).normalize(),n.uSunIrr.value=t.sunIrr,n.uSunColor.value.copy(t.sunColor);let i=t.radius+e.spec.top,a=n.uO.value.length()<i*1.002;e.mat.side!==+!!a&&(e.mat.side=+!!a,e.mat.depthTest=!a,e.mat.needsUpdate=!0),e.mesh.matrix.copy(t.orient).scale(new U(i,i,i)).setPosition(t.rel),e.mesh.matrixWorldNeedsUpdate=!0,e.mesh.visible=!0}let t=new Set(e.map(e=>e.key));for(let[e,n]of this.shells)n.mesh.name.endsWith(`atmosphere`)&&!this.system.bodies.includes(e)&&!t.has(e)&&(this.group.remove(n.mesh),n.mat.dispose(),this.shells.delete(e))}material(e){let t=this.shells.get(e);return t&&t.mesh.visible?t.mat:null}warmupObjects(){let e=[];for(let t of this.system.bodies){let n=this.shell(t);n&&e.push(n.mesh)}return e}update(e,t){let n=this.system.sun.upos.sub(e,new U),r=new W,i=new G,a=new U;for(let e of this.shells.values())e.mesh.visible=!1;for(let[e,o]of t){if(!o.resolved||o.pixelRadius<2.5)continue;let t=this.shell(e);if(!t)continue;let s=e.radii[0],c=s/e.radii[2],l=t.mat.uniforms;l.uSteps.value=this.steps,r.setFromMatrix4(e.orientation);let u=r.clone().transpose(),d=new W().set(1,0,0,0,1,0,0,0,c);l.uToBody.value.copy(d).multiply(u),l.uO.value.copy(o.rel).negate().applyMatrix3(l.uToBody.value);let f=a.copy(n).sub(o.rel),p=f.length();l.uSun.value.copy(f).divideScalar(p).applyMatrix3(l.uToBody.value).normalize(),l.uSunIrr.value=$l(p);let m=s+t.spec.top,h=l.uO.value.length()<m*1.002;t.mat.side!==+!!h&&(t.mat.side=+!!h,t.mat.depthTest=!h,t.mat.needsUpdate=!0),i.copy(e.orientation).scale(a.set(m,m,m/c)).setPosition(o.rel),t.mesh.matrix.copy(i),t.mesh.matrixWorldNeedsUpdate=!0,t.mesh.visible=!0}}},Wu=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${ku}
}`,Gu=`
precision highp float;
#include <common>
#include <logdepthbuf_pars_fragment>
uniform samplerCube uEnv;
uniform sampler2D uLut;      // blackbody: rgb chromaticity (luminance 1), a = log10(Y / Y_sun)
uniform vec3 uO;             // eye (rig origin) relative to the hole, in rs
uniform float uRs;           // metres per rs
uniform vec3 uN;             // disk normal (unit)
uniform vec3 uE1;            // disk plane basis (texture angle)
uniform vec3 uE2;
uniform float uRin;          // disk inner / outer radius (rs); uRout = 0: no disk
uniform float uRout;
uniform float uTmax;         // peak disk temperature (K)
uniform float uSunDisk;      // radiance of the Sun's disk (engine units)
uniform float uExposure;
uniform float uTime;
uniform int uMaxSteps;
uniform float uStepK;
uniform float uDiskSeed;     // per-hole look of the gas
uniform float uSpiral;       // strength of spiral arms (tidal spiral shocks in binaries)
uniform float uArms;
uniform float uStreakFreq;
uniform float uAngFreq;
uniform float uWarp;
varying vec3 vWorld;

const float LUT_LOG_MIN = 2.5;
const float LUT_LOG_SPAN = 5.5;

vec3 planck(float T) {
  float x = clamp((log2(max(T, 1.0)) * 0.30103 - LUT_LOG_MIN) / LUT_LOG_SPAN, 0.0, 1.0);
  vec4 t = texture2D(uLut, vec2(x * (255.0 / 256.0) + 0.5 / 256.0, 0.5));
  return t.rgb * exp2(t.a * 3.3219281);
}

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
// Streaky gas: noise on (angle on a circle, log r), stretched along the orbit, advected with a
// slowed-down Keplerian angular speed. Two layers cross-fade so the shear never winds up.
float streaks(float lr, float ang, float seed) {
  float n = 0.0, amp = 0.6, fr = 1.0;
  // warp the radius a little so streaks wander instead of forming perfect circles
  lr += uWarp * 0.12 * (vnoise(vec3(cos(ang) * 1.3, sin(ang) * 1.3, lr * 2.0 + seed + uDiskSeed)) - 0.5);
  for (int o = 0; o < 3; o++) {
    vec3 q = vec3(cos(ang) * uAngFreq * fr, sin(ang) * uAngFreq * fr, lr * uStreakFreq * fr + seed + uDiskSeed);
    n += amp * vnoise(q);
    amp *= 0.5; fr *= 2.3;
  }
  return n;
}
float diskTexture(float r, float ang) {
  float lr = log(r);
  float w = 1.4 * pow(uRin / r, 1.5);           // rad/s, inner edge fastest
  float P = 14.0;
  float p1 = fract(uTime / P), p2 = fract(uTime / P + 0.5);
  float n1 = streaks(lr, ang - w * p1 * P, 0.0);
  float n2 = streaks(lr, ang - w * p2 * P, 37.0);
  float n = n1 * (1.0 - abs(2.0 * p1 - 1.0)) + n2 * (1.0 - abs(2.0 * p2 - 1.0));
  float t = smoothstep(0.15, 0.95, n);
  // logarithmic spiral arms (pitch ~15 degrees), turning slowly
  float sp = 0.5 + 0.5 * cos(uArms * (ang - lr / 0.27 - uTime * 0.05 + uDiskSeed));
  return t * mix(1.0, 0.35 + 1.3 * sp * sp, uSpiral);
}

// Light from the disk where the traced ray crosses it at P (rs) moving along k (eye -> scene).
vec4 diskHit(vec3 P, vec3 k, float r) {
  if (r < uRin * 0.8 || r > uRout) return vec4(0.0);
  float x = r / uRin;
  float prof = x > 1.0 ? pow(x, -0.75) * pow(1.0 - inversesqrt(x), 0.25) / 0.48795 : 0.0;
  float T = uTmax * prof;
  vec3 vdir = normalize(cross(uN, P));
  float beta = min(sqrt(0.5 / max(r - 1.0, 0.5)), 0.995);
  float gam = inversesqrt(1.0 - beta * beta);
  float g = sqrt(max(1.0 - 1.0 / r, 1e-4)) / (gam * (1.0 - beta * dot(vdir, -k)));
  float ang = atan(dot(P, uE2), dot(P, uE1));
  float tex = diskTexture(r, ang);
  float edge = smoothstep(uRin * 0.95, uRin * 1.25, r) * (1.0 - smoothstep(uRout * 0.45, uRout, r));
  // dense near the hole, thinning outwards so the lensed sky shows through the outer disk
  float tau = 7.0 * pow(x, -0.85) * (0.2 + 1.3 * tex);
  float a = (1.0 - exp(-tau)) * edge;
  vec3 L = planck(T * g) * (0.6 + 0.8 * tex);
  L = max(mix(vec3(dot(L, vec3(0.2126, 0.7152, 0.0722))), L, 1.3), 0.0);  // a little more saturated, like the stars
  return vec4(L * (uSunDisk * uExposure), a);
}

void composite(inout vec3 acc, inout float tr, vec4 e) {
  acc += tr * e.a * e.rgb;
  tr *= 1.0 - e.a;
}

void main() {
  vec3 d = normalize(vWorld - cameraPosition);
  vec3 O = uO + cameraPosition / uRs;
  float r0 = max(length(O), 1.0001);
  vec3 acc = vec3(0.0);
  float tr = 1.0;
  float esc = 1.0;
  vec3 dirOut = d;
  bool hasDisk = uRout > 0.0;

  vec3 Lv = cross(O, d);
  float b = length(Lv);
  if (r0 > 30.0 && b > 30.0) {
    // weak field: straight line to the closest approach Q, deflected there towards the hole
    float tc = -dot(O, d);
    vec3 Q = O + d * tc;
    float cosPsi = -dot(O, d) / r0;
    float frac = 0.5 * (1.0 + cosPsi);
    float alpha = frac * (2.0 / b + 2.9452431 / (b * b));
    vec3 toward = -Q / max(length(Q), 1e-6);
    dirOut = normalize(cos(alpha) * d + sin(alpha) * toward);
    if (hasDisk) {
      float dn = dot(d, uN);
      vec3 start = O;
      if (tc > 0.0 && abs(dn) > 1e-6) {
        float t = -dot(O, uN) / dn;
        if (t > 0.0 && t < tc) { vec3 P = O + d * t; composite(acc, tr, diskHit(P, d, length(P))); }
      }
      if (tc > 0.0) start = Q;
      float dn2 = dot(dirOut, uN);
      if (abs(dn2) > 1e-6) {
        float t = -dot(start, uN) / dn2;
        if (t > 0.0) { vec3 P = start + dirOut * t; composite(acc, tr, diskHit(P, dirOut, length(P))); }
      }
    }
  } else {
    // strong field: integrate the photon orbit in its plane
    vec3 e1 = O / r0;
    vec3 tv = d - dot(d, e1) * e1;
    float tl = length(tv);
    vec3 e2 = tl > 1e-6 ? tv / tl : normalize(cross(e1, abs(e1.z) < 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0)));
    float u = 1.0 / r0;
    float du = -u * dot(d, e1) / max(tl, 1e-6);
    float A = dot(uN, e1), B = dot(uN, e2);
    float phiC = 1e9;
    if (hasDisk && abs(A) + abs(B) > 1e-6) {
      phiC = mod(atan(-A, B), PI);
      if (phiC < 1e-5) phiC += PI;
    }
    float phi = 0.0;
    bool done = false;
    esc = 0.0;
    for (int i = 0; i < 400; i++) {
      if (i >= uMaxSteps || tr < 0.01) break;
      float h = uStepK * mix(0.12, 0.035, smoothstep(0.02, 0.45, u));
      // RK4 on (u, du/dphi)
      float k1u = du,                   k1v = -u + 1.5 * u * u;
      float uu = u + 0.5 * h * k1u;
      float k2u = du + 0.5 * h * k1v,  k2v = -uu + 1.5 * uu * uu;
      uu = u + 0.5 * h * k2u;
      float k3u = du + 0.5 * h * k2v,  k3v = -uu + 1.5 * uu * uu;
      uu = u + h * k3u;
      float k4u = du + h * k3v,         k4v = -uu + 1.5 * uu * uu;
      float u1 = u + h / 6.0 * (k1u + 2.0 * k2u + 2.0 * k3u + k4u);
      float du1 = du + h / 6.0 * (k1v + 2.0 * k2v + 2.0 * k3v + k4v);
      if (phiC < phi + h) {
        float s = (phiC - phi) / h;
        float s2 = s * s, s3 = s2 * s;
        float uc = (2.0 * s3 - 3.0 * s2 + 1.0) * u + (s3 - 2.0 * s2 + s) * h * du + (-2.0 * s3 + 3.0 * s2) * u1 + (s3 - s2) * h * du1;
        if (uc > 0.0 && uc < 1.0) {
          float duc = mix(du, du1, s);
          vec3 rh = cos(phiC) * e1 + sin(phiC) * e2;
          vec3 ph = -sin(phiC) * e1 + cos(phiC) * e2;
          vec3 k = normalize(rh * (-duc / uc) * inversesqrt(max(1.0 - uc, 1e-4)) + ph);
          composite(acc, tr, diskHit(rh / uc, k, 1.0 / uc));
        }
        phiC += PI;
      }
      if (u1 <= 0.0) {
        float phiOut = phi + h * u / (u - u1);
        dirOut = cos(phiOut) * e1 + sin(phiOut) * e2;
        esc = 1.0;
        done = true;
        break;
      }
      if (u1 >= 1.0) { done = true; break; }
      u = u1; du = du1; phi += h;
    }
    if (!done && u < 0.08) {
      // out of steps far from the hole: finish along the flat-space solution u = u cos + du sin
      float phiOut = phi + atan(u, -du);
      dirOut = cos(phiOut) * e1 + sin(phiOut) * e2;
      esc = 1.0;
    }
  }
  vec3 bg = textureCube(uEnv, dirOut).rgb;
  vec3 col = min(acc + tr * esc * bg, vec3(6.0e4));
  gl_FragColor = vec4(col, 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,Ku=(Pl/Kl)**2,qu=2.5,Ju=5.5,Yu=2,Xu=1e7,Zu=class{holes;exposure;reversedDepth;group=new sn;views=[];vr=!1;meshes=[];geo=new Qi(1,64,32);env;cubeCam;lut;face=0;fullCapture=!0;relY=new Map;constructor(e,t,n=!1){this.holes=e,this.exposure=t,this.reversedDepth=n,this.group.name=`black-holes`,this.lut=$u(),this.env=Qu(1024),this.cubeCam=new Xa(1e3,1e30,this.env)}material(){return new J({name:`black-hole`,vertexShader:Wu,fragmentShader:Gu,uniforms:{uEnv:{value:this.env.texture},uLut:{value:this.lut},uO:{value:new U},uRs:{value:1},uN:{value:new U(0,0,1)},uE1:{value:new U(1,0,0)},uE2:{value:new U(0,1,0)},uRin:{value:3},uRout:{value:0},uTmax:{value:1e4},uSunDisk:{value:Ku},uExposure:this.exposure,uTime:{value:0},uMaxSteps:{value:220},uStepK:{value:1},uDiskSeed:{value:0},uSpiral:{value:0},uArms:{value:2},uStreakFreq:{value:9},uAngFreq:{value:2.2},uWarp:{value:.5},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK},transparent:!0,blending:0,depthTest:!0,depthWrite:!0})}mesh(e){for(;this.meshes.length<=e;){let e=new q(this.geo,this.material());e.matrixAutoUpdate=!1,e.frustumCulled=!1,e.renderOrder=30,e.name=`black-hole-${this.meshes.length}`,this.group.add(e),this.meshes.push(e)}return this.meshes[e]}warmupObjects(){return[this.mesh(0)]}relLuminance(e){let t=Math.round(Math.log10(e)*50),n=this.relY.get(t);return n===void 0&&(n=ou(10**(t/50)).relY,this.relY.set(t,n)),n}update(e,t,n){let r=[],i=new U;for(let n of this.holes){n.upos.sub(e,i);let a=i.length(),o=n.radius,s=Math.max(Math.min(Math.max(4/t,60),4e5),n.diskOuter/o*1.05)*o,c=a<s*1.05;if((c?1/0:Math.asin(s/a)/t)<1.5)continue;let l=e=>Math.asin(Math.min(1,e/Math.max(a,e*1.0001)))/t;r.push({bh:n,rel:i.clone(),dist:a,region:s,inside:c,shadowPx:l(2.6*o),innerDiskPx:n.diskOuter>0?l(Math.min(20*o,n.diskOuter)):0,diskRadiance:n.diskOuter>0?Ku*this.relLuminance(n.diskTmax):0})}r.sort((e,t)=>e.dist/e.bh.radius-t.dist/t.bh.radius),this.views=r.slice(0,Yu);for(let e of this.meshes)e.visible=!1;this.views.forEach((e,t)=>{let r=this.mesh(t),i=r.material,a=i.uniforms,o=e.bh,s=o.radius,c=e.region;e.inside?(r.matrix.makeScale(Xu,Xu,Xu),i.side!==1&&(i.side=1,i.depthFunc=+!this.reversedDepth,i.needsUpdate=!0)):(r.matrix.makeScale(c,c,c).setPosition(e.rel),i.side!==0&&(i.side=0,i.depthFunc=3,i.needsUpdate=!0)),r.matrixWorldNeedsUpdate=!0,r.visible=!0,a.uO.value.copy(e.rel).multiplyScalar(-1/s),a.uRs.value=s;let l=o.diskNormal;a.uN.value.copy(l);let u=new U().crossVectors(l,Math.abs(l.z)<.9?new U(0,0,1):new U(1,0,0)).normalize();a.uE1.value.copy(u),a.uE2.value.crossVectors(l,u),a.uRin.value=o.diskInner/s,a.uRout.value=o.diskOuter/s,a.uTmax.value=o.diskTmax;let d=o.diskLook;a.uDiskSeed.value=d.seed,a.uSpiral.value=d.spiral,a.uArms.value=d.arms,a.uStreakFreq.value=d.streakFreq,a.uAngFreq.value=d.angFreq,a.uWarp.value=d.warp,a.uTime.value=n,a.uMaxSteps.value=this.vr?90:220,a.uStepK.value=this.vr?1.5:1,a.uEnv.value=this.env.texture})}capture(e,t,n,r){if(!this.views.length){this.fullCapture=!0;return}let i=this.vr?512:1024;this.env.width!==i&&(this.env.dispose(),this.env=Qu(i),this.cubeCam.renderTarget=this.env,this.fullCapture=!0),this.cubeCam.coordinateSystem!==e.coordinateSystem&&(this.cubeCam.coordinateSystem=e.coordinateSystem,this.cubeCam.updateCoordinateSystem()),this.cubeCam.updateMatrixWorld(!0);let a=this.fullCapture?[0,1,2,3,4,5]:[this.face];this.fullCapture=!1,this.face=(this.face+1)%6;let o=e.getRenderTarget(),s=e.getActiveCubeFace(),c=e.getActiveMipmapLevel(),l=e.xr.enabled,u={sa:r.uPixelSA.value,dpr:r.uDpr.value,pull:Q.uPullIn.value,dk:Q.uDepthK.value},d=[this.group,...n],f=d.map(e=>e.visible);for(let e of d)e.visible=!1;e.xr.enabled=!1,r.uPixelSA.value=(2/i)**2,r.uDpr.value=1,Q.uPullIn.value=0,Q.uDepthK.value=1;for(let n of a)this.env.texture.generateMipmaps=n===a[a.length-1],e.setRenderTarget(this.env,n),e.clear(!0,!0,!0),e.render(t,this.cubeCam.children[n]);r.uPixelSA.value=u.sa,r.uDpr.value=u.dpr,Q.uPullIn.value=u.pull,Q.uDepthK.value=u.dk,d.forEach((e,t)=>{e.visible=f[t]}),e.xr.enabled=l,e.setRenderTarget(o,s,c)}};function Qu(e){return new Yo(e,{type:g,generateMipmaps:!0,minFilter:c,magFilter:o,depthBuffer:!0})}function $u(){let e=new Uint16Array(1024);for(let t=0;t<256;t++){let{rgb:n,relY:r}=ou(10**(qu+Ju*t/255));e[t*4]=Xn.toHalfFloat(n[0]),e[t*4+1]=Xn.toHalfFloat(n[1]),e[t*4+2]=Xn.toHalfFloat(n[2]),e[t*4+3]=Xn.toHalfFloat(Math.log10(Math.max(r,1e-30)))}let n=new ai(e,256,1,w,g);return n.minFilter=o,n.magFilter=o,n.wrapS=n.wrapT=t,n.needsUpdate=!0,n}var ed=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
uniform float uLumpy;     // irregular shape of small bodies (relative radius variation)
uniform float uSeed;
varying vec3 vNormalBF;   // body-fixed unit normal
varying vec3 vTerrN;      // body-fixed normal of the landing terrain (render/TerrainPatch.ts)
varying float vSun;       // terrain only: clearance of the Sun over the relief (penumbra widths)
varying vec3 vLocal;      // terrain only: body-fixed position relative to the patch origin (m)
varying vec3 vPosView;    // camera-relative world position (m)
varying vec2 vUv;
float vh3(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(vh3(i), vh3(i + vec3(1,0,0)), f.x), mix(vh3(i + vec3(0,1,0)), vh3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(vh3(i + vec3(0,0,1)), vh3(i + vec3(1,0,1)), f.x), mix(vh3(i + vec3(0,1,1)), vh3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  vNormalBF = normalize(position);
  vTerrN = vNormalBF;
  vSun = 1.0;
  vLocal = vec3(0.0);
  vUv = uv;
  vec3 pos = position;
  if (uLumpy > 0.0) {
    vec3 n = normalize(position);
    float l = 0.6 * vn3(n * 1.3 + uSeed) + 0.3 * vn3(n * 2.9 + uSeed * 1.7) + 0.1 * vn3(n * 6.1 + uSeed * 2.3);
    pos *= 1.0 + uLumpy * (l - 0.5) * 2.0;
  }
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  vPosView = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${ku}
}`,td=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform sampler2D uMap;
uniform float uHasMap;
uniform float uMapGray;
uniform sampler2D uNight;
uniform float uHasNight;
uniform sampler2D uClouds;
uniform float uHasClouds;
uniform float uCloudShift;    // texture-space longitude offset of the cloud layer
uniform float uCloudVis;      // 1 from orbit, 0 below the clouds
uniform sampler2D uRelief;    // R,G = tangent-space normal (east, north); B = water mask
uniform float uHasRelief;
uniform float uWater;         // 1 if the relief map's B channel is a water mask
uniform vec3 uColor;          // base colour (linear) for map-less bodies
uniform float uAlbedoScale;   // multiplies texture (linear) to obtain reflectance
uniform float uAirless;       // 1 = Lommel-Seeliger, 0 = Lambert
uniform float uBands;         // 1 = procedural gas-giant banding
uniform float uSeed;
uniform float uProc;          // 1 = procedural surface (bodies without a map)
uniform float uIcy;           // 0 rock .. 1 ice (bright, cracked, fresh crater rays)
uniform vec3 uTint;           // secondary colour of the surface's variegation
uniform float uCraters;       // crater density 0..1
uniform float uLumpy;
uniform float uRadiusM;       // mean radius (m), for bump heights
uniform float uMapW;          // map width (texels) for close-up detail; 0 = none
uniform sampler2D uDetail;     // tiles of the map around the view (render/TileDetail.ts)
uniform vec4 uDetailRect;      // map-UV window of uDetail: u0, v0, du, dv (u wraps)
uniform float uDetailOn;
uniform float uLite;           // 1 in VR: fewer crater layers
uniform float uTerrain;        // 1 = drawing the landing terrain (render/TerrainPatch.ts)
uniform float uHScale;         // terrain relief scale (fades in on descent)
uniform vec3 uHoleDir;         // sphere only: body-fixed centre of the terrain patch
uniform float uHoleCos;        // ... and the cosine of its angular radius (2 = no hole)
// terrain only: fine crater lattices (cells of 400, 90, 20, 4.5 m) at the patch origin, split into
// integer and fractional cells so float32 keeps metre precision far from the body's centre
uniform vec3 uOI0; uniform vec3 uOF0; uniform vec3 uOI1; uniform vec3 uOF1;
uniform vec3 uOI2; uniform vec3 uOF2; uniform vec3 uOI3; uniform vec3 uOF3;
uniform vec3 uSunDir;         // world-space unit vector body -> Sun
uniform float uSunIrr;        // solar irradiance at the body (PI at 1 AU)
uniform vec3 uSunColor;
uniform float uExposure;
uniform mat3 uBodyToWorld;    // rotation part (unit) body-fixed -> world
uniform vec3 uBodyCenter;     // camera-relative centre (m)
// eclipses: up to four bodies that can stand between this one and the Sun
uniform vec4 uOcc[4];         // camera-relative centre (m), radius (m)
uniform vec4 uOccRed;         // 1 for an occluder whose atmosphere bends red light into its shadow
uniform float uOccN;
uniform vec3 uSunRel;         // camera-relative Sun centre (m)
uniform float uSunR;          // solar radius (m)
// Ring shadow (Saturn)
uniform float uHasRings;
uniform sampler2D uRingTex;
uniform vec2 uRingRadii;      // inner, outer (in body radius units)
// Sunlight transmitted through the atmosphere (reddened at the terminator)
uniform float uAtmo;
uniform float uRp;
uniform vec3 uBetaR;
uniform float uHR;
uniform vec3 uBetaMe;
uniform float uHM;
varying vec3 vNormalBF;
varying vec3 vTerrN;
varying float vSun;
varying vec3 vLocal;
varying vec3 vPosView;
varying vec2 vUv;
${ju}
vec3 srgbToLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }

float hash1(float n) { return fract(sin(n) * 43758.5453123); }
float noise1(float x) { float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(hash1(i), hash1(i + 1.0), f); }
float bh3(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
vec3 bh33(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453123);
}
float bn3(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(bh3(i), bh3(i + vec3(1,0,0)), f.x), mix(bh3(i + vec3(0,1,0)), bh3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(bh3(i + vec3(0,0,1)), bh3(i + vec3(1,0,1)), f.x), mix(bh3(i + vec3(0,1,1)), bh3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float bfbm(vec3 p) { return 0.5 * bn3(p) + 0.3 * bn3(p * 2.03 + 3.1) + 0.2 * bn3(p * 4.1 + 7.7); }
// value noise on a lattice given as integer cells ci plus a local offset r (precise far from the origin)
float bnAt(vec3 ci, vec3 r) {
  vec3 i = ci + floor(r); vec3 f = fract(r); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(bh3(i), bh3(i + vec3(1,0,0)), f.x), mix(bh3(i + vec3(0,1,0)), bh3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(bh3(i + vec3(0,0,1)), bh3(i + vec3(1,0,1)), f.x), mix(bh3(i + vec3(0,1,1)), bh3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
// One scale of craters on the unit sphere: height (radius units) and freshness (bright ejecta).
// Only the 2x2x2 block of cells nearest to the point is visited (crater influence stays within
// half a cell: radius <= 0.36, rim out to 1.35 radii), 8 cells instead of 27.
float craters(vec3 p, float freq, float seed, float density, out float fresh) {
  vec3 q = p * freq + seed;
  vec3 i = floor(q), f = fract(q);
  vec3 b = step(0.5, f) - 1.0;
  float h = 0.0;
  fresh = 0.0;
  for (int x = 0; x <= 1; x++) for (int y = 0; y <= 1; y++) for (int z = 0; z <= 1; z++) {
    vec3 g = b + vec3(float(x), float(y), float(z));
    vec3 c = i + g;
    if (bh3(c + 11.0) > density) continue;
    vec3 o = bh33(c) * 0.6 + 0.2;
    float rc = 0.14 + 0.22 * bh3(c + 5.0);
    float d = length(g + o - f) / rc;
    if (d > 1.35) continue;
    float bowl = d < 1.0 ? (d * d - 1.0) * 0.55 : 0.0;
    float rim = 0.22 * exp(-pow((d - 1.0) / 0.22, 2.0));
    h += (bowl + rim) * rc / freq;
    fresh = max(fresh, bh3(c + 23.0) * (1.0 - smoothstep(0.7, 1.5, d)));
  }
  return h;
}
// The same craters on a lattice given as integer cell ci plus a small offset r (cell units);
// returns height in cell units.
float cratersAt(vec3 ci, vec3 r, float density, out float fresh) {
  vec3 i = ci + floor(r), f = fract(r);
  vec3 b = step(0.5, f) - 1.0;
  float h = 0.0;
  fresh = 0.0;
  for (int x = 0; x <= 1; x++) for (int y = 0; y <= 1; y++) for (int z = 0; z <= 1; z++) {
    vec3 g = b + vec3(float(x), float(y), float(z));
    vec3 c = i + g;
    if (bh3(c + 11.0) > density) continue;
    vec3 o = bh33(mod(c, 4096.0)) * 0.6 + 0.2;
    float rc = 0.14 + 0.22 * bh3(c + 5.0);
    float d = length(g + o - f) / rc;
    if (d > 1.35) continue;
    float bowl = d < 1.0 ? (d * d - 1.0) * 0.55 : 0.0;
    float rim = 0.22 * exp(-pow((d - 1.0) / 0.22, 2.0));
    h += (bowl + rim) * rc;
    fresh = max(fresh, bh3(c + 23.0) * (1.0 - smoothstep(0.7, 1.5, d)));
  }
  return h;
}
// Area of overlap of two discs of radii r1, r2 whose centres are d apart.
float discOverlap(float r1, float r2, float d) {
  if (d >= r1 + r2) return 0.0;
  if (d <= abs(r1 - r2)) return 3.14159265 * min(r1, r2) * min(r1, r2);
  float a1 = acos(clamp((d * d + r1 * r1 - r2 * r2) / (2.0 * d * r1), -1.0, 1.0));
  float a2 = acos(clamp((d * d + r2 * r2 - r1 * r1) / (2.0 * d * r2), -1.0, 1.0));
  float k = (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2);
  return r1 * r1 * a1 + r2 * r2 * a2 - 0.5 * sqrt(max(k, 0.0));
}
// Fraction of the Sun's disk seen from p past the occluders (eclipses), and how much of the
// missing light comes back reddened through an occluder's atmosphere.
float sunVisible(vec3 p, out float red) {
  red = 0.0;
  if (uOccN < 0.5) return 1.0;
  vec3 toSun = uSunRel - p;
  float dS = length(toSun);
  vec3 sd = toSun / dS;
  float aS = uSunR / dS;
  float vis = 1.0;
  for (int i = 0; i < 4; i++) {
    if (float(i) >= uOccN) break;
    vec3 toO = uOcc[i].xyz - p;
    float dO = length(toO);
    vec3 od = toO / dO;
    if (dot(od, sd) <= 0.0 || dO >= dS) continue;
    float aO = uOcc[i].w / dO;
    float th = atan(length(cross(od, sd)), dot(od, sd));   // precise for small angles
    float f = discOverlap(aS, aO, th) / (3.14159265 * aS * aS);
    vis *= 1.0 - f;
    red = max(red, f * uOccRed[i]);
  }
  return vis;
}
// Normal of a surface displaced by height h (metres) along n, from screen-space derivatives
// (Mikkelsen 2010, "Bump Mapping Unparametrized Surfaces on the GPU").
vec3 bumpNormal(vec3 pos, vec3 n, float h) {
  vec3 dpdx = dFdx(pos), dpdy = dFdy(pos);
  float dhdx = dFdx(h), dhdy = dFdy(h);
  vec3 r1 = cross(dpdy, n), r2 = cross(n, dpdx);
  float det = dot(dpdx, r1);
  vec3 grad = sign(det) * (dhdx * r1 + dhdy * r2);
  return normalize(abs(det) * n - grad);
}

void main() {
  vec3 nB = normalize(vNormalBF);
  // the terrain patch replaces the sphere around the explorer
  if (uTerrain < 0.5 && dot(nB, uHoleDir) > uHoleCos) discard;
  vec3 nW = normalize(uBodyToWorld * nB);
  vec3 V = normalize(-vPosView);
  float mu0g = dot(nW, uSunDir);   // geometric (smooth sphere)

  // Relief: perturb the normal in the local east/north frame
  vec3 nP = nW;
  float water = 0.0;
  if (uHasRelief > 0.5) {
    vec3 rel = texture2D(uRelief, vUv).rgb;
    vec2 sl = rel.xy * 2.0 - 1.0;
    vec3 east = normalize(vec3(-nB.y, nB.x, 0.0) + vec3(1e-6, 0.0, 0.0));
    vec3 north = cross(nB, east);
    vec3 pB = normalize(nB * sqrt(max(0.05, 1.0 - dot(sl, sl))) + east * sl.x + north * sl.y);
    nP = normalize(uBodyToWorld * pB);
    if (uWater > 0.5) water = smoothstep(0.35, 0.65, rel.b);
  }
  // landing terrain: the normal of the real relief, blended in as the relief grows
  if (uTerrain > 0.5) nP = normalize(mix(nP, uBodyToWorld * normalize(vTerrN), uHScale));
  // irregular small bodies: the true (displaced) surface normal
  if (uLumpy > 0.0) {
    vec3 ng = normalize(cross(dFdx(vPosView), dFdy(vPosView)));
    if (dot(ng, vPosView - uBodyCenter) < 0.0) ng = -ng;
    nP = ng;
    mu0g = dot(nP, uSunDir);
  }
  // procedural surface (bodies without a map) or fine detail beyond a map's resolution
  float freshAll = 0.0;
  float hProc = 0.0;
  // Up close on the terrain the orbital-scale craters below (computed from the body-fixed direction,
  // good to only a few centimetres in float32) would turn into per-pixel noise: they fade out where a
  // pixel spans less than a couple of metres (and are not computed at all there), and the precise
  // local lattices further down take over.
  float mppT = length(fwidth(vPosView));
  float wT = uTerrain > 0.5 ? smoothstep(0.4, 2.5, mppT) : 1.0;
  float texPerPx = fwidth(vUv.x) * uMapW;   // (derivatives outside the branches below)
  if (uProc > 0.5 && wT > 0.0) {
    float f1, f2, f3;
    float f0;
    hProc = 1.6 * craters(nB, 1.4, uSeed + 3.0, 0.3 * uCraters, f0)
          + craters(nB, 3.0, uSeed, 0.55 * uCraters, f1) + craters(nB, 8.0, uSeed + 17.0, 0.7 * uCraters, f2)
          + (uLite > 0.5 ? 0.0 : craters(nB, 21.0, uSeed + 41.0, 0.85 * uCraters, f3)) + 0.015 * (bfbm(nB * 5.0 + uSeed) - 0.5);
    freshAll = max(f1, max(f2 * 0.8, f3 * 0.6));
  } else if (uMapW > 0.0 && wT > 0.0) {
    float w = smoothstep(0.7, 0.2, texPerPx);           // fades in when a texel covers > ~1.5 pixels
    if (w > 0.0) {
      float fd;
      float fq = uMapW / 25.0;
      // patchy, as on real surfaces: crater density varies from place to place
      float patchy = smoothstep(0.3, 0.75, bfbm(nB * 7.0 + uSeed * 0.3));
      hProc = w * 0.55 * (craters(nB, fq, uSeed, 0.12 + 0.45 * patchy, fd) + (uLite > 0.5 ? 0.0 : 0.5 * craters(nB, fq * 2.7, uSeed + 9.0, 0.2 + 0.45 * patchy, fd)));
    }
  }
  hProc *= wT;
  // relief fades towards the limb, where it would only alias into a ragged silhouette
  // (the terrain is seen at grazing angles all the time: only the very edge-on parts fade)
  float limbFade = uTerrain > 0.5 ? smoothstep(0.0, 0.12, dot(nP, V)) : smoothstep(0.05, 0.4, dot(nP, V));
  float hBump = hProc * uRadiusM * (uProc > 0.5 ? 1.0 : 0.6);
  if (uTerrain > 0.5 && uCraters > 0.05) {
    // landing terrain: small craters below the mesh's resolution, each scale faded in once its
    // craters span several pixels
    float mpp = mppT;
    float fr, frT = 0.0;
    float d = 0.45 * uCraters;
    float w0 = smoothstep(400.0 / 12.0, 400.0 / 30.0, mpp);
    // headset: at most two scales at a time (the coarsest drops out where the 20 m one is in full)
    if (uLite > 0.5) w0 *= 1.0 - smoothstep(20.0 / 12.0, 20.0 / 30.0, mpp);
    if (w0 > 0.0) { hBump += w0 * 400.0 * 0.5 * cratersAt(uOI0, uOF0 + vLocal / 400.0, d, fr); frT = max(frT, fr * w0); }
    float w1 = smoothstep(90.0 / 12.0, 90.0 / 30.0, mpp);
    if (w1 > 0.0) { hBump += w1 * 90.0 * 0.5 * cratersAt(uOI1, uOF1 + vLocal / 90.0, d, fr); frT = max(frT, fr * w1); }
    float w2 = smoothstep(20.0 / 12.0, 20.0 / 30.0, mpp);
    if (w2 > 0.0) { hBump += w2 * 20.0 * 0.5 * cratersAt(uOI2, uOF2 + vLocal / 20.0, d, fr); frT = max(frT, fr * w2); }
    float w3 = uLite > 0.5 ? 0.0 : smoothstep(4.5 / 12.0, 4.5 / 30.0, mpp);
    if (w3 > 0.0) { hBump += w3 * 4.5 * 0.5 * cratersAt(uOI3, uOF3 + vLocal / 4.5, d, fr); frT = max(frT, fr * w3); }
    freshAll = max(freshAll, frT * 0.6 * uHScale);
  }
  float groundVar = 0.0;
  if (uTerrain > 0.5 && uCraters < 0.05) {
    // ground without craters (Earth): uneven, rocky detail below the mesh and map resolution, on
    // land only, each scale faded in once its cells span many pixels
    float land = 1.0 - water;
    float n;
    float w0 = smoothstep(400.0 / 6.0, 400.0 / 20.0, mppT);
    if (w0 > 0.0) { n = bnAt(uOI0, uOF0 + vLocal / 400.0) - 0.5; hBump += w0 * land * 400.0 * 0.1 * n; groundVar += w0 * n; }
    float w1 = smoothstep(90.0 / 6.0, 90.0 / 20.0, mppT);
    if (w1 > 0.0) { n = bnAt(uOI1, uOF1 + vLocal / 90.0) - 0.5; hBump += w1 * land * 90.0 * 0.1 * n; groundVar += w1 * n * 0.7; }
    float w2 = uLite > 0.5 ? 0.0 : smoothstep(20.0 / 6.0, 20.0 / 20.0, mppT);
    if (w2 > 0.0) { n = bnAt(uOI2, uOF2 + vLocal / 20.0) - 0.5; hBump += w2 * land * 20.0 * 0.1 * n; groundVar += w2 * n * 0.5; }
    groundVar *= land * uHScale;
  }
  if (hBump != 0.0) nP = bumpNormal(vPosView, nP, hBump * limbFade);
  float mu0 = dot(nP, uSunDir);
  float mu = max(dot(nP, V), 0.0);

  vec3 albedo;
  if (uHasMap > 0.5) {
    vec3 t = texture2D(uMap, vUv).rgb;
    if (uDetailOn > 0.5) {
      // sharper tiles inside the detail window, blended out at its edges
      vec2 d = vec2(fract(vUv.x - uDetailRect.x) / uDetailRect.z, (vUv.y - uDetailRect.y) / uDetailRect.w);
      if (d.x < 1.0 && d.y > 0.0 && d.y < 1.0) {
        vec2 e = min(d, 1.0 - d);
        float wD = smoothstep(0.0, 0.06, min(e.x, e.y));
        vec2 gx = dFdx(vUv) / uDetailRect.zw, gy = dFdy(vUv) / uDetailRect.zw;
        t = mix(t, textureGrad(uDetail, d, gx, gy).rgb, wD);
      }
    }
    if (uMapGray > 0.5) t = vec3(t.r);
    albedo = srgbToLinear(t) * uAlbedoScale;
  } else {
    albedo = uColor * uAlbedoScale;
    if (uProc > 0.5) {
      // patchy terrain of two materials, darker or brighter crater floors, fresh bright ejecta
      float v = bfbm(nB * 2.2 + uSeed * 0.7);
      albedo *= mix(vec3(1.0), uTint, smoothstep(0.35, 0.75, v)) * (0.75 + 0.5 * bfbm(nB * 9.0 + uSeed));
      albedo *= 1.0 + freshAll * (0.35 + 0.6 * uIcy);
      if (uIcy > 0.5) albedo *= 0.92 + 0.16 * smoothstep(0.48, 0.5, abs(bn3(nB * 6.0 + uSeed) - 0.5) + 0.48); // cracks
    }
  }
  // fresh, bright ejecta around the terrain's small craters
  if (uTerrain > 0.5 && uProc < 0.5) albedo *= 1.0 + freshAll * 0.35;
  // patchy ground (rock, soil, plants) below the map's resolution
  albedo *= 1.0 + 0.45 * groundVar;
  if (uBands > 0.5) {
    float lat = asin(clamp(vNormalBF.z, -1.0, 1.0));
    float b = noise1(lat * 18.0 + uSeed) * 0.6 + noise1(lat * 45.0 + uSeed * 1.7) * 0.4;
    albedo *= 0.86 + 0.24 * b;
  }
  float cloud = 0.0;
  if (uHasClouds > 0.5) {
    cloud = texture2D(uClouds, vec2(vUv.x + uCloudShift, vUv.y)).r;
    cloud = smoothstep(0.08, 0.9, cloud) * uCloudVis;
    albedo = mix(albedo, vec3(0.75), cloud);
  }

  // Terrain shading only on the day side (no light leaking past the geometric terminator)
  float dayside = smoothstep(-0.04, 0.06, mu0g);
  float light;
  if (uAirless > 0.5) {
    light = mu0 > 0.0 ? 2.0 * mu0 / (mu0 + mu + 1e-4) : 0.0; // Lommel-Seeliger
  } else {
    light = max(mix(mu0, mu0g, cloud), 0.0);                // Lambert (clouds hide the relief)
  }
  light *= dayside;
  if (uTerrain > 0.5) light *= mix(1.0, clamp(0.5 + vSun, 0.0, 1.0), uHScale);   // shadows of the relief
  // eclipses: shadows of moons and planets (with a coppery glow where sunlight is bent through an atmosphere)
  float eclRed = 0.0;
  float ecl = sunVisible(vPosView, eclRed);
  light *= ecl;

  // Shadow cast by rings onto the planet
  if (uHasRings > 0.5 && mu0g > 0.0) {
    vec3 sBF = transpose(uBodyToWorld) * uSunDir;
    vec3 p = vNormalBF;  // approx surface point in body radius units
    if (abs(sBF.z) > 1e-4) {
      float t = -p.z / sBF.z;
      if (t > 0.0) {
        vec3 hit = p + sBF * t;
        float r = length(hit.xy);
        if (r > uRingRadii.x && r < uRingRadii.y) {
          float a = texture2D(uRingTex, vec2((r - uRingRadii.x) / (uRingRadii.y - uRingRadii.x), 0.5)).r;
          float tau = -log(max(1.0 - a, 1e-3));
          light *= exp(-tau / abs(sBF.z));
        }
      }
    }
  }

  // Sunlight reaching the ground through the atmosphere
  vec3 sunT = vec3(1.0);
  if (uAtmo > 0.5) {
    float cR = sunColumn(uRp, mu0g, uHR, uRp);
    float cM = sunColumn(uRp, mu0g, uHM, uRp);
    sunT = cR > 1.0e11 ? vec3(0.0) : exp(-(uBetaR * cR + uBetaMe * cM));
  }
  vec3 sunL = uSunColor * sunT * (uSunIrr / 3.14159265);
  vec3 radiance = albedo * sunL * light;
  // skylight: the sunlit sky lights the ground too and fills shadows (about the light scattered out
  // of the beam, half of it downwards), less on slopes facing away from the sky
  if (uAtmo > 0.5) {
    vec3 tau = uBetaR * uHR + uBetaMe * uHM;
    float day = smoothstep(-0.1, 0.25, mu0g) * (0.3 + 0.7 * max(mu0g, 0.0)) * ecl;
    radiance += albedo * uSunColor * (uSunIrr / 3.14159265) * (1.0 - exp(-tau)) * 0.5 * day * (0.5 + 0.5 * dot(nP, nW));
  }
  // in a planet's shadow, sunlight refracted through its atmosphere (the Moon turns copper in an eclipse)
  if (eclRed > 0.0) radiance += albedo * sunL * eclRed * 0.004 * vec3(1.0, 0.32, 0.1) * max(mu0g, 0.0);

  // Sun glint on open water (GGX, roughness of a wind-roughened sea seen from orbit)
  if (water > 0.0 && mu0g > 0.0) {
    vec3 Hh = normalize(uSunDir + V);
    float nh = max(dot(nW, Hh), 0.0);
    float a2 = 0.04;
    float dd = nh * nh * (a2 - 1.0) + 1.0;
    float D = a2 / (3.14159265 * dd * dd);
    float vh = max(dot(V, Hh), 0.0);
    float F = 0.02 + 0.98 * pow(1.0 - vh, 5.0);
    float spec = D * F / max(4.0 * vh * vh, 0.05);
    radiance += sunL * 3.14159265 * spec * max(mu0g, 0.0) * water * (1.0 - cloud) * 0.6;
  }

  if (uHasNight > 0.5) {
    float night = smoothstep(0.05, -0.15, mu0g);
    vec3 lights = srgbToLinear(texture2D(uNight, vUv).rgb);
    radiance += lights * lights * vec3(1.0, 0.8, 0.55) * 0.02 * night * (1.0 - cloud);
  }
  gl_FragColor = vec4(min(radiance * uExposure, vec3(6.0e4)), 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,nd=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;        // luminance-normalised blackbody colour
uniform float uRadiance;    // mean disk radiance (photometric units)
uniform float uExposure;
uniform float uTime;
uniform mat3 uBodyToWorld;

uniform float uSeed;
uniform float uGranFreq;
uniform float uGranAmp;
uniform float uSpots;
uniform float uSpotLat;
uniform float uFaculae;
uniform float uLimbA;
uniform float uLimbB;
uniform float uRotRate;
uniform float uGravDark;
uniform vec3 uAxis;
uniform float uFlares;

varying vec3 vNormalBF;
varying vec3 vPosView;
varying vec2 vUv;
float h3(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
vec3 h33(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453123);
}
float n3(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
// cellular noise: x = distance to the nearest cell centre, y = to the second nearest
vec2 cells(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  float d1 = 9.0, d2 = 9.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(float(x), float(y), float(z));
    vec3 o = h33(i + g);
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return vec2(d1, d2);
}
float fbm3(vec3 p) { return 0.55 * n3(p) + 0.3 * n3(p * 2.1 + 7.0) + 0.15 * n3(p * 4.3 + 13.0); }
vec3 rotateAbout(vec3 v, vec3 k, float a) { float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c); }

void main() {
  vec3 nW = normalize(uBodyToWorld * vNormalBF);
  vec3 V = normalize(-vPosView);
  float mu = clamp(dot(nW, V), 0.0, 1.0);
  // surface coordinates rotating with the star (equator faster: differential rotation)
  float lat = dot(vNormalBF, uAxis);
  vec3 q = rotateAbout(normalize(vNormalBF), uAxis, -uRotRate * uTime * (1.0 - 0.25 * lat * lat)) + uSeed;
  // granulation: bright cell centres, dark intergranular lanes, slowly evolving. Cells are warped
  // so they are irregular, and fade out once they are smaller than a pixel (no moiré).
  vec3 gp = q * uGranFreq;
  float cellPx = 1.0 / max(length(fwidth(gp)), 1e-6);           // pixels per cell
  float gVis = smoothstep(1.5, 5.0, cellPx);
  vec3 warp = vec3(n3(gp * 0.35 + 5.0), n3(gp * 0.35 + 17.0), n3(gp * 0.35 + 29.0)) - 0.5;
  vec2 c = cells(gp + warp * 0.9 + vec3(0.0, 0.0, uTime * 0.03));
  // few, huge cells (supergiants) have broad, soft lanes; many small cells (dwarfs) sharp ones
  float soft = smoothstep(60.0, 6.0, uGranFreq);
  float lanes = smoothstep(0.02, 0.28 + 0.2 * n3(gp * 0.5) + 0.5 * soft, c.y - c.x);
  float blob = 1.0 - smoothstep(0.0, 0.75 + 0.4 * soft, c.x);   // bright cell centres
  float gran = 1.0 + uGranAmp * gVis * (mix(lanes * 0.9 + blob * 0.5, lanes * 0.35 + blob * 1.1 + 0.6 * (fbm3(gp * 1.7) - 0.5), soft) - 0.8);
  // giant convection cells / supergranulation (large on supergiants), visible from farther
  float bigVis = smoothstep(1.5, 5.0, cellPx * 6.0);
  gran *= 1.0 + 0.9 * uGranAmp * bigVis * (fbm3(q * max(1.6, uGranFreq * 0.12)) - 0.5);
  // spots in the active latitudes: umbra and penumbra
  float band = exp(-pow((abs(lat) - uSpotLat) / 0.22, 2.0));
  float sf = fbm3(q * 7.0 + 31.0) * band;
  float thr = 1.0 - clamp(uSpots * 2.2, 0.0, 0.95);
  float pen = smoothstep(thr - 0.06, thr, sf);
  float umb = smoothstep(thr + 0.03, thr + 0.08, sf);
  float spot = pen * 0.45 + umb * 0.5;
  // faculae: bright network around active regions, visible towards the limb
  float fac = uFaculae * smoothstep(thr - 0.2, thr - 0.05, sf) * (1.0 - spot) * pow(1.0 - mu, 1.5) * 0.6;
  // limb darkening (quadratic law, normalised to unit mean) and gravity darkening
  float x = 1.0 - mu;
  float ld = (1.0 - uLimbA * x - uLimbB * x * x) / (1.0 - uLimbA / 3.0 - uLimbB / 6.0);
  float gd = 1.0 - uGravDark * (1.0 - lat * lat);
  vec3 col = uColor * ld * gd * gran * (1.0 - spot) * (1.0 + fac);
  // cooler (redder) spots, lanes and equator; hotter cell centres a little whiter
  float cool = clamp(spot * 1.4 + uGravDark * (1.0 - lat * lat) + (1.0 - gran) * 1.5, 0.0, 1.0);
  col *= mix(vec3(1.0), vec3(1.0, 0.78, 0.6), cool);
  // shown a little more saturated than the blackbody (bright disks otherwise wash out to white)
  col = max(mix(vec3(dot(col, vec3(0.2126, 0.7152, 0.0722))), col, 1.35), 0.0);
  // flares on active red dwarfs: a bright patch that flashes up and fades
  if (uFlares > 0.0) {
    float epoch = floor(uTime / 23.0);
    if (h3(vec3(epoch, uSeed, 3.0)) < uFlares * 2.0) {
      vec3 fp = normalize(h33(vec3(epoch, uSeed, 7.0)) * 2.0 - 1.0);
      float age = fract(uTime / 23.0) * 23.0;
      float f = exp(-age / 3.0) * smoothstep(0.0, 0.5, age) * 4.0;
      col += vec3(0.9, 0.95, 1.0) * f * exp(-pow(length(normalize(vNormalBF) - fp) / 0.08, 2.0));
    }
  }
  gl_FragColor = vec4(min(col * uRadiance * uExposure, vec3(6.0e4)), 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,rd=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
varying vec2 vXY;
void main() {
  vXY = position.xy;
  gl_Position = projectView(modelViewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${ku}
}`,id=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uIntensity;  // display value of the glow at the limb
uniform float uQuad;       // quad half-size in star radii
uniform float uCorona;
uniform float uProm;
uniform float uSeed;
uniform float uTime;
varying vec2 vXY;
float h2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
void main() {
  float r = length(vXY) * uQuad;          // in star radii
  if (r < 0.985) discard;
  float a = atan(vXY.y, vXY.x);
  // streamers: angular structure that widens outwards (periodic in angle)
  float st = n2(vec2(cos(a) * 3.0 + uSeed, sin(a) * 3.0 + uTime * 0.01)) * 0.7 + n2(vec2(cos(a) * 9.0, sin(a) * 9.0 + uSeed)) * 0.3;
  float glow = uCorona * (0.55 * exp(-(r - 1.0) * 7.0) + (0.05 + 0.12 * st) / (r * r));
  glow *= 1.0 - smoothstep(0.7, 1.0, length(vXY));
  // prominences: bright loops just above the limb
  float pn = n2(vec2(cos(a) * 14.0 + uSeed, sin(a) * 14.0 + r * 9.0 - uTime * 0.02));
  float prom = uProm * pow(pn, 7.0) * 6.0 * smoothstep(1.16, 1.0, r);
  vec3 c = uColor * glow + vec3(1.0, 0.32, 0.42) * prom;
  gl_FragColor = vec4(c * uIntensity, 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,ad=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
varying vec3 vLocal;   // ring-plane coordinates in body radius units
varying vec3 vPosView;
void main() {
  vLocal = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosView = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${ku}
}`,od=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform sampler2D uRingTex;
uniform vec2 uRingRadii;
uniform vec3 uColor;
uniform vec3 uSunDirBF;     // Sun direction in body-fixed frame
uniform vec3 uViewDirBF;    // direction ring centre -> camera in body-fixed frame
uniform float uSunIrr;
uniform float uExposure;
uniform float uPlanetRadius; // equatorial radius in body radius units (=1) and polar flattening
uniform float uPolar;
varying vec3 vLocal;
varying vec3 vPosView;
void main() {
  float r = length(vLocal.xy);
  if (r < uRingRadii.x || r > uRingRadii.y) discard;
  float a = texture2D(uRingTex, vec2((r - uRingRadii.x) / (uRingRadii.y - uRingRadii.x), 0.5)).r;
  float tau = -log(max(1.0 - a, 1e-3));
  float mu0 = abs(uSunDirBF.z);
  float mu = max(abs(uViewDirBF.z), 1e-3);
  float alpha = 1.0 - exp(-tau / mu);
  bool sameSide = (uSunDirBF.z * uViewDirBF.z) > 0.0;
  // Single-scattering approximation: lit face reflects, unlit face shows forward-scattered light.
  float bright = sameSide ? (1.0 - exp(-tau * (1.0 / mu0 + 1.0 / mu))) * mu0 / (mu0 + mu) * 2.0
                          : (exp(-tau / mu) - exp(-tau / mu0)) / max(1.0 / mu0 - 1.0 / mu, 1e-3) / mu * 0.6;
  // Planet shadow on the rings
  vec3 p = vLocal;
  vec3 s = normalize(uSunDirBF);
  vec3 ps = vec3(p.xy, p.z / uPolar);
  vec3 ss = normalize(vec3(s.xy, s.z / uPolar));
  float b = dot(ps, ss);
  float c = dot(ps, ps) - 1.0;
  float disc = b * b - c;
  if (disc > 0.0 && -b - sqrt(disc) > 0.0) bright = 0.0;
  vec3 radiance = uColor * 0.5 * (uSunIrr / 3.14159265) * max(bright, 0.0);
  // Premultiplied alpha output
  gl_FragColor = vec4(min(radiance * uExposure, vec3(6.0e4)), alpha);
${Au}
  #include <logdepthbuf_fragment>
}`,sd=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
varying vec2 vXY;
void main() {
  vXY = position.xy;
  gl_Position = projectView(modelViewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${ku}
}`,cd=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uIntensity;  // display value of the glare at the limb
uniform float uDiskFrac;   // disk radius / quad half-size
varying vec2 vXY;
void main() {
  float r = length(vXY) / uDiskFrac;   // in disk radii
  if (r < 0.98 || r > 1.0 / uDiskFrac) discard;
  // eye/lens scatter: steep core plus a long 1/r^2 skirt, faded at the quad edge
  float g = 0.7 * exp(-(r - 1.0) * 3.0) + 0.3 / (r * r);
  g *= 1.0 - smoothstep(0.6, 1.0, length(vXY));
  gl_FragColor = vec4(uColor * uIntensity * g, 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,ld=4,ud=new Xi(2,2),dd=class{mesh;mat;constructor(){this.mat=new J({name:`star-corona`,vertexShader:rd,fragmentShader:id,uniforms:{uColor:{value:new U(1,1,1)},uIntensity:{value:1},uQuad:{value:ld},uCorona:{value:.6},uProm:{value:0},uSeed:{value:0},uTime:{value:0},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK},transparent:!0,depthWrite:!1,blending:2}),this.mesh=new q(ud,this.mat),this.mesh.matrixAutoUpdate=!1,this.mesh.frustumCulled=!1,this.mesh.renderOrder=12,this.mesh.visible=!1}update(e,t,n,r,i,a,o){let s=this.mat.uniforms;s.uColor.value.set(...r),s.uIntensity.value=.85*Math.min(1,i*3),s.uCorona.value=a.corona,s.uProm.value=a.prominences,s.uSeed.value=a.seed,s.uTime.value=o;let c=t*ld;this.mesh.matrix.compose(e,n,new U(c,c,c)),this.mesh.matrixWorldNeedsUpdate=!0,this.mesh.visible=i>1e-4}hide(){this.mesh.visible=!1}},fd=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
uniform float uRange;        // particles shrink away towards this distance (m)
varying vec3 vN;
varying vec3 vPos;
varying float vTone;
void main() {
  vec4 centre = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float fade = 1.0 - smoothstep(uRange * 0.7, uRange, length(centre.xyz));
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vec4 wp = modelMatrix * instanceMatrix * vec4(position * fade, 1.0);
  vPos = wp.xyz;
  // per-particle tone from its (deterministic) size and rotation
  vTone = fract(instanceMatrix[3].x * 0.37 + instanceMatrix[3].y * 0.61);
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${ku}
}`,pd=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;         // ring colour (linear)
uniform vec3 uSunDir;        // world
uniform float uSunIrr;
uniform float uExposure;
uniform vec3 uPlanet;        // planet centre relative to the camera (m)
uniform float uPlanetR;
uniform vec3 uPlanetDir;     // unit direction particle -> planet (for planetshine)
uniform float uShine;        // planetshine relative to sunlight
varying vec3 vN;
varying vec3 vPos;
varying float vTone;
void main() {
  vec3 n = normalize(vN);
  // the planet's shadow: does the ray towards the Sun hit it?
  vec3 oc = vPos - uPlanet;
  float b = dot(oc, uSunDir);
  float c = dot(oc, oc) - uPlanetR * uPlanetR;
  float disc = b * b - c;
  float lit = (disc > 0.0 && -b - sqrt(disc) > 0.0) ? 0.0 : 1.0;
  float mu0 = max(dot(n, uSunDir), 0.0);
  float shine = uShine * max(dot(n, uPlanetDir), 0.0);
  vec3 alb = uColor * (0.75 + 0.5 * vTone);
  vec3 rad = alb * (mu0 * lit + shine + 0.02) * (uSunIrr / 3.14159265);
  gl_FragColor = vec4(min(rad * uExposure, vec3(6.0e4)), 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,md=40,hd=500,gd=6e3;function _d(e,t,n){let r=Math.imul(e|0,374761393)^Math.imul(t|0,668265263)^Math.imul(n|0,1274126177);return r=Math.imul(r^r>>>13,1274126177),((r^r>>>16)>>>0)/4294967296}var vd=class{inner;outer;mesh;mat;tau=null;cellX=NaN;cellY=NaN;origin=new U;lite=!1;constructor(e,t,n,r,i){this.inner=t,this.outer=n;let a=new Yi(1,1),o=a.attributes.position;for(let e=0;e<o.count;e++){let t=.75+.5*_d(Math.round(o.getX(e)*1e3),Math.round(o.getY(e)*1e3),Math.round(o.getZ(e)*1e3));o.setXYZ(e,o.getX(e)*t,o.getY(e)*t,o.getZ(e)*t)}a.computeVertexNormals(),this.mat=new J({name:`ring-particles`,vertexShader:fd,fragmentShader:pd,uniforms:{uColor:{value:new U(...r)},uSunDir:{value:new U(1,0,0)},uSunIrr:{value:Math.PI},uExposure:i,uPlanet:{value:new U},uPlanetR:{value:1},uPlanetDir:{value:new U},uShine:{value:0},uRange:{value:hd},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK}}),this.mesh=new mi(a,this.mat,gd),this.mesh.count=0,this.mesh.matrixAutoUpdate=!1,this.mesh.frustumCulled=!1,this.mesh.visible=!1,this.mesh.renderOrder=2,this.mesh.name=`ring-particles`,this.loadProfile(e)}loadProfile(e){fetch(e).then(e=>e.blob()).then(e=>createImageBitmap(e,{colorSpaceConversion:`none`})).then(e=>{let t=document.createElement(`canvas`);t.width=e.width,t.height=1;let n=t.getContext(`2d`);n.drawImage(e,0,0),e.close();let r=n.getImageData(0,0,t.width,1).data,i=new Float32Array(t.width);for(let e=0;e<t.width;e++)i[e]=-Math.log(Math.max(1-r[e*4]/255,.001));this.tau=i}).catch(e=>console.warn(`ring profile`,e))}tauAt(e){let t=this.tau;if(!t||e<this.inner||e>this.outer)return 0;let n=(e-this.inner)/(this.outer-this.inner)*(t.length-1),r=Math.floor(n);return t[r]+(t[Math.min(r+1,t.length-1)]-t[r])*(n-r)}update(e,t,n,r,i){if(!e||!this.tau){this.mesh.visible=!1;return}let a=new W().setFromMatrix4(t).transpose(),o=e.clone().negate().applyMatrix3(a),s=Math.hypot(o.x,o.y);if(Math.abs(o.z)>hd*1.5||s<this.inner-hd||s>this.outer+hd){this.mesh.visible=!1,this.cellX=NaN;return}let c=Math.floor(o.x/md),l=Math.floor(o.y/md),u=Tu.uLite.value>.5;(c!==this.cellX||l!==this.cellY||u!==this.lite)&&(this.lite=u,this.rebuild(c,l)),this.mesh.matrix.copy(t).setPosition(this.origin.clone().sub(o).applyMatrix4(new G().extractRotation(t))),this.mesh.matrixWorldNeedsUpdate=!0,this.mesh.visible=this.mesh.count>0;let d=this.mat.uniforms;d.uSunDir.value.copy(r),d.uSunIrr.value=i,d.uPlanet.value.copy(e),d.uPlanetR.value=n,d.uPlanetDir.value.copy(e).normalize(),d.uShine.value=.04*Math.max(0,-r.dot(e.clone().normalize())*.5+.5)}rebuild(e,t){this.cellX=e,this.cellY=t,this.origin.set(e*md,t*md,0);let n=Math.ceil(hd/md),r=new G,i=new H,a=new U,o=new U,s=new U,c=0;for(let l=-13;l<=n&&c<gd;l++)for(let u=-13;u<=n&&c<gd;u++){if((u*u+l*l)*md*md>540**2)continue;let n=e+u,d=t+l,f=Math.hypot((n+.5)*md,(d+.5)*md),p=this.tauAt(f);if(p<=0)continue;let m=Math.min(4,p)*(this.lite?1:2),h=Math.floor(m)+ +(_d(n,d,99)<m%1);for(let e=0;e<h&&c<gd;e++){let t=t=>_d(n,d,e*16+t),f=.25/Math.sqrt(1-t(1)*(1-(.25/7)**2));o.set((u+t(2))*md,(l+t(3))*md,(t(4)+t(5)-1)*9),s.set(t(6)-.5,t(7)-.5,t(8)-.5).normalize(),i.setFromAxisAngle(s,t(9)*Math.PI*2),a.set(f*(.7+.6*t(10)),f*(.7+.6*t(11)),f*(.7+.6*t(12))),r.compose(o,i,a),this.mesh.setMatrixAt(c++,r)}}this.mesh.count=c,this.mesh.instanceMatrix.needsUpdate=!0}};function yd(e){let t=new U().setFromMatrixColumn(e,2).normalize(),n=new U(0,0,1).cross(t);n.lengthSq()<1e-8&&n.set(1,0,0),n.normalize();let r=new U().crossVectors(t,n);return new G().makeBasis(n,r,t)}var bd=class{planet;ringRadius;kind=`place`;key=`place:saturn-rings`;name=`Saturn's rings`;radius=0;local;constructor(e,t,n=105e6){this.planet=e,this.ringRadius=n;let r=yd(e.orientation).clone().invert(),i=t.clone().sub(new U).applyMatrix4(r),a=Math.atan2(i.y,i.x)+Math.PI/3;this.local=new U(Math.cos(a)*n,Math.sin(a)*n,40)}get parentObject(){return this.planet}approachDir(){let e=yd(this.planet.orientation),t=this.local.clone().setZ(0).normalize().applyMatrix4(e),n=new U().setFromMatrixColumn(e,2);return t.addScaledVector(n,.15).normalize()}get upos(){return this.planet.upos.clone().addVec(this.local.clone().applyMatrix4(yd(this.planet.orientation)))}info(){return[[`Type`,`Place: inside the B ring of Saturn`],[`Distance from Saturn`,`${(this.ringRadius/1e3).toLocaleString()} km from the centre`],[`Particles`,`drawn from the ring's measured optical depth (Voyager 2 PPS occultation); sizes and layout generated`]]}};function xd(e,t){let[n,r,i]=e.radii;return 1/Math.sqrt((t.x/n)**2+(t.y/r)**2+(t.z/i)**2)}async function Sd(e){let t=await fetch(e).then(e=>e.blob()),n=await createImageBitmap(t,{colorSpaceConversion:`none`,premultiplyAlpha:`none`}),r=n.width,i=n.height,a=document.createElement(`canvas`);a.width=r,a.height=i;let o=a.getContext(`2d`,{willReadFrequently:!0});o.drawImage(n,0,0),n.close();let s=o.getImageData(0,0,r,i).data,c=new Uint16Array(r*i);for(let e=0;e<c.length;e++)c[e]=s[e*4]*256+s[e*4+1];return{w:r,h:i,data:c}}var Cd=e=>[((-e+2)*e-1)*e*.5,((3*e-5)*e*e+2)*.5,((-3*e+4)*e+1)*e*.5,(e-1)*e*e*.5];function wd(e){let t=[e],n=e.w,r=e.h,i=Float32Array.from(e.data,t=>t*e.scale+e.offset);for(;n>=32&&r>=32;){let e=n>>1,a=r>>1,o=new Float32Array(e*a);for(let t=0;t<a;t++){let r=2*t*n,a=(2*t+1)*n;for(let n=0;n<e;n++)o[t*e+n]=.25*(i[r+2*n]+i[r+2*n+1]+i[a+2*n]+i[a+2*n+1])}t.push({w:e,h:a,data:o,scale:1,offset:0}),i=o,n=e,r=a}return t}function Td(e,t,n,r){let i=t*e.w-.5,a=n*e.h-.5,o=Math.floor(i),s=Math.floor(a),c=Cd(i-o),l=Cd(a-s),u=0;for(let t=0;t<4;t++){let n=Math.max(0,Math.min(e.h-1,s-1+t)),i=0;for(let t=0;t<4;t++){let a=o-1+t;a=r?(a%e.w+e.w)%e.w:Math.max(0,Math.min(e.w-1,a)),i+=c[t]*e.data[n*e.w+a]}u+=l[t]*i}return u*e.scale+e.offset}function Ed(e,t,n,r,i,a){let o=Math.min(e.length-1,Math.max(0,Math.log2(Math.max(n,1e-6)/t))),s=Math.floor(o),c=o-s,l=Td(e[s],r,i,a);return c>.001&&s+1<e.length?l+(Td(e[s+1],r,i,a)-l)*c:l}function Dd(e,t,n,r){let i=Math.imul(e|0,374761393)^Math.imul(t|0,668265263)^Math.imul(n|0,1440662683)^Math.imul(r|0,1274126177);return i=Math.imul(i^i>>>13,1274126177),((i^i>>>16)>>>0)/4294967296}function Od(e,t,n,r){let i=Math.floor(e),a=Math.floor(t),o=Math.floor(n),s=e-i,c=t-a,l=n-o,u=s*s*(3-2*s),d=c*c*(3-2*c),f=l*l*(3-2*l),p=Dd(i,a,o,r),m=Dd(i+1,a,o,r),h=Dd(i,a+1,o,r),g=Dd(i+1,a+1,o,r),_=Dd(i,a,o+1,r),v=Dd(i+1,a,o+1,r),y=Dd(i,a+1,o+1,r),b=Dd(i+1,a+1,o+1,r),x=p+(m-p)*u,S=h+(g-h)*u,C=_+(v-_)*u,w=y+(b-y)*u,T=x+(S-x)*d;return T+(C+(w-C)*d-T)*f}function kd(e,t,n,r,i,a,o){let s=e/r,c=t/r,l=n/r,u=Math.floor(s),d=Math.floor(c),f=Math.floor(l),p=0;for(let e=-1;e<=1;e++)for(let t=-1;t<=1;t++)for(let n=-1;n<=1;n++){let m=u+e,h=d+t,g=f+n;if(Dd(m,h,g,i+11)>a)continue;let _=m+.2+.6*Dd(m,h,g,i+1),v=h+.2+.6*Dd(m,h,g,i+2),y=g+.2+.6*Dd(m,h,g,i+3),b=Dd(m,h,g,i+5),x=.1+.32*b*b,S=Math.sqrt((s-_)**2+(c-v)**2+(l-y)**2)/x;if(S>1.7)continue;let C=S<1?S*S-1:0,w=.32*Math.exp(-(((S-1)/.28)**2));p+=(C+w)*o*x*r}return p}function Ad(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return(t>>>0)%100003}var jd=class e{base;manifest=null;maps=new Map;pending=new Map;order=[];craters=new Map;grounds=new Map;patches=new Map;patchRequested=new Set;versions=new Map;constructor(e){this.base=e,fetch(`${e}/terrain/terrain.json`).then(e=>e.ok?e.json():null).then(e=>{this.manifest=e}).catch(()=>void 0)}ground(t){let n=this.grounds.get(t);return n||(n={owner:t,name:t.name,radius:t.radius,radii:t.radii,amplitude:e.amplitude(t),ready:()=>this.ready(t),height:(e,n)=>this.height(t,e,n),prepare:e=>this.nearPatches(t,e),version:()=>this.versions.get(t.name.toLowerCase())??0},this.grounds.set(t,n)),n}keyOf(e){let t=e.name.toLowerCase();return this.manifest?.maps[t]?t:null}ready(e){if(!this.manifest)return!1;let t=this.keyOf(e);return!t||this.maps.has(t)?!0:(this.request(t,e.radius),!1)}credit(e){let t=this.keyOf(e);return t?this.manifest.maps[t].credit:null}nearPatches(e,t){let n=this.keyOf(e),r=n?this.manifest?.patches?.filter(e=>e.body===n):void 0;if(!n||!r?.length)return;let i=Math.asin(Math.max(-1,Math.min(1,t.z)))*180/Math.PI,a=Math.atan2(t.y,t.x)*180/Math.PI;for(let t of r){if(this.patchRequested.has(t.name))continue;let r=(t.lat0+t.lat1)/2,o=((a-(t.lon0+t.lon1)/2)%360+540)%360-180,s=Math.max(t.lat1-t.lat0,(t.lon1-t.lon0)*Math.cos(r*Math.PI/180))/2;Math.hypot(i-r,o*Math.cos(r*Math.PI/180))>s+8||(this.patchRequested.add(t.name),Sd(`${this.base}/terrain/${t.file}`).then(({data:r})=>{let i=(t.lat1-t.lat0)/t.height*Math.PI*e.radius/180,a=this.patches.get(n)??[];a.push({...t,data:r,pixelM:i,levels:wd({w:t.width,h:t.height,data:r,scale:t.scale,offset:t.offset})}),this.patches.set(n,a),this.versions.set(n,(this.versions.get(n)??0)+1)}).catch(e=>console.warn(`terrain patch failed`,t.name,e)))}}patchSample(e,t,n,r){let i=(e.lat1-t)/(e.lat1-e.lat0),a=((n-e.lon0)%360+360)%360/(e.lon1-e.lon0);if(a<=0||a>=1||i<=0||i>=1)return null;let o=Math.min(a,1-a,i,1-i),s=Math.min(1,o/.12),c=s*s*(3-2*s);return{h:Ed(e.levels,e.pixelM,r,a,i,!1),w:c}}request(e,t){if(this.pending.has(e))return;let n=this.manifest.maps[e],r=Sd(`${this.base}/terrain/${n.file}`).then(({w:r,h:i,data:a})=>{let o={width:r,height:i,lonLeft:n.lonLeft,data:a,offset:n.offset,scale:n.scale,pixelM:2*Math.PI*t/r,sea:n.sea};for(this.maps.set(e,o),this.order=this.order.filter(t=>t!==e).concat(e);this.order.length>2;){let e=this.order.shift();this.maps.delete(e),this.pending.delete(e)}return o}).catch(t=>(console.warn(`terrain map failed`,e,t),null));this.pending.set(e,r)}dem(e,t,n){let r=Math.atan2(t.y,t.x),i=Math.asin(Math.max(-1,Math.min(1,t.z))),a=(r-e.lonLeft*Math.PI/180)/(2*Math.PI);return a-=Math.floor(a),e.levels??=wd({w:e.width,h:e.height,data:e.data,scale:e.scale,offset:e.offset}),Ed(e.levels,e.pixelM,n,a,.5-i/Math.PI,!0)}static amplitude(e){return Math.min(4500,e.radius*.0024)}height(t,n,r){let i=t.radius,a=Ad(t.name),o=this.keyOf(t),s=o?this.maps.get(o):void 0,c=0,l,u=0,d=1/0;if(s){c=this.dem(s,n,r),l=s.pixelM*3;let e=this.patches.get(o);if(e){let t=Math.asin(Math.max(-1,Math.min(1,n.z)))*180/Math.PI,i=Math.atan2(n.y,n.x)*180/Math.PI;for(let n of e){let e=this.patchSample(n,t,i,r);e&&e.w>u&&(c+=(e.h-c)*e.w,u=e.w,d=n.pixelM*3)}}}else l=i/3;let f=Math.max(r*2.5,6),p=n.x*i,m=n.y*i,h=n.z*i,g=s?.012:Math.min(.03,e.amplitude(t)/(i/3)),_=s?.sea;if(_!==void 0){let e=Math.min(1,Math.max(0,(c-_)/150));g*=e*e*(3-2*e)*Math.min(1,Math.max(.08,(c-_)/2500))}let v=0;for(let e=l;e>f&&v<16;e*=.5,v++)c+=(Od(p/e,m/e,h/e,a+v*7)-.5)*2*g*e*(e>d?1-u:1);let y=this.craters.get(t)??.8;if(y>.05){let e=Od(p/6e4,m/6e4,h/6e4,a+99),t=0;for(let n=4e4;n>=30&&!(n*.4<f);n/=4.6,t++){if(n>l*1.2)continue;let r=y*(.35+.35*e)*(n<1e3?1.15:1),i=n>5e3?.18:.32;c+=kd(p,m,h,n,a+100*t,r,i)*(n>d*1.2?1-u:1)}}return _!==void 0&&(c=Math.max(c,_)),Number.isFinite(c)?c:0}static baseRadius(e,t){return xd(e,t)}},Md=19.9,Nd=19.95,Pd=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
attribute vec3 aN;      // body-fixed unit direction
attribute vec3 aTN;     // body-fixed normal of the full-height terrain
attribute float aH;     // height above the reference surface (m)
attribute vec2 aUv;     // map coordinates
attribute float aSun;   // clearance of the Sun over the surrounding relief, in penumbra widths (lit above -0.5)
uniform float uHScale;
varying vec3 vNormalBF;
varying vec3 vTerrN;
varying float vSun;
varying vec3 vLocal;
varying vec3 vPosView;
varying vec2 vUv;
void main() {
  vNormalBF = aN;
  vLocal = position;
  vTerrN = aTN;
  vSun = aSun;
  vUv = aUv;
  vec3 pos = position + aN * (aH * uHScale);
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  vPosView = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${ku}
}`,Fd=150,Id=96,Ld=[400,90,20,4.5];function Rd(){let e=14401,t=new mr;t.setAttribute(`position`,new K(new Float32Array(e*3),3)),t.setAttribute(`aN`,new K(new Float32Array(e*3),3)),t.setAttribute(`aTN`,new K(new Float32Array(e*3),3)),t.setAttribute(`aH`,new K(new Float32Array(e),1)),t.setAttribute(`aUv`,new K(new Float32Array(e*2),2)),t.setAttribute(`aSun`,new K(new Float32Array(e).fill(1),1));let n=[],r=(e,t)=>1+e*Id+t%Id;for(let e=0;e<Id;e++)n.push(0,r(0,e),r(0,e+1));for(let e=0;e<149;e++)for(let t=0;t<Id;t++)n.push(r(e,t),r(e+1,t),r(e+1,t+1),r(e,t),r(e+1,t+1),r(e,t+1));return t.setIndex(n),t}var zd=class e{group=new sn;front;back;job=null;jobSwaps=!1;materials=new Map;hazeMaterials=new Map;haze=new q;holed=null;current=null;hScale=0;budgetMs=4;budgetVrMs=2;vr=!1;constructor(){let e=()=>{let e=new q(Rd());return e.matrixAutoUpdate=!1,e.frustumCulled=!1,e.visible=!1,e.renderOrder=Md,e.name=`terrain`,{mesh:e,ground:null,up:new U,origin:new U,outer:0,inner:0,q:1,e:new U,nrt:new U,full:new Float64Array(43203),sunBF:new U,version:0}};this.front=e(),this.back=e(),this.group.name=`terrain`,this.haze.matrixAutoUpdate=!1,this.haze.frustumCulled=!1,this.haze.visible=!1,this.haze.renderOrder=Nd,this.haze.name=`terrain haze`,this.group.add(this.front.mesh,this.back.mesh,this.haze)}get owner(){return this.front.mesh.visible?this.front.ground?.owner??null:null}static threshold(e){return Math.max(4e4,e.radius*.03)}materialFor(e){let t=this.materials.get(e);return t||(t=new J({name:`terrain`,vertexShader:Pd,fragmentShader:e.fragmentShader,uniforms:{...e.uniforms,uTerrain:{value:1},uHScale:{value:0},uHoleDir:{value:new U},uHoleCos:{value:2},...Object.fromEntries(Ld.flatMap((e,t)=>[[`uOI${t}`,{value:new U}],[`uOF${t}`,{value:new U}]]))},transparent:!0,blending:0}),this.materials.set(e,t)),t}hazeFor(e,t){let n=this.hazeMaterials.get(e);return n||(n=new J({name:`terrain-haze`,vertexShader:Pd,fragmentShader:Pu,uniforms:{...e.uniforms,uHScale:t.uniforms.uHScale},transparent:!0,depthWrite:!1,blending:e.blending,blendSrc:e.blendSrc,blendDst:e.blendDst}),this.hazeMaterials.set(e,n)),n.uniforms.uHScale=t.uniforms.uHScale,n}warmupHaze(e){let t=new q(this.back.mesh.geometry,this.hazeFor(e,new J({uniforms:{uHScale:{value:0}}})));return t.visible=!1,t.frustumCulled=!1,this.group.add(t),t}warmupMesh(e){let t=this.materialFor(e),n=this.group.children.find(e=>e!==this.front.mesh&&e!==this.back.mesh&&e.material===t);return n||(n=new q(this.back.mesh.geometry,t),n.visible=!1,n.frustumCulled=!1,this.group.add(n)),n}update(e){let t=e?this.place(e):(this.hide(),null);this.current=t?e:null;let n=t?e.material:null;this.holed&&this.holed!==n&&(this.holed.uniforms.uHoleCos.value=2),this.holed=n,t&&n&&(n.uniforms.uHoleDir.value.copy(t.dir),n.uniforms.uHoleCos.value=t.cos)}place(t){let n=t.ground,r=Bd(t.rel,t.orient),i=r.clone().normalize(),a=r.length()-xd(n,i),o=e.threshold(n);if(a>o||!n.ready())return this.hide(),null;n.prepare?.(i);let s=this.materialFor(t.material);this.hScale=Math.min(1,Math.max(0,(o-a)/(o*.35))),s.uniforms.uHScale.value=this.hScale;let c=Math.min(n.radius*.45,5e5,Math.max(2e4,1.3*Math.sqrt(2*n.radius*(Math.max(a,0)+2*n.amplitude)))),l=Math.max(.25,Math.max(a,0)*.025),u=this.front;if((u.ground!==n||!u.mesh.visible||u.version!==(n.version?.()??0)||u.up.angleTo(i)*n.radius>Math.max(2*Math.max(a,0),25)||c>u.outer*1.3||c<u.outer*.6||l>u.inner*4||l<u.inner*.25)&&(!this.job||!this.jobSwaps)?(this.job=this.build(this.back,n,i,c,l,t.lonLeft,t.sunBF.clone()),this.jobSwaps=!0):!this.job&&u.ground===n&&u.mesh.visible&&u.sunBF.angleTo(t.sunBF)>.004&&(this.job=this.shadows(u,n,t.sunBF.clone()),this.jobSwaps=!1),this.job){let e=performance.now(),t=this.vr?this.budgetVrMs:this.budgetMs;for(;performance.now()-e<t;)if(this.job.next().done){if(this.job=null,!this.jobSwaps)break;let e=this.front;this.front=this.back,this.back=e,this.back.mesh.visible=!1,this.front.mesh.visible=!0;break}}let d=this.front;if(!d.mesh.visible||d.ground!==n)return null;d.mesh.material=s;let f=Number(s.uniforms.uSeed?.value??0);Ld.forEach((e,t)=>{let n=f*7.31*(t+1),r=[d.origin.x/e+n,d.origin.y/e+n*1.7,d.origin.z/e+n*2.3],i=r.map(Math.floor);s.uniforms[`uOI${t}`].value.set(i[0],i[1],i[2]),s.uniforms[`uOF${t}`].value.set(r[0]-i[0],r[1]-i[1],r[2]-i[2])});let p=d.mesh.matrix.copy(t.orient),m=d.origin.clone().applyMatrix4(new G().extractRotation(t.orient)).add(t.rel);return p.setPosition(m),d.mesh.matrixWorldNeedsUpdate=!0,this.haze.visible=!!t.air,t.air&&(this.haze.geometry=d.mesh.geometry,this.haze.material=this.hazeFor(t.air,s),this.haze.matrix.copy(p),this.haze.matrixWorldNeedsUpdate=!0),{dir:d.up,cos:Math.cos(d.outer*.96/n.radius)}}hide(){this.front.mesh.visible=!1,this.back.mesh.visible=!1,this.haze.visible=!1,this.job=null,this.front.ground=null}groundRadius(e){let t=this.front,n=t.ground;if(!n)return 0;let r=xd(n,e);if(!t.mesh.visible)return r;let i=Math.max(t.inner,t.up.angleTo(e)*n.radius*Math.max(t.q-1,2*Math.PI/Id));return r+n.height(e,i)*this.hScale*this.fade(n,e)}below(e){let t=this.current;if(!t)return null;let n=Bd(t.upos.sub(e,new U),t.orient),r=n.length(),i=n.divideScalar(r);return{dir:i,dist:r,ground:this.groundRadius(i),centre:t.upos}}fade(e,t){let n=this.front.up.angleTo(t)*e.radius/this.front.outer,r=Math.min(1,Math.max(0,(n-.82)/.12));return 1-r*r*(3-2*r)}*build(e,t,n,r,i,a,o){e.mesh.visible=!1,e.ground=t,e.version=t.version?.()??0,e.up.copy(n),e.outer=r,e.inner=i;let s=t.radius;e.origin.copy(n).multiplyScalar(xd(t,n));let c=e.e.crossVectors(new U(0,0,1),n);c.lengthSq()<1e-10&&c.set(1,0,0),c.normalize();let l=e.nrt.crossVectors(n,c),u=e.mesh.geometry,d=u.attributes.position,f=u.attributes.aN,p=u.attributes.aTN,m=u.attributes.aH,h=u.attributes.aUv,g=e.full,_=(r/i)**(1/149);e.q=_;let v=a*Math.PI/180,y=new U,b=(i,a,o,u)=>{let p=a/s,_=Math.cos(o),b=Math.sin(o);y.set(c.x*_+l.x*b,c.y*_+l.y*b,c.z*_+l.z*b).multiplyScalar(Math.sin(p)).addScaledVector(n,Math.cos(p)).normalize();let x=xd(t,y),S=a/r,C=Math.min(1,Math.max(0,(S-.82)/.12)),w=t.height(y,u)*(1-C*C*(3-2*C));d.setXYZ(i,y.x*x-e.origin.x,y.y*x-e.origin.y,y.z*x-e.origin.z),g[i*3]=y.x*(x+w)-e.origin.x,g[i*3+1]=y.y*(x+w)-e.origin.y,g[i*3+2]=y.z*(x+w)-e.origin.z,f.setXYZ(i,y.x,y.y,y.z),m.setX(i,w);let T=Math.atan2(y.y,y.x),E=Math.asin(Math.max(-1,Math.min(1,y.z))),D=(T-v)/(2*Math.PI);D-=Math.floor(D),h.setXY(i,D,.5+E/Math.PI)};b(0,0,0,i);for(let e=0;e<Fd;e++){let t=i*_**+e,n=Math.max(t*(_-1),2*Math.PI*t/Id);for(let r=0;r<Id;r++)b(1+e*Id+r,t,r/Id*2*Math.PI,n);e%4==3&&(yield)}let x=h.getX(0);for(let e=0;e<14401;e++){let t=h.getX(e);t-x>.5?h.setX(e,t-1):x-t>.5&&h.setX(e,t+1)}let S=e=>new U(g[e*3],g[e*3+1],g[e*3+2]),C=(e,t)=>e<0?0:1+e*Id+(t%Id+Id)%Id,w=new U;for(let e=0;e<Fd;e++){for(let t=0;t<Id;t++){let n=C(e,t),r=S(C(Math.min(e+1,149),t)).sub(S(C(e-1,t))),i=S(C(e,t+1)).sub(S(C(e,t-1)));w.crossVectors(r,i).normalize();let a=new U(f.getX(n),f.getY(n),f.getZ(n));w.dot(a)<0&&w.negate(),p.setXYZ(n,w.x,w.y,w.z)}e%16==15&&(yield)}w.set(0,0,0);for(let e=0;e<Id;e++)w.add(new U(p.getX(1+e),p.getY(1+e),p.getZ(1+e)));w.normalize(),p.setXYZ(0,w.x,w.y,w.z);for(let e of[d,f,p,m,h])e.needsUpdate=!0;yield*this.shadows(e,t,o)}*shadows(e,t,n){e.sunBF.copy(n);let r=e.mesh.geometry,i=r.attributes.aSun,a=r.attributes.aH.array,o=e.full,s=t.radius,c=Math.log(e.q),l=e.up,u=e.e,d=e.nrt,f=e.origin,p=n.x,m=n.y,h=n.z,g=(e,t)=>{let n=Math.floor(t),r=t-n,i=a[1+e*Id+(n%Id+Id)%Id];return i+(a[1+e*Id+((n+1)%Id+Id)%Id]-i)*r},_=new U,v=()=>{let t=_.x*l.x+_.y*l.y+_.z*l.z,n=_.y*l.z-_.z*l.y,r=_.z*l.x-_.x*l.z,i=_.x*l.y-_.y*l.x,o=Math.atan2(Math.sqrt(n*n+r*r+i*i),t)*s;if(o>=e.outer*.94)return NaN;let f=(Math.atan2(_.dot(d),_.dot(u))/(2*Math.PI)*Id+Id)%Id,p;if(o<e.inner)p=a[0]+(g(0,f)-a[0])*(o/e.inner);else{let t=Math.log(o/e.inner)/c,n=Math.min(149,Math.floor(t)),r=Math.min(149,n+1),i=Math.min(1,t-n);p=g(n,f)+(g(r,f)-g(n,f))*i}return y+p},y=0,b=-1/0;for(let e=0;e<a.length;e++)a[e]>b&&(b=a[e]);let x=14401,S=new Float32Array(x);for(let n=0;n<x;n++){let r=f.x+o[n*3],i=f.y+o[n*3+1],a=f.z+o[n*3+2],s=Math.sqrt(r*r+i*i+a*a);if((r*p+i*m+a*h)/s<-.05){S[n]=2;continue}let c=n===0?0:Math.floor((n-1)/Id),l=n===0?0:e.inner*e.q**+c,u=Math.max(e.inner,l*Math.max(e.q-1,2*Math.PI/Id)),d=2;for(let n=u*2;n<e.outer*2;n*=1.45){let e=r+p*n,o=i+m*n,s=a+h*n,c=Math.sqrt(e*e+o*o+s*s);if(_.set(e/c,o/c,s/c),y=xd(t,_),c-y>b)break;let l=v();if(Number.isNaN(l))break;if(d=Math.min(d,((c-l)/n+.003)/.016),d<=-2){d=-2;break}}S[n]=d,n%700==699&&(yield)}let C=(e,t)=>S[1+e*Id+(t%Id+Id)%Id];i.setX(0,S[0]);for(let e=0;e<Fd;e++)for(let t=0;t<Id;t++){let n=e===0?S[0]:C(e-1,t),r=C(e===149?e:e+1,t);i.setX(1+e*Id+t,(2*C(e,t)+n+r+C(e,t-1)+C(e,t+1))/6)}i.needsUpdate=!0}};function Bd(e,t){let n=new W().setFromMatrix4(t).transpose();return e.clone().negate().applyMatrix3(n)}var Vd=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${ku}
}`,Hd=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform sampler2D uClouds;
uniform float uCloudShift;
uniform mat3 uToBody;        // world direction -> body-fixed
uniform vec3 uCenter;        // planet centre relative to the camera (m)
uniform float uRadius;       // radius of the cloud layer (m)
uniform vec3 uSunDir;        // world
uniform vec3 uSunColor;
uniform float uSunIrr;
uniform float uExposure;
uniform float uOpacity;
uniform float uLite;
uniform float uUnder;        // 1 when the explorer is below the layer
varying vec3 vWorld;
float ch(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float cn(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(ch(i), ch(i + vec3(1,0,0)), f.x), mix(ch(i + vec3(0,1,0)), ch(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(ch(i + vec3(0,0,1)), ch(i + vec3(1,0,1)), f.x), mix(ch(i + vec3(0,1,1)), ch(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  vec3 n = normalize(vWorld - uCenter);
  vec3 nB = uToBody * n;
  float lon = atan(nB.y, nB.x), lat = asin(clamp(nB.z, -1.0, 1.0));
  vec2 uv = vec2(lon / 6.2831853 + 0.5 + uCloudShift, 0.5 + lat / 3.14159265);
  float c = texture2D(uClouds, uv).r;
  // the map is ~5 km per texel: generated billows break up its blur (kilometre scales)
  vec3 q = nB * (uRadius / 6000.0);
  float d = 0.5 * cn(q) + 0.3 * cn(q * 2.7 + 5.1) + (uLite > 0.5 ? 0.1 : 0.2 * cn(q * 7.3 + 9.7));
  float cov = smoothstep(0.42, 0.85, c + (d - 0.5) * 0.45);
  float dist = length(vWorld);
  cov *= uOpacity * smoothstep(450e3, 120e3, dist);
  if (cov < 0.004) discard;
  // sunlit tops, greyer from below; dark on the night side
  float mu = dot(n, uSunDir);
  float day = smoothstep(-0.12, 0.08, mu);
  float under = mix(1.0, 0.55, uUnder);
  vec3 L = uSunColor * (uSunIrr / 3.14159265) * 0.8 * (0.35 + 0.65 * max(mu, 0.0)) * day * under * (0.85 + 0.3 * d);
  gl_FragColor = vec4(min(L * uExposure * cov, vec3(6.0e4)), cov);
${Au}
  #include <logdepthbuf_fragment>
}`,Ud=class e{mesh;mat;static HEIGHT=7e3;constructor(e,t){this.mat=new J({name:`cloud-layer`,vertexShader:Vd,fragmentShader:Hd,uniforms:{uClouds:{value:e},uCloudShift:{value:0},uToBody:{value:new W},uCenter:{value:new U},uRadius:{value:1},uSunDir:{value:new U(1,0,0)},uSunColor:{value:new U(1,1,1)},uSunIrr:{value:Math.PI},uExposure:t,uOpacity:{value:0},uLite:Tu.uLite,uUnder:{value:0},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK},transparent:!0,depthWrite:!1,side:2,blending:5,blendSrc:201,blendDst:205}),this.mesh=new q(new Qi(1,384,192).rotateX(Math.PI/2),this.mat),this.mesh.matrixAutoUpdate=!1,this.mesh.frustumCulled=!1,this.mesh.visible=!1,this.mesh.renderOrder=19.97,this.mesh.name=`cloud layer`}update(t,n,r,i,a,o,s,c,l){if(this.mesh.visible=c>.002,!this.mesh.visible)return;let u=r+e.HEIGHT,d=this.mat.uniforms;d.uToBody.value.setFromMatrix4(n).transpose(),d.uCenter.value.copy(t),d.uRadius.value=u,d.uSunDir.value.copy(a),d.uSunColor.value.copy(s),d.uSunIrr.value=o,d.uOpacity.value=c,d.uCloudShift.value=l;let f=t.clone().negate().applyMatrix3(d.uToBody.value),p=f.clone().normalize(),m=1/Math.sqrt((p.x/r)**2+(p.y/r)**2+(p.z/i)**2);d.uUnder.value=+(f.length()-m<e.HEIGHT),this.mesh.matrix.copy(n).scale(new U(u,u,i+e.HEIGHT)).setPosition(t),this.mesh.matrixWorldNeedsUpdate=!0}};function Wd(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return(t>>>0)/4294967296}var Gd=(e,t,n)=>{let r=Math.max(0,Math.min(1,(n-e)/(t-e)));return r*r*(3-2*r)};function Kd(e,t,n,r,i=!1){let a=Wd(e),o=Wd(e+`#2`),s=Wd(e+`#3`),c=Wd(e+`#4`),l=Math.max(t||5800,1500),u=Math.max(n,.001),d=u<.05,f=u>80||r<-4.5,p=!f&&u>3.5,m=d?.6:f?10+15*o:p?1+1.5*o:Math.min(25,Math.max(.08,(l/5772)**1.7)),h=l<7200&&!d,g=4400*m/(l/5772*u),_=Math.min(260,Math.max(2.2,g/25)),v=d?.01:h?.16+.14*Gd(3,200,u)+.05*s:.025+.02*s,y;y=d||l>7200?0:f?.3*a:p?.25*a*a:l<3900?.15+.85*a*a:l<5300?.6*a*a:.4*a**3,i&&(y=.12);let b=y*(l<3900?.35:.18),x=!i&&(l<3900?c>.5:c>.85),S=Math.min(.78,Math.max(.22,.44+(5772-l)/2228*.16)),C=l>7400&&!d?.22*o*o:0,w=2*s-1,T=2*Math.PI*c,E=new U(Math.sqrt(1-w*w)*Math.cos(T),Math.sqrt(1-w*w)*Math.sin(T),w);return{seed:a*1e3,granFreq:_,granAmp:v,spots:b,spotLat:x?.75:.25+.15*o,faculae:Math.min(1,y*1.6),limbA:S,limbB:.2,rotRate:(x?.05:.012)*(f?.2:p?.4:1)*(.6+.8*o),flattening:C,gravDark:C*1.4,axis:E,corona:d?.2:f?.9:.5+.5*y+(l>15e3?.4:0),prominences:h&&!f?Math.min(1,y*1.4):0,flares:l<3900&&!p&&!f?y*.25:0}}function qd(e,t=new U(0,0,1)){return{uSeed:{value:e.seed},uGranFreq:{value:e.granFreq},uGranAmp:{value:e.granAmp},uSpots:{value:e.spots},uSpotLat:{value:e.spotLat},uFaculae:{value:e.faculae},uLimbA:{value:e.limbA},uLimbB:{value:e.limbB},uRotRate:{value:e.rotRate},uGravDark:{value:e.gravDark},uAxis:{value:t.clone()},uFlares:{value:e.flares}}}function Jd(e,t){e.uSeed.value=t.seed,e.uGranFreq.value=t.granFreq,e.uGranAmp.value=t.granAmp,e.uSpots.value=t.spots,e.uSpotLat.value=t.spotLat,e.uFaculae.value=t.faculae,e.uLimbA.value=t.limbA,e.uLimbB.value=t.limbB,e.uRotRate.value=t.rotRate,e.uGravDark.value=t.gravDark,e.uFlares.value=t.flares}var Yd=`
uniform float uExposure;
uniform float uPixelSA;
uniform float uMinEnergy;
uniform float uMaxRadius;
uniform float uGlare;
uniform float uPointGamma;
uniform float uPointGain;
uniform float uDpr;
uniform float uMaxEnergy;
uniform float uSat;
uniform float uHalo;   // halo/spike strength (1 for stars; small bodies use less)
`,Xd=`
float magToIrradiance(float m) { return 3.14159265 * exp2(-1.3287712 * (clamp(m, -60.0, 60.0) + 26.74)); }
// Returns sprite radius in CSS pixels (0 => cull). uPixelSA is the solid angle of one CSS pixel;
// callers set gl_PointSize = 2 * radius * uDpr so sprites keep their size on HiDPI screens.
float psfSetup(float irradiance, out float energy) {
  float raw = uExposure * irradiance / uPixelSA;
  if (!(raw >= uMinEnergy)) { energy = 0.0; return 0.0; }
  energy = min(uPointGain * pow(raw, uPointGamma), uMaxEnergy);
  float g = max(0.0, log2(raw / uMinEnergy));
  float rh = 0.6 + 0.42 * g * uHalo;
  float spikes = g > 8.0 ? 4.0 * rh * uGlare * uHalo : 0.0;
  return min(uMaxRadius, max(2.5, max(rh * 3.5, spikes)));
}
`,Zd=`
vec3 psfShade(vec2 pointCoord, float radius, float energy, vec3 color) {
  vec2 p = (pointCoord - 0.5) * 2.0 * radius;   // CSS pixels from centre
  float r2 = dot(p, p);
  float raw = pow(max(energy, 1e-6) / uPointGain, 1.0 / uPointGamma);
  float g = max(0.0, log2(raw / uMinEnergy));
  float core = (1.0 - exp(-energy * 0.35)) * exp(-r2 * 1.1834);           // sigma 0.65 px
  float rh = 0.6 + 0.42 * g * uHalo;
  float halo = uHalo * (0.04 + 0.3 * smoothstep(3.0, 11.0, g)) * min(1.0, energy) / pow(1.0 + r2 / (rh * rh), 1.5);
  float spikes = 0.0;
  if (g > 8.0 && uGlare > 0.0) {
    float L = 4.0 * rh;
    vec2 a = abs(p);
    float s1 = exp(-a.y * 1.6) * (1.0 - smoothstep(0.0, L, a.x)) / (1.0 + 4.0 * a.x / L);
    float s2 = exp(-a.x * 1.6) * (1.0 - smoothstep(0.0, L, a.y)) / (1.0 + 4.0 * a.y / L);
    spikes = (s1 + s2) * 0.28 * smoothstep(8.0, 13.0, g) * uGlare * uHalo;
  }
  float edge = 1.0 - smoothstep(0.8, 1.0, sqrt(r2) / radius);
  float lum = (core + halo + spikes) * edge;
  vec3 c = max(mix(vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), color, uSat), 0.0);
  return c * lum;
}
`,Qd=260,$d=140,ef=20,tf=40;function nf(e,t=128,n=64){let r=[],i=[],a=[],o=e*Math.PI/180;for(let e=0;e<=n;e++){let a=e/n,s=Math.PI/2-a*Math.PI;for(let e=0;e<=t;e++){let n=e/t,c=o+n*2*Math.PI;r.push(Math.cos(s)*Math.cos(c),Math.cos(s)*Math.sin(c),Math.sin(s)),i.push(n,1-a)}}for(let e=0;e<n;e++)for(let r=0;r<t;r++){let i=e*(t+1)+r,o=i+t+1;e!==0&&a.push(i,o,i+1),e!==n-1&&a.push(i+1,o,o+1)}let s=new mr;return s.setAttribute(`position`,new K(new Float32Array(r),3)),s.setAttribute(`uv`,new K(new Float32Array(i),2)),s.setIndex(a),s}function rf(e,t,n=256){let r=[],i=[];for(let a=0;a<=n;a++){let o=a/n*Math.PI*2;if(r.push(e*Math.cos(o),e*Math.sin(o),0,t*Math.cos(o),t*Math.sin(o),0),a<n){let e=a*2;i.push(e,e+1,e+2,e+1,e+3,e+2)}}let a=new mr;return a.setAttribute(`position`,new K(new Float32Array(r),3)),a.setIndex(i),a}var af=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
${Yd}
attribute float aIrr;     // irradiance at the observer (photometric units)
attribute vec3 aColor;
varying vec3 vColor;
varying float vEnergy;
varying float vRadius;
${Xd}
void main() {
  float energy;
  float radius = psfSetup(aIrr, energy);
  if (radius <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 1.0; return; }
  gl_Position = projectView(viewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${ku}
${Du}
  gl_PointSize = 2.0 * radius * uDpr;
  vRadius = radius; vEnergy = energy; vColor = aColor;
}`,of=`
#include <common>
#include <logdepthbuf_pars_fragment>
${Yd}
varying vec3 vColor; varying float vEnergy; varying float vRadius;
${Zd}
void main() {
  gl_FragColor = vec4(psfShade(gl_PointCoord, vRadius, vEnergy, vColor), 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`;function sf(e,t,n){if(n>=e+t)return 0;if(n<=Math.abs(e-t))return Math.PI*Math.min(e,t)**2;let r=Math.acos(Math.max(-1,Math.min(1,(n*n+e*e-t*t)/(2*n*e)))),i=Math.acos(Math.max(-1,Math.min(1,(n*n+t*t-e*e)/(2*n*t)))),a=(-n+e+t)*(n+e-t)*(n-e+t)*(n+e+t);return e*e*r+t*t*i-.5*Math.sqrt(Math.max(a,0))}var cf=class{system;manifest;texBase;rings_;group=new sn;views=new Map;meshes=new Map;clouds=null;rings=new Map;spheres=new Map;textures=new Map;loadedTex=new Map;loader=new Ia;bitmapLoader=new qa().setOptions({imageOrientation:`flipY`,premultiplyAlpha:`none`});hiTex=new Map;glare=null;sunCorona=null;sunLook=null;glareOn=!1;allowHi=!0;uploader=()=>void 0;atmosphere=()=>null;sprites;spritePos;spriteIrr;spriteCol;sunColor;ringTex=null;time=0;maxSprites;surfaceExposure={value:1};ringParticles=null;ringParticlesBody=null;terrainSource;constructor(e,t,n,r,i){this.system=e,this.manifest=t,this.texBase=n,this.rings_=i,this.group.name=`bodies`,this.terrainSource=new jd(n.replace(/\/textures$/,``));let a=au(e.sun.teff),o=su(a);this.sunColor=[a[0]/o,a[1]/o,a[2]/o],this.maxSprites=e.bodies.length+64;let s=new mr;this.spritePos=new Float32Array(this.maxSprites*3),this.spriteIrr=new Float32Array(this.maxSprites),this.spriteCol=new Float32Array(this.maxSprites*3),s.setAttribute(`position`,new K(this.spritePos,3).setUsage(Ue)),s.setAttribute(`aIrr`,new K(this.spriteIrr,1).setUsage(Ue)),s.setAttribute(`aColor`,new K(this.spriteCol,3).setUsage(Ue)),this.sprites=new Li(s,new J({vertexShader:af,fragmentShader:of,uniforms:{...r},transparent:!0,depthWrite:!1,depthTest:!0,blending:2})),this.sprites.frustumCulled=!1,this.sprites.renderOrder=10,this.group.add(this.sprites)}sphere(e){let t=this.spheres.get(e);return t||(t=nf(e),this.spheres.set(e,t)),t}texture(n){let r=this.textures.get(n);if(!r){let i=this.manifest.maps[n],a=`${this.texBase}/${i?i.file:n}`;r=this.loader.loadAsync(a).then(r=>{r.colorSpace=Re,r.wrapS=e,r.wrapT=t,r.minFilter=c,r.magFilter=o,r.anisotropy=8,r.colorSpace=``;let i={tex:r,meanLum:uf(r.image)};return this.loadedTex.set(n,i),i}),this.textures.set(n,r)}return r}textureKey(e){if(e.texture)return e.texture;let t=e.name.toLowerCase();return this.manifest.maps[t]?t:null}reliefKey(e){let t=`${e.name.toLowerCase()}_relief`;return this.manifest.maps[t]?t:null}loadData(n){let r=this.manifest.maps[n];return this.loader.loadAsync(`${this.texBase}/${r.file}`).then(n=>(n.colorSpace=``,n.wrapS=e,n.wrapT=t,n.minFilter=c,n.magFilter=o,n.anisotropy=4,n))}wantHi(n,r){let i=this.manifest.maps[n];if(!i?.hi)return null;let a=this.hiTex.get(n);if(!a){a={tex:null,lastWanted:r},this.hiTex.set(n,a);let s=a;this.bitmapLoader.loadAsync(`${this.texBase}/${i.hi.file}`).then(r=>{if(this.hiTex.get(n)!==s){r.close?.();return}let i=new Dt(r);i.flipY=!1,i.colorSpace=``,i.wrapS=e,i.wrapT=t,i.minFilter=c,i.magFilter=o,i.anisotropy=8,i.needsUpdate=!0,s.tex=i}).catch(e=>console.warn(`high-resolution map failed`,n,e))}return a.lastWanted=r,a.tex}releaseHi(e){for(let[t,n]of this.hiTex)if(!(e-n.lastWanted<ef)){if(n.tex){let e=n.tex.image;n.tex.dispose(),e?.close?.()}this.hiTex.delete(t)}}prefetch(e){if(!e.valid)return;let t=this.meshes.get(e)??this.createMesh(e);t.visible=!1;let n=this.textureKey(e),r=[];n&&r.push(this.texture(n)),e.name===`Earth`&&r.push(this.texture(`earth_night`),this.texture(`earth_clouds`));let i=this.reliefKey(e);i&&this.requestRelief(i,t.material.uniforms);for(let e of r)e.then(e=>this.uploader(e.tex)).catch(()=>void 0)}warmupObjects(){let e=[],t=this.system.bodies.find(e=>e.name===`Saturn`);for(let n of[this.system.sun,t]){if(!n)continue;let t=this.meshes.get(n)??this.createMesh(n);e.push(t);let r=this.rings.get(n);r&&e.push(r)}return this.glare&&e.push(this.glare),this.sunCorona&&e.push(this.sunCorona.mesh),e}createMesh(e){let t=this.textureKey(e),n=t?this.manifest.maps[t]:void 0,r=e.kind===`star`,i=new J({name:r?`sun-surface`:`body`,vertexShader:ed,fragmentShader:r?nd:td,uniforms:{uMap:{value:null},uHasMap:{value:0},uMapGray:{value:+(n?.channels===`L`)},uNight:{value:null},uHasNight:{value:0},uClouds:{value:null},uHasClouds:{value:0},uCloudShift:{value:0},uCloudVis:{value:1},uColor:{value:new U(...e.color)},uAlbedoScale:{value:1},uAirless:{value:+!!e.isAirless},uBands:{value:!t&&(e.isGasGiant||e.name===`Venus`)?1:0},uRelief:{value:null},uHasRelief:{value:0},uWater:{value:0},uAtmo:{value:0},uRp:{value:e.radii[0]},uBetaR:{value:new U},uHR:{value:8e3},uBetaMe:{value:new U},uHM:{value:1200},uSeed:{value:Wd(e.name)*500},uProc:{value:0},uIcy:{value:0},uTint:{value:new U(1,1,1)},uCraters:{value:0},uLumpy:{value:0},uRadiusM:{value:e.radius},uMapW:{value:0},uDetail:{value:null},uDetailRect:{value:new Ot(0,0,1,1)},uDetailOn:{value:0},uLite:Tu.uLite,uTerrain:{value:0},uHScale:{value:0},uHoleDir:{value:new U(0,0,1)},uHoleCos:{value:2},uSunDir:{value:new U(1,0,0)},uSunIrr:{value:Math.PI},uSunColor:{value:new U(...this.sunColor)},uExposure:this.surfaceExposure,uBodyToWorld:{value:new W},uBodyCenter:{value:new U},uOcc:{value:[new Ot,new Ot,new Ot,new Ot]},uOccRed:{value:new Ot},uOccN:{value:0},uSunRel:{value:new U},uSunR:{value:Kl},uHasRings:{value:0},uRingTex:{value:null},uRingRadii:{value:new U},uRadiance:{value:1},uTime:{value:0},...r?qd(this.sunLook=Kd(`sun`,e.teff,1,4.83,!0)):{},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK},side:0}),a=new q(this.sphere(n?.lonLeft??-180),i);a.matrixAutoUpdate=!1,a.frustumCulled=!1,a.name=e.name,a.renderOrder=1,this.group.add(a),this.meshes.set(e,a);let o=i.uniforms;if(r){let t=su(au(e.teff)),n=au(e.teff);o.uColor.value.set(n[0]/t,n[1]/t,n[2]/t),o.uRadiance.value=(Pl/Kl)**2}else{let r=e.meta.albedo!==void 0,i=Math.min(1,1.5*e.albedo);this.surfaceLook(e,o,t,n?.width??0),t?this.texture(t).then(({tex:e,meanLum:t})=>{o.uMap.value=e,o.uHasMap.value=1,o.uAlbedoScale.value=r?i/Math.max(t,.001):1}):o.uAlbedoScale.value=i/Math.max(su(e.color),.001),e.name===`Earth`&&(this.texture(`earth_night`).then(({tex:e})=>{o.uNight.value=e,o.uHasNight.value=1}),this.texture(`earth_clouds`).then(({tex:e})=>{o.uClouds.value=e,o.uHasClouds.value=1,this.clouds=new Ud(e,this.surfaceExposure),this.group.add(this.clouds.mesh)}));let a=this.rings_[e.name.toLowerCase()];a&&this.createRings(e,a,o);let s=this.atmosphere(e);s?.surfaceTransmittance&&(o.uAtmo.value=1,o.uBetaR.value.set(...s.betaR),o.uHR.value=s.HR,o.uBetaMe.value.set(...s.betaMe),o.uHM.value=s.HM)}return r&&(this.createGlare(e),this.sunCorona=new dd,this.group.add(this.sunCorona.mesh)),a}surfaceLook(e,t,n,r){let i=t=>Wd(e.name+t);if(e.isGasGiant||e.kind===`star`||[`Venus`,`Earth`,`Titan`].includes(e.name))return;let a=e.radius;t.uLumpy.value=(a<2e4?.22:a<8e4?.14:a<2e5?.07:0)*(n?.4:1)*(.7+.6*i(`l`));let o=[`Io`,`Europa`,`Enceladus`,`Triton`].includes(e.name),s=(e.kind===`tno`||e.kind===`dwarf`)&&e.meta.albedo!==void 0&&e.albedo>.6;if(t.uCraters.value=o?.15:s?.2:e.kind===`tno`?.55:.85+.15*i(`c`),n){t.uMapW.value=o?0:r;return}t.uProc.value=1;let c=e.meta.albedo!==void 0,l=e.pos.length()>4.5*Pl,u=c?e.albedo:l?.6:e.albedo,d=u>.45?1:u>.3?.5:0;t.uIcy.value=d;let f=(e,t)=>[e[0]*(1+t*(i(`r`)-.5)),e[1]*(1+t*(i(`g`)-.5)),e[2]*(1+t*(i(`b`)-.5))],p=e.color.some((e,t)=>Math.abs(e-[.6,.6,.6][t])>.001),m,h;if(e.kind===`tno`){let e=i(`red`);m=f([1,.82-.25*e,.68-.35*e],.15),h=[.85+.3*i(`t`),.75,.65]}else d>=1?(m=f([.93,.95,.98],.08),h=[.8,.86,.95]):u<.1?(m=f([.42,.4,.38],.15),h=[.75,.68,.6]):(m=f([.85,.76,.66],.2),h=[.9,.85,.8]);p&&(m=[e.color[0],e.color[1],e.color[2]]),t.uColor.value.set(...m),t.uTint.value.set(...h),e.color=m}createGlare(e){if(this.glare)return;let t=au(e.teff),n=su(t),r=new J({vertexShader:sd,fragmentShader:cd,uniforms:{uColor:{value:new U(t[0]/n,t[1]/n,t[2]/n)},uIntensity:{value:1},uDiskFrac:{value:.1},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK},transparent:!0,depthWrite:!1,blending:2});this.glare=new q(new Xi(2,2),r),this.glare.matrixAutoUpdate=!1,this.glare.frustumCulled=!1,this.glare.renderOrder=15,this.glare.visible=!1,this.group.add(this.glare)}createRings(e,n,r){let i=e.radii[0],a=n.innerKm*1e3/i,s=n.outerKm*1e3/i;this.ringTex||(this.ringTex=this.loader.load(`${this.texBase}/${n.texture}`),this.ringTex.minFilter=c,this.ringTex.magFilter=o,this.ringTex.wrapS=t),r.uHasRings.value=1,r.uRingTex.value=this.ringTex,r.uRingRadii.value.set(a,s,0);let l=new J({vertexShader:ad,fragmentShader:od,uniforms:{uRingTex:{value:this.ringTex},uRingRadii:{value:new U(a,s,0)},uColor:{value:new U(...e.color)},uSunDirBF:{value:new U},uViewDirBF:{value:new U},uSunIrr:{value:Math.PI},uExposure:this.surfaceExposure,uPlanetRadius:{value:1},uPolar:{value:e.radii[2]/e.radii[0]},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK},transparent:!0,depthWrite:!1,side:2,blending:5,blendSrc:201,blendDst:205}),u=new q(rf(a,s),l);u.matrixAutoUpdate=!1,u.frustumCulled=!1,u.renderOrder=2,this.group.add(u),this.rings.set(e,u),this.ringParticles||(this.ringParticles=new vd(`${this.texBase}/${n.texture}`,n.innerKm*1e3,n.outerKm*1e3,[.75,.68,.58],this.surfaceExposure),this.ringParticlesBody=e,this.group.add(this.ringParticles.mesh))}update(e,t,n,r){this.time+=n,this.clouds&&(this.clouds.mesh.visible=!1);let i=performance.now()/1e3,a=this.system.sun.upos.sub(e,new U),o=0,s=new G,c=new W,l=new U;for(let n of this.system.bodies){if(!n.valid){this.views.delete(n);continue}let r=this.views.get(n)??{body:n,rel:new U,dist:0,pixelRadius:0,irradiance:0,apparentMag:99,resolved:!1};n.upos.sub(e,r.rel);let u=r.rel.length();r.dist=u;let d=n.radius/Math.max(u,n.radius*1.0001);r.pixelRadius=Math.asin(Math.min(1,d))/t;let f,p;if(n.kind===`star`)f=$l(Math.max(u,n.radius)),p=this.sunColor;else{let e=l.copy(a).sub(r.rel),t=e.length(),i=e.dot(r.rel)/(t*u)*-1,o=Math.acos(Math.max(-1,Math.min(1,i)));f=$l(t)*n.albedo*(n.radius/Math.max(u,n.radius))**2*Ql(o),p=n.color}r.irradiance=f,r.apparentMag=-26.74-2.5*Math.log10(f/Math.PI),r.resolved=r.pixelRadius>.6,this.views.set(n,r);let m=1-lf(.6,1.8,r.pixelRadius);m>0&&o<this.maxSprites&&(this.spritePos[o*3]=r.rel.x,this.spritePos[o*3+1]=r.rel.y,this.spritePos[o*3+2]=r.rel.z,this.spriteIrr[o]=f*m,this.spriteCol[o*3]=p[0],this.spriteCol[o*3+1]=p[1],this.spriteCol[o*3+2]=p[2],o++);let h=this.meshes.get(n);if(r.resolved){h??=this.createMesh(n),h.visible=!0,s.copy(n.orientation).scale(l.set(n.radii[0],n.radii[1],n.radii[2])).setPosition(r.rel),h.matrix.copy(s),h.matrixWorldNeedsUpdate=!0;let e=h.material.uniforms;if(this.updateMaps(n,e,r.pixelRadius,i),c.setFromMatrix4(n.orientation),e.uBodyToWorld.value.copy(c),e.uBodyCenter.value.copy(r.rel),e.uTime.value=this.time,n.kind!==`star`){let t=l.copy(a).sub(r.rel),n=t.length();e.uSunDir.value.copy(t).divideScalar(n),e.uSunIrr.value=$l(n)}if(e.uHasClouds.value){let t=Math.min(1,Math.max(0,(r.dist-n.radius-5e4)/1e5));e.uCloudVis.value=t*t*(3-2*t);let i=r.rel.clone().negate().applyMatrix3(c.clone().transpose()),a=i.length()-jd.baseRadius(n,i.normalize()),o=Math.min(1,Math.max(0,(a-12e3)/18e3));this.clouds?.update(r.rel,n.orientation,n.radii[0],n.radii[2],e.uSunDir.value,e.uSunIrr.value,e.uSunColor.value,(1-e.uCloudVis.value)*o*o*(3-2*o),e.uCloudShift.value)}let t=this.rings.get(n);if(t){t.visible=!0,t.matrix.copy(n.orientation).scale(l.set(n.radii[0],n.radii[0],n.radii[0])).setPosition(r.rel),t.matrixWorldNeedsUpdate=!0;let i=t.material.uniforms,a=c.clone().transpose();i.uSunDirBF.value.copy(e.uSunDir.value).applyMatrix3(a),i.uViewDirBF.value.copy(r.rel).negate().normalize().applyMatrix3(a),i.uSunIrr.value=e.uSunIrr.value}this.ringParticles&&n===this.ringParticlesBody&&this.ringParticles.update(r.rel,yd(n.orientation),n.radius,e.uSunDir.value,e.uSunIrr.value)}else if(h){h.visible=!1;let e=this.rings.get(n);e&&(e.visible=!1),this.ringParticles&&n===this.ringParticlesBody&&this.ringParticles.update(null,n.orientation,n.radius,new U,0)}let g=this.rings.get(n);g&&!r.resolved&&(g.visible=!1)}this.updateEclipses(a),this.updateGlare(r),this.releaseHi(i),this.sprites.geometry.setDrawRange(0,o),this.sprites.geometry.attributes.position.needsUpdate=!0,this.sprites.geometry.attributes.aIrr.needsUpdate=!0,this.sprites.geometry.attributes.aColor.needsUpdate=!0}occluders=null;sunlit=new Map;eclipsed(e){let t=this.meshes.get(e);return!!t&&t.material.uniforms.uOccN?.value>0}updateEclipses(e){this.occluders??=this.system.bodies.filter(e=>e.kind!==`star`&&e.radius>5e4);let t=new U,n=new U;for(let r of this.views.values()){let i=r.body,a=this.meshes.get(i);if(!r.resolved||!a||i.kind===`star`)continue;let o=a.material.uniforms;if(!o.uOcc)continue;t.copy(e).sub(r.rel);let s=t.length();t.divideScalar(s);let c=Kl/s,l=o.uOcc.value,u=o.uOccRed.value,d=0,f=1,p=0;for(let e of this.occluders){if(e===i||!e.valid)continue;let a=this.views.get(e);if(!a)continue;n.copy(a.rel).sub(r.rel);let o=n.dot(t);if(o<=0||o>=s||Math.sqrt(Math.max(0,n.lengthSq()-o*o))>e.radius+i.radius+o*c*1.05)continue;l[d].set(a.rel.x,a.rel.y,a.rel.z,e.radius);let m=+!!this.atmosphere(e)?.surfaceTransmittance;u.setComponent(d,m);let h=n.length(),g=sf(c,e.radius/h,Math.atan2(n.clone().cross(t).length(),o))/(Math.PI*c*c);if(f*=1-g,p=Math.max(p,g*m),++d===4)break}this.sunlit.set(i,Math.max(f,p*.004)),o.uOccN.value=d,o.uSunRel.value.copy(e)}}terrainOk(e){if(e.kind===`star`||e.isGasGiant||[`Venus`,`Titan`].includes(e.name)||e.radius<15e4)return!1;let t=this.meshes.get(e);return!!t&&t.material.uniforms.uLumpy.value===0}terrainCandidate(){let e=null,t=1/0;for(let n of this.views.values()){if(!n.resolved)continue;let r=n.dist-n.body.radius;r<t&&r<zd.threshold(n.body)*1.2&&this.terrainOk(n.body)&&(t=r,e=n)}if(!e)return null;let n=e.body,r=this.meshes.get(n).material;this.terrainSource.craters.set(n,r.uniforms.uCraters.value);let i=this.textureKey(n),a=r.uniforms.uSunDir.value.clone().applyMatrix3(new W().setFromMatrix4(n.orientation).transpose());return{ground:this.terrainSource.ground(n),material:r,upos:n.upos,rel:e.rel.clone(),orient:n.orientation,lonLeft:i?this.manifest.maps[i]?.lonLeft??-180:-180,sunBF:a,alt:t}}detailBody=null;updateDetail(e,t,n,r){let i=null;for(let e of this.views.values()){if(!e.resolved||e.pixelRadius<300)continue;let n=this.textureKey(e.body);n&&t.has(n)&&(!i||e.pixelRadius>i.pixelRadius)&&(i=e)}let a=!1;if(i){let o=i.body,s=this.meshes.get(o),c=s?s.material.uniforms:null,l=this.textureKey(o);if(c&&c.uHasMap.value===1){let s=new W().copy(c.uBodyToWorld.value).transpose(),u=i.rel.clone().negate().applyMatrix3(s),d=r.clone().applyMatrix3(s).normalize();a=t.update(e,l,c.uMap.value,o.radius,u,d,n,this.manifest.maps[l].lonLeft),a&&(c.uDetail.value=t.binding.texture,c.uDetailRect.value.copy(t.binding.rect),c.uDetailOn.value=1,c.uMapW.value>0&&(c.uMapW.value=t.binding.mapWidth))}}let o=this.detailBody;if(this.detailBody=a?i.body:null,o&&o!==this.detailBody){let e=this.meshes.get(o);if(e){let t=e.material.uniforms;t.uDetailOn.value=0;let n=this.textureKey(o);n&&t.uMapW.value>0&&(t.uMapW.value=this.hiTex.has(n)?this.manifest.maps[n].hi?.width??this.manifest.maps[n].width:this.manifest.maps[n].width)}}}updateMaps(e,t,n,r){let i=this.textureKey(e);if(i&&this.manifest.maps[i]?.hi){let e=this.hiTex.get(i),a=this.allowHi&&(n>Qd||e!==void 0&&n>$d)?this.wantHi(i,r):null,o=this.loadedTex.get(i)?.tex??null,s=a??o;s&&t.uMap.value!==s&&(t.uMap.value=s,t.uMapW.value>0&&(t.uMapW.value=a?this.manifest.maps[i].hi.width:this.manifest.maps[i].width))}let a=this.reliefKey(e);a&&n>tf&&this.requestRelief(a,t)}requestRelief(e,t){if(this.reliefRequested.has(e))return;this.reliefRequested.add(e);let n=this.manifest.maps[e].channels===`relief+water`;this.loadData(e).then(e=>{this.uploader(e),t.uRelief.value=e,t.uHasRelief.value=1,t.uWater.value=+!!n}).catch(t=>console.warn(`relief map failed`,e,t))}reliefRequested=new Set;updateGlare(e){let t=this.views.get(this.system.sun);if(this.sunCorona&&this.sunLook){if(t&&t.resolved&&t.pixelRadius>1.5&&e){let n=au(this.system.sun.teff),r=su(n);this.sunCorona.update(t.rel,this.system.sun.radius,e,[n[0]/r,n[1]/r,n[2]/r],this.surfaceExposure.value*(Pl/Kl)**2,this.sunLook,this.time)}else this.sunCorona.hide()}let n=this.glare;if(!n)return;let r=this.system.sun,i=this.views.get(r);if(n.visible=this.glareOn&&!!i&&i.resolved&&!!e,!n.visible||!i||!e)return;let a=Math.asin(Math.min(1,r.radius/Math.max(i.dist,r.radius*1.0001))),o=Math.max(a*14,10*Math.PI/180),s=Math.tan(Math.min(o,1.2))*i.dist,c=n.material.uniforms;c.uDiskFrac.value=Math.min(.9,a/Math.min(o,1.2));let l=this.surfaceExposure.value*(Pl/Kl)**2;c.uIntensity.value=.9*Math.min(1,l/2.5),n.matrix.compose(i.rel,e,new U(s,s,s)),n.matrixWorldNeedsUpdate=!0}};function lf(e,t,n){let r=Math.max(0,Math.min(1,(n-e)/(t-e)));return r*r*(3-2*r)}function uf(e){try{let t=document.createElement(`canvas`);t.width=64,t.height=32;let n=t.getContext(`2d`,{willReadFrequently:!0});n.drawImage(e,0,0,64,32);let r=n.getImageData(0,0,64,32).data,i=0,a=0;for(let e=0;e<32;e++){let t=Math.cos(((e+.5)/32-.5)*Math.PI);for(let n=0;n<64;n++){let o=(e*64+n)*4,s=e=>(e/=255,e<=.04045?e/12.92:((e+.055)/1.055)**2.4),c=.2126*s(r[o])+.7152*s(r[o+1])+.0722*s(r[o+2]);c<.002||(i+=t*c,a+=t)}}return a>0?i/a:.3}catch{return .3}}var df=[{name:`Olympus Mons`,body:`Mars`,lat:18.65,lon:-133.8,h:21e3,view:7e4,about:`the tallest volcano known, about 22 km above the Martian datum`},{name:`Valles Marineris`,body:`Mars`,lat:-13.9,lon:-59.2,h:-4e3,view:45e3,about:`a canyon system 4,000 km long and up to 7 km deep`},{name:`Gale Crater (Curiosity)`,body:`Mars`,lat:-4.589,lon:137.441,h:-4500,view:8e3,about:`where NASA's Curiosity rover landed in 2012`},{name:`Opportunity (Eagle crater)`,body:`Mars`,lat:-1.9462,lon:-5.5266,h:-1400,view:6e3,about:`where NASA's Opportunity rover landed in 2004; it drove 45 km in 14 years`},{name:`Spirit (Gusev crater)`,body:`Mars`,lat:-14.5684,lon:175.4726,h:-1900,view:8e3,about:`where NASA's Spirit rover landed in 2004`},{name:`Jezero Crater (Perseverance)`,body:`Mars`,lat:18.445,lon:77.451,h:-2600,view:8e3,about:`where NASA's Perseverance rover landed in 2021`},{name:`Apollo 11 landing site`,body:`Moon`,lat:.674,lon:23.473,h:-1900,view:4e3,about:`Tranquility Base, 20 July 1969`},{name:`Apollo 15 landing site`,body:`Moon`,lat:26.1322,lon:3.6339,h:-1900,view:15e3,about:`Hadley Rille below the Apennine mountains, July 1971 (the first lunar rover)`},{name:`Apollo 17 landing site`,body:`Moon`,lat:20.1908,lon:30.7717,h:-2600,view:12e3,about:`the Taurus-Littrow valley, December 1972, the last Apollo landing`},{name:`Chang'e 4 (far side)`,body:`Moon`,lat:-45.4446,lon:177.5991,h:-5900,view:8e3,about:`the first landing on the Moon's far side, January 2019, in Von Kármán crater`},{name:`Tycho`,body:`Moon`,lat:-43.31,lon:-11.36,h:-2e3,view:7e4,about:`a young crater 85 km across with bright rays`},{name:`Copernicus`,body:`Moon`,lat:9.62,lon:-20.08,h:-3e3,view:75e3,about:`a 93 km crater with terraced walls and central peaks`},{name:`Shackleton (lunar south pole)`,body:`Moon`,lat:-89.67,lon:129.78,h:-1e3,view:3e4,about:`a crater whose floor never sees the Sun, near the Artemis landing regions`},{name:`Caloris Basin`,body:`Mercury`,lat:31.5,lon:162.7,h:0,view:3e5,about:`an impact basin 1,550 km across`},{name:`Mount Everest`,body:`Earth`,lat:27.988,lon:86.925,h:8800,view:25e3,elev:9,about:`the highest mountain above sea level, 8,849 m, in the Himalaya`},{name:`Grand Canyon`,body:`Earth`,lat:36.06,lon:-112.14,h:2100,view:14e3,elev:25,about:`a canyon 446 km long and up to 1.8 km deep, cut by the Colorado River`},{name:`Kilimanjaro`,body:`Earth`,lat:-3.0674,lon:37.3556,h:5900,view:35e3,elev:9,about:`the highest mountain in Africa, 5,895 m, a dormant volcano`},{name:`Matterhorn (Alps)`,body:`Earth`,lat:45.9763,lon:7.6586,h:4500,view:25e3,elev:10,about:`a 4,478 m peak of the Alps on the Swiss-Italian border`},{name:`Mauna Kea (Hawaii)`,body:`Earth`,lat:19.8207,lon:-155.468,h:4200,view:6e4,elev:7,about:`a volcano 4,207 m above the sea and over 10 km from its base on the ocean floor`},{name:`Mount Fuji`,body:`Earth`,lat:35.3606,lon:138.7274,h:3700,view:3e4,elev:6,about:`Japan's highest mountain, 3,776 m, a near-symmetrical volcanic cone`},{name:`Denali`,body:`Earth`,lat:63.0695,lon:-151.0074,h:6100,view:35e3,elev:9,about:`the highest mountain in North America, 6,190 m, in the Alaska Range`}],ff=class{def;world;kind=`place`;key;radius=0;dirBF;constructor(e,t){this.def=e,this.world=t,this.key=`place:${e.name}`;let n=e.lat*Math.PI/180,r=e.lon*Math.PI/180;this.dirBF=new U(Math.cos(n)*Math.cos(r),Math.cos(n)*Math.sin(r),Math.sin(n))}get name(){return this.def.name}get parentObject(){return this.world}up(){return this.dirBF.clone().transformDirection(this.world.orientation)}approachDir(e){let t=this.up(),n=e.clone().addScaledVector(t,-e.dot(t));if(n.lengthSq()<1e-6)return t;n.normalize();let r=(this.def.elev??36.87)*Math.PI/180,i=n.clone().cross(t),a=this.def.elev===void 0?0:.8,o=n.multiplyScalar(1).addScaledVector(i,a).normalize();return t.clone().multiplyScalar(Math.sin(r)).addScaledVector(o,Math.cos(r)).normalize()}get upos(){return this.world.upos.clone().addVec(this.up(),xd(this.world,this.dirBF)+this.def.h)}info(){let e=this.def;return[[`Type`,`Place on ${e.body}`],[`About`,e.about],[`Coordinates`,`${Math.abs(e.lat).toFixed(2)}° ${e.lat>=0?`N`:`S`}, ${Math.abs(e.lon).toFixed(2)}° ${e.lon>=0?`E`:`W`}`],[`Ground`,`real elevation model (${e.body}) with generated detail; fly down to land`]]}},pf=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
uniform vec3 uNucleus;   // camera-relative (m)
uniform vec3 uAxis;      // anti-sunward unit vector
uniform vec3 uAcross;    // unit vector across the tail, perpendicular to the view
uniform vec4 uExtent;    // s from, s to, t half-width (m), unused
attribute vec2 aST;      // 0..1 corners
varying vec2 vST;        // metres along / across the tail
void main() {
  float s = mix(uExtent.x, uExtent.y, aST.x);
  float t = mix(-uExtent.z, uExtent.z, aST.y);
  vST = vec2(s, t);
  vec3 p = uNucleus + uAxis * s + uAcross * t;
  gl_Position = projectView(viewMatrix * vec4(p, 1.0));
  #include <logdepthbuf_vertex>
${ku}
}`,mf=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uRc;       // coma radius (m)
uniform float uLi;       // ion tail length scale (m)
uniform float uLd;       // dust tail length scale (m)
uniform float uBend;     // dust tail curvature across (-1..1)
uniform float uL0;       // peak coma brightness relative to the Milky Way's typical surface brightness
uniform float uGain;     // display gain of the sky (dark-adapted = 1), shared with the Milky Way
varying vec2 vST;
void main() {
  float s = vST.x, t = vST.y;
  float rho = length(vST);
  // coma: a broad glow and a bright inner part
  float coma = 0.7 * exp(-rho * rho / (2.0 * uRc * uRc)) + 0.3 * exp(-rho / (0.25 * uRc));
  // ion (plasma) tail: narrow, straight away from the Sun, bluish
  float wi = 0.12 * uRc + 0.012 * max(s, 0.0);
  float ion = s > 0.0 ? exp(-t * t / (2.0 * wi * wi)) * exp(-s / uLi) * smoothstep(0.0, uRc, s) : 0.0;
  // dust tail: broader, curving back along the orbit, yellowish
  float tc = uBend * s * s / uLd;
  float wd = 0.35 * uRc + 0.1 * max(s, 0.0);
  float dust = exp(-(t - tc) * (t - tc) / (2.0 * wd * wd)) * exp(-max(s, 0.0) / uLd) * smoothstep(-uRc, uRc, s);
  vec3 c = coma * vec3(1.0, 0.98, 0.92) + ion * 0.35 * vec3(0.45, 0.7, 1.4) + dust * 0.4 * vec3(1.1, 0.95, 0.75);
  // glow, not a wall of white: soft ceiling on the displayed level (like the eye's response to the sky)
  vec3 x = c * uL0 * 0.1 * uGain;
  gl_FragColor = vec4(1.2 * (1.0 - exp(-x / 1.2)), 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,hf=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
varying vec3 vN;
varying vec3 vPos;
void main() {
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${ku}
}`,gf=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uSunDir;
uniform float uSunIrr;
uniform float uExposure;
varying vec3 vN;
varying vec3 vPos;
void main() {
  vec3 n = normalize(vN);
  float mu0 = max(dot(n, uSunDir), 0.0);
  // very dark, slightly reddish organic-rich dust (albedo ~0.05, as measured for 67P and others)
  vec3 rad = vec3(0.055, 0.05, 0.045) * (mu0 + 0.03) * (uSunIrr / 3.14159265);
  gl_FragColor = vec4(min(rad * uExposure, vec3(6.0e4)), 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,_f=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uRc;       // jet width at the base (m)
uniform float uLi;       // jet length (m)
uniform float uL0;
uniform float uGain;
varying vec2 vST;
void main() {
  float s = vST.x, t = vST.y;
  float w = uRc * (1.0 + 2.5 * max(s, 0.0) / uLi);
  float j = s > 0.0 ? exp(-t * t / (2.0 * w * w)) * exp(-s / uLi) * smoothstep(0.0, uRc * 0.5, s) : 0.0;
  vec3 x = vec3(0.95, 0.97, 1.0) * j * uL0 * 0.1 * uGain;
  gl_FragColor = vec4(1.0 - exp(-x), 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`;function vf(){let e=new Yi(1,4),t=e.attributes.position,n=[[-.42,0,.72],[.5,.08,.52]],r=new U;for(let e=0;e<t.count;e++){r.set(t.getX(e),t.getY(e),t.getZ(e)).normalize();let i=0;for(let[e,t,a]of n){let n=r.x*e+r.y*t,o=e*e+t*t-a*a,s=n*n-o;s>=0&&(i=Math.max(i,n+Math.sqrt(s)))}let a=Math.sin(r.x*9.1+r.y*4.3)*Math.sin(r.y*7.7-r.z*5.9)*Math.sin(r.z*11.3+r.x*3.1);i*=1+.06*a,t.setXYZ(e,r.x*i,r.y*i,r.z*i)}return e.computeVertexNormals(),e}var yf=12,bf=Xl(21.5)/23504e-15,xf=class e{group=new sn;meshes=[];last=new Map;gain={value:1};nucleus;jets=[];nucleusView=null;constructor(e){this.group.name=`comet-tails`,this.nucleus=new q(vf(),new J({name:`comet-nucleus`,vertexShader:hf,fragmentShader:gf,uniforms:{uSunDir:{value:new U(1,0,0)},uSunIrr:{value:Math.PI},uExposure:e,uPullIn:Q.uPullIn,uDepthK:Q.uDepthK}})),this.nucleus.frustumCulled=!1,this.nucleus.visible=!1,this.nucleus.renderOrder=1,this.group.add(this.nucleus);let t=new mr;t.setAttribute(`position`,new K(new Float32Array(12),3)),t.setAttribute(`aST`,new K(new Float32Array([0,0,1,0,1,1,0,1]),2)),t.setIndex([0,1,2,0,2,3]);for(let e=0;e<yf;e++){let e=new q(t,new J({name:`comet-tail`,vertexShader:pf,fragmentShader:mf,uniforms:{uNucleus:{value:new U},uAxis:{value:new U(1,0,0)},uAcross:{value:new U(0,1,0)},uExtent:{value:[0,1,1,0]},uRc:{value:1},uLi:{value:1},uLd:{value:1},uBend:{value:0},uL0:{value:0},uGain:this.gain,uPullIn:Q.uPullIn,uDepthK:Q.uDepthK},transparent:!0,depthWrite:!1,blending:2,side:2}));e.frustumCulled=!1,e.visible=!1,e.renderOrder=8,this.meshes.push(e),this.group.add(e)}for(let e=0;e<4;e++){let e=new q(t,new J({name:`comet-jet`,vertexShader:pf,fragmentShader:_f,uniforms:{uNucleus:{value:new U},uAxis:{value:new U(1,0,0)},uAcross:{value:new U(0,1,0)},uExtent:{value:[0,1,1,0]},uRc:{value:1},uLi:{value:1},uL0:{value:0},uGain:this.gain,uPullIn:Q.uPullIn,uDepthK:Q.uDepthK},transparent:!0,depthWrite:!1,blending:2,side:2}));e.frustumCulled=!1,e.visible=!1,e.renderOrder=9,this.jets.push(e),this.group.add(e)}}updateNucleus(e,t,n,r,i){let a=!!e&&e.upos.sub(t,new U).length()<3e7;this.nucleus.visible=a;for(let e of this.jets)e.visible=a;if(this.nucleusView=null,!a||!e)return;let o=e.radius>0?e.radius:2e3,s=e.upos.sub(t,new U),c=n.sub(e.upos,new U).normalize(),l=0;for(let t of e.name)l=l*31+t.charCodeAt(0)>>>0;let u=new H().setFromAxisAngle(new U(Math.sin(l),Math.cos(l*.7),Math.sin(l*1.3)).normalize(),l%628/100);this.nucleus.position.copy(s),this.nucleus.quaternion.copy(u),this.nucleus.scale.setScalar(o);let d=this.nucleus.material.uniforms;d.uSunDir.value.copy(c),d.uSunIrr.value=r,this.nucleusView={rel:s,radius:o,radiance:.05*r/Math.PI};let f=s.clone().normalize();this.jets.forEach((e,t)=>{let n=new U(Math.sin(l*(t+1)*1.7),Math.cos(l*(t+2)*.9),Math.sin(l*(t+3)*1.1)).normalize(),r=c.clone().addScaledVector(n,.55).normalize(),a=new U().crossVectors(r,f);a.lengthSq()<1e-10&&a.set(0,0,1).cross(r),a.normalize();let u=e.material.uniforms;u.uNucleus.value.copy(s).addScaledVector(r,o*.6),u.uAxis.value.copy(r),u.uAcross.value.copy(a);let d=o*12;u.uExtent.value=[-o,d*3,o*12,0],u.uRc.value=o*.25,u.uLi.value=d,u.uL0.value=i*(.6+.4*Math.sin(l+t))})}drawn=[];near(e,t){return this.drawn.some(n=>n.upos.sub(e,new U).length()<t)}static comaRadius(e,t,n){let r=e+t*Math.log10(Math.max(n,.05));return Math.min(8e8,Math.max(3e6,12e7*10**(-.2*(r-8))))}update(t,n,r,i,a){let o=n,s=[],c=new U;for(let e of r){if(e.row[8]===null||e.apparentMag>90||e.row[1]===`D`||e.row[1]===`A`||e.row[1]===`X`)continue;let n=e.upos.sub(o,c).length()/Pl;if(n>6)continue;let r=e.upos.sub(t,c).length()/Pl,a=e===i?-100:Math.min(e.apparentMag,5*Math.log10(Math.max(r,1e-4))+4);(e===i||e.apparentMag<9||r<.3)&&s.push({c:e,r:n,score:a})}s.sort((e,t)=>e.score-t.score),this.drawn=s.slice(0,yf).map(e=>e.c);let l=new U;for(let n=0;n<yf;n++){let r=this.meshes[n],i=s[n];if(!i){r.visible=!1;continue}let{c,r:u}=i,d=c.row[9]??10,f=e.comaRadius(c.row[8],d,u),p=c.upos.sub(t,new U),m=p.length(),h=c.upos.sub(o,new U).normalize();l.copy(p).normalize();let g=new U().crossVectors(h,l);g.lengthSq()<1e-10&&g.set(0,0,1).cross(h),g.normalize();let _=c.upos.sub(o,new U),v=this.last.get(c),y=v?.v??null;v&&a!==v.jd&&(y=_.clone().sub(v.p).divideScalar(a-v.jd).normalize()),this.last.set(c,{p:_,jd:a,v:y});let b=y?-.25*y.dot(g):0,x=f*60/Math.sqrt(Math.max(u,.1)),S=f*30,C=.6*Xl(c.apparentMag)*m*m/(2*Math.PI*f*f)/bf,w=r.material.uniforms;w.uNucleus.value.copy(p),w.uAxis.value.copy(h),w.uAcross.value.copy(g),w.uExtent.value=[-3*f,Math.max(x,S)*3,Math.max(3*f,.4*S*3),0],w.uRc.value=f,w.uLi.value=x,w.uLd.value=S,w.uBend.value=b,w.uL0.value=C,r.visible=C>0}this.last.size>400&&this.last.clear();let u=null,d=1/0;for(let e of s.slice(0,yf)){let n=e.c.upos.sub(t,c).length();n<d&&(d=n,u=e)}let f=u?Math.PI/Math.max(u.r,.05)**2:0,p=u?this.meshes[s.indexOf(u)]:null,m=p?p.material.uniforms.uL0.value:0;this.updateNucleus(u?.c??null,t,o,f,m*2)}},Sf=Math.PI*2;function Cf(e,t){e%=Sf,e>Math.PI?e-=Sf:e<-Math.PI&&(e+=Sf);let n=t<.8?e:Math.sign(e)*Math.PI*.85;if(e===0)return 0;let r=-Math.PI,i=Math.PI;for(let a=0;a<60;a++){let a=n-t*Math.sin(n)-e;a>0?i=n:r=n;let o=1-t*Math.cos(n),s=n-a/o;if(s>r&&s<i||(s=.5*(r+i)),Math.abs(s-n)<1e-15)return s;n=s}return n}function wf(e,t){let n=Math.asinh(e/t);for(let r=0;r<80;r++){let r=(t*Math.sinh(n)-n-e)/(t*Math.cosh(n)-1);if(n-=r,Math.abs(r)<1e-14*Math.max(1,Math.abs(n)))break}return n}var Tf=new W;function Ef(e,t,n,r=Tf){let i=Math.cos(e*Vl),a=Math.sin(e*Vl),o=Math.cos(t*Vl),s=Math.sin(t*Vl),c=Math.cos(n*Vl),l=Math.sin(n*Vl);return r.set(o*c-s*l*i,-o*l-s*c*i,s*a,s*c+o*l*i,-s*l+o*c*i,-o*a,l*a,c*a,i)}function Df(e,t,n,r){let i=(t-e.tp)*86400,{q:a,e:o,mu:s}=e,c,l,u=0,d=0;if(o<.99999){let e=a/(1-o),t=Cf(Math.sqrt(s/(e*e*e))*i,o),n=Math.cos(t),f=Math.sin(t),p=e*Math.sqrt(1-o*o);if(c=e*(n-o),l=p*f,r){let t=e*(1-o*n),r=Math.sqrt(s*e)/t;u=-r*f,d=r*Math.sqrt(1-o*o)*n}}else if(o>1.00001){let e=a/(o-1),t=wf(Math.sqrt(s/(e*e*e))*i,o),n=Math.cosh(t),f=Math.sinh(t);if(c=e*(o-n),l=e*Math.sqrt(o*o-1)*f,r){let t=e*(o*n-1),r=Math.sqrt(s*e)/t;u=-r*f,d=r*Math.sqrt(o*o-1)*n}}else{let e=3*Math.sqrt(s/(2*a*a*a))*i,t=Math.cbrt(e/2+Math.sqrt(e*e/4+1)),n=t-1/t;if(c=a*(1-n*n),l=2*a*n,r){let e=Math.sqrt(2*s*a);u=-s/e*(2*n/(1+n*n)),d=s/e*(1+(1-n*n)/(1+n*n))}}let f=Ef(e.i,e.node,e.peri);return n.set(c,l,0).applyMatrix3(f),r&&r.set(u,d,0).applyMatrix3(f),n}function Of(e,t,n,r,i,a,o,s){let c=Math.sqrt(s/(e*e*e)),l=o-a*Vl/c/86400;return{q:e*(1-t),e:t,i:n,node:r,peri:i,tp:l,mu:s}}function kf(e,t,n,r){let i=new U().crossVectors(e,t),a=e.length(),o=new U().crossVectors(t,i).divideScalar(n).sub(e.clone().divideScalar(a)),s=o.length(),c=i.length(),l=Math.acos(Math.max(-1,Math.min(1,i.z/c))),u=new U(-i.y,i.x,0),d=u.length(),f=d>1e-12*c?Math.atan2(u.y,u.x):0,p;s>1e-10?d>1e-12*c?(p=Math.acos(Math.max(-1,Math.min(1,u.dot(o)/(d*s)))),o.z<0&&(p=Sf-p)):(p=Math.atan2(o.y,o.x),i.z<0&&(p=-p)):p=0;let m;if(s>1e-10)m=Math.acos(Math.max(-1,Math.min(1,o.dot(e)/(s*a)))),e.dot(t)<0&&(m=Sf-m);else{let t=d>1e-12*c?u.clone().normalize():new U(1,0,0);m=Math.acos(Math.max(-1,Math.min(1,t.dot(e)/a))),e.z<0&&d>1e-12*c&&(m=Sf-m)}let h=c*c/n/(1+s),g;if(s<1){let e=h/(1-s),t=2*Math.atan2(Math.sqrt(1-s)*Math.sin(m/2),Math.sqrt(1+s)*Math.cos(m/2));g=r-(t-s*Math.sin(t))/Math.sqrt(n/(e*e*e))/86400}else{let e=h/(s-1),t=2*Math.atanh(Math.sqrt((s-1)/(s+1))*Math.tan(m/2));g=r-(s*Math.sinh(t)-t)/Math.sqrt(n/(e*e*e))/86400}return f<0&&(f+=Sf),{q:h,e:s,i:l/Vl,node:f/Vl,peri:p/Vl,tp:g,mu:n}}var Af=class e{xh=0;xl=0;yh=0;yl=0;zh=0;zl=0;static from(t,n,r){let i=new e;return i.xh=t,i.yh=n,i.zh=r,i}set(e,t,n){return this.xh=e,this.xl=0,this.yh=t,this.yl=0,this.zh=n,this.zl=0,this}copy(e){return this.xh=e.xh,this.xl=e.xl,this.yh=e.yh,this.yl=e.yl,this.zh=e.zh,this.zl=e.zl,this}clone(){return new e().copy(this)}addXYZ(e,t,n){return[this.xh,this.xl]=Nf(this.xh,this.xl,e),[this.yh,this.yl]=Nf(this.yh,this.yl,t),[this.zh,this.zl]=Nf(this.zh,this.zl,n),this}addVec(e,t=1){return this.addXYZ(e.x*t,e.y*t,e.z*t)}addUPos(e){return[this.xh,this.xl]=Pf(this.xh,this.xl,e.xh,e.xl),[this.yh,this.yl]=Pf(this.yh,this.yl,e.yh,e.yl),[this.zh,this.zl]=Pf(this.zh,this.zl,e.zh,e.zl),this}sub(e,t=new U){return t.x=Ff(this.xh,this.xl,e.xh,e.xl),t.y=Ff(this.yh,this.yl,e.yh,e.yl),t.z=Ff(this.zh,this.zl,e.zh,e.zl),t}toVector3(e=new U){return e.set(this.xh+this.xl,this.yh+this.yl,this.zh+this.zl)}static lerp(t,n,r,i=new e){let a=n.sub(t,jf);return i.copy(t).addXYZ(a.x*r,a.y*r,a.z*r)}},jf=new U;function Mf(e,t){let n=e+t,r=n-e;return[n,e-(n-r)+(t-r)]}function Nf(e,t,n){let[r,i]=Mf(e,n),a=i+t,o=r+a;return[o,a-(o-r)]}function Pf(e,t,n,r){let[i,a]=Mf(e,n),o=a+t+r,s=i+o;return[s,o-(s-i)]}function Ff(e,t,n,r){let[i,a]=Mf(e,-n);return i+(a+t-r)}var If=6674e-14,Lf=198892e25,Rf=59722e20,zf=6371e3;function Bf(e){let t=e*4294967296>>>0||1;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function Vf(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return(t>>>0)/4294967296}function Hf(e,t,n=.3){return 278.6*e**.25*(1-n)**.25/Math.sqrt(t/Pl)}function Uf(e,t,n){return e>8?t>1e3?`hotgiant`:`giant`:e>3.6?`icegiant`:e>1.75?`subneptune`:t>900?`lava`:t>380?`hot`:t>270?n()<.45?`ocean`:n()<.7?`terran`:`desert`:t>200?n()<.4?`terran`:n()<.7?`desert`:`ice`:`ice`}var Wf={lava:.1,hot:.12,desert:.3,terran:.3,ocean:.3,ice:.65,subneptune:.4,icegiant:.45,giant:.5,hotgiant:.08};function Gf(e){return e<1.23?e**(1/.279):e<11?(e/(1.008*2.04**(.279-.589)))**(1/.589):318*(.5+Math.min(e/11,3))}function Kf(e){let t=10**(-.4*(e.absMag-Wl))*(e.teff>9e3||e.teff<3800?1.6:1),n=e.radius/Kl;return n<.05?{lum:t,mass:.6,kind:`wd`}:n>4?{lum:t,mass:1.3,kind:`giant`}:{lum:t,mass:Math.min(20,Math.max(.08,(e.teff/Gl)**1.7)),kind:`dwarf`}}function qf(e){let t=Bf(Vf(e.key+`/planets`)),{lum:n,mass:r,kind:i}=Kf(e),a=e.teff,o=i===`wd`?.3:i===`giant`?1.6:a>1e4?1.4:a>7300?2.6:a<3900?3.2:4.4;if(t()<(i===`dwarf`?.1:.3))return[];let s=0;for(let e=Math.exp(-o),n=t(),r=e;n>r&&s<10;)s++,e*=o/s,r+=e;s=Math.max(1,Math.min(s,8));let c=2.7*Math.sqrt(n)*Pl,l=Math.max(e.radius*(i===`giant`?8:3),(.02+.07*t())*n**.35*Pl),u=a<3900?.08:a>7300?.25:.2,d=[];for(let e=0;e<s;e++){let n,i=l>c,o=t();if(n=!i&&e===0&&t()<(a>5e3&&a<6500?.012:.004)?11+7*t():i&&o<u?9+4*t():i&&o<u+.25?3.6+2.5*t():t()<.55?.5+1.2*t():1.75+2*t(),d.push({a:l,rad:n}),l*=1.35+.85*t(),l>8975872242e3*Math.sqrt(Math.max(r,.2)))break}let f=i===`wd`?.05:a<3900?.07:a>7300?.35:.22;if(t()<f){let e=Math.max(l,c*(1+2.5*t())),n=1+ +(t()<.4)+ +(t()<.25);for(let r=0;r<n&&d.length<10;r++)d.push({a:e,rad:t()<.7?9+4*t():3.6+2.5*t()}),e*=1.6+1.4*t()}let p=[];return d.forEach(({a:i,rad:a},o)=>{let s=Bf(Vf(`${e.key}/${o}`)),c=Hf(n,i,.3),l=Uf(a,c,s),u=Gf(a),d=2*Math.PI*Math.sqrt(i**3/(If*r*Lf)),f=Math.min(.6,Math.abs((a>8?.15:.04)*Math.sqrt(-2*Math.log(Math.max(t(),1e-9)))*Math.cos(2*Math.PI*t()))),m=i<.12*Pl*Math.cbrt(r);p.push({name:`${e.name} ${`bcdefghijk`[o]}`,real:!1,est:[],aM:i,e:f,inc:(t()-.5)*4*Math.PI/180,node:t()*2*Math.PI,omega:t()*2*Math.PI,M0:t()*2*Math.PI,periodS:d,radiusM:a*zf,massKg:u*Rf,teqK:c,type:l,albedo:Wf[l],rings:(l===`giant`||l===`icegiant`)&&t()<.35,seed:t()*1e3,rotS:m?d:(8+40*t())*3600})}),p}var Jf=class{spec;system;kind=`planet`;key;upos=new Af;radius;rel=new U;constructor(e,t,n){this.spec=e,this.system=t,this.key=`exo:${t.host.key}:${n}`,this.radius=e.radiusM}get name(){return this.spec.name}get parentObject(){return this.system.host}get hill(){let e=Kf(this.system.host).mass*Lf;return Math.max(this.spec.aM*Math.cbrt(this.spec.massKg/(3*e)),this.radius*20)}info(){let e=this.spec,t=e.radiusM/zf,n=e.massKg/Rf,r={lava:`lava world`,hot:`hot rocky planet`,desert:`desert world`,terran:`temperate rocky planet`,ocean:`ocean world`,ice:`frozen world`,subneptune:`sub-Neptune`,icegiant:`ice giant`,giant:`gas giant`,hotgiant:`hot Jupiter`},i=t=>e.est.includes(t)?` (estimated)`:``,a=[[`Type`,e.real?`Exoplanet: ${r[e.type]}${e.year?`, found ${e.year} (${e.method})`:``}`:`Generated planet: ${r[e.type]}`],[`Star`,this.system.host.name],[`Radius`,`${t.toFixed(t<3?2:1)} Earth radii${i(`radius`)}`],[`Mass`,n>100?`${(n/317.8).toFixed(2)} Jupiter masses${i(`mass`)}`:`${n.toFixed(n<3?2:1)} Earth masses${i(`mass`)}`],[`Orbit`,`${(e.aM/Pl).toPrecision(3)} AU${i(`a`)}, ${e.periodS/86400<400?`${(e.periodS/zl).toFixed(e.periodS/86400<10?2:1)} days`:`${(e.periodS/zl/365.25).toFixed(1)} years`}`],[`Eccentricity`,`${e.e.toFixed(2)}${i(`e`)}`],[`Temperature`,`~${Math.round(e.teqK)} K (equilibrium)`]];return e.rotS===e.periodS&&a.push([`Rotation`,`tidally locked (one side always faces the star)`]),e.real||a.push([`Origin`,`procedural: generated from the star, not observed`]),a}},Yf=class{host;real;planets;e1=new U;e2=new U;n=new U;constructor(e,t,n,r){this.host=e,this.real=n,this.n.copy(r).normalize();let i=Math.abs(this.n.z)<.9?new U(0,0,1):new U(1,0,0);this.e1.crossVectors(this.n,i).normalize(),this.e2.crossVectors(this.n,this.e1),this.planets=t.map((e,t)=>new Jf(e,this,t))}position(e,t,n){let r=Cf(e.M0+2*Math.PI/e.periodS*(t-Bl)*zl,e.e),i=e.aM*(Math.cos(r)-e.e),a=e.aM*Math.sqrt(1-e.e*e.e)*Math.sin(r),o=Math.cos(e.omega),s=Math.sin(e.omega),c=i*o-a*s,l=i*s+a*o,u=Math.cos(e.node),d=Math.sin(e.node),f=Math.cos(e.inc),p=Math.sin(e.inc),m=c*u-l*f*d,h=c*d+l*f*u,g=l*p;return n.copy(this.e1).multiplyScalar(m).addScaledVector(this.e2,h).addScaledVector(this.n,g)}update(e){for(let t of this.planets)this.position(t.spec,e,t.rel),t.upos.copy(this.host.upos).addVec(t.rel)}},Xf=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
${Yd}
attribute float aIrr;
attribute vec3 aColor;
varying vec3 vColor; varying float vEnergy; varying float vRadius;
${Xd}
void main() {
  float energy;
  float radius = psfSetup(aIrr, energy);
  if (radius <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 1.0; return; }
  gl_Position = projectView(viewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${ku}
${Du}
  gl_PointSize = 2.0 * radius * uDpr;
  vRadius = radius; vEnergy = energy; vColor = aColor;
}`,Zf=`
#include <common>
#include <logdepthbuf_pars_fragment>
${Yd}
varying vec3 vColor; varying float vEnergy; varying float vRadius;
${Zd}
void main() {
  gl_FragColor = vec4(psfShade(gl_PointCoord, vRadius, vEnergy, vColor), 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,Qf=32,$f=class{surfaceExposure;group=new sn;sprites;pos=new Float32Array(96);irr=new Float32Array(Qf);col=new Float32Array(96);meshes=[];coronas=[];sphere=new Qi(1,128,64);looks=new Map;stars=[];look(e){let t=this.looks.get(e.key);return t||(t=Kd(e.key,e.teff,e.radius/Kl,e.absMag),this.looks.size>2e3&&this.looks.clear(),this.looks.set(e.key,t)),t}constructor(e,t){this.surfaceExposure=t;let n=new mr;n.setAttribute(`position`,new K(this.pos,3).setUsage(Ue)),n.setAttribute(`aIrr`,new K(this.irr,1).setUsage(Ue)),n.setAttribute(`aColor`,new K(this.col,3).setUsage(Ue)),this.sprites=new Li(n,new J({name:`near-star-sprites`,vertexShader:Xf,fragmentShader:Zf,uniforms:{...e},transparent:!0,depthWrite:!1,blending:2})),this.sprites.frustumCulled=!1,this.sprites.renderOrder=40,this.group.add(this.sprites)}mesh(e){for(;this.meshes.length<=e;){let e=new q(this.sphere,new J({name:`near-star-surface`,vertexShader:ed,fragmentShader:nd,uniforms:{uColor:{value:new U},uRadiance:{value:1},uExposure:this.surfaceExposure,uTime:{value:0},uBodyToWorld:{value:new W},...qd(Kd(`init`,5772,1,4.83)),uPullIn:Q.uPullIn,uDepthK:Q.uDepthK}}));e.matrixAutoUpdate=!1,e.frustumCulled=!1,this.group.add(e),this.meshes.push(e);let t=new dd;this.group.add(t.mesh),this.coronas.push(t)}return this.meshes[e]}warmupObjects(){return this.mesh(0),[this.meshes[0],this.coronas[0].mesh]}update(e,t,n,r){let i=0,a=new U;for(let e of this.meshes)e.visible=!1;for(let e of this.coronas)e.hide();for(let o of this.stars.slice(0,Qf)){o.upos.sub(e,a);let s=a.length(),c=s/Z,l=Xl(o.absMag+5*Math.log10(Math.max(c,1e-12))-5),u=au(o.teff),d=su(u),f=Math.asin(Math.min(1,o.radius/Math.max(s,o.radius*1.0001)))/t,p=1-Math.min(1,Math.max(0,(f-.6)/1.2));if(this.pos.set([a.x,a.y,a.z],i*3),this.irr[i]=l*p,this.col.set([u[0]/d,u[1]/d,u[2]/d],i*3),f>.6){let e=this.mesh(i),t=this.look(o);e.visible=!0;let c=new H().setFromUnitVectors(new U(0,0,1),t.axis);e.matrix.compose(a,c,new U(o.radius,o.radius,o.radius*(1-t.flattening))),e.matrixWorldNeedsUpdate=!0;let f=e.material.uniforms;f.uColor.value.set(u[0]/d,u[1]/d,u[2]/d);let p=l*s*s/(Math.PI*o.radius*o.radius);f.uRadiance.value=p,f.uTime.value=n,f.uBodyToWorld.value.setFromMatrix4(e.matrix.clone().makeRotationFromQuaternion(c)),Jd(f,t),r&&this.coronas[i].update(a,o.radius,r,[u[0]/d,u[1]/d,u[2]/d],p*this.surfaceExposure.value,t,n)}i++}this.sprites.geometry.setDrawRange(0,i);for(let e of[`position`,`aIrr`,`aColor`])this.sprites.geometry.attributes[e].needsUpdate=!0}},ep=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform int uType;
uniform float uSeed;
uniform vec3 uC1;           // palette: low / deep
uniform vec3 uC2;           // mid
uniform vec3 uC3;           // high / bright bands
uniform vec3 uSea;          // ocean colour
uniform float uSeaLevel;    // 0..1 of the height range under water
uniform float uIceLat;      // sine of the ice-cap edge latitude (1 = none)
uniform float uClouds;      // cloud cover 0..1
uniform vec3 uAtmoColor;
uniform float uAtmo;        // limb haze strength
uniform float uBands;       // number of bands (giants)
uniform float uTurb;        // band turbulence
uniform float uGlow;        // thermal glow on the night side (lava, hot Jupiters)
uniform vec3 uSunDir;       // world unit vector planet -> star
uniform vec3 uSunColor;     // luminance-normalised star colour
uniform float uSunIrr;      // irradiance from the star (Sun at 1 AU = PI)
uniform float uExposure;
uniform float uTime;
uniform mat3 uBodyToWorld;
uniform float uLite;        // 1 in VR: fewer noise octaves, no domain warp
uniform float uTerrain;     // 1 = drawing the landing terrain (render/TerrainPatch.ts)
uniform float uHScale;      // terrain relief scale (fades in on descent)
uniform vec3 uHoleDir;      // sphere only: body-fixed centre of the terrain patch
uniform float uHoleCos;     // ... and the cosine of its angular radius (2 = no hole)
varying vec3 vTerrN;
varying float vSun;
varying vec3 vNormalBF;
varying vec3 vPosView;
varying vec2 vUv;

float ph(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float pn(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(ph(i), ph(i + vec3(1,0,0)), f.x), mix(ph(i + vec3(0,1,0)), ph(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(ph(i + vec3(0,0,1)), ph(i + vec3(1,0,1)), f.x), mix(ph(i + vec3(0,1,1)), ph(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float s = 0.0, a = 0.5; int n = uLite > 0.5 ? 4 : 6; for (int i = 0; i < 6; i++) { if (i >= n) break; s += a * pn(p); p = p * 2.03 + 1.7; a *= 0.5; } return s; }
float ridged(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { float n = 1.0 - abs(pn(p) * 2.0 - 1.0); s += a * n * n; p = p * 2.1 + 3.1; a *= 0.5; } return s; }
float terrain(vec3 n) {
  vec3 q = n * 2.2 + uSeed;
  vec3 w = uLite > 0.5 ? vec3(pn(q * 0.7 + 1.3), pn(q * 0.7 + 7.9), pn(q * 0.7 + 4.1)) - 0.5 : vec3(fbm(q + 1.3), fbm(q + 7.9), fbm(q + 4.1)) - 0.5;
  return 0.65 * fbm(q + w * 1.6) + 0.35 * ridged(q * 1.7 + w);
}

void main() {
  vec3 nB = normalize(vNormalBF);
  if (uTerrain < 0.5 && dot(nB, uHoleDir) > uHoleCos) discard;
  vec3 nW = normalize(uBodyToWorld * nB);
  vec3 V = normalize(-vPosView);
  float mu0 = dot(nW, uSunDir);
  float lat = nB.z;
  vec3 albedo;
  float emit = 0.0;
  vec3 emitColor = vec3(1.0, 0.35, 0.08);
  float spec = 0.0;
  float cloud = 0.0;
  if (uType >= 6) {
    // banded atmosphere
    float t = lat * uBands + uTurb * (fbm(nB * vec3(2.5, 2.5, 9.0) + uSeed + vec3(uTime * 0.002, 0.0, 0.0)) - 0.5) * 3.0;
    float b = 0.5 + 0.5 * sin(t * 3.14159 + uSeed);
    float fine = fbm(nB * vec3(6.0, 6.0, 30.0) + uSeed * 1.3);
    albedo = mix(mix(uC1, uC2, smoothstep(0.2, 0.6, b)), uC3, smoothstep(0.65, 0.95, b * 0.7 + fine * 0.5));
    // storms: a few oval vortices
    for (int k = 0; k < 3; k++) {
      vec3 c = normalize(vec3(ph(vec3(uSeed, float(k), 1.0)) - 0.5, ph(vec3(uSeed, float(k), 2.0)) - 0.5, (ph(vec3(uSeed, float(k), 3.0)) - 0.5) * 0.9));
      vec3 dd = nB - c;
      float r = length(dd * vec3(1.0, 1.0, 2.2));
      float sz = 0.06 + 0.1 * ph(vec3(uSeed, float(k), 4.0));
      albedo = mix(albedo, uC3 * vec3(1.05, 0.85, 0.75), smoothstep(sz, sz * 0.5, r) * 0.8);
    }
    if (uType == 9) emit = uGlow * (0.6 + 0.4 * fine);
  } else {
    float h = terrain(nB);
    float sea = uSeaLevel;
    if (uType == 3 || uType == 4) {
      if (h < sea) {
        float depth = smoothstep(sea, sea - 0.15, h);
        albedo = mix(uSea * 1.6, uSea, depth);
        spec = 1.0;
      } else {
        float e = smoothstep(sea, sea + 0.35, h);
        albedo = mix(uC1, uC2, e);
        albedo = mix(albedo, uC3, smoothstep(0.55, 0.8, e + 0.25 * fbm(nB * 9.0 + uSeed)));
      }
      cloud = uClouds * smoothstep(0.5, 0.75, fbm(nB * vec3(3.0, 3.0, 5.0) + uSeed + vec3(uTime * 0.003, 0.0, 0.0)));
    } else if (uType == 0) {
      // lava: dark crust, glowing cracks and pools
      float cr = ridged(nB * 6.0 + uSeed);
      albedo = mix(uC1, uC2, smoothstep(0.3, 0.7, h));
      emit = uGlow * (smoothstep(0.82, 0.97, cr) + smoothstep(0.25, 0.15, h) * 0.8);
    } else if (uType == 5) {
      float cracks = smoothstep(0.47, 0.5, abs(pn(nB * 9.0 + uSeed) - 0.5) + 0.47);
      albedo = mix(uC2, uC3, smoothstep(0.3, 0.7, h)) * (0.85 + 0.15 * cracks);
    } else {
      albedo = mix(uC1, uC2, smoothstep(0.25, 0.75, h));
      albedo = mix(albedo, uC3, smoothstep(0.6, 0.9, fbm(nB * 12.0 + uSeed)) * 0.6);
    }
    // ice caps
    float cap = smoothstep(uIceLat, uIceLat + 0.06, abs(lat) + 0.08 * (fbm(nB * 6.0 + uSeed) - 0.5));
    albedo = mix(albedo, vec3(0.92, 0.95, 1.0), cap);
    spec *= 1.0 - cap;
    albedo = mix(albedo, vec3(0.95), cloud);
  }
  float light = max(mu0, 0.0);
  if (uTerrain > 0.5) {
    // landing terrain: the relief's own normal and shadows, inside the geometric day side
    vec3 nT = normalize(mix(nW, uBodyToWorld * normalize(vTerrN), uHScale));
    light = max(dot(nT, uSunDir), 0.0) * smoothstep(-0.04, 0.06, mu0) * mix(1.0, clamp(0.5 + vSun, 0.0, 1.0), uHScale);
  }
  vec3 sunL = uSunColor * (uSunIrr / 3.14159265);
  vec3 radiance = albedo * sunL * light;
  // sea glint
  if (spec > 0.0 && mu0 > 0.0) {
    vec3 Hh = normalize(uSunDir + V);
    float nh = max(dot(nW, Hh), 0.0);
    radiance += sunL * pow(nh, 120.0) * 2.0 * spec * (1.0 - cloud);
  }
  // atmosphere: bright limb on the day side, a thin ring of scattered light at the terminator
  float mu = max(dot(nW, V), 0.0);
  float rim = pow(1.0 - mu, 3.0);
  radiance += uAtmoColor * sunL * uAtmo * rim * smoothstep(-0.25, 0.3, mu0) * 0.9;
  // thermal glow (night side mostly)
  // (scaled to the starlight so it shows at the exposure the lit planet sets)
  radiance += emitColor * emit * luminance(sunL) * 0.15 * (0.4 + 0.6 * smoothstep(0.2, -0.2, mu0));
  gl_FragColor = vec4(min(radiance * uExposure, vec3(6.0e4)), 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,tp=84381.448/3600*Vl,np=Math.cos(tp),rp=Math.sin(tp);function ip(e){let t=e.y*np-e.z*rp,n=e.y*rp+e.z*np;return e.y=t,e.z=n,e}var ap=(()=>{let e=192.85948*Vl,t=27.12825*Vl,n=122.93192*Vl,r=new U(Math.cos(t)*Math.cos(e),Math.cos(t)*Math.sin(e),Math.sin(t)),i=new U(0,0,1),a=i.clone().sub(r.clone().multiplyScalar(i.dot(r))).normalize(),o=new U().crossVectors(r,a),s=a.clone().multiplyScalar(Math.cos(n)).add(o.clone().multiplyScalar(-Math.sin(n))),c=new U().crossVectors(r,s);return new W().set(s.x,c.x,r.x,s.y,c.y,r.y,s.z,c.z,r.z)})();function op(e,t,n=new U){let r=e*Vl,i=t*Vl;return n.set(Math.cos(i)*Math.cos(r),Math.cos(i)*Math.sin(r),Math.sin(i))}function sp(e){let t=e.length(),n=Math.atan2(e.y,e.x)/Vl;return n<0&&(n+=360),{ra:n,dec:Math.asin(e.z/t)/Vl}}function cp(e,t){let n=op(e,t),r=new U(0,0,1).cross(n);r.lengthSq()<1e-20&&r.set(1,0,0),r.normalize();let i=new U().crossVectors(n,r);return new W().set(r.x,i.x,n.x,r.y,i.y,n.y,r.z,i.z,n.z)}function lp(e){let{ra:t,dec:n}=sp(e),r=t/15,i=Math.floor(r),a=Math.floor((r-i)*60),o=((r-i)*60-a)*60,s=n<0?`−`:`+`,c=Math.abs(n),l=Math.floor(c),u=Math.floor((c-l)*60),d=((c-l)*60-u)*60;return`${i}h ${String(a).padStart(2,`0`)}m ${o.toFixed(1).padStart(4,`0`)}s  ${s}${l}° ${String(u).padStart(2,`0`)}′ ${d.toFixed(0).padStart(2,`0`)}″`}var up=class e{list=[];byNodeSlot=new Map;static async load(t){let n=await fetch(`${t}/named.json`);if(!n.ok)throw Error(`named stars: HTTP ${n.status}`);let r=await n.json(),i=new e;return r.stars.forEach((e,t)=>{let[n,r,a,o,s,c,l,u,d,f]=e,p={index:t,names:n,pos:new U(r,a,o),absMag:s,teff:c,spect:l,node:u,slot:d,proper:f===1};i.list.push(p),i.byNodeSlot.set(`${u}:${d}`,p)}),i}};function dp(e,t){return Kl*(Gl/t)**2*10**(-.2*(e-Wl))}var fp=class{key;posPc;absMag;teff;spect;ref;kind=`star`;upos;exact=!1;radius;parentObject=null;name;designations;resolving=!1;constructor(e,t,n,r,i,a,o){this.key=e,this.posPc=t,this.absMag=n,this.teff=r,this.spect=i,this.ref=o,this.upos=Af.from(t.x*Z,t.y*Z,t.z*Z),this.radius=dp(n,r),this.name=a[0]??`Unnamed star`,this.designations=a}setPosition(e){this.posPc.copy(e),this.upos.set(e.x*Z,e.y*Z,e.z*Z)}resolve(e,t){!this.ref||this.resolving||this.designations.length||(this.resolving=!0,this.ref.catalog.designation(this.ref).then(n=>{if(n.notable!==null){let t=e.list[n.notable];this.designations=t.names}else n.text&&(this.designations=[n.text]);this.name=this.designations[0]??this.name,t()}).catch(()=>void 0))}info(){let e=[[`Type`,`Star`]];this.spect&&e.push([`Spectral type`,this.spect]),e.push([`Temperature`,`${Math.round(this.teff).toLocaleString()} K`]),e.push([`Absolute mag (V)`,this.absMag.toFixed(2)]),e.push([`Luminosity (V)`,`${(10**(-.4*(this.absMag-Wl))).toPrecision(3)} L☉`]),e.push([`Radius`,`${(this.radius/Kl).toPrecision(3)} R☉ (estimated)`]);let t=this.posPc.length();return e.push([`Distance from Sun`,`${t.toPrecision(4)} pc (${(t*Z/Fl).toPrecision(4)} ly)`]),e.push([`RA / Dec (from Sun)`,lp(this.posPc)]),this.designations.length>1&&e.push([`Designations`,this.designations.slice(1,6).join(`, `)]),this.ref&&e.push([`Catalogue`,`${this.ref.catalog.source.split(` (`)[0]} — ${this.ref.catalog.license}`]),e}},pp=e=>e-Math.floor(e);function mp(e,t,n){e=pp(e*.1031),t=pp(t*.1031),n=pp(n*.1031);let r=e*(n+31.32)+t*(t+31.32)+n*(e+31.32);return e+=r,t+=r,n+=r,pp((e+t)*n)}function hp(e,t,n){let r=Math.floor(e),i=Math.floor(t),a=Math.floor(n),o=e-r,s=t-i,c=n-a;o=o*o*(3-2*o),s=s*s*(3-2*s),c=c*c*(3-2*c);let l=(e,t,n)=>e+(t-e)*n;return l(l(l(mp(r,i,a),mp(r+1,i,a),o),l(mp(r,i+1,a),mp(r+1,i+1,a),o),s),l(l(mp(r,i,a+1),mp(r+1,i,a+1),o),l(mp(r,i+1,a+1),mp(r+1,i+1,a+1),o),s),c)}function gp(e,t,n,r){let i=0,a=.5,o=r?4:6;for(let r=0;r<o;r++)i+=a*hp(e,t,n),e=e*2.03+1.7,t=t*2.03+1.7,n=n*2.03+1.7,a*=.5;return i}function _p(e,t,n){let r=0,i=.5;for(let a=0;a<5;a++){let a=1-Math.abs(hp(e,t,n)*2-1);r+=i*a*a,e=e*2.1+3.1,t=t*2.1+3.1,n=n*2.1+3.1,i*=.5}return r}function vp(e,t,n){let r=e.x*2.2+t,i=e.y*2.2+t,a=e.z*2.2+t,o,s,c;return n?(o=hp(r*.7+1.3,i*.7+1.3,a*.7+1.3)-.5,s=hp(r*.7+7.9,i*.7+7.9,a*.7+7.9)-.5,c=hp(r*.7+4.1,i*.7+4.1,a*.7+4.1)-.5):(o=gp(r+1.3,i+1.3,a+1.3,!1)-.5,s=gp(r+7.9,i+7.9,a+7.9,!1)-.5,c=gp(r+4.1,i+4.1,a+4.1,!1)-.5),.65*gp(r+o*1.6,i+s*1.6,a+c*1.6,n)+.35*_p(r*1.7+o,i*1.7+s,a*1.7+c)}var yp=new Set([0,1,2,3,4,5]),bp=class{owner;type;seed;seaLevel;name;radius;radii;amplitude;lite=!1;relief;seedN;constructor(e,t,n,r){this.owner=e,this.type=t,this.seed=n,this.seaLevel=r,this.name=e.name,this.radius=e.radius,this.radii=[e.radius,e.radius,e.radius],this.relief=Math.min(2e4,e.radius*.002),this.amplitude=this.relief*.5;let i=0;for(let t of e.name)i=i*31+t.charCodeAt(0)>>>0;this.seedN=i%100003}ready(){return!0}height(e,t){let n=vp(e,this.seed,this.lite),r=this.type===3||this.type===4,i=r?Math.min(1,Math.max(0,(n-this.seaLevel)/.02)):1,a=r?Math.max(0,n-this.seaLevel)*this.relief:(n-.5)*this.relief;if(i<=0)return 0;let o=this.radius,s=e.x*o,c=e.y*o,l=e.z*o,u=Math.max(t*2.5,6),d=0;for(let e=o/75;e>u&&d<16;e*=.5,d++)a+=(Od(s/e,c/e,l/e,this.seedN+d*7)-.5)*2*.012*e*i;if(this.type===1||this.type===5){let e=0;for(let t=4e4;t>=30&&!(t*.4<u);t/=4.6,e++)a+=kd(s,c,l,t,this.seedN+100*e,.4,t>5e3?.18:.32)}return Number.isFinite(a)?a:0}},xp={lava:0,hot:1,desert:2,terran:3,ocean:4,ice:5,subneptune:6,icegiant:7,giant:8,hotgiant:9};function Sp(e){let t=e.spec.type,n=Bf(Vf(e.key+`/look`)),r=(e,t=.18)=>[e[0]*(1+t*(n()-.5)),e[1]*(1+t*(n()-.5)),e[2]*(1+t*(n()-.5))],i=e=>e[Math.floor(n()*e.length)],a={uSeaLevel:0,uIceLat:1.2,uClouds:0,uAtmo:0,uBands:10,uTurb:.6,uGlow:0,uSea:[.02,.06,.15],uAtmoColor:[.4,.6,1]};switch(t){case`lava`:return{...a,uC1:r([.06,.05,.05]),uC2:r([.2,.15,.12]),uC3:[.3,.25,.2],uGlow:.7+.6*n()};case`hot`:return{...a,uC1:r([.3,.27,.25]),uC2:r([.5,.45,.4]),uC3:r([.7,.65,.6]),uAtmo:n()<.3?.5:0,uAtmoColor:[1,.8,.5]};case`desert`:{let e=i([[.6,.38,.2],[.7,.55,.35],[.55,.3,.22],[.75,.68,.55]]);return{...a,uC1:r(e),uC2:r([e[0]*1.2,e[1]*1.2,e[2]*1.15]),uC3:r([.85,.78,.65]),uAtmo:.5,uAtmoColor:[1,.8,.6],uIceLat:n()<.5?.85:1.2}}case`terran`:case`ocean`:{let e=i([[.1,.24,.07],[.22,.25,.1],[.3,.15,.1],[.2,.1,.22],[.35,.3,.18]]);return{...a,uC1:r(e),uC2:r([.4,.33,.24]),uC3:r([.62,.6,.58]),uSea:r([.015,.05,.13],.4),uSeaLevel:t===`ocean`?.62+.08*n():.4+.15*n(),uIceLat:.7+.25*n(),uClouds:.35+.5*n(),uAtmo:.9,uAtmoColor:[.35,.55,1]}}case`ice`:return{...a,uC1:r([.6,.65,.7]),uC2:r([.75,.8,.86]),uC3:[.95,.97,1],uIceLat:1.2,uAtmo:n()<.3?.4:0};case`subneptune`:{let e=i([[.45,.62,.72],[.55,.65,.6],[.6,.6,.7],[.5,.7,.75]]);return{...a,uC1:r(e),uC2:r([e[0]*1.15,e[1]*1.12,e[2]*1.1]),uC3:r([.82,.88,.92]),uBands:5+6*n(),uTurb:.25,uAtmo:1,uAtmoColor:[.6,.8,1]}}case`icegiant`:{let e=i([[.25,.45,.85],[.45,.75,.85],[.3,.55,.7]]);return{...a,uC1:r(e),uC2:r([e[0]*1.2,e[1]*1.15,e[2]*1.05]),uC3:r([.75,.85,.95]),uBands:4+5*n(),uTurb:.35,uAtmo:.8,uAtmoColor:[.5,.7,1]}}case`giant`:{let e=i([[[.55,.4,.28],[.85,.75,.6],[.95,.9,.82]],[[.75,.62,.42],[.88,.8,.62],[.95,.9,.78]],[[.45,.42,.5],[.7,.68,.75],[.9,.88,.92]],[[.6,.35,.25],[.8,.6,.45],[.9,.8,.7]]]);return{...a,uC1:r(e[0]),uC2:r(e[1]),uC3:r(e[2]),uBands:8+10*n(),uTurb:.5+.7*n(),uAtmo:.5,uAtmoColor:[.9,.85,.8]}}case`hotgiant`:return{...a,uC1:r([.06,.06,.09]),uC2:r([.14,.12,.18]),uC3:r([.3,.25,.3]),uBands:6+6*n(),uTurb:.8,uGlow:.6+.5*n(),uAtmo:.4,uAtmoColor:[.6,.5,.9]}}}var Cp=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
varying vec2 vXY;
void main() {
  vXY = position.xy;
  gl_Position = projectView(modelViewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${ku}
}`,wp=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uSeed;
uniform float uLight;   // reflected radiance x exposure for a white ring particle
varying vec2 vXY;
float h1(float n) { return fract(sin(n) * 43758.5453123); }
float n1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i + uSeed), h1(i + 1.0 + uSeed), f); }
void main() {
  float r = length(vXY);          // 1.4 .. 2.6 planet radii
  float t = (r - 1.4) / 1.2;
  float dens = 0.25 + 0.75 * n1(t * 23.0) * (0.6 + 0.4 * n1(t * 90.0 + 3.0));
  dens *= smoothstep(0.0, 0.05, t) * smoothstep(1.0, 0.9, t);
  dens *= step(0.06, abs(t - 0.62 - 0.1 * h1(uSeed))); // a gap
  gl_FragColor = vec4(uColor * uLight * dens, dens * 0.85);
${Au}
  #include <logdepthbuf_fragment>
}`,Tp=6674e-14,Ep=class{exposure;group=new sn;views=[];showOrbits=!0;draws=new Map;sphere=new Qi(1,128,64);ringGeo=new Zi(1.4,2.6,128,1);sprites;sp={pos:new Float32Array(192),irr:new Float32Array(64),col:new Float32Array(192)};constructor(e,t){this.exposure=t,this.group.name=`exoplanets`;let n=new mr;n.setAttribute(`position`,new K(this.sp.pos,3).setUsage(Ue)),n.setAttribute(`aIrr`,new K(this.sp.irr,1).setUsage(Ue)),n.setAttribute(`aColor`,new K(this.sp.col,3).setUsage(Ue)),this.sprites=new Li(n,new J({name:`exoplanet-sprites`,vertexShader:Xf,fragmentShader:Zf,uniforms:{...e,uHalo:{value:.3}},transparent:!0,depthWrite:!1,blending:2})),this.sprites.frustumCulled=!1,this.sprites.renderOrder=10,this.group.add(this.sprites)}draw(e){let t=this.draws.get(e);if(t)return t;let n=Sp(e),r={uType:{value:xp[e.spec.type]},uSeed:{value:e.spec.seed%97},uLumpy:{value:0},uSunDir:{value:new U(1,0,0)},uSunColor:{value:new U(1,1,1)},uSunIrr:{value:Math.PI},uExposure:this.exposure,uTime:{value:0},uBodyToWorld:{value:new W},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK,uLite:Tu.uLite,uTerrain:{value:0},uHScale:{value:0},uHoleDir:{value:new U(0,0,1)},uHoleCos:{value:2}};for(let[e,t]of Object.entries(n))r[e]={value:Array.isArray(t)?new U(...t):t};let i=new q(this.sphere,new J({name:`exoplanet`,vertexShader:ed,fragmentShader:ep,uniforms:r}));i.matrixAutoUpdate=!1,i.frustumCulled=!1,i.renderOrder=1,i.name=e.name,this.group.add(i);let a=null;if(e.spec.rings){let t=n.uC3;a=new q(this.ringGeo,new J({name:`exoplanet-ring`,vertexShader:Cp,fragmentShader:wp,uniforms:{uColor:{value:new U(t[0]*.9,t[1]*.88,t[2]*.85)},uSeed:{value:e.spec.seed%13},uLight:{value:1},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK},transparent:!0,depthWrite:!1,side:2})),a.matrixAutoUpdate=!1,a.frustumCulled=!1,a.renderOrder=3,this.group.add(a)}let o=new mr;o.setAttribute(`position`,new K(new Float32Array(480),3).setUsage(Ue));let s=new Di(o,new yi({color:7311312,transparent:!0,opacity:.35,depthWrite:!1}));s.frustumCulled=!1,s.renderOrder=5,this.group.add(s);let c=xp[e.spec.type],l=yp.has(c)?new bp(e,c,e.spec.seed%97,Number(n.uSeaLevel??0)):null,u=null;if(c===3||c===4){let t=Bf(Vf(e.key+`/air`)),n=Tp*e.spec.massKg/(e.radius*e.radius);u=Hu(.4+2.2*t(),Math.min(400,Math.max(180,e.spec.teqK)),Math.max(2,n)),r.uAtmo.value=Number(r.uAtmo.value)*.3}return t={mesh:i,ring:a,orbit:s,orient:new G,ground:l,air:u},this.draws.set(e,t),t}dummy=null;warmupObjects(){if(!this.dummy){let e=new Yf(new fp(`warmup`,new U(1e6,0,0),5,5800,`G2V`,[`warmup`],null),[{name:`warmup b`,real:!1,est:[],aM:15e10,e:0,inc:0,node:0,omega:0,M0:0,periodS:3e7,radiusM:7e7,massKg:1e27,teqK:120,type:`giant`,albedo:.5,rings:!0,seed:1,rotS:4e4}],!1,new U(0,0,1));this.dummy=this.draw(e.planets[0]),this.draws.delete(e.planets[0]);for(let e of[this.dummy.mesh,this.dummy.ring,this.dummy.orbit])e&&(e.visible=!1)}return[this.dummy.mesh,...this.dummy.ring?[this.dummy.ring]:[]]}atmospheres(){let e=[];for(let t of this.views){let n=this.draws.get(t.planet);if(!n?.air||!n.mesh.visible||t.pixelRadius<2.5)continue;let r=n.mesh.material.uniforms;e.push({key:t.planet,name:t.planet.name,radius:t.planet.radius,spec:n.air,rel:t.rel,orient:n.orient,sunDir:r.uSunDir.value,sunIrr:r.uSunIrr.value,sunColor:r.uSunColor.value})}return e}terrainCandidate(){let e=null;for(let t of this.views){let n=this.draws.get(t.planet);if(!n?.ground||!n.mesh.visible)continue;let r=t.dist-t.planet.radius;r<zd.threshold(t.planet)*1.2&&(!e||r<e.dist-e.planet.radius)&&(e=t)}if(!e)return null;let t=this.draws.get(e.planet),n=t.mesh.material;t.ground.lite=Tu.uLite.value>.5;let r=n.uniforms.uSunDir.value.clone().applyMatrix3(new W().setFromMatrix4(t.orient).transpose());return{ground:t.ground,material:n,upos:e.planet.upos,rel:e.rel.clone(),orient:t.orient,lonLeft:-180,sunBF:r,alt:e.dist-e.planet.radius}}prune(e){for(let[t,n]of this.draws)if(!e.has(t)){for(let e of[n.mesh,n.ring,n.orbit])e&&(this.group.remove(e),e.material.dispose(),e===n.orbit&&e.geometry.dispose());this.draws.delete(t)}}update(e,t,n,r,i){this.views=[];let a=new Set,o=0,s=new U,c=new U,l=new U,u=new U;for(let d of n){d.update(r);let n=d.host;n.upos.sub(e,c);let f=au(n.teff),p=su(f);for(let m of d.planets){a.add(m);let h=this.draw(m);m.upos.sub(e,s);let g=s.length(),_=Math.asin(Math.min(1,m.radius/Math.max(g,m.radius*1.0001)))/t;l.copy(c).sub(s);let v=l.length(),y=Xl(n.absMag+5*Math.log10(v/Z)-5),b=m.spec.albedo*y/Math.PI;this.views.push({planet:m,rel:s.clone(),dist:g,pixelRadius:_,radiance:b});let x=_>.8;if(h.mesh.visible=x,x){let e=r*86400/m.spec.rotS,t=(e-Math.floor(e))*Math.PI*2,n=new H().setFromAxisAngle(d.n,t),a=new H().setFromUnitVectors(new U(0,0,1),d.n);n.multiply(a),h.mesh.matrix.compose(s,n,new U(m.radius,m.radius,m.radius)),h.orient.makeRotationFromQuaternion(n),h.mesh.matrixWorldNeedsUpdate=!0;let o=h.mesh.material.uniforms;o.uSunDir.value.copy(l).divideScalar(v),o.uSunColor.value.set(f[0]/p,f[1]/p,f[2]/p),o.uSunIrr.value=y,o.uTime.value=i,o.uBodyToWorld.value.setFromMatrix4(h.mesh.matrix.clone().makeRotationFromQuaternion(n))}else if(o<64){let e=.5*(1+u.copy(s).negate().normalize().dot(l.clone().normalize()));this.sp.pos.set([s.x,s.y,s.z],o*3),this.sp.irr[o]=m.spec.albedo*y*(m.radius/g)**2*e,this.sp.col.set([f[0]/p,f[1]/p,f[2]/p],o*3),o++}if(h.ring&&(h.ring.visible=x,x)){let e=new H().setFromUnitVectors(new U(0,0,1),d.n);h.ring.matrix.compose(s,e,new U(m.radius,m.radius,m.radius)),h.ring.matrixWorldNeedsUpdate=!0,h.ring.material.uniforms.uLight.value=y/Math.PI*.5*this.exposure.value}if(h.orbit.visible=this.showOrbits,this.showOrbits){let e=h.orbit.geometry.attributes.position,t=m.spec.periodS/86400;for(let n=0;n<e.count;n++)d.position(m.spec,r+t*n/(e.count-1),u),e.setXYZ(n,c.x+u.x,c.y+u.y,c.z+u.z);e.needsUpdate=!0}}}this.sprites.geometry.setDrawRange(0,o);for(let e of[`position`,`aIrr`,`aColor`])this.sprites.geometry.attributes[e].needsUpdate=!0;this.prune(a)}},Dp=8277,Op=266.41683708,kp=-29.00781056,Ap=12*Math.PI/180,jp=6900,Mp=[.6,1,.6,1],Np=27*Math.PI/180,Pp=new class{axes;toGalM;centre;sun;constructor(){this.centre=op(Op,kp).multiplyScalar(Dp);let e=ap.elements,t=new U(e[6],e[7],e[8]).normalize(),n=this.centre.clone().addScaledVector(t,-this.centre.dot(t)).normalize(),r=new U().crossVectors(t,n);this.axes=new W().set(n.x,r.x,t.x,n.y,r.y,t.y,n.z,r.z,t.z),this.toGalM=this.axes.clone().transpose(),this.sun=this.toGal(new U(0,0,0))}toGal(e,t=new U){return t.copy(e).sub(this.centre).applyMatrix3(this.toGalM)}toIcrf(e,t=new U){return t.copy(e).applyMatrix3(this.axes).add(this.centre)}dirToGal(e,t=new U){return t.copy(e).applyMatrix3(this.toGalM)}};function Fp(e,t){let n=Math.hypot(e,t);if(n<1)return 0;let r=Math.atan2(t,e),i=Math.PI+Math.log(n/jp)/Math.tan(Ap),a=0;for(let e=0;e<4;e++){let t=r-(i-e*Math.PI/2);t-=2*Math.PI*Math.round(t/(2*Math.PI));let o=n*t*Math.sin(Ap);a+=Mp[e]*Math.exp(-(o*o)/245e3)}a*=Bp(2800,4200,n)*(1-Bp(14e3,17e3,n));let o=e+Dp,s=t,c=o*Math.sin(Ap)+s*Math.cos(Ap),l=o*Math.cos(Ap)-s*Math.sin(Ap);return a+=.55*Math.exp(-(l*l)/18e4)*Math.exp(-(c*c)/125e5),a}function Ip(e,t){let n=t??{thin:0,young:0,thick:0,bulge:0,nsc:0,dust:0},r=Math.hypot(e.x,e.y),i=Math.abs(e.z),a=1-Math.exp(-((r/3e3)**3)),o=r>15e3?Math.exp(-(r-15e3)/1200):1,s=Fp(e.x,e.y);n.thin=Math.exp(-(r-Dp)/2600)*Math.exp(-i/260)*a*o,n.young=Math.exp(-(r-Dp)/3500)*Math.exp(-i/90)*a*o*(.12+1.4*s),n.thick=.12*Math.exp(-(r-Dp)/2e3)*Math.exp(-i/900)*o;let c=Math.cos(Np),l=Math.sin(Np),u=e.x*c-e.y*l,d=e.x*l+e.y*c,f=(((u/1700)**2+(d/640)**2)**2+(e.z/440)**4)**.25;n.bulge=50*Math.exp(-.5*f*f);let p=Math.hypot(r,e.z);return n.nsc=12e5/(1+(p/1.5)**1.8)*Math.exp(-((p/40)**2)),n.dust=Math.exp(-(r-Dp)/3200)*Math.exp(-i/110)*a*o*(.3+1.1*s)/Lp,n}var Lp=(()=>{let e=0,t=0;for(let n=-5;n<=5;n++)for(let r=-5;r<=5;r++){let i=-8277+n*100,a=r*100,o=Math.hypot(i,a);e+=(.3+1.1*Fp(i,a))*Math.exp(-(o-Dp)/3200),t++}return e/t})(),Rp=8e-4;function zp(e,t,n=24){let r=t.clone().sub(e),i=r.length();if(i<1)return 0;let a=new U,o={thin:0,young:0,thick:0,bulge:0,nsc:0,dust:0},s=0;for(let t=0;t<n;t++)a.copy(e).addScaledVector(r,(t+.5)/n),s+=Ip(a,o).dust;return s/n*i*Rp}function Bp(e,t,n){let r=Math.max(0,Math.min(1,(n-e)/(t-e)));return r*r*(3-2*r)}var Vp={thin:.03,young:.025,thick:.03,bulge:.03,nsc:.03},Hp={old:4800,young:11e3,bulge:4300},Up=[.83,1,1.25];function Wp(e,t,n=400,r=20){let[i,a]=Kp(e,t);if(a<=Math.max(i,r))return 0;let o=Math.max(i,1),s=Math.log(a/o),c=new U,l={thin:0,young:0,thick:0,bulge:0,nsc:0,dust:0},u=0,d=0;for(let i=0;i<n;i++){let a=o*Math.exp(s*(i+.5)/n),f=a*s/n;c.copy(e).addScaledVector(t,a),Ip(c,l);let p=Vp.thin*l.thin+Vp.young*l.young+Vp.thick*l.thick+Vp.bulge*l.bulge+Vp.nsc*l.nsc,m=.921*Rp*l.dust*f;u+=p*f*Math.exp(-d-m/2)*Gp(a,r),d+=m}return u}function Gp(e,t){return Bp(t*.5,t*1.5,e)}function Kp(e,t){let n=22e3,r=4e3,i=0,a=1e9;if(Math.abs(t.z)>1e-12){let n=(-4e3-e.z)/t.z,o=(r-e.z)/t.z;i=Math.max(i,Math.min(n,o)),a=Math.min(a,Math.max(n,o))}else if(Math.abs(e.z)>r)return[0,0];let o=t.x*t.x+t.y*t.y,s=2*(e.x*t.x+e.y*t.y),c=e.x*e.x+e.y*e.y-n*n;if(o>1e-12){let e=s*s-4*o*c;if(e<0)return[0,0];let t=Math.sqrt(e);i=Math.max(i,(-s-t)/(2*o)),a=Math.min(a,(-s+t)/(2*o))}else if(c>0)return[0,0];return a>i?[i,a]:[0,0]}var qp=e=>Number.isInteger(e)?`${e}.0`:`${e}`,Jp=e=>{let t=au(e),n=su(t);return`vec3(${qp(t[0]/n)}, ${qp(t[1]/n)}, ${qp(t[2]/n)})`},Yp=`
const float R0 = ${qp(Dp)};
const float ARM_TAN = ${qp(Math.tan(Ap))};
const float ARM_SIN = ${qp(Math.sin(Ap))};
const float ARM_COS = ${qp(Math.cos(Ap))};
const float ARM_R = ${qp(jp)};
const float ARM_W = ${qp(350)};
const vec4 ARM_S = vec4(${Mp.map(qp).join(`, `)});
const float BAR_C = ${qp(Math.cos(Np))};
const float BAR_S = ${qp(Math.sin(Np))};
const float AV_PC = ${qp(Rp)};
const vec3 EXT = vec3(${Up.map(qp).join(`, `)});
const vec3 C_OLD = ${Jp(Hp.old)};
const vec3 C_YOUNG = ${Jp(Hp.young)};
const vec3 C_BULGE = ${Jp(Hp.bulge)};
const vec3 C_HII = vec3(1.55, 0.62, 0.9);

float gSmooth(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }

float armFactor(vec2 q) {
  float R = length(q);
  if (R < 1.0) return 0.0;
  float th = atan(q.y, q.x);
  float base = PI + log(R / ARM_R) / ARM_TAN;
  float a = 0.0;
  for (int j = 0; j < 4; j++) {
    float d = th - (base - float(j) * 0.5 * PI);
    d -= 2.0 * PI * floor(d / (2.0 * PI) + 0.5);
    float perp = R * d * ARM_SIN;
    a += ARM_S[j] * exp(-perp * perp / (2.0 * ARM_W * ARM_W));
  }
  a *= gSmooth(2800.0, 4200.0, R) * (1.0 - gSmooth(14000.0, 17000.0, R));
  vec2 s = vec2(q.x + R0, q.y);
  float along = s.x * ARM_SIN + s.y * ARM_COS;
  float across = s.x * ARM_COS - s.y * ARM_SIN;
  a += 0.55 * exp(-across * across / (2.0 * 300.0 * 300.0)) * exp(-along * along / (2.0 * 2500.0 * 2500.0));
  return a;
}

// thin, young, thick, bulge+nucleus (relative densities) and dust
void populations(vec3 p, out vec4 pop, out float dust, out float arms) {
  float R = length(p.xy);
  float az = abs(p.z);
  float hole = 1.0 - exp(-pow(R / 3000.0, 3.0));
  float outer = R > 15000.0 ? exp(-(R - 15000.0) / 1200.0) : 1.0;
  arms = armFactor(p.xy);
  pop.x = exp(-(R - R0) / 2600.0) * exp(-az / 260.0) * hole * outer;
  pop.y = exp(-(R - R0) / 3500.0) * exp(-az / 90.0) * hole * outer * (0.12 + 1.4 * arms);
  pop.z = 0.12 * exp(-(R - R0) / 2000.0) * exp(-az / 900.0) * outer;
  float xb = p.x * BAR_C - p.y * BAR_S, yb = p.x * BAR_S + p.y * BAR_C;
  float rs = pow(pow(pow(xb / 1700.0, 2.0) + pow(yb / 640.0, 2.0), 2.0) + pow(p.z / 440.0, 4.0), 0.25);
  float r = length(p);
  pop.w = 50.0 * exp(-0.5 * rs * rs) + 1.2e6 / (1.0 + pow(r / 1.5, 1.8)) * exp(-(r / 40.0) * (r / 40.0));
  dust = exp(-(R - R0) / 3200.0) * exp(-az / 110.0) * hole * outer * (0.3 + 1.1 * arms) / DUST_NORM;
}

float gHash(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float gNoise(vec3 p) {
  vec3 i = floor(p), u = fract(p);
  u = u * u * (3.0 - 2.0 * u);
  return mix(mix(mix(gHash(i), gHash(i + vec3(1, 0, 0)), u.x), mix(gHash(i + vec3(0, 1, 0)), gHash(i + vec3(1, 1, 0)), u.x), u.y),
             mix(mix(gHash(i + vec3(0, 0, 1)), gHash(i + vec3(1, 0, 1)), u.x), mix(gHash(i + vec3(0, 1, 1)), gHash(i + vec3(1, 1, 1)), u.x), u.y), u.z);
}
`,Xp=`
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;function Zp(e){return`
precision highp float;
#define PI 3.141592653589793
const float DUST_NORM = ${qp(e)};
${Yp}
uniform vec3 uCam;
uniform mat3 uToGal;
uniform float uNear;
uniform int uSteps;
uniform float uSeed;
varying vec3 vDir;

vec2 bounds(vec3 o, vec3 d) {
  float t0 = 0.0, t1 = 1e9;
  if (abs(d.z) > 1e-9) {
    float a = (-4000.0 - o.z) / d.z, b = (4000.0 - o.z) / d.z;
    t0 = max(t0, min(a, b)); t1 = min(t1, max(a, b));
  } else if (abs(o.z) > 4000.0) return vec2(0.0);
  float A = dot(d.xy, d.xy), B = 2.0 * dot(o.xy, d.xy), C = dot(o.xy, o.xy) - 22000.0 * 22000.0;
  if (A > 1e-12) {
    float disc = B * B - 4.0 * A * C;
    if (disc < 0.0) return vec2(0.0);
    float q = sqrt(disc);
    t0 = max(t0, (-B - q) / (2.0 * A)); t1 = min(t1, (-B + q) / (2.0 * A));
  } else if (C > 0.0) return vec2(0.0);
  return t1 > t0 ? vec2(t0, t1) : vec2(0.0);
}

void main() {
  vec3 d = normalize(uToGal * normalize(vDir));
  vec3 o = uCam;
  vec2 tb = bounds(o, d);
  vec3 L = vec3(0.0);
  if (tb.y > max(tb.x, uNear * 0.5)) {
    float a = max(tb.x, 1.0), b = tb.y;
    float k = log(b / a);
    float n = float(uSteps);
    float jit = gHash(vec3(gl_FragCoord.xy, uSeed));
    vec3 T = vec3(1.0);
    vec4 pop; float dust; float arms;
    for (int i = 0; i < 256; i++) {
      if (i >= uSteps) break;
      float t = a * exp(k * (float(i) + jit) / n);
      float ds = t * k / n;
      vec3 p = o + d * t;
      populations(p, pop, dust, arms);
      // clumpy interstellar medium: dust clouds and H II knots along the arms
      float cl = gNoise(p / 140.0) * 0.65 + gNoise(p / 47.0) * 0.35;
      dust *= 0.15 + 3.0 * cl * cl; // mean ~1
      // kiloparsec-scale star clouds and dust complexes along the arms (flocculent structure)
      float big = gNoise(p / vec3(700.0, 700.0, 300.0) + 5.0);
      pop.y *= 0.3 + 1.4 * big;
      dust *= 0.4 + 1.2 * big;
      float knots = pow(gNoise(p / 70.0 + 17.0), 6.0) * 9.0;
      // the old disk brightens a little in the arms too (density waves)
      vec3 j = ${qp(Vp.thin)} * pop.x * (0.8 + 0.35 * arms) * C_OLD + ${qp(Vp.young)} * pop.y * C_YOUNG * (0.6 + 0.8 * cl)
             + ${qp(Vp.thick)} * pop.z * C_OLD + ${qp(Vp.bulge)} * pop.w * C_BULGE
             + 0.012 * pop.y * knots * C_HII;
      vec3 dt = 0.921 * AV_PC * dust * EXT * ds;
      float w = gSmooth(uNear * 0.5, uNear * 1.5, t);
      L += T * j * ds * w * exp(-0.5 * dt);
      T *= exp(-dt);
      if (T.g < 1e-4) break;
    }
  }
  gl_FragColor = vec4(L, 1.0);
}`}var Qp=class{target;facePos=[null,null,null,null,null,null];face=0;scene=new gn;cubeCam;mat;seed=0;vr=!1;cam=new U;constructor(){this.target=$p(512),this.cubeCam=new Xa(.1,10,this.target),this.mat=new J({name:`galaxy-glow`,vertexShader:Xp,fragmentShader:Zp(Lp),uniforms:{uCam:{value:new U},uToGal:{value:new W().copy(Pp.toGalM)},uNear:{value:300},uSteps:{value:128},uSeed:{value:0}},side:1,depthTest:!1,depthWrite:!1});let e=new q(new Qi(1,32,16),this.mat);e.frustumCulled=!1,this.scene.add(e)}get ready(){return this.facePos.every(e=>e!==null)}compile(e){e.compileAsync(this.scene,this.cubeCam.children[0]).catch(()=>void 0)}threshold(e){let t=Math.max(0,Math.abs(e.z)-4e3,Math.hypot(e.x,e.y)-22e3);return .004*Math.max(300,t)}update(e,t,n=1){let r=this.vr?256:512;this.target.width!==r&&(this.target.dispose(),this.target=$p(r),this.cubeCam.renderTarget=this.target,this.facePos.fill(null));let i=this.threshold(t),a=[];for(let e=0;e<6;e++){let n=(this.face+e)%6,r=this.facePos[n];(!r||r.distanceTo(t)>i)&&a.push(n)}if(!a.length)return;let o=a.slice(0,n);this.face=(o[o.length-1]+1)%6,this.cubeCam.coordinateSystem!==e.coordinateSystem&&(this.cubeCam.coordinateSystem=e.coordinateSystem,this.cubeCam.updateCoordinateSystem()),this.cubeCam.updateMatrixWorld(!0);let s=this.mat.uniforms;s.uCam.value.copy(t),s.uSteps.value=this.vr?80:128,s.uSeed.value=this.seed=(this.seed+1)%64,this.cam.copy(t);let c=e.getRenderTarget(),l=e.getActiveCubeFace(),u=e.getActiveMipmapLevel(),d=e.xr.enabled;e.xr.enabled=!1;for(let n of o)this.target.texture.generateMipmaps=n===o[o.length-1],e.setRenderTarget(this.target,n),e.render(this.scene,this.cubeCam.children[n]),this.facePos[n]=t.clone();e.xr.enabled=d,e.setRenderTarget(c,l,u)}};function $p(e){return new Yo(e,{type:g,generateMipmaps:!0,minFilter:c,magFilter:o,depthBuffer:!1})}var em=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
attribute float aAlong;
varying float vAlong;
varying vec3 vNormalW;
varying vec3 vPosView;
void main() {
  vAlong = aAlong;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosView = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${ku}
}`,tm=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;
uniform float uSeed;
varying float vAlong;   // 0 at the base, 1 at the tip (logarithmic in distance)
varying vec3 vNormalW;
varying vec3 vPosView;
float h1(float n) { return fract(sin(n) * 43758.5453123); }
float n1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f); }
void main() {
  vec3 V = normalize(-vPosView);
  // a glowing gas column: the line of sight through this surface point passes the axis at a
  // fraction sqrt(1 - facing^2) of the radius; emission falls off smoothly towards the edges
  float facing = abs(dot(normalize(vNormalW), V));
  float b2 = 1.0 - facing * facing;
  float limb = 1.4 * exp(-3.5 * b2) * facing;
  // knots travelling outwards, and a slow fade along the jet
  float knots = 0.45 + 0.55 * pow(n1(vAlong * 38.0 - uTime * 0.25 + uSeed), 2.0);
  float fade = smoothstep(0.0, 0.04, vAlong) * (1.0 - smoothstep(0.75, 1.0, vAlong));
  vec3 c = uColor * uIntensity * 0.22 * limb * knots * fade;
  gl_FragColor = vec4(c, 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`;function nm(e,t){let n=Math.min(1e5,e*.1),r=1.5*n**.58,i=Math.tan(t*Math.PI/180),a=[],o=[],s=[],c=[],l=Math.log(e/3);for(let e=0;e<=110;e++){let t=e/110,c=3*Math.exp(l*t),u=c<n?1.5*c**.58:r+(c-n)*i;for(let e=0;e<=28;e++){let n=e/28*Math.PI*2;a.push(Math.cos(n)*u,c,Math.sin(n)*u),o.push(Math.cos(n),0,Math.sin(n)),s.push(t)}}for(let e=0;e<110;e++)for(let t=0;t<28;t++){let n=e*29+t,r=n+28+1;c.push(n,r,n+1,r,r+1,n+1)}let u=new mr;return u.setAttribute(`position`,new K(new Float32Array(a),3)),u.setAttribute(`normal`,new K(new Float32Array(o),3)),u.setAttribute(`aAlong`,new K(new Float32Array(s),1)),u.setIndex(c),u}var rm=class{group=new sn;pairs=[];constructor(e){this.group.name=`jets`;for(let t of e){if(!t.jet)continue;let e=t.jet===`optical`,n=e?1500*Z:.05*Z,r=nm(n/t.radius,e?1.5:1),i=t.radius,a=t.upos.toVector3().normalize().negate(),o=n=>{let i=n*t.diskNormal.dot(a)>0,o=new J({name:`jet`,vertexShader:em,fragmentShader:tm,uniforms:{uColor:{value:e?new U(.62,.8,1):new U(.75,.6,1)},uIntensity:{value:(e?1:.35)*(i?1:.06)},uTime:{value:0},uSeed:{value:n*13.7+t.diskLook.seed},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK},transparent:!0,depthWrite:!1,blending:2,side:2}),s=new q(r,o);return s.userData.scale=t.radius,s.matrixAutoUpdate=!1,s.frustumCulled=!1,s.renderOrder=11,s.name=`${t.name} jet`,s.userData.sign=n,this.group.add(s),s};this.pairs.push({bh:t,meshes:[o(1),o(-1)],length:n,width:i})}}update(e,t,n){let r=new U,i=new H;for(let a of this.pairs){a.bh.upos.sub(e,r);let o=Math.atan2(a.length,r.length())/t>3;for(let e of a.meshes){if(e.visible=o,!o)continue;let t=e.userData.sign;i.setFromUnitVectors(new U(0,1,0),a.bh.diskNormal.clone().multiplyScalar(t));let s=a.width;e.matrix.compose(r,i,new U(s,s,s)),e.matrixWorldNeedsUpdate=!0,e.material.uniforms.uTime.value=n}}}},im=class{container;enabled=!0;nodes=new Map;used=new Set;constructor(e){this.container=e}update(e,t,n){if(this.used.clear(),this.enabled){e.sort((e,t)=>t.priority-e.priority);let r=[],i=0;for(let a of e){if(i>=80)break;let e=7*a.text.length+6,o=a.x+Math.min(a.radius,40)*.72+4,s=a.y-Math.min(a.radius,40)*.72-14+2;if(o>t||s>n||o+e<0||s+14<0)continue;let c=!1;for(let t of r)if(o<t[0]+t[2]&&o+e>t[0]&&s<t[1]+t[3]&&s+14>t[1]){c=!0;break}if(c)continue;r.push([o,s,e,14]);let l=this.nodes.get(a.key);l||(l=document.createElement(`div`),this.container.appendChild(l),this.nodes.set(a.key,l)),l.textContent!==a.text&&(l.textContent=a.text);let u=`label ${a.cls}`;l.className!==u&&(l.className=u),l.style.transform=`translate(${o.toFixed(1)}px, ${s.toFixed(1)}px)`,l.style.display=``,this.used.add(a.key),i++}}for(let[e,t]of this.nodes)this.used.has(e)||(this.nodes.size>400?(t.remove(),this.nodes.delete(e)):t.style.display=`none`)}},am=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
void main() {
  gl_Position = projectView(modelViewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${ku}
}`,om=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uAlpha;
void main() {
  gl_FragColor = vec4(uColor, uAlpha);
${Au}
  #include <logdepthbuf_fragment>
}`,sm=192,cm=14,lm=222,um={planet:[.35,.55,1],dwarf:[1,.65,.3],moon:[.45,.85,.6],asteroid:[.75,.6,.45],tno:[.7,.5,.9],selected:[1,.9,.35]},dm=new W().set(1,0,0,0,Math.cos(tp),-Math.sin(tp),0,Math.sin(tp),Math.cos(tp)),fm=class{system;group=new sn;enabled=!0;showMinor=!1;selected=null;focus=null;objs=new Map;angles=new Float64Array(lm);tmpR=new U;tmpV=new U;m3=new W;constructor(e){this.system=e,this.group.name=`orbits`}obj(e){let t=this.objs.get(e);if(t)return t;let n=new Float32Array(666),r=new mr;r.setAttribute(`position`,new K(n,3).setUsage(Ue));let i=new J({vertexShader:am,fragmentShader:om,uniforms:{uColor:{value:new U(...um[e.kind]??um.asteroid)},uAlpha:{value:.5},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK},transparent:!0,depthWrite:!1,depthTest:!0}),a=new Di(r,i);return a.frustumCulled=!1,a.matrixAutoUpdate=!1,a.renderOrder=5,this.group.add(a),t={line:a,positions:n,mat:i},this.objs.set(e,t),t}elements(e,t){let n=this.system.ephemerisKind(e);if(n===`satellite`&&e.id!==301)return this.system.satelliteElements(e,t);if(n===`kepler`){let t=this.system.heliocentricElements(e);return t?{el:t,frame:dm}:null}let r=e.parent;return r?{el:kf(this.tmpR.copy(e.pos).sub(r.pos),this.tmpV.copy(e.vel).sub(r.vel),(r.kind,r.gm+(e.systemGm||e.gm)),t),frame:this.m3.identity()}:null}update(e,t,n){for(let e of this.objs.values())e.line.visible=!1;if(!this.enabled)return;let r=this.system.sun,i=r.upos.sub(e,new U).length();for(let a of this.system.bodies){if(!a.valid||!a.parent||a.kind===`star`)continue;let o=a===this.selected;if(!o&&(a.kind===`asteroid`||a.kind===`tno`)&&!this.showMinor||!o&&a.kind===`moon`&&a.radiusEstimated&&!this.showMinor)continue;let s=a.parent.upos.sub(e,this.tmpR),c=Math.max(s.length(),1),l=a.pos.distanceTo(a.parent.pos)/c/t;if(!o&&(l<12||a.kind===`moon`&&l<25)||!o&&a.parent===r&&i>0xaa12b5ed83580)continue;let u=this.elements(a,n);if(!u||u.el.e>=1)continue;let d=this.obj(a),f=this.fill(d,u.el,u.frame,n);if(f<2)continue;let p=a.upos.sub(e,this.tmpV);d.line.matrix.makeTranslation(p.x,p.y,p.z),d.line.matrixWorldNeedsUpdate=!0,d.line.geometry.setDrawRange(0,f),d.line.geometry.attributes.position.needsUpdate=!0;let m=o?um.selected:um[a.kind]??um.asteroid;d.mat.uniforms.uColor.value.set(m[0],m[1],m[2]);let h=this.focus,g=!h||h.kind===`star`||a===h||a.parent===h||h.parent===a||h.kind===`moon`&&a.parent===h.parent,_=Math.min(.45,.12+l/600)*(a.kind===`planet`||a.kind===`moon`?1:.6);d.mat.uniforms.uAlpha.value=o?.85:g?_:_*.25,d.line.visible=!0}}fill(e,t,n,r){let i=t.q/(1-t.e),a=t.e,o=i*Math.sqrt(1-a*a),s=Cf(Math.sqrt(t.mu/(i*i*i))*(r-t.tp)*86400,a),c=0,l=this.angles;l[c++]=s;let u=2*Math.PI/sm;for(let e=cm;e>=1;e--)l[c++]=s+u*.5**e;for(let e=1;e<sm;e++)l[c++]=s+e*u;for(let e=1;e<=cm;e++)l[c++]=s+2*Math.PI-u*.5**e;l[c++]=s+2*Math.PI;let d=Ef(t.i,t.node,t.peri).premultiply(n).elements,f=i*(Math.cos(s)-a),p=o*Math.sin(s),m=e.positions;for(let e=0;e<c;e++){let t=l[e],n=i*(Math.cos(t)-a)-f,r=o*Math.sin(t)-p;m[e*3]=d[0]*n+d[3]*r,m[e*3+1]=d[1]*n+d[4]*r,m[e*3+2]=d[2]*n+d[5]*r}return c}},pm=11,mm=100,hm=12e3,gm=(e,t,n,r,i=!1)=>({f:e,t0:t,t1:n,sp:r,young:i}),_m=[{M:-9,phi:6e-11,young:.9,classes:[gm(.6,18e3,35e3,`B Ia`,!0),gm(.25,3500,4200,`M Ia`),gm(.15,6e3,9e3,`F Ia`,!0)]},{M:-8,phi:3e-10,young:.9,classes:[gm(.6,16e3,35e3,`B Ia`,!0),gm(.25,3500,4200,`M Ia`),gm(.15,6e3,9e3,`A Ia`,!0)]},{M:-7,phi:1.5e-9,young:.85,classes:[gm(.65,15e3,4e4,`O/B`,!0),gm(.25,3500,4300,`M I`),gm(.1,6e3,9e3,`F I`,!0)]},{M:-6,phi:5e-9,young:.85,classes:[gm(.7,15e3,4e4,`O/B`,!0),gm(.25,3600,4400,`K/M I`),gm(.05,6e3,9e3,`F I`,!0)]},{M:-5,phi:15e-9,young:.8,classes:[gm(.7,14e3,3e4,`B`,!0),gm(.3,3700,4500,`K/M II`)]},{M:-4,phi:5e-8,young:.75,classes:[gm(.7,13e3,25e3,`B`,!0),gm(.3,3800,4500,`K/M III`)]},{M:-3,phi:15e-8,young:.65,classes:[gm(.65,12e3,22e3,`B`,!0),gm(.35,3800,4500,`M III`)]},{M:-2,phi:5e-7,young:.5,classes:[gm(.55,11e3,18e3,`B`,!0),gm(.45,3900,4600,`K/M III`)]},{M:-1,phi:2e-6,young:.4,classes:[gm(.45,1e4,14e3,`B`,!0),gm(.55,4e3,4700,`K III`)]},{M:0,phi:15e-6,young:.25,classes:[gm(.3,8500,11e3,`A`,!0),gm(.7,4500,4950,`K III (clump)`)]},{M:1,phi:4e-5,young:.3,classes:[gm(.5,7500,9500,`A`,!0),gm(.5,4600,5100,`G/K III`)]},{M:2,phi:1e-4,young:.25,classes:[gm(.65,6800,8500,`A/F`,!0),gm(.35,5e3,5800,`G IV`)]},{M:3,phi:25e-5,young:.15,classes:[gm(1,6200,7e3,`F V`)]},{M:4,phi:6e-4,young:.1,classes:[gm(1,5800,6400,`F/G V`)]},{M:5,phi:.0012,young:.05,classes:[gm(1,5300,5900,`G V`)]},{M:6,phi:.0018,young:.05,classes:[gm(1,4800,5400,`K V`)]},{M:7,phi:.0023,young:.05,classes:[gm(1,4300,4900,`K V`)]},{M:8,phi:.003,young:.05,classes:[gm(1,3900,4400,`K/M V`)]},{M:9,phi:.004,young:.05,classes:[gm(1,3600,3950,`M V`)]},{M:10,phi:.005,young:.05,classes:[gm(1,3300,3650,`M V`)]},{M:11,phi:.006,young:.05,classes:[gm(1,3100,3400,`M V`)]},{M:12,phi:.007,young:.05,classes:[gm(1,2900,3200,`M V`)]}],vm=(e,t)=>10**((t-e+5)/5),ym=e=>vm(_m[e].M,10)/2.5,bm=Ip(Pp.sun.clone()),xm=bm.young,Sm=bm.thin+bm.thick+bm.bulge+bm.nsc;function Cm(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function wm(e,t,n,r){let i=2166136261^e*374761393;for(let e of[t,n,r])i=Math.imul(i^e&65535,16777619),i=Math.imul(i^e>>>16&65535,16777619);return i>>>0}function Tm(e,t){if(e>40)return Math.max(0,Math.round(e+Math.sqrt(e)*Em(t)));let n=Math.exp(-e),r=0,i=1;do r++,i*=t();while(i>n);return r-1}function Em(e){return Math.sqrt(-2*Math.log(Math.max(e(),1e-12)))*Math.cos(2*Math.PI*e())}function Dm(e,t,n){return e>=0?n*(Math.exp(-e/n)-Math.exp(-t/n)):t<=0?n*(Math.exp(t/n)-Math.exp(e/n)):n*(2-Math.exp(e/n)-Math.exp(-t/n))}function Om(e,t,n,r){let i=r*Dm(e,t,n);if(e<0){let r=Dm(e,Math.min(t,0),n);if(i<r)return Math.min(n*Math.log(i/n+Math.exp(e/n)),0);i-=r}let a=Math.max(e,0);return Math.min(-n*Math.log(Math.max(Math.exp(-a/n)-i/n,1e-300)),t)}var km={thin:260,young:90,thick:900},Am=100,jm=(()=>{let e=[0],t=[0],n={thin:0,young:0,thick:0,bulge:0,nsc:0,dust:0},r=new U,i=0;for(let a=1;a<=400;a++){let o=.01*1.025**(a-1),s=.01*1.025**a,c=.5*(o+s);Ip(r.set(c,0,0),n),i+=n.nsc*4*Math.PI*c*c*(s-o),e.push(s),t.push(i)}return{rs:e,cum:t,total:i}})();function Mm(e){let t=e*jm.total,n=jm.cum,r=1;for(;r<n.length-1&&n[r]<t;)r++;let i=(t-n[r-1])/Math.max(n[r]-n[r-1],1e-30);return jm.rs[r-1]+i*(jm.rs[r]-jm.rs[r-1])}function Nm(e,t,n,r){let i=_m[e],a=ym(e),o=new U(t*a,n*a,r*a),s=o.z,c=o.z+a,l=o.clone().addScalar(a/2),u=Cm(wm(e,t,n,r)),d=new U,f={thin:0,young:0,thick:0,bulge:0,nsc:0,dust:0},p={young:0,thin:0,thick:0,bulge:0},m={young:0,thin:0,thick:0,bulge:0},h=Dm(s,c,km.young),g=Dm(s,c,km.thin),_=Dm(s,c,km.thick),v=(a/5)**2;for(let e=0;e<5;e++)for(let t=0;t<5;t++){d.set(o.x+(e+.5)/5*a,o.y+(t+.5)/5*a,0),Ip(d,f),p.young+=f.young*h*v,m.young=Math.max(m.young,f.young),p.thin+=f.thin*g*v,m.thin=Math.max(m.thin,f.thin),p.thick+=f.thick*_*v,m.thick=Math.max(m.thick,f.thick);for(let e=0;e<6;e++){d.z=s+(e+.5)/6*a,Ip(d,f);let t=f.bulge+(a<Am?f.nsc:0);p.bulge+=t*v*(a/6),m.bulge=Math.max(m.bulge,t)}}let y=a>=Am&&o.x<=0&&o.y<=0&&o.z<=0&&o.x+a>0&&o.y+a>0&&o.z+a>0,b={young:i.phi*i.young*(p.young/xm),thin:i.phi*(1-i.young)*(p.thin/Sm),thick:i.phi*(1-i.young)*(p.thick/Sm),bulge:i.phi*(1-i.young)*(p.bulge/Sm),nsc:y?i.phi*(1-i.young)*(jm.total/Sm):0},x=b.young+b.thin+b.thick+b.bulge+b.nsc,S=Math.min(hm,Tm(x,u)),C=Pp.toIcrf(l),w={key:`${e}:${t}:${n}:${r}`,band:e,ix:t,iy:n,iz:r,centre:C,size:a,count:0,pos:new Float32Array(S*3),absMag:new Float32Array(S),teff:new Float32Array(S),cls:new Uint8Array(S)};if(S===0)return w;let T=zp(Pp.sun,l,12),E=new U,D=new U,O=0;for(let e=0;e<S;e++){let e=u()*x,t=`young`;for(let n of[`young`,`thin`,`thick`,`bulge`,`nsc`])if(t=n,(e-=b[n])<=0)break;for(let e=0;;e++){if(t===`nsc`){let e=Mm(u()),t=2*u()-1,n=2*Math.PI*u(),r=Math.sqrt(1-t*t);E.set(e*r*Math.cos(n),e*r*Math.sin(n),e*t);break}if(E.set(o.x+u()*a,o.y+u()*a,0),t===`bulge`){if(E.z=s+u()*a,Ip(E,f),e>30||u()*m.bulge*1.5<f.bulge+(a<Am?f.nsc:0))break}else{Ip(E,f);let n=t===`young`?f.young:t===`thin`?f.thin:f.thick,r=t;if(e>30||u()*m[r]*1.3<n){E.z=Om(s,c,km[r],u());break}}}let n=i.M+u();Pp.toIcrf(E,D);let r=D.length();if(r<mm||n+5*Math.log10(r)-5+T<pm)continue;let l=t===`young`,d=i.classes.filter(e=>e.young===l),p=d.length?d:i.classes,h=p.reduce((e,t)=>e+t.f,0),g=u()*h,_=0;for(;_<p.length-1&&(g-=p[_].f)>0;)_++;let v=p[_];w.pos[O*3]=D.x-C.x,w.pos[O*3+1]=D.y-C.y,w.pos[O*3+2]=D.z-C.z,w.absMag[O]=n,w.teff[O]=v.t0*(v.t1/v.t0)**u(),w.cls[O]=i.classes.indexOf(v),O++}return w.count=O,w}function Pm(e,t){return _m[e.band].classes[e.cls[t]]?.sp??``}var Fm=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
${Yd}
attribute vec3 aPos;
attribute float aMT;
uniform vec3 uOffset;      // node origin minus camera (pc)
uniform float uScale;      // pc per position unit
uniform float uAbsMin;
uniform float uAbsStep;
uniform float uHideRadius; // pc: closer stars are drawn by the near-star renderer
uniform float uExtinction; // mag of dust between the eye and this group of stars
uniform sampler2D uColorLut;
varying vec3 vColor;
varying float vEnergy;
varying float vRadius;
${Xd}
const float PC = 3.0856775814913673e16;
void main() {
  vec3 rel = uOffset + aPos * uScale;
  float d = length(rel);
  float absMag = uAbsMin + mod(aMT, 256.0) * uAbsStep;
  float m = absMag + 1.50515 * log2(max(d, 1e-9)) - 5.0 + uExtinction;  // 5 log10(d) = 1.50515 log2(d)
  float energy;
  float radius = psfSetup(magToIrradiance(m), energy);
  if (radius <= 0.0 || d < uHideRadius) {
    // culled: outside the clip volume. (A point size <= 0 is undefined in GLSL ES and crashes
    // some software rasterisers, so keep it at 1.)
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 1.0;
    return;
  }
  gl_Position = projectView(viewMatrix * vec4(rel * PC, 1.0));
  #include <logdepthbuf_vertex>
${ku}
${Du}
  gl_PointSize = 2.0 * radius * uDpr;
  vRadius = radius;
  vEnergy = energy;
  vColor = texture2D(uColorLut, vec2(floor(aMT / 256.0) / 255.0, 0.5)).rgb * 2.0;
}`,Im=`
#include <common>
#include <logdepthbuf_pars_fragment>
${Yd}
varying vec3 vColor;
varying float vEnergy;
varying float vRadius;
${Zd}
void main() {
  gl_FragColor = vec4(psfShade(gl_PointCoord, vRadius, vEnergy, vColor), 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,Lm=class{catalog;group=new sn;objects=new Map;colorLut;template;psf={uExposure:{value:1},uPixelSA:{value:1e-6},uMinEnergy:{value:.004},uMaxRadius:{value:64},uGlare:{value:1},uPointGamma:{value:.55},uPointGain:{value:2.5},uDpr:{value:1},uMaxEnergy:{value:8e3},uSat:{value:1.7},uHalo:{value:1},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK};constructor(e,t){this.catalog=e,t&&(this.psf=t),this.group.name=`catalog-stars`,this.colorLut=new ai(fu(256),256,1,w),this.colorLut.magFilter=o,this.colorLut.minFilter=o,this.colorLut.needsUpdate=!0,this.template=new J({name:`star-field`,vertexShader:Fm,fragmentShader:Im,uniforms:{...this.psf,uOffset:{value:new U},uScale:{value:1},uAbsMin:{value:-12},uAbsStep:{value:.125},uHideRadius:{value:0},uExtinction:{value:0},uColorLut:{value:this.colorLut}},transparent:!0,depthWrite:!1,depthTest:!0,blending:2}),e.onNodeEvicted=e=>this.release(e)}create(e){let t=new mr,n=e.enc===`u`?new K(e.pos,3,!0):new K(e.pos,3);t.setAttribute(`aPos`,n),t.setAttribute(`aMT`,new K(e.mt,1,!1)),t.setAttribute(`position`,n);let r=this.template.clone();Object.assign(r.uniforms,this.psf,{uColorLut:{value:this.colorLut}});let i=new Li(t,r);return i.frustumCulled=!1,i.matrixAutoUpdate=!1,i.name=`star-node-${e.id}`,this.objects.set(e.id,i),this.group.add(i),i}release(e){let t=this.objects.get(e.id);t&&(this.group.remove(t),t.geometry.dispose(),t.material.dispose(),this.objects.delete(e.id))}update(e,t){for(let e of this.objects.values())e.visible=!1;for(let n of this.catalog.needed){if(n.drawCount===0)continue;let r=this.objects.get(n.id)??this.create(n),{origin:i,scale:a}=this.catalog.nodeFrame(n),o=r.material.uniforms;o.uOffset.value.set(i[0]-e.x,i[1]-e.y,i[2]-e.z),o.uScale.value=a,o.uHideRadius.value=t,r.geometry.setDrawRange(0,n.drawCount),r.visible=!0}}get drawnStars(){let e=0;for(let t of this.catalog.needed)e+=t.drawCount;return e}},Rm=-12,zm=.125,Bm=2500,Vm=class extends fp{constructor(e,t,n,r,i,a){super(e,t,n,r,i,[a],null),this.exact=!0}info(){let e=[[`Type`,`Star (generated from the Milky Way model)`]];this.spect&&e.push([`Spectral class`,this.spect]),e.push([`Temperature`,`${Math.round(this.teff).toLocaleString()} K`]),e.push([`Absolute mag (V)`,this.absMag.toFixed(2)]),e.push([`Luminosity (V)`,`${(10**(-.4*(this.absMag-Wl))).toPrecision(3)} L☉`]),e.push([`Radius`,`${(this.radius/6957e5).toPrecision(3)} R☉ (estimated)`]);let t=this.posPc.length();return e.push([`Distance from Sun`,t>3e3?`${(t/1e3).toFixed(2)} kpc (${(t*Z/Fl/1e3).toFixed(1)} thousand ly)`:`${t.toFixed(0)} pc (${(t*Z/Fl).toFixed(0)} ly)`]),e.push([`RA / Dec (from Sun)`,lp(this.posPc)]),e.push([`Origin`,`procedural: stars like it are there, this one is invented`]),e}},Hm=class{psf;colorLut;group=new sn;enabled=!0;visible=[];entries=new Map;template;frame=0;stars=new Map;pending=0;inflight=new Set;workers=[];nextWorker=0;constructor(e,t){this.psf=e,this.colorLut=t,this.group.name=`procedural-stars`;let n=Math.max(1,Math.min(2,(navigator.hardwareConcurrency||2)-1));for(let e=0;e<n;e++){let e=new Worker(new URL(new URL(`stars.worker-CquSJBSd.js`,import.meta.url).href,``+import.meta.url),{type:`module`});e.onmessage=e=>this.receive(e.data),this.workers.push(e)}this.template=new J({name:`procedural-stars`,vertexShader:Fm,fragmentShader:Im,uniforms:{...e,uOffset:{value:new U},uScale:{value:1},uAbsMin:{value:Rm},uAbsStep:{value:zm},uHideRadius:{value:0},uExtinction:{value:0},uColorLut:{value:t}},transparent:!0,depthWrite:!1,depthTest:!0,blending:2})}makePoints(e){let t=e.cell;if(!t.count)return null;let n=t.pos.subarray(0,t.count*3),r=new Uint16Array(t.count);for(let e=0;e<t.count;e++){let n=Math.max(0,Math.min(255,Math.round((t.absMag[e]-Rm)/zm))),i=Math.round(uu(t.teff[e])*255);r[e]=n|i<<8}let i=new mr,a=new K(n,3);i.setAttribute(`aPos`,a),i.setAttribute(`position`,a),i.setAttribute(`aMT`,new K(r,1,!1));let o=this.template.clone();Object.assign(o.uniforms,this.psf,{uColorLut:{value:this.colorLut}});let s=new Li(i,o);return s.frustumCulled=!1,s.matrixAutoUpdate=!1,s.name=`procedural-${t.key}`,this.group.add(s),s}receive(e){this.inflight.delete(e.key);let t={cell:{...e,centre:new U(e.centre[0],e.centre[1],e.centre[2])},points:null,ext:0,extAt:null,lastUsed:this.frame};t.points=this.makePoints(t),t.points&&(t.points.visible=!1),this.entries.set(e.key,t)}update(e,t,n,r=6){this.frame++;for(let e of this.visible)e.points&&(e.points.visible=!1);if(this.visible.length=0,!this.enabled)return;let i=Pp.toGal(e),a=[];for(let e=0;e<_m.length;e++){let n=vm(_m[e].M,t+.3),r=ym(e),o=[i.x-n,i.y-n,i.z-n].map(e=>Math.floor(e/r)),s=[i.x+n,i.y+n,i.z+n].map(e=>Math.floor(e/r));for(let t=o[0];t<=s[0];t++)for(let c=o[1];c<=s[1];c++)for(let l=o[2];l<=s[2];l++){let o=Math.max(t*r-i.x,0,i.x-(t+1)*r),s=Math.max(c*r-i.y,0,i.y-(c+1)*r),u=Math.max(l*r-i.z,0,i.z-(l+1)*r),d=Math.hypot(o,s,u);d<=n&&a.push({k:e,ix:t,iy:c,iz:l,d})}}a.sort((e,t)=>e.k-t.k||e.d-t.d);let o=40;this.pending=0;let s=new U;for(let t of a){let a=`${t.k}:${t.ix}:${t.iy}:${t.iz}`,c=this.entries.get(a);if(!c){this.pending++,!this.inflight.has(a)&&this.inflight.size<this.workers.length*r&&(this.inflight.add(a),this.workers[this.nextWorker++%this.workers.length].postMessage({k:t.k,ix:t.ix,iy:t.iy,iz:t.iz}));continue}if(c.lastUsed=this.frame,!c.points)continue;let l=c.cell.centre.distanceTo(e);(!c.extAt||c.extAt.distanceTo(e)>.03*l+1)&&o-->0&&(c.ext=zp(i,Pp.toGal(c.cell.centre,s),16),c.extAt=e.clone());let u=c.points.material.uniforms;u.uOffset.value.copy(c.cell.centre).sub(e),u.uHideRadius.value=n,u.uExtinction.value=c.ext,c.points.visible=!0,this.visible.push(c)}this.entries.size>Bm&&this.evict()}evict(){let e=[...this.entries.values()].filter(e=>e.lastUsed<this.frame).sort((e,t)=>e.lastUsed-t.lastUsed);for(let t of e.slice(0,this.entries.size-Bm*.8))t.points&&(this.group.remove(t.points),t.points.geometry.dispose(),t.points.material.dispose()),this.entries.delete(t.cell.key)}get drawnStars(){return this.visible.reduce((e,t)=>e+t.cell.count,0)}forEachVisible(e,t,n){let r=new U;for(let i of this.visible){let a=i.cell;for(let o=0;o<a.count;o++){r.set(a.centre.x+a.pos[o*3]-e.x,a.centre.y+a.pos[o*3+1]-e.y,a.centre.z+a.pos[o*3+2]-e.z);let s=r.length(),c=a.absMag[o]+5*Math.log10(Math.max(s,1e-9))-5+i.ext;c>t||n(r,c,()=>this.star(a,o))}}}nearest(e,t,n=8){let r=[],i=new U;for(let n of this.visible){let a=n.cell;if(!(a.centre.distanceTo(e)>a.size+t))for(let n=0;n<a.count;n++){i.set(a.centre.x+a.pos[n*3]-e.x,a.centre.y+a.pos[n*3+1]-e.y,a.centre.z+a.pos[n*3+2]-e.z);let o=i.length();o<t&&r.push({star:this.star(a,n),dist:o})}}return r.sort((e,t)=>e.dist-t.dist).slice(0,n)}star(e,t){let n=`ps:${e.key}:${t}`,r=this.stars.get(n);return r||(r=new Vm(n,new U(e.centre.x+e.pos[t*3],e.centre.y+e.pos[t*3+1],e.centre.z+e.pos[t*3+2]),e.absMag[t],e.teff[t],Pm(e,t),Um(e,t)),this.stars.size>5e3&&this.stars.clear(),this.stars.set(n,r)),r}find(e){let t=/^ps\s*(\d+)\.(-?\d+)\.(-?\d+)\.(-?\d+)-(\d+)$/i.exec(e.trim());if(!t)return null;let[n,r,i,a,o]=t.slice(1).map(Number);if(n>=_m.length)return null;let s=this.entries.get(`${n}:${r}:${i}:${a}`)?.cell??Nm(n,r,i,a);return o<s.count?this.star(s,o):null}};function Um(e,t){return`PS ${e.band}.${e.ix}.${e.iy}.${e.iz}-${t}`}var Wm=`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,Gm=class e{canvas;xrCapable;gl;depthMode;scene=new gn;camera;exposure=1;postExposure=1;bloomStrength=.06;hdr;bloomTargets=[];quad;quadScene=new gn;quadCam=new Ga(-1,1,1,-1,0,1);downMat;upMat;compositeMat;width=1;height=1;pixelRatio=1;rig=new sn;constructor(t,n=!1){this.canvas=t,this.xrCapable=n;let r=!n&&e.supportsClipControl();this.depthMode=r?`reversed-z`:`logarithmic`,this.gl=new Nl({canvas:t,antialias:n,alpha:!1,powerPreference:`high-performance`,reversedDepthBuffer:r,logarithmicDepthBuffer:!r,preserveDrawingBuffer:!0}),this.gl.autoClear=!1,this.gl.toneMapping=0,this.gl.xr.enabled=n,this.gl.xr.setReferenceSpaceType(`local`),this.camera=new Wa(50,1,.05,1e30),this.camera.matrixAutoUpdate=!0,this.rig.add(this.camera),this.scene.add(this.rig),this.hdr=this.makeHdrTarget(1,1),this.downMat=new J({vertexShader:Wm,fragmentShader:`
        uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
        void main() {
          // 13-tap downsample (Jimenez 2014, "Next Generation Post Processing in Call of Duty")
          vec3 a = texture2D(tSrc, vUv + uTexel * vec2(-2.0, 2.0)).rgb;
          vec3 b = texture2D(tSrc, vUv + uTexel * vec2(0.0, 2.0)).rgb;
          vec3 c = texture2D(tSrc, vUv + uTexel * vec2(2.0, 2.0)).rgb;
          vec3 d = texture2D(tSrc, vUv + uTexel * vec2(-2.0, 0.0)).rgb;
          vec3 e = texture2D(tSrc, vUv).rgb;
          vec3 f = texture2D(tSrc, vUv + uTexel * vec2(2.0, 0.0)).rgb;
          vec3 g = texture2D(tSrc, vUv + uTexel * vec2(-2.0, -2.0)).rgb;
          vec3 h = texture2D(tSrc, vUv + uTexel * vec2(0.0, -2.0)).rgb;
          vec3 i = texture2D(tSrc, vUv + uTexel * vec2(2.0, -2.0)).rgb;
          vec3 j = texture2D(tSrc, vUv + uTexel * vec2(-1.0, 1.0)).rgb;
          vec3 k = texture2D(tSrc, vUv + uTexel * vec2(1.0, 1.0)).rgb;
          vec3 l = texture2D(tSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb;
          vec3 m = texture2D(tSrc, vUv + uTexel * vec2(1.0, -1.0)).rgb;
          vec3 col = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
          gl_FragColor = vec4(min(col, vec3(6.0e4)), 1.0);
        }`,uniforms:{tSrc:{value:null},uTexel:{value:new V}},depthTest:!1,depthWrite:!1,blending:0}),this.upMat=new J({vertexShader:Wm,fragmentShader:`
        uniform sampler2D tSrc; uniform sampler2D tPrev; uniform vec2 uTexel; uniform float uRadius; varying vec2 vUv;
        void main() {
          vec2 o = uTexel * uRadius;
          vec3 s = texture2D(tSrc, vUv + vec2(-o.x, o.y)).rgb + 2.0 * texture2D(tSrc, vUv + vec2(0.0, o.y)).rgb
                 + texture2D(tSrc, vUv + vec2(o.x, o.y)).rgb + 2.0 * texture2D(tSrc, vUv + vec2(-o.x, 0.0)).rgb
                 + 4.0 * texture2D(tSrc, vUv).rgb + 2.0 * texture2D(tSrc, vUv + vec2(o.x, 0.0)).rgb
                 + texture2D(tSrc, vUv + vec2(-o.x, -o.y)).rgb + 2.0 * texture2D(tSrc, vUv + vec2(0.0, -o.y)).rgb
                 + texture2D(tSrc, vUv + vec2(o.x, -o.y)).rgb;
          gl_FragColor = vec4(s / 16.0 + texture2D(tPrev, vUv).rgb, 1.0);
        }`,uniforms:{tSrc:{value:null},tPrev:{value:null},uTexel:{value:new V},uRadius:{value:1}},depthTest:!1,depthWrite:!1,blending:0}),this.compositeMat=new J({vertexShader:Wm,fragmentShader:`
        uniform sampler2D tScene; uniform sampler2D tBloom; uniform float uExposure; uniform float uBloom; varying vec2 vUv;
        // ACES fitted curve (Stephen Hill, BakingLab, MIT licence)
        const mat3 ACESIn = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777);
        const mat3 ACESOut = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602);
        vec3 RRTAndODTFit(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
        vec3 aces(vec3 c) { c = ACESIn * c; c = RRTAndODTFit(c); return clamp(ACESOut * c, 0.0, 1.0); }
        vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
        float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main() {
          vec3 hdr = texture2D(tScene, vUv).rgb + uBloom * texture2D(tBloom, vUv).rgb;
          vec3 c = toSRGB(aces(hdr * uExposure));
          c += (hash(gl_FragCoord.xy) - 0.5) / 255.0; // dither
          gl_FragColor = vec4(c, 1.0);
        }`,uniforms:{tScene:{value:null},tBloom:{value:null},uExposure:{value:1},uBloom:{value:.05}},depthTest:!1,depthWrite:!1,blending:0}),this.quad=new q(new Xi(2,2),this.compositeMat),this.quad.frustumCulled=!1,this.quadScene.add(this.quad)}static supportsClipControl(){try{let e=document.createElement(`canvas`).getContext(`webgl2`),t=!!e?.getExtension(`EXT_clip_control`);return e?.getExtension(`WEBGL_lose_context`)?.loseContext(),t&&new URLSearchParams(location.search).get(`depth`)!==`log`}catch{return!1}}makeHdrTarget(e,t){return new At(e,t,{type:g,format:w,samples:4,depthBuffer:!0,depthTexture:new Vi(e,t,h),minFilter:o,magFilter:o})}setSize(e,t,n){if(this.presenting)return;this.pixelRatio=n,this.gl.setPixelRatio(n),this.gl.setSize(e,t,!1);let r=Math.max(1,Math.floor(e*n)),i=Math.max(1,Math.floor(t*n));this.width=r,this.height=i,this.hdr.dispose(),this.hdr=this.makeHdrTarget(r,i);for(let e of this.bloomTargets)e.dispose();for(let e of this.twins.values())e.dispose();this.twins.clear(),this.bloomTargets=[];let a=r,s=i;for(let e=0;e<7&&a>4&&s>4;e++)a=Math.max(1,a>>1),s=Math.max(1,s>>1),this.bloomTargets.push(new At(a,s,{type:g,depthBuffer:!1,minFilter:o,magFilter:o}));this.camera.aspect=r/i,this.camera.updateProjectionMatrix()}pixelSolidAngle(){let e=2*Math.tan(this.camera.fov*Math.PI/360)/this.height;return e*e}pixelAngle(){return 2*Math.tan(this.camera.fov*Math.PI/360)/this.height}get presenting(){return this.gl.xr.enabled&&this.gl.xr.isPresenting}setXrMode(e){this.gl.toneMapping=e?4:0,this.gl.toneMappingExposure=e?.6:1}viewQuat=new H;viewInfo(){if(this.presenting){let e=this.gl.xr.getCamera(),t=e.cameras[0]??e,n=t.projectionMatrix.elements,r=t.viewport,i=r&&r.z>0?r.z:1440,a=r&&r.w>0?r.w:1600,o=2*Math.atan(1/n[5])*180/Math.PI,s=n[10]+1===0?1/0:n[14]/(n[10]+1);return t.matrix.decompose(this._p,this.viewQuat,this._s),this.viewQuat.premultiply(this.rig.quaternion),{quat:this.viewQuat,fovY:o,aspect:i/a,width:i,height:a,pixelAngle:2/(n[5]*a),pixelRatio:1,far:s>0?s:1/0,xr:!0}}return this.camera.getWorldQuaternion(this.viewQuat),{quat:this.viewQuat,fovY:this.camera.fov,aspect:this.camera.aspect,width:this.width/this.pixelRatio,height:this.height/this.pixelRatio,pixelAngle:this.pixelAngle(),pixelRatio:this.pixelRatio,far:1/0,xr:!1}}warnedXrTarget=!1;_p=new U;_s=new U;render(){let e=this.gl;if(this.presenting){let t=e.getRenderTarget();(!t||!t.isXRRenderTarget)&&(this.warnedXrTarget||console.warn(`XR frame without the XR render target bound`,t),this.warnedXrTarget=!0),e.setClearColor(0,1),e.clear(!0,!0,!0),e.render(this.scene,this.camera);return}e.setRenderTarget(this.hdr),e.setClearColor(0,1),e.clear(!0,!0,!0),e.render(this.scene,this.camera);let t=this.hdr.texture,n=this.width,r=this.height;this.quad.material=this.downMat;for(let i of this.bloomTargets)this.downMat.uniforms.tSrc.value=t,this.downMat.uniforms.uTexel.value.set(1/n,1/r),e.setRenderTarget(i),e.render(this.quadScene,this.quadCam),t=i.texture,n=i.width,r=i.height;this.quad.material=this.upMat;for(let t=this.bloomTargets.length-1;t>0;t--){let n=this.bloomTargets[t],r=this.bloomTargets[t-1];this.upMat.uniforms.tSrc.value=n.texture,this.upMat.uniforms.tPrev.value=r.texture,this.upMat.uniforms.uTexel.value.set(1/n.width,1/n.height),e.setRenderTarget(this.scratch(r)),e.render(this.quadScene,this.quadCam),this.swapScratch(t-1)}this.quad.material=this.compositeMat,this.compositeMat.uniforms.tScene.value=this.hdr.texture,this.compositeMat.uniforms.tBloom.value=this.bloomTargets[0]?.texture??this.hdr.texture,this.compositeMat.uniforms.uExposure.value=this.postExposure,this.compositeMat.uniforms.uBloom.value=this.bloomTargets.length?this.bloomStrength:0,e.setRenderTarget(null),e.render(this.quadScene,this.quadCam)}twins=new Map;scratch(e){let t=this.twins.get(e);return(!t||t.width!==e.width||t.height!==e.height)&&(t?.dispose(),t=new At(e.width,e.height,{type:g,depthBuffer:!1,minFilter:o,magFilter:o}),this.twins.set(e,t)),t}swapScratch(e){let t=this.bloomTargets[e],n=this.twins.get(t);this.twins.delete(t),this.twins.set(n,t),this.bloomTargets[e]=n}screenshot(){return this.canvas.toDataURL(`image/png`)}},Km=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
varying vec3 vDir;
void main() {
  vDir = position;
  // far away (no stereo parallax); drawn first without depth test
  gl_Position = projectView(viewMatrix * vec4(position * 1.0e7, 1.0));
  #include <logdepthbuf_vertex>
${ku}
}`,qm=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform sampler2D uMap;
uniform float uGain;
uniform samplerCube uGalaxy;
uniform float uMix;       // 0: the NASA map only, 1: the galaxy model only
uniform float uModelK;    // display value of a model column of uModelRef
uniform float uModelRef;
uniform float uModelExp;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float ra = atan(d.y, d.x);
  float dec = asin(clamp(d.z, -1.0, 1.0));
  // RA 0h at the map centre, RA increasing to the left; north at the top
  float u = 0.5 - ra / (2.0 * PI);
  float v = 0.5 + dec / PI;
  // Seam-safe derivatives (Tarini): use whichever of u, u+0.5 is continuous here
  float u2 = fract(u + 0.5) - 0.5;
  vec2 g1x = vec2(dFdx(u), dFdx(v)), g1y = vec2(dFdy(u), dFdy(v));
  vec2 g2x = vec2(dFdx(u2), dFdx(v)), g2y = vec2(dFdy(u2), dFdy(v));
  bool alt = abs(g2x.x) + abs(g2y.x) < abs(g1x.x) + abs(g1y.x);
  vec3 c = textureGrad(uMap, vec2(fract(u), v), alt ? g2x : g1x, alt ? g2y : g1y).rgb;
  c *= uGain;
  if (uMix > 0.0) {
    // galaxy model: V-band column luminosity, mapped like the map (its pixels go as flux^1.65)
    vec3 L = textureCube(uGalaxy, d).rgb;
    float Y = max(dot(L, vec3(0.2126, 0.7152, 0.0722)), 1e-9);
    // above the calibration point grow only logarithmically (C1 at x = 1), so the much brighter
    // sky of the inner galaxy is bright without washing everything out
    float x = Y / uModelRef;
    float fx = x < 1.0 ? pow(x, uModelExp) : 1.0 + uModelExp * log(x);
    c = mix(c, uModelK * fx * (L / Y), uMix);
  }
  gl_FragColor = vec4(c, 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,Jm=class t{mesh;gain={value:0};brightness=1;static GAIN=.45;static MODEL_REF=81.3;static MAP_AT_REF=.125;constructor(n){let r=new Ia().load(n);r.colorSpace=Re,r.wrapS=e,r.minFilter=c,r.magFilter=o,r.anisotropy=4;let i=new J({name:`sky`,vertexShader:Km,fragmentShader:qm,uniforms:{uMap:{value:r},uGain:this.gain,uGalaxy:{value:null},uMix:{value:0},uModelK:{value:0},uModelRef:{value:t.MODEL_REF},uModelExp:{value:1.65},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK},side:1,depthTest:!1,depthWrite:!1});this.mesh=new q(new Qi(1,64,32),i),this.mesh.name=`milky-way`,this.mesh.frustumCulled=!1,this.mesh.renderOrder=-1e3}update(e,t){this.updateWith(e,t,null,null)}updateWith(e,n,r,i){let a=t.GAIN*this.brightness*Math.max(e,0)**.55,o=this.mesh.material.uniforms,s=r&&i?Ym(120,700,n):0;if(this.gain.value=a*(r?1:1-Ym(300,1500,n)),o.uMix.value=s,o.uGalaxy.value=r,i){let e=Ym(500,6e3,Math.max(0,Math.abs(i.z)-4e3,Math.hypot(i.x,i.y)-22e3));o.uModelExp.value=1.65+(.6-1.65)*e,o.uModelK.value=a*t.MAP_AT_REF*(1+5*e)}this.mesh.visible=a>1e-5}};function Ym(e,t,n){let r=Math.max(0,Math.min(1,(n-e)/(t-e)));return r*r*(3-2*r)}var Xm=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
${Yd}
attribute vec4 aOrb0;   // a (AU), e, i (deg), node (deg)
attribute vec4 aOrb1;   // peri (deg), M at reference epoch (deg), H, class
uniform float uDt;      // days since reference epoch
uniform vec3 uSunRel;   // camera-relative Sun position (m)
uniform mat3 uEclToEqu;
uniform float uBoost;
varying vec3 vColor; varying float vEnergy; varying float vRadius;
${Xd}
const float AU_M = 149597870700.0;
void main() {
  float a = aOrb0.x, e = aOrb0.y;
  float inc = radians(aOrb0.z), node = radians(aOrb0.w), peri = radians(aOrb1.x);
  float n = 0.98560766 / (a * sqrt(a));                  // deg/day (Gauss)
  float M = radians(mod(aOrb1.y + n * uDt, 360.0));
  if (M > PI) M -= 2.0 * PI;
  float E = M + e * sin(M);
  for (int k = 0; k < 6; k++) E -= (E - e * sin(E) - M) / (1.0 - e * cos(E));
  vec2 pf = vec2(a * (cos(E) - e), a * sqrt(1.0 - e * e) * sin(E));
  float cO = cos(node), sO = sin(node), ci = cos(inc), si = sin(inc), cw = cos(peri), sw = sin(peri);
  vec3 ecl = vec3(
    (cO * cw - sO * sw * ci) * pf.x + (-cO * sw - sO * cw * ci) * pf.y,
    (sO * cw + cO * sw * ci) * pf.x + (-sO * sw + cO * cw * ci) * pf.y,
    (sw * si) * pf.x + (cw * si) * pf.y);
  vec3 helio = uEclToEqu * ecl;                           // AU
  vec3 rel = uSunRel + helio * AU_M;
  float r = length(helio);
  float delta = length(rel) / AU_M;
  float cosA = dot(helio, rel / AU_M) / max(r * delta, 1e-12);
  float alpha = acos(clamp(cosA, -1.0, 1.0));
  // IAU H,G magnitude system (G = 0.15)
  float t = tan(alpha * 0.5);
  float phi = 0.85 * exp(-3.33 * pow(t, 0.63)) + 0.15 * exp(-1.87 * pow(t, 1.22));
  float V = aOrb1.z + 5.0 * log2(r * max(delta, 1e-9)) * 0.30103 - 2.5 * log2(max(phi, 1e-6)) * 0.30103;
  float energy;
  // Artistic boost only for distant asteroids (belt structure); physical within ~0.05 AU.
  float boost = mix(1.0, uBoost, smoothstep(0.05, 0.5, delta));
  float radius = psfSetup(magToIrradiance(V) * boost, energy);
  if (radius <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 1.0; return; }
  gl_Position = projectView(viewMatrix * vec4(rel, 1.0));
  #include <logdepthbuf_vertex>
${ku}
${Du}
  gl_PointSize = 2.0 * radius * uDpr;
  vRadius = radius; vEnergy = energy;
  vColor = aOrb1.w > 9.5 ? vec3(0.95, 0.9, 1.0) : vec3(1.0, 0.93, 0.82);
}`,Zm=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
${Yd}
attribute float aMag;
uniform vec3 uSunRel;
uniform float uBoost;
varying vec3 vColor; varying float vEnergy; varying float vRadius;
${Xd}
const float AU_M = 149597870700.0;
void main() {
  vec3 rel = uSunRel + position * AU_M;
  float energy;
  float radius = aMag > 90.0 ? 0.0 : psfSetup(magToIrradiance(aMag) * uBoost, energy);
  if (radius <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 1.0; return; }
  gl_Position = projectView(viewMatrix * vec4(rel, 1.0));
  #include <logdepthbuf_vertex>
${ku}
${Du}
  gl_PointSize = 2.0 * radius * uDpr;
  vRadius = radius; vEnergy = energy; vColor = vec3(0.75, 0.95, 1.0);
}`,Qm=`
#include <common>
#include <logdepthbuf_pars_fragment>
${Yd}
varying vec3 vColor; varying float vEnergy; varying float vRadius;
${Zd}
void main() {
  gl_FragColor = vec4(psfShade(gl_PointCoord, vRadius, vEnergy, vColor), 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,$m=class{key;name;row;kind=`comet`;upos=new Af;radius;parentObject=null;apparentMag=99;constructor(e,t,n){this.key=e,this.name=t,this.row=n,this.radius=n[10]?n[10]*1e3/2:0}info(){let[,e,t,n,r]=this.row,i=[[`Type`,{P:`Periodic comet`,C:`Non-periodic comet`,D:`Defunct comet`,I:`Interstellar object`,X:`Comet (uncertain orbit)`,A:`Comet-like asteroid`}[e]??`Comet`]];return i.push([`Perihelion distance`,`${n.toFixed(4)} AU`],[`Eccentricity`,t.toFixed(6)],[`Inclination`,`${r.toFixed(3)}°`]),t<1&&i.push([`Period`,`${((n/(1-t))**1.5).toFixed(2)} yr`]),this.row[10]?i.push([`Nucleus diameter`,`${this.row[10]} km (shape generated)`]):i.push([`Nucleus`,`size unknown: drawn 4 km across, shape generated`]),this.apparentMag<90&&i.push([`Total magnitude (est.)`,this.apparentMag.toFixed(1)]),i}},eh=class{system;psf;group=new sn;asteroids=null;comets=null;cometObjects=[];boost=3e5;refEpoch=0;worker=null;busy=!1;cometPos=null;cometMag=null;eclToEqu=new W().set(1,0,0,0,Math.cos(tp),-Math.sin(tp),0,Math.sin(tp),Math.cos(tp));constructor(e,t){this.system=e,this.psf=t,this.group.name=`small-bodies`}async load(e){let[t,n,r]=await Promise.all([fetch(`${e}/solar/asteroids.json`).then(e=>e.json()),fetch(`${e}/solar/asteroids.bin`).then(e=>e.arrayBuffer()),fetch(`${e}/solar/comets.json`).then(e=>e.json())]);this.refEpoch=t.refEpochJd;let i=new hr(new Float32Array(n),8),a=new mr;a.setAttribute(`aOrb0`,new _r(i,4,0)),a.setAttribute(`aOrb1`,new _r(i,4,4)),a.setAttribute(`position`,new _r(i,3,0));let o=new J({vertexShader:Xm,fragmentShader:Qm,uniforms:{...this.psf,uHalo:{value:.2},uDt:{value:0},uSunRel:{value:new U},uEclToEqu:{value:this.eclToEqu},uBoost:{value:this.boost}},transparent:!0,depthWrite:!1,blending:2});this.asteroids=new Li(a,o),this.asteroids.frustumCulled=!1,this.asteroids.renderOrder=9,this.asteroids.name=`asteroids`,this.group.add(this.asteroids);let s=r.comets;s.forEach(e=>this.cometObjects.push(new $m(`comet:${e[11]}`,e[0],e)));let c=new mr;c.setAttribute(`position`,new K(new Float32Array(s.length*3),3).setUsage(Ue)),c.setAttribute(`aMag`,new K(new Float32Array(s.length).fill(99),1).setUsage(Ue));let l=new J({vertexShader:Zm,fragmentShader:Qm,uniforms:{...this.psf,uHalo:{value:.2},uSunRel:{value:new U},uBoost:{value:1}},transparent:!0,depthWrite:!1,blending:2});this.comets=new Li(c,l),this.comets.frustumCulled=!1,this.comets.renderOrder=9,this.comets.name=`comets`,this.group.add(this.comets),this.worker=new Worker(new URL(new URL(`comets.worker-Cwf2KION.js`,import.meta.url).href,``+import.meta.url),{type:`module`}),this.worker.postMessage({type:`init`,comets:s}),this.worker.onmessage=e=>{if(e.data.type!==`result`)return;this.busy=!1,this.cometPos=e.data.pos,this.cometMag=e.data.mag;let t=this.comets.geometry;t.attributes.position.copyArray(this.cometPos),t.attributes.aMag.copyArray(this.cometMag),t.attributes.position.needsUpdate=!0,t.attributes.aMag.needsUpdate=!0,this.syncCometObjects()}}syncCometObjects(){let e=this.system.sun,t=this.cometPos,n=this.cometMag;for(let r=0;r<this.cometObjects.length;r++){let i=this.cometObjects[r];i.upos.copy(e.upos).addXYZ(t[r*3]*Pl,t[r*3+1]*Pl,t[r*3+2]*Pl),i.apparentMag=n[r]}}update(e,t){let n=this.system.sun.upos.sub(e,new U);if(this.asteroids){let e=this.asteroids.material.uniforms;e.uDt.value=t-this.refEpoch,e.uSunRel.value.copy(n),e.uBoost.value=this.boost}if(this.comets&&this.comets.material.uniforms.uSunRel.value.copy(n),this.worker&&!this.busy){this.busy=!0;let e=n.clone().negate();this.worker.postMessage({type:`compute`,jd:t,observer:[e.x,e.y,e.z]})}}},th=`
uniform vec4 uDst;   // destination rect in the atlas (0..1): x, y, w, h
uniform vec4 uSrc;   // source rect in the source texture's UV: u0, v0, du, dv (u may wrap)
varying vec2 vSrc;
void main() {
  vec2 p = position.xy * 0.5 + 0.5;
  vSrc = uSrc.xy + p * uSrc.zw;
  gl_Position = vec4((uDst.xy + p * uDst.zw) * 2.0 - 1.0, 0.0, 1.0);
}`,nh=`
uniform sampler2D uTex;
varying vec2 vSrc;
void main() { gl_FragColor = vec4(texture2D(uTex, vec2(fract(vSrc.x), vSrc.y)).rgb, 1.0); }`,rh=class{base;index=null;rt;n;scene=new gn;cam=new Ga(-1,1,1,-1,0,1);mat;cache=new Map;pending=new Set;maxCache;win=null;drawn=new Map;dirty=!1;binding;activeKey=null;constructor(e,t=!1){this.base=e,this.n=t?4:8,this.maxCache=t?48:160,this.rt=this.makeTarget(),this.mat=new J({vertexShader:th,fragmentShader:nh,uniforms:{uTex:{value:null},uDst:{value:new Ot},uSrc:{value:new Ot}},depthTest:!1,depthWrite:!1,blending:0});let n=new q(new Xi(2,2),this.mat);n.frustumCulled=!1,this.scene.add(n),this.binding={texture:this.rt.texture,rect:new Ot(0,0,1,1),mapWidth:0},fetch(`${e}/tiles.json`).then(e=>e.ok?e.json():null).then(e=>{this.index=e}).catch(()=>void 0)}makeTarget(){let e=this.n*512,t=new At(e,e,{depthBuffer:!1,generateMipmaps:!0,minFilter:c,magFilter:o});return t.texture.anisotropy=4,t}has(e){return!!this.index?.bodies[e]}update(e,t,n,r,i,a,o,s){let c=this.index?.bodies[t];if(!c||!n)return this.activeKey=null,!1;let l=i.length(),u=Math.max(l-r,r*1e-4),d=ih(i,a,r)??i.clone().normalize(),f=Math.acos(Math.max(-1,Math.min(1,d.clone().normalize().dot(i.clone().normalize())))),p=Math.max(u,d.clone().multiplyScalar(r/d.length()).distanceTo(i)),m=2*Math.PI*r/Math.max(p*o,1e-6),h=Math.ceil(Math.log2(m/1024));if(h<3||f>1.4)return this.activeKey=null,!1;h=Math.min(h,c.maxLevel);let g=2**(h+1),_=2**h,v=Math.min(this.n,_),y=Math.atan2(d.y,d.x)*(180/Math.PI),b=Math.asin(Math.max(-1,Math.min(1,d.z/d.length())))*(180/Math.PI),x=((y-s)%360+360)%360/360,S=(90-b)/180,C=Math.floor(x*g-v/2+.5),w=Math.max(0,Math.min(_-v,Math.floor(S*_-v/2+.5))),T=this.win;(!T||T.key!==t||T.level!==h||Math.abs(T.c0-C)>1||Math.abs(T.r0-w)>1)&&(this.win={key:t,level:h,c0:(C%g+g)%g,r0:w},this.drawn.clear(),this.fillFromGlobal(e,n));let E=this.win,D=!1;for(let n=0;n<v;n++)for(let r=0;r<v;r++){let i=E.r0+n,a=(E.c0+r)%g,o=`${h}/${i}_${a}`;if((this.drawn.get(o)??-1)>=h)continue;let s=this.tile(t,h,i,a);if(s){this.drawTile(e,s,n,r,v,null),this.drawn.set(o,h),D=!0;continue}for(let s=h-1;s>=3;s--){let c=h-s,l=i>>c,u=a>>c;if((this.drawn.get(o)??-1)>=s)break;let d=this.cache.get(`${t}/${s}/${l}_${u}`);if(!d)continue;let f=1/2**c;this.drawTile(e,d,n,r,v,new Ot((a-(u<<c))*f,1-(i-(l<<c)+1)*f,f,f)),this.drawn.set(o,s),D=!0;break}}return(D||this.dirty)&&this.finish(e),this.activeKey=t,this.binding.rect.set(E.c0/g,1-(E.r0+v)/_,v/g,v/_),this.binding.mapWidth=512*g,!0}fillFromGlobal(e,t){let n=this.win,r=2**(n.level+1),i=2**n.level,a=Math.min(this.n,i);this.mat.uniforms.uTex.value=t,this.mat.uniforms.uDst.value.set(0,0,a/this.n,a/this.n),this.mat.uniforms.uSrc.value.set(n.c0/r,1-(n.r0+a)/i,a/r,a/i),this.render(e,!1),this.dirty=!0}drawTile(e,t,n,r,i,a){this.mat.uniforms.uTex.value=t;let o=1/this.n;this.mat.uniforms.uDst.value.set(r*o,1-(n+1)*o,o,o),this.mat.uniforms.uSrc.value.copy(a??new Ot(0,0,1,1)),this.render(e,!1),this.dirty=!0}finish(e){this.mat.uniforms.uTex.value=null,this.mat.uniforms.uDst.value.set(0,0,0,0),this.render(e,!0),this.dirty=!1}render(e,t){let n=e.getRenderTarget(),r=e.xr.enabled,i=e.autoClear;e.xr.enabled=!1,e.autoClear=!1,this.rt.texture.generateMipmaps=t,e.setRenderTarget(this.rt),e.render(this.scene,this.cam),e.setRenderTarget(n),e.autoClear=i,e.xr.enabled=r}tile(e,t,n,r){let i=`${e}/${t}/${n}_${r}`,a=this.cache.get(i);return a?(this.cache.delete(i),this.cache.set(i,a),a):(!this.pending.has(i)&&this.pending.size<12&&(this.pending.add(i),fetch(`${this.base}/${e.replace(/_day$/,``)}/${t}/${n}_${r}.jpg`).then(e=>{if(!e.ok)throw Error(String(e.status));return e.blob()}).then(e=>createImageBitmap(e,{imageOrientation:`flipY`})).then(e=>{let t=new Dt(e);for(t.flipY=!1,t.minFilter=o,t.generateMipmaps=!1,t.needsUpdate=!0,this.cache.set(i,t);this.cache.size>this.maxCache;){let[e,t]=this.cache.entries().next().value;t.dispose(),t.image.close?.(),this.cache.delete(e)}}).catch(()=>void 0).finally(()=>this.pending.delete(i))),null)}dispose(){this.rt.dispose();for(let e of this.cache.values())e.dispose();this.cache.clear()}};function ih(e,t,n){let r=e.dot(t),i=e.lengthSq()-n*n,a=r*r-i;if(a<0)return null;let o=-r-Math.sqrt(a);return o<0?null:e.clone().addScaledVector(t,o)}var ah=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
varying vec3 vN;
varying vec3 vPos;
void main() {
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${ku}
}`,oh=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uSpec;       // 0 matte .. 1 mirror-like foil
uniform vec3 uSunDir;
uniform float uSunIrr;
uniform float uExposure;
uniform vec3 uEarthDir;
uniform float uEarthshine;
varying vec3 vN;
varying vec3 vPos;
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(-vPos);
  if (dot(n, V) < 0.0) n = -n;      // thin panels: light both faces
  float mu0 = max(dot(n, uSunDir), 0.0);
  vec3 H = normalize(uSunDir + V);
  float spec = uSpec * pow(max(dot(n, H), 0.0), mix(8.0, 90.0, uSpec)) * 2.5;
  float earth = uEarthshine * max(dot(n, uEarthDir), 0.0);
  // a little fill light (as a photographer would add) keeps shaded parts readable
  vec3 rad = (uColor * (mu0 + 0.1 + earth) + spec * mix(vec3(1.0), uColor, 0.6) * step(0.0, dot(vN, uSunDir) + 0.3)) * (uSunIrr / 3.14159265);
  gl_FragColor = vec4(min(rad * uExposure, vec3(6.0e4)), 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,sh={gold:[.85,.6,.18,.55],white:[.82,.82,.8,.15],silver:[.62,.64,.67,.7],panel:[.06,.09,.2,.6],dark:[.1,.1,.11,.2],shield:[.72,.62,.78,.45],mirror:[1,.72,.28,.95],rtg:[.3,.3,.32,.3]},ch=(e,t,n)=>new Wi(e,t,n),lh=(e,t,n=16,r=e)=>new Ki(r,e,t,n),uh=e=>new Qi(e*.75,24,6,0,Math.PI*2,Math.PI-.73,.73).translate(0,e*.75*.75,0),dh=(e,t=.03)=>lh(t,e,6);function fh(e){switch(e){case`voyager`:return[{g:lh(.9,.47,10),f:`dark`},{g:uh(3.66),f:`white`,p:[0,.3,0]},{g:dh(13),f:`silver`,r:[0,0,Math.PI/2],p:[-6.5,-.2,0]},{g:dh(2.3,.05),f:`silver`,r:[0,0,Math.PI/2],p:[1.6,-.2,.3]},...[0,1,2].map(e=>({g:lh(.2,.5,8),f:`rtg`,r:[0,0,Math.PI/2],p:[2+e*.55,-.2,.3]})),{g:dh(2.5,.05),f:`silver`,r:[Math.PI/2,0,0],p:[0,-.2,-1.6]},{g:ch(.5,.5,.7),f:`gold`,p:[0,-.2,-2.9]}];case`newhorizons`:return[{g:lh(1.2,.7,3),f:`gold`},{g:uh(2.1),f:`white`,p:[0,.35,0]},{g:lh(.2,1.1,10),f:`rtg`,r:[0,0,Math.PI/2],p:[1.4,0,0]}];case`parker`:return[{g:lh(1.15,.115,32),f:`white`,p:[0,.6,0]},{g:lh(.55,1,6),f:`gold`,p:[0,-.2,0]},{g:ch(1.6,.04,.5),f:`panel`,p:[1.1,-.1,0]},{g:ch(1.6,.04,.5),f:`panel`,p:[-1.1,-.1,0]},{g:dh(1.2,.04),f:`silver`,p:[0,.1,.4]},{g:dh(1.2,.04),f:`silver`,p:[0,.1,-.4]}];case`lucy`:return[{g:ch(1.8,1.8,2.2),f:`gold`},{g:uh(2),f:`white`,p:[0,0,1.3],r:[Math.PI/2,0,0]},{g:lh(3.65,.06,32),f:`panel`,p:[5.3,0,0]},{g:lh(3.65,.06,32),f:`panel`,p:[-5.3,0,0]},{g:dh(1.6,.05),f:`silver`,r:[0,0,Math.PI/2],p:[1.6,0,0]},{g:dh(1.6,.05),f:`silver`,r:[0,0,Math.PI/2],p:[-1.6,0,0]}];case`jwst`:{let e=[];for(let t=0;t<5;t++){let n=t*.12,r=new Float32Array([-10.6,n,0,0,n,7.1,10.6,n,0,-10.6,n,0,10.6,n,0,0,n,-7.1]),i=new mr;i.setAttribute(`position`,new K(r,3)),i.computeVertexNormals(),e.push({g:i,f:t===0?`silver`:`shield`})}e.push({g:ch(2,1.2,2),f:`dark`,p:[0,-.8,0]});let t=lh(.75,.06,6),n=[];for(let e=-2;e<=2;e++)for(let t=-2;t<=2;t++){let r=-e-t,i=Math.max(Math.abs(e),Math.abs(t),Math.abs(r));i===0||i>2||n.push([1.32*(e+t/2),1.32*.866*t])}for(let[r,i]of n)e.push({g:t,f:`mirror`,r:[Math.PI/2,0,Math.PI/6],p:[r,3.8+i,1.2]});e.push({g:ch(6.6,6,.3),f:`dark`,p:[0,3.8,.95]});for(let t of[0,2.09,4.19])e.push({g:dh(7.2,.04),f:`silver`,r:[Math.PI/2-.15,0,0],p:[Math.cos(t)*2.2,3.8+Math.sin(t)*2.2,4.6]});return e.push({g:lh(.37,.1,6),f:`mirror`,r:[Math.PI/2,0,0],p:[0,3.8,8.1]}),e}case`iss`:{let e=[{g:ch(1.6,109,1.6),f:`white`}];for(let t of[-48,-36,36,48])for(let n of[-17.5,17.5])e.push({g:ch(33,11.6,.08),f:`gold`,p:[n,t,0]});for(let t of[-22,22])e.push({g:ch(13,.05,3.2),f:`white`,p:[0,t,-4]});return e.push({g:lh(2.1,50,16),f:`white`,r:[0,0,Math.PI/2],p:[0,0,4.5]}),e.push({g:lh(2.1,9,16),f:`white`,r:[Math.PI/2,0,0],p:[-8,0,4.5]}),e.push({g:lh(2.1,9,16),f:`white`,r:[Math.PI/2,0,0],p:[12,0,4.5]}),e.push({g:ch(9,.05,2.5),f:`panel`,p:[-24,0,6]}),e}case`hubble`:return[{g:lh(2.1,13.2,24),f:`silver`,r:[Math.PI/2,0,0]},{g:lh(2.12,.8,24),f:`dark`,r:[Math.PI/2,0,0],p:[0,0,6.3]},{g:ch(7.1,.04,2.6),f:`panel`,p:[6,0,-1]},{g:ch(7.1,.04,2.6),f:`panel`,p:[-6,0,-1]},{g:dh(2.2,.08),f:`silver`,r:[0,0,Math.PI/2],p:[2.6,0,-1]},{g:dh(2.2,.08),f:`silver`,r:[0,0,Math.PI/2],p:[-2.6,0,-1]}];default:return[{g:lh(.9,3,12),f:`gold`},{g:uh(3),f:`white`,p:[0,1.6,0]},{g:ch(12.5,.06,4.1),f:`panel`,p:[7.6,0,0]},{g:ch(12.5,.06,4.1),f:`panel`,p:[-7.6,0,0]},{g:dh(1.5,.06),f:`silver`,r:[0,0,Math.PI/2],p:[1.3,0,0]},{g:dh(1.5,.06),f:`silver`,r:[0,0,Math.PI/2],p:[-1.3,0,0]},{g:dh(8,.03),f:`silver`,r:[Math.PI/2,0,0],p:[0,-1.2,4]}]}}var ph=class{craft;exposure;group=new sn;views=[];models=new Map;uniforms={uSunDir:{value:new U(1,0,0)},uSunIrr:{value:Math.PI},uEarthDir:{value:new U(0,1,0)},uEarthshine:{value:0}};mats=new Map;sprites;sp={pos:new Float32Array(96),irr:new Float32Array(32),col:new Float32Array(96)};constructor(e,t,n){this.craft=e,this.exposure=t,this.group.name=`spacecraft`;let r=new mr;r.setAttribute(`position`,new K(this.sp.pos,3).setUsage(Ue)),r.setAttribute(`aIrr`,new K(this.sp.irr,1).setUsage(Ue)),r.setAttribute(`aColor`,new K(this.sp.col,3).setUsage(Ue)),this.sprites=new Li(r,new J({name:`spacecraft-sprites`,vertexShader:Xf,fragmentShader:Zf,uniforms:{...n,uHalo:{value:.4}},transparent:!0,depthWrite:!1,blending:2})),this.sprites.frustumCulled=!1,this.sprites.renderOrder=10,this.group.add(this.sprites)}mat(e){let t=this.mats.get(e);if(!t){let[n,r,i,a]=sh[e];t=new J({name:`spacecraft`,vertexShader:ah,fragmentShader:oh,side:2,uniforms:{uColor:{value:new U(n,r,i)},uSpec:{value:a},uExposure:this.exposure,...this.uniforms,uPullIn:Q.uPullIn,uDepthK:Q.uDepthK}}),this.mats.set(e,t)}return t}model(e){let t=this.models.get(e);if(t)return t;t=new sn,t.name=e.name;for(let n of fh(e.model)){let e=new q(n.g,this.mat(n.f));n.r&&e.rotation.set(...n.r),n.p&&e.position.set(...n.p),e.frustumCulled=!1,t.add(e)}return t.matrixAutoUpdate=!1,this.group.add(t),this.models.set(e,t),t}warmupObjects(){let e=this.craft[0];return e?[this.model(e)]:[]}update(e,t,n,r,i){this.views=[];let a=0,o=new U,s=new U,c=new U;for(let n of this.craft){let l=this.models.get(n);if(!n.valid){l&&(l.visible=!1);continue}n.upos.sub(e,o);let u=o.length(),d=Math.atan2(n.radius,u)/t;this.views.push({craft:n,rel:o.clone(),dist:u,pixelRadius:d}),r.upos.sub(n.upos,s);let f=s.length();s.divideScalar(f);let p=Math.PI*(Pl/f)**2;if(d>.6){let e=this.model(n);e.visible=!0,i.upos.sub(n.upos,c);let t=c.length();c.divideScalar(t),e.matrix.compose(o,this.attitude(n,s,c),new U(1,1,1)),e.matrixWorldNeedsUpdate=!0,this.uniforms.uSunDir.value.copy(s),this.uniforms.uSunIrr.value=p,this.uniforms.uEarthDir.value.copy(c),this.uniforms.uEarthshine.value=t<5e7?.3*Math.max(0,.5+.5*c.dot(s)*-1)*Math.min(1,(i.radius/t)**2*4):0}else if(l&&(l.visible=!1),a<32){let e=.3*(2*n.radius)**2,t=.5*(1+s.dot(o.clone().negate().normalize()));this.sp.pos.set([o.x,o.y,o.z],a*3),this.sp.irr[a]=.5*e*p*t/(Math.PI*u*u),this.sp.col.set([1,.97,.92],a*3),a++}}this.sprites.geometry.setDrawRange(0,a);for(let e of[`position`,`aIrr`,`aColor`])this.sprites.geometry.attributes[e].needsUpdate=!0}attitude(e,t,n){let r=new H,i=new U(0,1,0);switch(e.model){case`voyager`:case`newhorizons`:return r.setFromUnitVectors(i,n);case`jwst`:return r.setFromUnitVectors(new U(0,-1,0),t);case`iss`:{let t=e.vel.clone().normalize(),r=n.clone().cross(t).normalize();return mh(t,r,t.clone().cross(r))}case`hubble`:return mh(new U(1,0,0),t.clone().cross(new U(1,0,0)).normalize(),t.clone().negate());default:return r.setFromUnitVectors(i,t)}}};function mh(e,t,n){return new H().setFromRotationMatrix(new G().makeBasis(e,t,n))}var hh=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
uniform float uClipScale;
varying vec2 vP;
void main() {
  vP = position.xy;
  gl_Position = projectView(modelViewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${ku}
  // one factor for the whole quad: keeps clip coordinates of objects megaparsecs away far from
  // float overflow in clipping, without changing the projection or perspective interpolation
  gl_Position *= uClipScale;
}`,gh=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uGain;
uniform float uSeed;
uniform float uArms;      // number of arms (0 = none)
uniform float uPitch;     // arm pitch angle (rad)
uniform float uBar;       // bar strength
uniform float uBulge;     // bulge-to-disk weight
uniform float uClumpy;    // irregular: patchy star-forming regions instead of arms
uniform float uDust;
uniform float uLite;
varying vec2 vP;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; int n = uLite > 0.5 ? 3 : 5; for (int i = 0; i < 5; i++) { if (i >= n) break; s += a * n2(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
void main() {
  vec2 p = vP * 1.3;                       // quad spans 1.3 radii
  float r = length(p);
  if (r > 1.3) discard;
  float th = atan(p.y, p.x);
  float disk = exp(-r / 0.24);
  float warp = fbm(p * 2.5 + uSeed * 9.0) - 0.5;
  // logarithmic spiral arms, broken up into star clouds; weaker secondary arms in between
  float arms = 0.0, phase = 0.0;
  if (uArms > 0.5) {
    phase = th - log(max(r, 0.02)) / tan(uPitch) + uSeed * 6.283 + warp * 1.8;
    float a = 0.5 + 0.5 * cos(uArms * phase);
    float a2 = 0.5 + 0.5 * cos(2.0 * uArms * phase + 1.3);
    float clouds = 0.35 + 0.9 * fbm(p * 7.0 + uSeed * 4.0);
    arms = (pow(a, 4.0) + 0.3 * pow(a2, 6.0)) * clouds * smoothstep(0.06, 0.22, r);
  }
  // irregulars: knots of star formation
  float knots = uClumpy * smoothstep(0.5, 0.85, fbm(p * 4.0 + uSeed * 13.0));
  float bar = uBar * exp(-pow(abs(p.x) / 0.3, 2.0) - pow(abs(p.y) / 0.07, 2.0));
  float bulge = uBulge * exp(-pow(r / 0.05, 0.55) * 2.0);
  float grain = 0.7 + 0.6 * fbm(p * 16.0 + uSeed * 5.0);
  vec3 old = vec3(1.0, 0.86, 0.68), young = vec3(0.6, 0.73, 1.0), hii = vec3(1.0, 0.42, 0.58);
  vec3 c = old * (disk * (0.4 + 0.3 * grain) + bar * 0.9) + vec3(1.0, 0.82, 0.58) * bulge * 1.8;
  c += young * disk * (arms * 1.7 + knots * 1.4) * grain;
  // bright knots: young clusters and nebulae along the arms
  float spots = smoothstep(0.78, 0.92, fbm(p * 22.0 + uSeed * 3.0));
  c += hii * disk * spots * (arms + knots) * 1.6;
  c += young * disk * smoothstep(0.9, 0.97, n2(p * 120.0 + uSeed * 31.0)) * (arms + 0.2) * 1.2;
  // dust lanes along the inner edges of the arms, patchy
  if (uArms > 0.5 && uDust > 0.0) {
    float lane = pow(0.5 + 0.5 * cos(uArms * (phase + 0.32)), 6.0) * smoothstep(0.08, 0.28, r);
    c *= 1.0 - uDust * 0.65 * lane * (0.5 + 0.8 * fbm(p * 9.0 + uSeed * 2.0));
  }
  c *= 1.0 - smoothstep(0.95, 1.3, r);
  gl_FragColor = vec4(c * uGain, 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,_h=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uGain;
uniform float uSersic;   // profile sharpness: 0.25 (de Vaucouleurs) .. 1 (exponential)
uniform vec3 uTint;
varying vec2 vP;
void main() {
  float r = length(vP);
  if (r > 1.0) discard;
  float I = exp(-7.0 * (pow(r / 0.35, uSersic) - 0.0)) ;
  I *= 1.0 - smoothstep(0.7, 1.0, r);
  gl_FragColor = vec4(uTint * I * uGain, 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`;function vh(e){let t=e.data.morph,n=/S[AB_()s]*[ab]?([abcdm])/.exec(t)?.[1]??(e.shape===`spiral`||e.shape===`barred`?`b`:``),r={a:9,b:14,c:20,d:25,m:28}[n]??14,i={a:1,b:.6,c:.3,d:.15,m:.1}[n]??.5,a={spiral:{arms:2,pitchDeg:r,bar:0,bulge:i,clumpy:.25,dust:.8,blob:.25+.2*i,sersic:.35},barred:{arms:2,pitchDeg:r,bar:.9,bulge:i,clumpy:.25,dust:.8,blob:.22+.2*i,sersic:.35},lenticular:{arms:0,pitchDeg:14,bar:0,bulge:1.2,clumpy:0,dust:0,blob:.45,sersic:.3},irregular:{arms:0,pitchDeg:14,bar:.25,bulge:.1,clumpy:1,dust:0,blob:0,sersic:1},elliptical:{arms:0,pitchDeg:0,bar:0,bulge:0,clumpy:0,dust:0,blob:1,sersic:.28},dwarf:{arms:0,pitchDeg:0,bar:0,bulge:0,clumpy:0,dust:0,blob:1,sersic:.9}}[e.shape];return/Sombrero/.test(e.name)?{...a,bulge:1.4,blob:.7,dust:1}:a}var yh=class{galaxies;group=new sn;views=[];discs=new Map;blobs=new Map;quad=new Xi(2,2);gain={value:0};constructor(e){this.galaxies=e,this.group.name=`galaxies`;for(let t of e){let e=vh(t),n={uGain:this.gain,uClipScale:{value:1},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK,uLite:Tu.uLite};if(e.arms>0||e.bar>0||e.clumpy>0||t.shape===`lenticular`){let r=new q(this.quad,new J({name:`galaxy-disc`,vertexShader:hh,fragmentShader:gh,side:2,uniforms:{...n,uClipScale:{value:1},uSeed:{value:t.seed},uArms:{value:e.arms},uPitch:{value:e.pitchDeg*Math.PI/180},uBar:{value:e.bar},uBulge:{value:e.bulge},uClumpy:{value:e.clumpy},uDust:{value:e.dust}},transparent:!0,depthWrite:!1,blending:2}));r.matrixAutoUpdate=!1,r.frustumCulled=!1,r.renderOrder=-1,r.name=t.name,this.group.add(r),this.discs.set(t,r)}if(e.blob>0){let r=t.shape===`dwarf`?new U(.95,.9,.85):new U(1,.86,.68),i=new q(this.quad,new J({name:`galaxy-bulge`,vertexShader:hh,fragmentShader:_h,uniforms:{...n,uClipScale:{value:1},uSersic:{value:e.sersic},uTint:{value:r.multiplyScalar(t.shape===`dwarf`?.35:1.2)}},transparent:!0,depthWrite:!1,blending:2}));i.matrixAutoUpdate=!1,i.frustumCulled=!1,i.renderOrder=-1,i.userData.size=e.blob,this.group.add(i),this.blobs.set(t,i)}}}update(e,t,n,r,i){this.views=[],this.gain.value=.9*Math.max(n,0)**.55*r,this.group.visible=r>.001;let a=new U,o=new G,s=new U(1,0,0).applyQuaternion(i),c=new U(0,1,0).applyQuaternion(i);for(let n of this.galaxies){n.upos.sub(e,a);let i=a.length(),l=Math.atan2(n.radius,i)/t;r>.001&&this.views.push({galaxy:n,rel:a.clone(),dist:i,pixelRadius:l});let u=r>.001&&l>.7,d=1/Math.max(i,1),f=this.discs.get(n);if(f&&(f.visible=u,u)){let e=n.radius;o.makeBasis(n.major.clone().multiplyScalar(e),n.minor.clone().multiplyScalar(e),n.normal.clone().multiplyScalar(e)).setPosition(a),f.matrix.copy(o),f.matrixWorldNeedsUpdate=!0,f.material.uniforms.uClipScale.value=d}let p=this.blobs.get(n);if(p&&(p.visible=u,u)){let e=n.radius*p.userData.size,t=n.major.clone().sub(a.clone().normalize().multiplyScalar(n.major.dot(a.clone().normalize()))).normalize(),r=a.clone().normalize(),i=new U().crossVectors(r,t).normalize(),l=n.shape===`elliptical`||n.shape===`dwarf`?Math.max(n.ratio,.3):.75;Number.isFinite(t.x)||(t.copy(s),i.copy(c)),o.makeBasis(t.multiplyScalar(e),i.multiplyScalar(e*l),r.clone().multiplyScalar(e)).setPosition(a),p.matrix.copy(o),p.matrixWorldNeedsUpdate=!0,p.material.uniforms.uClipScale.value=d}}}},bh=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
uniform float uClipScale;
varying vec2 vP;
void main() {
  vP = position.xy;
  // camera-facing quad around the object's centre, sized by the model's scale
  vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float s = length(vec3(modelMatrix[0]));
  c.xy += position.xy * s;
  gl_Position = projectView(c);
  #include <logdepthbuf_vertex>
${ku}
  gl_Position *= uClipScale;
}`,xh=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uType;    // 0 emission cloud, 1 planetary shell, 2 supernova filaments, 3 cluster glow
uniform float uSeed;
uniform float uGain;
uniform float uLite;
uniform float uFilled;  // supernova remnant filled with filaments (Crab-like pulsar wind nebula) instead of a shell
varying vec2 vP;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; int n = uLite > 0.5 ? 3 : 6; for (int i = 0; i < 6; i++) { if (i >= n) break; s += a * n2(p); p = p * 2.07 + 5.3; a *= 0.5; } return s; }
void main() {
  vec2 p = vP;
  float r = length(p);
  if (r > 1.0) discard;
  vec2 q = p * 2.2 + uSeed * 17.0;
  vec3 c = vec3(0.0);
  if (uType < 0.5) {
    // emission nebula: glowing hydrogen (red) with oxygen (teal) near the hot stars, dark dust lanes
    vec2 w = vec2(fbm(q + 3.1), fbm(q + 8.7)) - 0.5;
    float cloud = fbm(q + w * 2.2);
    float dens = smoothstep(0.35, 0.8, cloud) * (1.0 - smoothstep(0.45, 1.0, r));
    float core = exp(-r * r * 6.0) * smoothstep(0.3, 0.7, fbm(q * 1.7 + 1.0));
    float dust = smoothstep(0.55, 0.7, fbm(q * 2.3 + 9.0)) * smoothstep(1.0, 0.3, r);
    c = vec3(1.0, 0.22, 0.32) * dens * 1.3 + vec3(0.35, 0.95, 0.85) * core * 0.9 + vec3(0.6, 0.65, 1.0) * dens * core * 0.6;
    c *= 1.0 - 0.85 * dust;
  } else if (uType < 1.5) {
    // planetary nebula: a bright shell, teal inside, red at the rim
    float a = atan(p.y, p.x);
    float wob = 0.06 * (fbm(vec2(a * 2.0, uSeed * 9.0)) - 0.5);
    float shell = exp(-pow((r - 0.55 - wob) / 0.14, 2.0));
    float inner = exp(-pow(r / 0.42, 2.0)) * 0.7;
    float rim = exp(-pow((r - 0.75 - wob) / 0.12, 2.0));
    float grain = 0.75 + 0.5 * fbm(p * 9.0 + uSeed * 4.0);
    c = (vec3(0.3, 0.95, 0.9) * (inner + shell * 0.6) + vec3(1.0, 0.3, 0.35) * rim * 1.2) * grain;
    c += vec3(1.0) * exp(-r * r * 900.0) * 2.0; // the white dwarf
  } else if (uType < 2.5) {
    // supernova remnant: tangled filaments in an expanding shell
    float fil = 1.0 - abs(fbm(q * 1.6) * 2.0 - 1.0);
    fil = pow(fil, 6.0);
    float shell = mix(smoothstep(0.4, 0.85, r), 1.0, uFilled) * (1.0 - smoothstep(0.9, 1.0, r));
    c = mix(vec3(0.4, 0.75, 1.0), vec3(1.0, 0.35, 0.3), smoothstep(0.4, 0.7, fbm(q * 0.8 + 2.0))) * fil * shell * 2.0;
    c += vec3(0.55, 0.65, 1.0) * exp(-r * r * 5.0) * 0.6 * uFilled; // synchrotron glow around the pulsar
  } else {
    // an unresolved globular cluster: a soft yellowish ball of light
    c = vec3(1.0, 0.9, 0.72) * exp(-pow(r / 0.22, 1.1) * 2.3) * (1.0 - smoothstep(0.7, 1.0, r));
  }
  gl_FragColor = vec4(c * uGain, 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`;function Sh(e){let t=Math.floor(e*4294967296)>>>0||1;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function Ch(e,t){let n=Sh(e.seed+.123),r=e.radius/0x6da012f95c9e88,i=r*.07,a=new Float32Array(t*3),o=new Float32Array(t);for(let e=0;e<t;e++){let t=i/Math.sqrt(Math.max(n(),1e-6)**(-2/3)-1);(!Number.isFinite(t)||t>r)&&(t=r*n());let s=2*n()-1,c=2*Math.PI*n(),l=Math.sqrt(1-s*s);a.set([t*l*Math.cos(c),t*l*Math.sin(c),t*s],e*3);let u=n(),d,f;u<.5?(d=3.8+3*n(),f=6e3-1400*(d-3.8)/3):u<.72?(d=2.6+1.2*n(),f=5300+300*n()):u<.93?(d=2.5-5*n()**2.2,f=5e3-1100*(2.5-d)/5):u<.985?(d=.4+.5*n(),f=n()<.5?9e3+3e3*n():5200+600*n()):(d=1.6+1.4*n(),f=7e3+1500*n());let p=Math.max(0,Math.min(255,Math.round((d- -12)/.125)));o[e]=p+256*Math.round(uu(f)*255)}return{pos:a,mt:o}}var wh=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
uniform float uClipScale;
varying vec3 vPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${ku}
  gl_Position *= uClipScale;
}`,Th=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uCenter;   // camera-relative (m)
uniform float uRadius;  // m
uniform float uType;    // 0 emission, 1 planetary shell, 2 supernova remnant
uniform float uSeed;
uniform float uGain;
uniform float uFade;
uniform float uLite;
uniform float uFilled;
varying vec3 vPos;
float h31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float n3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p) { float s = 0.0, a = 0.5; int n = uLite > 0.5 ? 3 : 4; for (int i = 0; i < 4; i++) { if (i >= n) break; s += a * n3(p); p = p * 2.07 + 5.3; a *= 0.5; } return s / (1.0 - pow(0.5, float(n))); }
void main() {
  vec3 dir = normalize(vPos);
  // the ray from the eye through the nebula's sphere (unit radius around its centre)
  vec3 oc = -uCenter / uRadius;
  float b = dot(oc, dir);
  float c = dot(oc, oc) - 1.0;
  float disc = b * b - c;
  if (disc <= 0.0) discard;
  float sq = sqrt(disc);
  float t0 = max(-b - sq, 0.0), t1 = -b + sq;
  if (t1 <= t0) discard;
  int N = uLite > 0.5 ? 12 : 22;
  float dt = (t1 - t0) / float(N);
  vec3 col = vec3(0.0);
  float T = 1.0;
  vec3 sd = vec3(uSeed * 17.0, uSeed * 29.0, uSeed * 7.0);
  for (int i = 0; i < 22; i++) {
    if (i >= N) break;
    vec3 p = oc + dir * (t0 + (float(i) + 0.5) * dt);
    float r = length(p);
    vec3 e = vec3(0.0);
    float dust = 0.0;
    if (uType < 0.5) {
      vec3 q = p * 2.2 + sd;
      float cloud = fbm3(q + 0.8 * vec3(fbm3(q + 3.1), fbm3(q + 8.7), 0.0) - 0.4);
      float dens = smoothstep(0.42, 0.85, cloud) * (1.0 - smoothstep(0.45, 1.0, r));
      float core = exp(-r * r * 6.0) * smoothstep(0.3, 0.7, fbm3(q * 1.7 + 1.0));
      e = vec3(1.0, 0.22, 0.32) * dens * 1.3 + vec3(0.35, 0.95, 0.85) * core * 0.9;
      dust = smoothstep(0.55, 0.72, fbm3(q * 2.3 + 9.0)) * (1.0 - smoothstep(0.3, 1.0, r)) * 3.0;
    } else if (uType < 1.5) {
      float wob = 0.06 * (fbm3(p * 3.0 + sd) - 0.5);
      float shell = exp(-pow((r - 0.55 - wob) / 0.12, 2.0));
      float rim = exp(-pow((r - 0.75 - wob) / 0.1, 2.0));
      e = (vec3(0.3, 0.95, 0.9) * (exp(-pow(r / 0.42, 2.0)) * 0.5 + shell * 0.7) + vec3(1.0, 0.3, 0.35) * rim * 1.2) * (0.75 + 0.5 * fbm3(p * 8.0 + sd));
    } else {
      float fil = pow(1.0 - abs(fbm3(p * 2.0 + sd) * 2.0 - 1.0), 6.0);
      float shell = mix(smoothstep(0.45, 0.85, r), 1.0, uFilled) * (1.0 - smoothstep(0.9, 1.0, r));
      e = mix(vec3(0.4, 0.75, 1.0), vec3(1.0, 0.35, 0.3), smoothstep(0.4, 0.7, fbm3(p + sd + 2.0))) * fil * shell * 2.0;
    }
    col += T * e * dt;
    T *= exp(-dust * dt);
  }
  // a chord through the middle (length 2) gives about the billboards' brightness
  gl_FragColor = vec4(col * 0.7 * uGain * uFade, 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,Eh=class{objects;group=new sn;views=[];quads=new Map;stars=new Map;quad=new Xi(2,2);gain={value:.6};volume;constructor(e,t,n,r=!1){this.objects=e,this.group.name=`deep-sky`,this.volume=new q(new Qi(1,32,16),new J({name:`nebula-volume`,vertexShader:wh,fragmentShader:Th,uniforms:{uCenter:{value:new U},uRadius:{value:1},uType:{value:0},uSeed:{value:0},uGain:this.gain,uFade:{value:0},uLite:Tu.uLite,uFilled:{value:0},uClipScale:{value:1},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK},transparent:!0,depthWrite:!1,blending:2,side:1})),this.volume.matrixAutoUpdate=!1,this.volume.frustumCulled=!1,this.volume.visible=!1,this.volume.renderOrder=-1,this.group.add(this.volume);for(let i of e){let e=i.data.kind;if(e===`open`)continue;let a=[],o=(e,t,n,r)=>{let o=new q(this.quad,new J({name:`nebula`,vertexShader:bh,fragmentShader:xh,uniforms:{uType:{value:e},uSeed:{value:r},uGain:e===3?{value:0}:this.gain,uClipScale:{value:1},uLite:Tu.uLite,uFilled:{value:+!!/Crab/.test(i.name)},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK},transparent:!0,depthWrite:!1,blending:2}));o.matrixAutoUpdate=!1,o.frustumCulled=!1,o.renderOrder=-1,o.userData={size:t,offset:n},this.group.add(o),a.push(o)},s=Sh(i.seed);if(e===`emission`)for(let e=0;e<5;e++)o(0,.55+.5*s(),new U(s()-.5,s()-.5,s()-.5).multiplyScalar(.7),s());else if(e===`planetary`)o(1,1,new U,i.seed);else if(e===`snr`)o(2,1,new U,i.seed),o(2,.9,new U(0,0,.1),(i.seed+.37)%1);else if(e===`globular`){o(3,.8,new U,i.seed);let{pos:e,mt:a}=Ch(i,r?8e3:24e3),s=new mr;s.setAttribute(`aPos`,new K(e,3)),s.setAttribute(`aMT`,new K(a,1)),s.setAttribute(`position`,new K(e,3));let c=new Li(s,new J({name:`cluster-stars`,vertexShader:Fm,fragmentShader:Im,uniforms:{...t,uOffset:{value:new U},uScale:{value:1},uAbsMin:{value:-12},uAbsStep:{value:.125},uHideRadius:{value:0},uExtinction:{value:0},uColorLut:{value:n}},transparent:!0,depthWrite:!1,depthTest:!0,blending:2}));c.frustumCulled=!1,c.matrixAutoUpdate=!1,this.group.add(c),this.stars.set(i,c)}this.quads.set(i,a)}}warmupObjects(){return[this.volume]}update(e,t,n,r){this.views=[],this.gain.value=.55*Math.max(r,0)**.55;let i=new U,a=null,o=1/0;for(let t of this.objects){if(t.data.kind===`open`||t.data.kind===`globular`)continue;let n=t.upos.sub(e,i).length()/t.radius;n<o&&(o=n,a=t)}let s=a?Math.min(1,Math.max(0,(3.2-o)/1.4)):0;if(this.volume.visible=s>.01,a&&this.volume.visible){a.upos.sub(e,i);let t=this.volume.material.uniforms;t.uCenter.value.copy(i),t.uRadius.value=a.radius,t.uType.value=a.data.kind===`emission`?0:a.data.kind===`planetary`?1:2,t.uSeed.value=a.seed,t.uFilled.value=+!!/Crab/.test(a.name),t.uFade.value=s,t.uClipScale.value=1/Math.max(i.length(),a.radius),this.volume.matrix.makeScale(a.radius,a.radius,a.radius).setPosition(i),this.volume.matrixWorldNeedsUpdate=!0}for(let r of this.objects){r.upos.sub(e,i);let o=i.length(),c=Math.atan2(r.radius,o)/n;this.views.push({obj:r,rel:i.clone(),dist:o,pixelRadius:c});let l=this.quads.get(r);if(l){let e=r.data.kind===`globular`?Math.min(1,Math.max(0,(o/r.radius-1.5)/6)):1;for(let t of l){let{size:n,offset:o}=t.userData,l=r===a?1-s:1;if(t.visible=c>.8&&e>.01&&l>.01,!t.visible)continue;let u=i.clone().addScaledVector(o,r.radius),d=r.radius*n;t.matrix.makeScale(d,d,d).setPosition(u),t.matrixWorldNeedsUpdate=!0;let f=t.material.uniforms;f.uClipScale.value=1/Math.max(u.length(),1),r.data.kind===`globular`?f.uGain.value=this.gain.value*e*1.4:r===a&&l<1?(f.uGain===this.gain&&(f.uGain={value:0}),f.uGain.value=this.gain.value*l):f.uGain!==this.gain&&(f.uGain=this.gain)}}let u=this.stars.get(r);u&&(u.material.uniforms.uOffset.value.copy(r.posPc).sub(t),u.visible=o<r.radius*400)}}},Dh={emission:`Emission nebula (star-forming region)`,planetary:`Planetary nebula (the shed shell of a dying star)`,snr:`Supernova remnant`,open:`Open star cluster`,globular:`Globular star cluster`},Oh=class{data;kind;key;upos;radius;parentObject=null;posPc;seed;constructor(e,t){this.data=e,this.kind=e.kind===`open`||e.kind===`globular`?`cluster`:`nebula`,this.key=`dso:${t}`,this.posPc=op(e.ra,e.dec).multiplyScalar(e.distPc),this.upos=Af.from(this.posPc.x*Z,this.posPc.y*Z,this.posPc.z*Z),this.radius=Math.tan(e.majArcmin/60*Math.PI/360)*e.distPc*Z;let n=0;for(let t of e.name)n=n*31+t.charCodeAt(0)>>>0;this.seed=n%1e3/1e3}get name(){return this.data.name}info(){let e=this.data,t=e.distPc*Z/Fl,n=[[`Type`,Dh[e.kind]],[`Distance from Sun`,t<1e5?`${Math.round(t).toLocaleString()} light years`:`${(t/1e3).toFixed(0)} thousand light years`],[`Size`,`about ${(2*this.radius/Fl).toFixed(+(this.radius/9460730472580800<5))} light years across`],[`Size seen from Earth`,`${e.majArcmin.toFixed(e.majArcmin<2?2:1)}′`]];return e.vmag!==null&&n.push([`Magnitude (V)`,e.vmag.toFixed(1)]),n.push([`Catalogue`,`${e.simbad} (SIMBAD)${e.notes.length?`; ${e.notes.join(`; `)}`:``}`]),e.kind===`open`?n.push([`Stars`,`the real stars from the star catalogues`]):e.kind===`globular`?n.push([`Stars`,`generated (King profile, old population); position and size from the catalogue`]):n.push([`Look`,`procedural, from the catalogued type and size`]),n}};async function kh(e){return(await fetch(`${e}/deepsky.json`).then(e=>e.json())).objects.map((e,t)=>new Oh(e,t))}function Ah(e,t){let n=e.trim();return/^dSph|^dE|^dS|^dG/.test(n)||/dSph/i.test(t)?`dwarf`:/^(c?E|E-)/.test(n)||/^E\d/.test(n)?`elliptical`:/^S0|^SA0|^SB0/.test(n)?`lenticular`:/^d?I|^Irr|^IB|^IA|^dIrr|^dI/.test(n)?`irregular`:/^SB|^SAB|^S_AB|^SA_B/.test(n)?`barred`:/^S/.test(n)||/^\d/.test(n)?`spiral`:`elliptical`}var jh=class{data;kind=`galaxy`;key;upos;radius;parentObject=null;shape;major=new U;minor=new U;normal=new U;ratio;seed;constructor(e,t){this.data=e,this.key=`gx:${t}`;let n=op(e.ra,e.dec);this.upos=Af.from(n.x*e.distPc*Z,n.y*e.distPc*Z,n.z*e.distPc*Z);let r=e.majArcmin/60*(Math.PI/180);this.radius=Math.tan(r/2)*e.distPc*Z,this.ratio=Math.min(1,Math.max(.08,e.minArcmin/e.majArcmin)),this.shape=Ah(e.morph,e.otype);let i=e.ra*Math.PI/180,a=e.dec*Math.PI/180,o=new U(-Math.sin(i),Math.cos(i),0),s=new U(-Math.sin(a)*Math.cos(i),-Math.sin(a)*Math.sin(i),Math.cos(a)),c=e.paDeg*Math.PI/180;this.major.copy(s).multiplyScalar(Math.cos(c)).addScaledVector(o,Math.sin(c)).normalize();let l=s.clone().multiplyScalar(-Math.sin(c)).addScaledVector(o,Math.cos(c)).normalize(),u=Math.sqrt(Math.max(0,(this.ratio**2-.12**2)/(1-.12**2))),d=Math.sqrt(1-u*u);this.normal.copy(n).multiplyScalar(u).addScaledVector(l,d).normalize(),this.minor.crossVectors(this.normal,this.major).normalize();let f=0;for(let t of e.name)f=f*31+t.charCodeAt(0)>>>0;this.seed=f%997/997}get name(){return this.data.name}viewDir(e){let t=this.normal.clone();e&&e.dot(t)<0&&t.negate();let n=this.minor.clone();e&&e.dot(n)<0&&n.negate();let r=35*Math.PI/180;return t.multiplyScalar(Math.cos(r)).addScaledVector(n,Math.sin(r)).normalize()}info(){let e=this.data,t=e.distPc*Z/Fl/1e6;return[[`Type`,`${{spiral:`Spiral galaxy`,barred:`Barred spiral galaxy`,lenticular:`Lenticular galaxy`,elliptical:`Elliptical galaxy`,irregular:`Irregular galaxy`,dwarf:`Dwarf galaxy`}[this.shape]}${e.morph?` (${e.morph})`:``}`],[`Distance from Sun`,t<1?`${Math.round(t*1e3).toLocaleString()} thousand light years`:`${t.toFixed(t<10?2:1)} million light years`],[`Size`,`about ${Math.round(2*this.radius/Fl).toLocaleString()} light years across`],[`Size seen from Earth`,`${e.majArcmin.toFixed(1)}′ × ${e.minArcmin.toFixed(1)}′`],...e.vmag===null?[]:[[`Magnitude (V)`,e.vmag.toFixed(1)]],[`Catalogue`,`${e.simbad}; distance: median of ${e.nDist} measurements (SIMBAD)`],[`Look`,`procedural, from the catalogued type, size and orientation`]]}};async function Mh(e){return(await fetch(`${e}/galaxies.json`).then(e=>e.json())).galaxies.map((e,t)=>new jh(e,t))}var Nh=.00108263,Ph=6378.137,Fh=Math.PI/180,Ih=class{data;model;sun;earth;kind=`spacecraft`;key;upos=new Af;vel=new U;radius;valid=!1;center=null;constructor(e,t,n,r){this.data=e,this.model=t,this.sun=n,this.earth=r,this.key=`sc:${e.id}`,this.radius=e.size/2}get name(){return this.data.name}get parentObject(){return this.center}get isOrbiter(){return!(`km`in this.data)}update(e){let t=this.data;if(`km`in t){let n=t.jd.length;if(e<t.jd[0]||e>t.jd[n-1]){this.valid=!1;return}let r=0,i=n-1;for(;i-r>1;){let n=r+i>>1;t.jd[n]<=e?r=n:i=n}let a=t.jd[r],o=t.jd[i]-a,s=(e-a)/o,c=(e,r)=>{let i=Math.max(0,e-1),a=Math.min(n-1,e+1);return(t.km[a][r]-t.km[i][r])/(t.jd[a]-t.jd[i])*o},l=s*s,u=l*s,d=2*u-3*l+1,f=u-2*l+s,p=-2*u+3*l,m=u-l,h=[0,0,0],g=[0,0,0];for(let e=0;e<3;e++){let n=c(r,e),a=c(i,e);h[e]=d*t.km[r][e]+f*n+p*t.km[i][e]+m*a,g[e]=((6*l-6*s)*t.km[r][e]+(3*l-4*s+1)*n+(-6*l+6*s)*t.km[i][e]+(3*l-2*s)*a)/(o*zl)}this.vel.set(g[0]*1e3,g[1]*1e3,g[2]*1e3),t.center===399?(this.center=this.earth,this.upos.copy(this.earth.upos).addVec(new U(h[0]*1e3,h[1]*1e3,h[2]*1e3))):(this.center=null,this.upos.set(h[0]*1e3,h[1]*1e3,h[2]*1e3)),this.valid=!0;return}let n=(e-t.jd)*zl,r=t.nDegS*Fh,i=t.a*(1-t.e*t.e),a=1.5*r*Nh*(Ph/i)**2,o=t.node*Fh-a*Math.cos(t.i*Fh)*n,s=t.w*Fh+.5*a*(5*Math.cos(t.i*Fh)**2-1)*n,c=t.M*Fh+r*n,l=c;for(let e=0;e<6;e++)l-=(l-t.e*Math.sin(l)-c)/(1-t.e*Math.cos(l));let u=t.a*(Math.cos(l)-t.e),d=t.a*Math.sqrt(1-t.e*t.e)*Math.sin(l),f=Math.hypot(u,d),p=-Math.sin(l)*r*t.a*t.a/f,m=Math.sqrt(1-t.e*t.e)*Math.cos(l)*r*t.a*t.a/f,h=(e,n)=>{let r=Math.cos(s),i=Math.sin(s),a=Math.cos(o),c=Math.sin(o),l=Math.cos(t.i*Fh),u=Math.sin(t.i*Fh),d=e*r-n*i,f=e*i+n*r;return new U(d*a-f*l*c,d*c+f*l*a,f*u)},g=h(u,d).multiplyScalar(1e3);this.vel.copy(h(p,m)).multiplyScalar(1e3),this.center=this.earth,this.upos.copy(this.earth.upos).addVec(g),this.valid=!0}info(){let e=this.data,t=[[`Type`,`Spacecraft`],[`Mission`,e.about]];if(!this.valid)return t.push([`Position`,`no trajectory for this date`]),t;let n=new U,r=this.upos.sub(this.sun.upos,n).length(),i=this.upos.sub(this.earth.upos,n).length();return this.center===this.earth?(t.push([`Altitude`,`${ql(i-this.earth.radius)} above Earth`]),t.push([`Speed`,`${(this.vel.length()/1e3).toFixed(2)} km/s (relative to Earth)`])):(t.push([`From the Sun`,`${(r/Pl).toFixed(r>1495978707e3?1:3)} AU`]),t.push([`From Earth`,`${(i/Pl).toFixed(i>1495978707e3?1:3)} AU (light takes ${Lh(i)})`]),t.push([`Speed`,`${(this.vel.length()/1e3).toFixed(1)} km/s (relative to the Solar System)`])),t.push([`Size`,`${e.size} m across`]),t.push([`Data`,this.isOrbiter?`JPL Horizons orbital elements, propagated (approximate)`:`JPL Horizons trajectory`]),t}};function Lh(e){let t=e/299792458;return t<120?`${t.toFixed(1)} s`:t<7200?`${(t/60).toFixed(1)} min`:`${(t/3600).toFixed(1)} h`}async function Rh(e,t,n){let r=await fetch(`${e}/spacecraft.json`).then(e=>e.json());return[...r.probes,...r.orbiters].map(e=>new Ih(e,e.kind,t,n))}var zh=[[`Left drag`,`Look around`],[`Right drag / Shift+drag`,`Orbit around selection`],[`Wheel`,`Zoom to selection (or change flight speed)`],[`W A S D  R F`,`Fly (speed scales with altitude)`],[`Shift / Ctrl`,`×10 / ×0.1 speed`],[`Q / E`,`Roll`],[`Click`,`Select object`],[`G`,`Go to selection`],[`C`,`Centre selection`],[`Enter or /`,`Find object by name`],[`Space`,`Pause / resume time`],[`[  ]`,`Slower / faster time`],[`\\`,`Reverse time`],[`Backspace`,`Real time, now`],[`L / O / M`,`Labels / orbits / minor-body orbits`],[`P`,`Screenshot (PNG)`],[`Esc`,`Stop autopilot / clear selection`],[`V`,`Spaceship: cockpit view / chase view / off`],[`J`,`Warp drive to the selection`],[`X`,`Brake (in the ship)`],[`K / N`,`Missions & discoveries / ship sound on-off`],[`T`,`Tour: places worth a visit`],[`U`,`Photo mode: hide panels and labels`],[`H`,`Toggle this help`]],Bh=class{el;top;time;info;bottom;help;toastEl;search;searchInput;searchList;toastTimer=0;onSearch=null;onSearchPick=null;constructor(e){this.el=e,e.innerHTML=`
      <div class="hud-top"></div>
      <div class="hud-time"></div>
      <div class="hud-info"></div>
      <div class="hud-bottom"></div>
      <div class="hud-help hidden"><h3>Controls</h3><table>${zh.map(([e,t])=>`<tr><td><kbd>${e}</kbd></td><td>${t}</td></tr>`).join(``)}</table></div>
      <div class="hud-toast"></div>
      <div class="hud-search hidden"><input type="text" placeholder="Find: planet, moon, star, comet, black hole…" spellcheck="false"/><div class="results"></div></div>`,this.top=e.querySelector(`.hud-top`),this.time=e.querySelector(`.hud-time`),this.info=e.querySelector(`.hud-info`),this.bottom=e.querySelector(`.hud-bottom`),this.help=e.querySelector(`.hud-help`),this.toastEl=e.querySelector(`.hud-toast`),this.search=e.querySelector(`.hud-search`),this.searchInput=this.search.querySelector(`input`),this.searchList=this.search.querySelector(`.results`),this.searchInput.addEventListener(`input`,()=>this.refreshSearch()),this.searchInput.addEventListener(`keydown`,e=>{if(e.key===`Escape`&&this.closeSearch(),e.key===`Enter`){let e=this.searchList.querySelector(`[data-id]`);e&&this.pick(e.dataset.id)}e.stopPropagation()}),this.searchList.addEventListener(`click`,e=>{let t=e.target.closest(`[data-id]`);t&&this.pick(t.dataset.id)})}get searchOpen(){return!this.search.classList.contains(`hidden`)}openSearch(){this.search.classList.remove(`hidden`),this.searchInput.value=``,this.searchInput.placeholder=`Find: planet, moon, star, comet, black hole…`,this.searchList.innerHTML=``,this.searchInput.focus()}openList(e,t){this.openSearch(),this.searchInput.placeholder=e,this.searchList.innerHTML=t.map(e=>`<div class="result" data-id="${Vh(e.id)}"><span>${Vh(e.label)}</span><small>${Vh(e.detail)}</small></div>`).join(``)}closeSearch(){this.search.classList.add(`hidden`),this.searchInput.blur()}pick(e){this.closeSearch(),this.onSearchPick?.(e)}refreshSearch(){let e=this.searchInput.value.trim(),t=e&&this.onSearch?this.onSearch(e):[];this.searchList.innerHTML=t.map(e=>`<div class="result" data-id="${Vh(e.id)}"><span>${Vh(e.label)}</span><small>${Vh(e.detail)}</small></div>`).join(``)}setHidden(e){for(let t of[this.top,this.time,this.info,this.bottom,this.help])t.style.visibility=e?`hidden`:``}toggleHelp(){this.help.classList.toggle(`hidden`)}toast(e,t=2.2){this.toastEl.textContent=e,this.toastEl.classList.add(`show`),clearTimeout(this.toastTimer),this.toastTimer=window.setTimeout(()=>this.toastEl.classList.remove(`show`),t*1e3)}update(e){this.top.innerHTML=`<b>SPACE EXPLORER</b> &nbsp; ${e.fps.toFixed(0)} fps · ${e.stars}${e.loading?` · <span class="warn">${e.loading}</span>`:``} &nbsp; <span class="dim">H: help · T: tour</span>`,this.time.innerHTML=`<div class="date">${e.date}</div><div class="rate">${e.paused?`<span class="warn">PAUSED</span>`:e.rate}</div><div class="dim small">${e.ephemeris}</div>`,e.selection?(this.info.innerHTML=`<div class="name">${Vh(e.selection.name)}</div>
        <table>${[[`Distance`,e.selection.distance],...e.selection.rows].map(([e,t])=>`<tr><td>${Vh(e)}</td><td>${Vh(t)}</td></tr>`).join(``)}</table>
        <div class="dim small">G: go to · C: centre · right-drag: orbit</div>`,this.info.classList.remove(`hidden`)):this.info.classList.add(`hidden`),this.bottom.innerHTML=`${e.autopilot?`<span class="warn">AUTOPILOT</span> · `:``}Speed ${e.speed} · Altitude ${e.altitude} · Reference: ${Vh(e.reference)} <span class="dim">· depth: ${e.depthMode}</span>`}get root(){return this.el}};function Vh(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}var Hh=6674e-14,Uh=198892e25,Wh=299792458,Gh=86400,Kh=class{kind=`black hole`;key;name;upos;radius;parentObject=null;massSun;supermassive;diskNormal;diskOuter;diskInner;diskTmax;diskState;jet;diskLook;companion=null;data;orbitE1=new U;orbitE2=new U;sepCompanion=0;constructor(e,t){this.data=t,this.key=`bh:${e}`,this.name=t.name,this.massSun=t.massSun,this.supermassive=t.kind===`supermassive`,this.radius=2*Hh*t.massSun*Uh/(Wh*Wh);let n=t.raDeg*Math.PI/180,r=t.decDeg*Math.PI/180,i=new U(Math.cos(r)*Math.cos(n),Math.cos(r)*Math.sin(n),Math.sin(r)),a=i.clone().multiplyScalar(t.distPc);this.upos=Af.from(a.x*Z,a.y*Z,a.z*Z);let o=(t.companion?.incDeg??(this.supermassive?t.name.startsWith(`M87`)?17:30:60))*Math.PI/180,s=i.clone(),c=Math.abs(s.z)<.9?new U(0,0,1):new U(1,0,0),l=new U().crossVectors(s,c).normalize(),u=Jh(t.name)*Math.PI*2;l.applyAxisAngle(s,u),this.diskNormal=s.clone().multiplyScalar(Math.cos(o)).addScaledVector(l,Math.sin(o)).normalize(),this.orbitE1.crossVectors(this.diskNormal,s).normalize(),this.orbitE2.crossVectors(this.diskNormal,this.orbitE1).normalize(),this.diskOuter=t.diskOuterM??(this.supermassive?this.radius*600:0),this.diskInner=this.radius*3;let d=t.name===`Cygnus X-1`||t.name===`GRS 1915+105`,f=e=>Jh(t.name+e);this.diskState=this.diskOuter===0?`none`:this.supermassive?`illustrative`:d?`persistent`:`quiescent`,this.diskTmax=this.supermassive?t.name.startsWith(`M87`)?5200:6200:d?t.name===`GRS 1915+105`?16e6:1e7:9e3*(8/t.massSun)**.25*(.7+.6*f(`T`)),this.jet=t.name.startsWith(`M87`)?`optical`:d?`radio`:null;let p=!!t.companion&&!this.supermassive;if(this.diskLook={seed:f(`s`)*100,spiral:p?.35+.45*f(`sp`):.15*f(`sp`),arms:p?2:1+Math.floor(3*f(`a`)),streakFreq:6+10*f(`f`),angFreq:1.4+2.6*f(`g`),warp:.2+.8*f(`w`)},t.companion){let e=t.companion,n=Wl-5*Math.log10(e.radiusM/Kl*(e.teff/Gl)**2),r=`${t.name} companion`;this.companion=new fp(`${this.key}:c`,a.clone(),n,e.teff,e.spType,[r,...t.aliases],null),this.companion.exact=!0,this.sepCompanion=e.sepM}}update(e){let t=this.data.companion;if(!t||!this.companion)return;let n=(e-2451545)*Gh/(t.periodDays*Gh)*Math.PI*2+Jh(this.name+`p`)*Math.PI*2,r=this.orbitE1.clone().multiplyScalar(Math.cos(n)*this.sepCompanion).addScaledVector(this.orbitE2,Math.sin(n)*this.sepCompanion);this.companion.upos.copy(this.upos).addVec(r)}approachDir(e){let t=e.clone().normalize(),n=this.diskNormal,r=t.dot(n),i=r<0?-1:1,a=Math.min(Math.max(Math.asin(Math.min(1,Math.abs(r))),6*Math.PI/180),14*Math.PI/180),o=t.clone().addScaledVector(n,-r);return o.lengthSq()<1e-12&&(o=this.orbitE1.clone()),o.normalize(),o.multiplyScalar(Math.cos(a)).addScaledVector(n,i*Math.sin(a)).normalize()}info(){let e=this.data,t=[[`Type`,this.supermassive?`Supermassive black hole`:e.companion?`Stellar black hole (binary)`:`Stellar black hole`],[`Mass`,this.massSun>=1e5?`${(this.massSun/1e6).toLocaleString(void 0,{maximumFractionDigits:3})} million Suns`:`${this.massSun.toFixed(1)} Suns`],[`Event horizon`,`${(this.radius/1e3).toLocaleString(void 0,{maximumSignificantDigits:4})} km radius`],[`Distance from Sun`,e.distPc>1e5?`${(e.distPc/1e6).toFixed(1)} Mpc`:`${Math.round(e.distPc*3.2616).toLocaleString()} light years`]];return e.companion&&(t.push([`Companion`,`${e.companion.spType||`star`}, ${e.companion.massSun.toFixed(2)} Suns`]),t.push([`Orbital period`,e.companion.periodDays<100?`${e.companion.periodDays.toFixed(2)} days`:`${(e.companion.periodDays/365.25).toFixed(2)} years`])),t.push([`Accretion disk`,this.diskOuter===0?`none (dormant: the companion is too far to feed it)`:this.supermassive?`illustrative (the real flow is faint, hot gas seen mainly in radio)`:this.diskState===`persistent`?`bright, near its Eddington limit: inner edge ~${(this.diskTmax/1e6).toFixed(0)} million K, ${(2*this.diskOuter/1e9).toPrecision(2)} million km across`:`quiet (between outbursts): ~${Math.round(this.diskTmax/100)*100} K at its hottest, ${(2*this.diskOuter/1e9).toPrecision(2)} million km across`]),this.jet&&t.push([`Jets`,this.jet===`optical`?`relativistic jet, visible light (synchrotron); the counter-jet is too faint to see`:`relativistic radio jets (drawn faintly: invisible to the eye)`]),e.aliases.length&&t.push([`Also known as`,e.aliases.join(`, `)]),t.push([`Data`,e.ref]),t}};async function qh(e){return(await fetch(`${e}/blackholes.json`).then(e=>e.json())).blackholes.map((e,t)=>new Kh(t,e))}function Jh(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return(t>>>0)%1e5/1e5}var Yh=class{id;name;key;kind;parent=null;children=[];radii=[0,0,0];radius=0;radiusEstimated=!1;gm=0;systemGm=0;albedo=.3;texture=null;color=[.6,.6,.6];rotation=null;rings=null;teff=0;absMag=0;pos=new U;vel=new U;upos=new Af;orientation=new G;valid=!0;meta={};constructor(e,t,n){this.id=e,this.name=t,this.kind=n,this.key=`sol:${e}`}get parentObject(){return this.parent}get isAirless(){return![`Earth`,`Venus`,`Mars`,`Titan`,`Jupiter`,`Saturn`,`Uranus`,`Neptune`,`Sun`].includes(this.name)}get isGasGiant(){return[`Jupiter`,`Saturn`,`Uranus`,`Neptune`].includes(this.name)}soiRadius(){if(this.kind===`star`)return 0x5af3107a4000;let e=this.parent;if(!e||!e.gm||!this.gm)return Math.max(this.radius*20,1e6);let t=this.pos.distanceTo(e.pos);return Math.max(t*(this.gm/e.gm)**.4,this.radius*6)}info(){let e=[];if(e.push([`Type`,{star:`Star`,planet:`Planet`,dwarf:`Dwarf planet`,moon:`Moon`,asteroid:`Asteroid`,tno:`Trans-Neptunian object`,comet:`Comet`}[this.kind]+(this.meta.orbitClass?` (${this.meta.orbitClass})`:``)]),this.parent&&this.kind!==`planet`&&this.kind!==`dwarf`&&this.kind!==`asteroid`&&this.kind!==`tno`&&e.push([`Orbits`,this.parent.name]),this.radius>0){let[t,n,r]=this.radii.map(e=>e/1e3),i=Math.abs(t-r)/t>.002?` (${t.toFixed(1)} × ${n.toFixed(1)} × ${r.toFixed(1)})`:``;e.push([`Radius`,`${(this.radius/1e3).toLocaleString(void 0,{maximumFractionDigits:1})} km${i}${this.radiusEstimated?` (estimated)`:``}`])}if(this.gm>0){let t=this.gm/66743e-15;if(e.push([`Mass`,`${t.toExponential(4)} kg`]),this.radius>0){let n=this.gm/(this.radius*this.radius);e.push([`Surface gravity`,`${n.toPrecision(3)} m/s²`]);let r=4/3*Math.PI*this.radii[0]*this.radii[1]*this.radii[2];e.push([`Mean density`,`${(t/r/1e3).toFixed(3)} g/cm³`])}}return this.teff&&e.push([`Temperature`,`${this.teff.toLocaleString()} K`]),this.meta.spectralType&&e.push([`Spectral type`,String(this.meta.spectralType)]),this.meta.albedo!==void 0&&e.push([`Geometric albedo`,String(this.meta.albedo)]),this.meta.rotPeriodDays&&e.push([`Sidereal rotation`,`${Number(this.meta.rotPeriodDays).toFixed(4)} d`]),this.meta.rotPeriodHours&&e.push([`Rotation period`,`${Number(this.meta.rotPeriodHours).toFixed(3)} h`]),e}},Xh=class{key=`galaxy:mw`;name=`Milky Way`;kind=`galaxy`;upos;radius=15e3*Z;parentObject=null;constructor(){let e=Pp.centre;this.upos=Af.from(e.x*Z,e.y*Z,e.z*Z)}viewDir(){let e=new U(0,0,1),t=new U(-1,0,0);return e.multiplyScalar(Math.cos(35*Math.PI/180)).addScaledVector(t,Math.sin(35*Math.PI/180)).applyMatrix3(Pp.axes).normalize()}info(){return[[`Type`,`Barred spiral galaxy (our own)`],[`Stars`,`about 100–400 billion`],[`Stellar disk`,`scale length 2.6 kpc, ~50,000 light years across`],[`Bar`,`~10,000 light years long, 27° from the Sun–centre line`],[`Sun`,`${(Dp/1e3).toFixed(2)} kpc (${Math.round(Dp*3.2616/1e3)},000 light years) from the centre`],[`Centre`,`Sagittarius A*, a 4.3 million solar-mass black hole`],[`Model`,`parametric (disks, bar, arms, dust) with procedural stars; see CREDITS`]]}},Zh=class e{index;baseUrl;approx;segKey=new Map;loaded=new Map;pending=new Map;onChunkLoaded=null;constructor(e,t,n){this.index=e,this.baseUrl=t,this.approx=n,e.segments.forEach((e,t)=>this.segKey.set(`${e.center}:${e.target}`,t))}static async load(t,n){let r=await fetch(`${t}/index.json`);if(!r.ok)throw Error(`ephemeris index: HTTP ${r.status}`);return new e(await r.json(),t,n)}inRange(e){return e>=this.index.jdStart&&e<this.index.jdEnd}chunkIndex(e){if(!this.inRange(e))return-1;let t=Math.floor((e-this.index.jdStart)/this.index.chunkDays);return Math.min(t,this.index.chunks.length-1)}request(e,t=0){let n=this.chunkIndex(e);if(n<0)return null;let r=this.fetchChunk(n);if(t!==0){let r=this.index.chunks[n],i=(e-r.jd0)/(r.jd1-r.jd0);t>0&&i>.7&&n+1<this.index.chunks.length&&this.fetchChunk(n+1),t<0&&i<.3&&n>0&&this.fetchChunk(n-1)}return r}isLoaded(e){let t=this.chunkIndex(e);return t>=0&&this.loaded.has(t)}fetchChunk(e){if(this.loaded.has(e))return Promise.resolve();let t=this.pending.get(e);if(t)return t;let n=this.index.chunks[e],r=fetch(`${this.baseUrl}/${n.file}`).then(e=>{if(!e.ok)throw Error(`${n.file}: HTTP ${e.status}`);return e.arrayBuffer()}).then(t=>{this.loaded.set(e,{f64:new Float64Array(t),f32:new Float32Array(t)}),this.pending.delete(e);for(let t of[...this.loaded.keys()])Math.abs(t-e)>3&&this.loaded.delete(t);this.onChunkLoaded?.()}).catch(t=>{this.pending.delete(e),console.error(`ephemeris chunk failed`,t)});return this.pending.set(e,r),r}evaluate(e,t,n,r,i){let a=this.chunkIndex(n);if(a<0)return!1;let o=this.loaded.get(a);if(!o)return!1;let s=this.segKey.get(`${e}:${t}`);if(s===void 0)return!1;let c=this.index.segments[s],[l,u,d,f]=this.index.chunks[a].seg[s],p=Math.floor((n-c.init)/c.intlen),m=p-l;m<0&&(m=0),m>=u&&(m=u-1),p=l+m;let h=2*(n-(c.init+p*c.intlen))/c.intlen-1,g=c.ncoef-1,_=d/8+m*3,v=f/4+m*3*g,y=[0,0,0],b=[0,0,0];for(let e=0;e<3;e++){let t=1,n=h,r=0,i=1,a=o.f64[_+e],s=0,l=v+e*g;for(let e=0;e<g;e++){let c=o.f32[l+e];a+=c*n,s+=c*i;let u=2*h*n-t,d=2*n+2*h*i-r;t=n,n=u,r=i,i=d}y[e]=a,b[e]=s*2/c.intlen}return r.set(y[0],y[1],y[2]),i&&i.set(b[0],b[1],b[2]),!0}approxHeliocentric(e,t,n){let r=this.approx[e];if(!r)return!1;let i=(t-2451545)/36525,a=e=>r.el0[e]+(r.rate?.[e]??0)*i,o=a(0),s=a(1),c=a(2),l=a(3),u=a(4),d=a(5),f=l-u;if(r.bcsf){let[e,t,n,a]=r.bcsf;f+=e*i*i+t*Math.cos(a*i*Vl)+n*Math.sin(a*i*Vl)}let p=u-d,m=Cf(f*Vl,s),h=o*(Math.cos(m)-s),g=o*Math.sqrt(1-s*s)*Math.sin(m),_=Math.cos(p*Vl),v=Math.sin(p*Vl),y=Math.cos(d*Vl),b=Math.sin(d*Vl),x=Math.cos(c*Vl),S=Math.sin(c*Vl),C=(_*y-v*b*x)*h+(-v*y-_*b*x)*g,w=(_*b+v*y*x)*h+(-v*b+_*y*x)*g,T=v*S*h+_*S*g;return ip(n.set(C*Pl,w*Pl,T*Pl)),!0}},Qh=(e,t)=>(e[0]??0)+(e[1]??0)*t+(e[2]??0)*t*t;function $h(e,t,n,r){let i=n-Bl,a=i/36525,o=Qh(e.ra,a),s=Qh(e.dec,a),c=Qh(e.pm,i);if(e.system!==void 0&&(e.nutRa||e.nutDec||e.nutPm)){let n=t[String(e.system)];if(n){let t=Math.max(e.nutRa?.length??0,e.nutDec?.length??0,e.nutPm?.length??0);for(let r=0;r<t&&r<n.length;r++){let t=(n[r][0]+n[r][1]*a)*Vl,i=Math.sin(t),l=Math.cos(t);e.nutRa&&(o+=(e.nutRa[r]??0)*i),e.nutDec&&(s+=(e.nutDec[r]??0)*l),e.nutPm&&(c+=(e.nutPm[r]??0)*i)}}}return r.ra=o,r.dec=s,r.w=(c%360+360)%360,r}function eg(e,t=new G){let n=(e.ra+90)*Vl,r=(90-e.dec)*Vl,i=e.w*Vl,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i),d=a*l-o*s*u,f=-a*u-o*s*l,p=o*c,m=o*l+a*s*u,h=-o*u+a*s*l,g=-a*c,_=c*u,v=c*l,y=s;return t.set(d,f,p,0,m,h,g,0,_,v,y,0,0,0,0,1)}var tg=new W,ng={199:`Mercury`,299:`Venus`,499:`Mars`,599:`Jupiter`,699:`Saturn`,799:`Uranus`,899:`Neptune`};function rg(e){let t=(e^2654435769)>>>0;return t=Math.imul(t^t>>>16,2246822507)>>>0,t=Math.imul(t^t>>>13,3266489909)>>>0,((t^t>>>16)>>>0)/4294967296}var ig=class e{data;ephemeris;bodies=[];byId=new Map;sun;usingDE=!1;jd=Bl;ephemOf=new Map;satFrames=new Map;keplerEl=new Map;angles;tmp=new U;tmp2=new U;orient={ra:0,dec:0,w:0};constructor(e,t){this.data=e,this.ephemeris=t,this.angles=e.nutPrecAngles,gu(e.leapSeconds);for(let t of e.bodies){let e=new Yh(t.id,t.name,t.type),n=(t.radii??[]).map(e=>e*1e3);if(n.length===3)e.radii=[n[0],n[1],n[2]];else{let n=(1+3*rg(t.id))*1e3;e.radii=[n,n,n],e.radiusEstimated=!0}e.radius=Math.cbrt(e.radii[0]*e.radii[1]*e.radii[2]),e.gm=(t.gm??0)*1e9,e.systemGm=(t.systemGm??t.gm??0)*1e9,e.rotation=t.rot??null,e.texture=t.texture??null,t.color&&(e.color=[t.color[0],t.color[1],t.color[2]]),t.albedo===void 0?(t.type===`moon`||t.type===`asteroid`||t.type===`tno`)&&(e.albedo=.1+.4*rg(t.id+7)):e.albedo=t.albedo,t.type===`star`&&(e.teff=t.teff??5772,e.absMag=t.absMag??4.831),e.meta={...t,ephem:void 0},this.bodies.push(e),this.byId.set(t.id,e),this.ephemOf.set(e,t.ephem)}for(let t of e.bodies){let e=this.byId.get(t.id);if(t.parent!==null){let n=this.byId.get(t.parent)??null;e.parent=n,n?.children.push(e)}}this.sun=this.byId.get(10);for(let e of this.bodies){let t=this.ephemOf.get(e);if(t.kind===`satellite`){let n=t.orbit,r;if(n.frame===`laplace`&&n.poleRa!==void 0&&n.poleDec!==void 0)r=cp(n.poleRa,n.poleDec);else if(n.frame===`equatorial`&&e.parent?.rotation){let t=e.parent.rotation;r=t.pm[1]<0?cp((t.ra[0]+180)%360,-t.dec[0]):cp(t.ra[0],t.dec[0])}else{let e=Math.cos(tp),t=Math.sin(tp);r=new W().set(1,0,0,0,e,-t,0,t,e)}this.satFrames.set(e,r)}else t.kind===`kepler`&&this.keplerEl.set(e,Of(t.a*1e3,t.e,t.i,t.node,t.w,t.M,t.epochJd,Hl+e.gm))}}static async load(t){let n=await fetch(`${t}/solar/system.json`);if(!n.ok)throw Error(`system.json: HTTP ${n.status}`);let r=await n.json(),i=await Zh.load(`${t}/ephem`,r.approxElements);return new e(r,i)}satelliteElements(e,t){let n=this.ephemOf.get(e);if(!n||n.kind!==`satellite`||!e.parent)return null;if(n.osculating){let e=n.osculating.rows,r=e[0][0],i=e.length>1?e[1][0]-e[0][0]:1,[,a,o,s,c,l,u,d]=e[Math.max(0,Math.min(e.length-1,Math.round((t-r)/i)))],f=d*Math.PI/180/zl,p=a*1e3/(1-o);return{el:{q:a*1e3,e:o,i:s,node:c,peri:l,tp:u,mu:f*f*p*p*p},frame:tg}}let r=n.orbit,i=t-r.epochJd,a=r.fit,o=Math.cos(r.i*Math.PI/180)<0?-1:1,s=r.Pnode?-(a?.nodeSign??1)*o*360/(r.Pnode*365.25):0;a?.nodeRate!==void 0&&(s=a.nodeRate);let c=r.Pw?360/(r.Pw*365.25):0,l=r.i+(a?.di??0),u=r.node+(a?.dNode??0)+s*i,d=r.w+c*i,f=r.M+360*i/r.P;a&&(a.lambdaMode===1&&(f-=(c+s)*i),f+=a.dM+a.dn*i+a.dn2*i*i,a.libAmp&&a.libPeriod&&(f+=a.libAmp*Math.sin(2*Math.PI*i/a.libPeriod+(a.libPhase??0))));let p=(e.parent.gm||e.parent.systemGm)+e.gm,m=2*Math.PI/(r.P*zl),h=r.a*1e3;return{el:Of(h,r.e,l,u,d,f,t,m*m*h*h*h||p),frame:this.satFrames.get(e)}}heliocentricElements(e){return this.keplerEl.get(e)??null}ephemerisKind(e){return this.ephemOf.get(e)?.kind??`none`}update(e,t=0){this.jd=e;let n=this.ephemeris;n.request(e,t);let r=n.isLoaded(e);this.usingDE=r;let i=this.tmp,a=this.tmp2;for(let t of this.bodies){let o=this.ephemOf.get(t);if(o.kind===`spk`){if(t.valid=!0,r){t.pos.set(0,0,0),t.vel.set(0,0,0);for(let[r,s]of o.chain)n.evaluate(r,s,e,i,a),t.pos.addScaledVector(i,1e3),t.vel.addScaledVector(a,1e3/zl)}else if(t.id===10)t.pos.set(0,0,0),t.vel.set(0,0,0);else if(t.id===999)t.valid=t.pos.lengthSq()>0;else{let r=t.id===399?`EMB`:ng[t.id];n.approxHeliocentric(r,e,t.pos),n.approxHeliocentric(r,e+.01,i),t.vel.copy(i).sub(t.pos).divideScalar(.01*zl)}}}let o=new Map;for(let t of this.bodies){if(this.ephemOf.get(t).kind!==`satellite`)continue;if(t.id===301&&r){let r=new U,s=new U;n.evaluate(3,301,e,r,s),n.evaluate(3,399,e,i,a),r.sub(i).multiplyScalar(1e3),t.vel.copy(s.sub(a).multiplyScalar(1e3/zl)),o.set(t,r);continue}let s=this.satelliteElements(t,e);if(!s)continue;let c=new U,l=new U;Df(s.el,e,c,l),c.applyMatrix3(s.frame),l.applyMatrix3(s.frame),o.set(t,c),t.vel.copy(l)}for(let e of this.bodies){let t=this.ephemOf.get(e);if(t.kind===`spk`&&t.barycenter&&e.systemGm)for(let t of e.children){let n=o.get(t);n&&t.gm>0&&e.pos.addScaledVector(n,-t.gm/e.systemGm)}}if(!r){let e=this.byId.get(399),t=this.byId.get(301),n=o.get(t);n&&e.pos.addScaledVector(n,-t.gm/(e.gm+t.gm))}for(let[e,t]of o){let n=e.parent;e.pos.copy(n.pos).add(t),e.vel.add(n.vel),e.valid=n.valid}for(let[t,n]of this.keplerEl)Df(n,e,i,a),ip(i),ip(a),t.pos.copy(this.sun.pos).add(i),t.vel.copy(this.sun.vel).add(a);for(let t of this.bodies)t.upos.set(t.pos.x,t.pos.y,t.pos.z),this.updateOrientation(t,e)}updateOrientation(e,t){if(e.rotation){$h(e.rotation,this.angles,t,this.orient),eg(this.orient,e.orientation);return}let n=e.parent,r=e.meta.rotPeriodHours??null;if(e.kind===`moon`&&n){let t=this.tmp.copy(n.pos).sub(e.pos).normalize(),r=this.tmp2.copy(e.vel).sub(n.vel),i=new U().crossVectors(t,r).normalize().negate();i.lengthSq()<.5&&i.set(0,0,1);let a=new U().crossVectors(i,t).normalize(),o=new U().crossVectors(a,i);e.orientation.makeBasis(o,a,i);return}let i=r?r/24:.2+1.5*rg(e.id+3);eg({ra:270,dec:66.560708,w:((t-Bl)/i*360+360*rg(e.id))%360},e.orientation)}*visibleBodies(){for(let e of this.bodies)e.valid&&(yield e)}sunDistanceAU(e){return e.pos.distanceTo(this.sun.pos)/Pl}bodyMatrix(e,t=new G){return t.copy(e.orientation).scale(new U(e.radii[0],e.radii[1],e.radii[2]))}},ag=class e{id;base;nodes;totalStars;notableCount;absMin;absStep;frame=0;inflight=0;queue=[];needed=[];loadedStars=0;onNodeLoaded=null;onNodeEvicted=null;maxLoadedStars=4e6;extraIds=null;extraPromise=null;license;source;constructor(e,t,n){this.id=e,this.base=t,this.license=n.license??``,this.source=n.source??``,this.absMin=n.absMag.min,this.absStep=n.absMag.step,this.totalStars=n.stars,this.notableCount=n.idCode.notableCount,this.nodes=n.nodes.map(e=>({id:e[0],parent:e[1],depth:e[2],center:[e[3],e[4],e[5]],half:e[6],count:e[7],magMin:e[8],magMax:e[9],subMag:e[10],enc:e[11],children:e[12],state:`none`,pos:null,mt:null,absMag:null,lastNeeded:-1,drawCount:0,dmin:0,cpuPos:null,ids:null,idsState:`none`}))}static async load(t,n){let r=await fetch(`${n}/index.json`);if(!r.ok)throw Error(`star index: HTTP ${r.status}`);return new e(t,n,await r.json())}decodeAbsMag(e){return this.absMin+e*this.absStep}update(e,t,n=0){this.frame++,this.needed.length=0;let r=[],i=[0];for(;i.length;){let a=this.nodes[i.pop()],o=Math.max(og(e,a.center,a.half),n);a.dmin=o;let s=5*Math.log10(Math.max(o,1e-9)/10);if(!(a.subMag+s>t)){a.count>0&&a.magMin+s<=t&&(a.lastNeeded=this.frame,a.state===`ready`?(a.drawCount=this.countBrighter(a,t-s),this.needed.push(a)):a.state===`none`&&r.push({node:a,m:a.magMin+s}));for(let e of a.children)i.push(e)}}r.sort((e,t)=>e.m-t.m),this.queue=r.map(e=>e.node),this.pump(),this.frame%60==0&&this.evict()}countBrighter(e,t){let n=e.absMag;if(t>=e.magMax)return n.length;let r=0,i=n.length;for(;r<i;){let e=r+i>>1;n[e]<=t?r=e+1:i=e}return r}get pending(){return this.queue.length+this.inflight}pump(){for(;this.inflight<6&&this.queue.length;){let e=this.queue.shift();e.state===`none`&&(e.state=`loading`,this.inflight++,fetch(`${this.base}/n/${e.id}.bin`).then(t=>{if(!t.ok)throw Error(`star node ${e.id}: HTTP ${t.status}`);return t.arrayBuffer()}).then(t=>{this.decode(e,t),e.state=`ready`,this.loadedStars+=e.count,this.onNodeLoaded?.(e)}).catch(t=>{console.error(t),e.state=`error`}).finally(()=>{this.inflight--,this.pump()}))}}decode(e,t){let n=e.count,r=new Uint16Array(n),i=new Float32Array(n),a=new Uint8Array(t);if(e.enc===`u`){let o=new Uint16Array(t),s=new Uint16Array(n*3);for(let e=0;e<n;e++){s[e*3]=o[e*4],s[e*3+1]=o[e*4+1],s[e*3+2]=o[e*4+2];let t=a[e*8+6],n=a[e*8+7];r[e]=t|n<<8,i[e]=this.absMin+t*this.absStep}e.pos=s}else{let o=new Float32Array(t),s=new Float32Array(n*3);for(let e=0;e<n;e++){s[e*3]=o[e*4],s[e*3+1]=o[e*4+1],s[e*3+2]=o[e*4+2];let t=a[e*16+12],n=a[e*16+13];r[e]=t|n<<8,i[e]=this.absMin+t*this.absStep}e.pos=s}e.mt=r,e.absMag=i}evict(){if(this.loadedStars<this.maxLoadedStars)return;let e=this.nodes.filter(e=>e.state===`ready`&&e.lastNeeded<this.frame-120&&e.id!==0);e.sort((e,t)=>e.lastNeeded-t.lastNeeded);for(let t of e){if(this.loadedStars<this.maxLoadedStars*.8)break;this.onNodeEvicted?.(t),t.state=`none`,t.pos=null,t.mt=null,t.absMag=null,t.cpuPos=null,this.loadedStars-=t.count}}nodeFrame(e){return e.enc===`u`?{origin:[e.center[0]-e.half,e.center[1]-e.half,e.center[2]-e.half],scale:2*e.half}:{origin:e.center,scale:1}}cpuPositions(e){if(e.cpuPos)return e.cpuPos;if(!e.pos)return null;let{origin:t,scale:n}=this.nodeFrame(e),r=new Float64Array(e.count*3),i=e.enc===`u`?1/65535:1;for(let a=0;a<e.count*3;a++)r[a]=t[a%3]+e.pos[a]*i*n;return e.cpuPos=r,r}starPosition(e,t=new U){let n=this.cpuPositions(e.node);return t.set(n[e.slot*3],n[e.slot*3+1],n[e.slot*3+2])}starAbsMag(e){return e.node.absMag[e.slot]}starTeff(e){return du((e.node.mt[e.slot]>>8)/255)}nearest(e,t,n=8){let r=[];for(let n of this.nodes){if(n.state!==`ready`||og(e,n.center,n.half)>t)continue;let i=this.cpuPositions(n);for(let a=0;a<n.count;a++){let o=i[a*3]-e.x,s=i[a*3+1]-e.y,c=i[a*3+2]-e.z,l=o*o+s*s+c*c;l<t*t&&r.push({ref:{catalog:this,node:n,slot:a},dist:Math.sqrt(l)})}}return r.sort((e,t)=>e.dist-t.dist),r.slice(0,n)}async designation(e){let t=e.node;if(t.idsState!==`ready`){let e=await fetch(`${this.base}/n/${t.id}.ids`);t.ids=new Uint32Array(await e.arrayBuffer()),t.idsState=`ready`}let n=t.ids[e.slot],r=n>>>30,i=n&1073741823;if(r===1)return{code:n,text:`HIP ${i}`,notable:null};if(r===2)return{code:n,text:`HD ${i}`,notable:null};if(r===3)return{code:n,text:`TYC ${i>>>16}-${i>>>2&16383}-${(i&3)+1}`,notable:null};if(i<this.notableCount)return{code:n,text:null,notable:i};let a=(await this.loadExtra())[i-this.notableCount]??``;return{code:n,text:/^\d+$/.test(a)?`Gaia DR3 ${a}`:a,notable:null}}loadExtra(){return this.extraIds?Promise.resolve(this.extraIds):(this.extraPromise||=fetch(`${this.base}/extra_ids.txt`).then(e=>e.text()).then(e=>this.extraIds=e.split(`
`)),this.extraPromise)}};function og(e,t,n){let r=Math.max(Math.abs(e.x-t[0])-n,0),i=Math.max(Math.abs(e.y-t[1])-n,0),a=Math.max(Math.abs(e.z-t[2])-n,0);return Math.sqrt(r*r+i*i+a*a)}var sg=class{upos=new Af;quat=new H;fov=50;anchor=null;anchorPrev=new Af;speedFactor=1;speed=0;altitude=1e9;target=null;inertia=0;braking=!1;thrust=0;goto=null;velocity=new U;tmp=new U;tmp2=new U;get autopilot(){return this.goto!==null}get vel(){return this.velocity}stop(){this.velocity.set(0,0,0),this.speed=0}get gotoRemaining(){return this.goto?this.goto.T-this.goto.t:0}setAnchor(e){e!==this.anchor&&(this.anchor=e,e&&this.anchorPrev.copy(e.upos))}followAnchor(){if(!this.anchor)return;let e=this.anchor.upos.sub(this.anchorPrev,this.tmp);this.upos.addVec(e),this.anchorPrev.copy(this.anchor.upos)}forward(e=new U){return e.set(0,0,-1).applyQuaternion(this.quat)}up(e=new U){return e.set(0,1,0).applyQuaternion(this.quat)}right(e=new U){return e.set(1,0,0).applyQuaternion(this.quat)}lookAt(e,t){let n=t??this.up(new U),r=new G().lookAt(new U(0,0,0),e,n);this.quat.setFromRotationMatrix(r)}flyTo(e,t,n,r=!0,i){let a=this.upos.sub(e.upos,new U),o=Math.max(a.length(),.001),s=Math.max(t,1),c=a.clone().divideScalar(o);Number.isFinite(c.x)||c.set(0,0,1);let l=Math.log(o),u=Math.log(s),d;if(n!==void 0)d=[{t:0,L:l,m:0},{t:Math.max(n,.001),L:u,m:0}];else{let t=Math.max(u,Math.log(Math.max(e.radius,1)*300));if(l>t+.7){let e=lg(1+.15*(l-t),1.7,3.6),n=lg(1.4+.5*Math.abs(t-u),2.4,4.6),r=(t-l)/e,i=(u-t)/n,a=r*i>0?2*r*i/(r+i):0;d=[{t:0,L:l,m:0},{t:e,L:t,m:a},{t:e+n,L:u,m:0}]}else d=[{t:0,L:l,m:0},{t:lg(1.8+.5*Math.abs(l-u),2.2,4.6),L:u,m:0}]}let f=d[d.length-1].t,p=this.up(new U),m=i&&i.angleTo(c)>1e-4?new H().setFromUnitVectors(c,i.clone().normalize()):null,h=Math.min(l,Math.log(Math.max(e.radius,1)*300)+2);this.target=e,this.goto={target:e,dir:c,knots:d,t:0,T:f,fastUntil:d.length>2?d[1].t:0,q0:this.quat.clone(),rotate:r,up:p,swing:m,swingFrom:h,swingTo:u},this.setAnchor(e)}ext={move:new U,boost:1,orbitX:0,orbitY:0,zoom:0};clearExt(){this.ext.move.set(0,0,0),this.ext.boost=1,this.ext.orbitX=this.ext.orbitY=this.ext.zoom=0}turn(e){this.quat.multiply(new H().setFromAxisAngle(new U(0,1,0),e))}cancelGoto(){this.goto=null}get gotoProgress(){return this.goto?this.goto.t/this.goto.T:1}get gotoCruising(){return!!this.goto&&this.goto.t<this.goto.fastUntil}update(e,t){this.step(e,t),this.clearExt()}step(e,t){let n=t.consume(),{left:r}=n,i={dx:n.right.dx+this.ext.orbitX*400*e,dy:n.right.dy+this.ext.orbitY*400*e},a=n.wheel+this.ext.zoom*6*e,o=t.keys,s=this.fov/50*.0025;if(r.dx||r.dy){let e=new H().setFromAxisAngle(new U(0,1,0),-r.dx*s),t=new H().setFromAxisAngle(new U(1,0,0),-r.dy*s);this.quat.multiply(e).multiply(t),this.goto&&(this.goto.rotate=!1)}let c=+!!o.has(`KeyQ`)-!!o.has(`KeyE`);if(c&&this.quat.multiply(new H().setFromAxisAngle(new U(0,0,1),c*e*1.2)),(i.dx||i.dy)&&this.target){let e=this.upos.sub(this.target.upos,this.tmp),t=new H().setFromAxisAngle(this.up(new U),-i.dx*.005),n=new H().setFromAxisAngle(this.right(new U),-i.dy*.005),r=t.multiply(n),a=e.clone().applyQuaternion(r);this.upos.addVec(a.sub(e)),this.quat.premultiply(r)}if(a){if(this.target&&!this.goto){let e=this.upos.sub(this.target.upos,this.tmp),t=e.length(),n=Math.max(this.target.radius*1.002,1),r=Math.max(n,t*1.18**a);this.upos.addVec(e,r/t-1)}else this.speedFactor=Math.min(1e6,Math.max(1e-4,this.speedFactor*1.5**-a))}if(this.goto){let t=this.goto;t.t=Math.min(t.T,t.t+e);let n=t.t/t.T,r=cg(t.knots,t.t),i=t.dir.clone();if(t.swing){let e=t.swingTo-t.swingFrom,n=Math.abs(e)<1e-6?1:ug((r-t.swingFrom)/e);i.applyQuaternion(new H().slerp(t.swing,n))}let a=t.target.upos.clone().addVec(i,Math.exp(r));if(this.upos.copy(a),t.rotate){let e=new H().setFromRotationMatrix(new G().lookAt(new U,i.negate(),t.up));this.quat.copy(t.q0).slerp(e,Math.min(1,ug(n/.35)))}this.speed=0,t.t>=t.T&&(this.goto=null);return}let l=this.tmp2.set(+!!o.has(`KeyD`)-!!o.has(`KeyA`),+!!o.has(`KeyR`)-!!o.has(`KeyF`),+!!o.has(`KeyS`)-!!o.has(`KeyW`)),u=this.speedFactor;(o.has(`ShiftLeft`)||o.has(`ShiftRight`))&&(u*=10),(o.has(`ControlLeft`)||o.has(`ControlRight`))&&(u*=.1);let d=Math.max(this.altitude,1)*.8*u,f=l.lengthSq()>0?l.normalize().applyQuaternion(this.quat).multiplyScalar(d):new U;this.ext.move.lengthSq()>1e-6&&(f=this.ext.move.clone().multiplyScalar(d*this.ext.boost));let p=this.forward(new U);if(this.thrust=f.lengthSq()>0?f.dot(p)/f.length():0,this.inertia>0){f.lengthSq()>0?this.velocity.lerp(f,1-Math.exp(-e/this.inertia)):this.velocity.multiplyScalar(Math.exp(-e/(this.braking?.25:6))),this.braking&&f.lengthSq()>0&&this.velocity.multiplyScalar(Math.exp(-e/.25));let t=Math.max(this.altitude,1)*.8*this.speedFactor*12;this.velocity.length()>t&&this.velocity.setLength(t),this.velocity.length()<d*1e-4&&this.velocity.set(0,0,0)}else{let t=1-Math.exp(-e*6);this.velocity.lerp(f,t),l.lengthSq()===0&&this.velocity.length()<d*.001&&this.velocity.set(0,0,0)}let m=this.velocity.length()*e;m>this.altitude*.9&&this.altitude>0&&(m=this.altitude*.9),m>0&&this.upos.addVec(this.velocity.clone().normalize(),m),this.speed=e>0?m/e:0}};function cg(e,t){let n=0;for(;n<e.length-2&&t>e[n+1].t;)n++;let r=e[n],i=e[n+1],a=i.t-r.t,o=lg((t-r.t)/a,0,1),s=o*o,c=s*o;return(2*c-3*s+1)*r.L+(c-2*s+o)*a*r.m+(-2*c+3*s)*i.L+(c-s)*a*i.m}function lg(e,t,n){return Math.max(t,Math.min(n,e))}function ug(e){let t=Math.max(0,Math.min(1,e));return t*t*(3-2*t)}var dg=class{ctx=null;master=null;engine=null;warp=null;pad=null;enabled=!0;wanted=!1;start(){if(this.wanted=!0,this.ctx||!this.enabled){this.ctx?.resume();return}let e=window.AudioContext??window.webkitAudioContext;if(!e)return;let t=new e;this.ctx=t;let n=t.createGain();n.gain.value=.5,n.connect(t.destination),this.master=n;let r=t.sampleRate*2,i=t.createBuffer(1,r,t.sampleRate),a=i.getChannelData(0),o=0;for(let e=0;e<r;e++)o=.98*o+.02*(Math.random()*2-1),a[e]=o*6;let s=t.createBufferSource();s.buffer=i,s.loop=!0;let c=t.createGain();c.gain.value=0;let l=t.createBiquadFilter();l.type=`lowpass`,l.frequency.value=180;let u=t.createOscillator();u.type=`sawtooth`,u.frequency.value=42;let d=t.createOscillator();d.type=`sine`,d.frequency.value=63;let f=t.createGain();f.gain.value=.18,u.connect(f),d.connect(f),f.connect(l),s.connect(l),l.connect(c),c.connect(n),u.start(),d.start(),this.engine={gain:c,osc:u,osc2:d,filt:l};let p=t.createGain();p.gain.value=0;let m=t.createBiquadFilter();m.type=`bandpass`,m.Q.value=.8,m.frequency.value=300,s.connect(m),m.connect(p),p.connect(n),this.warp={gain:p,filt:m},s.start();let h=t.createGain();h.gain.value=0;let g=t.createBiquadFilter();g.type=`lowpass`,g.frequency.value=900;for(let e of[110,164.8,220.5,277.2]){let n=t.createOscillator();n.type=`triangle`,n.frequency.value=e;let r=t.createOscillator();r.frequency.value=.05+Math.random()*.07;let i=t.createGain();i.gain.value=e*.004,r.connect(i),i.connect(n.frequency),n.connect(g),n.start(),r.start()}g.connect(h),h.connect(n),h.gain.linearRampToValueAtTime(.035,t.currentTime+6),this.pad=h}setEnabled(e){if(this.enabled=e,!this.ctx){e&&this.wanted&&this.start();return}e?this.ctx.resume():this.ctx.suspend()}update(e,t,n){if(!this.ctx||!this.engine||!this.warp||!this.pad)return;let r=this.ctx.currentTime,i=n&&this.enabled?1:0;this.engine.gain.gain.setTargetAtTime(i*(.05+.3*e),r,.15),this.engine.filt.frequency.setTargetAtTime(160+900*e,r,.2),this.engine.osc.frequency.setTargetAtTime(40+30*e,r,.3),this.engine.osc2.frequency.setTargetAtTime(60+45*e,r,.3),this.warp.gain.gain.setTargetAtTime(i*.5*t,r,.3),this.warp.filt.frequency.setTargetAtTime(250+2500*t,r,.6),this.pad.gain.setTargetAtTime(i*.035,r,1.5)}chime(){if(!this.ctx||!this.master||!this.enabled)return;let e=this.ctx.currentTime;[523.25,659.25,783.99].forEach((t,n)=>{let r=this.ctx.createOscillator();r.type=`sine`,r.frequency.value=t;let i=this.ctx.createGain();i.gain.value=0,i.gain.setValueAtTime(0,e+n*.09),i.gain.linearRampToValueAtTime(.12,e+n*.09+.02),i.gain.exponentialRampToValueAtTime(.001,e+n*.09+.8),r.connect(i),i.connect(this.master),r.start(e+n*.09),r.stop(e+n*.09+.9)})}},fg=`Inter, "Segoe UI", system-ui, -apple-system, sans-serif`,$={bg:`rgba(9, 13, 24, 0.90)`,bgSolid:`#0a0f1c`,card:`rgba(255, 255, 255, 0.05)`,cardHover:`rgba(127, 178, 255, 0.22)`,active:`rgba(127, 178, 255, 0.35)`,border:`rgba(127, 178, 255, 0.35)`,accent:`#7fb2ff`,text:`#e8eef8`,dim:`#8c98ad`,warn:`#ffcc66`,sel:`#fff27a`},pg=class{width;height;paint;mesh;canvas=document.createElement(`canvas`);ctx;tex;regions=[];hover=null;dirty=!0;visible=!0;constructor(e,t,n,r){this.width=e,this.height=t,this.paint=r,this.canvas.width=e,this.canvas.height=t,this.ctx=this.canvas.getContext(`2d`),this.tex=new Bi(this.canvas),this.tex.colorSpace=Re,this.tex.minFilter=c,this.tex.magFilter=o,this.tex.anisotropy=4;let i=new Gr({map:this.tex,transparent:!0,depthTest:!1,depthWrite:!1,toneMapped:!1});this.mesh=new q(new Xi(n,n*t/e),i),this.mesh.renderOrder=1e3,this.mesh.frustumCulled=!1,this.mesh.userData.panel=this}setVisible(e){this.visible=e,this.mesh.visible=e}update(){this.dirty&&this.visible&&(this.dirty=!1,this.regions=[],this.ctx.clearRect(0,0,this.width,this.height),this.paint(this),this.tex.needsUpdate=!0)}regionAt(e){let t=e.x*this.width,n=(1-e.y)*this.height;for(let e=this.regions.length-1;e>=0;e--){let r=this.regions[e];if(t>=r.x&&t<=r.x+r.w&&n>=r.y&&n<=r.y+r.h)return r}return null}setHover(e){e!==this.hover&&(this.hover=e,this.dirty=!0)}region(e){this.regions.push(e)}rect(e,t,n,r,i,a,o,s=3){let c=this.ctx;c.beginPath(),c.roundRect(e,t,n,r,i),a&&(c.fillStyle=a,c.fill()),o&&(c.strokeStyle=o,c.lineWidth=s,c.stroke())}text(e,t,n,r,i=$.text,a=400,o=`left`,s){let c=this.ctx;if(c.font=`${a} ${r}px ${fg}`,c.fillStyle=i,c.textAlign=o,c.textBaseline=`middle`,s&&c.measureText(e).width>s){for(;e.length>1&&c.measureText(`${e}…`).width>s;)e=e.slice(0,-1);e=`${e}…`}c.fillText(e,t,n)}button(e,t,n,r,i,a,o,s={}){let c=this.hover===e&&!s.disabled;this.rect(t,n,r,i,Math.min(18,i/3),s.active?$.active:c?$.cardHover:$.card,c||s.active?$.accent:`rgba(255,255,255,0.08)`,c?4:2);let l=s.size??Math.min(34,i*.42),u=s.align??`center`,d=u===`center`?t+r/2:t+22;s.sub?(this.text(a,d,n+i*.38,l,s.disabled?$.dim:s.color??$.text,600,u,r-30),this.text(s.sub,d,n+i*.7,l*.62,$.dim,400,u,r-30)):this.text(a,d,n+i/2+1,l,s.disabled?$.dim:s.color??$.text,600,u,r-30),s.disabled||this.region({id:e,x:t,y:n,w:r,h:i,onClick:o})}},mg=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
varying vec3 vN;
varying vec3 vPos;
void main() {
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${ku}
}`,hg=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uSpec;
uniform float uEmit;        // self-lit fraction (screens, lamps)
uniform vec3 uSunDir;       // world direction to the local star
uniform float uSun;         // 0..1 strength of direct starlight (0 in deep space)
uniform vec3 uSunColor;
uniform float uFill;        // interior fill light
varying vec3 vN;
varying vec3 vPos;
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(-vPos);
  if (dot(n, V) < 0.0) n = -n;
  float mu0 = max(dot(n, uSunDir), 0.0);
  vec3 H = normalize(uSunDir + V);
  float spec = uSpec * pow(max(dot(n, H), 0.0), mix(10.0, 80.0, uSpec)) * 1.6;
  vec3 c = uColor * (uFill * (0.6 + 0.4 * max(dot(n, V), 0.0)) + uSun * mu0 * uSunColor * 1.4) + spec * uSun * uSunColor;
  c = mix(c, uColor * 1.6, uEmit);
  gl_FragColor = vec4(c, 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,gg={uSunDir:{value:new U(1,.4,.2).normalize()},uSun:{value:1},uSunColor:{value:new U(1,.97,.92)}},_g=new Map;function vg(e,t=.3,n=0,r=.08){let i=`${e.join(`,`)}|${t}|${n}|${r}`,a=_g.get(i);return a||(a=new J({name:`lit`,vertexShader:mg,fragmentShader:hg,side:2,uniforms:{uColor:{value:new U(...e)},uSpec:{value:t},uEmit:{value:n},uFill:{value:r},...gg,uPullIn:Q.uPullIn,uDepthK:Q.uDepthK}}),_g.set(i,a)),a}var yg=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uLevel;
varying vec2 vUv2;
void main() {
  vec2 p = vUv2 * 2.0 - 1.0;
  float r = length(p);
  float g = exp(-r * r * 5.0) * uLevel + exp(-r * r * 40.0) * uLevel * 2.0;
  gl_FragColor = vec4(uColor * g, 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,bg=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
varying vec2 vUv2;
void main() {
  vUv2 = uv;
  // billboard: the quad faces the camera
  vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float s = length(vec3(modelMatrix[0]));
  c.xy += position.xy * s;
  gl_Position = projectView(c);
  #include <logdepthbuf_vertex>
${ku}
}`,xg={hull:[.78,.8,.84],trim:[.85,.32,.12],engine:[.45,.75,1],scale:1},Sg=class{group=new sn;glows=[];constructor(e=xg){let t=vg(e.hull,.45),n=vg(e.trim,.3),r=vg([.12,.13,.15],.6),i=vg([.15,.3,.45],.9),a=(e,t,n,r=[0,0,0],i=[1,1,1])=>{let a=new q(e,t);return a.position.set(...n),a.rotation.set(...r),a.scale.set(...i),a.frustumCulled=!1,this.group.add(a),a};a(new Ki(1.1,1.4,8,12),t,[0,0,.5],[Math.PI/2,0,0]),a(new qi(1.1,4.5,12),t,[0,0,-5.75],[-Math.PI/2,0,0]),a(new Qi(.85,16,10,0,Math.PI*2,0,Math.PI/2),i,[0,.75,-3],[0,0,0],[1,.7,1.9]),a(new Wi(2.6,.5,6),r,[0,-.9,.8]);for(let i of[-1,1]){a(new Wi(5.5,.18,3.2),t,[i*3.6,-.2,1.8],[0,i*.45,i*-.08]),a(new Wi(.25,.22,2.2),n,[i*6.1,-.35,2.9],[0,i*.45,0]),a(new Wi(.15,1.6,1.4),t,[i*6.3,.45,3.2],[0,0,i*.25]),a(new Ki(.75,.85,5.5,14),t,[i*1.9,0,3.5],[Math.PI/2,0,0]),a(new Ki(.9,.7,.8,14),r,[i*1.9,0,6.6],[Math.PI/2,0,0]),a(new Wi(.3,.25,4.5),n,[i*1.9,.78,3.2]);let o=new J({name:`engine-glow`,vertexShader:bg,fragmentShader:yg,uniforms:{uColor:{value:new U(...e.engine)},uLevel:{value:.2},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK},transparent:!0,depthWrite:!1,blending:2});this.glows.push(o),a(new Xi(2,2),o,[i*1.9,0,7.15],[0,0,0],[.9,.9,.9]).renderOrder=12}this.group.scale.setScalar(e.scale),this.group.name=`ship`}setThrust(e){for(let t of this.glows)t.uniforms.uLevel.value=.12+.9*Math.max(0,Math.min(1,e))}},Cg=class{group=new sn;readout={speed:`0 m/s`,throttle:0,boost:!1,altitude:``,reference:``,target:`none`,targetKind:``,distance:``,eta:``,warp:`no target`,time:``,missions:``,hint:``};screens=[];timer=0;constructor(){this.group.name=`cockpit`;let e=vg([.16,.17,.2],.5,0,.12),t=vg([.55,.22,.08],.3,0,.12),n=vg([.08,.085,.1],.6,0,.1),r=e=>vg(e,0,1,0),i=(t,n,r,i=e)=>new q(new Wi(t,n,r),i),a=(e,t,n=[0,0,0])=>(e.position.set(...t),e.rotation.set(...n),e.frustumCulled=!1,e.renderOrder=20,this.group.add(e),e);a(i(1.3,.05,.42),[0,-.33,-.8],[.55,0,0]),a(i(1.3,.36,.05,t),[0,-.53,-.98],[0,0,0]);for(let e of[-1,1]){a(i(.26,.07,.8),[e*.6,-.36,-.4],[0,0,e*.18]);for(let t=0;t<4;t++)a(i(.025,.012,.025,r(t%2?[.2,1,.5]:[1,.6,.15])),[e*.57,-.318,-.62+t*.1])}let o=(e,t,r=.032)=>{let o=e.distanceTo(t),s=a(i(r,r,o,n),[(e.x+t.x)/2,(e.y+t.y)/2,(e.z+t.z)/2]);return s.quaternion.copy(new H().setFromUnitVectors(new U(0,0,1),t.clone().sub(e).normalize())),s},s=(e,t,n)=>new U(e,t,n);for(let e of[-1,1])o(s(e*.66,-.3,-.98),s(e*.46,.4,-.62)),o(s(e*.46,.4,-.62),s(e*.42,.47,.35)),o(s(e*.72,-.28,.4),s(e*.66,-.3,-.98));o(s(-.46,.4,-.62),s(.46,.4,-.62)),o(s(-.42,.47,.35),s(.42,.47,.35)),o(s(0,.44,-.62),s(0,.49,.35),.022);let c=new pg(384,288,.24,e=>this.paintLeft(e)),l=new pg(512,288,.32,e=>this.paintCentre(e)),u=new pg(384,288,.24,e=>this.paintRight(e)),d=-.95;l.mesh.position.set(0,-.27,-.68),l.mesh.rotation.set(d,0,0),c.mesh.position.set(-.33,-.28,-.65),c.mesh.rotation.set(d,.42,.18),u.mesh.position.set(.33,-.28,-.65),u.mesh.rotation.set(d,-.42,-.18);for(let e of[c,l,u]){let t=e.mesh.material;t.depthTest=!0,t.depthWrite=!0,e.mesh.renderOrder=21,this.group.add(e.mesh),this.screens.push(e)}this.group.visible=!1}update(e){if(this.timer-=e,!(this.timer>0)){this.timer=.2;for(let e of this.screens)e.dirty=!0,e.update()}}frame(e,t){e.ctx.clearRect(0,0,e.width,e.height),e.rect(3,3,e.width-6,e.height-6,18,`rgba(4, 10, 20, 0.96)`,`rgba(127, 178, 255, 0.55)`,3),e.text(t,18,30,20,$.dim,700)}paintLeft(e){let t=this.readout;this.frame(e,`FLIGHT`),e.text(t.speed,18,92,44,`#ffffff`,700,`left`,e.width-36),e.text(t.boost?`BOOST`:`throttle`,18,128,20,t.boost?$.warn:$.dim,600);let n=e.width-36;e.rect(18,146,n,22,8,`rgba(255,255,255,0.06)`);let r=Math.max(-1,Math.min(1,t.throttle)),i=18+n/2;e.rect(r>=0?i:i+n/2*r,146,n/2*Math.abs(r),22,8,r>=0?$.accent:$.warn),e.text(`altitude`,18,210,20,$.dim,600),e.text(t.altitude,18,246,30,$.text,600,`left`,e.width-36)}paintCentre(e){let t=this.readout;this.frame(e,`NAVIGATION`),e.text(t.target,18,80,38,t.target===`none`?$.dim:$.sel,700,`left`,e.width-36),e.text(t.targetKind,18,112,20,$.dim,500,`left`,e.width-36),t.distance&&(e.text(t.distance,18,160,32,$.text,600,`left`,e.width-36),e.text(t.eta,18,196,22,$.dim,500,`left`,e.width-36));let n=t.warp===`warping`?`WARP ENGAGED`:t.warp===`ready`?`WARP READY`:`SELECT A TARGET`;e.rect(18,220,e.width-36,48,12,t.warp===`warping`?`rgba(127,178,255,0.35)`:`rgba(255,255,255,0.05)`,$.border,2),e.text(n,e.width/2,245,24,t.warp===`warping`?`#ffffff`:t.warp===`ready`?$.accent:$.dim,700,`center`)}paintRight(e){let t=this.readout;this.frame(e,`STATUS`),e.text(`near`,18,66,20,$.dim,600),e.text(t.reference,18,98,28,$.text,600,`left`,e.width-36),e.text(`time`,18,136,20,$.dim,600),e.text(t.time,18,166,24,$.text,500,`left`,e.width-36),e.text(`missions`,18,204,20,$.dim,600),e.text(t.missions,18,234,24,$.warn,600,`left`,e.width-36),e.text(t.hint,18,270,16,$.dim,400,`left`,e.width-36)}},wg=`space-explorer-game`;function Tg(e,t){let n=e.findByName(t);if(!(n instanceof Yh))return null;let r=Bd(n.upos.sub(e.rig.upos,new U),n.orientation),i=r.length();return{lat:Math.asin(r.z/i)*180/Math.PI,lon:Math.atan2(r.y,r.x)*180/Math.PI,alt:i-xd(n,r.divideScalar(i))}}function Eg(e,t,n,r){let i=Math.PI/180,a=Math.sin(e*i)*Math.sin(n*i)+Math.cos(e*i)*Math.cos(n*i)*Math.cos((t-r)*i);return Math.acos(Math.max(-1,Math.min(1,a)))/i}var Dg=[{id:`moon`,title:`Fly to the Moon`,detail:`Get within 4 Moon radii`,check:(e,t)=>t(e.findByName(`Moon`),4)},{id:`iss`,title:`Catch the ISS`,detail:`Within 1 km of the International Space Station`,check:(e,t)=>t(e.findByName(`ISS`),18)},{id:`rings`,title:`Skim Saturn's rings`,detail:`Within 2.3 radii of Saturn`,check:(e,t)=>t(e.findByName(`Saturn`),2.3)},{id:`corona`,title:`Touch the Sun's corona`,detail:`Within 3 solar radii`,check:(e,t)=>t(e.system.sun,3)},{id:`voyager`,title:`Find Voyager 1`,detail:`Within 1 km of the most distant spacecraft`,check:(e,t)=>t(e.findByName(`Voyager 1`),500)},{id:`exo`,title:`Visit a world of another star`,detail:`Ride along with any exoplanet`,check:e=>e.rig.anchor instanceof Jf},{id:`proxima`,title:`Reach the nearest exoplanet`,detail:`Proxima Centauri b`,check:(e,t)=>t(e.findByName(`Proxima Cen b`),6)},{id:`hole`,title:`Face a black hole`,detail:`Within 60 Schwarzschild radii of any black hole`,check:e=>e.blackHoles.some(t=>t.upos.sub(e.rig.upos,new U).length()<t.radius*60)},{id:`outside`,title:`Leave the Milky Way`,detail:`30,000 parsecs from the Sun`,check:e=>e.rig.upos.sub(e.system.sun.upos,new U).length()>3e4*Z},{id:`andromeda`,title:`Visit Andromeda`,detail:`Within 3 of its radii`,check:(e,t)=>t(e.findByName(`Andromeda Galaxy`),3)},{id:`dock`,title:`Dock at a space station`,detail:`Ship mode: fly slowly into a station docking port`,check:e=>!!e.game?.docked},{id:`land`,title:`Land on another world`,detail:`Ship mode: come down slowly onto any solid surface`,check:e=>!!e.game?.landed},{id:`ringdive`,title:`Dive into Saturn's rings`,detail:`Float among the ice of the B ring (search "rings")`,check:e=>!!e.bodies.ringParticles?.mesh.visible},{id:`shadow`,title:`Catch a moon shadow`,detail:`See a moon's shadow on its planet (Jupiter's moons cast one almost daily)`,check:e=>{let t=e.findByName(`Jupiter`),n=t instanceof Yh?e.bodies.views.get(t):void 0;return!!n&&n.resolved&&n.pixelRadius>80&&e.bodies.eclipsed(t)}},{id:`comet`,title:`Ride with a comet`,detail:`Within a million km of an active comet near the Sun`,check:e=>e.cometTails.near(e.rig.upos,1e9)},{id:`alien`,title:`Stand on an alien world`,detail:`Ship mode: land on a rocky planet of another star`,check:e=>e.game?.landed instanceof Jf},{id:`olympus`,title:`Fly over Olympus Mons`,detail:`Below 40 km over the tallest volcano known (Mars, 18.7° N 226° E)`,check:e=>{let t=Tg(e,`Mars`);return!!t&&t.alt<4e4&&Eg(t.lat,t.lon,18.65,-133.8)<5}},{id:`everest`,title:`Fly past Mount Everest`,detail:`Below 12 km altitude within 20 km of the 8,849 m summit (27.99° N 86.93° E)`,check:e=>{let t=Tg(e,`Earth`);return!!t&&t.alt<12e3&&Eg(t.lat,t.lon,27.988,86.925)<.18}},{id:`canyon`,title:`Fly through the Grand Canyon`,detail:`Below the rim: under 1.6 km altitude, within 15 km of Grand Canyon Village (36.06° N 112.14° W)`,check:e=>{let t=Tg(e,`Earth`);return!!t&&t.alt<1600&&Eg(t.lat,t.lon,36.06,-112.14)<.135}},{id:`southpole`,title:`Land at the Moon's south pole`,detail:`Ship mode: touch down south of 80° S, where Artemis astronauts are headed`,check:e=>{let t=Tg(e,`Moon`);return!!t&&e.game?.landed?.name===`Moon`&&t.lat<-80}},{id:`stars`,title:`Visit five stars`,detail:`Come close to five different stars`,check:()=>!1},{id:`log`,title:`Explorer`,detail:`Log 25 discoveries`,check:()=>!1}],Og=class{app;saved={done:[],log:[],stars:[]};timer=0;onComplete=null;constructor(e){this.app=e;try{let e=localStorage.getItem(wg);e&&(this.saved={...this.saved,...JSON.parse(e)})}catch{}}get list(){return Dg.map(e=>({id:e.id,title:e.title,detail:e.detail,done:this.saved.done.includes(e.id)}))}get doneCount(){return this.saved.done.length}get total(){return Dg.length}get log(){return this.saved.log}save(){try{localStorage.setItem(wg,JSON.stringify(this.saved))}catch{}}update(e){if(this.timer-=e,this.timer>0)return;this.timer=1;let t=this.app,n=(e,n)=>!!e&&e.upos.sub(t.rig.upos,new U).length()<Math.max(e.radius,1)*n,r=[],i=t.rig.anchor;i&&(i instanceof Yh||i instanceof Jf||i instanceof Ih)&&r.push(i);for(let e of t.near.stars)n(e,30)&&r.push(e);for(let e of t.blackHoles)n(e,200)&&r.push(e);t.selection instanceof jh&&n(t.selection,4)&&r.push(t.selection);let a=!1;for(let e of r)this.saved.log.some(t=>t.name===e.name)||(this.saved.log.unshift({name:e.name,kind:e.kind,t:Date.now()}),this.saved.log.length>300&&this.saved.log.pop(),a=!0,t.hud.toast(`Discovered: ${e.name}`)),e instanceof fp&&!this.saved.stars.includes(e.name)&&(this.saved.stars.push(e.name),a=!0);for(let e of Dg)this.saved.done.includes(e.id)||(e.id===`stars`?this.saved.stars.length>=5:e.id===`log`?this.saved.log.length>=25:e.check(t,n))&&(this.saved.done.push(e.id),a=!0,this.onComplete?.({id:e.id,title:e.title,detail:e.detail,done:!0}));a&&this.save()}reset(){this.saved={done:[],log:[],stars:[]},this.save()}},kg=[`Gateway`,`Haven`,`Tiangong Ring`,`Daedalus`,`Meridian Hub`,`Arcadia`,`Lagrange House`,`Odyssey`,`Harbor`,`Polaris`],Ag=class{body;r;a;b;phase;period;kind=`station`;key;name;upos=new Af;radius=160;vel=new U;group=new sn;axis=new U;ring=new sn;quat=new H;portOffset=75;constructor(e,t,n,r,i,a,o){this.body=e,this.r=t,this.a=n,this.b=r,this.phase=i,this.period=a,this.name=`${kg[o%kg.length]} Station`,this.key=`station:${e.id}:${o}`,this.axis.crossVectors(n,r).normalize(),this.quat.setFromRotationMatrix(new G().makeBasis(n,r,this.axis));let s=vg([.62,.63,.66],.35),c=vg([.4,.42,.45],.5),l=vg([.08,.12,.28],.6),u=vg([.5,.42,.25],0,1,0),d=vg([.12,.5,.22],0,1,0),f=vg([.55,.1,.08],0,1,0),p=(e,t,n=[0,0,0],r=[0,0,0])=>(t.position.set(...n),t.rotation.set(...r),t.frustumCulled=!1,e.add(t),t);p(this.ring,new q(new $i(150,11,12,64),s));for(let e=0;e<4;e++){let t=e*Math.PI/2;p(this.ring,new q(new Ki(3,3,140,8),c),[Math.cos(t)*75,Math.sin(t)*75,0],[0,0,t-Math.PI/2])}for(let e=0;e<48;e++){let t=e/48*Math.PI*2;p(this.ring,new q(new Wi(1.5,1.5,3),u),[Math.cos(t)*161,Math.sin(t)*161,0],[0,0,t])}this.group.add(this.ring),p(this.group,new q(new Ki(18,18,110,20),s),[0,0,0],[Math.PI/2,0,0]),p(this.group,new q(new Ki(7,9,22,16),c),[0,0,64],[Math.PI/2,0,0]),p(this.group,new q(new Wi(.8,.8,.8),d),[10,0,75]),p(this.group,new q(new Wi(.8,.8,.8),f),[-10,0,75]),p(this.group,new q(new Wi(.8,.8,.8),u),[0,10,75]);for(let e of[-1,1])p(this.group,new q(new Wi(180,34,.8),l),[e*120,0,-58]);p(this.group,new q(new Wi(70,4,4),c),[0,0,-58]),this.group.matrixAutoUpdate=!1,this.group.name=this.name}get parentObject(){return this.body}port(e=new Af){return e.copy(this.upos).addVec(this.axis,this.portOffset)}update(e,t){let n=this.phase+2*Math.PI*(e*86400)/this.period,r=this.a.clone().multiplyScalar(Math.cos(n)*this.r).addScaledVector(this.b,Math.sin(n)*this.r);this.vel.copy(this.a).multiplyScalar(-Math.sin(n)).addScaledVector(this.b,Math.cos(n)).multiplyScalar(2*Math.PI*this.r/this.period),this.upos.copy(this.body.upos).addVec(r),this.ring.rotation.z=t*.2557}place(e){let t=this.upos.sub(e,new U);this.group.visible=t.length()<5e5,this.group.visible&&(this.group.matrix.compose(t,this.quat,new U(1,1,1)),this.group.matrixWorldNeedsUpdate=!0)}info(){let e=this.upos.sub(this.body.upos,new U).length()-this.body.radius;return[[`Type`,`Space station (fictional, game mode)`],[`Orbiting`,this.body.name],[`Altitude`,ql(e)],[`Ring`,`300 m across, turning every 25 s: 1 g on the rim`],[`Docking`,`approach the front of the hub along its axis: the docking computer takes over within 400 m`]]}},jg=[{role:`Freighter`,names:[`Aurora`,`Halcyon`,`Long Haul`,`Meridian`,`Tortoise`],look:{hull:[.62,.6,.55],trim:[.9,.62,.1],engine:[1,.7,.35],scale:3.2}},{role:`Shuttle`,names:[`Kestrel`,`Swift`,`Dragonfly`,`Comet`,`Lark`],look:{hull:[.88,.88,.9],trim:[.15,.4,.85],engine:[.5,.8,1],scale:.8}},{role:`Survey ship`,names:[`Cartographer`,`Lantern`,`Wayfinder`,`Pathfinder`],look:{hull:[.75,.78,.8],trim:[.2,.75,.5],engine:[.55,1,.8],scale:1.4}},{role:`Tanker`,names:[`Reservoir`,`Wellspring`,`Barrel`],look:{hull:[.55,.57,.6],trim:[.8,.2,.2],engine:[1,.55,.4],scale:2.6}}];function Mg(e){let t=e>>>0||1;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}var Ng=class{name;role;body;r;axisA;axisB;phase;period;kind=`ship`;key;upos=new Af;radius;vel=new U;model;quat=new H;constructor(e,t,n,r,i,a,o,s,c){this.name=e,this.role=t,this.body=r,this.r=i,this.axisA=a,this.axisB=o,this.phase=s,this.period=c,this.key=`ship:${r.id}:${e}`,this.radius=8*n.scale,this.model=new Sg(n),this.model.group.matrixAutoUpdate=!1,this.model.setThrust(.35)}get parentObject(){return this.body}update(e){let t=this.phase+2*Math.PI*(e*86400)/this.period,n=this.axisA.clone().multiplyScalar(Math.cos(t)*this.r).addScaledVector(this.axisB,Math.sin(t)*this.r);this.vel.copy(this.axisA).multiplyScalar(-Math.sin(t)).addScaledVector(this.axisB,Math.cos(t)).multiplyScalar(2*Math.PI*this.r/this.period),this.upos.copy(this.body.upos).addVec(n);let r=this.vel.clone().normalize(),i=n.clone().normalize().negate(),a=new U().crossVectors(r,i.clone().negate()).normalize(),o=new U().crossVectors(a,r);this.quat.setFromRotationMatrix(new G().makeBasis(a,o,r.negate()))}info(){let e=this.upos.sub(this.body.upos,new U).length()-this.body.radius;return[[`Type`,`${this.role} (fictional, game mode)`],[`Orbiting`,this.body.name],[`Altitude`,ql(e)],[`Speed`,`${(this.vel.length()/1e3).toFixed(2)} km/s`],[`Length`,`${Math.round(14*(this.radius/8))} m`]]}},Pg=class{group=new sn;ships=[];stations=[];body=null;time=0;constructor(){this.group.name=`traffic`}setBody(e){if(e===this.body)return;for(let e of this.ships)this.group.remove(e.model.group);for(let e of this.stations)this.group.remove(e.group);if(this.ships=[],this.stations=[],this.body=e,!e||e.gm<=0||e.kind===`star`)return;let t=0;for(let n of e.name)t=t*31+n.charCodeAt(0)>>>0;let n=Mg(t),r=e.kind===`planet`?9:5;for(let t=0;t<r;t++){let t=jg[Math.floor(n()*jg.length)],r=`${t.names[Math.floor(n()*t.names.length)]}-${1+Math.floor(n()*9)}`,i=e.radius*(1.04+n()**2*2.5),a=2*Math.PI*Math.sqrt(i**3/e.gm),o=new U(n()-.5,n()-.5,n()-.5).normalize(),s=new U().crossVectors(o,Math.abs(o.z)<.9?new U(0,0,1):new U(1,0,0)).normalize(),c=new U().crossVectors(o,s),l=new Ng(`${t.role} ${r}`,t.role,t.look,e,i,s,c,n()*Math.PI*2,a);this.ships.push(l),this.group.add(l.model.group)}if(e.radius>1e5){let t=e.radius*(e.isGasGiant?1.6:1)+Math.max(4e5,e.radius*.07),r=new U(n()-.5,n()-.5,n()*2-.5).normalize(),i=new U().crossVectors(r,Math.abs(r.z)<.9?new U(0,0,1):new U(1,0,0)).normalize(),a=new Ag(e,t,i,new U().crossVectors(r,i),n()*Math.PI*2,2*Math.PI*Math.sqrt(t**3/e.gm),Math.floor(n()*1e3));this.stations.push(a),this.group.add(a.group)}}update(e,t,n=0){this.time+=n;for(let n of this.stations)n.update(t,this.time),n.place(e);let r=new U;for(let n of this.ships){n.update(t),n.upos.sub(e,r);let i=n.model.group;i.visible=r.length()<3e6,i.visible&&(i.matrix.compose(r,n.quat,new U().setScalar(i.scale.x)),i.matrixWorldNeedsUpdate=!0)}}},Fg=`
#include <common>
#include <logdepthbuf_pars_vertex>
${Ou}
attribute vec4 aStreak;   // x, y offset (m), phase 0..1, end (0 tail, 1 head)
uniform float uTime;
uniform float uLevel;
varying float vA;
void main() {
  float len = 6.0 + 60.0 * uLevel;
  float z = -mod(aStreak.z * 260.0 - uTime * (80.0 + 900.0 * uLevel), 260.0);
  z += aStreak.w * len;
  vec3 p = vec3(aStreak.xy, z);
  vA = (1.0 - aStreak.w * 0.85) * smoothstep(-260.0, -150.0, z) * smoothstep(5.0, -10.0, z);
  gl_Position = projectView(modelViewMatrix * vec4(p, 1.0));
  #include <logdepthbuf_vertex>
${ku}
}`,Ig=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uLevel;
varying float vA;
void main() {
  gl_FragColor = vec4(vec3(0.65, 0.8, 1.0) * vA * uLevel * 1.4, 1.0);
${Au}
  #include <logdepthbuf_fragment>
}`,Lg=class{lines;mat;level=0;constructor(e=420){let t=new Float32Array(e*2*4);for(let n=0;n<e;n++){let e=Math.random()*Math.PI*2,r=4+Math.random()**.6*40,i=Math.random(),a=Math.cos(e)*r,o=Math.sin(e)*r;t.set([a,o,i,0,a,o,i,1],n*8)}let n=new mr;n.setAttribute(`aStreak`,new K(t,4)),n.setAttribute(`position`,new K(new Float32Array(e*2*3),3)),this.mat=new J({name:`warp`,vertexShader:Fg,fragmentShader:Ig,uniforms:{uTime:{value:0},uLevel:{value:0},uPullIn:Q.uPullIn,uDepthK:Q.uDepthK},transparent:!0,depthWrite:!1,depthTest:!1,blending:2}),this.lines=new ji(n,this.mat),this.lines.frustumCulled=!1,this.lines.renderOrder=15,this.lines.visible=!1}update(e,t,n){this.level+=(t-this.level)*(1-Math.exp(-n*(t>this.level?2:4))),this.mat.uniforms.uTime.value=e,this.mat.uniforms.uLevel.value=this.level,this.lines.visible=this.level>.01}},Rg=class{draw;mesh;canvas=document.createElement(`canvas`);ctx;tex;last=``;constructor(e,t,n){this.draw=n,this.canvas.width=this.canvas.height=e,this.ctx=this.canvas.getContext(`2d`),this.tex=new Bi(this.canvas),this.tex.colorSpace=Re,this.tex.minFilter=o,this.mesh=new q(new Xi(t,t),new Gr({map:this.tex,transparent:!0,depthTest:!1,depthWrite:!1,toneMapped:!1})),this.mesh.renderOrder=999,this.mesh.frustumCulled=!1}set(e){e!==this.last&&(this.last=e,this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height),this.draw(this.ctx,this.canvas.width,e),this.tex.needsUpdate=!0)}},zg=`rgba(120, 220, 255, 0.95)`,Bg=class{group=new sn;target;flight;bore;R=4;constructor(){this.target=new Rg(256,.55,(e,t,n)=>{let[r,i]=n.split(`|`);e.strokeStyle=zg,e.lineWidth=6;let a=t*.18,o=t*.14;for(let[n,r,i,s]of[[a,a,1,1],[t-a,a,-1,1],[a,t-a,1,-1],[t-a,t-a,-1,-1]])e.beginPath(),e.moveTo(n+i*o,r),e.lineTo(n,r),e.lineTo(n,r+s*o),e.stroke();e.fillStyle=zg,e.font=`600 22px Inter, system-ui, sans-serif`,e.textAlign=`center`,e.fillText(r??``,t/2,t*.13,t*.96),e.font=`500 20px Inter, system-ui, sans-serif`,e.fillText(i??``,t/2,t*.95,t*.96)}),this.flight=new Rg(128,.16,(e,t)=>{e.strokeStyle=`rgba(160, 255, 170, 0.9)`,e.lineWidth=5,e.beginPath(),e.arc(t/2,t/2,t*.18,0,Math.PI*2),e.stroke();for(let[n,r,i,a]of[[t*.18,t/2,t*.32,t/2],[t*.68,t/2,t*.82,t/2],[t/2,t*.32,t/2,t*.18]])e.beginPath(),e.moveTo(n,r),e.lineTo(i,a),e.stroke()}),this.bore=new Rg(64,.08,(e,t)=>{e.strokeStyle=`rgba(255, 255, 255, 0.55)`,e.lineWidth=3,e.beginPath(),e.moveTo(t*.2,t/2),e.lineTo(t*.8,t/2),e.moveTo(t/2,t*.2),e.lineTo(t/2,t*.8),e.stroke()}),this.bore.set(`+`),this.flight.set(`o`),this.group.add(this.target.mesh,this.flight.mesh,this.bore.mesh),this.group.name=`hud-markers`,this.group.visible=!1}update(e,t,n){let r=(e,t)=>{e.position.copy(t).multiplyScalar(this.R),e.quaternion.copy(new H().setFromUnitVectors(new U(0,0,1),t.clone().negate()))};if(this.bore.mesh.position.set(0,0,-this.R),this.target.mesh.visible=!!e,e){let n=e.clone();if(n.z>-.35){let e=new U(n.x,n.y,0);e.lengthSq()<1e-6&&e.set(0,-1,0),e.normalize(),n.set(e.x*.55,e.y*.4,-.75).normalize()}r(this.target.mesh,n),this.target.set(t)}this.flight.mesh.visible=!!n&&n.z<-.2,n&&this.flight.mesh.visible&&r(this.flight.mesh,n)}},Vg=new Set([`lava`,`hot`,`desert`,`terran`,`ocean`,`ice`]);function Hg(e){return!Number.isFinite(e)||e<=0?``:e<90?`${Math.round(e)} s`:e<5400?`${Math.round(e/60)} min`:e<172800?`${(e/3600).toFixed(1)} h`:e<63e6?`${(e/86400).toFixed(0)} days`:`${(e/31557600).toPrecision(3)} years`}var Ug=class{app;mode=`off`;cockpit=new Cg;ship=new Sg;warpFx=new Lg;hud=new Bg;traffic=new Pg;audio=new dg;missions;warping=!1;time=0;hudTimer=0;docking=null;docked=null;landed=null;dockCooldown=0;constructor(e){this.app=e,e.renderer.rig.add(this.cockpit.group,this.ship.group,this.warpFx.lines,this.hud.group),this.ship.group.position.set(0,-3.4,-22),this.ship.group.visible=!1,e.renderer.scene.add(this.traffic.group),this.missions=new Og(e),this.missions.onComplete=t=>{e.hud.toast(`Mission complete: ${t.title}!`),e.vr.active&&e.vr.flash(`Mission complete: ${t.title}!`),this.audio.chime()}}get active(){return this.mode!==`off`}fovBefore=50;setMode(e){e===`chase`&&this.app.vr.active&&(e=`off`),e===`cockpit`&&this.mode!==`cockpit`&&(this.fovBefore=this.app.rig.fov,this.app.rig.fov=Math.max(this.app.rig.fov,72)),e!==`cockpit`&&this.mode===`cockpit`&&(this.app.rig.fov=this.fovBefore),this.mode=e,this.cockpit.group.visible=e===`cockpit`,this.hud.group.visible=e===`cockpit`,this.ship.group.visible=e===`chase`,this.app.rig.inertia=e===`off`?0:1.2,e===`off`?(this.docked=null,this.docking=null,this.landed=null,this.traffic.setBody(null),this.warping=!1,this.audio.update(0,0,!1)):this.audio.start();let t=e===`off`?`Ship mode off`:e===`cockpit`?`Cockpit view: W/S thrust, mouse to steer, X brake, J warp to the selection, V to switch view`:`Chase view (V: switch)`;this.app.hud.toast(t),this.app.vr.active&&this.app.vr.flash(e===`off`?`Ship mode off`:`In the cockpit: left stick to fly, A to warp`)}cycle(){let e=this.app.vr.active?[`off`,`cockpit`]:[`off`,`cockpit`,`chase`];this.setMode(e[(e.indexOf(this.mode)+1)%e.length])}warp(){let e=this.app.selection;if(!e){this.app.hud.toast(`Select a destination first (click it, or search with Enter)`);return}this.active||this.setMode((this.app.vr.active,`cockpit`)),this.app.vr.active?this.app.vr.travelTo(e):this.app.goTo(e),this.warping=!0,this.app.hud.toast(`Warp drive engaged: ${e.name}`)}update(e){if(this.missions.update(e),!this.active)return;this.time+=e;let t=this.app,n=t.rig;n.autopilot||t.vr.traveling?t.vr.traveling&&(this.warping=!0):this.warping=!1,this.updateLight();let r=n.anchor,i=r instanceof Ag||r instanceof Ng?r.body:r instanceof Yh&&r.kind!==`star`?r:null;this.traffic.setBody(i),this.traffic.update(n.upos,t.clock.jdTdb,e),this.updateDocking(e),this.updateLanding(e);let a=Math.min(1,Math.abs(n.thrust)*(t.input.keys.has(`ShiftLeft`)||t.input.keys.has(`ShiftRight`)?1:.6));this.ship.setThrust(this.warping?1:a),this.warpFx.update(this.time,this.warping&&!t.vr.active?1:0,e),this.audio.update(this.warping?1:a,+!!this.warping,!0),this.hudTimer-=e,this.hudTimer<=0&&this.mode===`cockpit`&&(this.hudTimer=.2,this.fillReadout()),this.cockpit.update(e),this.mode===`cockpit`&&this.updateHud()}updateHud(){let e=this.app,t=e.rig,n=t.quat.clone().invert(),r=e.selection,i=null,a=``;if(r&&!this.docked){let e=r.upos.sub(t.upos,new U),o=e.length();i=e.normalize().applyQuaternion(n),a=`${r.name}|${ql(Math.max(0,o-r.radius))}`}let o=t.vel,s=o.lengthSq()>1e-6&&t.speed>.5?o.clone().normalize().applyQuaternion(n):null;this.hud.update(i,a,s)}holdPoint(e){return e.port().sub(this.app.rig.upos,new U).addScaledVector(e.axis,14)}holdQuat(e){let t=e.axis.clone().negate(),n=Math.abs(t.z)<.9?new U(0,0,1):new U(1,0,0);return new H().setFromRotationMatrix(new G().lookAt(new U,t,n))}updateDocking(e){let t=this.app,n=t.rig,r=[`KeyW`,`KeyS`,`KeyA`,`KeyD`,`KeyR`,`KeyF`].some(e=>t.input.keys.has(e))||Math.abs(n.thrust)>.05;if(this.dockCooldown=Math.max(0,this.dockCooldown-e),this.docked){let e=this.docked;if(r||!this.traffic.stations.includes(e)){this.docked=null,this.dockCooldown=20,n.upos.addVec(e.axis,25),t.hud.toast(`Undocked from ${e.name}`);return}n.upos.addVec(this.holdPoint(e)),n.stop();return}if(this.docking&&r&&this.docking.t>.15&&(this.docking=null,this.dockCooldown=10,t.hud.toast(`Docking cancelled`)),this.docking){let r=this.docking;r.t=Math.min(1,r.t+e/3.5);let i=r.t*r.t*(3-2*r.t),a=this.holdPoint(r.station);n.upos.addVec(a.addScaledVector(r.from,1-i)),n.quat.copy(r.q0).slerp(this.holdQuat(r.station),i),n.stop(),r.t>=1&&(this.docked=r.station,this.docking=null,t.hud.toast(`Docked at ${r.station.name}. Thrust to undock.`),t.vr.active&&t.vr.flash(`Docked at ${r.station.name}`),this.audio.chime());return}if(!(n.autopilot||t.vr.traveling||this.dockCooldown>0))for(let e of this.traffic.stations){let r=n.upos.sub(e.port(),new U),i=r.length();if(!(i>400||i<1)&&r.dot(e.axis)/i>.75&&n.speed<400){let r=this.holdPoint(e);this.docking={station:e,t:0,from:r.negate(),q0:n.quat.clone()},t.hud.toast(`Docking computer engaged: ${e.name}`);break}}}updateLanding(e){let t=this.app,n=t.rig,r=n.anchor;if(this.landed){(r!==this.landed||n.altitude>40)&&(this.landed=null,t.hud.toast(`Lift-off`));return}if((r instanceof Yh&&r.kind!==`star`&&!r.isGasGiant||r instanceof Jf&&Vg.has(r.spec.type))&&!this.docked&&n.altitude<10&&!n.autopilot){this.landed=r,n.stop();let e=n.upos.sub(r.upos,new U).normalize(),i=n.forward(new U),a=i.sub(e.clone().multiplyScalar(i.dot(e))).normalize();a.lengthSq()>.5&&n.quat.setFromRotationMatrix(new G().lookAt(new U,a,e)),t.hud.toast(`Touchdown on ${r.name}!`),t.vr.active&&t.vr.flash(`Touchdown on ${r.name}!`),this.audio.chime()}}fillReadout(){let e=this.app,t=e.rig,n=this.cockpit.readout;n.speed=Jl(t.speed),n.throttle=t.thrust,n.boost=e.input.keys.has(`ShiftLeft`)||e.input.keys.has(`ShiftRight`),n.altitude=ql(t.altitude),n.reference=this.docked?`DOCKED · ${this.docked.name}`:this.landed?`LANDED · ${this.landed.name}`:t.anchor?.name??`deep space`;let r=e.selection;if(r){let e=r.upos.sub(t.upos,new U).length();n.target=r.name,n.targetKind=r.info()[0]?.[1]??r.kind,n.distance=ql(Math.max(0,e-r.radius)),n.eta=this.warping?`warp: arriving in ${Hg(t.gotoRemaining)}`:t.speed>1?`at this speed: ${Hg(e/t.speed)}`:`J: warp there`,n.warp=this.warping?`warping`:`ready`}else n.target=`none`,n.targetKind=`click something to target it`,n.distance=``,n.eta=``,n.warp=`no target`;n.time=`${Cu(e.clock.jdTdb).slice(0,16)} · ${e.clock.paused?`paused`:e.rateText()}`,n.missions=`${this.missions.doneCount} / ${this.missions.total} complete`,n.hint=e.vr.active?`left stick: thrust · A: warp · B: back`:`W/S thrust · X brake · J warp · V view · K missions`}updateLight(){let e=this.app,t=e.rig,n=e.system.sun,r=n.upos.sub(t.upos,new U),i=r.clone().normalize(),a=Math.PI*(Pl/Math.max(r.length(),1))**2,o=n.teff;for(let n of e.near.stars){let e=n.upos.sub(t.upos,new U),r=Xl(n.absMag+5*Math.log10(Math.max(e.length(),1)/Z)-5);r>a&&(a=r,i=e.normalize(),o=n.teff)}gg.uSunDir.value.copy(i),gg.uSun.value=Math.max(0,Math.min(1.3,1+.25*Math.log10(a/Math.PI)));let s=au(o),c=su(s);gg.uSunColor.value.set(s[0]/c,s[1]/c,s[2]/c)}warmupObjects(){return[this.cockpit.group,this.ship.group]}},Wg=class{el;keys=new Set;dragLeft={dx:0,dy:0};dragRight={dx:0,dy:0};wheel=0;down=null;onClick=null;onDoubleClick=null;onKey=null;mouse={x:0,y:0};constructor(e){this.el=e,e.addEventListener(`contextmenu`,e=>e.preventDefault()),e.addEventListener(`pointerdown`,t=>{e.setPointerCapture(t.pointerId),this.down={button:t.button,x:t.clientX,y:t.clientY,moved:!1}}),e.addEventListener(`pointermove`,e=>{if(this.mouse.x=e.clientX,this.mouse.y=e.clientY,!this.down)return;let t=e.movementX,n=e.movementY;Math.abs(e.clientX-this.down.x)+Math.abs(e.clientY-this.down.y)>4&&(this.down.moved=!0),this.down.button===0&&!e.shiftKey?(this.dragLeft.dx+=t,this.dragLeft.dy+=n):(this.dragRight.dx+=t,this.dragRight.dy+=n)}),e.addEventListener(`pointerup`,e=>{this.down&&!this.down.moved&&this.down.button===0&&this.onClick?.(e.clientX,e.clientY,e),this.down=null}),e.addEventListener(`dblclick`,e=>this.onDoubleClick?.(e.clientX,e.clientY)),e.addEventListener(`wheel`,e=>{e.preventDefault(),this.wheel+=Math.sign(e.deltaY)*Math.min(3,Math.abs(e.deltaY)/100+.5)},{passive:!1}),window.addEventListener(`keydown`,e=>{e.target?.tagName!==`INPUT`&&(this.keys.add(e.code),this.onKey?.(e))}),window.addEventListener(`keyup`,e=>this.keys.delete(e.code)),window.addEventListener(`blur`,()=>this.keys.clear())}consume(){let e={left:this.dragLeft,right:this.dragRight,wheel:this.wheel};return this.dragLeft={dx:0,dy:0},this.dragRight={dx:0,dy:0},this.wheel=0,e}get element(){return this.el}},Gg=e=>e.toLowerCase().replace(/[\s_-]+/g,``).replace(/^gliese/,`gj`).replace(/centauri$/,`cen`),Kg=class{archive=[];byName=new Map;systems=new Map;hosts=new Map;links=new Map;claimed=new Map;named=new Map;loaded=!1;async load(e){let t=await fetch(`${e}/exoplanets.json`).then(e=>e.json());this.archive=t.systems,this.archive.forEach((e,t)=>{for(let n of[e.host,...e.ids])this.byName.set(Gg(n),t)}),this.loaded=!0}indexNamed(e){e.list.forEach((e,t)=>{for(let n of e.names){let e=this.byName.get(Gg(n));e!==void 0&&!this.named.has(e)&&this.named.set(e,t)}})}namedHost(e){return this.named.get(e)??null}archiveFor(e){let t=this.links.get(e.key);if(t!==void 0)return t;for(let t of[e.name,...e.designations]){let e=this.byName.get(Gg(t));if(e!==void 0)return e}return null}hostStar(e){let t=this.hosts.get(e);if(t)return t;let n=this.archive[e],r=op(n.ra,n.dec).multiplyScalar(n.distPc),i=n.teff??5500,a=n.vmag===null?Wl-5*Math.log10((n.radSun??1)*(i/5772)**2):n.vmag-5*Math.log10(n.distPc)+5;return t=new fp(`exohost:${e}`,r,a,i,n.spType,[n.host,...n.ids],null),t.exact=!0,this.hosts.set(e,t),t}build(e,t){if(t!==null){let n=this.archive[t],{mass:r}=Kf(e),i=n.massSun??r,a=10**(-.4*(e.absMag-Wl)),o=e.upos.toVector3().normalize(),s=Bf(Vf(n.host))()*Math.PI*2,c=Math.abs(o.z)<.9?new U(0,0,1):new U(1,0,0),l=new U().crossVectors(o,c).normalize().applyAxisAngle(o,s),u=(n.planets[0]?.incDeg??90)*Math.PI/180,d=o.clone().multiplyScalar(Math.cos(u)).addScaledVector(l,Math.sin(u)).normalize();return new Yf(e,n.planets.map(e=>{let t=e.aAU*Pl,r=e.eqTempK??Hf(a,t),o=Uf(e.radiusEarth,r,Bf(Vf(e.name))),s=e.periodDays*zl,c=t<.12*Pl*Math.cbrt(i),l=Bf(Vf(e.name+`/o`)),u=l()*Math.PI*2;return e.tTransit&&(u=Math.PI/2-2*Math.PI*(e.tTransit-2451545)/e.periodDays),{name:e.name,real:!0,est:e.est,aM:t,e:e.e,inc:((e.incDeg??90)-(n.planets[0]?.incDeg??90))*Math.PI/180,node:0,omega:(e.omegaDeg??90)*Math.PI/180,M0:u,periodS:s,radiusM:e.radiusEarth*zf,massKg:(e.massEarth??Gf(e.radiusEarth))*59722e20,teqK:r,type:o,albedo:Wf[o],rings:(o===`giant`||o===`icegiant`)&&l()<.25,seed:l()*1e3,rotS:c?s:(8+40*l())*3600,method:e.method,year:e.year}}),!0,d)}let n=qf(e);if(!n.length)return null;let r=Bf(Vf(e.key+`/plane`)),i=2*r()-1,a=2*Math.PI*r();return new Yf(e,n,!1,new U(Math.sqrt(1-i*i)*Math.cos(a),Math.sqrt(1-i*i)*Math.sin(a),i))}of(e){let t=this.systems.get(e.key);if(t!==void 0)return this.systems.delete(e.key),this.systems.set(e.key,t),t;if(!this.loaded)return null;let n=e.key.startsWith(`exohost:`)?Number(e.key.slice(8)):this.archiveFor(e);n!==null&&this.claimed.set(n,e.key);let r=this.build(e,n);if(this.systems.size>2e3)for(let e of[...this.systems.keys()].slice(0,500))this.systems.delete(e);return this.systems.set(e.key,r),r}claim(e,t){this.links.get(e.key)!==t&&(this.links.set(e.key,t),this.claimed.set(t,e.key),this.systems.delete(e.key))}claimedBy(e){return this.claimed.get(e)??null}findPlanet(e){let t=Gg(e);for(let e=0;e<this.archive.length;e++){let n=this.archive[e].planets.findIndex(e=>Gg(e.name)===t);if(n>=0)return{i:e,k:n}}return null}findHost(e){return this.byName.get(Gg(e))??null}planetName(e,t){return this.archive[e]?.planets[t]?.name??``}archiveSystem(e){return this.of(this.hostStar(e))}search(e,t){let n=[];return!this.loaded||e.length<2||this.archive.forEach((e,r)=>{e.planets.forEach((i,a)=>{let o=t(i.name);o>=0&&n.push({label:i.name,detail:`exoplanet · ${(e.distPc*3.2616).toFixed(0)} ly`,id:`xp:${r}:${a}`,score:o+.15})});let i=t(e.host);i>=0&&n.push({label:e.host,detail:`star with ${e.planets.length} known planet${e.planets.length>1?`s`:``}`,id:`xh:${r}`,score:i+.1})}),n}get archiveCount(){return{systems:this.archive.length,planets:this.archive.reduce((e,t)=>e+t.planets.length,0)}}hostsNear(e,t){let n=[],r=new U;return this.archive.forEach((i,a)=>{Math.abs(i.distPc-e.length())>t+1||(op(i.ra,i.dec,r).multiplyScalar(i.distPc),r.distanceTo(e)<t&&n.push(a))}),n}},qg=[[`planets`,`Planets`],[`moons`,`Moons`],[`small`,`Small`],[`stars`,`Stars`],[`exo`,`Exoplanets`],[`nebulae`,`Nebulae`],[`holes`,`Galaxies`],[`craft`,`Craft`],[`places`,`Places`],[`search`,`Search`],[`settings`,`Settings`]],Jg=[`Orion Nebula`,`Carina Nebula`,`Eagle Nebula`,`Lagoon Nebula`,`Ring Nebula`,`Helix Nebula`,`Crab Nebula`,`Veil Nebula (Cygnus Loop)`,`Tarantula Nebula`,`Pleiades`,`Omega Centauri`,`Hercules Cluster (M13)`],Yg=[`Proxima Cen b`,`TRAPPIST-1 e`,`Kepler-186 f`,`51 Peg b`,`HD 189733 b`,`55 Cnc e`,`eps Eri b`,`TOI-700 d`,`LHS 1140 b`,`K2-18 b`,`Kepler-452 b`,`HR 8799 e`],Xg={lava:[.55,.18,.08],hot:[.62,.55,.5],desert:[.85,.6,.35],terran:[.35,.55,.45],ocean:[.2,.42,.8],ice:[.88,.92,.98],subneptune:[.55,.75,.85],icegiant:[.35,.55,.95],giant:[.85,.72,.55],hotgiant:[.3,.22,.4]},Zg=[`Sagittarius A*`,`M87*`,`Cygnus X-1`,`Gaia BH1`,`Gaia BH2`,`Gaia BH3`,`3A 0620-003`,`GS 2023+338`,`GRS 1915+105`,`XTE J1118+480`,`4U 1543-475`],Qg=[`Andromeda Galaxy`,`Triangulum Galaxy`,`Large Magellanic Cloud`,`Small Magellanic Cloud`,`Whirlpool Galaxy`,`Sombrero Galaxy`,`Centaurus A`,`Pinwheel Galaxy`,`M87`],$g=[`Sun`,`Mercury`,`Venus`,`Earth`,`Moon`,`Mars`,`Jupiter`,`Saturn`,`Uranus`,`Neptune`,`Pluto`,`Ceres`],e_=[`Earth`,`Mars`,`Jupiter`,`Saturn`,`Uranus`,`Neptune`,`Pluto`],t_=[`Highlights`,`Earth`,`Moon`,`Mars`,`Mercury`],n_=[`Mount Everest`,`Grand Canyon`,`Olympus Mons`,`Valles Marineris`,`Apollo 11 landing site`,`Tycho`],r_=[`Proxima Centauri`,`Rigil Kentaurus`,`Sirius`,`Betelgeuse`,`Rigel`,`Vega`,`Polaris`,`Arcturus`,`Antares`,`Aldebaran`,`Canopus`,`Deneb`,`Barnard's Star`,`Tau Ceti`,`Altair`,`Capella`,`Spica`,`Fomalhaut`,`Procyon`,`Mira`],i_=[`Halley`,`Hale-Bopp`,`Churyumov`,`Encke`,`Tempel 1`,`Wild 2`,`Hartley 2`,`Swift-Tuttle`],a_=[`1234567890`,`QWERTYUIOP`,`ASDFGHJKL'`,`ZXCVBNM-/`],o_=class{host;panel;tab=`planets`;moonParent=`Jupiter`;placeGroup=`Highlights`;query=``;thumbs=null;thumbIndex=null;refreshTimer=0;exoList=null;constructor(e,t){this.host=e,this.panel=new pg(1600,1e3,1.3,e=>this.paint(e));let n=new Image;n.onload=()=>{this.thumbs=n,this.panel.dirty=!0},n.src=`${t}/textures/thumbs.jpg`,fetch(`${t}/textures/thumbs.json`).then(e=>e.json()).then(e=>{this.thumbIndex=e,this.panel.dirty=!0}).catch(()=>void 0)}open(e){e&&(this.tab=e),this.panel.setVisible(!0),this.panel.dirty=!0}get isOpen(){return this.panel.visible}tick(e){this.refreshTimer-=e,this.refreshTimer<=0&&(this.refreshTimer=1,this.panel.dirty=!0),this.panel.update()}paint(e){let t=this.host.app;e.rect(4,4,e.width-8,e.height-8,36,$.bg,$.border,4),e.text(`SPACE EXPLORER`,44,62,40,`#ffffff`,700),e.text(Cu(t.clock.jdTdb),560,48,30,$.text,600),e.text(t.clock.paused?`PAUSED`:t.rateText(),560,84,24,t.clock.paused?$.warn:$.accent,500),e.button(`pause`,1080,30,170,64,t.clock.paused?`▶ Play`:`⏸ Pause`,()=>{t.togglePause(),e.dirty=!0},{size:28}),e.button(`close`,1460,26,110,72,`✕`,()=>this.host.closeMenu(),{size:40});let n=(e.width-80+12)/qg.length;qg.forEach(([t,r],i)=>{e.button(`tab:${t}`,40+i*n,122,n-12,76,r,()=>{this.tab=t,e.dirty=!0},{active:this.tab===t,size:24})});let r={x:40,y:222,w:e.width-80,h:e.height-262};switch(this.tab){case`planets`:this.paintGrid(e,r,$g.map(e=>t.findByName(e)).filter(c_),4);break;case`moons`:this.paintMoons(e,r);break;case`small`:this.paintSmall(e,r);break;case`stars`:this.paintGrid(e,r,r_.map(e=>t.findByName(e)).filter(c_).slice(0,16),4,4);break;case`exo`:(!this.exoList||!this.exoList.length)&&(this.exoList=Yg.map(e=>t.findByName(e)).filter(c_)),this.paintGrid(e,r,this.exoList,4,3),this.exoList.length||e.text(`Loading the exoplanet catalogue…`,r.x+20,r.y+40,28,$.dim);break;case`craft`:this.paintGrid(e,r,t.craft.craft.filter(e=>e.valid),4,3);break;case`places`:this.paintPlaces(e,r);break;case`nebulae`:this.paintGrid(e,r,Jg.map(e=>t.findByName(e)).filter(c_),4,3);break;case`holes`:this.paintGrid(e,r,[t.milkyWay,...Qg.map(e=>t.findByName(e)).filter(c_),...Zg.slice(0,6).map(e=>t.blackHoles.find(t=>t.name===e)).filter(c_)],4,4);break;case`search`:this.paintSearch(e,r);break;case`settings`:this.paintSettings(e,r)}}subtitle(e){let t=this.host.app,n=e.upos.sub(t.rig.upos,new U).length();if(e instanceof fp)return`${(n/Fl).toFixed(n<94607304725808e3?2:1)} light years`;if(e instanceof Xh)return`our galaxy, from outside`;if(e instanceof ff)return`on ${e.def.body} · ${e.def.about}`;if(e instanceof s_)return e.about;if(e instanceof bd)return`among the ice of the B ring`;if(e instanceof jh){let e=n/Fl/1e6;return`galaxy · ${e<1?`${Math.round(e*1e3)} thousand ly`:`${e.toFixed(+(e<10))} million ly`}`}if(e instanceof Oh)return`${e.kind} · ${Math.round(n/Fl).toLocaleString()} ly`;if(e instanceof Ih){let r=e.upos.sub(t.system.sun.upos,new U).length()/149597870700;return e.isOrbiter?`Earth orbit · ${ql(n)}`:e.parentObject?`near Earth · ${ql(n)}`:`${r.toFixed(r>10?0:2)} AU from the Sun`}if(e instanceof Jf){let r=e.system.host.upos.sub(t.rig.upos,new U).length()/Fl;return`${e.info()[0][1].replace(/^Exoplanet: /,``).replace(/, found.*$/,``)} · ${r<.01?ql(n):`${r.toFixed(r<10?2:0)} ly`}`}if(e instanceof Kh){let t=n/Fl,r=t>1e6?`${(t/1e6).toFixed(0)} million ly`:t>.01?`${Math.round(t).toLocaleString()} ly`:ql(n);return`${e.supermassive?`${(e.massSun/1e6).toPrecision(3)} million Suns`:`${e.massSun.toFixed(1)} Suns`} · ${r}`}return e instanceof Yh?`${e.kind===`moon`?`moon of ${e.parent?.name}`:e.kind===`star`?`star`:e.kind===`dwarf`?`dwarf planet`:e.kind} · ${ql(n)}`:`${e.kind} · ${ql(n)}`}drawThumb(e,t,n,r,i){let a=e.ctx,o=this.thumbIndex?.bodies[t instanceof ff||t instanceof s_?t.world.name:t instanceof bd?`Saturn`:t.name];if(this.thumbs&&this.thumbIndex&&o){let e=this.thumbIndex.cell;a.drawImage(this.thumbs,o[0]*e,o[1]*e,e,e,n-i,r-i,2*i,2*i);return}if(t instanceof Xh||t instanceof jh&&(t.shape===`spiral`||t.shape===`barred`)){let e=a.createRadialGradient(n,r,0,n,r,i);e.addColorStop(0,`rgba(255,236,200,1)`),e.addColorStop(.25,`rgba(230,200,160,0.8)`),e.addColorStop(1,`rgba(0,0,0,0)`),a.fillStyle=e,a.beginPath(),a.arc(n,r,i,0,Math.PI*2),a.fill(),a.strokeStyle=`rgba(190,200,255,0.55)`,a.lineWidth=i*.09;for(let e of[0,Math.PI]){a.beginPath();for(let t=0;t<1;t+=.02){let o=i*(.18+.75*t),s=e+t*4.2,c=n+o*Math.cos(s),l=r+o*Math.sin(s)*.75;t===0?a.moveTo(c,l):a.lineTo(c,l)}a.stroke()}return}if(t instanceof Kh){let e=t.diskOuter>0?t.supermassive?[255,170,90]:[170,205,255]:[200,200,215],o=a.createRadialGradient(n,r,i*.38,n,r,i);o.addColorStop(0,`rgb(0,0,0)`),o.addColorStop(.08,`rgba(${e.join(`,`)},1)`),o.addColorStop(.3,`rgba(${e.join(`,`)},0.35)`),o.addColorStop(1,`rgba(0,0,0,0)`),a.fillStyle=o,a.beginPath(),a.arc(n,r,i,0,Math.PI*2),a.fill(),a.fillStyle=`#000`,a.beginPath(),a.arc(n,r,i*.4,0,Math.PI*2),a.fill();return}let s=t instanceof fp?l_(t):t instanceof Yh?t.color:t instanceof Jf?Xg[t.spec.type]:t instanceof Ih?[.95,.78,.4]:t instanceof Oh?t.data.kind===`emission`?[1,.35,.45]:t.data.kind===`planetary`?[.4,.95,.9]:t.data.kind===`snr`?[.6,.7,1]:[1,.92,.75]:[.7,.7,.7],c=a.createRadialGradient(n-i*.35,r-i*.35,i*.1,n,r,i),l=e=>`rgb(${Math.round(255*Math.min(1,s[0]*e))},${Math.round(255*Math.min(1,s[1]*e))},${Math.round(255*Math.min(1,s[2]*e))})`,u=t instanceof fp;c.addColorStop(0,l(u?1.2:1)),c.addColorStop(u?.5:.8,l(u?.95:.55)),c.addColorStop(1,u?`rgba(0,0,0,0)`:l(.12)),a.fillStyle=c,a.beginPath(),a.arc(n,r,i,0,Math.PI*2),a.fill()}tile(e,t,n,r,i,a){let o=`go:${t.key}`,s=e.hover===o,c=this.host.app.selection===t;e.rect(n,r,i,a,22,s?$.cardHover:$.card,s?$.accent:c?$.sel:`rgba(255,255,255,0.08)`,s?4:2);let l=Math.min(a*.36,70);this.drawThumb(e,t,n+26+l,r+a/2,l);let u=n+52+2*l;e.text(t.name,u,r+a*.4,34,c?$.sel:$.text,700,`left`,i-(u-n)-16),e.text(this.subtitle(t),u,r+a*.66,22,$.dim,400,`left`,i-(u-n)-16),e.region({id:o,x:n,y:r,w:i,h:a,onClick:()=>{if(t instanceof s_){let e=this.host.app.prepareTour(t.what);e&&this.host.travelTo(e)}else this.host.travelTo(t)}})}paintGrid(e,t,n,r,i=3){let a=(t.w-18*(r-1))/r,o=(t.h-18*(i-1))/i;n.slice(0,r*i).forEach((n,i)=>this.tile(e,n,t.x+i%r*(a+18),t.y+Math.floor(i/r)*(o+18),a,o))}paintPlaces(e,t){let n=this.host.app;t_.forEach((n,r)=>{e.button(`places:${n}`,t.x,t.y+r*104,250,90,n,()=>{this.placeGroup=n,e.dirty=!0},{active:this.placeGroup===n,size:30})});let r;if(this.placeGroup===`Highlights`){let e=n.findByName(`Jupiter`),t=n.findByName(`Moon`);r=[n.findByName(`Saturn's rings`),e?new s_(`shadow`,`Moon shadow on Jupiter`,e,`jumps to the next shadow transit`):null,t?new s_(`eclipse`,`Total lunar eclipse`,t,`3 March 2026, the Moon in Earth's shadow`):null,...n_.map(e=>n.landmarks.find(t=>t.name===e)??null)]}else r=n.landmarks.filter(e=>e.def.body===this.placeGroup);this.paintGrid(e,{x:t.x+280,y:t.y,w:t.w-280,h:t.h},r.filter(c_),3,4)}paintMoons(e,t){let n=this.host.app;e_.forEach((n,r)=>{e.button(`parent:${n}`,t.x,t.y+r*104,250,90,n,()=>{this.moonParent=n,e.dirty=!0},{active:this.moonParent===n,size:30})});let r=n.system.bodies.find(e=>e.name===this.moonParent),i=n.system.bodies.filter(e=>e.kind===`moon`&&e.parent===r&&!e.radiusEstimated).sort((e,t)=>t.radius-e.radius);this.paintGrid(e,{x:t.x+280,y:t.y,w:t.w-280,h:t.h},i,3,4),i.length||e.text(`No moons with measured sizes`,t.x+300,t.y+40,28,$.dim)}paintSmall(e,t){let n=this.host.app,r=n.system.bodies.filter(e=>(e.kind===`dwarf`||e.kind===`asteroid`||e.kind===`tno`)&&!e.radiusEstimated).sort((e,t)=>t.radius-e.radius).slice(0,8),i=[];for(let e of i_){let t=n.small.cometObjects.find(t=>t.name.includes(e));t&&i.length<4&&i.push(t)}this.paintGrid(e,t,[...r,...i],4,3)}paintSearch(e,t){let n=this.host.app;e.rect(t.x,t.y,920,80,18,`rgba(0,0,0,0.45)`,$.accent,3),e.text(this.query?`${this.query}▏`:`Type a name…`,t.x+24,t.y+42,36,this.query?`#ffffff`:$.dim,500),a_.forEach((n,r)=>{let i=t.x+r*22;[...n].forEach((n,a)=>{e.button(`key:${n}`,i+a*92,t.y+104+r*96,88,92,n,()=>this.type(n),{size:36})})});let r=t.y+104+384;e.button(`key:space`,t.x+100,r,480,92,`space`,()=>this.type(` `),{size:30}),e.button(`key:back`,t.x+590,r,200,92,`⌫`,()=>{this.query=this.query.slice(0,-1),e.dirty=!0},{size:36}),e.button(`key:clear`,t.x+800,r,120,92,`clear`,()=>{this.query=``,e.dirty=!0},{size:26});let i=t.x+950,a=t.w-950,o=this.query.trim()?n.searchItems(this.query.trim()).slice(0,8):[];this.query.trim()||e.text(`Planets, 459 moons, asteroids, comets, 12,585 named stars, 6,333 exoplanets, spacecraft, nebulae, clusters, 47 galaxies, 23 black holes`,i+10,t.y+40,24,$.dim,400,`left`,a-20),o.forEach((r,o)=>{e.button(`res:${r.id}`,i,t.y+o*92,a,82,r.label,()=>{let e=n.resolveSearchId(r.id);e&&this.host.travelTo(e)},{sub:r.detail,align:`left`,size:30})})}type(e){this.query.length<28&&(this.query+=e.toLowerCase()===e?e:e.toLowerCase()),this.query.length===1&&(this.query=this.query.toUpperCase()),this.panel.dirty=!0}paintSettings(e,t){let n=this.host.app,r=this.host.settings,i=(n,r)=>(e.text(r,t.x+10,t.y+40+n*104,32,$.text,600),t.y+n*104),a=(t,n,r,i,a,o)=>{e.button(`${t}:a`,n,r,200,80,a[0],()=>{o(!0),e.dirty=!0},{active:i,size:28}),e.button(`${t}:b`,n+214,r,200,80,a[1],()=>{o(!1),e.dirty=!0},{active:!i,size:28})},o=t.x+470;a(`labels`,o,i(0,`Labels`),r.labels,[`On`,`Off`],e=>{r.labels=e}),a(`orbits`,o,i(1,`Orbit lines`),r.orbits,[`On`,`Off`],e=>{r.orbits=e,n.orbits.enabled=e}),a(`travel`,o,i(2,`Travel`),r.travel===`smooth`,[`Fly`,`Blink`],e=>{r.travel=e?`smooth`:`blink`}),a(`turn`,o,i(3,`Turning`),r.turn===`snap`,[`Snap`,`Smooth`],e=>{r.turn=e?`snap`:`smooth`});let s=i(4,`Milky Way`);e.button(`mw:-`,o,s,120,80,`−`,()=>{n.sky.brightness=Math.max(0,n.sky.brightness-.25),e.dirty=!0},{size:40}),e.text(`${Math.round(n.sky.brightness*100)} %`,o+210,s+40,30,$.text,600,`center`),e.button(`mw:+`,o+294,s,120,80,`+`,()=>{n.sky.brightness=Math.min(3,n.sky.brightness+.25),e.dirty=!0},{size:40});let c=i(5,`Stars`);e.button(`st:-`,o,c,120,80,`−`,()=>{n.starMagLimit=Math.max(4,n.starMagLimit-.5),e.dirty=!0},{size:40}),e.text(`mag ${n.starMagLimit.toFixed(1)}`,o+210,c+40,30,$.text,600,`center`),e.button(`st:+`,o+294,c,120,80,`+`,()=>{n.starMagLimit=Math.min(10,n.starMagLimit+.5),e.dirty=!0},{size:40}),a(`ship`,o,i(6,`Spaceship`),n.game.active,[`Cockpit`,`Off`],e=>{n.game.setMode(e?`cockpit`:`off`)});let l=t.x+1e3;e.text(`Time`,l,t.y+40,32,$.text,600);let u=(n,r,i,a)=>e.button(n,l+r%2*260,t.y+80+Math.floor(r/2)*100,245,84,i,()=>{a(),e.dirty=!0},{size:28});u(`t:slow`,0,`◀◀ Slower`,()=>n.timeSlower()),u(`t:fast`,1,`Faster ▶▶`,()=>n.timeFaster()),u(`t:rev`,2,`⇄ Reverse`,()=>n.timeReverse()),u(`t:now`,3,`Now`,()=>n.realTime()),e.button(`exit`,l,t.y+400,505,90,`Exit VR`,()=>this.host.exitVR(),{size:32,color:$.warn});let d=n.game.missions;e.text(`Missions: ${d.doneCount} / ${d.total}`,l,t.y+540,30,$.warn,600),d.list.filter(e=>!e.done).slice(0,4).forEach((n,r)=>e.text(`○ ${n.title}`,l,t.y+590+r*38,24,$.dim,500,`left`,520))}},s_=class{what;name;world;about;kind=`event`;radius=0;parentObject=null;constructor(e,t,n,r){this.what=e,this.name=t,this.world=n,this.about=r}get key(){return`event:${this.what}`}get upos(){return this.world.upos}info(){return[[`Event`,this.about]]}};function c_(e){return e!=null}function l_(e){let t=e.teff||5800;return t>9e3?[.75,.85,1]:t>6500?[.92,.94,1]:t>5200?[1,.95,.85]:t>4e3?[1,.82,.6]:[1,.7,.45]}var u_=30*Math.PI/180,d_=20,f_=.36,p_=24,m_=class{app;supported;session=null;settings={travel:`smooth`,turn:`snap`,labels:!0,orbits:!1};menu;wrist;card;cardObj=null;hands=[];raycaster=new fo;turnArmed=!0;labelPool=[];labelTex=new Map;labelsGroup=new sn;hoverRing;hoverLabel;hoverKey=``;vignette;vig={fade:{value:0},tunnel:{value:0}};travel=null;pendingMenu=!1;flashText=``;flashUntil=0;wristTimer=0;saved={starLimit:7.5,orbits:!0};button=null;constructor(e,t,n){this.app=e,this.supported=t,this.labelsGroup.name=`vr-labels`,this.labelsGroup.visible=!1,e.renderer.scene.add(this.labelsGroup),this.menu=new o_({app:e,settings:this.settings,travelTo:e=>this.travelTo(e),closeMenu:()=>this.menu.panel.setVisible(!1),exitVR:()=>{this.session?.end()}},n),this.menu.panel.setVisible(!1),this.wrist=new pg(900,600,.2,e=>this.paintWrist(e)),this.card=new pg(1e3,660,.56,e=>this.paintCard(e)),this.card.setVisible(!1);for(let t of[this.menu.panel,this.card])e.renderer.rig.add(t.mesh);this.hoverRing=new Rr(new wr({map:h_(),transparent:!0,depthTest:!1,depthWrite:!1,toneMapped:!1})),this.hoverRing.renderOrder=900,this.hoverRing.visible=!1,this.hoverLabel=new Rr(new wr({transparent:!0,depthTest:!1,depthWrite:!1,toneMapped:!1})),this.hoverLabel.renderOrder=901,this.hoverLabel.visible=!1,e.renderer.scene.add(this.hoverRing,this.hoverLabel),this.vignette=new q(new Qi(.25,32,16),new J({uniforms:{uFade:this.vig.fade,uTunnel:this.vig.tunnel},vertexShader:`varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,fragmentShader:`uniform float uFade; uniform float uTunnel; varying vec3 vP; void main(){ float c = -normalize(vP).z; float a = max(uFade, uTunnel * (1.0 - smoothstep(0.62, 0.92, c))); gl_FragColor = vec4(0.0, 0.0, 0.0, a); }`,side:1,transparent:!0,depthTest:!1,depthWrite:!1})),this.vignette.renderOrder=1e4,this.vignette.frustumCulled=!1,this.vignette.visible=!1,e.renderer.camera.add(this.vignette),t&&this.createButton()}static async detect(){if(new URLSearchParams(location.search).get(`xr`)===`0`)return!1;let e=navigator.xr;if(!e)return!1;try{return await Promise.race([e.isSessionSupported(`immersive-vr`),new Promise(e=>setTimeout(()=>e(!1),2500))])}catch{return!1}}get active(){return this.session!==null}get travelling(){return this.travel!==null}createButton(){let e=document.createElement(`button`);e.id=`vr-button`,e.textContent=`ENTER VR`,e.title=`Enter immersive VR`,e.addEventListener(`click`,()=>this.session?this.session.end():this.enter()),document.getElementById(`app`).appendChild(e),this.button=e}async enter(){if(this.session)return;let e=navigator.xr;try{let t=await e.requestSession(`immersive-vr`,{optionalFeatures:[`local-floor`,`bounded-floor`,`hand-tracking`]});await this.app.renderer.gl.xr.setSession(t),this.session=t,t.addEventListener(`end`,()=>this.onEnd()),t.addEventListener(`selectstart`,e=>this.onSelect(e)),this.onStart()}catch(e){console.error(`Could not start VR`,e),this.app.hud.toast(`Could not start VR: ${e instanceof Error?e.message:e}`)}}onStart(){let e=this.app;if(e.renderer.setXrMode(!0),this.saved={starLimit:e.starMagLimit,orbits:e.orbits.enabled},e.starMagLimit=Math.min(e.starMagLimit,6.8),e.orbits.enabled=this.settings.orbits,this.button&&(this.button.textContent=`EXIT VR`),this.hands.length===0)for(let e=0;e<2;e++)this.hands.push(this.makeHand(e));for(let e of this.hands)e.obj.visible=!0,e.grip.visible=!0;this.labelsGroup.visible=!0,this.vignette.visible=!0,this.vig.fade.value=1,this.travel={phase:`enter`,t:0,target:e.selection??e.system.sun},e.warmupPending=!0,this.pendingMenu=!0,this.flash(`Trigger: select · A: fly there · Y: menu`)}onEnd(){this.session=null;let e=this.app,t=e.renderer;t.setXrMode(!1),t.camera.position.set(0,0,0),t.camera.quaternion.identity(),t.camera.scale.set(1,1,1),e.starMagLimit=this.saved.starLimit,e.orbits.enabled=this.saved.orbits;for(let e of this.hands)e.obj.visible=!1,e.grip.visible=!1,e.cursor.visible=!1;this.labelsGroup.visible=!1,this.hoverRing.visible=this.hoverLabel.visible=!1,this.menu.panel.setVisible(!1),this.card.setVisible(!1),this.vignette.visible=!1,this.travel=null,this.pendingMenu=!1,this.button&&(this.button.textContent=`ENTER VR`),window.dispatchEvent(new Event(`resize`))}makeHand(e){let t=this.app.renderer.gl.xr,n=t.getController(e),r=t.getControllerGrip(e),i=new mr;i.setAttribute(`position`,new nr([0,0,0,0,0,-1],3));let a=new Di(i,new yi({color:10274047,transparent:!0,opacity:.7,toneMapped:!1,depthTest:!1}));a.scale.z=4,a.frustumCulled=!1,a.renderOrder=950,n.add(a);let o=new q(new Gi(.008,20),new Gr({color:16777215,transparent:!0,depthTest:!1,toneMapped:!1}));o.renderOrder=1100,o.visible=!1,this.app.renderer.rig.add(o);let s={index:e,obj:n,grip:r,ray:a,cursor:o,handedness:`none`,source:null,prev:[],uiHit:null,hoverObj:null};return n.addEventListener(`connected`,e=>{let t=e.data;s.source=t,s.handedness=t.handedness,a.visible=t.targetRayMode===`tracked-pointer`,t.handedness===`left`&&this.attachWrist(r)}),n.addEventListener(`disconnected`,()=>{s.source=null,s.handedness=`none`,o.visible=!1}),this.app.renderer.rig.add(n,r),s}attachWrist(e){let t=this.wrist.mesh;t.parent!==e&&(t.parent?.remove(t),t.position.set(0,.035,.07),t.rotation.set(-Math.PI/2+.55,0,0),e.add(t))}interactivePanels(){return[this.menu.panel,this.card,this.wrist].filter(e=>e.visible&&e.mesh.parent)}uiRay(e,t){this.raycaster.set(e,t),this.raycaster.far=8;let n=this.interactivePanels().map(e=>e.mesh);for(let e of this.raycaster.intersectObjects(n,!1)){if(!e.uv)continue;let t=e.object.userData.panel;return{panel:t,id:t.regionAt(e.uv)?.id??null,uv:e.uv.clone(),point:e.point,dist:e.distance}}return null}handRay(e){return e.obj.updateMatrixWorld(!0),{origin:new U().setFromMatrixPosition(e.obj.matrixWorld),dir:new U(0,0,-1).transformDirection(e.obj.matrixWorld)}}onSelect(e){let t=e.inputSource,n=this.app.renderer.rig;n.updateMatrixWorld(!0);let r=this.app.renderer.gl.xr.getReferenceSpace(),i=r?e.frame.getPose(t.targetRaySpace,r):void 0,a,o;if(i){let e=new G().fromArray(i.transform.matrix).premultiply(n.matrixWorld);a=new U().setFromMatrixPosition(e),o=new U(0,0,-1).transformDirection(e)}else{let e=this.hands.find(e=>e.source===t);if(!e)return;({origin:a,dir:o}=this.handRay(e))}let s=this.uiRay(a,o);if(s){s.id&&(s.panel.regionAt(s.uv)?.onClick?.(),s.panel.dirty=!0,this.pulse(t,.4,25));return}if(this.travel)return;let c=this.app.pickRay(a,o);if(c&&c===this.app.selection){this.travelTo(c);return}if(!c){this.card.visible?this.card.setVisible(!1):this.app.cancelOrDeselect();return}this.app.select(c),this.showCard(c,o),this.pulse(t,.3,20)}pulse(e,t,n){((e?.gamepad)?.hapticActuators?.[0])?.pulse(t,n).catch(()=>void 0)}toggleMenu(){if(this.menu.isOpen){this.menu.panel.setVisible(!1);return}this.placeInFront(this.menu.panel.mesh,1.25,.22),this.menu.open()}placeInFront(e,t,n,r=0,i){let a=this.app.renderer.camera,o=a.position.clone(),s=i?i.clone():new U(0,0,-1).applyQuaternion(a.quaternion);i||(s.y=0),s.lengthSq()<1e-4&&s.set(0,0,-1),s.normalize(),r&&s.applyAxisAngle(new U(0,1,0),r);let c=o.clone().addScaledVector(s,t);c.y-=n,e.position.copy(c),e.quaternion.setFromRotationMatrix(new G().lookAt(o,c,new U(0,1,0)))}showCard(e,t){this.cardObj=e;let n=t.clone().applyQuaternion(this.app.renderer.rig.quaternion.clone().invert());n.y=Math.max(-.25,Math.min(.25,n.y)),this.menu.isOpen?this.placeInFront(this.card.mesh,1.2,.2,.95):this.placeInFront(this.card.mesh,1.15,.36,0,n),this.card.setVisible(!0),this.card.dirty=!0}get sceneOverlays(){return[this.labelsGroup,this.hoverRing,this.hoverLabel]}get traveling(){return!!this.travel&&this.travel.phase!==`done`}travelTo(e){this.app.select(e),e instanceof Yh&&this.app.bodies.prefetch(e),this.menu.panel.setVisible(!1),this.card.setVisible(!1),this.travel={phase:`out`,t:0,target:e},this.flash(`Flying to ${e.name}`)}arrivalDistance(e){return e instanceof Yh?e.kind===`star`?e.radius*7:e.name===`Saturn`||e.name===`Uranus`?e.radius*4.6:Math.max(e.radius/Math.sin(24*Math.PI/180),3e3):e instanceof fp?Math.max(e.radius*6,2e7):e instanceof Ih?Math.max(e.radius*5,10):e instanceof Jf?e.spec.rings?e.radius*4.6:e.radius/Math.sin(24*Math.PI/180):e instanceof Kh?e.radius*18:e instanceof Xh?e.radius*2.6:e instanceof jh?e.radius*2.4:e instanceof Oh?e.radius*(e.data.kind===`open`?1.6:2.6):e instanceof bd?60:e instanceof $m?Math.max(e.radius,2e3)*40:e instanceof ff?e.def.view:e.radius>0?e.radius*80:3e7}updateTravel(e){let t=this.travel,n=this.app.rig,r=this.vig;if(!t){r.fade.value=Math.max(0,r.fade.value-e*3),r.tunnel.value=Math.max(0,r.tunnel.value-e*2);return}switch(t.t+=e,t.phase){case`out`:if(r.fade.value=Math.min(1,t.t/.16),r.fade.value>=1){let e=this.app.renderer.camera;e.updateMatrixWorld(!0);let r=new U(0,0,-1).applyQuaternion(e.getWorldQuaternion(new H));if(t.target instanceof Kh||t.target instanceof Xh||t.target instanceof jh||t.target instanceof ff||t.target instanceof bd){let e=t.target,r=n.upos.sub(e.upos,new U),i=r.length(),a=e instanceof Kh?e.approachDir(r):e instanceof jh?e.viewDir(r):e instanceof Xh?e.viewDir():e instanceof ff?e.approachDir(this.app.system.sun.upos.sub(e.world.upos,new U).normalize()):e.approachDir();n.upos.copy(e.upos).addVec(a,i)}let i=t.target.upos.sub(n.upos,new U).normalize();n.quat.premultiply(new H().setFromUnitVectors(r,i)).normalize(),this.settings.travel===`blink`?(n.flyTo(t.target,this.arrivalDistance(t.target),.05,!1),t.phase=`jump`):t.phase=`reveal`,t.t=0}return;case`reveal`:r.fade.value=Math.max(0,1-t.t/.25),r.fade.value<=0&&(n.flyTo(t.target,this.arrivalDistance(t.target),void 0,!1),t.phase=`fly`,t.t=0);return;case`fly`:{let i=n.gotoCruising?.6:0;r.tunnel.value+=(i-r.tunnel.value)*Math.min(1,e*4),n.autopilot||(t.phase=`done`,t.t=0);return}case`jump`:n.autopilot||(t.phase=`done`,t.t=0);return;case`enter`:case`done`:if(r.fade.value=Math.max(0,r.fade.value-e*3),r.tunnel.value=Math.max(0,r.tunnel.value-e*2.5),r.fade.value<=0&&r.tunnel.value<=0){let e=t.target,n=t.phase===`enter`;this.travel=null,n&&this.pendingMenu?(this.pendingMenu=!1,this.toggleMenu()):n||this.flash(e.name)}}}updateInput(e){if(!this.session)return;let t=this.app,n=t.rig;t.renderer.rig.updateMatrixWorld(!0);for(let e of this.interactivePanels())e.update();let r=t.renderer.camera.getWorldQuaternion(new H);for(let i of this.hands){let a=i.source;if(!a)continue;if(a.targetRayMode===`tracked-pointer`){let{origin:e,dir:n}=this.handRay(i),r=this.uiRay(e,n);if(r)i.uiHit&&i.uiHit.panel!==r.panel&&i.uiHit.panel.setHover(null),r.panel.setHover(r.id),i.uiHit={panel:r.panel,id:r.id},i.ray.scale.z=Math.max(.01,r.dist),i.cursor.visible=!0,i.cursor.position.copy(t.renderer.rig.worldToLocal(r.point.clone())),i.cursor.quaternion.copy(r.panel.mesh.getWorldQuaternion(new H)).premultiply(t.renderer.rig.quaternion.clone().invert()),i.hoverObj=null;else{i.uiHit&&i.uiHit.panel.setHover(null),i.uiHit=null,i.ray.scale.z=4,i.cursor.visible=!1;let r=this.travel?null:t.pickRayFast(e,n);r&&r!==i.hoverObj&&this.pulse(a,.15,12),i.hoverObj=r}}let o=a.gamepad;if(!o)continue;let s=o.axes.length>=4?[o.axes[2],o.axes[3]]:[o.axes[0]??0,o.axes[1]??0],c=Math.abs(s[0])>.15?s[0]:0,l=Math.abs(s[1])>.15?s[1]:0,u=o.buttons.map(e=>e.pressed),d=e=>!!u[e]&&!i.prev[e],f=(o.buttons[1]?.value??0)>.5;if(i.handedness===`left`){if((c||l)&&!this.travel){let e=i.obj.getWorldQuaternion(new H),t=new U(0,0,-1).applyQuaternion(e),a=new U(0,1,0).applyQuaternion(r),o=new U().crossVectors(t,a).normalize(),s=t.multiplyScalar(-l).add(o.multiplyScalar(c)),u=Math.min(1,Math.hypot(c,l));n.ext.move.copy(s.normalize().multiplyScalar(u*u))}n.ext.boost=f?10:1,d(4)&&(t.togglePause(),this.flash(t.clock.paused?`Time paused`:`Time: ${t.rateText()}`)),d(5)&&this.toggleMenu(),d(3)&&t.realTime()}else i.handedness===`right`&&(f?(n.ext.orbitX=c,n.ext.zoom=l):this.travel||(this.settings.turn===`snap`?Math.abs(c)>.7&&this.turnArmed?(n.turn(-Math.sign(c)*u_),this.turnArmed=!1):Math.abs(c)<.3&&(this.turnArmed=!0):c&&n.turn(-c*e*1.2),l&&(n.speedFactor=Math.min(1e6,Math.max(1e-4,n.speedFactor*Math.exp(-l*e*1.5))))),d(4)&&t.selection&&this.travelTo(t.selection),d(5)&&this.back(),d(3)&&(this.settings.labels=!this.settings.labels,this.flash(`Labels ${this.settings.labels?`on`:`off`}`)));i.prev=u}this.updateTravel(e)}back(){if(this.travel){this.app.rig.cancelGoto(),this.travel={...this.travel,phase:`done`,t:0};return}if(this.card.visible){this.card.setVisible(!1);return}if(this.menu.isOpen){this.menu.panel.setVisible(!1);return}this.app.cancelOrDeselect()}updateOverlays(e,t){this.session&&(this.updateLabels(this.settings.labels&&!this.travel?e:[]),this.updateHover(),this.menu.isOpen&&this.menu.tick(t),this.wristTimer-=t,this.wristTimer<=0&&(this.wristTimer=.5,this.wrist.dirty=!0,this.card.visible&&(this.card.dirty=!0)),this.wrist.update(),this.card.update(),this.app.orbits.enabled=this.settings.orbits)}headPose(){let e=this.app.renderer.camera;return{head:e.getWorldPosition(new U),up:new U(0,1,0).applyQuaternion(e.getWorldQuaternion(new H))}}updateHover(){let e=this.hands.find(e=>e.hoverObj)?.hoverObj??null;if(!e){this.hoverRing.visible=this.hoverLabel.visible=!1,this.hoverKey=``;return}let{head:t,up:n}=this.headPose(),r=e.upos.sub(this.app.rig.upos,new U),i=r.length(),a=r.clone().sub(t).normalize(),o=Math.asin(Math.min(1,e.radius/Math.max(i,e.radius*1.0001))),s=Math.max(o*2.3,2.2*Math.PI/180)*d_;this.hoverRing.position.copy(t).addScaledVector(a,d_),this.hoverRing.scale.set(s,s,1),this.hoverRing.visible=o<1.5*Math.PI/180;let c=`${e.name}  ·  ${ql(i)}`;if(c!==this.hoverKey){this.hoverKey=c;let{tex:t,aspect:n}=this.makeLabel(c,e===this.app.selection?$.sel:`#ffffff`,!0),r=this.hoverLabel.material;r.map?.dispose(),r.map=t,r.needsUpdate=!0,this.hoverLabel.scale.set(f_*1.15*n,f_*1.15,1)}this.hoverLabel.position.copy(this.hoverRing.position).addScaledVector(n,-(s/2+f_*.9)),this.hoverLabel.visible=!0}updateLabels(e){for(let e of this.labelPool)e.visible=!1;let{head:t,up:n}=this.headPose(),r=e.filter(e=>e.rel).sort((e,t)=>t.priority-e.priority).slice(0,p_),i=[],a={planet:`#9cc4ff`,exoplanet:`#8fe3d0`,craft:`#ffd38a`,ship:`#ff9f7a`,nebula:`#ff9fc8`,dwarf:`#ffbe7a`,moon:`#9fe0bb`,star:`#f3e3b0`,comet:`#9feaff`,blackhole:`#d3a6ff`,galaxy:`#ffe2b0`,selected:$.sel},o=0;for(let e of r){let r=e.rel.clone().sub(t).normalize();if(i.some(e=>e.dot(r)>.9992))continue;i.push(r);let s=this.labelPool[o];s||(s=new Rr(new wr({transparent:!0,depthTest:!1,depthWrite:!1,toneMapped:!1})),s.renderOrder=100,s.frustumCulled=!1,this.labelsGroup.add(s),this.labelPool.push(s)),o++;let c=`${e.cls}|${e.text}`,l=this.labelTex.get(c);if(!l){if(l=this.makeLabel(e.text,a[e.cls]??`#d8e2f0`,!1),this.labelTex.size>300){for(let[e,t]of this.labelTex)if(t.tex.dispose(),this.labelTex.delete(e),this.labelTex.size<200)break}this.labelTex.set(c,l)}s.material.map!==l.tex&&(s.material.map=l.tex,s.material.needsUpdate=!0);let u=Math.min(.5,(e.radius||0)*this.app.view.pixelAngle);s.position.copy(t).addScaledVector(r,d_).addScaledVector(n,d_*u+f_*.75),s.scale.set(f_*l.aspect,f_,1),s.visible=!0}}makeLabel(e,t,n){let r=document.createElement(`canvas`),i=r.getContext(`2d`),a=`600 44px Inter, "Segoe UI", system-ui, sans-serif`;i.font=a;let s=Math.ceil(i.measureText(e).width)+(n?56:28);r.width=s,r.height=64,i.font=a,n?(i.fillStyle=`rgba(8, 12, 22, 0.78)`,i.beginPath(),i.roundRect(2,2,s-4,60,30),i.fill(),i.strokeStyle=`rgba(127, 178, 255, 0.55)`,i.lineWidth=2,i.stroke()):(i.shadowColor=`rgba(0, 0, 0, 0.95)`,i.shadowBlur=10),i.fillStyle=t,i.textBaseline=`middle`,i.textAlign=`center`,i.fillText(e,s/2,34);let c=new Bi(r);return c.colorSpace=Re,c.minFilter=o,{tex:c,aspect:s/64}}flash(e){this.flashText=e,this.flashUntil=performance.now()+3e3,this.wrist.dirty=!0,this.app.hud.toast(e)}paintWrist(e){let t=this.app;e.rect(4,4,e.width-8,e.height-8,30,$.bg,$.border,4),e.text(Cu(t.clock.jdTdb),34,50,34,`#ffffff`,600),e.text(t.clock.paused?`PAUSED`:t.rateText(),34,92,28,t.clock.paused?$.warn:$.accent,500);let n=t.selection;if(n){e.text(n.name,34,160,46,$.sel,700,`left`,e.width-60);let r=n.upos.sub(t.rig.upos,new U).length();e.text(`${ql(r)} away`,34,208,28,$.text)}else e.text(`Nothing selected`,34,160,34,$.dim,500);e.text(`Speed ${Jl(t.rig.speed)}`,34,258,26,$.dim),performance.now()<this.flashUntil&&e.text(this.flashText,34,310,28,$.sel,600,`left`,e.width-60),e.button(`w:menu`,24,360,270,100,`MENU`,()=>this.toggleMenu(),{active:this.menu.isOpen,size:34}),e.button(`w:go`,312,360,270,100,`FLY TO`,()=>{t.selection&&this.travelTo(t.selection)},{size:34,disabled:!n}),e.button(`w:time`,600,360,270,100,t.clock.paused?`▶ PLAY`:`⏸ PAUSE`,()=>t.togglePause(),{size:30}),e.text(`Y menu · A fly · B back · X pause`,34,520,24,$.dim)}paintCard(e){let t=this.cardObj;if(!t)return;let n=this.app;e.rect(4,4,e.width-8,e.height-8,30,$.bg,$.border,4),e.text(t.name,40,64,56,$.sel,700,`left`,e.width-200),e.button(`c:close`,e.width-120,22,92,80,`✕`,()=>this.card.setVisible(!1),{size:36});let r=t.upos.sub(n.rig.upos,new U).length(),i=t.info().filter(([e])=>e!==`Distance`).slice(0,5);e.text(`Distance  ${ql(r)}`,40,140,30,$.text,500),i.forEach(([t,n],r)=>{e.text(t,40,192+r*50,28,$.dim,500),e.text(n,330,192+r*50,28,$.text,500,`left`,e.width-370)}),e.button(`c:go`,40,e.height-130,560,100,`Fly to ${t.name}`,()=>this.travelTo(t),{size:36}),e.button(`c:menu`,620,e.height-130,340,100,`Menu`,()=>{this.card.setVisible(!1),this.toggleMenu()},{size:34})}};function h_(){let e=document.createElement(`canvas`);e.width=e.height=128;let t=e.getContext(`2d`);t.strokeStyle=`rgba(255, 242, 122, 0.95)`,t.lineWidth=6,t.beginPath(),t.arc(64,64,56,0,Math.PI*2),t.stroke();let n=new Bi(e);return n.colorSpace=Re,n}var g_=`./data`,__=.02,v_=2,y_=400,b_=[1,10,60,600,3600,21600,zl,7*zl,30.4375*zl,365.25*zl,3652.5*zl,36525*zl],x_=class e{system;catalogs;named;starFields;bodies;orbits;small;near;systems;renderer;input;hud;labels;rig=new sg;clock;selection=null;starMagLimit=7.5;starFloor=.15;logExposure=0;logStarCap=0;lastTime=performance.now();fps=60;hudTimer=0;nearTimer=0;nearestStarDist=1/0;warmupPending=!1;fieldMinDistPc=0;starCache=new Map;camPc=new U;invQuat=new H;view={quat:new H,fovY:50,aspect:1,width:1,height:1,pixelAngle:.001,pixelRatio:1,far:1/0,xr:!1};vr;sky;atmospheres;blackHoles=[];holes;jets;galaxy;procStars;milkyWay=new Xh;exo;game;galaxies;deepSky;craft;tiles;photoMode=!1;labelsBeforePhoto=!0;terrain=new zd;cometTails;nearSystems=[];activeSystems=[];camGal=new U;cssW=1;cssH=1;rateIndex=0;rateSign=1;frameCount=0;constructor(e,t,n,r,i,a,o,s,c,l,u,d,f){this.system=r,this.catalogs=i,this.named=a,this.starFields=o,this.bodies=s,this.orbits=c,this.small=l,this.near=u,this.systems=f,this.renderer=d,this.input=new Wg(e),this.hud=new Bh(t),this.labels=new im(n),this.clock=wu.now()}static async create(t,n,r){let i=await m_.detect(),a=new Gm(t,i),o=new URLSearchParams(location.search).get(`gaia`)!==`0`,s=new Kg,[c,l,u,d,f,p,m,h]=await Promise.all([ig.load(g_),ag.load(`athyg`,`${g_}/stars`),o?ag.load(`gaia`,`${g_}/stars-gaia`):Promise.resolve(null),up.load(`${g_}/stars`),fetch(`${g_}/textures/manifest.json`).then(e=>e.json()),fetch(`${g_}/solar/rings.json`).then(e=>e.json()),fetch(`${g_}/solar/atmospheres.json`).then(e=>e.json()),qh(g_).catch(e=>(console.warn(`black holes`,e),[])),s.load(g_).catch(e=>console.warn(`exoplanets`,e))]),g=f.spectralColors,_=c.bodies.find(e=>e.name===`Titan`);if(_&&g?.titan){let[e,t,n]=g.titan.linearRGB,r=Math.max(e,t,n);_.texture=null,_.color=[e/r,t/r,n/r],_.albedo=g.titan.visualAlbedo,_.meta.albedo=g.titan.visualAlbedo}let v=u?[l,u]:[l],y=new Lm(l),b=[y,...v.slice(1).map(e=>new Lm(e,y.psf))],x=new cf(c,f,`${g_}/textures`,y.psf,p),S=new fm(c),C=new eh(c,y.psf),w=new $f(y.psf,x.surfaceExposure),T=new e(t,n,r,c,v,d,b,x,S,C,w,a,s);s.indexNamed(d);let E=au(c.sun.teff),D=su(E),O=new Uu(c,m,x.surfaceExposure,[E[0]/D,E[1]/D,E[2]/D]);x.atmosphere=e=>O.spec(e);let k=new Jm(`${g_}/sky/milkyway_4k.jpg`);T.sky=k,T.atmospheres=O,T.blackHoles=h,T.holes=new Zu(h,x.surfaceExposure,a.depthMode===`reversed-z`),T.jets=new rm(h),T.galaxy=new Qp,T.procStars=new Hm(y.psf,y.colorLut),T.exo=new Ep(y.psf,x.surfaceExposure),T.tiles=new rh(`${g_}/tiles`,i),T.cometTails=new xf(x.surfaceExposure);let A=c.byId.get(399);T.craft=new ph(await Rh(g_,c.sun,A).catch(e=>(console.warn(`spacecraft`,e),[])),x.surfaceExposure,y.psf);let ee=await Mh(g_).catch(e=>(console.warn(`galaxies`,e),[])),j=ee.find(e=>e.name===`M87`),te=h.find(e=>e.name===`M87*`);j&&te&&j.upos.copy(te.upos),T.galaxies=new yh(ee),T.deepSky=new Eh(await kh(g_).catch(e=>(console.warn(`deep sky`,e),[])),y.psf,y.colorLut,i),new URLSearchParams(location.search).get(`procedural`)===`0`&&(T.procStars.enabled=!1);let M=new URLSearchParams(location.search).get(`mw`);return M!==null&&(k.brightness=Number(M)),a.scene.add(k.mesh,x.group,O.group,S.group,C.group,w.group,T.holes.group,T.jets.group,T.procStars.group,T.exo.group,T.terrain.group,T.cometTails.group,T.craft.group,T.galaxies.group,T.deepSky.group,...b.map(e=>e.group)),await C.load(g_),await c.ephemeris.request(T.clock.jdTdb),T.vr=new m_(T,i,g_),T.game=new Ug(T),x.uploader=e=>a.gl.initTexture(e),T.warmupPending=!0,T.applyUrl(),T.bindKeys(),T.resize(),window.addEventListener(`resize`,()=>T.resize()),T}resize(){let e=this.renderer.canvas;this.cssW=e.clientWidth||window.innerWidth,this.cssH=e.clientHeight||window.innerHeight,this.renderer.setSize(this.cssW,this.cssH,Math.min(window.devicePixelRatio||1,2))}applyUrl(){let e=new URLSearchParams(location.search),t=e.get(`time`);if(t){let e=new Date(t);Number.isNaN(e.getTime())||(this.clock.jdTdb=vu(Su(e)))}e.get(`rate`)&&(this.clock.rate=Number(e.get(`rate`))),e.get(`paused`)===`1`&&(this.clock.paused=!0),e.get(`fov`)&&(this.rig.fov=Number(e.get(`fov`))),e.get(`starlimit`)&&(this.starMagLimit=Number(e.get(`starlimit`))),e.get(`belt`)&&(this.small.boost=Number(e.get(`belt`))),this.system.update(this.clock.jdTdb);let n=e.get(`campc`),r=e.get(`target`),i=e.get(`look`);if(n){let[e,t,r]=n.split(`,`).map(Number);this.rig.upos.set(e*Z,t*Z,r*Z),this.rig.lookAt(new U(-e,-t,-r).normalize())}else if(r){let t=this.findByName(r);if(t){let n=Number(e.get(`dist`)??4)*Math.max(t.radius,1);if(this.placeNear(t,n,Number(e.get(`az`)??35),Number(e.get(`el`)??15)),t instanceof jh&&!e.get(`el`)){let e=t.viewDir(this.rig.upos.sub(t.upos,new U));this.rig.upos.copy(t.upos).addVec(e,n),this.rig.lookAt(e.clone().negate(),t.major)}if(t instanceof Kh&&!e.get(`el`)){let e=t.approachDir(this.rig.upos.sub(t.upos,new U));this.rig.upos.copy(t.upos).addVec(e,n),this.rig.lookAt(e.clone().negate(),t.diskNormal)}this.select(t)}}else{let e=this.system.byId.get(399);this.placeNear(e,3.4*e.radius,35,12),this.select(e)}if(i){let e=this.findByName(i);e&&this.rig.lookAt(e.upos.sub(this.rig.upos,new U).normalize())}let a=e.get(`ship`);(a===`cockpit`||a===`chase`)&&this.game.setMode(a)}placeNear(e,t,n=35,r=15){let i=(e instanceof Jf?e.system.host.upos:this.system.sun.upos).sub(e.upos,new U);i.lengthSq()<1&&i.set(1,0,0),i.normalize();let a=new U(0,0,1),o=new U().crossVectors(i,a).normalize(),s=i.clone().applyAxisAngle(a,n*Math.PI/180).applyAxisAngle(o,r*Math.PI/180);this.rig.upos.copy(e.upos).addVec(s,t),this.rig.lookAt(s.clone().negate(),a),this.rig.setAnchor(e instanceof Yh||e instanceof $m||e instanceof Jf||e instanceof Ih||this.isCompanion(e)?e:null)}isCompanion(e){return!!e&&this.blackHoles.some(t=>t.companion===e)}bindKeys(){this.input.onClick=(e,t)=>{let n=this.pick(e,t);this.select(n)},this.input.onDoubleClick=(e,t)=>{let n=this.pick(e,t);n&&(this.select(n),this.goTo(n))},this.hud.onSearch=e=>this.searchItems(e),this.hud.onSearchPick=e=>{if(e.startsWith(`tour:`)){this.tourAction(e.slice(5));return}let t=this.resolveSearchId(e);t&&(this.select(t),this.goTo(t))},this.input.onKey=e=>{if(this.game?.active&&this.game.audio.start(),!this.hud.searchOpen)switch(e.code){case`Space`:this.togglePause(),e.preventDefault();break;case`BracketRight`:this.timeFaster();break;case`BracketLeft`:this.timeSlower();break;case`Backslash`:this.timeReverse();break;case`Backspace`:this.realTime(),e.preventDefault();break;case`KeyG`:this.selection&&this.goTo(this.selection);break;case`KeyC`:this.selection&&this.center(this.selection);break;case`KeyL`:this.labels.enabled=!this.labels.enabled,this.hud.toast(`Labels ${this.labels.enabled?`on`:`off`}`);break;case`KeyU`:this.photoMode=!this.photoMode,this.hud.setHidden(this.photoMode),this.photoMode?(this.labelsBeforePhoto=this.labels.enabled,this.labels.enabled=!1):this.labels.enabled=this.labelsBeforePhoto,this.hud.toast(this.photoMode?`Photo mode (U to leave, P to save a PNG)`:`Photo mode off`,1.5);break;case`KeyO`:this.orbits.enabled=!this.orbits.enabled,this.hud.toast(`Orbits ${this.orbits.enabled?`on`:`off`}`);break;case`KeyM`:this.orbits.showMinor=!this.orbits.showMinor,this.hud.toast(`Minor-body orbits ${this.orbits.showMinor?`on`:`off`}`);break;case`KeyH`:case`F1`:this.hud.toggleHelp(),e.preventDefault();break;case`KeyP`:this.screenshot();break;case`Enter`:case`Slash`:this.hud.openSearch(),e.preventDefault();break;case`KeyT`:this.hud.openList(`Tour: pick a place (or type to search)`,this.tourItems()),e.preventDefault();break;case`Equal`:case`NumpadAdd`:this.rig.speedFactor*=2;break;case`Minus`:case`NumpadSubtract`:this.rig.speedFactor/=2;break;case`Escape`:this.cancelOrDeselect();break;case`KeyV`:this.game.cycle();break;case`KeyJ`:this.game.warp();break;case`KeyN`:this.game.audio.setEnabled(!this.game.audio.enabled),this.hud.toast(`Sound ${this.game.audio.enabled?`on`:`off`}`);break;case`KeyK`:this.showMissions();break;default:if(/^Digit\d$/.test(e.code)){let t=this.system.byId.get([10,199,299,399,499,599,699,799,899,999][Number(e.code.slice(5))]);t&&(this.select(t),this.goTo(t))}}}}togglePause(){this.clock.paused=!this.clock.paused}timeFaster(){this.rateIndex=Math.min(b_.length-1,this.rateIndex+1),this.clock.rate=this.rateSign*b_[this.rateIndex],this.clock.paused=!1}timeSlower(){this.rateIndex=Math.max(0,this.rateIndex-1),this.clock.rate=this.rateSign*b_[this.rateIndex]}timeReverse(){this.rateSign*=-1,this.clock.rate=this.rateSign*b_[this.rateIndex],this.hud.toast(this.rateSign<0?`Time reversed`:`Time forward`)}realTime(){this.clock.setUtcNow(),this.rateIndex=0,this.rateSign=1,this.clock.rate=1,this.clock.paused=!1,this.hud.toast(`Real time`)}tourItems(){let e=e=>this.landmarks.findIndex(t=>t.name===e),t=(e,t)=>e.findIndex(e=>e.name===t);return[{label:`Inside Saturn's rings`,detail:`float among the ice of the B ring`,id:`place:rings`},{label:`Mount Everest`,detail:`Earth · the top of the world (real elevation data)`,id:`lm:${e(`Mount Everest`)}`},{label:`Grand Canyon`,detail:`Earth · fly down into the canyon`,id:`lm:${e(`Grand Canyon`)}`},{label:`Olympus Mons`,detail:`Mars · the tallest volcano known (real elevation data)`,id:`lm:${e(`Olympus Mons`)}`},{label:`Valles Marineris`,detail:`Mars · a canyon 4,000 km long`,id:`lm:${e(`Valles Marineris`)}`},{label:`Apollo 11 landing site`,detail:`the Moon · fly down and walk`,id:`lm:${e(`Apollo 11 landing site`)}`},{label:`Shackleton crater`,detail:`the Moon's south pole · long shadows`,id:`lm:${e(`Shackleton (lunar south pole)`)}`},{label:`A moon's shadow on Jupiter`,detail:`jumps to the next shadow transit`,id:`tour:shadow`},{label:`Total lunar eclipse`,detail:`3 March 2026 · the Moon in Earth's shadow`,id:`tour:eclipse`},{label:`The brightest comet now`,detail:`coma, tails and its nucleus up close`,id:`tour:comet`},{label:`Proxima Cen b`,detail:`nearest exoplanet · land on it`,id:`tour:proxima`},{label:`Gaia BH1`,detail:`the nearest known black hole`,id:`bh:${t(this.blackHoles.map(e=>({name:e.name})),`Gaia BH1`)}`},{label:`Orion Nebula`,detail:`a star-forming cloud, 1,300 light years`,id:`dso:${t(this.deepSky.objects,`Orion Nebula`)}`},{label:`Andromeda Galaxy`,detail:`2.5 million light years`,id:`gx:${this.galaxies.galaxies.findIndex(e=>e.name.startsWith(`Andromeda`))}`},{label:`The Milky Way from outside`,detail:`our galaxy, 100,000 light years across`,id:`mw:0`}].filter(e=>!/:-1$/.test(e.id))}tourAction(e){let t=this.prepareTour(e);t&&(this.select(t),this.goTo(t))}prepareTour(e){if(e===`proxima`)return this.findByName(`Proxima Cen b`);if(e===`eclipse`)return this.clock.jdTdb=vu(Su(new Date(`2026-03-03T11:33:00Z`))),this.clock.paused=!0,this.hud.toast(`3 March 2026, 11:33 UTC: total lunar eclipse (time paused)`,4),this.vr.active&&this.vr.flash(`Total lunar eclipse, 3 March 2026`),this.findByName(`Moon`);if(e===`shadow`){let e=this.findByName(`Jupiter`),t=[`Io`,`Europa`,`Ganymede`,`Callisto`].map(e=>this.findByName(e)),n=this.clock.jdTdb,r=null;for(let i=0;i<384&&!r;i++){let a=n+i/96;this.system.update(a);let o=this.system.sun.upos.sub(e.upos,new U).normalize();for(let n of t){let t=n.upos.sub(e.upos,new U),i=t.dot(o);if(i>0&&Math.sqrt(t.lengthSq()-i*i)<e.radius*.8){r={jd:a,moon:n.name};break}}}return this.system.update(n),r&&(this.clock.jdTdb=r.jd,this.clock.paused=!0,this.hud.toast(`${r.moon}'s shadow on Jupiter (time paused)`,4),this.vr.active&&this.vr.flash(`${r.moon}'s shadow on Jupiter`)),e}if(e===`comet`){let e=this.system.sun.upos,t=null,n=1/0;for(let r of this.small.cometObjects){if(r.row[8]===null||![`P`,`C`,`I`].includes(r.row[1]))continue;let i=r.upos.sub(e,new U).length()/Pl,a=r.row[8]+(r.row[9]??10)*Math.log10(Math.max(i,.1));i<4&&a<n&&(n=a,t=r)}return t}return null}showMissions(){let e=this.game.missions,t=e.list.map(e=>`${e.done?`✔`:`○`} ${e.title}`).join(`
`),n=e.log.slice(0,5).map(e=>e.name).join(`, `);this.hud.toast(`Missions ${e.doneCount}/${e.total}\n${t}${n?`\nRecently discovered: ${n}`:``}`,9)}cancelOrDeselect(){this.rig.autopilot?this.rig.cancelGoto():this.select(null)}rateText(){let e=Math.abs(this.clock.rate),t=e===1?`real time`:e<60?`${e}×`:e<3600?`${(e/60).toFixed(0)} min/s`:e<86400?`${(e/3600).toFixed(0)} h/s`:e<31557600?`${(e/zl).toFixed(e<604800?0:1)} d/s`:`${(e/(365.25*zl)).toFixed(0)} yr/s`;return`${this.clock.rate<0?`◀ `:``}${t}`}select(e){this.selection=e,this.rig.target=e,this.orbits.selected=e instanceof Yh?e:null,e instanceof fp&&e.resolve(this.named,()=>void 0)}warmUp(){let e=this.bodies.warmupObjects(),t=this.exo.warmupObjects(),n=[e.find(e=>e.name===`Saturn`),t[0]].filter(e=>!!e).map(e=>this.terrain.warmupMesh(e.material)),r=this.atmospheres.warmupObjects()[0];r&&n.push(this.terrain.warmupHaze(r.material));let i=[...e,...n,...this.atmospheres.warmupObjects(),...this.holes.warmupObjects(),...this.near.warmupObjects(),...t,...this.craft.warmupObjects(),...this.game.warmupObjects(),...this.deepSky.warmupObjects()],a=i.map(e=>e.visible);for(let e of i)e.visible=!0;this.renderer.gl.compileAsync(this.renderer.scene,this.renderer.camera).catch(()=>void 0),this.galaxy.compile(this.renderer.gl),i.forEach((e,t)=>{e.visible=a[t]})}goTo(e){if(e instanceof Yh&&this.bodies.prefetch(e),e instanceof Kh){this.rig.flyTo(e,e.radius*30,void 0,!0,e.approachDir(this.rig.upos.sub(e.upos,new U))),this.hud.toast(`Going to ${e.name}`);return}if(e instanceof Xh){this.rig.flyTo(e,e.radius*2.6,void 0,!0,e.viewDir()),this.hud.toast(`Leaving the galaxy`);return}if(e instanceof Oh){this.rig.flyTo(e,e.radius*(e.data.kind===`open`?1.6:2.6)),this.hud.toast(`Going to ${e.name}`);return}if(e instanceof jh){this.rig.flyTo(e,e.radius*2.4,void 0,!0,e.viewDir(this.rig.upos.sub(e.upos,new U))),this.hud.toast(`Going to ${e.name}`);return}let t;if(e instanceof Yh)t=e.kind===`star`?e.radius*8:Math.max(e.radius*3.5,2e3);else if(e instanceof Jf)t=e.radius*3.5;else if(e instanceof Ih)t=Math.max(e.radius*5,10);else if(e instanceof Ng)t=e.radius*6;else if(e instanceof Ag){this.rig.flyTo(e,700,void 0,!0,e.axis.clone()),this.hud.toast(`Going to ${e.name}: fly in slowly to dock`);return}else if(e instanceof fp)t=Math.max(e.radius*4.5,2e7);else if(e instanceof $m)t=Math.max(e.radius,2e3)*40;else if(e instanceof bd){this.rig.flyTo(e,60,void 0,!0,e.approachDir()),this.hud.toast(`Going to ${e.name}`);return}else if(e instanceof ff){this.rig.flyTo(e,e.def.view,void 0,!0,e.approachDir(this.system.sun.upos.sub(e.world.upos,new U).normalize())),this.hud.toast(`Going to ${e.name}`);return}else t=Math.max(e.radius*4,1e6);this.rig.flyTo(e,t),this.hud.toast(`Going to ${e.name}`)}center(e){let t=e.upos.sub(this.rig.upos,new U).normalize();this.rig.lookAt(t)}screenshot(){let e=document.createElement(`a`);e.href=this.renderer.screenshot(),e.download=`space-explorer-${new Date().toISOString().replace(/[:.]/g,`-`)}.png`,e.click(),this.hud.toast(`Screenshot saved`)}ringSpot=null;landmarkCache=new Map;get landmarks(){for(let e of df){if(this.landmarkCache.has(e.name))continue;let t=this.system.bodies.find(t=>t.name===e.body);t&&this.landmarkCache.set(e.name,new ff(e,t))}return[...this.landmarkCache.values()]}findByName(e){let t=e.toLowerCase(),n=this.landmarks.find(e=>e.name.toLowerCase()===t||e.name.toLowerCase().startsWith(`${t} (`));if(n)return n;if(/^(saturn'?s? rings?|rings of saturn|the rings|b ring)$/.test(t)){let e=this.system.bodies.find(e=>e.name===`Saturn`);return e&&(this.ringSpot??=new bd(e,this.system.sun.upos.sub(e.upos,new U).normalize())),this.ringSpot}let r=this.system.bodies.find(e=>e.name.toLowerCase()===t);if(r)return r;let i=this.galaxies.galaxies.find(e=>e.name.toLowerCase()===t||e.data.simbad.toLowerCase().replace(/\s+/g,``)===t.replace(/\s+/g,``)||t===`andromeda`&&e.name.startsWith(`Andromeda`));if(i)return i;let a=this.deepSky.objects.find(e=>e.name.toLowerCase()===t||e.data.simbad.toLowerCase().replace(/\s+/g,``)===t.replace(/\s+/g,``));if(a)return a;let o=this.craft.craft.find(e=>e.name.toLowerCase()===t||t===`iss`&&e.name.startsWith(`International`)||t===`jwst`&&e.name.startsWith(`James`)||t===`hubble`&&e.name.startsWith(`Hubble`));if(o)return o.update(this.clock.jdTdb),o;let s=this.small.cometObjects.find(e=>e.name.toLowerCase().includes(t));if(s)return s;let c=this.blackHoles.find(e=>e.name.toLowerCase()===t||e.data.aliases.some(e=>e.toLowerCase()===t));if(c)return c;let l=this.procStars.find(e);if(l)return l;if(t===`milky way`||t===`galaxy`||t===`the galaxy`)return this.milkyWay;let u=this.systems.findPlanet(e);if(u)return this.exoPlanet(u.i,u.k);let d=this.named.list.find(e=>e.names.some(e=>e.toLowerCase()===t));if(d)return this.getStar(this.catalog,d.node,d.slot);let f=this.systems.findHost(e);if(f!==null)return this.exoHost(f);let p=/^(.+)\s([b-k])$/i.exec(e.trim());if(p){let e=this.findByName(p[1]),n=e instanceof fp?this.systems.of(e):null,r=n?.planets.find(e=>e.name.toLowerCase()===t);if(n&&r)return n.update(this.clock.jdTdb),r}return null}searchItems(e){let t=e.toLowerCase(),n=[],r=e=>{let n=e.toLowerCase();return n===t?0:n.startsWith(t)?1+n.length/100:n.includes(t)?2+n.length/100:-1};for(let e of this.system.bodies){let t=r(e.name);t>=0&&n.push({label:e.name,detail:e.kind===`moon`?`moon of ${e.parent?.name}`:e.kind,id:`body:${e.id}`,score:t-(e.kind===`planet`?.5:0)})}this.small.cometObjects.forEach((e,t)=>{let i=r(e.name);i>=0&&n.push({label:e.name,detail:`comet`,id:`comet:${t}`,score:i+.2})});{let e=Math.min(...[`Milky Way`,`galaxy`].map(r).filter(e=>e>=0));Number.isFinite(e)&&n.push({label:`Milky Way`,detail:`our galaxy, seen from outside`,id:`mw:0`,score:e-.2})}this.blackHoles.forEach((e,t)=>{let i=[e.name,...e.data.aliases,`black hole`],a=Math.min(...i.map(r).filter(e=>e>=0));Number.isFinite(a)&&n.push({label:e.name,detail:e.supermassive?`supermassive black hole`:`black hole`,id:`bh:${t}`,score:a-.1}),e.companion&&r(e.companion.name)>=0&&n.push({label:e.companion.name,detail:`star orbiting a black hole`,id:`bhc:${t}`,score:r(e.companion.name)+.3})});for(let e of this.named.list){let t=-1;for(let n of e.names){let e=r(n);e>=0&&(t<0||e<t)&&(t=e)}t>=0&&n.push({label:e.names[0],detail:`star · ${e.names.slice(1,3).join(`, `)}`,id:`star:${e.index}`,score:t+(e.proper?0:.3)})}n.push(...this.systems.search(e,r)),this.deepSky.objects.forEach((e,t)=>{let i=Math.min(...[e.name,e.data.simbad,e.data.simbad.replace(/\s+/g,``),e.kind].map(r).filter(e=>e>=0));Number.isFinite(i)&&n.push({label:e.name,detail:`${e.data.kind===`open`||e.data.kind===`globular`?`${e.data.kind} cluster`:`nebula`} · ${Math.round(e.data.distPc*3.2616).toLocaleString()} ly`,id:`dso:${t}`,score:i+.02})}),this.galaxies.galaxies.forEach((e,t)=>{let i=Math.min(...[e.name,e.data.simbad,e.data.simbad.replace(/\s+/g,``),`galaxy`].map(r).filter(e=>e>=0));Number.isFinite(i)&&n.push({label:e.name,detail:`galaxy · ${(e.data.distPc*3.2616/1e6).toFixed(e.data.distPc<3e5?2:1)} million ly`,id:`gx:${t}`,score:i+(e.name===`Milky Way`?0:.05)})});{let e=Math.min(...[`Saturn's rings`,`Saturn rings`,`rings`,`B ring`].map(r).filter(e=>e>=0));Number.isFinite(e)&&n.push({label:`Saturn's rings`,detail:`fly into the B ring, among its ice`,id:`place:rings`,score:e+.1})}return this.landmarks.forEach((e,t)=>{let i=Math.min(...[e.name,e.def.body,`landing`,`place`].map(r).filter(e=>e>=0));Number.isFinite(i)&&n.push({label:e.name,detail:`place on ${e.def.body}`,id:`lm:${t}`,score:i+.15})}),this.craft.craft.forEach((e,t)=>{let i=Math.min(...[e.name,`spacecraft`,`probe`].map(r).filter(e=>e>=0));Number.isFinite(i)&&n.push({label:e.name,detail:`spacecraft`,id:`sc:${t}`,score:i-.1})}),n.sort((e,t)=>e.score-t.score),n.slice(0,14)}resolveSearchId(e){let[t,n]=e.split(`:`);if(t===`body`)return this.system.byId.get(Number(n))??null;if(t===`comet`)return this.small.cometObjects[Number(n)]??null;if(t===`bh`)return this.blackHoles[Number(n)]??null;if(t===`mw`)return this.milkyWay;if(t===`bhc`)return this.blackHoles[Number(n)]?.companion??null;if(t===`star`){let e=this.named.list[Number(n)];return this.getStar(this.catalog,e.node,e.slot)}return t===`xh`?this.exoHost(Number(n)):t===`sc`?this.craft.craft[Number(n)]??null:t===`gx`?this.galaxies.galaxies[Number(n)]??null:t===`dso`?this.deepSky.objects[Number(n)]??null:t===`xp`?this.exoPlanet(Number(n),Number(e.split(`:`)[2])):t===`place`&&n===`rings`?this.findByName(`Saturn's rings`):t===`lm`?this.landmarks[Number(n)]??null:null}exoHost(e){let t=this.systems.namedHost(e);if(t!==null){let n=this.named.list[t],r=this.getStar(this.catalog,n.node,n.slot);return this.systems.claim(r,e),r}return this.systems.hostStar(e)}exoPlanet(e,t){let n=this.systems.of(this.exoHost(e));if(!n)return null;let r=this.systems.planetName(e,t),i=n.planets.find(e=>e.name===r)??n.planets[t]??null;return i&&n.update(this.clock.jdTdb),i}project(e){let t=e.clone().applyQuaternion(this.invQuat);if(t.z>=0)return null;let n=Math.tan(this.view.fovY*Math.PI/360),r=this.view.aspect,i=t.x/-t.z/(n*r),a=t.y/-t.z/n;return{x:(i*.5+.5)*this.view.width,y:(-a*.5+.5)*this.view.height}}chooseAnchor(){let e=null,t=1/0,n=new U;for(let r of this.system.bodies){if(!r.valid)continue;let i=r.soiRadius();i>=t||r.upos.sub(this.rig.upos,n).length()<i&&(e=r,t=i)}for(let e of this.game.traffic.stations)if(e.upos.sub(this.rig.upos,n).length()<3e3){this.rig.setAnchor(e);return}for(let e of this.game.traffic.ships)if(e.upos.sub(this.rig.upos,n).length()<e.radius*300){this.rig.setAnchor(e);return}for(let e of this.craft.views)if(e.dist<Math.max(300*e.craft.radius,2e3)){this.rig.setAnchor(e.craft);return}if(!e){let e=null,t=1/0;for(let n of this.exo.views)n.dist<n.planet.hill&&n.dist<t&&(e=n.planet,t=n.dist);if(e){this.rig.setAnchor(e);return}}let r=this.selection;if(r instanceof $m&&r.upos.sub(this.rig.upos,n).length()<1e9){this.rig.setAnchor(r);return}if(r&&this.isCompanion(r)&&r.upos.sub(this.rig.upos,n).length()<r.radius*60){this.rig.setAnchor(r);return}this.rig.setAnchor(e)}computeAltitude(){let e=1/0,t=new U,n=this.terrain.owner,r=this.terrain.below(this.rig.upos);r&&(e=r.dist-r.ground);for(let r of this.system.bodies){if(!r.valid||r===n)continue;let i=r.upos.sub(this.rig.upos,t).length()-r.radius;i<e&&(e=i)}this.selection instanceof $m&&(e=Math.min(e,this.selection.upos.sub(this.rig.upos,t).length()-Math.max(this.selection.radius,2e3))),e=Math.min(e,this.nearestStarDist);for(let t of this.exo.views)t.planet!==n&&(e=Math.min(e,t.dist-t.planet.radius));for(let t of this.craft.views)e=Math.min(e,t.dist-t.craft.radius);for(let n of this.game.traffic.stations)e=Math.min(e,n.upos.sub(this.rig.upos,t).length()-n.radius*.5);for(let n of this.blackHoles)e=Math.min(e,n.upos.sub(this.rig.upos,t).length()-n.radius),n.companion&&(e=Math.min(e,n.companion.upos.sub(this.rig.upos,t).length()-n.companion.radius));return Math.max(e,.5)}get catalog(){return this.catalogs[0]}getStar(e,t,n){let r=`star:${e.id}:${t}:${n}`,i=this.starCache.get(r),a=e.nodes[t],o=e===this.catalog?this.named.byNodeSlot.get(`${t}:${n}`):void 0;if(!i){let t={catalog:e,node:a,slot:n};a.state===`ready`?(i=new fp(r,e.starPosition(t),e.starAbsMag(t),o?.teff??e.starTeff(t),o?.spect??``,o?.names??[],t),i.exact=!0):i=new fp(r,o.pos.clone(),o.absMag,o.teff,o.spect,o.names,t),o||i.resolve(this.named,()=>void 0),this.starCache.set(r,i)}else if(!i.exact&&a.state===`ready`){let t=i.upos.clone();i.setPosition(e.starPosition({catalog:e,node:a,slot:n})),i.exact=!0;let r=i.upos.sub(t,new U),o=t.sub(this.rig.upos,new U).length();this.rig.anchor!==i&&r.lengthSq()>0&&o<Math.max(1e3*i.radius,50*r.length())&&this.rig.upos.addVec(r,1)}return i}updateNearStars(){let e=1/0;for(let t of this.named.list){let n=t.pos.distanceTo(this.camPc);n<e&&(e=n)}let t=this.catalogs.flatMap(t=>t.nearest(this.camPc,Math.max(__,Math.min(1,e)),12)).sort((e,t)=>e.dist-t.dist).slice(0,12),n=t.length?t[0].dist:1/0,r=Math.max(__,Math.min(1,e)),i=t.find(e=>e.dist>__),a=i?i.dist:t.length<12?r:__;this.fieldMinDistPc=Math.min(a,e>__?e:a)*.5,this.nearestStarDist=Math.min(e,n)*Z;let o=[];for(let{ref:e,dist:n}of t){if(n>__)break;let t=this.getStar(e.catalog,e.node.id,e.slot);o.push(t),this.nearestStarDist=Math.min(this.nearestStarDist,n*Z-t.radius)}for(let e of this.blackHoles)e.companion&&e.companion.upos.sub(this.rig.upos,new U).length()<v_*0x6da012f95c9e88&&o.push(e.companion);for(let{star:e,dist:t}of this.procStars.nearest(this.camPc,1,12))this.nearestStarDist=Math.min(this.nearestStarDist,t*Z-e.radius),t<__&&o.push(e);let s=[];for(let e of o){if(this.isCompanion(e))continue;let t=this.systems.of(e);t&&s.push(t)}let c=new U;for(let e of this.systems.hostsNear(this.camPc,__)){let t=this.systems.hostStar(e),n=this.systems.claimedBy(e);if(n&&o.some(e=>e.key===n))continue;let r=o.find(e=>!this.isCompanion(e)&&e.upos.sub(t.upos,c).length()<925703274447410.1&&Math.abs(e.absMag-t.absMag)<1.5);if(r){this.systems.claim(r,e);let t=s.findIndex(e=>e.host===r),n=this.systems.of(r);t>=0&&s.splice(t,1),n&&s.push(n);continue}o.push(t),this.nearestStarDist=Math.min(this.nearestStarDist,t.upos.sub(this.rig.upos,c).length()-t.radius);let i=this.systems.of(t);i&&s.push(i)}this.near.stars=o,this.nearSystems=s}exoShown(e){return e.pixelRadius>=.8||e.planet===this.selection||e.planet.system.host.upos.sub(this.rig.upos,new U).length()<Math.max(400*Pl,e.planet.spec.aM*25)}craftShown(e){if(e.pixelRadius>.5||e.craft===this.selection)return!0;let t=e.craft.isOrbiter?3e7:e.craft.parentObject?5e9:.3*Pl;return e.dist<t}updateActiveSystems(){let e=[...this.nearSystems];for(let t of[this.selection,this.rig.target]){let n=null;t instanceof Jf?n=t.system:t instanceof fp&&!this.isCompanion(t)&&t.upos.sub(this.rig.upos,new U).length()<0x36d0097cae4f44&&(n=this.systems.of(t)),n&&!e.includes(n)&&e.push(n)}this.activeSystems=e}skyRadiance(){let e=0,t=new U,n=(t,n,r,i)=>{let a=Math.min(1,Math.max(0,(n.dot(r)+.1)/.2));e=Math.max(e,i/Math.PI*Math.min(1,t)*a*a*(3-2*a))};for(let e of this.bodies.views.values()){if(!e.resolved||e.body.kind===`star`)continue;let r=this.atmospheres.spec(e.body);if(!r||e.dist>e.body.radius+r.top*.5)continue;let i=t.copy(e.rel).negate().normalize(),a=this.system.sun.upos.sub(e.body.upos,new U),o=a.length();n(r.betaR[1]*r.HR,i.clone(),a.divideScalar(o),$l(o))}for(let e of this.exo.atmospheres())e.rel.length()>e.radius+e.spec.top*.5||n(e.spec.betaR[1]*e.spec.HR,e.rel.clone().negate().normalize(),e.sunDir,e.sunIrr);return e}ringRadiance(){let e=this.bodies.ringParticles,t=this.system.bodies.find(e=>e.name===`Saturn`);return!e?.mesh.visible||!t?0:.6*$l(Math.max(t.pos.distanceTo(this.system.sun.pos),1))/Math.PI}bigCoverage(e,t){let n=e.length(),r=Math.asin(Math.min(1,t/Math.max(n,t)));if(r<.35)return 0;let i=e.angleTo(new U(0,0,-1).applyQuaternion(this.view.quat)),a=this.view.fovY*Math.PI/360;return Math.max(0,Math.min(1,(r+a-i)/(2*a)))}updateExposure(e){let t=(this.view.pixelAngle*this.view.pixelRatio)**2,n=.01*t/Xl(this.starMagLimit),r=0,i=1,a=.45,o=this.view.width*this.view.height;for(let e of this.bodies.views.values()){if(!e.resolved||e.pixelRadius<2)continue;let t=this.bigCoverage(e.rel,e.body.radius);if(t===0){let n=this.project(e.rel);if(!n)continue;let r=e.pixelRadius/this.view.pixelRatio;if(n.x<-r||n.y<-r||n.x>this.view.width+r||n.y>this.view.height+r)continue;t=Math.min(1,Math.PI*r*r/o)}let n=S_(.0015,.08,t);if(n<=r)continue;let s=e.body,c=s.kind===`star`?(Pl/Kl)**2:Math.min(1,1.5*s.albedo)*$l(Math.max(s.pos.distanceTo(this.system.sun.pos),1))/Math.PI*(this.bodies.sunlit.get(s)??1);r=n,i=c,a=s.kind===`star`?1.1:.45}for(let e of this.craft.views){if(e.pixelRadius<2)continue;let t=this.project(e.rel),n=e.pixelRadius/this.view.pixelRatio;if(!t||t.x<-n||t.y<-n||t.x>this.view.width+n||t.y>this.view.height+n)continue;let s=S_(.0015,.08,Math.min(1,Math.PI*n*n/o)),c=.6*$l(Math.max(e.craft.upos.sub(this.system.sun.upos,new U).length(),1))/Math.PI;s>r&&(r=s,i=c,a=.45)}let s=this.cometTails.nucleusView;if(s){let e=this.project(s.rel),t=Math.asin(Math.min(1,s.radius/Math.max(s.rel.length(),s.radius)))/this.view.pixelAngle/this.view.pixelRatio;if(e&&t>2){let e=S_(.0015,.08,Math.min(1,Math.PI*t*t/o));e>r&&(r=e,i=s.radiance,a=.45)}}for(let e of this.exo.views){if(e.pixelRadius<2)continue;let t=this.bigCoverage(e.rel,e.planet.radius);if(t===0){let n=this.project(e.rel),r=e.pixelRadius/this.view.pixelRatio;if(!n||n.x<-r||n.y<-r||n.x>this.view.width+r||n.y>this.view.height+r)continue;t=Math.min(1,Math.PI*r*r/o)}let n=S_(.0015,.08,t);n>r&&e.radiance>0&&(r=n,i=e.radiance,a=.45)}let c=this.ringRadiance();if(c>0){let e=S_(.0015,.08,.12);e>r&&(r=e,i=c,a=.45)}for(let e of this.holes.views){if(!e.diskRadiance)continue;let t=this.project(e.rel),n=e.innerDiskPx/this.view.pixelRatio;if(!t||t.x<-n||t.y<-n||t.x>this.view.width+n||t.y>this.view.height+n)continue;let s=S_(.0015,.08,Math.min(1,Math.PI*n*n/o));s>r&&(r=s,i=e.diskRadiance,a=.8)}for(let e of this.near.stars){let t=e.upos.sub(this.rig.upos,new U),n=t.length(),s=Math.asin(Math.min(1,e.radius/n))/this.view.pixelAngle/this.view.pixelRatio,c=S_(.0015,.08,Math.min(1,Math.PI*s*s/o));c>r&&this.project(t)&&(r=c,i=Xl(e.absMag+5*Math.log10(n/Z)-5)*n*n/(Math.PI*e.radius*e.radius),a=1.1)}let l=Math.log(n),u=r>0?Math.min(l,l+(Math.log(a/i)-l)*r):l,d=1/0,f=1/0,p=e=>{let t=this.project(e);return!!t&&t.x>-40&&t.y>-40&&t.x<this.view.width+40&&t.y<this.view.height+40};for(let e of this.bodies.views.values()){if(!e.resolved||e.pixelRadius<=1.5||!p(e.rel)&&this.bigCoverage(e.rel,e.body.radius)<.02)continue;let t=e.body;t.kind===`star`?f=Math.min(f,1.8/(Pl/Kl)**2):d=Math.min(d,1.6/(Math.min(1,1.5*t.albedo)*$l(Math.max(t.pos.distanceTo(this.system.sun.pos),1))/Math.PI*(this.bodies.sunlit.get(t)??1)))}for(let e of this.craft.views)e.pixelRadius<=1.5||!p(e.rel)||(d=Math.min(d,1.6/(.6*$l(Math.max(e.craft.upos.sub(this.system.sun.upos,new U).length(),1))/Math.PI)));let m=this.cometTails.nucleusView;m&&p(m.rel)&&(d=Math.min(d,1.6/m.radiance));for(let e of this.exo.views)e.pixelRadius<=1.5||e.radiance<=0||!p(e.rel)&&this.bigCoverage(e.rel,e.planet.radius)<.02||(d=Math.min(d,1.6/e.radiance));c>0&&(d=Math.min(d,1.6/c));for(let e of this.holes.views){if(!e.diskRadiance||e.innerDiskPx<=1.5||!p(e.rel))continue;let t=e.innerDiskPx/this.view.pixelRatio,n=S_(.0015,.08,Math.min(1,Math.PI*t*t/o));d=Math.min(d,2/(e.diskRadiance*Math.max(n,1e-6)))}for(let e of this.near.stars){let t=e.upos.sub(this.rig.upos,new U);if(!p(t))continue;let n=t.length();if(Math.asin(Math.min(1,e.radius/n))/this.view.pixelAngle<=1.5)continue;let r=Xl(e.absMag+5*Math.log10(n/Z)-5);f=Math.min(f,1.4/(r*n*n/(Math.PI*e.radius*e.radius)))}let h=this.skyRadiance();h>0&&(f=Math.min(f,1.2/h)),u=Math.min(u,Math.log(d),Math.log(f)),this.frameCount<3&&(this.logExposure=u),this.logExposure+=(u-this.logExposure)*(1-Math.exp(-e*2.5));let g=Math.exp(this.logExposure);this.logStarCap+=(Math.log(Math.min(f,1e30))-this.logStarCap)*(1-Math.exp(-e*2.5)),this.frameCount<3&&(this.logStarCap=Math.log(Math.min(f,1e30)));let _=Math.max(g,Math.min(n*this.starFloor,Math.exp(this.logStarCap))),v=this.starFields[0].psf.uMinEnergy.value;return{xStar:_,xSurf:g,mLim:Zl(v*t/_),xDark:n}}pick(e,t){let n=null,r=1/0,i=(i,a,o,s)=>{if(!a)return;let c=Math.hypot(a.x-e,a.y-t);if(c>Math.max(o,9))return;let l=c+s;l<r&&(r=l,n=i)},a=this.lastMLim;for(let e of this.bodies.views.values())!e.resolved&&e.apparentMag>a+1.5||i(e.body,this.project(e.rel),e.pixelRadius/this.view.pixelRatio,e.resolved?-6:-3);let o=new U;for(let e of this.small.cometObjects)e.apparentMag>a||i(e,this.project(e.upos.sub(this.rig.upos,o)),0,0);for(let e of this.exo.views)this.exoShown(e)&&i(e.planet,this.project(e.rel),e.pixelRadius/this.view.pixelRatio,e.pixelRadius>2?-6:-3);for(let e of this.craft.views)this.craftShown(e)&&i(e.craft,this.project(e.rel),e.pixelRadius/this.view.pixelRatio,-5);for(let e of this.galaxies.views)e.pixelRadius>=2.5&&i(e.galaxy,this.project(e.rel),Math.min(e.pixelRadius/this.view.pixelRatio,80),2);for(let e of this.deepSky.views)e.pixelRadius>=3&&e.dist>e.obj.radius&&i(e.obj,this.project(e.rel),Math.min(e.pixelRadius/this.view.pixelRatio,80),1.5);for(let e of[...this.game.traffic.ships,...this.game.traffic.stations]){let t=e.upos.sub(this.rig.upos,new U);t.length()<2e6&&i(e,this.project(t),Math.atan2(e.radius,t.length())/this.view.pixelAngle/this.view.pixelRatio,-4)}for(let e of this.near.stars)i(e,this.project(e.upos.sub(this.rig.upos,o)),0,-2);for(let{bh:e,rel:t,shadowPx:n}of this.labelledHoles())i(e,this.project(t),n/this.view.pixelRatio,-4);if(n)return n;let s=null,c=this.camPc;for(let n of this.catalogs)for(let i of n.needed){let l=n.cpuPositions(i);if(l&&i.absMag)for(let u=0;u<i.drawCount;u++){o.set(l[u*3]-c.x,l[u*3+1]-c.y,l[u*3+2]-c.z);let d=o.length();if(d<__)continue;let f=i.absMag[u]+5*Math.log10(d)-5;if(f>a)continue;let p=this.project(o);if(!p)continue;let m=Math.hypot(p.x-e,p.y-t);if(m>9)continue;let h=m+.4*f;h<r&&(r=h,s={cat:n,node:i.id,slot:u})}}let l=null;return this.procStars.forEachVisible(c,a,(n,i,a)=>{if(n.length()<__)return;let o=this.project(n);if(!o)return;let s=Math.hypot(o.x-e,o.y-t);if(s>9)return;let c=s+.4*i;c<r&&(r=c,l=a)}),l?l():s?this.getStar(s.cat,s.node,s.slot):null}lastMLim=6;pickRay(e,t){let n=t.clone().normalize(),r=this.rayHitBody(e,n);if(r)return r;let i=1.5*Math.PI/180,a=null,o=1/0,s=new U,c=t=>{s.copy(t).sub(e);let r=s.length();return{ang:Math.acos(Math.max(-1,Math.min(1,s.dot(n)/r))),len:r}},l=(e,t,n,r)=>{let{ang:s,len:l}=c(t),u=Math.asin(Math.min(1,n/Math.max(l,n*1.0001)));if(s>Math.max(i,u))return;let d=s/i+r;d<o&&(o=d,a=e)},u=this.lastMLim;for(let e of this.bodies.views.values())!e.resolved&&e.apparentMag>u+1.5||l(e.body,e.rel,e.body.radius,e.resolved?-1:-.3);let d=new U;for(let e of this.small.cometObjects)e.apparentMag>u||l(e,e.upos.sub(this.rig.upos,d).clone(),e.radius,0);for(let e of this.exo.views)this.exoShown(e)&&l(e.planet,e.rel,e.planet.radius,e.pixelRadius>2?-1:-.3);for(let e of this.craft.views)this.craftShown(e)&&l(e.craft,e.rel,e.craft.radius,-.6);for(let e of this.galaxies.views)e.pixelRadius>=2.5&&l(e.galaxy,e.rel,e.galaxy.radius*.5,.5);for(let e of this.deepSky.views)e.pixelRadius>=3&&e.dist>e.obj.radius&&l(e.obj,e.rel,e.obj.radius*.6,.4);for(let e of[...this.game.traffic.ships,...this.game.traffic.stations]){let t=e.upos.sub(this.rig.upos,new U);t.length()<2e6&&l(e,t,e.radius,-.6)}for(let e of this.near.stars)l(e,e.upos.sub(this.rig.upos,d).clone(),e.radius,-.2);for(let{bh:e,rel:t}of this.labelledHoles())l(e,t,e.radius*2.6,-.5);if(a)return a;let f=null,p=this.camPc,m=new U;for(let e of this.catalogs)for(let t of e.needed){let r=e.cpuPositions(t);if(r&&t.absMag)for(let a=0;a<t.drawCount;a++){m.set(r[a*3]-p.x,r[a*3+1]-p.y,r[a*3+2]-p.z);let s=m.length();if(s<__)continue;let c=Math.acos(Math.max(-1,Math.min(1,m.dot(n)/s)));if(c>i)continue;let l=t.absMag[a]+5*Math.log10(s)-5;if(l>u)continue;let d=c/i+.08*l;d<o&&(o=d,f={cat:e,node:t.id,slot:a})}}let h=null;return this.procStars.forEachVisible(p,u,(e,t,r)=>{let a=e.length();if(a<__)return;let s=Math.acos(Math.max(-1,Math.min(1,e.dot(n)/a)));if(s>i)return;let c=s/i+.08*t;c<o&&(o=c,h=r)}),h?h():f?this.getStar(f.cat,f.node,f.slot):null}rayHitBody(e,t){let n=null,r=1/0,i=new U;for(let a of this.bodies.views.values()){if(!a.resolved)continue;i.copy(e).sub(a.rel);let o=i.dot(t),s=i.lengthSq()-a.body.radius*a.body.radius,c=o*o-s;if(c<0)continue;let l=-o-Math.sqrt(c);l>0&&l<r&&(r=l,n=a.body)}for(let a of this.exo.views){if(a.pixelRadius<.8)continue;i.copy(e).sub(a.rel);let o=i.dot(t),s=o*o-(i.lengthSq()-a.planet.radius*a.planet.radius);if(s<0)continue;let c=-o-Math.sqrt(s);c>0&&c<r&&(r=c,n=a.planet)}return n}pickRayFast(e,t,n=2){let r=t.clone().normalize(),i=this.rayHitBody(e,r);if(i)return i;let a=n*Math.PI/180,o=null,s=1/0,c=new U,l=(t,n,i,l)=>{c.copy(n).sub(e);let u=c.length(),d=Math.acos(Math.max(-1,Math.min(1,c.dot(r)/u))),f=Math.asin(Math.min(1,i/Math.max(u,i*1.0001)));if(d>Math.max(a,f))return;let p=d/a+l;p<s&&(s=p,o=t)},u=this.lastMLim;for(let e of this.bodies.views.values())!e.resolved&&e.apparentMag>u+1.5||this.occluded(e.rel,e.body)||l(e.body,e.rel,e.body.radius,e.resolved?-1:-.3);let d=new U;for(let e of this.small.cometObjects)e.apparentMag>u||l(e,e.upos.sub(this.rig.upos,d).clone(),e.radius,0);for(let e of this.exo.views)this.exoShown(e)&&l(e.planet,e.rel,e.planet.radius,e.pixelRadius>2?-1:-.3);for(let e of this.craft.views)this.craftShown(e)&&l(e.craft,e.rel,e.craft.radius,-.6);for(let e of this.galaxies.views)e.pixelRadius>=2.5&&l(e.galaxy,e.rel,e.galaxy.radius*.5,.5);for(let e of this.deepSky.views)e.pixelRadius>=3&&e.dist>e.obj.radius&&l(e.obj,e.rel,e.obj.radius*.6,.4);for(let e of[...this.game.traffic.ships,...this.game.traffic.stations]){let t=e.upos.sub(this.rig.upos,new U);t.length()<2e6&&l(e,t,e.radius,-.6)}for(let e of this.near.stars)l(e,e.upos.sub(this.rig.upos,d).clone(),e.radius,-.2);for(let{bh:e,rel:t}of this.labelledHoles())l(e,t,e.radius*2.6,-.5);if(o)return o;let f=this.camPc,p=null;for(let e of this.named.list){let t=e.pos.distanceTo(f);if(t<__)continue;let n=e.absMag+5*Math.log10(t)-5;if(n>Math.min(u,6.5))continue;d.copy(e.pos).sub(f);let i=Math.acos(Math.max(-1,Math.min(1,d.dot(r)/d.length())));if(i>a)continue;let o=i/a+.1*n;o<s&&(s=o,p=e)}return p?this.getStar(this.catalog,p.node,p.slot):null}occluded(e,t){let n=e.length();for(let r of this.holes.views){if(r.bh===t||r.dist>n)continue;let i=Math.asin(Math.min(1,2.598*r.bh.radius/r.dist));if(t!==r.bh.companion&&e.angleTo(r.rel)<3*i)return!0}for(let r of this.occluders){if(r.body===t||r.dist>n)continue;let i=r.rel.dot(e)/n;if(!(i<=0||i>n)&&r.rel.lengthSq()-i*i<r.radius*r.radius*.995)return!0}return!1}occluders=[];labelledHoles(){let e=[];for(let t of this.blackHoles){let n=this.holes.views.find(e=>e.bh===t);if(n){e.push({bh:t,rel:n.rel,shadowPx:n.shadowPx});continue}let r=t.upos.sub(this.rig.upos,new U);(t===this.selection||r.length()<y_*0x6da012f95c9e88)&&e.push({bh:t,rel:r,shadowPx:0})}return e}keepAboveGround(e){let t=this.terrain.below(this.rig.upos);if(!t)return;let n=1.6,r=t.dist-t.ground,i=this.rig.upos.sub(t.centre,new U).normalize(),a=r;r<n?a=n:r<4&&!this.rig.autopilot&&this.rig.vel.dot(i)<.05&&!this.input.keys.has(`KeyR`)&&(a=r+(n-r)*(1-Math.exp(-e*6))),a!==r&&this.rig.upos.addVec(i,a-r)}keepOutsideHorizons(){let e=new U;for(let t of this.blackHoles){this.rig.upos.sub(t.upos,e);let n=e.length(),r=t.radius*1.15;n<r&&this.rig.upos.copy(t.upos).addVec(n>0?e.divideScalar(n):e.set(0,0,1),r)}}labelCandidates(){let e=[];this.occluders=[];for(let e of this.bodies.views.values())e.resolved&&e.pixelRadius>2&&this.occluders.push({body:e.body,rel:e.rel,dist:e.dist,radius:e.body.radius});let t=this.terrain.below(this.rig.upos);if(t){let e=this.terrain.owner,n=this.occluders.find(t=>t.body===e),r=Math.min(t.ground,t.dist)-Math.max(2,(t.dist-t.ground)*.02);n?n.radius=r:this.occluders.push({body:e,rel:t.centre.sub(this.rig.upos,new U),dist:t.dist,radius:r})}let n=this.lastMLim,r=this.selection,i=this.view.pixelRatio;for(let t of this.bodies.views.values()){let a=t.body,o=a===r,s=o,c=0;if(a.kind===`star`)s=!0,c=600;else if(a.kind===`planet`)s=s||t.apparentMag<n+2||t.resolved,c=500-t.apparentMag;else if(a.kind===`dwarf`)s=s||t.apparentMag<n||t.resolved,c=380-t.apparentMag;else if(a.kind===`moon`){let e=a.parent&&this.bodies.views.get(a.parent)?a.pos.distanceTo(a.parent.pos)/t.dist/this.view.pixelAngle/i:0;s||=(t.apparentMag<n+1||t.resolved)&&e>18&&(!a.radiusEstimated||t.resolved),c=300-t.apparentMag+(a.radiusEstimated?-50:0)}else s=s||t.resolved||t.apparentMag<Math.min(n,9),c=200-t.apparentMag;if(!s)continue;let l=this.project(t.rel);l&&!this.occluded(t.rel,a)&&e.push({rel:t.rel.clone(),key:a.key,text:a.name,x:l.x,y:l.y,radius:t.pixelRadius/i,priority:o?1e4:c,cls:o?`selected`:a.kind})}let a=new U;for(let t of this.small.cometObjects){if(t.apparentMag>Math.min(n,10)&&t!==r)continue;t.upos.sub(this.rig.upos,a);let i=this.project(a);i&&!this.occluded(a,null)&&e.push({rel:a.clone(),key:t.key,text:t.name,x:i.x,y:i.y,radius:2,priority:t===r?1e4:250-t.apparentMag,cls:t===r?`selected`:`comet`})}let o=this.camPc;for(let t of this.named.list){if(!t.proper)continue;let r=t.pos.distanceTo(o);if(r<__)continue;let i=t.absMag+5*Math.log10(r)-5;if(i>Math.min(n-4,2.6))continue;a.copy(t.pos).sub(o).multiplyScalar(Z);let s=this.project(a);s&&!this.occluded(a,null)&&e.push({rel:a.clone(),key:`named:${t.index}`,text:t.names[0],x:s.x,y:s.y,radius:3,priority:100-i,cls:`star`})}for(let t of this.near.stars){let n=this.project(t.upos.sub(this.rig.upos,a));n&&e.push({rel:a.clone(),key:t.key,text:t.name,x:n.x,y:n.y,radius:4,priority:t===r?1e4:450,cls:t===r?`selected`:`star`})}for(let t of[...this.game.traffic.stations,...this.game.traffic.ships]){let n=t.upos.sub(this.rig.upos,new U);if(n.length()>(t instanceof Ag?3e7:15e5)&&t!==r)continue;let i=this.project(n);i&&!this.occluded(n,null)&&e.push({rel:n,key:t.key,text:t.name,x:i.x,y:i.y,radius:3,priority:t===r?1e4:300,cls:t===r?`selected`:`ship`})}for(let t of this.craft.views){if(!this.craftShown(t))continue;let n=this.project(t.rel);if(n&&!this.occluded(t.rel,null)){let a=t.craft===r;e.push({rel:t.rel.clone(),key:t.craft.key,text:t.craft.name,x:n.x,y:n.y,radius:t.pixelRadius/i,priority:a?1e4:460,cls:a?`selected`:`craft`})}}for(let t of this.exo.views){if(!this.exoShown(t))continue;let n=this.project(t.rel);if(n&&!this.occluded(t.rel,null)){let a=t.planet===r;e.push({rel:t.rel.clone(),key:t.planet.key,text:t.planet.name,x:n.x,y:n.y,radius:t.pixelRadius/i,priority:a?1e4:470+Math.min(t.pixelRadius,20),cls:a?`selected`:`exoplanet`})}}for(let{bh:t,rel:n,shadowPx:a}of this.labelledHoles()){let o=this.project(n);o&&!this.occluded(n,t)&&e.push({rel:n,key:t.key,text:t.name,x:o.x,y:o.y,radius:a/i,priority:t===r?1e4:420,cls:t===r?`selected`:`blackhole`})}for(let t of this.deepSky.views){let n=t.obj===r;if(!n&&(t.pixelRadius<3||t.dist<t.obj.radius*.8))continue;let a=this.project(t.rel);a&&!this.occluded(t.rel,null)&&e.push({rel:t.rel.clone(),key:t.obj.key,text:t.obj.name,x:a.x,y:a.y,radius:Math.min(t.pixelRadius/i,60),priority:n?1e4:520+Math.min(t.pixelRadius,40),cls:n?`selected`:`nebula`})}for(let t of this.galaxies.views){let n=t.galaxy===r;if(!n&&t.pixelRadius<2.5)continue;let a=this.project(t.rel);a&&!this.occluded(t.rel,null)&&e.push({rel:t.rel.clone(),key:t.galaxy.key,text:t.galaxy.name,x:a.x,y:a.y,radius:Math.min(t.pixelRadius/i,60),priority:n?1e4:640+Math.min(t.pixelRadius,50),cls:n?`selected`:`galaxy`})}{let t=this.milkyWay,n=t.upos.sub(this.rig.upos,new U);if(n.length()>t.radius*1.4||r===t){let i=this.project(n);i&&!this.occluded(n,null)&&e.push({rel:n,key:t.key,text:t.name,x:i.x,y:i.y,radius:40,priority:r===t?1e4:700,cls:r===t?`selected`:`galaxy`})}}if(r instanceof fp&&!this.near.stars.includes(r)){let t=this.project(r.upos.sub(this.rig.upos,a));t&&!this.occluded(a,null)&&e.push({rel:a.clone(),key:r.key,text:r.name,x:t.x,y:t.y,radius:3,priority:1e4,cls:`selected`})}return e}start(){this.renderer.gl.setAnimationLoop(()=>this.frame())}frame(){let e=performance.now(),t=Math.max(0,(e-this.lastTime)/1e3),n=Math.min(.1,t);this.lastTime=e,t>0&&(this.fps+=(1/t-this.fps)*.05),this.frameCount++,this.clock.advance(Math.min(t,1));let r=this.clock.jdTdb;this.system.update(r,this.clock.paused?0:Math.sign(this.clock.rate));for(let e of this.blackHoles)e.update(r);for(let e of this.activeSystems)e.update(r);for(let e of this.craft.craft)e.update(r);if(this.selection instanceof fp&&!this.selection.exact&&this.selection.ref){let e=this.selection.ref;this.getStar(e.catalog,e.node.id,e.slot)}this.rig.followAnchor(),this.chooseAnchor(),this.camPc.set((this.rig.upos.xh+this.rig.upos.xl)/Z,(this.rig.upos.yh+this.rig.upos.yl)/Z,(this.rig.upos.zh+this.rig.upos.zl)/Z),this.nearTimer--<=0&&(this.updateNearStars(),this.nearTimer=10),this.rig.altitude=this.computeAltitude(),this.vr.active&&this.vr.updateInput(n),this.rig.braking=this.input.keys.has(`KeyX`),this.rig.update(n,this.input),this.keepOutsideHorizons(),this.keepAboveGround(n),this.camPc.set((this.rig.upos.xh+this.rig.upos.xl)/Z,(this.rig.upos.yh+this.rig.upos.yl)/Z,(this.rig.upos.zh+this.rig.upos.zl)/Z),this.renderer.rig.quaternion.copy(this.rig.quat),this.renderer.rig.updateMatrixWorld(!0);let i=this.renderer.camera;i.fov=this.rig.fov,i.updateProjectionMatrix(),i.updateMatrixWorld(!0),this.view=this.renderer.viewInfo(),this.invQuat.copy(this.view.quat).invert();let a=this.view.xr&&Number.isFinite(this.view.far);Q.uPullIn.value=a?this.view.far*.5:0,Tu.uLite.value=+!!this.vr.active,Q.uDepthK.value=a?Eu(this.renderer.camera.far):1;let o=this.view.pixelAngle;this.bodies.glareOn=this.vr.active,this.bodies.allowHi=!this.vr.active,this.bodies.update(this.rig.upos,o,n,this.view.quat),this.bodies.updateDetail(this.renderer.gl,this.tiles,o,new U(0,0,-1).applyQuaternion(this.view.quat)),this.atmospheres.steps=this.vr.active?10:16,this.atmospheres.update(this.rig.upos,this.bodies.views),this.updateActiveSystems(),this.exo.showOrbits=this.orbits.enabled,this.exo.update(this.rig.upos,o,this.activeSystems,r,e/1e3),this.atmospheres.updateExo(this.exo.atmospheres());{let e=[this.bodies.terrainCandidate(),this.exo.terrainCandidate()].filter(e=>e!==null);e.sort((e,t)=>e.alt-t.alt);let t=e[0]??null;t&&(t.air=this.atmospheres.material(t.ground.owner)),this.terrain.vr=this.vr.active,this.terrain.update(t)}this.craft.update(this.rig.upos,o,r,this.system.sun,this.system.byId.get(399)),this.holes.vr=this.vr.active,this.holes.update(this.rig.upos,o,e/1e3),this.jets.update(this.rig.upos,o,e/1e3);let{xStar:s,xSurf:c,mLim:l,xDark:u}=this.updateExposure(n),d=this.camPc.length();Pp.toGal(this.camPc,this.camGal),this.galaxy.vr=this.vr.active,d>60&&this.galaxy.update(this.renderer.gl,this.camGal,!this.galaxy.ready&&d>150?6:1),this.sky.updateWith(s/u,d,this.galaxy.ready?this.galaxy.target.texture:null,this.camGal),this.galaxies.update(this.rig.upos,o,s/u,S_(300,1500,d),this.view.quat),this.deepSky.update(this.rig.upos,this.camPc,o,s/u),this.cometTails.gain.value=s/u,this.lastMLim=l;let f=this.starFields[0].psf;f.uExposure.value=s;let p=this.view.pixelRatio;f.uPixelSA.value=(this.view.pixelAngle*p)**2,f.uDpr.value=p,this.bodies.surfaceExposure.value=c;for(let e of this.catalogs)e.update(this.camPc,l,this.fieldMinDistPc);for(let e of this.starFields)e.update(this.camPc,__);this.procStars.update(this.camPc,l,__,this.vr.active?2:4),this.near.update(this.rig.upos,o,e/1e3,this.view.quat),this.orbits.focus=this.rig.anchor instanceof Yh?this.rig.anchor:null,this.orbits.update(this.rig.upos,o,r),this.small.update(this.rig.upos,r),this.cometTails.update(this.rig.upos,this.system.sun.upos,this.small.cometObjects,this.selection,r),this.game.update(n),this.warmupPending&&(this.warmupPending=!1,this.warmUp()),this.holes.capture(this.renderer.gl,this.renderer.scene,[this.renderer.rig,this.orbits.group,...this.vr.sceneOverlays],f),this.renderer.render(),this.vr.active?(this.labels.update([],this.cssW,this.cssH),this.vr.updateOverlays(this.labelCandidates(),n)):this.labels.update(this.labelCandidates(),this.view.width,this.view.height),this.hudTimer-=n,this.hudTimer<=0&&(this.hudTimer=.1,this.updateHud())}updateHud(){let e=this.clock,t=null;if(this.selection){let e=this.selection.upos.sub(this.rig.upos,new U).length(),n=this.selection.info();if(this.selection instanceof fp&&!this.isCompanion(this.selection)){let e=this.systems.of(this.selection);e&&n.push([`Planets`,e.real?`${e.planets.length} confirmed (NASA Exoplanet Archive)`:`${e.planets.length} generated (not observed)`])}t={name:this.selection.name,rows:n,distance:ql(e)}}let n=this.starFields.reduce((e,t)=>e+t.drawnStars,0)+this.procStars.drawnStars,r=this.catalogs.reduce((e,t)=>e+t.loadedStars,0),i=this.catalogs.reduce((e,t)=>e+t.totalStars,0),a=this.catalogs.reduce((e,t)=>e+t.pending,0);this.hud.update({date:Cu(e.jdTdb),rate:this.rateText(),paused:e.paused,fps:this.fps,speed:Jl(this.rig.speed),altitude:ql(this.rig.altitude),reference:this.rig.anchor?.name??`none (free space)`,selection:t,stars:`${(n/1e3).toFixed(0)}k stars drawn · ${(r/1e6).toFixed(2)}M of ${(i/1e6).toFixed(2)}M loaded`,loading:a?`streaming ${a} star tiles`:``,depthMode:this.renderer.depthMode,ephemeris:this.system.usingDE?`Ephemeris: JPL DE442S`:`Ephemeris: approximate elements`,autopilot:this.rig.autopilot})}debugGlowColumn(e){return Wp(this.camGal,Pp.dirToGal(new U(...e).normalize()),400,300)}debugState(){return{jd:this.clock.jdTdb,camera:this.rig.upos.toVector3().toArray(),anchor:this.rig.anchor?.name??null,selection:this.selection?.name??null,starsDrawn:this.starFields.reduce((e,t)=>e+t.drawnStars,0),proceduralDrawn:this.procStars.drawnStars,proceduralPending:this.procStars.pending,starsLoaded:this.catalogs.reduce((e,t)=>e+t.loadedStars,0),pendingTiles:this.catalogs.reduce((e,t)=>e+t.pending,0),exposure:this.bodies.surfaceExposure.value,starExposure:this.starFields[0].psf.uExposure.value,mLim:this.lastMLim,depthMode:this.renderer.depthMode,usingDE:this.system.usingDE,fps:this.fps,autopilot:this.rig.autopilot}}};function S_(e,t,n){let r=Math.max(0,Math.min(1,(n-e)/(t-e)));return r*r*(3-2*r)}async function C_(){let e=document.getElementById(`view`),t=document.getElementById(`hud`),n=document.getElementById(`labels`),r=document.getElementById(`boot`);try{if(!document.createElement(`canvas`).getContext(`webgl2`))throw Error(`WebGL 2 is not available in this browser.`);let i=await x_.create(e,t,n);window.app=i,i.start(),r?.classList.add(`done`),setTimeout(()=>r?.remove(),1e3)}catch(e){r?.remove(),console.error(e),window.appError=String(e instanceof Error?e.stack??e.message:e);let t=document.createElement(`div`);t.className=`fatal`,t.textContent=`Failed to start: ${window.appError}`,document.body.appendChild(t)}}C_();