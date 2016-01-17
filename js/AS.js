 /**
 *@created date 2015-3-10
 *@updated date 2015-12-3
 *@author Asia
 *@version 0.0.1 AS
 *目前只是将原生实现封装成更简便的使用方法，而没有和其他框架如jquery一样封装成自定义的对象
 * 实现效果：
 *          1、核心+功能组件架构方式
 *          2、模块化加载
 *          3、选择器 =
 *          4、ajax =
 *          5、上传
 *          6、dom操作
 *			7、事件
 */

(function(window,undefined){
	"use strict";
    var seletor_regx = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,
        document = window.document,
        readylist = [],
        isReady = false,
        is_listening_dom_load = false;
    var AS = function(selector, context){
        if(typeof selector === 'string'){
            selector = selector.trim();
            //如果是window或document或body，直接返回本例
            if(selector === 'window') return window;
            if(selector === 'document') return document;
            if(selector === 'body') return document.body;
            //如果符合css选择器格式，调用原生方法
            var match = seletor_regx.exec(selector);
            context = context || document;
            //单独的id选择器，则直接使用getElementById,简单快速
            if(match && ~match[0].indexOf('#')){
                return context.getElementById(match[2]);
            }
            try{
                var  result = context.querySelectorAll(selector);
                return result.length == 1 ? result[0] : result;
            }catch (e){
                console.log(e);
                return context;
            }
        }else if(isFunction(selector)){
            AS.ready(selector);
        }
        return context;
    };

    /**
    *	使用XMLHttpRequest level 2 实现
    */
    AS.ajax = function(options){
    	var xhr = new XMLHttpRequest(),
    		fixedResponseTypeList = ['text', 'arraybuffer', 'blob', 'document', 'json'];
    	options = AS.extend({
    		url: '',
    		action: 'GET',
    		type:'text',
    		args: {},
    		async: true,
    		timeout: 0,
    		onTimeout: AS.noop,
    		before: AS.noop,
    		progress: AS.noop,
    		success: AS.noop,
    		error: AS.noop,
    		end: AS.noop,

    	}, options);

    	var requestUrl = options.url;

    	//如果是get请求，则将参数拼接到url之后
    	if(array_contains(options.action.toUpperCase(), ['GET', 'HEAD'])){
    		var temp_arr = [],
    			args = options.args;
    		for(var o in args){
    			temp_arr.append(o+'='+args[o]);
    		}
    		requestUrl += '?';
    		requestUrl = temp_arr.join('&');
    	}

    	xhr.open(options.action, requestUrl, options.async);

    	xhr.timeout = options.timeout;

    	xhr.responseType = array_contains(options.type, fixedResponseTypeList)? options.type: 'text';

    	xhr.ontimeout = function(){
    		console.error(options.url+'请求超时: '+options.timeout);
    	};

    	xhr.onerror = function(){
    		console.error(options.url+'请求失败');
    	};

    	xhr.readystatechange = function(e){
    		switch(this.readyState){
    			case 0: //UNSENT
    				console.log('xhr对象已构造，请求还未开始');
    				break;
    			case 1: //OPENED
    				console.log('请求已打开，此时可以使用(setRequestHeader)设置请求头');
    				break;
    			case 2: //HEADERS_RECEIVED
    				console.log('响应头已接收');
    				break;
    			case 3: //LOADING
    				console.log('正在接收响应体');
    				break;
    			case 4: //DONE
    				console.log('请求已完成(包括success和error)');
    				var resp = this.response;
    				switch(resType){
    					case 'text':
    						resp = JSON.parse(resp);
    						break;
    					case 'arraybuffer':
    						break;
    					case 'blob':
    						break;
    					case 'document':
    						break;
    					case 'json':
    						break;
    				};

    				if(this.status == 200){
    					options.success.call(null, resp);
    				}else{
    					options.error.call(null);
    				}
    				options.end.call(null);
    				break;

    		};
    	};

    	xhr.send(options.args);
    	return xhr;
    };

    //空函数
    AS.noop = function(){};

    AS.ready = function(fn){
        if(isReady || document.readyState === 'complete'){
            readylist = null;
            fn.call(null, AS);
            return;
        }
        readylist.push(fn);
        var doReady = function(){
            document.removeEventListener('DOMContentLoaded', doReady, false);
            isReady = true;
            for(var i=0; i<readylist.length; i++){
                readylist[i].call(null, AS);
            }
        };
        if(!is_listening_dom_load){
            document.addEventListener('DOMContentLoaded', doReady, false);
            is_listening_dom_load = true;
        }
    };

    /**
     * 返回dom元素最终使用的style
     * @param dom DOM对象，通过nodeType过滤
     * @param attr style属性
     * @returns 属性值
     */
    AS.getComputedStyleAttr = function(dom, attr){
        if(dom != window && (dom.nodeType == 1 || dom.nodeType == 9)){
            return window.getComputedStyle(dom,null)[attr];
        }
    };

    /**
    *	回调函数
    */
    AS.Callbacks = function(){
    	var list = [],
    		firing = false,
    		self = {
    			add: function(){//可同时加入多个function
    				for(var i in arguments){
    					if(!isFunction(arguments[i])) continue;
    					list.push(fn);
    				}
    				return this;
    			},
	    		remove: function(fn){
	    			if(list){
	    				var index = list.indexOf(fn);
	    				if(index >= 0){
	    					array_remove(index,list);
	    				}
	    			}
	    			return this;
	    		}
    		};
    	return self;
    };

    AS.extend = extend;


	/* 内部使用的工具方法 --start */

	//用src扩展target，覆盖原有属性
	function extend(target,src){
        for(var name in src){
            if(src.hasOwnProperty(name)){
                target[name] = src[name];
            }
        }
        return target;
    }

	//检查是否是函数
	function isFunction(fn){
		return typeof fn === 'function';
	}

	//检查是否是字符串
	function isString(str){
		return typeof str === 'string';
	}

	//检查是否是字符串
	function isArray(arr){
		return typeof arr === 'object' && arr instanceof Array;
	}

	//按索引移除数组元素
	function array_remove(index,arr){
		if(isNaN(index)||index>=arr.length){
	            return;
	    }
        for(var i=0,n=0;i<arr.length;i++){
            if(arr[i]!=arr[index]){
                arr[n++]=arr[i];
            }
        }
        arr.length-=1;
	}

	//查询数组是否包含元素
	function array_contains(item,arr){
		return new RegExp("\\b"+item+"\\b").test(arr);
	}

	//清除字符串中的所有空格
	function string_trimAll(str){
		var strArr = str.split(' ');
		return strArr.join('');
	}

    //查询是否为空
    function isEmptyObject(obj){
        for(var i in obj){
            return false;
        }
        return true;
    }

	/* 内部使用的工具方法 --end */
    AS.extend(AS, {
        isFunction: isFunction,
        isString: isString,
        isArray: isArray,
        array_remove: array_remove,
        array_contains: array_contains,
        string_trimAll: string_trimAll,
        isEmptyObject: isEmptyObject
    });
	window.AS = AS;

})(window);

//封装本地存储, 统一存储和获取的数据类型，免得混乱
(function(AS, storage){
    AS.VALUE_TYPE = {
        'str': 0,
        'num': 1,
        'obj': 2,
        'bool': 3
    };
    var transformGet = function(type, key, defaultValue){
        var value = storage.getItem(key);
        var returnValue = defaultValue;
        if(!value || AS.isEmptyObject(value)) return returnValue;
        switch(type){
            case 0: 
                returnValue = value;
                break;
            case 1:
                returnValue = parseInt(value);
                break;
            case 2:
                returnValue = JSON.parse(value);
                break;
            case 3:
                returnValue = !!value;
        }
        return returnValue;
    };
    var store = {
        get: function(key, type, defaultValue){
            if(!key) return;
            type = type || AS.VALUE_TYPE['str'];
            return transformGet(type, key, defaultValue);
        },
        set: function(key, value){
            if(!key || (!value && value != 0)) return;
            switch(typeof value){
                case 'string':
                    storage.setItem(key, value);
                    break;
                case 'number':
                    storage.setItem(key, value);
                    break;
                case 'object':
                    storage.setItem(key, JSON.stringify(value));
                    break;
                case 'boolean':
                    storage.setItem(key, value ? 1: 0);
                    break;
                case 'function':
                    value = value();
                    if(value == undefined || value == null){
                        console.log('不合法的值(localstorage): ', value);
                    }else{
                        storage.setItem(key, value());
                    }
                    break;
                default:
                    console.log('不合法的值(localstorage): ', value);
            }
        },
        save: function(data){
            if(AS.isString(data)) data = JSON.parse(data);
            if(!data || AS.isEmptyObject(data)) return;
            for(var key in data){
                store.set(key, data[key]);
            }
        },
        clear: function(refresh){
            var uuid = store.get('uuid', AS.VALUE_TYPE['str']);
            var version = store.get('version', AS.VALUE_TYPE['num']);
            storage.clear();
            if(refresh){
                window.location.reload(true);
            }else{
                store.set('uuid', uuid);
                store.set('version', version);
            }
        }
    };
    AS.storage = store;
})(AS, window.localStorage);

//浏览器检测
(function(AS, navigator){
    var agent = navigator.userAgent;
    var browser = {
        is_mobile: function(){
            return (/(iPhone|iPad|iPod|iOS|Android)/i.test(agent) || agent.indexOf('linux') > -1);
        },
        toString: function(){
            return agent;
        },
        is_webkit: function(){
            return agent.indexOf('AppleWebKit') > -1;
        },
        is_firefox: function(){
            return (agent.indexOf('Gecko') > -1 && agent.indexOf('KHTML') == -1);
        },
        suported: function(){
            return(!browser.is_mobile() && browser.is_webkit());
        }
    };
    AS.browser = browser;
})(AS, window.navigator);

//桌面通知
(function(AS){
    if(window.Notification !== 'denied'){
        window.Notification.requestPermission(function(permission){
            if(permission === "granted") {
                if(Notification.permission === 'granted'){
                    AS.notifer = {};
                    AS.notify = function(title, msg){
                        if('on' !== AS.storage.get('notify', AS.VALUE_TYPE['str'], 'on')) return;
                        if(!title || title.trim() == '') return;
                        if(AS.notifer[title]){
                            AS.notifer[title].close();
                            AS.notifer[title] = void 0;
                        }
                        AS.notifer[title] = new Notification('来自TODO', {
                            dir: 'ltr',
                            body: msg || '帅锅喊你改bug啦～',
                            icon: '/images/logo.jpg'
                        });
                    };
                }
            }
        });
    }
    AS.storage.set('storageChanged', 'false');
})(AS);
