function Store(container, tmpl){
	var storage = window.localStorage;
	if(storage.getItem('todoReady') !== 'true') {
		storage.clear();
		storage.setItem('todoReady', true);
	}
	this.$container = $(container);
	var tmplStr = $(tmpl).html();
	this.template = Handlebars.compile(tmplStr);
	this._data = JSON.parse(storage.getItem('todoData') || '{}');

	this._saveData = function(){
		storage.setItem('todoData', JSON.stringify(this._data))
	};
	//绑定工具事件
	var that = this;
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
	//开启时间监控
	this.timeThreshold = {
		//时间阀值,单位分钟
		"30": "#337ab7",
		"120": "#f0ad4e",
		"360": "#d9534f"
	};
	this.timer = window.setInterval(this.checkStatus, 1200*1000);
	this.checkStatus();
}
Store.prototype = {
	get: function(key){
		return this._data[key];
	},
	set: function(key, value){
		this._data[key] = value;
		this.$container.append(this.template({text: value, time: key}));
		this._saveData();
		this.keyArray.push(key);
	},
	remove: function(key){
		delete this._data[key];
		this.keyArray.shift(key);
		this._saveData();
		this.$container.find('a[data-key="'+key+'"]').remove();
	},
	checkStatus: function(){
		var now = new Date();
		for(var i in this.keyArray){
			var key = this.keyArray[i];
			var dif = (now - dateTransfer(key))/1000/60;
			var tempColor = 'white';
			for(var min in this.timeThreshold){
				if(dif >= min) tempColor = this.timeThreshold[min];
			}
			this.$container.find('a[data-key="'+key+'"]').css('background', tempColor);
		}
		console.log('任务定时监测...(间隔20min)');
	},
	stopStatusChecking: function(){
		var that = this;
		window.clearInterval(that.timer);
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

$(function(){
	//功能检查
	initCheck();
	store = new Store('.a-list', '#tap-template');
	finishedStore = new FinishedStore('.a-finished-list', '#finished-tap-template');
	var tmpl = $('#tap-template').html();
	$('.a-tap-new').on('keyup', function(e){
		var content = $(this).val().trim();
		if(content == '' || e.keyCode != 13) return;
		var datetime = new Date().toLocaleString();
		store.set(datetime, content);
		$(this).val('');
	});
	//初始化工具
	$('[data-toggle="tooltip"]').tooltip();
	$('.a-finished-tap-header').on('click', function(){
		$('.a-finished-list').toggle();
	});
});

function initCheck(){
	if(!window.localStorage){
		alert('此浏览器不支持本地存储！！');	
	}
}

//将‘2015/11/22 下午9:57:30’ 转换成 ‘2015/11/22 21:57:30’，以便转换成Date实例
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