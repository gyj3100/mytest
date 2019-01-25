const crypto = require('crypto');
const fs = require('fs');
const debug = require('debug')('jswechat:jssdk');
const request = require('request');

function JSSDK(appId,appSecret) {
    this.appId = appId;
    this.appSecret = appSecret;
}

JSSDK.prototype = {
    getSignPackage: function (url,done) {
	const instance = this;
	instance.getJsApiTicket( function(error,jsapiTicket) {
	    if(error) {
		return done(error);
	    }
	    const timestamp = Math.round(Date.now() /1000);
	    const nonceStr = instance.createNonceStr();
	
	    //生成签名
	    const rawString = `jsapi_ticket=${jsapiTicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
	   const hash = crypto.createHash('sha1');
	    const signature = hash.update(rawString).digest('hex');
	    done(null, {
		timestamp,
		url,
		signature,
		appId: instance.appId,
		nonceStr: nonceStr,
		rawString,
	    });
	});
    },
    getJsApiTicket: function (done) {
	const cacheFile = '.jsapiticket.json';
	const data = this.readCacheFile(cacheFile);
	const instance = this;
	const time = Math.round(Date.now() / 1000);
	if(!data.expireTime || data.expireTime < time) {
	   this.getAccessToken(function (error,accessToken) {
		if (error) {
		    debug('getJsApiTicket.token.error:',error,url);
		    return done(error,null);
		}
		const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?type=jsapi&access_token=${accessToken}`;	
		request.get(url,function (err,res, body) {
		    if (err) {
			debug('getJsApiTicket.request.error:',err,url);
			return done(err,null);
		    }
		    debug('getJsApiTicket.request.body',body);

		    try {
			const data = JSON.parse(body);
			instance.writeCacheFile(cacheFile, {
			    expireTime:Math.round(Date.now() / 1000) + 7200,
			    jsapiTicket: data.ticket,
			});
			done(null,data.ticket);
		    } catch (e) {
			debug('getJsApiTicket.request.error:',url,e);	
			return;
		    }
		});
	    }); 
	} else {
	    done(null,data.jsapiTicket);
	}
    },
    getAccessToken: function (done) {
	const cacheFile = '.jsapiticket.json';
	const instance = this;
	const data = this.readCacheFile(cacheFile);
	const time = Math.round(Date.now() / 1000);
	if(!data.expireTime || data.expireTime < time) {
		const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${instance.appId}&secret=${instance.appSecret}`;	
		request.get(url,function (err,res, body) {
		    if (err) {
			debug('getAccessToken.request.error:',err,url);
			return done(err,null);
		    }
		    debug('getAccessToken.request.body',body);

		    try {
			const data = JSON.parse(body);
			debug("parse data:",data);
			instance.writeCacheFile(cacheFile, {
			    expireTime:Math.round(Date.now() / 1000) + 7200,
			    jsapiTicket: data.access_token,
			});
			done(null,data.access_token);
		    } catch (e) {
			debug('getAccessToken.request.error:',err,url);	
			return done(err,null);
		    }
		});
	} else {
	    done(null,data.jsapiTicket);
	}
    },
    createNonceStr: function () {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const length = chars.length;
	let str = ''
        for (let i = 0; i < length; i++) {
	  str += chars.substr(Math.round(Math.random() * length), 1);
	}
	return str;
    },

    //从缓存文件中读取缓存
    readCacheFile: function (filename) {
//	fs.exists(filename,function(exists) {
//	    if(!exists) {
//		debug(filename + "doesn't exist!");
//		fs.open(filename,"w",function(err,fd) {});
//		fs.writeFileSync(filename,'{}');
//	    }
//	});
	try {
	    return JSON.parse(fs.readFileSync(filename));
	} catch(e) {
	    debug('read file %s failed: %s',filename,e);
	}
	return {};
    },    
    //写缓存文件
    writeCacheFile: function (filename,data) {
//	fs.exists(filename,function(exists) {
//	    if(!exists) {
//		debug(filename + "doesn't exist!");
//		fs.open(filename,"w",function(err,fd) {});
//		fs.writeFileSync(filename,'{}');
//	    }
//	});
	return fs.writeFileSync(filename,JSON.stringify(data));
    },
}

const jssdk = new JSSDK('wx1848ef5e1e49647b','a940f1dad58c9d4536ea21fc767535bb');
module.exports = jssdk;
//debug(jssdk.createNonceStr());
//debug(jssdk.createNonceStr());


//jssdk.getAccessToken(function (err,accessToken) {
//    console.log(arguments);
//});

//jssdk.getJsApiTicket(function (err,accessToken) {
//    console.log(arguments);
//});

//jssdk.getSignPackage('http://47.99.81.93/wechat/hello',function (err,accessToken){
//    console.log(arguments);
//});
