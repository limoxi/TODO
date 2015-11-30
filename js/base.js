
//与野狗云同步 https://itodo.wilddogio.com
function Sync(url){
	this.dog = new Wilddog(url);
	this.user_id = uuid;
	this.storeVersion = window.localStorage.getItem('version') || 0;
}
Sync.prototype = {
	sync: function(){
		var that = this;
		that.dog.child(that.user_id+'/version').once(function(obj){
			var version = obj.val();
			if(that.storeVersion != version){
				if(that.storeVersion > version){
					var uploadData = {};
					uploadData[that.user_id] = {
						'version': that.storeVersion,
						'todoData': window.localStorage.getItem('todoData'),
						'finishedData': window.localStorage.getItem('finishedData')
					}
					that.dog.update(uploadData);

				}else{
					that.dog.child(that.user_id).once(function(obj){
						var downData = obj.val();
					});
				}
			}
		});
	}
};

function Store(container, tmpl){
	var storage = window.localStorage;
	if(storage.getItem('todoReady') !== 'true') {
		storage.clear();
		storage.setItem('todoReady', true);
	}
	this.notifyIcon = '/images/logo.jpg';
	this.$container = $(container);
	var tmplStr = $(tmpl).html();
	this.template = Handlebars.compile(tmplStr);
	this._data = JSON.parse(storage.getItem('todoData') || '{}');
	this.timeThreshold = JSON.parse(storage.getItem('observer') || '{}');

	this._saveData = function(){
		storage.setItem('todoData', JSON.stringify(this._data))
	};
	//绑定工具事件
	var that = this;
	this.editting = false;
	this.$container.delegate('.a-tap-header span', 'click', function(){
		var dataKey = $(this).parents('.a-tap').attr('data-key');
		if($(this).hasClass('a-tap-delete')){
			//删除
			that.remove(dataKey);
		}else if($(this).hasClass('a-tap-done')){
			//完成
			var content = $(this).parent().siblings('.a-tap-text').html();
			finishedStore.set(dataKey, content);
			that.remove(dataKey);
		}else if($(this).hasClass('a-tap-edit')){
			//编辑
			$('.a-tap-new').val(that.get(dataKey)).focus();
			that.editting = true;
			that.edittingKey = dataKey;
		}else if($(this).hasClass('a-tap-flash')){
			$(this).parent().parent().toggleClass('animation-flash');
			$(this).attr('data-original-title','取消关注');
			if(!$(this).parent().parent().hasClass('animation-flash')){
				$(this).attr('data-original-title','关注');
			}
		}
	});
	//初始化数据
	var tapArray = [],
		temKeyArray = [];
	for(var key in this._data){
		tapArray.push(this.template({text: this._data[key], time: key}));
		temKeyArray.push(key);
	}
	this.$container.append(tapArray.join(''));
	this.keyArray = temKeyArray;
	this.startTimer();
	
	this.checkStatus();
}
Store.prototype = {
	startTimer: function(){
		var that = this;
		var observerTimer = setting.get('timer');
		if(observerTimer){
			observerTimer = parseInt(observerTimer);
		}else{
			observerTimer = 120;
		}
		console.log(observerTimer);
		if(this.timer) this.stopTimer();
		this.timer = window.setInterval(function(){
			that.checkStatus.call(that);
		}, observerTimer * 1000);
	},
	get: function(key){
		return this._data[key];
	},
	set: function(key, value, action){
		this._data[key] = value;
		!action && this.$container.append(this.template({text: value, time: key}));
		this._saveData();
		this.keyArray.push(key);
		this.$container.find('[data-toggle="tooltip"]').tooltip();
	},
	remove: function(key){
		delete this._data[key];
		this.keyArray.shift(key);
		this._saveData();
		this.$container.find('a[data-key="'+key+'"]').remove();
	},
	setTimeThreshold: function(timeData){
		this.timeThreshold = timeData;
	},
	checkStatus: function(){
		var now = new Date();
		var needNotify = false;
		for(var i in this.keyArray){
			var key = this.keyArray[i];
			var dif = (now - dateTransfer(key))/1000/60;
			var tempColor = 'whitesmoke';
			for(var min in this.timeThreshold){
				var bgColor = this.$container.find('a[data-key="'+key+'"]').css('background-color');
				var hex = rgbToHex(bgColor);
				if(dif >= min && hex!=this.timeThreshold[min]){
					needNotify = true;
					tempColor = this.timeThreshold[min];
				}
			}
			this.$container.find('a[data-key="'+key+'"]').css('background', tempColor);
		}
		needNotify && AS.notify('task');
	},
	stopTimer: function(){
		var that = this;
		window.clearInterval(that.timer);
		this.timer = void 0;
	}
};


function FinishedStore(container, tmpl){
	var storage = window.localStorage;
	if(storage.getItem('todoReady') !== 'true') return;

	this.$container = $(container);
	var tmplStr = $(tmpl).html();
	this.template = Handlebars.compile(tmplStr);
	this._data = JSON.parse(storage.getItem('finishedData') || '{}');

	this._saveData = function(){
		storage.setItem('finishedData', JSON.stringify(this._data))
	};
	//初始化数据
	var tapArray = [];
	for(var key in this._data){
		tapArray.push(this.template({text: this._data[key], time: key}));
	}
	this.$container.append(tapArray.join(''));
}
FinishedStore.prototype = {
	get: function(key){
		return this._data[key];
	},
	set: function(key, value){
		this._data[key] = value;
		this.$container.append(this.template({text: value, time: key}));
		this._saveData();
	},
};
>>>>>>> origin/master

//设置数据
var Settings = function(name){
	var setting = window.localStorage.getItem(name);
	setting = setting ? JSON.parse(setting): {};
	return {
		get: function(key){
			return setting[key];
		},
		set: function(key, value){
			if(!key || key.trim() == '') {
				AS.toast('必须输入时间啊亲！！！', 'warn');
				return false;
			}
			if(value){
				setting[key] = value;
			}else{
				delete setting[key];
			}
			console.log('set'+name+'=>>'+key+'=='+value);
			window.localStorage.setItem(name, JSON.stringify(setting));
			store.setTimeThreshold(setting);
		}
	};
};

var observerSetting = Settings('observer');
var notifySetting = Settings('notify');
var setting = Settings('setting');

$(function(){
	AS.store.init();
	initTools();
	bindListeners();
});

function bindListeners(){
	var tmpl = $('#tap-template').html();
	$('.a-tap-new').on('keyup', function(e){
		var input = $(this).val().trim();
		if(input == '' || e.keyCode != 13) return;
		var datetime = new Date().toLocaleString();
		var tid = $(this).attr('data-target'), title, content;
		console.log(tid, '++++++++');
		if(tid){
			var task = AS.TID2TASK[tid];
			task.edit(input);
			title = task.title;
			content = task.content;
			$('.a-list').find('a[data-key="'+tid+'"]').find('.a-tap-title').html(title).end().find('.a-tap-content').html(content);
		}else{
			var inputArr = input.split('::');
			var options = {};
			if(inputArr.length = 1){
				options['content'] = input;
			}else{
				options['title'] = inputArr[0];
				options['content'] = inputArr[1];
			}
			new Task(options);
		}
		$(this).attr('data-target', '').val('').blur();
	});

	this.editting = false;
	$('.a-container').delegate('.a-tap-header span', 'click', function(){
		var $tap = $(this).parents('.a-tap');
		var tid = $tap.attr('data-key');
		var task = AS.TID2TASK[tid];
		if($(this).hasClass('a-tap-delete')){
			//删除
			AS.store.remove(AS.TODO_DATA, tid);
			$tap.remove();
		}else if($(this).hasClass('a-tap-done')){
			//完成
			AS.store.finish(tid);
			$tap.remove();
		}else if($(this).hasClass('a-tap-edit')){
			//编辑
			$('.a-tap-new').val(task.title+"::"+task.content).attr('data-target', tid).focus();
		}else if($(this).hasClass('a-tap-flash')){
			$(this).toggleClass('action').parent().parent().toggleClass('animation-flash');
		}
	});
}

function initTools(){
	
	$('.a-doneList').on('click', function(){
		$('.a-slider-container').toggle('fast');
	});
	//设置
	$('[data-toggle="setting-popover"]').popover({
		html: true,
		placement: 'top',
		container: 'body',
		content: '<input placeholder="消息提醒频率(分钟)" class="a-setting-timer">\
					<button type="button" class="a-setting-set"> 设置 </button>'
	}).on('shown.bs.popover', function(){
		$('.a-setting-set').on('click', function(){
			var timer = $('.a-setting-timer').val();
			if(!timer || timer.trim() == ''){
				AS.toast('设置频率不能为空', 'warn');
				return;
			}
			timer = parseInt(timer)*60;
			setting.set('timer', timer);
			store.startTimer();
		});
	});
	//时间
	$('[data-toggle="observer-popover"]').popover({
		html: true,
		placement: 'top',
		container: 'body',
		content: '<label><input placeholder="分钟" class="a-observer-time"></label>\
				   <input type="hidden" class="a-observer-color">\
				   <div class="a-observer-color-picker"><span style="background:#66FF00" data-hex="#66FF00"></span>\
				   <span style="background:#99FF00" data-hex="#99FF00"></span>&nbsp;<span style="background:#CCFF00" data-hex="#CCFF00"></span>\
				   <span style="background:#FFFF00" data-hex="#FFFF00"></span>&nbsp;<span style="background:#FFCC00" data-hex="#FFCC00"></span>\
				   <span style="background:#99CC00" data-hex="#99CC00"></span>&nbsp;<span style="background:#66CC00" data-hex="#66CC00"></span>\
				   <span style="background:#FF6600" data-hex="#FF6600"></span>&nbsp;<span style="background:#FF3300" data-hex="#FF3300"></span>\
				   <span style="background:#FF00FF" data-hex="#FF00FF"></span>&nbsp;<span style="background:#CC00FF" data-hex="#CC00FF"></span>\
				   <span style="background:#9900FF" data-hex="#9900FF"></span>&nbsp;<span style="background:#FF0066" data-hex="#FF0066"></span>\
				   <span style="background:#00CCFF" data-hex="#00CCFF"></span>&nbsp;<span style="background:#0099FF" data-hex="#0099FF"></span>\
				   <span style="background:#00CC99" data-hex="#00CC99"></span>&nbsp;<span style="background:#669999" data-hex="#669999"></span>\
				   <span style="background:#990033" data-hex="#990033"></span>&nbsp;<span style="background:#999999" data-hex="#999999"></span>\
				   <span style="background:#CCCCFF" data-hex="#CCCCFF"></span>&nbsp;<span style="background:#9933FF" data-hex="#9933FF"></span></div>\
				   <button type="button" class="a-observer-set"> 设置 </button>'
	}).on('shown.bs.popover', function(){
		//绑定时间设置事件
		$('.a-observer-set').on('click', function(){
			var time = $('.a-observer-time').val().trim();
			var color = $('.a-observer-color').val().trim();
			observerSetting.set(time, color);
		});
		//绑定颜色选择事件
		$('.a-observer-color-picker').delegate('span', 'click', function(){
			var color = $(this).attr('data-hex');
			$(this).css('border', '3px dashed black').siblings().css('border', 'none');
			$('.a-observer-color').val(color);
		});
	});

	//消息条
	var type_desc = {
		success: "干得漂亮～",
		info: "你有新短消息～",
		warn: "前方高能！",
		error: "WTF!!",
		no_tips: " ",
	};
	var toastTimer,
		$alert = $('.a-alert'),
		$alertTitle = $alert.find('.a-alert-title'),
		$alertMessage = $alert.find('.a-alert-message');
	AS.toast = function(msg, type, time){
		if(!msg || msg.trim()==='') return;
		type = type || "info";
		time = time || 5;
		var title = type_desc[type] || "你有新短消息～";
		window.clearTimeout(toastTimer);
		$alertTitle.html(title);
		$alertMessage.html(msg);
		$alert.css({'opacity':1,'top':'100px'});
		$alert.addClass('tips_div');
		toastTimer = window.setTimeout(function(){
			$alert.css('opacity', 0);
			$alert.removeClass('tips_div');
		}, time*1000);
	};

	//桌面通知
	AS.notifer = {};
	AS.notify = function(title){
		if(!title || title.trim() == '') return;
		if(AS.notifer[title]){
			AS.notifer[title].close();
			AS.notifer[title] = void 0;
		}
		AS.notifer[title] = new Notification('来自TODO', {
			dir: 'ltr',
			body: '帅锅喊你改bug啦～',
			icon: '/images/logo.jpg'
		});

	};
	
}

// 将‘2015/11/22 下午9:57:30’ 转换成 ‘2015/11/22 21:57:30’，以便转换成Date实例
function dateTransfer(dateStr){
	var rawHour = dateStr.substring(dateStr.indexOf(' ')+1, dateStr.indexOf(':'));
	if(rawHour.indexOf('下午') != -1){
		var hour = parseInt(rawHour.replace('下午','')) + 12;
		return new Date(dateStr.replace(rawHour, hour));
	}else if(rawHour.indexOf('上午') != -1){
		return new Date(dateStr.replace('上午', ''));
	}
	return new Date(dateStr);
}

//将得到的background-color由rgb格式(rgb(255, 255, 255))转换为hex格式(#ffffff)
function rgbToHex(bgColor){
	console.log('bgColor=======>>>', bgColor);
	bgColor = bgColor.substring(4, bgColor.length-1).split(',');
	var r = parseInt(bgColor[0]),
		g = parseInt(bgColor[1]),
		b = parseInt(bgColor[2]);
	var result = '#' + r.toString(16) + g.toString(16) + b.toString(16);
	return result;
}




// //与野狗云同步 https://itodo.wilddogio.com
// function Sync(url){
// 	this.dog = new Wilddog(url);
// 	this.user_id = uuid;
// 	this.storeVersion = window.localStorage.getItem('version') || 0;
// }
// Sync.prototype = {
// 	sync: function(){
// 		var that = this;
// 		that.dog.child(that.user_id+'/version').once(function(obj){
// 			var version = obj.val();
// 			if(that.storeVersion != version){
// 				if(that.storeVersion > version){
// 					var uploadData = {};
// 					uploadData[that.user_id] = {
// 						'version': that.storeVersion,
// 						'todoData': window.localStorage.getItem('todoData'),
// 						'finishedData': window.localStorage.getItem('finishedData')
// 					}
// 					that.dog.update(uploadData);

// 				}else{
// 					that.dog.child(that.user_id).once(function(obj){
// 						var downData = obj.val();
// 					});
// 				}
// 			}
// 		});
// 	}
// };

// function Store(container, tmpl){
// 	var storage = window.localStorage;
// 	if(storage.getItem('todoReady') !== 'true') {
// 		storage.clear();
// 		storage.setItem('todoReady', true);
// 	}
// 	this.notifyIcon = '/images/logo.jpg';
// 	this.$container = $(container);
// 	var tmplStr = $(tmpl).html();
// 	this.template = Handlebars.compile(tmplStr);
// 	this._data = JSON.parse(storage.getItem('todoData') || '{}');
// 	this.timeThreshold = JSON.parse(storage.getItem('observer') || '{}');

// 	this._saveData = function(){
// 		storage.setItem('todoData', JSON.stringify(this._data))
// 	};
// 	//绑定工具事件
// 	var that = this;
// 	this.editting = false;
// 	this.$container.delegate('.a-tap-header span', 'click', function(){
// 		var dataKey = $(this).parents('.a-tap').attr('data-key');
// 		if($(this).hasClass('a-tap-delete')){
// 			//删除
// 			that.remove(dataKey);
// 		}else if($(this).hasClass('a-tap-done')){
// 			//完成
// 			var content = $(this).parent().siblings('.a-tap-text').html();
// 			finishedStore.set(dataKey, content);
// 			that.remove(dataKey);
// 		}else if($(this).hasClass('a-tap-edit')){
// 			//编辑
// 			$('.a-tap-new').val(that.get(dataKey)).focus();
// 			that.editting = true;
// 			that.edittingKey = dataKey;
// 		}else if($(this).hasClass('a-tap-flash')){
// 			$(this).parent().parent().toggleClass('animation-flash');
// 		}
// 	});
// 	//初始化数据
// 	var tapArray = [],
// 		temKeyArray = [];
// 	for(var key in this._data){
// 		tapArray.push(this.template({text: this._data[key], time: key}));
// 		temKeyArray.push(key);
// 	}
// 	this.$container.append(tapArray.join(''));
// 	this.keyArray = temKeyArray;
// 	this.startTimer();
	
// 	this.checkStatus();
// }
// Store.prototype = {
// 	startTimer: function(){
// 		var that = this;
// 		var observerTimer = setting.get('timer');
// 		if(observerTimer){
// 			observerTimer = parseInt(observerTimer);
// 		}else{
// 			observerTimer = 120;
// 		}
// 		console.log(observerTimer);
// 		if(this.timer) this.stopTimer();
// 		this.timer = window.setInterval(function(){
// 			that.checkStatus.call(that);
// 		}, observerTimer * 1000);
// 	},
// 	get: function(key){
// 		return this._data[key];
// 	},
// 	set: function(key, value, action){
// 		this._data[key] = value;
// 		!action && this.$container.append(this.template({text: value, time: key}));
// 		this._saveData();
// 		this.keyArray.push(key);
// 		this.$container.find('[data-toggle="tooltip"]').tooltip();
// 	},
// 	remove: function(key){
// 		delete this._data[key];
// 		this.keyArray.shift(key);
// 		this._saveData();
// 		this.$container.find('a[data-key="'+key+'"]').remove();
// 	},
// 	setTimeThreshold: function(timeData){
// 		this.timeThreshold = timeData;
// 	},
// 	checkStatus: function(){
// 		var now = new Date();
// 		var needNotify = false;
// 		for(var i in this.keyArray){
// 			var key = this.keyArray[i];
// 			var dif = (now - dateTransfer(key))/1000/60;
// 			var tempColor = 'whitesmoke';
// 			for(var min in this.timeThreshold){
// 				var bgColor = this.$container.find('a[data-key="'+key+'"]').css('background-color');
// 				var hex = rgbToHex(bgColor);
// 				if(dif >= min && hex!=this.timeThreshold[min]){
// 					needNotify = true;
// 					tempColor = this.timeThreshold[min];
// 				}
// 			}
// 			this.$container.find('a[data-key="'+key+'"]').css('background', tempColor);
// 		}
// 		needNotify && AS.notify('task');
// 	},
// 	stopTimer: function(){
// 		var that = this;
// 		window.clearInterval(that.timer);
// 		this.timer = void 0;
// 	}
// };


// function FinishedStore(container, tmpl){
// 	var storage = window.localStorage;
// 	if(storage.getItem('todoReady') !== 'true') return;

// 	this.$container = $(container);
// 	var tmplStr = $(tmpl).html();
// 	this.template = Handlebars.compile(tmplStr);
// 	this._data = JSON.parse(storage.getItem('finishedData') || '{}');

// 	this._saveData = function(){
// 		storage.setItem('finishedData', JSON.stringify(this._data))
// 	};
// 	//初始化数据
// 	var tapArray = [];
// 	for(var key in this._data){
// 		tapArray.push(this.template({text: this._data[key], time: key}));
// 	}
// 	this.$container.append(tapArray.join(''));
// }
// FinishedStore.prototype = {
// 	get: function(key){
// 		return this._data[key];
// 	},
// 	set: function(key, value){
// 		this._data[key] = value;
// 		this.$container.append(this.template({text: value, time: key}));
// 		this._saveData();
// 	},
// };

// //设置数据
// var Settings = function(name){
// 	var setting = window.localStorage.getItem(name);
// 	setting = setting ? JSON.parse(setting): {};
// 	return {
// 		get: function(key){
// 			return setting[key];
// 		},
// 		set: function(key, value){
// 			if(!key || key.trim() == '') {
// 				AS.toast('必须输入时间啊亲！！！', 'warn');
// 				return false;
// 			}
// 			if(value){
// 				setting[key] = value;
// 			}else{
// 				delete setting[key];
// 			}
// 			console.log('set'+name+'=>>'+key+'=='+value);
// 			window.localStorage.setItem(name, JSON.stringify(setting));
// 			store.setTimeThreshold(setting);
// 		}
// 	};
// };

// var observerSetting = Settings('observer');
// var notifySetting = Settings('notify');
// var setting = Settings('setting');

// $(function(){
// 	//功能检查
// 	initCheck();
// 	//桌面通知
// 	AS.notifer = {};
// 	AS.notify = function(title){
// 		if(!title || title.trim() == '') return;
// 		if(AS.notifer[title]){
// 			AS.notifer[title].close();
// 			AS.notifer[title] = void 0;
// 		}
// 		AS.notifer[title] = new Notification('来自TODO', {
// 			dir: 'ltr',
// 			body: '帅锅喊你改bug啦～',
// 			icon: '/images/logo.jpg'
// 		});

// 	};
// 	store = new Store('.a-list', '#tap-template');
// 	finishedStore = new FinishedStore('.a-finished-list', '#finished-tap-template');
// 	//初始化工具
// 	initTools();
// 	//监听事件
// 	bindListeners();
// });

// function initCheck(){
// 	if(!window.localStorage){
// 		alert('此浏览器不支持本地存储！！');
// 		return;
// 	}
// 	if(!window.Notification){
// 		alert('此浏览器不支持桌面提醒！！');
// 		return;
// 	}
// 	var content = '未开启桌面通知功能';
// 	if(window.Notification !== 'denied'){
// 		window.Notification.requestPermission(function(permission){
//   			if(permission === "granted") {
//         		$('.a-notify').addClass('action');
// 				if(Notification.permission === 'granted'){
// 					content = '已经开启桌面通知功能';
// 				}
// 				$('[data-toggle="notify-popover"]').popover({
// 					html: true,
// 					placement: 'top',
// 					container: 'body',
// 					content: content
// 				});
//       		}
//     	});
// 	}
// 	uuid = window.localStorage.getItem('uuid');
// 	if(!uuid){
// 		uuid = new Date().getTime().toString();
// 		window.localStorage.setItem('uuid', uuid);
// 	}
// }

// function bindListeners(){
// 	var tmpl = $('#tap-template').html();
// 	$('.a-tap-new').on('keyup', function(e){
// 		var content = $(this).val().trim();
// 		if(content == '' || e.keyCode != 13) return;
// 		var datetime = new Date().toLocaleString();

// 		if(store.editting){
// 			datetime = store.edittingKey;
// 			$('.a-list').find('a[data-key="'+datetime+'"]').find('.a-tap-text').html(content);
// 		}
// 		store.set(datetime, content, store.editting);
// 		$(this).val('').blur();
// 		store.editting = false;
// 		store.edittingKey = '';
// 	});
// }

// function initTools(){
// 	$('[data-toggle="tooltip"]').tooltip();
// 	$('.a-doneList').on('click', function(){
// 		$('.a-slider-container').toggle('fast');
// 	});
// 	//设置
// 	$('[data-toggle="setting-popover"]').popover({
// 		html: true,
// 		placement: 'top',
// 		container: 'body',
// 		content: '<input placeholder="消息提醒频率(分钟)" class="a-setting-timer">\
// 					<button type="button" class="a-setting-set"> 设置 </button>'
// 	}).on('shown.bs.popover', function(){
// 		$('.a-setting-set').on('click', function(){
// 			var timer = $('.a-setting-timer').val();
// 			if(!timer || timer.trim() == ''){
// 				AS.toast('设置频率不能为空', 'warn');
// 				return;
// 			}
// 			timer = parseInt(timer)*60;
// 			setting.set('timer', timer);
// 			store.startTimer();
// 		});
// 	});
// 	//时间
// 	$('[data-toggle="observer-popover"]').popover({
// 		html: true,
// 		placement: 'top',
// 		container: 'body',
// 		content: '<label><input placeholder="分钟" class="a-observer-time"></label>\
// 				   <input type="hidden" class="a-observer-color">\
// 				   <div class="a-observer-color-picker"><span style="background:#66FF00" data-hex="#66FF00"></span>\
// 				   <span style="background:#99FF00" data-hex="#99FF00"></span>&nbsp;<span style="background:#CCFF00" data-hex="#CCFF00"></span>\
// 				   <span style="background:#FFFF00" data-hex="#FFFF00"></span>&nbsp;<span style="background:#FFCC00" data-hex="#FFCC00"></span>\
// 				   <span style="background:#99CC00" data-hex="#99CC00"></span>&nbsp;<span style="background:#66CC00" data-hex="#66CC00"></span>\
// 				   <span style="background:#FF6600" data-hex="#FF6600"></span>&nbsp;<span style="background:#FF3300" data-hex="#FF3300"></span>\
// 				   <span style="background:#FF00FF" data-hex="#FF00FF"></span>&nbsp;<span style="background:#CC00FF" data-hex="#CC00FF"></span>\
// 				   <span style="background:#9900FF" data-hex="#9900FF"></span>&nbsp;<span style="background:#FF0066" data-hex="#FF0066"></span>\
// 				   <span style="background:#00CCFF" data-hex="#00CCFF"></span>&nbsp;<span style="background:#0099FF" data-hex="#0099FF"></span>\
// 				   <span style="background:#00CC99" data-hex="#00CC99"></span>&nbsp;<span style="background:#669999" data-hex="#669999"></span>\
// 				   <span style="background:#990033" data-hex="#990033"></span>&nbsp;<span style="background:#999999" data-hex="#999999"></span>\
// 				   <span style="background:#CCCCFF" data-hex="#CCCCFF"></span>&nbsp;<span style="background:#9933FF" data-hex="#9933FF"></span></div>\
// 				   <button type="button" class="a-observer-set"> 设置 </button>'
// 	}).on('shown.bs.popover', function(){
// 		//绑定时间设置事件
// 		$('.a-observer-set').on('click', function(){
// 			var time = $('.a-observer-time').val().trim();
// 			var color = $('.a-observer-color').val().trim();
// 			observerSetting.set(time, color);
// 		});
// 		//绑定颜色选择事件
// 		$('.a-observer-color-picker').delegate('span', 'click', function(){
// 			var color = $(this).attr('data-hex');
// 			$(this).css('border', '3px dashed black').siblings().css('border', 'none');
// 			$('.a-observer-color').val(color);
// 		});
// 	});

// 	//消息条
// 	var type_desc = {
// 		success: "干得漂亮～",
// 		info: "你有新短消息～",
// 		warn: "前方高能！",
// 		error: "WTF!!",
// 		no_tips: " ",
// 	};
// 	var toastTimer,
// 		$alert = $('.a-alert'),
// 		$alertTitle = $alert.find('.a-alert-title'),
// 		$alertMessage = $alert.find('.a-alert-message');
// 	AS.toast = function(msg, type, time){
// 		if(!msg || msg.trim()==='') return;
// 		type = type || "info";
// 		time = time || 5;
// 		var title = type_desc[type] || "你有新短消息～";
// 		window.clearTimeout(toastTimer);
// 		$alertTitle.html(title);
// 		$alertMessage.html(msg);
// 		$alert.css({'opacity':1,'top':'100px'});
// 		$alert.addClass('tips_div');
// 		toastTimer = window.setTimeout(function(){
// 			$alert.css('opacity', 0);
// 			$alert.removeClass('tips_div');
// 		}, time*1000);
// 	};

	
// }

// //将‘2015/11/22 下午9:57:30’ 转换成 ‘2015/11/22 21:57:30’，以便转换成Date实例
// function dateTransfer(dateStr){
// 	var rawHour = dateStr.substring(dateStr.indexOf(' ')+1, dateStr.indexOf(':'));
// 	if(rawHour.indexOf('下午') != -1){
// 		var hour = parseInt(rawHour.replace('下午','')) + 12;
// 		return new Date(dateStr.replace(rawHour, hour));
// 	}else if(rawHour.indexOf('上午') != -1){
// 		return new Date(dateStr.replace('上午', ''));
// 	}
// 	return new Date(dateStr);
// }

// //将得到的background-color由rgb格式(rgb(255, 255, 255))转换为hex格式(#ffffff)
// function rgbToHex(bgColor){
// 	console.log('bgColor=======>>>', bgColor);
// 	bgColor = bgColor.substring(4, bgColor.length-1).split(',');
// 	var r = parseInt(bgColor[0]),
// 		g = parseInt(bgColor[1]),
// 		b = parseInt(bgColor[2]);
// 	var result = '#' + r.toString(16) + g.toString(16) + b.toString(16);
// 	return result;
// }